import { useState, useEffect } from 'react';
import { Radio, Users, MapPin, CheckCircle2, XCircle, Clock, Zap, Loader2, AlertCircle, Phone } from 'lucide-react';
import { liveBoardService, CastingCandidate, LiveBoard } from '@/lib/services/liveBoardService';
import { useSearchParams } from 'react-router-dom';

export default function LiveCastingBoard() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project') || 'PRJ-2026-001';
  
  const [candidates, setCandidates] = useState<CastingCandidate[]>([]);
  const [liveBoard, setLiveBoard] = useState<LiveBoard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [manualRefresh, setManualRefresh] = useState(0);

  // Fetch live board metadata
  useEffect(() => {
    const fetchBoard = async () => {
      try {
        setError(null);
        const board = await liveBoardService.getLiveBoard(projectId);
        setLiveBoard(board);
      } catch (err: any) {
        console.error('Failed to fetch live board:', err);
        setError(err.message || 'Gagal memuat live board');
      }
    };

    fetchBoard();
  }, [projectId]);

  // Start polling for candidates
  useEffect(() => {
    setIsLoading(true);

    const unsubscribe = liveBoardService.startPolling(
      projectId,
      5000, // 5 second polling interval
      (newCandidates) => {
        setCandidates(newCandidates);
        setIsLoading(false);
      },
      (err) => {
        console.warn('Polling error:', err);
        setError('Koneksi terputus. Mencoba reconnect...');
      }
    );

    // Cleanup polling on unmount
    return () => {
      unsubscribe();
      liveBoardService.stopPolling();
    };
  }, [projectId]);

  const handleApprove = async (candidateId: string) => {
    try {
      setActionLoading(candidateId);
      const response = await liveBoardService.approveCandidate(
        projectId,
        candidateId,
        'Approved via live board'
      );

      if (response.status === 'success') {
        // Update local state
        setCandidates((prev) =>
          prev.map((c) =>
            c.id === candidateId ? { ...c, status: 'approved' } : c
          )
        );
      } else {
        setError(response.error || 'Gagal approve kandidat');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal approve kandidat');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (candidateId: string) => {
    try {
      setActionLoading(candidateId);
      const response = await liveBoardService.rejectCandidate(
        projectId,
        candidateId,
        'Rejected via live board'
      );

      if (response.status === 'success') {
        // Remove candidate from list
        setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
      } else {
        setError(response.error || 'Gagal reject kandidat');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal reject kandidat');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCall = async (candidateId: string) => {
    try {
      setActionLoading(candidateId);
      const response = await liveBoardService.callCandidate(
        projectId,
        candidateId
      );

      if (response.status === 'success') {
        // Update local state
        setCandidates((prev) =>
          prev.map((c) =>
            c.id === candidateId ? { ...c, status: 'in_call' } : c
          )
        );
      } else {
        setError(response.error || 'Gagal panggil kandidat');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal panggil kandidat');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-20">
      {/* Header */}
      <div className="flex justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Radio className="text-amber-500 animate-pulse" size={24} /> Live Casting Board
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Monitor talent walk-in yang scan QR di lokasi syuting secara real-time.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-full text-xs font-bold border border-emerald-200 dark:border-emerald-500/30 shadow-sm flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Board Active: {liveBoard?.project_name || projectId}
          </div>
          <button
            onClick={() => setManualRefresh((prev) => prev + 1)}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
          >
            <Zap size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl flex items-start gap-3">
          <AlertCircle className="text-rose-500 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <h4 className="font-bold text-rose-900 dark:text-rose-400">Koneksi Error</h4>
            <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
          </div>
        </div>
      )}

      {/* Candidates Grid */}
      {isLoading && candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="animate-spin mb-4" size={32} />
          <p className="font-bold">Memuat kandidat...</p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Users className="mb-4 opacity-20" size={48} />
          <p className="font-bold">Belum ada kandidat masuk</p>
          <p className="text-xs text-slate-500 mt-1">Tunggu talent scan QR code di lokasi casting</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidates.map((candidate) => (
            <div
              key={candidate.id}
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between group ${
                candidate.status === 'approved'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                  : candidate.status === 'rejected'
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10'
                    : candidate.status === 'in_call'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-card hover:border-amber-300'
              }`}
            >
              {/* Header with Avatar & Time */}
              <div className="flex justify-between items-start mb-4">
                <div className="h-12 w-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {candidate.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-[10px] font-black bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-lg flex items-center gap-1">
                  <Clock size={10} /> {new Date(candidate.entered_at).toLocaleTimeString('id-ID')}
                </span>
              </div>

              {/* Candidate Info */}
              <div className="mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white">{candidate.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{candidate.phone}</p>
                {candidate.queue_number && (
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                    #{candidate.queue_number}
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className="mb-4 pt-3 border-t border-slate-100/50 dark:border-slate-800/50">
                <span className="text-xs font-bold uppercase tracking-wide">
                  {candidate.status === 'waiting' && (
                    <span className="text-slate-600 dark:text-slate-300">Menunggu Dipanggil</span>
                  )}
                  {candidate.status === 'approved' && (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Disetujui
                    </span>
                  )}
                  {candidate.status === 'rejected' && (
                    <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <XCircle size={12} /> Ditolak
                    </span>
                  )}
                  {candidate.status === 'in_call' && (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Phone size={12} className="animate-pulse" /> Sedang Dipanggil
                    </span>
                  )}
                </span>
              </div>

              {/* Action Buttons */}
              {candidate.status === 'waiting' && (
                <div className="flex gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <button
                    onClick={() => handleCall(candidate.id)}
                    disabled={actionLoading === candidate.id}
                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1"
                  >
                    {actionLoading === candidate.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Phone size={14} />
                    )}
                    Panggil
                  </button>
                  <button
                    onClick={() => handleApprove(candidate.id)}
                    disabled={actionLoading === candidate.id}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1"
                  >
                    {actionLoading === candidate.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                    ACC
                  </button>
                  <button
                    onClick={() => handleReject(candidate.id)}
                    disabled={actionLoading === candidate.id}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1"
                  >
                    {actionLoading === candidate.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <XCircle size={14} />
                    )}
                    Tolak
                  </button>
                </div>
              )}

              {candidate.status === 'in_call' && (
                <div className="flex gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <button
                    onClick={() => handleApprove(candidate.id)}
                    disabled={actionLoading === candidate.id}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 size={14} /> Approve
                  </button>
                  <button
                    onClick={() => handleReject(candidate.id)}
                    disabled={actionLoading === candidate.id}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stats Footer */}
      <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
        <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
          Total: <span className="text-amber-600 dark:text-amber-400">{candidates.length}</span> Kandidat
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Approved: <span className="text-emerald-600 font-bold">{candidates.filter((c) => c.status === 'approved').length}</span> | Rejected:{' '}
          <span className="text-rose-600 font-bold">{candidates.filter((c) => c.status === 'rejected').length}</span>
        </div>
      </div>
    </div>
  );
}
