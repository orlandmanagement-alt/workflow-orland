import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAppStore';
import { apiRequest } from '@/lib/api';
import { 
  Download, Phone, Mail, Edit2, 
  Instagram, Youtube, Twitter, Link as LinkIcon, 
  ChevronDown, X, PlusCircle, Trash2, Camera
} from 'lucide-react';

export default function ProfileDashboard() {
  const [activeTab, setActiveTab] = useState('info');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>, photoType: 'headshot' | 'sideView' | 'fullHeight') => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
          setUploading(prev => ({ ...prev, [photoType]: true }));

          // 1. Minta Presigned URL dari Backend
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
             body: file
          });

          if (!r2Res.ok) throw new Error("File gagal di-upload ke server utama");

          // 3. Update Database via DB_CORE
          const publicUrl = presignedRes.publicUrl;
          const updateRes: any = await apiRequest('/talents/me', {
             method: 'PUT',
             body: JSON.stringify({
                ...data,
                [photoType]: publicUrl
             })
          });

          // 4. Update UI Optimistically
          if (updateRes.status === 'ok') {
              setData(updateRes.data);
          }

      } catch (err: any) {
          alert('Upload Error: ' + (err.message || 'Terjadi kesalahan sistem'));
      } finally {
          setUploading(prev => ({ ...prev, [photoType]: false }));
      }
  };

  useEffect(() => {
    // Memanggil API Profile (DB_CORE)
    apiRequest('/talents/me')
      .then((res: any) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center p-20 text-slate-500">
              <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-bold animate-pulse">Memuat Orland Catalog...</p>
          </div>
      );
  }

  // Menentukan jika profile hide karena blm ada foto
  const isHidden = !data?.headshot;

  return (
    <div className="max-w-[1100px] mx-auto pb-20 fade-in zoom-in-95 duration-500">
      
      {/* ================= STICKY BANNER (HIDDEN PROFILE) ================= */}
      {isHidden && (
        <div className="flex items-center gap-3 bg-red-50 text-red-700 border border-red-200/50 p-3 px-4 rounded-2xl text-sm font-medium mb-6 shadow-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_0_4px_rgba(220,38,38,0.15)] flex-shrink-0 animate-pulse" />
          <span className="flex-1">
              <strong>Your profile is hidden:</strong> Please complete your main photo to be discovered by Casting Directors.
          </span>
          <button className="text-red-700 font-bold underline hover:text-red-900">Upload Now</button>
        </div>
      )}

      {/* ================= MAIN GRID ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
        
        {/* ================= LEFT SIDEBAR ================= */}
        <aside className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-[14px] p-4 shadow-[0_10px_30px_rgba(17,24,39,0.04)] sticky top-6">
          
          {/* PHOTO BOXES */}
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
                               <span className="text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-sm shadow-xl">Ganti Foto Div Utama</span>
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
                           ) : data?.sideView || data?.side_view ? (
                               <>
                                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${data.sideView || data.side_view})` }} />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white" size={16}/></div>
                               </>
                           ) : (
                               <div className="text-center z-10">
                                   <span className="text-brand-600 font-bold text-xs block">Upload</span>
                                   <span className="text-[9px] text-slate-400">Min: 600×800 px</span>
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
                           ) : data?.fullHeight || data?.full_height ? (
                               <>
                                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${data.fullHeight || data.full_height})` }} />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white" size={16}/></div>
                               </>
                           ) : (
                               <div className="text-center z-10">
                                   <span className="text-brand-600 font-bold text-xs block">Upload</span>
                                   <span className="text-[9px] text-slate-400">Min: 600×800 px</span>
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

          {/* CONTACTS */}
          <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
             <div className="flex justify-between items-center mb-3">
                <h4 className="text-[12px] font-black tracking-[0.08em] text-slate-600 dark:text-slate-400">CONTACTS</h4>
                <button className="text-xs font-bold text-slate-800 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white">Edit</button>
             </div>
             <div className="grid gap-2 text-[13px]">
                <div className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 rounded-xl">
                   <span className="text-slate-500"><Phone size={14}/></span>
                   <span className="font-bold text-slate-800 dark:text-white text-right">{data?.phone || '-'}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 rounded-xl">
                   <span className="text-slate-500"><Mail size={14}/></span>
                   <span className="font-bold text-slate-800 dark:text-white text-right">{data?.email || '-'}</span>
                </div>
             </div>
          </div>

          {/* SOCIAL MEDIA */}
          <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
             <div className="flex justify-between items-center mb-3">
                <h4 className="text-[12px] font-black tracking-[0.08em] text-slate-600 dark:text-slate-400">SOCIAL MEDIA</h4>
                <button className="text-xs font-bold text-slate-800 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white">Edit</button>
             </div>
             
             {(!data?.instagram && !data?.tiktok && !data?.twitter) ? (
                 <div className="p-3 bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 rounded-xl flex justify-between items-center text-[13px] text-slate-500">
                    Add social links. <span className="text-brand-600 font-bold cursor-pointer">Add</span>
                 </div>
             ) : (
                 <div className="grid gap-2 text-[13px]">
                    {data?.instagram && (
                        <div className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 rounded-xl">
                            <Instagram size={14} className="text-pink-600"/>
                            <a href={data.instagram} target="_blank" rel="noreferrer" className="font-bold text-brand-600 hover:underline text-right break-all ml-4 line-clamp-1">{data.instagram}</a>
                        </div>
                    )}
                    {data?.tiktok && (
                        <div className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 rounded-xl">
                            <span className="font-bold text-slate-900 dark:text-white text-[10px]">TikTok</span>
                            <a href={data.tiktok} target="_blank" rel="noreferrer" className="font-bold text-brand-600 hover:underline text-right break-all ml-4 line-clamp-1">{data.tiktok}</a>
                        </div>
                    )}
                 </div>
             )}
          </div>

          <div className="mt-4 text-[11px] text-slate-400 tracking-wider">
              Profile ID: <span className="font-mono">{data?.talent_id?.split('-')[0] || 'TBD'}</span>
          </div>

        </aside>

        {/* ================= RIGHT MAIN ================= */}
        <main className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-[14px] shadow-[0_10px_30px_rgba(17,24,39,0.04)] overflow-visible">
          
          <div className="p-4 md:p-5">
             {/* HEADER TITLE */}
             <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                 <div>
                    <h1 className="text-[28px] font-black text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-3">
                       {data?.full_name || 'Orland Talent'}
                       <button className="text-slate-400 hover:text-slate-700 bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors">
                           <Edit2 size={14} />
                       </button>
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[13px] text-slate-500">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-900 font-bold dark:bg-orange-500/20 dark:border-orange-500/30 dark:text-orange-400">
                            <span className="w-3.5 h-3.5 flex items-center justify-center star-clip bg-gradient-to-tr from-amber-400 to-amber-500"></span> 
                            {Math.round((data?.score || 0) * 100)}
                        </span>
                        <span className="font-semibold tracking-wider">/ 10,000</span>
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
             <div className="mt-4 border border-amber-200 bg-amber-50/50 dark:bg-amber-500/10 dark:border-amber-500/20 rounded-[14px] p-3.5">
                <div className="flex justify-between items-center text-[13px] text-amber-900 dark:text-amber-500 font-black mb-2.5">
                   <span>Your profile progress</span>
                   <button className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-lg text-slate-700 dark:text-slate-300">Open ▾</button>
                </div>
                <div className="h-2.5 rounded-full bg-amber-200/50 dark:bg-amber-900/40 overflow-hidden border border-amber-900/10">
                   <div className="h-full bg-gradient-to-r from-rose-400 to-amber-500 rounded-full w-[45%] transition-all duration-500" />
                </div>
                <div className="mt-2.5 text-[13px] text-amber-800 dark:text-amber-600 flex justify-between items-center gap-3">
                   <span>Get points for completing your profile to get noticed.</span>
                   <span className="text-brand-600 font-bold shrink-0 cursor-pointer hover:underline">Learn more</span>
                </div>
             </div>

             {/* TAB CONTENT RENDERER */}
             <div className="mt-4">
                 {activeTab === 'info' && <TabInfo data={data} />}
                 {activeTab === 'photos' && <TabPhotos data={data} />}
                 {activeTab === 'assets' && <TabAssets data={data} />}
                 {activeTab === 'credits' && <TabCredits data={data} />}
             </div>
          </div>
        </main>
      </div>
      
      {/* Global CSS for custom star clip path (replicated from your HTML) */}
      <style>{`
        .star-clip {
            clip-path: polygon(50% 0%, 62% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 38% 35%);
        }
      `}</style>
    </div>
  );
}

// ----------------------------------------------------------------------
// SUB COMPONENTS FOR TABS (MOCKUPS TRANSLATED)
// ----------------------------------------------------------------------

function TabInfo({ data }: { data: any }) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* PERSONAL DETAILS MODULAR */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-[14px] bg-white dark:bg-dark-card">
               <div className="flex justify-between items-center px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-t-[14px] border-b border-slate-200 dark:border-slate-800">
                  <div className="font-black text-[12px] tracking-[0.06em] text-slate-700 dark:text-slate-300">PERSONAL:</div>
                  <button className="text-[13px] font-black text-brand-600 hover:text-brand-700 relative">✎</button>
               </div>
               <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                 <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3">
                    <div className="text-[12px] font-extrabold text-slate-400 mb-1">Gender</div>
                    <div className="text-[14px] font-black text-slate-900 dark:text-white">{data?.gender || '-'}</div>
                 </div>
                 <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3">
                    <div className="text-[12px] font-extrabold text-slate-400 mb-1">Date Of Birth</div>
                    <div className="text-[14px] font-black text-slate-900 dark:text-white">{data?.birth_date || '-'}</div>
                 </div>
                 <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3">
                    <div className="text-[12px] font-extrabold text-slate-400 mb-1">Category</div>
                    <div className="text-[14px] font-black text-slate-900 dark:text-white">{data?.category || '-'}</div>
                 </div>
                 <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3">
                    <div className="text-[12px] font-extrabold text-slate-400 mb-1">Location</div>
                    <div className="text-[14px] font-black text-slate-900 dark:text-white">Jakarta</div>
                 </div>
               </div>
            </div>

            {/* APPEARANCE MODULAR */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-[14px] bg-white dark:bg-dark-card mt-4">
               <div className="flex justify-between items-center px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-t-[14px] border-b border-slate-200 dark:border-slate-800">
                  <div className="font-black text-[12px] tracking-[0.06em] text-slate-700 dark:text-slate-300">APPEARANCE:</div>
                  <button className="text-[13px] font-black text-brand-600 hover:text-brand-700 relative">✎</button>
               </div>
               <div className="p-4">
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3"><div className="text-[12px] font-extrabold text-slate-400 mb-1">Height</div><div className="text-[14px] font-black text-slate-900 dark:text-white">{data?.height ? `${data.height} cm` : 'n/a'}</div></div>
                    <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3"><div className="text-[12px] font-extrabold text-slate-400 mb-1">Weight</div><div className="text-[14px] font-black text-slate-900 dark:text-white">{data?.weight ? `${data.weight} kg` : 'n/a'}</div></div>
                    <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3"><div className="text-[12px] font-extrabold text-slate-400 mb-1">Eye Color</div><div className="text-[14px] font-black text-slate-400">n/a</div></div>
                    <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3"><div className="text-[12px] font-extrabold text-slate-400 mb-1">Hair Color</div><div className="text-[14px] font-black text-slate-400">n/a</div></div>
                    <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3"><div className="text-[12px] font-extrabold text-slate-400 mb-1">Chest/Bust</div><div className="text-[14px] font-black text-slate-400">n/a</div></div>
                    <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-3"><div className="text-[12px] font-extrabold text-slate-400 mb-1">Body Type</div><div className="text-[14px] font-black text-slate-400">n/a</div></div>
                 </div>
               </div>
            </div>
        </div>
    );
}

function TabPhotos({ data }: { data: any }) {
    return (
        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-[14px] bg-white dark:bg-dark-card animate-in fade-in slide-in-from-bottom-2 duration-300 text-center">
            <h3 className="font-bold text-slate-800 dark:text-white mb-2">Manajemen Foto Lanjutan</h3>
            <p className="text-sm text-slate-500 mb-4">Gunakan sub-menu Media untuk mengelola portofolio comp card premium Anda.</p>
            <button className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-2 px-6 rounded-xl">Buka Gallery Mode</button>
        </div>
    )
}

function TabAssets({ data }: { data: any }) {
    return (
        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-[14px] bg-white dark:bg-dark-card animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="mb-6">
                <div className="text-[12px] font-black tracking-widest text-slate-500 mb-2">VIDEOS: (YouTube links)</div>
                <div className="flex gap-2">
                    <input type="text" placeholder="Paste YouTube URL here..." className="flex-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 outline-none focus:border-brand-500 text-sm" />
                    <button className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white font-bold px-4 py-2 rounded-xl">Add</button>
                </div>
            </div>
        </div>
    )
}

function TabCredits({ data }: { data: any }) {
    return (
        <div className="border border-slate-200 dark:border-slate-800 rounded-[14px] bg-white dark:bg-dark-card animate-in fade-in slide-in-from-bottom-2 duration-300 p-4">
             <div className="flex justify-between items-center mb-4">
                <div className="text-[12px] font-black tracking-widest text-slate-500">CREDITS LIST</div>
                <button className="bg-brand-600 text-white font-bold px-4 py-2 rounded-full text-[13px] hover:bg-brand-700">+ Add Another</button>
             </div>

             <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 relative">
                 <button className="absolute top-3 right-3 text-slate-400 hover:text-red-500"><X size={16}/></button>
                 <div className="flex justify-between mb-1 pr-6">
                     <span className="font-bold text-[15px] text-slate-900 dark:text-white">TVC Pepsodent (Peran Utama)</span>
                     <span className="font-bold text-slate-900 dark:text-white">May 2024</span>
                 </div>
                 <div className="text-[12px] font-black text-slate-500 mb-2">PT Kreatif Gemilang</div>
                 <div className="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed">
                     Bertindak sebagai aktor utama pria dalam iklan TVC komersial durasi 30 detik untuk *national roll-out*.
                 </div>
             </div>
        </div>
    )
}
