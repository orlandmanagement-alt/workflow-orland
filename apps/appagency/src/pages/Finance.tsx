import { useState } from 'react';
import { CreditCard, TrendingUp, Download, Filter, ArrowUpRight, ArrowDownLeft, Eye } from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  description: string;
  type: 'income' | 'expense';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  project?: string;
}

const mockTransactions: Transaction[] = [
  {
    id: 'TXN001',
    date: '2024-01-15',
    description: 'Pembayaran Project Brand Campaign',
    type: 'income',
    amount: 5000000,
    status: 'completed',
    project: 'Brand Campaign 2026',
  },
  {
    id: 'TXN002',
    date: '2024-01-14',
    description: 'Komisi Platform (2%)',
    type: 'expense',
    amount: 100000,
    status: 'completed',
  },
  {
    id: 'TXN003',
    date: '2024-01-13',
    description: 'Pembayaran TikTok Series',
    type: 'income',
    amount: 3500000,
    status: 'completed',
    project: 'TikTok Series',
  },
  {
    id: 'TXN004',
    date: '2024-01-12',
    description: 'Withdrawal ke Bank Account',
    type: 'expense',
    amount: 5500000,
    status: 'completed',
  },
];

const mockStats = [
  {
    label: 'Total Pendapatan',
    value: 'Rp 85.500.000',
    change: '+12.5%',
    icon: TrendingUp,
    color: 'text-green-400',
  },
  {
    label: 'Bulan Ini',
    value: 'Rp 8.500.000',
    change: '+5.2%',
    icon: CreditCard,
    color: 'text-amber-400',
  },
  {
    label: 'Tertunda',
    value: 'Rp 2.100.000',
    change: '2 projects',
    icon: ArrowUpRight,
    color: 'text-yellow-400',
  },
];

export default function Finance() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const statusColors = {
    completed: 'text-green-400 bg-green-500/10',
    pending: 'text-yellow-400 bg-yellow-500/10',
    failed: 'text-red-400 bg-red-500/10',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">
          Laporan Keuangan
        </h1>
        <p className="text-amber-500/70 text-sm mt-1">
          Pantau pendapatan, pengeluaran, dan transaksi kamu
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mockStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-gradient-to-br from-slate-950/60 to-slate-900/40 border border-amber-500/10 rounded-lg p-6 hover:border-amber-500/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-slate-400 text-sm font-semibold">{stat.label}</p>
                  <p className="text-white text-2xl font-black mt-2">{stat.value}</p>
                </div>
                <Icon className={`w-8 h-8 ${stat.color} opacity-70`} />
              </div>
              <p className={`text-xs font-semibold ${stat.color}`}>{stat.change}</p>
            </div>
          );
        })}
      </div>

      {/* Period Selector & Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2">
          {['week', 'month', 'year'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                selectedPeriod === period
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-950/40 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
              }`}
            >
              {period === 'week' ? 'Minggu' : period === 'month' ? 'Bulan' : 'Tahun'}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          <button className="px-4 py-2 bg-slate-950/40 border border-amber-500/20 rounded-lg text-amber-400 hover:bg-amber-500/20 transition-colors flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-400 hover:bg-amber-500/30 transition-colors flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        <h2 className="text-lg font-black text-amber-400 uppercase tracking-wider">Riwayat Transaksi</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {mockTransactions.map((txn) => (
            <div
              key={txn.id}
              className="bg-slate-950/40 border border-amber-500/10 rounded-lg p-4 hover:border-amber-500/30 transition-colors cursor-pointer"
              onClick={() => setSelectedTransaction(selectedTransaction === txn.id ? null : txn.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${txn.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    {txn.type === 'income' ? (
                      <ArrowDownLeft className="w-5 h-5 text-green-400" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">{txn.description}</p>
                    <p className="text-slate-400 text-xs">{new Date(txn.date).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black text-lg ${txn.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                    {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                  </p>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${statusColors[txn.status]}`}>
                    {txn.status === 'completed' ? 'Selesai' : txn.status === 'pending' ? 'Tertunda' : 'Gagal'}
                  </span>
                </div>
              </div>
              {selectedTransaction === txn.id && txn.project && (
                <div className="mt-3 pt-3 border-t border-amber-500/10 text-sm text-slate-300">
                  <p><span className="text-amber-400">Project:</span> {txn.project}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Invoice Section */}
      <div className="bg-slate-950/30 border border-amber-500/10 rounded-lg p-6">
        <h2 className="text-lg font-black text-amber-400 uppercase tracking-wider mb-4">Invoice Tertunda</h2>
        <div className="space-y-2">
          {[
            { no: 'INV-001', amount: 'Rp 2.000.000', due: '15 Januari 2024' },
            { no: 'INV-002', amount: 'Rp 100.000', due: '20 Januari 2024' },
          ].map((inv, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-950/40 rounded border border-amber-500/5">
              <div>
                <p className="text-white font-semibold">{inv.no}</p>
                <p className="text-slate-400 text-sm">Jatuh tempo: {inv.due}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-amber-400 font-black">{inv.amount}</p>
                <button className="p-2 hover:bg-amber-500/20 rounded-lg transition-colors">
                  <Eye className="w-4 h-4 text-amber-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
