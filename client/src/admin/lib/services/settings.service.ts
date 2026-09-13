import { api } from '../api';

/* ------------------------------- Types -------------------------------- */

export interface GeneralSettings {
  store_name: string;
  currency: string;
  currency_symbol: string;
  support_email: string;
  support_phone: string;
  address: string;
}

export interface CheckoutSettings {
  tax_rate: number;
  default_delivery_fee: number;
  free_delivery_threshold: number;
  min_order_value: number;
  cod_enabled: boolean;
}

export interface OperationsSettings {
  store_online: boolean;
  order_notice: string;
  low_stock_alerts: boolean;
}

export interface AppSettings {
  general: GeneralSettings;
  checkout: CheckoutSettings;
  operations: OperationsSettings;
}

export type SettingsPatch = Partial<{
  general: Partial<GeneralSettings>;
  checkout: Partial<CheckoutSettings>;
  operations: Partial<OperationsSettings>;
}>;

/* ------------------------------ Queries ------------------------------- */

/** Full, defaults-merged settings object for the admin panel. */
export function getSettings(): Promise<AppSettings> {
  return api.get<AppSettings>('/settings');
}

/** Upsert one or more groups; returns the freshly merged settings. */
export function updateSettings(patch: SettingsPatch): Promise<AppSettings> {
  return api.patch<AppSettings>('/settings', patch);
}
