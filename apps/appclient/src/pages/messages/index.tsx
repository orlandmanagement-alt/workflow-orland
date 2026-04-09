import { useState, useEffect, useRef } from 'react';
import { Search, Send, CheckCheck, User, Paperclip, MoreVertical, Phone, Video, ArrowRight, MessageCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

interface Chat {
  thread_id: string;
  project_id: string;
  client_id: string;
  talent_id: string;
  subject: string;
  is_archived: number;
  created_at: string;
  last_message_at: string;
  message_count: number;
  unread_count: number;
  last_message: string;
  avatar?: string;
  name?: string;
  role?: string;
}

interface Message {
  message_id: string;
  thread_id: string;
  sender_id: string;
  sender_role: string;
  recipient_id: string;
  body: string;
  attachment_url?: string;
  attachment_type?: string;
  is_read: number;
  created_at: string;
  deleted_by?: string;
  is_deleted: number;
}

const API_BASE = 'https://api.orlandmanagement.com/api/v1';

export default function ClientMessages() {
  const [threads, setThreads] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch threads on mount
  useEffect(() => {
    fetchThreads();
    const interval = setInterval(fetchThreads, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch messages when active chat changes
  useEffect(() => {
    if (activeChat) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000); // Refresh messages every 3 seconds
      return () => clearInterval(interval);
    }
  }, [activeChat]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchThreads = async () => {
    try {
      const response = await axios.get(`${API_BASE}/messages/threads`, {
        withCredentials: true,
      });
      
      if (response.data.success) {
        const formattedThreads = response.data.data.map((thread: any) => ({
          ...thread,
          name: thread.talent_id ? `Talent ${thread.talent_id.substring(0, 5)}` : 'Unknown',
          role: 'Talent',
          avatar: 'bg-indigo-500',
        }));
        setThreads(formattedThreads);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching threads:', err);
      setError('Gagal memuat chat');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!activeChat) return;

    try {
      const response = await axios.get(`${API_BASE}/messages/${activeChat.thread_id}`, {
        withCredentials: true,
      });

      if (response.data.success) {
        setMessages(response.data.data.messages || []);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeChat || sending) return;

    setSending(true);
    try {
      const response = await axios.post(
        `${API_BASE}/messages`,
        {
          thread_id: activeChat.thread_id,
          recipient_id: activeChat.talent_id === '' ? activeChat.talent_id : activeChat.client_id,
          body: inputText.trim(),
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        setInputText("");
        await fetchMessages();
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Gagal mengirim pesan');
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await axios.delete(`${API_BASE}/messages/${messageId}`, {
        withCredentials: true,
      });
      await fetchMessages();
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const filteredThreads = threads.filter(thread =>
    thread.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.last_message?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center bg-white dark:bg-dark-card">
        <Loader2 size={32} className="animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-white dark:bg-dark-card animate-in fade-in duration-500 border-t border-slate-100 dark:border-slate-800">
      
      {/* SIDEBAR: DAFTAR CHAT */}
      <div className={`w-full md:w-[350px] flex-shrink-0 border-r border-slate-100 dark:border-slate-800 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              placeholder="Cari pesan atau talent..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-500" 
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/50">
          {filteredThreads.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm">Tidak ada chat</div>
          ) : (
            filteredThreads.map(chat => (
              <div 
                key={chat.thread_id} 
                onClick={() => setActiveChat(chat)}
                className={`p-4 flex gap-3 cursor-pointer transition-colors ${activeChat?.thread_id === chat.thread_id ? 'bg-brand-50 dark:bg-brand-900/10 border-r-4 border-brand-500' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
              >
                <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${chat.avatar}`}>
                  {chat.name?.charAt(0) || 'T'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{chat.subject}</h4>
                    <span className="text-[10px] text-slate-400">
                      {new Date(chat.last_message_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-[10px] font-black text-brand-500 uppercase tracking-tighter mb-1">
                    {chat.message_count} pesan
                  </p>
                  <p className="text-xs text-slate-500 truncate line-clamp-1">{chat.last_message}</p>
                </div>
                {chat.unread_count > 0 && (
                  <div className="h-5 w-5 bg-brand-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold mt-2 shadow-lg shadow-brand-500/30">
                    {chat.unread_count}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className={`flex-1 flex flex-col bg-[#efeae2] dark:bg-[#0b141a] ${!activeChat ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {!activeChat ? (
          <div className="text-center opacity-30 flex flex-col items-center">
            <MessageCircle size={40} className="mb-4" />
            <p className="font-bold text-slate-500">Pilih obrolan untuk memulai koordinasi</p>
          </div>
        ) : (
          <>
            {/* CHAT HEADER */}
            <div className="bg-white dark:bg-[#202c33] p-3 px-6 flex justify-between items-center shadow-sm z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveChat(null)} className="md:hidden text-slate-500 mr-2">
                  <ArrowRight size={20} className="rotate-180" />
                </button>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${activeChat.avatar}`}>
                  {activeChat.name?.charAt(0) || 'T'}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">{activeChat.subject}</h3>
                  <p className="text-[10px] text-brand-500 font-bold uppercase">
                    {activeChat.message_count} pesan
                  </p>
                </div>
              </div>
              <div className="flex gap-4 text-slate-500 dark:text-slate-400">
                <Video size={20} className="cursor-pointer" />
                <Phone size={20} className="cursor-pointer" />
                <MoreVertical size={20} className="cursor-pointer" />
              </div>
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-slate-400 py-8">Mulai percakapan</div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.message_id} className={`flex ${msg.sender_id === activeChat.client_id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] group`}>
                      <div className={`p-3 rounded-2xl shadow-sm ${
                        msg.sender_id === activeChat.client_id
                          ? 'bg-brand-500 text-white rounded-br-none'
                          : 'bg-white dark:bg-[#202c33] text-slate-900 dark:text-white rounded-bl-none'
                      }`}>
                        <p className="text-sm">{msg.body}</p>
                        {msg.attachment_url && (
                          <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="text-xs mt-2 opacity-75 underline">
                            📎 Attachment
                          </a>
                        )}
                        <p className={`text-[9px] mt-1 ${
                          msg.sender_id === activeChat.client_id ? 'text-white/70' : 'text-slate-400'
                        }`}>
                          {new Date(msg.created_at).toLocaleTimeString()}
                          {msg.is_read === 1 && msg.sender_id === activeChat.client_id && ' ✓✓'}
                        </p>
                      </div>
                      {msg.sender_id === activeChat.client_id && (
                        <button
                          onClick={() => handleDeleteMessage(msg.message_id)}
                          className="text-[10px] text-slate-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* INPUT AREA */}
            <div className="p-3 bg-white dark:bg-[#202c33] flex items-center gap-3">
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                <Paperclip size={20} />
              </button>
              <input 
                placeholder="Tulis pesan..." 
                value={inputText} 
                onChange={handleInputChange}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={sending}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-[#2a3942] rounded-xl text-sm outline-none dark:text-white disabled:opacity-50" 
              />
              <button 
                onClick={handleSendMessage}
                disabled={sending || !inputText.trim()}
                className="h-10 w-10 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
              >
                {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-1" />}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-sm">✕</button>
        </div>
      )}
    </div>
  );
}
