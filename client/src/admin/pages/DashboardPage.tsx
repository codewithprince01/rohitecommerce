import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IndianRupee,
  ShoppingCart,
  Users,
  AlertTriangle,
  TrendingUp,
  Package,
  RefreshCw,
  Clock,
  Truck,
  PackageX,
  Wallet,
  ScrollText,
  ArrowRight,
  Trophy,
} from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Loader, ErrorState, EmptyState } from '../components/ui/States';
import PageHeader from '../components/ui/PageHeader';
import { useAsync } from '../hooks/useAsync';
import {
  getDashboardStats,
  RANGE_LABELS,
  type RangeKey,
  type Metric,
} from '../lib/services/dashboard.service';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
  formatCurrency,
  formatCompactCurrency,
  timeAgo,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_METHOD_LABELS,
} from '../lib/format';
import type { OrderStatus } from '../lib/types';

const RANGES: RangeKey[] = ['7d', '30d', '90d'];

function trendOf(m: Metric): { value: string; positive: boolean } | null {
  if (m.changePct === null) return m.value > 0 ? { value: 'New', positive: true } : null;
  const sign = m.changePct >= 0 ? '+' : '';
  return { value: `${sign}${m.changePct.toFixed(1)}%`, positive: m.changePct >= 0 };
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { admin } = useAdminAuth();
  const [range, setRange] = useState<RangeKey>('7d');
  const { data, loading, error, reload } = useAsync(() => getDashboardStats(range), [range]);

  if (loading) return <Loader label="Crunching numbers…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  const maxRev = Math.max(1, ...data.salesByDay.map((d) => d.revenue));

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${admin?.full_name?.split(' ')[0] || 'Admin'}`}
        subtitle="Here's what's happening in your store."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-neutral-100 rounded-xl p-1">
              {RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    range === r ? 'bg-white text-neutral-800 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" icon={<RefreshCw size={15} />} onClick={reload}>
              Refresh
            </Button>
          </div>
        }
      />

      {/* KPI cards (period vs previous period) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={`Revenue · ${RANGE_LABELS[range]}`} value={formatCurrency(data.revenue.value)} icon={IndianRupee} trend={trendOf(data.revenue)} />
        <StatCard label="Orders" value={data.orders.value} icon={ShoppingCart} iconClass="bg-blue-50 text-blue-600" trend={trendOf(data.orders)} />
        <StatCard label="Avg Order Value" value={formatCurrency(data.avgOrderValue.value)} icon={TrendingUp} iconClass="bg-violet-50 text-violet-600" trend={trendOf(data.avgOrderValue)} />
        <StatCard label="New Customers" value={data.newCustomers.value} icon={Users} iconClass="bg-cyan-50 text-cyan-600" trend={trendOf(data.newCustomers)} />
      </div>

      {/* Operational alert strip (live, current-state counters) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
        <OpTile icon={Clock} label="Pending" value={data.pendingOrders} tone="amber" onClick={() => navigate('/orders?status=pending')} />
        <OpTile icon={Package} label="Processing" value={data.processingOrders} tone="blue" onClick={() => navigate('/orders')} />
        <OpTile icon={Truck} label="Out for delivery" value={data.outForDelivery} tone="cyan" onClick={() => navigate('/orders?status=out_for_delivery')} />
        <OpTile icon={AlertTriangle} label="Low stock" value={data.lowStockCount} tone="amber" onClick={() => navigate('/inventory')} />
        <OpTile icon={PackageX} label="Out of stock" value={data.outOfStockCount} tone="rose" onClick={() => navigate('/inventory')} />
        <OpTile icon={Wallet} label="Unpaid" value={formatCompactCurrency(data.unpaidRevenue)} tone="violet" onClick={() => navigate('/orders?payment_status=pending')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* Sales chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-neutral-800">Revenue trend</h3>
              <p className="text-xs text-neutral-400 mt-0.5">{RANGE_LABELS[range]} · {data.orders.value} orders</p>
            </div>
            <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full">
              {data.fulfilledRate.toFixed(0)}% fulfilled
            </span>
          </div>
          <div className="flex items-end justify-between gap-1 h-44">
            {data.salesByDay.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full flex items-end justify-center h-36 relative">
                  <div
                    className="w-full max-w-[34px] bg-primary-500 rounded-t-lg group-hover:bg-primary-600 transition-colors"
                    style={{ height: `${(d.revenue / maxRev) * 100}%`, minHeight: d.revenue > 0 ? '6px' : '2px' }}
                    title={`${formatCurrency(d.revenue)} · ${d.orders} orders`}
                  />
                </div>
                {data.salesByDay.length <= 31 && (
                  <span className="text-[9px] text-neutral-400">
                    {new Date(d.date).toLocaleDateString('en-IN', range === '7d' ? { weekday: 'short' } : { day: '2-digit', month: 'short' }).replace(' ', '')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Status breakdown */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h3 className="text-base font-bold text-neutral-800 mb-4">Orders by status</h3>
          <div className="flex flex-col gap-2.5">
            {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((s) => (
              <div key={s} className="flex items-center justify-between">
                <Badge className={ORDER_STATUS_COLORS[s]}>{ORDER_STATUS_LABELS[s]}</Badge>
                <span className="text-sm font-semibold text-neutral-700">{data.statusBreakdown[s] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-neutral-800">Recent orders</h3>
            <button onClick={() => navigate('/orders')} className="text-sm text-primary-600 font-semibold hover:text-primary-700 inline-flex items-center gap-1">
              View all <ArrowRight size={14} />
            </button>
          </div>
          {data.recentOrders.length === 0 ? (
            <EmptyState title="No orders yet" message="Orders will appear here once customers start buying." />
          ) : (
            <div className="divide-y divide-neutral-50">
              {data.recentOrders.map((o) => (
                <button
                  key={o.id}
                  onClick={() => navigate(`/orders/${o.id}`)}
                  className="w-full flex items-center justify-between py-3 hover:bg-neutral-50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
                      <Package size={16} className="text-primary-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-neutral-800">{o.order_number}</p>
                      <p className="text-xs text-neutral-500">{o.customer?.name ?? 'Guest'} · {timeAgo(o.placed_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={ORDER_STATUS_COLORS[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge>
                    <span className="text-sm font-bold text-neutral-800">{formatCurrency(o.total)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h3 className="text-base font-bold text-neutral-800 mb-4">Top products</h3>
          {data.topProducts.length === 0 ? (
            <EmptyState title="No sales data" />
          ) : (
            <div className="flex flex-col gap-3">
              {data.topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-neutral-100 text-neutral-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-700 truncate">{p.name}</p>
                    <p className="text-[11px] text-neutral-400">{p.qty} sold</p>
                  </div>
                  <span className="text-sm font-semibold text-neutral-800">{formatCompactCurrency(p.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* Top customers */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={16} className="text-amber-500" />
            <h3 className="text-base font-bold text-neutral-800">Top customers</h3>
          </div>
          {data.topCustomers.length === 0 ? (
            <EmptyState title="No customer sales yet" />
          ) : (
            <div className="flex flex-col gap-3">
              {data.topCustomers.map((c) => (
                <button key={c.id} onClick={() => navigate(`/customers/${c.id}`)} className="flex items-center gap-3 text-left hover:bg-neutral-50 -mx-2 px-2 py-1 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-700 truncate">{c.name}</p>
                    <p className="text-[11px] text-neutral-400">{c.orders} orders</p>
                  </div>
                  <span className="text-sm font-semibold text-neutral-800">{formatCompactCurrency(c.total)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Payment split */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h3 className="text-base font-bold text-neutral-800 mb-4">Payment methods</h3>
          {data.paymentSplit.length === 0 ? (
            <EmptyState title="No payments yet" />
          ) : (
            <div className="flex flex-col gap-3">
              {data.paymentSplit.map((p) => {
                const total = data.paymentSplit.reduce((s, x) => s + x.total, 0) || 1;
                const pct = (p.total / total) * 100;
                return (
                  <div key={p.method}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-neutral-600">{PAYMENT_METHOD_LABELS[p.method]}</span>
                      <span className="text-sm font-semibold text-neutral-800">{formatCompactCurrency(p.total)}</span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Low stock alerts */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-neutral-800">Low stock alerts</h3>
            <button onClick={() => navigate('/inventory')} className="text-xs text-primary-600 font-semibold hover:text-primary-700">Manage</button>
          </div>
          {data.lowStockItems.length === 0 ? (
            <EmptyState title="Stock looks healthy" />
          ) : (
            <div className="flex flex-col gap-2.5">
              {data.lowStockItems.map((it) => (
                <div key={it.id} className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-700 truncate">{it.productName}</p>
                    <p className="text-[11px] text-neutral-400">{it.variantLabel}</p>
                  </div>
                  <Badge className={it.stock <= 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}>
                    {it.stock <= 0 ? 'Out' : `${it.stock} left`}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-2xl shadow-card p-5 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <ScrollText size={16} className="text-neutral-500" />
          <h3 className="text-base font-bold text-neutral-800">Recent activity</h3>
        </div>
        {data.recentActivity.length === 0 ? (
          <EmptyState title="No activity yet" message="Admin actions will be recorded here." />
        ) : (
          <div className="divide-y divide-neutral-50">
            {data.recentActivity.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                    <ScrollText size={14} className="text-neutral-500" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-700">
                      <span className="font-semibold">{a.action.replace(/_/g, ' ')}</span>
                      {a.entity_type ? <span className="text-neutral-400"> · {a.entity_type}</span> : null}
                    </p>
                    <p className="text-[11px] text-neutral-400">{a.admin_email ?? 'system'}</p>
                  </div>
                </div>
                <span className="text-xs text-neutral-400">{timeAgo(a.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ----------------------------- Operational tile ----------------------------- */
const TONES: Record<string, string> = {
  amber: 'bg-amber-50 text-amber-600',
  blue: 'bg-blue-50 text-blue-600',
  cyan: 'bg-cyan-50 text-cyan-600',
  rose: 'bg-rose-50 text-rose-600',
  violet: 'bg-violet-50 text-violet-600',
};

function OpTile({
  icon: Icon,
  label,
  value,
  tone,
  onClick,
}: {
  icon: typeof Clock;
  label: string;
  value: string | number;
  tone: keyof typeof TONES | string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl shadow-card p-3.5 flex items-center gap-3 hover:shadow-card-hover transition-shadow text-left"
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${TONES[tone] ?? TONES.blue}`}>
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-neutral-800 leading-tight">{value}</p>
        <p className="text-[11px] text-neutral-400 truncate">{label}</p>
      </div>
    </button>
  );
}
