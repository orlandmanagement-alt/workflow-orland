import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, FileText, Clock, UploadCloud, CheckCircle2, Lock, Mail, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';

export default function ClientAuth() {
  const navigate = useNavigate();
  // State: 'login' | 'kyb-1' (Info PT) | 'kyb-2' (Dokumen) | 'pending'
  const [step, setStep] = useState('login'); 
  const [isLoading, setIsLoading] = useState(false);

  const handleSimulateLogin = (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setTimeout(() => {
          setIsLoading(false);
          // Simulasi: Jika akun baru, lempar ke KYB. Jika lama, ke Dashboard.
          setStep('kyb-1'); 
      }, 1500);
  };

  const nextStep = (next: string) => {
      setIsLoading(true);
      setTimeout(() => {
          setIsLoading(false);
          setStep(next);
      }, 1000);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#071122] flex flex-col md:flex-row font-sans">
      
      {/* KIRI: BRANDING & SPLIT SCREEN (Hidden on Mobile) */}
      <div className="hidden md:flex md:w-1/2 bg-slate-900 relative flex-col justify-between p-12 overflow-hidden">
          <div className="absolute inset-0 z-0">
              <img src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80&w=1000" alt="Office" className="w-full h-full object-cover opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
          </div>
          
          <div className="relative z-10">
              <div className="flex items-center gap-3 mb-16">
                  <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center"><Building2 className="text-white" size={20}/></div>
                  <span className="text-white font-black tracking-widest text-xl">ORLAND<span className="font-light">B2B</span></span>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-6">
                  Satu Pintu Untuk <br/><span className="text-brand-400">Semua Kebutuhan Produksi.</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-md leading-relaxed">
                  Kelola talent, otomatisasi kontrak, dan pantau keuangan proyek Anda dengan aman di dalam ekosistem Enterprise Orland Management.
              </p>
          </div>

          <div className="relative z-10 flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 w-fit">
              <div className="flex -space-x-3">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" className="w-10 h-10 rounded-full border-2 border-slate-900" alt="T"/>
                  <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80" className="w-10 h-10 rounded-full border-2 border-slate-900" alt="T"/>
                  <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-brand-500 flex items-center justify-center text-[10px] font-bold text-white">+5k</div>
              </div>
              <div>
                  <p className="text-white text-xs font-bold">Talent Premium Tersedia</p>
                  <p className="text-slate-400 text-[10px]">Siap untuk di-booking hari ini.</p>
              </div>
          </div>
      </div>

      {/* KANAN: FORM WIZARD AREA */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-24 relative overflow-y-auto">
          
          <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* === STATE 1: LOGIN === */}
              {step === 'login' && (
                  <>
                      <div className="md:hidden flex items-center gap-2 mb-10">
                          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center"><Building2 className="text-white" size={16}/></div>
                          <span className="text-slate-900 dark:text-white font-black tracking-widest text-lg">ORLAND<span className="font-light">B2B</span></span>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">Welcome Back</h2>
                      <p className="text-slate-500 text-sm mb-8">Masuk ke portal klien Orland Management.</p>

                      <form onSubmit={handleSimulateLogin} className="space-y-4">
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Perusahaan</label>
                              <div className="relative mt-1">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="text-slate-400" size={16} /></div>
                                  <input type="email" required placeholder="anda@ph-agency.com" className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none dark:text-white focus:ring-2 focus:ring-brand-500 transition-shadow" />
                              </div>
                          </div>
                          <div>
                              <div className="flex justify-between items-center">
                                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                                  <a href="#" className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline">Lupa?</a>
                              </div>
                              <div className="relative mt-1">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="text-slate-400" size={16} /></div>
                                  <input type="password" required placeholder="••••••••" className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none dark:text-white focus:ring-2 focus:ring-brand-500 transition-shadow" />
                              </div>
                          </div>
                          
                          <button type="submit" disabled={isLoading} className="w-full mt-6 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center justify-center disabled:opacity-70 disabled:hover:scale-100">
                              {isLoading ? <Loader2 size={18} className="animate-spin"/> : 'Lanjutkan'}
                          </button>
                      </form>

                      <div className="mt-8 relative">
                          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
                          <div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-[#071122] text-slate-400 font-medium">Atau gunakan SSO</span></div>
                      </div>
                      
                      <button className="w-full mt-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-3">
                          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" /> Lanjutkan dengan Google
                      </button>
                  </>
              )}

              {/* === STATE 2: KYB WIZARD STEP 1 (INFO PT) === */}
              {step === 'kyb-1' && (
                  <div className="animate-in slide-in-from-right-8 duration-500">
                      <div className="flex gap-2 mb-8">
                          <div className="h-1.5 w-1/2 bg-brand-500 rounded-full"></div>
                          <div className="h-1.5 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                      </div>

                      <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-6"><Building2 size={24}/></div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Setup Profil Bisnis</h2>
                      <p className="text-slate-500 text-sm mb-8">Akun Anda baru. Silakan lengkapi data perusahaan untuk verifikasi Know Your Business (KYB).</p>

                      <div className="space-y-4">
                          <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Perusahaan (Sesuai NIB)</label><input type="text" placeholder="PT / CV Nama Perusahaan" className="w-full mt-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none dark:text-white focus:ring-2 focus:ring-brand-500" /></div>
                          <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipe Agensi</label><select className="w-full mt-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none dark:text-white"><option>Production House (PH)</option><option>Event Organizer (EO)</option><option>Brand / Corporate</option></select></div>
                          <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nomor Induk Berusaha (NIB)</label><input type="number" placeholder="13 Digit NIB" className="w-full mt-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none dark:text-white focus:ring-2 focus:ring-brand-500" /></div>
                      </div>

                      <button onClick={() => nextStep('kyb-2')} disabled={isLoading} className="w-full mt-8 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center justify-center">
                          {isLoading ? <Loader2 size={18} className="animate-spin"/> : <>Lanjut ke Dokumen Legal <ArrowRight size={18} className="ml-2"/></>}
                      </button>
                  </div>
              )}

              {/* === STATE 3: KYB WIZARD STEP 2 (DOKUMEN) === */}
              {step === 'kyb-2' && (
                  <div className="animate-in slide-in-from-right-8 duration-500">
                      <div className="flex gap-2 mb-8">
                          <div className="h-1.5 w-1/2 bg-brand-500 rounded-full"></div>
                          <div className="h-1.5 w-1/2 bg-brand-500 rounded-full"></div>
                      </div>

                      <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center mb-6"><FileText size={24}/></div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Upload Legalitas</h2>
                      <p className="text-slate-500 text-sm mb-8">Kami membutuhkan salinan dokumen ini untuk mengaktifkan fitur Kontrak SPK dan Escrow Keuangan.</p>

                      <div className="space-y-4">
                          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 text-center hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/10 cursor-pointer transition-colors">
                              <UploadCloud size={24} className="mx-auto text-brand-500 mb-2" />
                              <p className="font-bold text-sm text-slate-700 dark:text-slate-300">Scan KTP Direktur / PIC</p>
                              <p className="text-xs text-slate-500 mt-1">PDF atau JPG (Max 5MB)</p>
                          </div>
                          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 text-center hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/10 cursor-pointer transition-colors">
                              <UploadCloud size={24} className="mx-auto text-brand-500 mb-2" />
                              <p className="font-bold text-sm text-slate-700 dark:text-slate-300">Scan NPWP Perusahaan</p>
                              <p className="text-xs text-slate-500 mt-1">PDF atau JPG (Max 5MB)</p>
                          </div>
                      </div>

                      <button onClick={() => nextStep('pending')} disabled={isLoading} className="w-full mt-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center justify-center">
                          {isLoading ? <Loader2 size={18} className="animate-spin"/> : <>Kirim untuk Verifikasi <CheckCircle2 size={18} className="ml-2"/></>}
                      </button>
                      <button onClick={() => setStep('kyb-1')} className="w-full mt-3 py-3 text-slate-500 font-bold text-sm hover:underline">Kembali</button>
                  </div>
              )}

              {/* === STATE 4: PENDING APPROVAL === */}
              {step === 'pending' && (
                  <div className="animate-in zoom-in-95 duration-500 text-center">
                      <div className="w-24 h-24 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border-8 border-white dark:border-[#071122]">
                          <ShieldCheck size={40} className="animate-pulse" />
                      </div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4">Menunggu Verifikasi</h2>
                      <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                          Terima kasih! Tim legal Orland sedang memverifikasi NIB dan NPWP perusahaan Anda. Proses ini biasanya memakan waktu maksimal <strong>1x24 jam kerja</strong>.
                      </p>
                      
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-left flex items-start gap-3">
                          <div className="mt-0.5"><Clock className="text-slate-400" size={16}/></div>
                          <div>
                              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Status: In Review</p>
                              <p className="text-xs text-slate-500 mt-1">Kami akan mengirimkan notifikasi ke email Anda setelah dashboard B2B aktif.</p>
                          </div>
                      </div>

                      <button onClick={() => navigate('/dashboard')} className="w-full mt-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl shadow-lg hover:scale-105 transition-transform">
                          Masuk ke Mode Preview (Read-Only)
                      </button>
                  </div>
              )}

          </div>
      </div>

    </div>
  )
}
