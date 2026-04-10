// Enhanced Profile Page Component
// File: apps/apptalent/src/pages/profile/index.tsx
// Purpose: Complete talent profile form with comprehensive data capture for AI matching

import { useState, useEffect } from 'react';
import { Upload, Save, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

// Type Definitions
interface TalentProfile {
  id?: string;
  // Demographics
  age: number;
  gender: 'male' | 'female' | 'non-binary' | 'other';
  domicile: string;
  phone?: string;
  email?: string;
  bio?: string;

  // Physical Attributes
  height_cm: number;
  weight_kg: number;
  skin_tone: 'fair' | 'light' | 'medium' | 'olive' | 'tan' | 'deep' | 'other';
  hair_color: 'black' | 'brown' | 'blonde' | 'red' | 'gray' | 'other';
  eye_color?: string;
  face_type: 'oval' | 'round' | 'square' | 'heart' | 'oblong' | 'diamond' | 'pan-asian' | 'caucasian' | 'local' | 'other';

  // Measurements
  chest_cm?: number;
  waist_cm?: number;
  hip_cm?: number;
  shoe_size?: string;
  shirt_size?: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL';

  // Skills & Languages
  skills_json: string[];
  languages_json: string[];

  // Media
  comp_card_url?: string;
  headshot_url?: string;
  full_body_url?: string;
  showreel_url?: string;
  portfolio_photos?: string[];

  // Rates
  rate_daily_min?: number;
  rate_daily_max?: number;
  rate_project_min?: number;
  rate_project_max?: number;
  rate_hourly?: number;

  // Availability
  is_available: boolean;
  availability_note?: string;
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
  { id: 'web_series', label: 'Web Series' },
  { id: 'documentary', label: 'Documentary' },
];

export default function ProfilePage() {
  const [tab, setTab] = useState<'basic' | 'physical' | 'skills' | 'media' | 'rates' | 'availability'>('basic');
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
  });
  const [loading, setLoading] = useState(false);

  // Fetch existing profile
  const { data: existingProfile } = useQuery({
    queryKey: ['talent-profile'],
    queryFn: async () => {
      const response = await fetch('/api/profile/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      return response.json();
    },
  });

  // Initialize profile data when fetched
  useEffect(() => {
    if (existingProfile?.data) {
      setProfile(existingProfile.data);
    }
  }, [existingProfile]);

  // Mutation: Save profile
  const saveProfileMutation = useMutation({
    mutationFn: async (data: TalentProfile) => {
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          ...data,
          skills_json: data.skills_json,
          languages_json: data.languages_json,
          preferred_project_types: data.preferred_project_types,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Gagal menyimpan profil');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('✓ Profil berhasil disimpan!');
    },
    onError: (error: any) => {
      toast.error(`✗ ${error.message}`);
    },
  });

  const handleSave = async () => {
    // Validate minimum required fields
    if (!profile.age || profile.age < 16) {
      toast.error('Usia minimal 16 tahun');
      return;
    }
    if (!profile.domicile) {
      toast.error('Domisili wajib diisi');
      return;
    }
    if (!profile.height_cm) {
      toast.error('Tinggi badan wajib diisi');
      return;
    }
    if (profile.skills_json.length === 0) {
      toast.error('Pilih minimal 1 keahlian');
      return;
    }

    saveProfileMutation.mutate(profile);
  };

  const toggleSkill = (skillId: string) => {
    setProfile((prev) => ({
      ...prev,
      skills_json: prev.skills_json.includes(skillId)
        ? prev.skills_json.filter((s) => s !== skillId)
        : [...prev.skills_json, skillId],
    }));
  };

  const toggleLanguage = (langId: string) => {
    setProfile((prev) => ({
      ...prev,
      languages_json: prev.languages_json.includes(langId)
        ? prev.languages_json.filter((l) => l !== langId)
        : [...prev.languages_json, langId],
    }));
  };

  const toggleProjectType = (typeId: string) => {
    setProfile((prev) => {
      const types = prev.preferred_project_types || [];
      return {
        ...prev,
        preferred_project_types: types.includes(typeId)
          ? types.filter((t) => t !== typeId)
          : [...types, typeId],
      };
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Profil Talent</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Lengkapi profil Anda untuk mendapatkan rekomendasi casting yang akurat dari AI
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
            Profil Lengkap
          </div>
          <div className="w-32 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all"
              style={{ width: `${profile.profile_completion_percent || 0}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">{Math.round(profile.profile_completion_percent || 0)}% Selesai</p>
        </div>
      </div>

      {/* Alerts */}
      {profile.profile_completion_percent && profile.profile_completion_percent < 70 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-4 rounded-2xl flex gap-3">
          <AlertCircle size={20} className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            Profil Anda belum 70% lengkap. Lengkapi lebih banyak data untuk mendapatkan rekomendasi terbaik dari AI.
          </div>
        </div>
      )}

      {profile.profile_completion_percent && profile.profile_completion_percent >= 90 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 p-4 rounded-2xl flex gap-3">
          <CheckCircle size={20} className="text-green-600 dark:text-green-500 shrink-0 mt-0.5" />
          <div className="text-sm text-green-800 dark:text-green-200">
            Profil Anda sudah sangat lengkap! Anda akan mendapatkan rekomendasi casting terbaik.
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-0">
        {[
          { id: 'basic', label: '📋 Data Dasar' },
          { id: 'physical', label: '📐 Atribut Fisik' },
          { id: 'skills', label: '⭐ Keahlian' },
          { id: 'media', label: '📸 Media' },
          { id: 'rates', label: '💰 Rate Card' },
          { id: 'availability', label: '📅 Availability' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-4 py-3 font-semibold text-sm border-b-2 transition-all whitespace-nowrap ${
              tab === t.id
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-dark-card p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
        {/* TAB 1: DATA DASAR */}
        {tab === 'basic' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <input
                type="number"
                placeholder="Usia"
                value={profile.age || ''}
                onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
              />
              <select
                value={profile.gender}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value as any })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
              >
                <option value="male">Laki-laki</option>
                <option value="female">Perempuan</option>
                <option value="non-binary">Non-binary</option>
              </select>
            </div>

            <input
              type="text"
              placeholder="Domisili (e.g., Jakarta, Indonesia)"
              value={profile.domicile}
              onChange={(e) => setProfile({ ...profile, domicile: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
            />

            <textarea
              placeholder="Biodata singkat (opsional)"
              value={profile.bio || ''}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm resize-none"
            />
          </div>
        )}

        {/* TAB 2: ATRIBUT FISIK */}
        {tab === 'physical' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 block">
                  Tinggi Badan (cm)
                </label>
                <input
                  type="number"
                  value={profile.height_cm || ''}
                  onChange={(e) => setProfile({ ...profile, height_cm: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 block">
                  Berat Badan (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={profile.weight_kg || ''}
                  onChange={(e) => setProfile({ ...profile, weight_kg: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <select
                value={profile.skin_tone}
                onChange={(e) => setProfile({ ...profile, skin_tone: e.target.value as any })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
              >
                <option value="fair">Warna Kulit: Fair</option>
                <option value="light">Light</option>
                <option value="medium">Medium</option>
                <option value="olive">Olive</option>
                <option value="tan">Tan</option>
                <option value="deep">Deep</option>
              </select>

              <select
                value={profile.hair_color}
                onChange={(e) => setProfile({ ...profile, hair_color: e.target.value as any })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
              >
                <option value="black">Rambut: Hitam</option>
                <option value="brown">Coklat</option>
                <option value="blonde">Blonde</option>
                <option value="red">Merah</option>
              </select>

              <select
                value={profile.face_type}
                onChange={(e) => setProfile({ ...profile, face_type: e.target.value as any })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
              >
                <option value="oval">Tipe Wajah: Oval</option>
                <option value="round">Bulat</option>
                <option value="square">Kotak</option>
                <option value="heart">Hati</option>
                <option value="pan-asian">Pan-Asian</option>
                <option value="caucasian">Caucasian</option>
              </select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <input
                type="number"
                placeholder="Dada (cm)"
                value={profile.chest_cm || ''}
                onChange={(e) => setProfile({ ...profile, chest_cm: parseInt(e.target.value) })}
                className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
              />
              <input
                type="number"
                placeholder="Pinggang (cm)"
                value={profile.waist_cm || ''}
                onChange={(e) => setProfile({ ...profile, waist_cm: parseInt(e.target.value) })}
                className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
              />
              <input
                type="number"
                placeholder="Pinggul (cm)"
                value={profile.hip_cm || ''}
                onChange={(e) => setProfile({ ...profile, hip_cm: parseInt(e.target.value) })}
                className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
              />
              <select
                value={profile.shirt_size || ''}
                onChange={(e) => setProfile({ ...profile, shirt_size: e.target.value as any })}
                className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
              >
                <option value="">Ukuran Baju</option>
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
              </select>
            </div>
          </div>
        )}

        {/* TAB 3: KEAHLIAN */}
        {tab === 'skills' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3">Keahlian Utama</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SKILL_OPTIONS.map((skill) => (
                  <button
                    key={skill.id}
                    onClick={() => toggleSkill(skill.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      profile.skills_json.includes(skill.id)
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <span className="text-xl mr-2">{skill.icon}</span>
                    <span className="font-semibold text-sm text-slate-900 dark:text-white">
                      {skill.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3">Bahasa yang Dikuasai</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => toggleLanguage(lang.id)}
                    className={`p-3 rounded-lg border-2 transition-all text-sm font-semibold ${
                      profile.languages_json.includes(lang.id)
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {lang.label} {profile.languages_json.includes(lang.id) ? '✓' : ''}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MEDIA */}
        {tab === 'media' && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-900 dark:text-white mb-3">
                Comp Card
              </label>
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center hover:border-brand-400 transition-colors">
                <Upload size={32} className="mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Drag or click to upload comp card
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['headshot', 'full_body', 'showreel'].map((type) => (
                <div key={type}>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase">
                    {type === 'headshot' ? 'Headshot' : type === 'full_body' ? 'Full Body' : 'Showreel'}
                  </label>
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-4 text-center">
                    <p className="text-xs text-slate-500">Upload {type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: RATE CARD */}
        {tab === 'rates' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <input
                type="number"
                placeholder="Rate Harian Minimum (Rp)"
                value={profile.rate_daily_min || ''}
                onChange={(e) => setProfile({ ...profile, rate_daily_min: parseFloat(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
              />
              <input
                type="number"
                placeholder="Rate Harian Maksimum (Rp)"
                value={profile.rate_daily_max || ''}
                onChange={(e) => setProfile({ ...profile, rate_daily_max: parseFloat(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              💡 Tip: Masukkan range rate untuk fleksibilitas negosiasi dengan klien
            </p>
          </div>
        )}

        {/* TAB 6: AVAILABILITY */}
        {tab === 'availability' && (
          <div className="space-y-5">
            <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50">
              <input
                type="checkbox"
                checked={profile.is_available}
                onChange={(e) => setProfile({ ...profile, is_available: e.target.checked })}
                className="w-5 h-5 rounded accent-brand-500"
              />
              <span className="font-semibold text-slate-900 dark:text-white">Saat ini tersedia untuk booking</span>
            </label>

            <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50">
              <input
                type="checkbox"
                checked={profile.location_willing_to_travel}
                onChange={(e) => setProfile({ ...profile, location_willing_to_travel: e.target.checked })}
                className="w-5 h-5 rounded accent-brand-500"
              />
              <span className="font-semibold text-slate-900 dark:text-white">Siap untuk travel ke lokasi syuting lain</span>
            </label>

            {profile.location_willing_to_travel && (
              <input
                type="number"
                placeholder="Maksimal jam perjalanan dari domisili"
                value={profile.max_travel_hours || 8}
                onChange={(e) => setProfile({ ...profile, max_travel_hours: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
              />
            )}

            <div>
              <label className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2 block">
                Tipe Proyek yang Diminati
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {PROJECT_TYPE_OPTIONS.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => toggleProjectType(type.id)}
                    className={`p-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                      (profile.preferred_project_types || []).includes(type.id)
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
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

      {/* Save Button */}
      <div className="sticky bottom-4 left-0 right-0 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saveProfileMutation.isPending}
          className="px-8 py-3.5 bg-gradient-to-r from-brand-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-brand-500/30 hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {saveProfileMutation.isPending ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Menyimpan...
            </>
          ) : (
            <>
              <Save size={18} /> Simpan Profil
            </>
          )}
        </button>
      </div>
    </div>
  );
}
