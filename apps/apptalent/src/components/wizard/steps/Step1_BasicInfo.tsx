import React from 'react';
import { ArrowRight, RotateCcw, RotateCw, AlertCircle } from 'lucide-react';
import { FieldStatus } from '@/hooks/useProfileFormState';

interface Props {
  data: any;
  fieldStatus: Record<string, FieldStatus>;
  onUpdate: (fieldName: string, value: any) => void;
  onNext: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export default function Step1_BasicInfo({ 
  data, 
  fieldStatus, 
  onUpdate, 
  onNext, 
  undo, 
  redo, 
  canUndo, 
  canRedo 
}: Props) {
  // Helper to get field status styling
  const getFieldClass = (fieldName: string) => {
    const status = fieldStatus[fieldName];
    if (!status) return "border-slate-200";
    if (status.hasError) return "border-red-500 focus:ring-red-500";
    if (status.isSaving) return "border-blue-500 focus:ring-blue-500";
    if (status.isDirty) return "border-yellow-500 focus:ring-yellow-500";
    return "border-slate-200";
  };

  const isComplete = data.full_name && data.category && data.height && data.weight && data.birth_date && data.gender;

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Informasi Dasar (Biodata Fisik)</h3>
          <p className="text-sm text-slate-500 mt-1">Isi identitas fundamental ini sebagai landasan awal portofolio Anda.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={undo}
            disabled={!canUndo}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Undo"
          >
            <RotateCcw size={18} />
          </button>
          <button 
            onClick={redo}
            disabled={!canRedo}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Redo"
          >
            <RotateCw size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div className="md:col-span-2">
          <label className="text-xs font-bold text-slate-500 mb-1 flex justify-between items-center">
            <span>Nama Sesuai KTP (Real Name)</span>
            {fieldStatus.full_name?.isSaving && <span className="text-[10px] text-blue-500">Menyimpan...</span>}
            {fieldStatus.full_name?.hasError && <span className="text-[10px] text-red-500">Error</span>}
          </label>
          <input 
            type="text"
            value={data.full_name || ''}
            onChange={e => onUpdate('full_name', e.target.value)}
            className={`w-full px-4 py-3 rounded-xl bg-slate-50 border-2 focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-colors ${getFieldClass('full_name')}`}
            placeholder="Jhon Doe"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 mb-1 flex justify-between items-center">
            <span>Kategori Talent Utama</span>
            {fieldStatus.category?.isDirty && <span className="text-[10px] text-yellow-600 dark:text-yellow-400">Belum Disimpan</span>}
          </label>
          <select 
            value={data.category || ''}
            onChange={e => onUpdate('category', e.target.value)}
            className={`w-full px-4 py-3 rounded-xl bg-slate-50 border-2 focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-colors ${getFieldClass('category')}`}
          >
            <option value="">Pilih Kategori...</option>
            <option value="Model">Model</option>
            <option value="Actor">Aktor / Aktris</option>
            <option value="Voice Over">Voice Over</option>
            <option value="Influencer">Influencer</option>
            <option value="MC">Master of Ceremony (MC)</option>
          </select>
        </div>

        <div>
           <label className="text-xs font-bold text-slate-500 mb-1 block">Jenis Kelamin</label>
           <select 
            value={data.gender || ''}
            onChange={e => onUpdate('gender', e.target.value)}
            className={`w-full px-4 py-3 rounded-xl bg-slate-50 border-2 focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-colors ${getFieldClass('gender')}`}
          >
            <option value="">Pilih...</option>
            <option value="Male">Pria</option>
            <option value="Female">Wanita</option>
          </select>
        </div>
        
        <div>
          <label className="text-xs font-bold text-slate-500 mb-1 block">Tinggi Badan (cm)</label>
          <input 
            type="number"
            value={data.height || ''}
            onChange={e => onUpdate('height', e.target.value ? parseFloat(e.target.value) : null)}
            className={`w-full px-4 py-3 rounded-xl bg-slate-50 border-2 focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-colors ${getFieldClass('height')}`}
            placeholder="Contoh: 175"
          />
        </div>

        <div>
           <label className="text-xs font-bold text-slate-500 mb-1 block">Berat Badan (kg)</label>
           <input 
            type="number"
            value={data.weight || ''}
            onChange={e => onUpdate('weight', e.target.value ? parseFloat(e.target.value) : null)}
            className={`w-full px-4 py-3 rounded-xl bg-slate-50 border-2 focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-colors ${getFieldClass('weight')}`}
             placeholder="Contoh: 65"
          />
        </div>

        <div>
           <label className="text-xs font-bold text-slate-500 mb-1 block">Tanggal Lahir (Untuk Kalkulasi Usia)</label>
           <input 
            type="date"
            value={data.birth_date || ''}
            onChange={e => onUpdate('birth_date', e.target.value)}
            className={`w-full px-4 py-3 rounded-xl bg-slate-50 border-2 focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-colors ${getFieldClass('birth_date')}`}
          />
        </div>

        {/* DOMISILI - NOTA PENGINGAT FILTERING MASA DEPAN */}
        <div className="relative group">
           <label className="text-xs font-bold text-slate-500 mb-1 flex justify-between">
              Wilayah / Domisili
              <span className="text-[10px] text-brand-500 bg-brand-50 px-2 py-0.5 rounded-full">(Segera Hadir)</span>
           </label>
           <input 
            type="text"
            value={data.domisili || 'Jakarta'}
            disabled
            className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-500 opacity-60 cursor-not-allowed"
             placeholder="Jakarta"
          />
          <div className="absolute top-full left-0 mt-1 hidden group-hover:block bg-slate-800 text-white text-xs p-2 rounded z-20 shadow-lg border border-slate-700">
             <div className="flex items-start gap-2">
                 <AlertCircle size={14} className="shrink-0 text-brand-400 mt-0.5" />
                 <p>Catatan Arsitektur: Input alamat/regional (Domisili) saat ini belum didukung oleh Skema DB_CORE Talent API. Tim *Backend* akan menambahkan parameter filter `geo-domisili` untuk algoritma Casting Intelligence di masa depan.</p>
             </div>
          </div>
        </div>

      </div>

      {/* Display validation errors if any */}
      {Object.entries(fieldStatus).some(([_, status]) => status.hasError) && (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg flex gap-2">
          <AlertCircle className="text-red-500 shrink-0" size={18} />
          <p className="text-sm text-red-700 dark:text-red-400">Ada beberapa field yang memiliki error. Silakan periksa kembali.</p>
        </div>
      )}

      <div className="pt-6 flex justify-end">
        <button 
            onClick={onNext}
            disabled={!isComplete}
            className="flex items-center px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-brand-500/30"
        >
            Lanjutkan
            <ArrowRight className="ml-2" size={18} />
        </button>
      </div>
    </div>
  );
}
