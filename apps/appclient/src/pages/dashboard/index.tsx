import { useState } from 'react';
import { AlertTriangle, Wallet, Briefcase, Users, CheckCircle, Clock, ArrowRight, PlayCircle, FileText, ChevronRight } from 'lucide-react';

// Simulasi Data Tugas (Pending Approvals)
const PENDING_TASKS = [
  { id: 1, type: 'kol_draft', project: 'Campaign Ramadhan TVC', talent: 'Sarah (KOL)', action: 'Review Video Draft', time: '2 jam lalu', status: 'Urgent' },
  { id: 2, type: 'selftape', project: 'Film Action 2027', talent: 'Budi Santoso', action: 'Approve Casting', time: '5 jam lalu', status: 'Normal' },
  { id: 3, type: 'invoice', project: 'Photoshoot Brand X', talent: 'Finance Orland', action: 'Bayar Tagihan', time: '1 hari lalu', status: 'Warning' },
];

export default function ClientDashboard() {
  const [isEscrowLow] = useState(true); // Simulasi saldo Escrow menipis

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      
      {/* HEADER COMMAND CENTER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Command Center</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Ringkasan performa proyek dan pengeluaran budget Anda.</p>
          </div>
          <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold px-6 py-2.5 rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center">
              + Quick Create Project
          </button>
      </div>

      {/* ALERT ESCROW (CALL TO ACTION) */}
      {isEscrowLow && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-800 rounded-full text-red-600 dark:text-red-300 shrink-0"><AlertTriangle size={20} /></div>
                  <div>
                      <h3 className="font-bold text-red-900 dark:text-red-400">Peringatan Saldo Escrow!</h3>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-0.5">Saldo aman (Escrow) Anda tersisa Rp 5.000.000. Beberapa proyek aktif mungkin tertunda jika saldo tidak mencukupi untuk pembayaran talent berikutnya.</p>
                  </div>
              </div>
              <button className="w-full sm:w-auto whitespace-nowrap px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-colors">
                  Top-Up Escrow
              </button>
          </div>
      )}

      {/* METRIK UTAMA (STATS GRID) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stat 1: Burn Rate */}
          <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center"><Wallet size={24}/></div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Burn Rate</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-1">Rp 450 Jt</h2>
              <p className="text-sm text-slate-500 mb-4">Dari total alokasi Rp 500 Jt</p>
              
              {/* Visualisasi Burn Rate Bar */}
              <div className="relative h-24 w-24 mx-auto mb-4">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" />
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset="25" className="text-red-500" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-black text-xl">90%</div>
              </div>
              <div className="mt-auto">
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-red-500">90% Terpakai</span>
                      <span className="text-slate-400">Sisa 10%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-400 to-red-500 w-[90%] rounded-full"></div>
                  </div>
              </div>
          </div>

          {/* Stat 2: Active Projects */}
          <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center"><Briefcase size={24}/></div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Proyek Aktif</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-1">12 Campaign</h2>
              <p className="text-sm text-slate-500 mb-4"><span className="text-green-500 font-bold">+2</span> dibanding bulan lalu</p>
              
              <button className="mt-auto flex items-center justify-between w-full py-2 px-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 rounded-lg transition-colors">
                  Kelola Proyek <ArrowRight size={16} />
              </button>
          </div>

          {/* Stat 3: Total Talent Hired */}
          <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center"><Users size={24}/></div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Talent Booked</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-1">84 Orang</h2>
              <p className="text-sm text-slate-500 mb-4">Tersebar di berbagai event</p>
              
              <button className="mt-auto flex items-center justify-between w-full py-2 px-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 rounded-lg transition-colors">
                  Lihat Roster <ArrowRight size={16} />
              </button>
          </div>
      </div>

      {/* TABEL TUGAS (PENDING APPROVALS) */}
      <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center"><CheckCircle className="mr-2 text-brand-500"/> Butuh Review Anda</h3>
              <span className="bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 text-xs font-bold px-3 py-1 rounded-full">3 Pending</span>
          </div>
          
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                          <th className="p-4 pl-6">Tugas / Aksi</th>
                          <th className="p-4">Proyek & Talent</th>
                          <th className="p-4">Waktu</th>
                          <th className="p-4 pr-6"></th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {PENDING_TASKS.map((task) => (
                          <tr key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                              <td className="p-4 pl-6">
                                  <div className="flex items-center gap-3">
                                      {task.type === 'kol_draft' ? <PlayCircle className="text-purple-500" size={20}/> : task.type === 'selftape' ? <PlayCircle className="text-blue-500" size={20}/> : <FileText className="text-amber-500" size={20}/>}
                                      <span className="font-bold text-slate-900 dark:text-white text-sm">{task.action}</span>
                                      {task.status === 'Urgent' && <span className="bg-red-100 text-red-600 text-[9px] font-black px-2 py-0.5 rounded uppercase">Urgent</span>}
                                  </div>
                              </td>
                              <td className="p-4">
                                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{task.project}</p>
                                  <p className="text-xs text-slate-500">{task.talent}</p>
                              </td>
                              <td className="p-4">
                                  <div className="flex items-center text-xs text-slate-500"><Clock size={12} className="mr-1"/> {task.time}</div>
                              </td>
                              <td className="p-4 pr-6 text-right">
                                  <button className="text-brand-600 dark:text-brand-400 font-bold text-sm flex items-center justify-end w-full group-hover:underline">
                                      Review <ChevronRight size={16} className="ml-0.5"/>
                                  </button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

    </div>
  )
}
