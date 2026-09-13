import slugify from 'slugify';
import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AdminUser } from '../models/AdminUser.js';
import { Customer } from '../models/Customer.js';
import { Category, Subcategory, Brand, Product, ProductVariant } from '../models/Catalog.js';
import { Order, OrderItem, OrderStatusHistory } from '../models/Order.js';
import { Coupon, Banner } from '../models/Marketing.js';
import {
  PaymentMethod, DeliveryZone, StoreSetting, Notification, ActivityLog, InventoryMovement,
} from '../models/Operations.js';

const FRESH = process.argv.includes('--fresh');
const slug = (s) => slugify(s, { lower: true, strict: true });
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const CATALOG = [
  {
    name: 'Snacks & Namkeen', bg: 'bg-amber-100',
    subs: [
      { name: 'Namkeen', brands: ['Haldiram', 'Bikaji'], products: ['Aloo Bhujia', 'Moong Dal', 'Navratan Mix'] },
      { name: 'Chips', brands: ['Lays', 'Bingo'], products: ['Classic Salted', 'Magic Masala', 'Cream & Onion'] },
    ],
  },
  {
    name: 'Dairy & Bakery', bg: 'bg-blue-100',
    subs: [
      { name: 'Milk & Curd', brands: ['Amul', 'Mother Dairy'], products: ['Full Cream Milk', 'Toned Milk', 'Fresh Curd'] },
      { name: 'Biscuits', brands: ['Britannia', 'Parle'], products: ['Good Day', 'Marie Gold', 'Bourbon'] },
    ],
  },
  {
    name: 'Beverages', bg: 'bg-primary-100',
    subs: [
      { name: 'Soft Drinks', brands: ['Coca Cola', 'Pepsi'], products: ['Coke 750ml', 'Sprite 750ml', 'Pepsi 1L'] },
      { name: 'Juices', brands: ['Real', 'Tropicana'], products: ['Mixed Fruit', 'Orange', 'Apple'] },
    ],
  },
];

const PACKS = [
  { quantity: '100g', price: 40, mrp: 50 },
  { quantity: '200g', price: 75, mrp: 90 },
  { quantity: '500g', price: 160, mrp: 199 },
  { quantity: '1kg', price: 299, mrp: 360 },
];

const CUSTOMER_NAMES = [
  'Aarav Sharma', 'Diya Patel', 'Vivaan Gupta', 'Ananya Singh', 'Arjun Reddy',
  'Ishaan Khan', 'Saanvi Mehta', 'Reyansh Joshi', 'Myra Nair', 'Kabir Das',
];

async function clearAll() {
  await Promise.all([
    Customer.deleteMany({}), Category.deleteMany({}), Subcategory.deleteMany({}),
    Brand.deleteMany({}), Product.deleteMany({}), ProductVariant.deleteMany({}),
    Order.deleteMany({}), OrderItem.deleteMany({}), OrderStatusHistory.deleteMany({}),
    Coupon.deleteMany({}), Banner.deleteMany({}), PaymentMethod.deleteMany({}),
    DeliveryZone.deleteMany({}), StoreSetting.deleteMany({}), Notification.deleteMany({}),
    ActivityLog.deleteMany({}), InventoryMovement.deleteMany({}),
  ]);
  logger.info('Cleared existing data (--fresh)');
}

async function seedAdmin() {
  const existing = await AdminUser.findOne({ email: env.seed.email });
  if (existing) {
    logger.info(`Super admin already exists: ${env.seed.email}`);
    return existing;
  }
  const admin = await AdminUser.create({
    email: env.seed.email,
    password: env.seed.password,
    full_name: env.seed.name,
    role: 'super_admin',
    is_active: true,
  });
  logger.info(`Created super admin: ${env.seed.email} / ${env.seed.password}`);
  return admin;
}

async function seedCatalog() {
  const variants = [];
  for (const [ci, cat] of CATALOG.entries()) {
    const category = await Category.create({ name: cat.name, slug: slug(cat.name), bg_color: cat.bg, sort_order: ci });
    for (const [si, sub] of cat.subs.entries()) {
      const subcategory = await Subcategory.create({
        category_id: category._id, name: sub.name, slug: slug(sub.name), sort_order: si,
      });
      for (const brandName of sub.brands) {
        const brand = await Brand.create({
          subcategory_id: subcategory._id, name: brandName, slug: slug(brandName),
        });
        for (const productName of sub.products) {
          const product = await Product.create({
            brand_id: brand._id, category_id: category._id, subcategory_id: subcategory._id,
            name: `${brandName} ${productName}`, slug: slug(`${brandName}-${productName}`),
            description: `${productName} from ${brandName}.`, is_available: true,
            tags: [sub.name.toLowerCase()],
          });
          // 1-2 variants per product, some low stock to light up dashboard alerts
          const packCount = rand(1, 2);
          for (let p = 0; p < packCount; p++) {
            const pack = PACKS[p];
            const v = await ProductVariant.create({
              product_id: product._id, quantity: pack.quantity, price: pack.price,
              original_price: pack.mrp, discount: Math.round((1 - pack.price / pack.mrp) * 100),
              stock: Math.random() < 0.25 ? rand(0, 8) : rand(20, 150), is_available: true,
            });
            variants.push({ id: v._id, product, label: pack.quantity, price: pack.price });
          }
        }
      }
    }
  }
  logger.info(`Seeded catalog: ${variants.length} variants`);
  return variants;
}

async function seedCustomers() {
  const customers = [];
  for (let i = 0; i < CUSTOMER_NAMES.length; i++) {
    const name = CUSTOMER_NAMES[i];
    const c = await Customer.create({
      name,
      email: `${slug(name).replace(/-/g, '.')}@example.com`,
      phone: `9${rand(100000000, 999999999)}`,
      created_at: new Date(Date.now() - rand(0, 60) * 86400000),
    });
    customers.push(c);
  }
  logger.info(`Seeded ${customers.length} customers`);
  return customers;
}

async function seedOrders(customers, variants) {
  const statuses = ['pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'delivered', 'delivered', 'cancelled'];
  const payMethods = ['cod', 'upi', 'card', 'wallet'];
  const payStatuses = ['paid', 'paid', 'pending', 'failed'];
  let n = 0;
  for (let i = 0; i < 60; i++) {
    const customer = pick(customers);
    const placedAt = new Date(Date.now() - rand(0, 45) * 86400000 - rand(0, 86400000));
    const itemCount = rand(1, 4);
    const items = [];
    let subtotal = 0;
    for (let j = 0; j < itemCount; j++) {
      const v = pick(variants);
      const qty = rand(1, 3);
      const lineTotal = v.price * qty;
      subtotal += lineTotal;
      items.push({
        product_id: v.product._id, variant_id: v.id, product_name: v.product.name,
        variant_label: v.label, unit_price: v.price, quantity: qty, line_total: lineTotal,
      });
    }
    const discount = Math.random() < 0.3 ? rand(10, 50) : 0;
    const deliveryFee = subtotal >= 499 ? 0 : 25;
    const total = subtotal - discount + deliveryFee;
    const status = pick(statuses);

    const order = await Order.create({
      order_number: `GRO${Date.now().toString().slice(-6)}${rand(100, 999)}`,
      customer_id: customer._id, status,
      payment_status: status === 'cancelled' ? 'failed' : pick(payStatuses),
      payment_method: pick(payMethods),
      subtotal, discount, delivery_fee: deliveryFee, tax: 0, total,
      placed_at: placedAt, created_at: placedAt,
    });
    await OrderItem.insertMany(items.map((it) => ({ ...it, order_id: order._id })));
    await OrderStatusHistory.create({ order_id: order._id, status, created_at: placedAt });
    n++;
  }
  logger.info(`Seeded ${n} orders`);
}

async function seedMisc() {
  await Coupon.create([
    { code: 'WELCOME10', description: '10% off first order', type: 'percent', value: 10, min_order: 199, max_discount: 100 },
    { code: 'FLAT50', description: 'Flat ₹50 off', type: 'fixed', value: 50, min_order: 499 },
  ]);
  await Banner.create([
    { title: 'Fresh Groceries Delivered', subtitle: 'In 30 minutes', position: 'home_hero', bg_color: 'bg-primary-500', sort_order: 0 },
  ]);
  await PaymentMethod.create([
    { name: 'Cash on Delivery', code: 'cod', is_enabled: true, sort_order: 1 },
    { name: 'UPI', code: 'upi', is_enabled: true, sort_order: 2 },
    { name: 'Credit / Debit Card', code: 'card', is_enabled: true, sort_order: 3 },
    { name: 'Wallet', code: 'wallet', is_enabled: false, sort_order: 4 },
  ]);
  await DeliveryZone.create([
    { name: 'City Center', pincodes: ['110001', '110002'], fee: 25, min_order: 0, free_above: 499, eta_minutes: 30 },
  ]);
  await StoreSetting.create([
    { key: 'general', value: { store_name: 'FreshMart', currency: 'INR', currency_symbol: '₹', support_email: 'support@freshmart.com', support_phone: '+91 98765 43210' } },
    { key: 'checkout', value: { tax_rate: 0, default_delivery_fee: 25, free_delivery_threshold: 499 } },
  ]);
  await Notification.create([
    { type: 'system', title: 'Welcome to FreshMart Admin', body: 'Your store backend is live.' },
  ]);
  logger.info('Seeded coupons, banners, payment methods, delivery zones, settings');
}

async function run() {
  await connectDB();
  if (FRESH) await clearAll();
  await seedAdmin();

  if (FRESH || (await Product.countDocuments({})) === 0) {
    const variants = await seedCatalog();
    const customers = await seedCustomers();
    await seedOrders(customers, variants);
    await seedMisc();
  } else {
    logger.info('Catalog already present — skipping sample data (use --fresh to reseed)');
  }

  await disconnectDB();
  logger.info('Seed complete ✓');
  process.exit(0);
}

run().catch((err) => {
  logger.error(`Seed failed: ${err.message}`, err.stack);
  process.exit(1);
});
