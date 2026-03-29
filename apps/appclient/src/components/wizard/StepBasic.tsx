import { motion } from 'framer-motion';
import { useProjectDraftStore } from '@/store/useProjectDraftStore';
import { Globe, Lock, ArrowRight } from 'lucide-react';

export const StepBasic = () => {
  const { title, description, visibility, updateDraft, setStep } = useProjectDraftStore();

  const isFormValid = title.trim().length > 3 && description.trim().length > 10;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">The Blueprint</h2>
        <p className="text-slate-500 dark:text-slate-400">Mari mulai dengan fondasi utama proyek Anda.</p>
      </div>

      <div className="space-y-6 bg-white dark:bg-dark-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
        
        {/* Project Name */}
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Judul Proyek *</label>
          <input 
            type="text"
            value={title}
            onChange={(e) => updateDraft({ title: e.target.value })}
            placeholder="Ketik judul proyek casting..."
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-lg font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-brand-500/20 outline-none transition-all placeholder-slate-400"
          />
        </div>

        {/* Project Description */}
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Deskripsi Proyek *</label>
          <textarea 
            rows={4}
            value={description}
            onChange={(e) => updateDraft({ description: e.target.value })}
            placeholder="Jelaskan kebutuhan casting, target penonton, atau detail sinopsis.."
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-4 focus:ring-brand-500/20 outline-none transition-all resize-none placeholder-slate-400 leading-relaxed"
          />
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Tingkat Visibilitas</label>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => updateDraft({ visibility: 'public' })}
              className={`p-4 rounded-2xl border text-left transition-all ${visibility === 'public' ? 'bg-brand-50 border-brand-500 shadow-md dark:bg-brand-900/20' : 'bg-transparent border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
            >
              <Globe size={24} className={visibility === 'public' ? 'text-brand-600' : 'text-slate-400'} />
              <h4 className={`font-bold mt-3 ${visibility === 'public' ? 'text-brand-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>Public Casting</h4>
              <p className="text-xs text-slate-500 mt-1">Semua talent bisa melamar proyek ini.</p>
            </button>

            <button 
              onClick={() => updateDraft({ visibility: 'private' })}
              className={`p-4 rounded-2xl border text-left transition-all ${visibility === 'private' ? 'bg-slate-900 border-slate-900 shadow-md dark:bg-slate-800' : 'bg-transparent border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
            >
              <Lock size={24} className={visibility === 'private' ? 'text-white' : 'text-slate-400'} />
              <h4 className={`font-bold mt-3 ${visibility === 'private' ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>Private Invite</h4>
              <p className={`text-xs mt-1 ${visibility === 'private' ? 'text-slate-300' : 'text-slate-500'}`}>Hanya talent yang diundang yang bisa melihat.</p>
            </button>
          </div>
        </div>

      </div>

      <div className="flex justify-end pt-4">
        <button 
          onClick={() => setStep(2)}
          disabled={!isFormValid}
          className="px-8 py-4 bg-brand-600 text-white font-extrabold rounded-2xl shadow-xl shadow-brand-500/30 hover:bg-brand-700 transition-all flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: Detail Spesifik <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
};
