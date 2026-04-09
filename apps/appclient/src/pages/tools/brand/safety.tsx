import { useState } from 'react';
import { ShieldAlert, ShieldCheck, Radar, Search, AlertTriangle, AlertOctagon, Activity, ChevronRight, Info, Loader2 } from 'lucide-react';
import { brandService } from '@/lib/services/toolsService';

export default function BrandSafetyScanner() {
  const [username, setUsername] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!username.trim()) return;

      setIsScanning(true);
      setResult(null);
      setError(null);
      setScanLogs(['Menghubungkan ke API Sosial Media...']);

      try {
        // Simulasi scan logs
        setTimeout(() => setScanLogs(prev => [...prev, `Mengunduh riwayat ${username}...`]), 1000);
        setTimeout(() => setScanLogs(prev => [...prev, 'Menjalankan NLP Sentiment Analysis...']), 2000);
        setTimeout(() => setScanLogs(prev => [...prev, 'Mencocokkan dengan Database Blacklist Orland...']), 3000);
        setTimeout(() => setScanLogs(prev => [...prev, 'Menghitung Skor Keamanan (Safety Score)...']), 4000);

        // Call API
        const response = await brandService.scanTalentSafety(username);
        
        setTimeout(() => {
            setIsScanning(false);
            setResult(response);
        }, 5000);
      } catch (err: any) {
        console.error('Scan error:', err);
        setError(err.message || 'Gagal memindai talent');
        setIsScanning(false);
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-20">
      
      {/* ERROR ALERT */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-3xl flex items-start gap-4">
          <AlertTriangle className="text-red-600 dark:text-red-400 shrink-0 mt-1" size={24} />
          <div className="flex-1">
            <h2 className="font-bold text-red-900 dark:text-red-400 mb-1">Scan Error</h2>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 dark:text-red-400 hover:text-red-700">
            Tutup
          </button>
        </div>
      )}
      
      {/* HEADER TINGKAT TINGGI (ANALITIS & SERIUS) */}
      <div className="bg-slate-900 dark:bg-black rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 p-8 opacity-5"><ShieldAlert size={160} className="text-white"/></div>
        
        <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
                <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-black uppercase px-2.5 py-1 rounded tracking-widest">Brand Protection Tool</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center tracking-tight mb-2">
                Brand Safety Scanner
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed mb-8">
                Lindungi reputasi Brand Anda dari "Cancel Culture". Masukkan *username* sosial media calon Talent, dan AI Orland akan memindai riwayat jejak digital mereka (Hate speech, SARA, Kontroversi) dalam hitungan detik.
            </p>

            {/* FORM INPUT SCAN */}
            <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-3 max-w-xl">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Search className="text-slate-500" size={18} /></div>
                    <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Contoh: @rezadian_real" 
                        className="w-full pl-11 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 outline-none transition-shadow" 
                        required
                        disabled={isScanning}
                    />
                </div>
                <button 
                    type="submit"
                    disabled={isScanning || !username}
                    className="px-8 py-4 bg-white text-slate-900 font-black rounded-xl shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center whitespace-nowrap"
                >
                    {isScanning ? <><Loader2 size={18} className="animate-spin mr-2"/> Memindai...</> : 'Mulai Scan AI'}
                </button>
            </form>
        </div>
      </div>

      {/* STATE 1: SCANNING RADAR ANIMATION */}
      {isScanning && (
          <div className="bg-white dark:bg-dark-card rounded-3xl p-10 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center animate-in fade-in">
              <div className="relative w-32 h-32 mb-8">
                  {/* Radar Circles */}
                  <div className="absolute inset-0 border border-brand-500/20 rounded-full animate-ping"></div>
                  <div className="absolute inset-2 border border-brand-500/40 rounded-full"></div>
                  <div className="absolute inset-6 border border-brand-500/60 rounded-full"></div>
                  {/* Sweeping Line */}
                  <div className="absolute top-1/2 left-1/2 w-16 h-0.5 bg-brand-500 origin-left animate-[spin_2s_linear_infinite]">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-16 bg-gradient-to-r from-transparent to-brand-500/50 rounded-full blur-sm origin-left -translate-x-full"></div>
                  </div>
                  <Radar className="absolute inset-0 m-auto text-brand-600 dark:text-brand-500" size={32} />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Deep Scanning Berlangsung...</h3>
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 w-full max-w-md text-left space-y-2">
                  {scanLogs.map((log, i) => (
                      <p key={i} className="text-xs font-mono text-slate-500 flex items-center animate-in slide-in-from-left-2">
                          <ChevronRight size={12} className="mr-1 text-brand-500"/> {log}
                      </p>
                  ))}
                  <p className="text-xs font-mono text-brand-500 flex items-center animate-pulse"><ChevronRight size={12} className="mr-1"/> _</p>
              </div>
          </div>
      )}

      {/* STATE 2: SCAN RESULTS (HIGH RISK DEMO) */}
      {result && !isScanning && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-8 duration-500">
              
              {/* KOLOM KIRI: GAUGE & SKOR */}
              <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white dark:bg-dark-card rounded-3xl p-8 border border-red-200 dark:border-red-900/30 shadow-xl shadow-red-500/5 text-center">
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Safety Score</p>
                      
                      {/* Circle Gauge (Red for High Risk) */}
                      <div className="relative w-40 h-40 mx-auto mb-6">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-100 dark:text-slate-800" />
                              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" strokeDasharray={`${result.safetyScore * 2.82} 282`} className="text-red-500 transition-all duration-1000 ease-out" />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-4xl font-black text-slate-900 dark:text-white">{result.safetyScore}</span>
                              <span className="text-[10px] text-slate-500 font-bold">/ 100</span>
                          </div>
                      </div>

                      <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-2 rounded-xl inline-flex items-center font-black tracking-widest text-lg border border-red-200 dark:border-red-800">
                          <AlertOctagon size={20} className="mr-2"/> {result.status}
                      </div>
                      
                      <p className="text-xs text-slate-500 mt-4 leading-relaxed">Dari {result.scanCount.toLocaleString()} interaksi digital, AI menemukan anomali sentimen negatif ekstrem di masa lalu akun <span className="font-bold">{result.username}</span>.</p>
                  </div>

                  <button className="w-full py-3 bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center" onClick={() => { setResult(null); setUsername(''); }}>
                      <Search size={16} className="mr-2"/> Cek Username Lain
                  </button>
              </div>

              {/* KOLOM KANAN: TEMUAN DETAIL */}
              <div className="lg:col-span-2 space-y-6">
                  
                  {/* Flagged Words Table */}
                  <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                      <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center bg-red-50/50 dark:bg-red-900/10">
                          <Activity className="text-red-500 mr-2" size={20}/>
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white">Flagged Keywords (Bendera Merah)</h3>
                      </div>
                      
                      <table className="w-full text-left border-collapse">
                          <thead>
                              <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                                  <th className="p-4 pl-6">Kata Sensitif</th>
                                  <th className="p-4 text-center">Frekuensi</th>
                                  <th className="p-4 pr-6">Konteks AI Deteksi</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                              {result.flaggedWords.map((item: any, idx: number) => (
                                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                      <td className="p-4 pl-6 font-bold text-slate-900 dark:text-white text-sm">{item.word}</td>
                                      <td className="p-4 text-center"><span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-mono text-xs font-bold">{item.count}x</span></td>
                                      <td className="p-4 pr-6 text-xs text-red-600 dark:text-red-400 font-bold">{item.context}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>

                  {/* Evidence (Bukti Postingan) */}
                  <div className="bg-white dark:bg-dark-card rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center">
                              <AlertTriangle className="text-amber-500 mr-2" size={20}/> Bukti Temuan Teks (Raw Evidence)
                          </h3>
                      </div>
                      
                      <div className="space-y-4">
                          {result.flaggedPosts.map((post: any, idx: number) => (
                              <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 relative">
                                  <div className="flex justify-between items-start mb-2">
                                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm">{post.platform}</span>
                                      <span className="text-[10px] font-bold text-slate-500">{post.date}</span>
                                  </div>
                                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 italic">"{post.text}"</p>
                              </div>
                          ))}
                      </div>

                      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-xl flex items-start gap-3">
                          <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-blue-800 dark:text-blue-400/90 leading-relaxed">Kesimpulan AI: Akun ini memiliki riwayat komentar agresif di isu politik dan sosial. Merekrut talent ini memiliki probabilitas 65% menimbulkan krisis PR (Public Relations) bagi Brand Anda.</p>
                      </div>
                  </div>

              </div>
          </div>
      )}

    </div>
  )
}
