import { useState } from 'react';
import { Video, Calendar, Target, Briefcase, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuthStore, CompanyCategory } from '@/store/useAppStore';

const CATEGORIES = [
  { 
    id: 'PH' as CompanyCategory, 
    title: 'Production House / TVC', 
    desc: 'Untuk Anda yang merekrut Aktor, Figuran, atau Model untuk Film dan Iklan.',
    icon: Video,
    color: 'text-rose-500',
    bgHover: 'hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/10'
  },
  { 
    id: 'EO' as CompanyCategory, 
    title: 'Event / Wedding Organizer', 
    desc: 'Untuk manajemen MC, Usher, SPG/SPB, Musisi, dan staf On-site Event.',
    icon: Calendar,
    color: 'text-amber-500',
    bgHover: 'hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/10'
  },
  { 
    id: 'KOL' as CompanyCategory, 
    title: 'Digital Marketing / KOL Agency', 
    desc: 'Untuk Campaign Briefs, memantau Influencer, TikTokers, atau Selebgram.',
    icon: Target,
    color: 'text-fuchsia-500',
    bgHover: 'hover:border-fuchsia-300 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/10'
  },
  { 
    id: 'BRAND' as CompanyCategory, 
    title: 'Direct Brand / Corporate', 
    desc: 'Untuk menemukan Brand Ambassador eksklusif dan Talent In-house Corporate.',
    icon: Briefcase,
    color: 'text-blue-500',
    bgHover: 'hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10'
  }
];

export const CategoryModal = () => {
  const { companyCategory, setCategory, isAuthenticated } = useAuthStore();
  const [selectedHover, setSelectedHover] = useState<CompanyCategory>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Aturan Gatekeeper Ekstrem: Hanya tampil bagi Klien yang login namun Kategori-nya kosong (null/undefined)
  if (!isAuthenticated || companyCategory) return null;

  const handleSelect = async (id: CompanyCategory) => {
    setIsLoading(true);
    // TODO: Connect ke API aktual -> await apiRequest.put('/client/company-profile', { category: id })
    // Simulasi delay Database D1 update
    setTimeout(() => {
      setCategory(id);
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex justify-center items-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-dark-card w-full max-w-4xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row">
        
        {/* Panel Kiri - Edukasi Singkat */}
        <div className="w-full md:w-5/12 bg-slate-900 text-white p-8 md:p-10 flex flex-col justify-between relative overflow-hidden shrink-0">
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-brand-500 rounded-full blur-[100px] opacity-40 mix-blend-screen"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl font-extrabold leading-tight mb-4">Selamat Datang di Orland B2B.</h2>
            <p className="text-slate-300 text-base mb-8">
              Bantu kami mengkonfigurasi ruang kerja *Dashboard* Anda.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-brand-400 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-300">Sistem menu, alat pencarian, dan formulir proyek akan **dikustomisasi secara otomatis**.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-brand-400 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-300">Rekomendasi *Talent* akan lebih terarah sesuai dengan kebutuhan dan target industri perusahaan Anda.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Kanan - Grid Pilihan */}
        <div className="w-full p-8 md:p-10">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Pilih Kategori Perusahaan Anda:</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                disabled={isLoading}
                onMouseEnter={() => setSelectedHover(cat.id)}
                onMouseLeave={() => setSelectedHover(null)}
                onClick={() => handleSelect(cat.id)}
                className={`text-left p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden group
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:shadow-lg ${cat.bgHover}
                `}
              >
                <cat.icon size={28} className={`${cat.color} mb-4 transition-transform group-hover:scale-110`} />
                <h4 className="font-bold text-slate-900 dark:text-white text-base mb-1">{cat.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{cat.desc}</p>
                
                {isLoading && selectedHover === cat.id && (
                  <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                     <Loader2 size={24} className="animate-spin text-brand-600" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
