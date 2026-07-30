
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import {
  Send,
  Smile,
  Check,
  CheckCheck,
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  Bell,
  Info,
  MoreHorizontal,
  Home,
  MessageSquare,
  Users,
  Settings,
  Image as ImageIcon,
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import moment from 'moment';

interface UserDetail {
  _id: string;
  name: string;
  username: string;
  image?: { url: string };
  isOnline: boolean;
  lastSeen?: string;
}

interface Conversation {
  _id: string;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageSender: string;
  unreadCount: number;
  user: UserDetail;
}

interface Message {
  _id: string;
  sender: string;
  receiver: string;
  message: string;
  status: 'sent' | 'delivered' | 'seen';
  timeStamp: string;
}

export const Chat: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const directUserId = searchParams.get('user');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePartner, setActivePartner] = useState<UserDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [typingPartner, setTypingPartner] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'general' | 'total'>('general');

  const [gifOpen, setGifOpen] = useState(false);
  const [gifQuery, setGifQuery] = useState('');
  const [gifs, setGifs] = useState<any[]>([]);
  const [searchingGifs, setSearchingGifs] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      if (res.data.success) {
        setConversations(res.data.conversations);
        return res.data.conversations as Conversation[];
      }
      return [];
    } catch {
      toast.error('Failed to load inbox.');
      return [];
    }
  };

  const loadChatThread = async (partner: UserDetail) => {
    setActivePartner(partner);
    setGifOpen(false);
    try {
      const res = await api.get(`/chat/${partner._id}`);
      if (res.data.success) {
        setMessages(res.data.messages);
        setConversations(prev =>
          prev.map(c => (c.user._id === partner._id ? { ...c, unreadCount: 0 } : c))
        );
        if (socket) {
          socket.emit('markAsSeen', { sender: partner._id, receiver: user?._id });
        }
      }
    } catch {
      toast.error('Failed to load messages.');
    }
  };

  useEffect(() => {
    const initChat = async () => {
      const list = await fetchConversations();
      if (directUserId) {
        const existingConv = list.find(c => c.user._id === directUserId);
        if (existingConv) {
          loadChatThread(existingConv.user);
        } else {
          try {
            const profileRes = await api.get(`/users/profile/${directUserId}`);
            if (profileRes.data.success) {
              const target = profileRes.data.profile;
              setActivePartner({
                _id: target._id,
                name: target.name,
                username: target.username,
                image: target.image,
                isOnline: target.isOnline,
                lastSeen: target.lastSeen,
              });
              setMessages([]);
            }
          } catch {
            toast.error('Failed to open chat.');
          }
        }
      }
    };
    initChat();
    // eslint-disable-next-line
  }, [directUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingPartner]);

  useEffect(() => {
    if (!socket || !user) return;
    socket.emit('authenticate', user._id);

    const handleNewMessage = (msg: Message) => {
      if (activePartner && (msg.sender === activePartner._id || msg.receiver === activePartner._id)) {
        setMessages(prev => [...prev, msg]);
        if (msg.sender === activePartner._id) {
          socket.emit('markAsSeen', { sender: activePartner._id, receiver: user._id });
        }
      }
      fetchConversations();
    };

    const handleMessagesSeen = ({ sender, receiver }: { sender?: string; receiver?: string }) => {
      if (activePartner && (sender === activePartner._id || receiver === activePartner._id)) {
        setMessages(prev => prev.map(msg => (msg.status !== 'seen' ? { ...msg, status: 'seen' } : msg)));
      }
      fetchConversations();
    };

    const handleTyping = ({ sender, username }: { sender: string; username: string }) => {
      if (activePartner && sender === activePartner._id) setTypingPartner(username);
    };
    const handleStopTyping = ({ sender }: { sender: string }) => {
      if (activePartner && sender === activePartner._id) setTypingPartner(null);
    };
    const handleUserStatus = ({ userId, isOnline, lastSeen }: any) => {
      setConversations(prev =>
        prev.map(c => (c.user._id === userId ? { ...c, user: { ...c.user, isOnline, lastSeen } } : c))
      );
      if (activePartner && activePartner._id === userId) {
        setActivePartner(prev => (prev ? { ...prev, isOnline, lastSeen } : null));
      }
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('messagesSeen', handleMessagesSeen);
    socket.on('typing', handleTyping);
    socket.on('stopTyping', handleStopTyping);
    socket.on('userStatus', handleUserStatus);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messagesSeen', handleMessagesSeen);
      socket.off('typing', handleTyping);
      socket.off('stopTyping', handleStopTyping);
      socket.off('userStatus', handleUserStatus);
    };
  }, [socket, user, activePartner]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!socket || !activePartner || !user) return;
    socket.emit('typing', { sender: user._id, receiver: activePartner._id, username: user.username });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', { sender: user._id, receiver: activePartner._id });
    }, 1500);
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || !activePartner || !user || !socket) return;
    socket.emit('sendMessage', {
      sender: user._id,
      receiver: activePartner._id,
      message: text,
    });
    if (!textToSend) setInputText('');
    socket.emit('stopTyping', { sender: user._id, receiver: activePartner._id });
    inputRef.current?.focus();
  };

  const searchGifs = async () => {
    if (!gifQuery.trim()) return;
    setSearchingGifs(true);
    try {
      const res = await api.get('/stories/search-gif', { params: { q: gifQuery } });
      setGifs(res.data || []);
    } catch {
      toast.error('Failed to search GIFs.');
    } finally {
      setSearchingGifs(false);
    }
  };

  const handleSelectGif = (url: string) => {
    handleSendMessage(url);
    setGifOpen(false);
    setGifQuery('');
    setGifs([]);
  };

  const renderMessageContent = (message: string) => {
    if (message.includes('giphy.com') || message.match(/^https?:\/\/.*\.(?:gif|png|jpg|jpeg|webp)$/i)) {
      return (
        <img
          src={message}
          alt="media"
          className="max-w-[240px] rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm"
        />
      );
    }
    return <p className="text-[13.5px] leading-relaxed break-words whitespace-pre-wrap">{message}</p>;
  };

  const filteredConversations = useMemo(() => {
    let list = conversations;
    if (filterTab === 'general') {
      list = list.filter(c => c.unreadCount === 0 || c.unreadCount > 0);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        c => c.user.name.toLowerCase().includes(q) || c.user.username.toLowerCase().includes(q)
      );
    }
    return list;
  }, [conversations, searchQuery, filterTab]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; msgs: Message[] }[] = [];
    messages.forEach(msg => {
      const date = moment(msg.timeStamp).format('MMMM D, dddd');
      const last = groups[groups.length - 1];
      if (last && last.date === date) {
        last.msgs.push(msg);
      } else {
        groups.push({ date, msgs: [msg] });
      }
    });
    return groups;
  }, [messages]);

  return (
    <div className="h-screen w-screen bg-[#F4F5F9] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex overflow-hidden font-sans">
      {/* ============ LEFT: Global Sidebar (desktop) ============ */}
      

      {/* ============ MAIN CONTENT WRAPPER ============ */}
      <div className="flex-1 flex p-3 sm:p-4 lg:p-5 gap-3 lg:gap-4 min-w-0">
        {/* ============ INBOX PANEL ============ */}
        <section
          className={`w-full lg:w-[340px] flex-shrink-0 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/50 flex flex-col overflow-hidden ${
            activePartner ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Inbox Header */}
          <div className="px-6 pt-7 pb-4">
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-[26px] font-bold tracking-tight">Inbox</h1>
              <button className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100/70 dark:bg-slate-800/50 rounded-xl p-1">
              {(['general', 'total'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`flex-1 py-2 rounded-lg text-[12px] font-semibold capitalize transition-all ${
                    filterTab === tab
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative mt-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-200 dark:focus:border-indigo-800 rounded-xl text-[12.5px] outline-none transition-colors placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 custom-scrollbar">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center mb-3">
                  <MessageSquare className="w-6 h-6 text-slate-400" strokeWidth={1.5} />
                </div>
                <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                  No conversations
                </p>
                <p className="text-[11.5px] text-slate-400 mt-1 leading-relaxed">
                  Visit a writer's profile to start a message thread.
                </p>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isActive = activePartner?._id === c.user._id;
                const isSelfLast = c.lastMessageSender === user?._id;
                return (
                  <button
                    key={c._id}
                    onClick={() => loadChatThread(c.user)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all group ${
                      isActive
                        ? 'bg-indigo-50/70 dark:bg-indigo-500/10'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={
                          c.user.image?.url ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user.name)}&background=e0e7ff&color=4f46e5`
                        }
                        alt={c.user.name}
                        className="w-11 h-11 rounded-full object-cover"
                      />
                      {c.user.isOnline && (
                        <span className="absolute bottom-0 right-0 block w-3 h-3 rounded-full bg-green-500 ring-[2.5px] ring-white dark:ring-slate-900" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[13.5px] truncate">
                          {c.user.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium flex-shrink-0">
                          {moment(c.lastMessageTime).calendar(null, {
                            sameDay: 'LT',
                            lastDay: '[Yst]',
                            lastWeek: 'ddd',
                            sameElse: 'MMM D',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span
                          className={`text-[11.5px] truncate ${
                            c.unreadCount > 0
                              ? 'text-slate-700 dark:text-slate-200 font-medium'
                              : 'text-slate-400'
                          }`}
                        >
                          {isSelfLast && 'You: '}
                          {c.lastMessage?.includes('giphy.com')
                            ? '🎬 GIF'
                            : c.lastMessage || 'Start chatting'}
                        </span>
                        {c.unreadCount > 0 && (
                          <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* ============ CHAT THREAD PANEL ============ */}
        <section
          className={`flex-1 min-w-0 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/50 flex flex-col overflow-hidden ${
            !activePartner ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {activePartner ? (
            <>
              {/* Chat Header */}
              <header className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => {
                      setActivePartner(null);
                      setSearchParams({});
                    }}
                    className="lg:hidden p-1.5 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="relative flex-shrink-0">
                    <img
                      src={
                        activePartner.image?.url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(activePartner.name)}&background=e0e7ff&color=4f46e5`
                      }
                      alt={activePartner.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {activePartner.isOnline && (
                      <span className="absolute bottom-0 right-0 block w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-slate-900" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <Link
                      to={`/profile/${activePartner.username}`}
                      className="font-semibold text-[14.5px] leading-tight hover:text-indigo-600 transition-colors block truncate"
                    >
                      {activePartner.name}
                    </Link>
                    <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                      {typingPartner
                        ? <span className="text-indigo-500">typing...</span>
                        : activePartner.isOnline
                          ? <span className="text-green-500">Online</span>
                          : `Last seen ${moment(activePartner.lastSeen).fromNow()}`}
                    </span>
                  </div>
                </div>

             
              </header>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 custom-scrollbar bg-gradient-to-b from-white to-slate-50/30 dark:from-slate-900 dark:to-slate-950/30">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-6">
                    <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4">
                      <MessageSquare className="w-7 h-7 text-indigo-500" strokeWidth={1.5} />
                    </div>
                    <p className="text-[14px] font-semibold text-slate-700 dark:text-slate-200">
                      Say hi to {activePartner.name.split(' ')[0]}
                    </p>
                    <p className="text-[12px] text-slate-400 mt-1.5 max-w-xs">
                      This is the beginning of your conversation. Send a message to start.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6 max-w-3xl mx-auto">
                    {groupedMessages.map((group, gIdx) => (
                      <div key={gIdx} className="space-y-2">
                        {/* Date Divider */}
                        <div className="flex items-center justify-center py-2">
                          <span className="text-[10.5px] font-semibold text-slate-400 tracking-wide">
                            {group.date}
                          </span>
                        </div>

                        {group.msgs.map((msg, index) => {
                          const isSelf = msg.sender === user?._id;
                          const prevMsg = group.msgs[index - 1];
                          const nextMsg = group.msgs[index + 1];
                          const isFirstInGroup = !prevMsg || prevMsg.sender !== msg.sender;
                          const isLastInGroup = !nextMsg || nextMsg.sender !== msg.sender;

                          return (
                            <div
                              key={msg._id}
                              className={`flex gap-2.5 ${isSelf ? 'justify-end' : 'justify-start'} ${
                                isFirstInGroup ? 'mt-3' : 'mt-0.5'
                              }`}
                            >
                              {!isSelf && (
                                <div className="w-8 h-8 flex-shrink-0 self-end">
                                  {isLastInGroup && (
                                    <img
                                      src={
                                        activePartner.image?.url ||
                                        `https://ui-avatars.com/api/?name=${encodeURIComponent(activePartner.name)}&background=e0e7ff&color=4f46e5`
                                      }
                                      alt={activePartner.name}
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                  )}
                                </div>
                              )}

                              <div className={`flex flex-col max-w-[75%] sm:max-w-[65%] ${isSelf ? 'items-end' : 'items-start'}`}>
                                <div
                                  className={`px-4 py-2.5 shadow-sm ${
                                    isSelf
                                      ? `bg-indigo-500 text-white ${
                                          isFirstInGroup && isLastInGroup
                                            ? 'rounded-2xl'
                                            : isFirstInGroup
                                              ? 'rounded-2xl rounded-br-md'
                                              : isLastInGroup
                                                ? 'rounded-2xl rounded-tr-md'
                                                : 'rounded-l-2xl rounded-r-md'
                                        }`
                                      : `bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 ${
                                          isFirstInGroup && isLastInGroup
                                            ? 'rounded-2xl'
                                            : isFirstInGroup
                                              ? 'rounded-2xl rounded-bl-md'
                                              : isLastInGroup
                                                ? 'rounded-2xl rounded-tl-md'
                                                : 'rounded-r-2xl rounded-l-md'
                                        }`
                                  }`}
                                >
                                  {renderMessageContent(msg.message)}
                                </div>

                                {isLastInGroup && (
                                  <div
                                    className={`flex items-center gap-1 mt-1 px-1 text-[10px] text-slate-400 font-medium ${
                                      isSelf ? 'flex-row-reverse' : ''
                                    }`}
                                  >
                                    <span>{moment(msg.timeStamp).format('LT')}</span>
                                    {isSelf && (
                                      <>
                                        <span>·</span>
                                        {msg.status === 'seen' ? (
                                          <span className="text-indigo-500 flex items-center gap-0.5">
                                            <CheckCheck className="w-3 h-3" />
                                            Seen
                                          </span>
                                        ) : msg.status === 'delivered' ? (
                                          <span className="flex items-center gap-0.5">
                                            <CheckCheck className="w-3 h-3" />
                                            Delivered
                                          </span>
                                        ) : (
                                          <span className="flex items-center gap-0.5">
                                            <Check className="w-3 h-3" />
                                            Sent
                                          </span>
                                        )}
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}

                    {/* Typing */}
                    {typingPartner && (
                      <div className="flex gap-2.5 items-end">
                        <img
                          src={
                            activePartner.image?.url ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(activePartner.name)}&background=e0e7ff&color=4f46e5`
                          }
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* GIF Drawer */}
              {gifOpen && (
                <div className="bg-slate-50/70 dark:bg-slate-950/50 px-5 py-4 border-t border-slate-100 dark:border-slate-800/60 animate-fade-in">
                  <div className="max-w-3xl mx-auto">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Search GIFs on Giphy..."
                          value={gifQuery}
                          onChange={(e) => setGifQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && searchGifs()}
                          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[12.5px] outline-none focus:border-indigo-300 dark:focus:border-indigo-700"
                        />
                      </div>
                      <button
                        onClick={searchGifs}
                        disabled={searchingGifs}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 rounded-xl text-[12px] font-semibold transition-colors disabled:opacity-60"
                      >
                        {searchingGifs ? '...' : 'Search'}
                      </button>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-2 max-h-48 overflow-y-auto mt-3 custom-scrollbar">
                      {gifs.length === 0 ? (
                        <p className="col-span-full text-center text-[11px] text-slate-400 py-8">
                          Search for a GIF to send
                        </p>
                      ) : (
                        gifs.map((g) => (
                          <img
                            key={g.id}
                            src={g.images.fixed_height_small?.url || g.images.fixed_height.url}
                            onClick={() => handleSelectGif(g.images.fixed_height.url)}
                            className="w-full h-20 object-cover rounded-lg cursor-pointer hover:ring-2 ring-indigo-400 transition-all"
                            alt="gif"
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Chat Input */}
              <footer className="px-4 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900">
                <div className="max-w-3xl mx-auto flex items-center gap-2">
                  <div className="flex-1 relative flex items-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent focus-within:border-indigo-200 dark:focus-within:border-indigo-800 transition-colors">
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Write a message..."
                      value={inputText}
                      onChange={handleInputChange}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                      className="flex-1 pl-5 pr-2 py-3.5 bg-transparent outline-none text-[13.5px] placeholder:text-slate-400"
                    />
                    <div className="flex items-center gap-0.5 pr-2">
                      <button
                        type="button"
                        onClick={() => setGifOpen(!gifOpen)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                          gifOpen
                            ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                        }`}
                        title="Send GIF"
                      >
                        <ImageIcon className="w-[18px] h-[18px]" strokeWidth={1.8} />
                      </button>
                    
                    </div>
                  </div>

                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputText.trim()}
                    className="w-12 h-12 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:shadow-none disabled:hover:scale-100 disabled:cursor-not-allowed transition-all"
                  >
                    <Send className="w-[18px] h-[18px]" fill="currentColor" strokeWidth={0} />
                  </button>
                </div>
              </footer>
            </>
          ) : (
            // Empty state (desktop only when nothing selected)
            <div className="flex-1 hidden lg:flex flex-col items-center justify-center text-center px-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-500/20 dark:to-indigo-500/5 flex items-center justify-center mb-5 shadow-inner">
                <MessageSquare className="w-9 h-9 text-indigo-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-[17px] font-bold text-slate-800 dark:text-white">
                Your messages
              </h3>
              <p className="mt-2 text-[13px] text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                Select a conversation from your inbox or start a new one by visiting a writer's profile.
              </p>
            </div>
          )}
        </section>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.25);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.4);
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};