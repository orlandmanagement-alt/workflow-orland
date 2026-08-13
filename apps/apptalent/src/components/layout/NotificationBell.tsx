import React, { useState, useEffect, useRef } from 'react';
import { Bell, FileText, Banknote, CalendarCheck, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface AppNotification {
  id: string;
  type: 'contract' | 'finance' | 'schedule';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const MOCK_NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', type: 'contract', title: 'Kontrak Baru Menunggu', message: 'Klien Nusantara (PH) telah mengirimkan draf kontrak TVC Iklan Susu.', isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
  { id: 'n2', type: 'schedule', title: 'Jadwal Shooting Diperbarui', message: 'Call time untuk proyek TVC Iklan Susu dimajukan menjadi 07:00 WIB.', isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: 'n3', type: 'finance', title: 'Payout Dicairkan', message: 'Sistem telah mentransfer Rp 3.000.000 ke rekening BCA Anda.', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
];

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulasi Polling via Hono
    setNotifications(MOCK_NOTIFICATIONS);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'contract': return <span className="bg-indigo-100 text-indigo-600 p-2 rounded-xl"><FileText size={16} /></span>;
      case 'finance': return <span className="bg-emerald-100 text-emerald-600 p-2 rounded-xl"><Banknote size={16} /></span>;
      case 'schedule': return <span className="bg-amber-100 text-amber-600 p-2 rounded-xl"><CalendarCheck size={16} /></span>;
      default: return <span className="bg-slate-100 text-slate-600 p-2 rounded-xl"><Bell size={16} /></span>;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2.5 rounded-xl text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-slate-100 dark:border-slate-800 animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 inline-block"></span> Notifikasi Global
            </h4>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-[10px] text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1 transition-colors">
                 <CheckCircle2 size={12} /> Tandai Dibaca
              </button>
            )}
          </div>
          <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/50">
            {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">Belum ada notifikasi baru.</div>
            ) : (
                notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer flex gap-3 transition-colors ${!notif.isRead ? 'bg-brand-50/30' : ''}`}
                    >
                      <div className="flex-shrink-0 mt-0.5">{getIcon(notif.type)}</div>
                      <div className="flex-1 min-w-0">
                          <p className={`text-xs truncate ${!notif.isRead ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-600 dark:text-slate-400"}`}>
                            {notif.title}
                          </p>
                          <p className={`text-[11px] leading-relaxed mt-1 ${!notif.isRead ? "text-slate-700 dark:text-slate-300 font-medium" : "text-slate-500"}`}>
                            {notif.message}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 mt-2 tracking-wider">
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                          </p>
                      </div>
                      {!notif.isRead && (
                         <div className="flex-shrink-0"><span className="w-2 h-2 rounded-full bg-brand-500 inline-block mt-1"></span></div>
                      )}
                    </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
