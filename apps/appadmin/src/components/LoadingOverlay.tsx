import React from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';

const LoadingOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#071122]">
      <div className="relative flex flex-col items-center">
        {/* Animated Glow Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-600/20 rounded-full blur-[100px] animate-pulse"></div>
        
        {/* Animated Icon Container */}
        <div className="relative mb-8 p-4 bg-slate-900/50 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-2xl">
          <div className="absolute inset-0 bg-red-500/10 rounded-2xl animate-ping opacity-20"></div>
          <ShieldCheck className="text-red-500 relative z-10" size={48} />
        </div>

        {/* Loading Text */}
        <div className="text-center">
          <h2 className="text-xl font-black text-white tracking-[0.2em] uppercase mb-3 flex items-center justify-center gap-3">
            <Loader2 className="animate-spin text-red-500" size={20} />
            Authenticating
          </h2>
          <div className="flex flex-col items-center gap-2">
            <p className="text-slate-400 font-mono text-[10px] tracking-widest uppercase opacity-70">
              Verifying Authorization Level
            </p>
            <div className="flex gap-1.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500/40 animate-[bounce_1s_infinite_0ms]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500/40 animate-[bounce_1s_infinite_200ms]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500/40 animate-[bounce_1s_infinite_400ms]"></span>
            </div>
          </div>
        </div>

        {/* Bottom Status (Decorative) */}
        <div className="mt-12 px-4 py-2 bg-slate-900/30 rounded-full border border-slate-800/50">
          <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">
            ORLAND MANAGEMENT SECURE GATEWAY
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
