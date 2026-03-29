import React, { useEffect, useState } from 'react';
import {
  Users, Briefcase, DollarSign, ShieldAlert, TrendingUp,
  Activity, Globe, AlertTriangle, CheckCircle2, Clock
} from 'lucide-react';
import { api } from '@/lib/api';

interface DashboardStats {
  total_users: number;
  total_talents: number;
  total_clients: number;
  active_projects: number;
  total_revenue: number;
  pending_payouts: number;
  open_disputes: number;
  kyc_pending: number;
  new_users_today: number;
  revenue_this_month: number;
}

const DEFAULT_STATS: DashboardStats = {
  total_users: 0, total_talents: 0, total_clients: 0,
  active_projects: 0, total_revenue: 0, pending_payouts: 0,
  open_disputes: 0, kyc_pending: 0, new_users_today: 0, revenue_this_month: 0,
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/stats/admin-dashboard');
        setStats({ ...DEFAULT_STATS, ...res.data?.data });
      } catch {
        // pakai default 0
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatIDR = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

  const PRIMARY_CARDS = [
    { label: 'Total User Terdaftar', value: stats.total_users.toLocaleString(), icon: Users, color: 'text-brand-400', bg: 'bg-brand-500/10 border-brand-500/20' },
    { label: 'Proyek Aktif', value: stats.active_projects.toLocaleString(), icon: Briefcase, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { label: 'Total Revenue (All Time)', value: formatIDR(stats.total_revenue), icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Dispute Terbuka', value: stats.open_disputes.toLocaleString(), icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  ];

  const SECONDARY_CARDS = [
    { label: 'Total Talent', value: stats.total_talents, icon: Activity },
    { label: 'Total Client', value: stats.total_clients, icon: Globe },
    { label: 'KYC Menunggu Review', value: stats.kyc_pending, icon: Clock },
    { label: 'User Baru Hari Ini', value: stats.new_users_today, icon: TrendingUp },
    { label: 'Payout Tertunda', value: formatIDR(stats.pending_payouts), icon: AlertTriangle },
    { label: 'Revenue Bulan Ini', value: formatIDR(stats.revenue_this_month), icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">God Mode Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          Orland Management — Ringkasan Ekosistem Real-Time
          {isLoading && <span className="ml-2 text-xs text-slate-600 animate-pulse">• memuat data...</span>}
        </p>
      </div>

      {/* Critical Alert Box */}
      {stats.open_disputes > 0 && (
        <div className="flex items-center gap-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
          <ShieldAlert size={20} className="text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-400">{stats.open_disputes} Dispute Memerlukan Perhatian</p>
            <p className="text-xs text-red-400/70">Resolusi segera diperlukan untuk menjaga reputasi platform.</p>
          </div>
          <a href="/admin/disputes" className="ml-auto text-xs font-bold text-red-400 hover:text-red-300 transition-colors whitespace-nowrap">
            Tangani →
          </a>
        </div>
      )}

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {PRIMARY_CARDS.map(card => (
          <div key={card.label} className={`border ${card.bg} rounded-2xl p-5 relative overflow-hidden`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{card.label}</p>
                <p className={`text-2xl font-black ${card.color} ${isLoading ? 'animate-pulse opacity-50' : ''}`}>
                  {isLoading ? '—' : card.value}
                </p>
              </div>
              <card.icon size={32} className={`${card.color} opacity-30`} />
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {SECONDARY_CARDS.map(card => (
          <div key={card.label} className="bg-white/5 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
              <card.icon size={18} className="text-slate-400" />
            </div>
            <div>
              <p className="text-xl font-black text-white">
                {isLoading ? '—' : (typeof card.value === 'number' ? card.value.toLocaleString() : card.value)}
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Navigation */}
      <div className="bg-white/5 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Kelola Users', href: '/admin/users', icon: Users },
            { label: 'Treasury', href: '/admin/finance', icon: DollarSign },
            { label: 'Proyek Overwatch', href: '/admin/projects', icon: Briefcase },
            { label: 'Dispute Center', href: '/admin/disputes', icon: ShieldAlert },
          ].map(action => (
            <a
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors text-center group"
            >
              <action.icon size={22} className="text-slate-400 group-hover:text-white transition-colors" />
              <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">{action.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
