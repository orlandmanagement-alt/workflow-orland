import { Briefcase, CalendarCheck, Wallet, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/useAppStore';

const stats = [
    { name: 'Total Lamaran Proyek', value: '12', icon: Briefcase, change: '+2 minggu ini', changeType: 'positive' },
    { name: 'Jadwal Casting Terdekat', value: '3', icon: CalendarCheck, change: '1 Hari lagi', changeType: 'neutral' },
    { name: 'Estimasi Pendapatan (Rp)', value: '8.5M', icon: Wallet, change: 'Menunggu Payout', changeType: 'neutral' },
];

export default function DashboardHome() {
  const { user } = useAuthStore();
  
  return (
    <div className="space-y-10">
      {/* Welcome Banner */}
      <div className="bg-white dark:bg-dark-card p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tighter">Halo, {user?.full_name || 'Talent'}! 👋</h2>
                <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-xl">Profil Anda 90% lengkap. Selesaikan KYC dan lengkapi Comp Card untuk meningkatkan peluang diterima di proyek besar selanjutnya.</p>
            </div>
            <button className="flex items-center justify-center px-6 py-3.5 bg-brand-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all group shrink-0">
                Lengkapi Profil Pro
                <ChevronRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
      </div>

      {/* Stats Grid - FIX: Menggunakan Grid Horizontal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
                <div key={i} className="bg-white dark:bg-dark-card p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 group hover:border-brand-300 dark:hover:border-brand-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-brand-500/5">
                    <div className="flex items-center justify-between">
                        <div className="p-3 bg-brand-50 dark:bg-brand-950 rounded-xl border border-brand-100 dark:border-brand-900 group-hover:scale-110 transition-transform">
                            <Icon className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${stat.changeType === 'positive' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{stat.change}</span>
                    </div>
                    <p className="text-base font-semibold text-slate-600 dark:text-slate-400 mt-6 tracking-tight">{stat.name}</p>
                    <p className="text-4xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tighter">{stat.value}</p>
                </div>
            )
        })}
      </div>
    </div>
  )
}
