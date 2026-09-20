import React, { useState, useCallback } from 'react';
import {
  Download, IndianRupee, ShoppingCart, TrendingUp, XCircle, Users, Package,
  Percent, RefreshCw, Trophy, CalendarDays,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Input } from '../../components/ui/FormField';
import { Loader, ErrorState, EmptyState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import {
  getReport, exportOrdersCsv, toCsv, downloadCsv,
  type ReportData, type Metric,
} from '../../lib/services/reports.service';
import { formatCurrency, formatCompactCurrency, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_METHOD_LABELS } from '../../lib/format';
import type { OrderStatus, PaymentMethod } from '../../lib/types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
const today = () => new Date().toISOString().slice(0, 10);

function trendOf(m: Metric): { value: string; positive: boolean } | null {
  if (m.changePct === null) return m.value > 0 ? { value: 'New', positive: true } : null;
  const sign = m.changePct >= 0 ? '+' : '';
  return { value: `${sign}${m.changePct.toFixed(1)}%`, positive: m.changePct >= 0 };
}

const PRESETS = [
  { key: '7d', label: '7D', days: 7 },
  { key: '30d', label: '30D', days: 30 },
  { key: '90d', label: '90D', days: 90 },
];

export default function ReportsPage() {
  const toast = useToast();
  const [range, setRange] = useState({ from: isoDaysAgo(30), to: today() });
  const [applied, setApplied] = useState(range);
  const [preset, setPreset] = useState<string | null>('30d');
  const [exporting, setExporting] = useState(false);

  const loader = useCallback(
    () => getReport(`${applied.from}T00:00:00`, `${applied.to}T23:59:59`),
    [applied]
  );
  const { data, loading, error, reload } = useAsync(loader, [applied]);

  const applyPreset = (key: string, days: number) => {
    const next = { from: isoDaysAgo(days), to: today() };
    setRange(next);
    setApplied(next);
    setPreset(key);
  };

  const applyCustom = () => {
    setApplied(range);
    setPreset(null);
  };

  const exportSummaryCsv = () => {
    if (!data) return;
    const rows = data.byDay.map((d) => ({ date: d.date, revenue: d.revenue, orders: d.orders }));
    downloadCsv(`agrawal-store-daily-${applied.from}-to-${applied.to}.csv`, toCsv(rows));
  };

  const exportOrders = async () => {
    setExporting(true);
    try {
      const csv = await exportOrdersCsv(`${applied.from}T00:00:00`, `${applied.to}T23:59:59`);
      if (!csv) return toast.error('No orders in this range');
      downloadCsv(`agrawal-store-orders-${applied.from}-to-${applied.to}.csv`, csv);
      toast.success('Orders exported');
    } catch (err: any) {
      toast.error(err?.message ?? 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Sales performance, product and customer insights over any date range."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={<RefreshCw size={15} />} onClick={reload}>Refresh</Button>
            <Button variant="outline" icon={<Download size={16} />} onClick={exportSummaryCsv} disabled={!data?.byDay.length}>Daily CSV</Button>
            <Button icon={<Download size={16} />} onClick={exportOrders} loading={exporting}>Orders CSV</Button>
          </div>
        }
      />

      {/* Range controls */}
      <div className="flex flex-col lg:flex-row lg:items-end gap-3 mb-5 bg-white rounded-2xl shadow-card p-4">
        <div className="flex items-center bg-neutral-100 rounded-xl p-1">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key, p.days)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                preset === p.key ? 'bg-white text-neutral-800 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="hidden lg:block w-px h-9 bg-neutral-100" />
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">From</label>
            <Input type="date" value={range.from} max={range.to} onChange={(e) => setRange({ ...range, from: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">To</label>
            <Input type="date" value={range.to} max={today()} onChange={(e) => setRange({ ...range, to: e.target.value })} />
          </div>
          <Button variant="secondary" icon={<CalendarDays size={15} />} onClick={applyCustom}>Apply</Button>
        </div>
        {data && (
          <p className="lg:ml-auto text-xs text-neutral-400 self-center">
            {data.range.days} day{data.range.days === 1 ? '' : 's'} · vs previous {data.range.days} days
          </p>
        )}
      </div>

      {loading ? (
        <Loader label="Building report…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data ? null : (
        <ReportBody data={data} />
      )}
    </div>
  );
}

/* ============================== Report body ============================= */

function ReportBody({ data }: { data: ReportData }) {
  const maxRev = Math.max(1, ...data.byDay.map((d) => d.revenue));
  const maxWd = Math.max(1, ...data.byWeekday.map((d) => d.revenue));
  const showDayLabels = data.byDay.length <= 31;
  const paySum = data.paymentSplit.reduce((s, p) => s + p.total, 0) || 1;
  const catMax = Math.max(1, ...data.salesByCategory.map((c) => c.revenue));
  const statusKeys = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

  return (
    <>
      {/* KPI cards with period-over-period deltas */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
        <StatCard label="Revenue" value={formatCompactCurrency(data.revenue.value)} icon={IndianRupee} trend={trendOf(data.revenue)} />
        <StatCard label="Orders" value={data.orders.value} icon={ShoppingCart} iconClass="bg-blue-50 text-blue-600" trend={trendOf(data.orders)} />
        <StatCard label="Avg Order" value={formatCurrency(data.avgOrderValue.value)} icon={TrendingUp} iconClass="bg-violet-50 text-violet-600" trend={trendOf(data.avgOrderValue)} />
        <StatCard label="Items Sold" value={data.itemsSold.value.toLocaleString('en-IN')} icon={Package} iconClass="bg-cyan-50 text-cyan-600" trend={trendOf(data.itemsSold)} />
        <StatCard label="New Customers" value={data.newCustomers.value} icon={Users} iconClass="bg-primary-50 text-primary-600" trend={trendOf(data.newCustomers)} />
        <StatCard label="Discounts" value={formatCompactCurrency(data.discounts.value)} icon={Percent} iconClass="bg-rose-50 text-rose-600" trend={trendOf(data.discounts)} />
      </div>

      {/* Revenue trend + composition */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-neutral-800">Revenue trend</h3>
              <p className="text-xs text-neutral-400 mt-0.5">{data.validOrders} valid orders · {data.fulfilledRate.toFixed(0)}% fulfilled</p>
            </div>
            <span className="text-sm font-bold text-neutral-800">{formatCurrency(data.revenue.value)}</span>
          </div>
          {data.revenue.value === 0 ? (
            <EmptyState title="No sales in this range" message="Try a different date range." />
          ) : (
            <div className="flex items-end gap-1 h-48 overflow-x-auto">
              {data.byDay.map((d) => (
                <div key={d.date} className="flex-1 min-w-[10px] flex flex-col items-center gap-2 group">
                  <div className="w-full flex items-end justify-center h-40">
                    <div
                      className="w-full max-w-[26px] bg-primary-500 rounded-t-md group-hover:bg-primary-600 transition-colors"
                      style={{ height: `${(d.revenue / maxRev) * 100}%`, minHeight: d.revenue > 0 ? '3px' : '0' }}
                      title={`${d.date}: ${formatCurrency(d.revenue)} · ${d.orders} orders`}
                    />
                  </div>
                  {showDayLabels && <span className="text-[9px] text-neutral-400">{d.date.slice(5)}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue composition */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h3 className="text-base font-bold text-neutral-800 mb-4">Revenue composition</h3>
          <div className="flex flex-col gap-3">
            <CompRow label="Gross sales" value={data.composition.subtotal} />
            <CompRow label="Discounts" value={-data.composition.discount} negative />
            <CompRow label="Delivery fees" value={data.composition.delivery} />
            <CompRow label="Tax" value={data.composition.tax} />
            <div className="border-t border-neutral-100 pt-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-neutral-700">Net revenue</span>
              <span className="text-base font-bold text-neutral-900">{formatCurrency(data.composition.total)}</span>
            </div>
            <div className="rounded-xl bg-rose-50 px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-rose-600 inline-flex items-center gap-1.5"><XCircle size={13} /> Cancelled / returned</span>
              <span className="text-xs font-semibold text-rose-700">{data.cancelledCount} · {formatCompactCurrency(data.cancelledRevenue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category sales + payment split + status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h3 className="text-base font-bold text-neutral-800 mb-4">Sales by category</h3>
          {data.salesByCategory.length === 0 ? (
            <EmptyState title="No category sales" />
          ) : (
            <div className="flex flex-col gap-3">
              {data.salesByCategory.map((c) => (
                <div key={c.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-neutral-600 truncate max-w-[150px]">{c.name}</span>
                    <span className="text-sm font-semibold text-neutral-800">{formatCompactCurrency(c.revenue)}</span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full" style={{ width: `${(c.revenue / catMax) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-card p-5">
          <h3 className="text-base font-bold text-neutral-800 mb-4">Payment methods</h3>
          {data.paymentSplit.length === 0 ? (
            <EmptyState title="No payments" />
          ) : (
            <div className="flex flex-col gap-3">
              {data.paymentSplit.map((p) => (
                <div key={p.method}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-neutral-600">{PAYMENT_METHOD_LABELS[p.method as PaymentMethod] ?? p.method}</span>
                    <span className="text-sm font-semibold text-neutral-800">{formatCompactCurrency(p.total)}</span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: `${(p.total / paySum) * 100}%` }} />
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">{p.orders} order{p.orders === 1 ? '' : 's'}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-card p-5">
          <h3 className="text-base font-bold text-neutral-800 mb-4">Orders by status</h3>
          <div className="flex flex-col gap-2.5">
            {statusKeys.map((s) => (
              <div key={s} className="flex items-center justify-between">
                <Badge className={ORDER_STATUS_COLORS[s]}>{ORDER_STATUS_LABELS[s]}</Badge>
                <span className="text-sm font-semibold text-neutral-700">{data.statusBreakdown[s] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top products + customers + weekday */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h3 className="text-base font-bold text-neutral-800 mb-4">Top products</h3>
          {data.topProducts.length === 0 ? (
            <EmptyState title="No product sales" />
          ) : (
            <div className="flex flex-col gap-3">
              {data.topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-neutral-100 text-neutral-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-700 truncate">{p.name}</p>
                    <p className="text-xs text-neutral-400">{p.qty} sold</p>
                  </div>
                  <span className="text-sm font-semibold text-neutral-800">{formatCompactCurrency(p.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={16} className="text-amber-500" />
            <h3 className="text-base font-bold text-neutral-800">Top customers</h3>
          </div>
          {data.topCustomers.length === 0 ? (
            <EmptyState title="No customer sales" />
          ) : (
            <div className="flex flex-col gap-3">
              {data.topCustomers.map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-700 truncate">{c.name}</p>
                    <p className="text-[11px] text-neutral-400">{c.orders} order{c.orders === 1 ? '' : 's'}</p>
                  </div>
                  <span className="text-sm font-semibold text-neutral-800">{formatCompactCurrency(c.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-card p-5">
          <h3 className="text-base font-bold text-neutral-800 mb-4">Sales by weekday</h3>
          {data.revenue.value === 0 ? (
            <EmptyState title="No data" />
          ) : (
            <div className="flex items-end justify-between gap-1.5 h-44">
              {data.byWeekday.map((d) => (
                <div key={d.weekday} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <div className="w-full flex items-end justify-center h-36">
                    <div
                      className="w-full max-w-[22px] bg-cyan-500 rounded-t-md group-hover:bg-cyan-600 transition-colors"
                      style={{ height: `${(d.revenue / maxWd) * 100}%`, minHeight: d.revenue > 0 ? '3px' : '0' }}
                      title={`${WEEKDAYS[d.weekday - 1]}: ${formatCurrency(d.revenue)} · ${d.orders} orders`}
                    />
                  </div>
                  <span className="text-[10px] text-neutral-400">{WEEKDAYS[d.weekday - 1]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function CompRow({ label, value, negative }: { label: string; value: number; negative?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className={`text-sm font-medium ${negative ? 'text-rose-500' : 'text-neutral-800'}`}>
        {negative && value !== 0 ? '−' : ''}{formatCurrency(Math.abs(value))}
      </span>
    </div>
  );
}
