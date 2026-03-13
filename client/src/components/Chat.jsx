import React, { useState, useEffect, useRef } from 'react';
import { Send, User, X, Minimize2, Maximize2, MessageSquare } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000');

const Chat = ({ otherUserId, otherUserName, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const scrollRef = useRef();

  // Generate a consistent room ID regardless of who starts the chat
  const roomId = [user.id, otherUserId].sort().join('_');

  useEffect(() => {
    if (user?.id && otherUserId) {
      fetchMessages();
      
      // Join socket room
      socket.emit('join_room', { room: roomId });

      // Listen for real-time messages
      socket.on('receive_message', (data) => {
        // Only add if not already present (to avoid double entry from sender)
        setMessages(prev => {
          if (prev.find(m => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      });

      return () => {
        socket.off('receive_message');
      };
    }
  }, [user, otherUserId, roomId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, minimized]);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/chat/${user.id}/${otherUserId}`);
      setMessages(res.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const res = await api.post('/chat', {
        senderId: user.id,
        receiverId: otherUserId,
        content: newMessage
      });
      
      const sentMsg = res.data;
      
      // Emit to socket room
      socket.emit('send_message', { 
        room: roomId, 
        message: sentMsg 
      });

      // Update local state immediately
      setMessages(prev => [...prev, sentMsg]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 w-64 bg-primary text-white p-4 rounded-2xl shadow-2xl flex justify-between items-center cursor-pointer" onClick={() => setMinimized(false)}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm truncate">{otherUserName}</span>
        </div>
        <div className="flex gap-2">
          <Maximize2 className="w-4 h-4" />
          <X className="w-4 h-4" onClick={(e) => { e.stopPropagation(); onClose(); }} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-white rounded-2xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="p-4 bg-primary text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-sm">{otherUserName}</p>
            <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold">Online</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setMinimized(true)} className="p-1 hover:bg-white/10 rounded">
            <Minimize2 className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {loading ? (
          <p className="text-center text-slate-400 text-xs py-10">Loading chat...</p>
        ) : messages.length > 0 ? (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                msg.senderId === user.id 
                ? 'bg-primary text-white rounded-tr-none' 
                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
              }`}>
                {msg.content}
                <p className={`text-[9px] mt-1 ${msg.senderId === user.id ? 'text-white/60' : 'text-slate-400'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-slate-400 text-xs font-medium">No messages yet. Say hi!</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2">
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button type="submit" className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default Chat;
