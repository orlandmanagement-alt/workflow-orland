import { Briefcase, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/lib/services/projectService';
import { Link } from 'react-router-dom';

export default function Projects() {
  const { data: projects, isLoading, isError } = useQuery({
    queryKey: ['my-projects'],
    queryFn: projectService.getProjects,
  });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-600" size={40} /></div>;
  if (isError) return <div className="p-10 text-center text-red-500">Gagal memuat daftar proyek. (API belum siap)</div>;

  const projectList = Array.isArray(projects) ? projects : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Proyek Aktif</h1>
      
      {projectList.length === 0 ? (
        <div className="bg-white dark:bg-dark-card p-10 rounded-3xl border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center shadow-sm">
            <AlertCircle size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Belum ada proyek aktif</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 max-w-sm">Anda belum tergabung dalam proyek apapun. Silakan cari casting AI dan mulai melamar!</p>
            <Link to="/jobs/match" className="mt-6 px-6 py-2.5 bg-brand-600 text-white font-bold rounded-xl text-sm hover:bg-brand-700 shadow-lg shadow-brand-500/30 transition-colors">Cari Casting via AI</Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {projectList.map((proj: any) => (
            <div key={proj.id} className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-brand-300 dark:hover:border-brand-500 transition-colors group">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 gap-3">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{proj.title || 'Proyek Tanpa Judul'}</h3>
                  <span className="bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-800 text-xs font-bold px-3 py-1 rounded-full w-fit">{proj.status || 'Menunggu'}</span>
              </div>
              <div className="space-y-3">
                  <p className="flex items-center text-sm text-slate-600 dark:text-slate-400"><MapPin size={16} className="mr-3 text-slate-400 dark:text-slate-500" /> {proj.location || 'Lokasi belum ditentukan'}</p>
                  <p className="flex items-center text-sm text-slate-600 dark:text-slate-400"><Briefcase size={16} className="mr-3 text-slate-400 dark:text-slate-500" /> Klien: <span className="font-semibold ml-1 text-slate-800 dark:text-slate-300">{proj.client_name || '-'}</span></p>
              </div>
              <Link to={`/projects/${proj.id}`} className="mt-6 w-full flex justify-center py-2.5 bg-slate-900 dark:bg-brand-600 text-white font-bold rounded-xl text-sm hover:scale-[1.02] shadow-md transition-transform">
                Masuk ke Green Room (Detail)
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
