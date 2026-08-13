import { useState } from 'react';
import { Headset, MessageSquare, PhoneCall, Send, ShieldAlert, CreditCard, Clapperboard, Loader2, CheckCircle2, LifeBuoy } from 'lucide-react';

export default function Helpdesk() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [ticketData, setTicketData] = useState({ category: 'finance', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketData.subject || !ticketData.message) return alert("Mohon lengkapi subjek dan pesan Anda.");
    
    setIsSubmitting(true);
    // Simulasi pengiriman tiket ke sistem Orland
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTicketData({ category: 'finance', subject: '', message: '' });
      setTimeout(() => setIsSuccess(false), 5000);
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER HERO: VIP CONCIERGE */}
      <div className="bg-slate-900 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 p-8 opacity-5"><LifeBuoy size={200} className="text-brand-500" /></div>
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-brand-600/20 rounded-full blur-[80px]"></div>
          
          <div className="relative z-10">
              <div className="inline-flex items-center gap-2 mb-4 bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-black uppercase px-4 py-1.5 rounded-full tracking-widest">
                  <Headset size={14} /> VIP Concierge Support
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">Ada yang bisa kami bantu?</h1>
              <p className="text-slate-400 text-sm max-w-xl leading-relaxed">Tim representatif Orland Management siap sedia 24/7 untuk memastikan kenyamanan, keamanan, dan kelancaran karir Anda. Jangan ragu untuk melapor.</p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* KOLOM KIRI: FORM TIKET BANTUAN */}
          <div className="lg:col-span-2 bg-white dark:bg-dark-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Buat Tiket Laporan</h2>
              
              {isSuccess ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-8 rounded-2xl flex flex-col items-center justify-center text-center animate-in zoom-in-95">
                      <div className="h-16 w-16 bg-green-100 dark:bg-green-800/50 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-4"><CheckCircle2 size={32} /></div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Laporan Berhasil Diterima</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm">Tiket prioritas Anda telah masuk ke sistem. Tim kami akan segera menghubungi Anda via WhatsApp atau Telepon dalam waktu maksimal 2 jam.</p>
                      <button onClick={() => setIsSuccess(false)} className="mt-6 text-brand-600 dark:text-brand-400 font-bold text-sm hover:underline">Buat laporan baru</button>
                  </div>
              ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Kategori Masalah</label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${ticketData.category === 'finance' ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-900/20 dark:border-brand-500 dark:text-brand-400 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400'}`}>
                                  <input type="radio" name="category" value="finance" checked={ticketData.category === 'finance'} onChange={(e) => setTicketData({...ticketData, category: e.target.value})} className="hidden" />
                                  <CreditCard size={24} /> <span className="text-xs font-bold uppercase tracking-wider">Finansial & Honor</span>
                              </label>
                              <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${ticketData.category === 'onset' ? 'bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-900/20 dark:border-amber-500 dark:text-amber-400 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400'}`}>
                                  <input type="radio" name="category" value="onset" checked={ticketData.category === 'onset'} onChange={(e) => setTicketData({...ticketData, category: e.target.value})} className="hidden" />
                                  <Clapperboard size={24} /> <span className="text-xs font-bold uppercase tracking-wider">Kendala di Set</span>
                              </label>
                              <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${ticketData.category === 'legal' ? 'bg-purple-50 border-purple-500 text-purple-700 dark:bg-purple-900/20 dark:border-purple-500 dark:text-purple-400 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400'}`}>
                                  <input type="radio" name="category" value="legal" checked={ticketData.category === 'legal'} onChange={(e) => setTicketData({...ticketData, category: e.target.value})} className="hidden" />
                                  <ShieldAlert size={24} /> <span className="text-xs font-bold uppercase tracking-wider">Kontrak & Legal</span>
                              </label>
                          </div>
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Subjek / Judul Laporan</label>
                          <input type="text" value={ticketData.subject} onChange={(e) => setTicketData({...ticketData, subject: e.target.value})} placeholder="Contoh: Honor TVC Glow Soap belum masuk" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all" />
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Detail Pesan / Kronologi</label>
                          <textarea value={ticketData.message} onChange={(e) => setTicketData({...ticketData, message: e.target.value})} placeholder="Ceritakan detail kendala yang Anda alami secara lengkap di sini..." className="w-full h-32 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl text-sm dark:text-white resize-none focus:ring-2 focus:ring-brand-500 outline-none transition-all" />
                      </div>

                      <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center disabled:opacity-70">
                          {isSubmitting ? <><Loader2 size={18} className="animate-spin mr-2" /> Mengirim Tiket VIP...</> : <><Send size={18} className="mr-2" /> Kirim Laporan Sekarang</>}
                      </button>
                  </form>
              )}
          </div>

          {/* KOLOM KANAN: KONTAK CEPAT & DARURAT */}
          <div className="space-y-6">
              
              {/* Kontak WhatsApp */}
              <div className="bg-brand-50 dark:bg-brand-900/10 p-6 rounded-3xl border border-brand-100 dark:border-brand-800/50">
                  <div className="h-12 w-12 bg-brand-100 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-full flex items-center justify-center mb-4"><MessageSquare size={24} /></div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2">Live Chat Admin</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">Butuh respon kilat untuk hal non-darurat? Hubungi representatif kami via WhatsApp.</p>
                  <button onClick={() => window.open('https://wa.me/6281234567890', '_blank')} className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-500/30 transition-transform hover:scale-105 flex justify-center items-center">
                      Chat WhatsApp
                  </button>
              </div>

              {/* Kontak Darurat (Merah) */}
              <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-3xl border border-red-100 dark:border-red-900/50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 text-red-500"><ShieldAlert size={80} /></div>
                  <div className="relative z-10">
                      <h3 className="font-bold text-red-800 dark:text-red-400 mb-2 flex items-center"><PhoneCall size={18} className="mr-2" /> Hotline Darurat</h3>
                      <p className="text-xs text-red-600 dark:text-red-300 mb-4 leading-relaxed">Gunakan nomor ini <b>HANYA</b> untuk keadaan darurat di lokasi syuting (kecelakaan, pelecehan, atau pembatalan sepihak).</p>
                      <a href="tel:+6281234567890" className="inline-block font-black text-2xl text-red-700 dark:text-red-500 tracking-wider hover:underline">
                          0812-3456-7890
                      </a>
                  </div>
              </div>

          </div>
      </div>
    </div>
  )
}
