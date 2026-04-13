import { useState } from 'react';
import { Settings as SettingsIcon, Bell, Shield, Eye, EyeOff, Save, LogOut, User, Lock, Zap } from 'lucide-react';
import { useAuthStore } from '../store/useAppStore';
import { performCleanLogout } from '../lib/auth/logout';

interface SettingSection {
  id: string;
  label: string;
  icon: any; // Lucide icon components
}

export default function Settings() {
  const { user, logout } = useAuthStore();
  const [activeSection, setActiveSection] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const sections: SettingSection[] = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'security', label: 'Keamanan', icon: Shield },
    { id: 'notifications', label: 'Notifikasi', icon: Bell },
    { id: 'billing', label: 'Tagihan', icon: Zap },
  ];

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">
          Pengaturan
        </h1>
        <p className="text-amber-500/70 text-sm mt-1">
          Kelola profil, keamanan, dan preferensi kamu
        </p>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Menu */}
        <div className="lg:col-span-1">
          <div className="space-y-2 bg-slate-950/40 border border-amber-500/10 rounded-lg p-4">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-semibold ${
                    activeSection === section.id
                      ? 'bg-amber-500/30 text-amber-400 border border-amber-500/50'
                      : 'text-slate-300 hover:bg-amber-500/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {section.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Section */}
          {activeSection === 'profile' && (
            <div className="bg-gradient-to-br from-slate-950/60 to-slate-900/40 border border-amber-500/10 rounded-lg p-6 space-y-6">
              <h2 className="text-xl font-black text-amber-400 uppercase tracking-wider">Informasi Profil</h2>

              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-2xl">
                  {user?.full_name?.charAt(0) || 'A'}
                </div>
                <div className="flex-1">
                  <p className="text-slate-400 text-sm mb-2">Foto Profil</p>
                  <button className="px-4 py-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors text-sm font-semibold">
                    Ubah Foto
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-amber-400 text-sm font-semibold mb-2">Nama Lengkap</label>
                  <input
                    type="text"
                    defaultValue={user?.full_name || ''}
                    className="w-full px-4 py-2 bg-slate-950/40 border border-amber-500/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-amber-400 text-sm font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    defaultValue={user?.email || ''}
                    className="w-full px-4 py-2 bg-slate-950/40 border border-amber-500/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-amber-400 text-sm font-semibold mb-2">Nomor Telepon</label>
                  <input
                    type="tel"
                    defaultValue="+62 812-3456-7890"
                    className="w-full px-4 py-2 bg-slate-950/40 border border-amber-500/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-amber-400 text-sm font-semibold mb-2">Deskripsi Agensi</label>
                  <textarea
                    rows={3}
                    defaultValue="Agensi kreatif terkemuka yang menghubungkan talent terbaik dengan brand ternama"
                    className="w-full px-4 py-2 bg-slate-950/40 border border-amber-500/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/50 transition-colors resize-none"
                  />
                </div>
              </div>

              {saveSuccess && (
                <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 text-sm font-semibold">
                  ✓ Perubahan berhasil disimpan
                </div>
              )}

              <button
                onClick={handleSave}
                className="w-full px-4 py-2 bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-600 transition-colors font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Simpan Perubahan
              </button>
            </div>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <div className="bg-gradient-to-br from-slate-950/60 to-slate-900/40 border border-amber-500/10 rounded-lg p-6 space-y-6">
              <h2 className="text-xl font-black text-amber-400 uppercase tracking-wider">Keamanan Akun</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-amber-400 text-sm font-semibold mb-2">Password Sekarang</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="w-full px-4 py-2 bg-slate-950/40 border border-amber-500/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/50 transition-colors"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-amber-400 text-sm font-semibold mb-2">Password Baru</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-2 bg-slate-950/40 border border-amber-500/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-amber-400 text-sm font-semibold mb-2">Konfirmasi Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-2 bg-slate-950/40 border border-amber-500/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
              </div>

              <button
                onClick={handleSave}
                className="w-full px-4 py-2 bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-600 transition-colors font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Ubah Password
              </button>

              <div className="pt-4 border-t border-amber-500/10">
                <h3 className="text-amber-400 font-black text-sm uppercase tracking-wider mb-3">Sesi Aktif</h3>
                <p className="text-slate-400 text-sm mb-3">Logout dari semua perangkat lain</p>
                <button className="w-full px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-semibold text-sm">
                  Logout Semua Perangkat
                </button>
              </div>
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <div className="bg-gradient-to-br from-slate-950/60 to-slate-900/40 border border-amber-500/10 rounded-lg p-6 space-y-6">
              <h2 className="text-xl font-black text-amber-400 uppercase tracking-wider">Preferensi Notifikasi</h2>

              <div className="space-y-4">
                {[
                  { label: 'Notifikasi Email', desc: 'Terima email berisi update penting' },
                  { label: 'Notifikasi Push', desc: 'Notifikasi real-time di perangkat' },
                  { label: 'Inquiry Baru', desc: 'Alert saat ada inquiry masuk' },
                  { label: 'Konfirmasi Pembayaran', desc: 'Notifikasi status pembayaran' },
                  { label: 'Promo & Update', desc: 'Berita tentang fitur dan promo terbaru' },
                ].map((notif, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-950/40 rounded-lg">
                    <div>
                      <p className="text-white font-semibold">{notif.label}</p>
                      <p className="text-slate-400 text-sm">{notif.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={idx < 3}
                      className="w-5 h-5 rounded accent-amber-500 cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={handleSave}
                className="w-full px-4 py-2 bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-600 transition-colors font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Simpan Preferensi
              </button>
            </div>
          )}

          {/* Billing Section */}
          {activeSection === 'billing' && (
            <div className="bg-gradient-to-br from-slate-950/60 to-slate-900/40 border border-amber-500/10 rounded-lg p-6 space-y-6">
              <h2 className="text-xl font-black text-amber-400 uppercase tracking-wider">Informasi Tagihan</h2>

              <div className="space-y-4">
                <p className="text-slate-300">Paket Berlangganan: <span className="text-amber-400 font-black">Pro Agency</span></p>
                <div className="p-4 bg-slate-950/40 rounded-lg border border-amber-500/20">
                  <p className="text-slate-400 text-sm mb-2">Periode Berlangganan</p>
                  <p className="text-white font-semibold">1 Januari 2024 - 31 Desember 2024</p>
                  <p className="text-amber-400 font-black text-lg mt-2">Rp 499.000/bulan</p>
                </div>

                <div className="space-y-2">
                  <p className="text-slate-400 text-sm font-semibold">Metode Pembayaran</p>
                  <div className="flex items-center gap-3 p-3 bg-slate-950/40 rounded-lg">
                    <div className="w-12 h-8 bg-amber-600 rounded flex items-center justify-center text-white text-xs font-black">
                      VISA
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">Visa •••• 4242</p>
                      <p className="text-slate-400 text-xs">Expires 12/26</p>
                    </div>
                  </div>
                </div>
              </div>

              <button className="w-full px-4 py-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors font-semibold text-sm">
                Ubah Metode Pembayaran
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
        <h2 className="text-lg font-black text-red-400 uppercase tracking-wider mb-4">Zona Berbahaya</h2>
        <p className="text-slate-300 text-sm mb-4">Tindakan ini tidak dapat dibatalkan</p>
        <button
          onClick={() => {
            if (confirm('Apakah Anda yakin ingin keluar? Anda harus login kembali.')) {
              performCleanLogout();
            }
          }}
          className="px-6 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-black text-sm uppercase tracking-wider flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout Sekarang
        </button>
      </div>
    </div>
  );
}
