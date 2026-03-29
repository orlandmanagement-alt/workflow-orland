import { motion } from 'framer-motion';
import { useProjectDraftStore } from '@/store/useProjectDraftStore';
import { useAuthStore } from '@/store/useAppStore';
import { ArrowLeft, ArrowRight, Calendar, MapPin, Hash, Target, Sparkles, Image } from 'lucide-react';

export const StepLogistics = () => {
  const { category_specific_data, updateCategoryData, setStep } = useProjectDraftStore();
  const companyCategory = useAuthStore(state => state.companyCategory);

  const renderDynamicFields = () => {
    switch (companyCategory) {
      case 'PH':
        return (
          <>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tanggal Shooting (Masa Kerja) *</label>
              <div className="relative">
                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Misal: 10 Mei 2026 - 15 Mei 2026"
                  value={category_specific_data.shooting_dates || ''}
                  onChange={e => updateCategoryData({ shooting_dates: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-brand-500/20 outline-none text-sm dark:bg-slate-800/50 dark:border-slate-700 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Lokasi Utama Casting/Shooting</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Wilayah, Kota, atau Studio spesifik"
                  value={category_specific_data.location || ''}
                  onChange={e => updateCategoryData({ location: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-brand-500/20 outline-none text-sm dark:bg-slate-800/50 dark:border-slate-700 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Moodboard Reference (Opsional)</label>
              <div className="relative">
                <Image size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="url" 
                  placeholder="https://pinterest.com/pin/..."
                  value={category_specific_data.moodboard_url || ''}
                  onChange={e => updateCategoryData({ moodboard_url: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-brand-500/20 outline-none text-sm dark:bg-slate-800/50 dark:border-slate-700 dark:text-white"
                />
              </div>
            </div>
          </>
        );

      case 'EO':
        return (
          <>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tanggal Event Utama *</label>
              <div className="relative">
                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Misal: 20 Juni 2026"
                  value={category_specific_data.event_dates || ''}
                  onChange={e => updateCategoryData({ event_dates: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 outline-none text-sm dark:bg-slate-800/50 dark:border-slate-700"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Dress Code / Uniform</label>
              <div className="relative">
                <Sparkles size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Misal: Kemeja Hitam Celana Bahan, atau Disediakan Klien"
                  value={category_specific_data.dress_code || ''}
                  onChange={e => updateCategoryData({ dress_code: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 outline-none text-sm dark:bg-slate-800/50 dark:border-slate-700"
                />
              </div>
            </div>
          </>
        );

      case 'KOL':
      case 'BRAND':
        return (
          <>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Target Platform</label>
              <div className="relative">
                <Target size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Instagram Reels, TikTok, YouTube Shorts"
                  value={category_specific_data.target_platform || ''}
                  onChange={e => updateCategoryData({ target_platform: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none text-sm dark:bg-slate-800/50 dark:border-slate-700"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Campaign Hashtags</label>
              <div className="relative">
                <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="#OrlandSuperPromo #BrandTerbaik"
                  value={category_specific_data.hashtags || ''}
                  onChange={e => updateCategoryData({ hashtags: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none text-sm dark:bg-slate-800/50 dark:border-slate-700"
                />
              </div>
            </div>
          </>
        );

      default:
        return <p className="text-slate-500">Kategori belum dipilih. Lengkapi profil Anda.</p>;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Project Logistics</h2>
        <p className="text-slate-500 dark:text-slate-400">Detail spesifik berdasarkan jenis industri perusahaan Anda.</p>
      </div>

      <div className="space-y-6 bg-white dark:bg-dark-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
        {renderDynamicFields()}
      </div>

      <div className="flex justify-between pt-4">
        <button 
          onClick={() => setStep(1)}
          className="px-6 py-4 bg-transparent border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
        >
          <ArrowLeft size={20} /> Kembali
        </button>
        
        {/* Disabling omitted for mock speed, users can proceed */}
        <button 
          onClick={() => setStep(3)}
          className="px-8 py-4 bg-brand-600 text-white font-extrabold rounded-2xl shadow-xl shadow-brand-500/30 hover:bg-brand-700 transition-all flex items-center gap-2 group"
        >
          Next: Kebutuhan Talent <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
};
