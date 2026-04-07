import React, { useState } from 'react';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { MASTER_DATA } from '@/lib/constants';

interface TabInfoProps {
    editData: any;
    onChange: (field: string, value: any) => void;
}

export function TabInfo({ editData, onChange }: TabInfoProps) {
    const [editPersonal, setEditPersonal] = useState(false);
    const [editAppearance, setEditAppearance] = useState(false);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            {/* INTERESTS MULTI-SELECT */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-[14px] bg-white dark:bg-dark-card overflow-visible">
               <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="font-black tracking-widest text-slate-500 text-xs">CAREER INTERESTS & CATEGORY</div>
               </div>
               <div className="p-5 flex flex-col gap-5">
                   <div>
                       <label className="text-[12px] font-extrabold text-slate-500 mb-2 block">Primary Category</label>
                       <select value={editData?.category || ''} onChange={e => onChange('category', e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl p-3 outline-none text-[14px] font-bold dark:text-white focus:border-brand-500">
                           <option value="">Select Category...</option>
                           <option value="Model">Model</option>
                           <option value="Actor">Actor</option>
                           <option value="Dancer">Dancer</option>
                           <option value="Singer">Singer</option>
                           <option value="Influencer">Influencer</option>
                           <option value="Host / MC">Host / MC</option>
                       </select>
                   </div>
                   <MultiSelect 
                       label="What specific fields are you interested in?"
                       options={MASTER_DATA.INTERESTS} 
                       selected={editData.interests || []} 
                       onChange={(val) => onChange('interests', val)} 
                       placeholder="Select interests..."
                   />
               </div>
            </div>

            {/* PERSONAL DETAILS MODULAR */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-[14px] bg-white dark:bg-dark-card overflow-hidden">
               <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="font-black tracking-widest text-slate-500 text-xs">PERSONAL INFO</div>
                  <button onClick={() => setEditPersonal(!editPersonal)} className="font-bold text-brand-600 hover:bg-brand-50 px-3 py-1 rounded-lg text-xs transition-colors">{editPersonal ? 'Save' : '✎ Edit'}</button>
               </div>
               
               {!editPersonal ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                       <div className="p-5 flex flex-col gap-1"><span className="text-[11px] font-extrabold text-slate-400">Gender</span><span className="text-[14px] font-black text-slate-900 dark:text-white">{editData?.gender || '-'}</span></div>
                       <div className="p-5 flex flex-col gap-1"><span className="text-[11px] font-extrabold text-slate-400">Date Of Birth</span><span className="text-[14px] font-black text-slate-900 dark:text-white">{editData?.birth_date || '-'}</span></div>
                       <div className="p-5 flex flex-col gap-1 border-t md:border-t-0 border-slate-100 dark:border-slate-800"><span className="text-[11px] font-extrabold text-slate-400">Location</span><span className="text-[14px] font-black text-slate-900 dark:text-white">{editData?.location || '-'}</span></div>
                       <div className="p-5 flex flex-col gap-1 border-t border-slate-100 dark:border-slate-800"><span className="text-[11px] font-extrabold text-slate-400">Ethnicity</span><span className="text-[14px] font-black text-slate-900 dark:text-white">{editData?.ethnicity || '-'}</span></div>
                   </div>
               ) : (
                   <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in">
                     <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-extrabold text-slate-400">Gender</label>
                        <select value={editData?.gender || ''} onChange={e => onChange('gender', e.target.value)} className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl p-3 outline-none text-[13px] font-bold dark:text-white focus:border-brand-500">
                            <option value="">Select...</option><option value="Male">Male</option><option value="Female">Female</option>
                        </select>
                     </div>
                     <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-extrabold text-slate-400">Date Of Birth</label>
                        <input type="date" value={editData?.birth_date || ''} onChange={e => onChange('birth_date', e.target.value)} className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl p-3 outline-none text-[13px] font-bold dark:text-white focus:border-brand-500" />
                     </div>
                     <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-extrabold text-slate-400">Location</label>
                        <select value={editData?.location || ''} onChange={e => onChange('location', e.target.value)} className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl p-3 outline-none text-[13px] font-bold dark:text-white focus:border-brand-500">
                             <option value="">Select...</option>
                             {MASTER_DATA.CITIES?.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                     </div>
                     <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-extrabold text-slate-400">Ethnicity</label>
                        <select value={editData?.ethnicity || ''} onChange={e => onChange('ethnicity', e.target.value)} className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl p-3 outline-none text-[13px] font-bold dark:text-white focus:border-brand-500">
                            <option value="">Select...</option>{MASTER_DATA.ETHNICITY.map(et => <option key={et} value={et}>{et}</option>)}
                        </select>
                     </div>
                   </div>
               )}
            </div>

            {/* APPEARANCE MODULAR */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-[14px] bg-white dark:bg-dark-card overflow-hidden">
               <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="font-black tracking-widest text-slate-500 text-xs">APPEARANCE MEASUREMENTS</div>
                  <button onClick={() => setEditAppearance(!editAppearance)} className="font-bold text-brand-600 hover:bg-brand-50 px-3 py-1 rounded-lg text-xs transition-colors">{editAppearance ? 'Save' : '✎ Edit'}</button>
               </div>
               
               {!editAppearance ? (
                   <div className="bg-slate-50/50 dark:bg-slate-900/30">
                     <div className="grid grid-cols-3 sm:grid-cols-4 divide-y divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800">
                         <div className="p-4 flex flex-col gap-1 items-center text-center"><span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Height</span><span className="text-[15px] font-black text-brand-600">{editData?.height || '-'} <span className="text-[10px] text-slate-400">cm</span></span></div>
                         <div className="p-4 flex flex-col gap-1 items-center text-center border-l"><span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Weight</span><span className="text-[15px] font-black text-brand-600">{editData?.weight || '-'} <span className="text-[10px] text-slate-400">kg</span></span></div>
                         <div className="p-4 flex flex-col gap-1 items-center text-center border-l"><span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Hip</span><span className="text-[15px] font-black text-slate-700">{editData?.hip_size || '-'}</span></div>
                         <div className="p-4 flex flex-col gap-1 items-center text-center border-l sm:col-span-1 col-span-3 border-t sm:border-t-0"><span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Bust/Chest</span><span className="text-[15px] font-black text-slate-700">{editData?.chest_bust || '-'}</span></div>
                     </div>
                     <div className="grid grid-cols-2 divide-y divide-x divide-slate-100 dark:divide-slate-800">
                         <div className="p-4 flex justify-between"><span className="text-[12px] font-extrabold text-slate-400">Eye Color</span><span className="text-[13px] font-bold text-slate-900">{editData?.eye_color || '-'}</span></div>
                         <div className="p-4 flex justify-between border-l"><span className="text-[12px] font-extrabold text-slate-400">Hair Color</span><span className="text-[13px] font-bold text-slate-900">{editData?.hair_color || '-'}</span></div>
                         <div className="p-4 flex justify-between"><span className="text-[12px] font-extrabold text-slate-400">Body Type</span><span className="text-[13px] font-bold text-slate-900">{editData?.body_type || '-'}</span></div>
                         <div className="p-4 flex justify-between border-l"><span className="text-[12px] font-extrabold text-slate-400">Tattoos</span><span className="text-[13px] font-bold text-slate-900">{editData?.tattoos || '-'}</span></div>
                     </div>
                   </div>
               ) : (
                   <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in">
                       <div className="flex flex-col gap-1.5"><label className="text-[11px] font-extrabold text-slate-400">Height (cm)</label><input type="number" value={editData?.height || ''} onChange={e => onChange('height', parseInt(e.target.value))} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl p-2.5 outline-none text-sm font-bold focus:border-brand-500" /></div>
                       <div className="flex flex-col gap-1.5"><label className="text-[11px] font-extrabold text-slate-400">Weight (kg)</label><input type="number" value={editData?.weight || ''} onChange={e => onChange('weight', parseInt(e.target.value))} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl p-2.5 outline-none text-sm font-bold focus:border-brand-500" /></div>
                       <div className="flex flex-col gap-1.5"><label className="text-[11px] font-extrabold text-slate-400">Eye Color</label><select value={editData?.eye_color || ''} onChange={e => onChange('eye_color', e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl p-3 outline-none text-[13px] font-bold"><option value="">Select...</option>{MASTER_DATA.APPEARANCE.EYES.map(i => <option key={i} value={i}>{i}</option>)}</select></div>
                       <div className="flex flex-col gap-1.5"><label className="text-[11px] font-extrabold text-slate-400">Hair Color</label><select value={editData?.hair_color || ''} onChange={e => onChange('hair_color', e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl p-3 outline-none text-[13px] font-bold"><option value="">Select...</option>{MASTER_DATA.APPEARANCE.HAIR.map(i => <option key={i} value={i}>{i}</option>)}</select></div>
                       <div className="flex flex-col gap-1.5"><label className="text-[11px] font-extrabold text-slate-400">Body Type</label><select value={editData?.body_type || ''} onChange={e => onChange('body_type', e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl p-3 outline-none text-[13px] font-bold"><option value="">Select...</option>{MASTER_DATA.APPEARANCE.BODY_TYPE.map(i => <option key={i} value={i}>{i}</option>)}</select></div>
                       <div className="flex flex-col gap-1.5"><label className="text-[11px] font-extrabold text-slate-400">Hip Size</label><input type="text" value={editData?.hip_size || ''} onChange={e => onChange('hip_size', e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl p-2.5 outline-none text-sm font-bold focus:border-brand-500" /></div>
                       <div className="flex flex-col gap-1.5"><label className="text-[11px] font-extrabold text-slate-400">Chest/Bust</label><input type="text" value={editData?.chest_bust || ''} onChange={e => onChange('chest_bust', e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl p-2.5 outline-none text-sm font-bold focus:border-brand-500" /></div>
                       <div className="flex flex-col gap-1.5"><label className="text-[11px] font-extrabold text-slate-400">Tattoos</label><select value={editData?.tattoos || ''} onChange={e => onChange('tattoos', e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl p-3 outline-none text-[13px] font-bold"><option value="">Select...</option>{MASTER_DATA.APPEARANCE.TATTOOS.map(i => <option key={i} value={i}>{i}</option>)}</select></div>
                   </div>
               )}
            </div>
            
            <div className="border border-slate-200 dark:border-slate-800 rounded-[14px] bg-white dark:bg-dark-card overflow-hidden">
               <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="font-black tracking-widest text-slate-500 text-xs text-brand-600">ABOUT ME (BIO)</div>
               </div>
               <div className="p-5">
                    <label className="block relative group">
                        <textarea value={editData?.bio || ''} onChange={e => onChange('bio', e.target.value)} rows={5} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-[14px] font-medium text-slate-900 dark:text-white outline-none focus:border-brand-500 resize-y leading-relaxed transition-colors shadow-inner" placeholder="Tell the Casting Directors about your journey..."></textarea>
                    </label>
               </div>
            </div>
        </div>
    );
}
