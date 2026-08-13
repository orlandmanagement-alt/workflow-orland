import { useState } from 'react';
import { FileText, Wand2, UploadCloud, ChevronRight, Users, Plus, PlayCircle, Clock, Search, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { phService } from '@/lib/services/toolsService';

// Simulasi Data Hasil Breakdown AI
const MOCK_SCENES = [
  { 
    id: 'SC-01', scene: '1', setting: 'INT. CAFE - SIANG', description: 'Sarah duduk gelisah menunggu Budi. Pelayan membawakan kopi.',
    roles: [
        { name: 'Sarah', type: 'Main Talent', filled: 'Sarah Lee' },
        { name: 'Budi', type: 'Supporting', filled: null },
        { name: 'Pelayan', type: 'Extras', filled: null }
    ]
  },
  { 
    id: 'SC-02', scene: '2', setting: 'EXT. JALAN RAYA - SORE', description: 'Budi berlari menembus hujan, menabrak pejalan kaki.',
    roles: [
        { name: 'Budi', type: 'Supporting', filled: null },
        { name: 'Pejalan Kaki (3x)', type: 'Extras', filled: null }
    ]
  }
];

export default function ScriptBreakdown() {
  const [hasScript, setHasScript] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scenes, setScenes] = useState<any[]>([]);

  const handleUploadAndAnalyze = async () => {
      setHasScript(true);
      setIsAnalyzing(true);
      try {
        // Simulate API call with mock data
        // In real implementation, this would upload file to API and wait for analysis
        await new Promise(resolve => setTimeout(resolve, 3000));
        setScenes(MOCK_SCENES);
      } catch (err) {
        console.error('Analysis failed:', err);
      } finally {
        setIsAnalyzing(false);
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-20 h-[calc(100vh-100px)] flex flex-col">
      
      {/* HEADER TINGKAT TINGGI */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shrink-0">
        <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center tracking-tight">
                <FileText className="mr-3 text-brand-500" size={32}/> Script Breakdown (AI)
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">Unggah naskah PDF. AI kami akan mengekstrak latar adegan (Scene) dan mendeteksi kebutuhan karakter/talent secara otomatis.</p>
        </div>
        
        {!hasScript ? (
            <button className="flex items-center justify-center px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold shadow-lg opacity-50 cursor-not-allowed">
                Silakan Unggah Naskah
            </button>
        ) : (
            <div className="flex gap-2">
                <button className="flex items-center justify-center px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 shadow-sm transition-colors">
                    Export ke Call Sheet
                </button>
                <button className="flex items-center justify-center px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-md transition-colors">
                    + Tambah Scene Manual
                </button>
            </div>
        )}
      </div>

      {/* STATE 1: KOSONG (UPLOAD DROPZONE) */}
      {!hasScript && (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl bg-slate-50 dark:bg-slate-800/20 mt-8 group hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-colors cursor-pointer">
              <div className="h-24 w-24 bg-white dark:bg-slate-800 rounded-full shadow-md flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <UploadCloud size={40} className="text-brand-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Seret Naskah PDF ke Sini</h2>
              <p className="text-slate-500 text-sm mb-8 text-center max-w-md">Format yang didukung: Final Draft (.fdx), PDF Standar (.pdf). Ukuran maksimal 20MB.</p>
              
              <button onClick={handleUploadAndAnalyze} className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl shadow-xl hover:scale-105 transition-transform flex items-center">
                  <Wand2 size={20} className="mr-2"/> Temukan Talent dengan AI
              </button>
          </div>
      )}

      {/* STATE 2: SPLIT SCREEN (NASKAH vs HASIL AI) */}
      {hasScript && (
          <div className="flex-1 flex flex-col lg:flex-row gap-6 mt-4 min-h-0 overflow-hidden">
              
              {/* KOLOM KIRI: PDF VIEWER SIMULATION */}
              <div className="flex-1 bg-slate-200 dark:bg-[#121212] rounded-3xl border border-slate-300 dark:border-slate-800 shadow-inner overflow-hidden flex flex-col">
                  {/* Toolbar PDF */}
                  <div className="bg-white dark:bg-[#2d2d2d] p-3 border-b border-slate-300 dark:border-slate-700 flex justify-between items-center shadow-sm z-10">
                      <div className="flex items-center gap-2">
                          <FileText className="text-red-500" size={18}/>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Naskah_GlowSoap_Final.pdf</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-500">
                          <ZoomOut size={16} className="cursor-pointer hover:text-brand-500" />
                          <span className="text-[10px] font-mono">100%</span>
                          <ZoomIn size={16} className="cursor-pointer hover:text-brand-500" />
                      </div>
                  </div>
                  
                  {/* Kertas Naskah */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center scrollbar-thin scrollbar-thumb-slate-400">
                      <div className="bg-white w-full max-w-xl min-h-[800px] shadow-lg p-10 font-mono text-xs text-black leading-relaxed">
                          <h1 className="text-center font-bold text-lg mb-8 underline">TVC GLOW SOAP - RAMADHAN</h1>
                          
                          <div className="bg-amber-100 p-1 -mx-1 border-l-2 border-amber-500">
                              <p className="font-bold uppercase">1. INT. CAFE - SIANG</p>
                              <p className="mt-2">SARAH (20an, cantik natural) duduk gelisah menunggu BUDI. Seorang PELAYAN membawakan kopi.</p>
                          </div>
                          <p className="text-center mt-4 w-1/2 mx-auto font-bold">SARAH</p>
                          <p className="text-center w-2/3 mx-auto">(Melihat jam tangan)<br/>Duh, kok belum datang juga ya.</p>

                          <div className="bg-amber-100 p-1 -mx-1 border-l-2 border-amber-500 mt-8">
                              <p className="font-bold uppercase">2. EXT. JALAN RAYA - SORE</p>
                              <p className="mt-2">Hujan turun deras. BUDI berlari menembus hujan, tanpa sengaja menabrak beberapa PEJALAN KAKI.</p>
                          </div>
                          <p className="text-center mt-4 w-1/2 mx-auto font-bold">BUDI</p>
                          <p className="text-center w-2/3 mx-auto">Maaf, maaf! Saya buru-buru!</p>
                      </div>
                  </div>
              </div>

              {/* KOLOM KANAN: AI BREAKDOWN RESULTS */}
              <div className="w-full lg:w-[450px] bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col shrink-0 overflow-hidden">
                  <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-gradient-to-r from-brand-50 to-white dark:from-brand-900/10 dark:to-dark-card">
                      <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center">
                          <Wand2 className="mr-2 text-brand-500" size={20}/> Kebutuhan Talent
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Sistem mendeteksi 2 Scene dan 4 Karakter unik.</p>
                  </div>

                  {/* LOADING ANIMATION */}
                  {isAnalyzing ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                          <div className="relative w-16 h-16 mb-6">
                              <div className="absolute inset-0 border-4 border-brand-500/30 rounded-full"></div>
                              <div className="absolute inset-0 border-4 border-brand-600 rounded-full border-t-transparent animate-spin"></div>
                              <Search className="absolute inset-0 m-auto text-brand-600" size={20} />
                          </div>
                          <h4 className="font-bold text-slate-900 dark:text-white mb-2">Memecah Naskah...</h4>
                          <p className="text-xs text-slate-500">Menganalisis latar tempat, waktu, dan mengekstrak nama karakter dengan NLP (Natural Language Processing).</p>
                      </div>
                  ) : (
                      /* SCENE LIST */
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-[#071122]">
                          {scenes.map((sc, index) => (
                              <div key={sc.id} className="bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                  {/* Scene Header */}
                                  <div className="p-3 bg-slate-100 dark:bg-slate-800 flex justify-between items-center">
                                      <div className="flex items-center gap-2">
                                          <span className="h-6 w-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black rounded flex items-center justify-center">{sc.scene}</span>
                                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{sc.setting}</p>
                                      </div>
                                      <button className="text-brand-600 hover:text-brand-700 p-1"><PlayCircle size={16}/></button>
                                  </div>
                                  
                                  {/* Scene Description */}
                                  <div className="p-3 border-b border-slate-100 dark:border-slate-800/60">
                                      <p className="text-xs text-slate-500 italic">"{sc.description}"</p>
                                  </div>

                                  {/* Roles / Slots */}
                                  <div className="p-3 space-y-2">
                                      {sc.roles.map((role: any, rIdx: number) => (
                                          <div key={rIdx} className="flex items-center justify-between p-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                              <div>
                                                  <p className="text-xs font-bold text-slate-900 dark:text-white">{role.name}</p>
                                                  <p className="text-[10px] font-medium text-slate-500 uppercase">{role.type}</p>
                                              </div>
                                              
                                              {role.filled ? (
                                                  <div className="flex items-center gap-2 bg-white dark:bg-slate-700 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm">
                                                      <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=50" className="w-5 h-5 rounded-full object-cover" alt="T"/>
                                                      <span className="text-[10px] font-bold dark:text-white">{role.filled}</span>
                                                  </div>
                                              ) : (
                                                  <button className="text-[10px] font-bold bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 px-3 py-1.5 rounded-lg hover:bg-brand-200 transition-colors">
                                                      Isi Peran (Casting)
                                                  </button>
                                              )}
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      )}

    </div>
  )
}
