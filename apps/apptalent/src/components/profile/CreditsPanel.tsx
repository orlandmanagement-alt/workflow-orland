import React from 'react';
import useProfileStore from '../../store/profileStore';

const CreditsPanel = () => {
  const { credits } = useProfileStore();

  return (
    <section className="panel block animate-[fadeIn_0.4s_ease-out]">
      <div className="mt-5 border border-slate-100 rounded-[16px] bg-white shadow-sm">
        <div className="flex justify-between items-center p-3.5 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-slate-100 border-l-4 border-l-amber-500">
          <div className="font-black text-[12px] text-amber-800 tracking-widest">CREDITS</div>
          <button className="bg-white text-amber-600 border border-amber-200 px-3 py-1 rounded-full font-black cursor-pointer text-[11px] hover:bg-amber-50 shadow-sm">✎ Add Credit</button>
        </div>
        <div className="p-4">
          {credits.length > 0 ? (
            <div className="space-y-4">
              {credits.map((credit, index) => (
                <div key={index} className="border border-slate-50 bg-slate-50 rounded-xl p-3 flex gap-4">
                  {credit.photo && <img src={credit.photo} alt={credit.title} className="w-24 h-24 rounded-lg object-cover" />}
                  <div>
                    <div className="font-black text-slate-800">{credit.title} ({credit.year})</div>
                    <div className="text-sm text-slate-600">{credit.company}</div>
                    <p className="text-sm text-slate-500 mt-2">{credit.about}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-400 text-sm">No credits added.</div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CreditsPanel;
