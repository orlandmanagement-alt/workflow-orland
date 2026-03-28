import React, { useState } from 'react';
import { useProfileEditor } from '@/hooks/useProfileEditor';
import { Instagram, Youtube, Twitter, Film, Link as LinkIcon, ImagePlus, FileDown, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { generateCompCardPDF } from '@/utils/generatePDF';
import '@/assets/css/profile.css';

const ProfileEditor = () => {
  const { data, updateField, isDirty, isSaving, loading, saveToCloud, discardDraft } = useProfileEditor();
  const [activeTab, setActiveTab] = useState('info');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    await generateCompCardPDF('pdf-comp-card-template', data.full_name || 'Talent');
    setIsGeneratingPDF(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://talent.orlandmanagement.com/p/${data.full_name?.toLowerCase().replace(/ /g, "-") || "talent"}`);
    alert("Link profil berhasil disalin! Silakan paste ke WhatsApp klien.");
  };

  if (loading) return <div className="p-10 text-center font-bold text-slate-500 dark:text-slate-400">Membaca Data Profil...</div>;

  return (
    <div className="profile-wrap animate-in fade-in duration-500 relative pb-20">
      <div className="profile-grid">
        
        {/* SIDEBAR */}
        <aside className="profile-card profile-side dark:bg-dark-card dark:border-slate-800">
          <h4 className="text-xs font-bold tracking-widest text-slate-600 dark:text-slate-400 mb-3">HEADSHOT</h4>
          
          <div className="profile-ph dark:bg-slate-800 relative">
            <input 
              type="file" 
              id="profile-upload" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => { 
                if(e.target.files?.[0]) { 
                  alert("Sistem siap mengunggah: " + e.target.files[0].name); 
                  // Integrasi API Upload di sini 
                } 
              }} 
            />
            <div 
              onClick={() => document.getElementById("profile-upload")?.click()} 
              className="profile-avatar border dark:border-slate-700 bg-slate-100 cursor-pointer group hover:opacity-80 transition-opacity relative" 
              style={{ backgroundImage: data.profile_picture ? `url(${data.profile_picture})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
              {!data.profile_picture && <span className="absolute inset-0 flex items-center justify-center text-brand-500 font-bold text-xs">Ketuk untuk Upload</span>}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <span className="text-white text-xs font-bold">Ubah Foto</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex flex-col gap-3">
            <button onClick={handleDownloadPDF} disabled={isGeneratingPDF} className="profile-btn bg-slate-900 text-white w-full border-none font-bold hover:bg-slate-800 transition-colors flex items-center justify-center disabled:opacity-70">
              {isGeneratingPDF ? <><Loader2 size={16} className="animate-spin mr-2"/> Membuat PDF...</> : <><FileDown size={16} className="mr-2"/> Download Comp Card</>}
            </button>
            <button onClick={handleCopyLink} className="profile-btn ghost w-full dark:text-slate-300 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-50 transition-colors flex items-center justify-center">
              <LinkIcon size={16} className="mr-2"/> Salin Link Publik
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="profile-card profile-main dark:bg-dark-card dark:border-slate-800">
          <div className="profile-title mb-6">
            <h1 className="dark:text-white">{data.full_name || 'Talent Name'}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Orland Management Talent</p>
          </div>

          <div className="profile-tabs border-b border-slate-200 dark:border-slate-800">
            {['info', 'photos', 'assets', 'credits'].map((tab) => (
              <div key={tab} onClick={() => setActiveTab(tab)} className={`profile-tab dark:text-slate-400 ${activeTab === tab ? 'active dark:text-brand-400 dark:border-brand-400' : ''}`}>
                {tab === 'info' ? 'Info Dasar' : tab === 'photos' ? 'Comp Card' : tab === 'assets' ? 'Social Assets' : 'Pengalaman'}
              </div>
            ))}
          </div>

          {/* TAB 1: INFO */}
          {activeTab === 'info' && (
            <div className="mt-6 space-y-6">
              <div className="profile-section">
                <div className="profile-sectionHead dark:text-slate-300">INFORMASI DASAR</div>
                <div className="profile-sectionBody profile-formGrid">
                  <div className="profile-frow"><label className="dark:text-slate-400">Nama Lengkap</label><input type="text" value={data.full_name || ''} onChange={(e) => updateField('full_name', e.target.value)} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white" /></div>
                  <div className="profile-frow"><label className="dark:text-slate-400">Tanggal Lahir</label><input type="date" value={data.birth_date || ''} onChange={(e) => updateField('birth_date', e.target.value)} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white" /></div>
                  <div className="profile-frow"><label className="dark:text-slate-400">Jenis Kelamin</label><select value={data.gender || ''} onChange={(e) => updateField('gender', e.target.value)} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"><option value="">Pilih...</option><option>Male</option><option>Female</option></select></div>
                  <div className="profile-frow"><label className="dark:text-slate-400">Kategori Utama</label><select value={data.category || ''} onChange={(e) => updateField('category', e.target.value)} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"><option value="">Pilih...</option><option>Model</option><option>Actor</option><option>Influencer</option></select></div>
                </div>
              </div>
              <div className="profile-section">
                <div className="profile-sectionHead dark:text-slate-300">PENAMPILAN FISIK</div>
                <div className="profile-sectionBody profile-formGrid">
                  <div className="profile-frow"><label className="dark:text-slate-400">Tinggi (cm)</label><input type="number" value={data.height || ''} onChange={(e) => updateField('height', e.target.value)} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white" /></div>
                  <div className="profile-frow"><label className="dark:text-slate-400">Berat (kg)</label><input type="number" value={data.weight || ''} onChange={(e) => updateField('weight', e.target.value)} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white" /></div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2, 3, 4 */}
          {activeTab === 'photos' && <div className="p-8 mt-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-center"><Link to="/media" className="inline-block px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg transition-colors">Buka Comp Card Pro &rarr;</Link></div>}
          {activeTab === 'assets' && <div className="mt-6 p-4 text-center text-slate-500">Menu Manajemen Sosial Media</div>}
          {activeTab === 'credits' && <div className="mt-6 p-4 text-center text-slate-500">Menu Manajemen CV & Pengalaman</div>}

        </main>
      </div>

      {/* HIDDEN TEMPLATE COMP CARD UNTUK PDF GENERATOR (A4 Layout) */}
      <div id="pdf-comp-card-template" style={{ display: 'none', width: '794px', height: '1123px', backgroundColor: '#ffffff', padding: '40px', boxSizing: 'border-box', position: 'absolute', top: '-9999px', left: '-9999px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #000', paddingBottom: '20px', marginBottom: '30px' }}>
              <div>
                  <h1 style={{ fontSize: '48px', fontWeight: '900', margin: '0', color: '#000', textTransform: 'uppercase' }}>{data.full_name || 'TALENT NAME'}</h1>
                  <p style={{ fontSize: '20px', fontWeight: '600', color: '#666', margin: '5px 0 0 0', textTransform: 'uppercase', letterSpacing: '2px' }}>{data.category || 'ACTOR & COMMERCIAL MODEL'}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                  <h2 style={{ fontSize: '28px', fontWeight: '900', margin: '0', color: '#000' }}>ORLAND</h2>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#666', margin: '0' }}>MANAGEMENT</p>
              </div>
          </div>

          <div style={{ display: 'flex', gap: '30px', height: '650px' }}>
              {/* Foto Utama */}
              <div style={{ flex: 2, backgroundColor: '#f1f5f9', borderRadius: '12px', overflow: 'hidden' }}>
                  {data.profile_picture ? (
                     <img src={data.profile_picture} alt="Main" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                  ) : (
                     <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '24px', fontWeight: 'bold' }}>NO PHOTO</div>
                  )}
              </div>
              
              {/* Foto Tambahan & Stats */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ flex: 1, backgroundColor: '#f1f5f9', borderRadius: '12px', overflow: 'hidden' }}>
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontWeight: 'bold' }}>Side Angle</div>
                  </div>
                  <div style={{ flex: 1, backgroundColor: '#f1f5f9', borderRadius: '12px', overflow: 'hidden' }}>
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontWeight: 'bold' }}>Full Body</div>
                  </div>
              </div>
          </div>

          <div style={{ marginTop: '40px', backgroundColor: '#000', color: '#fff', padding: '30px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between' }}>
              <div><p style={{ margin: 0, fontSize: '14px', color: '#aaa', textTransform: 'uppercase' }}>Height</p><p style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>{data.height || '-'} cm</p></div>
              <div><p style={{ margin: 0, fontSize: '14px', color: '#aaa', textTransform: 'uppercase' }}>Weight</p><p style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>{data.weight || '-'} kg</p></div>
              <div><p style={{ margin: 0, fontSize: '14px', color: '#aaa', textTransform: 'uppercase' }}>Gender</p><p style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>{data.gender || '-'}</p></div>
              <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#aaa', textTransform: 'uppercase' }}>Booking Contact</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '18px', fontWeight: 'bold' }}>hello@orlandmanagement.com</p>
              </div>
          </div>
      </div>

      {/* STICKY FOOTER */}
      <div className={`sticky-save-bar dark:bg-dark-card dark:border-t-slate-800 ${isDirty ? 'visible' : ''}`}>
        <div className="flex gap-2 w-full justify-end">
          <button onClick={discardDraft} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-full hover:bg-slate-200 transition">Batal</button>
          <button onClick={saveToCloud} disabled={isSaving} className="px-6 py-2 text-sm font-bold text-white bg-brand-600 rounded-full flex items-center">{isSaving ? 'Menyimpan...' : 'Simpan ke Server'}</button>
        </div>
      </div>
    </div>
  );
};
export default ProfileEditor;
