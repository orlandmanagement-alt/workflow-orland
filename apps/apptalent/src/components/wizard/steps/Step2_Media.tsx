import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2, UploadCloud, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface Props {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2_Media({ data, onUpdate, onNext, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  
  // Simulasi State untuk 3 Slot Foto
  const [headshot, setHeadshot] = useState<File | null>(null);
  const [sideView, setSideView] = useState<File | null>(null);
  const [fullHeight, setFullHeight] = useState<File | null>(null);

  const handleSave = async () => {
    setLoading(true);
    try {
        // Simulasi Multipart FormData & Presigned Upload ke R2
        // Dalam real-world kita akan menembak /api/v1/media/upload-url terlebih dahulu
        
        // Simulasikan jeda upload
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simulasikan metadata save ke DB_CORE as per arsitektur "Save-As-You-Go"
        // await apiRequest('/talents/me/media', { method: 'POST', body: ... })
        
        onUpdate({ 
           headshot: headshot ? 'uploaded_1.jpg' : data.headshot,
           sideView: sideView ? 'uploaded_2.jpg' : data.sideView,
           fullHeight: fullHeight ? 'uploaded_3.jpg' : data.fullHeight,
        });
        onNext();
    } catch (e) {
        alert("Gagal mengunggah media. Silakan coba lagi.");
    } finally {
        setLoading(false);
    }
  };

  const UploadSlot = ({ label, desc, file, setFile }: any) => (
      <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
          {file || data[label.toLowerCase()] ? (
              <div className="flex flex-col items-center text-green-600 dark:text-green-500">
                  <CheckCircle2 size={40} className="mb-2" />
                  <span className="font-bold text-sm">Berhasil Diunggah</span>
                  <span className="text-xs text-slate-500 mt-1">{file?.name || "Berkas Tersimpan"}</span>
                  <button onClick={() => setFile(null)} className="mt-3 text-xs font-semibold text-red-500 hover:underline">Ganti Foto</button>
              </div>
          ) : (
              <>
                  <UploadCloud size={36} className="text-slate-400 mb-3" />
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">{label}</h4>
                  <p className="text-[10px] text-slate-500 mb-4 px-4">{desc}</p>
                  <label className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 dark:text-white text-xs font-bold rounded-lg cursor-pointer transition-colors">
                      Pilih Berkas
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => { if(e.target.files?.length) setFile(e.target.files[0]) }} />
                  </label>
              </>
          )}
      </div>
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div>
        <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Portofolio Visual (Wajib)</h3>
        <p className="text-sm text-slate-500 mt-1">Standar industri mewajibkan 3 sudut pengambilan gambar natural (No Filter).</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <UploadSlot 
            label="Headshot" 
            desc="Close up paras wajah dari dekat. Rambut rapi, tidak menutupi fitur wajah." 
            file={headshot} setFile={setHeadshot} 
        />
        <UploadSlot 
            label="Side View" 
            desc="Foto profil setengah badan dari samping. Menunjukkan postur natural." 
            file={sideView} setFile={setSideView} 
        />
        <UploadSlot 
            label="Full Height" 
            desc="Foto seluruh badan (Ujung kepala hingga kaki). Pakaian fit-body warna solid." 
            file={fullHeight} setFile={setFullHeight} 
        />
      </div>

      <div className="pt-6 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
        <button 
            onClick={onBack} disabled={loading}
            className="flex items-center px-4 py-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white font-bold transition-colors"
        >
            <ArrowLeft className="mr-2" size={18} /> Kembali
        </button>
        <button 
            onClick={handleSave} 
            disabled={loading || (!headshot && !data.headshot) || (!sideView && !data.sideView) || (!fullHeight && !data.fullHeight)}
            className="flex items-center px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-brand-500/30"
        >
            {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
            Simpan Portofolio
            {!loading && <ArrowRight className="ml-2" size={18} />}
        </button>
      </div>
    </div>
  );
}
