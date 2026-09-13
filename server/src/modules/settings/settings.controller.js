import { StoreSetting } from '../../models/Operations.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/ApiResponse.js';
import { logActivity } from '../../services/activity.service.js';

/**
 * Canonical settings groups + their defaults. `GET /settings` always returns a
 * complete, well-typed object (defaults merged over whatever is stored) so the
 * UI never has to invent fallbacks and a fresh DB behaves correctly.
 */
const DEFAULTS = {
  general: {
    store_name: 'FreshMart',
    currency: 'INR',
    currency_symbol: '₹',
    support_email: '',
    support_phone: '',
    address: '',
  },
  checkout: {
    tax_rate: 0,
    default_delivery_fee: 25,
    free_delivery_threshold: 499,
    min_order_value: 0,
    cod_enabled: true,
  },
  operations: {
    store_online: true,
    order_notice: '',
    low_stock_alerts: true,
  },
};

const GROUPS = Object.keys(DEFAULTS);

// Load every known group, merging stored values over the defaults.
async function loadSettings() {
  const docs = await StoreSetting.find({ key: { $in: GROUPS } }).lean();
  const stored = Object.fromEntries(docs.map((d) => [d.key, d.value || {}]));
  const merged = {};
  for (const key of GROUPS) merged[key] = { ...DEFAULTS[key], ...stored[key] };
  return merged;
}

/** GET /api/settings — full settings object for the admin panel. */
export const getSettings = asyncHandler(async (_req, res) => {
  return ok(res, await loadSettings());
});

/**
 * PATCH /api/settings — upsert one or more groups. Each provided group is
 * merged over its current stored value (and the defaults), so partial updates
 * never wipe untouched fields. Returns the freshly merged settings.
 */
export const updateSettings = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const touched = [];

  for (const key of GROUPS) {
    const incoming = body[key];
    if (!incoming || typeof incoming !== 'object') continue;
    const existing = await StoreSetting.findOne({ key }).lean();
    const value = { ...DEFAULTS[key], ...(existing?.value || {}), ...incoming };
    await StoreSetting.findOneAndUpdate({ key }, { value }, { upsert: true, new: true, setDefaultsOnInsert: true });
    touched.push(key);
  }

  await logActivity(req, 'update', 'settings', null, { groups: touched });
  return ok(res, await loadSettings());
});

/**
 * GET /api/settings/public — no-auth, flattened subset safe for the storefront
 * (currency, support contacts, checkout rules, store status). No secrets.
 */
export const getPublicSettings = asyncHandler(async (_req, res) => {
  const s = await loadSettings();
  return ok(res, {
    store_name: s.general.store_name,
    currency: s.general.currency,
    currency_symbol: s.general.currency_symbol,
    support_email: s.general.support_email,
    support_phone: s.general.support_phone,
    tax_rate: s.checkout.tax_rate,
    default_delivery_fee: s.checkout.default_delivery_fee,
    free_delivery_threshold: s.checkout.free_delivery_threshold,
    min_order_value: s.checkout.min_order_value,
    cod_enabled: s.checkout.cod_enabled,
    store_online: s.operations.store_online,
    order_notice: s.operations.order_notice,
  });
});
