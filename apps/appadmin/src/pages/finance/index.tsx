import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Wallet, TrendingUp, HandCoins, CheckCircle2, AlertCircle } from 'lucide-react';

const MOCK_STATS = {
  totalRevenue: 1540000000,
  netProfit: 154000000,
  pendingPayouts: 42000000
};

const CHART_DATA = [
  { month: 'Jan', revenue: 150, profit: 15 },
  { month: 'Feb', revenue: 230, profit: 23 },
  { month: 'Mar', revenue: 180, profit: 18 },
  { month: 'Apr', revenue: 320, profit: 32 },
  { month: 'May', revenue: 290, profit: 29 },
  { month: 'Jun', revenue: 450, profit: 45 },
];

interface PayoutRequest {
  id: string;
  talentName: string;
  projectName: string;
  amount: number;
  bankDetail: string;
  status: 'pending' | 'paid';
  requestedAt: string;
}

const MOCK_PAYOUTS: PayoutRequest[] = [
  { id: 'WD-0992', talentName: 'Alina Kharisma', projectName: 'TVC Iklan Susu', amount: 15000000, bankDetail: 'BCA 1234567890 a.n Alina K', status: 'pending', requestedAt: '2026-06-15T10:00:00Z' },
  { id: 'WD-0993', talentName: 'Bima Satria', projectName: 'Event Music Fest', amount: 3000000, bankDetail: 'Mandiri 0987654321 a.n Bima S', status: 'pending', requestedAt: '2026-06-16T14:30:00Z' },
  { id: 'WD-0991', talentName: 'Kevin Pratama', projectName: 'Campaign TikTok Kemerdekaan', amount: 8000000, bankDetail: 'BRI 555666777 a.n Kevin P', status: 'paid', requestedAt: '2026-06-10T09:00:00Z' }
];

export default function FinanceTreasury() {
  const [payouts, setPayouts] = useState<PayoutRequest[]>(MOCK_PAYOUTS);

  const handleApprove = (id: string) => {
    if (confirm(`Approve Payout ${id}? Pastikan dana telah dipindahkan ke rekening Talent.`)) {
      setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: 'paid' } : p));
    }
  };

  return (
    <div className="space-y-6">
      
      <div>
         <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <Wallet className="text-brand-500" /> Global Financial Treasury
         </h1>
         <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">Arus Kas Agensi, Total Revenue, dan Antrean Pembayaran Talent</p>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500 rounded-full blur-[80px] opacity-10"></div>
            <div className="flex items-center gap-4 mb-4 relative z-10">
               <span className="p-3 bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400 rounded-xl"><TrendingUp size={24} /></span>
               <h3 className="font-bold text-slate-500 dark:text-slate-400">Total Revenue (Gross)</h3>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white flex items-baseline gap-2 relative z-10">
              <span className="text-lg text-slate-400">Rp</span>{(MOCK_STATS.totalRevenue / 1000000).toFixed(0)} <span className="text-lg text-slate-400">Juta</span>
            </p>
         </div>

         <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500 rounded-full blur-[80px] opacity-10"></div>
            <div className="flex items-center gap-4 mb-4 relative z-10">
               <span className="p-3 bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 rounded-xl"><HandCoins size={24} /></span>
               <h3 className="font-bold text-slate-500 dark:text-slate-400">Pending Talent Payouts</h3>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white flex items-baseline gap-2 relative z-10">
              <span className="text-lg text-slate-400">Rp</span>{(MOCK_STATS.pendingPayouts / 1000000).toFixed(0)} <span className="text-lg text-slate-400">Juta</span>
            </p>
         </div>

         <div className="bg-brand-600 border border-brand-500 p-6 rounded-3xl shadow-lg shadow-brand-500/20 relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-[80px] opacity-20"></div>
            <div className="flex items-center gap-4 mb-4 relative z-10">
               <span className="p-3 bg-white/20 text-white rounded-xl"><Wallet size={24} /></span>
               <h3 className="font-bold text-brand-100">Net Agency Profit (10%)</h3>
            </div>
            <p className="text-3xl font-black flex items-baseline gap-2 relative z-10 text-white">
              <span className="text-lg text-brand-200">Rp</span>{(MOCK_STATS.netProfit / 1000000).toFixed(0)} <span className="text-lg text-brand-200">Juta</span>
            </p>
         </div>
      </div>

      {/* CHART & TABLE SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         
         <div className="bg-white dark:bg-[#0b1626] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Cash Flow Projection (in Millions)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={CHART_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} />
                  <Tooltip 
                     contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                     itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="revenue" name="Gross Revenue" stroke="#3b82f6" strokeWidth={4} dot={{r:4, strokeWidth:2}} activeDot={{r: 8}} />
                  <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#ef4444" strokeWidth={3} dot={{r:3}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col h-[400px]">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#071122]">
               <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                 <AlertCircle className="text-amber-500" size={20} /> Antrean Pencairan Talent
               </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto">
               <table className="w-full text-left whitespace-nowrap text-sm">
                 <thead className="bg-slate-50/50 dark:bg-[#0a192f] sticky top-0 z-10 backdrop-blur-sm">
                   <tr className="text-[10px] uppercase font-black text-slate-500 dark:text-slate-400">
                     <th className="px-5 py-3">Req ID / Talent</th>
                     <th className="px-5 py-3 text-right">Nominal</th>
                     <th className="px-5 py-3 text-center">Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {payouts.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                         <td className="px-5 py-4">
                            <p className="font-bold text-slate-900 dark:text-white">{p.talentName}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{p.id} • {p.bankDetail}</p>
                            <p className="text-[10px] text-brand-600 dark:text-brand-400 mt-1 uppercase tracking-widest">{p.projectName}</p>
                         </td>
                         <td className="px-5 py-4 text-right">
                           <span className="font-black text-slate-900 dark:text-white">Rp {p.amount.toLocaleString()}</span>
                         </td>
                         <td className="px-5 py-4 text-center">
                            {p.status === 'paid' ? (
                               <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 px-3 py-1 rounded-full text-[10px] font-black uppercase"><CheckCircle2 size={12}/> Cleared</span>
                            ) : (
                               <button onClick={() => handleApprove(p.id)} className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-brand-600 dark:hover:bg-brand-700 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md">
                                  Approve Transfer
                               </button>
                            )}
                         </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
            </div>
         </div>

      </div>

    </div>
  );
}
