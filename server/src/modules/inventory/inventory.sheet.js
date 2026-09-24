/**
 * Inventory round-trip: export every SKU to a sheet, edit it, upload it back.
 *
 * The whole thing hangs on one rule — every row carries its SKU ID, and the
 * importer matches on that id and nothing else. The catalog bulk uploader
 * matches on slug, which is derived from the name, so renaming a product there
 * creates a second record instead of editing the first. Matching on an id that
 * never changes is what makes this safe to run repeatedly.
 *
 * The importer only ever updates. It cannot create or delete a SKU, so no
 * matter what is in the file it cannot produce a duplicate.
 */

import ExcelJS from 'exceljs';
import { ProductVariant, Product } from '../../models/Catalog.js';
import { InventoryMovement } from '../../models/Operations.js';
import { ApiError } from '../../utils/ApiError.js';
import { parseUpload } from '../bulkUpload/bulkUpload.parser.js';
import { normalizeHeader } from '../bulkUpload/bulkUpload.schema.js';

const BOM = '﻿';
export const MAX_SHEET_ROWS = 5000;
const MAX_ERRORS = 500;

/**
 * The sheet's columns.
 *
 * `editable: false` columns are written on export for context and ignored on
 * import — changing a product's name or category belongs to the catalog
 * uploader, not to a stock sheet, and silently accepting them here would make
 * two tools responsible for the same field.
 */
export const SHEET_COLUMNS = [
  { key: 'sku_id', header: 'SKU ID', editable: false, key_column: true,
    hint: 'Never edit or clear this — it is how a row finds its SKU.' },
  { key: 'product_id', header: 'Product ID', editable: false, key_column: true,
    hint: 'Never edit or clear this — it is how product-level edits find their product.' },
  { key: 'product_name', header: 'Product', editable: true, scope: 'product',
    hint: 'Renaming here is safe — rows are matched by id, not by name.' },
  { key: 'description', header: 'Description', editable: true, scope: 'product',
    hint: 'Shown on the product page.' },
  { key: 'image', header: 'Image URL', editable: true, scope: 'product',
    hint: 'Full https:// link or an /uploads/... path. Blank leaves it unchanged.' },
  { key: 'tags', header: 'Tags', editable: true, scope: 'product', type: 'list',
    hint: 'Comma separated, e.g. bestseller, organic.' },
  { key: 'product_active', header: 'Product Active', editable: true, scope: 'product', type: 'bool',
    hint: 'TRUE or FALSE — whether the whole product is sold.' },
  { key: 'pack', header: 'Pack Size', editable: true, type: 'text',
    hint: 'The pack label, e.g. "500 g" or "₹10 pack".' },
  { key: 'category', header: 'Category', editable: false, hint: 'For reference only — change it in Categories.' },
  { key: 'subcategory', header: 'Subcategory', editable: false, hint: 'For reference only — change it in Categories.' },
  { key: 'brand', header: 'Sub Sub Category / Brand', editable: false, hint: 'For reference only — change it in Categories.' },
  { key: 'price', header: 'Selling Price', editable: true, type: 'number',
    hint: 'What the customer pays.' },
  { key: 'original_price', header: 'MRP', editable: true, type: 'number',
    hint: 'Printed price. Must be above the selling price to show a discount.' },
  { key: 'discount', header: 'Discount %', editable: false,
    hint: 'Calculated from MRP and Selling Price — edits here are ignored.' },
  { key: 'stock', header: 'Stock Qty', editable: true, type: 'int',
    hint: 'Counted units. Blank leaves the current stock untouched.' },
  { key: 'low_stock_threshold', header: 'Low Stock Alert At', editable: true, type: 'int',
    hint: 'Alert when stock falls to this level.' },
  { key: 'is_available', header: 'Pack Active', editable: true, type: 'bool',
    hint: 'TRUE or FALSE — whether this pack is sold on the storefront.' },
];

const BY_HEADER = (() => {
  const map = new Map();
  for (const col of SHEET_COLUMNS) {
    for (const spelling of [col.key, col.header]) {
      const norm = normalizeHeader(spelling);
      if (norm) map.set(norm, col.key);
    }
  }
  // A few spellings people reach for after editing in Excel.
  map.set(normalizeHeader('id'), 'sku_id');
  map.set(normalizeHeader('variant id'), 'sku_id');
  map.set(normalizeHeader('qty'), 'stock');
  map.set(normalizeHeader('stock qty'), 'stock');
  map.set(normalizeHeader('mrp price'), 'original_price');
  map.set(normalizeHeader('product name'), 'product_name');
  map.set(normalizeHeader('name'), 'product_name');
  map.set(normalizeHeader('pack'), 'pack');
  map.set(normalizeHeader('image'), 'image');
  return map;
})();

/* --------------------------------- Export -------------------------------- */

/** Every SKU matching the caller's filters, flattened into sheet rows. */
export async function collectRows(filter = {}) {
  const variants = await ProductVariant.find(filter).sort({ product_id: 1, price: 1 }).lean();
  const productIds = [...new Set(variants.map((v) => String(v.product_id)))];

  const products = await Product.find({ _id: { $in: productIds } })
    .populate('category_id', 'name')
    .populate('subcategory_id', 'name')
    .populate('brand_id', 'name')
    .select('name description image tags is_available category_id subcategory_id brand_id')
    .lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));

  return variants.map((v) => {
    const p = byId.get(String(v.product_id));
    const price = v.price ?? 0;
    const mrp = v.original_price ?? price;
    return {
      sku_id: String(v._id),
      product_id: String(v.product_id),
      product_name: p?.name ?? '',
      description: p?.description ?? '',
      image: p?.image ?? '',
      tags: (p?.tags ?? []).join(', '),
      product_active: p?.is_available ? 'TRUE' : 'FALSE',
      pack: v.quantity ?? '',
      category: p?.category_id?.name ?? '',
      subcategory: p?.subcategory_id?.name ?? '',
      brand: p?.brand_id?.name ?? '',
      price,
      original_price: mrp,
      // Recomputed rather than echoed, so the sheet never shows a percentage
      // the two price columns do not support.
      discount: mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0,
      stock: v.stock ?? 0,
      low_stock_threshold: v.low_stock_threshold ?? 0,
      is_available: v.is_available ? 'TRUE' : 'FALSE',
    };
  });
}

const csvEscape = (value) => {
  const str = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

export function buildCsv(rows) {
  const lines = [SHEET_COLUMNS.map((c) => csvEscape(c.header)).join(',')];
  for (const row of rows) {
    lines.push(SHEET_COLUMNS.map((c) => csvEscape(row[c.key])).join(','));
  }
  return Buffer.from(BOM + lines.join('\r\n') + '\r\n', 'utf8');
}

export async function buildXlsx(rows) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FreshMart Admin';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Inventory', { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = SHEET_COLUMNS.map((c) => ({
    key: c.key,
    width: Math.min(40, Math.max(12, c.header.length + 6)),
  }));

  const header = sheet.addRow(SHEET_COLUMNS.map((c) => c.header));
  header.height = 26;
  header.eachCell((cell, index) => {
    const col = SHEET_COLUMNS[index - 1];
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      // The key column and the read-only ones are visibly not for editing.
      fgColor: { argb: col.key_column ? 'FF7F1D1D' : col.editable ? 'FF16A34A' : 'FF64748B' },
    };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.note = `${col.editable ? 'EDITABLE' : 'READ-ONLY'}\n${col.hint}`;
  });

  for (const row of rows) {
    sheet.addRow(SHEET_COLUMNS.map((c) => row[c.key]));
  }

  // Lock the id column visually; Excel still allows edits, but the colour plus
  // the note make it obvious the column is the key.
  sheet.getColumn('sku_id').font = { color: { argb: 'FF7F1D1D' } };
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: SHEET_COLUMNS.length } };

  /* ---- Instructions sheet ---- */
  const guide = workbook.addWorksheet('How to use');
  guide.columns = [{ width: 30 }, { width: 14 }, { width: 80 }];
  guide.addRow(['Column', 'Editable', 'What it means']).font = { bold: true };
  for (const col of SHEET_COLUMNS) {
    guide.addRow([col.header, col.editable ? 'Yes' : 'No', col.hint]);
  }
  guide.addRow([]);
  guide.addRow(['Rules', '', '']).font = { bold: true };
  for (const line of [
    'Edit this file and upload it back — rows are matched by SKU ID, so renaming a product is safe.',
    'Never change or delete the SKU ID column. A row without it cannot be matched and is reported as an error.',
    'Deleting a row from the sheet does nothing. Nothing is ever created or deleted by this upload.',
    'A blank editable cell leaves that value untouched.',
    'The same SKU ID twice in one file is rejected, so a copy-paste slip cannot apply twice.',
  ]) {
    guide.addRow(['', '', line]);
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

/* --------------------------------- Import -------------------------------- */

const TRUE_WORDS = new Set(['true', 't', '1', 'yes', 'y', 'active', 'available', 'on']);
const FALSE_WORDS = new Set(['false', 'f', '0', 'no', 'n', 'inactive', 'hidden', 'off']);

/** Coerce one cell, or explain why it cannot be read. */
function coerce(col, raw) {
  const text = String(raw ?? '').replace(/ /g, ' ').trim();
  if (!text) return { value: undefined };

  if (col.type === 'bool') {
    const key = text.toLowerCase();
    if (TRUE_WORDS.has(key)) return { value: true };
    if (FALSE_WORDS.has(key)) return { value: false };
    return { error: `"${text}" is not TRUE or FALSE` };
  }

  if (col.type === 'int' || col.type === 'number') {
    const cleaned = text.replace(/[₹$€£,\s]/g, '');
    const num = Number(cleaned);
    if (!Number.isFinite(num)) return { error: `"${text}" is not a number` };
    if (num < 0) return { error: `"${text}" cannot be negative` };
    return { value: col.type === 'int' ? Math.round(num) : Math.round(num * 100) / 100 };
  }

  if (col.type === 'list') {
    return { value: text.split(/[,|;]/).map((part) => part.trim()).filter(Boolean) };
  }

  return { value: text };
}

const PRODUCT_COLUMNS = SHEET_COLUMNS.filter((c) => c.editable && c.scope === 'product');

/** Field name on the Product document for each product-scope sheet column. */
const PRODUCT_FIELD = {
  product_name: 'name',
  description: 'description',
  image: 'image',
  tags: 'tags',
  product_active: 'is_available',
};

const sameValue = (a, b) =>
  Array.isArray(a) && Array.isArray(b) ? a.length === b.length && a.every((x, i) => x === b[i]) : a === b;

/**
 * Apply an edited sheet.
 *
 * Every row is independent: a bad row is reported against its spreadsheet line
 * number and the run carries on, so one typo cannot block a 2,000-row count.
 */
export async function applySheet(buffer, filename, { dryRun = false, adminId = null } = {}) {
  const parsed = await parseUpload(buffer, filename);

  const columnAt = [];
  const seen = new Set();
  const unknownHeaders = [];
  parsed.headers.forEach((header, index) => {
    const norm = normalizeHeader(header);
    if (!norm) return;
    const key = BY_HEADER.get(norm);
    if (!key) {
      unknownHeaders.push(header);
      return;
    }
    if (seen.has(key)) return;
    seen.add(key);
    columnAt[index] = key;
  });

  if (!seen.has('sku_id')) {
    throw ApiError.badRequest(
      'This file has no "SKU ID" column, so rows cannot be matched. Export the inventory sheet again and edit that file.'
    );
  }
  if (parsed.records.length > MAX_SHEET_ROWS) {
    throw ApiError.badRequest(
      `This file has ${parsed.records.length} rows. Split it into files of ${MAX_SHEET_ROWS} rows or fewer.`
    );
  }

  const errors = [];
  const pushError = (row, column, message) => {
    if (errors.length < MAX_ERRORS) errors.push({ row, column, message });
  };

  const counts = { stock: 0, price: 0, threshold: 0, availability: 0, products: 0 };
  const idsSeen = new Map();
  // Product-level edits arrive once per SKU row, so they are gathered here and
  // written once. Rows of the same product that disagree are an error rather
  // than a race between them.
  const productEdits = new Map();
  let updated = 0;
  let unchanged = 0;
  let failed = 0;

  for (const record of parsed.records) {
    const rowNo = record.rowNumber;
    const values = {};
    let cellError = false;

    columnAt.forEach((key, index) => {
      if (!key) return;
      const col = SHEET_COLUMNS.find((c) => c.key === key);
      if (!col) return;
      // Key columns are read but never written; the rest of the read-only
      // columns are context and are ignored entirely.
      if (!col.editable && !col.key_column) return;
      const { value, error } = coerce(col, record.cells[index]);
      if (error) {
        pushError(rowNo, col.header, error);
        cellError = true;
        return;
      }
      if (value !== undefined) values[key] = value;
    });

    if (cellError) {
      failed += 1;
      continue;
    }

    const skuId = String(values.sku_id ?? '').trim();
    if (!skuId) {
      failed += 1;
      pushError(rowNo, 'SKU ID', 'Missing SKU ID — this row cannot be matched to a SKU');
      continue;
    }
    if (idsSeen.has(skuId)) {
      failed += 1;
      pushError(rowNo, 'SKU ID', `Same SKU ID as row ${idsSeen.get(skuId)} — remove the duplicate row`);
      continue;
    }
    idsSeen.set(skuId, rowNo);

    let variant = null;
    try {
      variant = await ProductVariant.findById(skuId);
    } catch {
      variant = null;
    }
    if (!variant) {
      failed += 1;
      pushError(rowNo, 'SKU ID', `No SKU with id "${skuId}" — it may have been deleted`);
      continue;
    }

    // Product-level columns: stash them against the product this SKU belongs to.
    const productId = String(variant.product_id);
    let conflicted = false;
    for (const col of PRODUCT_COLUMNS) {
      const value = values[col.key];
      if (value === undefined) continue;
      const bucket = productEdits.get(productId) ?? { rows: new Map(), values: {} };
      if (col.key in bucket.values && !sameValue(bucket.values[col.key], value)) {
        pushError(
          rowNo,
          col.header,
          `Different "${col.header}" than row ${bucket.rows.get(col.key)} for the same product — make them match`
        );
        conflicted = true;
        continue;
      }
      bucket.values[col.key] = value;
      bucket.rows.set(col.key, rowNo);
      productEdits.set(productId, bucket);
    }
    if (conflicted) {
      failed += 1;
      continue;
    }

    // Work out what actually changes before writing anything.
    const nextPrice = values.price ?? variant.price;
    const nextMrp = values.original_price ?? variant.original_price ?? nextPrice;
    if (nextMrp < nextPrice) {
      failed += 1;
      pushError(rowNo, 'MRP', 'MRP cannot be lower than the Selling Price');
      continue;
    }

    const changes = {};
    if (values.pack !== undefined && values.pack !== variant.quantity) changes.quantity = values.pack;
    if (values.price !== undefined && values.price !== variant.price) changes.price = values.price;
    if (values.original_price !== undefined && values.original_price !== variant.original_price) {
      changes.original_price = values.original_price;
    }
    if (changes.price !== undefined || changes.original_price !== undefined) {
      // Discount stays derived, exactly as the product form computes it.
      changes.discount = nextMrp > nextPrice ? Math.round(((nextMrp - nextPrice) / nextMrp) * 100) : 0;
    }
    if (
      values.low_stock_threshold !== undefined &&
      values.low_stock_threshold !== variant.low_stock_threshold
    ) {
      changes.low_stock_threshold = values.low_stock_threshold;
    }
    if (values.is_available !== undefined && values.is_available !== variant.is_available) {
      changes.is_available = values.is_available;
    }

    const stockDelta =
      values.stock !== undefined && values.stock !== variant.stock ? values.stock - variant.stock : 0;

    if (Object.keys(changes).length === 0 && stockDelta === 0) {
      unchanged += 1;
      continue;
    }

    if (changes.price !== undefined || changes.original_price !== undefined) counts.price += 1;
    if (changes.low_stock_threshold !== undefined) counts.threshold += 1;
    if (changes.is_available !== undefined) counts.availability += 1;
    if (stockDelta !== 0) counts.stock += 1;

    if (!dryRun) {
      Object.assign(variant, changes);
      if (stockDelta !== 0) variant.stock = values.stock;
      await variant.save();

      // A sheet-driven stock change is a stocktake; recording it keeps the
      // SKU's movement history a complete account of how it got to this number.
      if (stockDelta !== 0) {
        await InventoryMovement.create({
          variant_id: variant._id,
          change: stockDelta,
          resulting_stock: variant.stock,
          reason: 'stocktake',
          note: `Sheet import: ${filename}`,
          created_by: adminId,
        });
      }
    }

    updated += 1;
  }

  /* ---- Product-level edits, applied once per product ---- */
  for (const [productId, bucket] of productEdits) {
    const product = await Product.findById(productId);
    if (!product) continue; // its SKU row already reported the problem

    const patch = {};
    for (const [key, value] of Object.entries(bucket.values)) {
      const field = PRODUCT_FIELD[key];
      if (!field) continue;
      if (!sameValue(product[field], value)) patch[field] = value;
    }
    if (Object.keys(patch).length === 0) continue;

    counts.products += 1;
    if (!dryRun) {
      Object.assign(product, patch);
      await product.save();
    }
  }

  return {
    dryRun,
    file: filename,
    rows: { total: parsed.records.length, updated, unchanged, failed },
    counts,
    errors,
    errorsTruncated: errors.length >= MAX_ERRORS,
    unknownHeaders,
  };
}
