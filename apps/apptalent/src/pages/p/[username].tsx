import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Instagram, Youtube, Facebook, Download, MessageCircle, Star, 
  ChevronLeft, MapPin, CheckCircle2, Play, Fingerprint, Camera, 
  Film, Award, Music, Briefcase, ChevronRight, Share2, Heart, ArrowLeft, Ghost, VideoOff, MicOff, ShieldAlert, X
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function PublicProfile() {
  const { username } = useParams();
  const [talent, setTalent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [wishlist, setWishlist] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  
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
             // Fake delay for elegant loader
             setTimeout(() => setLoading(false), 800);
         }
     };

     if (username) fetchTalentInfo();
  }, [username]);

  // Handle Default Hero Image URL fallback with ui-avatars so no external random image is used
  const placeholderImg = `https://ui-avatars.com/api/?name=${encodeURIComponent(talent?.full_name || 'Talent')}&size=800&background=f1f5f9&color=64748b&font-size=0.15&length=2`;
  const headshot = talent?.headshot || placeholderImg;
  const sideView = talent?.close_up || null;
  const fullView = talent?.full_height || null;
  
  const mobileGallery = [headshot, sideView, fullView].filter(Boolean);
  let allPhotos = [...mobileGallery];
  if(Array.isArray(talent?.additional_photos)) {
      allPhotos = [...allPhotos, ...talent.additional_photos];
  }

  // Handle Mobile Auto Slide
  useEffect(() => {
    if (!talent || mobileGallery.length <= 1) return;
    const interval = setInterval(() => {
        setSlideIdx((prev) => (prev + 1) % mobileGallery.length);
    }, 4500); // Slower, more elegant
    return () => clearInterval(interval);
  }, [talent, mobileGallery.length]);

  const nextSlide = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSlideIdx((prev) => (prev + 1) % mobileGallery.length);
  };

  const prevSlide = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSlideIdx((prev) => (prev - 1 + mobileGallery.length) % mobileGallery.length);
  };

  const handleBooking = () => {
    const message = `Halo Agen Orland Management, saya tertarik untuk booking talent:\nNama: ${talent?.full_name}\nID: ${talent?.talent_id}\nMohon infokan rate card & jadwalnya.\nURL: ${window.location.href}`;
    window.open(`https://wa.me/62895627251703?text=${encodeURIComponent(message)}`, '_blank');
  };

  const downloadCompCard = () => {
    // For now trigger browser print to export to PDF
    window.print();
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
              <div className="w-24 h-24 sm:w-32 sm:h-32 mb-8 animate-pulse relative">
                 <div className="w-full h-full rounded-3xl bg-gradient-to-br from-indigo-600 to-pink-500 flex items-center justify-center text-white text-4xl sm:text-5xl font-black shadow-2xl shadow-indigo-500/20">OM</div>
                 <div className="absolute -inset-4 border-2 border-slate-100 rounded-[40px] animate-ping" style={{animationDuration: '2s'}}></div>
              </div>
              <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
              <p className="font-extrabold text-slate-400 tracking-widest uppercase text-xs">Memuat Talent Eksklusif...</p>
          </div>
      );
  }

  if (!talent && !loading) {
      return (
          <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
              <div className="bg-white p-10 rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] text-center max-w-md w-full border border-slate-200">
                  <Ghost className="mx-auto text-slate-300 w-24 h-24 mb-6" />
                  <h2 className="text-2xl font-black text-slate-900 mb-2">Profil Tidak Ditemukan</h2>
                  <p className="text-slate-500 mb-8 font-medium">URL profil yang Anda minta tidak terdaftar atau telah diarsipkan (private).</p>
                  <a href="/" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3.5 rounded-xl font-black shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 hover:scale-105 transition-all">
                      <ArrowLeft size={18} /> Kembali ke Directory
                  </a>
              </div>
          </div>
      );
  }

  const interests = Array.isArray(talent.interests) ? talent.interests : [];
  const skills = Array.isArray(talent.skills) ? talent.skills : [];
  const ytLinks = Array.isArray(talent.showreels) ? talent.showreels : [];
  const audioLinks = Array.isArray(talent.audios) ? talent.audios : [];
  const credits = Array.isArray(talent.experiences) ? talent.experiences : [];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#080d19] font-sans selection:bg-indigo-500 selection:text-white lg:pb-32 pb-[140px]">
        
        {/* LIGHTBOX MODAL */}
        {lightboxImg && (
            <div className="fixed inset-0 z-[99999] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-10 animate-in fade-in duration-200" onClick={() => setLightboxImg(null)}>
                <button className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white hover:text-rose-400 transition-all z-50">
                    <X size={24}/>
                </button>
                <img src={lightboxImg} className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-2xl" onClick={e => e.stopPropagation()} alt="Lightbox" />
            </div>
        )}

        {/* DESKTOP STICKY BRAND HEADER */}
        <nav className="hidden lg:flex fixed top-0 left-0 w-full z-[100] bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all h-20 items-center justify-between px-8 max-w-[1600px] mx-auto right-0">
             <a href="/" className="flex items-center gap-3 group">
                 <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-pink-500 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/20 group-hover:shadow-pink-500/40 transition-shadow">OM</div>
                 <span className="font-extrabold text-slate-900 text-xl tracking-tight transition-colors">ORLAND<span className="font-light text-slate-500">MANAGEMENT</span></span>
             </a>
             <button onClick={downloadCompCard} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-full transition-colors border border-slate-200">
                 <Download size={16} /> Unduh Profil PDF
             </button>
        </nav>

        {/* MOBILE COMPACT HEADER */}
        <nav className="lg:hidden absolute top-0 left-0 w-full z-30 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
             <a href="/" className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 text-white shadow-lg">
                 <ArrowLeft size={20} />
             </a>
             <button onClick={downloadCompCard} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 text-white shadow-lg">
                 <Download size={18} />
             </button>
        </nav>

        {/* MOBILE SLIDER HERO */}
        <div className="lg:hidden relative w-full h-[70vh] min-h-[500px] bg-black overflow-hidden group">
             {/* Slider Controls Layer Tools */}
             <div className="absolute top-20 right-4 z-20 flex flex-col gap-3">
                 <button onClick={() => setWishlist(!wishlist)} className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg transition-all ${wishlist ? 'bg-rose-500 border-rose-400 text-white' : 'bg-white/20 border-white/30 text-white hover:bg-white/40'}`}>
                     <Heart size={20} fill={wishlist ? "currentColor" : "none"} className={wishlist ? 'animate-bounce' : ''}/>
                 </button>
                 <button onClick={copyLink} className="w-11 h-11 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 text-white shadow-lg transition-all">
                     <Share2 size={20} />
                 </button>
             </div>

             <div className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]" style={{ transform: `translateX(-${slideIdx * 100}%)` }}>
                 <div className="flex h-full" style={{width: `${mobileGallery.length * 100}%`}}>
                     {mobileGallery.map((img, i) => (
                         <div key={i} className="w-full h-full relative" onClick={() => setLightboxImg(img)}>
                             <img src={img} alt="Hero" className="w-[100vw] h-full object-cover" />
                             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-[#080d19]"></div>
                         </div>
                     ))}
                 </div>
             </div>

             {/* Slider Arrow Left & Right */}
             {mobileGallery.length > 1 && (
                 <>
                     <button onClick={prevSlide} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center text-white/50 hover:text-white transition-colors bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-sm">
                         <ChevronLeft size={24} />
                     </button>
                     <button onClick={nextSlide} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center text-white/50 hover:text-white transition-colors bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-sm">
                         <ChevronRight size={24} />
                     </button>
                 </>
             )}

             {/* Slider Dots */}
             <div className="absolute bottom-[160px] left-6 z-20 flex gap-2">
                 {mobileGallery.map((_, i) => (
                     <div key={i} onClick={(e)=>{ e.stopPropagation(); setSlideIdx(i); }} className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${i === slideIdx ? 'bg-pink-500 w-8 shadow-[0_0_12px_rgba(236,72,153,0.8)]' : 'bg-white/40 w-2 hover:bg-white/80'}`} />
                 ))}
             </div>

             {/* Info Layer */}
             <div className="absolute bottom-0 left-0 w-full p-6 pt-16 z-20 text-white bg-gradient-to-t from-black via-black/80 to-transparent">
                 <div className="inline-flex items-center gap-2 bg-indigo-600 border border-indigo-400/50 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold mb-3 shadow-lg">
                     <Star size={14} className="text-white" fill="currentColor"/> 
                     <span className="uppercase tracking-widest opacity-95">{talent.category || 'General Talent'}</span>
                 </div>
                 <h1 className="text-[40px] leading-[1.1] font-black tracking-tighter mb-4 drop-shadow-lg">{talent.full_name}</h1>
             </div>
        </div>

        {/* CONTAINER SPLIT DESKTOP */}
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 lg:pt-32 pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 xl:gap-14 items-start">
                
                {/* -----------------------------
                    SIDEBAR (DESKTOP ONLY)
                ----------------------------- */}
                <aside className="hidden lg:block sticky top-28 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-[32px] p-6 border border-slate-200/80 dark:border-slate-700 shadow-[0_10px_40px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_50px_rgba(79,70,229,0.06)] transition-shadow">
                        
                        {/* Status Badge & Profile Photos */}
                        <div className="relative mb-6">
                             <div className="absolute -top-3 -left-3 z-10 bg-white/95 backdrop-blur-xl px-4 py-2 rounded-full border border-slate-100 shadow-xl flex items-center gap-2 font-black text-xs text-emerald-600 uppercase tracking-widest">
                                 <span className="relative flex h-2 w-2">
                                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                   <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                 </span>
                                 Available
                             </div>
                             
                             <div className="relative group cursor-zoom-in rounded-3xl overflow-hidden shadow-sm" onClick={() => setLightboxImg(headshot)}>
                                <img src={headshot} alt="Primary" className="w-full aspect-[4/5] object-cover group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                             </div>
                             
                             {(sideView || fullView) && (
                                 <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2 rounded-[24px] border border-slate-100 mt-4">
                                     {sideView && (
                                         <div className="aspect-[3/4] rounded-2xl overflow-hidden cursor-zoom-in relative group" onClick={() => setLightboxImg(sideView)}>
                                             <img src={sideView} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Side" />
                                         </div>
                                     )}
                                     {fullView && (
                                         <div className="aspect-[3/4] rounded-2xl overflow-hidden cursor-zoom-in relative group" onClick={() => setLightboxImg(fullView)}>
                                             <img src={fullView} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Full" />
                                         </div>
                                     )}
                                 </div>
                             )}
                        </div>

                        <div className="pt-6 border-t border-slate-100">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><CheckCircle2 size={16} className="text-indigo-500"/> Manajemen Eksklusif</h3>
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-center mb-0">
                                <MessageCircle size={32} className="mx-auto text-emerald-500 mb-3 opacity-80" />
                                <p className="text-[13px] font-bold text-slate-500 mb-4 leading-relaxed">Seluruh kegiatan Booking talent ini dikelola resmi dan aman oleh Tim Orland Management.</p>
                                <button onClick={handleBooking} className="w-full bg-[#25D366] hover:bg-[#20bd5a] hover:scale-105 text-white py-3.5 rounded-xl font-black shadow-[0_4px_16px_rgba(37,211,102,0.25)] flex items-center justify-center gap-2 text-[15px] transition-all">
                                    <MessageCircle size={20} /> Hubungi via WhatsApp
                                </button>
                            </div>
                        </div>

                        {(talent.link_ig || talent.link_tiktok || talent.link_youtube) && (
                        <div className="pt-6 mt-6 border-t border-slate-100">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Media Sosial Publik</h3>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {talent.link_ig && <a href={talent.link_ig} target="_blank" className="w-12 h-12 flex justify-center items-center bg-white border border-slate-200 rounded-full hover:bg-pink-50 hover:border-pink-200 hover:text-pink-600 text-slate-400 transition-colors shadow-sm"><Instagram size={20}/></a>}
                                {talent.link_tiktok && <a href={talent.link_tiktok} target="_blank" className="w-12 h-12 flex justify-center items-center bg-white border border-slate-200 rounded-full hover:bg-slate-100 hover:border-slate-800 hover:text-black text-slate-400 transition-colors shadow-sm"><strong className="font-serif">t</strong></a>}
                                {talent.link_youtube && <a href={talent.link_youtube} target="_blank" className="w-12 h-12 flex justify-center items-center bg-white border border-slate-200 rounded-full hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-400 transition-colors shadow-sm"><Youtube size={20}/></a>}
                            </div>
                        </div>
                        )}

                        <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-400">
                            <span>ID PROFILE:</span>
                            <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">{talent.talent_id}</span>
                        </div>
                    </div>
                </aside>

                {/* -----------------------------
                    MAIN CONTENT AREA
                ----------------------------- */}
                <main className="w-full min-w-0">

                    {/* Desktop Header Text (Hidden on Mobile) */}
                    <div className="hidden lg:flex justify-between items-end mb-8">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-pink-500 text-white px-4 py-1.5 rounded-full text-sm font-black shadow-lg shadow-pink-500/20 mb-5">
                                <Star size={16} fill="currentColor"/> {talent.category || 'Professional Talent'}
                            </div>
                            <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-4 leading-none">{talent.full_name}</h1>
                            <div className="text-slate-500 font-bold flex items-center gap-2 text-lg">
                                <MapPin size={18} className="text-indigo-400"/> {talent.location || 'Indonesia'}
                            </div>
                        </div>
                        <div className="flex gap-3 mb-2">
                             <button onClick={() => setWishlist(!wishlist)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all bg-white border shadow-sm ${wishlist ? 'border-rose-200 text-rose-500 bg-rose-50 shadow-rose-200' : 'border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-300 hover:shadow-md'}`}>
                                 <Heart size={24} fill={wishlist ? "currentColor" : "none"} className={wishlist ? 'animate-bounce' : ''}/>
                             </button>
                             <button onClick={copyLink} className="w-14 h-14 rounded-full flex items-center justify-center transition-all bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 shadow-sm hover:-translate-y-1 hover:shadow-md">
                                 <Share2 size={24} />
                             </button>
                        </div>
                    </div>

                    {/* EYE-CATCHING TABS (Sticky with Glassmorphism) */}
                    <div className="sticky top-0 lg:top-[80px] z-40 bg-[#f8fafc]/90 dark:bg-slate-900/90 backdrop-blur-xl pt-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 mb-6 lg:mb-10 overflow-x-auto no-scrollbar border-b border-slate-200/50 lg:border-none">
                         <div className="inline-flex bg-white dark:bg-slate-800 p-1.5 rounded-full border border-slate-200 shadow-sm min-w-max relative gap-1">
                              {[
                                { id: 'info', icon: <Fingerprint size={18}/>, label: 'Tentang' },
                                { id: 'photos', icon: <Camera size={18}/>, label: 'Portofolio' },
                                { id: 'assets', icon: <Film size={18}/>, label: 'Showreel' },
                                { id: 'credits', icon: <Award size={18}/>, label: 'Pengalaman' },
                              ].map(tab => (
                                 <button key={tab.id} onClick={() => setActiveTab(tab.id)} 
                                     className={`flex items-center gap-2 px-6 py-3 rounded-full text-[15px] font-black transition-all duration-300 ${activeTab === tab.id ? 'bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white shadow-[0_8px_20px_rgba(79,70,229,0.3)] scale-100 z-10' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:scale-105'}`}>
                                     {tab.icon} {tab.label}
                                 </button>
                              ))}
                         </div>
                    </div>

                    {/* TAB CONTENT RENDERER */}
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                        {/* TAB: INFO */}
                        {activeTab === 'info' && (
                            <div className="space-y-6 sm:space-y-8">
                                
                                <div className="bg-white rounded-[32px] p-6 sm:p-10 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-slate-200 transition-colors">
                                    <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                                            <ShieldAlert size={20}/>
                                        </div>
                                        Kategori Spesialis
                                    </h2>
                                    
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Diminati Khusus (Interests)</h3>
                                    <div className="flex flex-wrap gap-2 mb-8">
                                        {interests.length > 0 ? interests.map((i: string, idx: number) => (
                                            <span key={idx} className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-5 py-2.5 rounded-full text-xs font-black flex items-center gap-2 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all cursor-default"><CheckCircle2 size={16}/> {i}</span>
                                        )) : <span className="text-slate-400 font-bold">-</span>}
                                    </div>

                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Kemampuan Khusus (Skills)</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {skills.length > 0 ? skills.map((s: string, idx: number) => (
                                            <span key={idx} className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-full text-xs font-black flex items-center gap-2 shadow-sm hover:border-pink-300 hover:text-pink-600 hover:-translate-y-1 hover:shadow-md transition-all cursor-default"><Play size={14} className="text-pink-500"/> {s}</span>
                                        )) : <span className="text-slate-400 font-bold">-</span>}
                                    </div>
                                </div>

                                <div className="bg-white rounded-[32px] p-6 sm:p-10 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-slate-200 transition-colors">
                                    <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                            <Fingerprint size={20}/>
                                        </div>
                                        Biometrik & Penampilan
                                    </h2>
                                    
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                        <div className="group bg-slate-50 border border-slate-100 rounded-2xl p-5 border-l-4 border-l-indigo-500 hover:bg-indigo-50 hover:border-indigo-200 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-default">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-indigo-500 transition-colors">Tinggi</div>
                                            <div className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-indigo-700">{talent.height ? `${talent.height} cm` : '-'}</div>
                                        </div>
                                        <div className="group bg-slate-50 border border-slate-100 rounded-2xl p-5 border-l-4 border-l-pink-500 hover:bg-pink-50 hover:border-pink-200 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-default">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-pink-500 transition-colors">Berat</div>
                                            <div className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-pink-700">{talent.weight ? `${talent.weight} kg` : '-'}</div>
                                        </div>
                                        <div className="group bg-slate-50 border border-slate-100 rounded-2xl p-5 border-l-4 border-l-amber-500 hover:bg-amber-50 hover:border-amber-200 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-default">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-amber-500 transition-colors">Usia / Umur</div>
                                            <div className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-amber-700">{getAge(talent.birth_date)} Thn</div>
                                        </div>
                                        <div className="group bg-slate-50 border border-slate-100 rounded-2xl p-5 border-l-4 border-l-emerald-500 hover:bg-emerald-50 hover:border-emerald-200 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-default">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-emerald-500 transition-colors">Gender</div>
                                            <div className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-emerald-700 text-capitalize">{talent.gender || '-'}</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-6 mt-10 pt-8 border-t border-slate-100">
                                        <div className="hover:px-2 transition-all"><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><ChevronRight size={12}/> Ukuran Sepatu</div><div className="text-sm font-black text-slate-700">{talent.shoe_size || '-'}</div></div>
                                        <div className="hover:px-2 transition-all"><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><ChevronRight size={12}/> Baju / Celana</div><div className="text-sm font-black text-slate-700">{talent.shirt_size || '-'} / {talent.pants_size || '-'}</div></div>
                                        <div className="hover:px-2 transition-all"><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><ChevronRight size={12}/> Warna Mata & Rambut</div><div className="text-sm font-black text-slate-700">{talent.eye_color || '-'} / {talent.hair_color || '-'}</div></div>
                                        
                                        <div className="col-span-full bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><AlertCircle size={14} className="text-rose-400"/> Hambatan Diet / Makanan</div>
                                            <div className="text-sm font-black text-slate-700">{talent.dietary_restrictions || 'Tidak ada pantangan khusus.'}</div>
                                        </div>
                                        
                                        <div className="col-span-full sm:col-span-2">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><ChevronRight size={12}/> Tato / Tindik Khusus</div>
                                            <div className="text-sm font-black text-slate-700 bg-white p-3 border border-slate-200 rounded-xl inline-block mt-1">{talent.tattoos || 'Tidak ada modifikasi profil spesifik.'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: PHOTOS */}
                        {activeTab === 'photos' && (
                            <div className="bg-white rounded-[32px] p-6 sm:p-10 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-slate-200 transition-colors">
                                <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                                        <Camera size={20}/>
                                    </div>
                                    Galeri Foto Portofolio
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
                                     {allPhotos.map((img, i) => (
                                         <div key={i} onClick={() => setLightboxImg(img)} className="aspect-[3/4] rounded-3xl overflow-hidden border border-slate-200 shadow-sm group relative block bg-slate-100 cursor-zoom-in">
                                             <img src={img} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.15]" alt="Gallery item" />
                                             <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/30 transition-colors flex items-center justify-center backdrop-blur-[0px] group-hover:backdrop-blur-sm">
                                                 <div className="w-14 h-14 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all text-indigo-600 shadow-xl">
                                                     <i className="fa-solid fa-expand text-xl"></i>
                                                 </div>
                                             </div>
                                         </div>
                                     ))}
                                </div>
                            </div>
                        )}

                        {/* TAB: ASSETS (VIDEO/AUDIO) */}
                        {activeTab === 'assets' && (
                            <div className="space-y-6 sm:space-y-8">
                                <div className="bg-white rounded-[32px] p-6 sm:p-10 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-slate-200 transition-colors">
                                    <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                                            <Youtube size={20}/>
                                        </div>
                                        Video Showreel / Compilations
                                    </h2>
                                    
                                    {ytLinks.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            {ytLinks.map((link: string, i: number) => {
                                                const vidId = getYoutubeId(link);
                                                if(!vidId) return null;
                                                return (
                                                    <div key={i} className="aspect-video bg-black rounded-[24px] overflow-hidden border border-slate-200 shadow-sm relative group cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-500/10 transition-all">
                                                        <iframe src={`https://www.youtube.com/embed/${vidId}?rel=0`} title="YouTube" frameBorder="0" allowFullScreen loading="lazy" className="absolute w-full h-full inset-0 z-10" />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div className="py-16 border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-[32px] flex flex-col items-center text-slate-400">
                                            <VideoOff size={48} className="mb-4 opacity-50" />
                                            <p className="font-extrabold text-sm uppercase tracking-widest text-slate-500">Belum ada tayangan video showreel.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white rounded-[32px] p-6 sm:p-10 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-slate-200 transition-colors">
                                    <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                                            <Music size={20}/>
                                        </div>
                                        Rekaman Suara / Voice Over
                                    </h2>
                                    
                                    {audioLinks.length > 0 ? (
                                        <div className="space-y-4">
                                            {audioLinks.map((url: string, i: number) => (
                                                <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 hover:border-purple-300 hover:bg-purple-50 hover:-translate-y-0.5 hover:shadow-md transition-all">
                                                    <div className="w-14 h-14 rounded-full bg-white border border-slate-200 text-purple-600 flex items-center justify-center shrink-0 shadow-sm">
                                                        <Music size={24} />
                                                    </div>
                                                    <div className="flex-1 w-full">
                                                        <div className="font-black text-slate-800 text-[15px] mb-2 tracking-tight">Vocal Sample Track #{i+1}</div>
                                                        <audio controls className="w-full h-10 outline-none rounded-full">
                                                            <source src={url} />
                                                        </audio>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-16 border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-[32px] flex flex-col items-center text-slate-400">
                                            <MicOff size={48} className="mb-4 opacity-50" />
                                            <p className="font-extrabold text-sm uppercase tracking-widest text-slate-500">Belum ada sampel rekaman suara.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB: CREDITS */}
                        {activeTab === 'credits' && (
                            <div className="bg-white rounded-[32px] p-6 sm:p-10 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-slate-200 transition-colors">
                                <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-3 mb-10">
                                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                        <Briefcase size={20}/>
                                    </div>
                                    Rekam Pengalaman Kerja Bersejarah
                                </h2>
                                
                                {credits.length > 0 ? (
                                    <div className="relative pl-4 space-y-10 before:absolute border-l-[3px] border-indigo-100 dark:border-slate-800 ml-4 lg:ml-6 pb-4">
                                        {credits.map((c: any, i: number) => (
                                            <div key={i} className="relative pl-6 lg:pl-10 group">
                                                {/* Timeline Node Base */}
                                                <div className="absolute w-5 h-5 rounded-full bg-white border-[5px] border-indigo-400 -left-[27px] top-1 shadow-[0_0_0_5px_rgba(99,102,241,0.1)] group-hover:border-pink-500 group-hover:shadow-[0_0_0_7px_rgba(236,72,153,0.15)] group-hover:scale-125 transition-all duration-300 z-10" />
                                                
                                                <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm group-hover:shadow-[0_15px_40px_rgba(79,70,229,0.08)] group-hover:-translate-y-1.5 group-hover:border-indigo-100 transition-all duration-500">
                                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5">
                                                        <div>
                                                            <h3 className="text-xl font-black text-slate-900 leading-tight mb-2 tracking-tight">{c.title}</h3>
                                                            <div className="text-[13px] font-black tracking-widest uppercase text-slate-500 flex items-center gap-2"><Briefcase size={14} className="text-indigo-400"/> {c.company}</div>
                                                        </div>
                                                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-100/50 px-4 py-1.5 rounded-xl text-sm font-black whitespace-nowrap shadow-inner">
                                                            {c.year}
                                                        </div>
                                                    </div>
                                                    {c.description && (
                                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-[15px] font-medium text-slate-600 leading-relaxed group-hover:bg-indigo-50/50 transition-colors">
                                                            {c.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-20 flex flex-col items-center text-center bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-200">
                                        <div className="w-24 h-24 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] rounded-full flex items-center justify-center text-slate-300 mb-6">
                                            <Award size={48} className="text-indigo-300"/>
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Memulai Langkah Baru</h3>
                                        <p className="text-slate-500 font-medium max-w-sm">Talent ini tengah membangun portofolio kebanggaannya bersama Orland Management.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                </main>
            </div>
        </div>

        {/* BOTTOM MOBILE FLOATING CTA */}
        <div className="lg:hidden fixed bottom-0 left-0 w-full z-50 bg-white/95 backdrop-blur-2xl border-t border-slate-200/80 p-4 pb-8 px-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <button onClick={handleBooking} className="w-full bg-gradient-to-r from-[#25D366] to-[#1ebd5a] text-white py-4 rounded-[20px] font-black shadow-[0_8px_24px_rgba(37,211,102,0.35)] flex items-center justify-center gap-2 transition-transform active:scale-95 text-[15px] tracking-wide">
                <MessageCircle size={22} /> CHAT AGEN UNTUK BOOKING
            </button>
        </div>

    </div>
  )
}
// Adding AlertCircle component manually to prevent import error
const AlertCircle = ({ size, className }: { size: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);
