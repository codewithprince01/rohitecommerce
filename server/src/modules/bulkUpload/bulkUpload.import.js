/**
 * Row mapping, validation and the idempotent catalog importer.
 *
 * The importer is find-or-create at every level (category → subcategory →
 * brand → product → variant), matched on slug, so re-uploading the same file
 * updates instead of duplicating. A bad row never aborts the run: it is
 * collected into `errors` with its spreadsheet row number and the import
 * continues, which is what makes a 2,000-row supplier sheet usable.
 */

import mongoose from 'mongoose';
import slugify from 'slugify';
import { Category, Subcategory, Brand, Product, ProductVariant } from '../../models/Catalog.js';
import { ApiError } from '../../utils/ApiError.js';
import { templateColumns, headerLookup, normalizeHeader, TEMPLATES } from './bulkUpload.schema.js';

export const MAX_ROWS = 5000;
const MAX_ERRORS = 500;
const DEFAULT_LOW_STOCK = 10;

const toSlug = (value) => slugify(String(value), { lower: true, strict: true });

/* ----------------------------- Value coercion ----------------------------- */

const TRUE_WORDS = new Set([
  'true', 't', '1', 'yes', 'y', 'ha', 'haan', 'active', 'available', 'enabled', 'on', 'visible', 'in stock',
]);
const FALSE_WORDS = new Set([
  'false', 'f', '0', 'no', 'n', 'nahi', 'inactive', 'hidden', 'unavailable', 'disabled', 'off', 'out of stock',
]);

const URL_LIKE = /^(https?:\/\/|\/\/|\/|data:image\/)/i;

/** Coerce one cell to the column's type. Returns `{ value }`, `{ error }` or a soft `{ warning }`. */
function coerceValue(column, raw) {
  const text = String(raw ?? '')
    .replace(/ /g, ' ')
    .trim();
  if (!text) return { value: undefined };

  switch (column.type) {
    case 'bool': {
      const key = text.toLowerCase();
      if (TRUE_WORDS.has(key)) return { value: true };
      if (FALSE_WORDS.has(key)) return { value: false };
      return { error: `"${text}" is not a yes/no value — use TRUE or FALSE` };
    }

    case 'int':
    case 'number': {
      // Tolerate "₹1,299.00", "1 299", "20%" — supplier sheets are full of these.
      const cleaned = text.replace(/[₹$€£]/g, '').replace(/,/g, '').replace(/%/g, '').replace(/\s+/g, '');
      const num = Number(cleaned);
      if (!Number.isFinite(num)) return { error: `"${text}" is not a number` };
      if (num < 0) return { error: `"${text}" cannot be negative` };
      return { value: column.type === 'int' ? Math.round(num) : Math.round(num * 100) / 100 };
    }

    case 'list':
      return {
        value: text
          .split(/[,|;]/)
          .map((part) => part.trim())
          .filter(Boolean),
      };

    case 'url':
      return URL_LIKE.test(text)
        ? { value: text }
        : { value: text, warning: `"${column.header}" does not look like a link — expected https://… or /uploads/…` };

    default:
      return { value: text };
  }
}

/* ------------------------------ Row mapping ------------------------------ */

/**
 * Map a parsed file onto column keys and validate every cell.
 * File-level problems (missing required columns) throw; row-level problems are
 * collected so the admin sees all of them at once.
 */
export function mapRows(type, parsed) {
  const template = TEMPLATES[type];
  if (!template) throw ApiError.badRequest(`Unknown upload type "${type}"`);

  const columns = templateColumns(type);
  const byKey = new Map(columns.map((c) => [c.key, c]));
  const lookup = headerLookup(type);

  // Header index → column key.
  const columnAt = [];
  const unknownHeaders = [];
  const seen = new Set();

  parsed.headers.forEach((header, index) => {
    const norm = normalizeHeader(header);
    if (!norm) return;
    const key = lookup.get(norm);
    if (!key) {
      unknownHeaders.push(header);
      return;
    }
    if (seen.has(key)) return; // first occurrence wins on duplicated headers
    seen.add(key);
    columnAt[index] = key;
  });

  const missingRequired = columns.filter((c) => c.required && !seen.has(c.key));
  if (missingRequired.length) {
    throw ApiError.badRequest(
      `Your file is missing required column${missingRequired.length > 1 ? 's' : ''}: ` +
        `${missingRequired.map((c) => `"${c.header}"`).join(', ')}. ` +
        'Download the template again and copy your data into it.',
      missingRequired.map((c) => ({ field: c.key, message: `Column "${c.header}" is required` }))
    );
  }
  if (!seen.size) {
    throw ApiError.badRequest('No recognised columns were found in the file. Please use the provided template.');
  }

  if (parsed.records.length > MAX_ROWS) {
    throw ApiError.badRequest(
      `This file has ${parsed.records.length} rows. Please split it into files of ${MAX_ROWS} rows or fewer.`
    );
  }

  const rows = [];
  const errors = [];
  const warnings = [];

  for (const record of parsed.records) {
    const values = {};
    const rowErrors = [];
    // Warnings are held per row and only published once the row is known to be
    // importable — a rejected row already has an error explaining itself.
    const rowWarnings = [];
    // Columns that already failed to parse, so the rules below don't pile a
    // second, misleading message onto the same root cause.
    const unreadable = new Set();

    columnAt.forEach((key, index) => {
      if (!key) return;
      const column = byKey.get(key);
      const { value, error, warning } = coerceValue(column, record.cells[index]);
      if (error) {
        rowErrors.push({ row: record.rowNumber, column: column.header, message: error });
        unreadable.add(key);
        return;
      }
      if (warning) rowWarnings.push({ row: record.rowNumber, column: column.header, message: warning });
      if (value !== undefined) values[key] = value;
    });

    // Required cells.
    for (const column of columns) {
      if (!column.required) continue;
      const value = values[column.key];
      if (value === undefined || value === '' || (Array.isArray(value) && !value.length)) {
        rowErrors.push({ row: record.rowNumber, column: column.header, message: `"${column.header}" is required` });
      }
    }

    // Structural rules the column types cannot express.
    if (type === 'catalog' && values.brand_name && !values.subcategory_name) {
      rowErrors.push({
        row: record.rowNumber,
        column: byKey.get('brand_name').header,
        message: 'A sub-sub category needs a subcategory in the same row',
      });
    }
    if (type === 'products') {
      // Pack size and price only make sense as a pair — but stay quiet when one
      // of them already failed to parse, so one mistake yields one message.
      if (!unreadable.has('price') && !unreadable.has('variant_quantity')) {
        const hasPack = values.variant_quantity !== undefined;
        const hasPrice = values.price !== undefined;
        if (hasPack && !hasPrice) {
          rowErrors.push({ row: record.rowNumber, column: byKey.get('price').header, message: 'Pack Size given without a Selling Price' });
        } else if (hasPrice && !hasPack) {
          rowErrors.push({ row: record.rowNumber, column: byKey.get('variant_quantity').header, message: 'Selling Price given without a Pack Size' });
        } else if (!hasPack && !hasPrice) {
          rowWarnings.push({
            row: record.rowNumber,
            column: byKey.get('variant_quantity').header,
            message: 'No pack size or price — the product is created without a purchasable pack',
          });
        }
      }
      if (values.discount !== undefined && values.discount > 100) {
        rowErrors.push({ row: record.rowNumber, column: byKey.get('discount').header, message: 'Discount % cannot be above 100' });
      }
      if (
        values.original_price !== undefined &&
        values.price !== undefined &&
        values.original_price < values.price
      ) {
        rowErrors.push({
          row: record.rowNumber,
          column: byKey.get('original_price').header,
          message: 'MRP cannot be lower than the Selling Price',
        });
      }
    }

    if (rowErrors.length) {
      for (const error of rowErrors) if (errors.length < MAX_ERRORS) errors.push(error);
      continue;
    }
    for (const warning of rowWarnings) if (warnings.length < MAX_ERRORS) warnings.push(warning);
    rows.push({ rowNumber: record.rowNumber, values });
  }

  return {
    rows,
    errors,
    warnings,
    unknownHeaders,
    recognisedColumns: [...seen],
    totalRows: parsed.records.length,
  };
}

/* -------------------------------- Importer -------------------------------- */

/** Drop undefined entries so a blank cell never wipes an existing value. */
function defined(source) {
  const out = {};
  for (const [key, value] of Object.entries(source)) if (value !== undefined) out[key] = value;
  return out;
}

const emptyCounts = () => ({ created: 0, updated: 0 });

/**
 * Find-or-create one node. `insertDoc` is applied only when the record is new;
 * `updateDoc` only when it already existed and the admin chose to overwrite.
 */
async function upsertNode(Model, filter, insertDoc, updateDoc, ctx, counter) {
  if (ctx.dryRun) {
    const existing = await Model.findOne(filter).select('_id').lean();
    if (!existing) {
      counter.created += 1;
      return new mongoose.Types.ObjectId();
    }
    if (ctx.updateExisting && Object.keys(updateDoc).length) counter.updated += 1;
    return existing._id;
  }

  // `$setOnInsert` must not repeat the filter's own paths.
  const insert = { ...insertDoc };
  for (const key of Object.keys(filter)) delete insert[key];

  const result = await Model.findOneAndUpdate(
    filter,
    Object.keys(insert).length ? { $setOnInsert: insert } : {},
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true, includeResultMetadata: true }
  );
  const doc = result.value;
  const wasCreated = !result.lastErrorObject?.updatedExisting;

  if (wasCreated) {
    counter.created += 1;
  } else if (ctx.updateExisting && Object.keys(updateDoc).length) {
    await Model.updateOne({ _id: doc._id }, { $set: updateDoc });
    counter.updated += 1;
  }
  return doc._id;
}

/**
 * Import mapped rows. Every row is independent — a failure is recorded against
 * its spreadsheet row number and the run continues.
 */
export async function importRows(type, rows, { dryRun = false, updateExisting = true } = {}) {
  const ctx = { dryRun, updateExisting };
  const counts = {
    categories: emptyCounts(),
    subcategories: emptyCounts(),
    brands: emptyCounts(),
    products: emptyCounts(),
    variants: emptyCounts(),
  };
  const errors = [];
  let imported = 0;

  // Per-run caches: keep the hierarchy lookups to one query per distinct node
  // and stop repeated rows from being counted (or created) twice.
  const categoryCache = new Map();
  const subcategoryCache = new Map();
  const brandCache = new Map();
  const productCache = new Map();
  const variantCache = new Set();

  for (const { rowNumber, values } of rows) {
    try {
      /* -- Category -- */
      const categorySlug = values.category_slug ? toSlug(values.category_slug) : toSlug(values.category_name);
      if (!categorySlug) throw new Error('Category name must contain at least one letter or number');

      let categoryId = categoryCache.get(categorySlug);
      if (!categoryId) {
        categoryId = await upsertNode(
          Category,
          { slug: categorySlug },
          {
            name: values.category_name,
            image: values.category_image ?? null,
            bg_color: values.category_bg_color ?? 'bg-neutral-100',
            sort_order: values.category_sort_order ?? 0,
          },
          defined({
            name: values.category_name,
            image: values.category_image,
            bg_color: values.category_bg_color,
            sort_order: values.category_sort_order,
          }),
          ctx,
          counts.categories
        );
        categoryCache.set(categorySlug, categoryId);
      }

      /* -- Subcategory -- */
      let subcategoryId = null;
      if (values.subcategory_name) {
        const subSlug = values.subcategory_slug ? toSlug(values.subcategory_slug) : toSlug(values.subcategory_name);
        if (!subSlug) throw new Error('Subcategory name must contain at least one letter or number');
        const subKey = `${categoryId}:${subSlug}`;

        subcategoryId = subcategoryCache.get(subKey);
        if (!subcategoryId) {
          subcategoryId = await upsertNode(
            Subcategory,
            { category_id: categoryId, slug: subSlug },
            {
              name: values.subcategory_name,
              image: values.subcategory_image ?? null,
              sort_order: values.subcategory_sort_order ?? 0,
            },
            defined({
              name: values.subcategory_name,
              image: values.subcategory_image,
              sort_order: values.subcategory_sort_order,
            }),
            ctx,
            counts.subcategories
          );
          subcategoryCache.set(subKey, subcategoryId);
        }
      }

      /* -- Sub-sub category (brand) -- */
      let brandId = null;
      if (values.brand_name && subcategoryId) {
        const brandSlug = values.brand_slug ? toSlug(values.brand_slug) : toSlug(values.brand_name);
        if (!brandSlug) throw new Error('Sub-sub category name must contain at least one letter or number');
        const brandKey = `${subcategoryId}:${brandSlug}`;

        brandId = brandCache.get(brandKey);
        if (!brandId) {
          brandId = await upsertNode(
            Brand,
            { subcategory_id: subcategoryId, slug: brandSlug },
            {
              name: values.brand_name,
              logo: values.brand_logo ?? null,
              description: values.brand_description ?? null,
            },
            defined({
              name: values.brand_name,
              logo: values.brand_logo,
              description: values.brand_description,
            }),
            ctx,
            counts.brands
          );
          brandCache.set(brandKey, brandId);
        }
      }

      /* -- Product + pack size -- */
      if (type === 'products') {
        // Guarded explicitly: the product schema requires the whole chain, and
        // an unguarded upsert would otherwise write an unreachable orphan.
        if (!subcategoryId) throw new Error('Subcategory is required to create a product');
        if (!brandId) throw new Error('Sub-sub category (brand) is required to create a product');

        const productSlug = values.product_slug ? toSlug(values.product_slug) : toSlug(values.product_name);
        if (!productSlug) throw new Error('Product name must contain at least one letter or number');
        const productKey = `${brandId}:${productSlug}`;

        let productId = productCache.get(productKey);
        if (!productId) {
          productId = await upsertNode(
            Product,
            { brand_id: brandId, slug: productSlug },
            {
              name: values.product_name,
              category_id: categoryId,
              subcategory_id: subcategoryId,
              description: values.product_description ?? null,
              image: values.product_image ?? null,
              is_available: values.product_is_available ?? true,
              tags: values.product_tags ?? [],
            },
            defined({
              name: values.product_name,
              category_id: categoryId,
              subcategory_id: subcategoryId,
              description: values.product_description,
              image: values.product_image,
              is_available: values.product_is_available,
              tags: values.product_tags,
            }),
            ctx,
            counts.products
          );
          productCache.set(productKey, productId);
        }

        if (values.variant_quantity !== undefined && values.price !== undefined) {
          const quantity = String(values.variant_quantity);
          const variantKey = `${productId}:${quantity.toLowerCase()}`;
          if (!variantCache.has(variantKey)) {
            variantCache.add(variantKey);

            const price = values.price;
            const originalPrice = values.original_price ?? price;
            const discount =
              values.discount ??
              (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);

            await upsertNode(
              ProductVariant,
              { product_id: productId, quantity },
              {
                price,
                original_price: originalPrice,
                discount,
                stock: values.stock ?? 0,
                low_stock_threshold: values.low_stock_threshold ?? DEFAULT_LOW_STOCK,
                is_available: values.variant_is_available ?? true,
              },
              defined({
                price,
                original_price: originalPrice,
                discount,
                stock: values.stock,
                low_stock_threshold: values.low_stock_threshold,
                is_available: values.variant_is_available,
              }),
              ctx,
              counts.variants
            );
          }
        }
      }

      imported += 1;
    } catch (err) {
      if (errors.length < MAX_ERRORS) {
        errors.push({
          row: rowNumber,
          column: '',
          message: err?.code === 11000 ? 'A conflicting record already exists for this row' : err.message,
        });
      }
    }
  }

  return { counts, errors, imported };
}
