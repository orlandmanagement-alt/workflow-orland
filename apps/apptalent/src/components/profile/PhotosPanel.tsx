import React from 'react';
import useProfileStore from '../../store/profileStore';

const PhotosPanel = () => {
  const { photos } = useProfileStore();

  return (
    <section className="panel block animate-[fadeIn_0.4s_ease-out]">
      <div className="mt-5 border border-slate-100 rounded-[16px] bg-white shadow-sm">
        <div className="flex justify-between items-center p-3.5 bg-gradient-to-r from-red-50 to-orange-50 border-b border-slate-100 border-l-4 border-l-red-500">
          <div className="font-black text-[12px] text-red-800 tracking-widest">PHOTOS</div>
          <button className="bg-white text-red-600 border border-red-200 px-3 py-1 rounded-full font-black cursor-pointer text-[11px] hover:bg-red-50 shadow-sm">✎ Manage Photos</button>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-slate-50 bg-slate-50 rounded-xl p-3">
              <div className="text-[11px] text-slate-400 font-black uppercase mb-2">HEADSHOT</div>
              {photos.headshot ? <img src={photos.headshot} alt="Headshot" className="rounded-lg" /> : <div className="text-slate-400 text-sm">No headshot uploaded.</div>}
            </div>
            <div className="border border-slate-50 bg-slate-50 rounded-xl p-3">
              <div className="text-[11px] text-slate-400 font-black uppercase mb-2">SIDE PROFILE</div>
              {photos.side ? <img src={photos.side} alt="Side Profile" className="rounded-lg" /> : <div className="text-slate-400 text-sm">No side profile uploaded.</div>}
            </div>
            <div className="border border-slate-50 bg-slate-50 rounded-xl p-3">
              <div className="text-[11px] text-slate-400 font-black uppercase mb-2">FULL BODY</div>
              {photos.full ? <img src={photos.full} alt="Full Body" className="rounded-lg" /> : <div className="text-slate-400 text-sm">No full body photo uploaded.</div>}
            </div>
          </div>
          <div className="mt-4">
            <div className="text-[11px] text-slate-400 font-black uppercase mb-2">ADDITIONAL PHOTOS</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {photos.additional.length > 0 ? (
                photos.additional.map((photo, index) => (
                  <img key={index} src={photo} alt={`Additional Photo ${index + 1}`} className="rounded-lg" />
                ))
              ) : (
                <div className="text-slate-400 text-sm">No additional photos uploaded.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PhotosPanel;
