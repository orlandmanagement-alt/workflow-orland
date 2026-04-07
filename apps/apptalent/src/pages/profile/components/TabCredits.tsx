import React, { useState } from 'react';
import { apiRequest } from '@/lib/api';
import { X, PlusCircle } from 'lucide-react';

interface TabCreditsProps {
    data: any;
}

export function TabCredits({ data }: TabCreditsProps) {
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [credits, setCredits] = useState<any[]>(data?.experiences || []);

    const [form, setForm] = useState({
        title: '', month: 'January', year: new Date().getFullYear().toString(), company: '', description: ''
    });

    const currentYear = new Date().getFullYear();
    const years = Array.from(new Array(currentYear - 1980 + 2), (val, index) => currentYear + 1 - index);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const handleSave = async () => {
        if (!form.title) { alert('Job title is required'); return; }
        
        setSaving(true);
        try {
            const res: any = await apiRequest(`/talents/${data.talent_id}/experiences`, {
                method: 'POST',
                body: JSON.stringify({
                    title: form.title, month: form.month, year: parseInt(form.year), company: form.company, description: form.description
                })
            });

            if (res.status === 'ok' || res.id) {
                setCredits([{ exp_id: res.id, ...form, year: parseInt(form.year) }, ...credits]);
                setForm({ title: '', month: 'January', year: currentYear.toString(), company: '', description: '' });
                setShowForm(false);
            }
        } catch (err: any) {
            alert('Failed to save credit: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (exp_id: string, idx: number) => {
        if (!confirm('Hapus credit ini?')) return;
        try {
            const res: any = await apiRequest(`/talents/experiences/${exp_id}`, { method: 'DELETE' });
            if (res.status === 'ok' || res.message === 'Dihapus') {
                const arr = [...credits];
                arr.splice(idx, 1);
                setCredits(arr);
            }
        } catch (err: any) {
            alert('Gagal menghapus credit.');
        }
    };

    return (
        <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-[14px] bg-white dark:bg-dark-card animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="flex justify-between items-center mb-8">
                <div>
                   <h3 className="font-black tracking-tight text-slate-900 dark:text-white text-lg">Work Experience</h3>
                   <p className="text-sm text-slate-500 font-medium">Add your acting, modeling, or dancing experiences.</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2 rounded-xl text-[13px] shadow-sm flex items-center transition-all"><PlusCircle size={16} className="mr-1.5"/> Add Credit</button>
             </div>

             {/* CREATE FORM */}
             {showForm && (
                 <div className="border border-brand-200 border-dashed bg-brand-50/50 dark:bg-brand-900/10 p-6 rounded-2xl mb-8 shadow-sm zoom-in-95 animate-in">
                    <h4 className="font-black text-slate-900 dark:text-white mb-5 text-sm uppercase tracking-widest text-brand-600">New Experience</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Role / Job Title</label>
                            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} type="text" placeholder="e.g. Lead Actor, Runway Model" className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-4 py-3 outline-none focus:border-brand-500 text-sm font-bold dark:text-white" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Date</label>
                            <div className="flex gap-2">
                                <select value={form.month} onChange={e => setForm({...form, month: e.target.value})} className="flex-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-4 py-3 outline-none focus:border-brand-500 text-[13px] font-bold dark:text-white">
                                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <select value={form.year} onChange={e => setForm({...form, year: e.target.value})} className="w-28 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-4 py-3 outline-none focus:border-brand-500 text-[13px] font-bold dark:text-white">
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5 mb-4">
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Production / Company</label>
                        <input value={form.company} onChange={e => setForm({...form, company: e.target.value})} type="text" placeholder="e.g. Netflix, Vogue, Agency Name" className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-4 py-3 outline-none focus:border-brand-500 text-sm font-bold dark:text-white" />
                    </div>

                    <div className="flex flex-col gap-1.5 mb-6">
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Description</label>
                        <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe your role and responsibilities..." rows={3} className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-4 py-3 outline-none focus:border-brand-500 text-[13px] font-medium dark:text-white resize-y" />
                    </div>

                    <div className="flex gap-3">
                        <button onClick={handleSave} disabled={saving} className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-2.5 rounded-full text-sm disabled:opacity-50">
                            {saving ? 'Saving...' : 'Save Credit'}
                        </button>
                        <button onClick={() => setShowForm(false)} className="bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-bold px-6 py-2.5 border border-slate-200 dark:border-slate-700 rounded-full text-sm transition-colors">
                            Cancel
                        </button>
                    </div>
                 </div>
             )}

             {/* VERTICAL TIMELINE LIST */}
             <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-4 md:ml-6 space-y-8 pb-4">
                 {credits.length > 0 ? (
                     credits.map((exp: any, i: number) => (
                         <div key={exp.exp_id || i} className="relative pl-8 md:pl-10 group">
                             {/* Timeline Dot */}
                             <div className="absolute w-4 h-4 rounded-full bg-brand-100 dark:bg-brand-900/50 border-[3px] border-brand-500 -left-[9px] top-1.5 group-hover:scale-125 transition-transform" />
                             
                             <div className="flex flex-col md:flex-row md:items-start max-w-3xl">
                                 {/* Time Badge */}
                                 <div className="md:w-32 flex-shrink-0 mb-1 md:mb-0 md:pt-1">
                                     <div className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black px-3 py-1 rounded-full">
                                        {exp.month && exp.month.substring(0,3)} {exp.year}
                                     </div>
                                 </div>
                                 
                                 {/* Content Card */}
                                 <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm group-hover:border-brand-300 transition-colors relative">
                                    <button onClick={() => handleDelete(exp.exp_id, i)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={16}/></button>
                                    
                                    <h4 className="text-base font-black text-slate-900 dark:text-white pr-6">{exp.title}</h4>
                                    {exp.company && <div className="text-xs font-black tracking-widest uppercase text-brand-600 mt-1 mb-2">{exp.company}</div>}
                                    {exp.description && <p className="text-[13px] text-slate-600 dark:text-slate-400 mt-3 leading-relaxed border-t border-slate-50 dark:border-slate-800/50 pt-3">{exp.description}</p>}
                                 </div>
                             </div>
                         </div>
                     ))
                 ) : (
                     <div className="pl-10 text-slate-400 text-sm italic py-4">
                        No experiences timeline plotted yet.
                     </div>
                 )}
             </div>
        </div>
    )
}
