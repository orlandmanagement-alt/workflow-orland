import { useState } from 'react';
import { X, Loader2, Link as LinkIcon, FileText } from 'lucide-react';
import { Project } from '@/types/project.types';
import { applicationsService } from '@/lib/services/applicationsService';

interface ApplyModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ApplyModal = ({ project, isOpen, onClose, onSuccess }: ApplyModalProps) => {
  const [selectedRole, setSelectedRole] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      setError('Pilih role/karakter terlebih dahulu');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await applicationsService.applyForProject({
        projectId: project.id,
        roleId: selectedRole,
        coverLetter,
        mediaUrl
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim lamaran.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-dark-card w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Lamar Proyek</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{project.title}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm break-words">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Pilih Role / Karakter *</label>
              <div className="grid gap-2">
                {project.roles?.map(role => (
                  <label key={role.id} className={`flex items-start p-3 border rounded-xl cursor-pointer transition-colors ${selectedRole === role.id ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/10' : 'border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-slate-600'}`}>
                    <input 
                      type="radio" 
                      name="role" 
                      value={role.id} 
                      checked={selectedRole === role.id}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="mt-1 accent-brand-600"
                    />
                    <div className="ml-3">
                      <span className="block font-semibold text-slate-900 dark:text-white text-sm">{role.name}</span>
                      <span className="block text-xs text-slate-500 mt-0.5">{role.gender} • Usia {role.ageRange?.min}-{role.ageRange?.max}th</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Cover Letter (Opsional)</label>
              <div className="relative">
                <FileText size={16} className="absolute top-3 left-3 text-slate-400" />
                <textarea 
                  rows={3}
                  value={coverLetter}
                  onChange={e => setCoverLetter(e.target.value)}
                  placeholder="Mengapa Anda cocok untuk peran ini?"
                  className="w-full pl-10 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all dark:text-white resize-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Link Self-Tape / Video (Opsional)</label>
              <div className="relative">
                <LinkIcon size={16} className="absolute top-[14px] left-3 text-slate-400" />
                <input 
                  type="url"
                  value={mediaUrl}
                  onChange={e => setMediaUrl(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="w-full pl-10 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all dark:text-white"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <><Loader2 size={18} className="animate-spin mr-2" /> Mengirim...</> : 'Kirim Lamaran'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
