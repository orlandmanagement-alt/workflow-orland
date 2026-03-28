import { CalendarDays } from 'lucide-react';
export default function Schedules() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Jadwal Kalender</h1>
      <div className="bg-white dark:bg-dark-card p-10 sm:p-16 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center flex flex-col items-center">
        <div className="h-20 w-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-800">
            <CalendarDays size={40} className="text-slate-300 dark:text-slate-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Belum ada jadwal bulan ini</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 max-w-sm leading-relaxed">Jadwal proses casting, fitting, dan hari H syuting Anda akan tersusun rapi di sini. Pastikan Anda rajin melamar proyek!</p>
      </div>
    </div>
  )
}
