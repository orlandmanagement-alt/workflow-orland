import React, { useState, useEffect } from 'react';
import { talentService } from '@/lib/services/talentService';
import { useAuthStore } from '@/store/useAppStore';
import { Award, Zap, QrCode, ScanLine, X, RotateCcw, Building2, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import '@/assets/css/profile.css';

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showVIPCard, setShowVIPCard] = useState(false);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    talentService.getProfile().then((data) => {
        if (data && data.height) setProfile(data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-20 text-center font-bold text-slate-400">Menyinkronkan Data VIP...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER HERO BANNER (Dipersingkat) */}
      <div className="bg-gradient-to-r from-slate-900 to-brand-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Award size={160} /></div>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                  <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">Welcome, {profile?.full_name?.split(' ')[0] || 'Talent'}!</h1>
                  <p className="text-brand-100/80 text-sm max-w-md mb-6">Akses penuh ke sistem Orland Management Verified Pro.</p>
                  <button onClick={() => setShowVIPCard(true)} className="px-6 py-3 bg-white text-slate-900 font-bold rounded-xl flex items-center shadow-lg transition-colors">
                      <QrCode size={18} className="mr-2 text-brand-600" /> Tampilkan VIP Pass 3D
                  </button>
              </div>
          </div>
      </div>

      {/* QUICK ACTIONS & SMART MATCH (Tetap) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-brand-50 p-8 rounded-3xl border border-brand-100 flex flex-col justify-center">
              <div className="h-12 w-12 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-4"><Zap size={24}/></div>
              <h3 className="font-bold text-xl text-slate-900 mb-2">Smart Match AI Aktif</h3>
              <p className="text-sm text-slate-600 mb-6">Cek 45+ Open Casting yang sesuai dengan portofolio Anda.</p>
              <Link to="/jobs/match" className="w-fit px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-105">Cek Rekomendasi &rarr;</Link>
          </div>
      </div>

      {/* ================================================== */}
      {/* MODAL 3D DIGITAL VIP PASS (UPGRADED: BIG PHOTO) */}
      {/* ================================================== */}
      {showVIPCard && (
          <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in">
              <button onClick={() => {setShowVIPCard(false); setIsCardFlipped(false);}} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white">
                  <X size={24} />
              </button>
              
              <h2 className="text-white font-bold mb-8 tracking-widest uppercase text-xs flex items-center"><ScanLine size={18} className="mr-2 text-brand-400"/> Tunjukkan di Lokasi Syuting untuk Check-In</h2>

              {/* 3D Scene Container */}
              <div className="w-full max-w-[340px] aspect-[5.5/8.5] perspective-1000 cursor-pointer" onClick={() => setIsCardFlipped(!isCardFlipped)}>
                  
                  {/* The Flipping Card */}
                  <div className={`relative w-full h-full transition-transform duration-700 preserve-3d ${isCardFlipped ? 'rotate-y-180' : ''}`}>
                      
                      {/* --- KARTU DEPAN (UPGRADED: BIG & CENTERED PHOTO) --- */}
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
                              
                              <h2 className="text-white font-black text-2xlleading-tight tracking-tighter mb-1">{profile?.full_name?.toUpperCase() || 'TALENT NAME'}</h2>
                              <p className="text-brand-400 text-xs font-bold uppercase tracking-wider mb-8">{profile?.category || 'Actor & Model'}</p>
                              
                              <div className="mt-auto flex justify-between items-end text-left border-t border-slate-700/50 pt-4">
                                  <div>
                                      <p className="text-slate-400 text-[9px] uppercase font-bold tracking-widest">ID Number</p>
                                      <p className="text-brand-300 font-mono text-sm tracking-wider">OM-{new Date().getFullYear()}-XXXX</p>
                                  </div>
                                  <div className="bg-amber-400/10 border border-amber-400/50 text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase">VIP Pro</div>
                              </div>
                          </div>
                      </div>

                      {/* --- KARTU BELAKANG (Disederhanakan) --- */}
                      <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-[30px] shadow-2xl overflow-hidden bg-slate-100 border border-slate-300 flex flex-col p-6 items-center justify-center text-center">
                          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-6">Akses Kehadiran (Check-In Studio)</p>
                          
                          {/* QR Code Sim Box */}
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
      
      {/* CSS Khusus 3D Flip (Tetap) */}
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
