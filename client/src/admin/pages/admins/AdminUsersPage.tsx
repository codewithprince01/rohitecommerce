import React, { useState, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, ShieldCheck, KeyRound, Eye, EyeOff, Users, UserCheck,
  Crown, Shield, User, RefreshCw, Clock,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import DataTable, { Column } from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import FormField, { Input, Select, Switch } from '../../components/ui/FormField';
import { useTable } from '../../hooks/useTable';
import { useToast } from '../../hooks/useToast';
import { useConfirm } from '../../hooks/useConfirm';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useAsync } from '../../hooks/useAsync';
import {
  listAdmins, getAdminStats, createAdmin, updateAdmin, resetAdminPassword, deleteAdmin,
  type AdminStats, type AdminInput,
} from '../../lib/services/admins.service';
import { ROLE_LABELS, permissionsFor, type Permission } from '../../lib/permissions';
import { formatDateTime, timeAgo } from '../../lib/format';
import type { AdminUser, AdminRole } from '../../lib/types';

const ROLE_COLORS: Record<AdminRole, string> = {
  super_admin: 'bg-violet-100 text-violet-700',
  manager: 'bg-blue-100 text-blue-700',
  staff: 'bg-neutral-100 text-neutral-600',
};
const ROLE_ICON: Record<AdminRole, typeof Crown> = { super_admin: Crown, manager: Shield, staff: User };
const ROLE_DESC: Record<AdminRole, string> = {
  super_admin: 'Full access — including admin accounts & all settings.',
  manager: 'Everything except admin management & critical settings.',
  staff: 'Catalog & order fulfilment, stock adjustments. No deletes.',
};
const ROLES: AdminRole[] = ['super_admin', 'manager', 'staff'];

export default function AdminUsersPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { can, admin: me } = useAdminAuth();
  const canManage = can('admins.manage');

  const table = useTable<AdminUser>(listAdmins, { initialSortBy: 'created_at', initialSortDir: 'desc' });
  const { data: stats, reload: reloadStats } = useAsync(() => getAdminStats(), []);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [resetting, setResetting] = useState<AdminUser | null>(null);

  const refreshAll = useCallback(() => {
    table.refresh();
    reloadStats();
  }, [table, reloadStats]);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (a: AdminUser) => { setEditing(a); setFormOpen(true); };

  const lastSuperAdmin = (a: AdminUser) => a.role === 'super_admin' && (stats?.superAdmins ?? 0) <= 1;

  const del = useCallback(
    async (a: AdminUser) => {
      if (a.id === me?.id) return toast.error("You can't delete your own account");
      if (lastSuperAdmin(a)) return toast.error('Cannot delete the last super admin');
      const ok = await confirm({ title: 'Remove admin', message: `Revoke admin access for ${a.email}? This cannot be undone.`, danger: true, confirmLabel: 'Remove' });
      if (!ok) return;
      try {
        await deleteAdmin(a.id);
        toast.success('Admin removed');
        refreshAll();
      } catch (err: any) {
        toast.error(err?.message ?? 'Delete failed');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [confirm, toast, refreshAll, me, stats]
  );

  const columns: Column<AdminUser>[] = [
    {
      key: 'full_name',
      header: 'Admin',
      sortable: true,
      render: (a) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {(a.full_name || a.email).slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-neutral-800 flex items-center gap-1.5">
              {a.full_name || '—'}
              {a.id === me?.id && <span className="text-[10px] font-bold text-primary-600 bg-primary-50 rounded px-1.5 py-0.5">You</span>}
            </p>
            <p className="text-xs text-neutral-400 truncate max-w-[220px]">{a.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (a) => {
        const Icon = ROLE_ICON[a.role];
        return <Badge className={ROLE_COLORS[a.role]}><Icon size={11} /> {ROLE_LABELS[a.role]}</Badge>;
      },
    },
    {
      key: 'last_login_at',
      header: 'Last login',
      sortable: true,
      render: (a) => <span className="text-neutral-500 text-xs" title={a.last_login_at ? formatDateTime(a.last_login_at) : ''}>{a.last_login_at ? timeAgo(a.last_login_at) : 'Never'}</span>,
    },
    { key: 'is_active', header: 'Status', sortable: true, render: (a) => (a.is_active ? <Badge className="bg-primary-100 text-primary-700">Active</Badge> : <Badge className="bg-rose-100 text-rose-700">Disabled</Badge>) },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (a) =>
        canManage ? (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setResetting(a)} className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100" aria-label="Reset password" title="Reset password"><KeyRound size={15} /></button>
            <button onClick={() => openEdit(a)} className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100" aria-label="Edit"><Pencil size={15} /></button>
            <button
              onClick={() => del(a)}
              className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 disabled:text-neutral-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
              disabled={a.id === me?.id || lastSuperAdmin(a)}
              title={a.id === me?.id ? "You can't delete yourself" : lastSuperAdmin(a) ? 'Last super admin' : 'Remove'}
            ><Trash2 size={15} /></button>
          </div>
        ) : <span className="text-neutral-300">—</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Admin Users"
        subtitle="Manage staff accounts, roles and access."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={<RefreshCw size={15} />} onClick={refreshAll}>Refresh</Button>
            {canManage && <Button icon={<Plus size={16} />} onClick={openCreate}>New Admin</Button>}
          </div>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-5">
        <StatCard label="Total Admins" value={stats?.totalAdmins ?? 0} icon={Users} loading={!stats} />
        <StatCard label="Active" value={stats?.activeAdmins ?? 0} icon={UserCheck} iconClass="bg-primary-50 text-primary-600" trend={stats ? { value: `${stats.disabledAdmins} disabled`, positive: stats.disabledAdmins === 0 } : null} loading={!stats} />
        <StatCard label="Super Admins" value={stats?.superAdmins ?? 0} icon={Crown} iconClass="bg-violet-50 text-violet-600" loading={!stats} />
        <StatCard label="Managers" value={stats?.managers ?? 0} icon={Shield} iconClass="bg-blue-50 text-blue-600" loading={!stats} />
        <StatCard label="Staff" value={stats?.staff ?? 0} icon={User} iconClass="bg-neutral-100 text-neutral-500" loading={!stats} />
        <StatCard label="Never Logged In" value={stats?.neverLoggedIn ?? 0} icon={Clock} iconClass="bg-amber-50 text-amber-600" loading={!stats} />
      </div>

      {/* Roles & permissions reference */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {ROLES.map((r) => {
          const Icon = ROLE_ICON[r];
          const count = permissionsFor(r).length;
          return (
            <div key={r} className="bg-white rounded-2xl shadow-card p-4 flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ROLE_COLORS[r]}`}><Icon size={18} /></div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-neutral-800">{ROLE_LABELS[r]}</p>
                  <span className="text-[11px] font-semibold text-neutral-400">{count} permissions</span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">{ROLE_DESC[r]}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <SearchInput value={table.search} onChange={table.setSearch} placeholder="Search by name or email…" className="flex-1" />
        <Select value={(table.filters.role as string) ?? ''} onChange={(e) => table.setFilter('role', e.target.value || undefined)} className="lg:w-44">
          <option value="">All roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="manager">Manager</option>
          <option value="staff">Staff</option>
        </Select>
        <Select value={(table.filters.is_active as string) ?? ''} onChange={(e) => table.setFilter('is_active', e.target.value === '' ? undefined : e.target.value === 'true')} className="lg:w-36">
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Disabled</option>
        </Select>
      </div>

      <DataTable
        table={table}
        columns={columns}
        onRowClick={canManage ? openEdit : undefined}
        emptyTitle="No admins found"
        emptyMessage="Try adjusting your search or filters."
      />

      {formOpen && (
        <AdminModal
          admin={editing}
          isSelf={editing?.id === me?.id}
          protectedSuper={!!editing && lastSuperAdmin(editing)}
          onClose={() => setFormOpen(false)}
          onSaved={() => { setFormOpen(false); refreshAll(); }}
          onError={(m) => toast.error(m)}
          onSuccess={(m) => toast.success(m)}
        />
      )}

      {resetting && (
        <ResetPasswordModal
          admin={resetting}
          onClose={() => setResetting(null)}
          onError={(m) => toast.error(m)}
          onSuccess={(m) => { toast.success(m); setResetting(null); }}
        />
      )}
    </div>
  );
}

/* ============================== Admin modal ============================= */

function PermissionPreview({ role }: { role: AdminRole }) {
  const perms = permissionsFor(role);
  const modules = [...new Set(perms.map((p: Permission) => p.split('.')[0]))];
  return (
    <div className="rounded-xl bg-neutral-50 px-3 py-2.5">
      <p className="text-xs font-semibold text-neutral-600 mb-1.5">{perms.length} permissions across {modules.length} areas</p>
      <div className="flex flex-wrap gap-1">
        {modules.map((m) => (
          <span key={m} className="text-[10px] capitalize bg-white border border-neutral-200 text-neutral-500 rounded px-1.5 py-0.5">{m}</span>
        ))}
      </div>
    </div>
  );
}

function AdminModal({
  admin, isSelf, protectedSuper, onClose, onSaved, onError, onSuccess,
}: {
  admin: AdminUser | null;
  isSelf: boolean;
  protectedSuper: boolean;
  onClose: () => void;
  onSaved: () => void;
  onError: (m: string) => void;
  onSuccess: (m: string) => void;
}) {
  const [form, setForm] = useState({
    email: admin?.email ?? '',
    password: '',
    full_name: admin?.full_name ?? '',
    role: admin?.role ?? ('staff' as AdminRole),
    is_active: admin?.is_active ?? true,
  });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  const errors: Record<string, string> = {};
  if (!admin) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email';
    if (form.password.length < 6) errors.password = 'At least 6 characters';
  }
  // Self-lockout guards mirrored from the backend.
  const roleLocked = isSelf && form.role !== admin?.role;
  const valid = Object.keys(errors).length === 0;

  const save = async () => {
    if (!valid) return onError(Object.values(errors)[0]);
    if (roleLocked) return onError("You can't change your own role");
    setSaving(true);
    try {
      if (admin) {
        await updateAdmin(admin.id, { full_name: form.full_name, role: form.role, is_active: form.is_active });
        onSuccess('Admin updated');
      } else {
        const input: AdminInput = { email: form.email.trim(), password: form.password, full_name: form.full_name.trim(), role: form.role };
        await createAdmin(input);
        onSuccess('Admin account created');
      }
      onSaved();
    } catch (err: any) {
      onError(err?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={admin ? 'Edit Admin' : 'New Admin'}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={saving} disabled={!valid}>Save</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 bg-primary-50 text-primary-700 text-xs rounded-xl px-3 py-2">
          <ShieldCheck size={14} /> Roles control exactly what each admin can access.
        </div>

        <FormField label="Full name">
          <Input value={form.full_name} onChange={(e) => set('full_name', e.target.value)} placeholder="Jane Doe" />
        </FormField>

        <FormField label="Email" required error={errors.email}>
          <Input type="email" value={form.email} disabled={!!admin} onChange={(e) => set('email', e.target.value)} placeholder="jane@store.com" />
        </FormField>

        {!admin && (
          <FormField label="Temporary password" required hint="At least 6 characters — share securely" error={errors.password}>
            <div className="relative">
              <Input type={showPw ? 'text' : 'password'} value={form.password} onChange={(e) => set('password', e.target.value)} className="pr-10" />
              <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </FormField>
        )}

        <FormField label="Role" error={roleLocked ? "You can't change your own role" : undefined}>
          <Select value={form.role} disabled={isSelf} onChange={(e) => set('role', e.target.value as AdminRole)}>
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
            <option value="super_admin">Super Admin</option>
          </Select>
        </FormField>

        <PermissionPreview role={form.role} />

        {admin && (
          <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-neutral-700">Account active</p>
              <p className="text-xs text-neutral-400">
                {isSelf ? "You can't disable your own account" : protectedSuper ? 'The last super admin must stay active' : 'Disabled accounts cannot sign in'}
              </p>
            </div>
            <Switch checked={form.is_active} disabled={isSelf || protectedSuper} onChange={(v) => set('is_active', v)} />
          </div>
        )}
      </div>
    </Modal>
  );
}

/* =========================== Reset password ============================ */

function ResetPasswordModal({
  admin, onClose, onError, onSuccess,
}: {
  admin: AdminUser;
  onClose: () => void;
  onError: (m: string) => void;
  onSuccess: (m: string) => void;
}) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  const error = password.length > 0 && password.length < 6 ? 'At least 6 characters' : confirm && confirm !== password ? 'Passwords do not match' : '';
  const valid = password.length >= 6 && password === confirm;

  const save = async () => {
    if (!valid) return onError(error || 'Enter a matching 6+ character password');
    setSaving(true);
    try {
      await resetAdminPassword(admin.id, password);
      onSuccess(`Password reset for ${admin.email}`);
    } catch (err: any) {
      onError(err?.message ?? 'Reset failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Reset password"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={saving} disabled={!valid}>Reset password</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl bg-neutral-50 px-4 py-3">
          <div className="w-9 h-9 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
            {(admin.full_name || admin.email).slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-800">{admin.full_name || admin.email}</p>
            <p className="text-xs text-neutral-400">{admin.email}</p>
          </div>
        </div>
        <FormField label="New password" required hint="At least 6 characters" error={error || undefined}>
          <div className="relative">
            <Input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" />
            <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </FormField>
        <FormField label="Confirm password" required>
          <Input type={showPw ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </FormField>
      </div>
    </Modal>
  );
}
