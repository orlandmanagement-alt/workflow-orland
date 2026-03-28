import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import RosterManager from "@/components/projects/RosterManager";
import SharedNotes from "@/components/projects/SharedNotes";
import { ArrowLeft, Edit3, Image as ImageIcon, FileText, Wallet, Users, CheckCircle2, UploadCloud, MoreVertical, MessageSquare } from 'lucide-react';
import PitchDeckButton from "@/components/projects/PitchDeckButton";

export default function ProjectDetail() {
  const { id } = useParams(); // Mengambil ID dari URL (misal: PRJ-001)
  const [activeTab, setActiveTab] = useState('overview');

  // Simulasi Data Proyek
  const project = {
    id: id || 'PRJ-001',
    title: 'TVC Ramadhan Glow Soap',
    status: 'Casting',
    type: 'Commercial',
    client: 'PT Glow Up Nusantara',
    budget: { total: 250000000, spent: 45000000 },
    dates: '12 April - 15 April 2026',
    location: 'Studio Alam TVRI, Jakarta',
    brief: 'Membutuhkan 1 Main Talent Wanita (Look Timur Tengah/Hijab, 20-25th) dan 3 Extras (Keluarga). Vibe iklan hangat, kekeluargaan, dan elegan. Baju nuansa pastel/putih.',
    moodboards: [
      'https://images.unsplash.com/photo-1512413914583-097945d7b878?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1556909211-3698d532d7dc?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1542042161784-26ab9e041e89?auto=format&fit=crop&q=80&w=400'
    ]
  };

  const budgetPercent = Math.round((project.budget.spent / project.budget.total) * 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-20">
      
      {/* HEADER: PROJECT TITLE & BACK BUTTON */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
              <Link to="/dashboard/projects" className="p-2 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm">
                  <ArrowLeft size={20} />
              </Link>
              <div>
                  <div className="flex items-center gap-2 mb-1">
                      <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">{project.status}</span>
                      <span className="text-xs font-mono text-slate-500">{project.id}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{project.title}</h1>
              </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
              <button className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-colors">
              <PitchDeckButton projectId={project.id} />
                  <Edit3 size={16} className="mr-2"/> Edit Brief
              </button>
              <button className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <MoreVertical size={20} />
              </button>
          </div>
      </div>

      {/* MINI TABS NAVIGATOR */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-px scrollbar-none">
          {['overview', 'roster', 'notes', 'escrow'].map((tab) => (
              <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 text-sm font-bold capitalize whitespace-nowrap transition-colors border-b-2 ${activeTab === tab ? 'border-brand-600 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                  {tab === 'overview' ? 'Brief & Moodboard' : tab === 'roster' ? 'Talent Roster' : tab === 'notes' ? 'Shared Notes' : 'Budget & Escrow'}
              </button>
          ))}
      </div>

      {/* TAB CONTENT: OVERVIEW (BRIEF & MOODBOARD) */}
      {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* KOLOM KIRI (2/3): BRIEF & MOODBOARD */}
              <div className="lg:col-span-2 space-y-6">
                  
                  {/* The Brief */}
                  <div className="bg-white dark:bg-dark-card rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center mb-6"><FileText className="mr-2 text-brand-500" size={20}/> Project Brief</h2>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Klien / Brand</p>
                              <p className="font-bold text-slate-900 dark:text-white">{project.client}</p>
                          </div>
                          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tipe Project</p>
                              <p className="font-bold text-slate-900 dark:text-white">{project.type}</p>
                          </div>
                          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tanggal Syuting</p>
                              <p className="font-bold text-slate-900 dark:text-white">{project.dates}</p>
                          </div>
                          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Lokasi</p>
                              <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{project.location}</p>
                          </div>
                      </div>

                      <div className="space-y-2">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deskripsi & Kebutuhan (Director's Note)</p>
                          <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                              {project.brief}
                          </div>
                      </div>
                  </div>

                  {/* Moodboard / References */}
                  <div className="bg-white dark:bg-dark-card rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center"><ImageIcon className="mr-2 text-brand-500" size={20}/> Moodboard & Referensi</h2>
                          <button className="text-sm font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center">
                              <UploadCloud size={16} className="mr-1"/> Tambah
                          </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {project.moodboards.map((img, idx) => (
                              <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm group relative">
                                  <img src={img} alt="Moodboard" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px] cursor-pointer">
                                      <span className="text-white text-xs font-bold">Lihat Penuh</span>
                                  </div>
                              </div>
                          ))}
                          {/* Dropzone Simulated */}
                          <div className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center text-slate-400 hover:text-brand-500 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 cursor-pointer transition-colors">
                              <UploadCloud size={24} className="mb-2" />
                              <span className="text-xs font-bold">Upload File</span>
                          </div>
                      </div>
                  </div>
              </div>

              {/* KOLOM KANAN (1/3): BUDGET TRACKER & QUICK STATS */}
              <div className="space-y-6">
                  
                  {/* Budget Tracker */}
                  <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-6 opacity-10"><Wallet size={100} className="text-white"/></div>
                      <h3 className="text-white font-bold text-lg mb-6 flex items-center"><Wallet size={18} className="mr-2 text-green-400"/> Budget Tracker</h3>
                      
                      <div className="mb-6">
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Dana Disiapkan</p>
                          <p className="text-3xl font-black text-white">Rp 250 Jt</p>
                      </div>

                      <div className="space-y-2 mb-6">
                          <div className="flex justify-between text-xs font-bold">
                              <span className="text-amber-400">Terpakai: Rp 45 Jt</span>
                              <span className="text-slate-400">Sisa: Rp 205 Jt</span>
                          </div>
                          <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                              <div className="h-full bg-gradient-to-r from-green-400 via-amber-400 to-red-500 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)]" style={{ width: `${budgetPercent}%` }}></div>
                          </div>
                      </div>

                      <button className="w-full py-3 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl border border-white/20 backdrop-blur-sm transition-colors">
                          Lihat Detail Escrow
                      </button>
                  </div>

                  {/* Roster Quick Stats */}
                  <div className="bg-white dark:bg-dark-card rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                      <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-4 flex items-center"><Users size={18} className="mr-2 text-blue-500"/> Status Roster</h3>
                      
                      <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800/50">
                              <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300 rounded-full flex items-center justify-center"><CheckCircle2 size={16}/></div>
                                  <div><p className="text-sm font-bold text-green-900 dark:text-green-400">Main Talent</p><p className="text-[10px] text-green-700 dark:text-green-500">1 dari 1 Terisi</p></div>
                              </div>
                              <div className="flex -space-x-2">
                                  <img className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100" alt="Talent" />
                              </div>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/50">
                              <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 bg-amber-100 dark:bg-amber-800 text-amber-600 dark:text-amber-300 rounded-full flex items-center justify-center"><Users size={16}/></div>
                                  <div><p className="text-sm font-bold text-amber-900 dark:text-amber-400">Extras / Figuran</p><p className="text-[10px] text-amber-700 dark:text-amber-500">2 dari 3 Terisi</p></div>
                              </div>
                              <button className="text-[10px] font-bold bg-amber-600 text-white px-2 py-1 rounded">Cari</button>
                          </div>
                      </div>

                      <Link to="/dashboard/talents/search" className="mt-6 w-full py-3 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/20 dark:hover:bg-brand-900/40 text-brand-600 dark:text-brand-400 text-sm font-bold rounded-xl flex items-center justify-center transition-colors">
                          Buka AI Smart Casting &rarr;
                      </Link>
                  </div>

              </div>
          </div>
      )}

      {/* STUB UNTUK TAB LAINNYA */}
      {activeTab === 'roster' {activeTab !== 'overview' && ({activeTab !== 'overview' && ( <RosterManager />}
      {activeTab !== 'overview' && activeTab !== 'roster' {activeTab !== 'overview' && ({activeTab !== 'overview' && ( (
          <div className="bg-white dark:bg-dark-card rounded-3xl p-10 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <MessageSquare size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Tab {activeTab} sedang dalam pengembangan</h2>
              <p className="text-slate-500">Fitur ini akan segera tersedia untuk mempermudah manajemen proyek Anda.</p>
          </div>
      )}

    </div>
  )
}
