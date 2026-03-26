import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useProfileDraftStore } from '../../store/useAppStore';
import { User, Ruler, DollarSign, CheckCircle2, ArrowRight, ArrowLeft, Save, Loader2 } from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Biodata Utama', icon: User },
  { id: 2, title: 'Fisik & Ukuran', icon: Ruler },
  { id: 3, title: 'Rate Card', icon: DollarSign },
];

export default function ProfileBuilder() {
  const { draftData, updateDraft, clearDraft } = useProfileDraftStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inisialisasi form dengan data draf (jika ada)
  const { register, handleSubmit, watch } = useForm({
    defaultValues: draftData
  });

  // Pantau setiap ketikan untuk disimpan ke draf (Opsional, tapi kita simpan per step saja agar lebih efisien)
  const formValues = watch();

  const handleNextStep = () => {
    updateDraft(formValues); // Simpan draf ke memori HP
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePrevStep = () => {
    updateDraft(formValues); // Simpan draf sebelum mundur
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmitFinal = async (data: any) => {
    updateDraft(data);
    setIsSubmitting(true);
    
    // SIMULASI API CALL ke /api/v1/talents/{id}
    setTimeout(() => {
      console.log('Data terkirim ke server:', data);
      setIsSubmitting(false);
      clearDraft(); // Bersihkan draf setelah sukses
      alert('Berhasil! Comp Card Pro Anda sudah diperbarui.');
      setCurrentStep(1);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Comp Card Builder</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Lengkapi profil Anda secara bertahap. Data Anda otomatis tersimpan di perangkat ini.</p>
      </div>

      {/* PROGRESS BAR & STEP INDICATOR */}
      <div className="mb-10 relative">
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-slate-200 dark:bg-slate-700">
          <div style={{ width: `${(currentStep / 3) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-brand-500 transition-all duration-500 ease-in-out"></div>
        </div>
        <div className="flex justify-between">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex flex-col items-center relative z-10">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors duration-300 border-2 ${
                  isActive ? 'bg-brand-600 border-brand-600 text-white shadow-lg shadow-brand-500/30' : 
                  isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                  'bg-white dark:bg-dark-card border-slate-300 dark:border-slate-600 text-slate-400'
                }`}>
                  {isCompleted ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                </div>
                <span className={`text-xs font-semibold mt-2 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500'}`}>{step.title}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* FORM AREA */}
      <div className="bg-white dark:bg-dark-card rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-10 transition-all">
        <form onSubmit={handleSubmit(currentStep === 3 ? onSubmitFinal : handleNextStep)}>
          
          {/* STEP 1: BIODATA */}
          <div className={currentStep === 1 ? 'block animate-fade-in' : 'hidden'}>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Informasi Dasar</h2>
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Panggung / Profesional</label>
                  <input {...register('stage_name', { required: true })} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all" placeholder="Contoh: John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kategori Utama</label>
                  <select {...register('category')} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all">
                    <option value="actor">Aktor / Aktris</option>
                    <option value="model">Model Commercial</option>
                    <option value="mc">MC / Host</option>
                    <option value="extras">Extras / Figuran</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bio Singkat (Headline)</label>
                <textarea {...register('bio')} rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all" placeholder="Ceritakan keahlian dan pengalaman terbaikmu secara singkat..."></textarea>
              </div>
            </div>
          </div>

          {/* STEP 2: FISIK */}
          <div className={currentStep === 2 ? 'block animate-fade-in' : 'hidden'}>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Atribut Fisik (Untuk Wardrobe)</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tinggi (cm)</label>
                <input type="number" {...register('height')} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white outline-none" placeholder="170" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Berat (kg)</label>
                <input type="number" {...register('weight')} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white outline-none" placeholder="60" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Baju</label>
                <select {...register('shirt_size')} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white outline-none">
                  <option value="S">S</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sepatu</label>
                <input type="number" {...register('shoe_size')} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white outline-none" placeholder="42" />
              </div>
            </div>
          </div>

          {/* STEP 3: RATE CARD */}
          <div className={currentStep === 3 ? 'block animate-fade-in' : 'hidden'}>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Rate Card & Penawaran</h2>
            <div className="p-4 bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 rounded-2xl mb-6">
                <p className="text-sm text-brand-700 dark:text-brand-300">Data ini hanya bisa dilihat oleh Admin Agensi dan Klien Terverifikasi. Gunakan nominal dasar per hari (Daily Rate).</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Base Rate (Rp) / Hari</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-slate-500 font-semibold">Rp</span>
                </div>
                <input type="number" {...register('base_rate')} className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-lg font-bold focus:ring-2 focus:ring-brand-500 outline-none transition-all" placeholder="1.500.000" />
              </div>
            </div>
          </div>

          {/* NAVIGATION BUTTONS */}
          <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button type="button" onClick={handlePrevStep} disabled={currentStep === 1 || isSubmitting} className="flex items-center px-6 py-3 rounded-xl text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors">
              <ArrowLeft size={18} className="mr-2" /> Kembali
            </button>
            
            {currentStep < 3 ? (
              <button type="submit" className="flex items-center px-8 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-md hover:scale-105 transition-transform">
                Lanjut <ArrowRight size={18} className="ml-2" />
              </button>
            ) : (
              <button type="submit" disabled={isSubmitting} className="flex items-center px-8 py-3 rounded-xl bg-brand-600 text-white font-bold shadow-lg shadow-brand-500/30 hover:bg-brand-700 disabled:opacity-70 transition-all">
                {isSubmitting ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                Simpan & Publish
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
