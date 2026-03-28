import React, { useState } from 'react';
import { useProfileEditor } from '@/hooks/useProfileEditor';
import '@/assets/css/profile.css';

const ProfileEditor = () => {
  const { data, updateField, isDirty, isSaving, loading, saveToCloud, discardDraft } = useProfileEditor();
  const [activeTab, setActiveTab] = useState('info');

  if (loading) return <div className="p-10 text-center font-bold text-slate-500 dark:text-slate-400">Membaca Data Profil...</div>;

  return (
    <div className="profile-wrap animate-in fade-in duration-500 relative pb-20">
      <div className="profile-grid">
        
        {/* ================= LEFT SIDEBAR (FOTO) ================= */}
        <aside className="profile-card profile-side dark:bg-dark-card dark:border-slate-800">
          <h4 className="text-xs font-bold tracking-widest text-slate-600 dark:text-slate-400 mb-3">HEADSHOT</h4>
          <div className="profile-ph dark:bg-slate-800">
            <div 
              className="profile-avatar border dark:border-slate-700" 
              style={{ backgroundImage: data.profile_picture ? `url(${data.profile_picture})` : 'none' }}
              onClick={() => alert("Fitur Cropper & Upload R2 akan dipicu di sini.")}
            >
              {!data.profile_picture && <span className="absolute inset-0 flex items-center justify-center text-brand-500 font-bold hover:text-brand-600 cursor-pointer">Upload</span>}
            </div>
            <p className="text-xs text-center text-slate-400 mt-3">Min: 600x800 px</p>
          </div>
          <button className="profile-btn ghost w-full mt-4 dark:text-slate-300 dark:hover:bg-slate-800">⬇️ Download PDF Comp Card</button>
        </aside>

        {/* ================= MAIN CONTENT ================= */}
        <main className="profile-card profile-main dark:bg-dark-card dark:border-slate-800">
          
          <div className="profile-title mb-6">
            <h1 className="dark:text-white">{data.full_name || 'Talent Name'}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Orland Management Talent</p>
          </div>

          {/* TABS NAVIGATION */}
          <div className="profile-tabs border-b border-slate-200 dark:border-slate-800">
            {['info', 'photos', 'assets', 'credits'].map((tab) => (
              <div 
                key={tab} 
                className={`profile-tab dark:text-slate-400 ${activeTab === tab ? 'active dark:text-brand-400 dark:border-brand-400' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </div>
            ))}
          </div>

          {/* TAB CONTENT: INFO */}
          {activeTab === 'info' && (
            <div className="mt-6 space-y-6">
              <div className="profile-section">
                <div className="profile-sectionHead dark:text-slate-300">INFORMASI DASAR</div>
                <div className="profile-sectionBody profile-formGrid">
                  <div className="profile-frow">
                    <label className="dark:text-slate-400">Nama Lengkap</label>
                    <input type="text" value={data.full_name || ''} onChange={(e) => updateField('full_name', e.target.value)} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                  </div>
                  <div className="profile-frow">
                    <label className="dark:text-slate-400">Tanggal Lahir</label>
                    <input type="date" value={data.birth_date || ''} onChange={(e) => updateField('birth_date', e.target.value)} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                  </div>
                  <div className="profile-frow">
                    <label className="dark:text-slate-400">Jenis Kelamin</label>
                    <select value={data.gender || ''} onChange={(e) => updateField('gender', e.target.value)} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                      <option value="">Pilih...</option><option>Male</option><option>Female</option>
                    </select>
                  </div>
                  <div className="profile-frow">
                    <label className="dark:text-slate-400">Kategori Utama</label>
                    <select value={data.category || ''} onChange={(e) => updateField('category', e.target.value)} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                      <option value="">Pilih...</option><option>Model</option><option>Actor</option><option>Influencer</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <div className="profile-sectionHead dark:text-slate-300">PENAMPILAN FISIK</div>
                <div className="profile-sectionBody profile-formGrid">
                  <div className="profile-frow">
                    <label className="dark:text-slate-400">Tinggi (cm)</label>
                    <input type="number" value={data.height || ''} onChange={(e) => updateField('height', e.target.value)} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                  </div>
                  <div className="profile-frow">
                    <label className="dark:text-slate-400">Berat (kg)</label>
                    <input type="number" value={data.weight || ''} onChange={(e) => updateField('weight', e.target.value)} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: LAINNYA */}
          {activeTab !== 'info' && (
             <div className="p-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl mt-6 text-slate-500 dark:text-slate-400">
               Konten untuk tab <b className="dark:text-white">{activeTab}</b> akan dirender di sini menggunakan arsitektur React yang sama.
             </div>
          )}
        </main>
      </div>

      {/* ================= STICKY FOOTER (SAVE BAR) ================= */}
      <div className={`sticky-save-bar dark:bg-dark-card dark:border-t-slate-800 ${isDirty ? 'visible' : ''}`}>
        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-500 font-bold text-sm">
          <span className="draft-dot"></span>
          <span className="hidden sm:inline">Perubahan tersimpan otomatis di perangkat Anda (Offline Draft).</span>
          <span className="sm:hidden">Data di-Draft.</span>
        </div>
        <div className="flex gap-2">
          <button onClick={discardDraft} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition">
            Batal
          </button>
          <button onClick={saveToCloud} disabled={isSaving} className="px-6 py-2 text-sm font-bold text-white bg-brand-600 rounded-full shadow-lg shadow-brand-500/30 hover:bg-brand-700 transition flex items-center gap-2">
            {isSaving ? 'Menyimpan...' : 'Simpan ke Server Orland'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditor;
