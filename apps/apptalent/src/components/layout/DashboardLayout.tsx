import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore, useThemeStore } from '@/store/useAppStore';
import { Menu, X, Moon, Sun, LogOut, Bell, WifiOff, User, Settings } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MENU_ITEMS } from '@/config/menuConfig';
import { performCleanLogout } from '@/lib/auth/logout';
import { apiRequest } from '@/lib/api';
import { NotificationBell } from './NotificationBell';
import ProfileWizard from '@/components/wizard/ProfileWizard';

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export default function DashboardLayout() {
  const { isDark, toggleTheme } = useThemeStore();
  const location = useLocation();
  const login = useAuthStore(state => state.login);
  const isAuthorized = useAuthStore(state => state.isAuthenticated);
  const userData = useAuthStore(state => state.user);

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true); // State loading untuk pengecekan awal
  
  const [showWizard, setShowWizard] = useState(false);
  const [showAbandonBanner, setShowAbandonBanner] = useState(false);

  useEffect(() => {
    async function verifySession() {
      try {
        // 1. Tanya ke SSO (Cek Cookie)
        const res = await fetch('https://sso.orlandmanagement.com/api/auth/me', { 
            method: 'GET', 
            credentials: 'include' 
        });

        if (!res.ok) throw new Error("Unauthorized");
        const authData = await res.json();
        
        if (authData.status === 'ok') {
            // 2. Jika Cookie OK, Update Zustand Store (Sync Token ke AppTalent)
            // Asumsikan backend mengirimkan token di field 'token' atau kita ambil data usernya
            login(authData.token || 'session-active', authData.user);
            
            // 3. Cek Onboarding Talent
            const profileRes: any = await apiRequest('/talents/me');
            if (profileRes.is_new || !profileRes.data.category || !profileRes.data.headshot) {
                if (sessionStorage.getItem('hide_wizard') !== 'true') setShowWizard(true);
                else setShowAbandonBanner(true);
            }
            setIsVerifying(false);
          } else {
            throw new Error("Invalid Session");
          }
      } catch (err) {
        console.warn("Sesi tidak valid, membersihkan data...");
        performCleanLogout();
      }
    }

    verifySession();
  }, []); // Hanya jalankan sekali saat aplikasi dimuat

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

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Tampilkan layar loading saat memverifikasi cookie agar tidak "flicker"
  if (isVerifying) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#071122]">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold animate-pulse">Menghubungkan ke Portal Orland...</p>
      </div>
    );
  }

  // Jika tetap tidak authorized setelah verify, return null (akan di-redirect oleh verifySession)
  if (!isAuthorized) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-dark-bg transition-colors duration-300 font-sans">
      {/* ... Sisa UI Sidebar & Header Anda tetap sama ... */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-[#0a192f] dark:bg-dark-card border-r border-[#1a2b4b] dark:border-slate-800 transform transition-transform duration-300 ease-out flex flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        "lg:static lg:flex"
      )}>
        {/* Konten Sidebar Anda */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-[#1a2b4b] dark:border-slate-800 shadow-inner">
          <span className="text-2xl font-extrabold tracking-tighter text-white">
            ORLAND<span className="text-brand-500 font-light">TALENT</span>
          </span>
        </div>
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={cn("flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all", isActive ? "bg-brand-600 text-white" : "text-slate-300 hover:text-white")}>
                <Icon size={20} className="mr-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 relative bg-slate-100 dark:bg-dark-bg">
          <Outlet />
        </main>
      </div>
      {showWizard && <ProfileWizard onClose={() => { setShowWizard(false); setShowAbandonBanner(true); }} />}
    </div>
  );
}