import { useParams } from 'react-router-dom';
import { Radio } from 'lucide-react';
export default function LiveBoardJoin() {
  const { id } = useParams();
  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[#0a192f] rounded-3xl overflow-hidden flex flex-col items-center justify-center text-white p-6 text-center border border-[#1a2b4b] shadow-2xl">
        <div className="relative mb-10">
            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
            <div className="h-24 w-24 bg-red-600 rounded-full flex items-center justify-center relative z-10 shadow-[0_0_50px_rgba(220,38,38,0.5)] border-4 border-red-400">
                <Radio size={40} className="text-white animate-pulse" />
            </div>
        </div>
        <h1 className="text-3xl font-extrabold mb-2 tracking-tight">LIVE CASTING BOARD</h1>
        <p className="text-slate-400 mb-10 text-sm font-medium tracking-widest uppercase">Ruang Casting: {id || 'PRIVATE-ROOM'}</p>
        <button className="px-10 py-4 bg-white text-[#0a192f] font-black text-xl rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 hover:bg-brand-50 hover:text-brand-700 transition-all duration-300 w-full max-w-sm">
            SAYA SIAP JOIN
        </button>
    </div>
  )
}
