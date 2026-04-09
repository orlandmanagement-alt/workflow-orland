import { useState, useEffect } from 'react';
import { Briefcase, LayoutGrid, KanbanSquare, Plus, MoreHorizontal, Users, Wallet, AlertTriangle } from 'lucide-react';
import { projectService } from '@/lib/services/projectService';

// Status grouping for Kanban
const COLUMNS = ['Draft', 'Casting', 'Produksi', 'Selesai'];

const STATUS_MAP: Record<string, 'draft' | 'casting' | 'production' | 'done'> = {
  'Draft': 'draft',
  'Casting': 'casting',
  'Produksi': 'production',
  'Selesai': 'done'
};

export default function ProjectsHub() {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const data = await projectService.getMyProjects();
        setProjects(data);
      } catch (err: any) {
        console.error('Failed to fetch projects:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      
      {/* HEADER & VIEW TOGGLE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center tracking-tight">
                <Briefcase className="mr-3 text-brand-500" size={32}/> Project Hub
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kelola semua *campaign*, *casting*, dan produksi Anda di satu tempat.</p>
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
            {/* View Toggle */}
            <div className="bg-slate-200/50 dark:bg-slate-800 p-1.5 rounded-xl flex items-center border border-slate-200 dark:border-slate-700">
                <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <KanbanSquare size={20} />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <LayoutGrid size={20} />
                </button>
            </div>
            {/* Create Button */}
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold px-6 py-2.5 rounded-xl shadow-lg hover:scale-105 transition-transform">
                <Plus size={18} /> Buat Project
            </button>
        </div>
      </div>

      {/* ========================================= */}
      {/* ERROR ALERT */}
      {/* ========================================= */}
      {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-red-100 dark:bg-red-800 rounded-full text-red-600 dark:text-red-300 shrink-0"><AlertTriangle size={20} /></div>
                  <div>
                      <h3 className="font-bold text-red-900 dark:text-red-400">Gagal Memuat Proyek</h3>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-0.5">{error}</p>
                  </div>
              </div>
              <button onClick={() => window.location.reload()} className="w-full sm:w-auto whitespace-nowrap px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-colors">
                  Coba Lagi
              </button>
          </div>
      )}

      {/* ========================================= */}
      {/* VIEW 1: KANBAN BOARD (ENTERPRISE STYLE)   */}
      {/* ========================================= */}
      {viewMode === 'kanban' && !error && (
        <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            {COLUMNS.map(columnName => {
                // Filter projects by status
                const columnProjects = projects.filter(p => {
                  // Normalize project status to compare with column name
                  const projectStatus = p.status_display || p.status;
                  return projectStatus === columnName;
                });
                
                return (
                    <div key={columnName} className="min-w-[300px] sm:min-w-[340px] flex-shrink-0 snap-center flex flex-col h-full bg-slate-100/50 dark:bg-slate-800/20 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-700/50">
                        {/* Column Header */}
                        <div className="flex justify-between items-center mb-4 px-2">
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest text-xs flex items-center">
                                {columnName} <span className="ml-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">{columnProjects.length}</span>
                            </h3>
                            <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={18}/></button>
                        </div>

                        {/* Column Cards */}
                        <div className="space-y-4">
                            {columnProjects.length === 0 ? (
                                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center text-slate-400 text-sm font-medium">
                                    Tarik project ke sini
                                </div>
                            ) : (
                                columnProjects.map(project => (
                                    <div key={project.id} className="bg-white dark:bg-dark-card rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-500 cursor-grab active:cursor-grabbing transition-colors group">
                                        <div className="relative h-32 w-full rounded-xl overflow-hidden mb-3">
                                            <img src={project.image} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">{project.type}</div>
                                        </div>
                                        <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-1">{project.title}</h4>
                                        <p className="text-xs font-mono text-slate-400 mb-4">{project.id}</p>
                                        
                                        <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800/60">
                                            <div className="flex items-center text-xs font-bold text-slate-600 dark:text-slate-400"><Wallet size={14} className="mr-1.5 text-green-500"/> {project.budget}</div>
                                            <div className="flex items-center text-xs font-bold text-slate-600 dark:text-slate-400"><Users size={14} className="mr-1.5 text-blue-500"/> {project.booked} Talent</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
      )}

      {/* ========================================= */}
      {/* VIEW 2: LIST VIEW (DATA TABLE)            */}
      {/* ========================================= */}
      {viewMode === 'list' && !error && (
        <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                            <th className="p-5 pl-6">Nama Project</th>
                            <th className="p-5">Fase Status</th>
                            <th className="p-5">Anggaran (Budget)</th>
                            <th className="p-5">Talent Booked</th>
                            <th className="p-5"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {projects.map((project) => (
                            <tr key={project.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="p-5 pl-6 flex items-center gap-4">
                                    <img src={project.image} alt="thumb" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">{project.title}</p>
                                        <p className="text-xs text-slate-500 font-mono">{project.id} • {project.type}</p>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${project.status === 'Selesai' ? 'bg-green-100 text-green-700' : project.status === 'Produksi' ? 'bg-blue-100 text-blue-700' : project.status === 'Casting' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                                        {project.status}
                                    </span>
                                </td>
                                <td className="p-5 font-bold text-slate-700 dark:text-slate-300">{project.budget}</td>
                                <td className="p-5">
                                    <div className="flex items-center gap-2">
                                        <Users size={16} className="text-slate-400"/> 
                                        <span className="font-bold dark:text-white">{project.booked}</span> <span className="text-xs text-slate-500">orang</span>
                                    </div>
                                </td>
                                <td className="p-5 text-right">
                                    <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Kelola</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

    </div>
  )
}
