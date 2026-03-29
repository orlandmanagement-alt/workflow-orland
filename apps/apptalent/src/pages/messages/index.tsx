import React, { useState, useEffect, useRef } from 'react';
import { useChat, ChatRoom } from '@/hooks/useChat';
import { Search, Send, Paperclip, ChevronLeft, MoreVertical, MessageSquare, Image as ImageIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function MessagesHub() {
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const { rooms, messages, sendMessage, isSending } = useChat(activeRoomId || undefined);
  
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeRoom = rooms.find(r => r.id === activeRoomId);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim() || !activeRoomId) return;
    sendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="h-[calc(100vh-100px)] w-full max-w-7xl mx-auto flex rounded-3xl overflow-hidden bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 shadow-xl relative">
      
      {/* LEFT COLUMN: ROOM LIST */}
      <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50 dark:bg-[#071122] ${activeRoomId ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
           <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <MessageSquare size={20} className="text-brand-600" /> Pusat Pesan
           </h2>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                 type="text" 
                 placeholder="Cari Pesan..." 
                 className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
           </div>
        </div>

        {/* Room List Engine */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
           {rooms.map(room => (
             <button 
               key={room.id}
               onClick={() => setActiveRoomId(room.id)}
               className={`w-full text-left p-3 rounded-2xl flex items-center gap-3 transition-colors
                  ${activeRoomId === room.id ? 'bg-brand-500 text-white shadow-md' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-white'}
               `}
             >
                {/* Avatar Initial */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${activeRoomId === room.id ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700 text-brand-600'}`}>
                   {room.recipient_avatar}
                </div>
                
                <div className="flex-1 min-w-0">
                   <div className="flex justify-between items-start mb-0.5">
                     <p className={`font-bold truncate text-sm ${activeRoomId === room.id ? 'text-white' : 'text-slate-900 dark:text-slate-200'}`}>
                        {room.recipient_name}
                     </p>
                     <span className={`text-[10px] font-medium whitespace-nowrap mt-0.5 ${activeRoomId === room.id ? 'text-white/80' : 'text-slate-400'}`}>
                        {formatDistanceToNow(new Date(room.updated_at))}
                     </span>
                   </div>
                   <p className={`text-xs truncate ${activeRoomId === room.id ? 'text-white/80' : 'text-slate-500'}`}>
                      {room.last_message}
                   </p>
                   <p className={`text-[10px] mt-1 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest inline-block ${activeRoomId === room.id ? 'bg-black/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                      {room.project_id}
                   </p>
                </div>

                {room.unread_count > 0 && activeRoomId !== room.id && (
                   <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                     {room.unread_count}
                   </span>
                )}
             </button>
           ))}
        </div>
      </div>


      {/* RIGHT COLUMN: BUBBLE CHAT */}
      <div className={`flex-1 flex flex-col bg-[#e5ddd5] dark:bg-[#0b141a] relative ${!activeRoomId ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
         
         {!activeRoomId ? (
            <div className="text-center text-slate-500 dark:text-slate-400 p-8 space-y-4">
               <MessageSquare size={64} className="mx-auto opacity-20" />
               <h3 className="text-xl font-bold">Orland Secure Chat</h3>
               <p className="text-sm max-w-xs mx-auto">Komunikasi Anda dikunci berdasarkan ID Proyek untuk menjamin keamanan transaksional.</p>
               <span className="inline-block mt-4 text-[10px] font-black tracking-widest uppercase bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full">End-to-end Protected</span>
            </div>
         ) : (
            <>
              {/* Chat Header */}
              <div className="h-16 bg-white dark:bg-[#202c33] border-b border-slate-200 dark:border-slate-800 flex items-center px-4 justify-between z-10 shadow-sm relative">
                <div className="flex items-center gap-3">
                  <button onClick={() => setActiveRoomId(null)} className="md:hidden p-2 -ml-2 text-slate-500">
                    <ChevronLeft size={24} />
                  </button>
                  <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center font-bold text-brand-600">
                     {activeRoom?.recipient_avatar}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{activeRoom?.recipient_name}</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Project: {activeRoom?.project_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-[10px] font-bold rounded-full border border-green-200 dark:border-green-500/30">Secure Channel</span>
                  <button className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>

              {/* Chat Canvas (Messages) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[url('https://whatsapp.com/img/bg-chat-tile-light.png')] dark:bg-[url('https://whatsapp.com/img/bg-chat-tile-dark.png')] bg-repeat opacity-95">
                 
                 <div className="text-center mb-6">
                   <span className="bg-amber-100 text-amber-800 dark:bg-[#182229] dark:text-amber-300/80 text-[11px] font-bold px-4 py-1.5 rounded-lg shadow-sm border border-amber-200 dark:border-slate-800/50 inline-block">
                     Pesan diproteksi secara otomatis demi keamanan aset Proyek "{activeRoom?.project_name}".
                   </span>
                 </div>

                 {messages.map((msg) => {
                   const isMe = msg.sender_id === 'talent-1'; // Sesuaikan simulasi role Anda
                   return (
                     <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[75%] lg:max-w-[65%] rounded-2xl px-4 py-2 relative shadow-sm text-sm
                         ${isMe 
                            ? 'bg-brand-600 dark:bg-brand-600 text-white rounded-tr-none' 
                            : 'bg-white dark:bg-[#202c33] text-slate-900 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-transparent'}
                       `}>
                          {msg.attachment_url && (
                             <div className="mb-2 w-full max-w-[200px] h-[150px] bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center border border-black/10">
                                <ImageIcon size={32} className="opacity-50" />
                                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${msg.attachment_url})`}} />
                             </div>
                          )}
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.message_text}</p>
                          <div className={`text-[9px] font-bold mt-1 text-right  ${isMe ? 'text-brand-200' : 'text-slate-400'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                       </div>
                     </div>
                   );
                 })}
                 <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Field */}
              <div className="h-20 bg-slate-100 dark:bg-[#202c33] border-t border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-3 relative z-10">
                 <button className="p-3 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors flex-shrink-0">
                    <Paperclip size={20} />
                 </button>
                 <input 
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Ketik balasan..."
                    className="flex-1 h-12 bg-white dark:bg-[#2a3942] rounded-2xl px-5 text-sm outline-none border border-slate-200 dark:border-transparent focus:ring-2 focus:ring-brand-500 shadow-sm text-slate-900 dark:text-white"
                 />
                 <button 
                    onClick={handleSend}
                    disabled={isSending || !inputText.trim()}
                    className="p-3 bg-brand-600 hover:bg-brand-700 text-white rounded-full transition-colors shadow-md disabled:opacity-50 flex-shrink-0"
                 >
                    <Send size={20} className={isSending ? "animate-pulse" : ""} />
                 </button>
              </div>

            </>
         )}

      </div>

    </div>
  );
}
