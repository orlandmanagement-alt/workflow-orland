// File: apps/apptalent/src/pages/earnings/index.tsx
// Purpose: Talent earnings dashboard with income tracking and payout history

import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';

type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface EarningRecord {
  id: string;
  projectTitle: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'approved';
  durationDays: number;
  clientName: string;
}

interface PayoutRecord {
  id: string;
  amount: number;
  date: string;
  status: PayoutStatus;
  bankAccount: string;
  referenceNumber: string;
}

export default function Earnings() {
  const [filter, setFilter] = useState<'all' | 'month' | 'year'>('month');
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data from API (currently with fallback mock data)
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);
  const [pendingPayment, setPendingPayment] = useState(0);
  const [completedPayouts, setCompletedPayouts] = useState(0);
  const [earningRecords, setEarningRecords] = useState<EarningRecord[]>([]);
  const [payoutRecords, setPayoutRecords] = useState<PayoutRecord[]>([]);

  useEffect(() => {
    fetchEarningsData();
  }, [selectedPeriod, filter]);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API endpoint when backend is ready
      const response = await api.get('/api/v1/earnings', {
        params: { period: filter, month: selectedPeriod }
      }).catch(err => {
        console.log('Earnings API not ready, using mock data');
        return { data: null };
      });

      if (response?.data) {
        setTotalEarnings(response.data.total_earnings || 0);
        setMonthlyEarnings(response.data.monthly_earnings || 0);
        setPendingPayment(response.data.pending_payment || 0);
        setCompletedPayouts(response.data.completed_payouts || 0);
        setEarningRecords(response.data.earning_records || []);
        setPayoutRecords(response.data.payout_records || []);
      } else {
        // Fallback mock data
        setTotalEarnings(125_500_000);
        setMonthlyEarnings(18_750_000);
        setPendingPayment(7_500_000);
        setCompletedPayouts(45_000_000);
        setEarningRecords([
          {
            id: '1',
            projectTitle: 'TVC Glow Soap - Main Role',
            amount: 15_000_000,
            date: '2024-04-10',
            status: 'completed',
            durationDays: 3,
            clientName: 'PT Glow Indonesia',
          },
          {
            id: '2',
            projectTitle: 'Fashion Show Modeling',
            amount: 3_750_000,
            date: '2024-04-08',
            status: 'completed',
            durationDays: 1,
            clientName: 'Fashion Capital Jakarta',
          },
          {
            id: '3',
            projectTitle: 'Social Media Content (5 reels)',
            amount: 5_000_000,
            date: '2024-04-05',
            status: 'pending',
            durationDays: 5,
            clientName: 'Brand X Influencer',
          },
        ]);
        setPayoutRecords([
          {
            id: 'p1',
            amount: 10_000_000,
            date: '2024-04-01',
            status: 'completed',
            bankAccount: '****1234',
            referenceNumber: 'TF-240401-001',
          },
        ]);
      }
      setError(null);
    } catch (err: any) {
      console.error('Error fetching earnings:', err);
      setError(err.message || 'Gagal memuat data earnings');
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      completed: 'Selesai',
      pending: 'Menunggu',
      approved: 'Disetujui',
      processing: 'Diproses',
      failed: 'Gagal',
    };
    return labels[status] || status;
  };

  if (loading && earningRecords.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-brand-600" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Pendapatan & Pembayaran
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
            Pantau pendapatan proyek & riwayat pembayaran Anda
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
          <Download size={18} />
          Export Laporan
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Earnings */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Total Pendapatan</h3>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            {formatCurrency(totalEarnings).split('.')[0]}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <TrendingUp size={14} className="text-green-600" />
            +12% dari bulan lalu
          </p>
        </div>

        {/* Monthly Earnings */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Bulan Ini</h3>
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            {formatCurrency(monthlyEarnings).split(' ')[0]}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">dari 2 proyek selesai</p>
        </div>

        {/* Pending Payment */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Menunggu Verifikasi</h3>
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            {formatCurrency(pendingPayment).split(' ')[0]}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">proses 2-3 hari kerja</p>
        </div>

        {/* Completed Payouts */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Sudah Ditransfer</h3>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            {formatCurrency(completedPayouts).split('.')[0]}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">dari 3 transfer sukses</p>
        </div>
      </div>

      {/* EARNINGS RECORDS */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Riwayat Pendapatan</h2>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'month' | 'year')}
              className="text-sm font-bold bg-transparent border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
            >
              <option value="all">Semua Waktu</option>
              <option value="month">Bulan Ini</option>
              <option value="year">Tahun Ini</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {earningRecords.map((record) => (
            <div
              key={record.id}
              className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between gap-4 cursor-pointer group"
            >
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {record.projectTitle}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {record.clientName} • {record.durationDays} hari
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{record.date}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {formatCurrency(record.amount)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(record.status)}
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                    {getStatusLabel(record.status)}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PAYOUT HISTORY */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Riwayat Penarikan Dana</h2>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {payoutRecords.map((record) => (
            <div
              key={record.id}
              className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between gap-4"
            >
              <div className="flex-1">
                <p className="font-bold text-slate-900 dark:text-white">{record.bankAccount}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Ref: {record.referenceNumber}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{record.date}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {formatCurrency(record.amount)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(record.status)}
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                    {getStatusLabel(record.status)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* INFO BOX */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
        <div className="flex gap-4">
          <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-1">Informasi Pembayaran</h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Dana akan ditransfer otomatis ke rekening bank Anda setelah proyek selesai dan diverifikasi klien (biasanya 2-3 hari kerja). Pastikan data rekening bank Anda sudah terverifikasi di pengaturan akun.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
