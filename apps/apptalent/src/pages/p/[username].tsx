import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Instagram, Youtube, Twitter, Facebook, Download, MessageCircle, Star, 
  ChevronLeft, MapPin, CheckCircle2, Play, Fingerprint, Camera, 
  Film, Award, Ruler, Music, Briefcase, ChevronRight, Share2, Heart, ArrowLeft, Ghost, VideoOff, MicOff, ShieldAlert
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function PublicProfile() {
  const { username } = useParams();
  const [talent, setTalent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [wishlist, setWishlist] = useState(false);
  
  // Mobile Slider State
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
     const fetchTalentInfo = async () => {
         setLoading(true);
         try {
             const res: any = await apiRequest(`/public/talents/${username}`);
             if (res.status === 'ok') {
                 setTalent(res.data);
             } else {
                 console.error("Failed to load talent:", res.message);
                 setTalent(null); 
             }
         } catch (error) {
             console.error("API error", error);
             setTalent(null);
         } finally {
             // Fake delay for the elegant loader experience
             setTimeout(() => setLoading(false), 800);
         }
     };

     if (username) fetchTalentInfo();
  }, [username]);

  // Handle Mobile Auto Slide
  useEffect(() => {
    if (!talent) return;
    const gallery = [talent.headshot, talent.close_up, talent.full_height].filter(Boolean);
    if(gallery.length <= 1) return;
    
    const interval = setInterval(() => {
        setSlideIdx((prev) => (prev + 1) % gallery.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [talent]);

  const handleBooking = () => {
    const message = `Halo Agen Orland Management, saya tertarik untuk booking talent:\nNama: ${talent?.full_name}\nID: ${talent?.talent_id}\nMohon infokan rate card & jadwalnya.`;
    window.open(`https://wa.me/62895627251703?text=${encodeURIComponent(message)}`, '_blank');
  };

  const copyLink = () => {
      navigator.clipboard.writeText(window.location.href);
      alert("Tautan profil berhasil disalin!");
  };

  const getAge = (dateString: string) => {
    if(!dateString) return "-";
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const getYoutubeId = (url: string) => {
      const match = url?.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
      return (match && match[2].length === 11) ? match[2] : null;
  };

  if (loading) {
      return (
          <div className="fixed inset-0 bg-white dark:bg-slate-900 z-[9999] flex flex-col items-center justify-center transition-all duration-500">
              <div className="w-24 h-24 sm:w-32 sm:h-32 mb-6 animate-pulse">
                 {/* Placeholder for real logo, using text for now */}
                 <div className="w-full h-full rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl">OM</div>
              </div>
              <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
              <p className="font-extrabold text-slate-400 tracking-widest uppercase text-xs">Memuat Talent Eksklusif...</p>
          </div>
      );
  }

  if (!talent && !loading) {
      return (
          <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
              <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-md w-full border border-slate-100">
                  <Ghost className="mx-auto text-slate-300 w-20 h-20 mb-6" />
                  <h2 className="text-2xl font-black text-slate-900 mb-2">Profil Tidak Ditemukan</h2>
                  <p className="text-slate-500 mb-8 font-medium">URL profil yang Anda minta tidak terdaftar atau sudah tidak aktif.</p>
                  <a href="/" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition">
                      <ArrowLeft size={18} /> Kembali ke Directory
                  </a>
              </div>
          </div>
      );
  }

  // Fallbacks
  const headshot = talent.headshot || 'https://via.placeholder.com/800x1000';
  const sideView = talent.close_up || 'https://via.placeholder.com/600x800';
  const fullView = talent.full_height || 'https://via.placeholder.com/600x800';
  const mobileGallery = [headshot, sideView, fullView].filter(Boolean);
  
  let allPhotos = [headshot, sideView, fullView];
  if(Array.isArray(talent.additional_photos)) {
      allPhotos = [...allPhotos, ...talent.additional_photos];
  }

  const interests = Array.isArray(talent.interests) ? talent.interests : [];
  const skills = Array.isArray(talent.skills) ? talent.skills : [];
  const ytLinks = Array.isArray(talent.showreels) ? talent.showreels : [];
  const audioLinks = Array.isArray(talent.audios) ? talent.audios : [];
  const credits = Array.isArray(talent.experiences) ? talent.experiences : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d19] font-sans selection:bg-indigo-500 selection:text-white pb-32">
        
        {/* DESKTOP STICKY BRAND HEADER */}
        <nav className="hidden lg:flex fixed top-0 left-0 w-full z-[100] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-all h-20 items-center justify-center">
             <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/30">OM</div>
                 <span className="font-extrabold text-slate-900 text-xl tracking-tight">ORLAND<span className="font-light text-slate-400">MANAGEMENT</span></span>
             </div>
        </nav>

        {/* MOBILE SLIDER HERO */}
        <div className="lg:hidden relative w-full h-[65vh] min-h-[480px] bg-black overflow-hidden group">
             {/* Slider Controls Layer */}
             <div className="absolute top-4 right-4 z-20 flex gap-3">
                 <button onClick={() => setWishlist(!wishlist)} className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg transition-all ${wishlist ? 'bg-rose-500 border-rose-400 text-white' : 'bg-white/80 border-white/50 text-slate-600'}`}>
                     <Heart size={20} fill={wishlist ? "currentColor" : "none"} className={wishlist ? 'animate-bounce' : ''}/>
                 </button>
                 <button onClick={copyLink} className="w-11 h-11 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-slate-600 shadow-lg border border-white/50">
                     <Share2 size={20} />
                 </button>
             </div>

             <div className="absolute inset-0 transition-transform duration-700 ease-out" style={{ transform: `translateX(-${slideIdx * 100}%)` }}>
                 <div className="flex h-full w-[300%]">
                     {mobileGallery.map((img, i) => (
                         <div key={i} className="w-1/3 h-full relative">
                             <img src={img} alt="Hero" className="w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/40 to-slate-950"></div>
                         </div>
                     ))}
                 </div>
             </div>

             {/* Slider Dots */}
             <div className="absolute bottom-[160px] left-5 z-20 flex gap-2">
                 {mobileGallery.map((_, i) => (
                     <div key={i} onClick={()=>setSlideIdx(i)} className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${i === slideIdx ? 'bg-pink-500 w-8 shadow-[0_0_12px_rgba(236,72,153,0.8)]' : 'bg-white/40 w-2 hover:bg-white/60'}`} />
                 ))}
             </div>

             {/* Info Layer */}
             <div className="absolute bottom-0 left-0 w-full p-6 pb-8 z-20 text-white">
                 <div className="inline-flex items-center gap-2 bg-black/40 border border-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold mb-3 shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
                     <Star size={14} className="text-amber-400" fill="currentColor"/> 
                     <span className="uppercase tracking-widest opacity-90">{talent.category || 'General Talent'}</span>
                 </div>
                 <h1 className="text-4xl sm:text-5xl font-black leading-none tracking-tight mb-4 drop-shadow-lg">{talent.full_name}</h1>
                 <button onClick={handleBooking} className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-3.5 rounded-2xl font-black shadow-[0_8px_24px_rgba(37,211,102,0.3)] flex items-center justify-center gap-2 text-sm transition-transform active:scale-95">
                     <MessageCircle size={18} /> BOOKING TALENT
                 </button>
             </div>
        </div>

        {/* CONTAINER SPLIT DESKTOP */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:pt-32">
            <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8 xl:gap-12 items-start">
                
                {/* -----------------------------
                    SIDEBAR (DESKTOP ONLY)
                ----------------------------- */}
                <aside className="hidden lg:block sticky top-28 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-[32px] p-6 border border-slate-100 dark:border-slate-700 shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
                        
                        {/* Status Badge */}
                        <div className="relative mb-6">
                             <div className="absolute -top-3 -left-3 z-10 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-100 shadow-lg flex items-center gap-2 font-black text-[11px] text-emerald-600 uppercase tracking-widest">
                                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping absolute"></span>
                                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 relative"></span>
                                 Available
                             </div>
                             
                             <img src={headshot} alt="Primary" className="w-full aspect-[4/5] object-cover rounded-2xl shadow-sm mb-3" />
                             
                             <div className="grid grid-cols-2 gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                 <img src={sideView} className="w-full aspect-[3/4] object-cover rounded-xl" alt="Side" />
                                 <img src={fullView} className="w-full aspect-[3/4] object-cover rounded-xl" alt="Full" />
                             </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><CheckCircle2 size={14} className="text-indigo-500"/> Manajemen Eksklusif</h3>
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center mb-4">
                                <p className="text-xs font-bold text-slate-500 mb-3 leading-relaxed">Seluruh kegiatan representasi komersial dikelola resmi oleh Orland Management.</p>
                                <button onClick={handleBooking} className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-3 rounded-xl font-black shadow-[0_4px_16px_rgba(37,211,102,0.25)] flex items-center justify-center gap-2 text-sm transition-transform hover:-translate-y-0.5">
                                    <MessageCircle size={18} /> Agen WhatsApp
                                </button>
                            </div>
                        </div>

                        {(talent.link_ig || talent.link_tiktok || talent.link_youtube) && (
                        <div className="pt-4 border-t border-slate-100">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Media Sosial Publik</h3>
                            <div className="flex flex-wrap gap-2">
                                {talent.link_ig && <a href={talent.link_ig} target="_blank" className="flex-1 flex justify-center items-center gap-2 py-2.5 bg-white border border-slate-200 rounded-full hover:bg-pink-50 hover:border-pink-200 hover:text-pink-600 text-slate-600 font-bold text-xs transition-colors shadow-sm"><Instagram size={14}/> IG</a>}
                                {talent.link_tiktok && <a href={talent.link_tiktok} target="_blank" className="flex-1 flex justify-center items-center gap-2 py-2.5 bg-white border border-slate-200 rounded-full hover:bg-slate-100 hover:border-slate-800 hover:text-black text-slate-600 font-bold text-xs transition-colors shadow-sm">TikTok</a>}
                            </div>
                        </div>
                        )}

                        <div className="mt-6 text-center text-[10px] font-bold text-slate-400">
                            ID PROFILE: <span className="font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded">{talent.talent_id}</span>
                        </div>
                    </div>
                </aside>

                {/* -----------------------------
                    MAIN CONTENT AREA
                ----------------------------- */}
                <main className="w-full min-w-0">

                    {/* Desktop Header Text (Hidden on Mobile) */}
                    <div className="hidden lg:flex justify-between items-end mb-8 border-b border-slate-200 pb-8">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-1.5 rounded-full text-sm font-black shadow-lg shadow-indigo-500/20 mb-4">
                                <Star size={16} fill="currentColor"/> {talent.category || 'Talent'}
                            </div>
                            <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-2 leading-none">{talent.full_name}</h1>
                            <div className="text-slate-500 font-bold flex items-center gap-2">
                                <MapPin size={16} className="text-slate-400"/> {talent.location || 'Indonesia'}
                            </div>
                        </div>
                        <div className="flex gap-3">
                             <button onClick={() => setWishlist(!wishlist)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all bg-white border shadow-sm ${wishlist ? 'border-rose-200 text-rose-500 bg-rose-50' : 'border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300'}`}>
                                 <Heart size={20} fill={wishlist ? "currentColor" : "none"} className={wishlist ? 'animate-bounce' : ''}/>
                             </button>
                             <button onClick={copyLink} className="w-12 h-12 rounded-full flex items-center justify-center transition-all bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 shadow-sm hover:-translate-y-1">
                                 <Share2 size={20} />
                             </button>
                        </div>
                    </div>

                    {/* EYE-CATCHING TABS (Sticky with Glassmorphism) */}
                    <div className="sticky top-0 lg:top-20 z-40 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xl py-4 -mx-4 px-4 sm:mx-0 sm:px-0 mb-6 lg:mb-10 overflow-x-auto no-scrollbar">
                         <div className="inline-flex bg-white dark:bg-slate-800 p-1.5 rounded-full border border-slate-200/60 shadow-sm min-w-max">
                              {[
                                { id: 'info', icon: <Fingerprint size={16}/>, label: 'Tentang' },
                                { id: 'photos', icon: <Camera size={16}/>, label: 'Portofolio' },
                                { id: 'assets', icon: <Film size={16}/>, label: 'Showreel' },
                                { id: 'credits', icon: <Award size={16}/>, label: 'Pengalaman' },
                              ].map(tab => (
                                 <button key={tab.id} onClick={() => setActiveTab(tab.id)} 
                                     className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-extrabold transition-all duration-300 ${activeTab === tab.id ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 -translate-y-0.5' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                                     {tab.icon} {tab.label}
                                 </button>
                              ))}
                         </div>
                    </div>

                    {/* TAB CONTENT RENDERER */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* TAB: INFO */}
                        {activeTab === 'info' && (
                            <div className="space-y-6">
                                
                                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                                    <h2 className="text-lg font-black text-slate-800 flex items-center gap-3 mb-6"><ShieldAlert className="text-indigo-500"/> Kategori & Kemampuan Spesialis</h2>
                                    
                                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Diminati Khusus (Interests)</h3>
                                    <div className="flex flex-wrap gap-2 mb-8">
                                        {interests.length > 0 ? interests.map((i: string, idx: number) => (
                                            <span key={idx} className="bg-blue-50 text-blue-700 border border-blue-100 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm"><CheckCircle2 size={14}/> {i}</span>
                                        )) : <span className="text-slate-400 font-bold">-</span>}
                                    </div>

                                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Kemampuan / Skills</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {skills.length > 0 ? skills.map((s: string, idx: number) => (
                                            <span key={idx} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm hover:border-indigo-300 hover:translate-y-[-2px] transition-all"><Play size={12} className="text-amber-500"/> {s}</span>
                                        )) : <span className="text-slate-400 font-bold">-</span>}
                                    </div>
                                </div>

                                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                                    <h2 className="text-lg font-black text-slate-800 flex items-center gap-3 mb-6"><Fingerprint className="text-indigo-500"/> Biometrik & Penampilan</h2>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 border-l-4 border-l-indigo-500">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tinggi</div>
                                            <div className="text-lg font-black text-slate-900">{talent.height ? `${talent.height} cm` : '-'}</div>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 border-l-4 border-l-purple-500">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Berat</div>
                                            <div className="text-lg font-black text-slate-900">{talent.weight ? `${talent.weight} kg` : '-'}</div>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 border-l-4 border-l-pink-500">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Usia / Umur</div>
                                            <div className="text-lg font-black text-slate-900">{getAge(talent.birth_date)} Thn</div>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 border-l-4 border-l-amber-500">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gender</div>
                                            <div className="text-lg font-black text-slate-900">{talent.gender || '-'}</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-4 mt-8 pt-6 border-t border-slate-100">
                                        <div><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ukuran Sepatu</div><div className="text-sm font-bold text-slate-800">{talent.shoe_size || '-'}</div></div>
                                        <div><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Baju / Celana</div><div className="text-sm font-bold text-slate-800">{talent.shirt_size || '-'} / {talent.pants_size || '-'}</div></div>
                                        <div><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Warna Mata & Rambut</div><div className="text-sm font-bold text-slate-800">{talent.eye_color || '-'} / {talent.hair_color || '-'}</div></div>
                                        <div className="col-span-full"><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hambatan Diet / Makanan</div><div className="text-sm font-bold text-slate-800">{talent.dietary_restrictions || 'Tidak ada'}</div></div>
                                        <div className="col-span-full"><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tato / Tindikan / Ciri Khusus</div><div className="text-sm font-bold text-slate-800">{talent.tattoos || 'Tidak ada spesifikasi'}</div></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: PHOTOS */}
                        {activeTab === 'photos' && (
                            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                                <h2 className="text-lg font-black text-slate-800 flex items-center gap-3 mb-6"><Camera className="text-indigo-500"/> Galeri Eksklusif</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                     {allPhotos.map((img, i) => (
                                         <a key={i} href={img} target="_blank" rel="noreferrer" className="aspect-square rounded-2xl overflow-hidden border border-slate-200 shadow-sm group relative block bg-slate-100">
                                             <img src={img} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Gallery item" />
                                             <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/20 transition-colors flex items-center justify-center">
                                                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all text-indigo-600 shadow-lg">
                                                     <i className="fa-solid fa-expand"></i>
                                                 </div>
                                             </div>
                                         </a>
                                     ))}
                                </div>
                            </div>
                        )}

                        {/* TAB: ASSETS (VIDEO/AUDIO) */}
                        {activeTab === 'assets' && (
                            <div className="space-y-6">
                                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                                    <h2 className="text-lg font-black text-slate-800 flex items-center gap-3 mb-6"><Youtube className="text-rose-500"/> Video Showreel / Compilations</h2>
                                    
                                    {ytLinks.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            {ytLinks.map((link: string, i: number) => {
                                                const vidId = getYoutubeId(link);
                                                if(!vidId) return null;
                                                return (
                                                    <div key={i} className="aspect-video bg-black rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative group cursor-pointer hover:-translate-y-1 transition-all">
                                                        {/* Fake Thumbnail Overlay -> iFrame swapping logic skipped for React, just direct iframe for simplicity and robustness */}
                                                        <iframe src={`https://www.youtube.com/embed/${vidId}?rel=0`} title="YouTube" frameBorder="0" allowFullScreen loading="lazy" className="absolute w-full h-full inset-0 z-10" />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div className="py-12 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center text-slate-400">
                                            <VideoOff size={40} className="mb-4 opacity-50" />
                                            <p className="font-extrabold text-sm">Belum ada video showreel.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                                    <h2 className="text-lg font-black text-slate-800 flex items-center gap-3 mb-6"><Music className="text-purple-500"/> Rekaman Suara / Voice Over</h2>
                                    
                                    {audioLinks.length > 0 ? (
                                        <div className="space-y-4">
                                            {audioLinks.map((url: string, i: number) => (
                                                <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 hover:border-indigo-300 transition-colors shadow-sm">
                                                    <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                                        <Music size={20} />
                                                    </div>
                                                    <div className="flex-1 w-full">
                                                        <div className="font-bold text-slate-800 text-sm mb-2">Voice Over / Sampel Vokal #{i+1}</div>
                                                        {/* Native Audio Player stylized */}
                                                        <audio controls className="w-full h-10 outline-none">
                                                            <source src={url} />
                                                        </audio>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-12 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center text-slate-400">
                                            <MicOff size={40} className="mb-4 opacity-50" />
                                            <p className="font-extrabold text-sm">Belum ada sampel suara.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB: CREDITS */}
                        {activeTab === 'credits' && (
                            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                                <h2 className="text-lg font-black text-slate-800 flex items-center gap-3 mb-8"><Briefcase className="text-indigo-500"/> Riwayat Profesional / Pengalaman</h2>
                                
                                {credits.length > 0 ? (
                                    <div className="relative pl-4 space-y-10 before:absolute border-l-2 border-indigo-100 dark:border-slate-800 ml-4 lg:ml-6">
                                        {credits.map((c: any, i: number) => (
                                            <div key={i} className="relative pl-6 lg:pl-8 group">
                                                <div className="absolute w-4 h-4 rounded-full bg-white border-[4px] border-indigo-500 -left-[25px] top-1 shadow-[0_0_0_4px_rgba(99,102,241,0.15)] group-hover:border-pink-500 group-hover:shadow-[0_0_0_6px_rgba(236,72,153,0.15)] transition-all z-10" />
                                                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm group-hover:shadow-lg group-hover:-translate-y-1 group-hover:border-indigo-100 transition-all">
                                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                                                        <div>
                                                            <h3 className="text-lg font-black text-slate-800 leading-tight mb-1">{c.title}</h3>
                                                            <div className="text-sm font-bold text-slate-500 flex items-center gap-2"><Briefcase size={14}/> {c.company}</div>
                                                        </div>
                                                        <div className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-lg text-xs font-black whitespace-nowrap">
                                                            {c.year}
                                                        </div>
                                                    </div>
                                                    {c.description && (
                                                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-medium text-slate-600 leading-relaxed">
                                                            {c.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-16 flex flex-col items-center text-center">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
                                            <Award size={40} />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800 mb-2">Memulai Langkah Baru</h3>
                                        <p className="text-slate-500 font-medium">Talent ini tengah membangun portofolionya bersama Orland Management.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                </main>
            </div>
        </div>

        {/* BOTTOM MOBILE FLOATING CTA */}
        <div className="lg:hidden fixed bottom-0 left-0 w-full z-50 bg-white/90 backdrop-blur-xl border-t border-slate-200 p-4 pb-6 px-6">
            <button onClick={handleBooking} className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-4 rounded-2xl font-black shadow-[0_8px_24px_rgba(37,211,102,0.3)] flex items-center justify-center gap-2 transition-transform active:scale-95">
                <MessageCircle size={20} /> CHAT AGEN UNTUK BOOKING
            </button>
        </div>

    </div>
  )
}
