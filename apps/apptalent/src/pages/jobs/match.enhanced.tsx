// Enhanced Smart Match Component
// File: apps/apptalent/src/pages/jobs/match.enhanced.tsx
// Purpose: AI-powered job recommendations with detailed matching algorithm visualization

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Sparkles, Check, X, Filter, ChevronDown, Zap, Heart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface JobMatch {
  talent_id: string;
  project_id: string;
  role_id: string;
  match_percentage: number;
  hard_filters_passed: boolean;
  hard_filters_failed_reason?: string;
  soft_filters_score: number;
  score_breakdown: {
    age_match?: { score: number; weight: number; reason: string };
    gender_match?: { score: number; weight: number; reason: string };
    location_match?: { score: number; weight: number; reason: string };
    height_match?: { score: number; weight: number; reason: string };
    skills_match?: { score: number; weight: number; reason: string };
    budget_fit?: { score: number; weight: number; reason: string };
    profile_completeness?: { score: number; weight: number; reason: string };
    [key: string]: any;
  };
  project?: {
    id: string;
    title: string;
    client_name: string;
    budget_min: number;
    budget_max: number;
    shoot_location: string;
    shoot_date_start: string;
    role_id: string;
  };
}

const matchScoreColor = (score: number) => {
  if (score >= 85) return 'from-emerald-500 to-green-500';
  if (score >= 70) return 'from-blue-500 to-cyan-500';
  if (score >= 50) return 'from-yellow-500 to-orange-500';
  return 'from-red-500 to-rose-500';
};

const matchScoreBgColor = (score: number) => {
  if (score >= 85) return 'bg-emerald-50 dark:bg-emerald-900/20';
  if (score >= 70) return 'bg-blue-50 dark:bg-blue-900/20';
  if (score >= 50) return 'bg-yellow-50 dark:bg-yellow-900/20';
  return 'bg-red-50 dark:bg-red-900/20';
};

const matchScoreTextColor = (score: number) => {
  if (score >= 85) return 'text-emerald-700 dark:text-emerald-400';
  if (score >= 70) return 'text-blue-700 dark:text-blue-400';
  if (score >= 50) return 'text-yellow-700 dark:text-yellow-400';
  return 'text-red-700 dark:text-red-400';
};

// Komponen untuk menampilkan breakdown score per factor
const ScoreBreakdownViewer = ({ breakdown }: { breakdown: JobMatch['score_breakdown'] }) => {
  const [expanded, setExpanded] = useState(false);

  const factors = Object.entries(breakdown).filter(([_, data]) => data?.score !== undefined);

  return (
    <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full font-semibold text-slate-900 dark:text-white mb-3"
      >
        <span className="flex items-center gap-2">
          <Zap size={16} /> Detail Matching Algorithm
        </span>
        <ChevronDown size={18} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="space-y-2">
          {factors.map(([factorName, data]) => (
            <div key={factorName} className="flex items-center justify-between text-sm">
              <div className="flex-1">
                <p className="font-semibold text-slate-700 dark:text-slate-300 capitalize">
                  {factorName.replace(/_/g, ' ')}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{data.reason}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${matchScoreColor(data.score)}`}
                    style={{ width: `${data.score}%` }}
                  />
                </div>
                <span className="font-bold text-slate-900 dark:text-white w-10 text-right">
                  {data.score}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Job card dengan detail matching
const JobMatchCard = ({
  match,
  onApply,
  isApplying,
}: {
  match: JobMatch;
  onApply: (projectId: string, roleId: string) => void;
  isApplying: boolean;
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!match.hard_filters_passed) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg">
        <div className="flex items-start gap-3">
          <X size={20} className="text-red-600 dark:text-red-400 mt-0.5" />
          <div>
            <h4 className="font-bold text-red-900 dark:text-red-200">Tidak Memenuhi Kriteria</h4>
            <p className="text-sm text-red-800 dark:text-red-300 mt-1">
              {match.hard_filters_failed_reason}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-6 rounded-2xl border-2 transition-all cursor-pointer ${
        showDetails
          ? `${matchScoreBgColor(match.match_percentage)} border-current`
          : 'bg-white dark:bg-dark-card border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-500'
      }`}
      onClick={() => setShowDetails(!showDetails)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
            {match.project?.title || 'Casting Project'}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {match.project?.client_name} • {match.project?.shoot_location}
          </p>
        </div>

        {/* Match Percentage Badge */}
        <div
          className={`flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br ${matchScoreColor(
            match.match_percentage
          )} text-white font-black text-xl shadow-lg`}
        >
          {Math.round(match.match_percentage)}%
        </div>
      </div>

      {/* Budget & Dates */}
      <div className="grid grid-cols-3 gap-4 text-sm mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Budget
          </p>
          <p className="font-bold text-slate-900 dark:text-white mt-1">
            Rp {(match.project?.budget_max || 0).toLocaleString('id-ID')}
          </p>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Tanggal Syuting
          </p>
          <p className="font-bold text-slate-900 dark:text-white mt-1">
            {match.project?.shoot_date_start
              ? new Date(match.project.shoot_date_start).toLocaleDateString('id-ID')
              : 'TBA'}
          </p>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Lokasi
          </p>
          <p className="font-bold text-slate-900 dark:text-white mt-1 truncate">
            {match.project?.shoot_location || 'TBA'}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onApply(match.project_id, match.role_id);
          }}
          disabled={isApplying}
          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
        >
          {isApplying ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Mengirim...
            </>
          ) : (
            <>
              <Check size={16} /> Lamar Sekarang
            </>
          )}
        </button>
        <button className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center">
          <Heart size={18} />
        </button>
      </div>

      {/* Matching Breakdown */}
      {showDetails && <ScoreBreakdownViewer breakdown={match.score_breakdown} />}
    </div>
  );
};

export default function SmartMatchEnhanced() {
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [filterOpen, setFilterOpen] = useState(false);

  // Fetch smart match recommendations
  const { data: matchesResponse, isLoading, refetch } = useQuery({
    queryKey: ['smart-matches'],
    queryFn: async () => {
      const response = await fetch('/api/jobs/smart-match?limit=20&minMatch=70', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch matches');
      return response.json();
    },
  });

  const matches: JobMatch[] = matchesResponse?.data || [];

  // Mutation: Apply to job
  const applyMutation = useMutation({
    mutationFn: async ({ projectId, roleId }: { projectId: string; roleId: string }) => {
      const response = await fetch('/api/jobs/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ projectId, roleId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Gagal mengirim lamaran');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`✓ Lamaran dikirim! Match: ${data.data.match_percentage}%`);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`✗ ${error.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-brand-600 mb-4" size={48} />
        <p className="text-slate-500 font-medium animate-pulse">AI sedang menganalisis rekomendasi terbaik...</p>
      </div>
    );
  }

  const topMatches = matches.filter((m) => m.match_percentage >= 80);
  const goodMatches = matches.filter((m) => m.match_percentage >= 70 && m.match_percentage < 80);
  const fairMatches = matches.filter((m) => m.match_percentage >= 50 && m.match_percentage < 70);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header dengan AI Badge */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-brand-50 to-purple-50 dark:from-brand-900/20 dark:to-purple-900/20 p-6 rounded-2xl border border-brand-200 dark:border-brand-800/50">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white dark:bg-dark-card rounded-xl shadow-md">
            <Sparkles size={24} className="text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Smart Match AI</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {matches.length} casting recommendation yang cocok untuk profil Anda
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              viewMode === 'cards'
                ? 'bg-brand-600 text-white shadow-md'
                : 'bg-white dark:bg-dark-card text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            Card View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              viewMode === 'list'
                ? 'bg-brand-600 text-white shadow-md'
                : 'bg-white dark:bg-dark-card text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setFilterOpen(true)}
            className="px-4 py-2 bg-white dark:bg-dark-card text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <Filter size={18} /> Filter
          </button>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-dark-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
          <p className="text-slate-600 dark:text-slate-400 font-medium">
            Tidak ada rekomendasi saat ini. Lengkapi profil Anda untuk mendapatkan rekomendasi lebih baik!
          </p>
        </div>
      ) : (
        <>
          {/* Top Matches (80%+) */}
          {topMatches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-8 bg-gradient-to-b from-emerald-500 to-green-500 rounded-full" />
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Sangat Cocok (80%+)
                </h2>
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full">
                  {topMatches.length}
                </span>
              </div>

              {viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {topMatches.map((match) => (
                    <JobMatchCard
                      key={`${match.project_id}-${match.role_id}`}
                      match={match}
                      onApply={(projectId, roleId) =>
                        applyMutation.mutate({ projectId, roleId })
                      }
                      isApplying={applyMutation.isPending}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {topMatches.map((match) => (
                    <JobMatchCard
                      key={`${match.project_id}-${match.role_id}`}
                      match={match}
                      onApply={(projectId, roleId) =>
                        applyMutation.mutate({ projectId, roleId })
                      }
                      isApplying={applyMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Good Matches (70-79%) */}
          {goodMatches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" />
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Cocok (70-79%)
                </h2>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-full">
                  {goodMatches.length}
                </span>
              </div>

              {viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {goodMatches.map((match) => (
                    <JobMatchCard
                      key={`${match.project_id}-${match.role_id}`}
                      match={match}
                      onApply={(projectId, roleId) =>
                        applyMutation.mutate({ projectId, roleId })
                      }
                      isApplying={applyMutation.isPending}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {goodMatches.map((match) => (
                    <JobMatchCard
                      key={`${match.project_id}-${match.role_id}`}
                      match={match}
                      onApply={(projectId, roleId) =>
                        applyMutation.mutate({ projectId, roleId })
                      }
                      isApplying={applyMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Fair Matches (50-69%) */}
          {fairMatches.length > 0 && (
            <details className="group cursor-pointer">
              <summary className="flex items-center gap-2 p-4 bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className="w-2 h-8 bg-gradient-to-b from-yellow-500 to-orange-500 rounded-full" />
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex-1">
                  Cukup Cocok (50-69%)
                </h2>
                <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-bold rounded-full">
                  {fairMatches.length}
                </span>
              </summary>

              <div className="mt-3 space-y-3">
                {fairMatches.map((match) => (
                  <JobMatchCard
                    key={`${match.project_id}-${match.role_id}`}
                    match={match}
                    onApply={(projectId, roleId) =>
                      applyMutation.mutate({ projectId, roleId })
                    }
                    isApplying={applyMutation.isPending}
                  />
                ))}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}
