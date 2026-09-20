/**
 * Wipe the database back to a blank store and create the single owner account.
 *
 * Every collection is emptied — catalog, marketing, orders, customers and
 * operations — so the storefront and admin start from a genuinely empty state
 * with no demo records hiding anywhere. The only document left behind is the
 * super-admin, because without it nobody could sign in to rebuild the catalog.
 *
 *   npm run reset           # asks for --yes, refuses to run without it
 *   npm run reset -- --yes  # actually wipes
 */

import readline from 'node:readline';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

import { AdminUser } from '../models/AdminUser.js';
import { Customer, Address, WalletTransaction, SupportTicket } from '../models/Customer.js';
import { Category, Subcategory, Brand, Product, ProductVariant } from '../models/Catalog.js';
import { Order, OrderItem, OrderStatusHistory } from '../models/Order.js';
import { Coupon, Banner, HomeSection, OfferDeal } from '../models/Marketing.js';
import {
  InventoryMovement, DeliveryZone, PaymentMethod, Notification, ActivityLog, StoreSetting,
} from '../models/Operations.js';

// Grouped purely so the summary reads like the admin's own navigation.
const GROUPS = [
  ['Catalog', [Category, Subcategory, Brand, Product, ProductVariant]],
  ['Marketing', [Coupon, Banner, HomeSection, OfferDeal]],
  ['Orders', [Order, OrderItem, OrderStatusHistory]],
  ['Customers', [Customer, Address, WalletTransaction, SupportTicket]],
  ['Operations', [InventoryMovement, DeliveryZone, PaymentMethod, Notification, ActivityLog, StoreSetting]],
  ['Admins', [AdminUser]],
];

function confirmInteractively(uri) {
  const target = uri.replace(/\/\/[^@]*@/, '//<credentials>@');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(
      `\nThis permanently deletes EVERY document in:\n  ${target}\n\nType "DELETE" to continue: `,
      (answer) => {
        rl.close();
        resolve(answer.trim() === 'DELETE');
      }
    );
  });
}

async function run() {
  const skipPrompt = process.argv.includes('--yes') || process.argv.includes('-y');

  if (!skipPrompt) {
    const confirmed = await confirmInteractively(env.mongoUri);
    if (!confirmed) {
      logger.warn('Reset cancelled — nothing was deleted.');
      return;
    }
  }

  await connectDB();

  let removed = 0;
  for (const [group, models] of GROUPS) {
    const counts = [];
    for (const Model of models) {
      const { deletedCount } = await Model.deleteMany({});
      removed += deletedCount;
      if (deletedCount) counts.push(`${Model.modelName} ${deletedCount}`);
    }
    logger.info(`Cleared ${group}${counts.length ? `: ${counts.join(', ')}` : ' (already empty)'}`);
  }

  // Drop leftover collections from earlier schema versions so nothing stale
  // survives a rename — the models above only cover what the code knows today.
  const collections = await mongoose.connection.db.listCollections().toArray();
  const known = new Set(GROUPS.flatMap(([, models]) => models.map((m) => m.collection.name)));
  for (const { name } of collections) {
    if (known.has(name) || name.startsWith('system.')) continue;
    await mongoose.connection.db.collection(name).deleteMany({});
    logger.info(`Cleared orphan collection: ${name}`);
  }

  // Recreate the owner account. `AdminUser.create` runs the pre-save hook, so
  // the password is hashed exactly the way the login route expects.
  const admin = await AdminUser.create({
    email: env.seed.email,
    password: env.seed.password,
    full_name: env.seed.name,
    role: 'super_admin',
    is_active: true,
  });

  logger.info(`Removed ${removed} documents. Database is empty.`);
  logger.info(`Owner account ready: ${admin.email} (super_admin)`);
  logger.info('Sign in at /admin, then build the catalog from Bulk Upload or the Categories page.');
}

run()
  .catch((err) => {
    logger.error(`Reset failed: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });
