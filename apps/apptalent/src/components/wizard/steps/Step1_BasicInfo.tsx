import React, { useState } from 'react';
import { ArrowRight, Loader2, Info } from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface Props {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}

export default function Step1_BasicInfo({ data, onUpdate, onNext }: Props) {
  const [loading, setLoading] = useState(false);
  
  // State dari formData Pusat (pre-filled jika sebelumnya terputus/sudah punya data)
  const [fullName, setFullName] = useState(data.full_name || '');
  const [category, setCategory] = useState(data.category || '');
  const [height, setHeight] = useState(data.height?.toString() || '');
  const [weight, setWeight] = useState(data.weight?.toString() || '');
  const [birthDate, setBirthDate] = useState(data.birth_date || '');
  const [gender, setGender] = useState(data.gender || '');

  // FIELD ALAMAT (Placeholder untuk Catatan Filtering Mendatang)
  const [domisili, setDomisili] = useState(data.domisili || 'Jakarta');

  const handleSave = async () => {
    setLoading(true);
    try {
        const payload = {
            full_name: fullName,
            category: category,
            height: height ? parseFloat(height) : null,
            weight: weight ? parseFloat(weight) : null,
            birth_date: birthDate || null,
            gender: gender || null
            // Catatan: domisili belum masuk DB_CORE sesuai query saat ini, namun UI disiapkan
        };

        // SAVE-AS-YOU-GO : Tembakkan ke Database (PUT) agar tidak hilang jika terputus
        await apiRequest('/talents/me', {
            method: 'PUT',
            body: payload
        });
        
        onUpdate(payload);
        onNext(); // Melangkah ke Step selanjutnya
    } catch (e) {
        alert("Gagal merangkum informasi dasar Anda.");
    } finally {
        setLoading(false);
    }
  };

  const isComplete = fullName && category && height && weight && birthDate && gender;

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div>
        <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Informasi Dasar (Biodata Fisik)</h3>
        <p className="text-sm text-slate-500 mt-1">Isi identitas fundamental ini sebagai landasan awal portofolio Anda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div className="md:col-span-2">
          <label className="text-xs font-bold text-slate-500 mb-1 block">Nama Sesuai KTP (Real Name)</label>
          <input 
            type="text" value={fullName} onChange={e => setFullName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            placeholder="Jhon Doe"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 mb-1 block">Kategori Talent Utama</label>
          <select 
            value={category} onChange={e => setCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
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
            value={gender} onChange={e => setGender(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          >
            <option value="">Pilih...</option>
            <option value="Male">Pria</option>
            <option value="Female">Wanita</option>
          </select>
        </div>
        
        <div>
          <label className="text-xs font-bold text-slate-500 mb-1 block">Tinggi Badan (cm)</label>
          <input 
            type="number" value={height} onChange={e => setHeight(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            placeholder="Contoh: 175"
          />
        </div>

        <div>
           <label className="text-xs font-bold text-slate-500 mb-1 block">Berat Badan (kg)</label>
           <input 
            type="number" value={weight} onChange={e => setWeight(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
             placeholder="Contoh: 65"
          />
        </div>

        <div>
           <label className="text-xs font-bold text-slate-500 mb-1 block">Tanggal Lahir (Untuk Kalkulasi Usia)</label>
           <input 
            type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
        </div>

        {/* DOMISILI - NOTA PENGINGAT FILTERING MASA DEPAN */}
        <div className="relative group">
           <label className="text-xs font-bold text-slate-500 mb-1 flex justify-between">
              Wilayah / Domisili
              <span className="text-[10px] text-brand-500 bg-brand-50 px-2 py-0.5 rounded-full">(Segera Hadir)</span>
           </label>
           <input 
            type="text" value={domisili} disabled
            className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-500 opacity-60 cursor-not-allowed"
             placeholder="Jakarta"
          />
          <div className="absolute top-full left-0 mt-1 hidden group-hover:block bg-slate-800 text-white text-xs p-2 rounded z-20 shadow-lg border border-slate-700">
             <div className="flex items-start gap-2">
                 <Info size={14} className="shrink-0 text-brand-400 mt-0.5" />
                 <p>Catatan Arsitektur: Input alamat/regional (Domisili) saat ini belum didukung oleh Skema DB_CORE Talent API. Tim *Backend* akan menambahkan parameter filter `geo-domisili` untuk algoritma Casting Intelligence di masa depan.</p>
             </div>
          </div>
        </div>

      </div>

      <div className="pt-6 flex justify-end">
        <button 
            onClick={handleSave} 
            disabled={!isComplete || loading}
            className="flex items-center px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-brand-500/30"
        >
            {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
            Simpan & Lanjutkan
            {!loading && <ArrowRight className="ml-2" size={18} />}
        </button>
      </div>
    </div>
  );
}
