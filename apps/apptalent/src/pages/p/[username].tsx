import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Instagram, Youtube, Twitter, Download, MessageCircle, Star, ChevronLeft, MapPin, CheckCircle2, Play } from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function PublicProfile() {
  const { username } = useParams();
  const [talent, setTalent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     const fetchTalentInfo = async () => {
         setLoading(true);
         try {
             // Assuming username in URL is actually the talent_id for precise queries
             const res: any = await apiRequest(`/public/talents/${username}`);
             if (res.status === 'ok') {
                 setTalent(res.data);
             } else {
                 console.error("Failed to load talent:", res.message);
                 setTalent(null); // Will trigger fallback or not found state if implemented
             }
         } catch (error) {
             console.error("API error", error);
         } finally {
             setLoading(false);
         }
     };

     if (username) fetchTalentInfo();
  }, [username]);

  const handleBooking = () => {
    const message = `Halo Orland Management, saya tertarik untuk bekerja sama dengan talent: ${talent?.full_name}. Boleh infokan rate card & jadwalnya?`;
    window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Extract Youtube ID
  const getYoutubeId = (url: string) => {
      const match = url?.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
      return (match && match[2].length === 11) ? match[2] : null;
  };

  if (loading || !talent) {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
              <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-bold text-slate-500 animate-pulse">Memuat Profil Talent...</p>
          </div>
      );
  }

  // Compile all photos
  const gallery = [talent.side_view, talent.full_height, ...(talent.additional_photos || [])].filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d19] font-sans selection:bg-brand-500 selection:text-white pb-32">
        
        {/* PUBLIC HEADER NAV */}
        <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
            <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                <a href="/" className="text-slate-900 dark:text-white font-extrabold text-xl tracking-tighter flex items-center gap-2">
                    ORLAND<span className="font-light text-slate-500">TALENT</span>
                </a>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white text-xs font-bold rounded-full transition-colors border border-slate-200 dark:border-slate-700">
                    <Download size={14} /> Comp Card
                </button>
            </div>
        </nav>

        {/* HERO SECTION */}
        <div className="pt-24 px-4 md:px-8 max-w-6xl mx-auto mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 xl:gap-12 items-end">
                <div>
                   <div className="flex items-center gap-2 mb-3">
                       <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1.5"><CheckCircle2 size={14}/> Verified Pro</span>
                       {talent.location && <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"><MapPin size={12}/> {talent.location}</span>}
                   </div>
                   <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white leading-none tracking-tighter mb-4">{talent.full_name}</h1>
                   <p className="text-brand-600 dark:text-brand-400 font-extrabold tracking-widest uppercase text-sm md:text-lg">{talent.category}</p>
                </div>

                {/* Main Headshot Image - Elegant Float */}
                 <div className="hidden lg:block relative z-10 -mb-20">
                     <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800">
                         <img src={talent.headshot} alt={talent.full_name} className="w-full h-full object-cover object-center" />
                     </div>
                     {/* Decorative Elements */}
                     <div className="absolute -z-10 top-10 -right-10 w-full h-full bg-brand-500 rounded-3xl opacity-10 blur-2xl"></div>
                 </div>
            </div>
        </div>

        {/* MAIN CONTENT DIVIDER */}
        <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 xl:gap-12">
                
                {/* LEFT CONTENT AREA */}
                <div className="space-y-12">
                    
                    {/* Mobile Headshot */}
                    <div className="lg:hidden relative aspect-[3/4] rounded-3xl overflow-hidden shadow-xl mb-8">
                         <img src={talent.headshot} alt={talent.full_name} className="w-full h-full object-cover object-center" />
                    </div>

                    {/* BIO */}
                    <section>
                        <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">About</h3>
                        <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{talent.bio}</p>
                    </section>
                    
                    {/* SHOWREELS (YOUTUBE) */}
                    {talent.showreels?.length > 0 && (
                    <section>
                        <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Play size={16}/> Showreels</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {talent.showreels.map((url: string, idx: number) => {
                                const vidId = getYoutubeId(url);
                                if (!vidId) return null;
                                return (
                                    <div key={idx} className="w-full aspect-video rounded-2xl overflow-hidden shadow-sm bg-black group relative">
                                        <iframe 
                                            src={`https://www.youtube.com/embed/${vidId}?rel=0`} 
                                            title="YouTube" frameBorder="0" allowFullScreen loading="lazy"
                                            className="absolute inset-0 w-full h-full z-10"
                                        ></iframe>
                                    </div>
                                )
                            })}
                        </div>
                    </section>
                    )}

                    {/* GALLERY */}
                    {gallery.length > 0 && (
                    <section>
                        <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Portfolio Gallery</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {gallery.map((img: string, idx: number) => (
                                <div key={idx} className="aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer group shadow-sm bg-slate-100 dark:bg-slate-800">
                                    <img src={img} alt={`Gallery ${idx}`} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                            ))}
                        </div>
                    </section>
                    )}

                    {/* EXPERIENCE TIMELINE */}
                    {talent.experiences?.length > 0 && (
                    <section className="bg-white dark:bg-slate-800/50 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700/50 shadow-sm">
                        <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-8">Work Experience</h3>
                        <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-8">
                            {talent.experiences.map((exp: any, i: number) => (
                                <div key={i} className="relative pl-8 group">
                                    <div className="absolute w-3.5 h-3.5 rounded-full bg-white dark:bg-slate-800 border-2 border-brand-500 -left-[9px] top-1.5" />
                                    <div>
                                        <div className="inline-block bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs font-black px-3 py-1 rounded-lg mb-2">
                                           {exp.year}
                                        </div>
                                        <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{exp.title}</h4>
                                        <p className="text-xs font-black tracking-widest uppercase text-brand-600 dark:text-brand-400 mb-2">{exp.company}</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">{exp.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                    )}
                </div>

                {/* RIGHT SIDEBAR (Sticky Info) */}
                <aside className="lg:mt-40 space-y-6">
                    
                    {/* STATS CARD */}
                    <div className="bg-white dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Physical Attributes</h3>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 flex flex-col items-center text-center justify-center border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Height</span>
                                <span className="text-xl font-black text-slate-900 dark:text-white">{talent.height} <span className="text-xs text-slate-400 font-bold">cm</span></span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 flex flex-col items-center text-center justify-center border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Weight</span>
                                <span className="text-xl font-black text-slate-900 dark:text-white">{talent.weight} <span className="text-xs text-slate-400 font-bold">kg</span></span>
                            </div>
                        </div>

                        <ul className="space-y-3 text-sm divide-y divide-slate-100 dark:divide-slate-800">
                            {talent.gender && <li className="flex justify-between pt-3"><span className="text-slate-500 font-medium">Gender</span><span className="font-bold text-slate-900 dark:text-white">{talent.gender}</span></li>}
                            {talent.ethnicity && <li className="flex justify-between pt-3"><span className="text-slate-500 font-medium">Ethnicity</span><span className="font-bold text-slate-900 dark:text-white">{talent.ethnicity}</span></li>}
                        </ul>
                    </div>

                    {/* SKILLS & INTERESTS */}
                    <div className="bg-white dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        {talent.interests?.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Interests</h3>
                                <div className="flex flex-wrap gap-2">
                                    {talent.interests.map((item: string, i: number) => (
                                        <span key={i} className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-bold">{item}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {talent.skills?.length > 0 && (
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Special Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {talent.skills.map((item: string, i: number) => (
                                        <span key={i} className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-800">{item}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SOCIALS */}
                    <div className="flex gap-3 justify-center pt-2">
                        <a href="#" className="h-12 w-12 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-pink-600 hover:scale-110 transition-all"><Instagram size={20} /></a>
                        <a href="#" className="h-12 w-12 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-red-600 hover:scale-110 transition-all"><Youtube size={20} /></a>
                    </div>
                </aside>
            </div>
        </div>

        {/* 1-CLICK BOOKING CTA (Sticky Bottom) */}
        <div className="fixed bottom-0 left-0 w-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 p-4 z-50">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="hidden md:block">
                    <p className="font-black text-slate-900 dark:text-white text-lg tracking-tight">Interested in {talent.full_name} for your project?</p>
                    <p className="text-sm font-medium text-slate-500">Contact our Orland Management reps for rates and availability.</p>
                </div>
                {/* Note: Contact info is abstracted purely to the agency via this CTA, completely hiding direct Talent phone/emails */}
                <button onClick={handleBooking} className="w-full md:w-auto px-8 py-3.5 bg-[#25D366] hover:bg-[#1ebd5a] text-white font-black rounded-2xl shadow-[0_10px_30px_rgba(37,211,102,0.3)] flex items-center justify-center transition-transform hover:scale-105 group">
                    <MessageCircle size={20} className="mr-2 group-hover:animate-bounce" /> Message Agency via WhatsApp
                </button>
            </div>
        </div>

    </div>
  )
}
