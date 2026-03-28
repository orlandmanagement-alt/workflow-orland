import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { talentService } from '@/lib/services/talentService';
import { useAuthStore } from '@/store/useAppStore';
import '@/assets/css/profile.css';

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

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await talentService.getProfile();
        if (data && data.height) {
          setProfile(data);
        } else {
          setIsNewTalent(true);
        }
      } catch (err) {
        setIsNewTalent(true);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { category: 'Model' }
  });

  // Pre-fill data jika dari SSO sudah ada nama
  useEffect(() => {
      if (isNewTalent && user?.full_name) {
          reset({ full_name: user.full_name });
      }
  }, [isNewTalent, user, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      const updatedProfile = await talentService.updateProfile(data);
      setProfile(updatedProfile);
      setIsNewTalent(false);
      alert("Profil berhasil disimpan ke server Orland!");
    } catch (err) {
      alert("Gagal menyimpan profil. Periksa koneksi Anda.");
    }
  };

  if (loading) return <div className="p-20 text-center font-bold text-slate-400 dark:text-slate-500">Menyinkronkan Data...</div>;

  if (isNewTalent) {
    return (
      <div className="profile-wrap animate-in fade-in duration-500 relative">
        <div className="max-w-xl mx-auto">
          <div className="profile-card profile-main dark:bg-dark-card dark:border-slate-800">
            <h2 className="text-xl font-extrabold mb-1 dark:text-white">Lengkapi Profil Talent Anda</h2>
            <p className="text-slate-400 text-sm mb-6">Data ini dikelola sepenuhnya oleh Orland AppAPI untuk Katalog.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="profile-section">
                <div className="profile-sectionHead dark:text-slate-300">1. Data Fisik (Wajib)</div>
                <div className="profile-sectionBody profile-formGrid">
                  <div className="profile-frow">
                    <label className="dark:text-slate-400">Nama Lengkap</label>
                    <input type="text" {...register('full_name')} placeholder="Sesuai KTP" className="dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                    {errors.full_name && <span className="text-red-500 text-xs">{errors.full_name.message}</span>}
                  </div>
                  <div className="profile-frow">
                    <label className="dark:text-slate-400">Tanggal Lahir</label>
                    <input type="date" {...register('birth_date')} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                    {errors.birth_date && <span className="text-red-500 text-xs">{errors.birth_date.message}</span>}
                  </div>
                  <div className="profile-frow">
                    <label className="dark:text-slate-400">Tinggi (cm)</label>
                    <input type="number" {...register('height')} placeholder="Contoh: 170" className="dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                    {errors.height && <span className="text-red-500 text-xs">{errors.height.message}</span>}
                  </div>
                  <div className="profile-frow">
                    <label className="dark:text-slate-400">Berat (kg)</label>
                    <input type="number" {...register('weight')} placeholder="Contoh: 60" className="dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                    {errors.weight && <span className="text-red-500 text-xs">{errors.weight.message}</span>}
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <div className="profile-sectionHead dark:text-slate-300">2. Kategori</div>
                <div className="profile-sectionBody">
                    <div className="profile-frow">
                      <select {...register('category')} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                        <option>Model</option><option>Actor</option><option>Influencer</option>
                      </select>
                    </div>
                </div>
              </div>

              <div className="sticky-save-bar visible dark:bg-dark-card dark:border-t-slate-800" style={{zIndex: 10}}>
                <div className="flex items-center gap-3 text-amber-600 dark:text-amber-500 font-bold text-sm">
                  <span className="draft-dot"></span>
                  <span className="hidden sm:inline">Semua data dikendalikan penuh oleh AppAPI.</span>
                </div>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 text-sm font-bold text-white bg-brand-600 rounded-full shadow-lg shadow-brand-500/30 hover:bg-brand-700 transition">
                  {isSubmitting ? 'Menyimpan...' : 'Kirim Data & Buka Dashboard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-wrap animate-in fade-in duration-500 p-2 sm:p-6">
      <h1 className="text-3xl font-extrabold dark:text-white">Halo, {profile.full_name}! 👋</h1>
      <p className="text-slate-500 dark:text-slate-400 mt-2">Data Anda sudah aktif di katalog Orland Management.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
          <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Status</p>
          <p className="text-2xl font-bold text-green-500 mt-1">Aktif & Terverifikasi</p>
        </div>
        <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
          <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Kategori</p>
          <p className="text-2xl font-bold dark:text-white mt-1">{profile.category}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
