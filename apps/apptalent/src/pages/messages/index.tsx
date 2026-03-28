import { useState, useRef, useEffect } from 'react';
import { Search, MoreVertical, Send, CheckCheck, ArrowLeft, Phone, Video as VideoIcon } from 'lucide-react';

// Data Simulasi Inbox (Tabel Pesan Masuk)
const INBOX_DATA = [
  { id: 1, name: 'Joko Anwar', type: 'PH Director', lastMsg: 'Apakah jadwal bulan depan kosong untuk screen test?', time: '10:42', unread: 2, avatar: 'bg-indigo-500' },
  { id: 2, name: 'Glow Soap ID', type: 'Brand / TVC', lastMsg: 'Kami sangat suka comp card kamu. Honor sudah kami transfer ke Orland.', time: 'Kemarin', unread: 0, avatar: 'bg-pink-500' },
  { id: 3, name: 'Sarah (KOL Specialist)', type: 'Influencer Agency', lastMsg: 'Bisa minta rate card untuk campaign TikTok?', time: '24 Mar', unread: 0, avatar: 'bg-emerald-500' },
];

export default function Messages() {
  const [activeChat, setActiveChat] = useState<any>(null); // Jika null, tampilkan Inbox List
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // State Pesan di dalam Chat Room
  const [messages, setMessages] = useState([
    { id: 1, sender: 'client', text: 'Halo! Saya lihat comp card kamu dari Orland. Karakter wajahnya sangat cocok.', time: '10:40', isRead: true },
    { id: 2, sender: 'client', text: 'Apakah jadwal bulan depan kosong untuk screen test?', time: '10:42', isRead: true },
  ]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { if (activeChat) scrollToBottom(); }, [messages, isTyping, activeChat]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;

    const newMsg = { id: Date.now(), sender: 'me', text: newMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isRead: false };
    setMessages(prev => [...prev, newMsg]);
    setNewMessage('');
    setIsTyping(true);

    // Simulasi Balasan
    setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => prev.map(m => m.sender === 'me' ? { ...m, isRead: true } : m)); // Centang Biru
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'client', text: 'Siaap, nanti tim saya hubungi lebih lanjut ya!', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isRead: true }]);
    }, 2000);
  };

  // ==========================================
  // VIEW 1: INBOX LIST (TABEL PESAN MASUK)
  // ==========================================
  if (!activeChat) {
      return (
          <div className="space-y-4 animate-in fade-in duration-300 pb-20">
              <div className="flex justify-between items-center mb-2 px-2">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pesan Masuk</h1>
                  <button className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300"><Search size={20}/></button>
              </div>

              <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60">
                  {INBOX_DATA.map((chat) => (
                      <div key={chat.id} onClick={() => setActiveChat(chat)} className="flex items-center p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                          {/* Avatar */}
                          <div className={`h-14 w-14 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm ${chat.avatar}`}>
                              {chat.name.charAt(0)}
                          </div>
                          
                          {/* Konten (Nama, Tipe, Pesan) */}
                          <div className="ml-4 flex-1 overflow-hidden">
                              <div className="flex justify-between items-start mb-1">
                                  <div className="flex flex-col">
                                      <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">{chat.name}</h3>
                                      <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded uppercase tracking-wider w-fit mt-0.5">{chat.type}</span>
                                  </div>
                                  <span className={`text-xs whitespace-nowrap ml-2 mt-1 ${chat.unread > 0 ? 'text-green-500 font-bold' : 'text-slate-400'}`}>{chat.time}</span>
                              </div>
                              <div className="flex justify-between items-center mt-1">
                                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate pr-2">{chat.lastMsg}</p>
                                  {chat.unread > 0 && <span className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0">{chat.unread}</span>}
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )
  }

  // ==========================================
  // VIEW 2: CHAT ROOM (WHATSAPP STYLE)
  // ==========================================
  return (
    <div className="fixed inset-0 z-50 bg-[#efeae2] dark:bg-[#0b141a] flex flex-col sm:static sm:h-[calc(100vh-8rem)] sm:rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl animate-in slide-in-from-right-8 duration-300">
        
        {/* WA Header */}
        <div className="bg-[#008069] dark:bg-[#202c33] p-3 sm:p-4 flex items-center shadow-md z-10 text-white">
            <button onClick={() => setActiveChat(null)} className="p-1 -ml-1 mr-2 hover:bg-white/10 rounded-full transition-colors flex items-center">
                <ArrowLeft size={24} />
                <div className={`h-10 w-10 ml-1 rounded-full flex items-center justify-center font-bold text-sm bg-white/20`}>{activeChat.name.charAt(0)}</div>
            </button>
            <div className="flex-1 cursor-pointer">
                <h1 className="text-base font-bold leading-tight">{activeChat.name}</h1>
                <p className="text-xs text-white/80">{activeChat.type}</p>
            </div>
            <div className="flex gap-4">
                <button><VideoIcon size={20}/></button>
                <button><Phone size={20}/></button>
                <button><MoreVertical size={20}/></button>
            </div>
        </div>

        {/* WA Chat Area (Background Doodle Pattern Simulation) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#efeae2] dark:bg-[#0b141a]" style={{ backgroundImage: 'url("https://transparenttextures.com/patterns/cubes.png")', opacity: 0.9 }}>
            <div className="text-center my-4"><span className="text-xs font-medium bg-white/60 dark:bg-slate-800/60 dark:text-slate-300 px-3 py-1 rounded-lg shadow-sm backdrop-blur-sm">Hari Ini</span></div>

            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`relative max-w-[85%] sm:max-w-md px-3 pt-2 pb-3 rounded-lg shadow-[0_1px_1px_rgba(0,0,0,0.1)] text-sm leading-relaxed ${msg.sender === 'me' ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-white rounded-tr-none' : 'bg-white dark:bg-[#202c33] text-slate-900 dark:text-white rounded-tl-none'}`}>
                        {msg.text}
                        <div className="absolute bottom-1 right-2 flex items-center gap-1">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400/80">{msg.time}</span>
                            {msg.sender === 'me' && (
                                <CheckCheck size={14} className={msg.isRead ? 'text-blue-500' : 'text-slate-400'} />
                            )}
                        </div>
                    </div>
                </div>
            ))}

            {isTyping && (
                <div className="flex justify-start">
                    <div className="bg-white dark:bg-[#202c33] px-4 py-3 rounded-lg rounded-tl-none shadow-sm flex gap-1 w-16">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* WA Input Form */}
        <div className="bg-[#f0f2f5] dark:bg-[#202c33] p-2.5 flex items-end gap-2">
            <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-2xl sm:rounded-full px-4 py-2 sm:py-3 shadow-sm border-none focus-within:ring-1 focus-within:ring-[#008069]">
                <textarea 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Ketik pesan" 
                    className="w-full bg-transparent outline-none dark:text-white text-sm resize-none max-h-32 min-h-[24px]"
                    rows={1}
                />
            </div>
            <button onClick={handleSendMessage} disabled={!newMessage.trim()} className="h-10 w-10 sm:h-12 sm:w-12 bg-[#00a884] disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-full flex items-center justify-center shrink-0 shadow-sm transition-colors">
                <Send size={20} className="ml-1" />
            </button>
        </div>
    </div>
  )
}
