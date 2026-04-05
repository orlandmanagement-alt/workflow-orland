import { useState, useEffect } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore, useThemeStore } from '@/store/useAppStore';
import { Menu, X, Moon, Sun, LogOut, Search, Bell, User, Shield, Settings, CheckCircle2, Building2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getMenuItems } from '@/config/menuConfig';
import { performCleanLogout } from '@/lib/auth/logout';
import { apiRequest } from '@/lib/api';
import { CategoryModal } from '../onboarding/CategoryModal';

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export default function ClientLayout() {
  const { isDark, toggleTheme } = useThemeStore();
  const location = useLocation();
  
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const isAuthorized = useAuthStore(state => state.isAuthenticated);
  const userData = useAuthStore(state => state.user);
  const companyCategory = useAuthStore(state => state.companyCategory);

  useEffect(() => {
    if (!isAuthorized) {
      performCleanLogout();
    }
  }, [isAuthorized]);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (isAuthorized) {
      apiRequest('/notifications?limit=5&offset=0')
        .then((res: any) => {
           if (res.status === 'ok') {
             setNotifications(res.data || []);
             setUnreadCount(res.unread_count || 0);
           }
        })
        .catch(() => console.error("Gagal menarik lonceng notifikasi"));
    }
  }, [isAuthorized]);

  if (!isAuthorized) return null; 

  const menus = getMenuItems(companyCategory);
  const coreMenus = menus.filter(m => m.group === 'core');
  const workspaceMenus = menus.filter(m => m.group === 'workspace');
  const systemMenus = menus.filter(m => m.group === 'system');

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans">
      <CategoryModal />
      
      {/* SIDEBAR B2B ENTERPRISE - NAVY DARK MODE (#0A192F) */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-[#0A192F] border-r border-[#1a2b4b] transform transition-transform duration-300 ease-out flex flex-col shadow-2xl lg:shadow-none",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        "lg:static lg:flex"
      )}>
        {/* SIDEBAR HEADER */}
        <div className="flex flex-col h-20 px-6 justify-center border-b border-[#1a2b4b] shadow-inner shrink-0 text-white relative">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-black tracking-tighter text-white drop-shadow-md">
                ORLAND<span className="text-brand-500 font-light drop-shadow-[0_0_8px_rgba(15,118,110,0.8)]">CLIENT</span>
              </span>
              {companyCategory && (
                <span className="text-[10px] font-bold tracking-widest uppercase ml-1 px-1.5 py-0.5 bg-brand-500/20 text-brand-300 rounded border border-brand-500/30 absolute right-6 top-1/2 -translate-y-1/2">
                  {companyCategory}
                </span>
              )}
            </div>
            <button className="lg:hidden text-slate-400 hover:text-white transition-colors" onClick={() => setSidebarOpen(false)}>
              <X size={22} />
            </button>
          </div>
        </div>

        {/* SIDEBAR NAV MENU */}
        <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto custom-scrollbar">
          
          {/* GROUP: CORE */}
          <div className="space-y-1">
            <h3 className="px-3 text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-2">Command Center</h3>
            {coreMenus.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              return (
                <Link key={item.path} to={item.path} className={cn(
                  "flex items-center group px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 relative",
                  isActive ? "bg-brand-600/10 text-brand-400" : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
                )}>
                  {isActive && <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-brand-500 rounded-r-md shadow-[0_0_10px_rgba(15,118,110,0.8)]"></div>}
                  <Icon size={18} className={cn("mr-3", isActive ? "text-brand-500" : "opacity-70 group-hover:opacity-100")} />
                  <span className="tracking-wide relative z-10">{item.title}</span>
                </Link>
              )
            })}
          </div>

          {/* GROUP: WORKSPACE */}
          {(companyCategory && workspaceMenus.length > 0) && (
            <div className="space-y-1">
              <h3 className="px-3 text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-2 flex items-center gap-1.5">
                <Building2 size={12} className="text-brand-600" />
                {companyCategory} Workspace
              </h3>
              {workspaceMenus.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                return (
                  <Link key={item.path} to={item.path} className={cn(
                    "flex items-center group px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 relative",
                    isActive ? "bg-brand-600/10 text-brand-400" : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
                  )}>
                    {isActive && <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-brand-500 rounded-r-md shadow-[0_0_10px_rgba(15,118,110,0.8)]"></div>}
                    <Icon size={18} className={cn("mr-3", isActive ? "text-brand-500" : "opacity-70 group-hover:opacity-100")} />
                    <span className="tracking-wide relative z-10">{item.title}</span>
                  </Link>
                )
              })}
            </div>
          )}

          {/* GROUP: SYSTEM */}
          <div className="space-y-1 pt-4 border-t border-[#1a2b4b]">
             {systemMenus.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                return (
                  <Link key={item.path} to={item.path} className={cn(
                    "flex items-center group px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 relative",
                    isActive ? "bg-brand-600/10 text-brand-400" : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
                  )}>
                    {isActive && <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-brand-500 rounded-r-md shadow-[0_0_10px_rgba(15,118,110,0.8)]"></div>}
                    <Icon size={18} className={cn("mr-3", isActive ? "text-brand-500" : "opacity-70 group-hover:opacity-100")} />
                    <span className="tracking-wide relative z-10">{item.title}</span>
                  </Link>
                )
              })}
          </div>

        </nav>

        {/* SIDEBAR FOOTER (User Info) */}
        <div className="p-4 border-t border-[#1a2b4b] bg-black/20 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0 pr-3">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-brand-500/20">
                  {userData?.name?.substring(0, 2).toUpperCase() || 'OM'}
                </div>
                <div className="ml-3 truncate">
                  <p className="text-sm font-bold text-white truncate">{userData?.name || 'Client B2B'}</p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 truncate opacity-80">{userData?.email || 'Mitra Enterprise'}</p>
                </div>
            </div>
            
            {/* LOGOUT BUTTON */}
            <button 
                onClick={performCleanLogout} 
                className="p-2 shrink-0 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Keluar (Logout)"
            >
                <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* BACKGROUND OVERLAY FOR MOBILE SIDEBAR */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* TOP HEADER */}
        <header className="h-20 shrink-0 flex items-center justify-between px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10 shadow-[0_4px_30px_rgba(0,0,0,0.03)] dark:shadow-none">
          <div className="flex items-center flex-1 gap-4">
            <button className="lg:hidden p-2.5 rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 shadow-sm" onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </button>
            
            {/* OMNI SEARCH */}
            <div className="relative hidden md:block max-w-sm w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari kampanye, roster, invoice..." 
                className="w-full pl-11 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-transparent dark:border-slate-800 rounded-full text-sm font-medium outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:text-white transition-all shadow-inner"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                 <span className="text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">⌘</span>
                 <span className="text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">K</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button onClick={toggleTheme} className="p-2.5 rounded-full text-slate-500 hover:text-slate-700 bg-transparent hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors">
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            {/* NOTIFICATION BUTTON */}
            <div className="relative">
              <button 
                onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
                className="p-2.5 rounded-full text-slate-500 hover:text-slate-700 bg-transparent hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
                )}
              </button>
              {isNotifOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200 z-50">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Command Center Alerts</h4>
                    <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold cursor-pointer hover:underline">Tandai dibaca</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                          <div className="p-8 text-center flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                             <CheckCircle2 size={32} className="opacity-20 mb-2"/>
                             <p className="text-sm font-medium">Sistem bersih.</p>
                             <p className="text-xs opacity-70">Tidak ada notifikasi saat ini.</p>
                          </div>
                      ) : (
                          notifications.map((notif, idx) => (
                              <div key={idx} className="p-3 border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer flex gap-3 transition-colors last:border-0">
                                <div className="mt-0.5"><CheckCircle2 size={16} className={notif.is_read ? "text-slate-400" : "text-brand-500"}/></div>
                                <div>
                                    <p className={cn("text-xs leading-tight mb-0.5", notif.is_read ? "font-medium text-slate-600 dark:text-slate-400" : "font-bold text-slate-900 dark:text-white")}>{notif.title}</p>
                                    <p className="text-[10px] text-slate-500 leading-tight">{notif.message}</p>
                                </div>
                              </div>
                          ))
                      )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

            {/* PROFILE DROPDOWN */}
            <div className="relative">
               <button 
                  onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
                  className="flex items-center space-x-2 pl-2 pr-1 py-1 sm:pl-3 sm:pr-1.5 sm:py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 hidden sm:block tracking-tight pr-1">
                    {userData?.name?.split(' ')[0] || 'Client'}
                  </span>
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-slate-900 dark:bg-brand-900 border-2 border-white dark:border-slate-800 text-white flex items-center justify-center font-black text-xs sm:text-sm shadow-sm relative">
                    {userData?.name?.substring(0, 2).toUpperCase() || 'OM'}
                    {/* Active dot */}
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                  </div>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200 z-50 py-1">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 mb-1">
                       <p className="font-bold text-sm text-slate-900 dark:text-white">{userData?.name}</p>
                       <p className="text-[10px] text-slate-500 uppercase tracking-wider">{companyCategory || 'Enterprise'} Workspace</p>
                    </div>
                    <button className="w-full px-4 py-2 text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center transition-colors">
                      <Building2 size={16} className="mr-3 text-slate-400" /> Profil Perusahaan
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center transition-colors">
                      <Shield size={16} className="mr-3 text-slate-400" /> Keamanan & Akses
                    </button>
                    <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                    
                    <button 
                      onClick={performCleanLogout}
                      className="w-full px-4 py-2.5 text-left text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center transition-colors mt-1"
                    >
                      <LogOut size={16} className="mr-3 text-red-500/70" /> Keluar Sesi
                    </button>
                  </div>
                )}
            </div>
          </div>
        </header>

        {/* WORKSPACE MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950/50 relative">
           <Outlet />
        </main>
      </div>
    </div>
  )
}
