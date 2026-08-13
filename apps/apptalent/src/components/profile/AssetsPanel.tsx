import React from 'react';
import useProfileStore from '../../store/profileStore';

const AssetsPanel = () => {
  const { assets } = useProfileStore();

  return (
    <section className="panel block animate-[fadeIn_0.4s_ease-out]">
      <div className="mt-5 border border-slate-100 rounded-[16px] bg-white shadow-sm">
        <div className="flex justify-between items-center p-3.5 bg-gradient-to-r from-lime-50 to-green-50 border-b border-slate-100 border-l-4 border-l-lime-500">
          <div className="font-black text-[12px] text-lime-800 tracking-widest">ASSETS</div>
          <button className="bg-white text-lime-600 border border-lime-200 px-3 py-1 rounded-full font-black cursor-pointer text-[11px] hover:bg-lime-50 shadow-sm">✎ Manage Assets</button>
        </div>
        <div className="p-4">
          <div>
            <div className="text-[11px] text-slate-400 font-black uppercase mb-2">YOUTUBE VIDEOS</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assets.youtube.length > 0 ? (
                assets.youtube.map((video, index) => (
                  <div key={index} className="border border-slate-50 bg-slate-50 rounded-xl p-3">
                    <a href={video} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">{video}</a>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-sm">No YouTube videos added.</div>
              )}
            </div>
          </div>
          <div className="mt-4">
            <div className="text-[11px] text-slate-400 font-black uppercase mb-2">AUDIO FILES</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assets.audio.length > 0 ? (
                assets.audio.map((audio, index) => (
                  <div key={index} className="border border-slate-50 bg-slate-50 rounded-xl p-3">
                    <a href={audio} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">{audio}</a>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-sm">No audio files added.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AssetsPanel;
