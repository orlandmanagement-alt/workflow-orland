import { useState } from 'react';
import { Clock, AlertTriangle, Play, CheckCircle2, ChevronRight, Users, Mic, Music, Plus, FastForward, Edit2 } from 'lucide-react';

// Fungsi Helper: Menggeser waktu HH:MM sebanyak N menit
const addMinutes = (timeStr: string, minsToAdd: number) => {
  const [h, m] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m + minsToAdd, 0, 0);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

// Simulasi Data Rundown
const INITIAL_RUNDOWN = [
  { id: 1, startTime: '08:00', endTime: '09:00', activity: 'Persiapan & Check Sound', pic: 'Tim WO & Band', talent: ['Sarah (Singer)'], status: 'DONE' },
  { id: 2, startTime: '09:00', endTime: '09:30', activity: 'Penyambutan Tamu VIP', pic: 'Usher', talent: ['Budi (Usher)', 'Siska (Usher)'], status: 'ONGOING' },
  { id: 3, startTime: '09:30', endTime: '10:00', activity: 'Grand Entrance Pengantin', pic: 'MC', talent: ['Reza (MC)'], status: 'UPCOMING' },
  { id: 4, startTime: '10:00', endTime: '10:15', activity: 'First Dance & Wedding Kiss', pic: 'MC & Band', talent: ['Reza (MC)', 'Sarah (Singer)'], status: 'UPCOMING' },
  { id: 5, startTime: '10:15', endTime: '11:00', activity: 'Sesi Foto & Ramah Tamah', pic: 'Tim WO', talent: [], status: 'UPCOMING' },
  { id: 6, startTime: '11:00', endTime: '12:00', activity: 'Makan Siang (Acoustic Set)', pic: 'Band', talent: ['Sarah (Singer)'], status: 'UPCOMING' },
];

export default function WORundown() {
  const [rundown, setRundown] = useState(INITIAL_RUNDOWN);
  const [isShifting, setIsShifting] = useState(false);

  // Fitur Darurat: Geser Semua Jadwal
  const handleEmergencyShift = () => {
      if (confirm('PERINGATAN DARURAT: Anda yakin ingin memundurkan SELURUH sisa acara sebanyak 15 Menit? Notifikasi akan dikirim ke semua Talent.')) {
          setIsShifting(true);
          setTimeout(() => {
              setRundown(prev => prev.map(item => {
                  if (item.status === 'DONE') return item; // Yang sudah selesai tidak digeser
                  return {
                      ...item,
                      startTime: addMinutes(item.startTime, 15),
                      endTime: addMinutes(item.endTime, 15)
                  };
              }));
              setIsShifting(false);
          }, 800);
      }
  };

  const setStatus = (id: number, newStatus: string) => {
      setRundown(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-20">
      
      {/* HEADER & EMERGENCY ACTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 bg-slate-900 dark:bg-[#0b141a] p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
                <span className="bg-brand-500/20 text-brand-300 border border-brand-500/30 text-[10px] font-black uppercase px-2.5 py-1 rounded tracking-widest">Live Event</span>
                <span className="text-xs font-bold text-slate-400">Pernikahan Raffi & Gigi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center tracking-tight leading-none">
                <Clock className="mr-3 text-brand-400" size={32}/> Minute-by-Minute
            </h1>
        </div>
        
        <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none flex items-center justify-center px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold border border-white/10 backdrop-blur-sm transition-colors">
                <Music size={16} className="mr-2"/> Song List
            </button>
            <button 
                onClick={handleEmergencyShift}
                disabled={isShifting}
                className="flex-1 sm:flex-none flex items-center justify-center px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-900/50 transition-all hover:scale-105 disabled:opacity-70 disabled:hover:scale-100"
            >
                <FastForward size={18} className="mr-2"/> Geser Semua +15 Menit
            </button>
        </div>
      </div>

      {/* RUNDOWN TABLE (DATA GRID) */}
      <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800/60 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center">
                  Jadwal Acara (Rundown)
              </h3>
              <button className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-brand-100 hover:text-brand-600 dark:hover:bg-brand-900/30 dark:hover:text-brand-400 transition-colors">
                  <Plus size={20} />
              </button>
          </div>
          
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800/50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800/60">
                          <th className="p-4 pl-6 w-32">Waktu</th>
                          <th className="p-4 w-1/3">Aktivitas / Segmen</th>
                          <th className="p-4">PIC & Talent Terlibat</th>
                          <th className="p-4 w-40 text-center">Status Live</th>
                          <th className="p-4 pr-6 text-right w-24">Aksi</th>
                      </tr>
                  </thead>
                  <tbody className={`divide-y divide-slate-100 dark:divide-slate-800/60 transition-opacity duration-300 ${isShifting ? 'opacity-50' : 'opacity-100'}`}>
                      {rundown.map((item) => (
                          <tr key={item.id} className={`transition-colors group ${item.status === 'ONGOING' ? 'bg-amber-50 dark:bg-amber-900/10 border-l-4 border-l-amber-500' : 'border-l-4 border-l-transparent hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}`}>
                              
                              {/* Kolom Waktu */}
                              <td className="p-4 pl-6">
                                  <div className={`font-mono text-lg font-black tracking-tighter ${item.status === 'DONE' ? 'text-slate-400 line-through decoration-slate-300 dark:decoration-slate-700' : item.status === 'ONGOING' ? 'text-amber-600 dark:text-amber-500' : 'text-slate-900 dark:text-white'}`}>
                                      {item.startTime}
                                  </div>
                                  <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center mt-0.5">
                                      <ChevronRight size={10} className="mr-0.5"/> s.d {item.endTime}
                                  </div>
                              </td>

                              {/* Kolom Aktivitas */}
                              <td className="p-4">
                                  <p className={`font-bold text-base ${item.status === 'DONE' ? 'text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                                      {item.activity}
                                  </p>
                              </td>

                              {/* Kolom Talent & PIC */}
                              <td className="p-4">
                                  <div className="flex flex-col gap-2">
                                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.pic}</span>
                                      {item.talent.length > 0 && (
                                          <div className="flex flex-wrap gap-1">
                                              {item.talent.map((t, i) => (
                                                  <span key={i} className={`text-[10px] font-bold px-2 py-1 rounded-md border ${item.status === 'ONGOING' ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' : 'bg-slate-50 dark:bg-slate-800 text-brand-700 dark:text-brand-400 border-slate-200 dark:border-slate-700'}`}>
                                                      {t}
                                                  </span>
                                              ))}
                                          </div>
                                      )}
                                  </div>
                              </td>

                              {/* Kolom Status Kontrol */}
                              <td className="p-4">
                                  <div className="flex justify-center">
                                      {item.status === 'DONE' && (
                                          <span className="flex items-center text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                              <CheckCircle2 size={14} className="mr-1.5"/> Selesai
                                          </span>
                                      )}
                                      {item.status === 'ONGOING' && (
                                          <button onClick={() => setStatus(item.id, 'DONE')} className="flex items-center w-full justify-center text-xs font-black px-4 py-2 rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-500/30 hover:scale-105 transition-transform animate-pulse">
                                              <Play size={14} className="mr-1.5 fill-white"/> SEDANG BERJALAN
                                          </button>
                                      )}
                                      {item.status === 'UPCOMING' && (
                                          <button onClick={() => setStatus(item.id, 'ONGOING')} className="flex items-center text-xs font-bold px-4 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:text-amber-600 dark:hover:border-amber-500 dark:hover:text-amber-500 shadow-sm transition-colors">
                                              Mulai Segmen
                                          </button>
                                      )}
                                  </div>
                              </td>

                              {/* Kolom Aksi */}
                              <td className="p-4 pr-6 text-right">
                                  <button className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                      <Edit2 size={16} />
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
