// File: apps/apptalent/src/pages/profile/index.tsx
// Purpose: Complete talent profile form with comprehensive data capture for AI matching

import { useState, useEffect } from 'react';
import { Upload, Save, AlertCircle, CheckCircle, Loader2, Link as LinkIcon, Share2, Camera } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

// Type Definitions (Sesuai Skema Database Baru)
interface TalentProfile {
  id?: string;
  talent_id?: string;
  full_name?: string;
  age: number;
  gender: 'male' | 'female' | 'non-binary' | 'other';
  domicile: string;
  phone?: string;
  email?: string;
  bio?: string;
  height_cm: number;
  weight_kg: number;
  skin_tone: string;
  hair_color: string;
  eye_color?: string;
  face_type: string;
  chest_cm?: number;
  waist_cm?: number;
  hip_cm?: number;
  shoe_size?: string;
  shirt_size?: string;
  skills_json: string[];
  languages_json: string[];
  comp_card_url?: string;
  headshot_url?: string;
  full_body_url?: string;
  showreel_url?: string;
  portfolio_photos?: string[];
  rate_daily_min?: number;
  rate_daily_max?: number;
  is_available: boolean;
  preferred_project_types?: string[];
  location_willing_to_travel: boolean;
  max_travel_hours?: number;
  profile_completion_percent?: number;
}

const SKILL_OPTIONS = [
  { id: 'actor', label: 'Aktor/Aktris', icon: '🎬' },
  { id: 'model_catwalk', label: 'Model (Catwalk)', icon: '👗' },
  { id: 'model_commercial', label: 'Model (Commercial)', icon: '📸' },
  { id: 'mc', label: 'Master of Ceremony', icon: '🎤' },
  { id: 'dancer', label: 'Penari', icon: '💃' },
  { id: 'singer', label: 'Penyanyi', icon: '🎵' },
  { id: 'presenter', label: 'Presenter', icon: '📺' },
];

const LANGUAGE_OPTIONS = [
  { id: 'indonesian', label: 'Bahasa Indonesia' },
  { id: 'english', label: 'English' },
  { id: 'mandarin', label: '普通话 (Mandarin)' },
  { id: 'japanese', label: '日本語 (Japanese)' },
  { id: 'korean', label: '한국어 (Korean)' },
  { id: 'spanish', label: 'Español' },
];

const PROJECT_TYPE_OPTIONS = [
  { id: 'film', label: 'Film' },
  { id: 'commercial', label: 'TVC/Commercial' },
  { id: 'music_video', label: 'Music Video' },
  { id: 'photography', label: 'Photography' },
  { id: 'fashion_show', label: 'Fashion Show' },
  { id: 'event', label: 'Event/Activation' },
];

export default function ProfilePage() {
  const [tab, setTab] = useState<'basic' | 'physical' | 'skills' | 'media' | 'rates' | 'availability'>('basic');
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
  
  const [profile, setProfile] = useState<TalentProfile>({
    age: 0,
    gender: 'male',
    domicile: '',
    height_cm: 0,
    weight_kg: 0,
    skin_tone: 'medium',
    hair_color: 'black',
    face_type: 'oval',
    skills_json: [],
    languages_json: ['indonesian'],
    is_available: true,
    location_willing_to_travel: false,
    max_travel_hours: 8,
    profile_completion_percent: 20
  });

  // Mengambil data profil dari API
  const { data: existingProfile, isLoading } = useQuery({
    queryKey: ['talent-profile'],
    queryFn: async () => {
      const response = await fetch('/api/profile/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      if (!response.ok) throw new Error('Gagal mengambil data profil');
      return response.json();
    },
  });

  useEffect(() => {
    if (existingProfile?.data) {
      setProfile(existingProfile.data);
    }
  }, [existingProfile]);

  // Mutasi untuk Menyimpan Profil
  const saveProfileMutation = useMutation({
    mutationFn: async (data: TalentProfile) => {
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Gagal menyimpan profil');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast.success('✓ Profil berhasil disimpan!');
      if(data.data) setProfile(data.data);
    },
    onError: (error: any) => {
      toast.error(`✗ ${error.message}`);
    },
  });

  const handleSave = () => {
    if (!profile.age || profile.age < 16) { toast.error('Usia minimal 16 tahun'); return; }
    if (!profile.domicile) { toast.error('Domisili wajib diisi'); return; }
    if (!profile.height_cm) { toast.error('Tinggi badan wajib diisi'); return; }
    saveProfileMutation.mutate(profile);
  };

  const toggleArrayItem = (field: 'skills_json' | 'languages_json' | 'preferred_project_types', id: string) => {
    setProfile(prev => {
      const currentArray = prev[field] || [];
      return {
        ...prev,
        [field]: currentArray.includes(id) ? currentArray.filter(i => i !== id) : [...currentArray, id]
      };
    });
  };

  const copyPublicLink = () => {
    const url = `${window.location.origin}/p/${profile.talent_id || 'preview'}`;
    navigator.clipboard.writeText(url);
    toast.success('Tautan profil publik disalin!');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-brand-600 mb-4" size={48} />
        <p className="text-slate-500 font-bold animate-pulse text-lg">Memuat Profil Anda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-5xl mx-auto">
      
      {/* Profil Header & Action */}
      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Profil Talent</h1>
          <div className="flex items-center gap-3">
             <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-md">ID: #{profile.talent_id || 'NEW'}</span>
             <button onClick={copyPublicLink} className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center transition-colors">
                 Lihat Profil Publik <Share2 size={12} className="ml-1.5" />
             </button>
          </div>
        </div>

        <div className="mt-6 md:mt-0 text-left md:text-right w-full md:w-auto">
          <div className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Kelengkapan Profil</div>
          <div className="w-full md:w-48 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all"
              style={{ width: `${profile.profile_completion_percent || 0}%` }}
            />
          </div>
          <p className="text-xs font-bold text-brand-600 mt-1.5">{Math.round(profile.profile_completion_percent || 0)}% Selesai</p>
        </div>
      </div>

      {/* Alerts */}
      {profile.profile_completion_percent && profile.profile_completion_percent < 70 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-4 rounded-2xl flex gap-3 shadow-sm">
          <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Profil Anda belum mencapai 70%. Lengkapi lebih banyak data untuk mendapatkan rekomendasi proyek terbaik dari AI.
          </div>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'basic', label: '📋 Data Dasar' },
          { id: 'physical', label: '📐 Atribut Fisik' },
          { id: 'skills', label: '⭐ Keahlian' },
          { id: 'media', label: '📸 Media & Comp Card' },
          { id: 'rates', label: '💰 Rate Card' },
          { id: 'availability', label: '📅 Availability' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-5 py-3 font-bold text-sm rounded-xl transition-all whitespace-nowrap ${
              tab === t.id
                ? 'bg-brand-600 text-white shadow-md'
                : 'bg-white dark:bg-dark-card text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-brand-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content Box */}
      <div className="bg-white dark:bg-dark-card p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[400px]">
        
        {/* TAB 1: DATA DASAR */}
        {tab === 'basic' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Informasi Pribadi</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Usia</label>
                <input type="number" placeholder="Contoh: 24" value={profile.age || ''} onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Gender</label>
                <select value={profile.gender} onChange={(e) => setProfile({ ...profile, gender: e.target.value as any })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold">
                  <option value="male">Laki-laki</option>
                  <option value="female">Perempuan</option>
                  <option value="non-binary">Non-binary</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Domisili</label>
              <input type="text" placeholder="Contoh: Jakarta Selatan, Indonesia" value={profile.domicile} onChange={(e) => setProfile({ ...profile, domicile: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold" />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Bio Singkat (Tentang Anda)</label>
              <textarea placeholder="Ceritakan pengalaman dan passion Anda..." value={profile.bio || ''} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={4} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium resize-none" />
            </div>
          </div>
        )}
		
        {/* TAB 2: ATRIBUT FISIK */}
        {tab === 'physical' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2">
             <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Dimensi & Karakteristik</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Tinggi (cm)</label>
                <input type="number" value={profile.height_cm || ''} onChange={(e) => setProfile({ ...profile, height_cm: parseInt(e.target.value) })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Berat (kg)</label>
                <input type="number" step="0.1" value={profile.weight_kg || ''} onChange={(e) => setProfile({ ...profile, weight_kg: parseFloat(e.target.value) })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Warna Kulit</label>
                <select value={profile.skin_tone} onChange={(e) => setProfile({ ...profile, skin_tone: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm font-bold">
                  <option value="fair">Fair</option><option value="light">Light</option><option value="medium">Medium</option><option value="olive">Olive</option><option value="tan">Tan</option><option value="deep">Deep</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Tipe Wajah</label>
                <select value={profile.face_type} onChange={(e) => setProfile({ ...profile, face_type: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm font-bold">
                  <option value="oval">Oval</option><option value="round">Bulat</option><option value="square">Kotak</option><option value="pan-asian">Pan-Asian</option><option value="caucasian">Caucasian</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Dada/Bust (cm)</label>
                <input type="number" value={profile.chest_cm || ''} onChange={(e) => setProfile({ ...profile, chest_cm: parseInt(e.target.value) })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm font-bold" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Pinggang (cm)</label>
                <input type="number" value={profile.waist_cm || ''} onChange={(e) => setProfile({ ...profile, waist_cm: parseInt(e.target.value) })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm font-bold" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Pinggul (cm)</label>
                <input type="number" value={profile.hip_cm || ''} onChange={(e) => setProfile({ ...profile, hip_cm: parseInt(e.target.value) })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm font-bold" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Ukuran Baju</label>
                <select value={profile.shirt_size || ''} onChange={(e) => setProfile({ ...profile, shirt_size: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm font-bold">
                  <option value="">Pilih</option><option value="XS">XS</option><option value="S">S</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option>
                </select>
              </div>
            </div>
          </div>
        )}
		
		{/* TAB 3: MEDIA (COMP CARD) */}
        {tab === 'media' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2">
            <div className="bg-brand-50 dark:bg-brand-900/10 border border-brand-200 dark:border-brand-800 p-5 rounded-2xl">
                <h3 className="font-black text-brand-800 dark:text-brand-300 mb-1">Unggah Comp Card Resmi</h3>
                <p className="text-sm text-brand-600/80 dark:text-brand-400/80 mb-4">Format PDF atau Image (Maks 5MB). Comp Card ini akan langsung dikirim ke klien saat Anda melamar proyek.</p>
                <div className="border-2 border-dashed border-brand-300 dark:border-brand-700/50 bg-white dark:bg-slate-900 rounded-xl p-8 text-center cursor-pointer hover:bg-brand-50 transition-colors">
                  <Upload size={32} className="mx-auto text-brand-400 mb-3" />
                  <span className="font-bold text-brand-600">Klik untuk mengunggah file</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {['headshot_url', 'full_body_url', 'showreel_url'].map((type) => (
                <div key={type}>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                    {type.split('_')[0]} Image
                  </label>
                  <div className="aspect-[4/5] bg-slate-100 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-brand-300 hover:text-brand-500 cursor-pointer transition-colors">
                     <Camera size={32} className="mb-2 opacity-50" />
                     <span className="text-xs font-bold">Upload Foto</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
		
        {/* TAB 4: KEAHLIAN */}
        {tab === 'skills' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-2">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider text-sm">Keahlian Utama</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {SKILL_OPTIONS.map((skill) => (
                  <button
                    key={skill.id}
                    onClick={() => toggleArrayItem('skills_json', skill.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-center flex flex-col items-center justify-center gap-2 ${
                      profile.skills_json.includes(skill.id)
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <span className="text-2xl">{skill.icon}</span>
                    <span className="font-bold text-xs">{skill.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider text-sm">Bahasa yang Dikuasai</h3>
              <div className="flex flex-wrap gap-3">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => toggleArrayItem('languages_json', lang.id)}
                    className={`px-4 py-2 rounded-full border-2 transition-all text-sm font-bold ${
                      profile.languages_json.includes(lang.id)
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400'
                        : 'border-slate-200 dark:border-slate-700 bg-white text-slate-600'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        

        {/* TAB 5: RATE CARD */}
        {tab === 'rates' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Ekspektasi Bayaran (IDR)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Harian Minimum</label>
                <input type="number" placeholder="Contoh: 1500000" value={profile.rate_daily_min || ''} onChange={(e) => setProfile({ ...profile, rate_daily_min: parseFloat(e.target.value) })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm font-bold focus:border-brand-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Harian Maksimum</label>
                <input type="number" placeholder="Contoh: 5000000" value={profile.rate_daily_max || ''} onChange={(e) => setProfile({ ...profile, rate_daily_max: parseFloat(e.target.value) })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm font-bold focus:border-brand-500" />
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl text-xs font-medium text-slate-500">
              💡 Rate Card Anda akan dijaga kerahasiaannya dan hanya digunakan oleh AI untuk mencocokkan Anda dengan budget proyek.
            </div>
          </div>
        )}

        {/* TAB 6: AVAILABILITY */}
        {tab === 'availability' && (
          <div className="space-y-5 animate-in slide-in-from-bottom-2">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Status & Kesiapan</h3>
            
            <label className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:border-brand-300 transition-colors">
              <input type="checkbox" checked={profile.is_available} onChange={(e) => setProfile({ ...profile, is_available: e.target.checked })} className="w-6 h-6 rounded accent-brand-600" />
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Siap Menerima Tawaran Pekerjaan</span>
                <span className="text-xs text-slate-500 font-medium">Klien akan melihat status Anda sebagai "Available".</span>
              </div>
            </label>

            <label className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:border-brand-300 transition-colors">
              <input type="checkbox" checked={profile.location_willing_to_travel} onChange={(e) => setProfile({ ...profile, location_willing_to_travel: e.target.checked })} className="w-6 h-6 rounded accent-brand-600" />
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Bersedia Travel Luar Kota</span>
                <span className="text-xs text-slate-500 font-medium">Buka kesempatan untuk proyek di lokasi yang jauh.</span>
              </div>
            </label>

            <div className="pt-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Jenis Proyek yang Diminati</label>
              <div className="flex flex-wrap gap-2">
                {PROJECT_TYPE_OPTIONS.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => toggleArrayItem('preferred_project_types', type.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      (profile.preferred_project_types || []).includes(type.id)
                        ? 'bg-brand-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={handleSave}
          disabled={saveProfileMutation.isPending}
          className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500 text-white font-black rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.3)] transition-all disabled:opacity-50"
        >
          {saveProfileMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saveProfileMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>

    </div>
  );
}