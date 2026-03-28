import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Image as ImageIcon, DollarSign, MessageSquare, Settings, Plus } from 'lucide-react';
import PitchDeckButton from '../../components/projects/PitchDeckButton';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('roster');

  const project = {
    id: id || 'PRJ-2026-001',
    title: 'TVC Ramadhan Glow Soap',
    status: 'Casting',
    client: 'Glow Up Nusantara'
  };

  const tabs = [
    { id: 'roster', label: 'Roster', icon: Users },
    { id: 'moodboard', label: 'Moodboard', icon: ImageIcon },
    { id: 'budget', label: 'Budget', icon: DollarSign },
    { id: 'notes', label: 'Notes', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 mt-6 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center text-xs font-bold text-slate-500 mb-4">
            <ArrowLeft size={14} className="mr-1" /> Back
          </button>
          <h1 className="text-3xl font-black dark:text-white tracking-tight">{project.title}</h1>
          <p className="text-slate-500 text-sm">Client: {project.client}</p>
        </div>
        <div className="flex gap-2">
          <PitchDeckButton projectId={project.id} />
          <button className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold flex items-center">
            <Plus size={14} className="mr-1" /> Talent
          </button>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'
            }`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-8 p-10 bg-white dark:bg-slate-900 rounded-4xl border border-slate-200 dark:border-slate-800 text-center">
         <h3 className="text-xl font-black dark:text-white uppercase tracking-widest">{activeTab} Section</h3>
         <p className="text-slate-500 mt-2 text-sm italic">Modul sedang dimuat dari sistem Orland...</p>
      </div>
    </div>
  );
}
