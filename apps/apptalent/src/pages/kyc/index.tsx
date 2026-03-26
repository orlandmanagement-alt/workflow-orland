import { ShieldAlert, CreditCard, ScanFace } from 'lucide-react';
export default function KYCVerification() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-3xl flex items-start">
        <ShieldAlert className="text-red-600 dark:text-red-400 mt-1 mr-4 shrink-0" size={28} />
        <div>
            <h2 className="text-xl font-bold text-red-800 dark:text-red-300">Akun Belum Terverifikasi (KYC)</h2>
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">Anda tidak dapat melamar proyek eksklusif atau menerima pembayaran sebelum menyelesaikan proses verifikasi identitas.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-brand-300 transition-colors cursor-pointer group">
            <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors"><CreditCard size={24} /></div>
            <h3 className="font-bold dark:text-white">1. Upload KTP / Paspor</h3>
            <p className="text-sm text-slate-500 mt-2">Pastikan foto jelas, tidak terpotong, dan tulisan dapat dibaca.</p>
        </div>
        <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-brand-300 transition-colors cursor-pointer group opacity-50">
            <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4"><ScanFace size={24} /></div>
            <h3 className="font-bold dark:text-white">2. Video Liveness (Selfie)</h3>
            <p className="text-sm text-slate-500 mt-2">Sistem akan meminta akses kamera untuk mencocokkan wajah Anda dengan KTP.</p>
        </div>
      </div>
    </div>
  )
}
