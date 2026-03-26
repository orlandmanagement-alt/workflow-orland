import { FileSignature } from 'lucide-react';
export default function Contracts() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dokumen Legal & SPK</h1>
      <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center">
            <div className="h-12 w-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mr-4"><FileSignature size={24} /></div>
            <div>
                <h3 className="font-bold dark:text-white">Kontrak Eksklusif Tahunan Orland</h3>
                <p className="text-sm text-red-500 font-medium">Membutuhkan Tanda Tangan Anda</p>
            </div>
        </div>
        <button className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-sm">Tinjau PDF</button>
      </div>
    </div>
  )
}
