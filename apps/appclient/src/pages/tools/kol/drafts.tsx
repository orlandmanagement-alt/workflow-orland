import { useState, useRef, useEffect } from 'react';
import { PlayCircle, CheckCircle2, MessageSquareWarning, Clock, Send, Play, Pause, Volume2, Maximize2, AlertTriangle, Loader2 } from 'lucide-react';
import { kolService } from '@/lib/services/toolsService';

export default function KOLDraftReview() {
  // Get draftId from URL params or use default
  const draftId = new URLSearchParams(window.location.search).get('id') || 'draft-1';
  
  const [draft, setDraft] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [reviewStatus, setReviewStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch draft on mount
  useEffect(() => {
    const fetchDraft = async () => {
      try {
        setLoading(true);
        const data = await kolService.getDraft(draftId);
        setDraft(data);
        setComments(data.comments || []);
      } catch (err: any) {
        console.error('Failed to fetch draft:', err);
        setError(err.message || 'Gagal memuat draft video');
      } finally {
        setLoading(false);
      }
    };

    fetchDraft();
  }, [draftId]);

  // Toggle Play/Pause
  const togglePlay = () => {
      if (videoRef.current) {
          if (isPlaying) videoRef.current.pause();
          else videoRef.current.play();
          setIsPlaying(!isPlaying);
      }
  };

  // Update Waktu Berjalan
  const handleTimeUpdate = () => {
      if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  // Format Waktu ke 00:00
  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = Math.floor(seconds % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
  };

  // Tambah Komentar dengan Timestamp dan API Call
  const handleAddComment = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newComment.trim()) return;
      
      try {
        setSubmitting(true);
        // Call API to add comment
        await kolService.addDraftComment(draftId, {
          text: newComment,
          timestamp: currentTime
        });

        const comment = {
          id: Date.now(),
          time: formatTime(currentTime),
          text: newComment,
          author: 'Anda (Client)'
        };
        setComments([...comments, comment].sort((a, b) => a.time.localeCompare(b.time)));
        setNewComment('');
        
        // Auto-pause saat ngetik/kirim komen
        if (videoRef.current && isPlaying) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      } catch (err: any) {
        alert('Gagal menambahkan komentar: ' + (err.message || 'Unknown error'));
      } finally {
        setSubmitting(false);
      }
  };

  // Loncat ke Waktu Komentar (Jump to Timestamp)
  const jumpToTime = (timeString: string) => {
      if (!videoRef.current) return;
      const [m, s] = timeString.split(':').map(Number);
      const totalSeconds = (m * 60) + s;
      videoRef.current.currentTime = totalSeconds;
      setCurrentTime(totalSeconds);
      videoRef.current.pause();
      setIsPlaying(false);
  };

  const handleDecision = async (decision: 'Approve' | 'Revise') => {
      try {
        setSubmitting(true);
        setReviewStatus(decision);
        
        if (decision === 'Approve') {
          await kolService.approveDraft(draftId);
          alert('Video disetujui! Notifikasi akan dikirim ke Talent untuk segera di-posting.');
        } else {
          await kolService.requestDraftRevision(draftId, { comments });
          alert('Permintaan revisi dikirim! Talent akan menerima notifikasi beserta catatan timestamp Anda.');
        }
      } catch (err: any) {
        alert('Gagal memproses keputusan: ' + (err.message || 'Unknown error'));
        setReviewStatus(null);
      } finally {
        setSubmitting(false);
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-20 h-[calc(100vh-100px)] flex flex-col">
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-3xl flex items-start gap-4 shrink-0">
          <AlertTriangle className="text-red-600 dark:text-red-400 shrink-0 mt-1" size={24} />
          <div className="flex-1">
            <h2 className="font-bold text-red-900 dark:text-red-400 mb-1">Gagal Memuat Draft</h2>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg">
            Coba Lagi
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="animate-spin mx-auto mb-3 text-brand-500" size={32} />
            <p className="font-bold text-slate-600 dark:text-slate-400">Memuat draft video...</p>
          </div>
        </div>
      ) : !draft ? (
        <div className="bg-slate-100 dark:bg-slate-800 p-12 rounded-3xl text-center">
          <PlayCircle className="mx-auto mb-4 text-slate-400" size={40} />
          <p className="text-slate-600 dark:text-slate-400 font-bold">Draft tidak ditemukan</p>
        </div>
      ) : (
      <>
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shrink-0">
        <div>
            <div className="flex items-center gap-2 mb-2">
                <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">KOL Content</span>
                <span className="text-xs font-bold text-slate-500">{draft.campaign || 'Campaign'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center tracking-tight leading-none">
                <PlayCircle className="mr-3 text-brand-500" size={32}/> Draft: {draft.talent_name || 'Talent'}
            </h1>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
            <button 
                onClick={() => handleDecision('Revise')}
                disabled={reviewStatus !== null || submitting}
                className="flex-1 sm:flex-none flex items-center justify-center px-6 py-3 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-500 hover:bg-amber-200 dark:hover:bg-amber-900/40 rounded-xl text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
            >
                {submitting && reviewStatus === 'Revise' ? <Loader2 size={18} className="animate-spin mr-2"/> : <MessageSquareWarning size={18} className="mr-2"/>}
                Minta Revisi
            </button>
            <button 
                onClick={() => handleDecision('Approve')}
                disabled={reviewStatus !== null || submitting}
                className="flex-1 sm:flex-none flex items-center justify-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
                {submitting && reviewStatus === 'Approve' ? <Loader2 size={18} className="animate-spin mr-2"/> : <CheckCircle2 size={18} className="mr-2"/>}
                Setujui Tayang (Approve)
            </button>
        </div>
      </div>

      {/* SPLIT SCREEN LAYOUT */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 mt-4 min-h-0 overflow-hidden">
          
          {/* KOLOM KIRI: TIKTOK STYLE VIDEO PLAYER */}
          <div className="flex justify-center bg-black rounded-3xl overflow-hidden shadow-2xl relative lg:w-[400px] shrink-0">
              {/* Video Element (Simulated Vertical) */}
              <video 
                  ref={videoRef}
                  src={draft.video_url || draft.videoUrl}
                  className="h-full w-full object-cover aspect-[9/16]"
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  onClick={togglePlay}
              />
              
              {/* Custom Video Controls Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none flex flex-col justify-between p-4">
                  {/* Top Bar */}
                  <div className="flex justify-between items-center text-white/80">
                      <span className="text-xs font-bold px-2 py-1 bg-black/40 rounded-lg backdrop-blur-sm">{draft.version || 'Draft Ver. 1'}</span>
                      <Volume2 size={18} />
                  </div>
                  
                  {/* Center Play Button (Fades when playing) */}
                  <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}>
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                          <Play size={32} className="text-white ml-1 fill-white" />
                      </div>
                  </div>

                  {/* Bottom Bar: Timeline */}
                  <div className="space-y-2 pointer-events-auto">
                      <div className="flex justify-between text-[10px] font-bold text-white font-mono drop-shadow-md">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(draft.duration || 15)}</span>
                      </div>
                      
                      {/* Custom Progress Bar */}
                      <div className="h-1.5 w-full bg-white/30 rounded-full overflow-hidden cursor-pointer" onClick={(e) => {
                          if(!videoRef.current) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          const percent = (e.clientX - rect.left) / rect.width;
                          videoRef.current.currentTime = percent * MOCK_DRAFT.duration;
                      }}>
                          <div className="h-full bg-brand-500 rounded-full" style={{ width: `${(currentTime / MOCK_DRAFT.duration) * 100}%` }}></div>
                      </div>
                  </div>
              </div>
          </div>

          {/* KOLOM KANAN: TIMESTAMP COMMENTS (REVISION BOARD) */}
          <div className="flex-1 bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col shrink-0 overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center">
                      <MessageSquareWarning className="mr-2 text-brand-500" size={20}/> Catatan Revisi
                  </h3>
                  <span className="text-xs font-bold text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full">{comments.length} Catatan</span>
              </div>

              {/* List Komentar */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-[#071122]">
                  {comments.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400">
                          <CheckCircle2 size={48} className="mb-4 opacity-50" />
                          <p className="font-bold text-sm">Belum ada catatan revisi.</p>
                          <p className="text-xs mt-1">Video terlihat sempurna!</p>
                      </div>
                  ) : (
                      comments.map(c => (
                          <div key={c.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm group">
                              <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-2">
                                      {/* Timestamp Badge (Clickable) */}
                                      <button 
                                          onClick={() => jumpToTime(c.time)}
                                          className="flex items-center text-[10px] font-mono font-bold bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-400 px-2 py-1 rounded hover:bg-brand-200 dark:hover:bg-brand-900/60 transition-colors"
                                          title="Loncat ke detik ini"
                                      >
                                          <Clock size={10} className="mr-1"/> {c.time}
                                      </button>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase">{c.author}</span>
                                  </div>
                              </div>
                              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{c.text}</p>
                          </div>
                      ))
                  )}
              </div>

              {/* Form Input Komentar Bawah */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-card">
                  <form onSubmit={handleAddComment} className="flex gap-3">
                      <div className="flex flex-col items-center justify-center px-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Waktu</span>
                          <span className="text-sm font-mono font-black text-brand-600 dark:text-brand-400">{formatTime(currentTime)}</span>
                      </div>
                      <input 
                          type="text" 
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder={`Tambahkan catatan pada detik ke ${formatTime(currentTime)}...`}
                          className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none dark:text-white focus:ring-2 focus:ring-brand-500"
                      />
                      <button 
                          type="submit" 
                          disabled={!newComment.trim() || submitting}
                          className="px-5 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl shadow-md hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center"
                      >
                          {submitting ? <Loader2 size={18} className="animate-spin"/> : <Send size={18} />}
                      </button>
                  </form>
              </div>
          </div>
      </div>
      </>
      )}

    </div>
  )
}
