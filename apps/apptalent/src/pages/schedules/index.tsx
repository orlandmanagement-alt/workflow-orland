import { useState, useEffect } from 'react';
import { CalendarDays, MapPin, Clock, CalendarPlus, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { generateICS } from '@/utils/calendarSync';
import { api } from '@/lib/api';

interface ScheduleItem {
  id: number;
  date: number;
  title: string;
  type: string;
  location: string;
  time: string;
  color: string;
  startDate: number;
  endDate: number;
}

export default function Schedules() {
  const [selectedDate, setSelectedDate] = useState<number | null>(15);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API endpoint when backend is ready
      const response = await api.get('/api/v1/schedules').catch(err => {
        console.log('Schedules API not ready, using mock data');
        return { data: null };
      });

      if (response?.data?.schedules) {
        setSchedules(response.data.schedules);
      } else {
        // Fallback mock data
        setSchedules([
          { id: 1, date: 15, title: 'Shooting TVC Glow Soap', type: 'Shooting', location: 'Studio Alam TVRI', time: '08:00 - 18:00 WIB', color: 'bg-brand-500', startDate: new Date(new Date().setDate(15)).setHours(8,0,0,0), endDate: new Date(new Date().setDate(15)).setHours(18,0,0,0) },
          { id: 2, date: 18, title: 'Fitting Baju - MD Ent', type: 'Wardrobe', location: 'Kuningan, Jakarta', time: '13:00 - 15:00 WIB', color: 'bg-purple-500', startDate: new Date(new Date().setDate(18)).setHours(13,0,0,0), endDate: new Date(new Date().setDate(18)).setHours(15,0,0,0) },
          { id: 3, date: 25, title: 'Screen Test Film Aksi', type: 'Casting', location: 'Orland HQ', time: '10:00 - 12:00 WIB', color: 'bg-amber-500', startDate: new Date(new Date().setDate(25)).setHours(10,0,0,0), endDate: new Date(new Date().setDate(25)).setHours(12,0,0,0) }
        ]);
      }
      setError(null);
    } catch (err: any) {
      console.error('Error fetching schedules:', err);
      setError(err.message || 'Gagal memuat jadwal');
      setSchedules([
        { id: 1, date: 15, title: 'Shooting TVC Glow Soap', type: 'Shooting', location: 'Studio Alam TVRI', time: '08:00 - 18:00 WIB', color: 'bg-brand-500', startDate: new Date(new Date().setDate(15)).setHours(8,0,0,0), endDate: new Date(new Date().setDate(15)).setHours(18,0,0,0) },
        { id: 2, date: 18, title: 'Fitting Baju - MD Ent', type: 'Wardrobe', location: 'Kuningan, Jakarta', time: '13:00 - 15:00 WIB', color: 'bg-purple-500', startDate: new Date(new Date().setDate(18)).setHours(13,0,0,0), endDate: new Date(new Date().setDate(18)).setHours(15,0,0,0) },
        { id: 3, date: 25, title: 'Screen Test Film Aksi', type: 'Casting', location: 'Orland HQ', time: '10:00 - 12:00 WIB', color: 'bg-amber-500', startDate: new Date(new Date().setDate(25)).setHours(10,0,0,0), endDate: new Date(new Date().setDate(25)).setHours(12,0,0,0) }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);
  const activeSchedule = schedules.find(s => s.date === selectedDate);

  const handleSyncCalendar = (sched: any) => {
    generateICS({ title: `[ORLAND] ${sched.title}`, description: `Jadwal resmi dari Orland Management.`, location: sched.location, startDate: new Date(sched.startDate), endDate: new Date(sched.endDate) });
    alert('Jadwal diekspor ke Kalender HP Anda!');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Jadwal & Agenda</h1>
        <div className="flex items-center gap-4 bg-white dark:bg-dark-card px-4 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <button className="text-slate-400 hover:text-brand-500"><ChevronLeft size={20}/></button>
            <span className="font-bold text-slate-900 dark:text-white">Maret 2026</span>
            <button className="text-slate-400 hover:text-brand-500"><ChevronRight size={20}/></button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KALENDER GRID (Kiri) */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="grid grid-cols-7 gap-2 text-center font-bold text-xs text-slate-400 uppercase tracking-widest mb-4">
                <div>Min</div><div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div>Sab</div>
            </div>
            <div className="grid grid-cols-7 gap-2 sm:gap-4">
                {/* Offset hari pertama */}
                <div className="aspect-square"></div><div className="aspect-square"></div>
                {daysInMonth.map(day => {
                    const hasEvent = schedules.find(s => s.date === day);
                    const isSelected = selectedDate === day;
                    return (
                        <button 
                            key={day} onClick={() => setSelectedDate(day)}
                            className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all border-2
                                ${isSelected ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-md scale-105' : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-800/50'}
                            `}
                        >
                            <span className={`text-lg font-bold ${isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-slate-700 dark:text-slate-300'}`}>{day}</span>
                            {hasEvent && <span className={`h-2 w-2 rounded-full absolute bottom-2 ${hasEvent.color}`}></span>}
                        </button>
                    )
                })}
            </div>
        </div>

        {/* DETAIL PANEL (Kanan) */}
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-slate-800 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/20 rounded-full blur-[50px] pointer-events-none"></div>
            
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Agenda Tanggal {selectedDate}</h3>
            
            {activeSchedule ? (
                <div className="flex-1 flex flex-col animate-in slide-in-from-right-4">
                    <span className={`${activeSchedule.color} text-white text-[10px] font-black uppercase px-3 py-1 rounded-full w-fit mb-4`}>{activeSchedule.type}</span>
                    <h2 className="text-2xl font-extrabold mb-6 leading-tight">{activeSchedule.title}</h2>
                    
                    <div className="space-y-4 mb-8 flex-1">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-slate-800 rounded-lg text-brand-400"><Clock size={20}/></div>
                            <div><p className="text-xs text-slate-400 font-bold uppercase">Waktu Standby</p><p className="font-medium text-sm mt-0.5">{activeSchedule.time}</p></div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-slate-800 rounded-lg text-brand-400"><MapPin size={20}/></div>
                            <div><p className="text-xs text-slate-400 font-bold uppercase">Lokasi Set</p><p className="font-medium text-sm mt-0.5">{activeSchedule.location}</p></div>
                        </div>
                    </div>

                    <button onClick={() => handleSyncCalendar(activeSchedule)} className="w-full py-3.5 bg-white text-slate-900 font-bold rounded-xl flex items-center justify-center hover:bg-brand-50 hover:text-brand-600 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                        <CalendarPlus size={18} className="mr-2" /> Ekspor ke Kalender
                    </button>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                    <CalendarDays size={48} className="mb-4 text-slate-600" />
                    <p className="font-medium">Tidak ada agenda di tanggal ini.</p>
                    <p className="text-xs mt-2 text-slate-400">Gunakan waktu ini untuk istirahat atau perawatan diri.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  )
}
