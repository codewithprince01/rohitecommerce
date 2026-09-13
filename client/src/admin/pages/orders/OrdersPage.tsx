import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Package, ShoppingBag, Truck, Wallet, AlertTriangle, Download, Clock, X, CheckCircle2,
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
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  listOrders,
  getOrderStats,
  bulkUpdateStatus,
  updateOrderStatus,
  exportOrdersCsv,
} from '../../lib/services/orders.service';
import {
  formatCurrency,
  formatCompactCurrency,
  formatDate,
  PAYMENT_METHOD_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_SHORT_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_COLORS,
} from '../../lib/format';
import type { Order, OrderStatus } from '../../lib/types';

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

const STATUS_OPTIONS = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

export default function OrdersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const { can } = useAdminAuth();

  const urlStatus = searchParams.get('status') || undefined;
  const table = useTable<Order>(listOrders, {
    initialSortBy: 'placed_at',
    initialSortDir: 'desc',
    initialFilters: urlStatus ? { status: urlStatus } : {},
  });
  const { data: stats, reload: reloadStats } = useAsync(() => getOrderStats(), []);

  const [exporting, setExporting] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>('confirmed');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const canUpdate = can('orders.update');

  const refreshAll = useCallback(() => {
    table.refresh();
    reloadStats();
  }, [table, reloadStats]);

  // Sync URL search params when status filter changes
  useEffect(() => {
    const currentStatusInTable = table.filters.status as string | undefined;
    if (currentStatusInTable && currentStatusInTable !== urlStatus) {
      setSearchParams({ status: currentStatusInTable }, { replace: true });
    } else if (!currentStatusInTable && urlStatus) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('status');
      setSearchParams(nextParams, { replace: true });
    }
  }, [table.filters.status]);

  const handleQuickStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Order status updated to ${ORDER_STATUS_SHORT_LABELS[newStatus] || newStatus}`);
      refreshAll();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const csv = await exportOrdersCsv({
        search: table.search,
        sortBy: table.sortBy,
        sortDir: table.sortDir,
        filters: table.filters,
      });
      downloadCsv(`orders-${new Date().toISOString().slice(0, 10)}.csv`, csv);
      toast.success('Export ready');
    } catch (err: any) {
      toast.error(err?.message ?? 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const runBulkStatus = async () => {
    const ids = [...table.selected];
    if (!ids.length) return;
    setBulkBusy(true);
    try {
      const res = await bulkUpdateStatus(ids, bulkStatus);
      if (res.updated) {
        toast.success(
          `${res.updated} order${res.updated === 1 ? '' : 's'} marked ${ORDER_STATUS_SHORT_LABELS[bulkStatus] || bulkStatus}` +
            (res.skipped.length ? ` · ${res.skipped.length} skipped` : '')
        );
      } else {
        toast.error('No orders updated.');
      }
      table.clearSelection();
      refreshAll();
    } catch (err: any) {
      toast.error(err?.message ?? 'Bulk update failed');
    } finally {
      setBulkBusy(false);
    }
  };

  const hasDateFilter = Boolean(table.filters.from || table.filters.to);
  const activeFilters =
    !!table.filters.status ||
    !!table.filters.payment_status ||
    !!table.filters.payment_method ||
    hasDateFilter ||
    !!table.search;

  const clearFilters = () => {
    table.setSearch('');
    table.setFilter('status', undefined);
    table.setFilter('payment_status', undefined);
    table.setFilter('payment_method', undefined);
    table.setFilter('from', undefined);
    table.setFilter('to', undefined);
    setSearchParams({}, { replace: true });
  };

  const columns: Column<Order>[] = [
    {
      key: 'order_number',
      header: 'Order',
      sortable: true,
      render: (o) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
            <Package size={16} className="text-primary-600" />
          </div>
          <div>
            <p className="font-semibold text-neutral-800">{o.order_number}</p>
            <p className="text-xs text-neutral-400">{formatDate(o.placed_at)}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (o) => (
        <div className="min-w-0">
          <p className="text-neutral-700 truncate max-w-[200px]">{o.customer?.name ?? 'Guest'}</p>
          {o.customer?.phone && (
            <p className="text-xs text-neutral-500 truncate max-w-[200px]">{o.customer.phone}</p>
          )}
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      sortable: true,
      render: (o) => <span className="font-semibold text-neutral-800">{formatCurrency(o.total)}</span>,
    },
    {
      key: 'payment_status',
      header: 'Payment',
      render: (o) => (
        <Badge className={PAYMENT_STATUS_COLORS[o.payment_status]}>
          {o.payment_status} · {o.payment_method.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Live Tracking / Status',
      sortable: true,
      render: (o) => (
        <div className="flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <select
              value={o.status}
              disabled={updatingId === o.id || !canUpdate}
              onChange={(e) => handleQuickStatusChange(o.id, e.target.value as OrderStatus)}
              className={`text-xs font-bold rounded-xl px-2.5 py-1 border cursor-pointer transition-all shadow-xs focus:ring-2 focus:ring-primary-500 focus:outline-none ${ORDER_STATUS_COLORS[o.status]}`}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="bg-white text-neutral-800 font-medium">
                  {ORDER_STATUS_LABELS[s] || s}
                </option>
              ))}
            </select>
            {updatingId === o.id && (
              <span className="text-[10px] text-primary-600 font-bold animate-pulse">Updating…</span>
            )}
          </div>

          {/* Quick 1-Click Status Progression */}
          {canUpdate && (
            <div className="flex items-center gap-1">
              {['pending', 'confirmed'].includes(o.status) && (
                <button
                  type="button"
                  onClick={() => handleQuickStatusChange(o.id, 'packed')}
                  className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1 transition-colors"
                  title="Mark as Packed"
                >
                  <Package size={11} />
                  <span>Pack Ho Gaya</span>
                </button>
              )}

              {o.status === 'packed' && (
                <button
                  type="button"
                  onClick={() => handleQuickStatusChange(o.id, 'out_for_delivery')}
                  className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 flex items-center gap-1 transition-colors"
                  title="Mark Out for Delivery / On the Way"
                >
                  <Truck size={11} />
                  <span>Raste Me Hai</span>
                </button>
              )}

              {o.status === 'out_for_delivery' && (
                <button
                  type="button"
                  onClick={() => handleQuickStatusChange(o.id, 'delivered')}
                  className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 transition-colors"
                  title="Mark as Delivered"
                >
                  <CheckCircle2 size={11} />
                  <span>Deliver Ho Gaya</span>
                </button>
              )}
            </div>
          )}
        </div>
      ),
    },
  ];

  const currentStatusFilter = (table.filters.status as string) || '';

  return (
    <div>
      <PageHeader
        title="Orders & Tracking Desk"
        subtitle="Manage live orders, pack groceries, dispatch deliveries, and update customer tracking."
        actions={
          <Button variant="outline" icon={<Download size={16} />} onClick={handleExport} loading={exporting}>
            Export
          </Button>
        }
      />

      {/* Quick Live Tracking Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {[
          { id: '', label: 'All Orders', count: stats?.totalOrders, icon: ShoppingBag, color: 'text-neutral-700' },
          { id: 'pending', label: 'Order Aaya (Pending)', count: stats?.pending, icon: Clock, color: 'text-amber-600' },
          { id: 'packed', label: 'Pack Ho Raha (Packed)', count: stats?.statusBreakdown?.packed, icon: Package, color: 'text-indigo-600' },
          { id: 'out_for_delivery', label: 'Raste Me Hai (On the Way)', count: stats?.outForDelivery, icon: Truck, color: 'text-cyan-600' },
          { id: 'delivered', label: 'Deliver Ho Gaya', count: stats?.delivered, icon: CheckCircle2, color: 'text-emerald-600' },
          { id: 'cancelled', label: 'Cancelled', count: stats?.cancelled, icon: X, color: 'text-rose-600' },
        ].map((tab) => {
          const isSelected = currentStatusFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => table.setFilter('status', tab.id || undefined)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              <tab.icon size={14} className={isSelected ? 'text-white' : tab.color} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* KPI cards — real order metrics from the API */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
        <StatCard
          label="Total Orders"
          value={stats?.totalOrders ?? 0}
          icon={ShoppingBag}
          trend={stats ? { value: `${stats.todayOrders} today`, positive: stats.todayOrders > 0 } : null}
          loading={!stats}
        />
        <StatCard
          label="Pending (Order Aaya)"
          value={stats?.pending ?? 0}
          icon={Clock}
          iconClass="bg-amber-50 text-amber-600"
          trend={stats ? { value: `${stats.pending} awaiting pack`, positive: stats.pending === 0 } : null}
          loading={!stats}
        />
        <StatCard
          label="Out for Delivery (Raste Me)"
          value={stats?.outForDelivery ?? 0}
          icon={Truck}
          iconClass="bg-cyan-50 text-cyan-600"
          loading={!stats}
        />
        <StatCard
          label="Revenue"
          value={stats ? formatCompactCurrency(stats.revenue) : '—'}
          icon={Wallet}
          iconClass="bg-primary-50 text-primary-600"
          trend={stats ? { value: `AOV ${formatCompactCurrency(stats.avgOrderValue)}`, positive: true } : null}
          loading={!stats}
        />
        <StatCard
          label="Unpaid (COD / Pending)"
          value={stats ? formatCompactCurrency(stats.unpaidRevenue) : '—'}
          icon={AlertTriangle}
          iconClass="bg-rose-50 text-rose-600"
          trend={stats ? { value: `${stats.unpaidOrders} orders`, positive: stats.unpaidOrders === 0 } : null}
          loading={!stats}
        />
      </div>

      {/* Attention banner — pending orders awaiting confirmation */}
      {stats && stats.pending > 0 && (
        <button
          onClick={() => table.setFilter('status', table.filters.status === 'pending' ? undefined : 'pending')}
          className="w-full flex items-center gap-3 mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100 text-left hover:bg-amber-100/70 transition-colors"
        >
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">
              {stats.pending} order{stats.pending === 1 ? '' : 's'}
            </span>{' '}
            awaiting confirmation.{' '}
            <span className="font-medium underline">
              {table.filters.status === 'pending' ? 'Show all orders' : 'Review pending →'}
            </span>
          </p>
        </button>
      )}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row flex-wrap gap-3 mb-4">
        <SearchInput
          value={table.search}
          onChange={table.setSearch}
          placeholder="Search order number or coupon…"
          className="flex-1 min-w-[200px]"
        />
        <Select
          value={(table.filters.status as string) ?? ''}
          onChange={(e) => table.setFilter('status', e.target.value || undefined)}
          className="lg:w-44"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
          ))}
        </Select>
        <Select
          value={(table.filters.payment_status as string) ?? ''}
          onChange={(e) => table.setFilter('payment_status', e.target.value || undefined)}
          className="lg:w-40"
        >
          <option value="">All payments</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </Select>
        <Select
          value={(table.filters.payment_method as string) ?? ''}
          onChange={(e) => table.setFilter('payment_method', e.target.value || undefined)}
          className="lg:w-36"
        >
          <option value="">All methods</option>
          {(Object.keys(PAYMENT_METHOD_LABELS) as Array<keyof typeof PAYMENT_METHOD_LABELS>).map((m) => (
            <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>
          ))}
        </Select>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={(table.filters.from as string) ?? ''}
            onChange={(e) => table.setFilter('from', e.target.value || undefined)}
            className="h-10 rounded-xl border border-neutral-200 px-3 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-400"
            aria-label="From date"
          />
          <span className="text-neutral-400 text-sm">–</span>
          <input
            type="date"
            value={(table.filters.to as string) ?? ''}
            onChange={(e) => table.setFilter('to', e.target.value || undefined)}
            className="h-10 rounded-xl border border-neutral-200 px-3 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-400"
            aria-label="To date"
          />
        </div>
        {activeFilters && (
          <Button variant="ghost" icon={<X size={15} />} onClick={clearFilters}>
            Clear
          </Button>
        )}
      </div>

      <DataTable
        table={table}
        columns={columns}
        selectable={canUpdate}
        onRowClick={(o) => navigate(`/orders/${o.id}`)}
        emptyTitle="No orders found"
        emptyMessage={
          activeFilters
            ? 'No orders match the current filters. Try clearing them.'
            : 'Orders placed in the store will appear here.'
        }
      />

      {canUpdate && (
        <BulkActionBar count={table.selected.size} onClear={table.clearSelection}>
          <Select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value as OrderStatus)}
            className="!h-9 !py-0 text-neutral-800 min-w-[150px]"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
            ))}
          </Select>
          <Button size="sm" variant="secondary" onClick={runBulkStatus} loading={bulkBusy}>
            Apply status
          </Button>
        </BulkActionBar>
      )}
    </div>
  );
}
