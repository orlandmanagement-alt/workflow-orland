import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, Menu, User, Shield, LogOut, X, Settings, CheckCircle2 } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';
import { performCleanLogout } from '../../lib/auth/logout';
import { useAuthStore } from '../../store/useAppStore';

export default function Header() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState('OM');

  const user = useAuthStore(state => state.user);

  // Mengambil inisial nama dari Zustand
  useEffect(() => {
    if (user?.name) {
      setUserName(user.name.substring(0, 2).toUpperCase());
    }
  }, [user]);

  return (
    <>
      {/* HEADER UTAMA (Sticky & Backdrop Blur) */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-4 flex items-center justify-between transition-all">
        
        <div className="flex items-center gap-4">
          {/* BURGER MENU (Mobile) */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <Menu size={20} />
          </button>
          
          {/* OMNI SEARCH (Desktop) */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Cari kampanye, talent, invoice..." 
              className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-full text-xs font-medium outline-none focus:ring-2 focus:ring-brand-500 w-64 dark:text-white transition-all"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {/* NOTIFICATION BUTTON & POPUP */}
          <div className="relative">
            <button 
              onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl relative transition-colors"
            >
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                  <h4 className="font-bold text-sm dark:text-white">Notifikasi</h4>
                  <span className="text-[10px] text-brand-500 font-bold cursor-pointer">Tandai dibaca</span>
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl cursor-pointer flex gap-3 transition-colors">
                    <div className="mt-0.5"><CheckCircle2 size={16} className="text-green-500"/></div>
                    <div>
                      <p className="text-xs font-bold dark:text-white">Invoice #INV-2026 Lunas</p>
                      <p className="text-[10px] text-slate-500">Pembayaran proyek TVC Glow Up telah kami terima.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PROFILE BUTTON & POPUP */}
          <div className="relative">
            <button 
              onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
              className="h-8 w-8 rounded-full bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white text-xs font-black ml-2 shadow-md hover:scale-105 transition-transform"
            >
              {userName}
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50 py-1">
                <button className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center transition-colors">
                  <User size={14} className="mr-2 opacity-70" /> Edit Profile
                </button>
                <button className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center transition-colors">
                  <Shield size={14} className="mr-2 opacity-70" /> Keamanan
                </button>
                <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                
                {/* TOMBOL LOGOUT SAKTI */}
                <button 
                  onClick={performCleanLogout}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center transition-colors"
                >
                  <LogOut size={14} className="mr-2 opacity-70" /> Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER (Burger Menu Slide-Over) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Overlay Gelap */}
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          
          {/* Panel Putih */}
          <div className="relative w-64 max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl animate-in slide-in-from-left duration-300 border-r border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="p-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-black text-brand-600 dark:text-brand-400">ORLAND B2B</h2>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto space-y-2">
              <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors">
                <User size={18} className="text-brand-500"/> Profile Perusahaan
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors">
                <Shield size={18} className="text-brand-500"/> Keamanan Akun
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors">
                <Settings size={18} className="text-brand-500"/> Pengaturan
              </button>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
               <button 
                  onClick={performCleanLogout}
                  className="w-full py-3 bg-red-50 dark:bg-red-500/10 text-red-600 font-bold rounded-xl text-sm flex items-center justify-center hover:scale-105 transition-transform"
                >
                  <LogOut size={16} className="mr-2" /> Logout Platform
                </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
