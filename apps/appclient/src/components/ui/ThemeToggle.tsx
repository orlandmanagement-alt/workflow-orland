import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button 
      onClick={toggleTheme}
      className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-amber-400 hover:scale-110 transition-all duration-300 shadow-sm border border-slate-200 dark:border-slate-700"
      title="Ganti Tema"
    >
      {isDark ? <Sun size={18} className="animate-in spin-in-180" /> : <Moon size={18} className="animate-in spin-in-180" />}
    </button>
  );
}
