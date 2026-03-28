import React from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';

export default function Header() {
  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Menu size={20} className="md:hidden text-slate-600" />
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input type="text" placeholder="Search..." className="pl-10 pr-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-xs outline-none w-64" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Bell size={20} className="text-slate-600 dark:text-slate-400" />
        <div className="h-8 w-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold">OM</div>
      </div>
    </header>
  );
}
