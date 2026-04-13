import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Search,
  Shield,
  Trash2,
  UserX,
} from 'lucide-react';
import { api } from '@/lib/api';

interface AdminUserRow {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: 'talent' | 'client' | 'agency' | 'admin' | 'super_admin';
  status: 'active' | 'suspended' | 'deleted' | 'pending' | 'banned';
  created_at: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type UserScope = 'all' | 'talent' | 'client' | 'agency' | 'admin';

type UserAction = 'activate' | 'suspend' | 'ban' | 'delete';

const scopeLabel: Record<UserScope, string> = {
  all: 'Semua Entitas',
  talent: 'Talent',
  client: 'Client',
  agency: 'Agency',
  admin: 'Admin',
};

const statusBadgeClass: Record<string, string> = {
  active: 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300',
  suspended: 'border-amber-500/30 bg-amber-500/20 text-amber-300',
  pending: 'border-blue-500/30 bg-blue-500/20 text-blue-300',
  deleted: 'border-rose-500/30 bg-rose-500/20 text-rose-300',
  banned: 'border-rose-500/30 bg-rose-500/20 text-rose-300',
};

const roleBadgeClass: Record<string, string> = {
  super_admin: 'border-violet-500/30 bg-violet-500/20 text-violet-300',
  admin: 'border-cyan-500/30 bg-cyan-500/20 text-cyan-300',
  agency: 'border-fuchsia-500/30 bg-fuchsia-500/20 text-fuchsia-300',
  talent: 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300',
  client: 'border-sky-500/30 bg-sky-500/20 text-sky-300',
};

export default function UsersCRM() {
  const [scope, setScope] = useState<UserScope>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async (targetPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/users', {
        params: {
          page: targetPage,
          limit,
          search: search || undefined,
          status: statusFilter || undefined,
          role: scope === 'all' ? undefined : scope,
        },
      });

      const payload = response.data?.data ?? response.data;
      const list = Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.users)
          ? payload.users
          : Array.isArray(payload)
            ? payload
            : [];

      setRows(
        list.map((user: Record<string, unknown>) => ({
          id: String(user.id),
          email: String(user.email || '-'),
          name: user.name ? String(user.name) : undefined,
          phone: user.phone ? String(user.phone) : undefined,
          role: (user.role as AdminUserRow['role']) || 'client',
          status: (user.status as AdminUserRow['status']) || 'pending',
          created_at: String(user.created_at || new Date().toISOString()),
        }))
      );

      const pager = payload?.pagination || response.data?.pagination || {};
      setPagination({
        page: Number(pager.page || targetPage),
        limit: Number(pager.limit || limit),
        total: Number(pager.total || list.length || 0),
        totalPages: Number(pager.totalPages || Math.max(1, Math.ceil((pager.total || list.length || 0) / limit))),
      });
      setPage(targetPage);
      setSelectedIds([]);
    } catch {
      setRows([]);
      setError('Gagal memuat data user dari API admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [scope, statusFilter, search, limit]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const isAllSelected = useMemo(() => rows.length > 0 && selectedIds.length === rows.length, [rows, selectedIds]);

  const toggleSelectAll = () => {
    setSelectedIds(isAllSelected ? [] : rows.map((row) => row.id));
  };

  const applyAction = async (ids: string[], action: UserAction) => {
    if (ids.length === 0) return;
    setActionLoading(action);
    setError(null);
    try {
      await Promise.all(
        ids.map((id) =>
          api.patch(`/admin/users/${id}/status`, {
            action,
            reason: `admin_${action}_control_tower`,
          })
        )
      );
      setSuccess(`${ids.length} user berhasil diproses: ${action}.`);
      setTimeout(() => setSuccess(null), 2000);
      await fetchUsers(page);
    } catch {
      setError(`Aksi massal ${action} gagal dieksekusi.`);
    } finally {
      setActionLoading(null);
    }
  };

  const bulkButtons = [
    { action: 'activate' as UserAction, label: 'Aktifkan', icon: CheckCircle2, className: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300' },
    { action: 'suspend' as UserAction, label: 'Suspend', icon: UserX, className: 'border-amber-500/40 bg-amber-500/20 text-amber-300' },
    { action: 'ban' as UserAction, label: 'Ban', icon: Ban, className: 'border-rose-500/40 bg-rose-500/20 text-rose-300' },
    { action: 'delete' as UserAction, label: 'Delete', icon: Trash2, className: 'border-rose-500/40 bg-rose-500/20 text-rose-300' },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-700 bg-slate-900/40 p-6 backdrop-blur-xl">
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">Centralized User Management</h1>
        <p className="mt-1 text-sm text-slate-300">
          Control Tower untuk Talent, Client, Agency, dan Admin dengan bulk action terpusat.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-900/40 p-5 backdrop-blur-xl">
        <div className="mb-4 flex flex-wrap gap-2">
          {(Object.keys(scopeLabel) as UserScope[]).map((key) => (
            <button
              key={key}
              onClick={() => setScope(key)}
              className={`rounded-lg px-3 py-2 text-xs font-black uppercase tracking-wide transition ${
                scope === key
                  ? 'border border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                  : 'border border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
              }`}
            >
              {scopeLabel[key]}
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari email, nama, atau phone"
              className="w-full rounded-lg border border-slate-700 bg-[#071122] py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 focus:border-emerald-400/60 focus:outline-none"
            />
          </label>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-[#071122] px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400/60 focus:outline-none"
          >
            <option value="">Semua Status</option>
            <option value="active">active</option>
            <option value="suspended">suspended</option>
            <option value="pending">pending</option>
            <option value="deleted">deleted</option>
            <option value="banned">banned</option>
          </select>

          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="rounded-lg border border-slate-700 bg-[#071122] px-3 py-2.5 text-sm text-slate-200 focus:border-emerald-400/60 focus:outline-none"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-300">
          <Filter className="h-4 w-4" />
          <span>Total: {pagination.total}</span>
          <span>•</span>
          <span>Selected: {selectedIds.length}</span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{success}</div>
      )}

      {selectedIds.length > 0 && (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/40 p-4 backdrop-blur-xl">
          <div className="flex flex-wrap gap-2">
            {bulkButtons.map((button) => {
              const Icon = button.icon;
              return (
                <button
                  key={button.action}
                  onClick={() => applyAction(selectedIds, button.action)}
                  disabled={actionLoading !== null}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-wide ${button.className} disabled:opacity-60`}
                >
                  {actionLoading === button.action ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                  {button.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/40 backdrop-blur-xl">
        <table className="w-full text-sm">
          <thead className="bg-[#0b1525] text-slate-300">
            <tr>
              <th className="px-4 py-3 text-left">
                <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} />
              </th>
              <th className="px-4 py-3 text-left font-black uppercase tracking-wide">Identity</th>
              <th className="px-4 py-3 text-left font-black uppercase tracking-wide">Role</th>
              <th className="px-4 py-3 text-left font-black uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-left font-black uppercase tracking-wide">Created</th>
              <th className="px-4 py-3 text-right font-black uppercase tracking-wide">Quick Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-300">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  <AlertCircle className="mx-auto mb-2 h-6 w-6" />
                  Tidak ada data user untuk filter ini.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-800 text-slate-100 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <input checked={selectedIds.includes(row.id)} onChange={() => toggleSelect(row.id)} type="checkbox" />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-white">{row.email}</p>
                    <p className="text-xs text-slate-400">{row.name || '-'} {row.phone ? `• ${row.phone}` : ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${roleBadgeClass[row.role] || roleBadgeClass.client}`}>
                      {row.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusBadgeClass[row.status] || statusBadgeClass.pending}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{new Date(row.created_at).toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <button
                        onClick={() => applyAction([row.id], 'suspend')}
                        className="rounded border border-amber-500/30 bg-amber-500/20 px-2 py-1 text-xs font-semibold text-amber-300"
                      >
                        Suspend
                      </button>
                      <button
                        onClick={() => applyAction([row.id], 'ban')}
                        className="rounded border border-rose-500/30 bg-rose-500/20 px-2 py-1 text-xs font-semibold text-rose-300"
                      >
                        Ban
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-300 backdrop-blur-xl">
        <p>
          Halaman {pagination.page} dari {pagination.totalPages} • Total {pagination.total} user
        </p>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => fetchUsers(page - 1)}
            className="inline-flex items-center gap-1 rounded border border-slate-700 px-3 py-1.5 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => fetchUsers(page + 1)}
            className="inline-flex items-center gap-1 rounded border border-slate-700 px-3 py-1.5 disabled:opacity-40"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-900/40 p-4 text-xs text-slate-400 backdrop-blur-xl">
        <div className="mb-2 flex items-center gap-2 font-semibold text-emerald-300">
          <Shield className="h-4 w-4" /> Safety Note
        </div>
        Semua aksi massal dieksekusi ke endpoint status admin dan tercatat sebagai `admin_*_control_tower`.
      </div>
    </div>
  );
}
