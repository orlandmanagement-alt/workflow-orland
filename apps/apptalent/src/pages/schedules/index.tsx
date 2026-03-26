import { CalendarDays } from 'lucide-react';
export default function Schedules() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Jadwal Kalender</h1>
      <div className="bg-white dark:bg-dark-card p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center flex flex-col items-center">
        <CalendarDays size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-lg font-bold dark:text-white">Belum ada jadwal bulan ini</h3>
        <p className="text-slate-500 text-sm mt-2 max-w-sm">Jadwal casting dan syuting Anda akan muncul di sini. Pastikan Anda rajin melamar proyek!</p>
      </div>
    </div>
  )
}
