import React, { useState, useEffect } from 'react';
import { Gavel, AlertOctagon, CheckCircle2, ChevronRight, MessageSquare, ShieldAlert, FileText, Loader2, RefreshCw, Activity, Ban } from 'lucide-react';
import { api } from '@/lib/api';

interface ProjectOverwatch {
  id: string;
  title: string;
  client_id?: string;
  clientName: string;
  talentName: string;
  total_budget: number;
  status: 'draft' | 'active' | 'completed' | 'disputed' | 'cancelled';
  disputeReason?: string;
}

export default function ProjectOverwatch() {
  const [projects, setProjects] = useState<ProjectOverwatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'disputed'>('all');
  const [activeDispute, setActiveDispute] = useState<ProjectOverwatch | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProjects = async () => {
      setLoading(true);
      try {
          const res = await api.get('/admin/projects', { withCredentials: true });
          if (res.data?.status === 'ok') {
              // Map standard logic if DB columns differ
              const mapped = res.data.data.map((p: any) => ({
                  id: p.id,
                  title: p.title || 'Untitled Project',
                  clientName: p.client_name || `Client ID ${p.client_id || 'Unknown'}`,
                  talentName: p.talent_name || 'Multi/System Talent',
                  total_budget: p.total_budget || p.grossFee || 0,
                  status: p.status || 'active',
                  disputeReason: p.internal_notes || (p.status === 'disputed' ? 'Fraud Report / Talent No-Show' : undefined)
              }));
              setProjects(mapped);
          }
      } catch (err: any) {
          console.error("Failed fetching projects:", err.message);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchProjects();
  }, []);

  const filteredProjects = filterMode === 'all' ? projects : projects.filter(p => p.status === 'disputed');

  const handleForceResolve = async (id: string, resolution: 'client_wins' | 'talent_wins') => {
    if (!confirm(`ADMIN OVERRIDE: Apakah Anda yakin memaksakan putusan (${resolution}) secara instan?`)) return;
    
    setActionLoading(true);
    try {
        const res = await api.patch(`/admin/projects/${id}/resolve`, { resolution }, { withCredentials: true });
        if (res.data?.status === 'ok') {
             setProjects(prev => prev.map(p => 
                p.id === id ? { ...p, status: resolution === 'client_wins' ? 'cancelled' : 'completed', disputeReason: undefined } : p
             ));
             setActiveDispute(null);
        }
    } catch (err: any) {
        alert('Gagal mengeksekusi putusan: ' + err.message);
    } finally {
        setActionLoading(false);
    }
  };

  const handleCancelProject = async (id: string) => {
      if (!confirm('Hapus keras/Banned proyek ini dari sistem Orland?')) return;
      setActionLoading(true);
      try {
          const res = await api.delete(`/admin/projects/${id}`, { withCredentials: true });
          if (res.data?.status === 'ok') {
               setProjects(prev => prev.map(p => p.id === id ? { ...p, status: 'cancelled' } : p));
               setActiveDispute(null);
          }
      } catch (err: any) {
          alert('Gagal menghapus proyek: ' + err.message);
      } finally {
          setActionLoading(false);
      }
  };

  return (
    <div className="space-y-6 flex flex-col md:flex-row gap-6">
      
      {/* Kolom Kiri: Daftar Project */}
      <div className="w-full md:w-1/2 lg:w-3/5 space-y-6 h-[calc(100vh-140px)] flex flex-col">
         <div className="flex justify-between items-start">
             <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                   <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                      <Gavel size={20} />
                   </div>
                   Overwatch & Disputes
                </h1>
                <p className="text-sm text-slate-500 mt-2 dark:text-slate-400">Pusat pemantauan status seluruh proyek Klien dan intervensi konflik.</p>
             </div>
             
             <button onClick={fetchProjects} disabled={loading} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm text-slate-700 dark:text-slate-200">
                {loading ? <Loader2 size={16} className="animate-spin text-indigo-500"/> : <RefreshCw size={16} className="text-slate-400" />}
                Sync 
             </button>
         </div>

         <div className="flex gap-2 bg-white dark:bg-slate-900 p-1 w-max rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
             <button 
               onClick={() => setFilterMode('all')}
               className={`px-5 py-2 flex items-center gap-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${filterMode === 'all' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50'}`}
             >
                <FileText size={16} /> All Active
             </button>
             <button 
               onClick={() => setFilterMode('disputed')}
               className={`px-5 py-2 flex items-center gap-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-sm ${filterMode === 'disputed' ? 'bg-rose-500 text-white shadow-rose-500/30' : 'text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50'}`}
             >
                <AlertOctagon size={16} /> Priority (Disputed)
                {projects.filter(p => p.status === 'disputed').length > 0 && <span className="bg-rose-200 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200 px-2.5 py-0.5 rounded-md text-[10px] ml-1">{projects.filter(p => p.status === 'disputed').length}</span>}
             </button>
         </div>

         <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-[0_10px_30px_rgba(17,24,39,0.03)] flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
               
               {loading && projects.length === 0 && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                      <Loader2 size={32} className="animate-spin text-indigo-500 mb-4" />
                      <p className="text-xs font-bold uppercase tracking-widest">Scanning Network...</p>
                   </div>
               )}

               {!loading && filteredProjects.map(p => (
                 <button 
                   key={p.id}
                   onClick={() => setActiveDispute(p)}
                   className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 flex justify-between items-center group
                     ${p.status === 'disputed' ? 'bg-rose-50/50 hover:bg-rose-50 border-rose-200 dark:bg-rose-900/10 dark:hover:bg-rose-900/30 dark:border-rose-900/50' : 'bg-white hover:bg-slate-50 border-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:border-slate-800'}
                     ${activeDispute?.id === p.id ? (p.status === 'disputed' ? 'ring-2 ring-rose-500 shadow-lg' : 'ring-2 ring-indigo-500 shadow-lg') : 'hover:shadow-md'}
                   `}
                 >
                    <div className="flex-1 min-w-0 pr-4">
                       <div className="flex items-center gap-2 mb-2">
                          <StatusBadge status={p.status} />
                          <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase">{p.id}</span>
                       </div>
                       <h3 className="font-black text-slate-900 dark:text-white text-lg leading-tight mb-2 truncate group-hover:text-indigo-600 transition-colors">{p.title}</h3>
                       <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                          <span className="bg-slate-100 px-2 py-1 rounded-md border border-slate-200 dark:bg-slate-800 dark:border-slate-700">{p.clientName}</span> 
                          <ChevronRight size={10} className="text-slate-300"/> 
                          <span className="bg-slate-100 px-2 py-1 rounded-md border border-slate-200 dark:bg-slate-800 dark:border-slate-700">{p.talentName}</span>
                       </p>
                    </div>
                    <div className="text-right shrink-0">
                       <p className="text-sm font-black text-slate-900 dark:text-white mb-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                          Rp {p.total_budget.toLocaleString('id-ID')}
                       </p>
                       {p.status === 'disputed' ? (
                          <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest flex items-center justify-end gap-1">
                             <ShieldAlert size={12} /> Resolve <ChevronRight size={12} />
                          </span>
                       ) : <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             Manage <ChevronRight size={12} />
                          </span>}
                    </div>
                 </button>
               ))}

               {!loading && filteredProjects.length === 0 && (
                   <div className="flex flex-col bg-slate-50 dark:bg-slate-800/50 items-center justify-center h-full text-slate-400 text-sm font-bold absolute inset-0 rounded-2xl m-4 border-2 border-dashed border-slate-200 dark:border-slate-700">
                     <AlertOctagon size={48} className="text-slate-300 mb-3 opacity-50" />
                     Bagus! Tidak ada aktivitas yang memerlukan intervensi.
                   </div>
               )}
            </div>
         </div>
      </div>

      {/* Kolom Kanan: RESOLUTION PANEL */}
      {activeDispute && (
         <div className={`w-full md:w-1/2 lg:w-2/5 p-6 rounded-3xl animate-in fade-in slide-in-from-right relative overflow-hidden flex flex-col shadow-2xl border
            ${activeDispute.status === 'disputed' ? 'bg-[#0b1220] shadow-rose-900/20 border-rose-500/50' : 'bg-white dark:bg-slate-900 shadow-indigo-900/5 border-slate-200 dark:border-slate-800'}
         `}>
            {activeDispute.status === 'disputed' && <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600 rounded-full blur-[100px] opacity-15 pointer-events-none"></div>}
            
            <div className="relative z-10 flex flex-col h-[calc(100vh-160px)]">
               
               <div className={`flex items-center justify-between border-b pb-4 mb-6 ${activeDispute.status === 'disputed' ? 'border-rose-900/50' : 'border-slate-100 dark:border-slate-800'}`}>
                  <h3 className={`text-lg font-black flex items-center gap-2 ${activeDispute.status === 'disputed' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                     {activeDispute.status === 'disputed' ? <Gavel className="text-rose-500" /> : <FileText className="text-indigo-500" />} 
                     {activeDispute.status === 'disputed' ? 'Resolution Action Panel' : 'Project Management'}
                  </h3>
                  <button onClick={() => setActiveDispute(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold transition-colors">Close</button>
               </div>

               <div className="space-y-5 mb-6 overflow-y-auto flex-1 pr-2 no-scrollbar">
                 <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                   <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Target Project</p>
                   <p className={`text-base font-black ${activeDispute.status === 'disputed' ? 'text-white' : 'text-slate-900 dark:text-white'} leading-tight`}>{activeDispute.title}</p>
                   <p className="font-mono text-slate-500 text-xs mt-1">ID: {activeDispute.id}</p>
                 </div>
                 
                 {activeDispute.status === 'disputed' ? (
                     <div className="p-5 bg-rose-950/40 border border-rose-900/50 rounded-2xl relative shadow-inner">
                       <AlertOctagon className="absolute top-4 right-4 text-rose-500/20" size={60} />
                       <p className="text-[10px] uppercase font-black tracking-widest text-rose-400 mb-3 flex items-center gap-1.5"><ShieldAlert size={14}/> Dilaporkan Oleh Pihak Klien</p>
                       <p className="text-sm font-medium text-rose-100 leading-relaxed relative z-10 italic">"{activeDispute.disputeReason || 'Bypass Security Report / Anomali'}"</p>
                     </div>
                 ) : (
                     <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl">
                         <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-3">Project Status</p>
                         <StatusBadge status={activeDispute.status} />
                         <p className="text-xs font-medium text-slate-500 mt-4 leading-relaxed">Proyek ini sedang berlangsung normal tanpa kendala hukum. Anda dapat melakukan intervensi jika diperlukan.</p>
                     </div>
                 )}

                 {/* God Mode Chat Intercept */}
                 <div className={`mt-2 border rounded-2xl flex flex-col justify-center items-center p-6 text-center shadow-inner relative overflow-hidden group
                    ${activeDispute.status === 'disputed' ? 'bg-black/40 border-slate-800' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'}
                 `}>
                    <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <MessageSquare size={32} className={`${activeDispute.status === 'disputed' ? 'text-slate-600' : 'text-slate-300'} mb-3`} />
                    <h4 className={`text-xs font-black ${activeDispute.status === 'disputed' ? 'text-white' : 'text-slate-700 dark:text-white'} mb-2 uppercase tracking-widest`}>Log Sistem Chatting</h4>
                    <p className={`text-[11px] ${activeDispute.status === 'disputed' ? 'text-slate-400' : 'text-slate-500'} leading-relaxed mx-auto mb-4 font-medium`}>Dalam "God Mode", Anda dilindungi otoritas hukum untuk menyadap riwayat chat Klien ↔ Talent untuk mengumpulkan bukti.</p>
                    <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
                       Intercept Chat Log 
                    </button>
                 </div>
               </div>

               {/* Force Action Override */}
               <div className={`mt-2 pt-5 border-t ${activeDispute.status === 'disputed' ? 'border-slate-800' : 'border-slate-100 dark:border-slate-800'}`}>
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3 text-center">Intervensi Sistem & Hukum</h4>
                  
                  {activeDispute.status === 'disputed' ? (
                      <div className="grid grid-cols-2 gap-3">
                         <button disabled={actionLoading} onClick={() => handleForceResolve(activeDispute.id, 'client_wins')} className="flex flex-col items-center justify-center gap-1.5 py-4 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/30 rounded-2xl transition-all disabled:opacity-50">
                            {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <span className="font-black text-sm">Batalkan Kontrak</span>}
                            <span className="text-[9px] font-bold opacity-80 uppercase tracking-widest">(Bela Klien - Refund)</span>
                         </button>
                         <button disabled={actionLoading} onClick={() => handleForceResolve(activeDispute.id, 'talent_wins')} className="flex flex-col items-center justify-center gap-1.5 py-4 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/30 rounded-2xl transition-all disabled:opacity-50">
                            {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <span className="font-black text-sm">Paksa Payout Tunai</span>}
                            <span className="text-[9px] font-bold opacity-80 uppercase tracking-widest">(Bela Talent - Release)</span>
                         </button>
                      </div>
                  ) : (
                      <div className="flex justify-center">
                         <button disabled={actionLoading} onClick={() => handleCancelProject(activeDispute.id)} className="w-full flex items-center justify-center gap-2 py-4 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 border border-rose-200 dark:border-rose-500/30 rounded-2xl transition-all font-black text-sm disabled:opacity-50">
                            {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <AlertOctagon size={16} />} 
                            Tutup Paksa Proyek 
                         </button>
                      </div>
                  )}
               </div>

            </div>
         </div>
      )}
    </div>
  );
}

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'active': return <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-indigo-200 text-[9px] font-black bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/50 uppercase tracking-widest gap-1"><Activity size={10}/> In-Progress</span>;
    case 'completed': return <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-emerald-200 text-[9px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/50 uppercase tracking-widest gap-1"><CheckCircle2 size={10}/> Completed</span>;
    case 'cancelled': return <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-slate-300 text-[9px] font-black bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 uppercase tracking-widest gap-1"><Ban size={10}/> Cancelled</span>;
    case 'disputed': return <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-rose-200 text-[9px] font-black bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/50 uppercase tracking-widest gap-1 animate-pulse"><AlertOctagon size={10}/> Disputed</span>;
    default: return <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-slate-200 text-[9px] font-black bg-slate-50 text-slate-500 uppercase tracking-widest">{status}</span>;
  }
};
