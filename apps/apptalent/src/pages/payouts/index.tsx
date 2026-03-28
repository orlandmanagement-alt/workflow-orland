import { Wallet, ArrowUpRight, ArrowDownLeft, CreditCard, Loader2, ShieldCheck, Mail, X, Building2 } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/useAppStore';
import axios from 'axios';

export default function Payouts() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1';
  
  // State Dompet
  const [hasBankAccount, setHasBankAccount] = useState(false); 
  const [showSetupModal, setShowSetupModal] = useState(false);
  
  // State Form Bank
  const [bankName, setBankName] = useState('BCA');
  const [accountNumber, setAccountNumber] = useState('');
  
  // State Proses Setup
  const [step, setStep] = useState<'setup' | 'otp' | 'success'>('setup');
  const [isProcessing, setIsProcessing] = useState(false);

  // Saat Tarik Dana Ditekan
  const handleWithdrawClick = async () => {
      if (!hasBankAccount) {
          setShowSetupModal(true);
          setStep('setup');
      } else {
          try {
              await axios.post(`${API_URL}/payouts`, {
                  talent_id: user?.id,
                  booking_id: 'ALL',
                  amount: 12500000
              }, { headers: { Authorization: `Bearer ${token}` } });
              alert('Permintaan pencairan dana berhasil dikirim ke tim Finance Orland.');
          } catch(err) {
              alert('Gagal meminta pencairan dana.');
          }
      }
  }

  const simulateProcess = async (nextStep: any) => {
      setIsProcessing(true);
      try {
          if (step === 'setup') {
              // Simulate OTP sending
              setTimeout(() => { setIsProcessing(false); setStep('otp'); }, 1000);
          } else if (step === 'otp') {
              // Simpan rekening ke API asli
              await axios.post(`${API_URL}/talents/${user?.id}/bank-accounts`, {
                  bank_name: bankName,
                  account_number: accountNumber,
                  account_name: user?.full_name || 'TALENT'
              }, { headers: { Authorization: `Bearer ${token}` } });
              setIsProcessing(false);
              setStep('success');
          }
      } catch (err) {
          setIsProcessing(false);
          alert("Gagal menghubungi server");
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dompet Pendapatan</h1>
      
      {/* THE BLACK CARD WALLET (SELALU TAMPIL) */}
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
                onClick={handleWithdrawClick}
                className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.4)] flex items-center justify-center transition-all"
            >
                <Wallet size={18} className="mr-2"/> Tarik Dana
            </button>
        </div>
      </div>

      {/* TRANSACTION HISTORY (SELALU TAMPIL) */}
      <h3 className="font-bold text-lg dark:text-white mt-8 mb-4">Riwayat Transaksi</h3>
      <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {/* Transaksi 1 */}
            <div className="p-5 sm:p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center shrink-0"><ArrowDownLeft size={24} /></div>
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">Honor: TVC Tokopedia</h4>
                        <p className="text-xs text-slate-500 mt-0.5">25 Mar 2026 • Via Orland Pay</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-black text-green-600">+ Rp 8.000.000</p>
                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block">Selesai</span>
                </div>
            </div>
            {/* Transaksi 2 */}
            <div className="p-5 sm:p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center shrink-0"><ArrowDownLeft size={24} /></div>
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">Honor: Film Layar Lebar</h4>
                        <p className="text-xs text-slate-500 mt-0.5">10 Mar 2026 • MD Entertainment</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-black text-green-600">+ Rp 4.500.000</p>
                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block">Selesai</span>
                </div>
            </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* MODAL SETUP REKENING & PIN (JIKA BELUM ADA BANK)     */}
      {/* ================================================== */}
      {showSetupModal && (
          <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-3xl shadow-2xl relative overflow-hidden border border-slate-200 dark:border-slate-800">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 to-brand-600"></div>
                  
                  {/* Tombol Close */}
                  <button onClick={() => setShowSetupModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                      <X size={24} />
                  </button>

                  <div className="p-8">
                      {step === 'setup' && (
                          <div className="animate-in slide-in-from-right text-left space-y-4 pt-2">
                              <h3 className="text-xl font-black dark:text-white mb-2">Setup Keamanan Penarikan</h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Hubungkan rekening bank dan buat 6-Digit PIN demi keamanan dana Anda.</p>
                              
                              <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Nama Bank</label>
                                <select value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full mt-1 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white">
                                  <option value="BCA">BCA</option>
                                  <option value="Mandiri">Mandiri</option>
                                  <option value="BRI">BRI</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Nomor Rekening</label>
                                <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} type="number" placeholder="Contoh: 8736152..." className="w-full mt-1 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white" />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Buat 6-Digit PIN</label>
                                <input type="password" maxLength={6} placeholder="••••••" className="w-full mt-1 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white text-center text-xl tracking-[1em]" />
                              </div>
                              
                              <button onClick={() => simulateProcess('otp')} disabled={isProcessing} className="w-full mt-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl flex items-center justify-center hover:scale-105 transition-transform">
                                  {isProcessing ? <Loader2 className="animate-spin" size={20}/> : 'Lanjut Verifikasi Email'}
                              </button>
                          </div>
                      )}

                      {step === 'otp' && (
                          <div className="animate-in slide-in-from-right text-center space-y-4 pt-4">
                              <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-2"><Mail size={30}/></div>
                              <h3 className="text-xl font-black dark:text-white">Cek Email Anda</h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Kami telah mengirimkan 4 digit kode OTP (via Resend) ke email:<br/><b className="text-slate-900 dark:text-white">{user?.email || 'email-anda@gmail.com'}</b></p>
                              
                              <input type="number" placeholder="0 0 0 0" className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white text-center text-3xl tracking-[0.5em] font-mono mb-4" />
                              
                              <button onClick={() => simulateProcess('success')} disabled={isProcessing} className="w-full py-4 bg-brand-600 text-white font-bold rounded-xl flex items-center justify-center hover:bg-brand-700 transition-colors shadow-lg">
                                  {isProcessing ? <Loader2 className="animate-spin" size={20}/> : 'Verifikasi OTP & Simpan'}
                              </button>
                          </div>
                      )}

                      {step === 'success' && (
                          <div className="animate-in zoom-in-95 text-center pt-4">
                              <div className="h-20 w-20 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6"><ShieldCheck size={40}/></div>
                              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Tersimpan!</h2>
                              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">Rekening bank dan PIN keamanan berhasil dikunci dengan identitas Anda.</p>
                              <button onClick={() => {setHasBankAccount(true); setShowSetupModal(false);}} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl shadow-lg transition-colors">Tutup & Lanjutkan Penarikan</button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}
