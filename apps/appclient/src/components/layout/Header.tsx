import { BellRing, Moon, Search, Building2, ChevronDown } from 'lucide-react';
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-dark-card border-b border-slate-100 dark:border-slate-800/60 shadow-sm px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img src="https://talent.orlandmanagement.com/assets/logo-orland.png" alt="Orland" className="h-8" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Client Portal</span>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Company Selector */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-full border border-slate-200 dark:border-slate-700 cursor-pointer">
            <div className="h-8 w-8 bg-brand-500 rounded-full flex items-center justify-center text-white"><Building2 size={16}/></div>
            <div className="text-sm">
                <p className="font-bold text-slate-900 dark:text-white">MD Entertainment</p>
                <p className="text-xs text-slate-500 -mt-0.5">Production House</p>
            </div>
            <ChevronDown size={16} className="text-slate-400 ml-2 mr-1" />
        </div>
        
        <Search className="text-slate-400" size={20} />
        <BellRing className="text-slate-400" size={20} />
        <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-sm">PH</div>
      </div>
    </header>
  );
}
