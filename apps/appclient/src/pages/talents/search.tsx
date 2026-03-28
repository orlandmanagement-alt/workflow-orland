import { useState, useEffect } from 'react';
import { Search, Camera, Loader2, Sparkles, MapPin, Users } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { formatIDR } from '@/utils/formatters';

export default function TalentDiscovery() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  
  // Menggunakan Hook useDebounce agar pencarian tidak "nyepam" API
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearch) {
      console.log('Mencari Talent untuk:', debouncedSearch);
      // Di sini nanti panggil API: projectService.search(debouncedSearch)
    }
  }, [debouncedSearch]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto px-4 mt-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="flex-1 w-full">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center tracking-tight">
            <Sparkles className="mr-3 text-brand-500" size={32}/> Smart Discovery
          </h1>
          <div className="relative mt-4 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Cari talent (Contoh: Model Iklan Jakarta)..." 
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:border-brand-500 transition-all shadow-sm dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <button className="flex items-center justify-center px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm hover:scale-105 transition-transform shadow-xl">
          <Camera size={20} className="mr-2" /> SCAN WAJIB (AI)
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
        {/* Placeholder Card dengan Formatter IDR */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm group">
          <div className="aspect-square bg-slate-100 dark:bg-slate-900 rounded-2xl mb-4 overflow-hidden relative">
             <div className="absolute top-3 right-3 bg-brand-500 text-white text-[10px] px-2 py-1 rounded-lg font-bold">New Talent</div>
          </div>
          <h3 className="font-bold dark:text-white">Sample Talent</h3>
          <p className="text-xs text-slate-500 mb-4 flex items-center"><MapPin size={12} className="mr-1"/> Jakarta</p>
          <div className="flex justify-between items-center pt-4 border-t border-slate-50 dark:border-slate-700">
             <span className="text-sm font-black text-brand-600">{formatIDR(2500000)}/day</span>
             <button className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl hover:bg-brand-500 hover:text-white transition-all"><Users size={16}/></button>
          </div>
        </div>
      </div>
    </div>
  );
}
