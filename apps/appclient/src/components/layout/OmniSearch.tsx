import { useState, useEffect } from 'react';
import { Search, Command, X } from 'lucide-react';

export default function OmniSearch() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div className="bg-white dark:bg-dark-card w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <Search className="text-slate-400" size={20} />
          <input autoFocus placeholder="Ketik apa saja (Project, Talent, Invoice)..." className="flex-1 bg-transparent outline-none dark:text-white" />
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-slate-50 px-1.5 font-mono text-[10px] font-medium text-slate-500">ESC</kbd>
          <button onClick={() => setIsOpen(false)}><X size={20} className="text-slate-400" /></button>
        </div>
        <div className="p-2 max-h-[300px] overflow-y-auto">
          <p className="p-4 text-xs font-bold text-slate-400 uppercase">Hasil Terakhir</p>
          <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer flex justify-between">
            <span className="text-sm font-bold dark:text-white">PRJ-2026-001 TVC Ramadhan</span>
            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Project</span>
          </div>
        </div>
      </div>
    </div>
  );
}
