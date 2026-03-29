import React, { useState, useEffect } from 'react';
import { TalentBalanceInfo, PayoutRequest } from '../../../../appclient/src/types/finance.types';
import { Wallet, ArrowDownToLine, Clock, CheckCircle2, History, Banknote } from 'lucide-react';

const mockBalance: TalentBalanceInfo = {
  total_balance: 14500000,
  pending_clearance: 5000000
};

const mockHistory: PayoutRequest[] = [
  { id: 'WD-001', amount: 3000000, status: 'transferred', requested_at: '2026-05-10T10:00:00Z', transferred_at: '2026-05-11T14:30:00Z' },
  { id: 'WD-002', amount: 5000000, status: 'requested', requested_at: '2026-06-01T08:00:00Z' }
];

export default function PayoutsHub() {
  const [balance, setBalance] = useState<TalentBalanceInfo>(mockBalance);
  const [history, setHistory] = useState<PayoutRequest[]>(mockHistory);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestAmount, setRequestAmount] = useState<number | ''>('');

  const handleRequestWithdraw = () => {
    if (!requestAmount || requestAmount > balance.total_balance || requestAmount < 100000) {
      alert('Minimal penarikan Rp 100.000 dan tidak melebihi saldo aktif.');
      return;
    }

    setIsRequesting(true);
    setTimeout(() => {
       setBalance(prev => ({ ...prev, total_balance: prev.total_balance - Number(requestAmount) }));
       setHistory(prev => [
         { id: `WD-00${prev.length + 1}`, amount: Number(requestAmount), status: 'requested', requested_at: new Date().toISOString() },
         ...prev
       ]);
       setRequestAmount('');
       setIsRequesting(false);
       alert('Permintaan pencairan dana berhasil dikirim! Dana akan ditransfer dalam 1x24 jam kerja.');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Kolom Saldo */}
        <div className="w-full md:w-1/3 space-y-4">
          
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-3xl shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500 rounded-full blur-[80px] opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity"></div>
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <span className="p-2 bg-white/10 rounded-xl backdrop-blur-sm text-brand-400">
                <Wallet size={20} />
              </span>
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Saldo Aktif</h2>
            </div>
            
            <div className="relative z-10">
              <p className="text-3xl font-black text-white flex items-center gap-2">
                <span className="text-slate-400 text-xl font-normal">Rp</span> 
                {balance.total_balance.toLocaleString()}
              </p>
              
              <div className="flex items-center gap-2 mt-4 text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full inline-flex">
                 <Clock size={12} /> + Rp {balance.pending_clearance.toLocaleString()} Pending Clearance
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Nominal Penarikan (Rp)</label>
              <input 
                type="number" 
                value={requestAmount}
                onChange={e => setRequestAmount(Number(e.target.value))}
                placeholder="0"
                className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xl font-black focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-white"
              />
            </div>
            <button 
              onClick={handleRequestWithdraw}
              disabled={isRequesting || !requestAmount || requestAmount > balance.total_balance}
              className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-xl shadow-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownToLine size={18} /> {isRequesting ? 'Memproses...' : 'Tarik Dana (Payout)'}
            </button>
            <p className="text-[10px] text-slate-400 text-center leading-relaxed font-medium">Dana akan masuk ke BCA A/C *5566 dalam 1x24 jam kerja. Bebas biaya admin.</p>
          </div>

        </div>

        {/* Kolom Riwayat */}
        <div className="w-full md:w-2/3 bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <span className="p-2 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 rounded-xl">
              <History size={20} />
            </span>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Riwayat Transaksi</h2>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
             {history.map(req => (
               <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors rounded-2xl border border-slate-200 dark:border-slate-800 gap-3">
                 <div className="flex items-center gap-4">
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${req.status === 'transferred' ? 'bg-green-100 text-green-600 dark:bg-green-500/20' : 'bg-amber-100 text-amber-600 dark:bg-amber-500/20'}`}>
                      {req.status === 'transferred' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                   </div>
                   <div>
                     <p className="font-bold text-slate-900 dark:text-white leading-tight">Payout Withdrawal</p>
                     <p className="text-[10px] text-slate-500 font-mono mt-1">{new Date(req.requested_at).toLocaleDateString()} • {req.id}</p>
                   </div>
                 </div>
                 <div className="text-left sm:text-right">
                    <p className="font-black text-slate-900 dark:text-white">- Rp {req.amount.toLocaleString()}</p>
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${req.status === 'transferred' ? 'text-green-500' : 'text-amber-500'}`}>
                      {req.status}
                    </span>
                 </div>
               </div>
             ))}

             {history.length === 0 && (
                <div className="h-40 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center">
                   <Banknote size={32} className="mb-2 opacity-50" />
                   <p className="text-sm font-bold">Belum Ada Transaksi</p>
                   <p className="text-xs">Riwayat pencairan dana Anda akan muncul di sini.</p>
                </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
}
