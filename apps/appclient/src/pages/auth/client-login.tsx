import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, FileText, UploadCloud, CheckCircle2, Lock, Mail, ArrowRight, Loader2, ShieldCheck, Clock } from 'lucide-react';

export default function ClientAuth() {
  const navigate = useNavigate();
  const [step, setStep] = useState('login'); 
  const [isLoading, setIsLoading] = useState(false);
  const handleSimulateLogin = (e: any) => { e.preventDefault(); setIsLoading(true); setTimeout(() => { setIsLoading(false); setStep('kyb-1'); }, 1500); };
  const nextStep = (next: string) => { setIsLoading(true); setTimeout(() => { setIsLoading(false); setStep(next); }, 1000); };
  return (
    <div className="min-h-screen bg-white dark:bg-[#071122] flex flex-col md:flex-row">
      <div className="hidden md:flex md:w-1/2 bg-slate-900 relative p-12 overflow-hidden">
          <div className="relative z-10 text-white">
              <h1 className="text-4xl font-black mb-6">ORLAND B2B</h1>
              <p className="text-slate-400">Secure Enterprise Portal</p>
          </div>
      </div>
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
          <div className="max-w-md w-full">
              {step === 'login' && (
                  <form onSubmit={handleSimulateLogin} className="space-y-4">
                      <h2 className="text-2xl font-black">Login Client</h2>
                      <input type="email" placeholder="Email" className="w-full p-3 bg-slate-100 rounded-xl" />
                      <button className="w-full py-3 bg-black text-white rounded-xl">Lanjutkan</button>
                  </form>
              )}
              {step === 'pending' && (
                  <div className="text-center">
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><Clock size={40} className="text-green-600"/></div>
                      <h2 className="text-xl font-bold">Verifikasi Berlangsung</h2>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
}
