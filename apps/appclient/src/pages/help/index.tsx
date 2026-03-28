import { useState } from 'react';
import { ShieldAlert, Send, FileWarning, HelpCircle } from 'lucide-react';

export default function DisputeCenter() {
  const [issue, setIssue] = useState('');

  const handleSubmit = (e: any) => {
    e.preventDefault();
    alert("Tiket Investigasi Berhasil Dibuat. Tim HR Orland akan segera menghubungi Anda.");
    setIssue('');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8 animate-in slide-in-from-bottom-5">
      <div className="text-center">
        <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Dispute Center</h1>
        <p className="text-slate-500 mt-2">Laporkan masalah talent di lapangan (Terlambat, Attitude, Pelanggaran Kontrak).</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pilih Project</label>
          <select className="w-full mt-2 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold">
            <option>TVC Ramadhan Glow Soap</option>
            <option>Film Action Garuda</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Kronologi Masalah</label>
          <textarea 
            rows={5} 
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            className="w-full mt-2 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-red-500 transition-all"
            placeholder="Jelaskan secara detail kejadian di lokasi syuting..."
          ></textarea>
        </div>
        <button type="submit" className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-lg shadow-red-500/20 transition-transform hover:scale-105 flex items-center justify-center gap-2">
          <FileWarning size={20}/> Kirim Laporan Investigasi
        </button>
      </form>
    </div>
  );
}
