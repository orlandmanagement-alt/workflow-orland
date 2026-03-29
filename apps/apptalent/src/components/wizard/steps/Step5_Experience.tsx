import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2, PlusCircle, Trash2 } from 'lucide-react';

interface Props {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

interface Experience {
  project_name: string;
  year: string;
  role: string;
  client: string;
}

export default function Step5_Experience({ data, onUpdate, onNext, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [experiences, setExperiences] = useState<Experience[]>(
      data.experiences && data.experiences.length > 0 
      ? data.experiences 
      : [{ project_name: '', year: new Date().getFullYear().toString(), role: '', client: '' }]
  );

  const handleUpdateExp = (index: number, key: keyof Experience, value: string) => {
      const newExps = [...experiences];
      newExps[index][key] = value;
      setExperiences(newExps);
  };

  const removeExp = (index: number) => {
      const newExps = experiences.filter((_, i) => i !== index);
      setExperiences(newExps.length > 0 ? newExps : [{ project_name: '', year: new Date().getFullYear().toString(), role: '', client: '' }]);
  };

  const addExp = () => {
      setExperiences([...experiences, { project_name: '', year: '', role: '', client: '' }]);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
        // Hanya kirim data yang valid
        const validExps = experiences.filter(e => e.project_name.trim() !== '');
        
        // Simulasi POST berulang kali
        // validExps.forEach(exp => apiRequest('/talents/me/experiences', { method: 'POST', body: exp }));
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        onUpdate({ experiences: validExps });
        onNext();
    } catch (e) {
        alert("Gagal merangkum portofolio Karir.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex justify-between items-start">
        <div>
           <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Kredit Pengalaman Karir</h3>
           <p className="text-sm text-slate-500 mt-1">Daftar produksi atau kampanye historis yang pernah menaungi bakat Anda. Validasi karir yang kuat meningkatkan bayaran.</p>
        </div>
        <button onClick={addExp} className="hidden sm:flex items-center px-4 py-2 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-500/20 font-bold rounded-full text-xs transition-colors">
            <PlusCircle size={14} className="mr-1" /> Tambah Kolom
        </button>
      </div>

      <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
          {experiences.map((exp, idx) => (
             <div key={idx} className="relative p-5 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                 <button onClick={() => removeExp(idx)} className="absolute top-3 right-3 p-1.5 text-slate-400 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-500/20 rounded-lg transition-colors">
                     <Trash2 size={16} />
                 </button>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mr-6">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Judul Project / Iklan</label>
                        <input type="text" placeholder="Contoh: TVC Minuman XYZ" value={exp.project_name} onChange={e => handleUpdateExp(idx, 'project_name', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm rounded-lg outline-none focus:border-brand-500 dark:text-white" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Tahun Produksi</label>
                        <input type="number" placeholder="2024" value={exp.year} onChange={e => handleUpdateExp(idx, 'year', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm rounded-lg outline-none focus:border-brand-500 dark:text-white" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Peran</label>
                        <input type="text" placeholder="Pemeran Utama" value={exp.role} onChange={e => handleUpdateExp(idx, 'role', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm rounded-lg outline-none focus:border-brand-500 dark:text-white" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Klien / Production House</label>
                        <input type="text" placeholder="PT Megah Jaya Kreatif" value={exp.client} onChange={e => handleUpdateExp(idx, 'client', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm rounded-lg outline-none focus:border-brand-500 dark:text-white" />
                    </div>
                 </div>
             </div>
          ))}
          
          <button onClick={addExp} className="sm:hidden w-full py-3 flex justify-center items-center bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 font-bold rounded-2xl text-sm transition-colors mt-2">
            <PlusCircle size={16} className="mr-2" /> Tambah Rekam Jejak
        </button>
      </div>

      <div className="pt-4 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
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
                className="flex items-center px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 shadow-md shadow-brand-500/30"
            >
                {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                Simpan Karir
                {!loading && <ArrowRight className="ml-2" size={18} />}
            </button>
        </div>
      </div>
    </div>
  );
}
