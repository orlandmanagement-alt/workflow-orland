import { Building2, Lock, Receipt } from 'lucide-react';
export default function Settings() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pengaturan Akun & Finansial</h1>
      <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
        <div className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
            <div className="flex items-center"><Building2 className="text-slate-400 mr-4" size={24} /><div><h3 className="font-bold dark:text-white">Rekening Bank Penerima</h3><p className="text-sm text-slate-500">BCA •••• 1234 a.n Endang Wira Surya</p></div></div>
            <button className="text-brand-600 font-bold text-sm">Ubah</button>
        </div>
        <div className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
            <div className="flex items-center"><Receipt className="text-slate-400 mr-4" size={24} /><div><h3 className="font-bold dark:text-white">Informasi Pajak (NPWP)</h3><p className="text-sm text-slate-500">Belum diatur. Honor akan dipotong pajak 20% lebih tinggi.</p></div></div>
            <button className="text-brand-600 font-bold text-sm">Upload NPWP</button>
        </div>
        <div className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
            <div className="flex items-center"><Lock className="text-slate-400 mr-4" size={24} /><div><h3 className="font-bold dark:text-white">Keamanan Akun</h3><p className="text-sm text-slate-500">Ubah password atau aktifkan Autentikasi 2 Langkah (2FA).</p></div></div>
            <button className="text-brand-600 font-bold text-sm">Kelola Keamanan</button>
        </div>
      </div>
    </div>
  )
}
