import React, { useState, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, Truck, MapPin, Clock, Users, Wallet, Download, RefreshCw,
  Power, AlertTriangle, CheckCircle2, Layers, Gift,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import DataTable, { Column } from '../../components/ui/DataTable';
import BulkActionBar from '../../components/ui/BulkActionBar';
import Modal from '../../components/ui/Modal';
import FormField, { Input, Select, Switch } from '../../components/ui/FormField';
import { useTable } from '../../hooks/useTable';
import { useToast } from '../../hooks/useToast';
import { useConfirm } from '../../hooks/useConfirm';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useAsync } from '../../hooks/useAsync';
import {
  listDeliveryZones,
  getDeliveryStats,
  createDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
  bulkSetActive,
  bulkDeleteZones,
  exportZonesCsv,
  type DeliveryZoneRow,
  type DeliveryStats,
  type DeliveryZoneInput,
} from '../../lib/services/delivery.service';
import { formatCurrency } from '../../lib/format';

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

const parsePincodes = (raw: string) => [...new Set(raw.split(/[,\s]+/).map((p) => p.trim()).filter(Boolean))];

/* ================================ Page ================================== */

export default function DeliveryPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { can } = useAdminAuth();

  const table = useTable<DeliveryZoneRow>(listDeliveryZones, { initialSortBy: 'name', initialSortDir: 'asc' });
  const { data: stats, reload: reloadStats } = useAsync(() => getDeliveryStats(), []);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DeliveryZoneRow | null>(null);
  const [exporting, setExporting] = useState(false);

  const canManage = can('delivery.manage');

  const refreshAll = useCallback(() => {
    table.refresh();
    reloadStats();
  }, [table, reloadStats]);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (z: DeliveryZoneRow) => { setEditing(z); setFormOpen(true); };

  const handleDelete = useCallback(
    async (z: DeliveryZoneRow) => {
      const ok = await confirm({ title: 'Delete zone', message: `Delete "${z.name}"? This cannot be undone.`, danger: true, confirmLabel: 'Delete' });
      if (!ok) return;
      try {
        await deleteDeliveryZone(z.id);
        toast.success('Zone deleted');
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
        const ok = await confirm({ title: 'Delete zones', message: `Delete ${ids.length} selected zones?`, danger: true, confirmLabel: 'Delete' });
        if (!ok) return;
        await bulkDeleteZones(ids);
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
      const csv = await exportZonesCsv({ search: table.search, sortBy: table.sortBy, sortDir: table.sortDir, filters: table.filters });
      downloadCsv(`delivery-zones-${new Date().toISOString().slice(0, 10)}.csv`, csv);
      toast.success('Export ready');
    } catch (err: any) {
      toast.error(err?.message ?? 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const columns: Column<DeliveryZoneRow>[] = [
    {
      key: 'name',
      header: 'Zone',
      sortable: true,
      render: (z) => (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0"><Truck size={16} className="text-primary-600" /></div>
          <div className="min-w-0">
            <p className="font-semibold text-neutral-800 truncate max-w-[200px]">{z.name}</p>
            <p className="text-xs text-neutral-400 inline-flex items-center gap-1"><MapPin size={11} /> {z.pincode_count} pincode{z.pincode_count === 1 ? '' : 's'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'fee',
      header: 'Fee',
      sortable: true,
      render: (z) => (
        <div>
          <p className="font-semibold text-neutral-800">{z.fee === 0 ? 'Free' : formatCurrency(z.fee)}</p>
          {z.free_above != null && <p className="text-[11px] text-primary-600 inline-flex items-center gap-0.5"><Gift size={10} /> free &gt; {formatCurrency(z.free_above)}</p>}
        </div>
      ),
    },
    { key: 'min_order', header: 'Min Order', sortable: true, render: (z) => (z.min_order > 0 ? formatCurrency(z.min_order) : <span className="text-neutral-400">—</span>) },
    { key: 'eta_minutes', header: 'ETA', sortable: true, render: (z) => <span className="inline-flex items-center gap-1 text-neutral-600"><Clock size={13} className="text-neutral-400" /> {z.eta_minutes} min</span> },
    {
      key: 'customers_covered',
      header: 'Coverage',
      sortable: true,
      render: (z) =>
        z.addresses_covered > 0 ? (
          <div>
            <p className="text-sm text-neutral-700 inline-flex items-center gap-1"><Users size={12} className="text-neutral-400" /> {z.customers_covered} customer{z.customers_covered === 1 ? '' : 's'}</p>
            <p className="text-[11px] text-neutral-400">{z.addresses_covered} address{z.addresses_covered === 1 ? '' : 'es'}</p>
          </div>
        ) : <span className="text-neutral-300 text-sm">No customers yet</span>,
    },
    { key: 'is_active', header: 'Status', render: (z) => (z.is_active ? <Badge className="bg-primary-100 text-primary-700">Active</Badge> : <Badge className="bg-neutral-200 text-neutral-600">Off</Badge>) },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (z) =>
        canManage ? (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => openEdit(z)} className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100" aria-label="Edit"><Pencil size={15} /></button>
            <button onClick={() => handleDelete(z)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50" aria-label="Delete"><Trash2 size={15} /></button>
          </div>
        ) : <span className="text-neutral-300">—</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Delivery & Shipping"
        subtitle="Configure delivery zones, fees and ETAs — and monitor real serviceability coverage."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={<RefreshCw size={15} />} onClick={refreshAll}>Refresh</Button>
            <Button variant="outline" icon={<Download size={16} />} onClick={handleExport} loading={exporting}>Export</Button>
            {canManage && <Button icon={<Plus size={16} />} onClick={openCreate}>New Zone</Button>}
          </div>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-5">
        <StatCard label="Total Zones" value={stats?.totalZones ?? 0} icon={Truck} loading={!stats} />
        <StatCard label="Active Zones" value={stats?.activeZones ?? 0} icon={CheckCircle2} iconClass="bg-primary-50 text-primary-600" trend={stats ? { value: `${stats.inactiveZones} off`, positive: stats.inactiveZones === 0 } : null} loading={!stats} />
        <StatCard label="Customers Reachable" value={stats?.customersCovered ?? 0} icon={Users} iconClass="bg-blue-50 text-blue-600" loading={!stats} />
        <StatCard label="Pincodes Covered" value={stats?.activePincodesCovered ?? 0} icon={MapPin} iconClass="bg-violet-50 text-violet-600" loading={!stats} />
        <StatCard label="Avg Fee" value={stats ? formatCurrency(stats.avgFee) : '—'} icon={Wallet} iconClass="bg-amber-50 text-amber-600" loading={!stats} />
        <StatCard label="Avg ETA" value={stats ? `${stats.avgEta} min` : '—'} icon={Clock} iconClass="bg-cyan-50 text-cyan-600" loading={!stats} />
      </div>

      {/* Coverage insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <InsightCard
          icon={AlertTriangle}
          tone="amber"
          title="Uncovered customer demand"
          subtitle="Pincodes with customers but no active zone"
          count={stats?.uncoveredPincodeCount ?? 0}
          emptyText="Every customer pincode is served by an active zone."
        >
          {(stats?.uncoveredSample ?? []).map((u) => (
            <div key={u.pincode} className="flex items-center justify-between py-1.5">
              <span className="font-mono text-sm text-neutral-700">{u.pincode}</span>
              <span className="text-xs text-neutral-400">{u.customers} customer{u.customers === 1 ? '' : 's'} · {u.addresses} address{u.addresses === 1 ? '' : 'es'}</span>
            </div>
          ))}
        </InsightCard>

        <InsightCard
          icon={Layers}
          tone="rose"
          title="Overlapping pincodes"
          subtitle="Pincodes assigned to more than one zone"
          count={stats?.duplicatePincodeCount ?? 0}
          emptyText="No pincode is claimed by more than one zone."
        >
          {(stats?.duplicateSample ?? []).map((d) => (
            <div key={d.pincode} className="flex items-center justify-between py-1.5">
              <span className="font-mono text-sm text-neutral-700">{d.pincode}</span>
              <span className="text-xs text-rose-500">in {d.zones} zones</span>
            </div>
          ))}
        </InsightCard>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <SearchInput value={table.search} onChange={table.setSearch} placeholder="Search zones…" className="flex-1" />
        <Select value={(table.filters.is_active as string) ?? ''} onChange={(e) => table.setFilter('is_active', e.target.value === '' ? undefined : e.target.value === 'true')} className="lg:w-40">
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </Select>
      </div>

      <DataTable
        table={table}
        columns={columns}
        selectable={canManage}
        onRowClick={canManage ? openEdit : undefined}
        emptyTitle="No delivery zones"
        emptyMessage="Add a zone to define delivery fees, ETAs and serviceable pincodes."
        emptyAction={canManage ? <Button icon={<Plus size={16} />} onClick={openCreate}>New Zone</Button> : null}
      />

      <BulkActionBar count={table.selected.size} onClear={table.clearSelection}>
        <Button size="sm" variant="secondary" icon={<Power size={14} />} onClick={() => runBulk('enable')}>Activate</Button>
        <Button size="sm" variant="outline" icon={<Power size={14} />} onClick={() => runBulk('disable')}>Disable</Button>
        <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => runBulk('delete')}>Delete</Button>
      </BulkActionBar>

      {formOpen && (
        <ZoneModal
          zone={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => { setFormOpen(false); refreshAll(); }}
          onError={(m) => toast.error(m)}
          onSuccess={(m) => toast.success(m)}
        />
      )}
    </div>
  );
}

/* ============================ Insight card ============================== */

const TONE: Record<string, { wrap: string; icon: string; badge: string }> = {
  amber: { wrap: 'border-amber-100', icon: 'bg-amber-50 text-amber-600', badge: 'bg-amber-100 text-amber-700' },
  rose: { wrap: 'border-rose-100', icon: 'bg-rose-50 text-rose-600', badge: 'bg-rose-100 text-rose-700' },
};

function InsightCard({
  icon: Icon, tone, title, subtitle, count, emptyText, children,
}: {
  icon: typeof AlertTriangle;
  tone: keyof typeof TONE;
  title: string;
  subtitle: string;
  count: number;
  emptyText: string;
  children: React.ReactNode;
}) {
  const t = TONE[tone];
  return (
    <div className={`bg-white rounded-2xl shadow-card p-5 border ${count > 0 ? t.wrap : 'border-transparent'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${count > 0 ? t.icon : 'bg-neutral-100 text-neutral-400'}`}>
            {count > 0 ? <Icon size={16} /> : <CheckCircle2 size={16} />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-800">{title}</h3>
            <p className="text-[11px] text-neutral-400">{subtitle}</p>
          </div>
        </div>
        {count > 0 && <span className={`text-xs font-bold px-2 py-1 rounded-full ${t.badge}`}>{count}</span>}
      </div>
      {count === 0 ? (
        <p className="text-sm text-neutral-400 inline-flex items-center gap-1.5"><CheckCircle2 size={14} className="text-primary-500" /> {emptyText}</p>
      ) : (
        <div className="divide-y divide-neutral-50">{children}</div>
      )}
    </div>
  );
}

/* ============================== Zone modal ============================== */

const emptyForm = { name: '', pincodes: '', fee: 0, min_order: 0, free_above: '' as number | '', eta_minutes: 30, is_active: true };

function ZoneModal({
  zone, onClose, onSaved, onError, onSuccess,
}: {
  zone: DeliveryZoneRow | null;
  onClose: () => void;
  onSaved: () => void;
  onError: (m: string) => void;
  onSuccess: (m: string) => void;
}) {
  const [form, setForm] = useState(
    zone
      ? { name: zone.name, pincodes: zone.pincodes.join(', '), fee: zone.fee, min_order: zone.min_order, free_above: zone.free_above ?? ('' as number | ''), eta_minutes: zone.eta_minutes, is_active: zone.is_active }
      : { ...emptyForm }
  );
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const pincodes = parsePincodes(form.pincodes);

  const errors: Record<string, string> = {};
  if (!form.name.trim()) errors.name = 'Zone name is required';
  if (form.free_above !== '' && Number(form.free_above) < Number(form.min_order)) {
    errors.free_above = 'Free-above threshold should be at least the minimum order';
  }
  const valid = Object.keys(errors).length === 0;

  const save = async () => {
    if (!valid) return onError(Object.values(errors)[0]);
    setSaving(true);
    try {
      const payload: DeliveryZoneInput = {
        name: form.name.trim(),
        pincodes,
        fee: Number(form.fee) || 0,
        min_order: Number(form.min_order) || 0,
        free_above: form.free_above === '' ? null : Number(form.free_above),
        eta_minutes: Number(form.eta_minutes) || 30,
        is_active: form.is_active,
      };
      if (zone) await updateDeliveryZone(zone.id, payload);
      else await createDeliveryZone(payload);
      onSuccess(zone ? 'Zone updated' : 'Zone created');
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
      title={zone ? 'Edit Zone' : 'New Zone'}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={saving} disabled={!valid}>Save</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <FormField label="Zone name" required error={errors.name}>
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Central Bengaluru" />
        </FormField>

        <FormField label="Pincodes" hint={`${pincodes.length} pincode${pincodes.length === 1 ? '' : 's'} · separate with commas or spaces`}>
          <Input value={form.pincodes} onChange={(e) => set('pincodes', e.target.value)} placeholder="560001, 560002" />
        </FormField>
        {pincodes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 -mt-1">
            {pincodes.slice(0, 20).map((p) => (
              <span key={p} className="text-[11px] font-mono bg-neutral-100 text-neutral-600 rounded-md px-1.5 py-0.5">{p}</span>
            ))}
            {pincodes.length > 20 && <span className="text-[11px] text-neutral-400 px-1">+{pincodes.length - 20} more</span>}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Delivery fee (₹)" hint="0 = free delivery">
            <Input type="number" min={0} value={form.fee} onChange={(e) => set('fee', Number(e.target.value))} />
          </FormField>
          <FormField label="Min order (₹)">
            <Input type="number" min={0} value={form.min_order} onChange={(e) => set('min_order', Number(e.target.value))} />
          </FormField>
          <FormField label="Free above (₹)" hint="Waive fee over this" error={errors.free_above}>
            <Input type="number" min={0} value={form.free_above} onChange={(e) => set('free_above', e.target.value === '' ? '' : Number(e.target.value))} />
          </FormField>
          <FormField label="ETA (minutes)">
            <Input type="number" min={1} value={form.eta_minutes} onChange={(e) => set('eta_minutes', Number(e.target.value))} />
          </FormField>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
          <div className="flex items-center gap-2">
            {form.is_active ? <CheckCircle2 size={16} className="text-primary-600" /> : <AlertTriangle size={16} className="text-neutral-400" />}
            <span className="text-sm text-neutral-600">{form.is_active ? 'Active — delivering to these pincodes' : 'Inactive — not serviceable'}</span>
          </div>
          <Switch checked={form.is_active} onChange={(v) => set('is_active', v)} />
        </div>
      </div>
    </Modal>
  );
}
