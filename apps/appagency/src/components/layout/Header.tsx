import { LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/useAppStore';
import { performCleanLogout } from '../../lib/auth/logout';
import { useState } from 'react';

export default function Header() {
  const { user } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    performCleanLogout();
  };

  return (
    <header className="h-16 bg-gradient-to-r from-slate-950/40 to-slate-900/30 backdrop-blur-xl border-b border-amber-500/10 flex items-center justify-between px-6 fixed top-0 left-64 right-0 z-40 lg:left-64">
      {/* Left Side - Page Title Placeholder */}
      <div className="flex items-center gap-4">
        <h2 className="text-white font-black text-lg tracking-tight hidden md:block">
          Agency Dashboard
        </h2>
      </div>

      {/* Right Side - User Menu */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-800/50 transition-colors group"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white">
                {user?.full_name || 'Agency User'}
              </p>
              <p className="text-xs text-slate-400">
                {user?.email || 'agency@orland.com'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-bold text-slate-900 text-sm">
              {user?.full_name?.[0]?.toUpperCase() || 'A'}
            </div>
            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-900/95 backdrop-blur-xl border border-amber-500/20 rounded-lg shadow-xl py-2 z-50">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-500/10 transition-colors font-bold text-sm"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
