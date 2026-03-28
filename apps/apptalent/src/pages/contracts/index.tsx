import { FileSignature } from 'lucide-react';
export default function Contracts() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dokumen Legal & SPK</h1>
      <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center">
            <div className="h-12 w-12 rounded-xl bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center mr-4 shrink-0">
                <FileSignature size={24} />
            </div>
            <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Kontrak Eksklusif Tahunan Orland</h3>
                <p className="text-sm text-red-500 dark:text-red-400 font-medium mt-0.5">Membutuhkan Tanda Tangan Anda</p>
            </div>
        </div>
        <button className="px-6 py-2.5 w-full sm:w-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-sm shadow-lg hover:scale-105 transition-transform">
            Tinjau PDF
        </button>
      </div>
    </div>
  )
}
