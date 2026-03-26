import { Briefcase, MapPin } from 'lucide-react';
export default function Projects() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Proyek Aktif</h1>
      <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <h3 className="font-bold text-lg dark:text-white">Iklan TVC Minuman Energi</h3>
            <span className="bg-brand-100 text-brand-700 text-xs font-bold px-3 py-1 rounded-full">Shooting H-3</span>
        </div>
        <div className="space-y-3">
            <p className="flex items-center text-sm text-slate-600 dark:text-slate-400"><MapPin size={16} className="mr-2" /> Studio Alam, Depok</p>
            <p className="flex items-center text-sm text-slate-600 dark:text-slate-400"><Briefcase size={16} className="mr-2" /> Klien: PT Maju Bersama</p>
        </div>
        <button className="mt-6 w-full py-2.5 bg-slate-900 dark:bg-brand-600 text-white font-bold rounded-xl text-sm">Masuk ke Green Room (Detail)</button>
      </div>
    </div>
  )
}
