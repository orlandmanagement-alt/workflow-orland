import { Wallet, ArrowUpRight, ArrowDownLeft, Building2, Receipt, CreditCard, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/useAppStore';

export default function Payouts() {
  const user = useAuthStore((state) => state.user);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleWithdraw = () => {
      setIsWithdrawing(true);
      setTimeout(() => {
          setIsWithdrawing(false);
          alert('Permintaan pencairan dana berhasil dikirim ke tim Finance Orland. Dana akan masuk ke rekening Anda dalam 1x24 Jam kerja.');
      }, 1500);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dompet Pendapatan</h1>
      
      {/* THE BLACK CARD WALLET */}
      <div className="bg-gradient-to-tr from-slate-900 via-slate-800 to-black p-8 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden border border-slate-700/50">
        <div className="absolute top-0 right-0 p-8 opacity-5"><CreditCard size={200} /></div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-brand-500/20 rounded-full blur-[80px]"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
                <div className="flex items-center gap-2 mb-6">
                    <span className="bg-gradient-to-r from-amber-200 to-amber-500 text-transparent bg-clip-text font-black tracking-widest uppercase text-xs">Orland VIP Card</span>
                </div>
                <p className="text-slate-400 text-sm font-medium mb-1">Total Saldo Tersedia</p>
                <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tighter">Rp 12.500.000</h2>
                <p className="text-slate-500 text-xs mt-2 font-mono">{user?.full_name?.toUpperCase() || 'TALENT'} • ORLAND MANAGEMENT</p>
            </div>
            <button 
                onClick={handleWithdraw} disabled={isWithdrawing}
                className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.4)] flex items-center justify-center transition-all disabled:opacity-70"
            >
                {isWithdrawing ? <><Loader2 size={18} className="animate-spin mr-2"/> Memproses...</> : <><Wallet size={18} className="mr-2"/> Tarik Dana</>}
            </button>
        </div>
      </div>

      {/* TRANSACTION HISTORY */}
      <h3 className="font-bold text-lg dark:text-white mt-8 mb-4">Riwayat Transaksi</h3>
      <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            
            {/* Transaksi 1 */}
            <div className="p-5 sm:p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0"><ArrowDownLeft size={24} /></div>
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">Honor: TVC Tokopedia</h4>
                        <p className="text-xs text-slate-500 mt-0.5">25 Mar 2026 • Via Orland Pay</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-black text-green-600 dark:text-green-400">+ Rp 8.000.000</p>
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block">Selesai</span>
                </div>
            </div>

            {/* Transaksi 2 */}
            <div className="p-5 sm:p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0"><ArrowDownLeft size={24} /></div>
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">Honor: Film Layar Lebar</h4>
                        <p className="text-xs text-slate-500 mt-0.5">10 Mar 2026 • MD Entertainment</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-black text-green-600 dark:text-green-400">+ Rp 4.500.000</p>
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block">Selesai</span>
                </div>
            </div>

            {/* Transaksi 3 (Penarikan) */}
            <div className="p-5 sm:p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0"><ArrowUpRight size={24} /></div>
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">Penarikan ke BCA</h4>
                        <p className="text-xs text-slate-500 mt-0.5">01 Mar 2026 • Berhasil</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-black text-slate-900 dark:text-white">- Rp 5.000.000</p>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
