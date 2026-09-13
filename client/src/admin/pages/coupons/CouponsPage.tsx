import React, { useState, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, Ticket, Copy, Check, Download, RefreshCw,
  CheckCircle2, Users, Wallet, TrendingUp, Clock, Power, Tag, AlertTriangle,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import DataTable, { Column } from '../../components/ui/DataTable';
import BulkActionBar from '../../components/ui/BulkActionBar';
import Modal from '../../components/ui/Modal';
import FormField, { Input, Textarea, Select, Switch } from '../../components/ui/FormField';
import { useTable } from '../../hooks/useTable';
import { useToast } from '../../hooks/useToast';
import { useConfirm } from '../../hooks/useConfirm';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useAsync } from '../../hooks/useAsync';
import {
  listCoupons,
  getCouponStats,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  bulkSetActive,
  bulkDeleteCoupons,
  exportCouponsCsv,
  type CouponRow,
  type CouponStatus,
  type CouponInput,
} from '../../lib/services/coupons.service';
import { formatCurrency, formatCompactCurrency, formatDate } from '../../lib/format';

/* ------------------------------- Helpers -------------------------------- */

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const STATUS_BADGE: Record<CouponStatus, string> = {
  active: 'bg-primary-100 text-primary-700',
  scheduled: 'bg-blue-100 text-blue-700',
  expired: 'bg-neutral-200 text-neutral-600',
  disabled: 'bg-neutral-200 text-neutral-500',
  exhausted: 'bg-amber-100 text-amber-700',
};
const STATUS_LABEL: Record<CouponStatus, string> = {
  active: 'Active', scheduled: 'Scheduled', expired: 'Expired', disabled: 'Disabled', exhausted: 'Exhausted',
};

const discountLabel = (c: { type: string; value: number }) => (c.type === 'percent' ? `${c.value}% off` : `${formatCurrency(c.value)} off`);

/* ================================ Page ================================== */

export default function CouponsPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { can } = useAdminAuth();

  const table = useTable<CouponRow>(listCoupons, { initialSortBy: 'created_at', initialSortDir: 'desc' });
  const { data: stats, reload: reloadStats } = useAsync(() => getCouponStats(), []);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CouponRow | null>(null);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const canManage = can('coupons.manage');

  const refreshAll = useCallback(() => {
    table.refresh();
    reloadStats();
  }, [table, reloadStats]);

  const copyCode = useCallback(
    (code: string) => {
      navigator.clipboard?.writeText(code).then(
        () => {
          setCopied(code);
          setTimeout(() => setCopied((c) => (c === code ? null : c)), 1500);
        },
        () => toast.error('Could not copy')
      );
    },
    [toast]
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (c: CouponRow) => {
    setEditing(c);
    setFormOpen(true);
  };

  const handleDelete = useCallback(
    async (c: CouponRow) => {
      const ok = await confirm({ title: 'Delete coupon', message: `Delete code "${c.code}"? This cannot be undone.`, danger: true, confirmLabel: 'Delete' });
      if (!ok) return;
      try {
        await deleteCoupon(c.id);
        toast.success('Coupon deleted');
        refreshAll();
      } catch (err: any) {
        toast.error(err?.message ?? 'Delete failed');
      }
    },
    [confirm, toast, refreshAll]
  );

  const runBulk = async (action: 'enable' | 'disable' | 'delete') => {
    const ids = [...table.selected];
    try {
      if (action === 'delete') {
        const ok = await confirm({ title: 'Delete coupons', message: `Delete ${ids.length} selected coupons?`, danger: true, confirmLabel: 'Delete' });
        if (!ok) return;
        await bulkDeleteCoupons(ids);
      } else {
        await bulkSetActive(ids, action === 'enable');
      }
      toast.success('Bulk action applied');
      refreshAll();
    } catch (err: any) {
      toast.error(err?.message ?? 'Bulk action failed');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const csv = await exportCouponsCsv({ search: table.search, sortBy: table.sortBy, sortDir: table.sortDir, filters: table.filters });
      downloadCsv(`coupons-${new Date().toISOString().slice(0, 10)}.csv`, csv);
      toast.success('Export ready');
    } catch (err: any) {
      toast.error(err?.message ?? 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const columns: Column<CouponRow>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-accent-50 flex items-center justify-center flex-shrink-0">
            <Ticket size={16} className="text-accent-500" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-neutral-800 font-mono">{c.code}</p>
              <button
                onClick={(e) => { e.stopPropagation(); copyCode(c.code); }}
                className="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                title="Copy code"
              >
                {copied === c.code ? <Check size={12} className="text-primary-600" /> : <Copy size={12} />}
              </button>
            </div>
            <p className="text-xs text-neutral-400 truncate max-w-[200px]">{c.description ?? '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'value',
      header: 'Discount',
      sortable: true,
      render: (c) => (
        <div>
          <p className="font-semibold text-neutral-800">{discountLabel(c)}</p>
          <p className="text-xs text-neutral-400">
            {c.min_order > 0 ? `Min ${formatCurrency(c.min_order)}` : 'No minimum'}
            {c.type === 'percent' && c.max_discount ? ` · cap ${formatCurrency(c.max_discount)}` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'used_count',
      header: 'Usage',
      sortable: true,
      render: (c) => {
        const pct = c.usage_limit ? Math.min(100, (c.used_count / c.usage_limit) * 100) : 0;
        return (
          <div className="min-w-[90px]">
            <p className="text-sm text-neutral-700">
              {c.used_count}{c.usage_limit ? <span className="text-neutral-400"> / {c.usage_limit}</span> : <span className="text-neutral-400"> used</span>}
            </p>
            {c.usage_limit ? (
              <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden mt-1">
                <div className={`h-full rounded-full ${pct >= 100 ? 'bg-amber-500' : 'bg-primary-500'}`} style={{ width: `${pct}%` }} />
              </div>
            ) : (
              <p className="text-[11px] text-neutral-400">Unlimited</p>
            )}
          </div>
        );
      },
    },
    {
      key: 'redemptions',
      header: 'Performance',
      sortable: true,
      render: (c) => (
        <div>
          <p className="text-sm text-neutral-700">{c.redemptions} order{c.redemptions === 1 ? '' : 's'}</p>
          <p className="text-xs text-neutral-400">{formatCompactCurrency(c.total_discount)} given</p>
        </div>
      ),
    },
    {
      key: 'ends_at',
      header: 'Validity',
      sortable: true,
      render: (c) => (
        <div className="text-xs text-neutral-500">
          <p>{c.starts_at ? formatDate(c.starts_at) : 'Always'} →</p>
          <p className={c.status === 'expired' ? 'text-rose-500 font-medium' : ''}>{c.ends_at ? formatDate(c.ends_at) : 'No expiry'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => <Badge className={STATUS_BADGE[c.status]}>{STATUS_LABEL[c.status]}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (c) =>
        canManage ? (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => openEdit(c)} className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100" aria-label="Edit"><Pencil size={15} /></button>
            <button onClick={() => handleDelete(c)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50" aria-label="Delete"><Trash2 size={15} /></button>
          </div>
        ) : <span className="text-neutral-300">—</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Coupons"
        subtitle="Create discount codes and track redemption performance."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={<RefreshCw size={15} />} onClick={refreshAll}>Refresh</Button>
            <Button variant="outline" icon={<Download size={16} />} onClick={handleExport} loading={exporting}>Export</Button>
            {canManage && <Button icon={<Plus size={16} />} onClick={openCreate}>New Coupon</Button>}
          </div>
        }
      />

      {/* KPI cards — live coupon metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-5">
        <StatCard label="Total Coupons" value={stats?.totalCoupons ?? 0} icon={Ticket} loading={!stats} />
        <StatCard
          label="Active"
          value={stats?.activeCoupons ?? 0}
          icon={CheckCircle2}
          iconClass="bg-primary-50 text-primary-600"
          trend={stats ? { value: `${stats.scheduledCoupons} scheduled`, positive: true } : null}
          loading={!stats}
        />
        <StatCard label="Redemptions" value={stats?.totalRedemptions ?? 0} icon={Users} iconClass="bg-blue-50 text-blue-600" loading={!stats} />
        <StatCard label="Discount Given" value={stats ? formatCompactCurrency(stats.totalDiscountGiven) : '—'} icon={Wallet} iconClass="bg-rose-50 text-rose-600" loading={!stats} />
        <StatCard label="Coupon Revenue" value={stats ? formatCompactCurrency(stats.couponRevenue) : '—'} icon={TrendingUp} iconClass="bg-violet-50 text-violet-600" loading={!stats} />
        <StatCard label="Expiring Soon" value={stats?.expiringSoon ?? 0} icon={Clock} iconClass="bg-amber-50 text-amber-600" loading={!stats} />
      </div>

      {/* Expiring-soon banner */}
      {stats && stats.expiringSoon > 0 && (
        <button
          onClick={() => { table.setFilter('status', 'active'); table.setSort('ends_at'); }}
          className="w-full flex items-center gap-3 mb-5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100 text-left hover:bg-amber-100/70 transition-colors"
        >
          <Clock size={18} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{stats.expiringSoon} active coupon{stats.expiringSoon === 1 ? '' : 's'}</span> expiring within 7 days.{' '}
            <span className="font-medium underline">Review them →</span>
          </p>
        </button>
      )}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <SearchInput value={table.search} onChange={table.setSearch} placeholder="Search code or description…" className="flex-1" />
        <Select value={(table.filters.status as string) ?? ''} onChange={(e) => table.setFilter('status', e.target.value || undefined)} className="lg:w-44">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="scheduled">Scheduled</option>
          <option value="expired">Expired</option>
          <option value="exhausted">Exhausted</option>
          <option value="disabled">Disabled</option>
        </Select>
        <Select value={(table.filters.type as string) ?? ''} onChange={(e) => table.setFilter('type', e.target.value || undefined)} className="lg:w-40">
          <option value="">All types</option>
          <option value="percent">Percentage</option>
          <option value="fixed">Fixed amount</option>
        </Select>
      </div>

      <DataTable
        table={table}
        columns={columns}
        selectable={canManage}
        onRowClick={canManage ? openEdit : undefined}
        emptyTitle="No coupons yet"
        emptyMessage="Create your first discount code to start running promotions."
        emptyAction={canManage ? <Button icon={<Plus size={16} />} onClick={openCreate}>New Coupon</Button> : null}
      />

      <BulkActionBar count={table.selected.size} onClear={table.clearSelection}>
        <Button size="sm" variant="secondary" icon={<Power size={14} />} onClick={() => runBulk('enable')}>Activate</Button>
        <Button size="sm" variant="outline" icon={<Power size={14} />} onClick={() => runBulk('disable')}>Disable</Button>
        <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => runBulk('delete')}>Delete</Button>
      </BulkActionBar>

      {formOpen && (
        <CouponModal
          coupon={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => { setFormOpen(false); refreshAll(); }}
          onError={(m) => toast.error(m)}
          onSuccess={(m) => toast.success(m)}
        />
      )}
    </div>
  );
}

/* ============================== Coupon modal ============================= */

const emptyForm = {
  code: '', description: '', type: 'percent' as 'percent' | 'fixed', value: 0,
  min_order: 0, max_discount: '' as number | '', usage_limit: '' as number | '',
  starts_at: '', ends_at: '', is_active: true,
};

function CouponModal({
  coupon, onClose, onSaved, onError, onSuccess,
}: {
  coupon: CouponRow | null;
  onClose: () => void;
  onSaved: () => void;
  onError: (m: string) => void;
  onSuccess: (m: string) => void;
}) {
  const [form, setForm] = useState(
    coupon
      ? {
          code: coupon.code, description: coupon.description ?? '', type: coupon.type, value: coupon.value,
          min_order: coupon.min_order, max_discount: coupon.max_discount ?? '' as number | '',
          usage_limit: coupon.usage_limit ?? '' as number | '',
          starts_at: coupon.starts_at?.slice(0, 10) ?? '', ends_at: coupon.ends_at?.slice(0, 10) ?? '',
          is_active: coupon.is_active,
        }
      : { ...emptyForm }
  );
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  // Client-side validation mirroring the backend rules.
  const errors: Record<string, string> = {};
  if (!form.code.trim()) errors.code = 'Code is required';
  if (form.value <= 0) errors.value = 'Value must be greater than 0';
  if (form.type === 'percent' && form.value > 100) errors.value = 'Percentage cannot exceed 100';
  if (form.starts_at && form.ends_at && form.ends_at < form.starts_at) errors.ends_at = 'End date must be after the start date';
  const valid = Object.keys(errors).length === 0;

  const previewLabel =
    form.value > 0
      ? form.type === 'percent'
        ? `${form.value}% off${form.max_discount ? ` up to ${formatCurrency(Number(form.max_discount))}` : ''}`
        : `${formatCurrency(form.value)} off`
      : 'Set a discount value';

  const save = async () => {
    if (!valid) return onError(Object.values(errors)[0]);
    setSaving(true);
    try {
      const payload: CouponInput = {
        code: form.code.toUpperCase().trim(),
        description: form.description || null,
        type: form.type,
        value: Number(form.value),
        min_order: Number(form.min_order) || 0,
        max_discount: form.max_discount === '' ? null : Number(form.max_discount),
        usage_limit: form.usage_limit === '' ? null : Number(form.usage_limit),
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
        is_active: form.is_active,
      };
      if (coupon) await updateCoupon(coupon.id, payload);
      else await createCoupon(payload);
      onSuccess(coupon ? 'Coupon updated' : 'Coupon created');
      onSaved();
    } catch (err: any) {
      onError(err?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={coupon ? 'Edit Coupon' : 'New Coupon'}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={saving} disabled={!valid}>Save</Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Live preview */}
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-accent-200 bg-accent-50/50 px-4 py-3">
          <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center flex-shrink-0">
            <Tag size={18} className="text-accent-500" />
          </div>
          <div className="min-w-0">
            <p className="font-mono font-bold text-neutral-800">{form.code.trim() || 'CODE'}</p>
            <p className="text-xs text-neutral-500">{previewLabel}{Number(form.min_order) > 0 ? ` · min ${formatCurrency(Number(form.min_order))}` : ''}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Code" required error={errors.code}>
            <Input value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="FRESH10" className="font-mono" />
          </FormField>
          <FormField label="Type">
            <Select value={form.type} onChange={(e) => set('type', e.target.value as 'percent' | 'fixed')}>
              <option value="percent">Percentage</option>
              <option value="fixed">Fixed amount</option>
            </Select>
          </FormField>
        </div>

        <FormField label="Description">
          <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Shown to customers and staff" />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label={form.type === 'percent' ? 'Value (%)' : 'Value (₹)'} required error={errors.value}>
            <Input type="number" min={0} value={form.value} onChange={(e) => set('value', Number(e.target.value))} />
          </FormField>
          <FormField label="Min order (₹)">
            <Input type="number" min={0} value={form.min_order} onChange={(e) => set('min_order', Number(e.target.value))} />
          </FormField>
          {form.type === 'percent' && (
            <FormField label="Max discount (₹)" hint="Caps a % coupon">
              <Input type="number" min={0} value={form.max_discount} onChange={(e) => set('max_discount', e.target.value === '' ? '' : Number(e.target.value))} />
            </FormField>
          )}
          <FormField label="Usage limit" hint="Blank = unlimited">
            <Input type="number" min={0} value={form.usage_limit} onChange={(e) => set('usage_limit', e.target.value === '' ? '' : Number(e.target.value))} />
          </FormField>
          <FormField label="Starts">
            <Input type="date" value={form.starts_at} onChange={(e) => set('starts_at', e.target.value)} />
          </FormField>
          <FormField label="Ends" error={errors.ends_at}>
            <Input type="date" value={form.ends_at} onChange={(e) => set('ends_at', e.target.value)} />
          </FormField>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
          <div className="flex items-center gap-2">
            {form.is_active ? <CheckCircle2 size={16} className="text-primary-600" /> : <AlertTriangle size={16} className="text-neutral-400" />}
            <span className="text-sm text-neutral-600">{form.is_active ? 'Active — customers can redeem this code' : 'Disabled — code cannot be redeemed'}</span>
          </div>
          <Switch checked={form.is_active} onChange={(v) => set('is_active', v)} />
        </div>
      </div>
    </Modal>
  );
}
