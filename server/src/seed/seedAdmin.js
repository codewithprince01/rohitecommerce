/**
 * Ensure the store owner's admin account exists.
 *
 * Safe to run any time — it touches nothing but the one account. Use it after
 * a database drop, or to reset the owner's password back to what `.env` says.
 *
 *   npm run seed:admin
 */

import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AdminUser } from '../models/AdminUser.js';

async function run() {
  await connectDB();

  const email = String(env.seed.email).toLowerCase().trim();
  const existing = await AdminUser.findOne({ email }).select('+password');

  if (existing) {
    // Assigning through the document keeps the pre-save hook, which hashes it.
    existing.password = env.seed.password;
    existing.full_name = env.seed.name;
    existing.role = 'super_admin';
    existing.is_active = true;
    await existing.save();
    logger.info(`Owner account updated: ${email} (password reset from .env)`);
  } else {
    await AdminUser.create({
      email,
      password: env.seed.password,
      full_name: env.seed.name,
      role: 'super_admin',
      is_active: true,
    });
    logger.info(`Owner account created: ${email} (super_admin)`);
  }

  const total = await AdminUser.countDocuments();
  logger.info(`Admin accounts on file: ${total}`);
}

run()
  .catch((err) => {
    logger.error(`Admin seed failed: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });
