import React, { useState, useEffect } from 'react';
import { CheckCircle, ChevronRight, X } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/store/useAppStore';

import Step1_BasicInfo from './steps/Step1_BasicInfo';
import Step2_Media from './steps/Step2_Media';
import Step3_Social from './steps/Step3_Social';
import Step4_Assets from './steps/Step4_Assets';
import Step5_Experience from './steps/Step5_Experience';
import Step6_Review from './steps/Step6_Review';

export default function ProfileWizard({ onClose }: { onClose?: () => void }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Mengambil profile draft sebelumnya (jika ada yang terputus)
  useEffect(() => {
    const fetchDraft = async () => {
      try {
        const res = await apiRequest('/talents/me');
        if (res.status === 'ok' && res.data) {
           setFormData(res.data);
           // Jika profile sudah ada tapi is_active 0 atau blm selesai, mungkin kita bisa tentukan currentStep scr dinamis
           // Tapi untuk amannya kita mulai dari Step 1 dengan data pre-filled
        }
      } catch (err) {
        console.error("Gagal menarik draft awal profil");
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchDraft();
  }, []);

  const updateFormData = (data: any) => setFormData((prev: any) => ({...prev, ...data}));

  const goNext = () => setCurrentStep(prev => Math.min(prev + 1, 6));
  const goBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  const finishWizard = () => {
    if (onClose) onClose();
    window.location.reload(); // Refresh untuk melihat update di dashboard
  };

  if (loadingInitial) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0a192f]/95 backdrop-blur flex items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white font-bold">Memuat Draft Profil Anda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a192f]/95 backdrop-blur flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col h-[90vh] md:h-[85vh] relative overflow-hidden">
        
        {/* Tombol X Tutup Darurat (Bisa dihilangkan jika wajib isi) */}
        {onClose && (
            <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-red-500 bg-slate-100 dark:bg-slate-800 rounded-full transition-colors">
            <X size={20} />
            </button>
        )}

        {/* Progress Bar Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 relative z-0 shrink-0">
          <div className="flex justify-between items-center mb-4 pr-10">
            <h2 className="text-xl font-bold dark:text-white">Lengkapi Profil Anda</h2>
            <span className="text-sm font-semibold text-brand-600">Langkah {currentStep} dari 6</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-brand-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${(currentStep / 6) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content Area (Slide & Fade) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 animate-in fade-in zoom-in-95 duration-300 relative">
          {currentStep === 1 && (
            <Step1_BasicInfo data={formData} onUpdate={updateFormData} onNext={goNext} />
          )}
          {currentStep === 2 && (
            <Step2_Media data={formData} onUpdate={updateFormData} onNext={goNext} onBack={goBack} />
          )}
          {currentStep === 3 && (
            <Step3_Social data={formData} onUpdate={updateFormData} onNext={goNext} onBack={goBack} />
          )}
          {currentStep === 4 && (
            <Step4_Assets data={formData} onUpdate={updateFormData} onNext={goNext} onBack={goBack} />
          )}
          {currentStep === 5 && (
            <Step5_Experience data={formData} onUpdate={updateFormData} onNext={goNext} onBack={goBack} />
          )}
          {currentStep === 6 && (
            <Step6_Review data={formData} onBack={goBack} onFinish={finishWizard} />
          )}
        </div>

      </div>
    </div>
  );
}
