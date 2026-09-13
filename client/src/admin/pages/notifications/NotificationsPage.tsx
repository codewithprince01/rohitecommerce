import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, BellRing, CheckCheck, Trash2, Check, Undo2, ShoppingCart, Package,
  User, Settings as Cog, Info, ExternalLink, CalendarDays,
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
import { useConfirm } from '../../hooks/useConfirm';
import {
  listNotifications,
  getNotificationStats,
  markRead,
  markAllRead,
  bulkNotifications,
  deleteNotification,
  clearRead,
} from '../../lib/services/notifications.service';
import { timeAgo } from '../../lib/format';
import type { NotificationRow } from '../../lib/types';

type NType = NotificationRow['type'];

const TYPE_META: Record<NType, { icon: any; label: string; cls: string }> = {
  order: { icon: ShoppingCart, label: 'Orders', cls: 'bg-blue-50 text-blue-600' },
  stock: { icon: Package, label: 'Stock', cls: 'bg-amber-50 text-amber-600' },
  customer: { icon: User, label: 'Customers', cls: 'bg-violet-50 text-violet-600' },
  system: { icon: Cog, label: 'System', cls: 'bg-neutral-100 text-neutral-500' },
  info: { icon: Info, label: 'Info', cls: 'bg-primary-50 text-primary-600' },
};
const TYPE_ORDER: NType[] = ['order', 'stock', 'customer', 'system', 'info'];

export default function NotificationsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const table = useTable<NotificationRow>(listNotifications, { initialSortBy: 'created_at', initialSortDir: 'desc' });
  const { data: stats, reload: reloadStats } = useAsync(() => getNotificationStats(), []);

  const refreshAll = useCallback(() => {
    table.refresh();
    reloadStats();
  }, [table, reloadStats]);

  const setType = (t: NType | '') => table.setFilter('type', t || undefined);
  const activeType = (table.filters.type as string) ?? '';

  const onMarkAll = async () => {
    try {
      await markAllRead();
      toast.success('All marked as read');
      refreshAll();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed');
    }
  };

  const onClearRead = async () => {
    const ok = await confirm({
      title: 'Clear read notifications',
      message: 'Permanently delete all notifications that have been read? This cannot be undone.',
      danger: true,
      confirmLabel: 'Clear',
    });
    if (!ok) return;
    try {
      await clearRead();
      toast.success('Read notifications cleared');
      refreshAll();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed');
    }
  };

  const toggleRead = async (n: NotificationRow, isRead: boolean) => {
    try {
      await markRead(n.id, isRead);
      refreshAll();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed');
    }
  };

  const onRowClick = (n: NotificationRow) => {
    if (!n.is_read) markRead(n.id, true).then(refreshAll).catch(() => undefined);
    if (n.link) navigate(n.link);
  };

  const onDelete = async (n: NotificationRow) => {
    try {
      await deleteNotification(n.id);
      toast.success('Notification deleted');
      refreshAll();
    } catch (err: any) {
      toast.error(err?.message ?? 'Delete failed');
    }
  };

  const runBulk = async (action: 'read' | 'unread' | 'delete') => {
    const ids = [...table.selected];
    if (!ids.length) return;
    try {
      if (action === 'delete') {
        const ok = await confirm({
          title: 'Delete notifications',
          message: `Delete ${ids.length} selected notification${ids.length === 1 ? '' : 's'}?`,
          danger: true,
          confirmLabel: 'Delete',
        });
        if (!ok) return;
      }
      await bulkNotifications(ids, action);
      toast.success('Bulk action applied');
      table.clearSelection();
      refreshAll();
    } catch (err: any) {
      toast.error(err?.message ?? 'Bulk action failed');
    }
  };

  const columns: Column<NotificationRow>[] = [
    {
      key: 'title',
      header: 'Notification',
      render: (n) => {
        const meta = TYPE_META[n.type] ?? TYPE_META.info;
        const Icon = meta.icon;
        return (
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${n.is_read ? 'bg-neutral-100 text-neutral-400' : meta.cls}`}>
              <Icon size={16} />
            </div>
            <div className="min-w-0">
              <p className={`text-sm flex items-center gap-1.5 ${n.is_read ? 'text-neutral-600' : 'font-semibold text-neutral-800'}`}>
                {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-accent-500 flex-shrink-0" />}
                <span className="truncate max-w-[300px]">{n.title}</span>
                {n.link && <ExternalLink size={12} className="text-neutral-300 flex-shrink-0" />}
              </p>
              {n.body && <p className="text-xs text-neutral-400 truncate max-w-[340px]">{n.body}</p>}
            </div>
          </div>
        );
      },
    },
    {
      key: 'type',
      header: 'Type',
      render: (n) => <Badge className={TYPE_META[n.type]?.cls ?? ''}>{TYPE_META[n.type]?.label ?? n.type}</Badge>,
    },
    { key: 'created_at', header: 'When', sortable: true, render: (n) => <span className="text-neutral-500 text-xs">{timeAgo(n.created_at)}</span> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (n) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {n.is_read ? (
            <button onClick={() => toggleRead(n, false)} className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-100" title="Mark unread">
              <Undo2 size={15} />
            </button>
          ) : (
            <button onClick={() => toggleRead(n, true)} className="p-2 rounded-lg text-primary-600 hover:bg-primary-50" title="Mark read">
              <Check size={15} />
            </button>
          )}
          <button onClick={() => onDelete(n)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50" title="Delete">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Activity and alerts from across your store."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" icon={<Trash2 size={16} />} onClick={onClearRead}>Clear read</Button>
            <Button variant="outline" icon={<CheckCheck size={16} />} onClick={onMarkAll}>Mark all read</Button>
          </div>
        }
      />

      {/* KPI cards — real notification metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard label="Total" value={stats?.total ?? 0} icon={Bell} loading={!stats} />
        <StatCard
          label="Unread"
          value={stats?.unread ?? 0}
          icon={BellRing}
          iconClass="bg-accent-50 text-accent-600"
          trend={stats ? { value: stats.unread === 0 ? 'all caught up' : 'needs review', positive: stats.unread === 0 } : null}
          loading={!stats}
        />
        <StatCard label="Today" value={stats?.today ?? 0} icon={CalendarDays} iconClass="bg-blue-50 text-blue-600" loading={!stats} />
        <StatCard label="Stock Alerts" value={stats?.byType.stock ?? 0} icon={Package} iconClass="bg-amber-50 text-amber-600" loading={!stats} />
      </div>

      {/* Type filter chips */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Chip active={activeType === ''} onClick={() => setType('')} label="All" count={stats?.total} />
        {TYPE_ORDER.map((t) => (
          <Chip key={t} active={activeType === t} onClick={() => setType(t)} label={TYPE_META[t].label} count={stats?.byType[t]} />
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <SearchInput value={table.search} onChange={table.setSearch} placeholder="Search notifications…" className="flex-1" />
        <Select
          value={table.filters.is_read === undefined ? '' : String(table.filters.is_read)}
          onChange={(e) => table.setFilter('is_read', e.target.value === '' ? undefined : e.target.value === 'true')}
          className="lg:w-44"
        >
          <option value="">All notifications</option>
          <option value="false">Unread only</option>
          <option value="true">Read only</option>
        </Select>
      </div>

      <DataTable
        table={table}
        columns={columns}
        selectable
        onRowClick={onRowClick}
        emptyTitle="You're all caught up"
        emptyMessage="No notifications match the current view."
      />

      <BulkActionBar count={table.selected.size} onClear={table.clearSelection}>
        <Button size="sm" variant="secondary" icon={<Check size={14} />} onClick={() => runBulk('read')}>Mark read</Button>
        <Button size="sm" variant="outline" icon={<Undo2 size={14} />} onClick={() => runBulk('unread')}>Mark unread</Button>
        <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => runBulk('delete')}>Delete</Button>
      </BulkActionBar>
    </div>
  );
}

function Chip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count?: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
        active
          ? 'bg-primary-500 text-white border-primary-500'
          : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={`text-xs font-semibold ${active ? 'text-white/80' : 'text-neutral-400'}`}>{count}</span>
      )}
    </button>
  );
}
