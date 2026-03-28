import { useState, useRef, useEffect } from 'react';
import { Lock, CheckCircle2, Search, MoreVertical, Send, Loader2 } from 'lucide-react';

export default function Messages() {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // State Pesan Interaktif
  const [messages, setMessages] = useState([
    { id: 1, sender: 'client', text: 'Halo! Saya lihat comp card kamu dari Orland. Karakter wajahnya sangat cocok untuk film aksi saya berikutnya. Apakah jadwal bulan depan kosong?', time: '10:42 AM' },
    { id: 2, sender: 'me', text: 'Halo Mas Joko! Suatu kehormatan. Jadwal saya bulan depan masih *available*. Saya siap untuk screen test kapan saja.', time: '10:45 AM' }
  ]);

  // Efek Auto-Scroll ke pesan terbaru
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;

    const newMsg = { id: Date.now(), sender: 'me', text: newMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, newMsg]);
    setNewMessage('');
    setIsTyping(true);

    // Simulasi Balasan Real-Time (WebSocket/Durable Objects API)
    setTimeout(() => {
        setIsTyping(false);
        const replyMsg = { id: Date.now() + 1, sender: 'client', text: 'Luar biasa! Nanti tim saya (Mbak Sarah) akan mengirimkan undangan resmi beserta script-nya ke aplikasi Orland kamu ya. See you on set!', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        setMessages(prev => [...prev, replyMsg]);
        
        // Memicu Notifikasi OS jika diizinkan
        if (Notification.permission === "granted") {
            new Notification("Joko A. (Director)", { body: replyMsg.text, icon: "/icon.png" });
        }
    }, 2500);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-500 pb-4">
        
        {/* Header Chat */}
        <div className="bg-white dark:bg-dark-card p-4 rounded-t-3xl border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-sm z-10">
            <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Joko A. (Director)</h1>
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1 font-medium"><Lock size={10} className="mr-1"/> End-to-end encrypted by Orland</p>
            </div>
            <div className="flex gap-2 text-slate-400">
                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><Search size={20}/></button>
                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><MoreVertical size={20}/></button>
            </div>
        </div>

        {/* Area Chat Room */}
        <div className="flex-1 bg-slate-50 dark:bg-[#071122] border-x border-slate-200 dark:border-slate-800 p-4 sm:p-6 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800">
            <div className="text-center text-xs text-slate-400 font-bold uppercase tracking-widest my-4 bg-slate-200/50 dark:bg-slate-800/50 w-fit mx-auto px-4 py-1 rounded-full">Hari Ini</div>

            {messages.map((msg) => (
                <div key={msg.id} className={`flex items-start gap-3 max-w-[85%] sm:max-w-md ${msg.sender === 'me' ? 'ml-auto flex-row-reverse' : ''}`}>
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-md ${msg.sender === 'me' ? 'bg-brand-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
                        {msg.sender === 'me' ? 'ME' : 'JA'}
                    </div>
                    <div className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}>
                        <div className={`flex items-center gap-2 mb-1 ${msg.sender === 'me' ? 'flex-row-reverse' : ''}`}>
                            <span className="text-sm font-bold dark:text-white">{msg.sender === 'me' ? 'Anda' : 'Joko A.'}</span>
                            <span className="text-[10px] text-slate-400">{msg.time}</span>
                        </div>
                        <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.sender === 'me' ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 rounded-tl-none'}`}>
                            {msg.text}
                        </div>
                        {msg.sender === 'me' && <div className="mt-1 text-brand-500"><CheckCircle2 size={14} /></div>}
                    </div>
                </div>
            ))}

            {/* Indikator Typing */}
            {isTyping && (
                <div className="flex items-start gap-3 max-w-[85%]">
                    <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-md">JA</div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 dark:border-slate-700/50 flex items-center gap-1 w-16">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Chat */}
        <div className="bg-white dark:bg-dark-card p-4 rounded-b-3xl border border-slate-200 dark:border-slate-800 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
            <form onSubmit={handleSendMessage} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 p-2 rounded-full border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-brand-500/50 transition-all">
                <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Ketik pesan..." 
                    className="flex-1 bg-transparent px-4 py-2 outline-none dark:text-white text-sm" 
                />
                <button type="submit" disabled={!newMessage.trim() || isTyping} className="h-10 w-10 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-full flex items-center justify-center transition-colors shrink-0 shadow-md">
                    <Send size={18} className="ml-0.5" />
                </button>
            </form>
        </div>
    </div>
  )
}
