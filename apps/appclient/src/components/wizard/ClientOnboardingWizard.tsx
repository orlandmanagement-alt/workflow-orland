import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, MapPin, ShieldCheck, UploadCloud, Users, CheckCircle2, ArrowRight, ArrowLeft, Loader2, Lock, FileText, Camera, Radio } from 'lucide-react';
import { useAuthStore } from '@/store/useAppStore'; // Assume it exists to update category
// Tambahkan baris ini:
import { api } from '@/lib/api';

interface OnboardingData {
  companyName: string;
  category: 'PH' | 'EO' | 'KOL' | 'BRAND' | '';
  website: string;
  employeesSize: string;
  
  address: string;
  city: string;
  postalCode: string;
  
  npwp: string;
  nib: string;
  kybFile: File | null;
  
  picName: string;
  picTitle: string;
  picPhone: string;
  picEmail: string;
}

export const ClientOnboardingWizard = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const setCategory = useAuthStore(state => state.login); // Assuming tricking to update state
  
  const [formData, setFormData] = useState<OnboardingData>({
    companyName: '', category: '', website: '', employeesSize: '',
    address: '', city: '', postalCode: '',
    npwp: '', nib: '', kybFile: null,
    picName: '', picTitle: '', picPhone: '', picEmail: ''
  });

  const STEPS_CONFIG = [
    { id: 1, title: 'Company Identity', icon: Building2 },
    { id: 2, title: 'HQ Location', icon: MapPin },
    { id: 3, title: 'Legal & KYB', icon: ShieldCheck },
    { id: 4, title: 'Person In Charge', icon: Users },
  ];

  const handleNext = async () => {
    setIsSaving(true);
    try {
      if (step === 4) {
        // Final Submission
        await api({
          url: '/clients/me',
          method: 'PUT',
          data: formData
        });
      }
      setStep(step + 1);
    } catch (error) {
      console.error("Gagal menyimpan data onboarding", error);
      alert("Terjadi kesalahan saat menyimpan data. Silakan coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // VALIDATION LOGIC PER STEP
  const isStepValid = () => {
    switch(step) {
      case 1: return formData.companyName.trim() !== '' && formData.category !== '';
      case 2: return formData.address.length > 5 && formData.city !== '';
      case 3: return formData.npwp.length > 5 && formData.nib.length > 5;
      case 4: return formData.picName !== '' && formData.picPhone !== '';
      default: return true;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#071122] w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] border border-slate-200 dark:border-slate-800 relative">
        
        {/* LEFT SIDEBAR: PROGRESS TRACKER */}
        <div className="w-full md:w-1/3 bg-slate-50 dark:bg-[#0a192f] p-8 md:p-12 border-r border-slate-200 dark:border-slate-800 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
          
          <div className="relative z-10 mb-12">
             <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-2">
                 B2B <span className="text-brand-500 font-light">Onboarding</span>
             </h2>
             <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Verifikasi perusahaan Anda untuk mulai membuat proyek.</p>
          </div>

          <div className="relative z-10 space-y-8 flex-1">
             {STEPS_CONFIG.map((s, idx) => {
                const isActive = step === s.id;
                const isPassed = step > s.id;
                return (
                  <div key={s.id} className="flex gap-4 items-start relative">
                    {/* Vertical Progress Line */}
                    {idx !== STEPS_CONFIG.length - 1 && (
                      <div className={`absolute top-10 left-[1.1rem] bottom-[-2rem] w-0.5 ${isPassed ? 'bg-brand-500 line-glow' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                    )}
                    
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 font-black transition-all duration-500 relative z-10 bg-white dark:bg-[#0a192f]
                       ${isActive ? 'border-brand-500 text-brand-600 dark:text-brand-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-110' 
                       : isPassed ? 'border-brand-500 bg-brand-500 text-white' 
                       : 'border-slate-300 dark:border-slate-700 text-slate-400'}
                    `}>
                       {isPassed ? <CheckCircle2 size={20} /> : <s.icon size={18} />}
                    </div>
                    <div className="mt-2 text-left">
                       <p className={`text-sm font-black uppercase tracking-wider ${isActive ? 'text-brand-600 dark:text-brand-400' : isPassed ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}>
                         {s.title}
                       </p>
                    </div>
                  </div>
                )
             })}
          </div>

          <div className="relative z-10 mt-auto pt-8 border-t border-slate-200 dark:border-slate-800/50 flex items-center gap-2 text-[10px] uppercase font-black text-slate-400 tracking-widest">
             <ShieldCheck size={16} className="text-brand-500" /> Secure SSL Server
          </div>
        </div>

        {/* RIGHT CONTENT: FORMS */}
        <div className="w-full md:w-2/3 p-8 md:p-12 flex flex-col relative text-left">
           
           <div className="flex-1">
             <AnimatePresence mode="wait">
               
               {/* STEP 1: COMPANY IDENTITY */}
               {step === 1 && (
                 <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="mb-8 items-start">
                       <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Siapa Anda?</h3>
                       <p className="text-slate-500">Pilih kategori layanan utama perusahaan Anda. Fitur Dashboard akan menyesuaikan kategori pilihan Anda.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                       {[
                         { id: 'PH', label: 'Production House', icon: Camera, desc: 'TVC, Film, Sinetron' },
                         { id: 'EO', label: 'Event Organizer', icon: Users, desc: 'Wedding, Seminar, Konser' },
                         { id: 'KOL', label: 'KOL Agency', icon: Radio, desc: 'Digital Marketing, TikTokers' },
                         { id: 'BRAND', label: 'Brand / Corporate', icon: Building2, desc: 'Direct Brand Casting' }
                       ].map(cat => (
                         <div 
                           key={cat.id} 
                           onClick={() => setFormData({...formData, category: cat.id as any})}
                           className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${formData.category === cat.id ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/10 shadow-lg' : 'border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-slate-500 bg-white dark:bg-[#121b2b]'}`}
                         >
                            <cat.icon size={28} className={formData.category === cat.id ? 'text-brand-500 mb-3' : 'text-slate-400 mb-3'} />
                            <h4 className={`font-black text-sm ${formData.category === cat.id ? 'text-brand-700 dark:text-brand-400' : 'text-slate-900 dark:text-white'}`}>{cat.label}</h4>
                            <p className="text-[10px] text-slate-500 font-bold mt-1">{cat.desc}</p>
                         </div>
                       ))}
                    </div>

                    <div className="space-y-4">
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Company Name</label>
                         <input type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} placeholder="PT Nusantara Berjaya" className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none" />
                       </div>
                    </div>
                 </motion.div>
               )}

               {/* STEP 2: HQ LOCATION */}
               {step === 2 && (
                 <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="mb-8">
                       <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Lokasi Operasional</h3>
                       <p className="text-slate-500">Alamat ini akan digunakan secara otomatis saat Anda mencetak Tagihan/Invoice digital.</p>
                    </div>

                    <div className="space-y-5">
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Headquarters Address</label>
                         <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Jl. Sudirman Kav 21, Gedung biru lantai 4..." rows={3} className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none" />
                       </div>
                       <div className="flex gap-4">
                         <div className="flex-1">
                           <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">City / Kota</label>
                           <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="Jakarta Selatan" className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white" />
                         </div>
                         <div className="w-1/3">
                           <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Zip Code</label>
                           <input type="text" value={formData.postalCode} onChange={e => setFormData({...formData, postalCode: e.target.value})} placeholder="12920" className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white font-mono" />
                         </div>
                       </div>
                    </div>
                 </motion.div>
               )}

               {/* STEP 3: LEGAL & KYB VERIFICATION */}
               {step === 3 && (
                 <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="mb-8">
                       <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                         <Lock className="text-amber-500" /> KYB Verification
                       </h3>
                       <p className="text-slate-500">Mencegah klien fiktif. Kami membutuhkan badan hukum sah Anda untuk melindungi ekosistem talent kami.</p>
                    </div>

                    <div className="space-y-5">
                       <div className="grid grid-cols-2 gap-4">
                         <div>
                           <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Nomor NPWP</label>
                           <input type="text" value={formData.npwp} onChange={e => setFormData({...formData, npwp: e.target.value})} placeholder="00.000.000.0-000.000" className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-black text-slate-900 dark:text-white font-mono" />
                         </div>
                         <div>
                           <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Nomor NIB / Izin Berusaha</label>
                           <input type="text" value={formData.nib} onChange={e => setFormData({...formData, nib: e.target.value})} placeholder="Masukkan NIB" className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-black text-slate-900 dark:text-white font-mono" />
                         </div>
                       </div>

                       <div className="mt-6">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block flex items-center gap-2">
                            <ShieldCheck size={14} className="text-brand-500" /> Upload Dokumen Legal (PDF/JPG)
                          </label>
                          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#071122] rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-colors group">
                              <UploadCloud size={48} className="text-slate-300 dark:text-slate-600 mb-4 group-hover:text-brand-500 transition-colors" />
                              <p className="text-sm font-black text-slate-900 dark:text-white">Drag & Drop file Anda ke sini</p>
                              <p className="text-xs text-slate-500 mt-2 max-w-xs">Scan SIUP, Akta Pendirian Perusahaan, atau Company Profile. Maksimal 10MB.</p>
                              <div className="mt-4 px-6 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-full text-xs font-bold shadow-md">Browser File</div>
                          </div>
                          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/50 p-3 rounded-lg mt-4 flex gap-3 items-start">
                             <Lock className="text-amber-600 mt-0.5" size={16} />
                             <p className="text-xs text-amber-800 dark:text-amber-400 font-medium leading-relaxed">Seluruh dokumen hukum Anda dienkripsi dengan standar bank (AES-256) dan tidak akan pernah dibagikan kepada Talent secara publik.</p>
                          </div>
                       </div>
                    </div>
                 </motion.div>
               )}

               {/* STEP 4: PIC & CONTACT */}
               {step === 4 && (
                 <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="mb-8">
                       <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Penanggung Jawab Proyek</h3>
                       <p className="text-slate-500">Individu yang akan secara legal menandatangani E-Signature kontrak atas nama perusahaan.</p>
                    </div>

                    <div className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                         <div>
                           <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">PIC Full Name</label>
                           <input type="text" value={formData.picName} onChange={e => setFormData({...formData, picName: e.target.value})} placeholder="John Doe" className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white" />
                         </div>
                         <div>
                           <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Job Position</label>
                           <input type="text" value={formData.picTitle} onChange={e => setFormData({...formData, picTitle: e.target.value})} placeholder="Casting Director" className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white" />
                         </div>
                       </div>
                       <div>
                           <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Direct WhatsApp Number</label>
                           <input type="tel" value={formData.picPhone} onChange={e => setFormData({...formData, picPhone: e.target.value})} placeholder="+62 8..." className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold font-mono text-slate-900 dark:text-white" />
                       </div>
                    </div>
                 </motion.div>
               )}

               {/* STEP 5: COMPLETION */}
               {step === 5 && (
                 <motion.div key="step5" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-green-100 dark:bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6 ring-8 ring-green-50 dark:ring-green-900/10">
                       <CheckCircle2 size={48} className="animate-[pulse_2s_ease-in-out_infinite]" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-3">Onboarding Berhasil Di-submit!</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8 font-medium">
                       Tim Kurator Orland (Admin) sedang meninjau dokumen legal Anda. Kabar baiknya, Anda <strong>sudah bisa mulai membuat draft casting/proyek</strong> sembari menunggu verifikasi centang biru di-approved!
                    </p>
                    <button 
                       onClick={() => {
                          // Simulate state updates to close modal and start dashboard
                          if(confirm('Arahkan ke Dasboard B2B...')) {
                             onClose();
                             window.location.reload(); 
                          }
                       }} 
                       className="px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-black shadow-xl shadow-brand-500/30 transition-transform hover:scale-105 uppercase tracking-widest text-sm"
                    >
                       Masuk ke Dashboard B2B
                    </button>
                 </motion.div>
               )}

             </AnimatePresence>
           </div>
           
           {/* BOTTOM ACTION BAR */}
           {step < 5 && (
             <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center relative z-10">
                {step > 1 ? (
                  <button onClick={handleBack} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2">
                     <ArrowLeft size={16}/> Kembali
                  </button>
                ) : <div></div>}

                <button 
                   onClick={handleNext} 
                   disabled={!isStepValid() || isSaving}
                   className="px-8 py-3 bg-brand-600 disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-800 hover:bg-brand-700 text-white rounded-xl font-black transition-all shadow-lg flex items-center gap-2 relative overflow-hidden group"
                >
                   {isSaving ? <Loader2 className="animate-spin" size={18} /> : (
                      <>
                        {step === 4 ? 'Submit Verification' : 'Save & Next'}
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </>
                   )}
                </button>
             </div>
           )}

        </div>

      </div>
    </div>
  );
};
