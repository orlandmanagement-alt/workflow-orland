import { GraduationCap, Award, BookOpen, CheckCircle } from 'lucide-react';

export default function OrlandAcademy() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 sm:px-6 mt-6 pb-20">
      <div className="bg-gradient-to-r from-indigo-900 to-brand-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-black flex items-center gap-3"><GraduationCap size={32}/> Orland Academy</h1>
          <p className="text-indigo-200 mt-2">Pastikan Project Anda diisi oleh talent tersertifikasi dan terlatih.</p>
        </div>
        <div className="absolute top-0 right-0 p-10 opacity-10"><Award size={150} /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4"><BookOpen size={20} className="text-brand-500"/> Kelas Terpopuler</h3>
          <div className="space-y-3">
            {['Acting for Camera 101', 'Public Speaking & MC', 'Professional Modeling Walk'].map((course, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-sm font-medium dark:text-slate-300">{course}</span>
                <span className="text-[10px] font-black bg-brand-100 text-brand-600 px-2 py-1 rounded">240 Talent Lulus</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
            <CheckCircle size={48} className="text-emerald-500 mb-2"/>
            <h4 className="font-black text-slate-900 dark:text-white">Quality Assurance</h4>
            <p className="text-xs text-slate-500 mt-1">90% Talent Orland yang tersertifikasi mendapatkan rating bintang 5 dari Klien.</p>
        </div>
      </div>
    </div>
  );
}
