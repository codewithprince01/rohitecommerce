import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Pencil, Ban, CheckCircle2, Users, UserPlus, Repeat, Wallet, Download, Trash2,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import DataTable, { Column } from '../../components/ui/DataTable';
import BulkActionBar from '../../components/ui/BulkActionBar';
import Modal from '../../components/ui/Modal';
import FormField, { Input, Textarea, Select } from '../../components/ui/FormField';
import { useTable } from '../../hooks/useTable';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { useConfirm } from '../../hooks/useConfirm';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  listCustomers,
  getCustomerStats,
  createCustomer,
  updateCustomer,
  toggleBlock,
  bulkBlock,
  bulkDelete,
  exportCustomersCsv,
  type CustomerRow,
} from '../../lib/services/customers.service';
import { formatCurrency, formatCompactCurrency, formatDate, timeAgo } from '../../lib/format';

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

export default function CustomersPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const { can } = useAdminAuth();
  const table = useTable<CustomerRow>(listCustomers, { initialSortBy: 'created_at', initialSortDir: 'desc' });
  const { data: stats, reload: reloadStats } = useAsync(() => getCustomerStats(), []);
  const canManage = can('customers.manage');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerRow | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const refreshAll = useCallback(() => {
    table.refresh();
    reloadStats();
  }, [table, reloadStats]);

  const openModal = (c: CustomerRow | null) => {
    setEditing(c);
    setForm(
      c
        ? { name: c.name, email: c.email ?? '', phone: c.phone ?? '', notes: c.notes ?? '' }
        : { name: '', email: '', phone: '', notes: '' }
    );
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      if (editing) await updateCustomer(editing.id, form);
      else await createCustomer(form);
      toast.success(editing ? 'Customer updated' : 'Customer created');
      setOpen(false);
      refreshAll();
    } catch (err: any) {
      toast.error(err?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const block = async (c: CustomerRow) => {
    try {
      await toggleBlock(c.id, !c.is_blocked);
      toast.success(c.is_blocked ? 'Customer unblocked' : 'Customer blocked');
      refreshAll();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const csv = await exportCustomersCsv({
        search: table.search,
        sortBy: table.sortBy,
        sortDir: table.sortDir,
        filters: table.filters,
      });
      downloadCsv(`customers-${new Date().toISOString().slice(0, 10)}.csv`, csv);
      toast.success('Export ready');
    } catch (err: any) {
      toast.error(err?.message ?? 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const runBulk = async (action: 'block' | 'unblock' | 'delete') => {
    const ids = [...table.selected];
    if (!ids.length) return;
    try {
      if (action === 'delete') {
        const ok = await confirm({
          title: 'Delete customers',
          message: `Delete ${ids.length} selected customer${ids.length === 1 ? '' : 's'} and their addresses? Orders are kept but unlinked. This cannot be undone.`,
          danger: true,
          confirmLabel: 'Delete',
        });
        if (!ok) return;
        await bulkDelete(ids);
      } else {
        await bulkBlock(ids, action === 'block');
      }
      toast.success('Bulk action applied');
      table.clearSelection();
      refreshAll();
    } catch (err: any) {
      toast.error(err?.message ?? 'Bulk action failed');
    }
  };

  const activeFilters =
    !!table.search || !!table.filters.is_blocked || !!table.filters.segment;
  const clearFilters = () => {
    table.setSearch('');
    table.setFilter('is_blocked', undefined);
    table.setFilter('segment', undefined);
  };

  const columns: Column<CustomerRow>[] = [
    {
      key: 'name',
      header: 'Customer',
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {c.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-neutral-800 truncate max-w-[200px]">{c.name}</p>
            <p className="text-xs text-neutral-400 truncate max-w-[200px]">{c.email ?? '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (c) => <span className="text-neutral-600">{c.phone ?? '—'}</span>,
    },
    {
      key: 'orders_count',
      header: 'Orders',
      sortable: true,
      render: (c) => (
        <span className="text-neutral-700">
          {c.orders_count}
          {c.orders_count >= 2 && (
            <span className="ml-1.5 text-[10px] font-semibold text-primary-600 uppercase">Repeat</span>
          )}
        </span>
      ),
    },
    {
      key: 'total_spent',
      header: 'Spent',
      sortable: true,
      render: (c) => <span className="font-semibold text-neutral-800">{formatCurrency(c.total_spent)}</span>,
    },
    {
      key: 'last_order_at',
      header: 'Last Order',
      sortable: true,
      render: (c) => (
        <span className="text-neutral-500 text-sm">{c.last_order_at ? timeAgo(c.last_order_at) : '—'}</span>
      ),
    },
    {
      key: 'is_blocked',
      header: 'Status',
      render: (c) =>
        c.is_blocked ? (
          <Badge className="bg-rose-100 text-rose-700">Blocked</Badge>
        ) : (
          <Badge className="bg-primary-100 text-primary-700">Active</Badge>
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (c) =>
        canManage ? (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => openModal(c)} className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100" aria-label="Edit">
              <Pencil size={15} />
            </button>
            <button
              onClick={() => block(c)}
              className={`p-2 rounded-lg ${c.is_blocked ? 'text-primary-600 hover:bg-primary-50' : 'text-rose-500 hover:bg-rose-50'}`}
              aria-label={c.is_blocked ? 'Unblock' : 'Block'}
              title={c.is_blocked ? 'Unblock' : 'Block'}
            >
              {c.is_blocked ? <CheckCircle2 size={15} /> : <Ban size={15} />}
            </button>
          </div>
        ) : (
          <span className="text-neutral-300">—</span>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="View, segment and manage your shoppers."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={<Download size={16} />} onClick={handleExport} loading={exporting}>
              Export
            </Button>
            {canManage && (
              <Button icon={<Plus size={16} />} onClick={() => openModal(null)}>
                New Customer
              </Button>
            )}
          </div>
        }
      />

      {/* KPI cards — real customer metrics from the API */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
        <StatCard
          label="Total Customers"
          value={stats?.totalCustomers ?? 0}
          icon={Users}
          trend={stats ? { value: `${stats.blockedCustomers} blocked`, positive: stats.blockedCustomers === 0 } : null}
          loading={!stats}
        />
        <StatCard
          label="Active"
          value={stats?.activeCustomers ?? 0}
          icon={CheckCircle2}
          iconClass="bg-primary-50 text-primary-600"
          loading={!stats}
        />
        <StatCard
          label="New (30d)"
          value={stats?.newCustomers ?? 0}
          icon={UserPlus}
          iconClass="bg-blue-50 text-blue-600"
          loading={!stats}
        />
        <StatCard
          label="Repeat Buyers"
          value={stats?.repeatCustomers ?? 0}
          icon={Repeat}
          iconClass="bg-violet-50 text-violet-600"
          trend={stats ? { value: `${stats.withOrders} with orders`, positive: true } : null}
          loading={!stats}
        />
        <StatCard
          label="Lifetime Value"
          value={stats ? formatCompactCurrency(stats.totalLifetimeValue) : '—'}
          icon={Wallet}
          iconClass="bg-amber-50 text-amber-600"
          trend={stats ? { value: `avg ${formatCompactCurrency(stats.avgLifetimeValue)}`, positive: true } : null}
          loading={!stats}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <SearchInput
          value={table.search}
          onChange={table.setSearch}
          placeholder="Search by name, email or phone…"
          className="flex-1"
        />
        <Select
          value={(table.filters.segment as string) ?? ''}
          onChange={(e) => table.setFilter('segment', e.target.value || undefined)}
          className="lg:w-44"
        >
          <option value="">All customers</option>
          <option value="with_orders">With orders</option>
          <option value="repeat">Repeat buyers</option>
          <option value="new">New (30 days)</option>
          <option value="inactive">No orders yet</option>
        </Select>
        <Select
          value={(table.filters.is_blocked as string) ?? ''}
          onChange={(e) =>
            table.setFilter('is_blocked', e.target.value === '' ? undefined : e.target.value === 'true')
          }
          className="lg:w-36"
        >
          <option value="">All status</option>
          <option value="false">Active</option>
          <option value="true">Blocked</option>
        </Select>
        {activeFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            Clear
          </Button>
        )}
      </div>

      <DataTable
        table={table}
        columns={columns}
        selectable={canManage}
        onRowClick={(c) => navigate(`/customers/${c.id}`)}
        emptyTitle="No customers found"
        emptyMessage={
          activeFilters
            ? 'No customers match the current filters. Try clearing them.'
            : 'Customers who register or place orders will appear here.'
        }
      />

      {canManage && (
        <BulkActionBar count={table.selected.size} onClear={table.clearSelection}>
          <Button size="sm" variant="outline" icon={<Ban size={14} />} onClick={() => runBulk('block')}>
            Block
          </Button>
          <Button size="sm" variant="secondary" icon={<CheckCircle2 size={14} />} onClick={() => runBulk('unblock')}>
            Unblock
          </Button>
          <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => runBulk('delete')}>
            Delete
          </Button>
        </BulkActionBar>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit Customer' : 'New Customer'}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
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
          {editing && (
            <p className="text-xs text-neutral-400">
              Joined {formatDate(editing.created_at)} · {editing.orders_count} order
              {editing.orders_count === 1 ? '' : 's'} · {formatCurrency(editing.total_spent)} spent
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
