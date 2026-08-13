import { useState, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  sender_id: string;
  room_id: string;
  message_text: string;
  attachment_url?: string;
  created_at: string;
}

export interface ChatRoom {
  id: string;
  project_id: string;
  project_name: string;
  recipient_name: string;
  recipient_avatar: string;
  last_message: string;
  unread_count: number;
  updated_at: string;
}

// Mock Database
const MOCK_ROOMS: ChatRoom[] = [
  {
    id: 'room-101',
    project_id: 'PRJ-XYZ999',
    project_name: 'TVC Iklan Susu Anak',
    recipient_name: 'Nusantara Productions (PH)',
    recipient_avatar: 'NP',
    last_message: 'Halo, jadwal shooting dimundurkan ke jam 8 pagi ya.',
    unread_count: 2,
    updated_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() // 5 menit lalu
  },
  {
    id: 'room-102',
    project_id: 'PRJ-XYZ102',
    project_name: 'Event Music Fest',
    recipient_name: 'Superb Events (EO)',
    recipient_avatar: 'SE',
    last_message: 'Oke siap. Baju sudah saya ambil di wardrobe.',
    unread_count: 0,
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 hari lalu
  }
];

const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  'room-101': [
    { id: 'm1', room_id: 'room-101', sender_id: 'talent-1', message_text: 'Halo kak, untuk lokasi pastinya dimana ya?', created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
    { id: 'm2', room_id: 'room-101', sender_id: 'client-1', message_text: 'Jalan Sudirman Kav 21 ya. Patokannya gedung biru.', created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
    { id: 'm3', room_id: 'room-101', sender_id: 'client-1', message_text: 'Halo, jadwal shooting dimundurkan ke jam 8 pagi ya.', created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
    { id: 'm4', room_id: 'room-101', sender_id: 'client-1', message_text: 'Ini referensi bajunya.', attachment_url: 'https://orland.app/files/ref_wardrobe.jpg', created_at: new Date(Date.now() - 1000 * 60 * 4).toISOString() },
  ]
};

export const useChat = (roomId?: string) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  
  // Simulasi Polling Interval untuk Room List (GET /chat/rooms)
  useEffect(() => {
    // Pada produksi, ini adalah websocket / polling
    setRooms(MOCK_ROOMS);
  }, []);

  // Simulasi Load Messages (GET /chat/rooms/:id/messages)
  useEffect(() => {
    if (roomId) {
      setMessages(MOCK_MESSAGES[roomId] || []);
    } else {
      setMessages([]);
    }
  }, [roomId]);

  // Simulasi Kirim Pesan (POST /chat/messages)
  const sendMessage = async (text: string, attachment_url?: string) => {
    if (!roomId || (!text.trim() && !attachment_url)) return;

    setIsSending(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const newMessage: ChatMessage = {
      id: `m-${Date.now()}`,
      room_id: roomId,
      sender_id: 'talent-1', // Assuming logged in user (Sisi Talent = talent, Sisi Klien = client)
      message_text: text,
      attachment_url,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMessage]);
    
    // Update local Last Message di list room
    setRooms(prevRooms => prevRooms.map(room => 
      room.id === roomId 
        ? { ...room, last_message: text || '[Attachment]', updated_at: newMessage.created_at }
        : room
    ).sort((a,b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())); // pindah ke atas

    setIsSending(false);
  };

  return {
    rooms,
    messages,
    sendMessage,
    isSending
  };
};
