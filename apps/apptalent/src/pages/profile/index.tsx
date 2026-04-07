import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/useAppStore';
import { apiRequest } from '@/lib/api';
import { 
  Download, Phone, Mail, Instagram,
  Camera, Save, Loader2, Share2, Link as LinkIcon
} from 'lucide-react';

// Components
import { ProfileSkeleton } from '@/components/ui/ProfileSkeleton';
import { Toast } from '@/components/ui/Toast';
import { ProgressModal } from './components/ProgressModal';
import { TabInfo } from './components/TabInfo';
import { TabPhotos } from './components/TabPhotos';
import { TabAssets } from './components/TabAssets';
import { TabCredits } from './components/TabCredits';
import { useProfileProgress } from '@/hooks/useProfileProgress';

const DRAFT_KEY = 'orland_profile_draft';

// Centralised Tab Configurations
const TABS = [
    { id: 'info', label: 'Info' },
    { id: 'photos', label: 'Photos' },
    { id: 'assets', label: 'Videos & Audio' },
    { id: 'credits', label: 'Experience' },
];

export default function ProfileDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('info');
  
  // Data States
  const [data, setData] = useState<any>(null); // Initial Server Data
  const [editData, setEditData] = useState<any>(null); // Working Data (Draft)
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Modals & Feedback
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const profileProgressData = useProfileProgress();
  const progressValue = typeof profileProgressData === 'number' ? profileProgressData : (profileProgressData as any)?.percentage || 0;

  // Initialize Data (Fetch API or Resume Draft)
  useEffect(() => {
    apiRequest('/talents/me')
      .then((res: any) => {
          setData(res.data);
          let initialData = { ...res.data };
          
          if (!initialData.phone) initialData.phone = user?.phone || '';
          if (!initialData.email) initialData.email = user?.email || '';
          if (!initialData.showreels) initialData.showreels = [];
          if (!initialData.audios) initialData.audios = [];
          if (!initialData.additional_photos) initialData.additional_photos = [];
          if (!initialData.interests) initialData.interests = [];
          
          // Check Local Storage Draft Overrides
          const draftStr = localStorage.getItem(DRAFT_KEY);
          if (draftStr) {
             const draftData = JSON.parse(draftStr);
             // Merge API over draft if needed, or strictly apply draft:
             initialData = { ...initialData, ...draftData };
             setIsDirty(true);
          }
          
          setEditData(initialData);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user]);

  // Handle Input Changes -> Auto LocalStorage Save
  const handleFieldChange = useCallback((field: string, value: any) => {
      setEditData((prev: any) => {
          const newData = { ...prev, [field]: value };
          localStorage.setItem(DRAFT_KEY, JSON.stringify(newData));
          setIsDirty(true);
          return newData;
      });
  }, []);

  // Handle Photo Upload directly to R2 (auto-saves to API so imagery is not lost)
  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>, photoType: string, index?: number) => {
      const { processImage } = await import('@/utils/imageCompressor');
      const rawFile = e.target.files?.[0];
      if (!rawFile) return;

      try {
          const uploadKey = index !== undefined ? `${photoType}-${index}` : photoType;
          setUploading(prev => ({ ...prev, [uploadKey]: true }));
          const ratio = (photoType === 'headshot' || photoType === 'additional_photos') ? 4/5 : 3/4;
          const file = await processImage(rawFile, ratio);

          const presignedRes: any = await apiRequest('/media/upload-url', {
             method: 'POST', body: JSON.stringify({ fileName: file.name, contentType: file.type, folder: `talents/${data?.talent_id || 'unassigned'}` })
          });

          if (!presignedRes || !presignedRes.uploadUrl) throw new Error("Gagal mendapatkan link upload");

          const r2Res = await fetch(presignedRes.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file, cache: 'no-store' });
          if (!r2Res.ok) throw new Error("File gagal di-upload ke server utama");

          const publicUrl = presignedRes.publicUrl;
          let updatePayload = { ...editData };
          
          if (photoType === 'additional_photos' && index !== undefined) {
             const newAddPhotos = [...(updatePayload.additional_photos || [])];
             newAddPhotos[index] = publicUrl;
             updatePayload.additional_photos = newAddPhotos;
          } else {
             updatePayload[photoType] = publicUrl;
          }

          // Force API push for images so valid links are secured immediately
          const updateRes: any = await apiRequest('/talents/me', { method: 'PUT', body: JSON.stringify(updatePayload) });
          if (updateRes.status === 'ok') {
              const updated = updateRes.data;
              setData(updated);
              // Merge back into local draft to prevent collision
              handleFieldChange(photoType, publicUrl);
              if (index !== undefined) handleFieldChange('additional_photos', updatePayload.additional_photos);
          }
      } catch (err: any) {
          alert('Upload Error: ' + (err.message || 'Terjadi kesalahan sistem'));
      } finally {
          const uploadKey = index !== undefined ? `${photoType}-${index}` : photoType;
          setUploading(prev => ({ ...prev, [uploadKey]: false }));
      }
  };

  const handleSaveChanges = async () => {
      setSaving(true);
      try {
          const res: any = await apiRequest('/talents/me', { method: 'PUT', body: JSON.stringify(editData) });
          if (res.status === 'ok') {
              setData(res.data);
              localStorage.removeItem(DRAFT_KEY);
              setIsDirty(false);
              setToastMessage('Profile changes saved successfully');
          }
      } catch (err) {
          alert('Gagal menyimpan profil. Coba lagi.');
      } finally {
          setSaving(false);
      }
  };

  const copyPublicLink = () => {
      const url = `${window.location.origin}/p/${data?.talent_id}`;
      navigator.clipboard.writeText(url);
      setToastMessage('Public link copied to clipboard!');
  };

  if (loading) return <ProfileSkeleton />;

  const isHidden = !data?.headshot;

  return (
    <div className="max-w-[1100px] mx-auto pb-28 pt-4 md:pt-8 bg-slate-50/50 dark:bg-[#0B1120] min-h-screen">
      
      {/* Toast Notification Mount */}
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage('')} />}

      {/* Hidden Profile Alert */}
      {isHidden && (
        <div className="flex items-center gap-3 bg-red-50 text-red-700 border border-red-200/50 p-3 px-4 rounded-2xl text-sm font-medium mb-6 shadow-sm mx-4 xl:mx-0">
          <div className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_0_4px_rgba(220,38,38,0.15)] flex-shrink-0 animate-pulse" />
          <span className="flex-1"><strong>Your profile is hidden:</strong> Please complete your main photo to be discovered by Casting Directors.</span>
        </div>
      )}

      {/* HEADER HERO AREA */}
      <div className="mb-6 px-4 md:px-8 py-6 bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-[14px] flex flex-col md:flex-row justify-between items-start md:items-center shadow-[0_10px_30px_rgba(17,24,39,0.03)] mx-4 xl:mx-0">
          <div>
              <div className="flex items-center gap-3 mb-1">
                 <input 
                   type="text" 
                   value={editData?.full_name || ''} 
                   onChange={(e) => handleFieldChange('full_name', e.target.value)}
                   className="text-2xl md:text-[32px] font-black tracking-tight text-slate-900 dark:text-white bg-transparent outline-none w-full max-w-sm md:max-w-md border-b-[2px] border-transparent hover:border-slate-300 focus:border-brand-500 transition-colors"
                   placeholder="Your Name"
                 />
              </div>
              <div className="flex items-center gap-3 pl-1">
                 <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-md">ID: #{data?.talent_id || '----'}</span>
                 <a href={`/p/${data?.talent_id}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center transition-colors">
                     View Public Profile <Share2 size={12} className="ml-1" />
                 </a>
              </div>
          </div>
          
          <div className="flex gap-3 mt-4 md:mt-0">
              <button onClick={copyPublicLink} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-xl transition-colors tooltip-target" title="Copy Public Link">
                 <LinkIcon size={18} />
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white font-bold rounded-xl hover:border-brand-500 transition-colors text-sm">
                 <Download size={16} className="text-slate-400" /> Comp Card
              </button>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start mx-4 xl:mx-0">
        
        {/* SIDEBAR (Sticky on Desktop) */}
        <aside className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-[14px] p-5 shadow-[0_10px_30px_rgba(17,24,39,0.03)] sticky top-6 max-h-[calc(100vh-48px)] overflow-y-auto no-scrollbar lg:order-1 order-2">
           
           <div className="mb-6 relative group overflow-hidden bg-slate-100 dark:bg-slate-800 rounded-[14px] aspect-[4/5] flex items-center justify-center">
              <input type="file" id="upload-headshot-sb" className="hidden" accept="image/*" onChange={(e) => handleUploadPhoto(e, 'headshot')} disabled={uploading['headshot']} />
              <label htmlFor="upload-headshot-sb" className="w-full h-full cursor-pointer absolute inset-0 z-10 flex flex-col justify-center items-center">
                  {uploading['headshot'] && <Loader2 className="animate-spin text-white z-20" size={32} />}
              </label>
              {data?.headshot ? (
                  <>
                    <img src={data.headshot} alt="Headshot" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-bold bg-white/20 backdrop-blur px-3 py-1.5 rounded-lg">Ganti Foto</span>
                    </div>
                  </>
              ) : (
                  <div className="text-slate-400 flex flex-col items-center">
                      <Camera size={32} className="mb-2 opacity-50" />
                      <span className="text-xs font-bold">Add Headshot</span>
                  </div>
              )}
           </div>

           <div className="border-t border-slate-100 dark:border-slate-800 pt-5 text-[13px] font-medium text-slate-700 dark:text-slate-300 space-y-3">
               <div className="flex items-center gap-3 group">
                   <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-brand-500 transition-colors shrink-0"><Phone size={14}/></div>
                   <input type="text" value={editData?.phone || ''} onChange={(e) => handleFieldChange('phone', e.target.value)} className="bg-transparent outline-none w-full placeholder:text-slate-300" placeholder="+62 812..." />
               </div>
               <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0"><Mail size={14}/></div>
                   <span className="truncate w-full text-slate-500">{data?.email || editData?.email || 'N/A'}</span>
               </div>
               <div className="flex items-center gap-3 group">
                   <div className="w-8 h-8 rounded-full bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center text-pink-500 group-hover:text-pink-600 transition-colors shrink-0"><Instagram size={14}/></div>
                   <input type="text" value={editData?.instagram || ''} onChange={(e) => handleFieldChange('instagram', e.target.value)} className="bg-transparent outline-none w-full placeholder:text-slate-300" placeholder="@username" />
               </div>
           </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="lg:order-2 order-1 min-w-0">
           
           {/* Gamification Embedded Banner */}
           <div className="mb-6 bg-amber-500 rounded-[14px] p-5 shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-center justify-between text-white border border-amber-400" onClick={() => setShowMissingModal(true)}>
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
               <div className="relative z-10 flex items-center gap-4 mb-3 sm:mb-0">
                  {/* Circle Progress */}
                  <div className="w-12 h-12 rounded-full border-4 border-amber-300/50 flex items-center justify-center relative bg-white/10 shrink-0">
                      <span className="text-xs font-black">{progressValue}%</span>
                  </div>
                  <div>
                      <h4 className="font-black text-lg tracking-tight">Complete your profile</h4>
                      <p className="text-sm font-medium text-amber-100">Unlock opportunities by adding missing details.</p>
                  </div>
               </div>
               <button className="bg-white text-amber-600 hover:bg-amber-50 font-black text-sm px-6 py-2.5 rounded-xl transition-colors relative z-10 w-full sm:w-auto shadow-sm">
                   View Checklist
               </button>
           </div>
           
           {/* DYNAMIC TABS HEADER */}
           <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-[14px] shadow-[0_10px_30px_rgba(17,24,39,0.03)] overflow-hidden">
               <div className="flex overflow-x-auto no-scrollbar border-b border-slate-100 dark:border-slate-800">
                  {TABS.map(tab => (
                      <button 
                          key={tab.id} 
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex-1 py-4 text-sm font-bold capitalize transition-colors relative whitespace-nowrap px-4 select-none ${activeTab === tab.id ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                      >
                          {tab.label}
                          {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-brand-600 dark:bg-brand-500 transition-all shadow-[0_-2px_10px_rgba(79,70,229,0.3)]" style={{ layoutId: "tab-indicator" } as any} />}
                      </button>
                  ))}
               </div>

               {/* TAB CONTENT RENDERING */}
               <div className="p-4 md:p-6 min-h-[400px]">
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
           <div className="bg-slate-900 border border-slate-700 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl p-2 px-3 flex items-center gap-4 backdrop-blur-md">
              <div className="hidden sm:block pl-3 text-white/90 text-sm font-semibold tracking-wide">
                 Unsaved changes
              </div>
              <button 
                 onClick={handleSaveChanges}
                 disabled={saving}
                 className="flex items-center justify-center bg-brand-600 hover:bg-brand-500 text-white font-black text-sm px-8 py-2.5 rounded-xl transition-colors disabled:opacity-50 min-w-[140px]"
              >
                 {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                 {saving ? 'Saving...' : 'Save Draft'}
              </button>
           </div>
        </div>
      )}
      
      {/* ================= POPUP WHAT'S MISSING ================= */}
      {showMissingModal && (
          <ProgressModal profileProgressData={profileProgressData} onClose={() => setShowMissingModal(false)} />
      )}
    </div>
  );
}