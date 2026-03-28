import { Sparkles, Check, X, Ticket } from 'lucide-react';

export default function JobInvites() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Undangan Eksklusif</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">Undangan casting tertutup yang dikirim langsung oleh Sutradara khusus untuk Anda.</p>

      {/* THE GOLDEN TICKET */}
      <div className="mt-8 bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 p-1 rounded-3xl shadow-2xl shadow-amber-500/20 max-w-2xl mx-auto transform transition-transform hover:scale-[1.02]">
          <div className="bg-slate-900 rounded-[22px] p-8 sm:p-10 relative overflow-hidden">
              
              {/* Efek Kilauan */}
              <div className="absolute top-0 right-0 p-6 opacity-20"><Ticket size={120} className="text-amber-400" /></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-1 bg-amber-500/20 blur-xl rotate-45"></div>

              <div className="relative z-10 text-center sm:text-left">
                  <div className="inline-flex items-center justify-center bg-amber-400/10 border border-amber-400/50 text-amber-400 text-xs font-black uppercase px-4 py-1.5 rounded-full tracking-widest mb-6">
                      <Sparkles size={14} className="mr-2" /> Private Casting Invitation
                  </div>
                  
                  <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Netflix Original Series</h2>
                  <p className="text-amber-200 text-sm font-medium mb-8">Karakter: "Detektif Utama" • Sutradara: Timo Tjahjanto</p>
                  
                  <div className="bg-white/5 border border-white/10 p-5 rounded-2xl mb-8 text-left">
                      <p className="text-slate-300 text-sm leading-relaxed">Kami melihat profil Comp Card Anda dan sangat tertarik dengan karakter wajah Anda. Kami mengundang Anda untuk melakukan Private Screen Test di kantor kami minggu depan.</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center sm:justify-start">
                      <button className="px-8 py-3.5 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-900 font-black rounded-xl shadow-lg hover:shadow-amber-500/50 transition-all flex items-center justify-center">
                          <Check size={20} className="mr-2" /> Terima Undangan
                      </button>
                      <button className="px-8 py-3.5 bg-transparent border-2 border-slate-700 text-slate-400 font-bold rounded-xl hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center">
                          <X size={20} className="mr-2" /> Tolak
                      </button>
                  </div>
              </div>
          </div>
      </div>
    </div>
  )
}
