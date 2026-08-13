import React, { useState, useEffect } from 'react';
import { Calendar, Users, ListPlus, Music, Speaker, AlertTriangle, Loader2 } from 'lucide-react';
import { eoService } from '@/lib/services/toolsService';

export default function EORiders() {
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch riders on mount
  useEffect(() => {
    const fetchRiders = async () => {
      try {
        setLoading(true);
        const data = await eoService.getRiders();
        setRiders(data);
      } catch (err: any) {
        console.error('Failed to fetch riders:', err);
        setError(err.message || 'Gagal memuat riders');
        setRiders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRiders();
  }, []);
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-3xl flex items-start gap-4">
          <AlertTriangle className="text-red-600 dark:text-red-400 shrink-0 mt-1" size={24} />
          <div className="flex-1">
            <h2 className="font-bold text-red-900 dark:text-red-400 mb-1">Gagal Memuat Riders</h2>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg">
            Coba Lagi
          </button>
        </div>
      )}

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">Riders & Gantt Chart</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Organize hospitality riders, tech requirements, and project timeline tracking for your Event Organizer workspace.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-shadow">
            View Gantt Timeline
          </button>
          <button className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2">
            <ListPlus size={16} /> Create Rider Template
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <Loader2 className="animate-spin mx-auto mb-3 text-brand-500" size={32} />
            <p className="font-bold text-slate-600 dark:text-slate-400">Memuat riders...</p>
          </div>
        </div>
      ) : riders.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Music size={18} className="text-brand-500" /> Active Hospitality Riders
                </h2>
              </div>
              <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <ListPlus size={24} className="text-slate-400" />
                </div>
                <p className="text-sm">There are currently no active riders attached to your talents.</p>
              </div>
            </div>
          </div>

          <div className="col-span-1 space-y-6">
            <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-500/20 p-6 rounded-2xl">
              <h3 className="font-black text-brand-900 dark:text-brand-400 mb-2">Gantt Workspace</h3>
              <p className="text-brand-700 dark:text-brand-300 text-sm mb-4 leading-relaxed">
                Sync your event timeline with your team. Assign timelines directly to rostered talents or technical crews.
              </p>
              <button className="w-full py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold shadow-md shadow-brand-500/30">
                Open Timeline Manager
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Music size={18} className="text-brand-500" /> Active Hospitality Riders ({riders.length})
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {riders.map((rider) => (
                  <div key={rider.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-slate-900 dark:text-white">{rider.title || rider.name || 'Rider'}</h3>
                    <p className="text-xs text-slate-500 mt-1">{rider.description || 'No description'}</p>
                    {rider.talents && <p className="text-xs text-slate-500 mt-2">Talents: {rider.talents.join(', ')}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Speaker size={18} className="text-brand-500" /> Technical Requirements
                </h2>
              </div>
              <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                <p className="text-sm">Define technical requirements for vendors or stage equipments.</p>
              </div>
            </div>
          </div>

          <div className="col-span-1 space-y-6">
            <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-500/20 p-6 rounded-2xl">
              <h3 className="font-black text-brand-900 dark:text-brand-400 mb-2">Gantt Workspace</h3>
              <p className="text-brand-700 dark:text-brand-300 text-sm mb-4 leading-relaxed">
                Sync your event timeline with your team. Assign timelines directly to rostered talents or technical crews.
              </p>
              <button className="w-full py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold shadow-md shadow-brand-500/30">
                Open Timeline Manager
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
