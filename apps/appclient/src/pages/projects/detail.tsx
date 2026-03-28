import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Target, 
  Users, 
  LayoutDashboard, 
  Image as ImageIcon, 
  DollarSign, 
  FileText,
  MessageSquare,
  Settings,
  Plus
} from 'lucide-react';
import RosterManager from '@/components/projects/RosterManager';
import SharedNotes from '@/components/projects/SharedNotes';
import PitchDeckButton from '@/components/projects/PitchDeckButton';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('roster');

  // Mock Data (Nanti diganti fetch dari projectService)
  const project = {
    id: id || 'PRJ-2026-001',
    title: 'TVC Ramadhan Glow Soap',
    status: 'Casting',
    client: 'Glow Up Nusantara',
    budget: 'Rp 250.000.000',
    deadline: '15 April 2026'
  };

  const tabs = [
    { id: 'roster', label: 'Talent Roster', icon: Users },
    { id: 'moodboard', label: 'Moodboard', icon: ImageIcon },
    { id: 'budget', label: 'Budget & Finance', icon: DollarSign },
    { id: 'notes', label: 'Shared Notes', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div className="space-y-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-sm font-bold text-slate-500 hover:text-brand-500 transition-colors"
          >
            <ArrowLeft size={16} className="mr-2" /> Kembali ke Dashboard
          </button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-brand-500/10 text-brand-600 dark:text-brand-400 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-widest border border-brand-500/20">
                {project.status}
              </span>
              <span className="text-xs font-bold text-slate-400">{project.id}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {project.title}
            </h1>
            <p className="text-slate-500 text-sm mt-1">Client: <span className="font-bold text-slate-700 dark:text-slate-300">{project.client}</span></p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <PitchDeckButton projectId={project.id} />
          <button className="flex-1 sm:flex-none flex items-center justify-center px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold shadow-lg hover:scale-105 transition-transform">
            <Plus size={16} className="mr-2" /> Cari Talent Baru
          </button>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex overflow-x-auto gap-1 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-fit scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:bg-white/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* CONTENT AREA */}
      <div className="mt-8">
        {activeTab === 'roster' && <RosterManager projectId={project.id} />}
        
        {activeTab === 'moodboard' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in zoom-in-95">
            {[1,2,3,4].map(i => (
              <div key={i} className="aspect-square rounded-3xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
                <ImageIcon size={32} />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="bg-white dark:bg-dark-card p-10 rounded-4xl border border-slate-200 dark:border-slate-800 text-center animate-in slide-in-from-bottom-4">
             <DollarSign size={48} className="mx-auto text-slate-300 mb-4" />
             <h3 className="text-xl font-black dark:text-white">Budget Detail</h3>
             <p className="text-slate-500 mt-2">Sedang menarik data finansial dari D1...</p>
          </div>
        )}

        {activeTab === 'notes' && <SharedNotes />}

        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-white dark:bg-dark-card p-8 rounded-4xl border border-slate-200 dark:border-slate-800">
             <h3 className="font-bold text-lg dark:text-white mb-6">Project Settings</h3>
             <button className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-xl text-sm border border-red-100">
               Archive Project
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
