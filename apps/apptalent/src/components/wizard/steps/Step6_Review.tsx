import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Sparkles, Loader2, Play } from 'lucide-react';

interface Props {
  data: any;
  onBack: () => void;
  onFinish: () => void;
}

export default function Step6_Review({ data, onBack, onFinish }: Props) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulasi memanggil GET /profile/progress
    // Secara aktual, API akan menghitung bobot setiap kolom yang terisi
    setTimeout(() => {
        let score = 0;
        if (data.full_name && data.category) score += 30; // Basic Info
        if (data.height && data.weight && data.gender) score += 20; // Basic Physical
        if (data.headshot) score += 15;
        if (data.sideView) score += 10;
        if (data.fullHeight) score += 10;
        if (data.instagram || data.tiktok || data.twitter) score += 5;
        if (data.showreel || data.voiceOver) score += 5;
        if (data.experiences?.length > 0) score += 5;

        // Cap maksimal 100
        setProgress(Math.min(score, 100));
        setLoading(false);
    }, 1200);
  }, [data]);

  return (
    <div className="space-y-6 animate-in zoom-in-95 duration-700 max-w-lg mx-auto text-center mt-6">
      
      {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin text-brand-500 mb-6" size={48} />
              <h3 className="text-xl font-bold dark:text-white">Mengkalkulasi Kelengkapan Profil...</h3>
              <p className="text-slate-500 mt-2 text-sm">Sistem sedang memverifikasi standar kurasi Orland.</p>
          </div>
      ) : (
          <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6 relative">
                  <CheckCircle size={48} />
                  <Sparkles size={24} className="absolute -top-2 -right-2 text-yellow-400 animate-pulse" />
              </div>

              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                  {progress >= 85 ? "Luar Biasa!" : "Kerja Bagus!"}
              </h2>
              
              <p className="text-slate-600 dark:text-slate-400 mb-8">
                  Profil katalog Anda saat ini memiliki tingkat kelengkapan:
              </p>

              <div className="w-full max-w-sm mb-8">
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                        <div><span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-brand-600 bg-brand-200 dark:bg-brand-500/20">Skor Kurasi</span></div>
                        <div className="text-right"><span className="text-xl font-bold inline-block text-brand-600 dark:text-brand-400">{progress}%</span></div>
                    </div>
                    <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-slate-100 dark:bg-slate-800 shadow-inner">
                        <div style={{ width: `${progress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-brand-400 to-brand-600"></div>
                    </div>
                  </div>
                  {progress < 100 && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Anda bisa terus melengkapi profil lewat menu Pengaturan nanti untuk meningkatkan Visibilitas ke Klien.
                      </p>
                  )}
              </div>

              <div className="flex flex-col sm:flex-row w-full gap-4 mt-4">
                  <button 
                      onClick={onBack}
                      className="flex-1 py-3 px-6 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                  >
                      Kembali (Revisi)
                  </button>
                  <button 
                      onClick={onFinish}
                      className="flex-1 py-3 px-6 rounded-xl font-bold text-white bg-brand-600 hover:bg-brand-700 hover:scale-105 shadow-xl shadow-brand-500/30 transition-all flex justify-center items-center"
                  >
                      <Play size={18} className="mr-2 fill-current" /> Masuk Dashboard
                  </button>
              </div>
          </div>
      )}
    </div>
  );
}
