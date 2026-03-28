import { Sun, CloudRain, MapPin, Clock, Send } from 'lucide-react';

export default function CallSheetGenerator() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto px-4 sm:px-6 mt-6 pb-20">
      <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl border border-slate-800">
        <h1 className="text-3xl font-black mb-2">Digital Call Sheet</h1>
        <p className="text-slate-400 text-sm">Otomatis mengirim jadwal ke WhatsApp Talent dalam satu klik.</p>
        
        <div className="grid grid-cols-2 gap-4 mt-8 border-t border-white/10 pt-8">
          <div className="flex items-center gap-3">
            <Sun className="text-amber-400" />
            <div><p className="text-[10px] text-slate-400 uppercase font-bold">Weather Report</p><p className="font-bold">Cerah Berawan (28°C)</p></div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="text-red-400" />
            <div><p className="text-[10px] text-slate-400 uppercase font-bold">Shooting Location</p><p className="font-bold">Studio 5, Malang</p></div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div className="bg-white/5 p-4 rounded-2xl flex justify-between items-center border border-white/5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand-500 rounded-xl font-black">06:00</div>
              <div><p className="font-bold text-sm">Call Time: Sarah Lee</p><p className="text-xs text-slate-400">Makeup & Wardrobe</p></div>
            </div>
            <button className="text-[10px] font-black bg-white/10 px-3 py-1 rounded-lg uppercase tracking-widest hover:bg-brand-500 transition-colors">Notify WA</button>
          </div>
        </div>

        <button className="w-full mt-10 py-4 bg-white text-slate-900 font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
          <Send size={18}/> Publish & Kirim Blast Call Sheet
        </button>
      </div>
    </div>
  );
}
