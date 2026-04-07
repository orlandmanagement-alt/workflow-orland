import React, { useState } from 'react';
import { AlertTriangle, Search, Filter, Shield, MoreHorizontal, MessageSquare, CheckCircle, Clock, Building2, User } from 'lucide-react';

export default function DisputeResolution() {
  const [activeTab, setActiveTab] = useState<'open' | 'resolved'>('open');

  const disputes = [
    { id: 'DSP-9921', project: 'TVC Ramadhan 2026', client: 'PT Maju Bersama', talent: 'Anya Geraldine', status: 'critical', issue: 'Breach of Exclusivity Concept', date: '2 Hours Ago' },
    { id: 'DSP-9918', project: 'KOL Campaign Serentak', client: 'BrandAgency X', talent: 'Budi TikTok', status: 'warning', issue: 'Payment Escrow Hold', date: '1 Day Ago' },
    { id: 'DSP-9884', project: 'Event Konser JKT', client: 'EO Nusantara', talent: 'Audio Crew Pro', status: 'investigating', issue: 'Rider Technical Failure', date: '3 Days Ago' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'critical': return <span className="px-2 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><AlertTriangle size={12}/> Critical</span>;
      case 'warning': return <span className="px-2 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><Clock size={12}/> Hold</span>;
      case 'investigating': return <span className="px-2 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><Search size={12}/> Reviewing</span>;
      default: return null;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-white tracking-widest uppercase mb-1 flex items-center gap-3">
             <Shield className="text-red-500" />
             Dispute <span className="text-red-500 font-light">Resolution</span>
          </h1>
          <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">OVERWATCH LEGAL & ESCROW MEDIATION</p>
        </div>
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 shrink-0">
          <button onClick={() => setActiveTab('open')} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors ${activeTab === 'open' ? 'bg-red-600 text-white' : 'text-slate-500 hover:text-white'}`}>Active Tickets</button>
          <button onClick={() => setActiveTab('resolved')} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors ${activeTab === 'resolved' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}>Resolved</button>
        </div>
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-800 flex gap-4 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="text" placeholder="Search dispute ID, client, or talent..." className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:border-red-500 outline-none transition-colors" />
          </div>
          <button className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 border border-slate-700 transition-colors">
            <Filter size={16} /> Filters
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto custom-scrollbar">
           {activeTab === 'open' ? (
             <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-900/95 backdrop-blur z-10 uppercase text-[10px] tracking-widest text-slate-500 font-bold">
                  <tr>
                    <th className="p-4 border-b border-slate-800">Disp ID</th>
                    <th className="p-4 border-b border-slate-800">Status</th>
                    <th className="p-4 border-b border-slate-800">Project & Issue</th>
                    <th className="p-4 border-b border-slate-800 flex items-center gap-2"><Building2 size={14}/> Client vs Talent <User size={14}/></th>
                    <th className="p-4 border-b border-slate-800">Logged</th>
                    <th className="p-4 border-b border-slate-800 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {disputes.map(d => (
                    <tr key={d.id} className="hover:bg-white/5 transition-colors group cursor-pointer">
                      <td className="p-4 font-mono text-slate-300 font-bold group-hover:text-red-400 transition-colors">{d.id}</td>
                      <td className="p-4">{getStatusBadge(d.status)}</td>
                      <td className="p-4">
                        <p className="font-bold text-white mb-1">{d.project}</p>
                        <p className="text-xs text-slate-500">{d.issue}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full"></span> {d.client}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-2"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span> {d.talent}</p>
                      </td>
                      <td className="p-4 text-xs font-mono text-slate-500">{d.date}</td>
                      <td className="p-4 text-right">
                        <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <CheckCircle size={48} className="mb-4 opacity-20" />
                <p className="font-bold text-white mb-1">No Resolved Disputes Recently</p>
                <p className="text-sm">Historical records will appear here.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
