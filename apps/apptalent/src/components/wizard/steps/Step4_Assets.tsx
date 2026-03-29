import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Video, Mic } from 'lucide-react';

interface Props {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step4_Assets({ data, onUpdate, onNext, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  
  const [showreel, setShowreel] = useState(data.showreel || '');
  const [voiceOver, setVoiceOver] = useState(data.voiceOver || '');

  const handleSave = async () => {
    setLoading(true);
    try {
        // Simulasi Eksekusi Endpoint Put Assets
        await new Promise(resolve => setTimeout(resolve, 800));
        
        onUpdate({ showreel, voiceOver });
        onNext();
    } catch (e) {
        alert("Gagal menautkan aset portofolio.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div>
        <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Showreel & Audiovisual (Opsional)</h3>
        <p className="text-sm text-slate-500 mt-1">Tunjukkan kemampuan terbaik melalui cuplikan karya hidup berformat video dan suara.</p>
      </div>

      <div className="space-y-4 max-w-xl">
        <label className="flex items-center w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus-within:ring-2 focus-within:ring-brand-500 dark:bg-slate-800 dark:border-slate-700 transition-shadow">
           <Video size={20} className="text-red-500 mr-3 shrink-0" />
           <div className="flex-1">
             <span className="block text-xs font-bold text-slate-500 mb-1">YouTube URL Showreel (Video Portofolio Utama)</span>
             <input 
              type="url" value={showreel} onChange={e => setShowreel(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-sm dark:text-white"
              placeholder="https://youtube.com/watch?v=XXXXX"
            />
           </div>
        </label>
        
        <label className="flex items-center w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus-within:ring-2 focus-within:ring-brand-500 dark:bg-slate-800 dark:border-slate-700 transition-shadow">
           <Mic size={20} className="text-indigo-400 mr-3 shrink-0" />
           <div className="flex-1">
             <span className="block text-xs font-bold text-slate-500 mb-1">Link Demo Voice / Pita Suara (SoundCloud/Drive)</span>
             <input 
              type="url" value={voiceOver} onChange={e => setVoiceOver(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-sm dark:text-white"
              placeholder="https://soundcloud.com/user/demo-suara"
            />
           </div>
        </label>
      </div>

      <div className="pt-6 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
        <button 
            onClick={onBack} disabled={loading}
            className="flex items-center px-4 py-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white font-bold transition-colors"
        >
            <ArrowLeft className="mr-2" size={18} /> Kembali
        </button>

        <div className="flex gap-3">
            <button 
                onClick={onNext} disabled={loading}
                className="px-6 py-3 font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
                Lewati
            </button>
            <button 
                onClick={handleSave} disabled={loading}
                className="flex items-center px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-brand-500/30"
            >
                {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                Simpan Aset
                {!loading && <ArrowRight className="ml-2" size={18} />}
            </button>
        </div>
      </div>
    </div>
  );
}
