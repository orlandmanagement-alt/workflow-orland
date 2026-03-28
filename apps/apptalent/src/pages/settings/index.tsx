import { Building2, Lock, Receipt, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/useAppStore';

export default function Settings() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pengaturan Akun & Finansial</h1>
      
      <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
        
        {/* REKENING BANK */}
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group gap-4">
            <div className="flex items-start sm:items-center">
                <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mr-4 shrink-0">
                    <Building2 size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Rekening Bank Penerima</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">BCA •••• 1234 a.n {user?.full_name || 'Talent'}</p>
                </div>
            </div>
            <button className="flex items-center text-brand-600 dark:text-brand-400 font-bold text-sm group-hover:underline w-fit">
                Ubah Data <ChevronRight size={16} className="ml-1" />
            </button>
        </div>

        {/* INFORMASI PAJAK */}
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group gap-4">
            <div className="flex items-start sm:items-center">
                <div className="h-12 w-12 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 rounded-xl flex items-center justify-center mr-4 shrink-0">
                    <Receipt size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Informasi Pajak (NPWP)</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 max-w-sm">Belum diatur. Sesuai regulasi, honor Anda akan dipotong pajak 20% lebih tinggi jika tanpa NPWP.</p>
                </div>
            </div>
            <button className="flex items-center text-brand-600 dark:text-brand-400 font-bold text-sm group-hover:underline w-fit">
                Upload NPWP <ChevronRight size={16} className="ml-1" />
            </button>
        </div>

        {/* KEAMANAN AKUN */}
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group gap-4">
            <div className="flex items-start sm:items-center">
                <div className="h-12 w-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mr-4 shrink-0">
                    <Lock size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Keamanan Akun (SSO)</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Ubah password atau aktifkan Autentikasi 2 Langkah (2FA).</p>
                </div>
            </div>
            <button className="flex items-center text-brand-600 dark:text-brand-400 font-bold text-sm group-hover:underline w-fit">
                Kelola Keamanan <ChevronRight size={16} className="ml-1" />
            </button>
        </div>

      </div>
    </div>
  )
}
