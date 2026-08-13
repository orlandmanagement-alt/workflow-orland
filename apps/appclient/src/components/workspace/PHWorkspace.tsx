import React from 'react';
import { Camera, FileText, Ruler } from 'lucide-react';

export const PHWorkspace = ({ projectId, data }: any) => {
  return (
    <div className="w-full space-y-6">
      
      {/* HEADER */}
      <div className="flex items-center gap-3 bg-white dark:bg-dark-card p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500 rounded-full blur-[100px] opacity-10 pointer-events-none"></div>
        
        <span className="p-4 bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 rounded-2xl relative z-10">
          <Camera size={28} />
        </span>
        <div className="relative z-10">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">The Production Board</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Project ID: {projectId} • PH / TVC Workspace</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Placeholder: Call Sheet Generator */}
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
          <FileText size={40} className="text-slate-300 dark:text-slate-700 mb-4 group-hover:text-rose-500 transition-colors" />
          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Call Sheet Generator</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Buat jadwal panggilan harian (Standby Time, Scene, Lokasi) dan *Broadcast* ke seluruh aktor yang terlibat.</p>
          <div className="mt-4 text-xs font-bold text-rose-500 uppercase tracking-wider">Coming Soon</div>
        </div>

        {/* Placeholder: Wardrobe & Size Matrix */}
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
          <Ruler size={40} className="text-slate-300 dark:text-slate-700 mb-4 group-hover:text-rose-500 transition-colors" />
          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Wardrobe & Size Matrix</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Rekapitulasi otomatis ukuran baju, sepatu, dan postur fisik para talent untuk kemudahan tim Kostum.</p>
          <div className="mt-4 text-xs font-bold text-rose-500 uppercase tracking-wider">Coming Soon</div>
        </div>
      </div>

    </div>
  );
};
