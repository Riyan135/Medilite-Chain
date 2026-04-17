import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, User, Search, ArrowLeft, Inbox } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';
import toast from 'react-hot-toast';

// ─── helpers ────────────────────────────────────────────────────────────────
const formatTime = (dateStr) =>
  new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  const today = new Date();
  const diff = today.setHours(0, 0, 0, 0) - d.setHours(0, 0, 0, 0);
  if (diff === 0) return 'Today';
  if (diff === 86400000) return 'Yesterday';
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

// ─── Component ───────────────────────────────────────────────────────────────
const PatientMessages = () => {
  const { user } = useAuth();

  // list of contacts who have messaged this patient
  const [conversations, setConversations] = useState([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // active conversation
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  const scrollRef = useRef(null);
  const roomId = activeContact
    ? [user.id, activeContact.id].sort().join('_')
    : null;

  // ── load conversation partners ─────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    fetchConversations();
  }, [user]);

  const fetchConversations = async () => {
    try {
      setLoadingConvs(true);
      const res = await api.get(`/chat/conversations/${user.id}`);
      setConversations(res.data);
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoadingConvs(false);
    }
  };

  // ── socket setup for active chat ───────────────────────────────────────────
  useEffect(() => {
    if (!activeContact || !user?.id) return;

    const socket = getSocket();
    socket.emit('join_room', { room: roomId });

    socket.on('receive_message', (data) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === data.message.id)) return prev;
        return [...prev, data.message];
      });
      // refresh conversation list to show latest preview
      fetchConversations();
    });

    return () => {
      socket.off('receive_message');
    };
  }, [activeContact, user?.id, roomId]);

  // ── auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ── open a conversation ────────────────────────────────────────────────────
  const openConversation = async (contact) => {
    setActiveContact(contact);
    setMessages([]);
    setLoadingMessages(true);
    try {
      const res = await api.get(`/chat/${user.id}/${contact.id}`);
      setMessages(res.data);
    } catch {
      toast.error('Failed to load conversation');
    } finally {
      setLoadingMessages(false);
    }
  };

  // ── send a message ─────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeContact) return;

    try {
      const socket = getSocket();
      const res = await api.post('/chat', {
        senderId: user.id,
        receiverId: activeContact.id,
        content: newMessage.trim(),
      });

      const sentMsg = res.data;
      socket.emit('send_message', { room: roomId, message: sentMsg });
      setMessages((prev) => [...prev, sentMsg]);
      setNewMessage('');
      fetchConversations();
    } catch {
      toast.error('Failed to send message');
    }
  };

  // ── filtered contacts ──────────────────────────────────────────────────────
  const filteredConversations = conversations.filter((c) =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── role badge ─────────────────────────────────────────────────────────────
  const roleBadge = (role) => {
    if (role === 'DOCTOR') return { label: 'Doctor', cls: 'bg-blue-100 text-blue-700' };
    if (role === 'ADMIN' || role === 'SYSTEM_ADMIN')
      return { label: 'Admin', cls: 'bg-purple-100 text-purple-700' };
    return { label: role, cls: 'bg-slate-100 text-slate-600' };
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 flex min-h-0">
        {/* ── Conversations sidebar ─────────────────────────────── */}
        <aside
          className={`flex flex-col border-r border-slate-100 bg-white transition-all duration-300 ${
            activeContact ? 'hidden md:flex md:w-80' : 'w-full md:w-80'
          }`}
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100">
            <h1 className="text-2xl font-black text-slate-900 mb-1">Messages</h1>
            <p className="text-sm text-slate-400">
              Chat with your doctors and support team
            </p>
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-b border-slate-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="p-6 text-slate-400 text-sm text-center">
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Inbox className="w-8 h-8 text-slate-300" />
                </div>
                <p className="font-bold text-slate-600 mb-1">No messages yet</p>
                <p className="text-sm text-slate-400">
                  Your doctors and admin will appear here once they message you.
                </p>
              </div>
            ) : (
              filteredConversations.map((contact) => {
                const badge = roleBadge(contact.role);
                const isActive = activeContact?.id === contact.id;
                return (
                  <button
                    key={contact.id}
                    onClick={() => openConversation(contact)}
                    className={`w-full flex items-start gap-3 px-4 py-4 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 ${
                      isActive ? 'bg-blue-50 border-blue-100' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center font-black text-lg ${
                      isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {contact.name?.[0]?.toUpperCase() || <User className="w-5 h-5" />}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`font-bold text-sm truncate ${isActive ? 'text-blue-700' : 'text-slate-900'}`}>
                          {contact.name}
                        </p>
                        {contact.lastMessageAt && (
                          <span className="text-[10px] text-slate-400 flex-shrink-0">
                            {formatDate(contact.lastMessageAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badge.cls}`}>
                          {badge.label}
                        </span>
                        {contact.lastMessage && (
                          <p className="text-xs text-slate-500 truncate">{contact.lastMessage}</p>
                        )}
                      </div>
                    </div>
                    {/* Unread dot */}
                    {contact.unread > 0 && (
                      <span className="flex-shrink-0 mt-1 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-black">
                        {contact.unread}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ── Chat pane ─────────────────────────────────────────── */}
        <div className={`flex-1 flex flex-col min-h-0 ${!activeContact ? 'hidden md:flex' : 'flex'}`}>
          {activeContact ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-4 px-6 py-4 bg-white border-b border-slate-100 shadow-sm">
                <button
                  onClick={() => setActiveContact(null)}
                  className="md:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-500" />
                </button>
                <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-lg">
                  {activeContact.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-black text-slate-900">{activeContact.name}</p>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    {roleBadge(activeContact.role).label}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                {loadingMessages ? (
                  <p className="text-center text-slate-400 text-sm py-12">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                      <MessageSquare className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="font-bold text-slate-500">No messages yet</p>
                    <p className="text-sm text-slate-400 mt-1">Send your first message below</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.senderId === user.id;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        {!isMine && (
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-black text-sm mr-2 flex-shrink-0 mt-1">
                            {activeContact.name?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div
                          className={`max-w-[70%] px-4 py-3 rounded-2xl shadow-sm text-sm ${
                            isMine
                              ? 'bg-blue-600 text-white rounded-tr-none'
                              : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-slate-400'}`}>
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input */}
              <form
                onSubmit={handleSend}
                className="p-4 bg-white border-t border-slate-100 flex items-center gap-3"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message ${activeContact.name}...`}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-11 h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30 transition-all hover:scale-105 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            /* Empty state on desktop when no chat selected */
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div className="w-24 h-24 bg-white rounded-3xl shadow-md flex items-center justify-center mb-6">
                <MessageSquare className="w-12 h-12 text-blue-200" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">Your Messages</h2>
              <p className="text-slate-400 max-w-xs">
                Select a conversation from the left to start chatting with your doctor or care team.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PatientMessages;
