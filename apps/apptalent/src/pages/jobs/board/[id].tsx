import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, MapPin, Calendar, DollarSign, Loader2, 
  AlertTriangle, ShieldAlert, CheckCircle2 
} from 'lucide-react';
import { projectService } from '@/lib/services/projectService';
import { ApplyModal } from '@/components/jobs/ApplyModal';
import { useProfileProgress } from '@/hooks/useProfileProgress';
import { Project } from '@/types/project.types';

export default function JobDetail() {
  const { id } = useParams();
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  
// Gatekeeper state
  const profileProgress = useProfileProgress();
  // Perbaikan tipe data: Ambil angka percentage dari dalam object
  const progressValue = typeof profileProgress === 'number' ? profileProgress : (profileProgress as any).percentage || 0;
  const canApply = progressValue >= 70;

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ['available-project', id],
    queryFn: () => projectService.getProjectById(id as string),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-brand-600" size={48} /></div>;
  }

  if (isError || !project) {
    return <div className="p-10 text-center text-red-500 font-bold mt-10">Gagal memuat detail proyek casting.</div>;
  }

  // Casting data type as Project for mockup
  const p: Project = project as any; 

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <Link to="/jobs/board" className="inline-flex items-center text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-brand-600 transition-colors">
        <ArrowLeft size={16} className="mr-1" /> Kembali ke Job Board
      </Link>

      <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {p.moodboardUrl ? (
          <div className="h-64 sm:h-80 relative">
            <img src={p.moodboardUrl} alt={p.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <span className="bg-brand-500 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3 inline-block shadow-lg">Open Casting</span>
              <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">{p.title || 'Judul Proyek Memuat...'}</h1>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-10 pb-0">
             <span className="bg-brand-100 text-brand-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3 inline-block">Open Casting</span>
             <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight mb-6">{p.title || 'Judul Proyek Memuat...'}</h1>
          </div>
        )}

        <div className="p-6 sm:p-10 border-b border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">Klien/PH</p>
              <p className="font-bold text-slate-900 dark:text-white">{p.clientName || 'TBA'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">Shooting Dates</p>
              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5"><Calendar size={16} className="text-brand-500"/> {p.shootingDates?.start || 'TBA'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">Lokasi</p>
              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5"><MapPin size={16} className="text-brand-500"/> TBA (Jabodetabek)</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">Bayaran</p>
              <p className="font-bold text-green-600 dark:text-green-400 flex items-center gap-1.5"><DollarSign size={16}/> {p.payment?.currency || 'IDR'} {p.payment?.amount?.toLocaleString() || '-'}</p>
            </div>
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Deskripsi Proyek</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm md:text-base">
              {p.description || 'Deskripsi proyek belum tersedia.'}
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-10 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Roles / Karakter Dibutuhkan</h3>
              <p className="text-sm text-slate-500">Pilih salah satu karakter di bawah saat melamar.</p>
            </div>
            
            {hasApplied ? (
              <div className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-6 py-3 rounded-xl font-bold flex items-center gap-2 border border-green-200 dark:border-green-800/50">
                <CheckCircle2 size={20} /> Lamaran Terkirim
              </div>
            ) : (
              <div className="flex flex-col items-end group relative cursor-not-allowed">
                <button 
                  onClick={() => setIsApplyModalOpen(true)}
                  disabled={!canApply}
                  className="px-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold rounded-xl shadow-xl shadow-brand-500/20 transition-all disabled:opacity-50 disabled:bg-slate-400 disabled:shadow-none peer"
                >
                  Lamar Proyek Ini
                </button>
                {/* Gatekeeper Tooltip */}
                {!canApply && (
                  <div className="absolute top-16 right-0 w-64 p-3 bg-red-600 text-white text-xs font-bold rounded-xl shadow-2xl opacity-0 peer-hover:opacity-100 transition-opacity pointer-events-none flex items-start gap-2 z-10">
                    <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                    Lengkapi profil Anda minimal 70% untuk dapat melamar. (Saat ini: {progressValue}%)
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {p.roles?.map(role => (
              <div key={role.id} className="bg-white dark:bg-dark-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-lg">{role.name}</h4>
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold px-2 py-1 rounded-md">{role.gender} • {role.ageRange?.min}-{role.ageRange?.max}th</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{role.description}</p>
                {role.requirements && role.requirements.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Kriteria Khusus:</span>
                    <ul className="list-disc pl-4 space-y-1">
                      {role.requirements.map((req, i) => (
                        <li key={i} className="text-xs text-slate-600 dark:text-slate-400">{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <ApplyModal 
        project={p}
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSuccess={() => setHasApplied(true)}
      />
    </div>
  );
}
