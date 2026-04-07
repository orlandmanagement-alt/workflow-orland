import React, { useState } from 'react';
import { PlusCircle, Trash2, Youtube, Music } from 'lucide-react';

interface TabAssetsProps {
    editData: any;
    onChange: (field: string, value: any[]) => void;
}

export function TabAssets({ editData, onChange }: TabAssetsProps) {
    const showreels = editData.showreels || [];
    const audios = editData.audios || [];

    const [visibleVideos, setVisibleVideos] = useState(2);

    // Youtube ID Extractor Helper
    const extractYoutubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const handleAddURL = (field: 'showreels' | 'audios') => {
        const arr = editData[field] ? [...editData[field]] : [];
        if (arr.length >= 6) { alert(`Maksimal 6 link untuk ${field}`); return; }
        onChange(field, [...arr, '']);
    }

    const handleUpdateURL = (field: 'showreels' | 'audios', index: number, value: string) => {
        const arr = [...(editData[field] || [])];
        arr[index] = value;
        onChange(field, arr);
    }

    const handleDeleteURL = (field: 'showreels' | 'audios', index: number) => {
        const arr = [...(editData[field] || [])];
        arr.splice(index, 1);
        onChange(field, arr);
    }

    const validVideos = showreels.map((url: string) => extractYoutubeId(url)).filter(Boolean);

    return (
        <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-[14px] bg-white dark:bg-dark-card animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            {/* YOUTUBE SECTION */}
            <div className="mb-10">
                <div className="flex justify-between items-center mb-4">
                   <div className="flex items-center gap-2">
                       <Youtube className="text-red-500" size={20} />
                       <h3 className="font-black tracking-tight text-slate-900 dark:text-white text-lg">Showreels</h3>
                   </div>
                   <button onClick={() => handleAddURL('showreels')} className="text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg flex items-center transition-colors">
                       <PlusCircle size={14} className="mr-1.5"/> Add Video
                   </button>
                </div>
                
                {/* Input List */}
                <div className="space-y-3 mb-6">
                    {showreels.map((url: string, i: number) => (
                        <div key={i} className="flex gap-2 animate-in slide-in-from-top-2">
                            <input type="text" value={url} onChange={e => handleUpdateURL('showreels', i, e.target.value)} placeholder="https://youtube.com/watch?v=..." className="flex-1 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 outline-none focus:border-brand-500 text-sm font-medium dark:text-white transition-colors" />
                            <button onClick={() => handleDeleteURL('showreels', i)} className="px-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 text-red-600 transition-colors"><Trash2 size={16}/></button>
                        </div>
                    ))}
                    {showreels.length === 0 && <p className="text-sm font-medium text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">No showreels added. Paste a YouTube link.</p>}
                </div>

                {/* Video Grid Render */}
                {validVideos.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {validVideos.slice(0, visibleVideos).map((vidId: string, idx: number) => (
                                <div key={idx} className="w-full aspect-video rounded-xl overflow-hidden shadow-sm bg-black relative group">
                                    <iframe 
                                        width="100%" height="100%" 
                                        src={`https://www.youtube.com/embed/${vidId}?rel=0`} 
                                        title="YouTube video player" 
                                        frameBorder="0" 
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                        allowFullScreen
                                        className="absolute inset-0"
                                        loading="lazy"
                                    ></iframe>
                                </div>
                            ))}
                        </div>
                        {validVideos.length > visibleVideos && (
                            <div className="mt-4 text-center">
                                <button onClick={() => setVisibleVideos(prev => prev + 2)} className="text-sm font-bold text-brand-600 hover:text-brand-700 underline underline-offset-4">
                                    Load More Videos ({validVideos.length - visibleVideos} remaining)
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* AUDIO SECTION */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-4">
                   <div className="flex items-center gap-2">
                       <Music className="text-brand-500" size={20} />
                       <h3 className="font-black tracking-tight text-slate-900 dark:text-white text-lg">Voice Overs</h3>
                   </div>
                   <button onClick={() => handleAddURL('audios')} className="text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg flex items-center transition-colors">
                       <PlusCircle size={14} className="mr-1.5"/> Add Audio
                   </button>
                </div>

                <div className="space-y-3">
                    {audios.map((url: string, i: number) => (
                        <div key={i} className="flex gap-2 animate-in slide-in-from-top-2">
                            <div className="flex-1 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl px-2 py-1.5 flex items-center focus-within:border-brand-500 transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mr-2 shrink-0">
                                    <Music size={14} className="text-brand-600 dark:text-brand-400" />
                                </div>
                                <input type="text" value={url} onChange={e => handleUpdateURL('audios', i, e.target.value)} placeholder="https://soundcloud.com/..." className="flex-1 bg-transparent border-none outline-none text-sm font-medium dark:text-white" />
                            </div>
                            <button onClick={() => handleDeleteURL('audios', i)} className="px-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 text-red-600 transition-colors"><Trash2 size={16}/></button>
                        </div>
                    ))}
                    {audios.length === 0 && <p className="text-sm font-medium text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">No audio samples added.</p>}
                </div>
            </div>

        </div>
    )
}
