import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Instagram, Twitter, MessageSquare } from 'lucide-react';

interface Props {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step3_Social({ data, onUpdate, onNext, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  
  const [instagram, setInstagram] = useState(data.instagram || '');
  const [tiktok, setTiktok] = useState(data.tiktok || '');
  const [twitter, setTwitter] = useState(data.twitter || '');

  const handleSave = async () => {
    setLoading(true);
    try {
        // Simulasi Eksekusi Endpoint Socials /talents/{id}/socials
        await new Promise(resolve => setTimeout(resolve, 800));
        
        onUpdate({ instagram, tiktok, twitter });
        onNext();
    } catch (e) {
        alert("Gagal menautkan media sosial.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div>
        <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Pengaruh Digital (Opsional)</h3>
        <p className="text-sm text-slate-500 mt-1">Klien B2B kami seringkali mencari Talent dengan wibawa digital yang kuat. Tautkan media sosial Anda.</p>
      </div>

      <div className="space-y-4 max-w-xl">
        <label className="flex items-center w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus-within:ring-2 focus-within:ring-brand-500 dark:bg-slate-800 dark:border-slate-700 transition-shadow">
           <Instagram size={20} className="text-pink-600 mr-3" />
           <input 
            type="url" value={instagram} onChange={e => setInstagram(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm dark:text-white"
            placeholder="https://instagram.com/username"
          />
        </label>
        
        <label className="flex items-center w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus-within:ring-2 focus-within:ring-brand-500 dark:bg-slate-800 dark:border-slate-700 transition-shadow">
           <MessageSquare size={20} className="text-slate-900 dark:text-slate-300 mr-3" />
           <input 
            type="url" value={tiktok} onChange={e => setTiktok(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm dark:text-white"
            placeholder="https://tiktok.com/@username"
          />
        </label>

        <label className="flex items-center w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus-within:ring-2 focus-within:ring-brand-500 dark:bg-slate-800 dark:border-slate-700 transition-shadow">
           <Twitter size={20} className="text-blue-400 mr-3" />
           <input 
            type="url" value={twitter} onChange={e => setTwitter(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm dark:text-white"
            placeholder="https://x.com/username"
          />
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
                Simpan Tautan
                {!loading && <ArrowRight className="ml-2" size={18} />}
            </button>
        </div>
      </div>
    </div>
  );
}
