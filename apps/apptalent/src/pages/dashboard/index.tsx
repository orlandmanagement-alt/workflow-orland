import { Briefcase, CalendarCheck, Wallet, ChevronRight, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { talentService } from '@/lib/services/talentService';

export default function DashboardHome() {
  // API WIRING: Mengambil data asli dari server
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['profile-me'],
    queryFn: talentService.getProfile,
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-brand-600" size={40} /></div>
  );

  // Jika error, ErrorBoundary di level Layout akan menangkapnya, 
  // tapi kita juga bisa handle manual di sini jika ingin.
  if (isError) throw new Error('Gagal mengambil data profil');

  return (
    <div className="space-y-10">
      <div className="bg-white dark:bg-dark-card p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tighter">
                  Halo, {profile?.full_name || 'Talent'}! 👋
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-xl">Profil Anda {profile?.profile_completion || '0'}% lengkap. Selesaikan KYC untuk mendapatkan proyek eksklusif.</p>
            </div>
            <button className="flex items-center justify-center px-6 py-3.5 bg-brand-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all group shrink-0">
                Lengkapi Profil Pro
                <ChevronRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <StatCard name="Total Lamaran" value={profile?.stats?.total_applied || '0'} icon={Briefcase} />
        <StatCard name="Jadwal Terdekat" value={profile?.stats?.upcoming_schedules || '0'} icon={CalendarCheck} />
        <StatCard name="Saldo Payout" value={`Rp ${profile?.stats?.balance || '0'}`} icon={Wallet} />
      </div>
    </div>
  );
}

function StatCard({ name, value, icon: Icon }: any) {
  return (
    <div className="bg-white dark:bg-dark-card p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 group transition-all duration-300">
      <div className="p-3 w-fit bg-brand-50 dark:bg-brand-950 rounded-xl border border-brand-100 dark:border-brand-900"><Icon className="text-brand-600 dark:text-brand-400" /></div>
      <p className="text-base font-semibold text-slate-600 dark:text-slate-400 mt-6">{name}</p>
      <p className="text-4xl font-extrabold text-slate-900 dark:text-white mt-1">{value}</p>
    </div>
  );
}
