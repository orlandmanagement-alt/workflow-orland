import { useState, useEffect } from 'react';
import { Radio, Users, MapPin, CheckCircle2, XCircle, Clock, Zap } from 'lucide-react';

export default function LiveCastingBoard() {
  const [candidates, setCandidates] = useState([
    { id: 'C1', name: 'Andi (Guest)', phone: '0812xxx', status: 'Waiting', time: '14:02' },
    { id: 'C2', name: 'Budi (Guest)', phone: '0813xxx', status: 'Waiting', time: '14:05' },
  ]);

  // Simulasi SSE (Server-Sent Events) atau Auto-Refresh
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("Checking for new walk-in talents...");
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Radio className="text-red-500 animate-pulse" size={24}/> Live Casting Board
          </h1>
          <p className="text-sm text-slate-500">Monitor talent walk-in yang scan QR di lokasi syuting secara real-time.</p>
        </div>
        <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-xs font-bold border border-emerald-200 shadow-sm">
          Board Active: PRJ-2026-001
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {candidates.map((can) => (
          <div key={can.id} className="bg-white dark:bg-dark-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group hover:border-brand-500 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 font-bold text-lg">
                {can.name.charAt(0)}
              </div>
              <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-2 py-1 rounded flex items-center gap-1">
                <Clock size={10}/> {can.time}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">{can.name}</h3>
              <p className="text-xs text-slate-500 mb-4">{can.phone}</p>
            </div>
            <div className="flex gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
              <button className="flex-1 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1">
                <CheckCircle2 size={14}/> ACC
              </button>
              <button className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors flex items-center justify-center gap-1">
                <XCircle size={14}/> Tolak
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
