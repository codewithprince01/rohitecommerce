/**
 * Column contract shared by the template generator, the file parser and the
 * importer. One definition per column so a header renamed here automatically
 * flows into the downloadable CSV/XLSX templates, the alias matcher and the
 * admin UI's column reference table.
 */

/* ------------------------------ Header keys ------------------------------ */

/**
 * Normalize any incoming header into a comparable key:
 * strips BOM/`*`, lowercases, collapses every non-alphanumeric run to `_`.
 * "Category Name *" / "CATEGORY-NAME" / "category name" → "category_name".
 */
export function normalizeHeader(header) {
  return String(header ?? '')
    .replace(/^﻿/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/* ----------------------------- Column catalog ---------------------------- */
// type: text | url | int | number | bool | list
// aliases: extra accepted spellings (the header and the key are always accepted)

const COLUMNS = {
  /* -- Level 1: category -- */
  category_name: {
    header: 'Category Name',
    type: 'text',
    example: 'Fruits & Vegetables',
    hint: 'Top level. Matched by slug — an existing category is reused, not duplicated.',
    aliases: ['category', 'main_category', 'parent_category'],
  },
  category_slug: {
    header: 'Category Slug',
    type: 'text',
    example: 'fruits-vegetables',
    hint: 'Optional. Auto-generated from the name when blank.',
    aliases: ['category_url', 'category_handle'],
  },
  category_image: {
    header: 'Category Image URL',
    type: 'url',
    example: 'https://images.example.com/cat/fruits.jpg',
    hint: 'Full https:// link or an /uploads/... path.',
    aliases: ['category_img', 'category_photo', 'category_image_url'],
  },
  category_bg_color: {
    header: 'Category BG Class',
    type: 'text',
    example: 'bg-primary-100',
    hint: 'Tailwind background class used on the storefront tile.',
    aliases: ['category_bg', 'category_background', 'bg_color'],
  },
  category_sort_order: {
    header: 'Category Sort Order',
    type: 'int',
    example: '1',
    hint: 'Lower shows first. Defaults to 0.',
    aliases: ['category_order', 'category_position'],
  },

  /* -- Level 2: subcategory -- */
  subcategory_name: {
    header: 'Subcategory Name',
    type: 'text',
    example: 'Fresh Vegetables',
    hint: 'Second level, created inside the category of the same row.',
    aliases: ['sub_category_name', 'sub_category', 'subcategory'],
  },
  subcategory_slug: {
    header: 'Subcategory Slug',
    type: 'text',
    example: 'fresh-vegetables',
    hint: 'Optional. Auto-generated from the name when blank.',
    aliases: ['sub_category_slug'],
  },
  subcategory_image: {
    header: 'Subcategory Image URL',
    type: 'url',
    example: 'https://images.example.com/sub/veggies.jpg',
    hint: 'Full https:// link or an /uploads/... path.',
    aliases: ['sub_category_image', 'subcategory_img', 'sub_category_image_url'],
  },
  subcategory_sort_order: {
    header: 'Subcategory Sort Order',
    type: 'int',
    example: '1',
    hint: 'Lower shows first. Defaults to 0.',
    aliases: ['sub_category_sort_order', 'subcategory_order'],
  },

  /* -- Level 3: brand (the sub-sub category) -- */
  brand_name: {
    header: 'Sub Sub Category / Brand Name',
    type: 'text',
    example: 'Farm Fresh',
    hint: 'Third level, created inside the subcategory of the same row.',
    aliases: [
      'brand',
      'sub_sub_category',
      'sub_sub_category_name',
      'subsubcategory',
      'subsubcategory_name',
      'sub_sub_category_brand',
      'third_level',
    ],
  },
  brand_slug: {
    header: 'Sub Sub Category / Brand Slug',
    type: 'text',
    example: 'farm-fresh',
    hint: 'Optional. Auto-generated from the name when blank.',
    aliases: ['sub_sub_category_slug', 'subsubcategory_slug'],
  },
  brand_logo: {
    header: 'Sub Sub Category / Brand Logo URL',
    type: 'url',
    example: 'https://images.example.com/brand/farm-fresh.png',
    hint: 'Full https:// link or an /uploads/... path.',
    aliases: ['brand_logo_url', 'brand_image', 'sub_sub_category_image', 'subsubcategory_image'],
  },
  brand_description: {
    header: 'Sub Sub Category / Brand Description',
    type: 'text',
    example: 'Locally sourced produce',
    hint: 'Optional short description.',
    aliases: ['brand_desc', 'sub_sub_category_description'],
  },

  /* -- Level 4: product -- */
  product_name: {
    header: 'Product Name',
    type: 'text',
    example: 'Fresh Tomatoes',
    hint: 'Repeat the same name on several rows to add multiple pack sizes.',
    aliases: ['product', 'item_name', 'title'],
  },
  product_slug: {
    header: 'Product Slug',
    type: 'text',
    example: 'fresh-tomatoes',
    hint: 'Optional. Auto-generated from the name when blank.',
    aliases: ['product_url', 'product_handle'],
  },
  product_description: {
    header: 'Product Description',
    type: 'text',
    example: 'Hand-picked, farm fresh tomatoes.',
    hint: 'Optional description shown on the product page.',
    aliases: ['description', 'product_desc', 'details'],
  },
  product_image: {
    header: 'Product Image URL',
    type: 'url',
    example: 'https://images.example.com/products/tomato.jpg',
    hint: 'Full https:// link or an /uploads/... path.',
    aliases: ['image', 'image_url', 'product_img', 'product_photo'],
  },
  product_tags: {
    header: 'Product Tags',
    type: 'list',
    example: 'fresh, daily, organic',
    hint: 'Separate with commas or | — e.g. "fresh, organic".',
    aliases: ['tags', 'keywords'],
  },
  product_is_available: {
    header: 'Product Active',
    type: 'bool',
    example: 'TRUE',
    hint: 'TRUE / FALSE (also accepts yes/no, 1/0, active/hidden). Defaults to TRUE.',
    aliases: ['product_available', 'product_status', 'is_available', 'active'],
  },

  /* -- Level 5: variant (pack size) -- */
  variant_quantity: {
    header: 'Pack Size',
    type: 'text',
    example: '500 g',
    hint: 'Pack label such as 500 g / 1 kg / 6 pcs. Fill it together with Price.',
    aliases: ['quantity', 'pack', 'pack_size', 'weight', 'unit', 'size', 'variant'],
  },
  price: {
    header: 'Selling Price',
    type: 'number',
    example: '40',
    hint: 'Price the customer pays. Fill it together with Pack Size.',
    aliases: ['selling_price', 'sale_price', 'variant_price', 'mrp_sale'],
  },
  original_price: {
    header: 'MRP',
    type: 'number',
    example: '50',
    hint: 'Struck-through price. Defaults to the selling price when blank.',
    aliases: ['mrp', 'strike_price', 'compare_price', 'variant_original_price'],
  },
  discount: {
    header: 'Discount %',
    type: 'number',
    example: '20',
    hint: 'Optional. Calculated from MRP vs Selling Price when blank.',
    aliases: ['discount_percent', 'discount_percentage', 'off'],
  },
  stock: {
    header: 'Stock Qty',
    type: 'int',
    example: '100',
    hint: 'Units in stock for this pack. Defaults to 0.',
    aliases: ['qty', 'quantity_in_stock', 'inventory', 'stock_qty', 'available_stock'],
  },
  low_stock_threshold: {
    header: 'Low Stock Alert At',
    type: 'int',
    example: '10',
    hint: 'Alert level for this pack. Defaults to 10.',
    aliases: ['low_stock', 'reorder_point', 'low_stock_level'],
  },
  variant_is_available: {
    header: 'Pack Active',
    type: 'bool',
    example: 'TRUE',
    hint: 'TRUE / FALSE for this pack only. Defaults to TRUE.',
    aliases: ['variant_available', 'variant_status', 'pack_active'],
  },
};

/* ------------------------------- Templates ------------------------------- */

const CATALOG_COLUMNS = [
  { key: 'category_name', required: true },
  { key: 'category_slug' },
  { key: 'category_image' },
  { key: 'category_bg_color' },
  { key: 'category_sort_order' },
  { key: 'subcategory_name' },
  { key: 'subcategory_slug' },
  { key: 'subcategory_image' },
  { key: 'subcategory_sort_order' },
  { key: 'brand_name' },
  { key: 'brand_slug' },
  { key: 'brand_logo' },
  { key: 'brand_description' },
];

const PRODUCT_COLUMNS = [
  { key: 'category_name', required: true },
  { key: 'category_image' },
  { key: 'category_bg_color' },
  { key: 'category_sort_order' },
  { key: 'subcategory_name', required: true },
  { key: 'subcategory_image' },
  { key: 'subcategory_sort_order' },
  { key: 'brand_name', required: true },
  { key: 'brand_logo' },
  { key: 'brand_description' },
  { key: 'product_name', required: true },
  { key: 'product_slug' },
  { key: 'product_description' },
  { key: 'product_image' },
  { key: 'product_tags' },
  { key: 'product_is_available' },
  { key: 'variant_quantity' },
  { key: 'price' },
  { key: 'original_price' },
  { key: 'discount' },
  { key: 'stock' },
  { key: 'low_stock_threshold' },
  { key: 'variant_is_available' },
];

export const TEMPLATES = {
  catalog: {
    type: 'catalog',
    label: 'Categories, Subcategories & Sub-Sub Categories',
    sheet: 'Catalog',
    fileBase: 'catalog-bulk-upload-template',
    description:
      'Builds the category → subcategory → sub-sub category (brand) hierarchy. ' +
      'Leave the subcategory / sub-sub category columns blank to create only a category.',
    columns: CATALOG_COLUMNS,
  },
  products: {
    type: 'products',
    label: 'Products with full hierarchy & pack sizes',
    sheet: 'Products',
    fileBase: 'products-bulk-upload-template',
    description:
      'One row per pack size. Missing categories, subcategories and sub-sub categories ' +
      'are created automatically, so a single file can build the whole catalog.',
    columns: PRODUCT_COLUMNS,
  },
};

export const TEMPLATE_TYPES = Object.keys(TEMPLATES);

/** Resolved column list (definition merged with the per-template required flag). */
export function templateColumns(type) {
  const template = TEMPLATES[type];
  if (!template) return [];
  return template.columns.map(({ key, required = false }) => ({
    key,
    required,
    ...COLUMNS[key],
    /** Header as written into the generated template (required ones carry a *). */
    templateHeader: required ? `${COLUMNS[key].header} *` : COLUMNS[key].header,
  }));
}

/**
 * Lookup table from every accepted header spelling to a column key, so files
 * saved with renamed/reordered/differently-cased headers still import.
 */
export function headerLookup(type) {
  const map = new Map();
  for (const col of templateColumns(type)) {
    const spellings = [col.key, col.header, col.templateHeader, ...(col.aliases ?? [])];
    for (const spelling of spellings) {
      const norm = normalizeHeader(spelling);
      if (norm && !map.has(norm)) map.set(norm, col.key);
    }
  }
  return map;
}

/** Two sample rows used in the "with sample data" template download. */
export const SAMPLE_ROWS = {
  catalog: [
    {
      category_name: 'Fruits & Vegetables',
      category_slug: 'fruits-vegetables',
      category_image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
      category_bg_color: 'bg-primary-100',
      category_sort_order: 1,
      subcategory_name: 'Fresh Vegetables',
      subcategory_slug: 'fresh-vegetables',
      subcategory_image: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400',
      subcategory_sort_order: 1,
      brand_name: 'Farm Fresh',
      brand_slug: 'farm-fresh',
      brand_logo: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200',
      brand_description: 'Locally sourced daily produce',
    },
    {
      category_name: 'Fruits & Vegetables',
      category_slug: 'fruits-vegetables',
      category_image: '',
      category_bg_color: '',
      category_sort_order: '',
      subcategory_name: 'Fresh Fruits',
      subcategory_slug: 'fresh-fruits',
      subcategory_image: '',
      subcategory_sort_order: 2,
      brand_name: 'Orchard Pick',
      brand_slug: '',
      brand_logo: '',
      brand_description: '',
    },
    {
      category_name: 'Dairy & Breakfast',
      category_slug: '',
      category_image: '',
      category_bg_color: 'bg-blue-100',
      category_sort_order: 2,
      subcategory_name: '',
      subcategory_slug: '',
      subcategory_image: '',
      subcategory_sort_order: '',
      brand_name: '',
      brand_slug: '',
      brand_logo: '',
      brand_description: '',
    },
  ],
  products: [
    {
      category_name: 'Fruits & Vegetables',
      category_image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
      category_bg_color: 'bg-primary-100',
      category_sort_order: 1,
      subcategory_name: 'Fresh Vegetables',
      subcategory_image: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400',
      subcategory_sort_order: 1,
      brand_name: 'Farm Fresh',
      brand_logo: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200',
      brand_description: 'Locally sourced daily produce',
      product_name: 'Fresh Tomatoes',
      product_slug: 'fresh-tomatoes',
      product_description: 'Hand-picked farm fresh tomatoes, rich in flavour.',
      product_image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400',
      product_tags: 'fresh, daily, vegetable',
      product_is_available: 'TRUE',
      variant_quantity: '500 g',
      price: 25,
      original_price: 35,
      discount: '',
      stock: 120,
      low_stock_threshold: 10,
      variant_is_available: 'TRUE',
    },
    {
      category_name: 'Fruits & Vegetables',
      category_image: '',
      category_bg_color: '',
      category_sort_order: '',
      subcategory_name: 'Fresh Vegetables',
      subcategory_image: '',
      subcategory_sort_order: '',
      brand_name: 'Farm Fresh',
      brand_logo: '',
      brand_description: '',
      product_name: 'Fresh Tomatoes',
      product_slug: 'fresh-tomatoes',
      product_description: '',
      product_image: '',
      product_tags: '',
      product_is_available: '',
      variant_quantity: '1 kg',
      price: 45,
      original_price: 60,
      discount: '',
      stock: 80,
      low_stock_threshold: 10,
      variant_is_available: 'TRUE',
    },
    {
      category_name: 'Dairy & Breakfast',
      category_image: '',
      category_bg_color: 'bg-blue-100',
      category_sort_order: 2,
      subcategory_name: 'Milk',
      subcategory_image: '',
      subcategory_sort_order: 1,
      brand_name: 'Amul',
      brand_logo: '',
      brand_description: '',
      product_name: 'Amul Gold Full Cream Milk',
      product_slug: '',
      product_description: 'Rich and creamy full cream milk.',
      product_image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
      product_tags: 'milk, dairy',
      product_is_available: 'TRUE',
      variant_quantity: '500 ml',
      price: 33,
      original_price: 33,
      discount: 0,
      stock: 60,
      low_stock_threshold: 15,
      variant_is_available: 'TRUE',
    },
  ],
};
