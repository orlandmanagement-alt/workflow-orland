import { Package, Clock, User, ArrowRight } from 'lucide-react';

export default function InventoryTracker() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 sm:px-6 mt-6 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2"><Package className="text-brand-500" size={24}/> Asset Tracker</h1>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black text-slate-500 uppercase">
            <tr>
              <th className="p-4 pl-6">Item / Aset</th>
              <th className="p-4">Peminjam (Talent)</th>
              <th className="p-4">Tanggal Pinjam</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            <tr className="text-sm">
              <td className="p-4 pl-6 font-bold dark:text-white text-slate-900">Kostum Pejuang (Set A)</td>
              <td className="p-4 flex items-center gap-2 text-slate-600 dark:text-slate-400"><User size={14}/> Budi Santoso</td>
              <td className="p-4 text-slate-500 flex items-center gap-1"><Clock size={14}/> 28 Mar 2026</td>
              <td className="p-4"><span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-[10px] font-bold">In-Use</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
