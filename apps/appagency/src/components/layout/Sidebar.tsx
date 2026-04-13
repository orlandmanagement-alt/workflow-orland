import { useState } from 'react';
import type { ElementType } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CreditCard,
  Settings,
  X,
  Menu,
  Upload,
  Link2,
  Send,
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: ElementType;
  path: string;
}

export default function Sidebar() {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Roster Talent', icon: Users, path: '/roster' },
    { label: 'Inbox (Inquiries)', icon: Briefcase, path: '/inbox' },
    { label: 'Project Apply', icon: Send, path: '/projects/apply/sample-project' },
    { label: 'Public Links', icon: Link2, path: '/links' },
    { label: 'Finance', icon: CreditCard, path: '/finance' },
    { label: 'Data Importer', icon: Upload, path: '/tools/importer' },
    { label: 'Pengaturan', icon: Settings, path: '/settings' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed bottom-6 right-6 lg:hidden z-50 p-3 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg transition-colors"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-950/90 to-slate-900/80 backdrop-blur-xl border-r border-amber-500/10 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Logo */}
        <div className="p-6 border-b border-amber-500/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-slate-900 text-lg shadow-lg">
            O
          </div>
          <div>
            <h1 className="text-white font-black text-sm tracking-tight">ORLAND</h1>
            <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">Agency</p>
          </div>
        </div>

        {/* Navigation Menu */}
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
                    ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-amber-300 shadow-lg shadow-amber-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <Icon
                  size={18}
                  className={active ? 'text-amber-400' : 'group-hover:text-amber-300'}
                />
                <span className="flex-1">{item.label}</span>
                {active && (
                  <div className="w-2 h-2 rounded-full bg-amber-400 shadow-lg shadow-amber-500/50" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Info */}
        <div className="p-4 border-t border-amber-500/10 text-center text-xs text-slate-500">
          <p>Enterprise Agency Portal</p>
          <p className="text-[10px] text-amber-500/60 mt-1">v1.0.0</p>
        </div>
      </aside>
    </>
  );
}
