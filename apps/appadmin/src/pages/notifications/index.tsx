import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle2, Loader2, Search, ShieldAlert, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

type NotificationType = 'project_approval' | 'kyc_waiting' | 'dispute_transaction' | 'system' | 'invite' | 'other';

interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  read_at: string | null;
  created_at: string;
}

const SPAM_TYPES = new Set(['profile_updated', 'profile_update', 'normal_activity']);

export default function AdminNotifications() {
  const [rows, setRows] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'critical' | 'all' | 'unread'>('critical');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/notifications', {
        params: {
          include: 'critical,high,dispute,kyc,project_approval,agency_verification,invite',
        },
      });

      const payload = response.data?.data || response.data || [];
      const list = Array.isArray(payload) ? payload : [];

      setRows(
        list
          .filter((item: Record<string, unknown>) => !SPAM_TYPES.has(String(item.type || '')))
          .map((item: Record<string, unknown>, idx: number) => ({
            id: String(item.id || `notif_${idx + 1}`),
            type: (item.type as NotificationType) || 'other',
            title: String(item.title || 'Admin Notification'),
            message: String(item.message || '-'),
            priority: (item.priority as 'low' | 'medium' | 'high' | 'critical') || 'medium',
            read_at: (item.read_at as string | null) || null,
            created_at: String(item.created_at || new Date().toISOString()),
          }))
      );
      setSelectedIds([]);
    } catch {
      setRows([]);
      setError('Gagal memuat smart notifications dari API admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const filtered = useMemo(() => {
    return rows
      .filter((row) => {
        if (tab === 'critical') return row.priority === 'critical' || row.type === 'dispute_transaction' || row.type === 'kyc_waiting';
        if (tab === 'unread') return !row.read_at;
        return true;
      })
      .filter((row) => {
        if (!query) return true;
        const q = query.toLowerCase();
        return row.title.toLowerCase().includes(q) || row.message.toLowerCase().includes(q);
      });
  }, [rows, tab, query]);

  const toggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const markRead = async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      await Promise.all(ids.map((id) => api.patch(`/admin/notifications/${id}/read`, {})));
      setRows((prev) => prev.map((item) => (ids.includes(item.id) ? { ...item, read_at: new Date().toISOString() } : item)));
      setSelectedIds([]);
    } catch {
      setError('Gagal menandai notifikasi sebagai read.');
    }
  };

  const remove = async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      await Promise.all(ids.map((id) => api.delete(`/admin/notifications/${id}`)));
      setRows((prev) => prev.filter((item) => !ids.includes(item.id)));
      setSelectedIds([]);
    } catch {
      setError('Gagal menghapus notifikasi terpilih.');
    }
  };

  const priorityClass: Record<AdminNotification['priority'], string> = {
    low: 'border-blue-500/30 bg-blue-500/15 text-blue-300',
    medium: 'border-amber-500/30 bg-amber-500/15 text-amber-300',
    high: 'border-rose-500/30 bg-rose-500/15 text-rose-300',
    critical: 'border-rose-500/40 bg-rose-500/20 text-rose-200',
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-700 bg-slate-900/40 p-6 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white">Smart Notifications</h1>
            <p className="mt-1 text-sm text-slate-300">
              Hanya event kritis: proyek butuh approval, KYC menunggu, dispute transaksi, dan invite penting.
            </p>
          </div>
          <button
            onClick={fetchNotifications}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-[#071122] px-3 py-2 text-xs font-semibold text-slate-200"
          >
            <Bell className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-900/40 p-4 backdrop-blur-xl">
        <div className="mb-3 flex flex-wrap gap-2">
          {([
            ['critical', 'Critical First'],
            ['unread', 'Unread'],
            ['all', 'All'],
          ] as Array<[typeof tab, string]>).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`rounded-lg px-3 py-2 text-xs font-black uppercase tracking-wide ${
                tab === value
                  ? 'border border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                  : 'border border-slate-700 bg-slate-800 text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search critical notifications"
            className="w-full rounded-lg border border-slate-700 bg-[#071122] py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 focus:border-emerald-400/60 focus:outline-none"
          />
        </label>
      </div>

      {error && <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}

      {selectedIds.length > 0 && (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/40 p-4 backdrop-blur-xl">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => markRead(selectedIds)}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-3 py-2 text-xs font-bold uppercase tracking-wide text-emerald-300"
            >
              <CheckCircle2 className="h-4 w-4" /> Mark Read ({selectedIds.length})
            </button>
            <button
              onClick={() => remove(selectedIds)}
              className="inline-flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/20 px-3 py-2 text-xs font-bold uppercase tracking-wide text-rose-300"
            >
              <Trash2 className="h-4 w-4" /> Delete ({selectedIds.length})
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-900/40 p-10 text-center text-slate-200 backdrop-blur-xl">
            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-900/40 p-10 text-center text-slate-400 backdrop-blur-xl">
            <ShieldAlert className="mx-auto mb-2 h-6 w-6" /> Tidak ada notifikasi kritis.
          </div>
        ) : (
          filtered.map((row) => (
            <div key={row.id} className="rounded-2xl border border-slate-700 bg-slate-900/40 p-4 backdrop-blur-xl">
              <div className="flex items-start gap-3">
                <input checked={selectedIds.includes(row.id)} onChange={() => toggle(row.id)} type="checkbox" className="mt-1" />

                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-semibold text-white">{row.title}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase ${priorityClass[row.priority]}`}>
                      {row.priority}
                    </span>
                    {!row.read_at && <span className="rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300">new</span>}
                  </div>
                  <p className="text-sm text-slate-300">{row.message}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {row.type} • {new Date(row.created_at).toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="flex gap-1">
                  {!row.read_at && (
                    <button
                      onClick={() => markRead([row.id])}
                      className="rounded border border-emerald-500/40 bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-300"
                    >
                      Read
                    </button>
                  )}
                  <button
                    onClick={() => remove([row.id])}
                    className="rounded border border-rose-500/40 bg-rose-500/20 px-2 py-1 text-xs font-semibold text-rose-300"
                  >
                    Del
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
