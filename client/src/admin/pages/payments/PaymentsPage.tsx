import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard, Banknote, Smartphone, Wallet, Download, CheckCircle2, Clock,
  XCircle, RotateCcw, TrendingUp, ExternalLink,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import DataTable, { Column } from '../../components/ui/DataTable';
import { Select, Switch } from '../../components/ui/FormField';
import { Loader, ErrorState } from '../../components/ui/States';
import { useTable } from '../../hooks/useTable';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  listPayments,
  getPaymentStats,
  listPaymentMethods,
  togglePaymentMethod,
  updateTransactionStatus,
  exportPaymentsCsv,
  type PaymentTransaction,
} from '../../lib/services/payments.service';
import {
  formatCurrency,
  formatCompactCurrency,
  formatDate,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from '../../lib/format';
import type { PaymentMethodRow, PaymentStatus } from '../../lib/types';

const METHOD_ICONS: Record<string, any> = { cod: Banknote, card: CreditCard, upi: Smartphone, wallet: Wallet };
const PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'paid', 'failed', 'refunded'];

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

export default function PaymentsPage() {
  const [tab, setTab] = useState<'transactions' | 'methods'>('transactions');
  const { can } = useAdminAuth();
  const canManage = can('payments.manage');

  return (
    <div>
      <PageHeader title="Payments" subtitle="Reconcile transactions and manage checkout payment methods." />

      <div className="flex items-center gap-1 mb-5 bg-neutral-100 p-1 rounded-xl w-fit">
        {(['transactions', 'methods'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
              tab === t ? 'bg-white text-neutral-800 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {t === 'transactions' ? 'Transactions' : 'Payment Methods'}
          </button>
        ))}
      </div>

      {tab === 'transactions' ? <TransactionsTab canManage={canManage} /> : <MethodsTab canManage={canManage} />}
    </div>
  );
}

/* ------------------------------ Transactions ----------------------------- */

function TransactionsTab({ canManage }: { canManage: boolean }) {
  const navigate = useNavigate();
  const toast = useToast();
  const table = useTable<PaymentTransaction>(listPayments, { initialSortBy: 'placed_at', initialSortDir: 'desc' });
  const { data: stats, reload: reloadStats } = useAsync(() => getPaymentStats(), []);
  const [exporting, setExporting] = useState(false);

  const refreshAll = useCallback(() => {
    table.refresh();
    reloadStats();
  }, [table, reloadStats]);

  const changeStatus = async (t: PaymentTransaction, ps: PaymentStatus) => {
    try {
      await updateTransactionStatus(t.order_id, ps);
      toast.success(`Payment marked ${ps}`);
      refreshAll();
    } catch (err: any) {
      toast.error(err?.message ?? 'Update failed');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const csv = await exportPaymentsCsv({
        search: table.search,
        sortBy: table.sortBy,
        sortDir: table.sortDir,
        filters: table.filters,
      });
      downloadCsv(`payments-${new Date().toISOString().slice(0, 10)}.csv`, csv);
      toast.success('Export ready');
    } catch (err: any) {
      toast.error(err?.message ?? 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const activeFilters =
    !!table.search || !!table.filters.payment_status || !!table.filters.payment_method ||
    !!table.filters.from || !!table.filters.to;
  const clearFilters = () => {
    table.setSearch('');
    table.setFilter('payment_status', undefined);
    table.setFilter('payment_method', undefined);
    table.setFilter('from', undefined);
    table.setFilter('to', undefined);
  };

  const columns: Column<PaymentTransaction>[] = [
    {
      key: 'order_number',
      header: 'Order',
      sortable: true,
      render: (t) => (
        <div>
          <p className="font-semibold text-neutral-800 flex items-center gap-1">
            {t.order_number}
            <ExternalLink size={12} className="text-neutral-300" />
          </p>
          <p className="text-xs text-neutral-400">{formatDate(t.placed_at)}</p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (t) => <span className="text-neutral-700">{t.customer?.name ?? 'Guest'}</span>,
    },
    {
      key: 'payment_method',
      header: 'Method',
      render: (t) => <Badge className="bg-neutral-100 text-neutral-600">{PAYMENT_METHOD_LABELS[t.payment_method]}</Badge>,
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (t) => <span className="font-semibold text-neutral-800">{formatCurrency(t.amount)}</span>,
    },
    {
      key: 'payment_status',
      header: 'Payment',
      sortable: true,
      render: (t) =>
        canManage ? (
          <div onClick={(e) => e.stopPropagation()}>
            <Select
              value={t.payment_status}
              onChange={(e) => changeStatus(t, e.target.value as PaymentStatus)}
              className="!py-1 !text-xs !w-32"
            >
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </Select>
          </div>
        ) : (
          <Badge className={PAYMENT_STATUS_COLORS[t.payment_status]}>{t.payment_status}</Badge>
        ),
    },
    {
      key: 'order_status',
      header: 'Order',
      render: (t) => <Badge className={ORDER_STATUS_COLORS[t.order_status]}>{ORDER_STATUS_LABELS[t.order_status]}</Badge>,
    },
  ];

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button variant="outline" icon={<Download size={16} />} onClick={handleExport} loading={exporting}>
          Export
        </Button>
      </div>

      {/* KPI cards — real payment metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
        <StatCard
          label="Collected"
          value={stats ? formatCompactCurrency(stats.collected) : '—'}
          icon={CheckCircle2}
          iconClass="bg-primary-50 text-primary-600"
          trend={stats ? { value: `${stats.collectionRate.toFixed(0)}% of sales`, positive: stats.collectionRate >= 60 } : null}
          loading={!stats}
        />
        <StatCard
          label="Pending"
          value={stats ? formatCompactCurrency(stats.pending) : '—'}
          icon={Clock}
          iconClass="bg-amber-50 text-amber-600"
          trend={stats ? { value: `${stats.pendingOrders} orders`, positive: stats.pendingOrders === 0 } : null}
          loading={!stats}
        />
        <StatCard
          label="Failed"
          value={stats ? formatCompactCurrency(stats.failed) : '—'}
          icon={XCircle}
          iconClass="bg-rose-50 text-rose-600"
          trend={stats ? { value: `${stats.failedOrders} orders`, positive: stats.failedOrders === 0 } : null}
          loading={!stats}
        />
        <StatCard
          label="Refunded"
          value={stats ? formatCompactCurrency(stats.refunded) : '—'}
          icon={RotateCcw}
          iconClass="bg-neutral-100 text-neutral-500"
          trend={stats ? { value: `${stats.refundedOrders} orders`, positive: true } : null}
          loading={!stats}
        />
        <StatCard
          label="COD Due"
          value={stats ? formatCompactCurrency(stats.codDue) : '—'}
          icon={Banknote}
          iconClass="bg-blue-50 text-blue-600"
          trend={stats ? { value: `${stats.codDueOrders} orders`, positive: stats.codDueOrders === 0 } : null}
          loading={!stats}
        />
      </div>

      {/* By-method breakdown */}
      {stats && stats.byMethod.length > 0 && (
        <div className="bg-white rounded-2xl shadow-card p-5 mb-5">
          <h3 className="text-sm font-bold text-neutral-800 mb-4 flex items-center gap-2">
            <TrendingUp size={15} /> Collection by method
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.byMethod.map((m) => {
              const Icon = METHOD_ICONS[m.method] ?? CreditCard;
              const pct = m.amount > 0 ? (m.collected / m.amount) * 100 : 0;
              return (
                <div key={m.method} className="border border-neutral-100 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={15} className="text-neutral-500" />
                    <span className="text-sm font-semibold text-neutral-700">{PAYMENT_METHOD_LABELS[m.method]}</span>
                    <span className="ml-auto text-xs text-neutral-400">{m.orders}</span>
                  </div>
                  <p className="text-base font-bold text-neutral-800">{formatCurrency(m.collected)}</p>
                  <p className="text-xs text-neutral-400 mb-2">of {formatCurrency(m.amount)} expected</p>
                  <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row flex-wrap gap-3 mb-4">
        <SearchInput value={table.search} onChange={table.setSearch} placeholder="Search by order number…" className="flex-1 min-w-[200px]" />
        <Select
          value={(table.filters.payment_status as string) ?? ''}
          onChange={(e) => table.setFilter('payment_status', e.target.value || undefined)}
          className="lg:w-40"
        >
          <option value="">All payments</option>
          {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </Select>
        <Select
          value={(table.filters.payment_method as string) ?? ''}
          onChange={(e) => table.setFilter('payment_method', e.target.value || undefined)}
          className="lg:w-40"
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
        {activeFilters && <Button variant="ghost" onClick={clearFilters}>Clear</Button>}
      </div>

      <DataTable
        table={table}
        columns={columns}
        onRowClick={(t) => navigate(`/orders/${t.order_id}`)}
        emptyTitle="No transactions found"
        emptyMessage={activeFilters ? 'No payments match the current filters.' : 'Order payments will appear here.'}
      />
    </div>
  );
}

/* -------------------------------- Methods -------------------------------- */

function MethodsTab({ canManage }: { canManage: boolean }) {
  const toast = useToast();
  const { data, loading, error, reload, setData } = useAsync(() => listPaymentMethods(), []);

  if (loading) return <Loader label="Loading payment methods…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const methods = data ?? [];
  const enabledCount = methods.filter((m) => m.is_enabled).length;

  const toggle = async (m: PaymentMethodRow) => {
    const next = !m.is_enabled;
    setData(methods.map((x) => (x.id === m.id ? { ...x, is_enabled: next } : x)));
    try {
      await togglePaymentMethod(m.id, next);
      toast.success(`${m.name} ${next ? 'enabled' : 'disabled'}`);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed');
      reload();
    }
  };

  return (
    <div>
      <p className="text-sm text-neutral-500 mb-4">
        <span className="font-semibold text-neutral-700">{enabledCount}</span> of {methods.length} methods enabled at checkout.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
        {methods.map((m) => {
          const Icon = METHOD_ICONS[m.code] ?? CreditCard;
          return (
            <div key={m.id} className="bg-white rounded-2xl shadow-card p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${m.is_enabled ? 'bg-primary-50 text-primary-600' : 'bg-neutral-100 text-neutral-400'}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="font-semibold text-neutral-800">{m.name}</p>
                  <p className="text-xs text-neutral-400 uppercase">{m.code}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={m.is_enabled ? 'bg-primary-100 text-primary-700' : 'bg-neutral-200 text-neutral-600'}>
                  {m.is_enabled ? 'Enabled' : 'Disabled'}
                </Badge>
                <Switch checked={m.is_enabled} onChange={() => toggle(m)} disabled={!canManage} />
              </div>
            </div>
          );
        })}
      </div>
      {!methods.length && <p className="text-sm text-neutral-400 mt-4">No payment methods configured. Run the seed.</p>}
    </div>
  );
}
