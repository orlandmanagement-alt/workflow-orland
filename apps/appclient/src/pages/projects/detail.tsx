import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Clock, Lock, Users, Briefcase, FileText, Activity, ShieldCheck, Download, MoreVertical, Zap, CheckCircle, Sparkles, Mail, Filter, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface TalentMatch {
  id: string;
  name: string;
  avatar?: string;
  category: string;
  rating: number;
  match_score: number;
  match_reason: string;
  booking_count: number;
  completion_rate: number;
}

interface FilteredTalent {
  talent_id: string;
  full_name: string;
  category: string;
  gender?: string;
  location?: string;
  base_rate: number;
  already_in_project: boolean;
}

export default function ProjectDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'overview'|'talents'|'matches'|'finance'|'documents'>('overview');
  const [project, setProject] = useState<any>(null);
  const [matches, setMatches] = useState<TalentMatch[]>([]);
  const [filteredTalents, setFilteredTalents] = useState<FilteredTalent[]>([]);
  const [selectedMatches, setSelectedMatches] = useState<Set<string>>(new Set());
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);
  const [talentsLoading, setTalentsLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterGender, setFilterGender] = useState<string>('');
  const [filterLocation, setFilterLocation] = useState<string>('');
  const [filterMinRate, setFilterMinRate] = useState<number>(0);
  const [filterMaxRate, setFilterMaxRate] = useState<number>(999999999);

  // Fetch project detail on mount
  useEffect(() => {
    if (id) {
      const fetchProject = async () => {
        try {
          const response = await api.get(`/projects/${id}`);
          setProject(response.data);
        } catch (error) {
          console.error('Failed to fetch project:', error);
        }
      };
      fetchProject();
    }
  }, [id]);

  // Fetch AI matches when tab is clicked
  useEffect(() => {
    if (activeTab === 'matches' && !matches.length && !matchesLoading) {
      fetchMatches();
    }
  }, [activeTab]);

  // Fetch filtered talents when talent tab is clicked or filters change
  useEffect(() => {
    if (activeTab === 'talents' && id) {
      fetchFilteredTalents();
    }
  }, [activeTab, filterCategory, filterGender, filterLocation, filterMinRate, filterMaxRate]);

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${id}`);
      setProject(response.data);
    } catch (error) {
      console.error('Failed to fetch project:', error);
    }
  };

  const fetchMatches = async () => {
    try {
      setMatchesLoading(true);
      setMatchesError(null);
      const response = await api.post(`/api/v1/ai/match-recommendation`, {
        project_id: id,
        limit: 20
      });
      setMatches(response.data.matches || []);
    } catch (error: any) {
      setMatchesError(error.message || 'Failed to fetch talent matches');
    } finally {
      setMatchesLoading(false);
    }
  };

  const fetchFilteredTalents = async () => {
    try {
      setTalentsLoading(true);
      const params = new URLSearchParams();
      if (filterCategory) params.append('category', filterCategory);
      if (filterGender) params.append('gender', filterGender);
      if (filterLocation) params.append('location', filterLocation);
      if (filterMinRate > 0) params.append('min_rate', filterMinRate.toString());
      if (filterMaxRate < 999999999) params.append('max_rate', filterMaxRate.toString());
      params.append('limit', '100');

      const response = await api.get(`/projects/${id}/talents/filter?${params}`);
      setFilteredTalents(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch filtered talents:', error);
      setFilteredTalents([]);
    } finally {
      setTalentsLoading(false);
    }
  };

  const toggleMatchSelection = (talentId: string) => {
    const newSelected = new Set(selectedMatches);
    if (newSelected.has(talentId)) {
      newSelected.delete(talentId);
    } else {
      newSelected.add(talentId);
    }
    setSelectedMatches(newSelected);
  };

  const sendInvites = async () => {
    if (selectedMatches.size === 0) return;
    try {
      await api.post(`/api/v1/recommendations/bulk`, {
        project_id: id,
        talent_ids: Array.from(selectedMatches),
        method: 'ai_match'
      });
      // Clear selection and refresh
      setSelectedMatches(new Set());
      fetchMatches();
    } catch (error) {
      console.error('Failed to send invites:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 pb-20">
       {/* Hero Cover */}
       <div className="h-48 md:h-64 bg-slate-900 border-b border-slate-800 relative bg-[url('https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?auto=format&fit=crop&q=80')] bg-cover bg-center">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
          <div className="absolute top-6 left-6 z-10">
             <Link to="/dashboard/projects" className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white rounded-xl text-sm font-bold transition-colors">
                <ArrowLeft size={16} /> Back to Hub
             </Link>
          </div>
          
          <div className="absolute bottom-6 px-6 md:px-10 w-full flex flex-col md:flex-row md:items-end justify-between gap-4">
             <div>
                <span className="px-3 py-1 bg-brand-500 text-white font-bold uppercase tracking-widest text-[10px] rounded mb-3 inline-block">Casting in Progress</span>
                <h1 className="text-3xl md:text-4xl font-black text-white mb-2 drop-shadow-lg">Corporate TVC Nusantara</h1>
                <div className="flex flex-wrap items-center gap-4 text-slate-300 text-sm font-medium">
                   <span className="flex items-center gap-1"><MapPin size={14}/> Jakarta</span>
                   <span className="flex items-center gap-1"><Calendar size={14}/> 12 Oct 2026 - 15 Oct 2026</span>
                   <span className="flex items-center gap-1"><Clock size={14}/> 08:00 WIB</span>
                </div>
             </div>
             
             <div className="flex gap-3">
                <button className="px-4 py-2.5 bg-white text-slate-900 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-100 transition-colors text-sm shadow-xl">
                    <Users size={18}/> Manage Roster
                </button>
             </div>
          </div>
       </div>

       <div className="max-w-7xl mx-auto px-4 md:px-10 mt-8 mb-6 flex flex-col md:flex-row gap-8 items-start relative z-20">
         
         {/* LEFT CONTENT MAIN */}
         <div className="flex-1 w-full space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 flex overflow-x-auto hide-scrollbar sticky top-20 z-30 shadow-sm">
               {['overview', 'talents', 'matches', 'finance', 'documents'].map(tab => (
                 <button 
                   key={tab} 
                   onClick={() => setActiveTab(tab as any)}
                   className={`px-6 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                 >
                   {tab === 'matches' && <Sparkles size={14} className="inline mr-2"/>}
                   {tab}
                 </button>
               ))}
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8">
                   <h3 className="font-black text-slate-900 dark:text-white text-lg mb-4 flex items-center gap-2"><Briefcase size={20} className="text-brand-500"/> Project Brief</h3>
                   <div className="prose dark:prose-invert prose-brand max-w-none prose-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      <p>Mencari talenta lokal dari berbagai ras dan etnis di nusantara untuk membintangi kampanye "Merayakan Perbedaan Nusantara". Proses produksi akan memakan waktu 3 hari di studio indoor dan 1 hari di area GBK (outdoor).</p>
                      <ul>
                        <li>Diperlukan talent pria/wanita usia 18-35 tahun.</li>
                        <li>Sanggup melakukan koreografi ringan.</li>
                        <li>Non-exclusivity agreements (bisa lintas brand/kompetitor setelah 6 bulan).</li>
                      </ul>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'matches' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* AI Match Info Card */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Sparkles size={24} className="text-blue-600 dark:text-blue-400"/>
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white mb-1">AI Talent Matching</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Our AI analyzes project requirements and talent profiles to find the best matches. Score reflects talent suitability based on experience, ratings, and category alignment.</p>
                    </div>
                  </div>
                </div>

                {/* Matches List */}
                {matchesLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4 animate-spin"></div>
                      <p className="text-slate-600 dark:text-slate-400 font-medium">Finding best talent matches...</p>
                    </div>
                  </div>
                ) : matchesError ? (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
                    <p className="text-red-600 dark:text-red-400 font-medium">{matchesError}</p>
                  </div>
                ) : matches.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                      <Sparkles size={28}/>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white mb-2">No Matches Found</p>
                    <p className="text-sm text-slate-500">Try adjusting project requirements or ensure talent profiles are complete.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {matches.map((talent) => (
                      <div 
                        key={talent.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => toggleMatchSelection(talent.id)}
                      >
                        <div className="flex items-start gap-4">
                          {/* Checkbox */}
                          <div className="mt-1 flex-shrink-0">
                            <input 
                              type="checkbox" 
                              checked={selectedMatches.has(talent.id)}
                              onChange={() => toggleMatchSelection(talent.id)}
                              className="w-5 h-5 rounded border-slate-300 bg-white accent-brand-600 cursor-pointer"
                            />
                          </div>

                          {/* Avatar */}
                          <div className="w-14 h-14 bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 rounded-xl flex-shrink-0 overflow-hidden">
                            {talent.avatar ? (
                              <img src={talent.avatar} alt={talent.name} className="w-full h-full object-cover"/>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white font-black text-lg">
                                {talent.name.charAt(0)}
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-black text-slate-900 dark:text-white">{talent.name}</h4>
                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <div className="text-xs text-slate-500 font-medium">Match Score</div>
                                  <div className="font-black text-lg text-brand-600 dark:text-brand-400">{Math.round(talent.match_score)}%</div>
                                </div>
                              </div>
                            </div>

                            {/* Match Score Bar */}
                            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full mb-3 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all"
                                style={{ width: `${talent.match_score}%` }}
                              />
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 mb-2">
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{talent.category}</span>
                              <span className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                                ⭐ {talent.rating.toFixed(1)} ({talent.booking_count} bookings)
                              </span>
                            </div>

                            {/* Match Reason */}
                            <p className="text-sm text-slate-600 dark:text-slate-400">{talent.match_reason}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bulk Action Footer */}
                {matches.length > 0 && selectedMatches.size > 0 && (
                  <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 rounded-t-2xl shadow-lg flex items-center justify-between">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {selectedMatches.size} talent{selectedMatches.size !== 1 ? 's' : ''} selected
                    </p>
                    <button 
                      onClick={sendInvites}
                      className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold flex items-center gap-2 transition-colors text-sm uppercase tracking-widest"
                    >
                      <Mail size={16}/> Send Invites
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'talents' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Filter Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                  <h3 className="font-black text-slate-900 dark:text-white text-lg mb-4 flex items-center gap-2"><Filter size={20} className="text-brand-500"/> Search & Filter Talents</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Category</label>
                      <input
                        type="text"
                        placeholder="e.g., Model, Actor"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-500 outline-none transition-colors text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Gender</label>
                      <select
                        value={filterGender}
                        onChange={(e) => setFilterGender(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white focus:border-brand-500 outline-none transition-colors text-sm"
                      >
                        <option value="">All Genders</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Non-binary">Non-binary</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Location</label>
                      <input
                        type="text"
                        placeholder="e.g., Jakarta"
                        value={filterLocation}
                        onChange={(e) => setFilterLocation(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-500 outline-none transition-colors text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Min Rate</label>
                        <input
                          type="number"
                          value={filterMinRate}
                          onChange={(e) => setFilterMinRate(Number(e.target.value))}
                          className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white focus:border-brand-500 outline-none transition-colors text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Max Rate</label>
                        <input
                          type="number"
                          value={filterMaxRate === 999999999 ? '' : filterMaxRate}
                          onChange={(e) => setFilterMaxRate(e.target.value ? Number(e.target.value) : 999999999)}
                          className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white focus:border-brand-500 outline-none transition-colors text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Talents Grid */}
                {talentsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 animate-spin text-brand-500 mx-auto mb-4" />
                      <p className="text-slate-600 dark:text-slate-400 font-medium">Loading talents...</p>
                    </div>
                  </div>
                ) : filteredTalents.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                      <Users size={28}/>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white mb-2">No Talents Found</p>
                    <p className="text-sm text-slate-500">Try adjusting your filters to find more talents.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTalents.map((talent) => (
                      <div 
                        key={talent.talent_id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-black text-slate-900 dark:text-white text-sm">{talent.full_name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-bold bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 px-2 py-0.5 rounded uppercase tracking-widest">{talent.category}</span>
                              {talent.already_in_project && (
                                <span className="text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded uppercase tracking-widest">✓ In Project</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {talent.gender && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{talent.gender}</p>
                        )}

                        {talent.location && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-3">
                            <MapPin size={12}/> {talent.location}
                          </p>
                        )}

                        <div className="border-t border-slate-100 dark:border-slate-700 pt-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Rate: Rp {talent.base_rate.toLocaleString('id-ID')}</span>
                            <button className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-lg transition-colors">
                              {talent.already_in_project ? 'In Project' : 'Add'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* OTHER TABS STUB */}
         </div>

         {/* RIGHT SIDEBAR DETAILS */}
         <div className="w-full md:w-[340px] shrink-0 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
               <h3 className="font-black text-slate-900 dark:text-white text-base mb-6 uppercase tracking-wider">Project State</h3>
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <span className="text-sm font-medium text-slate-500 flex items-center gap-2"><Activity size={16}/> Status</span>
                     <span className="font-bold text-slate-900 dark:text-white">Live Casting</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-sm font-medium text-slate-500 flex items-center gap-2"><Lock size={16}/> Escrow Status</span>
                     <span className="font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded text-xs uppercase tracking-widest border border-amber-200 dark:border-amber-900/50">Awaiting Funds</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-sm font-medium text-slate-500 flex items-center gap-2"><Users size={16}/> Slots Filled</span>
                     <span className="font-bold text-slate-900 dark:text-white">0 / 15 Talents</span>
                  </div>
               </div>
               
               <div className="h-px bg-slate-200 dark:bg-slate-800 w-full my-6"></div>
               
               <button className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3 rounded-xl shadow-lg hover:scale-105 transition-transform text-sm uppercase tracking-widest flex items-center justify-center gap-2">
                  <Lock size={16}/> Fund Escrow
               </button>
            </div>
         </div>
       </div>
    </div>
  );
}
