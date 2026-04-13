import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Calendar, 
  DollarSign, 
  User, 
  Settings, 
  MessageSquare, 
  FileText,
  Target,
  Zap,
  X,
  Menu,
  LogOut,
  Bell
} from 'lucide-react';
import { useAuthStore } from '@/store/useAppStore';
import { performCleanLogout } from '@/lib/auth/logout';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: string | number;
  badgeColor?: 'red' | 'blue' | 'amber';
}

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuthStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Smart Match AI', icon: Zap, path: '/jobs/match', badge: 3, badgeColor: 'blue' },
    { label: 'Pekerjaan', icon: Briefcase, path: '/projects' },
    { label: 'Jadwal', icon: Calendar, path: '/schedules' },
    { label: 'Pendapatan', icon: DollarSign, path: '/earnings' },
    { label: 'Profil', icon: User, path: '/profile' },
    { label: 'Pesan', icon: MessageSquare, path: '/messages', badge: unreadMessages, badgeColor: 'red' },
    { label: 'Kontrak', icon: FileText, path: '/contracts' },
    { label: 'Pengaturan', icon: Settings, path: '/settings' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = () => {
    performCleanLogout();
  };

  return (
    <>
      {/* MOBILE OVERLAY */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-slate-900/80 dark:bg-slate-950/80 backdrop-blur-xl border-r border-slate-800/50 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* HEADER */}
        <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-bold text-slate-900 shadow-lg">
              O
            </div>
            <div>
              <h2 className="text-white font-black text-sm tracking-tight">ORLAND</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Talent Portal</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* USER PROFILE CARD */}
        <div className="p-4 border-b border-slate-800/50">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 hover:border-slate-600/50 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-300 to-orange-400 flex items-center justify-center text-slate-900 font-bold text-lg ring-2 ring-slate-700/50">
                {user?.full_name?.charAt(0).toUpperCase() || 'T'}
              </div>
              <div className="min-w-0">
                <p className="text-white font-bold text-sm truncate">{user?.full_name || 'Talent'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email || 'user@orland.com'}</p>
              </div>
            </div>
            <Link
              to="/profile"
              className="w-full text-center text-xs font-bold text-slate-400 hover:text-amber-400 py-2 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              Edit Profil
            </Link>
          </div>
        </div>

        {/* NAVIGATION MENU */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all group relative ${
                  active
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-300'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <Icon size={18} className={active ? 'text-amber-400' : 'group-hover:text-amber-300'} />
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && Number(item.badge) > 0 && (
                  <div
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                      item.badgeColor === 'red'
                        ? 'bg-red-500/30 text-red-200 border border-red-500/50'
                        : item.badgeColor === 'blue'
                        ? 'bg-blue-500/30 text-blue-200 border border-blue-500/50'
                        : 'bg-amber-500/30 text-amber-200 border border-amber-500/50'
                    }`}
                  >
                    {item.badge}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* FOOTER */}
        <div className="p-4 border-t border-slate-800/50 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
          <p className="text-[10px] text-slate-500 text-center py-2">v1.0 • Portal Talent Orland</p>
        </div>
      </aside>

      {/* MOBILE HEADER TOGGLE */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed bottom-6 right-6 lg:hidden z-40 w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-slate-900 font-bold flex items-center justify-center shadow-xl hover:scale-110 transition-transform active:scale-95"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </>
  );
}
