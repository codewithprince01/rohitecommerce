import React, { useState, useCallback } from 'react';
import {
  ImageOff, History, AlertTriangle, Boxes, Layers, Wallet, PackageX, Archive,
  Download, RefreshCw, ArrowDownToLine, ArrowUpFromLine, Activity, Zap,
  TrendingUp, ClipboardList, PackageCheck, ArrowRight, FileSpreadsheet,
  type LucideIcon,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import DataTable, { Column } from '../../components/ui/DataTable';
import BulkActionBar from '../../components/ui/BulkActionBar';
import Modal from '../../components/ui/Modal';
import Drawer from '../../components/ui/Drawer';
import FormField, { Input, Select } from '../../components/ui/FormField';
import SheetSyncModal from './SheetSyncModal';
import { EmptyState } from '../../components/ui/States';
import { useTable } from '../../hooks/useTable';
import { useToast } from '../../hooks/useToast';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useAsync } from '../../hooks/useAsync';
import {
  listInventory,
  getInventoryStats,
  getInventoryAnalytics,
  adjustStock,
  bulkAdjustStock,
  variantMovements,
  exportInventoryCsv,
  type InventoryRow,
  type InventoryAnalytics,
  type ReorderItem,
  type MovementReason,
  type StockStatus,
} from '../../lib/services/inventory.service';
import { allCategories } from '../../lib/services/catalog.service';
import { formatCurrency, formatCompactCurrency, formatDateTime, timeAgo } from '../../lib/format';

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

const STATUS_BADGE: Record<StockStatus, string> = {
  healthy: 'bg-primary-100 text-primary-700',
  low: 'bg-amber-100 text-amber-700',
  out: 'bg-rose-100 text-rose-700',
};
const STATUS_LABEL: Record<StockStatus, string> = { healthy: 'In stock', low: 'Low', out: 'Out' };
const STATUS_BAR: Record<StockStatus, string> = {
  healthy: 'bg-primary-500',
  low: 'bg-amber-500',
  out: 'bg-rose-500',
};

const REASON_LABEL: Record<MovementReason, string> = {
  manual: 'Manual', restock: 'Restock', sale: 'Sale', correction: 'Correction',
  return: 'Return', damage: 'Damage', stocktake: 'Stocktake', transfer: 'Transfer',
};

const coverLabel = (d: number | null) => (d === null ? '—' : d >= 999 ? '999+ d' : `${Math.round(d)}d`);

/* ================================ Page ================================== */

export default function InventoryPage() {
  const toast = useToast();
  const { can } = useAdminAuth();

  const table = useTable<InventoryRow>(listInventory, { pageSize: 12 });
  const { data: categories } = useAsync(() => allCategories(), []);
  const { data: stats, reload: reloadStats } = useAsync(() => getInventoryStats(), []);
  const { data: analytics, reload: reloadAnalytics } = useAsync(() => getInventoryAnalytics(), []);

  const [adjustRow, setAdjustRow] = useState<InventoryRow | null>(null);
  const [historyRow, setHistoryRow] = useState<InventoryRow | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [reorderOpen, setReorderOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const canAdjust = can('inventory.adjust');

  const refreshAll = useCallback(() => {
    table.refresh();
    reloadStats();
    reloadAnalytics();
  }, [table, reloadStats, reloadAnalytics]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const csv = await exportInventoryCsv({
        search: table.search,
        sortBy: table.sortBy,
        sortDir: table.sortDir,
        filters: table.filters,
      });
      downloadCsv(`inventory-${new Date().toISOString().slice(0, 10)}.csv`, csv);
      toast.success('Export ready');
    } catch (err: any) {
      toast.error(err?.message ?? 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const quickRestock = useCallback(
    async (item: ReorderItem) => {
      try {
        await adjustStock(item.id, { change: item.suggested_qty, reason: 'restock', note: 'Reorder suggestion' });
        toast.success(`Restocked ${item.product_name} (+${item.suggested_qty})`);
        refreshAll();
      } catch (err: any) {
        toast.error(err?.message ?? 'Restock failed');
      }
    },
    [toast, refreshAll]
  );

  const lowOut = (stats?.lowStock ?? 0) + (stats?.outOfStock ?? 0);

  const columns: Column<InventoryRow>[] = [
    {
      key: 'product',
      header: 'SKU',
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-neutral-100 overflow-hidden flex items-center justify-center flex-shrink-0">
            {r.product?.image ? (
              <img src={r.product.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <ImageOff size={16} className="text-neutral-300" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-neutral-800 truncate max-w-[220px]">{r.product?.name ?? '—'}</p>
            <p className="text-xs text-neutral-400">Pack: {r.quantity}{r.category ? ` · ${r.category.name}` : ''}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      sortable: true,
      render: (r) => (
        <div>
          <Badge className={STATUS_BADGE[r.stock_status]}>
            {r.stock_status !== 'healthy' && <AlertTriangle size={11} />} {r.stock} units
          </Badge>
          <p className="text-[11px] text-neutral-400 mt-1">Reorder ≤ {r.threshold}</p>
        </div>
      ),
    },
    {
      key: 'sold_30d',
      header: 'Demand (30d)',
      sortable: true,
      render: (r) => (
        <div>
          <p className="text-neutral-700">{r.sold_30d} sold</p>
          <p className="text-[11px] text-neutral-400">{coverLabel(r.days_of_cover)} cover</p>
        </div>
      ),
    },
    {
      key: 'inventory_value',
      header: 'Stock value',
      sortable: true,
      className: 'text-right',
      render: (r) => (
        <div className="text-right">
          <p className="font-semibold text-neutral-800">{formatCurrency(r.inventory_value)}</p>
          <p className="text-[11px] text-neutral-400">@ {formatCurrency(r.price)}</p>
        </div>
      ),
    },
    {
      key: 'last_movement_at',
      header: 'Last moved',
      sortable: true,
      render: (r) => <span className="text-neutral-500 text-xs">{r.last_movement_at ? timeAgo(r.last_movement_at) : 'Never'}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setHistoryRow(r)} className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100" aria-label="History">
            <History size={15} />
          </button>
          {canAdjust && (
            <Button size="sm" variant="outline" onClick={() => setAdjustRow(r)}>
              Adjust
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Track stock levels, monitor demand and manage reordering across every SKU."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={<RefreshCw size={15} />} onClick={refreshAll}>
              Refresh
            </Button>
            <Button variant="outline" icon={<Download size={16} />} onClick={handleExport} loading={exporting}>
              Export
            </Button>
            {canAdjust && (
              <Button variant="outline" icon={<FileSpreadsheet size={16} />} onClick={() => setSheetOpen(true)}>
                Update by sheet
              </Button>
            )}
            {canAdjust && (
              <Button icon={<ClipboardList size={16} />} onClick={() => setReorderOpen(true)}>
                Reorder ({analytics?.reorderList.length ?? 0})
              </Button>
            )}
          </div>
        }
      />

      {/* KPI cards — live inventory metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-5">
        <StatCard label="Total SKUs" value={stats?.totalSkus ?? 0} icon={Boxes} loading={!stats} />
        <StatCard label="Units in Stock" value={stats ? stats.totalUnits.toLocaleString('en-IN') : 0} icon={Layers} iconClass="bg-blue-50 text-blue-600" loading={!stats} />
        <StatCard
          label="Inventory Value"
          value={stats ? formatCompactCurrency(stats.inventoryValue) : '—'}
          icon={Wallet}
          iconClass="bg-violet-50 text-violet-600"
          trend={stats ? { value: `${formatCompactCurrency(stats.potentialMargin)} margin`, positive: true } : null}
          loading={!stats}
        />
        <StatCard label="Low Stock" value={stats?.lowStock ?? 0} icon={AlertTriangle} iconClass="bg-amber-50 text-amber-600" loading={!stats} />
        <StatCard label="Out of Stock" value={stats?.outOfStock ?? 0} icon={PackageX} iconClass="bg-rose-50 text-rose-600" loading={!stats} />
        <StatCard label="Dead Stock" value={stats?.deadStock ?? 0} icon={Archive} iconClass="bg-neutral-100 text-neutral-500" loading={!stats} />
      </div>

      {/* Low-stock alert banner */}
      {stats && lowOut > 0 && (
        <button
          onClick={() => setReorderOpen(true)}
          className="w-full flex items-center gap-3 mb-5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100 text-left hover:bg-amber-100/70 transition-colors"
        >
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{lowOut} SKU{lowOut === 1 ? '' : 's'}</span> need attention —{' '}
            {stats.lowStock} running low and {stats.outOfStock} out of stock.{' '}
            <span className="font-medium underline">Review reorder list →</span>
          </p>
        </button>
      )}

      {/* Analytics: trend + health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <MovementTrendCard analytics={analytics} />
        <StockHealthCard analytics={analytics} />
      </div>

      {/* Analytics: value by category + reorder + fastest movers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <CategoryValueCard analytics={analytics} />
        <ReorderCard analytics={analytics} canAdjust={canAdjust} onRestock={quickRestock} onViewAll={() => setReorderOpen(true)} />
        <TopMoversCard analytics={analytics} />
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <SearchInput value={table.search} onChange={table.setSearch} placeholder="Search SKU by product…" className="flex-1" />
        <Select
          value={(table.filters.category_id as string) ?? ''}
          onChange={(e) => table.setFilter('category_id', e.target.value || undefined)}
          className="lg:w-48"
        >
          <option value="">All categories</option>
          {(categories ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Select
          value={(table.filters.stock as string) ?? ''}
          onChange={(e) => table.setFilter('stock', e.target.value || undefined)}
          className="lg:w-44"
        >
          <option value="">All stock</option>
          <option value="in">In stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
          <option value="over">Overstocked</option>
          <option value="dead">Dead stock</option>
        </Select>
        <Select
          value={(table.filters.is_available as string) ?? ''}
          onChange={(e) => table.setFilter('is_available', e.target.value === '' ? undefined : e.target.value === 'true')}
          className="lg:w-36"
        >
          <option value="">All status</option>
          <option value="true">On sale</option>
          <option value="false">Off sale</option>
        </Select>
      </div>

      <DataTable
        table={table}
        columns={columns}
        selectable={canAdjust}
        onRowClick={canAdjust ? (r) => setAdjustRow(r) : undefined}
        emptyTitle="No stock records"
        emptyMessage="Add products and pack sizes to start tracking inventory."
      />

      {/* Recent movements ledger */}
      <RecentMovementsCard analytics={analytics} />

      <BulkActionBar count={table.selected.size} onClear={table.clearSelection}>
        <Button size="sm" variant="secondary" icon={<ArrowDownToLine size={14} />} onClick={() => setBulkOpen(true)}>
          Adjust stock
        </Button>
      </BulkActionBar>

      {adjustRow && (
        <AdjustModal
          row={adjustRow}
          onClose={() => setAdjustRow(null)}
          onDone={() => {
            setAdjustRow(null);
            refreshAll();
          }}
          onError={(m) => toast.error(m)}
          onSuccess={(m) => toast.success(m)}
        />
      )}

      {bulkOpen && (
        <BulkAdjustModal
          ids={[...table.selected]}
          onClose={() => setBulkOpen(false)}
          onDone={() => {
            setBulkOpen(false);
            refreshAll();
          }}
          onError={(m) => toast.error(m)}
          onSuccess={(m) => toast.success(m)}
        />
      )}

      <SheetSyncModal
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        filters={{ search: table.search || undefined, ...table.filters }}
        onImported={refreshAll}
        onError={(m) => toast.error(m)}
        onSuccess={(m) => toast.success(m)}
      />

      {historyRow && <HistoryDrawer row={historyRow} onClose={() => setHistoryRow(null)} />}

      <ReorderDrawer
        open={reorderOpen}
        items={analytics?.reorderList ?? []}
        canAdjust={canAdjust}
        onClose={() => setReorderOpen(false)}
        onRestock={quickRestock}
        onRestockAll={async (items) => {
          try {
            await Promise.all(items.map((it) => adjustStock(it.id, { change: it.suggested_qty, reason: 'restock', note: 'Bulk reorder' })));
            toast.success(`Restocked ${items.length} SKU${items.length === 1 ? '' : 's'}`);
            setReorderOpen(false);
            refreshAll();
          } catch (err: any) {
            toast.error(err?.message ?? 'Restock failed');
          }
        }}
      />
    </div>
  );
}

/* ============================ Analytics cards ============================ */

function CardShell({ title, subtitle, icon: Icon, action, children, className = '' }: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl shadow-card p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} className="text-neutral-400" />}
          <div>
            <h3 className="text-base font-bold text-neutral-800">{title}</h3>
            {subtitle && <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

type AnalyticsProp = { analytics: InventoryAnalytics | null };

function MovementTrendCard({ analytics }: AnalyticsProp) {
  const trend = analytics?.movementTrend ?? [];
  const max = Math.max(1, ...trend.flatMap((t) => [t.in, t.out]));
  const totals = trend.reduce((acc, t) => ({ in: acc.in + t.in, out: acc.out + t.out }), { in: 0, out: 0 });
  const moved = totals.in + totals.out > 0;
  return (
    <CardShell
      title="Stock movement"
      subtitle="Units in vs out · last 14 days"
      icon={Activity}
      className="lg:col-span-2"
      action={
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1 text-primary-600"><ArrowDownToLine size={13} /> {totals.in} in</span>
          <span className="inline-flex items-center gap-1 text-rose-500"><ArrowUpFromLine size={13} /> {totals.out} out</span>
        </div>
      }
    >
      {!moved ? (
        <div className="h-44 flex items-center justify-center text-sm text-neutral-400">No stock movements recorded yet.</div>
      ) : (
        <div className="flex items-end justify-between gap-1.5 h-44">
          {trend.map((t) => (
            <div key={t.date} className="flex-1 flex flex-col items-center gap-1.5 group">
              <div className="w-full flex items-end justify-center gap-0.5 h-36">
                <div
                  className="w-1/2 max-w-[14px] bg-primary-500 rounded-t group-hover:bg-primary-600 transition-colors"
                  style={{ height: `${(t.in / max) * 100}%`, minHeight: t.in > 0 ? '4px' : '0' }}
                  title={`${t.in} in`}
                />
                <div
                  className="w-1/2 max-w-[14px] bg-rose-400 rounded-t group-hover:bg-rose-500 transition-colors"
                  style={{ height: `${(t.out / max) * 100}%`, minHeight: t.out > 0 ? '4px' : '0' }}
                  title={`${t.out} out`}
                />
              </div>
              <span className="text-[9px] text-neutral-400">
                {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }).replace(' ', '')}
              </span>
            </div>
          ))}
        </div>
      )}
    </CardShell>
  );
}

function StockHealthCard({ analytics }: AnalyticsProp) {
  const dist = analytics?.statusDistribution ?? [];
  const totalCount = dist.reduce((s, d) => s + d.count, 0) || 1;
  return (
    <CardShell title="Stock health" subtitle="SKUs by status" icon={PackageCheck}>
      <div className="flex flex-col gap-4">
        {dist.map((d) => {
          const pct = (d.count / totalCount) * 100;
          return (
            <div key={d.status}>
              <div className="flex items-center justify-between mb-1.5">
                <Badge className={STATUS_BADGE[d.status]}>{STATUS_LABEL[d.status]}</Badge>
                <span className="text-sm font-semibold text-neutral-700">
                  {d.count} <span className="text-xs font-normal text-neutral-400">SKUs</span>
                </span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${STATUS_BAR[d.status]}`} style={{ width: `${pct}%` }} />
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">{d.units.toLocaleString('en-IN')} units · {formatCompactCurrency(d.value)}</p>
            </div>
          );
        })}
      </div>
    </CardShell>
  );
}

function CategoryValueCard({ analytics }: AnalyticsProp) {
  const cats = analytics?.valueByCategory ?? [];
  const max = Math.max(1, ...cats.map((c) => c.value));
  return (
    <CardShell title="Value by category" subtitle="Capital tied up in stock" icon={Wallet}>
      {cats.length === 0 ? (
        <EmptyState title="No inventory value" />
      ) : (
        <div className="flex flex-col gap-3">
          {cats.map((c) => (
            <div key={c.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-neutral-600 truncate max-w-[150px]">{c.name}</span>
                <span className="text-sm font-semibold text-neutral-800">{formatCompactCurrency(c.value)}</span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full" style={{ width: `${(c.value / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </CardShell>
  );
}

function ReorderCard({
  analytics, canAdjust, onRestock, onViewAll,
}: AnalyticsProp & { canAdjust: boolean; onRestock: (i: ReorderItem) => void; onViewAll: () => void }) {
  const items = (analytics?.reorderList ?? []).slice(0, 5);
  return (
    <CardShell
      title="Reorder suggestions"
      subtitle="Demand-based, top priority"
      icon={ClipboardList}
      action={
        analytics && analytics.reorderList.length > 0 ? (
          <button onClick={onViewAll} className="text-xs text-primary-600 font-semibold hover:text-primary-700 inline-flex items-center gap-1">
            View all <ArrowRight size={13} />
          </button>
        ) : null
      }
    >
      {items.length === 0 ? (
        <EmptyState title="Stock looks healthy" message="No SKUs need reordering right now." />
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((it) => (
            <div key={it.id} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-neutral-700 truncate">{it.product_name}</p>
                <p className="text-[11px] text-neutral-400">
                  {it.quantity} · <span className={it.status === 'out' ? 'text-rose-500 font-medium' : 'text-amber-600'}>{it.stock} left</span> · {it.sold_30d} sold/30d
                </p>
              </div>
              {canAdjust ? (
                <button
                  onClick={() => onRestock(it)}
                  className="flex-shrink-0 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg px-2.5 py-1.5"
                  title={`Add ${it.suggested_qty} units`}
                >
                  +{it.suggested_qty}
                </button>
              ) : (
                <span className="text-xs font-semibold text-neutral-500">+{it.suggested_qty}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </CardShell>
  );
}

function TopMoversCard({ analytics }: AnalyticsProp) {
  const movers = analytics?.topMovers ?? [];
  return (
    <CardShell title="Fastest movers" subtitle="Units sold · last 30 days" icon={Zap}>
      {movers.length === 0 ? (
        <EmptyState title="No sales yet" message="Sales velocity will appear here." />
      ) : (
        <div className="flex flex-col gap-3">
          {movers.map((m, i) => (
            <div key={m.id} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-lg bg-neutral-100 text-neutral-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-neutral-700 truncate">{m.product_name}</p>
                <p className="text-[11px] text-neutral-400">{m.variant_label ?? '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-neutral-800">{m.sold_30d}</p>
                <p className="text-[11px] text-neutral-400">{formatCompactCurrency(m.revenue)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardShell>
  );
}

function RecentMovementsCard({ analytics }: AnalyticsProp) {
  const moves = analytics?.recentMovements ?? [];
  return (
    <div className="bg-white rounded-2xl shadow-card p-5 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <History size={16} className="text-neutral-500" />
        <h3 className="text-base font-bold text-neutral-800">Recent stock movements</h3>
      </div>
      {moves.length === 0 ? (
        <EmptyState title="No movements yet" message="Stock adjustments will be recorded here." />
      ) : (
        <div className="divide-y divide-neutral-50">
          {moves.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.change >= 0 ? 'bg-primary-50 text-primary-600' : 'bg-rose-50 text-rose-500'}`}>
                  {m.change >= 0 ? <ArrowDownToLine size={14} /> : <ArrowUpFromLine size={14} />}
                </div>
                <div>
                  <p className="text-sm text-neutral-700">
                    <span className="font-semibold">{REASON_LABEL[m.reason]}</span>
                    {m.variant_label ? <span className="text-neutral-400"> · {m.variant_label}</span> : null}
                    {m.note ? <span className="text-neutral-400"> · {m.note}</span> : null}
                  </p>
                  <p className="text-[11px] text-neutral-400">{m.created_by_email ?? 'system'} · {timeAgo(m.created_at)}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-sm font-bold ${m.change >= 0 ? 'text-primary-600' : 'text-rose-500'}`}>
                  {m.change >= 0 ? '+' : ''}{m.change}
                </span>
                <p className="text-[11px] text-neutral-400">→ {m.resulting_stock ?? '—'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================== Adjust modal ============================= */

const REASONS: MovementReason[] = ['restock', 'correction', 'return', 'damage', 'stocktake', 'transfer', 'manual'];

function AdjustModal({
  row, onClose, onDone, onError, onSuccess,
}: {
  row: InventoryRow;
  onClose: () => void;
  onDone: () => void;
  onError: (m: string) => void;
  onSuccess: (m: string) => void;
}) {
  const [mode, setMode] = useState<'add' | 'remove' | 'set'>('add');
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState<MovementReason>('restock');
  const [note, setNote] = useState('');
  const [threshold, setThreshold] = useState(row.threshold);
  const [saving, setSaving] = useState(false);

  const projected = mode === 'set' ? Math.max(0, amount) : mode === 'remove' ? Math.max(0, row.stock - amount) : row.stock + amount;
  const thresholdChanged = threshold !== row.threshold;

  const save = async () => {
    if (amount <= 0 && !thresholdChanged) return onError('Enter a positive amount or change the reorder point');
    setSaving(true);
    try {
      const payload: Parameters<typeof adjustStock>[1] = { reason, note: note || undefined };
      if (mode === 'set') payload.set = amount;
      else if (amount > 0) payload.change = mode === 'remove' ? -amount : amount;
      if (thresholdChanged) payload.low_stock_threshold = threshold;
      await adjustStock(row.id, payload);
      onSuccess('Stock updated');
      onDone();
    } catch (err: any) {
      onError(err?.message ?? 'Failed to adjust stock');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Adjust Stock"
      footer={
        <div className="flex justify-between items-center gap-3">
          <span className="text-sm text-neutral-500">New level: <span className="font-bold text-neutral-800">{projected} units</span></span>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={save} loading={saving}>Apply</Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="bg-neutral-50 rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-neutral-800">{row.product?.name}</p>
            <p className="text-xs text-neutral-500">Pack {row.quantity} · Current: {row.stock} units</p>
          </div>
          <Badge className={STATUS_BADGE[row.stock_status]}>{STATUS_LABEL[row.stock_status]}</Badge>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(['add', 'remove', 'set'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`py-2 rounded-xl text-sm font-semibold capitalize border transition-colors ${
                mode === m ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label={mode === 'set' ? 'New stock level' : 'Amount'}>
            <Input type="number" min={0} value={amount} onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))} />
          </FormField>
          <FormField label="Reorder point" hint="Low-stock alert level">
            <Input type="number" min={0} value={threshold} onChange={(e) => setThreshold(Math.max(0, Number(e.target.value)))} />
          </FormField>
        </div>
        <FormField label="Reason">
          <Select value={reason} onChange={(e) => setReason(e.target.value as MovementReason)}>
            {REASONS.map((r) => (
              <option key={r} value={r}>{REASON_LABEL[r]}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Note">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional — e.g. supplier invoice #" />
        </FormField>
      </div>
    </Modal>
  );
}

/* =========================== Bulk adjust modal =========================== */

function BulkAdjustModal({
  ids, onClose, onDone, onError, onSuccess,
}: {
  ids: string[];
  onClose: () => void;
  onDone: () => void;
  onError: (m: string) => void;
  onSuccess: (m: string) => void;
}) {
  const [mode, setMode] = useState<'add' | 'remove' | 'set'>('add');
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState<MovementReason>('restock');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (mode !== 'set' && amount <= 0) return onError('Enter a positive amount');
    setSaving(true);
    try {
      const { updated } = await bulkAdjustStock({ ids, mode, amount, reason, note: note || undefined });
      onSuccess(`Adjusted ${updated} SKU${updated === 1 ? '' : 's'}`);
      onDone();
    } catch (err: any) {
      onError(err?.message ?? 'Bulk adjust failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Bulk adjust · ${ids.length} SKU${ids.length === 1 ? '' : 's'}`}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={saving}>Apply to {ids.length}</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-neutral-500">Apply the same change to every selected SKU. A movement is logged per SKU.</p>
        <div className="grid grid-cols-3 gap-2">
          {(['add', 'remove', 'set'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`py-2 rounded-xl text-sm font-semibold capitalize border transition-colors ${
                mode === m ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <FormField label={mode === 'set' ? 'Set every SKU to' : 'Amount per SKU'}>
          <Input type="number" min={0} value={amount} onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))} />
        </FormField>
        <FormField label="Reason">
          <Select value={reason} onChange={(e) => setReason(e.target.value as MovementReason)}>
            {REASONS.map((r) => (
              <option key={r} value={r}>{REASON_LABEL[r]}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Note">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
        </FormField>
      </div>
    </Modal>
  );
}

/* ============================= History drawer ============================ */

function HistoryDrawer({ row, onClose }: { row: InventoryRow; onClose: () => void }) {
  const { data, loading } = useAsync(() => variantMovements(row.id), [row.id]);
  return (
    <Drawer open onClose={onClose} title="Stock history" subtitle={`${row.product?.name ?? ''} · Pack ${row.quantity}`} width="max-w-lg">
      <div className="bg-neutral-50 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-neutral-500">Current stock</p>
          <p className="text-xl font-bold text-neutral-800">{row.stock} units</p>
        </div>
        <Badge className={STATUS_BADGE[row.stock_status]}>{STATUS_LABEL[row.stock_status]}</Badge>
      </div>
      {loading ? (
        <p className="text-sm text-neutral-400 py-6 text-center">Loading…</p>
      ) : !data?.length ? (
        <EmptyState title="No movements yet" message="Adjustments to this SKU will appear here." />
      ) : (
        <div className="divide-y divide-neutral-50">
          {data.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-neutral-700">
                  {REASON_LABEL[m.reason]}{m.note ? <span className="text-neutral-400 font-normal"> · {m.note}</span> : ''}
                </p>
                <p className="text-xs text-neutral-400">{m.created_by_email ?? 'system'} · {formatDateTime(m.created_at)}</p>
              </div>
              <div className="text-right">
                <span className={`text-sm font-bold ${m.change >= 0 ? 'text-primary-600' : 'text-rose-500'}`}>
                  {m.change >= 0 ? '+' : ''}{m.change}
                </span>
                <p className="text-xs text-neutral-400">→ {m.resulting_stock ?? '—'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}

/* ============================= Reorder drawer ============================ */

function ReorderDrawer({
  open, items, canAdjust, onClose, onRestock, onRestockAll,
}: {
  open: boolean;
  items: ReorderItem[];
  canAdjust: boolean;
  onClose: () => void;
  onRestock: (i: ReorderItem) => void;
  onRestockAll: (items: ReorderItem[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Reorder list"
      subtitle={`${items.length} SKU${items.length === 1 ? '' : 's'} below reorder point`}
      width="max-w-lg"
      footer={
        canAdjust && items.length > 0 ? (
          <Button
            className="w-full"
            icon={<PackageCheck size={16} />}
            loading={busy}
            onClick={async () => {
              setBusy(true);
              await onRestockAll(items);
              setBusy(false);
            }}
          >
            Restock all to suggested levels
          </Button>
        ) : null
      }
    >
      {items.length === 0 ? (
        <EmptyState title="Nothing to reorder" message="Every SKU is above its reorder point." />
      ) : (
        <div className="divide-y divide-neutral-50">
          {items.map((it) => (
            <div key={it.id} className="flex items-center gap-3 py-3">
              <div className="w-10 h-10 rounded-lg bg-neutral-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                {it.image ? <img src={it.image} alt="" className="w-full h-full object-cover" /> : <ImageOff size={16} className="text-neutral-300" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-800 truncate">{it.product_name}</p>
                <p className="text-[11px] text-neutral-400">
                  {it.quantity} · {it.sold_30d} sold/30d · {coverLabel(it.days_of_cover)} cover
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <Badge className={it.status === 'out' ? STATUS_BADGE.out : STATUS_BADGE.low}>{it.stock} left</Badge>
              </div>
              {canAdjust && (
                <Button size="sm" variant="outline" icon={<TrendingUp size={13} />} onClick={() => onRestock(it)}>
                  +{it.suggested_qty}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}
