import React, { useState, useEffect, useMemo } from 'react';
import {
  Store, Receipt, SlidersHorizontal, Save, RotateCcw, Power, Bell,
  CheckCircle2, AlertTriangle, LucideIcon,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import FormField, { Input, Textarea, Switch } from '../../components/ui/FormField';
import { Loader, ErrorState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { getSettings, updateSettings, type AppSettings } from '../../lib/services/settings.service';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SettingsPage() {
  const toast = useToast();
  const { can } = useAdminAuth();
  const canManage = can('settings.manage');

  const { data, loading, error, reload } = useAsync(() => getSettings(), []);

  const [form, setForm] = useState<AppSettings | null>(null);
  const [original, setOriginal] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setForm(data);
      setOriginal(data);
    }
  }, [data]);

  const dirty = useMemo(
    () => !!form && !!original && JSON.stringify(form) !== JSON.stringify(original),
    [form, original]
  );

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!form) return e;
    if (!form.general.store_name.trim()) e.store_name = 'Store name is required';
    if (form.general.support_email && !EMAIL_RE.test(form.general.support_email)) e.support_email = 'Enter a valid email';
    if (form.checkout.tax_rate < 0 || form.checkout.tax_rate > 100) e.tax_rate = 'Must be between 0 and 100';
    return e;
  }, [form]);
  const valid = Object.keys(errors).length === 0;

  if (loading) return <Loader label="Loading settings…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!form) return null;

  // Typed nested-group updater.
  const setGroup = <K extends keyof AppSettings>(group: K, patch: Partial<AppSettings[K]>) =>
    setForm((f) => (f ? { ...f, [group]: { ...f[group], ...patch } } : f));

  const save = async () => {
    if (!valid) return toast.error(Object.values(errors)[0]);
    setSaving(true);
    try {
      const next = await updateSettings(form);
      setForm(next);
      setOriginal(next);
      toast.success('Settings saved');
    } catch (err: any) {
      toast.error(err?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const discard = () => original && setForm(original);

  const ro = !canManage;

  return (
    <div className="max-w-3xl pb-24">
      <PageHeader
        title="Settings"
        subtitle="Store identity, checkout rules and operational controls."
        actions={
          canManage ? (
            <div className="flex items-center gap-2">
              {dirty && (
                <Button variant="ghost" icon={<RotateCcw size={15} />} onClick={discard} disabled={saving}>
                  Discard
                </Button>
              )}
              <Button icon={<Save size={16} />} onClick={save} loading={saving} disabled={!dirty || !valid}>
                Save changes
              </Button>
            </div>
          ) : (
            <Badge className="bg-neutral-200 text-neutral-600">Read-only access</Badge>
          )
        }
      />

      {/* Store status highlight */}
      <div
        className={`flex items-center justify-between rounded-2xl px-5 py-4 mb-4 border ${
          form.operations.store_online ? 'bg-primary-50 border-primary-100' : 'bg-amber-50 border-amber-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${form.operations.store_online ? 'bg-primary-100 text-primary-600' : 'bg-amber-100 text-amber-600'}`}>
            <Power size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-800">
              {form.operations.store_online ? 'Store is online' : 'Store is offline'}
            </p>
            <p className="text-xs text-neutral-500">
              {form.operations.store_online ? 'Customers can browse and place orders.' : 'Ordering is paused for customers.'}
            </p>
          </div>
        </div>
        <Switch checked={form.operations.store_online} disabled={ro} onChange={(v) => setGroup('operations', { store_online: v })} />
      </div>

      {/* General */}
      <Section icon={Store} title="General" description="Store identity and customer support details.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Store name" required error={errors.store_name}>
            <Input value={form.general.store_name} disabled={ro} onChange={(e) => setGroup('general', { store_name: e.target.value })} />
          </FormField>
          <FormField label="Support email" error={errors.support_email}>
            <Input value={form.general.support_email} disabled={ro} placeholder="care@agrawalstore.in" onChange={(e) => setGroup('general', { support_email: e.target.value })} />
          </FormField>
          <FormField label="Support phone">
            <Input value={form.general.support_phone} disabled={ro} placeholder="+91 9285108057" onChange={(e) => setGroup('general', { support_phone: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Currency code">
              <Input value={form.general.currency} disabled={ro} onChange={(e) => setGroup('general', { currency: e.target.value.toUpperCase() })} />
            </FormField>
            <FormField label="Symbol">
              <Input value={form.general.currency_symbol} disabled={ro} onChange={(e) => setGroup('general', { currency_symbol: e.target.value })} />
            </FormField>
          </div>
          <FormField label="Store address" className="sm:col-span-2">
            <Textarea value={form.general.address} disabled={ro} placeholder="Fatehchand colony, ward no 5, near ram mandir chauraha, sabalgarh, Morena, madhya pradesh - 476229, India" onChange={(e) => setGroup('general', { address: e.target.value })} />
          </FormField>
        </div>
      </Section>

      {/* Checkout & tax */}
      <Section icon={Receipt} title="Checkout & Tax" description="Pricing rules applied at checkout.">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Tax rate (%)" error={errors.tax_rate}>
            <Input type="number" min={0} max={100} value={form.checkout.tax_rate} disabled={ro} onChange={(e) => setGroup('checkout', { tax_rate: Number(e.target.value) })} />
          </FormField>
          <FormField label="Default delivery fee (₹)">
            <Input type="number" min={0} value={form.checkout.default_delivery_fee} disabled={ro} onChange={(e) => setGroup('checkout', { default_delivery_fee: Number(e.target.value) })} />
          </FormField>
          <FormField label="Free delivery above (₹)">
            <Input type="number" min={0} value={form.checkout.free_delivery_threshold} disabled={ro} onChange={(e) => setGroup('checkout', { free_delivery_threshold: Number(e.target.value) })} />
          </FormField>
          <FormField label="Minimum order value (₹)" hint="0 = no minimum">
            <Input type="number" min={0} value={form.checkout.min_order_value} disabled={ro} onChange={(e) => setGroup('checkout', { min_order_value: Number(e.target.value) })} />
          </FormField>
        </div>
        <ToggleRow
          label="Cash on Delivery"
          description="Allow customers to pay in cash at the door."
          checked={form.checkout.cod_enabled}
          disabled={ro}
          onChange={(v) => setGroup('checkout', { cod_enabled: v })}
        />
      </Section>

      {/* Operations */}
      <Section icon={SlidersHorizontal} title="Operations" description="Store availability and internal alerts.">
        <FormField label="Storefront notice" hint="Shown to customers (e.g. holiday hours). Leave blank to hide.">
          <Textarea value={form.operations.order_notice} disabled={ro} placeholder="We're closed on public holidays." onChange={(e) => setGroup('operations', { order_notice: e.target.value })} />
        </FormField>
        <ToggleRow
          icon={Bell}
          label="Low-stock alerts"
          description="Create notifications when a SKU drops to its reorder point."
          checked={form.operations.low_stock_alerts}
          disabled={ro}
          onChange={(v) => setGroup('operations', { low_stock_alerts: v })}
        />
      </Section>

      {ro && <p className="text-xs text-neutral-400 mt-2">You have read-only access to settings. Contact a super-admin to make changes.</p>}

      {/* Sticky unsaved-changes bar */}
      {canManage && dirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:left-[calc(50%+8rem)] z-50">
          <div className="flex items-center gap-3 bg-neutral-800 text-white rounded-2xl shadow-card-hover px-4 py-3">
            <AlertTriangle size={16} className="text-amber-400" />
            <span className="text-sm font-medium">Unsaved changes</span>
            <div className="w-px h-5 bg-white/20" />
            <button onClick={discard} className="text-sm text-neutral-300 hover:text-white">Discard</button>
            <Button size="sm" icon={<Save size={14} />} onClick={save} loading={saving} disabled={!valid}>Save</Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Pieces -------------------------------- */

function Section({ icon: Icon, title, description, children }: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-5 mb-4">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
          <Icon size={17} className="text-primary-600" />
        </div>
        <div>
          <h3 className="text-base font-bold text-neutral-800">{title}</h3>
          {description && <p className="text-xs text-neutral-400">{description}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function ToggleRow({ icon: Icon, label, description, checked, disabled, onChange }: {
  icon?: LucideIcon;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
      <div className="flex items-center gap-2.5">
        {Icon ? <Icon size={16} className="text-neutral-400" /> : <CheckCircle2 size={16} className={checked ? 'text-primary-600' : 'text-neutral-300'} />}
        <div>
          <p className="text-sm font-medium text-neutral-700">{label}</p>
          <p className="text-xs text-neutral-400">{description}</p>
        </div>
      </div>
      <Switch checked={checked} disabled={disabled} onChange={onChange} />
    </div>
  );
}
