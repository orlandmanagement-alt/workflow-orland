import React, { useState } from 'react';
import { KanbanBoardState, ContentBoardCard } from '@/types/workspace.types';
import { Target, MessageSquare, ExternalLink, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

const mockBoard: KanbanBoardState = {
  project_id: 'PRJ-101',
  columns: {
    brief_sent: [
      { id: 'c1', talent_id: 't-123', talent_name: 'Budi Santoso', talent_avatar: 'BS', post_type: 'tiktok', status: 'brief_sent', last_updated: '2 jam lalu' }
    ],
    draft_submitted: [
      { id: 'c2', talent_id: 't-456', talent_name: 'Ayu Kartika', talent_avatar: 'AK', post_type: 'ig_reels', status: 'draft_submitted', preview_url: 'https://orland.app/shorts/xyz', last_updated: '10 mnt lalu' }
    ],
    revision: [],
    approved: [],
    live: [
      { id: 'c3', talent_id: 't-789', talent_name: 'Dewi Lestari', talent_avatar: 'DL', post_type: 'youtube_shorts', status: 'live', live_url: 'https://youtube.com/shorts/abc', metrics: { views: 12500, likes: 2100, shares: 145 }, last_updated: '1 hari lalu' }
    ]
  }
};

export const KOLWorkspace = ({ projectId, data }: any) => {
  const [board, setBoard] = useState(mockBoard);

  const KANBAN_STAGES = [
    { id: 'brief_sent', label: 'Brief Sent', icon: Clock, color: 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900', textColor: 'text-slate-700 dark:text-slate-300' },
    { id: 'draft_submitted', label: 'Draft Review', icon: AlertCircle, color: 'border-amber-300 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/20', textColor: 'text-amber-700 dark:text-amber-500' },
    { id: 'revision', label: 'Revisions', icon: MessageSquare, color: 'border-rose-300 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-900/20', textColor: 'text-rose-700 dark:text-rose-500' },
    { id: 'approved', label: 'Approved (Ready to Post)', icon: CheckCircle2, color: 'border-indigo-300 bg-indigo-50 dark:border-indigo-900/50 dark:bg-indigo-900/20', textColor: 'text-indigo-700 dark:text-indigo-400' },
    { id: 'live', label: 'Live & Metrics', icon: Target, color: 'border-green-300 bg-green-50 dark:border-green-900/50 dark:bg-green-900/20', textColor: 'text-green-700 dark:text-green-500' }
  ];

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Target className="text-brand-500" />
            Content Pipeline
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Lacak progres konten influencer dari Brief hingga Analytics.</p>
        </div>
        <div className="mt-4 md:mt-0 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300">
          Tracking ID: {projectId || 'KOL-XYZ'}
        </div>
      </div>

      {/* HORIZONTAL KANBAN SCROLL CONTAINER */}
      <div className="flex gap-4 overflow-x-auto pb-8 snap-x">
        
        {KANBAN_STAGES.map((stage) => {
          // @ts-ignore
          const columnCards: ContentBoardCard[] = board.columns[stage.id] || [];

          return (
            <div key={stage.id} className="min-w-[320px] max-w-[320px] flex flex-col snap-center">
              {/* Column Header */}
              <div className={`p-4 rounded-t-2xl border-t border-x ${stage.color} flex items-center justify-between`}>
                <h3 className={`font-bold flex items-center gap-2 ${stage.textColor} text-sm`}>
                  <stage.icon size={16} /> {stage.label}
                </h3>
                <span className="bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-full text-xs font-black">
                  {columnCards.length}
                </span>
              </div>

              {/* Column Body */}
              <div className={`flex-1 p-3 rounded-b-2xl border-x border-b border-t-0 space-y-3 min-h-[400px] ${stage.color.replace('bg-', 'bg-')}`}>
                {columnCards.map(card => (
                  <div key={card.id} className="bg-white dark:bg-[#121b2b] p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 group hover:shadow-md transition-shadow cursor-grab">
                    
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                          {card.talent_avatar}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{card.talent_name}</p>
                          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                            {card.post_type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stage Specific Actions & Data */}
                    {stage.id === 'draft_submitted' && card.preview_url && (
                      <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Review V1 Ready</p>
                        <div className="flex gap-2">
                          <button className="flex-1 py-1.5 text-[10px] font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-md flex justify-center items-center gap-1 transition">
                            <ExternalLink size={12} /> View Draft
                          </button>
                          <button className="px-3 py-1.5 text-[10px] font-bold bg-red-100 dark:bg-red-500/10 hover:bg-red-200 dark:hover:bg-red-500/20 text-red-600 rounded-md transition">
                            Reject
                          </button>
                        </div>
                      </div>
                    )}

                    {stage.id === 'live' && card.metrics && (
                      <div className="mt-3 grid grid-cols-3 gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 text-center">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase">Views</p>
                          <p className="font-black text-slate-900 dark:text-white text-xs">{card.metrics.views.toLocaleString()}</p>
                        </div>
                        <div className="border-x border-slate-200 dark:border-slate-700">
                          <p className="text-[10px] text-slate-500 uppercase">Likes</p>
                          <p className="font-black text-slate-900 dark:text-white text-xs">{card.metrics.likes.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase">Shares</p>
                          <p className="font-black text-slate-900 dark:text-white text-xs">{card.metrics.shares.toLocaleString()}</p>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 text-right">
                      <span className="text-[9px] font-medium text-slate-400 flex items-center justify-end gap-1">
                        <Clock size={10} /> Active {card.last_updated}
                      </span>
                    </div>

                  </div>
                ))}
                
                {columnCards.length === 0 && (
                  <div className="h-full flex items-center justify-center text-xs font-bold text-slate-400 dark:text-slate-600 py-10 opacity-50 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                    Drop Card Here
                  </div>
                )}
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
};
