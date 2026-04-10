// Enhanced Projects Dashboard with Status Tracking
// File: apps/apptalent/src/pages/projects/index.enhanced.tsx
// Purpose: Track job applications and project status with state machine visualization

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle,
  Eye,
  Star,
  Briefcase,
  Clock,
  XCircle,
  Loader2,
  AlertCircle,
  Calendar,
  MapPin,
  User,
} from 'lucide-react';

interface JobApplication {
  id: string;
  project_id: string;
  role_id: string;
  status: 'applied' | 'viewed' | 'shortlisted' | 'audition_invited' | 'hired' | 'completed' | 'rejected' | 'declined';
  match_percentage: number;
  project?: {
    title: string;
    client_name: string;
    shoot_location: string;
    shoot_date_start: string;
  };
  applied_at: string;
  viewed_at?: string;
  shortlisted_at?: string;
  audition_at?: string;
  hired_at?: string;
  completed_at?: string;
  rejected_at?: string;
  negotiated_fee?: number;
  client_notes?: string;
}

interface ProjectStats {
  total_applications: number;
  applied: number;
  shortlisted: number;
  hired: number;
  completed: number;
  rejected: number;
}

// Status Timeline dengan Visual Indicators
const StatusTimeline = ({ status, dates }: { status: string; dates: any }) => {
  const steps = [
    { id: 'applied', label: 'Applied', icon: CheckCircle },
    { id: 'viewed', label: 'Viewed', icon: Eye },
    { id: 'shortlisted', label: 'Shortlisted', icon: Star },
    { id: 'audition_invited', label: 'Audition', icon: Briefcase },
    { id: 'hired', label: 'Hired', icon: CheckCircle },
    { id: 'completed', label: 'Completed', icon: CheckCircle },
  ];

  const currentIndex = steps.findIndex((s) => s.id === status);

  return (
    <div className="flex items-center justify-between gap-1 my-4 px-2">
      {steps.map((step, index) => {
        const isComplete = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex flex-col items-center flex-1">
            <div
              className={`flex items-center justify-center h-8 w-8 rounded-full transition-all ${
                isComplete
                  ? 'bg-gradient-to-br from-brand-600 to-purple-600 text-white shadow-lg'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
              } ${isCurrent ? 'ring-4 ring-brand-300 dark:ring-brand-700 scale-110' : ''}`}
            >
              <Icon size={16} />
            </div>
            <p
              className={`text-[10px] font-bold mt-1 text-center transition-colors ${
                isComplete
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {step.label}
            </p>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`absolute left-1/2 top-4 w-[calc(100%_-_2px)] h-1 -z-10 transition-colors ${
                  index < currentIndex
                    ? 'bg-gradient-to-r from-brand-500 to-purple-500'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// Application Card dengan Detail
const ApplicationCard = ({ app }: { app: JobApplication }) => {
  const statusColors: Record<string, { bg: string; text: string; icon: any }> = {
    applied: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-700 dark:text-blue-300',
      icon: Clock,
    },
    viewed: {
      bg: 'bg-cyan-50 dark:bg-cyan-900/20',
      text: 'text-cyan-700 dark:text-cyan-300',
      icon: Eye,
    },
    shortlisted: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      text: 'text-yellow-700 dark:text-yellow-300',
      icon: Star,
    },
    audition_invited: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      text: 'text-purple-700 dark:text-purple-300',
      icon: Briefcase,
    },
    hired: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-700 dark:text-green-300',
      icon: CheckCircle,
    },
    completed: {
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      text: 'text-indigo-700 dark:text-indigo-300',
      icon: CheckCircle,
    },
    rejected: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-700 dark:text-red-300',
      icon: XCircle,
    },
  };

  const statusConfig = statusColors[app.status] || statusColors.applied;
  const StatusIcon = statusConfig.icon;

  return (
    <div className={`p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 ${statusConfig.bg} transition-all hover:border-slate-300 dark:hover:border-slate-700`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">
            {app.project?.title || 'Casting Project'}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {app.project?.client_name}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold ${statusConfig.text} ${statusConfig.bg} border border-current border-opacity-30`}>
            <StatusIcon size={14} />
            {app.status.charAt(0).toUpperCase() + app.status.slice(1).replace('_', ' ')}
          </div>

          {app.match_percentage && (
            <div className="px-3 py-1 bg-white dark:bg-dark-card rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
              {Math.round(app.match_percentage)}% Match
            </div>
          )}
        </div>
      </div>

      {/* Project Details Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 text-sm">
          <MapPin size={14} className="text-slate-500 dark:text-slate-400" />
          <span className="text-slate-700 dark:text-slate-300">
            {app.project?.shoot_location || 'TBA'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar size={14} className="text-slate-500 dark:text-slate-400" />
          <span className="text-slate-700 dark:text-slate-300">
            {app.project?.shoot_date_start
              ? new Date(app.project.shoot_date_start).toLocaleDateString('id-ID', {
                  month: 'short',
                  day: 'numeric',
                })
              : 'TBA'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-right">
          {app.negotiated_fee ? (
            <>
              <span className="text-slate-700 dark:text-slate-300">
                Rp {(app.negotiated_fee / 1000000).toFixed(1)}M
              </span>
            </>
          ) : (
            <span className="text-slate-500 dark:text-slate-400">Fee TBA</span>
          )}
        </div>
      </div>

      {/* Status Timeline */}
      <div className="relative">
        <StatusTimeline status={app.status} dates={{}} />
      </div>

      {/* Client Notes (jika ada) */}
      {app.client_notes && (
        <div className="mt-4 p-3 bg-white dark:bg-smart-secondary/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Catatan Klien</p>
          <p className="text-sm text-slate-700 dark:text-slate-300">{app.client_notes}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <button className="flex-1 px-4 py-2 bg-white dark:bg-dark-card text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700">
          Lihat Detail
        </button>
        {['shortlisted', 'audition_invited'].includes(app.status) && (
          <button className="flex-1 px-4 py-2 bg-gradient-to-r from-brand-600 to-purple-600 text-white rounded-lg font-semibold text-sm hover:shadow-lg transition-all">
            Konfirmasi
          </button>
        )}
      </div>
    </div>
  );
};

export default function ProjectsEnhanced() {
  const [activeTab, setActiveTab] = useState<'all' | 'applied' | 'shortlisted' | 'hired' | 'completed' | 'rejected'>('all');

  // Fetch projects with status grouping
  const { data: projectsResponse, isLoading, isError } = useQuery({
    queryKey: ['my-projects'],
    queryFn: async () => {
      const response = await fetch(`/api/projects/my-projects?status=all`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    },
  });

  const allProjects = projectsResponse?.data || {};
  const stats: ProjectStats = projectsResponse?.stats || {};

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="animate-spin text-brand-600 mb-4" size={48} />
        <p className="text-slate-500 font-medium">Memuat proyek Anda...</p>
      </div>
    );
  }

  const getTabApplications = (): JobApplication[] => {
    switch (activeTab) {
      case 'applied':
        return allProjects.applied || [];
      case 'shortlisted':
        return allProjects.shortlisted || [];
      case 'hired':
        return allProjects.hired || [];
      case 'completed':
        return allProjects.completed || [];
      case 'rejected':
        return allProjects.rejected || [];
      default:
        return (Object.values(allProjects).flat() as JobApplication[]) || [];
    }
  };

  const applications = getTabApplications();

  const tabs = [
    { id: 'all', label: 'Semua Lamaran', count: stats.total_applications, icon: Briefcase },
    { id: 'applied', label: 'Menunggu Review', count: stats.applied, icon: Clock },
    { id: 'shortlisted', label: 'Shortlisted', count: stats.shortlisted, icon: Star },
    { id: 'hired', label: 'Proyek Aktif', count: stats.hired, icon: CheckCircle },
    { id: 'completed', label: 'Selesai', count: stats.completed, icon: CheckCircle },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Proyek & Lamaran Saya</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Kelola status lamaran casting dan proyek aktif Anda
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                activeTab === tab.id
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-card hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className={`text-2xl font-black mb-1 ${activeTab === tab.id ? 'text-brand-600 dark:text-brand-400' : 'text-slate-900 dark:text-white'}`}>
                {tab.count}
              </div>
              <p className={`text-xs font-bold flex items-center gap-1 ${activeTab === tab.id ? 'text-brand-700 dark:text-brand-300' : 'text-slate-600 dark:text-slate-400'}`}>
                <Icon size={14} /> {tab.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      {stats.total_applications === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-dark-card p-10 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
          <AlertCircle size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Belum ada lamaran atau proyek aktif
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Mulai cari casting melalui AI Smart Match
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-brand-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-brand-500/30 hover:shadow-xl transition-all">
            Jelajahi Casting
          </button>
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-dark-card p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-slate-600 dark:text-slate-400 font-medium">
            Tidak ada lamaran di kategori ini
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <ApplicationCard key={app.id} app={app} />
          ))}
        </div>
      )}

      {/* Legend / Info Box */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <AlertCircle size={18} /> Info Status Lamaran
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-bold text-blue-700 dark:text-blue-300">Applied:</span>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Lamaran Anda telah terkirim dan sedang ditinjau klien
            </p>
          </div>
          <div>
            <span className="font-bold text-yellow-700 dark:text-yellow-300">Shortlisted:</span>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Anda masuk tahap audisi/screen test berikutnya
            </p>
          </div>
          <div>
            <span className="font-bold text-green-700 dark:text-green-300">Hired:</span>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Selamat! Anda telah diterima dan proyek siap dimulai
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
