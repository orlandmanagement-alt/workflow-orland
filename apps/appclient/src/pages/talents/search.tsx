import { useState } from 'react';
import { Search, SlidersHorizontal, Camera, UserPlus, Star, MapPin, Loader2, Sparkles, X } from 'lucide-react';

// Simulasi Database Talent Agensi
const MOCK_TALENTS = [
  { id: 'T-001', name: 'Sarah Lee', category: 'Commercial Model', match: 98, rate: 'Rp 5 Jt / day', height: '170cm', location: 'Jakarta', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600' },
  { id: 'T-002', name: 'Budi Santoso', category: 'Action Actor', match: 85, rate: 'Rp 8 Jt / day', height: '178cm', location: 'Bandung', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600' },
  { id: 'T-003', name: 'Jessica Wong', category: 'Beauty KOL', match: 92, rate: 'Rp 15 Jt / post', height: '165cm', location: 'Bali', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600' },
  { id: 'T-004', name: 'David Beckham', category: 'Sports Model', match: 70, rate: 'Rp 10 Jt / day', height: '182cm', location: 'Jakarta', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600' },
  { id: 'T-005', name: 'Amanda Rawles', category: 'Lead Actress', match: 95, rate: 'Rp 20 Jt / day', height: '168cm', location: 'Jakarta', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600' },
  { id: 'T-006', name: 'Kevin Julio', category: 'Supporting Actor', match: 88, rate: 'Rp 6 Jt / day', height: '175cm', location: 'Surabaya', image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600' },
];

export default function TalentDiscovery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [talents, setTalents] = useState(MOCK_TALENTS);

  // Simulasi Fitur "Cari Mirip (AI Vision)"
  const handleAISearch = () => {
      // 1. Munculkan modal upload foto (Disimulasikan langsung scan)
      setIsScanning(true);
      setAiMode(true);
      
      // 2. Loading 2 detik untuk efek "Memindai Vektor Wajah"
      setTimeout(() => {
          setIsScanning(false);
          // 3. Urutkan berdasarkan Match Score tertinggi
          setTalents([...MOCK_TALENTS].sort((a, b) => b.match - a.match));
      }, 2500);
  };

  const clearAISearch = () => {
      setAiMode(false);
      setTalents(MOCK_TALENTS);
  };

  const handleShortlist = (name: string) => {
      alert(`${name} berhasil ditambahkan ke Shortlist Project Anda!`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-20">
      
      {/* HEADER & SEARCH BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center tracking-tight">
                <Sparkles className="mr-3 text-brand-500" size={32}/> Smart Discovery
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-lg">Temukan talent yang sempurna untuk *campaign* Anda berdasarkan filter fisik, budget, atau pencocokan wajah AI.</p>
      <div className="mt-10 p-6 bg-white dark:bg-dark-card border border-brand-500 border-dashed rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-brand-500 rounded-full flex items-center justify-center text-white"><Users size={20}/></div>
              <div><p className="font-bold dark:text-white">Internal Voting Link</p><p className="text-xs text-slate-500">Kirim link ini ke tim Anda (Sutradara/Produser) untuk memilih talent terbaik.</p></div>
          </div>
          <button className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs">Generate Voting Link</button>
      </div>
        </div>
        
        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
            {/* OMNI SEARCH INPUT */}
            <div className="relative flex-1 sm:w-80">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="text-slate-400" size={18} />
      <div className="mt-10 p-6 bg-white dark:bg-dark-card border border-brand-500 border-dashed rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-brand-500 rounded-full flex items-center justify-center text-white"><Users size={20}/></div>
              <div><p className="font-bold dark:text-white">Internal Voting Link</p><p className="text-xs text-slate-500">Kirim link ini ke tim Anda (Sutradara/Produser) untuk memilih talent terbaik.</p></div>
          </div>
          <button className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs">Generate Voting Link</button>
      </div>
                </div>
                <input 
                    type="text" 
                    placeholder="Cari nama, kategori, atau skill..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:text-white transition-shadow shadow-sm"
                />
      <div className="mt-10 p-6 bg-white dark:bg-dark-card border border-brand-500 border-dashed rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-brand-500 rounded-full flex items-center justify-center text-white"><Users size={20}/></div>
              <div><p className="font-bold dark:text-white">Internal Voting Link</p><p className="text-xs text-slate-500">Kirim link ini ke tim Anda (Sutradara/Produser) untuk memilih talent terbaik.</p></div>
          </div>
          <button className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs">Generate Voting Link</button>
      </div>
            </div>
            
            <button className="flex items-center justify-center px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-colors">
                <SlidersHorizontal size={18} className="mr-2"/> Filter
            </button>
            
            {/* AI VISION BUTTON (THE MAGIC) */}
            <button 
                onClick={handleAISearch} 
                disabled={isScanning}
                className="flex items-center justify-center px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 transition-transform hover:scale-105 disabled:opacity-70 disabled:hover:scale-100"
            >
                {isScanning ? <Loader2 size={18} className="animate-spin mr-2"/> : <Camera size={18} className="mr-2"/>}
                Cari Mirip (AI)
            </button>
      <div className="mt-10 p-6 bg-white dark:bg-dark-card border border-brand-500 border-dashed rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-brand-500 rounded-full flex items-center justify-center text-white"><Users size={20}/></div>
              <div><p className="font-bold dark:text-white">Internal Voting Link</p><p className="text-xs text-slate-500">Kirim link ini ke tim Anda (Sutradara/Produser) untuk memilih talent terbaik.</p></div>
          </div>
          <button className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs">Generate Voting Link</button>
      </div>
        </div>
      <div className="mt-10 p-6 bg-white dark:bg-dark-card border border-brand-500 border-dashed rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-brand-500 rounded-full flex items-center justify-center text-white"><Users size={20}/></div>
              <div><p className="font-bold dark:text-white">Internal Voting Link</p><p className="text-xs text-slate-500">Kirim link ini ke tim Anda (Sutradara/Produser) untuk memilih talent terbaik.</p></div>
          </div>
          <button className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs">Generate Voting Link</button>
      </div>
      </div>

      {/* AI SCANNING OVERLAY (VISUAL EFFECT) */}
      {isScanning && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 p-6 rounded-3xl flex flex-col items-center justify-center text-center animate-pulse mb-8">
              <div className="relative w-16 h-16 mb-4">
      <div className="mt-10 p-6 bg-white dark:bg-dark-card border border-brand-500 border-dashed rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-brand-500 rounded-full flex items-center justify-center text-white"><Users size={20}/></div>
              <div><p className="font-bold dark:text-white">Internal Voting Link</p><p className="text-xs text-slate-500">Kirim link ini ke tim Anda (Sutradara/Produser) untuk memilih talent terbaik.</p></div>
          </div>
          <button className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs">Generate Voting Link</button>
      </div>
                  <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full"></div>
      <div className="mt-10 p-6 bg-white dark:bg-dark-card border border-brand-500 border-dashed rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-brand-500 rounded-full flex items-center justify-center text-white"><Users size={20}/></div>
              <div><p className="font-bold dark:text-white">Internal Voting Link</p><p className="text-xs text-slate-500">Kirim link ini ke tim Anda (Sutradara/Produser) untuk memilih talent terbaik.</p></div>
          </div>
          <button className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs">Generate Voting Link</button>
      </div>
                  <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                  <Camera className="absolute inset-0 m-auto text-indigo-600" size={24} />
      <div className="mt-10 p-6 bg-white dark:bg-dark-card border border-brand-500 border-dashed rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-brand-500 rounded-full flex items-center justify-center text-white"><Users size={20}/></div>
              <div><p className="font-bold dark:text-white">Internal Voting Link</p><p className="text-xs text-slate-500">Kirim link ini ke tim Anda (Sutradara/Produser) untuk memilih talent terbaik.</p></div>
          </div>
          <button className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs">Generate Voting Link</button>
      </div>
              </div>
              <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-400">AI Sedang Memindai Referensi...</h3>
              <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1 max-w-md mx-auto">Mengekstrak vektor wajah dan mencocokkannya dengan 5,000+ database Orland Talent.</p>
      <div className="mt-10 p-6 bg-white dark:bg-dark-card border border-brand-500 border-dashed rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-brand-500 rounded-full flex items-center justify-center text-white"><Users size={20}/></div>
              <div><p className="font-bold dark:text-white">Internal Voting Link</p><p className="text-xs text-slate-500">Kirim link ini ke tim Anda (Sutradara/Produser) untuk memilih talent terbaik.</p></div>
          </div>
          <button className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs">Generate Voting Link</button>
      </div>
          </div>
      )}

      {/* AI MODE ACTIVE INDICATOR */}
      {aiMode && !isScanning && (
          <div className="flex justify-between items-center bg-gradient-to-r from-indigo-900 to-purple-900 text-white p-4 rounded-2xl mb-6 shadow-inner border border-indigo-700">
              <div className="flex items-center">
                  <Sparkles className="text-amber-400 mr-3" size={20} />
                  <div>
                      <p className="font-bold text-sm">Hasil Pencocokan AI Vision Aktif</p>
                      <p className="text-xs text-indigo-200">Menampilkan talent dengan struktur wajah paling mirip dengan referensi Anda.</p>
      <div className="mt-10 p-6 bg-white dark:bg-dark-card border border-brand-500 border-dashed rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-brand-500 rounded-full flex items-center justify-center text-white"><Users size={20}/></div>
              <div><p className="font-bold dark:text-white">Internal Voting Link</p><p className="text-xs text-slate-500">Kirim link ini ke tim Anda (Sutradara/Produser) untuk memilih talent terbaik.</p></div>
          </div>
          <button className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs">Generate Voting Link</button>
      </div>
                  </div>
      <div className="mt-10 p-6 bg-white dark:bg-dark-card border border-brand-500 border-dashed rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-brand-500 rounded-full flex items-center justify-center text-white"><Users size={20}/></div>
              <div><p className="font-bold dark:text-white">Internal Voting Link</p><p className="text-xs text-slate-500">Kirim link ini ke tim Anda (Sutradara/Produser) untuk memilih talent terbaik.</p></div>
          </div>
          <button className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs">Generate Voting Link</button>
      </div>
              </div>
              <button onClick={clearAISearch} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><X size={18}/></button>
      <div className="mt-10 p-6 bg-white dark:bg-dark-card border border-brand-500 border-dashed rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-brand-500 rounded-full flex items-center justify-center text-white"><Users size={20}/></div>
              <div><p className="font-bold dark:text-white">Internal Voting Link</p><p className="text-xs text-slate-500">Kirim link ini ke tim Anda (Sutradara/Produser) untuk memilih talent terbaik.</p></div>
          </div>
          <button className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs">Generate Voting Link</button>
      </div>
          </div>
      )}

      {/* TALENT GRID (PINTEREST STYLE MASONRY SIMULATION) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {talents.map((talent) => (
              <div key={talent.id} className="group relative bg-white dark:bg-dark-card rounded-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:border-brand-400 dark:hover:border-brand-500 transition-all duration-300">
                  
                  {/* FOTO BESAR */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img src={talent.image} alt={talent.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      
                      {/* OVERLAY GRADIENT BAWAH */}
      <div className="mt-10 p-6 bg-white dark:bg-dark-card border border-brand-500 border-dashed rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-brand-500 rounded-full flex items-center justify-center text-white"><Users size={20}/></div>
              <div><p className="font-bold dark:text-white">Internal Voting Link</p><p className="text-xs text-slate-500">Kirim link ini ke tim Anda (Sutradara/Produser) untuk memilih talent terbaik.</p></div>
          </div>
          <button className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs">Generate Voting Link</button>
      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-60"></div>
                      
                      {/* INFO ATAS: AI Match Score & Rate */}
                      <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                          {aiMode && (
                              <span className="bg-amber-400 text-amber-950 text-[10px] font-black uppercase px-2 py-1 rounded shadow-lg flex items-center">
                                  {talent.match}% Match
                              </span>
                          )}
                          {!aiMode && <span className="bg-black/50 backdrop-blur-md text-white border border-white/20 text-[10px] font-bold px-2 py-1 rounded-md">{talent.rate}</span>}
      <div className="mt-10 p-6 bg-white dark:bg-dark-card border border-brand-500 border-dashed rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-brand-500 rounded-full flex items-center justify-center text-white"><Users size={20}/></div>
              <div><p className="font-bold dark:text-white">Internal Voting Link</p><p className="text-xs text-slate-500">Kirim link ini ke tim Anda (Sutradara/Produser) untuk memilih talent terbaik.</p></div>
          </div>
          <button className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs">Generate Voting Link</button>
      </div>
                      </div>

                      {/* INFO BAWAH: Nama & Atribut */}
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                          <h3 className="font-black text-xl leading-tight mb-1 drop-shadow-md">{talent.name}</h3>
                          <p className="text-brand-300 text-xs font-bold uppercase tracking-wider mb-2">{talent.category}</p>
                          <div className="flex items-center gap-3 text-xs font-medium text-slate-200">
                              <span className="flex items-center bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm">{talent.height}</span>
                              <span className="flex items-center bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm"><MapPin size={10} className="mr-1 text-red-400"/> {talent.location}</span>
      <div className="mt-10 p-6 bg-white dark:bg-dark-card border border-brand-500 border-dashed rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-brand-500 rounded-full flex items-center justify-center text-white"><Users size={20}/></div>
              <div><p className="font-bold dark:text-white">Internal Voting Link</p><p className="text-xs text-slate-500">Kirim link ini ke tim Anda (Sutradara/Produser) untuk memilih talent terbaik.</p></div>
          </div>
          <button className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs">Generate Voting Link</button>
      </div>
                          </div>
      <div className="mt-10 p-6 bg-white dark:bg-dark-card border border-brand-500 border-dashed rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-brand-500 rounded-full flex items-center justify-center text-white"><Users size={20}/></div>
              <div><p className="font-bold dark:text-white">Internal Voting Link</p><p className="text-xs text-slate-500">Kirim link ini ke tim Anda (Sutradara/Produser) untuk memilih talent terbaik.</p></div>
          </div>
          <button className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs">Generate Voting Link</button>
      </div>
                      </div>

                      {/* HOVER ACTION OVERLAY (SHORTLIST BUTTON) */}
                      <div className="absolute inset-0 bg-brand-900/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-6">
                          <button 
                              onClick={() => handleShortlist(talent.name)}
                              className="w-full py-3 bg-white text-brand-700 font-bold rounded-xl shadow-2xl flex items-center justify-center hover:scale-105 transition-transform"
                          >
                              <UserPlus size={18} className="mr-2" /> Shortlist
                          </button>
      <div className="mt-10 p-6 bg-white dark:bg-dark-card border border-brand-500 border-dashed rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-brand-500 rounded-full flex items-center justify-center text-white"><Users size={20}/></div>
              <div><p className="font-bold dark:text-white">Internal Voting Link</p><p className="text-xs text-slate-500">Kirim link ini ke tim Anda (Sutradara/Produser) untuk memilih talent terbaik.</p></div>
          </div>
          <button className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs">Generate Voting Link</button>
      </div>
                      </div>
      <div className="mt-10 p-6 bg-white dark:bg-dark-card border border-brand-500 border-dashed rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-brand-500 rounded-full flex items-center justify-center text-white"><Users size={20}/></div>
              <div><p className="font-bold dark:text-white">Internal Voting Link</p><p className="text-xs text-slate-500">Kirim link ini ke tim Anda (Sutradara/Produser) untuk memilih talent terbaik.</p></div>
          </div>
          <button className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs">Generate Voting Link</button>
      </div>
                  </div>
      <div className="mt-10 p-6 bg-white dark:bg-dark-card border border-brand-500 border-dashed rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-brand-500 rounded-full flex items-center justify-center text-white"><Users size={20}/></div>
              <div><p className="font-bold dark:text-white">Internal Voting Link</p><p className="text-xs text-slate-500">Kirim link ini ke tim Anda (Sutradara/Produser) untuk memilih talent terbaik.</p></div>
          </div>
          <button className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs">Generate Voting Link</button>
      </div>
              </div>
          ))}
      <div className="mt-10 p-6 bg-white dark:bg-dark-card border border-brand-500 border-dashed rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-brand-500 rounded-full flex items-center justify-center text-white"><Users size={20}/></div>
              <div><p className="font-bold dark:text-white">Internal Voting Link</p><p className="text-xs text-slate-500">Kirim link ini ke tim Anda (Sutradara/Produser) untuk memilih talent terbaik.</p></div>
          </div>
          <button className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs">Generate Voting Link</button>
      </div>
      </div>

      <div className="mt-10 p-6 bg-white dark:bg-dark-card border border-brand-500 border-dashed rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-brand-500 rounded-full flex items-center justify-center text-white"><Users size={20}/></div>
              <div><p className="font-bold dark:text-white">Internal Voting Link</p><p className="text-xs text-slate-500">Kirim link ini ke tim Anda (Sutradara/Produser) untuk memilih talent terbaik.</p></div>
          </div>
          <button className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs">Generate Voting Link</button>
      </div>
    </div>
  )
}
