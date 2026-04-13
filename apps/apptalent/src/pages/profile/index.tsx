// File: apps/apptalent/src/pages/profile/index.tsx
// Purpose: Complete talent profile form with wizard flow and modular tabs

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Share2, Save, AlertCircle, Loader, Check } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import ProfileBasicTab from '@/components/profile/ProfileBasicTab';
import ProfilePhysicalTab from '@/components/profile/ProfilePhysicalTab';
import ProfileSkillsTab from '@/components/profile/ProfileSkillsTab';
import ProfileMediaTab from '@/components/profile/ProfileMediaTab';
import ProfileDigitalAssetsTab from '@/components/profile/ProfileDigitalAssetsTab';
import ProfileExperienceTab from '@/components/profile/ProfileExperienceTab';
import ProfileRatesTab from '@/components/profile/ProfileRatesTab';

interface TabConfig {
  id: string;
  label: string;
  icon: string;
  description: string;
}

const TABS: TabConfig[] = [
  { id: 'basic', label: 'Info Dasar', icon: '👤', description: 'Nama, email, domisili, tanggal lahir' },
  { id: 'physical', label: 'Ciri Fisik', icon: '👕', description: 'Tinggi, berat, bentuk wajah, warna' },
  { id: 'skills', label: 'Keahlian', icon: '⚡', description: 'Skill, bahasa, proficiency level' },
  { id: 'media', label: 'Foto & Video', icon: '📸', description: 'Upload foto profile dan video' },
  { id: 'assets', label: 'Digital Assets', icon: '🎬', description: 'YouTube, Spotify, SoundCloud' },
  { id: 'experience', label: 'Pengalaman', icon: '💼', description: 'Riwayat kerja dan project' },
  { id: 'rates', label: 'Tarif & Project', icon: '💰', description: 'Skala tarif dan jenis project' },
];

interface ProfileData {
  talent_id?: string;
  full_name?: string;
  email?: string;
  domicile?: string;
  birth_date?: string;
  bio?: string;
  height_cm?: number;
  weight_kg?: number;
  face_type?: string;
  skin_tone?: string;
  hair_color?: string;
  eye_color?: string;
  shirt_size?: string;
  shoe_size?: string;
  skills?: any[];
  languages?: any[];
  photos?: any[];
  videos?: any[];
  digital_assets?: any[];
  experiences?: any[];
  rate_daily_min?: number;
  rate_daily_max?: number;
  preferred_job_types?: string[];
}

export default function ProfilePage() {
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const [profileData, setProfileData] = useState<ProfileData>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Fetch from /api/talents/me endpoint
    console.log('Loading profile data...');
  }, []);

  const handleFieldChange = (field: string, value: any) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setIsDirty(true);
    setSaveResult(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      // TODO: POST to /api/talents/me endpoint
      console.log('Saving profile data:', profileData);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSaveResult('success');
      setIsDirty(false);
      setTimeout(() => setSaveResult(null), 3000);
    } catch (error) {
      setSaveResult('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Gagal menyimpan data profile'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrevTab = () => {
    if (currentTabIndex > 0) {
      setCurrentTabIndex(currentTabIndex - 1);
    }
  };

  const handleNextTab = () => {
    if (currentTabIndex < TABS.length - 1) {
      setCurrentTabIndex(currentTabIndex + 1);
    }
  };

  const handleSkipTab = () => {
    if (currentTabIndex < TABS.length - 1) {
      setCurrentTabIndex(currentTabIndex + 2);
    }
  };

  const handleFinish = () => {
    if (currentTabIndex !== TABS.length - 1) {
      setCurrentTabIndex(TABS.length - 1);
    }
  };

  const currentTab = TABS[currentTabIndex];
  const isLastTab = currentTabIndex === TABS.length - 1;
  const isFirstTab = currentTabIndex === 0;
  const progressPercent = ((currentTabIndex + 1) / TABS.length) * 100;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 md:px-6 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
            Profil Talent
          </h1>
          <p className="text-slate-400">
            Lengkapi profil Anda untuk meningkatkan peluang mendapat job opportunities
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">Progress</span>
            <span className="text-xs font-bold text-slate-400">{progressPercent.toFixed(0)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Tab Navigator - Scrollable on Mobile */}
        <div className="mb-8 -mx-4 md:mx-0 overflow-x-auto md:overflow-visible">
          <div className="flex gap-2 px-4 md:px-0 md:grid md:grid-cols-4 md:gap-3">
            {TABS.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => setCurrentTabIndex(index)}
                className={`px-4 py-3 rounded-lg font-bold text-sm transition-all whitespace-nowrap flex-shrink-0 md:flex-shrink border ${
                  index === currentTabIndex
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-slate-800/20 rounded-2xl border border-slate-700 p-6 md:p-8 mb-8">
          {/* Tab Description */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {currentTab.icon} {currentTab.label}
            </h2>
            <p className="text-slate-400 text-sm">{currentTab.description}</p>
          </div>

          {/* Tab Content */}
          <div className="mb-8 min-h-96">
            {currentTab.id === 'basic' && (
              <ProfileBasicTab data={profileData} onChange={handleFieldChange} />
            )}
            {currentTab.id === 'physical' && (
              <ProfilePhysicalTab data={profileData} onChange={handleFieldChange} />
            )}
            {currentTab.id === 'skills' && (
              <ProfileSkillsTab data={profileData} onChange={handleFieldChange} />
            )}
            {currentTab.id === 'media' && (
              <ProfileMediaTab data={profileData} onChange={handleFieldChange} />
            )}
            {currentTab.id === 'assets' && (
              <ProfileDigitalAssetsTab data={profileData} onChange={handleFieldChange} />
            )}
            {currentTab.id === 'experience' && (
              <ProfileExperienceTab data={profileData} onChange={handleFieldChange} />
            )}
            {currentTab.id === 'rates' && (
              <ProfileRatesTab data={profileData} onChange={handleFieldChange} />
            )}
          </div>

          {/* Messages */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-3">
              <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{errorMessage}</p>
            </div>
          )}

          {saveResult === 'success' && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex gap-3">
              <Check size={20} className="text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-300">Profile berhasil disimpan!</p>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col md:flex-row gap-3 justify-between mb-8">
          <div className="flex gap-3 flex-1 md:flex-none">
            <button
              onClick={handlePrevTab}
              disabled={isFirstTab}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <ChevronLeft size={18} /> Sebelumnya
            </button>

            {!isLastTab && (
              <button
                onClick={handleSkipTab}
                className="px-4 py-3 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-lg font-bold transition-colors text-sm"
              >
                Skip
              </button>
            )}
          </div>

          {isLastTab ? (
            <button
              onClick={handleFinish}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
            >
              ✓ Selesai
            </button>
          ) : (
            <button
              onClick={handleNextTab}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
            >
              Selanjutnya <ChevronRight size={18} />
            </button>
          )}
        </div>

        {/* Sticky Save Button */}
        {isDirty && (
          <div className="fixed bottom-6 right-6 z-50">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full font-bold flex items-center gap-2 shadow-lg transition-all transform hover:scale-105"
            >
              {isSaving ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={18} /> Simpan Perubahan
                </>
              )}
            </button>
          </div>
        )}

        {/* Public Profile Link */}
        <div className="mt-12 pt-8 border-t border-slate-700">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-slate-800/30 rounded-xl border border-slate-700">
            <div>
              <h3 className="font-bold text-white mb-1">Profil Public Anda</h3>
              <p className="text-sm text-slate-400">
                Share link ini ke klien atau agency untuk showcase portfolio Anda
              </p>
            </div>
            <button
              onClick={() => {
                const talentId = profileData.talent_id || 'your-id';
                const publicUrl = `/p/${talentId}`;
                navigator.clipboard.writeText(
                  `${window.location.origin}${publicUrl}`
                );
                alert('Link copied to clipboard!');
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <Share2 size={18} /> Share Link
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}