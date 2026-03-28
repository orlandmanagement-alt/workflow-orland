import { useState } from 'react';
import { Search, SlidersHorizontal, Camera, UserPlus, MapPin, Loader2, Sparkles, X, Users } from 'lucide-react';

const MOCK_TALENTS = [
  { id: 'T-001', name: 'Sarah Lee', category: 'Commercial Model', match: 98, rate: 'Rp 5 Jt / day', height: '170cm', location: 'Jakarta', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600' },
  { id: 'T-002', name: 'Budi Santoso', category: 'Action Actor', match: 85, rate: 'Rp 8 Jt / day', height: '178cm', location: 'Bandung', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600' },
  { id: 'T-003', name: 'Jessica Wong', category: 'Beauty KOL', match: 92, rate: 'Rp 15 Jt / post', height: '165cm', location: 'Bali', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600' },
];

export default function TalentDiscovery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [talents, setTalents] = useState(MOCK_TALENTS);

  const handleAISearch = () => {
      setIsScanning(true);
      setAiMode(true);
      setTimeout(() => {
          setIsScanning(false);
          setTalents([...MOCK_TALENTS].sort((a, b) => b.match - a.match));
      }, 2500);
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto px-4 mt-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="flex-1">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center tracking-tight">
                <Sparkles className="mr-3 text-brand-500" size={32}/> Smart Discovery
            </h1>
            <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Cari nama atau kategori..." 
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
        <div className="flex gap-2">
            <button onClick={handleAISearch} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl flex items-center">
                {isScanning ? <Loader2 className="animate-spin mr-2" size={18}/> : <Camera className="mr-2" size={18}/>}
                Cari Mirip (AI)
            </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {talents.map((talent) => (
              <div key={talent.id} className="group relative bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="aspect-[3/4] relative">
                      <img src={talent.image} className="w-full h-full object-cover" alt={talent.name} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute bottom-4 left-4 text-white">
                          <p className="text-[10px] font-bold text-brand-400 uppercase">{talent.category}</p>
                          <h3 className="text-lg font-black">{talent.name}</h3>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-300">
                              <span className="bg-white/10 px-2 py-0.5 rounded-full">{talent.height}</span>
                              <span className="bg-white/10 px-2 py-0.5 rounded-full flex items-center"><MapPin size={10} className="mr-1"/>{talent.location}</span>
                          </div>
                      </div>
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
}
