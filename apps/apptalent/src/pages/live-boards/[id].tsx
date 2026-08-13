import { useParams, Link } from 'react-router-dom';
import { Radio, Video, Mic, Users, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

export default function LiveBoardJoin() {
  const { id } = useParams();
  const [isJoined, setIsJoined] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">
        <Link to="/dashboard" className="flex items-center hover:text-brand-600 transition-colors"><ArrowLeft size={16} className="mr-1" /> Kembali ke Beranda</Link> 
      </div>

      <div className="min-h-[70vh] bg-slate-900 rounded-3xl overflow-hidden flex flex-col items-center justify-center text-white p-6 sm:p-12 text-center border border-slate-800 shadow-2xl relative">
          
          {/* Background Effects */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-50"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-600/20 rounded-full blur-[100px] pointer-events-none"></div>

          {!isJoined ? (
              // TAMPILAN SEBELUM JOIN
              <div className="relative z-10 w-full max-w-md mx-auto">
                  <div className="relative mb-12 flex justify-center">
                      <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20 w-24 h-24 mx-auto"></div>
                      <div className="h-24 w-24 bg-slate-800 border-2 border-slate-700 rounded-full flex items-center justify-center relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                          <Radio size={40} className="text-red-500 animate-pulse" />
                      </div>
                  </div>
                  
                  <span className="bg-brand-900/50 text-brand-300 border border-brand-500/30 text-[10px] font-black uppercase px-3 py-1.5 rounded-full tracking-widest mb-6 inline-block">
                      VIP Virtual Room: {id || 'PRIVATE'}
                  </span>
                  
                  <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight">LIVE CASTING BOARD</h1>
                  <p className="text-slate-400 mb-10 text-sm leading-relaxed">Sutradara dan Klien sedang menunggu di dalam ruangan. Pastikan pencahayaan dan mikrofon Anda berfungsi dengan baik sebelum masuk.</p>
                  
                  <div className="flex justify-center gap-4 mb-10">
                      <div className="flex flex-col items-center"><div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center text-green-400 mb-2"><Video size={20}/></div><span className="text-xs text-slate-500 font-bold">Cam Ready</span></div>
                      <div className="flex flex-col items-center"><div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center text-green-400 mb-2"><Mic size={20}/></div><span className="text-xs text-slate-500 font-bold">Mic Ready</span></div>
                  </div>

                  <button onClick={() => setIsJoined(true)} className="px-10 py-4 bg-white text-slate-900 font-black text-lg rounded-full shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 hover:bg-brand-50 hover:text-brand-700 transition-all duration-300 w-full flex items-center justify-center">
                      <ShieldCheck size={24} className="mr-2"/> MASUK KE RUANG CASTING
                  </button>
              </div>
          ) : (
              // TAMPILAN SAAT BERADA DI WAITING ROOM
              <div className="relative z-10 w-full max-w-lg mx-auto">
                  <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 p-8 rounded-3xl shadow-2xl">
                      <div className="h-20 w-20 bg-brand-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                          <span className="text-4xl font-black">3</span>
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-2">Anda Berada di Antrean</h2>
                      <p className="text-slate-400 text-sm mb-8">Harap bersabar. Sutradara sedang melakukan sesi casting dengan talent lain. Ruangan Anda akan otomatis terbuka saat giliran Anda tiba.</p>
                      
                      <div className="flex items-center justify-center gap-3 text-sm text-slate-500 bg-slate-900/50 py-3 px-6 rounded-full w-fit mx-auto border border-slate-800">
                          <Users size={16} className="text-brand-400"/> <span className="font-bold text-white">4</span> Talent dalam antrean
                      </div>
                  </div>
                  
                  <button onClick={() => setIsJoined(false)} className="mt-8 text-slate-500 text-sm font-bold hover:text-white transition-colors">
                      Keluar dari Antrean
                  </button>
              </div>
          )}
      </div>
    </div>
  )
}
