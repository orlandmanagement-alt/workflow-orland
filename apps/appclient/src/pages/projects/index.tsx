import { useState } from 'react';
import { Briefcase, LayoutGrid, KanbanSquare, Plus, MoreHorizontal, Users, Wallet } from 'lucide-react';

// Simulasi Database Proyek Klien
const MOCK_PROJECTS = [
  { id: 'PRJ-001', title: 'TVC Ramadhan Glow Soap', type: 'Commercial', status: 'Produksi', budget: 'Rp 250 Jt', booked: 8, image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=400' },
  { id: 'PRJ-002', title: 'Film Action "Garuda"', type: 'Movie', status: 'Casting', budget: 'Rp 1.2 M', booked: 12, image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=400' },
  { id: 'PRJ-003', title: 'Launching Product X', type: 'Event', status: 'Draft', budget: 'Rp 75 Jt', booked: 0, image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=400' },
  { id: 'PRJ-004', title: 'KOL Tiktok Skincare', type: 'Influencer', status: 'Selesai', budget: 'Rp 30 Jt', booked: 3, image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=400' },
];

const COLUMNS = ['Draft', 'Casting', 'Produksi', 'Selesai'];

export default function ProjectsHub() {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

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
      {/* VIEW 1: KANBAN BOARD (ENTERPRISE STYLE)   */}
      {/* ========================================= */}
      {viewMode === 'kanban' && (
        <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            {COLUMNS.map(columnName => {
                const columnProjects = MOCK_PROJECTS.filter(p => p.status === columnName);
                
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
      {viewMode === 'list' && (
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
                        {MOCK_PROJECTS.map((project) => (
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
