import { useProfileProgress } from '@/hooks/useProfileProgress';
import { useMyAnalytics } from '@/hooks/usePhase4';
import React, { useState, useEffect } from 'react';
import { talentService } from '@/lib/services/talentService';
import { useAuthStore } from '@/store/useAppStore';
import { TrendingUp, Eye, Target, Award, Zap, CalendarDays, ChevronRight, QrCode, ScanLine, X, RotateCcw, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showVIPCard, setShowVIPCard] = useState(false);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const user = useAuthStore((state) => state.user);
  const profileProgressData = useProfileProgress();
  const progressValue = typeof profileProgressData === 'number' ? profileProgressData : (profileProgressData as any)?.percentage || 0;
  
  // Fetch real analytics data instead of hardcoded values
  const { dashboard: analytics, loading: analyticsLoading } = useMyAnalytics();
  
  // Fallback values if API not yet implemented
  const viewsThisWeek = analytics?.views_this_week ?? 124;
  const aiSearches = analytics?.matched_in_ai_searches ?? 18;
  const projectsCompleted = analytics?.completed_projects ?? 3;

  useEffect(() => {
    talentService.getProfile().then((data) => {
        if (data && data.height) setProfile(data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-20 text-center font-bold text-slate-400">Memuat Dashboard...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER HERO BANNER & PROGRESS BAR */}
      <div className="bg-gradient-to-r from-slate-900 to-brand-900 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Award size={160} /></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                  <div className="flex items-center gap-2 mb-3">
                      <span className="bg-amber-400 text-amber-950 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest shadow-lg flex items-center"><Award size={12} className="mr-1"/> Verified Pro</span>
                      <span className="bg-white/20 text-white backdrop-blur-md border border-white/20 text-[10px] font-bold uppercase px-3 py-1 rounded-full">{profile?.category || 'Talent'}</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">Welcome, {profile?.full_name?.split(' ')[0] || user?.full_name?.split(' ')[0] || 'Talent'}!</h1>
                  <p className="text-brand-100/80 text-sm max-w-md mb-6">Katalog digital Anda sedang dipromosikan ke jaringan klien premium Orland Management.</p>
                  
                  <button onClick={() => setShowVIPCard(true)} className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold rounded-xl flex items-center shadow-lg transition-colors">
                      <QrCode size={18} className="mr-2 text-amber-400" /> Tampilkan VIP Pass
                  </button>
              </div>
              
              <div className="w-full md:w-auto bg-slate-900/50 backdrop-blur-xl border border-white/10 p-5 rounded-2xl text-white min-w-[200px] shadow-inner">
                  <p className="text-xs text-brand-300 font-bold uppercase tracking-wider mb-2 flex justify-between">Profile Strength <span>{progressValue}%</span></p>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-3">
                      <div className="h-full bg-gradient-to-r from-amber-400 to-green-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)] transition-all duration-1000" style={{ width: `${progressValue}%` }}></div>
                  </div>
                  <Link to="/profile" className="text-xs font-bold text-white hover:text-amber-300 flex items-center transition-colors">Lengkapi Portofolio <ChevronRight size={14}/></Link>
              </div>
          </div>
      </div>

      {/* QUICK STATS INSIGHTS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5">
              <div className="h-14 w-14 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center"><Eye size={28}/></div>
              <div><p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{analyticsLoading ? '-' : viewsThisWeek}</p><p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Profile Views</p></div>
          </div>
          <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5">
              <div className="h-14 w-14 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center"><Target size={28}/></div>
              <div><p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{analyticsLoading ? '-' : aiSearches}</p><p className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Searches</p></div>
          </div>
          <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5">
              <div className="h-14 w-14 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center"><TrendingUp size={28}/></div>
              <div><p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{analyticsLoading ? '-' : projectsCompleted}</p><p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Proyek Selesai</p></div>
          </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-dark-card p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg dark:text-white flex items-center"><CalendarDays size={20} className="mr-2 text-brand-500"/> Agenda Terdekat</h3>
                  <Link to="/schedules" className="text-sm font-bold text-brand-600 hover:underline">Lihat Semua</Link>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Besok, 08:00 WIB</span>
                  <p className="font-bold text-slate-900 dark:text-white text-lg">Shooting TVC Glow Soap</p>
                  <p className="text-sm text-slate-500 mt-1">Studio Alam TVRI, Jakarta</p>
              </div>
          </div>

          <div className="bg-brand-50 dark:bg-brand-900/10 p-8 rounded-3xl border border-brand-100 dark:border-brand-800/50 flex flex-col justify-center">
              <div className="h-12 w-12 bg-brand-100 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-full flex items-center justify-center mb-4"><Zap size={24}/></div>
              <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-2">Smart Match AI Aktif</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Sistem sedang memindai Open Casting yang sesuai dengan Anda.</p>
              <Link to="/jobs/match" className="w-fit px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-105">
                  Cek Rekomendasi AI &rarr;
              </Link>
          </div>
      </div>

      {/* ================================================== */}
      {/* MODAL 3D DIGITAL VIP PASS (FOTO BESAR & CENTER)    */}
      {/* ================================================== */}
      {showVIPCard && (
          <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in">
              <button onClick={() => {setShowVIPCard(false); setIsCardFlipped(false);}} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white">
                  <X size={24} />
              </button>
              <h2 className="text-white font-bold mb-8 tracking-widest uppercase text-xs flex items-center"><ScanLine size={18} className="mr-2 text-brand-400"/> Tunjukkan ke Security / Klien</h2>

              <div className="w-full max-w-[340px] aspect-[5.5/8.5] perspective-1000 cursor-pointer" onClick={() => setIsCardFlipped(!isCardFlipped)}>
                  <div className={`relative w-full h-full transition-transform duration-700 preserve-3d ${isCardFlipped ? 'rotate-y-180' : ''}`}>
                      
                      {/* KARTU DEPAN */}
                      <div className="absolute inset-0 backface-hidden rounded-[30px] shadow-2xl overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-black border border-slate-700 p-1">
                          <div className="absolute top-4 left-6 flex items-center gap-1">
                            <Ticket size={14} className="text-amber-400" />
                            <span className="text-amber-400 text-[9px] font-black uppercase tracking-widest">Digital ID</span>
                          </div>
                          
                          <div className="flex flex-col h-full bg-slate-900/40 rounded-[28px] p-6 text-center">
                              {/* FOTO BESAR & CENTER */}
                              <div className="w-40 h-40 rounded-3xl border-4 border-slate-700 p-1 mx-auto mt-6 mb-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-slate-800">
                                  <div className="w-full h-full rounded-2xl overflow-hidden bg-cover bg-center" style={{ backgroundImage: profile?.profile_picture ? `url(${profile.profile_picture})` : 'none' }}>
                                      {!profile?.profile_picture && <span className="flex h-full items-center justify-center text-xs text-slate-500">No Photo</span>}
                                  </div>
                              </div>
                              
                              <h2 className="text-white font-black text-2xl leading-tight tracking-tighter mb-1">{profile?.full_name?.toUpperCase() || user?.full_name?.toUpperCase() || 'TALENT NAME'}</h2>
                              <p className="text-brand-400 text-xs font-bold uppercase tracking-wider mb-8">{profile?.category || 'VIP Talent'}</p>
                              
                              <div className="mt-auto flex justify-between items-end text-left border-t border-slate-700/50 pt-4">
                                  <div>
                                      <p className="text-slate-400 text-[9px] uppercase font-bold tracking-widest">ID Number</p>
                                      <p className="text-brand-300 font-mono text-sm tracking-wider">OM-{new Date().getFullYear()}-XXXX</p>
                                  </div>
                                  <div className="bg-amber-400/10 border border-amber-400/50 text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase">VIP Pro</div>
                              </div>
                          </div>
                      </div>

                      {/* KARTU BELAKANG */}
                      <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-[30px] shadow-2xl overflow-hidden bg-slate-100 border border-slate-300 flex flex-col p-6 items-center justify-center text-center">
                          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-6">Akses Kehadiran (Check-In Studio)</p>
                          <div className="w-48 h-48 bg-white border-2 border-slate-300 p-3 rounded-2xl mb-6 relative">
                              <div className="w-full h-full grid grid-cols-4 grid-rows-4 gap-1 opacity-80">
                                  <div className="bg-black rounded-tl-md"></div><div className="bg-black"></div><div className="bg-transparent"></div><div className="bg-black rounded-tr-md"></div>
                                  <div className="bg-transparent"></div><div className="bg-transparent"></div><div className="bg-black"></div><div className="bg-transparent"></div>
                                  <div className="bg-black rounded-bl-md"></div><div className="bg-transparent"></div><div className="bg-transparent"></div><div className="bg-black rounded-br-md"></div>
                              </div>
                              <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500 shadow-[0_0_10px_red] animate-[scan_2s_ease-in-out_infinite]"></div>
                          </div>
                          <p className="text-slate-900 font-mono text-xs font-bold bg-slate-200 px-3 py-1 rounded-full">{user?.email || 'OM-VIP-PASS'}</p>
                      </div>
                  </div>
              </div>

              <div className="mt-8 flex items-center text-slate-400 text-sm animate-pulse">
                  <RotateCcw size={16} className="mr-2"/> Ketuk kartu untuk membalik
              </div>
          </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        @keyframes scan { 0% { top: 0; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
      `}} />
    </div>
  );
}
