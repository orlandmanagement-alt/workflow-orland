import React, { useState } from 'react';
import { useProfileEditor } from '@/hooks/useProfileEditor';
import '@/assets/css/profile.css';

const ProfileEditor = () => {
  const { data, updateField, isDirty, isSaving, loading, saveToCloud, discardDraft } = useProfileEditor();
  const [activeTab, setActiveTab] = useState('info');

  if (loading) return <div className="p-10 text-center font-bold text-gray-500">Membaca Data Profil...</div>;

  return (
    <div className="profile-wrap animate-in fade-in duration-500 relative">
      <div className="profile-grid">
        
        {/* ================= LEFT SIDEBAR (FOTO) ================= */}
        <aside className="profile-card profile-side">
          <h4 className="text-xs font-bold tracking-widest text-gray-600 mb-3">HEADSHOT</h4>
          <div className="profile-ph">
            <div 
              className="profile-avatar" 
              style={{ backgroundImage: data.profile_picture ? `url(${data.profile_picture})` : 'none' }}
              onClick={() => alert("Fitur Cropper & Upload R2 akan dipicu di sini.")}
            >
              {!data.profile_picture && <span className="absolute inset-0 flex items-center justify-center text-blue-500 font-bold">Upload</span>}
            </div>
            <p className="text-xs text-center text-gray-400 mt-2">Min: 600x800 px</p>
          </div>
          <button className="profile-btn ghost w-full mt-4">⬇️ Download PDF Comp Card</button>
        </aside>

        {/* ================= MAIN CONTENT ================= */}
        <main className="profile-card profile-main">
          
          <div className="profile-title mb-6">
            <h1>{data.full_name || 'Talent Name'}</h1>
            <p className="text-sm text-gray-500 mt-1">Orland Management Talent</p>
          </div>

          {/* TABS NAVIGATION */}
          <div className="profile-tabs">
            {['info', 'photos', 'assets', 'credits'].map((tab) => (
              <div 
                key={tab} 
                className={`profile-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </div>
            ))}
          </div>

          {/* TAB CONTENT: INFO */}
          {activeTab === 'info' && (
            <div className="mt-4 space-y-4">
              
              <div className="profile-section">
                <div className="profile-sectionHead">INFORMASI DASAR</div>
                <div className="profile-sectionBody profile-formGrid">
                  <div className="profile-frow">
                    <label>Nama Lengkap</label>
                    <input type="text" value={data.full_name || ''} onChange={(e) => updateField('full_name', e.target.value)} />
                  </div>
                  <div className="profile-frow">
                    <label>Tanggal Lahir</label>
                    <input type="date" value={data.birth_date || ''} onChange={(e) => updateField('birth_date', e.target.value)} />
                  </div>
                  <div className="profile-frow">
                    <label>Jenis Kelamin</label>
                    <select value={data.gender || ''} onChange={(e) => updateField('gender', e.target.value)}>
                      <option value="">Pilih...</option><option>Male</option><option>Female</option>
                    </select>
                  </div>
                  <div className="profile-frow">
                    <label>Kategori Utama</label>
                    <select value={data.category || ''} onChange={(e) => updateField('category', e.target.value)}>
                      <option value="">Pilih...</option><option>Model</option><option>Actor</option><option>Influencer</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <div className="profile-sectionHead">PENAMPILAN FISIK</div>
                <div className="profile-sectionBody profile-formGrid">
                  <div className="profile-frow">
                    <label>Tinggi (cm)</label>
                    <input type="number" value={data.height || ''} onChange={(e) => updateField('height', e.target.value)} />
                  </div>
                  <div className="profile-frow">
                    <label>Berat (kg)</label>
                    <input type="number" value={data.weight || ''} onChange={(e) => updateField('weight', e.target.value)} />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB CONTENT: LAINNYA (Placeholder untuk menjaga struktur ringkas) */}
          {activeTab !== 'info' && (
             <div className="p-10 text-center border-2 border-dashed border-gray-200 rounded-xl mt-6 text-gray-500">
               Konten untuk tab <b>{activeTab}</b> akan dirender di sini menggunakan arsitektur React yang sama.
             </div>
          )}

        </main>
      </div>

      {/* ================= STICKY FOOTER (SAVE BAR) ================= */}
      {/* Footer ini akan melayang di bawah dan hanya muncul jika ada data yang diubah (isDirty = true) */}
      <div className={`sticky-save-bar ${isDirty ? 'visible' : ''}`}>
        <div className="flex items-center gap-3 text-amber-600 font-bold text-sm">
          <span className="draft-dot"></span>
          <span className="hidden sm:inline">Perubahan tersimpan otomatis di perangkat Anda (Offline Draft).</span>
          <span className="sm:hidden">Data di-Draft.</span>
        </div>
        <div className="flex gap-2">
          <button onClick={discardDraft} className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition">
            Batal
          </button>
          <button onClick={saveToCloud} disabled={isSaving} className="px-6 py-2 text-sm font-bold text-white bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 transition flex items-center gap-2">
            {isSaving ? 'Menyimpan...' : 'Simpan ke Server Orland'}
          </button>
        </div>
      </div>

    </div>
  );
};

export default ProfileEditor;
