import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore, useThemeStore } from '@/store/useAppStore';
import { Menu, X, Moon, Sun, LogOut, Bell, WifiOff, User, Settings, ShieldCheck } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MENU_ITEMS } from '@/config/menuConfig';

// Import Utilities
import { performCleanLogout } from '@/lib/auth/logout';
import { apiRequest } from '@/lib/api';
import { NotificationBell } from './NotificationBell';
import ProfileWizard from '@/components/wizard/ProfileWizard';

/**
 * UTILITY: Tailwind Class Merger
 */
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export default function DashboardLayout() {
  const { isDark, toggleTheme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  // State dari Zustand Store
  const { login, isAuthenticated, user: userData } = useAuthStore();

  // Local UI State
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true); 
  
  // Onboarding State
  const [showWizard, setShowWizard] = useState(false);
  const [showAbandonBanner, setShowAbandonBanner] = useState(false);

  /**
   * EFFECT 1: SILENT LOGIN & SESSION SYNC
   * Menjamin sinkronisasi antara Cookie SSO dan Zustand Store
   */
  useEffect(() => {
    async function verifyAndSyncSession() {
      try {
        // 1. Validasi Sesi ke SSO menggunakan HttpOnly Cookie
        const res = await fetch('https://sso.orlandmanagement.com/api/auth/me', { 
            method: 'GET', 
            credentials: 'include' 
        });

        if (!res.ok) throw new Error("Sesi SSO Kadaluarsa");
        const authData = await res.json();
        
        if (authData.status === 'ok') {
            /**
             * 2. Sinkronisasi Data ke Lokal
             * Kita memanggil login() untuk mengisi token dan data user terbaru 
             * agar full_name muncul dengan benar (bukan 'Pengguna')
             */
            login(authData.token || 'session-active', authData.user);
            
            // 3. Cek Status Kelengkapan Profil (Onboarding)
            try {
              const profileRes: any = await apiRequest('/talents/me');
              // Jika profil belum lengkap, munculkan Wizard
              if (profileRes.is_new || !profileRes.data?.category || !profileRes.data?.headshot) {
                  const isAbandoned = sessionStorage.getItem('hide_wizard') === 'true';
                  if (isAbandoned) setShowAbandonBanner(true);
                  else setShowWizard(true);
              }
            } catch (pErr) {
              console.warn("Gagal memuat detail profil untuk onboarding");
            }

            setIsVerifying(false);
        } else {
            throw new Error("Sesi Tidak Valid");
        }
      } catch (err) {
        console.error("Gatekeeper: Akses Ditolak. Membersihkan sesi...");
        performCleanLogout();
      }
    }

    verifyAndSyncSession();
  }, [login]);

  /**
   * EFFECT 2: NETWORK MONITORING
   */
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Tutup sidebar otomatis saat pindah halaman (Mobile)
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  /**
   * RENDERING: LAYAR LOADING AWAL
   * Mencegah "Flicker" (UI melompat) saat pengecekan sesi berlangsung
   */
  if (isVerifying) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#071122]">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
            <ShieldCheck className="absolute inset-0 m-auto text-brand-500" size={24} />
        </div>
        <p className="mt-6 text-slate-500 font-bold tracking-tight animate-pulse uppercase text-xs">Menyinkronkan Portal Keamanan...</p>
      </div>
    );
  }

  // Jika tidak terotentikasi setelah verifikasi, jangan render apa pun
  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-dark-bg transition-colors duration-300 font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-[#0a192f] dark:bg-dark-card border-r border-slate-800 transform transition-transform duration-300 ease-out flex flex-col shadow-2xl",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        "lg:static lg:flex"
      )}>
        <div className="flex items-center justify-between h-20 px-6 border-b border-slate-800/50">
          <span className="text-xl font-black tracking-tighter text-white uppercase">
            Orland<span className="text-brand-500 font-light ml-0.5">Talent</span>
          </span>
          <button className="lg:hidden text-slate-400" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto custom-scrollbar">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link key={item.path} to={item.path}
                className={cn(
                  "flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group",
                  isActive 
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-600/20" 
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                )}
              >
                <Icon size={18} className={cn("mr-4 transition-colors", isActive ? "text-white" : "text-slate-500 group-hover:text-brand-400")} />
                <span className="tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* PROFILE MINI CARD (FOOTER SIDEBAR) */}
        <div className="p-4 bg-black/20 border-t border-slate-800/50">
            <div className="flex items-center gap-3 p-2">
                <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.full_name || 'User')}&background=4f46e5&color=fff&bold=true`} 
                    alt="User" className="w-9 h-9 rounded-full border border-slate-700 shadow-sm" 
                />
                <div className="truncate flex-1">
                    <p className="text-xs font-black text-white truncate leading-none mb-1">{userData?.full_name || 'Talent OM'}</p>
                    <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest leading-none">{(userData?.role || 'talent').toUpperCase()}</p>
                </div>
                <button onClick={performCleanLogout} className="text-slate-500 hover:text-red-400 transition-colors p-1">
                    <LogOut size={16} />
                </button>
            </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* HEADER */}
        <header className="h-20 flex items-center justify-between px-6 bg-white dark:bg-dark-card border-b border-slate-200 dark:border-slate-800 z-20">
          <div className="flex items-center">
            <button className="lg:hidden mr-4 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400" onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </button>
            <h2 className="hidden sm:block text-lg font-black text-slate-800 dark:text-white tracking-tight uppercase">Portal Talent</h2>
          </div>

          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <button onClick={toggleTheme} className="p-2.5 rounded-xl text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 transition-colors">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            <NotificationBell />

            {/* User Menu Dropdown */}
            <div className="relative">
                <button onClick={() => setUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-2 p-1 pr-3 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-white transition-all">
                    <img 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.full_name || 'User')}&background=4f46e5&color=fff&bold=true`} 
                        alt="Avatar" className="w-8 h-8 rounded-full object-cover shadow-sm" 
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 hidden md:block">Hi, {userData?.full_name?.split(' ')[0]}</span>
                </button>

                {isUserMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)}></div>
                    <div className="absolute right-0 mt-3 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-40 py-1.5">
                        <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors">
                            <User size={14} className="opacity-50" /> Profil Publik
                        </Link>
                        <Link to="/settings" onClick={() => setUserMenuOpen(false)} className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors">
                            <Settings size={14} className="opacity-50" /> Pengaturan Sesi
                        </Link>
                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                        <button onClick={performCleanLogout} className="w-full px-4 py-2.5 text-left text-xs font-black text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-3 transition-colors uppercase">
                            <LogOut size={14} /> Keluar Akun
                        </button>
                    </div>
                  </>
                )}
            </div>
          </div>
        </header>

        {/* MAIN VIEWPORT */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-10 relative bg-slate-50 dark:bg-dark-bg custom-scrollbar">
          
          {/* BANNER PERINGATAN PROFIL BELUM LENGKAP */}
          {showAbandonBanner && (
             <div className="flex flex-wrap items-center justify-between gap-4 bg-amber-50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/50 p-4 rounded-2xl text-sm font-bold mb-8 animate-in slide-in-from-top-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>Profil Anda Belum Terpublikasi! Selesaikan portofolio agar klien bisa menemukan Anda.</span>
                </div>
                <Link to="/profile" className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-5 rounded-xl shadow-md transition-all text-xs uppercase tracking-widest">
                  Lengkapi &rarr;
                </Link>
             </div>
          )}

          <Outlet />
        </main>
      </div>

      {/* OFFLINE INDICATOR */}
      {isOffline && (
        <div className="absolute bottom-6 right-6 z-[100] bg-red-600 text-white px-5 py-2.5 rounded-2xl shadow-2xl flex items-center text-xs font-black uppercase tracking-widest animate-bounce">
          <WifiOff size={16} className="mr-3" /> Koneksi Terputus
        </div>
      )}

      {/* SIDEBAR OVERLAY (MOBILE) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      
      {/* ONBOARDING WIZARD MODAL */}
      {showWizard && (
        <ProfileWizard onClose={() => {
            sessionStorage.setItem('hide_wizard', 'true');
            setShowWizard(false);
            setShowAbandonBanner(true);
        }} />
      )}

    </div>
  );
}