import { LifeBuoy, AlertTriangle } from 'lucide-react';
export default function Helpdesk() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pusat Bantuan Orland</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-brand-600 to-indigo-700 p-8 rounded-3xl shadow-lg text-white">
            <LifeBuoy size={40} className="mb-4 opacity-80" />
            <h2 className="text-2xl font-bold mb-2">Butuh Bantuan Teknis?</h2>
            <p className="text-brand-100 text-sm mb-6">Tim support kami siap membantu masalah aplikasi, profil, atau pembayaran Anda.</p>
            <button className="bg-white text-brand-700 font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-colors">Buat Tiket Baru</button>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-8 rounded-3xl flex flex-col justify-center">
            <AlertTriangle size={32} className="text-red-500 mb-3" />
            <h3 className="font-bold text-red-800 dark:text-red-300">Laporan Darurat (Sengketa)</h3>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1 mb-4">Gunakan ini HANYA jika terjadi pelanggaran kontrak, pelecehan, atau masalah fatal di lokasi syuting.</p>
            <button className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm w-fit transition-colors">Lapor Masalah Darurat</button>
        </div>
      </div>
    </div>
  )
}
