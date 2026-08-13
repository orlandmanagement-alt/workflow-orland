import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Search, Filter } from 'lucide-react';
import { projectService } from '@/lib/services/projectService';
import { ProjectCard } from '@/components/jobs/ProjectCard';
import { Project } from '@/types/project.types';

export default function JobBoard() {
  const [search, setSearch] = useState('');

  const { data: projects, isLoading, isError } = useQuery({
    queryKey: ['available-projects'],
    queryFn: projectService.getAvailableProjects,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="animate-spin text-brand-600 mb-4" size={48} />
        <p className="text-slate-500 font-medium animate-pulse">Memuat Open Casting...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-10 text-center bg-red-50 text-red-600 rounded-3xl mt-10">
        Gagal memuat daftar proyek. Silakan coba lagi.
      </div>
    );
  }

  const projectList: Project[] = Array.isArray(projects) ? projects : [];
  const filteredProjects = projectList.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.clientName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="bg-gradient-to-br from-brand-600 to-purple-700 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold mb-2 text-shadow-sm">Cari Proyek & Casting</h1>
          <p className="text-brand-100 max-w-lg text-sm mb-6">Jelajahi berbagai proyek film, iklan, dan pemotretan yang sesuai dengan profil Anda.</p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Cari judul proyek, klien..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl text-slate-900 bg-white placeholder-slate-400 focus:ring-4 focus:ring-white/20 outline-none transition-all shadow-lg"
              />
            </div>
            <button className="px-6 py-3.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
              <Filter size={18} /> <span className="sm:hidden">Filter</span>
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Open Casting ({filteredProjects.length})</h2>
          <select className="bg-transparent text-sm font-semibold text-slate-600 dark:text-slate-400 outline-none cursor-pointer">
            <option>Paling Relevan (Match Score)</option>
            <option>Terbaru</option>
            <option>Bayaran Tertinggi</option>
          </select>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-slate-800">
            <p className="text-slate-500">Tidak ada proyek yang sesuai dengan pencarian Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
