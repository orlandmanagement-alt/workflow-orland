import { useState } from 'react';
import { Sparkles, Heart, X, MapPin, DollarSign, Calendar, LayoutGrid, Layers, CheckCircle2, Building2 } from 'lucide-react';
import { applicationsService } from '@/lib/services/applicationsService';
import type { ApplicationPayload } from '@/types/application.types';

// Data Simulasi Proyek (Nantinya dari API)
const MOCK_JOBS = [
  { id: 1, project_id: 'PRJ-001', title: "Main Talent TVC Skincare", client: "Glow Up Beauty", fee: "Rp 8.000.000", location: "Studio Alam, Depok", date: "12 April 2026", tags: ["Beauty", "Commercial"], image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=800&h=1000" },
  { id: 2, project_id: 'PRJ-002', title: "Pemeran Pembantu (Aksi)", client: "MD Entertainment", fee: "Rp 15.000.000", location: "Jakarta Pusat", date: "20-25 April 2026", tags: ["Film", "Action"], image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800&h=1000" },
  { id: 3, project_id: 'PRJ-003', title: "Model Runaway JFW", client: "Erigo x Orland", fee: "Rp 5.500.000", location: "Senayan City", date: "05 Mei 2026", tags: ["Catwalk", "Fashion"], image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=800&h=1000" },
  { id: 4, project_id: 'PRJ-004', title: "Bintang Video Klip", client: "Sony Music ID", fee: "Rp 4.000.000", location: "Bali", date: "10 Mei 2026", tags: ["Music Video", "Actor"], image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800&h=1000" },
];

export default function AIMatch() {
  const [viewMode, setViewMode] = useState<'swipe' | 'list'>('swipe');
  const [jobs, setJobs] = useState(MOCK_JOBS);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Menangani aksi Swipe / Tombol
  const handleAction = async (direction: 'left' | 'right', id: number) => {
    const job = jobs.find(j => j.id === id);
    if (!job) return;

    setSwipeDirection(direction);
    
    // Jika swipe kanan, kirim lamaran
    if (direction === 'right') {
      setIsApplying(true);
      setApplyError(null);
      
      try {
        const payload: ApplicationPayload = {
          projectId: job.project_id,
          roleId: `ROLE-${job.id}`, // Mock role ID, should come from API
          coverLetter: `Saya tertarik untuk melamar ${job.title} di ${job.client}.`,
        };
        
        const result = await applicationsService.applyForProject(payload);
        console.log('Application submitted:', result);
        
        // Show success message
        alert(`Berhasil Melamar! AI Orland telah mengirimkan portofolio Anda ke ${job.client}.`);
      } catch (err: any) {
        console.error('Application error:', err);
        setApplyError(err.message || 'Gagal mengirim lamaran');
        alert(`Error: ${err.message || 'Gagal mengirim lamaran'}`);
      } finally {
        setIsApplying(false);
      }
    }
    
    // Memberikan waktu untuk animasi kartu terbang sebelum menghapus dari state
    setTimeout(() => {
        setJobs(prev => prev.filter(job => job.id !== id));
        setSwipeDirection(null);
    }, 400);
  };

  const currentJob = jobs[0]; // Kartu teratas

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10 min-h-[80vh] flex flex-col">
      
      {/* HEADER & VIEW TOGGLE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center"><Sparkles className="mr-2 text-brand-500" /> Smart Match AI</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Algoritma Orland mencarikan casting yang 99% cocok dengan profil Anda.</p>
        </div>
        
        {/* Toggle Opsi Tampilan (Mobile Friendly) */}
        <div className="bg-slate-200/50 dark:bg-slate-800 p-1.5 rounded-2xl flex items-center w-full sm:w-auto border border-slate-200 dark:border-slate-700">
            <button onClick={() => setViewMode('swipe')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${viewMode === 'swipe' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                <Layers size={16} /> Mode Swipe
            </button>
            <button onClick={() => setViewMode('list')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                <LayoutGrid size={16} /> Mode Daftar
            </button>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-10 text-center animate-in zoom-in-95">
            <div className="h-20 w-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-6"><CheckCircle2 size={40}/></div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Hebat! Anda sudah melihat semuanya.</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8">AI Orland sedang mencari Open Casting baru untuk Anda. Silakan cek lagi nanti sore!</p>
            <button onClick={() => setJobs(MOCK_JOBS)} className="px-8 py-3 bg-brand-600 text-white font-bold rounded-xl shadow-lg hover:bg-brand-700 transition-colors">Muat Ulang Simulasi</button>
        </div>
      ) : (
        <>
            {/* ========================================= */}
            {/* VIEW 1: SWIPE MODE (TINDER-STYLE 3D CARDS)  */}
            {/* ========================================= */}
            {viewMode === 'swipe' && (
                <div className="flex-1 flex flex-col items-center justify-center relative w-full max-w-md mx-auto mt-4 sm:mt-10 perspective-1000">
                    
                    {/* Efek Kartu Berlapis di Belakang (Hanya visual) */}
                    {jobs.length > 1 && (
                        <div className="absolute top-4 w-[90%] h-full bg-slate-200 dark:bg-slate-800 rounded-3xl -z-10 transform scale-95 opacity-50 shadow-inner"></div>
                    )}
                    {jobs.length > 2 && (
                        <div className="absolute top-8 w-[80%] h-full bg-slate-300 dark:bg-slate-700 rounded-3xl -z-20 transform scale-90 opacity-30"></div>
                    )}

                    {/* Kartu Utama (Teratas) */}
                    <div className={`relative w-full aspect-[3/4] sm:aspect-[4/5] bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-700/50 transition-transform duration-300 ease-in-out ${swipeDirection === 'left' ? '-translate-x-full rotate-[-20deg] opacity-0' : swipeDirection === 'right' ? 'translate-x-full rotate-[20deg] opacity-0' : 'translate-x-0 rotate-0 opacity-100'}`}>
                        
                        <img src={currentJob.image} alt={currentJob.title} className="absolute inset-0 w-full h-full object-cover object-top opacity-90" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
                        
                        {/* Konten Kartu Utama */}
                        <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 z-10 flex flex-col justify-end">
                            <div className="flex flex-wrap gap-2 mb-3">
                                {currentJob.tags.map(tag => (
                                    <span key={tag} className="bg-white/20 backdrop-blur-md text-white border border-white/30 text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">{tag}</span>
                                ))}
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-black text-white leading-none tracking-tight mb-2 drop-shadow-lg">{currentJob.title}</h2>
                            <p className="text-brand-400 font-bold flex items-center text-sm sm:text-base mb-4 drop-shadow-md"><Building2 size={16} className="mr-2"/> {currentJob.client}</p>
                            
                            <div className="space-y-2 mb-6">
                                <div className="flex items-center text-slate-200 text-xs sm:text-sm font-medium bg-black/40 backdrop-blur-sm p-2 rounded-lg w-fit"><DollarSign size={16} className="mr-2 text-green-400"/> {currentJob.fee}</div>
                                <div className="flex items-center text-slate-200 text-xs sm:text-sm font-medium bg-black/40 backdrop-blur-sm p-2 rounded-lg w-fit"><MapPin size={16} className="mr-2 text-red-400"/> {currentJob.location}</div>
                                <div className="flex items-center text-slate-200 text-xs sm:text-sm font-medium bg-black/40 backdrop-blur-sm p-2 rounded-lg w-fit"><Calendar size={16} className="mr-2 text-blue-400"/> {currentJob.date}</div>
                            </div>

                            {/* Tombol Swipe Action */}
                            <div className="flex justify-center gap-6 mt-4">
                                <button 
                                  onClick={() => handleAction('left', currentJob.id)} 
                                  disabled={isApplying}
                                  className="h-16 w-16 sm:h-20 sm:w-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-red-500 shadow-[0_10px_30px_rgba(239,68,68,0.2)] hover:scale-110 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-slate-200 dark:border-slate-700 group disabled:opacity-50 disabled:cursor-not-allowed">
                                    <X size={32} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
                                </button>
                                <button 
                                  onClick={() => handleAction('right', currentJob.id)} 
                                  disabled={isApplying}
                                  className="h-16 w-16 sm:h-20 sm:w-20 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center text-white shadow-[0_10px_30px_rgba(59,130,246,0.4)] hover:scale-110 hover:shadow-[0_10px_40px_rgba(59,130,246,0.6)] transition-all group border-2 border-brand-300/50 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isApplying ? (
                                      <Sparkles size={32} className="animate-spin" />
                                    ) : (
                                      <Heart size={32} strokeWidth={2.5} className="fill-white group-hover:scale-110 transition-transform" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================= */}
            {/* VIEW 2: LIST MODE (DAFTAR KLASIK)           */}
            {/* ========================================= */}
            {viewMode === 'list' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {jobs.map(job => (
                        <div key={job.id} className="bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col sm:flex-row hover:border-brand-300 dark:hover:border-brand-600 transition-colors group">
                            
                            {/* Thumbnail */}
                            <div className="w-full sm:w-48 h-48 sm:h-auto relative shrink-0">
                                <img src={job.image} alt={job.title} className="w-full h-full object-cover" />
                                <div className="absolute top-3 left-3 flex gap-1">
                                    {job.tags.slice(0,1).map(tag => <span key={tag} className="bg-brand-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase">{tag}</span>)}
                                </div>
                            </div>

                            {/* Detail List */}
                            <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1 group-hover:text-brand-600 transition-colors">{job.title}</h3>
                                    <p className="text-sm font-bold text-slate-500 flex items-center mb-4"><Building2 size={14} className="mr-1.5"/> {job.client}</p>
                                    
                                    <div className="space-y-1.5 mb-6">
                                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-400"><DollarSign size={14} className="mr-2 text-green-500"/> <span className="font-bold text-slate-800 dark:text-slate-200">{job.fee}</span></div>
                                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-400"><MapPin size={14} className="mr-2 text-slate-400"/> {job.location}</div>
                                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-400"><Calendar size={14} className="mr-2 text-slate-400"/> {job.date}</div>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-auto">
                                    <button 
                                      onClick={() => handleAction('left', job.id)} 
                                      disabled={isApplying}
                                      className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold rounded-xl hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                      Lewati
                                    </button>
                                    <button 
                                      onClick={() => handleAction('right', job.id)} 
                                      disabled={isApplying}
                                      className="flex-1 py-2.5 bg-brand-600 text-white font-bold rounded-xl shadow-lg hover:bg-brand-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                                        {isApplying ? (
                                          <>
                                            <Sparkles size={16} className="animate-spin mr-2" />
                                            Mengirim...
                                          </>
                                        ) : (
                                          <>
                                            Lamar Sekarang <Sparkles size={16} className="ml-2"/>
                                          </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
      )}
    </div>
  )
}
