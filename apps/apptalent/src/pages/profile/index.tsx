import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAppStore';
import { apiRequest } from '@/lib/api';
import { 
  Download, Phone, Mail, Edit2, 
  Instagram, Youtube, Twitter, Link as LinkIcon, 
  ChevronDown, X, PlusCircle, Trash2, Camera,
  Save, Loader2, CheckCircle2, AlertCircle
} from 'lucide-react';
import { processImage } from '@/utils/imageCompressor';
import { useProfileProgress } from '@/hooks/useProfileProgress';

export default function ProfileDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('info');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
  
  // State untuk form edit interaktif
  const [editData, setEditData] = useState<any>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showMissingModal, setShowMissingModal] = useState(false);

  const profileProgressData = useProfileProgress();
  const progressValue = typeof profileProgressData === 'number' ? profileProgressData : (profileProgressData as any)?.percentage || 0;

  useEffect(() => {
    apiRequest('/talents/me')
      .then((res: any) => {
          setData(res.data);
          
          // Inject user phone & email if not set in profile
          const initialData = { ...res.data };
          if (!initialData.phone) initialData.phone = user?.phone || '';
          if (!initialData.email) initialData.email = user?.email || '';
          if (!initialData.showreels) initialData.showreels = [];
          if (!initialData.audios) initialData.audios = [];
          if (!initialData.additional_photos) initialData.additional_photos = [];
          
          setEditData(initialData);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user]);

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>, photoType: string, index?: number) => {
      const rawFile = e.target.files?.[0];
      if (!rawFile) return;

      try {
          const uploadKey = index !== undefined ? `${photoType}-${index}` : photoType;
          setUploading(prev => ({ ...prev, [uploadKey]: true }));
          const ratio = (photoType === 'headshot' || photoType === 'additional_photos') ? 4/5 : 3/4;
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

          const r2Res = await fetch(presignedRes.uploadUrl, {
             method: 'PUT',
             headers: { 'Content-Type': file.type },
             body: file,
             cache: 'no-store'
          });

          if (!r2Res.ok) throw new Error("File gagal di-upload ke server utama");

          const publicUrl = presignedRes.publicUrl;
          
          let updatePayload = { ...data };
          
          if (photoType === 'additional_photos' && index !== undefined) {
             const newAddPhotos = [...(updatePayload.additional_photos || [])];
             newAddPhotos[index] = publicUrl;
             updatePayload.additional_photos = newAddPhotos;
          } else {
             updatePayload[photoType] = publicUrl;
          }

          const updateRes: any = await apiRequest('/talents/me', {
             method: 'PUT',
             body: JSON.stringify(updatePayload)
          });

          if (updateRes.status === 'ok') {
              let updated = updateRes.data;
              if (!updated.showreels) updated.showreels = [];
              if (!updated.audios) updated.audios = [];
              if (!updated.additional_photos) updated.additional_photos = [];
              setData(updated);
              setEditData(updated);
          }

      } catch (err: any) {
          alert('Upload Error: ' + (err.message || 'Terjadi kesalahan sistem'));
      } finally {
          const uploadKey = index !== undefined ? `${photoType}-${index}` : photoType;
          setUploading(prev => ({ ...prev, [uploadKey]: false }));
      }
  };

  const handleFieldChange = (field: string, value: any) => {
      setEditData((prev: any) => ({ ...prev, [field]: value }));
      setIsDirty(true);
  };
  
  const validateForm = () => {
    // Basic placeholder-based validation rule checks
    if (editData.phone && !editData.phone.match(/^[0-9+]{8,15}$/)) {
        alert("Format Nomor Telepon tidak valid. Gunakan format seperti 08123456789.");
        return false;
    }
    
    if (editData.height && isNaN(editData.height)) {
        alert("Tinggi badan harus angka."); return false;
    }
    if (editData.weight && isNaN(editData.weight)) {
        alert("Berat badan harus angka."); return false;
    }
    
    if (editData.showreels?.length > 0) {
        for (let url of editData.showreels) {
            if (url && !url.includes("youtube.com") && !url.includes("youtu.be")) {
                alert("Salah satu link Showreel bukan dari YouTube. Silakan periksa.");
                return false;
            }
        }
    }
    return true;
  }

  const handleSaveChanges = async () => {
      if (!validateForm()) return;
      
      setSaving(true);
      try {
          const res: any = await apiRequest('/talents/me', {
             method: 'PUT',
             body: JSON.stringify(editData)
          });
          if (res.status === 'ok') {
              setData(res.data);
              setIsDirty(false);
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
        
        {/* SIDEBAR */}
        <aside className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-[14px] p-4 shadow-[0_10px_30px_rgba(17,24,39,0.04)] sticky top-6">
           {/* BOX FOTO HEADSHOT */}
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
                        <input type="file" id="upload-side" className="hidden" accept="image/*" onChange={(e) => handleUploadPhoto(e, 'side_view')} disabled={uploading['side_view']} />
                        <label htmlFor="upload-side" className={`w-full aspect-[4/3] rounded-lg bg-white dark:bg-slate-700 relative flex flex-col items-center justify-center cursor-pointer overflow-hidden group transition-opacity ${uploading['side_view'] ? 'opacity-50 pointer-events-none' : 'hover:opacity-90'}`}>
                           {uploading['side_view'] ? (
                               <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                           ) : data?.side_view ? (
                               <>
                                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${data.side_view})` }} />
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
                        <input type="file" id="upload-full" className="hidden" accept="image/*" onChange={(e) => handleUploadPhoto(e, 'full_height')} disabled={uploading['full_height']} />
                        <label htmlFor="upload-full" className={`w-full aspect-[4/3] rounded-lg bg-white dark:bg-slate-700 relative flex flex-col items-center justify-center cursor-pointer overflow-hidden group transition-opacity ${uploading['full_height'] ? 'opacity-50 pointer-events-none' : 'hover:opacity-90'}`}>
                           {uploading['full_height'] ? (
                               <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                           ) : data?.full_height ? (
                               <>
                                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${data.full_height})` }} />
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
                   <span className="font-bold text-slate-800 dark:text-white text-right w-full ml-2">{data?.email || editData?.email || '-'}</span>
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
                <button onClick={() => setShowMissingModal(true)} className="text-[12px] font-bold bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 px-4 py-2 rounded-lg text-amber-800 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors whitespace-nowrap">
                    What's missing?
                </button>
             </div>

             {/* TAB CONTENT */}
             <div className="mt-6">
                 {activeTab === 'info' && <TabInfo editData={editData} onChange={handleFieldChange} />}
                 {activeTab === 'photos' && <TabPhotos data={data} uploading={uploading} handleUpload={handleUploadPhoto} />}
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
      
      {/* ================= POPUP WHAT'S MISSING ================= */}
      {showMissingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-in zoom-in-95">
                 <button onClick={() => setShowMissingModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"><X size={20}/></button>
                 <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-4">Profil Anda</h3>
                 
                 <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                     <div>
                         <h4 className="text-xs font-black tracking-widest text-emerald-600 mb-2 uppercase">Sudah Lengkap</h4>
                         {profileProgressData.completedSections.length > 0 ? (
                             <ul className="space-y-2">
                                 {profileProgressData.completedSections.map((item: string, i: number) => (
                                     <li key={i} className="flex items-center text-sm font-bold text-slate-700 dark:text-slate-300">
                                         <CheckCircle2 size={16} className="text-emerald-500 mr-2 flex-shrink-0" /> {item}
                                     </li>
                                 ))}
                             </ul>
                         ) : <p className="text-sm text-slate-500">Belum ada.</p>}
                     </div>
                     <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                         <h4 className="text-xs font-black tracking-widest text-red-500 mb-2 uppercase">Perlu Dilengkapi</h4>
                         {profileProgressData.missingSections.length > 0 ? (
                             <ul className="space-y-2">
                                 {profileProgressData.missingSections.map((item: string, i: number) => (
                                     <li key={i} className="flex items-center text-sm font-bold text-slate-700 dark:text-slate-300">
                                         <AlertCircle size={16} className="text-red-500 mr-2 flex-shrink-0" /> {item}
                                     </li>
                                 ))}
                             </ul>
                         ) : <p className="text-sm text-slate-500">Profil Anda sudah 100% lengkap!</p>}
                     </div>
                 </div>
                 <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                     <button onClick={() => setShowMissingModal(false)} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl font-bold text-sm transition-colors text-slate-900 dark:text-white">Tutup</button>
                 </div>
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
// MODULAR TAB COMPONENTS
// ----------------------------------------------------------------------
function TabInfo({ editData, onChange }: { editData: any, onChange: (f: string, v: any) => void }) {
    const [editPersonal, setEditPersonal] = useState(false);
    const [editAppearance, setEditAppearance] = useState(false);

    // CHIPS LOGIC
    const handleAddChip = (field: 'skills' | 'interests', value: string) => {
        if (!value.trim()) return;
        const arr = editData[field] ? [...editData[field]] : [];
        if (!arr.includes(value.trim())) onChange(field, [...arr, value.trim()]);
    }
    const handleRemoveChip = (field: 'skills' | 'interests', idx: number) => {
        const arr = [...(editData[field] || [])];
        arr.splice(idx, 1);
        onChange(field, arr);
    }
    const [tempSkill, setTempSkill] = useState('');
    const [tempInterest, setTempInterest] = useState('');

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            {/* INTERESTS */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-[14px] bg-white dark:bg-dark-card overflow-hidden">
               <div className="flex justify-between items-center px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <div className="font-black text-[12px] tracking-[0.06em] text-slate-700 dark:text-slate-300">INTERESTED IN:</div>
               </div>
               <div className="p-4">
                  <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50 dark:bg-slate-900 mb-3 focus-within:border-brand-500">
                     <input type="text" value={tempInterest} onChange={e => setTempInterest(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') { handleAddChip('interests', tempInterest); setTempInterest(''); } }} placeholder="Commercial, Film, Modeling..." className="bg-transparent border-none outline-none flex-1 font-semibold text-sm px-2 dark:text-white" />
                     <button type="button" onClick={() => { handleAddChip('interests', tempInterest); setTempInterest(''); }} className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-4 py-2 rounded-lg">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                      {editData.interests?.map((item: string, i: number) => (
                          <div key={i} className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-3 py-1.5 rounded-full text-xs font-black text-slate-800 dark:text-indigo-300 flex items-center gap-2">
                              {item} <button onClick={() => handleRemoveChip('interests', i)} className="w-5 h-5 rounded-full bg-white dark:bg-indigo-900 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50 flex items-center justify-center border border-slate-200 dark:border-indigo-800">×</button>
                          </div>
                      ))}
                  </div>
               </div>
            </div>

            {/* SKILLS */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-[14px] bg-white dark:bg-dark-card overflow-hidden mt-4">
               <div className="flex justify-between items-center px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <div className="font-black text-[12px] tracking-[0.06em] text-slate-700 dark:text-slate-300">SKILLS:</div>
               </div>
               <div className="p-4">
                  <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50 dark:bg-slate-900 mb-3 focus-within:border-brand-500">
                     <input type="text" value={tempSkill} onChange={e => setTempSkill(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') { handleAddChip('skills', tempSkill); setTempSkill(''); } }} placeholder="Singing, Dancing, Martial Arts..." className="bg-transparent border-none outline-none flex-1 font-semibold text-sm px-2 dark:text-white" />
                     <button type="button" onClick={() => { handleAddChip('skills', tempSkill); setTempSkill(''); }} className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-4 py-2 rounded-lg">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                      {editData.skills?.map((item: string, i: number) => (
                          <div key={i} className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-3 py-1.5 rounded-full text-xs font-black text-slate-800 dark:text-indigo-300 flex items-center gap-2">
                              {item} <button onClick={() => handleRemoveChip('skills', i)} className="w-5 h-5 rounded-full bg-white dark:bg-indigo-900 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50 flex items-center justify-center border border-slate-200 dark:border-indigo-800">×</button>
                          </div>
                      ))}
                  </div>
               </div>
            </div>

            {/* PERSONAL DETAILS MODULAR */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-[14px] bg-white dark:bg-dark-card overflow-hidden mt-4">
               <div className="flex justify-between items-center px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <div className="font-black text-[12px] tracking-[0.06em] text-slate-700 dark:text-slate-300">PERSONAL:</div>
                  <button onClick={() => setEditPersonal(!editPersonal)} className="font-bold text-brand-600 hover:bg-brand-50 px-2 py-1 rounded-lg text-[13px]">{editPersonal ? 'Simpan / Tutup' : '✎ Edit'}</button>
               </div>
               
               {!editPersonal ? (
                   <div className="p-4 grid grid-cols-2 gap-4">
                       <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3"><div className="text-[11px] font-extrabold text-slate-400 mb-1">Gender</div><div className="text-[14px] font-black text-slate-900 dark:text-white">{editData?.gender || '-'}</div></div>
                       <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3"><div className="text-[11px] font-extrabold text-slate-400 mb-1">Date Of Birth</div><div className="text-[14px] font-black text-slate-900 dark:text-white">{editData?.birth_date || '-'}</div></div>
                       <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3"><div className="text-[11px] font-extrabold text-slate-400 mb-1">Location</div><div className="text-[14px] font-black text-slate-900 dark:text-white">{editData?.location || '-'}</div></div>
                       <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3"><div className="text-[11px] font-extrabold text-slate-400 mb-1">Ethnicity</div><div className="text-[14px] font-black text-slate-900 dark:text-white">{editData?.ethnicity || '-'}</div></div>
                   </div>
               ) : (
                   <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in zoom-in-95">
                     <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-extrabold text-slate-400">Gender</label>
                        <select value={editData?.gender || ''} onChange={e => onChange('gender', e.target.value)} className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl p-3 outline-none text-[13px] font-black dark:text-white">
                            <option value="">Pilih...</option><option value="Male">Male</option><option value="Female">Female</option>
                        </select>
                     </div>
                     <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-extrabold text-slate-400">Date Of Birth</label>
                        <input type="date" value={editData?.birth_date || ''} onChange={e => onChange('birth_date', e.target.value)} className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl p-3 outline-none text-[13px] font-black dark:text-white" />
                     </div>
                     <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-extrabold text-slate-400">Location</label>
                        <input type="text" value={editData?.location || ''} onChange={e => onChange('location', e.target.value)} className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl p-3 outline-none text-[13px] font-black dark:text-white" placeholder="Jakarta..." />
                     </div>
                     <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-extrabold text-slate-400">Ethnicity</label>
                        <select value={editData?.ethnicity || ''} onChange={e => onChange('ethnicity', e.target.value)} className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl p-3 outline-none text-[13px] font-black dark:text-white">
                            <option value="">Pilih...</option><option value="Asian">Asian</option><option value="Caucasian">Caucasian</option><option value="Hispanic">Hispanic</option><option value="Other">Other</option>
                        </select>
                     </div>
                   </div>
               )}
            </div>

            {/* UNION AFFILIATION (Placeholder simplified) */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-[14px] bg-white dark:bg-dark-card mt-4 overflow-hidden">
               <div className="flex justify-between items-center px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <div className="font-black text-[12px] tracking-[0.06em] text-slate-700 dark:text-slate-300">UNION AFFILIATION:</div>
               </div>
               <div className="p-4">
                  <input type="text" value={editData?.union_affiliation || ''} onChange={e => onChange('union_affiliation', e.target.value)} placeholder="SAG-AFTRA, none, dll..." className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-3 outline-none focus:border-brand-500 text-sm font-bold dark:text-white transition-colors" />
               </div>
            </div>

            {/* APPEARANCE MODULAR */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-[14px] bg-white dark:bg-dark-card mt-4 overflow-hidden">
               <div className="flex justify-between items-center px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <div className="font-black text-[12px] tracking-[0.06em] text-slate-700 dark:text-slate-300">APPEARANCE:</div>
                  <button onClick={() => setEditAppearance(!editAppearance)} className="font-bold text-brand-600 hover:bg-brand-50 px-2 py-1 rounded-lg text-[13px]">{editAppearance ? 'Simpan / Tutup' : '✎ Edit'}</button>
               </div>
               
               {!editAppearance ? (
                   <div className="p-4">
                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                         <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3"><div className="text-[11px] font-extrabold text-slate-400 mb-1">Height (cm)</div><div className="text-[14px] font-black text-slate-900 dark:text-white">{editData?.height || '-'}</div></div>
                         <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3"><div className="text-[11px] font-extrabold text-slate-400 mb-1">Weight (kg)</div><div className="text-[14px] font-black text-slate-900 dark:text-white">{editData?.weight || '-'}</div></div>
                         <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3"><div className="text-[11px] font-extrabold text-slate-400 mb-1">Eye Color</div><div className="text-[14px] font-black text-slate-900 dark:text-white">{editData?.eye_color || '-'}</div></div>
                         <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3"><div className="text-[11px] font-extrabold text-slate-400 mb-1">Hair Color</div><div className="text-[14px] font-black text-slate-900 dark:text-white">{editData?.hair_color || '-'}</div></div>
                         <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3"><div className="text-[11px] font-extrabold text-slate-400 mb-1">Hip Size</div><div className="text-[14px] font-black text-slate-900 dark:text-white">{editData?.hip_size || '-'}</div></div>
                         <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3"><div className="text-[11px] font-extrabold text-slate-400 mb-1">Chest/Bust</div><div className="text-[14px] font-black text-slate-900 dark:text-white">{editData?.chest_bust || '-'}</div></div>
                         <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3"><div className="text-[11px] font-extrabold text-slate-400 mb-1">Body Type</div><div className="text-[14px] font-black text-slate-900 dark:text-white">{editData?.body_type || '-'}</div></div>
                     </div>
                     <div className="grid gap-4">
                         <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3 w-full"><div className="text-[11px] font-extrabold text-slate-400 mb-1">Specific Characteristics</div><div className="text-[14px] font-black text-slate-900 dark:text-white">{editData?.specific_characteristics || '-'}</div></div>
                         <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3 w-full"><div className="text-[11px] font-extrabold text-slate-400 mb-1">Tattoos</div><div className="text-[14px] font-black text-slate-900 dark:text-white">{editData?.tattoos || '-'}</div></div>
                         <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3 w-full"><div className="text-[11px] font-extrabold text-slate-400 mb-1">Piercings</div><div className="text-[14px] font-black text-slate-900 dark:text-white">{editData?.piercings || '-'}</div></div>
                     </div>
                   </div>
               ) : (
                   <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in zoom-in-95">
                       <div className="flex flex-col gap-1"><label className="text-[11px] font-extrabold text-slate-400">Height (cm)</label><input type="number" value={editData?.height || ''} onChange={e => onChange('height', parseInt(e.target.value))} className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl p-3 outline-none text-[13px] font-black dark:text-white" /></div>
                       <div className="flex flex-col gap-1"><label className="text-[11px] font-extrabold text-slate-400">Weight (kg)</label><input type="number" value={editData?.weight || ''} onChange={e => onChange('weight', parseInt(e.target.value))} className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl p-3 outline-none text-[13px] font-black dark:text-white" /></div>
                       <div className="flex flex-col gap-1"><label className="text-[11px] font-extrabold text-slate-400">Eye Color</label><input type="text" value={editData?.eye_color || ''} onChange={e => onChange('eye_color', e.target.value)} className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl p-3 outline-none text-[13px] font-black dark:text-white" placeholder="Brown"/></div>
                       <div className="flex flex-col gap-1"><label className="text-[11px] font-extrabold text-slate-400">Hair Color</label><input type="text" value={editData?.hair_color || ''} onChange={e => onChange('hair_color', e.target.value)} className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl p-3 outline-none text-[13px] font-black dark:text-white" placeholder="Black"/></div>
                       <div className="flex flex-col gap-1"><label className="text-[11px] font-extrabold text-slate-400">Hip Size</label><input type="text" value={editData?.hip_size || ''} onChange={e => onChange('hip_size', e.target.value)} className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl p-3 outline-none text-[13px] font-black dark:text-white" /></div>
                       <div className="flex flex-col gap-1"><label className="text-[11px] font-extrabold text-slate-400">Chest/Bust</label><input type="text" value={editData?.chest_bust || ''} onChange={e => onChange('chest_bust', e.target.value)} className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl p-3 outline-none text-[13px] font-black dark:text-white" /></div>
                       <div className="flex flex-col gap-1"><label className="text-[11px] font-extrabold text-slate-400">Body Type</label><input type="text" value={editData?.body_type || ''} onChange={e => onChange('body_type', e.target.value)} className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl p-3 outline-none text-[13px] font-black dark:text-white" placeholder="Athletic, Slim..."/></div>
                       
                       <div className="flex flex-col gap-1 col-span-1 sm:col-span-2 md:col-span-3 mt-2"><label className="text-[11px] font-extrabold text-slate-400">Specific Characteristics</label><input type="text" value={editData?.specific_characteristics || ''} onChange={e => onChange('specific_characteristics', e.target.value)} className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl p-3 outline-none text-[13px] font-black dark:text-white w-full" placeholder="Freckles, Scars, etc" /></div>
                       <div className="flex flex-col gap-1 col-span-1 sm:col-span-2 md:col-span-3"><label className="text-[11px] font-extrabold text-slate-400">Tattoos</label><input type="text" value={editData?.tattoos || ''} onChange={e => onChange('tattoos', e.target.value)} className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl p-3 outline-none text-[13px] font-black dark:text-white w-full" placeholder="Left arm, neck..." /></div>
                       <div className="flex flex-col gap-1 col-span-1 sm:col-span-2 md:col-span-3"><label className="text-[11px] font-extrabold text-slate-400">Piercings</label><input type="text" value={editData?.piercings || ''} onChange={e => onChange('piercings', e.target.value)} className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl p-3 outline-none text-[13px] font-black dark:text-white w-full" placeholder="Ears, Nose..." /></div>
                   </div>
               )}
            </div>
            
            <div className="border border-slate-200 dark:border-slate-800 rounded-[14px] bg-white dark:bg-dark-card mt-4 overflow-hidden">
               <div className="flex justify-between items-center px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <div className="font-black text-[12px] tracking-[0.06em] text-slate-700 dark:text-slate-300">ABOUT ME (BIO):</div>
               </div>
               <div className="p-4">
                    <label className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3 focus-within:border-brand-500 block relative">
                        <textarea value={editData?.bio || ''} onChange={e => onChange('bio', e.target.value)} rows={4} className="bg-transparent text-[14px] font-bold text-slate-900 dark:text-white outline-none w-full resize-none leading-relaxed" placeholder="Ceritakan pengalaman dan keahlian Anda..."></textarea>
                    </label>
               </div>
            </div>
        </div>
    );
}

function TabAssets({ editData, onChange }: { editData: any, onChange: (f: string, v: any) => void }) {
    
    // ARRAY MANAGER 
    const handleAddURL = (field: 'showreels' | 'audios') => {
        const arr = editData[field] ? [...editData[field]] : [];
        if (arr.length >= 5) { alert(`Maksimal 5 link untuk ${field}`); return; }
        onChange(field, [...arr, '']);
    }
    const handleUpdateURL = (field: 'showreels' | 'audios', index: number, value: string) => {
        const arr = [...(editData[field] || [])];
        arr[index] = value;
        onChange(field, arr);
    }
    const handleDeleteURL = (field: 'showreels' | 'audios', index: number) => {
        const arr = [...(editData[field] || [])];
        arr.splice(index, 1);
        onChange(field, arr);
    }

    return (
        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-[14px] bg-white dark:bg-dark-card animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <div>
                <div className="flex justify-between items-center mb-3">
                   <div className="text-[12px] font-black tracking-widest text-slate-500">SHOWREEL: (YouTube links)</div>
                   <button onClick={() => handleAddURL('showreels')} className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center"><PlusCircle size={14} className="mr-1"/> Add Link</button>
                </div>
                {editData.showreels?.map((url: string, i: number) => (
                    <div key={i} className="flex gap-2 mb-2 animate-in slide-in-from-top-2">
                        <input type="text" value={url} onChange={e => handleUpdateURL('showreels', i, e.target.value)} placeholder="https://youtube.com/watch..." className="flex-1 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 outline-none focus:border-brand-500 text-sm font-medium dark:text-white transition-colors" />
                        <button onClick={() => handleDeleteURL('showreels', i)} className="p-2.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 transition-colors"><Trash2 size={16}/></button>
                    </div>
                )) || <div className="text-sm text-slate-400 py-2">Belum ada showreel. Klik Add Link.</div>}
            </div>
            
            <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                <div className="flex justify-between items-center mb-3">
                   <div className="text-[12px] font-black tracking-widest text-slate-500">VOICE OVER: (SoundCloud / Drive)</div>
                   <button onClick={() => handleAddURL('audios')} className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center"><PlusCircle size={14} className="mr-1"/> Add Link</button>
                </div>
                {editData.audios?.map((url: string, i: number) => (
                    <div key={i} className="flex gap-2 mb-2 animate-in slide-in-from-top-2">
                        <input type="text" value={url} onChange={e => handleUpdateURL('audios', i, e.target.value)} placeholder="https://soundcloud.com/..." className="flex-1 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 outline-none focus:border-brand-500 text-sm font-medium dark:text-white transition-colors" />
                        <button onClick={() => handleDeleteURL('audios', i)} className="p-2.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 transition-colors"><Trash2 size={16}/></button>
                    </div>
                )) || <div className="text-sm text-slate-400 py-2">Belum ada audio. Klik Add Link.</div>}
            </div>
        </div>
    )
}

function TabPhotos({ data, uploading, handleUpload }: { data: any, uploading: any, handleUpload: (e: any, t: string, i?: number) => void }) {
    
    const additionalPhotos = data?.additional_photos || [];
    // Buat array exactly length 3 untuk mapping grid tambahan
    const addonSlots = [0, 1, 2];

    const PhotoCard = ({ type, title, img, index }: any) => {
        const isUp = index !== undefined ? uploading[`${type}-${index}`] : uploading[type];
        
        return (
            <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900 p-2 relative">
                <h4 className="text-[11px] font-black tracking-widest text-slate-500 mb-2 px-1 text-center truncate">{title}</h4>
                <input type="file" id={`upload-${type}-${index}`} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, type, index)} disabled={isUp} />
                <label htmlFor={`upload-${type}-${index}`} className={`w-full aspect-[4/5] rounded-[10px] relative bg-slate-200 dark:bg-slate-800 overflow-hidden cursor-pointer group flex flex-col justify-center items-center transition-opacity ${isUp ? 'opacity-50 pointer-events-none' : 'hover:opacity-90'}`}>
                    {isUp ? (
                        <div className="text-center z-10 flex flex-col items-center">
                            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-2" />
                            <span className="text-brand-600 font-bold text-xs">Up...</span>
                        </div>
                    ) : img ? (
                        <>
                           <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${img})` }} />
                           <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <Camera className="text-white mb-1" size={20}/>
                               <span className="text-white text-[10px] font-bold">Ganti</span>
                           </div>
                        </>
                    ) : (
                        <div className="text-center z-10 flex flex-col items-center">
                            <PlusCircle className="text-slate-400 mb-2" size={24} />
                            <span className="text-brand-600 font-bold text-xs">Pilih Foto</span>
                        </div>
                    )}
                </label>
            </div>
        )
    };

    return (
        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-[14px] bg-white dark:bg-dark-card animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="font-bold text-slate-800 dark:text-white mb-1 text-lg">Kelola Foto Profil</h3>
            <p className="text-sm text-slate-500 mb-6">Mengganti foto utama otomatis menyimpan ke server.</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
               <PhotoCard type="headshot" title="HEADSHOT" img={data?.headshot} />
               <PhotoCard type="side_view" title="SIDE VIEW" img={data?.side_view} />
               <PhotoCard type="full_height" title="FULL HEIGHT" img={data?.full_height} />
            </div>

            <h3 className="font-bold text-slate-800 dark:text-white mb-1 text-base border-t border-slate-100 dark:border-slate-800 pt-6">Upload 3 Foto Tambahan</h3>
            <p className="text-[12px] text-slate-500 mb-4">Tambahkan foto portofolio maksimal 3 buah yang dapat dilihat klien. (Otomatis Save)</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {addonSlots.map((index) => (
                    <PhotoCard key={index} type="additional_photos" index={index} title={`FOTO EXTRA ${index + 1}`} img={additionalPhotos[index]} />
                ))}
            </div>
        </div>
    )
}

function TabCredits({ data }: { data: any }) {
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    
    // Internal state to immediately reflect newly created credits without needing a full page reload
    const [credits, setCredits] = useState<any[]>(data?.experiences || []);

    const [form, setForm] = useState({
        title: '', month: 'January', year: new Date().getFullYear().toString(), company: '', description: ''
    });

    // Populate Year dropdown (from 1980 to Next Year)
    const currentYear = new Date().getFullYear();
    const years = Array.from(new Array(currentYear - 1980 + 2), (val, index) => currentYear + 1 - index);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const handleSave = async () => {
        if (!form.title) { alert('Job title is required'); return; }
        
        setSaving(true);
        try {
            // Because experience API is POST /talents/:talent_id/experiences
            const res: any = await apiRequest(`/talents/${data.talent_id}/experiences`, {
                method: 'POST',
                body: JSON.stringify({
                    title: form.title,
                    month: form.month,
                    year: parseInt(form.year),
                    company: form.company,
                    description: form.description
                })
            });

            if (res.status === 'ok' || res.id) {
                // Prepend to local state
                setCredits([{ exp_id: res.id, ...form, year: parseInt(form.year) }, ...credits]);
                
                // Reset form
                setForm({ title: '', month: 'January', year: currentYear.toString(), company: '', description: '' });
                setShowForm(false);
            }
        } catch (err: any) {
            alert('Failed to save credit: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (exp_id: string, idx: number) => {
        if (!confirm('Hapus credit ini?')) return;
        
        try {
            const res: any = await apiRequest(`/talents/experiences/${exp_id}`, { method: 'DELETE' });
            if (res.status === 'ok' || res.message === 'Dihapus') {
                const arr = [...credits];
                arr.splice(idx, 1);
                setCredits(arr);
            }
        } catch (err: any) {
            alert('Gagal menghapus credit.');
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="flex justify-between items-center mb-4">
                <div className="text-[12px] font-black tracking-[0.08em] text-slate-500">CREDITS LIST</div>
                <button onClick={() => setShowForm(!showForm)} className="bg-brand-600 text-white font-bold px-4 py-2 rounded-xl text-[12px] shadow-sm hover:bg-brand-700 hover:shadow transition-all">+ Add</button>
             </div>

             {/* CREATE FORM */}
             {showForm && (
                 <div className="border border-brand-200 border-dashed bg-brand-50/50 dark:bg-brand-500/10 dark:border-brand-500/30 p-4 rounded-2xl mb-6 shadow-sm zoom-in-95 animate-in">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-sm">Add New Experience</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-extrabold text-slate-500">Job title</label>
                            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} type="text" placeholder="e.g. Lead Actor" className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 outline-none focus:border-brand-500 text-[13px] font-bold dark:text-white" />
                            <span className="text-[10px] text-slate-400">Main role, dancer, model, etc.</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-extrabold text-slate-500">Date</label>
                            <div className="flex gap-2">
                                <select value={form.month} onChange={e => setForm({...form, month: e.target.value})} className="flex-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-3 py-2.5 outline-none focus:border-brand-500 text-[13px] font-bold dark:text-white">
                                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <select value={form.year} onChange={e => setForm({...form, year: e.target.value})} className="w-24 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-3 py-2.5 outline-none focus:border-brand-500 text-[13px] font-bold dark:text-white">
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 mb-3">
                        <label className="text-[11px] font-extrabold text-slate-500">Company / Project</label>
                        <input value={form.company} onChange={e => setForm({...form, company: e.target.value})} type="text" placeholder="Production company or agency" className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 outline-none focus:border-brand-500 text-[13px] font-bold dark:text-white" />
                    </div>

                    <div className="flex flex-col gap-1 mb-4">
                        <label className="text-[11px] font-extrabold text-slate-500">About (Description)</label>
                        <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe your role and responsibilities..." rows={3} className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-4 py-3 outline-none focus:border-brand-500 text-[13px] font-bold dark:text-white resize-y" />
                        <span className="text-[10px] text-slate-400">Max 500 characters</span>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={handleSave} disabled={saving} className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-2.5 rounded-full text-sm disabled:opacity-50">
                            {saving ? 'Saving...' : 'Save Credit'}
                        </button>
                        <button onClick={() => setShowForm(false)} className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-6 py-2.5 border border-slate-200 rounded-full text-sm transition-colors">
                            Cancel
                        </button>
                    </div>
                 </div>
             )}

             {/* DISPLAY LIST */}
             <div className="grid gap-3">
                 {credits.length > 0 ? (
                     credits.map((exp: any, i: number) => (
                         <div key={exp.exp_id || i} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-card rounded-[14px] p-4 relative group hover:border-brand-300 dark:hover:border-brand-900 transition-colors">
                             <button onClick={() => handleDelete(exp.exp_id, i)} className="absolute top-3 right-3 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={18}/></button>
                             <div className="flex flex-col md:flex-row md:items-baseline md:justify-between pr-8 mb-1">
                                 <b className="text-[15px] text-slate-900 dark:text-white font-black">{exp.title}</b>
                                 <span className="text-[12px] font-bold text-slate-500">{exp.month ? `${exp.month} ` : ''}{exp.year}</span>
                             </div>
                             <div className="text-[12px] font-black text-slate-500 mb-2 tracking-wide uppercase">{exp.company || 'Independent Project'}</div>
                             {exp.description && (
                                 <div className="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed mt-2 border-t border-slate-100 dark:border-slate-800 pt-2">
                                     {exp.description}
                                 </div>
                             )}
                         </div>
                     ))
                 ) : (
                     <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-500 bg-slate-50/50 dark:bg-slate-900/20">
                         <div className="font-bold text-sm mb-1 text-slate-600 dark:text-slate-400">No experiences listed yet.</div>
                         <div className="text-xs">Add your acting, modeling, or dancing experiences to boost your profile.</div>
                     </div>
                 )}
             </div>
        </div>
    )
}