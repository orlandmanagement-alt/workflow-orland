import React from 'react';
import { Camera, PlusCircle, Trash2 } from 'lucide-react';

interface TabPhotosProps {
    data: any;
    uploading: any;
    handleUpload: (e: React.ChangeEvent<HTMLInputElement>, type: string, index?: number) => void;
    handleDelete: (type: string, index?: number) => void;
}

export function TabPhotos({ data, uploading, handleUpload, handleDelete }: TabPhotosProps) {
    const additionalPhotos = data?.additional_photos || [];
    const addonSlots = [0, 1, 2];

    const PhotoCard = ({ type, title, img, index, ratio = "aspect-[4/5]" }: any) => {
        const isUp = index !== undefined ? uploading[`${type}-${index}`] : uploading[type];
        
        return (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-3 relative group">
                <h4 className="text-[11px] font-black tracking-widest text-slate-500 mb-3 px-1 text-center truncate">{title}</h4>
                <input type="file" id={`upload-${type}-${index ?? ''}`} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, type, index)} disabled={isUp} />
                
                <label 
                    htmlFor={`upload-${type}-${index ?? ''}`} 
                    className={`w-full ${ratio} rounded-xl block relative bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer flex flex-col justify-center items-center transition-opacity ${isUp ? 'opacity-50 pointer-events-none' : ''}`}
                >
                    {isUp ? (
                        <div className="text-center z-10 flex flex-col items-center">
                            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-2" />
                            <span className="text-brand-600 font-bold text-xs">Uploading...</span>
                        </div>
                    ) : img ? (
                        <>
                           <img src={img} alt={title} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col items-center justify-end pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                               <div className="bg-white/20 backdrop-blur-md rounded-full p-2 mb-1 hover:bg-white/40 transition-colors">
                                  <Camera className="text-white" size={18}/>
                               </div>
                               <span className="text-white text-[10px] font-bold tracking-wider uppercase">Replace</span>
                           </div>
                           <button 
                               onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(type, index); }} 
                               className="absolute top-2 right-2 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white p-2 border border-red-200 hover:border-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg z-20"
                               title="Delete Photo"
                           >
                               <Trash2 size={16} />
                           </button>
                        </>
                    ) : (
                        <div className="text-center z-10 flex flex-col items-center text-slate-400 group-hover:text-brand-500 transition-colors border-2 border-transparent group-hover:border-brand-500/30 border-dashed w-full h-full justify-center">
                            <PlusCircle className="mb-2" size={24} />
                            <span className="font-bold text-xs">Add Photo</span>
                        </div>
                    )}
                </label>
            </div>
        )
    };

    return (
        <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-[14px] bg-white dark:bg-dark-card animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="mb-6">
                <h3 className="font-black tracking-tight text-slate-900 dark:text-white text-lg">Main Portfolio</h3>
                <p className="text-sm text-slate-500 font-medium">Headshot and body shots are required to activate your profile.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-10">
               <PhotoCard type="headshot" title="HEADSHOT" img={data?.headshot} />
               <PhotoCard type="side_view" title="SIDE VIEW" img={data?.side_view} />
               <PhotoCard type="full_height" title="FULL HEIGHT" img={data?.full_height} />
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="mb-6 flex justify-between items-end">
                    <div>
                        <h3 className="font-black tracking-tight text-slate-900 dark:text-white text-lg">Additional Photos</h3>
                        <p className="text-sm text-slate-500 font-medium">Add up to 3 extra photos to showcase different looks.</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {addonSlots.map((index) => (
                        <PhotoCard key={index} type="additional_photos" index={index} title={`EXTRA LOOK ${index + 1}`} img={additionalPhotos[index]} />
                    ))}
                </div>
            </div>
        </div>
    )
}
