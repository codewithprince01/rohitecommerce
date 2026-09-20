import type { AdminUser } from './types';

/**
 * Tracks who is signed in for client-side attribution.
 *
 * The audit trail itself is written server-side — every mutating route calls
 * the backend's own `logActivity`, which records the admin from the verified
 * access token. Writing a second, unverifiable log from the browser would only
 * produce entries nobody can trust, so this module just remembers the admin.
 */
let currentAdmin: Pick<AdminUser, 'id' | 'email'> | null = null;

export function setAuditAdmin(admin: Pick<AdminUser, 'id' | 'email'> | null) {
  currentAdmin = admin;
}

export function getAuditAdmin(): Pick<AdminUser, 'id' | 'email'> | null {
  return currentAdmin;
}
