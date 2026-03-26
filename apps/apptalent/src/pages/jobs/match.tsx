import { useState } from 'react';
import { Sparkles, Check, X, Filter } from 'lucide-react';

export default function AIMatch() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="max-w-md mx-auto mt-10 text-center relative overflow-hidden">
        {/* Header dengan Tombol Filter */}
        <div className="flex justify-between items-center mb-6">
            <div className="w-10"></div> {/* Spacer */}
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-indigo-100 text-indigo-600 relative">
                <Sparkles size={40} className="animate-pulse" />
                <span className="absolute -top-1 -right-1 bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white">AI</span>
            </div>
            <button onClick={() => setIsFilterOpen(true)} className="h-10 w-10 bg-white dark:bg-dark-card rounded-full shadow flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors">
                <Filter size={20} />
            </button>
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Smart Match System</h1>
        <p className="text-slate-500 mb-8">Sistem AI Orland memindai Open Casting yang sesuai profil Anda.</p>
        
        {/* Card Tinder-Style */}
        <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden text-left relative">
            <div className="h-48 bg-slate-200 dark:bg-slate-800 relative">
                <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">92% Match</div>
            </div>
            <div className="p-6">
                <span className="text-brand-600 text-xs font-bold uppercase tracking-wider">Aktor Pria (25-35th)</span>
                <h2 className="text-xl font-bold dark:text-white mt-1">Film Layar Lebar: "Menembus Batas"</h2>
                <div className="flex justify-between mt-8">
                    <button className="h-14 w-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"><X size={24} /></button>
                    <button className="flex-1 ml-4 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center hover:bg-brand-700 transition-colors"><Check size={20} className="mr-2" /> 1-Click Apply</button>
                </div>
            </div>
        </div>

        {/* LACI FILTER (Drawer Overlay) */}
        {isFilterOpen && <div className="fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)} />}
        <div className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-dark-card z-50 shadow-2xl p-6 transform transition-transform duration-300 ease-in-out ${isFilterOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold dark:text-white">Filter Casting</h3>
                <button onClick={() => setIsFilterOpen(false)}><X className="text-slate-400 hover:text-red-500" /></button>
            </div>
            <div className="space-y-6 text-left">
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Lokasi Syuting</label>
                    <select className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"><option>Hanya Jabodetabek</option><option>Seluruh Indonesia</option></select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Budget Minimum (Per Hari)</label>
                    <input type="range" className="w-full accent-brand-600" />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>Rp 500rb</span>
                        {/* INI FIX NYA: Menggunakan HTML Entity &gt; */}
                        <span>&gt; Rp 10Jt</span>
                    </div>
                </div>
                <button onClick={() => setIsFilterOpen(false)} className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl mt-4">Terapkan Filter AI</button>
            </div>
        </div>
    </div>
  )
}
