import { useParams } from 'react-router-dom';
import { Radio } from 'lucide-react';
export default function LiveBoardJoin() {
  const { id } = useParams();
  return (
    <div className="min-h-screen bg-[#0a192f] flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="relative mb-10">
            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
            <div className="h-24 w-24 bg-red-600 rounded-full flex items-center justify-center relative z-10 shadow-[0_0_50px_rgba(220,38,38,0.5)]">
                <Radio size={40} className="text-white animate-pulse" />
            </div>
        </div>
        <h1 className="text-3xl font-extrabold mb-2">LIVE CASTING BOARD</h1>
        <p className="text-slate-400 mb-10">Board ID: {id}</p>
        <button className="px-10 py-4 bg-white text-[#0a192f] font-black text-xl rounded-full shadow-2xl hover:scale-105 transition-transform w-full max-w-sm">
            SAYA SIAP JOIN
        </button>
    </div>
  )
}
