import React, { useCallback, useState } from 'react';
import { ScrollText, Activity, CalendarDays, CalendarClock, Users, Download, BarChart3 } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import DataTable, { Column } from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import { Select } from '../../components/ui/FormField';
import { useTable } from '../../hooks/useTable';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import {
  listActivity,
  getActivityStats,
  getActivityFilters,
  exportActivityCsv,
} from '../../lib/services/activity.service';
import { formatDateTime, timeAgo } from '../../lib/format';
import type { ActivityLog } from '../../lib/types';

function actionColor(action: string): string {
  if (/delete|remove|block|clear/.test(action)) return 'bg-rose-100 text-rose-700';
  if (/create|add/.test(action)) return 'bg-primary-100 text-primary-700';
  if (/status|reorder/.test(action)) return 'bg-indigo-100 text-indigo-700';
  if (/update|edit|adjust|mark|bulk|read/.test(action)) return 'bg-blue-100 text-blue-700';
  return 'bg-neutral-100 text-neutral-600';
}
const labelOf = (a: string) => a.replace(/_/g, ' ');

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

export default function ActivityLogPage() {
  const toast = useToast();
  const table = useTable<ActivityLog>(listActivity, { initialSortBy: 'created_at', initialSortDir: 'desc' });
  const { data: stats } = useAsync(() => getActivityStats(), []);
  const { data: filters } = useAsync(() => getActivityFilters(), []);

  const [selected, setSelected] = useState<ActivityLog | null>(null);
  const [exporting, setExporting] = useState(false);

  const maxAction = stats?.byAction[0]?.count ?? 1;

  const handleExport = async () => {
    setExporting(true);
    try {
      const csv = await exportActivityCsv({
        search: table.search,
        sortBy: table.sortBy,
        sortDir: table.sortDir,
        filters: table.filters,
      });
      downloadCsv(`activity-${new Date().toISOString().slice(0, 10)}.csv`, csv);
      toast.success('Export ready');
    } catch (err: any) {
      toast.error(err?.message ?? 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const activeFilters =
    !!table.search || !!table.filters.action || !!table.filters.entity_type ||
    !!table.filters.admin_email || !!table.filters.from || !!table.filters.to;
  const clearFilters = useCallback(() => {
    table.setSearch('');
    table.setFilter('action', undefined);
    table.setFilter('entity_type', undefined);
    table.setFilter('admin_email', undefined);
    table.setFilter('from', undefined);
    table.setFilter('to', undefined);
  }, [table]);

  const columns: Column<ActivityLog>[] = [
    {
      key: 'action',
      header: 'Action',
      render: (l) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
            <ScrollText size={15} className="text-neutral-500" />
          </div>
          <div>
            <Badge className={actionColor(l.action)}>{labelOf(l.action)}</Badge>
            {l.entity_type && (
              <p className="text-xs text-neutral-400 mt-1">
                {l.entity_type}{l.entity_id ? ` · ${l.entity_id.slice(-6)}` : ''}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'admin_email',
      header: 'By',
      render: (l) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-[10px] font-bold">
            {(l.admin_email ?? 'SY').slice(0, 2).toUpperCase()}
          </div>
          <span className="text-neutral-600 text-sm">{l.admin_email ?? 'system'}</span>
        </div>
      ),
    },
    {
      key: 'metadata',
      header: 'Details',
      render: (l) => (
        <code className="text-xs text-neutral-500 truncate max-w-[260px] inline-block align-middle">
          {l.metadata ? JSON.stringify(l.metadata) : '—'}
        </code>
      ),
    },
    {
      key: 'created_at',
      header: 'When',
      sortable: true,
      render: (l) => (
        <span className="text-neutral-500 text-xs whitespace-nowrap" title={formatDateTime(l.created_at)}>
          {timeAgo(l.created_at)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Activity Logs"
        subtitle="Immutable audit trail of every admin action."
        actions={
          <Button variant="outline" icon={<Download size={16} />} onClick={handleExport} loading={exporting}>
            Export
          </Button>
        }
      />

      {/* KPI cards — real audit metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard label="Total Events" value={stats?.total ?? 0} icon={Activity} loading={!stats} />
        <StatCard label="Today" value={stats?.today ?? 0} icon={CalendarDays} iconClass="bg-blue-50 text-blue-600" loading={!stats} />
        <StatCard label="Last 7 Days" value={stats?.last7 ?? 0} icon={CalendarClock} iconClass="bg-violet-50 text-violet-600" loading={!stats} />
        <StatCard label="Active Admins" value={stats?.activeAdmins ?? 0} icon={Users} iconClass="bg-primary-50 text-primary-600" loading={!stats} />
      </div>

      {/* Insights */}
      {stats && (stats.byAction.length > 0 || stats.topAdmins.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
          <div className="bg-white rounded-2xl shadow-card p-5">
            <h3 className="text-sm font-bold text-neutral-800 mb-4 flex items-center gap-2">
              <BarChart3 size={15} /> Top actions
            </h3>
            <div className="space-y-2.5">
              {stats.byAction.map((a) => (
                <button
                  key={a.action}
                  onClick={() => table.setFilter('action', table.filters.action === a.action ? undefined : a.action)}
                  className="w-full text-left group"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-neutral-600 group-hover:text-neutral-800">{labelOf(a.action)}</span>
                    <span className="text-neutral-400">{a.count}</span>
                  </div>
                  <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full" style={{ width: `${(a.count / maxAction) * 100}%` }} />
                  </div>
                </button>
              ))}
              {!stats.byAction.length && <p className="text-sm text-neutral-400">No actions recorded yet.</p>}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-5">
            <h3 className="text-sm font-bold text-neutral-800 mb-4 flex items-center gap-2">
              <Users size={15} /> Most active admins
            </h3>
            <div className="space-y-3">
              {stats.topAdmins.map((a) => (
                <div key={a.admin_email} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                    {a.admin_email.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm text-neutral-700 flex-1 truncate">{a.admin_email}</span>
                  <span className="text-sm font-semibold text-neutral-800">{a.count}</span>
                </div>
              ))}
              {!stats.topAdmins.length && <p className="text-sm text-neutral-400">No admin actions yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row flex-wrap gap-3 mb-4">
        <SearchInput value={table.search} onChange={table.setSearch} placeholder="Search action, admin or entity…" className="flex-1 min-w-[200px]" />
        <Select value={(table.filters.action as string) ?? ''} onChange={(e) => table.setFilter('action', e.target.value || undefined)} className="lg:w-44">
          <option value="">All actions</option>
          {(filters?.actions ?? []).map((a) => <option key={a} value={a}>{labelOf(a)}</option>)}
        </Select>
        <Select value={(table.filters.entity_type as string) ?? ''} onChange={(e) => table.setFilter('entity_type', e.target.value || undefined)} className="lg:w-40">
          <option value="">All entities</option>
          {(filters?.entities ?? []).map((e) => <option key={e} value={e}>{e}</option>)}
        </Select>
        <Select value={(table.filters.admin_email as string) ?? ''} onChange={(e) => table.setFilter('admin_email', e.target.value || undefined)} className="lg:w-48">
          <option value="">All admins</option>
          {(filters?.admins ?? []).map((a) => <option key={a} value={a}>{a}</option>)}
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
        onRowClick={setSelected}
        emptyTitle="No activity found"
        emptyMessage={activeFilters ? 'No audit entries match the current filters.' : 'Admin actions will be recorded here.'}
      />

      {/* Detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Audit entry">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge className={actionColor(selected.action)}>{labelOf(selected.action)}</Badge>
              <span className="text-xs text-neutral-400">{formatDateTime(selected.created_at)}</span>
            </div>
            <dl className="grid grid-cols-3 gap-y-2.5 text-sm">
              <Field label="Admin" value={selected.admin_email ?? 'system'} />
              <Field label="Entity" value={selected.entity_type ?? '—'} />
              <Field label="Entity ID" value={selected.entity_id ?? '—'} mono />
            </dl>
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">Metadata</p>
              <pre className="text-xs bg-neutral-50 border border-neutral-100 rounded-xl p-3 overflow-x-auto text-neutral-700 max-h-72">
                {selected.metadata ? JSON.stringify(selected.metadata, null, 2) : 'No metadata recorded.'}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="col-span-1">
      <dt className="text-xs text-neutral-400">{label}</dt>
      <dd className={`text-neutral-800 break-all ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  );
}
