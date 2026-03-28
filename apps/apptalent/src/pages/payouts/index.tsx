import { Wallet, Building2, CreditCard, Loader2, ShieldCheck, Mail } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/useAppStore';

export default function Payouts() {
  const user = useAuthStore((state) => state.user);
  const [hasBankAccount, setHasBankAccount] = useState(false); // Simulasi: belum punya rekening
  const [step, setStep] = useState<'info' | 'setup' | 'otp' | 'success'>('info');
  const [isProcessing, setIsProcessing] = useState(false);

  const simulateProcess = (nextStep: any) => {
      setIsProcessing(true);
      setTimeout(() => { setIsProcessing(false); setStep(nextStep); }, 1500);
  };

  if (!hasBankAccount) {
      return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10 max-w-lg mx-auto mt-10">
            <div className="bg-white dark:bg-dark-card rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 to-amber-400"></div>
                
                {step === 'info' && (
                    <div className="animate-in zoom-in-95">
                        <div className="h-20 w-20 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6"><Wallet size={40}/></div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Dompet Terkunci</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">Anda harus menghubungkan rekening bank dan membuat PIN keamanan sebelum dapat menerima honor atau mencairkan dana.</p>
                        <button onClick={() => setStep('setup')} className="w-full py-4 bg-brand-600 text-white font-bold rounded-xl shadow-lg hover:bg-brand-700 transition-colors">Setup Rekening & PIN Sekarang</button>
                    </div>
                )}

                {step === 'setup' && (
                    <div className="animate-in slide-in-from-right text-left space-y-4">
                        <h3 className="text-lg font-bold dark:text-white mb-4">Informasi Bank & Keamanan</h3>
                        <div><label className="text-xs font-bold text-slate-500 uppercase">Nama Bank</label><select className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"><option>BCA</option><option>Mandiri</option><option>BRI</option></select></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase">Nomor Rekening</label><input type="number" placeholder="Contoh: 8736152..." className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white" /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase">Buat 6-Digit PIN Penarikan</label><input type="password" maxLength={6} placeholder="••••••" className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white text-center text-xl tracking-[1em]" /></div>
                        <button onClick={() => simulateProcess('otp')} disabled={isProcessing} className="w-full mt-4 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl flex items-center justify-center">
                            {isProcessing ? <Loader2 className="animate-spin" size={20}/> : 'Lanjut Verifikasi OTP'}
                        </button>
                    </div>
                )}

                {step === 'otp' && (
                    <div className="animate-in slide-in-from-right text-center space-y-4">
                        <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-2"><Mail size={30}/></div>
                        <h3 className="text-lg font-bold dark:text-white">Cek Email Anda</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Kami telah mengirimkan 4 digit kode OTP (via Resend) ke email <b>{user?.email || 'email@anda.com'}</b>.</p>
                        <input type="number" placeholder="0 0 0 0" className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white text-center text-3xl tracking-[0.5em] font-mono mb-4" />
                        <button onClick={() => simulateProcess('success')} disabled={isProcessing} className="w-full py-3.5 bg-brand-600 text-white font-bold rounded-xl flex items-center justify-center">
                            {isProcessing ? <Loader2 className="animate-spin" size={20}/> : 'Verifikasi & Simpan'}
                        </button>
                    </div>
                )}

                {step === 'success' && (
                    <div className="animate-in zoom-in-95">
                        <div className="h-20 w-20 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6"><ShieldCheck size={40}/></div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Dompet Aktif!</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">Rekening bank dan PIN keamanan berhasil dipasang. Anda sekarang siap menerima honor proyek.</p>
                        <button onClick={() => setHasBankAccount(true)} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl shadow-lg transition-colors">Masuk ke Dashboard Keuangan</button>
                    </div>
                )}
            </div>
        </div>
      );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dompet Pendapatan</h1>
      {/* KODE DASHBOARD BLACK CARD YANG SUDAH KITA BUAT SEBELUMNYA AKAN TAMPIL DI SINI JIKA HASBANKACCOUNT = TRUE */}
      <div className="p-10 text-center font-bold text-brand-500">Mode Black Card Aktif! (Tarik Dana membutuhkan PIN).</div>
    </div>
  );
}
