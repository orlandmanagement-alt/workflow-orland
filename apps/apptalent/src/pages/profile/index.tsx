import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAppStore';
import { apiRequest } from '@/lib/api';
import { 
  Download, Phone, Mail, Edit2, 
  Instagram, Youtube, Twitter, Link as LinkIcon, 
  ChevronDown, X, PlusCircle, Trash2, Camera,
  Save, Loader2
} from 'lucide-react';
import { processImage } from '@/utils/imageCompressor';
import { useProfileProgress } from '@/hooks/useProfileProgress';

export default function ProfileDashboard() {
  const [activeTab, setActiveTab] = useState('info');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
  
  // State untuk form edit interaktif
  const [editData, setEditData] = useState<any>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const profileProgressData = useProfileProgress();
  const progressValue = typeof profileProgressData === 'number' ? profileProgressData : (profileProgressData as any)?.percentage || 0;

  useEffect(() => {
    apiRequest('/talents/me')
      .then((res: any) => {
          setData(res.data);
          setEditData(res.data); // Copy data untuk diedit
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>, photoType: 'headshot' | 'sideView' | 'fullHeight') => {
      const rawFile = e.target.files?.[0];
      if (!rawFile) return;

      try {
          setUploading(prev => ({ ...prev, [photoType]: true }));
          const ratio = photoType === 'headshot' ? 4/5 : 3/4;
          const file = await processImage(rawFile, ratio);

          const presignedRes: any = await apiRequest('/media/upload-url', {
             method: 'POST',
             body: JSON.stringify({
                 fileName: file.name,
                 contentType: file.type,
                 folder: `talents/${data?.talent_id || 'unassigned'}`
             })
          });

          if (!presignedRes || !presignedRes.uploadUrl) throw new Error("Gagal mendapatkan link upload");

          // 2. Upload asli murni mem-bypass backend langsung ke Cloudflare R2
          const r2Res = await fetch(presignedRes.uploadUrl, {
             method: 'PUT',
             headers: { 'Content-Type': file.type },
             body: file,
             cache: 'no-store' // <--- TAMBAHKAN INI agar Bypass Service Worker
          });

          if (!r2Res.ok) throw new Error("File gagal di-upload ke server utama");

          const publicUrl = presignedRes.publicUrl;
          const updateRes: any = await apiRequest('/talents/me', {
             method: 'PUT',
             body: JSON.stringify({
                ...data,
                [photoType]: publicUrl
             })
          });

          if (updateRes.status === 'ok') {
              setData(updateRes.data);
              setEditData(updateRes.data);
          }

      } catch (err: any) {
          alert('Upload Error: ' + (err.message || 'Terjadi kesalahan sistem'));
      } finally {
          setUploading(prev => ({ ...prev, [photoType]: false }));
      }
  };

  // Fungsi untuk update field saat diketik
  const handleFieldChange = (field: string, value: string | number) => {
      setEditData((prev: any) => ({ ...prev, [field]: value }));
      setIsDirty(true);
  };

  // Fungsi menyimpan perubahan
  const handleSaveChanges = async () => {
      setSaving(true);
      try {
          const res: any = await apiRequest('/talents/me', {
             method: 'PUT',
             body: JSON.stringify(editData)
          });
          if (res.status === 'ok') {
              setData(res.data);
              setIsDirty(false);
              // Tampilkan toast ringan (opsional)
          }
      } catch (err) {
          alert('Gagal menyimpan profil. Coba lagi.');
      } finally {
          setSaving(false);
      }
  };

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center p-20 text-slate-500">
              <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-bold animate-pulse">Memuat Orland Catalog...</p>
          </div>
      );
  }

  const isHidden = !data?.headshot;

  return (
    <div className="max-w-[1100px] mx-auto pb-28 fade-in zoom-in-95 duration-500 relative">
      
      {isHidden && (
        <div className="flex items-center gap-3 bg-red-50 text-red-700 border border-red-200/50 p-3 px-4 rounded-2xl text-sm font-medium mb-6 shadow-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_0_4px_rgba(220,38,38,0.15)] flex-shrink-0 animate-pulse" />
          <span className="flex-1">
              <strong>Your profile is hidden:</strong> Please complete your main photo to be discovered by Casting Directors.
          </span>
          <button className="text-red-700 font-bold underline hover:text-red-900">Upload Now</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
        
        {/* SIDEBAR (Dipertahankan sama persis) */}
        <aside className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-[14px] p-4 shadow-[0_10px_30px_rgba(17,24,39,0.04)] sticky top-6">
           {/* BOX FOTO HEADSHOT & OTHERS ... */}
          <div>
             <h4 className="text-[12px] font-black tracking-[0.08em] text-slate-600 dark:text-slate-400 mb-2.5">HEADSHOT</h4>
             <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 p-3 relative">
                <input type="file" id="upload-headshot" className="hidden" accept="image/*" onChange={(e) => handleUploadPhoto(e, 'headshot')} disabled={uploading['headshot']} />
                <label htmlFor="upload-headshot" className={`w-full aspect-[4/5] rounded-[14px] relative bg-slate-100 dark:bg-slate-700 overflow-hidden cursor-pointer group flex flex-col justify-center items-center transition-opacity ${uploading['headshot'] ? 'opacity-50 pointer-events-none' : 'hover:opacity-90'}`}>
                    {uploading['headshot'] ? (
                        <div className="text-center z-10 flex flex-col items-center">
                            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-2" />
                            <span className="text-brand-600 font-bold text-sm">Uploading...</span>
                        </div>
                    ) : data?.headshot ? (
                        <>
                           <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${data.headshot})` }} />
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <span className="text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-sm shadow-xl">Ganti Foto</span>
                           </div>
                        </>
                    ) : (
                        <div className="text-center z-10 flex flex-col items-center">
                            <Camera className="text-slate-300 mb-2" size={32} />
                            <span className="text-brand-600 font-bold text-sm">Upload</span>
                            <span className="text-[10px] text-slate-400 mt-1">Min: 600×800 px</span>
                        </div>
                    )}
                </label>
             </div>

             <div className="grid grid-cols-2 gap-3 mt-4">
                 <div>
                    <h4 className="text-[11px] font-black tracking-widest text-slate-500 mb-2">SIDE VIEW</h4>
                    <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-2 bg-slate-50 dark:bg-slate-800 relative">
                        <input type="file" id="upload-side" className="hidden" accept="image/*" onChange={(e) => handleUploadPhoto(e, 'sideView')} disabled={uploading['sideView']} />
                        <label htmlFor="upload-side" className={`w-full aspect-[4/3] rounded-lg bg-white dark:bg-slate-700 relative flex flex-col items-center justify-center cursor-pointer overflow-hidden group transition-opacity ${uploading['sideView'] ? 'opacity-50 pointer-events-none' : 'hover:opacity-90'}`}>
                           {uploading['sideView'] ? (
                               <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                           ) : data?.sideView ? (
                               <>
                                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${data.sideView})` }} />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white" size={16}/></div>
                               </>
                           ) : (
                               <div className="text-center z-10">
                                   <span className="text-brand-600 font-bold text-xs block">Upload</span>
                               </div>
                           )}
                        </label>
                    </div>
                 </div>
                 <div>
                    <h4 className="text-[11px] font-black tracking-widest text-slate-500 mb-2">FULL HEIGHT</h4>
                    <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-2 bg-slate-50 dark:bg-slate-800 relative">
                        <input type="file" id="upload-full" className="hidden" accept="image/*" onChange={(e) => handleUploadPhoto(e, 'fullHeight')} disabled={uploading['fullHeight']} />
                        <label htmlFor="upload-full" className={`w-full aspect-[4/3] rounded-lg bg-white dark:bg-slate-700 relative flex flex-col items-center justify-center cursor-pointer overflow-hidden group transition-opacity ${uploading['fullHeight'] ? 'opacity-50 pointer-events-none' : 'hover:opacity-90'}`}>
                           {uploading['fullHeight'] ? (
                               <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                           ) : data?.fullHeight ? (
                               <>
                                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${data.fullHeight})` }} />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white" size={16}/></div>
                               </>
                           ) : (
                               <div className="text-center z-10">
                                   <span className="text-brand-600 font-bold text-xs block">Upload</span>
                               </div>
                           )}
                        </label>
                    </div>
                 </div>
             </div>
          </div>

          <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
            <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-xl transition-colors border border-slate-200 dark:border-slate-700 text-sm">
                <Download size={16} className="text-slate-500" /> Download PDF Comp Card
            </button>
          </div>
          
          {/* Sisanya di sidebar (Contact, Socmed) */}
          <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
             <div className="flex justify-between items-center mb-3">
                <h4 className="text-[12px] font-black tracking-[0.08em] text-slate-600 dark:text-slate-400">CONTACTS</h4>
             </div>
             <div className="grid gap-2 text-[13px]">
                <label className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 rounded-xl focus-within:border-brand-500 transition-colors">
                   <span className="text-slate-500"><Phone size={14}/></span>
                   <input type="text" value={editData?.phone || ''} onChange={(e) => handleFieldChange('phone', e.target.value)} className="bg-transparent text-right outline-none font-bold text-slate-800 dark:text-white w-full ml-2" placeholder="081xxx" />
                </label>
                <div className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 rounded-xl opacity-70">
                   <span className="text-slate-500"><Mail size={14}/></span>
                   <span className="font-bold text-slate-800 dark:text-white text-right w-full ml-2">{data?.email || '-'}</span>
                </div>
             </div>
          </div>

          <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
             <div className="flex justify-between items-center mb-3">
                <h4 className="text-[12px] font-black tracking-[0.08em] text-slate-600 dark:text-slate-400">SOCIAL MEDIA</h4>
             </div>
             <div className="grid gap-2 text-[13px]">
                <label className="flex justify-between items-center p-2 bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 rounded-xl focus-within:border-brand-500">
                    <Instagram size={14} className="text-pink-600 shrink-0"/>
                    <input type="text" value={editData?.instagram || ''} onChange={(e) => handleFieldChange('instagram', e.target.value)} className="bg-transparent text-right outline-none font-bold text-brand-600 w-full ml-2" placeholder="https://ig..." />
                </label>
                <label className="flex justify-between items-center p-2 bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 rounded-xl focus-within:border-brand-500">
                    <span className="font-bold text-slate-900 dark:text-white text-[10px] shrink-0">TikTok</span>
                    <input type="text" value={editData?.tiktok || ''} onChange={(e) => handleFieldChange('tiktok', e.target.value)} className="bg-transparent text-right outline-none font-bold text-brand-600 w-full ml-2" placeholder="https://tiktok..." />
                </label>
             </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-[14px] shadow-[0_10px_30px_rgba(17,24,39,0.04)] overflow-visible">
          <div className="p-4 md:p-5">
             <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                 <div className="w-full">
                    <div className="flex items-center gap-3">
                       <input 
                         type="text" 
                         value={editData?.full_name || ''} 
                         onChange={(e) => handleFieldChange('full_name', e.target.value)}
                         className="text-[28px] font-black text-slate-900 dark:text-white tracking-tight leading-tight bg-transparent border-b border-transparent hover:border-slate-300 focus:border-brand-500 outline-none w-full max-w-md transition-colors"
                         placeholder="Nama Lengkap"
                       />
                       <Edit2 size={16} className="text-slate-300 pointer-events-none" />
                    </div>
                 </div>
             </div>

             {/* TABS */}
             <div className="flex gap-5 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
                {['info', 'photos', 'assets', 'credits'].map(tab => (
                    <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 text-sm font-bold capitalize transition-all relative whitespace-nowrap px-1 select-none ${activeTab === tab ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                    >
                        {tab}
                        {activeTab === tab && <div className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-brand-600 rounded-t-full" />}
                    </button>
                ))}
             </div>

             {/* PROGRESS BAR WIDGET */}
             <div className="mt-4 border border-amber-200 bg-amber-50/50 dark:bg-amber-500/10 dark:border-amber-500/20 rounded-[14px] p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                    <p className="text-[12px] text-amber-900 dark:text-amber-500 font-black mb-2 uppercase tracking-wider">Profile Strength <span className="float-right md:float-none md:ml-2">{progressValue}%</span></p>
                    <div className="h-2 w-full bg-amber-200/50 dark:bg-amber-900/40 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-rose-400 to-amber-500 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)] transition-all duration-1000" style={{ width: `${progressValue}%` }}></div>
                    </div>
                </div>
                <button className="text-[12px] font-bold bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 px-4 py-2 rounded-lg text-amber-800 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors whitespace-nowrap">
                    What's missing?
                </button>
             </div>

             {/* TAB CONTENT */}
             <div className="mt-6">
                 {activeTab === 'info' && <TabInfo editData={editData} onChange={handleFieldChange} />}
                 {activeTab === 'photos' && <TabPhotos data={data} />}
                 {activeTab === 'assets' && <TabAssets editData={editData} onChange={handleFieldChange} />}
                 {activeTab === 'credits' && <TabCredits data={data} />}
             </div>
          </div>
        </main>
      </div>

      {/* ================= STICKY SAVE BUTTON ================= */}
      {isDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
           <div className="bg-slate-900 dark:bg-slate-800 border border-slate-700 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl p-2.5 px-4 flex items-center gap-4 backdrop-blur-xl">
              <span className="text-white text-sm font-semibold pl-2">Ada perubahan yang belum disimpan.</span>
              <button 
                 onClick={handleSaveChanges}
                 disabled={saving}
                 className="flex items-center bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                 {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                 Simpan Profil
              </button>
           </div>
        </div>
      )}
      
      <style>{`
        .star-clip { clip-path: polygon(50% 0%, 62% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 38% 35%); }
      `}</style>
    </div>
  );
}

// ----------------------------------------------------------------------
// MODULAR TAB COMPONENTS (INTERACTIVE EDIT MODE)
// ----------------------------------------------------------------------

function TabInfo({ editData, onChange }: { editData: any, onChange: (f: string, v: any) => void }) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* PERSONAL DETAILS MODULAR */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-[14px] bg-white dark:bg-dark-card overflow-hidden">
               <div className="flex justify-between items-center px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <div className="font-black text-[12px] tracking-[0.06em] text-slate-700 dark:text-slate-300">PERSONAL:</div>
               </div>
               <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                 <label className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3 focus-within:border-brand-500 transition-colors">
                    <div className="text-[11px] font-extrabold text-slate-400 mb-1">Gender</div>
                    <select value={editData?.gender || ''} onChange={e => onChange('gender', e.target.value)} className="w-full bg-transparent text-[14px] font-black text-slate-900 dark:text-white outline-none cursor-pointer appearance-none">
                        <option value="" className="text-slate-900">Pilih...</option>
                        <option value="Male" className="text-slate-900">Male (Pria)</option>
                        <option value="Female" className="text-slate-900">Female (Wanita)</option>
                    </select>
                 </label>
                 <label className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3 focus-within:border-brand-500 transition-colors">
                    <div className="text-[11px] font-extrabold text-slate-400 mb-1">Date Of Birth</div>
                    <input type="date" value={editData?.birth_date || ''} onChange={e => onChange('birth_date', e.target.value)} className="w-full bg-transparent text-[14px] font-black text-slate-900 dark:text-white outline-none" />
                 </label>
                 <label className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3 focus-within:border-brand-500 transition-colors">
                    <div className="text-[11px] font-extrabold text-slate-400 mb-1">Category</div>
                    <select value={editData?.category || ''} onChange={e => onChange('category', e.target.value)} className="w-full bg-transparent text-[14px] font-black text-slate-900 dark:text-white outline-none cursor-pointer appearance-none">
                        <option value="" className="text-slate-900">Pilih...</option>
                        <option value="Model" className="text-slate-900">Model</option>
                        <option value="Actor" className="text-slate-900">Actor / Actress</option>
                        <option value="Voice Over" className="text-slate-900">Voice Over</option>
                        <option value="Influencer" className="text-slate-900">Influencer</option>
                    </select>
                 </label>
                 <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3 opacity-60">
                    <div className="text-[11px] font-extrabold text-slate-400 mb-1">Location (Coming Soon)</div>
                    <div className="text-[14px] font-black text-slate-900 dark:text-white">Jakarta</div>
                 </div>
               </div>
            </div>

            {/* APPEARANCE MODULAR */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-[14px] bg-white dark:bg-dark-card mt-4 overflow-hidden">
               <div className="flex justify-between items-center px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <div className="font-black text-[12px] tracking-[0.06em] text-slate-700 dark:text-slate-300">APPEARANCE:</div>
               </div>
               <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <label className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3 focus-within:border-brand-500 flex flex-col relative">
                        <span className="text-[11px] font-extrabold text-slate-400 mb-1">Height (cm)</span>
                        <input type="number" value={editData?.height || ''} onChange={e => onChange('height', parseInt(e.target.value))} className="bg-transparent text-[14px] font-black text-slate-900 dark:text-white outline-none w-full" placeholder="170" />
                    </label>
                    <label className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3 focus-within:border-brand-500 flex flex-col relative">
                        <span className="text-[11px] font-extrabold text-slate-400 mb-1">Weight (kg)</span>
                        <input type="number" value={editData?.weight || ''} onChange={e => onChange('weight', parseInt(e.target.value))} className="bg-transparent text-[14px] font-black text-slate-900 dark:text-white outline-none w-full" placeholder="60" />
                    </label>
                    
                    {/* Dummy Fields for future use */}
                    <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3"><div className="text-[11px] font-extrabold text-slate-400 mb-1">Eye Color</div><div className="text-[14px] font-black text-slate-400">n/a</div></div>
                    <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3"><div className="text-[11px] font-extrabold text-slate-400 mb-1">Hair Color</div><div className="text-[14px] font-black text-slate-400">n/a</div></div>
                    <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3"><div className="text-[11px] font-extrabold text-slate-400 mb-1">Chest/Bust</div><div className="text-[14px] font-black text-slate-400">n/a</div></div>
                    <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3"><div className="text-[11px] font-extrabold text-slate-400 mb-1">Body Type</div><div className="text-[14px] font-black text-slate-400">n/a</div></div>
               </div>
            </div>
        </div>
    );
}

function TabAssets({ editData, onChange }: { editData: any, onChange: (f: string, v: string) => void }) {
    return (
        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-[14px] bg-white dark:bg-dark-card animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
            <div>
                <div className="text-[12px] font-black tracking-widest text-slate-500 mb-2">SHOWREEL: (YouTube links)</div>
                <div className="flex gap-2">
                    <input type="text" value={editData?.showreel || ''} onChange={e => onChange('showreel', e.target.value)} placeholder="https://youtube.com/watch..." className="flex-1 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 outline-none focus:border-brand-500 text-sm font-medium dark:text-white" />
                </div>
            </div>
            <div>
                <div className="text-[12px] font-black tracking-widest text-slate-500 mb-2">VOICE OVER: (SoundCloud / Drive)</div>
                <div className="flex gap-2">
                    <input type="text" value={editData?.voiceOver || ''} onChange={e => onChange('voiceOver', e.target.value)} placeholder="https://soundcloud.com/..." className="flex-1 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 outline-none focus:border-brand-500 text-sm font-medium dark:text-white" />
                </div>
            </div>
        </div>
    )
}

function TabPhotos({ data }: { data: any }) {
    return (
        <div className="p-10 border border-slate-200 dark:border-slate-800 rounded-[14px] bg-white dark:bg-dark-card animate-in fade-in slide-in-from-bottom-2 duration-300 text-center">
            <div className="w-16 h-16 bg-brand-50 dark:bg-brand-500/10 text-brand-500 rounded-full flex items-center justify-center mx-auto mb-4"><Camera size={32}/></div>
            <h3 className="font-bold text-slate-800 dark:text-white mb-2 text-lg">Kelola Foto Utama di Sidebar</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">Untuk saat ini, Anda bisa mengunggah dan mengganti foto Headshot, Side View, dan Full Height langsung melalui panel di sebelah kiri layar.</p>
        </div>
    )
}

function TabCredits({ data }: { data: any }) {
    return (
        <div className="border border-slate-200 dark:border-slate-800 rounded-[14px] bg-white dark:bg-dark-card animate-in fade-in slide-in-from-bottom-2 duration-300 p-4">
             <div className="flex justify-between items-center mb-4">
                <div className="text-[12px] font-black tracking-widest text-slate-500">CREDITS LIST</div>
                <button className="bg-brand-600 text-white font-bold px-4 py-2 rounded-full text-[12px] hover:bg-brand-700">+ Add Experience</button>
             </div>

             {/* Jika data.experiences ada, maka di-map. Jika tidak, tampilkan mockup */}
             {data?.experiences?.length > 0 ? (
                 data.experiences.map((exp: any, i: number) => (
                     <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 relative mb-3">
                         <div className="flex justify-between mb-1 pr-6">
                             <span className="font-bold text-[15px] text-slate-900 dark:text-white">{exp.project_name} ({exp.role})</span>
                             <span className="font-bold text-slate-900 dark:text-white">{exp.year}</span>
                         </div>
                         <div className="text-[12px] font-black text-slate-500">{exp.client}</div>
                     </div>
                 ))
             ) : (
                 <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 relative">
                     <button className="absolute top-3 right-3 text-slate-400 hover:text-red-500"><X size={16}/></button>
                     <div className="flex justify-between mb-1 pr-6">
                         <span className="font-bold text-[15px] text-slate-900 dark:text-white">TVC Pepsodent (Peran Utama)</span>
                         <span className="font-bold text-slate-900 dark:text-white">2024</span>
                     </div>
                     <div className="text-[12px] font-black text-slate-500 mb-2">PT Kreatif Gemilang</div>
                     <div className="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed">
                         Mockup: Bertindak sebagai aktor utama pria dalam iklan TVC komersial durasi 30 detik.
                     </div>
                 </div>
             )}
        </div>
    )
}