import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, User, Clock, CreditCard, Printer, Trash2, StickyNote, Tag,
  Package, Truck, CheckCircle2, AlertTriangle, SlidersHorizontal, Home,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import FormField, { Textarea, Select } from '../../components/ui/FormField';
import { Loader, ErrorState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { useConfirm } from '../../hooks/useConfirm';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  getOrder,
  orderHistory,
  updateOrderStatus,
  updatePaymentStatus,
  deleteOrder,
} from '../../lib/services/orders.service';
import {
  formatCurrency,
  formatDateTime,
  PAYMENT_METHOD_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_SHORT_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_COLORS,
  ORDER_TRANSITIONS,
} from '../../lib/format';
import type { Order, OrderStatus, PaymentStatus } from '../../lib/types';

/** Opens a clean, self-contained invoice in a new window and prints it. */
function printInvoice(order: Order) {
  const w = window.open('', '_blank', 'width=820,height=920');
  if (!w) return;
  const addr = order.delivery_address as Record<string, any> | null;
  const addrLine = addr
    ? [addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')
    : '';
  const rows = (order.items ?? [])
    .map(
      (it) => `<tr>
        <td>${it.product_name}${it.variant_label ? ` <span class="muted">(${it.variant_label})</span>` : ''}</td>
        <td class="r">${formatCurrency(it.unit_price)}</td>
        <td class="r">${it.quantity}</td>
        <td class="r">${formatCurrency(it.line_total)}</td>
      </tr>`
    )
    .join('');
  w.document.write(`<!doctype html><html><head><title>Invoice ${order.order_number}</title>
    <style>
      *{font-family:Arial,Helvetica,sans-serif;box-sizing:border-box}
      body{margin:32px;color:#1f2937}
      h1{font-size:20px;margin:0}
      .muted{color:#9ca3af}
      .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #16a34a;padding-bottom:12px;margin-bottom:16px}
      .brand{font-size:22px;font-weight:bold;color:#16a34a}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      th,td{padding:8px 6px;border-bottom:1px solid #eee;font-size:13px;text-align:left}
      th{color:#6b7280;text-transform:uppercase;font-size:11px}
      .r{text-align:right}
      .totals{margin-top:14px;margin-left:auto;width:260px;font-size:13px}
      .totals div{display:flex;justify-content:space-between;padding:3px 0}
      .totals .grand{border-top:2px solid #111;margin-top:6px;padding-top:8px;font-weight:bold;font-size:15px}
      .meta{font-size:13px;color:#374151;line-height:1.6}
    </style></head><body>
    <div class="top">
      <div>
        <div class="brand">Agrawal General & Provisional Store</div>
        <div class="muted" style="font-size:11px;line-height:1.4;margin-top:2px;">Fatehchand colony, ward no 5, near ram mandir chauraha, sabalgarh, Morena, madhya pradesh - 476229, India</div>
        <div class="muted" style="font-size:11px;font-weight:600;">Orders & Support: +91 9285108057</div>
        <div class="muted" style="font-weight:bold;margin-top:4px;">Tax Invoice</div>
      </div>
      <div class="meta r" style="text-align:right">
        <strong>${order.order_number}</strong><br/>
        ${formatDateTime(order.placed_at)}<br/>
        Status: ${ORDER_STATUS_LABELS[order.status] ?? order.status}
      </div>
    </div>
    <div class="meta">
      <strong>Billed to:</strong> ${order.customer?.name ?? 'Guest'}
      ${order.customer?.email ? `<br/>${order.customer.email}` : ''}
      ${order.customer?.phone ? `<br/>${order.customer.phone}` : ''}
      ${addrLine ? `<br/>${addrLine}` : ''}
    </div>
    <table>
      <thead><tr><th>Item</th><th class="r">Price</th><th class="r">Qty</th><th class="r">Total</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="4" class="muted">No items</td></tr>'}</tbody>
    </table>
    <div class="totals">
      <div><span>Subtotal</span><span>${formatCurrency(order.subtotal)}</span></div>
      <div><span>Discount</span><span>- ${formatCurrency(order.discount)}</span></div>
      <div><span>Delivery</span><span>${formatCurrency(order.delivery_fee)}</span></div>
      <div><span>Tax</span><span>${formatCurrency(order.tax)}</span></div>
      <div class="grand"><span>Total</span><span>${formatCurrency(order.total)}</span></div>
      <div class="muted" style="margin-top:6px">Payment: ${order.payment_status} · ${PAYMENT_METHOD_LABELS[order.payment_method]}</div>
    </div>
    </body></html>`);
  w.document.close();
  w.focus();
  w.print();
}

const ALL_ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const { can } = useAdminAuth();

  const { data: order, loading, error, reload } = useAsync(() => getOrder(id!), [id]);
  const { data: history, reload: reloadHistory } = useAsync(() => orderHistory(id!), [id]);

  const [statusModal, setStatusModal] = useState(false);
  const [nextStatus, setNextStatus] = useState<OrderStatus>('confirmed');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  if (loading) return <Loader label="Loading order…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!order) return <ErrorState message="Order not found" />;

  const canUpdate = can('orders.update');
  const canDelete = can('orders.delete');
  const addr = order.delivery_address as Record<string, any> | null;

  const openStatusModal = (preset?: OrderStatus) => {
    setNextStatus(preset || 'packed');
    setNote('');
    setStatusModal(true);
  };

  const applyStatus = async () => {
    setSaving(true);
    try {
      await updateOrderStatus(order.id, nextStatus, note || undefined);
      toast.success(`Order marked ${ORDER_STATUS_SHORT_LABELS[nextStatus] || nextStatus}`);
      setStatusModal(false);
      reload();
      reloadHistory();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickUpdate = async (status: OrderStatus, defaultNote?: string) => {
    setSaving(true);
    try {
      await updateOrderStatus(order.id, status, defaultNote);
      toast.success(`Order marked as ${ORDER_STATUS_SHORT_LABELS[status] || status}`);
      reload();
      reloadHistory();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const changePayment = async (ps: PaymentStatus) => {
    try {
      await updatePaymentStatus(order.id, ps);
      toast.success('Payment status updated');
      reload();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed');
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete order',
      message: `Delete ${order.order_number}? This permanently removes the order, its items and history. This cannot be undone.`,
      danger: true,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      await deleteOrder(order.id);
      toast.success('Order deleted');
      navigate('/orders');
    } catch (err: any) {
      toast.error(err?.message ?? 'Delete failed');
    }
  };

  return (
    <div>
      <button onClick={() => navigate('/orders')} className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 mb-4">
        <ArrowLeft size={16} /> Back to orders
      </button>

      <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-neutral-800">{order.order_number}</h1>
            <Badge className={ORDER_STATUS_COLORS[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
          </div>
          <p className="text-sm text-neutral-500 mt-1">Placed {formatDateTime(order.placed_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" icon={<Printer size={16} />} onClick={() => printInvoice(order)}>
            Invoice
          </Button>
          {canUpdate && (
            <Button onClick={() => openStatusModal()} icon={<SlidersHorizontal size={15} />}>
              Update Status
            </Button>
          )}
          {canDelete && (
            <Button variant="danger" icon={<Trash2 size={16} />} onClick={handleDelete}>
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Live Order Fulfillment & Tracking Stepper */}
      <div className="bg-white rounded-2xl shadow-card p-5 mb-5 border border-neutral-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h3 className="text-base font-bold text-neutral-900">Live Order Fulfillment & Tracking</h3>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Current Milestone: <strong className="text-neutral-800">{ORDER_STATUS_LABELS[order.status]}</strong>
            </p>
          </div>

          {/* Quick Action Progression Buttons */}
          {canUpdate && order.status !== 'delivered' && order.status !== 'cancelled' && (
            <div className="flex flex-wrap items-center gap-2">
              {['pending', 'confirmed'].includes(order.status) && (
                <Button
                  size="sm"
                  onClick={() => handleQuickUpdate('packed', 'Items packed and sealed in grocery bag')}
                  loading={saving}
                  icon={<Package size={15} />}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Mark Packed (Saman Pack Ho Gaya)
                </Button>
              )}

              {order.status === 'packed' && (
                <Button
                  size="sm"
                  onClick={() => handleQuickUpdate('out_for_delivery', 'Order dispatched with delivery pilot')}
                  loading={saving}
                  icon={<Truck size={15} />}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  Mark Out for Delivery (Raste Me Hai)
                </Button>
              )}

              {order.status === 'out_for_delivery' && (
                <Button
                  size="sm"
                  onClick={() => handleQuickUpdate('delivered', 'Order delivered successfully to customer')}
                  loading={saving}
                  icon={<CheckCircle2 size={15} />}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Mark Delivered (Ghar Pahuch Gaya)
                </Button>
              )}
            </div>
          )}
        </div>

        {/* 4-Step Visual Progress Bar */}
        {order.status !== 'cancelled' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                step: 0,
                key: 'placed',
                title: '1. Order Placed',
                subtitle: 'Order Aaya',
                icon: Clock,
                isCompleted: ['confirmed', 'packed', 'out_for_delivery', 'delivered'].includes(order.status),
                isActive: ['pending', 'confirmed'].includes(order.status),
              },
              {
                step: 1,
                key: 'packed',
                title: '2. Packing Groceries',
                subtitle: 'Saman Pack Ho Raha',
                icon: Package,
                isCompleted: ['out_for_delivery', 'delivered'].includes(order.status),
                isActive: order.status === 'packed',
              },
              {
                step: 2,
                key: 'out_for_delivery',
                title: '3. Out for Delivery',
                subtitle: 'Raste Me Hai (Pilot)',
                icon: Truck,
                isCompleted: order.status === 'delivered',
                isActive: order.status === 'out_for_delivery',
              },
              {
                step: 3,
                key: 'delivered',
                title: '4. Delivered',
                subtitle: 'Ghar Pahuch Gaya',
                icon: CheckCircle2,
                isCompleted: order.status === 'delivered',
                isActive: false,
              },
            ].map((st) => {
              const Icon = st.icon;
              return (
                <div
                  key={st.key}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                    st.isCompleted
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : st.isActive
                      ? 'bg-primary-50 border-primary-300 text-primary-950 shadow-xs ring-2 ring-primary-400/20'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        st.isCompleted
                          ? 'bg-emerald-500 text-white'
                          : st.isActive
                          ? 'bg-primary-500 text-white'
                          : 'bg-neutral-200 text-neutral-500'
                      }`}
                    >
                      {st.isCompleted ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                    </div>
                    <span className="text-[10px] uppercase font-extrabold tracking-wider">
                      {st.isCompleted ? 'Done' : st.isActive ? 'In Progress' : 'Pending'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">{st.title}</h4>
                    <p className="text-[11px] opacity-80 mt-0.5">{st.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800">
            <AlertTriangle size={20} className="text-rose-600 shrink-0" />
            <div>
              <p className="text-sm font-bold">This order has been cancelled.</p>
              <p className="text-xs text-rose-600 mt-0.5">You can re-open or change the status using the Update Status button above.</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Items + totals */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-neutral-800">Items</h3>
              <span className="text-xs text-neutral-400">
                {(order.items ?? []).reduce((n, it) => n + it.quantity, 0)} unit
                {(order.items ?? []).reduce((n, it) => n + it.quantity, 0) === 1 ? '' : 's'}
              </span>
            </div>
            <div className="divide-y divide-neutral-50">
              {(order.items ?? []).map((it) => (
                <div key={it.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-800">{it.product_name}</p>
                    <p className="text-xs text-neutral-400">
                      {it.variant_label ? `${it.variant_label} · ` : ''}{formatCurrency(it.unit_price)} × {it.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-neutral-800">{formatCurrency(it.line_total)}</span>
                </div>
              ))}
              {!(order.items ?? []).length && <p className="text-sm text-neutral-400 py-3">No line items.</p>}
            </div>

            <div className="border-t border-neutral-100 mt-3 pt-3 space-y-1.5 text-sm">
              <Row label="Subtotal" value={formatCurrency(order.subtotal)} />
              <Row label="Discount" value={`- ${formatCurrency(order.discount)}`} />
              <Row label="Delivery" value={formatCurrency(order.delivery_fee)} />
              <Row label="Tax" value={formatCurrency(order.tax)} />
              <div className="flex justify-between pt-2 border-t border-neutral-100 text-base font-bold text-neutral-800">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {order.notes && (
            <div className="bg-white rounded-2xl shadow-card p-5">
              <h3 className="text-base font-bold text-neutral-800 mb-2 flex items-center gap-2">
                <StickyNote size={16} /> Order notes
              </h3>
              <p className="text-sm text-neutral-600 whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-2xl shadow-card p-5">
            <h3 className="text-base font-bold text-neutral-800 mb-4 flex items-center gap-2">
              <Clock size={16} /> Status timeline
            </h3>
            {!(history ?? []).length ? (
              <p className="text-sm text-neutral-400">No history yet.</p>
            ) : (
              <div className="space-y-3">
                {(history ?? []).map((h) => (
                  <div key={h.id} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-neutral-700">
                        {ORDER_STATUS_LABELS[h.status] ?? h.status}
                        {h.note ? <span className="text-neutral-400 font-normal"> · {h.note}</span> : ''}
                      </p>
                      <p className="text-xs text-neutral-400">{formatDateTime(h.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-card p-5">
            <h3 className="text-sm font-bold text-neutral-800 mb-3 flex items-center gap-2">
              <User size={15} /> Customer
            </h3>
            <p className="text-sm font-medium text-neutral-800">{order.customer?.name ?? 'Guest'}</p>
            {order.customer?.email && <p className="text-xs text-neutral-500">{order.customer.email}</p>}
            {order.customer?.phone && <p className="text-xs text-neutral-500">{order.customer.phone}</p>}
            {order.customer && (
              <button onClick={() => navigate(`/customers/${order.customer!.id}`)} className="text-xs text-primary-600 font-semibold mt-2">
                View customer →
              </button>
            )}
          </div>

          {addr && (
            <div className="bg-white rounded-2xl shadow-card p-5">
              <h3 className="text-sm font-bold text-neutral-800 mb-3 flex items-center gap-2">
                <MapPin size={15} /> Delivery address
              </h3>
              <p className="text-sm text-neutral-600">
                {[addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ') || '—'}
              </p>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-card p-5">
            <h3 className="text-sm font-bold text-neutral-800 mb-3 flex items-center gap-2">
              <CreditCard size={15} /> Payment
            </h3>
            <div className="flex items-center justify-between mb-3">
              <Badge className={PAYMENT_STATUS_COLORS[order.payment_status]}>{order.payment_status}</Badge>
              <span className="text-xs text-neutral-500">{PAYMENT_METHOD_LABELS[order.payment_method]}</span>
            </div>
            {canUpdate ? (
              <Select value={order.payment_status} onChange={(e) => changePayment(e.target.value as PaymentStatus)}>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </Select>
            ) : (
              <p className="text-xs text-neutral-400">You don't have permission to change payment status.</p>
            )}
          </div>

          {order.coupon_code && (
            <div className="bg-white rounded-2xl shadow-card p-5">
              <h3 className="text-sm font-bold text-neutral-800 mb-2 flex items-center gap-2">
                <Tag size={15} /> Coupon
              </h3>
              <Badge className="bg-primary-100 text-primary-700">{order.coupon_code}</Badge>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={statusModal}
        onClose={() => setStatusModal(false)}
        title="Update order status"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setStatusModal(false)}>Cancel</Button>
            <Button onClick={applyStatus} loading={saving}>Apply</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="New status">
            <Select value={nextStatus} onChange={(e) => setNextStatus(e.target.value as OrderStatus)}>
              {ALL_ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Note" hint="Optional — shown in the timeline">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Packed and handed to delivery partner" />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-neutral-600">
      <span>{label}</span>
      <span className="font-medium text-neutral-700">{value}</span>
    </div>
  );
}
