import { useState } from 'react';
import { FileEdit, Sparkles, Download, Copy, Eye, Layout, Type, Image as ImageIcon, CheckCircle2, Send, Wand2 } from 'lucide-react';

export default function BriefBuilder() {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [briefData, setBriefData] = useState({
    product: '',
    usp: '',
    tone: 'Casual & Fun',
    duration: '30s'
  });

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setStep(2);
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-20">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
            <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">Campaign Tool</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Brief Builder AI</h1>
            <p className="text-slate-500 text-sm">Buat instruksi konten (SOP) untuk Talent dalam sekejap.</p>
        </div>
        
        {step === 2 && (
            <div className="flex gap-2 w-full sm:w-auto">
                <button className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700">
                    <Copy size={14} className="mr-2"/> Salin Link
                </button>
                <button className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-bold shadow-lg shadow-brand-500/20">
                    <Download size={14} className="mr-2"/> Download PDF
                </button>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* KOLOM KIRI: FORM CONFIGURATOR (4 COLS) */}
          <div className="lg:col-span-4 space-y-6">
              <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                      <Layout className="mr-2 text-brand-500" size={18}/> Campaign Setup
                  </h3>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Produk</label>
                          <input 
                            type="text" 
                            placeholder="Contoh: Skincare Glow Up"
                            className="w-full mt-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none dark:text-white focus:ring-2 focus:ring-brand-500"
                            onChange={(e) => setBriefData({...briefData, product: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">USP (Keunggulan Utama)</label>
                          <textarea 
                            rows={3}
                            placeholder="Contoh: Mencerahkan dalam 7 hari, Tanpa Alkohol"
                            className="w-full mt-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none dark:text-white focus:ring-2 focus:ring-brand-500 resize-none"
                            onChange={(e) => setBriefData({...briefData, usp: e.target.value})}
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tone</label>
                              <select className="w-full mt-1 px-3 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold">
                                  <option>Casual & Fun</option>
                                  <option>Professional</option>
                                  <option>Educational</option>
                              </select>
                          </div>
                          <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Durasi</label>
                              <select className="w-full mt-1 px-3 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold">
                                  <option>15-30 detik</option>
                                  <option>60 detik</option>
                                  <option>Vlog Style</option>
                              </select>
                          </div>
                      </div>
                  </div>

                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || !briefData.product}
                    className="w-full mt-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl shadow-xl hover:scale-105 transition-transform flex items-center justify-center disabled:opacity-50"
                  >
                    {isGenerating ? <Sparkles className="animate-spin mr-2" size={18}/> : <Wand2 className="mr-2" size={18}/>}
                    {isGenerating ? 'AI Sedang Menulis...' : 'Generate Brief'}
                  </button>
              </div>
          </div>

          {/* KOLOM KANAN: PREVIEW DOKUMEN (8 COLS) */}
          <div className="lg:col-span-8">
              <div className="bg-slate-200 dark:bg-slate-950 rounded-3xl p-4 sm:p-8 min-h-[600px] border border-slate-300 dark:border-slate-800 relative overflow-hidden">
                  
                  {step === 1 ? (
                      <div className="h-[500px] flex flex-col items-center justify-center text-center px-10">
                          <div className="w-20 h-20 bg-white/50 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/20">
                              <Type className="text-slate-400" size={32}/>
                          </div>
                          <h4 className="text-slate-500 font-bold">Belum Ada Naskah</h4>
                          <p className="text-slate-400 text-xs mt-2 max-w-xs leading-relaxed">Isi formulir di samping untuk mulai menghasilkan instruksi konten yang dipersonalisasi untuk Talent Anda.</p>
                      </div>
                  ) : (
                      <div className="bg-white dark:bg-slate-900 shadow-2xl rounded-lg p-8 sm:p-12 animate-in zoom-in-95 duration-500 text-slate-800 dark:text-slate-200 min-h-full border border-white/10">
                          {/* Header Dokumen */}
                          <div className="border-b-4 border-slate-900 dark:border-brand-500 pb-6 mb-8 flex justify-between items-start">
                              <div>
                                  <h2 className="text-2xl font-black uppercase tracking-tighter">Creative Brief</h2>
                                  <p className="text-xs font-bold text-slate-400 uppercase">Ref ID: ORL-2026-X01</p>
                              </div>
                              <div className="text-right">
                                  <p className="text-[10px] font-black text-brand-500 uppercase">Orland Management</p>
                                  <p className="text-[10px] text-slate-400">Campaign Platform: TikTok</p>
                              </div>
                          </div>

                          {/* Konten Brief */}
                          <div className="space-y-8">
                              <section>
                                  <h4 className="text-xs font-black text-brand-600 dark:text-brand-400 uppercase mb-3 flex items-center"><CheckCircle2 size={14} className="mr-2"/> Mandatory (Wajib Ada)</h4>
                                  <ul className="list-disc list-inside text-sm space-y-2 ml-2">
                                      <li>Menyebutkan nama produk <span className="font-bold underline">"{briefData.product}"</span> di 3 detik pertama.</li>
                                      <li>Menunjukkan tekstur produk di depan kamera (*Close up*).</li>
                                      <li>Menyebutkan USP: <span className="italic">"{briefData.usp}"</span>.</li>
                                      <li>Wajib mencantumkan link di bio atau keranjang kuning.</li>
                                  </ul>
                              </section>

                              <section className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase mb-4 flex items-center"><Sparkles size={14} className="mr-2 text-amber-500"/> Sugested Script (Ide Naskah)</h4>
                                  <div className="space-y-4">
                                      <div>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">00:00 - 00:05 (Hook)</p>
                                          <p className="text-sm font-medium leading-relaxed italic border-l-2 border-slate-300 dark:border-slate-700 pl-4">"Capek banget muka kusam terus? Aku baru nemuin rahasianya, cuma 7 hari aja!"</p>
                                      </div>
                                      <div>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">00:05 - 00:20 (Body)</p>
                                          <p className="text-sm font-medium leading-relaxed italic border-l-2 border-slate-300 dark:border-slate-700 pl-4">"Kenalin nih {briefData.product}. Teksturnya ringan banget, nggak lengket, dan yang paling aku suka karena {briefData.usp}."</p>
                                      </div>
                                      <div>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">00:20 - 00:30 (CTA)</p>
                                          <p className="text-sm font-medium leading-relaxed italic border-l-2 border-slate-300 dark:border-slate-700 pl-4">"Buruan cek keranjang kuning sebelum kehabisan diskonnya ya!"</p>
                                      </div>
                                  </div>
                              </section>

                              <section>
                                  <h4 className="text-xs font-black text-red-600 dark:text-red-400 uppercase mb-3 flex items-center"><AlertTriangle size={14} className="mr-2"/> Do Not (Dilarang)</h4>
                                  <ul className="list-disc list-inside text-sm space-y-1 ml-2 text-slate-500">
                                      <li>Dilarang menyebutkan nama kompetitor.</li>
                                      <li>Dilarang menggunakan musik yang terkena *copyright*.</li>
                                      <li>Dilarang berpakaian terlalu terbuka.</li>
                                  </ul>
                              </section>
                          </div>

                          {/* Footer Dokumen */}
                          <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 text-[9px] text-slate-400 flex justify-between">
                              <p>© 2026 Orland Management Enterprise. All Rights Reserved.</p>
                              <p>Generated by Orland AI Engine</p>
                          </div>
                      </div>
                  )}

                  {/* Icon Floating Decorative */}
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
              </div>
          </div>
      </div>
    </div>
  )
}

function AlertTriangle({ size, className }: { size: number, className: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>;
}
