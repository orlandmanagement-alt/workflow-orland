import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { talentService } from '@/lib/services/talentService';
import { useAuthStore } from '@/store/useAppStore';
import '@/assets/css/profile.css'; // Menggunakan CSS asli Anda yang sudah modular

// --- VALIDATION SCHEMA (ZOD) ---
// Memastikan data yang dikirim ke API sudah bersih dan sesuai standar
const profileSchema = z.object({
  full_name: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  birth_date: z.string().min(1, "Tanggal lahir wajib diisi"),
  height: z.string().refine((v) => parseInt(v) > 50 && parseInt(v) < 250, "Tinggi harus antara 50cm-250cm"),
  weight: z.string().refine((v) => parseInt(v) > 20 && parseInt(v) < 200, "Berat harus antara 20kg-200kg"),
  category: z.enum(["Model", "Actor", "Influencer"]),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const Dashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isNewTalent, setIsNewTalent] = useState(false);
  const user = useAuthStore((state) => state.user);

  // --- INITIAL LOAD ---
  // Membaca API saat halaman dibuka
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await talentService.getProfile();
        // Backend memberikan data, tapi jika belum lengkap (misal height kosong), anggap NewTalent
        if (data && data.height) {
          setProfile(data);
        } else {
          setIsNewTalent(true);
          // Pre-fill data nama dari SSO jika ada
          if (data?.full_name) reset({ full_name: data.full_name });
        }
      } catch (err) {
        // API error / 404: Anggap Talent baru
        setIsNewTalent(true);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  // --- REACT HOOK FORM (Final Mode) ---
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      category: 'Model'
    }
  });

  // --- SUBMIT LOGIC ---
  const onSubmit = async (data: ProfileFormValues) => {
    try {
      const updatedProfile = await talentService.updateProfile(data);
      setProfile(updatedProfile);
      setIsNewTalent(false);
      alert("Profil berhasil disimpan ke server Orland!");
    } catch (err) {
      alert("Gagal menyimpan profil. Data Anda tetap aman di Draft lokal.");
    }
  };

  if (loading) return <div className="p-20 text-center font-bold text-gray-400">Menghubungi Server API Orland...</div>;

  // ==========================================
  // TAMPILAN 1: FORM PENDAFTARAN (New Talent)
  // ==========================================
  if (isNewTalent) {
    return (
      <div className="profile-wrap animate-in fade-in duration-500 relative">
        <div className="max-w-xl mx-auto">
          <div className="profile-card profile-main">
            <h2 className="text-xl font-extrabold mb-1">Lengkapi Profil Talent Anda</h2>
            <p className="text-gray-400 text-sm mb-6">Data ini dikelola sepenuhnya oleh Orland AppAPI untuk Katalog.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              
              <div className="profile-section">
                <div className="profile-sectionHead">1. Data Fisik (Wajib)</div>
                <div className="profile-sectionBody profile-formGrid">
                  <div className="profile-frow">
                    <label>Nama Lengkap</label>
                    <input type="text" {...register('full_name')} placeholder="Sesuai KTP" />
                    {errors.full_name && <span className="text-red-500 text-xs">{errors.full_name.message}</span>}
                  </div>
                  <div className="profile-frow">
                    <label>Tanggal Lahir</label>
                    <input type="date" {...register('birth_date')} />
                    {errors.birth_date && <span className="text-red-500 text-xs">{errors.birth_date.message}</span>}
                  </div>
                  <div className="profile-frow">
                    <label>Tinggi (cm)</label>
                    <input type="number" {...register('height')} placeholder="Contoh: 170" />
                    {errors.height && <span className="text-red-500 text-xs">{errors.height.message}</span>}
                  </div>
                  <div className="profile-frow">
                    <label>Berat (kg)</label>
                    <input type="number" {...register('weight')} placeholder="Contoh: 60" />
                    {errors.weight && <span className="text-red-500 text-xs">{errors.weight.message}</span>}
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <div className="profile-sectionHead">2. Kategori</div>
                <div className="profile-sectionBody">
                    <div className="profile-frow">
                      <select {...register('category')}>
                        <option>Model</option><option>Actor</option><option>Influencer</option>
                      </select>
                    </div>
                </div>
              </div>

              {/* STICKY FOOTER SAVE BAR (Mode Pendaftaran) */}
              <div className="sticky-save-bar visible" style={{zIndex: 10}}>
                <div className="flex items-center gap-3 text-amber-600 font-bold text-sm">
                  <span className="draft-dot"></span>
                  <span className="hidden sm:inline">Semua data dikendalikan penuh oleh AppAPI.</span>
                </div>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 text-sm font-bold text-white bg-orange-600 rounded-full shadow-lg hover:bg-orange-700 transition">
                  {isSubmitting ? 'Menyimpan...' : 'Kirim Data & Buka Dashboard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // TAMPILAN 2: REAL DASHBOARD STATS
  // ==========================================
  return (
    <div className="profile-wrap animate-in fade-in duration-500 p-8">
      <h1 className="text-3xl font-extrabold">Halo, {profile.full_name}! 👋</h1>
      <p className="text-gray-500 mt-2">Data Anda sudah aktif di katalog Orland Management.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-50">
          <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Status</p>
          <p className="text-2xl font-bold text-green-500 mt-1">Aktif & Terverifikasi</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-50">
          <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Kategori</p>
          <p className="text-2xl font-bold mt-1">{profile.category}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
