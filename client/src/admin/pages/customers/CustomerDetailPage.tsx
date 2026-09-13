import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, ShoppingBag, IndianRupee, Mail, Phone, Pencil, Ban,
  CheckCircle2, TrendingUp, Clock,
} from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import StatCard from '../../components/ui/StatCard';
import Modal from '../../components/ui/Modal';
import FormField, { Input, Textarea } from '../../components/ui/FormField';
import { Loader, ErrorState, EmptyState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  getCustomerDetail,
  updateCustomer,
  toggleBlock,
} from '../../lib/services/customers.service';
import {
  formatCurrency,
  formatDate,
  timeAgo,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from '../../lib/format';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = useAdminAuth();
  const canManage = can('customers.manage');

  const { data, loading, error, reload } = useAsync(() => getCustomerDetail(id!), [id]);

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  if (loading) return <Loader label="Loading customer…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <ErrorState message="Customer not found" />;

  const { customer, addresses, orders, stats } = data;

  const openEdit = () => {
    setForm({
      name: customer.name,
      email: customer.email ?? '',
      phone: customer.phone ?? '',
      notes: customer.notes ?? '',
    });
    setEditOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      await updateCustomer(customer.id, form);
      toast.success('Customer updated');
      setEditOpen(false);
      reload();
    } catch (err: any) {
      toast.error(err?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const block = async () => {
    setBusy(true);
    try {
      await toggleBlock(customer.id, !customer.is_blocked);
      toast.success(customer.is_blocked ? 'Customer unblocked' : 'Customer blocked');
      reload();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button onClick={() => navigate('/customers')} className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 mb-4">
        <ArrowLeft size={16} /> Back to customers
      </button>

      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-bold">
            {customer.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-neutral-800">{customer.name}</h1>
              {customer.is_blocked && <Badge className="bg-rose-100 text-rose-700">Blocked</Badge>}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500 mt-1">
              {customer.email && <span className="flex items-center gap-1"><Mail size={13} /> {customer.email}</span>}
              {customer.phone && <span className="flex items-center gap-1"><Phone size={13} /> {customer.phone}</span>}
              <span>Joined {formatDate(customer.created_at)}</span>
              {stats.lastOrderAt && <span>· Last order {timeAgo(stats.lastOrderAt)}</span>}
            </div>
          </div>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={<Pencil size={16} />} onClick={openEdit}>
              Edit
            </Button>
            <Button
              variant={customer.is_blocked ? 'secondary' : 'danger'}
              icon={customer.is_blocked ? <CheckCircle2 size={16} /> : <Ban size={16} />}
              onClick={block}
              loading={busy}
            >
              {customer.is_blocked ? 'Unblock' : 'Block'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Total Orders" value={stats.totalOrders} icon={ShoppingBag} iconClass="bg-blue-50 text-blue-600" />
        <StatCard label="Lifetime Value" value={formatCurrency(stats.lifetimeValue)} icon={IndianRupee} />
        <StatCard label="Avg Order Value" value={formatCurrency(stats.avgOrderValue)} icon={TrendingUp} iconClass="bg-violet-50 text-violet-600" />
        <StatCard label="Addresses" value={addresses.length} icon={MapPin} iconClass="bg-amber-50 text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-neutral-800">Order History</h3>
            {orders.length > 0 && <span className="text-xs text-neutral-400">{orders.length} total</span>}
          </div>
          {!orders.length ? (
            <EmptyState title="No orders" message="This customer hasn't placed any orders." />
          ) : (
            <div className="divide-y divide-neutral-50">
              {orders.map((o) => (
                <button
                  key={o.id}
                  onClick={() => navigate(`/orders/${o.id}`)}
                  className="w-full flex items-center justify-between py-3 hover:bg-neutral-50 -mx-2 px-2 rounded-lg"
                >
                  <div className="text-left">
                    <p className="text-sm font-semibold text-neutral-800">{o.order_number}</p>
                    <p className="text-xs text-neutral-400 flex items-center gap-1">
                      <Clock size={11} /> {formatDate(o.placed_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={ORDER_STATUS_COLORS[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge>
                    <span className="text-sm font-bold text-neutral-800 w-20 text-right">{formatCurrency(o.total)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-card p-5">
            <h3 className="text-base font-bold text-neutral-800 mb-4">Addresses</h3>
            {!addresses.length ? (
              <p className="text-sm text-neutral-400">No saved addresses.</p>
            ) : (
              <div className="space-y-3">
                {addresses.map((a) => (
                  <div key={a.id} className="border border-neutral-100 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-neutral-700">{a.label}</span>
                      {a.is_default && <Badge className="bg-primary-100 text-primary-700">Default</Badge>}
                    </div>
                    <p className="text-sm text-neutral-600">
                      {[a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {customer.notes && (
            <div className="bg-white rounded-2xl shadow-card p-5">
              <h4 className="text-sm font-bold text-neutral-800 mb-2">Notes</h4>
              <p className="text-sm text-neutral-600 whitespace-pre-wrap">{customer.notes}</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Customer"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>Save</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </FormField>
            <FormField label="Phone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </FormField>
          </div>
          <FormField label="Notes">
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
