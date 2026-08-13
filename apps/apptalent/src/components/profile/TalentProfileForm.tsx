import React, { useEffect } from 'react';
import useProfileStore from '../../store/profileStore';
import InfoPanel from './InfoPanel';
import PhotosPanel from './PhotosPanel';
import AssetsPanel from './AssetsPanel';
import CreditsPanel from './CreditsPanel';

const TalentProfileForm = () => {
  const { name, setData, activeTab, setActiveTab } = useProfileStore();

  useEffect(() => {
    const mockData = {
      name: { first: "Orland", last: "Management" },
      contacts: { phone: "(088) 101–1430", email: "orlandmanagement@gmail.com" },
      personal: { gender: "Male", dob: "1986-05-06", loc: "State Line, PA", ethnicity: "Other" },
      personalLink: "https://orland.com",
      interestedIn: ["Acting", "Modeling"],
      skills: ["Improv", "Method Acting"],
      social: { facebook:"https://facebook.com/orland", instagram:"https://instagram.com/orland", tiktok:"", x:"", youtube:"", website:"", imdb:"", linkedin:"" },
      photos: { headshot:"", side:"", full:"", additional:[] },
      appearance: { height:"180 cm", weight:"75 kg", eye:"Brown", hair:"Black" },
      assets: { youtube:[], audio:[] },
      credits: []
    };
    setData(mockData);
  }, [setData]);

  const tabs = [
    { id: 'info', label: 'Info' },
    { id: 'photos', label: 'Photos' },
    { id: 'assets', label: 'Assets' },
    { id: 'credits', label: 'Credits' },
  ];

  const renderTabs = () => {
    return tabs.map((tab) => (
      <div
        key={tab.id}
        className={`font-bold text-slate-400 text-[14px] relative pb-2 cursor-pointer hover:text-violet-500 transition-colors whitespace-nowrap ${
          activeTab === tab.id ? 'tab-active' : ''
        }`}
        onClick={() => setActiveTab(tab.id)}
      >
        {tab.label}
      </div>
    ));
  };

  return (
    <div className="max-w-screen-lg mx-auto p-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-24 h-24 rounded-full bg-slate-200"></div>
        <div>
          <h1 className="text-3xl font-black text-slate-800">{name.first} {name.last}</h1>
          <p className="text-slate-500">Talent Profile</p>
        </div>
      </div>

      <div className="flex gap-6 border-b border-slate-200 mb-6">
        {renderTabs()}
      </div>

      {activeTab === 'info' && <InfoPanel />}
      {activeTab === 'photos' && <PhotosPanel />}
      {activeTab === 'assets' && <AssetsPanel />}
      {activeTab === 'credits' && <CreditsPanel />}

    </div>
  );
};

export default TalentProfileForm;
