import { supabase } from '../../lib/supabase';
import type { AdminUser } from './types';

// The auth context registers the signed-in admin here so any service can
// attribute activity-log entries without threading the admin through calls.
let currentAdmin: Pick<AdminUser, 'id' | 'email'> | null = null;

export function setAuditAdmin(admin: Pick<AdminUser, 'id' | 'email'> | null) {
  currentAdmin = admin;
}

export async function logActivity(
  action: string,
  entityType?: string,
  entityId?: string | null,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from('activity_logs').insert({
      admin_user_id: currentAdmin?.id ?? null,
      admin_email: currentAdmin?.email ?? null,
      action,
      entity_type: entityType ?? null,
      entity_id: entityId ?? null,
      metadata: metadata ?? null,
    });
  } catch (err) {
    // Never let audit logging break the primary action.
    console.warn('Failed to write activity log', err);
  }
}
