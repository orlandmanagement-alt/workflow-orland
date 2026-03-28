import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { talentService } from '@/lib/services/talentService';
import { useAuthStore } from '@/store/useAppStore';
import { TrendingUp, Eye, Target, Award, Zap, CalendarDays, ChevronRight, QrCode, ScanLine, X, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import '@/assets/css/profile.css';

const profileSchema = z.object({
  full_name: z.string().min(3, "Nama minimal 3 karakter"),
  birth_date: z.string().min(1, "Wajib diisi"),
  height: z.string().min(2),
  weight: z.string().min(2),
  category: z.enum(["Model", "Actor", "Influencer"]),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isNewTalent, setIsNewTalent] = useState(false);
  const [showVIPCard, setShowVIPCard] = useState(false);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    talentService.getProfile().then((data) => {
        if (data && data.height) setProfile(data);
        else setIsNewTalent(true);
    }).catch(() => setIsNewTalent(true)).finally(() => setLoading(false));
  }, []);

  const { register, handleSubmit, formState: { isSubmitting }, reset } = useForm<ProfileFormValues>({ resolver: zodResolver(profileSchema), defaultValues: { category: 'Model' } });
  useEffect(() => { if (isNewTalent && user?.full_name) reset({ full_name: user.full_name }); }, [isNewTalent, user, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      const updatedProfile = await talentService.updateProfile(data);
      setProfile(updatedProfile);
      setIsNewTalent(false);
      alert("Profil berhasil disimpan!");
    } catch (err) { alert("Gagal menyimpan profil."); }
  };

  if (loading) return <div className="p-20 text-center font-bold text-slate-400">Menyinkronkan Data...</div>;

  if (isNewTalent) {
      // FORM PENDAFTARAN (Disingkat untuk fokus ke Dashboard)
      return <div className="p-10 text-center text-slate-500">Silakan isi data diri di menu Profile Editor.</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER HERO BANNER DENGAN TOMBOL VIP PASS */}
      <div className="bg-gradient-to-r from-slate-900 to-brand-900 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Award size={160} /></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-brand-500/20 rounded-full blur-[80px]"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                  <div className="flex items-center gap-2 mb-3">
                      <span className="bg-gradient-to-r from-amber-300 to-amber-500 text-slate-900 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest shadow-lg shadow-amber-500/30 flex items-center"><Award size={12} className="mr-1"/> Verified Pro</span>
                      <span className="bg-white/10 text-white backdrop-blur-md border border-white/20 text-[10px] font-bold uppercase px-3 py-1 rounded-full">{profile.category}</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">Welcome, {profile.full_name.split(' ')[0]}!</h1>
                  <p className="text-brand-100/80 text-sm max-w-md mb-6">Katalog digital Anda sedang dipromosikan ke jaringan klien premium Orland Management.</p>
                  
                  <button onClick={() => setShowVIPCard(true)} className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold rounded-xl flex items-center shadow-lg transition-colors">
                      <QrCode size={18} className="mr-2 text-amber-400" /> Tampilkan VIP Pass
                  </button>
              </div>
              
              <div className="w-full md:w-auto bg-slate-900/50 backdrop-blur-xl border border-white/10 p-5 rounded-2xl text-white min-w-[200px] shadow-inner">
                  <p className="text-xs text-brand-300 font-bold uppercase tracking-wider mb-2 flex justify-between">Profile Strength <span>85%</span></p>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-3">
                      <div className="h-full bg-gradient-to-r from-amber-400 to-green-400 w-[85%] rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)]"></div>
                  </div>
                  <Link to="/profile" className="text-xs font-bold text-white hover:text-amber-300 flex items-center transition-colors">Lengkapi Portofolio <ChevronRight size={14}/></Link>
              </div>
          </div>
      </div>

      {/* QUICK STATS INSIGHTS (Tetap Sama) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 hover:border-brand-300 transition-colors group">
              <div className="h-14 w-14 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Eye size={28}/></div>
              <div><p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">124</p><p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Profile Views</p></div>
          </div>
          <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 hover:border-brand-300 transition-colors group">
              <div className="h-14 w-14 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Target size={28}/></div>
              <div><p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">18</p><p className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Search Appearances</p></div>
          </div>
          <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 hover:border-brand-300 transition-colors group">
              <div className="h-14 w-14 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><TrendingUp size={28}/></div>
              <div><p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">3</p><p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Proyek Selesai</p></div>
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
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Sistem sedang memindai 45+ Open Casting yang sesuai dengan portofolio Anda.</p>
              <Link to="/jobs/match" className="w-fit px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-500/30 transition-transform hover:scale-105">
                  Cek Rekomendasi AI &rarr;
              </Link>
          </div>
      </div>

      {/* ================================================== */}
      {/* MODAL 3D DIGITAL VIP PASS (APPLE WALLET STYLE)     */}
      {/* ================================================== */}
      {showVIPCard && (
          <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in">
              <button onClick={() => {setShowVIPCard(false); setIsCardFlipped(false);}} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                  <X size={24} />
              </button>
              
              <h2 className="text-white font-bold mb-8 tracking-widest uppercase text-sm flex items-center"><ScanLine size={18} className="mr-2 text-brand-400"/> Tunjukkan ke Security / Klien</h2>

              {/* 3D Scene Container */}
              <div className="w-full max-w-[340px] aspect-[5.5/8.5] perspective-1000 cursor-pointer" onClick={() => setIsCardFlipped(!isCardFlipped)}>
                  
                  {/* The Flipping Card */}
                  <div className={`relative w-full h-full transition-transform duration-700 preserve-3d ${isCardFlipped ? 'rotate-y-180' : ''}`}>
                      
                      {/* --- KARTU DEPAN (FRONT) --- */}
                      <div className="absolute inset-0 backface-hidden rounded-[30px] shadow-2xl overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-black border border-slate-700">
                          {/* Chip / NFC Icon */}
                          <div className="absolute top-6 right-6">
                              <div className="w-10 h-8 border border-amber-500/50 rounded-md bg-gradient-to-br from-amber-200/20 to-amber-500/20 flex flex-col justify-around p-1">
                                  <div className="w-full h-[1px] bg-amber-500/50"></div>
                                  <div className="w-full h-[1px] bg-amber-500/50"></div>
                                  <div className="w-full h-[1px] bg-amber-500/50"></div>
                              </div>
                          </div>
                          
                          <div className="p-8 h-full flex flex-col">
                              <h3 className="text-white font-black text-2xl tracking-tighter">ORLAND</h3>
                              <p className="text-brand-500 text-[10px] font-bold tracking-widest mb-6">MANAGEMENT</p>
                              
                              <div className="w-24 h-24 rounded-full border-2 border-brand-500 p-1 mb-4 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                                  <div className="w-full h-full rounded-full bg-slate-700 overflow-hidden bg-cover bg-center" style={{ backgroundImage: profile?.profile_picture ? `url(${profile.profile_picture})` : 'none' }}>
                                      {!profile?.profile_picture && <span className="flex h-full items-center justify-center text-xs text-slate-500">No Photo</span>}
                                  </div>
                              </div>
                              
                              <div className="mt-auto">
                                  <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Talent Name</p>
                                  <h2 className="text-white font-extrabold text-xl leading-tight mb-4">{profile?.full_name?.toUpperCase() || 'ENDANG WIRA SURYA'}</h2>
                                  
                                  <div className="flex justify-between items-end">
                                      <div>
                                          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">ID Number</p>
                                          <p className="text-brand-300 font-mono text-sm tracking-wider">OM-{new Date().getFullYear()}-{Math.floor(1000 + Math.random() * 9000)}</p>
                                      </div>
                                      <div className="bg-amber-400/10 border border-amber-400/50 text-amber-400 text-[10px] font-bold px-2 py-1 rounded-md uppercase">VIP Access</div>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* --- KARTU BELAKANG (BACK) DENGAN QR CODE --- */}
                      <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-[30px] shadow-2xl overflow-hidden bg-slate-100 border border-slate-300 flex flex-col">
                          <div className="w-full h-12 bg-slate-900 mt-8"></div> {/* Magnetic Strip (Aesthetic) */}
                          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
                              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-4">Scan for Studio Check-In</p>
                              
                              {/* QR Code Simulation Box */}
                              <div className="w-40 h-40 bg-white border-2 border-slate-300 p-2 rounded-xl mb-4 relative flex items-center justify-center">
                                  {/* Ini adalah dekorasi pola QR Code palsu menggunakan grid */}
                                  <div className="w-full h-full grid grid-cols-4 grid-rows-4 gap-1 opacity-80">
                                      <div className="bg-black rounded-tl-lg"></div><div className="bg-black"></div><div className="bg-transparent"></div><div className="bg-black rounded-tr-lg"></div>
                                      <div className="bg-black"></div><div className="bg-transparent"></div><div className="bg-black"></div><div className="bg-black"></div>
                                      <div className="bg-black"></div><div className="bg-black"></div><div className="bg-transparent"></div><div className="bg-black"></div>
                                      <div className="bg-black rounded-bl-lg"></div><div className="bg-transparent"></div><div className="bg-black"></div><div className="bg-black rounded-br-lg"></div>
                                  </div>
                                  {/* Garis Scanner Merah Animasi */}
                                  <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500 shadow-[0_0_10px_red] animate-[scan_2s_ease-in-out_infinite]"></div>
                              </div>
                              
                              <p className="text-slate-800 font-mono text-xs font-bold bg-slate-200 px-3 py-1 rounded-full">{user?.email || 'talent@orland.com'}</p>
                              <div className="mt-auto pt-4 border-t border-slate-300 w-full">
                                  <p className="text-slate-400 text-[8px] leading-tight">Property of Orland Management. If found, please return to Orland HQ, Malang, Indonesia.</p>
                              </div>
                          </div>
                      </div>

                  </div>
              </div>

              <div className="mt-8 flex items-center text-slate-400 text-sm animate-pulse">
                  <RotateCcw size={16} className="mr-2"/> Ketuk kartu untuk membalik
              </div>
          </div>
      )}
      
      {/* Tambahkan CSS Khusus untuk 3D Flip & Scanner di dalam tag style */}
      <style dangerouslySetInnerHTML={{__html: `
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        @keyframes scan {
            0% { top: 0; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
      `}} />

    </div>
  );
}
