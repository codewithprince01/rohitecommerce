import React, { useState } from 'react';
import {
  Plus, Pencil, Trash2, ImageOff, RefreshCw, Layers, FolderTree, Tag, Package,
  AlertTriangle, TrendingUp,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import DataTable, { Column } from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import FormField, { Input, Select } from '../../components/ui/FormField';
import ImageUrlInput from '../../components/ui/ImageUrlInput';
import { useTable } from '../../hooks/useTable';
import { useToast } from '../../hooks/useToast';
import { useConfirm } from '../../hooks/useConfirm';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useAsync } from '../../hooks/useAsync';
import * as catalog from '../../lib/services/catalog.service';
import type { Category, Subcategory, Brand, CatalogStats } from '../../lib/services/catalog.service';

type Tab = 'categories' | 'subcategories' | 'brands';

export default function CategoriesPage() {
  const { can } = useAdminAuth();
  const [tab, setTab] = useState<Tab>('categories');
  const canManage = can('categories.manage');

  const { data: stats, loading: statsLoading, reload: reloadStats } = useAsync(() => catalog.getCatalogStats(), []);

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'categories', label: 'Categories', count: stats?.totalCategories },
    { key: 'subcategories', label: 'Subcategories', count: stats?.totalSubcategories },
    { key: 'brands', label: 'Brands', count: stats?.totalBrands },
  ];

  return (
    <div>
      <PageHeader
        title="Catalog Structure"
        subtitle="Organise the category → subcategory → brand hierarchy that powers your storefront."
        actions={
          <Button variant="outline" icon={<RefreshCw size={16} />} onClick={reloadStats}>
            Refresh
          </Button>
        }
      />

      {/* KPI cards — live catalog structure metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
        <StatCard label="Categories" value={stats?.totalCategories ?? 0} icon={Layers} loading={statsLoading} />
        <StatCard
          label="Subcategories"
          value={stats?.totalSubcategories ?? 0}
          icon={FolderTree}
          iconClass="bg-blue-50 text-blue-600"
          loading={statsLoading}
        />
        <StatCard
          label="Brands"
          value={stats?.totalBrands ?? 0}
          icon={Tag}
          iconClass="bg-indigo-50 text-indigo-600"
          loading={statsLoading}
        />
        <StatCard
          label="Products"
          value={stats?.totalProducts ?? 0}
          icon={Package}
          iconClass="bg-primary-50 text-primary-600"
          trend={stats ? { value: `${stats.avgProductsPerCategory}/category`, positive: true } : null}
          loading={statsLoading}
        />
        <StatCard
          label="Needs Attention"
          value={stats ? stats.emptyCategories + stats.emptySubcategories + stats.emptyBrands : 0}
          icon={AlertTriangle}
          iconClass="bg-amber-50 text-amber-600"
          loading={statsLoading}
        />
      </div>

      <InsightsPanel stats={stats} loading={statsLoading} />

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl shadow-card p-1 mb-4 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === t.key ? 'bg-primary-500 text-white' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {t.label}
            {t.count != null && (
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                  tab === t.key ? 'bg-white/25 text-white' : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'categories' && <CategoriesTab canManage={canManage} onMutate={reloadStats} />}
      {tab === 'subcategories' && <SubcategoriesTab canManage={canManage} onMutate={reloadStats} />}
      {tab === 'brands' && <BrandsTab canManage={canManage} onMutate={reloadStats} />}
    </div>
  );
}

/* ------------------------------ Insights panel ----------------------------- */

function InsightsPanel({ stats, loading }: { stats: CatalogStats | null; loading: boolean }) {
  if (loading && !stats) {
    return <div className="h-44 bg-white rounded-2xl shadow-card mb-5 animate-pulse" />;
  }
  if (!stats) return null;

  const top = stats.topCategories ?? [];
  const max = Math.max(1, ...top.map((c) => c.products));
  const health = [
    { label: 'Empty categories', value: stats.emptyCategories, hint: 'no products yet' },
    { label: 'Empty subcategories', value: stats.emptySubcategories, hint: 'no products yet' },
    { label: 'Empty brands', value: stats.emptyBrands, hint: 'no products yet' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
      {/* Top categories by product count */}
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-primary-600" />
          <h3 className="text-sm font-semibold text-neutral-800">Top categories by products</h3>
        </div>
        {top.length === 0 ? (
          <p className="text-sm text-neutral-400 py-6 text-center">No products in the catalog yet.</p>
        ) : (
          <div className="space-y-3">
            {top.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-neutral-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {c.image ? (
                    <img src={c.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImageOff size={12} className="text-neutral-300" />
                  )}
                </div>
                <span className="text-sm text-neutral-700 w-36 truncate flex-shrink-0">{c.name}</span>
                <div className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary-400"
                    style={{ width: `${Math.round((c.products / max) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-neutral-700 w-10 text-right flex-shrink-0">
                  {c.products}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Structure health */}
      <div className="bg-white rounded-2xl shadow-card p-5">
        <h3 className="text-sm font-semibold text-neutral-800 mb-4">Structure health</h3>
        <div className="space-y-3">
          {health.map((h) => (
            <div key={h.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-700">{h.label}</p>
                <p className="text-xs text-neutral-400">{h.hint}</p>
              </div>
              <Badge
                className={h.value > 0 ? 'bg-amber-100 text-amber-700' : 'bg-primary-100 text-primary-700'}
              >
                {h.value}
              </Badge>
            </div>
          ))}
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
            <p className="text-sm text-neutral-700">Total variants</p>
            <span className="text-sm font-semibold text-neutral-800">{stats.totalVariants}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Categories ------------------------------- */

function CategoriesTab({ canManage, onMutate }: TabProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const table = useTable<Category>(catalog.listCategories, { initialSortBy: 'sort_order', initialSortDir: 'asc' });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', image: '', bg_color: 'bg-neutral-100', sort_order: 0 });
  const [saving, setSaving] = useState(false);

  const refresh = () => {
    table.refresh();
    onMutate();
  };

  const openModal = (c: Category | null) => {
    setEditing(c);
    setForm(
      c
        ? { name: c.name, slug: c.slug, image: c.image ?? '', bg_color: c.bg_color, sort_order: c.sort_order }
        : { name: '', slug: '', image: '', bg_color: 'bg-neutral-100', sort_order: 0 }
    );
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      if (editing) await catalog.updateCategory(editing.id, form);
      else await catalog.createCategory(form);
      toast.success(editing ? 'Category updated' : 'Category created');
      setOpen(false);
      refresh();
    } catch (err: any) {
      toast.error(err?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const del = async (c: Category) => {
    const ok = await confirm({
      title: 'Delete category',
      message: cascadeMessage(c.name, [
        [c.subcategory_count, 'subcategory', 'subcategories'],
        [c.brand_count, 'brand', 'brands'],
        [c.product_count, 'product (with variants)', 'products (with their variants)'],
      ]),
      danger: true,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      await catalog.deleteCategory(c.id);
      toast.success('Category deleted');
      refresh();
    } catch (err: any) {
      toast.error(err?.message ?? 'Delete failed');
    }
  };

  const columns: Column<Category>[] = [
    {
      key: 'name',
      header: 'Category',
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-neutral-100 overflow-hidden flex items-center justify-center">
            {c.image ? <img src={c.image} alt="" className="w-full h-full object-cover" /> : <ImageOff size={15} className="text-neutral-300" />}
          </div>
          <div>
            <p className="font-semibold text-neutral-800">{c.name}</p>
            <code className="text-xs text-neutral-400">{c.slug}</code>
          </div>
        </div>
      ),
    },
    { key: 'subcategory_count', header: 'Subcats', sortable: true, render: (c) => <CountCell value={c.subcategory_count} /> },
    { key: 'brand_count', header: 'Brands', sortable: true, render: (c) => <CountCell value={c.brand_count} /> },
    { key: 'product_count', header: 'Products', sortable: true, render: (c) => <CountCell value={c.product_count} warnZero /> },
    { key: 'sort_order', header: 'Order', sortable: true, render: (c) => c.sort_order },
    { key: 'actions', header: '', className: 'text-right', render: (c) => <RowActions canManage={canManage} onEdit={() => openModal(c)} onDelete={() => del(c)} /> },
  ];

  return (
    <>
      <Toolbar table={table} canManage={canManage} onNew={() => openModal(null)} newLabel="New Category" />
      <DataTable table={table} columns={columns} onRowClick={canManage ? openModal : undefined} emptyTitle="No categories" />
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Category' : 'New Category'} footer={<ModalFooter onCancel={() => setOpen(false)} onSave={save} saving={saving} />}>
        <div className="space-y-4">
          <FormField label="Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormField>
          <FormField label="Slug" hint="Auto-generated from name if left blank">
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="snacks-namkeen" />
          </FormField>
          <FormField label="Image URL">
            <ImageUrlInput value={form.image} onChange={(v) => setForm({ ...form, image: v })} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Background class">
              <Input value={form.bg_color} onChange={(e) => setForm({ ...form, bg_color: e.target.value })} placeholder="bg-primary-100" />
            </FormField>
            <FormField label="Sort order">
              <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
            </FormField>
          </div>
        </div>
      </Modal>
    </>
  );
}

/* ----------------------------- Subcategories ----------------------------- */

function SubcategoriesTab({ canManage, onMutate }: TabProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const table = useTable<Subcategory>(catalog.listSubcategories, { initialSortBy: 'sort_order', initialSortDir: 'asc' });
  const { data: categories } = useAsync(() => catalog.allCategories(), []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subcategory | null>(null);
  const [form, setForm] = useState({ category_id: '', name: '', slug: '', image: '', sort_order: 0 });
  const [saving, setSaving] = useState(false);

  const refresh = () => {
    table.refresh();
    onMutate();
  };

  const openModal = (s: Subcategory | null) => {
    setEditing(s);
    setForm(
      s
        ? { category_id: s.category_id, name: s.name, slug: s.slug, image: s.image ?? '', sort_order: s.sort_order }
        : { category_id: '', name: '', slug: '', image: '', sort_order: 0 }
    );
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.category_id) return toast.error('Select a category');
    setSaving(true);
    try {
      if (editing) await catalog.updateSubcategory(editing.id, form);
      else await catalog.createSubcategory(form);
      toast.success(editing ? 'Subcategory updated' : 'Subcategory created');
      setOpen(false);
      refresh();
    } catch (err: any) {
      toast.error(err?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const del = async (s: Subcategory) => {
    const ok = await confirm({
      title: 'Delete subcategory',
      message: cascadeMessage(s.name, [
        [s.brand_count, 'brand', 'brands'],
        [s.product_count, 'product (with variants)', 'products (with their variants)'],
      ]),
      danger: true,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      await catalog.deleteSubcategory(s.id);
      toast.success('Subcategory deleted');
      refresh();
    } catch (err: any) {
      toast.error(err?.message ?? 'Delete failed');
    }
  };

  const columns: Column<Subcategory>[] = [
    { key: 'name', header: 'Subcategory', sortable: true, render: (s) => (
      <div>
        <p className="font-semibold text-neutral-800">{s.name}</p>
        <code className="text-xs text-neutral-400">{s.slug}</code>
      </div>
    ) },
    { key: 'category', header: 'Category', render: (s) => <span className="text-neutral-600">{s.category?.name ?? '—'}</span> },
    { key: 'brand_count', header: 'Brands', sortable: true, render: (s) => <CountCell value={s.brand_count} /> },
    { key: 'product_count', header: 'Products', sortable: true, render: (s) => <CountCell value={s.product_count} warnZero /> },
    { key: 'sort_order', header: 'Order', sortable: true, render: (s) => s.sort_order },
    { key: 'actions', header: '', className: 'text-right', render: (s) => <RowActions canManage={canManage} onEdit={() => openModal(s)} onDelete={() => del(s)} /> },
  ];

  return (
    <>
      <Toolbar table={table} canManage={canManage} onNew={() => openModal(null)} newLabel="New Subcategory">
        <Select
          value={(table.filters.category_id as string) ?? ''}
          onChange={(e) => table.setFilter('category_id', e.target.value || undefined)}
          className="sm:w-52"
        >
          <option value="">All categories</option>
          {(categories ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </Toolbar>
      <DataTable table={table} columns={columns} onRowClick={canManage ? openModal : undefined} emptyTitle="No subcategories" />
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Subcategory' : 'New Subcategory'} footer={<ModalFooter onCancel={() => setOpen(false)} onSave={save} saving={saving} />}>
        <div className="space-y-4">
          <FormField label="Category" required>
            <Select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              <option value="">Select…</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormField>
          <FormField label="Slug" hint="Auto-generated if blank">
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </FormField>
          <FormField label="Image URL">
            <ImageUrlInput value={form.image} onChange={(v) => setForm({ ...form, image: v })} />
          </FormField>
          <FormField label="Sort order">
            <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
          </FormField>
        </div>
      </Modal>
    </>
  );
}

/* -------------------------------- Brands --------------------------------- */

function BrandsTab({ canManage, onMutate }: TabProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const table = useTable<Brand>(catalog.listBrands, { initialSortBy: 'name', initialSortDir: 'asc' });
  const { data: subcategories } = useAsync(() => catalog.allSubcategories(), []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form, setForm] = useState({ subcategory_id: '', name: '', slug: '', logo: '', description: '' });
  const [saving, setSaving] = useState(false);

  const refresh = () => {
    table.refresh();
    onMutate();
  };

  const openModal = (b: Brand | null) => {
    setEditing(b);
    setForm(
      b
        ? { subcategory_id: b.subcategory_id, name: b.name, slug: b.slug, logo: b.logo ?? '', description: b.description ?? '' }
        : { subcategory_id: '', name: '', slug: '', logo: '', description: '' }
    );
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.subcategory_id) return toast.error('Select a subcategory');
    setSaving(true);
    try {
      if (editing) await catalog.updateBrand(editing.id, form);
      else await catalog.createBrand(form);
      toast.success(editing ? 'Brand updated' : 'Brand created');
      setOpen(false);
      refresh();
    } catch (err: any) {
      toast.error(err?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const del = async (b: Brand) => {
    const ok = await confirm({
      title: 'Delete brand',
      message: cascadeMessage(b.name, [[b.product_count, 'product (with variants)', 'products (with their variants)']]),
      danger: true,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      await catalog.deleteBrand(b.id);
      toast.success('Brand deleted');
      refresh();
    } catch (err: any) {
      toast.error(err?.message ?? 'Delete failed');
    }
  };

  const columns: Column<Brand>[] = [
    {
      key: 'name',
      header: 'Brand',
      sortable: true,
      render: (b) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-neutral-100 overflow-hidden flex items-center justify-center">
            {b.logo ? <img src={b.logo} alt="" className="w-full h-full object-cover" /> : <ImageOff size={15} className="text-neutral-300" />}
          </div>
          <div>
            <p className="font-semibold text-neutral-800">{b.name}</p>
            <code className="text-xs text-neutral-400">{b.slug}</code>
          </div>
        </div>
      ),
    },
    { key: 'subcategory', header: 'Subcategory', render: (b) => <span className="text-neutral-600">{b.subcategory?.name ?? '—'}</span> },
    { key: 'product_count', header: 'Products', sortable: true, render: (b) => <CountCell value={b.product_count} warnZero /> },
    { key: 'actions', header: '', className: 'text-right', render: (b) => <RowActions canManage={canManage} onEdit={() => openModal(b)} onDelete={() => del(b)} /> },
  ];

  return (
    <>
      <Toolbar table={table} canManage={canManage} onNew={() => openModal(null)} newLabel="New Brand">
        <Select
          value={(table.filters.subcategory_id as string) ?? ''}
          onChange={(e) => table.setFilter('subcategory_id', e.target.value || undefined)}
          className="sm:w-52"
        >
          <option value="">All subcategories</option>
          {(subcategories ?? []).map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </Select>
      </Toolbar>
      <DataTable table={table} columns={columns} onRowClick={canManage ? openModal : undefined} emptyTitle="No brands" />
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Brand' : 'New Brand'} footer={<ModalFooter onCancel={() => setOpen(false)} onSave={save} saving={saving} />}>
        <div className="space-y-4">
          <FormField label="Subcategory" required>
            <Select value={form.subcategory_id} onChange={(e) => setForm({ ...form, subcategory_id: e.target.value })}>
              <option value="">Select…</option>
              {(subcategories ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormField>
          <FormField label="Slug" hint="Auto-generated if blank">
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </FormField>
          <FormField label="Logo URL">
            <ImageUrlInput value={form.logo} onChange={(v) => setForm({ ...form, logo: v })} />
          </FormField>
          <FormField label="Description">
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </FormField>
        </div>
      </Modal>
    </>
  );
}

/* ------------------------------ Shared bits ------------------------------ */

interface TabProps {
  canManage: boolean;
  onMutate: () => void;
}

// Builds a human delete-warning listing the children that will cascade away.
function cascadeMessage(name: string, parts: [number | undefined, string, string][]): string {
  const present = parts.filter(([n]) => (n ?? 0) > 0).map(([n, one, many]) => `${n} ${n === 1 ? one : many}`);
  if (present.length === 0) return `Delete "${name}"? This cannot be undone.`;
  const list =
    present.length === 1 ? present[0] : `${present.slice(0, -1).join(', ')} and ${present[present.length - 1]}`;
  return `Delete "${name}"? This will also permanently remove ${list}. This cannot be undone.`;
}

function CountCell({ value, warnZero }: { value?: number; warnZero?: boolean }) {
  const n = value ?? 0;
  if (n === 0 && warnZero) return <Badge className="bg-amber-100 text-amber-700">empty</Badge>;
  return <span className="font-semibold text-neutral-700">{n}</span>;
}

function Toolbar({
  table,
  canManage,
  onNew,
  newLabel,
  children,
}: {
  table: { search: string; setSearch: (s: string) => void };
  canManage: boolean;
  onNew: () => void;
  newLabel: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <SearchInput value={table.search} onChange={table.setSearch} placeholder="Search…" className="flex-1" />
      {children}
      {canManage && (
        <Button icon={<Plus size={16} />} onClick={onNew}>
          {newLabel}
        </Button>
      )}
    </div>
  );
}

function RowActions({ canManage, onEdit, onDelete }: { canManage: boolean; onEdit: () => void; onDelete: () => void }) {
  if (!canManage) return <span className="text-neutral-300">—</span>;
  return (
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      <button onClick={onEdit} className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100" aria-label="Edit">
        <Pencil size={15} />
      </button>
      <button onClick={onDelete} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50" aria-label="Delete">
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function ModalFooter({ onCancel, onSave, saving }: { onCancel: () => void; onSave: () => void; saving: boolean }) {
  return (
    <div className="flex justify-end gap-3">
      <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      <Button onClick={onSave} loading={saving}>Save</Button>
    </div>
  );
}
