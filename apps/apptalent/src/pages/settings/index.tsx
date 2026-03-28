import { Building2, Lock, Receipt, ChevronRight, BellRing } from 'lucide-react';
import { useAuthStore } from '@/store/useAppStore';
import { useState, useEffect } from 'react';

export default function Settings() {
  const user = useAuthStore((state) => state.user);
  const [pushStatus, setPushStatus] = useState<string>('default');

  useEffect(() => {
      if ('Notification' in window) {
          setPushStatus(Notification.permission);
      } else {
          setPushStatus('unsupported');
      }
  }, []);

  const enableNotifications = async () => {
      if (!('Notification' in window)) return alert('Browser HP Anda tidak mendukung Web Push Notifications.');
      
      const permission = await Notification.requestPermission();
      setPushStatus(permission);

      if (permission === 'granted') {
          new Notification('Orland Management', {
              body: 'Hebat! Notifikasi Real-Time berhasil diaktifkan. Anda tidak akan ketinggalan info casting lagi.',
          });
      } else {
          alert('Izin notifikasi ditolak. Anda bisa mengubahnya di pengaturan browser.');
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pengaturan Akun & Sistem</h1>
      
      <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
        
        {/* PUSH NOTIFICATIONS (FITUR BARU) */}
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group gap-4">
            <div className="flex items-start sm:items-center">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center mr-4 shrink-0 ${pushStatus === 'granted' ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}>
                    <BellRing size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Notifikasi Real-Time (OS Push)</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Dapatkan pemberitahuan pop-up instan saat ada tawaran casting atau pesan sutradara.</p>
                </div>
            </div>
            <button 
                onClick={enableNotifications}
                disabled={pushStatus === 'granted' || pushStatus === 'unsupported'}
                className={`flex items-center font-bold text-sm px-5 py-2.5 rounded-xl transition-all w-fit ${pushStatus === 'granted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 cursor-not-allowed' : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:scale-105 shadow-lg'}`}
            >
                {pushStatus === 'granted' ? 'Aktif' : pushStatus === 'denied' ? 'Ditolak Browser' : 'Aktifkan'} 
            </button>
        </div>

        {/* REKENING BANK */}
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group gap-4">
            <div className="flex items-start sm:items-center">
                <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mr-4 shrink-0"><Building2 size={24} /></div>
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Rekening Bank Penerima</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">BCA •••• 1234 a.n {user?.full_name || 'Talent'}</p>
                </div>
            </div>
            <button className="flex items-center text-brand-600 dark:text-brand-400 font-bold text-sm group-hover:underline w-fit">Ubah Data <ChevronRight size={16} className="ml-1" /></button>
        </div>

        {/* INFORMASI PAJAK */}
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group gap-4">
            <div className="flex items-start sm:items-center">
                <div className="h-12 w-12 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 rounded-xl flex items-center justify-center mr-4 shrink-0"><Receipt size={24} /></div>
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Informasi Pajak (NPWP)</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 max-w-sm">Belum diatur. Honor akan dipotong pajak 20% lebih tinggi jika tanpa NPWP.</p>
                </div>
            </div>
            <button className="flex items-center text-brand-600 dark:text-brand-400 font-bold text-sm group-hover:underline w-fit">Upload NPWP <ChevronRight size={16} className="ml-1" /></button>
        </div>

        {/* KEAMANAN AKUN */}
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group gap-4">
            <div className="flex items-start sm:items-center">
                <div className="h-12 w-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mr-4 shrink-0"><Lock size={24} /></div>
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Keamanan Akun (SSO)</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Ubah password atau aktifkan Autentikasi 2 Langkah (2FA).</p>
                </div>
            </div>
            <button className="flex items-center text-brand-600 dark:text-brand-400 font-bold text-sm group-hover:underline w-fit">Kelola Keamanan <ChevronRight size={16} className="ml-1" /></button>
        </div>

      </div>
    </div>
  )
}
