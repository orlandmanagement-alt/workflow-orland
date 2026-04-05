import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Clock, Lock, Users, Briefcase, FileText, Activity, ShieldCheck, Download, MoreVertical } from 'lucide-react';

export default function ProjectDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'overview'|'talents'|'finance'|'documents'>('overview');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 pb-20">
       {/* Hero Cover */}
       <div className="h-48 md:h-64 bg-slate-900 border-b border-slate-800 relative bg-[url('https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?auto=format&fit=crop&q=80')] bg-cover bg-center">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
          <div className="absolute top-6 left-6 z-10">
             <Link to="/dashboard/projects" className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white rounded-xl text-sm font-bold transition-colors">
                <ArrowLeft size={16} /> Back to Hub
             </Link>
          </div>
          
          <div className="absolute bottom-6 px-6 md:px-10 w-full flex flex-col md:flex-row md:items-end justify-between gap-4">
             <div>
                <span className="px-3 py-1 bg-brand-500 text-white font-bold uppercase tracking-widest text-[10px] rounded mb-3 inline-block">Casting in Progress</span>
                <h1 className="text-3xl md:text-4xl font-black text-white mb-2 drop-shadow-lg">Corporate TVC Nusantara</h1>
                <div className="flex flex-wrap items-center gap-4 text-slate-300 text-sm font-medium">
                   <span className="flex items-center gap-1"><MapPin size={14}/> Jakarta</span>
                   <span className="flex items-center gap-1"><Calendar size={14}/> 12 Oct 2026 - 15 Oct 2026</span>
                   <span className="flex items-center gap-1"><Clock size={14}/> 08:00 WIB</span>
                </div>
             </div>
             
             <div className="flex gap-3">
                <button className="px-4 py-2.5 bg-white text-slate-900 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-100 transition-colors text-sm shadow-xl">
                    <Users size={18}/> Manage Roster
                </button>
             </div>
          </div>
       </div>

       <div className="max-w-7xl mx-auto px-4 md:px-10 mt-8 mb-6 flex flex-col md:flex-row gap-8 items-start relative z-20">
         
         {/* LEFT CONTENT MAIN */}
         <div className="flex-1 w-full space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 flex overflow-x-auto hide-scrollbar sticky top-20 z-30 shadow-sm">
               {['overview', 'talents', 'finance', 'documents'].map(tab => (
                 <button 
                   key={tab} 
                   onClick={() => setActiveTab(tab as any)}
                   className={`px-6 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                 >
                   {tab}
                 </button>
               ))}
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8">
                   <h3 className="font-black text-slate-900 dark:text-white text-lg mb-4 flex items-center gap-2"><Briefcase size={20} className="text-brand-500"/> Project Brief</h3>
                   <div className="prose dark:prose-invert prose-brand max-w-none prose-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      <p>Mencari talenta lokal dari berbagai ras dan etnis di nusantara untuk membintangi kampanye "Merayakan Perbedaan Nusantara". Proses produksi akan memakan waktu 3 hari di studio indoor dan 1 hari di area GBK (outdoor).</p>
                      <ul>
                        <li>Diperlukan talent pria/wanita usia 18-35 tahun.</li>
                        <li>Sanggup melakukan koreografi ringan.</li>
                        <li>Non-exclusivity agreements (bisa lintas brand/kompetitor setelah 6 bulan).</li>
                      </ul>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'talents' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden animate-in fade-in duration-300">
                 <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-black text-slate-900 dark:text-white text-lg flex items-center gap-2"><Users size={20} className="text-brand-500"/> Roster Talents</h3>
                    <button className="text-brand-600 dark:text-brand-400 text-sm font-bold uppercase tracking-wider">Add Talent +</button>
                 </div>
                 <div className="p-10 flex flex-col justify-center items-center text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400"><Users size={28}/></div>
                    <p className="font-bold text-slate-900 dark:text-white mb-2">Belum ada Talent di Roster</p>
                    <p className="text-sm text-slate-500 max-w-sm">Mulai invite talent dari Live Board atau pilih dari Talent Search untuk memasukkan mereka ke proyek ini.</p>
                 </div>
              </div>
            )}
            
            {/* OTHER TABS STUB */}
         </div>

         {/* RIGHT SIDEBAR DETAILS */}
         <div className="w-full md:w-[340px] shrink-0 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
               <h3 className="font-black text-slate-900 dark:text-white text-base mb-6 uppercase tracking-wider">Project State</h3>
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <span className="text-sm font-medium text-slate-500 flex items-center gap-2"><Activity size={16}/> Status</span>
                     <span className="font-bold text-slate-900 dark:text-white">Live Casting</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-sm font-medium text-slate-500 flex items-center gap-2"><Lock size={16}/> Escrow Status</span>
                     <span className="font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded text-xs uppercase tracking-widest border border-amber-200 dark:border-amber-900/50">Awaiting Funds</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-sm font-medium text-slate-500 flex items-center gap-2"><Users size={16}/> Slots Filled</span>
                     <span className="font-bold text-slate-900 dark:text-white">0 / 15 Talents</span>
                  </div>
               </div>
               
               <div className="h-px bg-slate-200 dark:bg-slate-800 w-full my-6"></div>
               
               <button className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3 rounded-xl shadow-lg hover:scale-105 transition-transform text-sm uppercase tracking-widest flex items-center justify-center gap-2">
                  <Lock size={16}/> Fund Escrow
               </button>
            </div>
         </div>
       </div>
    </div>
  );
}
