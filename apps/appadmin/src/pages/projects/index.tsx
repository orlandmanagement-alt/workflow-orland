import React, { useState } from 'react';
import { Gavel, AlertOctagon, CheckCircle2, ChevronRight, MessageSquare, ShieldAlert, FileText } from 'lucide-react';

interface ProjectOverwatch {
  id: string;
  title: string;
  clientName: string;
  talentName: string;
  grossFee: number;
  status: 'active' | 'completed' | 'disputed';
  disputeReason?: string;
}

const MOCK_PROJECTS: ProjectOverwatch[] = [
  { id: 'PRJ-XYZ999', title: 'TVC Iklan Susu Anak', clientName: 'Nusantara Productions', talentName: 'Alina Kharisma', grossFee: 15000000, status: 'active' },
  { id: 'PRJ-XYZ102', title: 'Event Music Fest', clientName: 'Superb Events (EO)', talentName: 'Bima Satria', grossFee: 3000000, status: 'completed' },
  { id: 'PRJ-XYZ255', title: 'Campaign TikTok Kemerdekaan', clientName: 'Digitalis Agency', talentName: 'Kevin Pratama', grossFee: 8000000, status: 'disputed', disputeReason: 'Talent tidak hadir di lokasi syuting namun menolak mengembalikan DP.' },
];

export default function ProjectOverwatch() {
  const [projects, setProjects] = useState<ProjectOverwatch[]>(MOCK_PROJECTS);
  const [filterMode, setFilterMode] = useState<'all' | 'disputed'>('all');
  const [activeDispute, setActiveDispute] = useState<ProjectOverwatch | null>(null);

  const filteredProjects = filterMode === 'all' ? projects : projects.filter(p => p.status === 'disputed');

  const handleForceResolve = (id: string, resolution: 'client_wins' | 'talent_wins') => {
    if (confirm(`ADMIN OVERRIDE: Apakah Anda yakin memutuskan resolusi untuk proyek ${id} secara sepihak? (${resolution})`)) {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, status: 'completed', disputeReason: undefined } : p));
      setActiveDispute(null);
    }
  };

  return (
    <div className="space-y-6 flex flex-col md:flex-row gap-6">
      
      {/* Kolom Kiri: Daftar Project */}
      <div className="w-full md:w-1/2 lg:w-3/5 space-y-6 h-[calc(100vh-140px)] flex flex-col">
         <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
               <Gavel className="text-brand-500" /> Overwatch & Disputes
            </h1>
            <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">Pusat pemantauan status seluruh proyek Klien dan intervensi konflik.</p>
         </div>

         <div className="flex gap-2 bg-white dark:bg-slate-900 p-1 w-max rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
             <button 
               onClick={() => setFilterMode('all')}
               className={`px-4 py-1.5 flex items-center gap-2 rounded-lg text-xs font-bold transition-all ${filterMode === 'all' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
             >
                <FileText size={16} /> All Projects
             </button>
             <button 
               onClick={() => setFilterMode('disputed')}
               className={`px-4 py-1.5 flex items-center gap-2 rounded-lg text-xs font-bold transition-all ${filterMode === 'disputed' ? 'bg-red-500 text-white' : 'text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400'}`}
             >
                <AlertOctagon size={16} /> Needs Attention (Disputed)
                {projects.filter(p => p.status === 'disputed').length > 0 && <span className="bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-200 px-2 py-0.5 rounded-full text-[10px] ml-1">{projects.filter(p => p.status === 'disputed').length}</span>}
             </button>
         </div>

         <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto p-3 space-y-2 relative">
               {filteredProjects.map(p => (
                 <button 
                   key={p.id}
                   onClick={() => p.status === 'disputed' && setActiveDispute(p)}
                   className={`w-full text-left p-5 rounded-2xl border transition-all flex justify-between items-center group
                     ${p.status === 'disputed' ? 'bg-red-50/50 hover:bg-red-50 border-red-200 dark:bg-red-900/10 dark:hover:bg-red-900/20 dark:border-red-900/50' : 'bg-white hover:bg-slate-50 border-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:border-slate-800'}
                     ${activeDispute?.id === p.id ? 'ring-2 ring-red-500 shadow-md' : ''}
                   `}
                 >
                    <div>
                       <div className="flex items-center gap-2 mb-1">
                          <StatusBadge status={p.status} />
                          <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">{p.id}</span>
                       </div>
                       <h3 className="font-bold text-slate-900 dark:text-white text-lg">{p.title}</h3>
                       <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                          Client: <strong>{p.clientName}</strong> <ChevronRight size={10}/> Talent: <strong>{p.talentName}</strong>
                       </p>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-slate-900 dark:text-white mb-2">Rp {p.grossFee.toLocaleString()}</p>
                       {p.status === 'disputed' ? (
                          <span className="text-[10px] font-bold text-red-600 dark:text-red-400 flex items-center justify-end gap-1">
                             <ShieldAlert size={14} /> Resolve ➔
                          </span>
                       ) : <ChevronRight size={18} className="text-slate-300 ml-auto" />}
                    </div>
                 </button>
               ))}

               {filteredProjects.length === 0 && (
                   <div className="flex bg-slate-50 dark:bg-slate-800/50 items-center justify-center h-full text-slate-400 text-sm font-bold absolute inset-0 rounded-2xl m-3 border-2 border-dashed border-slate-200 dark:border-slate-800">
                     Tidak ada proyek dalam kategori ini.
                   </div>
               )}
            </div>
         </div>
      </div>

      {/* Kolom Kanan: RESOLUTION PANEL */}
      {activeDispute && (
         <div className="w-full md:w-1/2 lg:w-2/5 p-6 bg-[#071122] rounded-3xl shadow-xl shadow-red-900/20 border border-red-500 animate-in fade-in slide-in-from-right relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col h-[calc(100vh-160px)]">
               
               <div className="flex items-center justify-between border-b border-red-900/50 pb-4 mb-6">
                  <h3 className="text-xl font-black text-white flex items-center gap-2"><Gavel className="text-red-500" /> Resolution Action Panel</h3>
                  <button onClick={() => setActiveDispute(null)} className="text-red-400 text-xs font-bold uppercase tracking-widest hover:text-white">Esc</button>
               </div>

               <div className="space-y-4 mb-6">
                 <div>
                   <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">Target Project</p>
                   <p className="text-base font-bold text-white">{activeDispute.title} <span className="font-mono text-slate-400 text-xs">({activeDispute.id})</span></p>
                 </div>
                 
                 <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-xl relative">
                   <AlertOctagon className="absolute top-4 right-4 text-red-500/20" size={48} />
                   <p className="text-[10px] uppercase font-bold tracking-widest text-red-400 mb-2 flex items-center gap-1"><ShieldAlert size={12}/> Dilaporkan Oleh Pihak Klien</p>
                   <p className="text-sm font-medium text-white leading-relaxed relative z-10">"{activeDispute.disputeReason}"</p>
                 </div>
               </div>

               {/* God Mode Chat Intercept */}
               <div className="flex-1 bg-black/40 border border-slate-800 rounded-2xl flex flex-col justify-center items-center p-6 text-center shadow-inner">
                  <MessageSquare size={40} className="text-slate-700 mb-3" />
                  <h4 className="text-sm font-bold text-white mb-2">Buka Log Sistem Chatting</h4>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto mb-4">Dalam "God Mode", Anda dilindungi otoritas hukum untuk menyadap riwayat chat Klien ↔ Talent untuk mengumpulkan bukti sebelum memutus sengketa kontrak.</p>
                  <button className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-black shadow-lg shadow-brand-500/20 transition-all">
                     Intercept & Read Chat Log 
                  </button>
               </div>

               {/* Force Action Override */}
               <div className="mt-6 border-t border-slate-800 pt-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 text-center">Tindakan Keputusan Akhir (Irreversible)</h4>
                  <div className="grid grid-cols-2 gap-3">
                     <button onClick={() => handleForceResolve(activeDispute.id, 'client_wins')} className="flex flex-col items-center justify-center gap-1 py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 rounded-2xl transition-all">
                        <span className="font-black">Batalkan Kontrak</span>
                        <span className="text-[10px] font-medium opacity-80">(Bela Klien - Refund DP)</span>
                     </button>
                     <button onClick={() => handleForceResolve(activeDispute.id, 'talent_wins')} className="flex flex-col items-center justify-center gap-1 py-4 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white border border-green-500/30 rounded-2xl transition-all">
                        <span className="font-black">Paksa Payout Tunai</span>
                        <span className="text-[10px] font-medium opacity-80">(Bela Talent - Release Dana)</span>
                     </button>
                  </div>
               </div>

            </div>
         </div>
      )}
    </div>
  );
}

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'active': return <span className="inline-flex items-center px-2 py-0.5 rounded border border-brand-200 text-[9px] font-black bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400 dark:border-brand-500/50 uppercase tracking-widest gap-1">In-Progress</span>;
    case 'completed': return <span className="inline-flex items-center px-2 py-0.5 rounded border border-green-200 text-[9px] font-black bg-green-50 text-green-700 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/50 uppercase tracking-widest gap-1"><CheckCircle2 size={10}/> Completed</span>;
    case 'disputed': return <span className="inline-flex items-center px-2 py-0.5 rounded border border-red-200 text-[9px] font-black bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/50 uppercase tracking-widest gap-1 animate-pulse"><AlertOctagon size={10}/> Disputed</span>;
    default: return null;
  }
};
