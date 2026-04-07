import React from 'react';
import { X, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface ProgressModalProps {
    profileProgressData: any;
    onClose: () => void;
}

export function ProgressModal({ profileProgressData, onClose }: ProgressModalProps) {
    const percentage = profileProgressData?.percentage || 0;
    const completed = profileProgressData?.completedSections || [];
    const missing = profileProgressData?.missingSections || [];

    // Calculate circumference for SVG circle
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
             <div className="bg-white dark:bg-dark-card rounded-3xl w-full max-w-3xl shadow-2xl relative animate-in zoom-in-95 overflow-hidden flex flex-col md:flex-row min-h-[400px]">
                 
                 <button onClick={onClose} className="absolute top-4 right-4 z-10 bg-white/50 backdrop-blur text-slate-500 hover:text-slate-900 dark:hover:text-white p-2 rounded-full transition-colors"><X size={20}/></button>
                 
                 {/* LEFT COLUMN: Graphic */}
                 <div className="w-full md:w-2/5 bg-gradient-to-br from-brand-600 to-brand-800 p-8 flex flex-col items-center justify-center relative overflow-hidden text-white">
                     
                     {/* Decorative background shapes */}
                     <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                     <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />

                     <div className="relative mb-6">
                        {/* Circular Progress SVG */}
                        <svg className="w-40 h-40 transform -rotate-90" aria-label={`Profile Completion: ${percentage}%`}>
                            {/* Track */}
                            <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/20" />
                            {/* Fill */}
                            <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" strokeLinecap="round" className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" style={{ strokeDasharray: circumference, strokeDashoffset, transition: "stroke-dashoffset 1s ease-in-out" }} />
                        </svg>
                        
                        {/* Center Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black">{percentage}%</span>
                        </div>
                     </div>

                     <div className="bg-black/20 backdrop-blur border border-white/10 rounded-full px-5 py-2 font-bold flex items-center gap-2 mb-6">
                        <span className="text-amber-400 text-lg">★</span> 3,500 <span className="opacity-75 text-sm font-medium ml-1">Rating</span>
                     </div>

                     <div className="text-center bg-white/10 rounded-2xl p-4 border border-white/10 relative z-10 w-full backdrop-blur-md">
                         <div className="font-bold text-sm mb-1 flex items-center justify-center gap-2">💡 Remember:</div>
                         <p className="text-xs text-white/80 leading-relaxed font-medium">Comp card photos will be evaluated by an analyzer to update your global rating.</p>
                     </div>
                 </div>
                 
                 {/* RIGHT COLUMN: Checklist */}
                 <div className="w-full md:w-3/5 p-8 flex flex-col max-h-[80vh] overflow-y-auto custom-scrollbar">
                     <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">Your Profile Progress</h3>
                     
                     <div className="space-y-6">
                         {/* Info Row Workflow Example */}
                         <div className="flex gap-4">
                             <div className="mt-1"><CheckCircle2 className="text-emerald-500 shrink-0" size={24} /></div>
                             <div className="flex-1">
                                 <h4 className="font-black text-slate-900 dark:text-white line-through opacity-70">Info {percentage > 20 ? '100%' : '0%'}</h4>
                                 <p className="text-sm text-slate-500 line-through mb-2">Complete all sections with information about you.</p>
                                 <div className="h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-full" /></div>
                             </div>
                         </div>

                         {/* Photos Example */}
                         <div className="flex gap-4 p-4 -mx-4 rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100/50 dark:border-amber-900/30">
                             <div className="mt-1"><AlertCircle className="text-amber-500 shrink-0 animate-pulse" size={24} /></div>
                             <div className="flex-1">
                                 <h4 className="font-black text-slate-900 dark:text-white text-[15px]">Photos</h4>
                                 <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Add 3 main photos to boost your profile and activate discovery.</p>
                                 <button onClick={onClose} className="text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl flex items-center transition-colors shadow-sm">
                                     Add More Photos <ArrowRight size={16} className="ml-2" />
                                 </button>
                             </div>
                         </div>
                         
                         {/* Videos/Audio Example */}
                         <div className="flex gap-4">
                             <div className="mt-1"><div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-700 shrink-0" /></div>
                             <div className="flex-1">
                                 <h4 className="font-black text-slate-900 dark:text-white opacity-80">Videos / Audio</h4>
                                 <p className="text-sm text-slate-500 mb-3">Add YouTube video or audio link to expose your talent to casting directors.</p>
                                 <button onClick={onClose} className="text-sm font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 rounded-xl flex items-center transition-colors">
                                     Add Assets <ArrowRight size={16} className="ml-2" />
                                 </button>
                             </div>
                         </div>
                     </div>
                 </div>

             </div>
        </div>
    )
}
