import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface ProfileProgress {
  percentage: number;
  completedSections: string[];
  missingSections: string[];
  isReady: boolean;
}

const DEFAULT_PROGRESS: ProfileProgress = {
  percentage: 0,
  completedSections: [],
  missingSections: ['Foto Utama', 'Data Diri', 'Fisik & Penampilan', 'Pengalaman'],
  isReady: false,
};

export function useProfileProgress(): ProfileProgress {
  const [progress, setProgress] = useState<ProfileProgress>(() => {
    // Cek cache lokal untuk avoid loading flash
    const cached = localStorage.getItem('orland-profile-progress-v2');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Cache valid hanya 5 menit
        if (Date.now() - parsed._cachedAt < 5 * 60 * 1000) return parsed;
      } catch {}
    }
    return DEFAULT_PROGRESS;
  });

  useEffect(() => {
    let cancelled = false;

    const fetchProgress = async () => {
      try {
        const response = await api.get('/talents/me');
        if (cancelled) return;

        const profile = response.data?.data;
        if (!profile) return;

        // Hitung completeness dari field profile
        const checks: Array<{ key: string; label: string; check: boolean }> = [
          { key: 'photo', label: 'Foto Utama', check: !!(profile.main_photo_url || profile.profile_photo) },
          { key: 'name', label: 'Nama Lengkap', check: !!(profile.full_name) },
          { key: 'phone', label: 'Nomor HP', check: !!(profile.phone) },
          { key: 'birth', label: 'Tanggal Lahir', check: !!(profile.date_of_birth) },
          { key: 'location', label: 'Kota Domisili', check: !!(profile.city) },
          { key: 'height', label: 'Tinggi Badan', check: !!(profile.height_cm) },
          { key: 'weight', label: 'Berat Badan', check: !!(profile.weight_kg) },
          { key: 'experience', label: 'Pengalaman', check: !!(profile.years_of_experience) },
          { key: 'bio', label: 'Bio / Tentang Saya', check: !!(profile.bio && profile.bio.length > 20) },
          { key: 'bank', label: 'Rekening Bank', check: !!(profile.bank_account_number) },
        ];

        const completed = checks.filter(c => c.check).map(c => c.label);
        const missing = checks.filter(c => !c.check).map(c => c.label);
        const percentage = Math.round((completed.length / checks.length) * 100);

        const result: ProfileProgress = {
          percentage,
          completedSections: completed,
          missingSections: missing,
          isReady: percentage >= 70,
        };

        setProgress(result);

        // Cache ke localStorage
        localStorage.setItem('orland-profile-progress-v2', JSON.stringify({
          ...result,
          _cachedAt: Date.now(),
        }));
      } catch (err) {
        // Fallback ke nilai dari localStorage jika ada, diam-diam
        const cached = localStorage.getItem('orland-profile-progress-v2');
        if (cached && !cancelled) {
          try { setProgress(JSON.parse(cached)); } catch {}
        }
      }
    };

    fetchProgress();
    return () => { cancelled = true; };
  }, []);

  return progress;
}
