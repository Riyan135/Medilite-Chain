import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MoreVertical,
  Paperclip,
  Send,
  Phone,
  Video,
  CheckCircle2,
  Clock3,
  User as UserIcon,
  MessageSquare
} from 'lucide-react';

import Sidebar from '../components/Sidebar';
import AdminTopbar from '../components/AdminTopbar';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';

const NotificationCenter = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      // Exclude the current admin and sort alphabetically
      const others = data.filter(u => u.id !== user?.id).sort((a,b) => a.name.localeCompare(b.name));
      setChats(others.map(u => ({
        ...u,
        avatar: `https://i.pravatar.cc/150?u=${u.id}`,
        online: false
      })));
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id && activeChat) {
      const roomId = [user.id, activeChat.id].sort().join('_');
      const socket = getSocket();
      socket.emit('join_room', { room: roomId });
       
      fetchMessages(activeChat.id);

      const handleReceiveMessage = (data) => {
        setMessages(prev => {
          if (prev.find(m => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      };

      socket.on('receive_message', handleReceiveMessage);
      return () => socket.off('receive_message', handleReceiveMessage);
    }
  }, [user, activeChat]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async (otherId) => {
    try {
      const { data } = await api.get(`/chat/${user.id}/${otherId}`);
      setMessages(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    try {
      const socket = getSocket();
      const res = await api.post('/chat', {
        senderId: user.id,
        receiverId: activeChat.id,
        content: inputText
      });
      const sentMsg = res.data;
      const roomId = [user.id, activeChat.id].sort().join('_');
      
      socket.emit('send_message', { room: roomId, message: sentMsg });
      setMessages(prev => [...prev, sentMsg]);
      setInputText('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f0f4f8]">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden px-4 md:px-8 pt-20 md:pt-8 pb-8">
        <AdminTopbar
          title="Support Chat Facility"
          subtitle="Real-time communication with doctors, patients, and internal staff."
        />

        <div className="flex-1 mt-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex">
          {/* Chat List Sidebar */}
          <div className="w-full md:w-80 lg:w-96 border-r border-slate-100 flex flex-col bg-slate-50/50">
            <div className="p-5 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm font-medium"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {loading ? (
                <div className="p-5 text-slate-400 text-sm">Loading users...</div>
              ) : chats.length === 0 ? (
                <div className="p-5 text-slate-400 text-sm">No users found.</div>
              ) : (
                chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setActiveChat(chat)}
                    className={`w-full text-left p-5 flex items-center gap-4 transition-all border-b border-slate-100 last:border-none ${
                      activeChat?.id === chat.id
                        ? 'bg-blue-50/50 border-l-4 border-l-blue-600'
                        : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img src={chat.avatar} alt={chat.name} className="w-12 h-12 rounded-full object-cover shadow-sm border-2 border-white" />
                      {chat.online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-bold text-slate-900 truncate pr-2">{chat.name}</h3>
                      </div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{chat.role}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Main Window */}
          <div className="flex-1 flex flex-col bg-white">
            {activeChat ? (
              <>
                <div className="h-20 px-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <img src={activeChat.avatar} alt={activeChat.name} className="w-10 h-10 rounded-full object-cover" />
                      {activeChat.online && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                      )}
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900">{activeChat.name}</h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          activeChat.role === 'DOCTOR' ? 'bg-blue-100 text-blue-700' :
                          activeChat.role === 'PATIENT' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {activeChat.role}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {activeChat.online ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                      <Phone className="w-5 h-5" />
                    </button>
                    <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                      <Video className="w-5 h-5" />
                    </button>
                    <div className="w-px h-6 bg-slate-200 mx-1"></div>
                    <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 space-y-6 bg-slate-50/30">
                  <div className="text-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                      Start of conversation
                    </span>
                  </div>
                  {messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] md:max-w-[60%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`px-5 py-3.5 rounded-2xl shadow-sm ${
                            isMe 
                              ? 'bg-blue-600 text-white rounded-br-sm' 
                              : 'bg-white border border-slate-100 text-slate-700 rounded-bl-sm'
                          }`}>
                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1.5 text-xs font-medium text-slate-400 px-1">
                            <Clock3 className="w-3 h-3" />
                            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMe && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 ml-1" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-5 bg-white border-t border-slate-100 shrink-0">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <button type="button" className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors shrink-0">
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type your message here..."
                        className="w-full pl-5 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-full focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm"
                      />
                      <button type="submit" disabled={!inputText.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/20 transition-all disabled:opacity-50">
                        <Send className="w-4 h-4 ml-0.5" />
                      </button>
                    </div>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                  <MessageSquare className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-black text-slate-700">No Chat Selected</h3>
                <p className="text-slate-400 mt-2">Select a user from the sidebar to view your conversation.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotificationCenter;
