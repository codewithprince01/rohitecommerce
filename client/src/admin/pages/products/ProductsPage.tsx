import React, { useState, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, ImageOff,
  Package, CheckCircle2, AlertTriangle, XCircle, Wallet, FileSpreadsheet,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import DataTable, { Column } from '../../components/ui/DataTable';
import BulkActionBar from '../../components/ui/BulkActionBar';
import { Select } from '../../components/ui/FormField';
import { useTable } from '../../hooks/useTable';
import { useToast } from '../../hooks/useToast';
import { useConfirm } from '../../hooks/useConfirm';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useAsync } from '../../hooks/useAsync';
import {
  listProducts,
  getProductStats,
  deleteProduct,
  bulkSetAvailability,
  bulkDeleteProducts,
  type ProductListRow,
} from '../../lib/services/products.service';
import { allCategories } from '../../lib/services/catalog.service';
import { formatCurrency, formatCompactCurrency } from '../../lib/format';
import ProductForm from './ProductForm';
import CatalogSheetModal from '../../components/bulk/CatalogSheetModal';

const LOW_STOCK = 10;

export default function ProductsPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { can } = useAdminAuth();
  const table = useTable<ProductListRow>(listProducts, { initialSortBy: 'created_at', initialSortDir: 'desc' });
  const { data: categories } = useAsync(() => allCategories(), []);
  const { data: stats, reload: reloadStats } = useAsync(() => getProductStats(), []);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductListRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Refresh both the table and the KPI cards after any mutation.
  const refreshAll = useCallback(() => {
    table.refresh();
    reloadStats();
  }, [table, reloadStats]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (p: ProductListRow) => {
    setEditing(p);
    setFormOpen(true);
  };

  const handleDelete = useCallback(
    async (p: ProductListRow) => {
      const ok = await confirm({
        title: 'Delete product',
        message: `Delete "${p.name}" and all its variants? This cannot be undone.`,
        danger: true,
        confirmLabel: 'Delete',
      });
      if (!ok) return;
      try {
        await deleteProduct(p.id);
        toast.success('Product deleted');
        refreshAll();
      } catch (err: any) {
        toast.error(err?.message ?? 'Delete failed');
      }
    },
    [confirm, toast, refreshAll]
  );

  const toggleAvailability = useCallback(
    async (p: ProductListRow) => {
      try {
        await bulkSetAvailability([p.id], !p.is_available);
        toast.success(p.is_available ? 'Product hidden' : 'Product activated');
        refreshAll();
      } catch (err: any) {
        toast.error(err?.message ?? 'Update failed');
      }
    },
    [toast, refreshAll]
  );

  const runBulk = async (action: 'enable' | 'disable' | 'delete') => {
    const ids = [...table.selected];
    try {
      if (action === 'delete') {
        const ok = await confirm({
          title: 'Delete products',
          message: `Delete ${ids.length} selected products and their variants?`,
          danger: true,
          confirmLabel: 'Delete',
        });
        if (!ok) return;
        await bulkDeleteProducts(ids);
      } else {
        await bulkSetAvailability(ids, action === 'enable');
      }
      toast.success('Bulk action applied');
      refreshAll();
    } catch (err: any) {
      toast.error(err?.message ?? 'Bulk action failed');
    }
  };

  const canManage = can('products.update');
  const canDelete = can('products.delete');

  const columns: Column<ProductListRow>[] = [
    {
      key: 'name',
      header: 'Product',
      sortable: true,
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-neutral-100 overflow-hidden flex items-center justify-center flex-shrink-0">
            {p.image ? (
              <img src={p.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <ImageOff size={16} className="text-neutral-300" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-neutral-800 truncate max-w-[220px]">{p.name}</p>
            <p className="text-xs text-neutral-400 truncate max-w-[220px]">{p.brand?.name ?? '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (p) => <span className="text-neutral-600">{p.category?.name ?? '—'}</span>,
    },
    {
      key: 'variant_count',
      header: 'Variants',
      sortable: true,
      render: (p) => {
        const min = p.min_price ?? 0;
        const max = p.max_price ?? 0;
        return (
          <div>
            <p className="text-neutral-700">{p.variant_count} pack{p.variant_count === 1 ? '' : 's'}</p>
            <p className="text-xs text-neutral-400">
              {p.variant_count ? (min === max ? formatCurrency(min) : `${formatCurrency(min)}–${formatCurrency(max)}`) : '—'}
            </p>
          </div>
        );
      },
    },
    {
      key: 'total_stock',
      header: 'Stock',
      sortable: true,
      render: (p) => {
        const total = p.total_stock ?? 0;
        const cls =
          total <= 0
            ? 'bg-rose-100 text-rose-700'
            : total <= LOW_STOCK
            ? 'bg-amber-100 text-amber-700'
            : 'bg-neutral-100 text-neutral-600';
        return <Badge className={cls}>{total <= 0 ? 'Out of stock' : `${total} units`}</Badge>;
      },
    },
    {
      key: 'is_available',
      header: 'Status',
      sortable: true,
      render: (p) =>
        canManage ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleAvailability(p);
            }}
            title={p.is_available ? 'Click to hide' : 'Click to activate'}
          >
            {p.is_available ? (
              <Badge className="bg-primary-100 text-primary-700 hover:bg-primary-200">Active</Badge>
            ) : (
              <Badge className="bg-neutral-200 text-neutral-600 hover:bg-neutral-300">Hidden</Badge>
            )}
          </button>
        ) : p.is_available ? (
          <Badge className="bg-primary-100 text-primary-700">Active</Badge>
        ) : (
          <Badge className="bg-neutral-200 text-neutral-600">Hidden</Badge>
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {canManage && (
            <button onClick={() => openEdit(p)} className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100" aria-label="Edit">
              <Pencil size={15} />
            </button>
          )}
          {canDelete && (
            <button onClick={() => handleDelete(p)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50" aria-label="Delete">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  const lowStockTotal = (stats?.lowStockVariants ?? 0) + (stats?.outOfStockVariants ?? 0);

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Manage your catalog, pricing, pack sizes and inventory."
        actions={
          <div className="flex items-center gap-2">
            {/* One door for every sheet job — five separate buttons here made
                it too easy to feed the wrong file to the wrong importer. */}
            <Button variant="outline" icon={<FileSpreadsheet size={16} />} onClick={() => setSheetOpen(true)}>
              Import / Export
            </Button>
            {can('products.create') && (
              <Button icon={<Plus size={16} />} onClick={openCreate}>
                New Product
              </Button>
            )}
          </div>
        }
      />

      {/* KPI cards — real catalog metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
        <StatCard
          label="Total Products"
          value={stats?.totalProducts ?? 0}
          icon={Package}
          loading={!stats}
        />
        <StatCard
          label="Active"
          value={stats?.activeProducts ?? 0}
          icon={CheckCircle2}
          iconClass="bg-primary-50 text-primary-600"
          trend={stats ? { value: `${stats.hiddenProducts} hidden`, positive: stats.hiddenProducts === 0 } : null}
          loading={!stats}
        />
        <StatCard
          label="Low Stock"
          value={stats?.lowStockVariants ?? 0}
          icon={AlertTriangle}
          iconClass="bg-amber-50 text-amber-600"
          loading={!stats}
        />
        <StatCard
          label="Out of Stock"
          value={stats?.outOfStockVariants ?? 0}
          icon={XCircle}
          iconClass="bg-rose-50 text-rose-600"
          loading={!stats}
        />
        <StatCard
          label="Inventory Value"
          value={stats ? formatCompactCurrency(stats.inventoryValue) : '—'}
          icon={Wallet}
          iconClass="bg-blue-50 text-blue-600"
          loading={!stats}
        />
      </div>

      {/* Inventory health banner */}
      {stats && lowStockTotal > 0 && (
        <button
          onClick={() => table.setFilter('stock', table.filters.stock === 'low' ? undefined : 'low')}
          className="w-full flex items-center gap-3 mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100 text-left hover:bg-amber-100/70 transition-colors"
        >
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{lowStockTotal} variant{lowStockTotal === 1 ? '' : 's'}</span> need
            attention — {stats.lowStockVariants} running low and {stats.outOfStockVariants} out of stock.{' '}
            <span className="font-medium underline">Filter low stock →</span>
          </p>
        </button>
      )}

      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <SearchInput value={table.search} onChange={table.setSearch} placeholder="Search products…" className="flex-1" />
        <Select
          value={(table.filters.category_id as string) ?? ''}
          onChange={(e) => table.setFilter('category_id', e.target.value || undefined)}
          className="lg:w-48"
        >
          <option value="">All categories</option>
          {(categories ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select
          value={(table.filters.stock as string) ?? ''}
          onChange={(e) => table.setFilter('stock', e.target.value || undefined)}
          className="lg:w-40"
        >
          <option value="">All stock</option>
          <option value="in">In stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </Select>
        <Select
          value={(table.filters.is_available as string) ?? ''}
          onChange={(e) => table.setFilter('is_available', e.target.value === '' ? undefined : e.target.value === 'true')}
          className="lg:w-36"
        >
          <option value="">All status</option>
          <option value="true">Active</option>
          <option value="false">Hidden</option>
        </Select>
      </div>

      <DataTable
        table={table}
        columns={columns}
        selectable={canManage}
        onRowClick={canManage ? openEdit : undefined}
        emptyTitle="No products found"
        emptyMessage="Try adjusting your search or filters, or create your first product."
        emptyAction={can('products.create') ? <Button icon={<Plus size={16} />} onClick={openCreate}>New Product</Button> : null}
      />

      <BulkActionBar count={table.selected.size} onClear={table.clearSelection}>
        <Button size="sm" variant="secondary" icon={<Eye size={14} />} onClick={() => runBulk('enable')}>
          Activate
        </Button>
        <Button size="sm" variant="outline" icon={<EyeOff size={14} />} onClick={() => runBulk('disable')}>
          Hide
        </Button>
        {canDelete && (
          <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => runBulk('delete')}>
            Delete
          </Button>
        )}
      </BulkActionBar>

      <CatalogSheetModal
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        type="products"
        filters={{ search: table.search || undefined }}
        onDone={refreshAll}
        onError={(m) => toast.error(m)}
        onSuccess={(m) => toast.success(m)}
      />

      <ProductForm open={formOpen} product={editing} onClose={() => setFormOpen(false)} onSaved={refreshAll} />
    </div>
  );
}
