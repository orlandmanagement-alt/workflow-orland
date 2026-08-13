import { useState, useEffect, useCallback } from 'react';
import { talentService } from '@/lib/services/talentService';

const DRAFT_KEY = 'orland_talent_profile_draft';

export const useProfileEditor = () => {
  const [data, setData] = useState<any>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Inisialisasi Data (API -> Draft Fallback)
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const apiData = await talentService.getProfile();
        const draftData = localStorage.getItem(DRAFT_KEY);
        
        if (draftData) {
          // Jika ada draft yang belum disave ke cloud
          setData(JSON.parse(draftData));
          setIsDirty(true);
        } else if (apiData) {
          setData(apiData);
        }
      } catch (err) {
        // Mode Offline / API Error: Baca draft
        const draftData = localStorage.getItem(DRAFT_KEY);
        if (draftData) setData(JSON.parse(draftData));
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  // 2. Fungsi Update Field (Simpan otomatis ke LocalStorage)
  const updateField = useCallback((field: string, value: any) => {
    setData((prev: any) => {
      const newData = { ...prev, [field]: value };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(newData));
      setIsDirty(true);
      return newData;
    });
  }, []);

  // 3. Fungsi Save ke Cloud (API)
  const saveToCloud = async () => {
    setIsSaving(true);
    try {
      await talentService.updateProfile(data);
      localStorage.removeItem(DRAFT_KEY);
      setIsDirty(false);
      alert('Profil berhasil disimpan ke Cloud Orland!');
    } catch (err) {
      alert('Gagal menyimpan. Jangan khawatir, data tetap aman di Draft lokal Anda.');
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Buang Draft
  const discardDraft = () => {
    if (confirm('Yakin ingin membatalkan semua perubahan yang belum disimpan?')) {
      localStorage.removeItem(DRAFT_KEY);
      window.location.reload();
    }
  };

  return { data, updateField, isDirty, isSaving, loading, saveToCloud, discardDraft };
};
