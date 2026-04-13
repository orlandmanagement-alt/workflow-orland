import { Link } from 'react-router-dom';
import { TrendingUp, Users, MessageSquare, CreditCard } from 'lucide-react';
import { useAuthStore } from '../store/useAppStore';

export default function Dashboard() {
  const { user } = useAuthStore();

  const stats = [
    {
      label: 'Total Talent',
      value: '12',
      icon: Users,
      color: 'text-blue-400',
      link: '/roster',
    },
    {
      label: 'Inquiry Baru',
      value: '3',
      icon: MessageSquare,
      color: 'text-amber-400',
      link: '/inbox',
    },
    {
      label: 'Total Pendapatan',
      value: 'Rp 125.5M',
      icon: CreditCard,
      color: 'text-green-400',
      link: '/finance',
    },
    {
      label: 'Growth Bulan Ini',
      value: '+12.5%',
      icon: TrendingUp,
      color: 'text-purple-400',
      link: '/finance',
    },
  ];

  const quickGuides = [
    { icon: '👥', label: 'Kelola Talent', link: '/roster' },
    { icon: '🆕', label: 'Tambah Talent', link: '/roster/new' },
    { icon: '📋', label: 'Lihat Inquiry', link: '/inbox' },
    { icon: '💰', label: 'Pantau Keuangan', link: '/finance' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">
          Selamat Datang, {user?.full_name || 'Agency'}!
        </h1>
        <p className="mt-1 text-sm text-amber-500/70">Kelola talent, inquiry, dan keuangan dengan mudah.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Link
              key={idx}
              to={stat.link}
              className="rounded-lg border border-amber-500/10 bg-gradient-to-br from-slate-950/60 to-slate-900/40 p-6 transition-colors hover:border-amber-500/30"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-400">{stat.label}</p>
                  <p className="mt-2 text-2xl font-black text-white">{stat.value}</p>
                </div>
                <Icon className={`h-8 w-8 ${stat.color} opacity-70`} />
              </div>
              <p className="text-xs font-semibold text-amber-500/70">→ Lihat detail</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-amber-500/10 bg-gradient-to-br from-slate-950/60 to-slate-900/40 p-6">
          <h2 className="mb-4 text-lg font-black uppercase tracking-wider text-amber-400">Aktivitas Terbaru</h2>
          <div className="space-y-3">
            {[
              { name: 'Inquiry dari PT Mitra Digital', time: '2 jam lalu', type: 'inquiry' },
              { name: 'Talent "Budi Santoso" profile approved', time: '5 jam lalu', type: 'approval' },
              { name: 'Pembayaran komisi diterima', time: '1 hari lalu', type: 'payment' },
            ].map((activity, idx) => (
              <div key={idx} className="flex items-start gap-3 rounded-lg border border-amber-500/5 bg-slate-950/40 p-3">
                <div
                  className={`mt-2 h-2 w-2 rounded-full ${
                    activity.type === 'inquiry' ? 'bg-blue-400' : activity.type === 'approval' ? 'bg-green-400' : 'bg-amber-400'
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{activity.name}</p>
                  <p className="text-xs text-slate-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-amber-500/10 bg-gradient-to-br from-slate-950/60 to-slate-900/40 p-6">
          <h2 className="mb-4 text-lg font-black uppercase tracking-wider text-amber-400">Panduan Cepat</h2>
          <div className="space-y-3">
            {quickGuides.map((guide, idx) => (
              <Link
                key={idx}
                to={guide.link}
                className="flex items-center gap-3 rounded-lg border border-amber-500/10 bg-slate-950/40 p-3 transition-colors hover:border-amber-500/30 hover:bg-amber-500/5"
              >
                <span className="text-2xl">{guide.icon}</span>
                <span className="flex-1 font-semibold text-white">{guide.label}</span>
                <span className="text-sm text-amber-500">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-500/20 to-amber-600/20 p-6">
        <h3 className="mb-2 text-lg font-black uppercase tracking-wider text-amber-400">Butuh Bantuan?</h3>
        <p className="mb-4 text-sm text-slate-300">Tim support kami tersedia 24/7 untuk membantu Anda.</p>
        <button className="rounded-lg bg-amber-500 px-6 py-2 text-sm font-black uppercase tracking-wider text-slate-950 transition-colors hover:bg-amber-600">
          Hubungi Support
        </button>
      </div>
    </div>
  );
}
