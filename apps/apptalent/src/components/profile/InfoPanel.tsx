import React from 'react';
import useProfileStore from '../../store/profileStore';

const InfoPanel = () => {
  const { personal, interestedIn, skills, appearance } = useProfileStore();

  const interestedIn = personal.interests || [];

  return (
    <section className="panel block animate-[fadeIn_0.4s_ease-out]">
      <div className="mt-5 border border-slate-100 rounded-[16px] bg-white shadow-sm">
        <div className="flex justify-between items-center p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-100 border-l-4 border-l-emerald-500">
          <div className="font-black text-[12px] text-emerald-800 tracking-widest">PERSONAL</div>
          <button className="bg-white text-emerald-600 border border-emerald-200 px-3 py-1 rounded-full font-black cursor-pointer text-[11px] hover:bg-emerald-50 shadow-sm">✎ Edit</button>
        </div>
        <div className="p-4 grid grid-cols-2 gap-4">
          <div className="border border-slate-50 bg-slate-50 rounded-xl p-3"><div className="text-[11px] text-slate-400 font-black uppercase">Gender</div><div className="text-[14px] font-black text-slate-800">{personal.gender || '-'}</div></div>
          <div className="border border-slate-50 bg-slate-50 rounded-xl p-3"><div className="text-[11px] text-slate-400 font-black uppercase">DOB</div><div className="text-[14px] font-black text-slate-800">{personal.dob ? new Date(personal.dob).toLocaleDateString() : '-'}</div></div>
          <div className="border border-slate-50 bg-slate-50 rounded-xl p-3"><div className="text-[11px] text-slate-400 font-black uppercase">Location</div><div className="text-[14px] font-black text-slate-800 truncate">{personal.loc || '-'}</div></div>
          <div className="border border-slate-50 bg-slate-50 rounded-xl p-3"><div className="text-[11px] text-slate-400 font-black uppercase">Ethnicity</div><div className="text-[14px] font-black text-slate-800">{personal.ethnicity || '-'}</div></div>
        </div>
      </div>

      <div className="mt-5 border border-slate-100 rounded-[16px] bg-white shadow-sm">
        <div className="flex justify-between items-center p-3.5 bg-gradient-to-r from-sky-50 to-cyan-50 border-b border-slate-100 border-l-4 border-l-sky-500">
          <div className="font-black text-[12px] text-sky-800 tracking-widest">INTERESTED IN</div>
          <button className="bg-white text-sky-600 border border-sky-200 px-3 py-1 rounded-full font-black cursor-pointer text-[11px] hover:bg-sky-50 shadow-sm">✎ Edit</button>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {interestedIn.length > 0 ? (
              interestedIn.map((interest, index) => (
                <div key={index} className="bg-sky-50 text-sky-800 text-xs font-semibold px-2.5 py-1 rounded-full">{interest}</div>
              ))
            ) : (
              <div className="text-slate-400 text-sm">No interests specified.</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 border border-slate-100 rounded-[16px] bg-white shadow-sm">
        <div className="flex justify-between items-center p-3.5 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-slate-100 border-l-4 border-l-violet-500">
          <div className="font-black text-[12px] text-violet-800 tracking-widest">SKILLS</div>
          <button className="bg-white text-violet-600 border border-violet-200 px-3 py-1 rounded-full font-black cursor-pointer text-[11px] hover:bg-violet-50 shadow-sm">✎ Edit</button>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {skills.length > 0 ? (
              skills.map((skill, index) => (
                <div key={index} className="bg-violet-50 text-violet-800 text-xs font-semibold px-2.5 py-1 rounded-full">{skill}</div>
              ))
            ) : (
              <div className="text-slate-400 text-sm">No skills specified.</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 border border-slate-100 rounded-[16px] bg-white shadow-sm">
        <div className="flex justify-between items-center p-3.5 bg-gradient-to-r from-rose-50 to-pink-50 border-b border-slate-100 border-l-4 border-l-rose-500">
          <div className="font-black text-[12px] text-rose-800 tracking-widest">APPEARANCE</div>
          <button className="bg-white text-rose-600 border border-rose-200 px-3 py-1 rounded-full font-black cursor-pointer text-[11px] hover:bg-rose-50 shadow-sm">✎ Edit</button>
        </div>
        <div className="p-4 grid grid-cols-2 gap-4">
          <div className="border border-slate-50 bg-slate-50 rounded-xl p-3"><div className="text-[11px] text-slate-400 font-black uppercase">Height</div><div className="text-[14px] font-black text-slate-800">{appearance.height || '-'}</div></div>
          <div className="border border-slate-50 bg-slate-50 rounded-xl p-3"><div className="text-[11px] text-slate-400 font-black uppercase">Weight</div><div className="text-[14px] font-black text-slate-800">{appearance.weight || '-'}</div></div>
          <div className="border border-slate-50 bg-slate-50 rounded-xl p-3"><div className="text-[11px] text-slate-400 font-black uppercase">Eye Color</div><div className="text-[14px] font-black text-slate-800">{appearance.eye || '-'}</div></div>
          <div className="border border-slate-50 bg-slate-50 rounded-xl p-3"><div className="text-[11px] text-slate-400 font-black uppercase">Hair Color</div><div className="text-[14px] font-black text-slate-800">{appearance.hair || '-'}</div></div>
        </div>
      </div>

    </section>
  );
};

export default InfoPanel;
