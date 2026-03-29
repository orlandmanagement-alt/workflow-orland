import React, { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useProjectDraftStore } from '@/store/useProjectDraftStore';
import { useAuthStore } from '@/store/useAppStore';
import { StepBasic } from '@/components/wizard/StepBasic';
import { StepLogistics } from '@/components/wizard/StepLogistics';
import { StepRoles } from '@/components/wizard/StepRoles';
import { StepReview } from '@/components/wizard/StepReview';

export default function CreateProjectWizard() {
  const { currentStep, resetDraft } = useProjectDraftStore();
  const companyCategory = useAuthStore(state => state.companyCategory);

  // Bersihkan draft saat mount pertama (Opsional, tapi bagus agar bersih jika masuk dari awal)
  useEffect(() => {
    // resetDraft(); // Uncomment untuk mereset selalu
  }, []);

  const getProgressPercentage = () => {
    return (currentStep / 4) * 100;
  };

  const renderStep = () => {
    switch(currentStep) {
      case 1: return <StepBasic key="step1" />;
      case 2: return <StepLogistics key="step2" />;
      case 3: return <StepRoles key="step3" />;
      case 4: return <StepReview key="step4" />;
      default: return <StepBasic key="step1" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#071122] pt-8 px-4 sm:px-6 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 dark:bg-brand-500/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 dark:bg-purple-600/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen"></div>

      <div className="max-w-4xl mx-auto mb-12 relative z-10">
        
        {/* Progress Header */}
        <div className="mb-10 content-center text-center">
            <span className="text-xs font-black tracking-widest text-brand-600 dark:text-brand-400 uppercase mb-3 block">Bundle Wizard</span>
            <div className="flex items-center justify-between mb-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                <span className={currentStep >= 1 ? "text-brand-600 dark:text-brand-400" : ""}>Blueprint</span>
                <span className={currentStep >= 2 ? "text-brand-600 dark:text-brand-400" : ""}>Logistics</span>
                <span className={currentStep >= 3 ? "text-brand-600 dark:text-brand-400" : ""}>Bundle Roles</span>
                <span className={currentStep >= 4 ? "text-brand-600 dark:text-brand-400" : ""}>Review & Tag</span>
            </div>
            
            {/* Progress Bar Component */}
            <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex w-full">
                <div 
                    className="h-full bg-gradient-to-r from-brand-500 to-purple-600 transition-all duration-700 ease-out"
                    style={{ width: `${getProgressPercentage()}%` }}
                ></div>
            </div>
        </div>

        {/* Dynamic Area */}
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>

      </div>
    </div>
  );
}
