import { useState } from 'react';
import { Search, Send, CheckCheck, User, Paperclip, MoreVertical, Phone, Video } from 'lucide-react';

const MOCK_CHATS = [
  { id: 'CH-1', name: 'Sarah Lee', role: 'Talent (Main)', project: 'TVC Glow Soap', lastMsg: 'Baik pak, kostum putih sudah saya siapkan.', time: '10:45', unread: 2, avatar: 'bg-indigo-500' },
  { id: 'CH-2', name: 'Budi Santoso', role: 'Talent (Action)', project: 'Film Garuda', lastMsg: 'Untuk sesi latihan fisik besok jam berapa ya?', time: 'Kemarin', unread: 0, avatar: 'bg-emerald-500' },
  { id: 'CH-3', name: 'Admin Orland', role: 'Support', project: 'General', lastMsg: 'Invoice INV-2026-001 sudah kami verifikasi.', time: '27 Mar', unread: 0, avatar: 'bg-slate-900' },
];

export default function ClientMessages() {
  const [activeChat, setActiveChat] = useState<any>(null);
  const [inputText, setInputText] = useState("");

  const maskText = (txt: string) => {
    // Perbaikan: Menambahkan \ sebelum + agar terbaca sebagai karakter plus, bukan quantifier regex
    const phoneRegex = /(\+62|62|0)8[1-9][0-9]{6,10}/g;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    
    return txt.replace(phoneRegex, "[No HP dilarang]")
              .replace(emailRegex, "[Email dilarang]");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskText(e.target.value);
    setInputText(masked);
  };

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-white dark:bg-dark-card animate-in fade-in duration-500 border-t border-slate-100 dark:border-slate-800">
      
      {/* SIDEBAR: DAFTAR CHAT */}
      <div className={`w-full md:w-[350px] flex-shrink-0 border-r border-slate-100 dark:border-slate-800 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input placeholder="Cari pesan atau talent..." className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/50">
          {MOCK_CHATS.map(chat => (
            <div 
              key={chat.id} 
              onClick={() => setActiveChat(chat)}
              className={`p-4 flex gap-3 cursor-pointer transition-colors ${activeChat?.id === chat.id ? 'bg-brand-50 dark:bg-brand-900/10 border-r-4 border-brand-500' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
            >
              <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${chat.avatar}`}>{chat.name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{chat.name}</h4>
                  <span className="text-[10px] text-slate-400">{chat.time}</span>
                </div>
                <p className="text-[10px] font-black text-brand-500 uppercase tracking-tighter mb-1">{chat.project}</p>
                <p className="text-xs text-slate-500 truncate">{chat.lastMsg}</p>
              </div>
              {chat.unread > 0 && <div className="h-5 w-5 bg-brand-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold mt-2 shadow-lg shadow-brand-500/30">{chat.unread}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className={`flex-1 flex flex-col bg-[#efeae2] dark:bg-[#0b141a] ${!activeChat ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {!activeChat ? (
          <div className="text-center opacity-30 flex flex-col items-center">
            <div className="h-20 w-20 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4"><User size={40}/></div>
            <p className="font-bold text-slate-500">Pilih obrolan untuk memulai koordinasi</p>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-[#202c33] p-3 px-6 flex justify-between items-center shadow-sm z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveChat(null)} className="md:hidden text-slate-500 mr-2"><ArrowRight size={20} className="rotate-180" /></button>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${activeChat.avatar}`}>{activeChat.name.charAt(0)}</div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">{activeChat.name}</h3>
                  <p className="text-[10px] text-brand-500 font-bold uppercase">{activeChat.role} • {activeChat.project}</p>
                </div>
              </div>
              <div className="flex gap-4 text-slate-500 dark:text-slate-400">
                <Video size={20} className="cursor-pointer" />
                <Phone size={20} className="cursor-pointer" />
                <MoreVertical size={20} className="cursor-pointer" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ backgroundImage: 'url("https://transparenttextures.com/patterns/cubes.png")', opacity: 0.9 }}>
               <div className="flex justify-start">
                  <div className="bg-white dark:bg-[#202c33] p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[80%]">
                    <p className="text-sm dark:text-white">Halo pak, saya sudah kirim video draft untuk scene 2 ya.</p>
                    <p className="text-[9px] text-slate-400 text-right mt-1">10:40</p>
                  </div>
               </div>
            </div>

            <div className="p-3 bg-white dark:bg-[#202c33] flex items-center gap-3">
              <button className="p-2 text-slate-500"><Paperclip size={20}/></button>
              <input 
                placeholder="Dilarang share No HP/Email..." 
                value={inputText} 
                onChange={handleInputChange}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-[#2a3942] rounded-xl text-sm outline-none dark:text-white" 
              />
              <button className="h-10 w-10 bg-brand-600 rounded-full flex items-center justify-center text-white shadow-lg"><Send size={18} className="ml-1"/></button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
