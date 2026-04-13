import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Gavel, Loader2, RefreshCw, ShieldCheck, ShieldX, Wrench } from 'lucide-react';
import { api } from '@/lib/api';

type VerificationType = 'kyc_talent' | 'project_approval' | 'agency_verification' | 'invite_monitoring';

interface QueueItem {
  id: string;
  type: VerificationType;
  subject: string;
  requester: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface ToolControlItem {
  key: 'PH' | 'EO' | 'KOL';
  enabled: boolean;
  pendingInvites: number;
  pendingJobs: number;
}

export default function ProjectOverwatch() {
  const [tab, setTab] = useState<'verification' | 'global'>('verification');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [tools, setTools] = useState<ToolControlItem[]>([]);
  const [acting, setActing] = useState<string | null>(null);

  const fetchControlData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [queueRes, toolsRes] = await Promise.all([
        api.get('/admin/verification/queue'),
        api.get('/admin/global-control/tools'),
      ]);

      const queuePayload = queueRes.data?.data || queueRes.data || [];
      const toolsPayload = toolsRes.data?.data || toolsRes.data || [];

      setQueue(
        (Array.isArray(queuePayload) ? queuePayload : []).map((item: Record<string, unknown>, idx: number) => ({
          id: String(item.id || `q_${idx + 1}`),
          type: (item.type as VerificationType) || 'project_approval',
          subject: String(item.subject || item.project_name || item.entity_name || 'Untitled Request'),
          requester: String(item.requester || item.owner || item.client_name || '-'),
          status: (item.status as 'pending' | 'approved' | 'rejected') || 'pending',
          created_at: String(item.created_at || new Date().toISOString()),
        }))
      );

      setTools(
        (Array.isArray(toolsPayload) ? toolsPayload : []).map((item: Record<string, unknown>) => ({
          key: (item.key as ToolControlItem['key']) || 'PH',
          enabled: Boolean(item.enabled ?? true),
          pendingInvites: Number(item.pendingInvites || item.pending_invites || 0),
          pendingJobs: Number(item.pendingJobs || item.pending_jobs || 0),
        }))
      );
    } catch {
      setQueue([]);
      setTools([]);
      setError('Gagal memuat Verification Center / Global Control dari API admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchControlData();
  }, []);

  const pendingCount = useMemo(() => queue.filter((q) => q.status === 'pending').length, [queue]);

  const processQueue = async (id: string, decision: 'approved' | 'rejected') => {
    setActing(id + decision);
    try {
      await api.patch(`/admin/verification/${id}`, { decision });
      setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, status: decision } : item)));
    } catch {
      setError('Aksi verifikasi gagal diproses.');
    } finally {
      setActing(null);
    }
  };

  const toggleTool = async (key: ToolControlItem['key'], enabled: boolean) => {
    setActing(key);
    try {
      await api.patch(`/admin/global-control/tools/${key}`, { enabled: !enabled });
      setTools((prev) => prev.map((item) => (item.key === key ? { ...item, enabled: !enabled } : item)));
    } catch {
      setError('Gagal mengubah status tool.');
    } finally {
      setActing(null);
    }
  };

  const typeLabel: Record<VerificationType, string> = {
    kyc_talent: 'KYC Talent',
    project_approval: 'Approval Proyek',
    agency_verification: 'Verifikasi Agensi',
    invite_monitoring: 'Monitoring Invite',
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-700 bg-slate-900/40 p-6 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white">Verification Center & Global Control</h1>
            <p className="mt-1 text-sm text-slate-300">
              Pusat verifikasi KYC/proyek/agensi dan kontrol tools PH/EO/KOL beserta invite monitor.
            </p>
          </div>
          <button
            onClick={fetchControlData}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-[#071122] px-3 py-2 text-xs font-semibold text-slate-200"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="flex gap-2 rounded-2xl border border-slate-700 bg-slate-900/40 p-2 backdrop-blur-xl">
        <button
          onClick={() => setTab('verification')}
          className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wide ${
            tab === 'verification'
              ? 'border border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
              : 'border border-transparent text-slate-300 hover:bg-slate-800'
          }`}
        >
          Verification Queue
        </button>
        <button
          onClick={() => setTab('global')}
          className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wide ${
            tab === 'global'
              ? 'border border-rose-500/40 bg-rose-500/20 text-rose-300'
              : 'border border-transparent text-slate-300 hover:bg-slate-800'
          }`}
        >
          Global Control
        </button>
      </div>

      {error && <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}

      {loading ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/40 p-10 text-center text-slate-200 backdrop-blur-xl">
          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
        </div>
      ) : tab === 'verification' ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-200 backdrop-blur-xl">
            Pending critical approvals: <span className="font-bold text-emerald-300">{pendingCount}</span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/40 backdrop-blur-xl">
            <table className="w-full text-sm">
              <thead className="bg-[#0b1525] text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left font-black uppercase tracking-wide">Type</th>
                  <th className="px-4 py-3 text-left font-black uppercase tracking-wide">Subject</th>
                  <th className="px-4 py-3 text-left font-black uppercase tracking-wide">Requester</th>
                  <th className="px-4 py-3 text-left font-black uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left font-black uppercase tracking-wide">Created</th>
                  <th className="px-4 py-3 text-right font-black uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {queue.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                      Tidak ada item verifikasi.
                    </td>
                  </tr>
                ) : (
                  queue.map((item) => (
                    <tr key={item.id} className="border-t border-slate-800 text-slate-100 hover:bg-white/5">
                      <td className="px-4 py-3 text-xs text-slate-300">{typeLabel[item.type]}</td>
                      <td className="px-4 py-3 font-semibold text-white">{item.subject}</td>
                      <td className="px-4 py-3 text-slate-300">{item.requester}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full border px-2 py-1 text-xs font-semibold ${
                            item.status === 'approved'
                              ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300'
                              : item.status === 'rejected'
                                ? 'border-rose-500/30 bg-rose-500/20 text-rose-300'
                                : 'border-amber-500/30 bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{new Date(item.created_at).toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() => processQueue(item.id, 'approved')}
                            disabled={item.status !== 'pending' || acting !== null}
                            className="rounded border border-emerald-500/40 bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-300 disabled:opacity-40"
                          >
                            {acting === item.id + 'approved' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Approve'}
                          </button>
                          <button
                            onClick={() => processQueue(item.id, 'rejected')}
                            disabled={item.status !== 'pending' || acting !== null}
                            className="rounded border border-rose-500/40 bg-rose-500/20 px-2 py-1 text-xs font-semibold text-rose-300 disabled:opacity-40"
                          >
                            {acting === item.id + 'rejected' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Reject'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {tools.map((item) => (
            <div key={item.key} className="rounded-2xl border border-slate-700 bg-slate-900/40 p-5 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-black text-white">{item.key} Tools</h3>
                <Wrench className="h-5 w-5 text-slate-400" />
              </div>

              <div className="space-y-2 text-sm text-slate-300">
                <p>Pending Job Invites: <span className="font-bold text-emerald-300">{item.pendingJobs}</span></p>
                <p>Pending Talent Invites: <span className="font-bold text-rose-300">{item.pendingInvites}</span></p>
              </div>

              <button
                onClick={() => toggleTool(item.key, item.enabled)}
                disabled={acting === item.key}
                className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-black uppercase tracking-wide ${
                  item.enabled
                    ? 'border-rose-500/40 bg-rose-500/20 text-rose-300'
                    : 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {acting === item.key ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : item.enabled ? (
                  <ShieldX className="h-4 w-4" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                {item.enabled ? 'Disable Tool' : 'Enable Tool'}
              </button>
            </div>
          ))}

          {tools.length === 0 && (
            <div className="lg:col-span-3 rounded-2xl border border-slate-700 bg-slate-900/40 p-8 text-center text-slate-400 backdrop-blur-xl">
              Tidak ada konfigurasi Global Control dari API.
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-slate-700 bg-slate-900/40 p-4 text-xs text-slate-400 backdrop-blur-xl">
        <div className="mb-1 flex items-center gap-2 font-semibold text-emerald-300">
          <Gavel className="h-4 w-4" /> Policy
        </div>
        Semua keputusan verifikasi dicatat sebagai aksi kritis admin. Gunakan tab Global Control hanya untuk intervensi lintas portal.
      </div>
    </div>
  );
}
