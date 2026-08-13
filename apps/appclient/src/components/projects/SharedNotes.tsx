import { useState } from 'react';
import { Save, User, RefreshCw } from 'lucide-react';

export default function SharedNotes() {
  const [notes, setNotes] = useState('Catatan internal antara PH dan Admin Orland terkait casting ini...');

  return (
    <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[500px]">
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <RefreshCw size={14} className="text-emerald-500 animate-spin-slow" />
          <span className="text-[10px] font-black text-slate-500 uppercase">Live Collaboration Mode</span>
        </div>
        <span className="text-[10px] text-slate-400 italic flex items-center gap-1"><User size={10}/> Last edit: Manoj Punjabi</span>
      </div>
      <textarea 
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="flex-1 p-8 bg-transparent outline-none text-slate-700 dark:text-slate-300 font-mono text-sm leading-relaxed resize-none"
      />
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-dark-card flex justify-end">
        <button className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs flex items-center gap-2 shadow-md">
          <Save size={14}/> Simpan Permanen
        </button>
      </div>
    </div>
  );
}
