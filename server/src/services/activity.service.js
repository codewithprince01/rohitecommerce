import { ActivityLog, Notification } from '../models/Operations.js';
import { logger } from '../config/logger.js';

// Record an admin write action to the audit trail. Best-effort: never throws
// into the caller's flow (a failed log must not fail the business operation).
export async function logActivity(req, action, entityType, entityId, metadata) {
  try {
    const admin = req?.admin;
    await ActivityLog.create({
      admin_user_id: admin?._id ?? null,
      admin_email: admin?.email ?? null,
      action,
      entity_type: entityType ?? null,
      entity_id: entityId ? String(entityId) : null,
      metadata: metadata ?? null,
    });
  } catch (err) {
    logger.warn(`Failed to write activity log: ${err.message}`);
  }
}

// Push an internal admin notification (low-stock alerts, new orders, etc.).
export async function notify(type, title, body, link) {
  try {
    await Notification.create({ type, title, body: body ?? null, link: link ?? null });
  } catch (err) {
    logger.warn(`Failed to create notification: ${err.message}`);
  }
}
