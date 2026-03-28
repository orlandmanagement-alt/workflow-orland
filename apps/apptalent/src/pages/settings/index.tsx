import { Building2, Lock, Receipt, ChevronRight, BellRing, QrCode } from 'lucide-react';
import { useAuthStore } from '@/store/useAppStore';
import { useState, useEffect } from 'react';

export default function Settings() {
  const user = useAuthStore((state) => state.user);
  const [pushStatus, setPushStatus] = useState<string>('default');

  useEffect(() => {
      if ('Notification' in window) setPushStatus(Notification.permission);
  }, []);

  const enableNotifications = async () => {
      if (!('Notification' in window)) return;
      const permission = await Notification.requestPermission();
      setPushStatus(permission);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pengaturan Akun & Keamanan</h1>
      
      <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
        
        {/* PUSH NOTIFICATIONS */}
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors gap-4">
            <div className="flex items-center">
                <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl flex items-center justify-center mr-4 shrink-0"><BellRing size={24} /></div>
                <div><h3 className="font-bold text-slate-900 dark:text-white">Notifikasi Real-Time (OS Push)</h3><p className="text-sm text-slate-500 dark:text-slate-400">Pemberitahuan pop-up instan saat ada tawaran atau pesan.</p></div>
            </div>
            <button onClick={enableNotifications} className={`font-bold text-sm px-5 py-2.5 rounded-xl ${pushStatus === 'granted' ? 'bg-green-100 text-green-700' : 'bg-slate-900 text-white shadow-lg'}`}>{pushStatus === 'granted' ? 'Aktif' : 'Aktifkan'}</button>
        </div>

        {/* KEAMANAN AKUN (UPGRADED: Menampilkan Detail Bank) */}
        <div className="p-6 flex flex-col hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                <div className="flex items-center">
                    <div className="h-12 w-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mr-4 shrink-0"><Lock size={24} /></div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">Keamanan & Data Autentikasi (SSO)</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Kelola login SSO, PIN Dompet, dan Sinkronisasi No Rekening Bank.</p>
                    </div>
                </div>
                <button className="flex items-center text-emerald-600 dark:text-emerald-400 font-bold text-sm group-hover:underline w-fit">Kelola <ChevronRight size={16} className="ml-1" /></button>
            </div>
            
            {/* Box Detail Bank di dalam kartu Keamanan (Visual) */}
            <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 ml-0 sm:ml-16 mt-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Building2 size={13}/> Rekening Bank Terkoneksi</p>
                <div className="flex justify-between items-center text-sm">
                    <div>
                        <p className="font-black text-slate-900 dark:text-white text-base tracking-tighter">BCA •••• 1234</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">a.n {user?.full_name || 'Endang Wira Surya'}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">Tersinkron SSO</span>
                </div>
            </div>
        </div>

        {/* INFORMASI PAJAK (Disederhanakan) */}
        <div className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30">
            <div className="flex items-center">
                <div className="h-12 w-12 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl flex items-center justify-center mr-4 shrink-0"><Receipt size={24} /></div>
                <div><h3 className="font-bold text-slate-900 dark:text-white">Informasi Pajak (NPWP)</h3><p className="text-sm text-slate-500 dark:text-slate-400">Belum diatur. Potongan honor 20% lebih tinggi.</p></div>
            </div>
            <button className="text-amber-600 font-bold text-sm">Upload <ChevronRight size={16} className="inline ml-1" /></button>
        </div>

      </div>
    </div>
  )
}
