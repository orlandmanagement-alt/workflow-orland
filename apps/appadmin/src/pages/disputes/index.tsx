import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, AlertTriangle, CheckCircle2, Clock, XCircle,
  MessageSquare, ChevronDown, Loader2, User, Briefcase, Filter
} from 'lucide-react';
import { api } from '@/lib/api';

type DisputeStatus = 'open' | 'investigating' | 'resolved' | 'closed';
type DisputeType = 'payment' | 'contract' | 'conduct' | 'quality' | 'other';

interface Dispute {
  id: string;
  type: DisputeType;
  status: DisputeStatus;
  title: string;
  description: string;
  reporter_name: string;
  reporter_role: string;
  reported_name: string;
  project_id?: string;
  project_title?: string;
  amount_in_dispute?: number;
  created_at: string;
  updated_at: string;
  admin_notes?: string;
}

const STATUS_CONFIG: Record<DisputeStatus, { label: string; icon: React.ElementType; color: string }> = {
  open:          { label: 'Terbuka',        icon: AlertTriangle, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  investigating: { label: 'Investigasi',    icon: Clock,         color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  resolved:      { label: 'Diselesaikan',   icon: CheckCircle2,  color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  closed:        { label: 'Ditutup',        icon: XCircle,       color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
};

const TYPE_LABELS: Record<DisputeType, string> = {
  payment:  '💸 Pembayaran',
  contract: '📄 Kontrak',
  conduct:  '⚠️ Perilaku',
  quality:  '🎭 Kualitas Kerja',
  other:    '❓ Lainnya',
};

export default function DisputeResolution() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<DisputeStatus | 'all'>('all');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDisputes = async () => {
    setIsLoading(true);
    try {
      const params = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const res = await api.get(`/disputes${params}`);
      setDisputes(res.data?.data ?? []);
    } catch {
      // Mock data jika API belum ada
      setDisputes([
        {
          id: 'DSP-001',
          type: 'payment',
          status: 'open',
          title: 'Talent belum menerima bayaran dari proyek TVC Glow Soap',
          description: 'Talent mengeluh pembayaran tidak masuk setelah 30 hari produksi selesai.',
          reporter_name: 'Endang Wira Surya',
          reporter_role: 'talent',
          reported_name: 'Glow Up Nusantara (PT)',
          project_title: 'TVC Ramadhan Glow Soap',
          amount_in_dispute: 15_000_000,
          created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'DSP-002',
          type: 'conduct',
          status: 'investigating',
          title: 'Klien mengubah brief secara sepihak setelah shooting dimulai',
          description: 'Client menuntut pekerjaan tambahan tanpa revisi kontrak.',
          reporter_name: 'Bintang Arif Nugroho',
          reporter_role: 'talent',
          reported_name: 'Kreasi Digital Indonesia',
          project_title: 'KV Campaign Q2 2026',
          created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
          admin_notes: 'Sedang dikumpulkan bukti komunikasi WA dari kedua belah pihak.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [filterStatus]);

  const handleUpdateStatus = async (disputeId: string, newStatus: DisputeStatus) => {
    setIsSubmitting(true);
    try {
      await api.patch(`/disputes/${disputeId}`, { status: newStatus, admin_notes: adminNote });
      await fetchDisputes();
      setSelectedDispute(null);
      setAdminNote('');
    } catch (err: any) {
      alert('Gagal memperbarui status: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = filterStatus === 'all'
    ? disputes
    : disputes.filter(d => d.status === filterStatus);

  const counts = Object.fromEntries(
    (['open', 'investigating', 'resolved', 'closed'] as DisputeStatus[]).map(s => [
      s, disputes.filter(d => d.status === s).length
    ])
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ShieldAlert size={24} className="text-red-400" /> Dispute Resolution Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">{disputes.length} total laporan terdaftar</p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {([['all', 'Semua', disputes.length], ['open', 'Terbuka', counts.open], ['investigating', 'Investigasi', counts.investigating], ['resolved', 'Selesai', counts.resolved]] as const).map(([status, label, count]) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              filterStatus === status
                ? 'bg-red-500/20 border-red-500/40 text-red-400'
                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            {label}
            <span className="bg-white/10 px-1.5 py-0.5 rounded-full text-[10px]">{count}</span>
          </button>
        ))}
      </div>

      {/* Dispute List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={36} className="animate-spin text-red-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <CheckCircle2 size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Tidak ada dispute pada status ini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(dispute => {
            const statusCfg = STATUS_CONFIG[dispute.status];
            const StatusIcon = statusCfg.icon;
            const isSelected = selectedDispute?.id === dispute.id;

            return (
              <div
                key={dispute.id}
                className="bg-white/5 border border-slate-800 hover:border-slate-600 rounded-2xl overflow-hidden transition-colors"
              >
                {/* Card Header */}
                <button
                  onClick={() => setSelectedDispute(isSelected ? null : dispute)}
                  className="w-full text-left p-5 flex items-start gap-4"
                >
                  <div className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${statusCfg.color}`}>
                    <StatusIcon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-slate-500">{dispute.id}</span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                        {TYPE_LABELS[dispute.type]}
                      </span>
                      <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-white truncate">{dispute.title}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <User size={11} /> {dispute.reporter_name} ({dispute.reporter_role})
                      </span>
                      {dispute.project_title && (
                        <span className="flex items-center gap-1">
                          <Briefcase size={11} /> {dispute.project_title}
                        </span>
                      )}
                      {dispute.amount_in_dispute && (
                        <span className="text-red-400 font-bold">
                          Rp {dispute.amount_in_dispute.toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDown size={16} className={`text-slate-500 transition-transform shrink-0 ${isSelected ? 'rotate-180' : ''}`} />
                </button>

                {/* Expanded Detail */}
                {isSelected && (
                  <div className="px-5 pb-5 border-t border-slate-800 pt-4 space-y-4">
                    <div className="bg-slate-900 rounded-xl p-4">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-2">Deskripsi Laporan</p>
                      <p className="text-sm text-slate-300 leading-relaxed">{dispute.description}</p>
                    </div>

                    {dispute.admin_notes && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                        <p className="text-xs font-bold text-amber-400 uppercase mb-2">Catatan Admin Sebelumnya</p>
                        <p className="text-sm text-amber-200">{dispute.admin_notes}</p>
                      </div>
                    )}

                    {/* Admin Note Input */}
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block flex items-center gap-1.5">
                        <MessageSquare size={12} /> Catatan / Keputusan Admin
                      </label>
                      <textarea
                        value={adminNote}
                        onChange={e => setAdminNote(e.target.value)}
                        placeholder="Tulis catatan investigasi, keputusan, atau langkah penyelesaian..."
                        rows={3}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {dispute.status !== 'investigating' && (
                        <button
                          onClick={() => handleUpdateStatus(dispute.id, 'investigating')}
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold rounded-xl hover:bg-amber-500/30 transition-colors disabled:opacity-50"
                        >
                          Mulai Investigasi
                        </button>
                      )}
                      {dispute.status !== 'resolved' && (
                        <button
                          onClick={() => handleUpdateStatus(dispute.id, 'resolved')}
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-green-500/20 border border-green-500/40 text-green-400 text-xs font-bold rounded-xl hover:bg-green-500/30 transition-colors disabled:opacity-50"
                        >
                          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Tandai Selesai'}
                        </button>
                      )}
                      {dispute.status !== 'closed' && (
                        <button
                          onClick={() => handleUpdateStatus(dispute.id, 'closed')}
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-slate-700 border border-slate-600 text-slate-400 text-xs font-bold rounded-xl hover:bg-slate-600 transition-colors disabled:opacity-50"
                        >
                          Tutup Laporan
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
