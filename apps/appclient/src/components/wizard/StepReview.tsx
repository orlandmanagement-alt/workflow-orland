import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useProjectDraftStore } from '@/store/useProjectDraftStore';
import { projectService } from '@/lib/services/projectService';
import { ArrowLeft, Rocket, Info, CheckCircle2, Loader2, DollarSign } from 'lucide-react';

export const StepReview = () => {
  const navigate = useNavigate();
  const draft = useProjectDraftStore();
  const { roles, updateRole, setStep, resetDraft } = draft;
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Auto calculate total
  const estimatedTotal = useMemo(() => {
    return roles.reduce((total, role) => total + (role.budget * role.quantity), 0);
  }, [roles]);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await projectService.createProject(draft);
      setIsSuccess(true);
      setTimeout(() => {
        resetDraft();
        navigate('/dashboard/projects');
      }, 2000);
    } catch (error) {
      alert("Gagal mempublikasikan proyek. Silakan coba lagi.");
      setIsPublishing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in duration-500">
        <CheckCircle2 size={80} className="text-green-500 mb-6 drop-shadow-2xl" />
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Proyek Mengudara!</h2>
        <p className="text-slate-500 dark:text-slate-400">Notifikasi Open Casting telah dikirimkan ke Talent yang relevan.</p>
        <p className="text-xs text-brand-600 font-bold mt-4 animate-pulse">Mengalihkan ke Dashboard Proyek...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-3xl mx-auto space-y-8 pb-10"
    >
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Final Review & Budgeting</h2>
        <p className="text-slate-500 dark:text-slate-400">Tentukan estimasi fee per-talent dan rilis proyek Anda ke publik.</p>
      </div>

      <div className="bg-white dark:bg-dark-card p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">PROJECT BLUEPRINT</h3>
          <h4 className="text-2xl font-black text-slate-900 dark:text-white">{draft.title}</h4>
          <span className="inline-block mt-2 text-xs font-bold px-3 py-1 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400 rounded-full border border-brand-200 dark:border-brand-800/50">
            {draft.visibility === 'public' ? 'Public Open Casting' : 'Private Direct Invite'}
          </span>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">ALLOCATION & FEE (PER 1 ORANG)</h3>
          <div className="space-y-4">
            {roles.map((role) => (
              <div key={role.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-2xl gap-4">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded-md">x{role.quantity}</span>
                    {role.role_name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">Estimasi Total Payout untuk role ini: Rp {(role.budget * role.quantity).toLocaleString()}</p>
                </div>
                
                <div className="relative w-full md:w-64 flex-shrink-0">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign size={16} className="text-slate-400 dark:text-slate-500" />
                  </div>
                  <input 
                    type="number" 
                    placeholder="Fee per orang"
                    value={role.budget === 0 ? '' : role.budget}
                    onChange={(e) => updateRole(role.id, { budget: parseInt(e.target.value) || 0 })}
                    className="w-full pl-10 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none transition-all dark:text-white"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-xs font-bold text-slate-400">/ Orang</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-2 text-slate-500">
            <Info size={16} className="text-brand-500 flex-shrink-0 mt-1" />
            <p className="text-xs max-w-sm">Dana fee belum akan dipotong sampai Anda dan Klien terikat kontrak digital secara resmi di Fase Operations.</p>
          </div>
          <div className="text-right w-full md:w-auto">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">TOTAL ESTIMASI BUDGET</h4>
            <p className="text-3xl font-black text-green-600 dark:text-green-400">Rp {estimatedTotal.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <button 
          onClick={() => setStep(3)}
          className="px-6 py-4 bg-transparent border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
        >
          <ArrowLeft size={20} /> Edit Role
        </button>
        <button 
          onClick={handlePublish}
          disabled={isPublishing}
          className="px-8 py-5 flex-1 md:flex-none bg-gradient-to-r from-brand-600 to-purple-600 text-white font-extrabold text-lg rounded-2xl shadow-xl shadow-brand-500/40 hover:scale-105 transition-all flex justify-center items-center gap-2 active:scale-95 disabled:scale-100 disabled:opacity-50"
        >
          {isPublishing ? <><Loader2 size={24} className="animate-spin" /> Mengunggah...</> : <><Rocket size={24} /> Publish & Open Casting</>}
        </button>
      </div>
    </motion.div>
  );
};
