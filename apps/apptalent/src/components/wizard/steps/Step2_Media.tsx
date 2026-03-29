import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2, UploadCloud, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { processImage } from '@/utils/imageCompressor';

interface Props {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2_Media({ data, onUpdate, onNext, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  
  // State File yang dipilih
  const [headshot, setHeadshot] = useState<File | null>(null);
  const [sideView, setSideView] = useState<File | null>(null);
  const [fullHeight, setFullHeight] = useState<File | null>(null);

  const performR2Upload = async (file: File, type: string) => {
      // 1. Kompres file di sisi browser
      setLoadingText(`Mengompresi ${type}...`);
      const ratio = type === 'Headshot' ? 4/5 : 3/4;
      const compressedFile = await processImage(file, ratio);

      // 2. Minta Presigned URL dari backend
      setLoadingText(`Konfigurasi Upload ${type}...`);
      const presignedRes: any = await apiRequest('/media/upload-url', {
          method: 'POST',
          body: JSON.stringify({
              fileName: compressedFile.name,
              contentType: compressedFile.type,
              folder: `talents/onboarding`
          })
      });

      if (!presignedRes || !presignedRes.uploadUrl) throw new Error("Gagal mengambil Presigned URL");

      // 3. Modus bypass: Upload dari Browser -> Cloudflare R2
      setLoadingText(`Mengunggah ${type} ke Cloudflare...`);
      const r2Res = await fetch(presignedRes.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': compressedFile.type },
          body: compressedFile
      });

      if (!r2Res.ok) throw new Error(`Gagal mengunggah ${type}`);

      return presignedRes.publicUrl;
  };

  const handleSave = async () => {
    setLoading(true);
    try {
        let finalHeadshot = data.headshot;
        let finalSideView = data.sideView;
        let finalFullHeight = data.fullHeight;

        if (headshot) finalHeadshot = await performR2Upload(headshot, 'Headshot');
        if (sideView) finalSideView = await performR2Upload(sideView, 'Side View');
        if (fullHeight) finalFullHeight = await performR2Upload(fullHeight, 'Full Height');
        
        // Simpan tautan URL Gambar baru ke database lewat PUT /me API
        setLoadingText("Menyimpan ke Profil...");
        const updateParams = { 
           ...data, 
           headshot: finalHeadshot, 
           sideView: finalSideView, 
           fullHeight: finalFullHeight 
        };
        
        await apiRequest('/talents/me', {
           method: 'PUT',
           body: JSON.stringify(updateParams)
        });
        
        onUpdate(updateParams);
        onNext();
    } catch (e: any) {
        alert("Gagal mengunggah media. " + (e.message || "Silakan coba lagi."));
    } finally {
        setLoading(false);
        setLoadingText("");
    }
  };

  const UploadSlot = ({ label, desc, file, setFile }: any) => {
      // Membuat Pratinjau Lokal (Preview) untuk Obyek File Murni
      const objectUrl = file ? URL.createObjectURL(file) : null;
      
      return (
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-colors relative h-64 overflow-hidden">
              {objectUrl || data[label.toLowerCase().replace(' ', '')] ? (
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${objectUrl || data[label.toLowerCase().replace(' ', '')]})` }}>
                     <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                         <CheckCircle2 size={40} className="mb-2 text-green-400" />
                         <span className="font-bold text-sm text-white">{file ? 'Siap Diunggah' : 'File Tersimpan'}</span>
                         <label className="mt-4 px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-lg cursor-pointer backdrop-blur-sm transition-colors">
                             Ganti Foto
                             <input type="file" className="hidden" accept="image/*" onChange={(e) => { if(e.target.files?.length) setFile(e.target.files[0]) }} />
                         </label>
                     </div>
                  </div>
              ) : (
                  <>
                      <UploadCloud size={36} className="text-slate-400 mb-3" />
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">{label}</h4>
                      <p className="text-[10px] text-slate-500 mb-4 px-2">{desc}</p>
                      <label className="px-5 py-2.5 bg-brand-50 hover:bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:hover:bg-brand-500/20 dark:text-brand-400 text-xs font-bold rounded-xl cursor-pointer transition-colors border border-brand-200 dark:border-brand-500/30">
                          Pilih Berkas
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => { if(e.target.files?.length) setFile(e.target.files[0]) }} />
                      </label>
                  </>
              )}
          </div>
      );
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div>
        <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Portofolio Visual (Wajib)</h3>
        <p className="text-sm text-slate-500 mt-1">Sistem Otomatis akan menyesuaikan dan mengompres resolusi tinggi murni pada browser Anda.</p>
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

      <div className="pt-6 flex flex-wrap justify-between items-center gap-4 border-t border-slate-100 dark:border-slate-800">
        <button 
            onClick={onBack} disabled={loading}
            className="flex items-center px-4 py-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white font-bold transition-colors"
        >
            <ArrowLeft className="mr-2" size={18} /> Kembali
        </button>
        
        {loading && <span className="text-xs font-bold text-brand-500 animate-pulse">{loadingText}</span>}

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
