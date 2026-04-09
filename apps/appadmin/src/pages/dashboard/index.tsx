import React from 'react';
import { Users, Activity, DollarSign, AlertTriangle, ShieldAlert, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import ChatStatsWidget from '@/components/dashboard/ChatStatsWidget';
import NotificationStatsWidget from '@/components/dashboard/NotificationStatsWidget';

export default function AdminDashboard() {
  const stats = [
    { label: 'Total Talents', value: '4,821', change: '+12.5%', isPositive: true, icon: Users },
    { label: 'Active Projects', value: '342', change: '+5.2%', isPositive: true, icon: Activity },
    { label: 'Escrow Volume', value: 'Rp 4.2B', change: '-2.4%', isPositive: false, icon: DollarSign },
    { label: 'Pending Disputes', value: '14', change: '+4', isPositive: false, icon: AlertTriangle },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-widest uppercase mb-1 flex items-center gap-3">
             <ShieldAlert className="text-red-500" />
             God Mode <span className="text-red-500 font-light">Dashboard</span>
          </h1>
          <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">OVERWATCH COMMAND CENTER • ORLAND MANAGEMENT</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm tracking-widest uppercase shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all">
          <BarChart3 size={16} /> Generate Core Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-red-900/50 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all">
               <stat.icon size={64} className="text-white" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <span className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-4">{stat.label}</span>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-black text-white">{stat.value}</span>
                <span className={`text-xs font-bold flex items-center gap-1 ${stat.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {stat.change}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Activity Stub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl h-96 flex flex-col">
           <h3 className="text-white font-bold uppercase tracking-widest text-sm mb-6 flex justify-between items-center">
             System Activity
             <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,1)]"></span>
           </h3>
           <div className="flex-1 flex items-center justify-center border border-dashed border-slate-800 rounded-xl relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
               <p className="text-slate-600 font-mono text-xs z-10">[ VISUALIZATION ENGINE STUB - CONNECT TO D3.JS / CHART.JS ]</p>
           </div>
        </div>
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-6 rounded-2xl h-96 flex flex-col">
           <h3 className="text-white font-bold uppercase tracking-widest text-sm mb-6 border-b border-slate-800 pb-4">
             Recent Incidents
           </h3>
           <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {[1, 2, 3, 4, 5].map(i => (
                 <div key={i} className="flex gap-4 items-start pb-4 border-b border-slate-800/50 last:border-0 hover:bg-white/5 p-2 rounded-lg transition-colors cursor-pointer">
                    <div className="mt-1 w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>
                    <div>
                      <p className="text-sm font-bold text-white mb-1">Payment Delayed - PROJ-{800+i}</p>
                      <p className="text-xs font-mono text-slate-500">Client B2B has not released escrow funds for more than 48 hours.</p>
                      <p className="text-[10px] text-slate-400 mt-2">2 hours ago</p>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </div>

      {/* Chat & Notification Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <ChatStatsWidget />
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <NotificationStatsWidget />
        </div>
      </div>
    </div>
  );
}
