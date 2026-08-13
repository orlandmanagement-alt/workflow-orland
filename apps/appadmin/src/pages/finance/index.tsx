import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Wallet, TrendingUp, HandCoins, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

interface PayoutRequest {
  id: string;
  talentName: string;
  projectName: string;
  amount: number;
  bankDetail: string;
  status: 'pending' | 'paid';
  requestedAt: string;
}

export default function FinanceTreasury() {
  const [data, setData] = useState<{
      stats: { totalRevenue: number; netProfit: number; pendingPayouts: number };
      payouts: PayoutRequest[];
      chart: any[];
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchFinanceData = async () => {
      setLoading(true);
      try {
          const res = await api.get('/admin/financials', { withCredentials: true });
          if (res.data?.status === 'ok') {
              setData(res.data.data);
          }
      } catch (err: any) {
          console.error("Failed fetching financials:", err.message);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchFinanceData();
  }, []);

  const handleApprove = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm(`TANDA TANGAN OTORITAS: Setujui pencairan dana untuk Payout ${id}? Sistem akan menandai ini sebagai "Paid".`)) return;
    
    setActionLoading(id);
    try {
        const res = await api.patch(`/admin/financials/payouts/${id}/approve`, {}, { withCredentials: true });
        if (res.data?.status === 'ok') {
            setData(prev => {
                if(!prev) return prev;
                const newPayouts = prev.payouts.map(p => p.id === id ? { ...p, status: 'paid' as const } : p);
                return { ...prev, payouts: newPayouts };
            });
        }
    } catch(err: any) {
        alert("Gagal memproses pencairan: " + err.message);
    } finally {
        setActionLoading(null);
    }
  };

  const chartDataNormalized = data?.chart?.map(c => ({
      ...c,
      revenue: c.revenue / 1000000,
      profit: c.profit / 1000000
  })) || [];

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-start md:items-center">
         <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
               <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <Wallet size={20} />
               </div>
               Global Financial Treasury
            </h1>
            <p className="text-sm text-slate-500 mt-2 dark:text-slate-400">Arus Kas Agensi, Total Revenue, dan Antrean Pencairan Hak Talent</p>
         </div>
         <button onClick={fetchFinanceData} disabled={loading} className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm text-slate-700 dark:text-slate-200">
            {loading ? <Loader2 size={16} className="animate-spin text-emerald-500"/> : <RefreshCw size={16} className="text-slate-400" />}
            Resync
         </button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-[0_10px_30px_rgba(17,24,39,0.03)] relative overflow-hidden transition-transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-[80px] opacity-10"></div>
            <div className="flex items-center gap-4 mb-4 relative z-10">
               <span className="p-3 bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-xl"><TrendingUp size={24} /></span>
               <h3 className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[11px]">Total Revenue (Gross)</h3>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white flex items-baseline gap-2 relative z-10">
              <span className="text-lg text-slate-400">Rp</span>{((data?.stats.totalRevenue || 0) / 1000000).toLocaleString('id-ID')} <span className="text-lg text-slate-400">Jt</span>
            </p>
         </div>

         <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-[0_10px_30px_rgba(17,24,39,0.03)] relative overflow-hidden transition-transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500 rounded-full blur-[80px] opacity-10"></div>
            <div className="flex items-center gap-4 mb-4 relative z-10">
               <span className="p-3 bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 rounded-xl"><HandCoins size={24} /></span>
               <h3 className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[11px]">Pending Talent Payouts</h3>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white flex items-baseline gap-2 relative z-10">
               <span className="text-lg text-slate-400">Rp</span>{((data?.stats.pendingPayouts || 0) / 1000000).toLocaleString('id-ID')} <span className="text-lg text-amber-500">Jt</span>
            </p>
         </div>

         <div className="bg-slate-900 dark:bg-brand-600 border border-slate-800 dark:border-brand-500 p-6 rounded-3xl shadow-xl shadow-slate-900/20 dark:shadow-brand-500/30 relative overflow-hidden text-white transition-transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full blur-[80px] opacity-10"></div>
            <div className="flex items-center gap-4 mb-4 relative z-10">
               <span className="p-3 bg-white/10 text-white rounded-xl backdrop-blur-md"><Wallet size={24} /></span>
               <h3 className="font-bold text-slate-300 dark:text-brand-100 uppercase tracking-widest text-[11px]">Net Agency Profit (10%)</h3>
            </div>
            <p className="text-3xl font-black flex items-baseline gap-2 relative z-10 text-white">
              <span className="text-lg text-slate-400 dark:text-brand-200">Rp</span>{((data?.stats.netProfit || 0) / 1000000).toLocaleString('id-ID')} <span className="text-lg text-slate-400 dark:text-brand-200">Jt</span>
            </p>
         </div>
      </div>

      {/* CHART & TABLE SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         
         <div className="bg-white dark:bg-[#0b1626] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-[0_10px_30px_rgba(17,24,39,0.03)] flex flex-col min-h-[400px]">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6 uppercase tracking-widest text-[11px]">Cash Flow (In Millions)</h3>
            <div className="h-full min-h-[300px] w-full flex-1">
              {!loading && data ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={chartDataNormalized}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} vertical={false} />
                     <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '16px', color: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
                        itemStyle={{ fontWeight: 'black' }}
                     />
                     <Line type="monotone" dataKey="revenue" name="Gross Revenue" stroke="#3b82f6" strokeWidth={5} dot={{r:4, strokeWidth:2, fill: '#fff'}} activeDot={{r: 8}} />
                     <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#ef4444" strokeWidth={4} dot={{r:3}} />
                   </LineChart>
                 </ResponsiveContainer>
              ) : (
                 <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={32} /></div>
              )}
            </div>
         </div>

         <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-[0_10px_30px_rgba(17,24,39,0.03)] overflow-hidden flex flex-col h-[400px]">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#071122]/50">
               <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                 <AlertCircle className="text-amber-500" size={20} /> Antrean Pencairan Talent
               </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto relative bg-[#f8fafc] dark:bg-transparent">
               {loading && (
                   <div className="absolute inset-0 z-20 flex bg-white/50 backdrop-blur-sm dark:bg-slate-900/50 justify-center items-center">
                       <Loader2 className="animate-spin text-brand-500" size={32} />
                   </div>
               )}

               <table className="w-full text-left whitespace-nowrap text-sm">
                 <thead className="bg-[#f1f5f9] dark:bg-[#0a192f] sticky top-0 z-10">
                   <tr className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest border-b border-slate-200 dark:border-slate-800">
                     <th className="px-5 py-4">Req ID / Talent</th>
                     <th className="px-5 py-4 text-right">Nominal</th>
                     <th className="px-5 py-4 text-center">Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 bg-white dark:bg-transparent">
                    {data?.payouts.length === 0 && !loading && (
                        <tr>
                            <td colSpan={3} className="px-5 py-16 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                                Bebas Utang. Tidak ada tagihan pending.
                            </td>
                        </tr>
                    )}
                    {data?.payouts.map(p => (
                      <tr key={p.id} className={`transition-colors group ${p.status === 'paid' ? 'opacity-60 bg-slate-50 dark:bg-slate-800/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}>
                         <td className="px-5 py-4">
                            <p className={`font-black ${p.status === 'paid' ? 'text-slate-500' : 'text-slate-900 dark:text-white'}`}>{p.talentName}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{p.id} • {p.bankDetail}</p>
                            <p className={`text-[9px] mt-1 uppercase tracking-widest font-black border border-slate-200 dark:border-slate-700 w-max px-2 py-0.5 rounded-md ${p.status === 'paid' ? 'text-slate-400' : 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 border-brand-100'}`}>
                               {p.projectName}
                            </p>
                         </td>
                         <td className="px-5 py-4 text-right">
                           <span className={`font-black ${p.status === 'paid' ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>Rp {p.amount.toLocaleString('id-ID')}</span>
                         </td>
                         <td className="px-5 py-4 text-center">
                            {p.status === 'paid' ? (
                               <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-500/30"><CheckCircle2 size={12}/> Cleared</span>
                            ) : (
                               <button 
                                 onClick={(e) => handleApprove(p.id, e)} 
                                 disabled={actionLoading === p.id}
                                 className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-brand-600 dark:hover:bg-brand-500 px-5 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
                               >
                                  {actionLoading === p.id ? <Loader2 size={16} className="animate-spin" /> : 'Settle Funds'}
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
