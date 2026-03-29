import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Users, Image as ImageIcon, DollarSign, MessageSquare,
  Settings, Plus, Loader2, AlertCircle, CheckCircle2, Clock, FileText
} from 'lucide-react';
import { api } from '@/lib/api';
import { RosterManager } from '@/components/projects/RosterManager';
import PitchDeckButton from '@/components/projects/PitchDeckButton';
import SharedNotes from '@/components/projects/SharedNotes';

type TabId = 'roster' | 'moodboard' | 'budget' | 'notes' | 'settings';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft:      { label: 'Draft',           color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  casting:    { label: 'Casting',          color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  production: { label: 'Produksi',         color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  completed:  { label: 'Selesai',          color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  cancelled:  { label: 'Dibatalkan',       color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('roster');

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ['project-detail', id],
    queryFn: async () => {
      const res = await api.get(`/projects/${id}`);
      return res.data?.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });

  const tabs: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
    { id: 'roster',    label: 'Roster',    icon: Users },
    { id: 'moodboard', label: 'Moodboard', icon: ImageIcon },
    { id: 'budget',    label: 'Budget',    icon: DollarSign },
    { id: 'notes',     label: 'Notes',     icon: MessageSquare },
    { id: 'settings',  label: 'Settings',  icon: Settings },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="animate-spin text-brand-600" size={40} />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="max-w-4xl mx-auto px-4 mt-12 text-center">
        <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Proyek tidak ditemukan</h2>
        <button onClick={() => navigate(-1)} className="mt-4 text-brand-600 font-bold text-sm">
          ← Kembali
        </button>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[project.status?.toLowerCase()] ?? STATUS_MAP['draft'];

  return (
    <div className="max-w-7xl mx-auto px-4 mt-6 pb-20 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white mb-3 transition-colors">
            <ArrowLeft size={14} className="mr-1" /> Kembali ke Proyek
          </button>
          <h1 className="text-3xl font-black dark:text-white tracking-tight">{project.title}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500 dark:text-slate-400">
            <span>#{project.id?.slice(0, 8) || id}</span>
            {project.category && <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">{project.category}</span>}
            {project.location && <span>📍 {project.location}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
          <PitchDeckButton projectId={id!} />
          <button className="px-4 py-2 bg-slate-900 dark:bg-brand-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md">
            <Plus size={14} /> Tambah Talent
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Slot', value: project.total_slots ?? '-', icon: Users, color: 'text-brand-600' },
          { label: 'Terisi', value: project.filled_slots ?? '0', icon: CheckCircle2, color: 'text-green-600' },
          { label: 'Deadline', value: project.casting_deadline ? new Date(project.casting_deadline).toLocaleDateString('id-ID') : '-', icon: Clock, color: 'text-amber-600' },
          { label: 'Budget', value: project.total_budget ? `Rp ${(project.total_budget / 1_000_000).toFixed(0)}jt` : '-', icon: DollarSign, color: 'text-emerald-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500">{stat.label}</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-2xl w-fit overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'roster' && (
          <RosterManager projectId={id!} />
        )}

        {activeTab === 'moodboard' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold dark:text-white">Moodboard & Reference</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl">
                <Plus size={14} /> Upload Gambar
              </button>
            </div>
            {project.moodboard_urls?.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {project.moodboard_urls.map((url: string, i: number) => (
                  <img key={i} src={url} alt={`Moodboard ${i+1}`} className="rounded-2xl aspect-square object-cover" />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400">
                <ImageIcon size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Belum ada gambar referensi. Upload untuk menginspirasi tim casting.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
            <h2 className="text-lg font-bold dark:text-white mb-6">Alokasi Budget Proyek</h2>
            <div className="space-y-4">
              {[
                { label: 'Total Budget', value: project.total_budget, color: 'bg-emerald-500' },
                { label: 'Talent Fees', value: project.talent_fee_budget, color: 'bg-brand-500' },
                { label: 'Production Cost', value: project.production_budget, color: 'bg-amber-500' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${item.color}`} />
                    {item.label}
                  </span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {item.value ? `Rp ${Number(item.value).toLocaleString('id-ID')}` : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <SharedNotes projectId={id!} />
        )}

        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
            <h2 className="text-lg font-bold dark:text-white mb-2">Pengaturan Proyek</h2>
            {[
              { label: 'Judul Proyek', value: project.title },
              { label: 'Kategori', value: project.category },
              { label: 'Lokasi', value: project.location },
              { label: 'Dibuat', value: project.created_at ? new Date(project.created_at).toLocaleDateString('id-ID') : '-' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.label}</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-white">{item.value || '—'}</span>
              </div>
            ))}
            <button className="w-full mt-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 text-sm rounded-2xl hover:border-brand-400 hover:text-brand-600 transition-colors font-bold">
              Edit Proyek
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
