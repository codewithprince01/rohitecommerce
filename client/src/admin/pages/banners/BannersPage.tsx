import React, { useCallback, useState } from 'react';
import {
  Plus, Pencil, Trash2, ImageOff, Copy, ArrowUp, ArrowDown, Eye, EyeOff,
  LayoutTemplate, Clock, CalendarClock, AlertTriangle, CheckCircle2,
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
import ImageUrlInput from '../../components/ui/ImageUrlInput';
import { useTable } from '../../hooks/useTable';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { useConfirm } from '../../hooks/useConfirm';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  listBanners,
  getBannerStats,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
  bulkBanners,
  type BannerRow,
  type BannerStatus,
} from '../../lib/services/banners.service';
import { formatDate } from '../../lib/format';
import type { BannerLinkType } from '../../lib/types';

const POSITIONS = [
  { value: 'home_hero', label: 'Home — Hero' },
  { value: 'home_strip', label: 'Home — Strip' },
  { value: 'category_top', label: 'Category — Top' },
];
const positionLabel = (p: string) => POSITIONS.find((x) => x.value === p)?.label ?? p;

const BG_PRESETS = [
  'bg-primary-500', 'bg-green-500', 'bg-orange-400', 'bg-blue-500',
  'bg-rose-500', 'bg-violet-500', 'bg-amber-500', 'bg-cyan-500', 'bg-neutral-800',
];

const STATUS_BADGE: Record<BannerStatus, { label: string; cls: string }> = {
  live: { label: 'Live', cls: 'bg-primary-100 text-primary-700' },
  scheduled: { label: 'Scheduled', cls: 'bg-blue-100 text-blue-700' },
  expired: { label: 'Expired', cls: 'bg-rose-100 text-rose-700' },
  hidden: { label: 'Hidden', cls: 'bg-neutral-200 text-neutral-600' },
};

const LINK_TYPES: BannerLinkType[] = ['none', 'category', 'subcategory', 'brand', 'product', 'url'];

const empty = {
  title: '', subtitle: '', image: '', bg_color: 'bg-primary-500',
  link_type: 'none' as BannerLinkType, link_value: '', position: 'home_hero',
  sort_order: 0, starts_at: '', ends_at: '', is_active: true,
};

// ISO → value for <input type="datetime-local">
function toLocalInput(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function BannerPreview({ form }: { form: typeof empty }) {
  return (
    <div className={`rounded-xl overflow-hidden ${form.bg_color || 'bg-primary-500'} p-5 flex items-center gap-4 min-h-[128px]`}>
      <div className="flex-1 text-white">
        <h3 className="font-bold text-lg leading-tight">{form.title || 'Banner title'}</h3>
        {form.subtitle && <p className="text-white/80 text-sm mt-1">{form.subtitle}</p>}
        <span className="inline-block mt-3 bg-white/90 text-neutral-800 text-xs font-semibold px-4 py-1.5 rounded-lg">
          Shop Now
        </span>
      </div>
      <div className="w-32 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-white/20 flex items-center justify-center">
        {form.image ? (
          <img src={form.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImageOff size={18} className="text-white/70" />
        )}
      </div>
    </div>
  );
}

export default function BannersPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { can } = useAdminAuth();
  const table = useTable<BannerRow>(listBanners, { initialSortBy: 'sort_order', initialSortDir: 'asc' });
  const { data: stats, reload: reloadStats } = useAsync(() => getBannerStats(), []);
  const canManage = can('banners.manage');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BannerRow | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);

  const refreshAll = useCallback(() => {
    table.refresh();
    reloadStats();
  }, [table, reloadStats]);

  const openModal = (b: BannerRow | null) => {
    setEditing(b);
    setForm(
      b
        ? {
            title: b.title, subtitle: b.subtitle ?? '', image: b.image ?? '', bg_color: b.bg_color,
            link_type: b.link_type, link_value: b.link_value ?? '', position: b.position,
            sort_order: b.sort_order, starts_at: toLocalInput(b.starts_at), ends_at: toLocalInput(b.ends_at),
            is_active: b.is_active,
          }
        : { ...empty }
    );
    setOpen(true);
  };

  const duplicate = (b: BannerRow) => {
    setEditing(null);
    setForm({
      title: `${b.title} (copy)`, subtitle: b.subtitle ?? '', image: b.image ?? '', bg_color: b.bg_color,
      link_type: b.link_type, link_value: b.link_value ?? '', position: b.position,
      sort_order: b.sort_order + 1, starts_at: toLocalInput(b.starts_at), ends_at: toLocalInput(b.ends_at),
      is_active: b.is_active,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) return toast.error('Title is required');
    if (form.starts_at && form.ends_at && new Date(form.ends_at) < new Date(form.starts_at)) {
      return toast.error('End date must be after the start date');
    }
    setSaving(true);
    try {
      if (editing) await updateBanner(editing.id, form);
      else await createBanner(form);
      toast.success(editing ? 'Banner updated' : 'Banner created');
      setOpen(false);
      refreshAll();
    } catch (err: any) {
      toast.error(err?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const del = async (b: BannerRow) => {
    const ok = await confirm({ title: 'Delete banner', message: `Delete "${b.title}"? This cannot be undone.`, danger: true, confirmLabel: 'Delete' });
    if (!ok) return;
    try {
      await deleteBanner(b.id);
      toast.success('Banner deleted');
      refreshAll();
    } catch (err: any) {
      toast.error(err?.message ?? 'Delete failed');
    }
  };

  const toggleActive = async (b: BannerRow) => {
    try {
      await updateBanner(b.id, { ...b, is_active: !b.is_active });
      toast.success(b.is_active ? 'Banner hidden' : 'Banner activated');
      refreshAll();
    } catch (err: any) {
      toast.error(err?.message ?? 'Update failed');
    }
  };

  const canReorder = (table.sortBy ?? 'sort_order') === 'sort_order';
  const move = async (index: number, dir: 'up' | 'down') => {
    const rows = table.rows;
    const j = dir === 'up' ? index - 1 : index + 1;
    if (j < 0 || j >= rows.length) return;
    const arr = [...rows];
    [arr[index], arr[j]] = [arr[j], arr[index]];
    try {
      await reorderBanners(arr.map((b, i) => ({ id: b.id, sort_order: i })));
      refreshAll();
    } catch (err: any) {
      toast.error(err?.message ?? 'Reorder failed');
    }
  };

  const runBulk = async (action: 'activate' | 'deactivate' | 'delete') => {
    const ids = [...table.selected];
    if (!ids.length) return;
    try {
      if (action === 'delete') {
        const ok = await confirm({
          title: 'Delete banners',
          message: `Delete ${ids.length} selected banner${ids.length === 1 ? '' : 's'}?`,
          danger: true, confirmLabel: 'Delete',
        });
        if (!ok) return;
      }
      await bulkBanners(ids, action);
      toast.success('Bulk action applied');
      table.clearSelection();
      refreshAll();
    } catch (err: any) {
      toast.error(err?.message ?? 'Bulk action failed');
    }
  };

  const activeFilters = !!table.search || !!table.filters.position || !!table.filters.is_active;
  const clearFilters = () => {
    table.setSearch('');
    table.setFilter('position', undefined);
    table.setFilter('is_active', undefined);
  };

  const columns: Column<BannerRow>[] = [
    ...(canManage && canReorder
      ? [{
          key: 'reorder',
          header: '',
          className: 'w-12',
          render: (b: BannerRow) => {
            const idx = table.rows.findIndex((r) => r.id === b.id);
            return (
              <div className="flex flex-col -my-1" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => move(idx, 'up')} disabled={idx === 0} className="text-neutral-400 hover:text-neutral-700 disabled:opacity-30" aria-label="Move up">
                  <ArrowUp size={14} />
                </button>
                <button onClick={() => move(idx, 'down')} disabled={idx === table.rows.length - 1} className="text-neutral-400 hover:text-neutral-700 disabled:opacity-30" aria-label="Move down">
                  <ArrowDown size={14} />
                </button>
              </div>
            );
          },
        } as Column<BannerRow>]
      : []),
    {
      key: 'title',
      header: 'Banner',
      render: (b) => (
        <div className="flex items-center gap-3">
          <div className={`w-16 h-10 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 ${b.image ? 'bg-neutral-100' : b.bg_color || 'bg-primary-500'}`}>
            {b.image ? <img src={b.image} alt="" className="w-full h-full object-cover" /> : <LayoutTemplate size={15} className="text-white/80" />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-neutral-800 truncate max-w-[220px]">{b.title}</p>
            <p className="text-xs text-neutral-400 truncate max-w-[220px]">{b.subtitle ?? '—'}</p>
          </div>
        </div>
      ),
    },
    { key: 'position', header: 'Position', sortable: true, render: (b) => <span className="text-neutral-600 text-sm">{positionLabel(b.position)}</span> },
    {
      key: 'link',
      header: 'Link',
      render: (b) => (b.link_type === 'none' ? <span className="text-neutral-300">—</span> : <span className="text-neutral-600 text-xs"><span className="font-medium">{b.link_type}</span>: {b.link_value}</span>),
    },
    {
      key: 'schedule',
      header: 'Schedule',
      render: (b) =>
        b.starts_at || b.ends_at ? (
          <span className="text-xs text-neutral-500 flex items-center gap-1">
            <CalendarClock size={12} />
            {b.starts_at ? formatDate(b.starts_at) : '…'} – {b.ends_at ? formatDate(b.ends_at) : '∞'}
          </span>
        ) : (
          <span className="text-neutral-300 text-xs">Always on</span>
        ),
    },
    { key: 'status', header: 'Status', render: (b) => <Badge className={STATUS_BADGE[b.status].cls}>{STATUS_BADGE[b.status].label}</Badge> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (b) =>
        canManage ? (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => toggleActive(b)} className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100" title={b.is_active ? 'Hide' : 'Activate'}>
              {b.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
            <button onClick={() => duplicate(b)} className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100" title="Duplicate"><Copy size={15} /></button>
            <button onClick={() => openModal(b)} className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100" title="Edit"><Pencil size={15} /></button>
            <button onClick={() => del(b)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50" title="Delete"><Trash2 size={15} /></button>
          </div>
        ) : <span className="text-neutral-300">—</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Banners"
        subtitle="Manage promotional banners shown across the storefront."
        actions={canManage ? <Button icon={<Plus size={16} />} onClick={() => openModal(null)}>New Banner</Button> : null}
      />

      {/* KPI cards — real banner metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
        <StatCard label="Total Banners" value={stats?.total ?? 0} icon={LayoutTemplate} loading={!stats} />
        <StatCard label="Live Now" value={stats?.live ?? 0} icon={CheckCircle2} iconClass="bg-primary-50 text-primary-600" loading={!stats} />
        <StatCard label="Scheduled" value={stats?.scheduled ?? 0} icon={Clock} iconClass="bg-blue-50 text-blue-600" loading={!stats} />
        <StatCard label="Expired" value={stats?.expired ?? 0} icon={AlertTriangle} iconClass="bg-rose-50 text-rose-600" loading={!stats} />
        <StatCard label="Hidden" value={stats?.hidden ?? 0} icon={EyeOff} iconClass="bg-neutral-100 text-neutral-500" loading={!stats} />
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <SearchInput value={table.search} onChange={table.setSearch} placeholder="Search banners…" className="flex-1" />
        <Select value={(table.filters.position as string) ?? ''} onChange={(e) => table.setFilter('position', e.target.value || undefined)} className="lg:w-48">
          <option value="">All positions</option>
          {POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </Select>
        <Select
          value={(table.filters.is_active as string) ?? ''}
          onChange={(e) => table.setFilter('is_active', e.target.value === '' ? undefined : e.target.value === 'true')}
          className="lg:w-36"
        >
          <option value="">All status</option>
          <option value="true">Active</option>
          <option value="false">Hidden</option>
        </Select>
        {activeFilters && <Button variant="ghost" onClick={clearFilters}>Clear</Button>}
      </div>

      <DataTable
        table={table}
        columns={columns}
        selectable={canManage}
        onRowClick={canManage ? openModal : undefined}
        emptyTitle="No banners yet"
        emptyMessage="Create a banner to promote offers on your storefront."
        emptyAction={canManage ? <Button icon={<Plus size={16} />} onClick={() => openModal(null)}>New Banner</Button> : null}
      />

      {canManage && (
        <BulkActionBar count={table.selected.size} onClear={table.clearSelection}>
          <Button size="sm" variant="secondary" icon={<Eye size={14} />} onClick={() => runBulk('activate')}>Activate</Button>
          <Button size="sm" variant="outline" icon={<EyeOff size={14} />} onClick={() => runBulk('deactivate')}>Hide</Button>
          <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => runBulk('delete')}>Delete</Button>
        </BulkActionBar>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit Banner' : 'New Banner'}
        size="lg"
        footer={<div className="flex justify-end gap-3"><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} loading={saving}>Save</Button></div>}
      >
        <div className="space-y-4">
          {/* Live preview */}
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">Live preview</p>
            <BannerPreview form={form} />
          </div>

          <FormField label="Title" required>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Fresh Vegetables — up to 40% off" />
          </FormField>
          <FormField label="Subtitle">
            <Textarea value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          </FormField>
          <FormField label="Image URL">
            <ImageUrlInput value={form.image} onChange={(v) => setForm({ ...form, image: v })} />
          </FormField>

          <FormField label="Background">
            <div className="flex flex-wrap items-center gap-2">
              {BG_PRESETS.map((bg) => (
                <button
                  key={bg}
                  type="button"
                  onClick={() => setForm({ ...form, bg_color: bg })}
                  className={`w-8 h-8 rounded-lg ${bg} ring-2 ring-offset-2 transition-all ${form.bg_color === bg ? 'ring-neutral-800' : 'ring-transparent'}`}
                  aria-label={bg}
                />
              ))}
              <Input value={form.bg_color} onChange={(e) => setForm({ ...form, bg_color: e.target.value })} className="!w-44" placeholder="bg-class" />
            </div>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Position">
              <Select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
                {POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </Select>
            </FormField>
            <FormField label="Sort order" hint="Lower shows first">
              <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
            </FormField>
            <FormField label="Link type">
              <Select value={form.link_type} onChange={(e) => setForm({ ...form, link_type: e.target.value as BannerLinkType })}>
                {LINK_TYPES.map((t) => <option key={t} value={t}>{t === 'none' ? 'None' : t === 'url' ? 'External URL' : t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </Select>
            </FormField>
            <FormField label="Link value" hint="slug, id or URL">
              <Input value={form.link_value} onChange={(e) => setForm({ ...form, link_value: e.target.value })} disabled={form.link_type === 'none'} />
            </FormField>
            <FormField label="Starts at" hint="Optional">
              <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
            </FormField>
            <FormField label="Ends at" hint="Optional">
              <Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
            </FormField>
          </div>

          <div className="flex items-center pt-1">
            <Switch checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} label="Active" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
