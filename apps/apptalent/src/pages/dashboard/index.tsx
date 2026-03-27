import React, { useState, useEffect, useRef } from 'react';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import { talentService } from '@/lib/services/talentService';
import { api } from '@/lib/api';

const Dashboard = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // State Data
  const [formData, setFormData] = useState({
    full_name: '', height: '', weight: '', birth_date: '',
    category: 'Model', instagram: '', profile_picture: '',
    experience: '', youtube_url: '', audio_url: ''
  });

  // Cropper Refs
  const imageRef = useRef<HTMLImageElement>(null);
  const [cropper, setCropper] = useState<Cropper | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const data = await talentService.getProfile();
        if (data && data.profile_picture) setProfile(data);
      } catch (e) { console.log("Profil baru terdeteksi."); }
      finally { setLoading(false); }
    };
    checkProfile();
  }, []);

  // Handle Image Selection
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreviewSrc(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Init Cropper
  useEffect(() => {
    if (previewSrc && imageRef.current) {
      if (cropper) cropper.destroy();
      const newCropper = new Cropper(imageRef.current, {
        aspectRatio: 3 / 4,
        viewMode: 1,
      });
      setCropper(newCropper);
    }
  }, [previewSrc]);

  // Upload to R2 via API
  const handleUploadAndNext = async () => {
    if (!cropper) return setStep(2);
    setIsUploading(true);
    
    cropper.getCroppedCanvas({ width: 600, height: 800 }).toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "profile.jpg", { type: "image/jpeg" });
      const uploadData = new FormData();
      uploadData.append('file', file);

      try {
        // Endpoint API R2 Anda
        const res = await api.post('/upload/profile', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setFormData({ ...formData, profile_picture: res.data.url });
        setStep(2);
      } catch (err) {
        alert("Gagal upload foto ke R2.");
      } finally {
        setIsUploading(false);
      }
    }, 'image/jpeg', 0.8); // Kompresi 80%
  };

  const finalSubmit = async () => {
    setLoading(true);
    try {
      await talentService.updateProfile(formData);
      window.location.reload();
    } catch (err) {
      alert("Gagal menyimpan. Cek koneksi API.");
      setLoading(false);
    }
  };

  if (loading) return <div className="p-20 text-center">Sinkronisasi Data...</div>;

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto p-4 animate-in fade-in duration-500">
        {/* Progress Bar */}
        <div className="flex justify-between mb-8 px-2">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`h-2 flex-1 mx-1 rounded-full ${step >= s ? 'bg-orange-500' : 'bg-gray-200'}`} />
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          {/* STEP 1: FOTO UTAMA (Wajib) */}
          {step === 1 && (
            <div className="p-6">
              <h2 className="text-xl font-bold mb-1">Foto Profil Utama</h2>
              <p className="text-gray-400 text-sm mb-6">Gunakan foto terbaik (Close up/Full body)</p>
              
              {!previewSrc ? (
                <label className="border-2 border-dashed border-gray-200 rounded-2xl h-64 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                  <span className="text-gray-400">Klik untuk pilih foto</span>
                  <input type="file" className="hidden" accept="image/*" onChange={onFileChange} />
                </label>
              ) : (
                <div>
                  <div className="max-h-80 overflow-hidden rounded-xl mb-4">
                    <img ref={imageRef} src={previewSrc} alt="Preview" />
                  </div>
                  <button onClick={handleUploadAndNext} disabled={isUploading}
                    className="w-full bg-black text-white py-4 rounded-2xl font-bold">
                    {isUploading ? 'Mengompres & Upload...' : 'Lanjut ke Data Fisik'}
                  </button>
                  <button onClick={() => setPreviewSrc(null)} className="w-full text-gray-400 mt-2 text-sm">Ganti Foto</button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: BASIC PROFILE (Wajib) */}
          {step === 2 && (
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-bold">Informasi Fisik</h2>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Tinggi (cm)" className="p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-orange-500"
                  onChange={e => setFormData({...formData, height: e.target.value})} />
                <input type="number" placeholder="Berat (kg)" className="p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-orange-500"
                  onChange={e => setFormData({...formData, weight: e.target.value})} />
              </div>
              <input type="date" placeholder="Tgl Lahir" className="w-full p-4 bg-gray-50 rounded-xl border-none"
                onChange={e => setFormData({...formData, birth_date: e.target.value})} />
              <select className="w-full p-4 bg-gray-50 rounded-xl border-none"
                onChange={e => setFormData({...formData, category: e.target.value})}>
                <option>Model</option><option>Actor</option><option>Influencer</option>
              </select>
              <button onClick={() => setStep(3)} className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold mt-4">Lanjut</button>
            </div>
          )}

          {/* STEP 3: EXPERIENCE & SOCMED (Opsional) */}
          {step === 3 && (
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-bold">Sosial Media & Pengalaman</h2>
              <input type="text" placeholder="@username_instagram" className="w-full p-4 bg-gray-50 rounded-xl border-none"
                onChange={e => setFormData({...formData, instagram: e.target.value})} />
              <textarea placeholder="Pengalaman (Bisa dikosongkan)" className="w-full p-4 bg-gray-50 rounded-xl border-none" rows={3}
                onChange={e => setFormData({...formData, experience: e.target.value})} />
              <div className="flex gap-2">
                <button onClick={() => setStep(4)} className="flex-1 bg-gray-100 py-4 rounded-2xl font-bold text-gray-400">Lewati</button>
                <button onClick={() => setStep(4)} className="flex-1 bg-orange-500 text-white py-4 rounded-2xl font-bold">Lanjut</button>
              </div>
            </div>
          )}

          {/* STEP 4: YOUTUBE & FINISH */}
          {step === 4 && (
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-bold">Video & Audio</h2>
              <input type="text" placeholder="URL YouTube Video" className="w-full p-4 bg-gray-50 rounded-xl border-none"
                onChange={e => setFormData({...formData, youtube_url: e.target.value})} />
              <input type="text" placeholder="URL Audio (Voice Reel)" className="w-full p-4 bg-gray-50 rounded-xl border-none"
                onChange={e => setFormData({...formData, audio_url: e.target.value})} />
              <button onClick={finalSubmit} className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold mt-4">Selesaikan Pendaftaran</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Selamat Datang, {profile.full_name}!</h1>
      <p className="text-gray-500">Profil Anda sudah aktif di katalog Orland.</p>
      {/* Konten Dashboard Stats Anda di sini */}
    </div>
  );
};

export default Dashboard;
