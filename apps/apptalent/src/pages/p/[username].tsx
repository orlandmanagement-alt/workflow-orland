import { useParams } from 'react-router-dom';
import { Instagram, Youtube, Twitter, Download, MessageCircle, Star } from 'lucide-react';

export default function PublicProfile() {
  const { username } = useParams();
  
  // NANTINYA: Data ini akan di-fetch dari API (api.get(`/public/talent/${username}`))
  // Untuk UI/UX saat ini, kita gunakan data simulasi agar Anda bisa melihat kemegahannya.
  const talent = {
    name: username?.replace(/-/g, ' ').toUpperCase() || 'ENDANG WIRA SURYA',
    category: 'ACTOR & COMMERCIAL MODEL',
    height: '170 cm',
    weight: '65 kg',
    gender: 'Male',
    bio: 'Berpengalaman lebih dari 5 tahun di industri kreatif. Telah membintangi berbagai TVC nasional dan film layar lebar. Memiliki karakter wajah yang kuat dan adaptif terhadap berbagai peran.',
    main_photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800&h=1000',
    gallery: [
      'https://images.unsplash.com/photo-1492288991661-058aa541ff43?auto=format&fit=crop&q=80&w=400&h=500',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400&h=500',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400&h=500'
    ]
  };

  const handleBooking = () => {
    // 1-Click Booking langsung ke WhatsApp Admin Orland
    const message = `Halo Orland Management, saya tertarik untuk mem-booking talent: ${talent.name}. Bisa infokan rate card & jadwalnya?`;
    window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a192f] font-sans selection:bg-brand-500 selection:text-white pb-20">
        
        {/* HEADER & MAIN PHOTO (HERO) */}
        <div className="relative h-[60vh] md:h-[70vh] w-full bg-slate-900 overflow-hidden">
            <img src={talent.main_photo} alt={talent.name} className="absolute inset-0 w-full h-full object-cover object-top opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
            
            {/* Navigasi Klien */}
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
                <span className="text-white font-extrabold text-xl tracking-tighter">ORLAND<span className="font-light">TALENT</span></span>
                <button className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-white hover:text-slate-900 transition-colors">
                    Download PDF
                </button>
            </div>

            {/* Judul Talent */}
            <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 z-10">
                <div className="flex items-center gap-2 mb-2">
                    <Star className="text-amber-400 fill-amber-400" size={16} />
                    <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">Verified Pro</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-white leading-none tracking-tight mb-2">{talent.name}</h1>
                <p className="text-brand-400 font-bold tracking-widest uppercase text-sm md:text-base">{talent.category}</p>
            </div>
        </div>

        {/* CONTENT & STATS */}
        <div className="max-w-5xl mx-auto px-6 md:px-12 -mt-8 relative z-20">
            <div className="bg-white dark:bg-dark-card rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-6 md:p-10 flex flex-col md:flex-row gap-10">
                
                {/* Kolom Kiri: Stats */}
                <div className="md:w-1/3 space-y-8">
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Physical Stats</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                                <span className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Height</span>
                                <span className="font-bold text-lg dark:text-white">{talent.height}</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                                <span className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Weight</span>
                                <span className="font-bold text-lg dark:text-white">{talent.weight}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Social Media</h3>
                        <div className="flex gap-3">
                            <a href="#" className="h-12 w-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-pink-600 transition-colors"><Instagram size={20} /></a>
                            <a href="#" className="h-12 w-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-red-600 transition-colors"><Youtube size={20} /></a>
                            <a href="#" className="h-12 w-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-blue-400 transition-colors"><Twitter size={20} /></a>
                        </div>
                    </div>
                </div>

                {/* Kolom Kanan: Bio & Gallery */}
                <div className="md:w-2/3">
                    <h3 className="text-xl font-bold dark:text-white mb-3">About</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8">{talent.bio}</p>

                    <h3 className="text-xl font-bold dark:text-white mb-4">Portfolio Gallery</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {/* CLIENT REVIEWS (NEW FEATURE) */}
                    <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
                        <h3 className="text-xl font-bold dark:text-white mb-6 flex items-center"><Star className="mr-2 text-amber-400 fill-amber-400" size={20}/> Ulasan Klien (3)</h3>
                        <div className="space-y-4">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                <div className="flex justify-between items-start mb-2">
                                    <div><p className="font-bold text-sm dark:text-white">Timo Tjahjanto (Director)</p><p className="text-xs text-slate-500">Film Layar Lebar</p></div>
                                    <div className="flex text-amber-400"><Star size={14} className="fill-amber-400"/><Star size={14} className="fill-amber-400"/><Star size={14} className="fill-amber-400"/><Star size={14} className="fill-amber-400"/><Star size={14} className="fill-amber-400"/></div>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 italic">"Sangat profesional, on-time, dan pendalaman karakternya luar biasa tajam. Will definitely work with him again."</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                <div className="flex justify-between items-start mb-2">
                                    <div><p className="font-bold text-sm dark:text-white">Tokopedia Production Team</p><p className="text-xs text-slate-500">TVC Ramadhan 2025</p></div>
                                    <div className="flex text-amber-400"><Star size={14} className="fill-amber-400"/><Star size={14} className="fill-amber-400"/><Star size={14} className="fill-amber-400"/><Star size={14} className="fill-amber-400"/><Star size={14} className="fill-amber-400"/></div>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 italic">"Kerja bareng talent ini sangat fun! Energi di set langsung naik, arahan sutradara dieksekusi dengan sempurna."</p>
                            </div>
                        </div>
                    </div>

                        {talent.gallery.map((img, idx) => (
                            <div key={idx} className="aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer group">
                                <img src={img} alt="Gallery" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>

        {/* 1-CLICK BOOKING BAR (Sticky Bottom for Clients) */}
        <div className="fixed bottom-0 left-0 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 p-4 z-50">
            <div className="max-w-5xl mx-auto flex justify-between items-center">
                <div className="hidden md:block">
                    <p className="font-bold dark:text-white text-sm">Tertarik dengan Talent ini?</p>
                    <p className="text-xs text-slate-500">Hubungi representatif Orland Management.</p>
                </div>
                <button onClick={handleBooking} className="w-full md:w-auto px-8 py-3.5 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl shadow-lg shadow-green-600/30 flex items-center justify-center transition-transform hover:scale-105">
                    <MessageCircle size={20} className="mr-2" /> 1-Click Booking via WhatsApp
                </button>
            </div>
        </div>

    </div>
  )
}
