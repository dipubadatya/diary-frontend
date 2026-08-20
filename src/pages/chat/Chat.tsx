
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import {
  Send,
  Check,
  CheckCheck,
  ArrowLeft,
  Search,
  MessageSquare,
  Image as ImageIcon,
  X,
  AlertCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import api from '../../services/api';
import moment from 'moment';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Pure helper functions
// ─────────────────────────────────────────────────────────────────────────────

/** Returns avatar URL or a generated placeholder. */
const getAvatarUrl = (name: string, image?: { url: string }): string =>
  image?.url ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=DBEAFE&color=2563EB&bold=true&format=svg`;

/** Returns true when the message string is an image / GIF URL. */
const isMediaUrl = (text: string): boolean =>
  text.includes('giphy.com') ||
  /^https?:\/\/.*\.(gif|png|jpg|jpeg|webp)(\?.*)?$/i.test(text);

/** Formats timestamp for the sidebar preview. */
const formatSidebarTime = (time: string): string =>
  moment(time).calendar(null, {
    sameDay: 'h:mm A',
    lastDay: '[Yesterday]',
    lastWeek: 'ddd',
    sameElse: 'MMM D',
  });

/** Formats timestamp as a date-group label in the message thread. */
const formatDateLabel = (time: string): string =>
  moment(time).calendar(null, {
    sameDay: '[Today]',
    lastDay: '[Yesterday]',
    lastWeek: 'dddd',
    sameElse: 'MMMM D, YYYY',
  });

// ─────────────────────────────────────────────────────────────────────────────
// Small, focused sub-components
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Inline error banner shown inside the UI instead of toast popups.
 * Shows an optional Retry button when a callback is provided.
 */
const InlineError: React.FC<{
  message: string;
  onRetry?: () => void;
}> = ({ message, onRetry }) => (
  <div className="flex items-center gap-2.5 px-4 py-3 mx-3 my-2 rounded-xl bg-red-50 border border-red-200">
    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
    <p className="flex-1 text-[12.5px] text-red-600 font-medium">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="flex items-center gap-1 text-[11.5px] font-semibold text-red-500 hover:text-red-700 transition-colors"
      >
        <RefreshCw className="w-3 h-3" />
        Retry
      </button>
    )}
  </div>
);

/**
 * Skeleton loader row — used while conversations are loading.
 */
const ConversationSkeleton: React.FC = () => (
  <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
    <div className="w-11 h-11 rounded-full bg-slate-200 flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3 bg-slate-200 rounded-full w-2/5" />
      <div className="h-2.5 bg-slate-100 rounded-full w-3/5" />
    </div>
  </div>
);

/**
 * Skeleton bubbles shown while a thread is loading.
 */
const MessageSkeleton: React.FC = () => (
  <div className="space-y-4 pt-4 animate-pulse max-w-[680px] mx-auto">
    {[{ w: '55%', right: false }, { w: '40%', right: true }, { w: '65%', right: false }, { w: '35%', right: true }, { w: '50%', right: false }].map(
      (item, i) => (
        <div key={i} className={`flex ${item.right ? 'justify-end' : 'justify-start'}`}>
          <div
            className="h-9 rounded-2xl bg-slate-200"
            style={{ width: item.w }}
          />
        </div>
      )
    )}
  </div>
);

/**
 * Three animated dots shown when the conversation partner is typing.
 */
const TypingBubble: React.FC<{ partner: UserDetail }> = ({ partner }) => (
  <div className="flex items-end gap-2 mt-3">
    <img
      src={getAvatarUrl(partner.name, partner.image)}
      alt={partner.name}
      className="w-7 h-7 rounded-full object-cover flex-shrink-0"
    />
    <div className="px-4 py-3 bg-white border border-slate-200 rounded-2xl rounded-bl-md flex items-center gap-1">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
          style={{ animationDelay: `${delay}ms`, animationDuration: '0.9s' }}
        />
      ))}
    </div>
  </div>
);

/**
 * Read-receipt icon for sent messages.
 */
const ReadReceipt: React.FC<{ status: Message['status'] }> = ({ status }) => {
  if (status === 'seen')
    return <CheckCheck className="w-3 h-3 text-blue-500" />;
  if (status === 'delivered')
    return <CheckCheck className="w-3 h-3 text-slate-400" />;
  return <Check className="w-3 h-3 text-slate-400" />;
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Chat component
// ─────────────────────────────────────────────────────────────────────────────

export const Chat: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const directUserId = searchParams.get('user');

  // ── Core data ──────────────────────────────────────────────────────────────
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePartner, setActivePartner] = useState<UserDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [inputText, setInputText] = useState('');
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeTab, setActiveTab] = useState<'total' | 'unread'>('total');

  // ── GIF picker ─────────────────────────────────────────────────────────────
  const [isGifOpen, setIsGifOpen] = useState(false);
  const [gifQuery, setGifQuery] = useState('');
  const [gifs, setGifs] = useState<any[]>([]);
  const [isGifLoading, setIsGifLoading] = useState(false);

  // ── Loading flags ──────────────────────────────────────────────────────────
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // ── Inline errors (one slot per concern) ──────────────────────────────────
  const [errorConversations, setErrorConversations] = useState<string | null>(null);
  const [errorMessages, setErrorMessages] = useState<string | null>(null);
  const [errorGif, setErrorGif] = useState<string | null>(null);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // API: load all conversations (sidebar list)
  // ─────────────────────────────────────────────────────────────────────────

  const fetchConversations = useCallback(async (): Promise<Conversation[]> => {
    setIsLoadingConversations(true);
    setErrorConversations(null);
    try {
      const res = await api.get('/chat/conversations');
      if (res.data.success) {
        // React state update → sidebar re-renders without any page refresh
        setConversations(res.data.conversations);
        return res.data.conversations as Conversation[];
      }
      throw new Error('Unexpected server response');
    } catch {
      setErrorConversations('Could not load conversations.');
      return [];
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // API: open a message thread with a specific partner
  // ─────────────────────────────────────────────────────────────────────────

  const openThread = useCallback(
    async (partner: UserDetail) => {
      // Reset thread-level state immediately for a snappy feel
      setActivePartner(partner);
      setMessages([]);
      setInputText('');
      setIsPartnerTyping(false);
      setIsGifOpen(false);
      setErrorMessages(null);
      setIsLoadingMessages(true);

      try {
        const res = await api.get(`/chat/${partner._id}`);
        if (res.data.success) {
          setMessages(res.data.messages);

    
          setConversations((prev) =>
            prev.map((c) =>
              c.user._id === partner._id ? { ...c, unreadCount: 0 } : c
            )
          );

          socket?.emit('markAsSeen', {
            sender: partner._id,
            receiver: user?._id,
          });
        } else {
          throw new Error('Unexpected server response');
        }
      } catch {
        setErrorMessages('Could not load messages. Please try again.');
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [socket, user?._id]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // API: GIF search
  // ─────────────────────────────────────────────────────────────────────────

  const searchGifs = useCallback(async () => {
    if (!gifQuery.trim()) return;
    setIsGifLoading(true);
    setErrorGif(null);
    setGifs([]);
    try {
      const res = await api.get('/stories/search-gif', { params: { q: gifQuery } });
      const results = res.data.gifs || [];
      setGifs(results);
      if (results.length === 0) {
        setErrorGif('No GIFs found. Try a different search term.');
      }
    } catch {
      setErrorGif('Could not search GIFs. Please try again.');
    } finally {
      setIsGifLoading(false);
    }
  }, [gifQuery]);

  // ─────────────────────────────────────────────────────────────────────────
  // Init: runs once when the component mounts
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      const list = await fetchConversations();
      if (!directUserId) return;

      // Try to find an existing conversation first
      const existing = list.find((c) => c.user._id === directUserId);
      if (existing) {
        openThread(existing.user);
        return;
      }

      // No existing conversation → fetch the user's profile and open empty thread
      try {
        const res = await api.get(`/users/profile/${directUserId}`);
        if (res.data.success) {
          const p = res.data.profile;
          setActivePartner({
            _id: p._id,
            name: p.name,
            username: p.username,
            image: p.image,
            isOnline: p.isOnline,
            lastSeen: p.lastSeen,
          });
          setMessages([]);
        } else {
          setErrorMessages('User not found.');
        }
      } catch {
        setErrorMessages('Could not open this conversation.');
      }
    };

    init();
    // openThread is stable via useCallback; directUserId drives re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [directUserId]);

  // ─────────────────────────────────────────────────────────────────────────
  // Auto-scroll: keep the latest message visible
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerTyping]);

  // ─────────────────────────────────────────────────────────────────────────
  // Socket: real-time event listeners
  // All handlers update React state only
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!socket || !user) return;

    socket.emit('authenticate', user._id);

    // ── New message arrives ──────────────────────────────────────────────
    const handleNewMessage = (msg: Message) => {
      const belongsToActiveThread =
        activePartner &&
        (msg.sender === activePartner._id || msg.receiver === activePartner._id);

      if (belongsToActiveThread) {
      
        setMessages((prev) => [...prev, msg]);

        if (msg.sender === activePartner!._id) {
          socket.emit('markAsSeen', {
            sender: activePartner!._id,
            receiver: user._id,
          });
        }

     
        setConversations((prev) =>
          prev.map((c) =>
            c.user._id === (msg.sender === user._id ? msg.receiver : msg.sender)
              ? {
                  ...c,
                  lastMessage: msg.message,
                  lastMessageTime: msg.timeStamp,
                  lastMessageSender: msg.sender,
             
                  unreadCount: 0,
                }
              : c
          )
        );
      } else {
        // Message is in a different thread → only update sidebar
        setConversations((prev) => {
          const threadId =
            msg.sender === user._id ? msg.receiver : msg.sender;
          const exists = prev.find((c) => c.user._id === threadId);

          if (exists) {
            // Bump preview + unread count
            return prev.map((c) =>
              c.user._id === threadId
                ? {
                    ...c,
                    lastMessage: msg.message,
                    lastMessageTime: msg.timeStamp,
                    lastMessageSender: msg.sender,
                    unreadCount: c.unreadCount + 1,
                  }
                : c
            );
          }

          fetchConversations();
          return prev;
        });
      }
    };

    // ── Partner read our messages ────────────────────────────────────────
    const handleMessagesSeen = ({
      sender,
      receiver,
    }: {
      sender?: string;
      receiver?: string;
    }) => {
      if (
        activePartner &&
        (sender === activePartner._id || receiver === activePartner._id)
      ) {
        setMessages((prev) =>
          prev.map((m) => (m.status !== 'seen' ? { ...m, status: 'seen' } : m))
        );
      }
    };

    // ── Typing indicators ────────────────────────────────────────────────
    const handleTyping = ({ sender }: { sender: string }) => {
      if (activePartner && sender === activePartner._id) {
        setIsPartnerTyping(true);
      }
    };

    const handleStopTyping = ({ sender }: { sender: string }) => {
      if (activePartner && sender === activePartner._id) {
        setIsPartnerTyping(false);
      }
    };

    // ── Online / offline status ──────────────────────────────────────────
    const handleUserStatus = ({
      userId,
      isOnline,
      lastSeen,
    }: {
      userId: string;
      isOnline: boolean;
      lastSeen?: string;
    }) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.user._id === userId
            ? { ...c, user: { ...c.user, isOnline, lastSeen } }
            : c
        )
      );
      if (activePartner?._id === userId) {
        setActivePartner((prev) =>
          prev ? { ...prev, isOnline, lastSeen } : null
        );
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
  }, [socket, user, activePartner, fetchConversations]);

  // ─────────────────────────────────────────────────────────────────────────
  // Typing emit: debounced so we don't flood the socket
  // ─────────────────────────────────────────────────────────────────────────

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!socket || !activePartner || !user) return;

    socket.emit('typing', {
      sender: user._id,
      receiver: activePartner._id,
      username: user.username,
    });

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit('stopTyping', {
        sender: user._id,
        receiver: activePartner._id,
      });
    }, 1500);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Send message (text or GIF URL)
  // Emits via socket only — the server broadcasts back and our
  // ─────────────────────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    (overrideText?: string) => {
      const text = (overrideText ?? inputText).trim();
      if (!text || !activePartner || !user || !socket) return;

      socket.emit('sendMessage', {
        sender: user._id,
        receiver: activePartner._id,
        message: text,
      });

      if (!overrideText) setInputText('');

      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      socket.emit('stopTyping', {
        sender: user._id,
        receiver: activePartner._id,
      });

      inputRef.current?.focus();
    },
    [inputText, activePartner, user, socket]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // GIF: pick one and send it as a message
  // ─────────────────────────────────────────────────────────────────────────

  const pickGif = (url: string) => {
    sendMessage(url);
    setIsGifOpen(false);
    setGifQuery('');
    setGifs([]);
    setErrorGif(null);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Navigation: back button closes the active thread
  // ─────────────────────────────────────────────────────────────────────────

  const closeThread = () => {
    setActivePartner(null);
    setMessages([]);
    setInputText('');
    setIsPartnerTyping(false);
    setIsGifOpen(false);
    setErrorMessages(null);
    setSearchParams({});
  };

  const goBack = () => navigate(-1);

  // ─────────────────────────────────────────────────────────────────────────
  // Derived data (memoised — recalculates only when dependencies change)
  // ─────────────────────────────────────────────────────────────────────────

  /** Conversations filtered by tab and search query */
  const filteredConversations = useMemo(() => {
    let list = conversations;

    if (activeTab === 'unread') {
      list = list.filter((c) => c.unreadCount > 0);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.user.name.toLowerCase().includes(q) ||
          c.user.username.toLowerCase().includes(q)
      );
    }

    return list;
  }, [conversations, activeTab, searchQuery]);

  /** Messages grouped by date label (Today / Yesterday / …) */
  const groupedMessages = useMemo(() => {
    const groups: { label: string; msgs: Message[] }[] = [];

    messages.forEach((msg) => {
      const label = formatDateLabel(msg.timeStamp);
      const lastGroup = groups[groups.length - 1];

      if (lastGroup && lastGroup.label === label) {
        lastGroup.msgs.push(msg);
      } else {
        groups.push({ label, msgs: [msg] });
      }
    });

    return groups;
  }, [messages]);

  /** Total unread count for the tab badge */
  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unreadCount, 0),
    [conversations]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#F2F4F7]">

      {/* ═══════════════════════════════════════════════════════════════════
          SIDEBAR — conversation list
      ═══════════════════════════════════════════════════════════════════ */}
      <aside
        className={`
          w-full lg:w-[360px] flex-shrink-0 flex flex-col
          bg-white border-r border-slate-200
          ${activePartner ? 'hidden lg:flex' : 'flex'}
        `}
      >
        {/* ── Sidebar header ─────────────────────────────────────────── */}
        <div className="px-5 pt-5 pb-3 border-b border-slate-100">

          {/* Title row */}
          <div className="flex items-center gap-2 mb-4">
            {/* Back to previous page */}
            <button
              onClick={goBack}
              aria-label="Go back"
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <h1 className="flex-1 text-[18px] font-bold text-slate-900 tracking-tight">
              Messages
            </h1>

            {/* Toggle search input */}
            <button
              onClick={() => {
                setShowSearch((v) => !v);
                setSearchQuery('');
              }}
              aria-label={showSearch ? 'Close search' : 'Search conversations'}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
            >
              {showSearch ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>
          </div>

          {/* Collapsible search field */}
          {showSearch && (
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search people…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                  w-full pl-9 pr-4 py-2 rounded-xl text-[13px] outline-none
                  bg-slate-50 border border-slate-200
                  focus:border-blue-400
                  placeholder:text-slate-400 transition-colors
                "
              />
            </div>
          )}

          {/* All / Unread tab switcher */}
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
            {(['total', 'unread'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  flex-1 flex items-center justify-center gap-1.5
                  py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-all
                  ${
                    activeTab === tab
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }
                `}
              >
                {tab === 'total' ? 'All' : 'Unread'}
                {tab === 'unread' && totalUnread > 0 && (
                  <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Conversation load error ─────────────────────────────────── */}
        {errorConversations && (
          <InlineError
            message={errorConversations}
            onRetry={fetchConversations}
          />
        )}

        {/* ── Conversation list ───────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto py-2 sidebar-scroll">

          {/* Loading skeletons */}
          {isLoadingConversations && (
            <div className="space-y-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <ConversationSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoadingConversations && filteredConversations.length === 0 && !errorConversations && (
            <div className="flex flex-col items-center justify-center h-full pb-20 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <MessageSquare className="w-6 h-6 text-slate-400" strokeWidth={1.5} />
              </div>
              <p className="text-[13px] font-semibold text-slate-700">
                {activeTab === 'unread' ? 'No unread messages' : 'No conversations yet'}
              </p>
              <p className="text-[11.5px] text-slate-400 mt-1 leading-relaxed">
                {activeTab === 'unread'
                  ? "You're all caught up!"
                  : "Visit a writer's profile to start a conversation."}
              </p>
            </div>
          )}

          {/* Conversation rows */}
          {!isLoadingConversations &&
            filteredConversations.map((convo) => {
              const isActive = activePartner?._id === convo.user._id;
              const isMine = convo.lastMessageSender === user?._id;

              return (
                <button
                  key={convo._id}
                  onClick={() => openThread(convo.user)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                    ${isActive ? 'bg-blue-50' : 'hover:bg-slate-50'}
                  `}
                >
                  {/* Avatar + online dot */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={getAvatarUrl(convo.user.name, convo.user.image)}
                      alt={convo.user.name}
                      className="w-11 h-11 rounded-full object-cover"
                    />
                    {convo.user.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 ring-2 ring-white" />
                    )}
                  </div>

                  {/* Name + preview + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[13.5px] font-semibold text-slate-900 truncate">
                        {convo.user.name}
                      </span>
                      <span className="text-[10.5px] text-slate-400 flex-shrink-0 ml-2">
                        {formatSidebarTime(convo.lastMessageTime)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-0.5">
                      <span
                        className={`text-[12px] truncate ${
                          convo.unreadCount > 0
                            ? 'text-slate-800 font-medium'
                            : 'text-slate-400'
                        }`}
                      >
                        {isMine && (
                          <span className="text-slate-400">You: </span>
                        )}
                        {isMediaUrl(convo.lastMessage ?? '')
                          ? '📷 Photo'
                          : convo.lastMessage || 'Say hello'}
                      </span>

                      {convo.unreadCount > 0 && (
                        <span className="ml-2 w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          {convo.unreadCount > 9 ? '9+' : convo.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN PANEL — active message thread
      ═══════════════════════════════════════════════════════════════════ */}
      <main
        className={`flex-1 min-w-0 flex flex-col ${!activePartner ? 'hidden lg:flex' : 'flex'}`}
      >
        {activePartner ? (
          <>
            {/* ── Chat header ──────────────────────────────────────────── */}
            <header className="flex items-center gap-3 px-4 sm:px-6 py-3 bg-white border-b border-slate-200 flex-shrink-0">

              {/* Back button — closes thread, goes back to sidebar */}
              <button
                onClick={closeThread}
                aria-label="Back to conversations"
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Partner info — tapping opens their profile */}
              <Link
                to={`/profile/${activePartner.username}`}
                className="flex items-center gap-3 flex-1 min-w-0 group"
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={getAvatarUrl(activePartner.name, activePartner.image)}
                    alt={activePartner.name}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  {activePartner.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-white" />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                    {activePartner.name}
                  </p>
                  <p className="text-[11px] mt-0.5">
                    {isPartnerTyping ? (
                      <span className="text-blue-500 font-medium">typing…</span>
                    ) : activePartner.isOnline ? (
                      <span className="text-green-500 font-medium">Online</span>
                    ) : (
                      <span className="text-slate-400">
                        Last seen {moment(activePartner.lastSeen).fromNow()}
                      </span>
                    )}
                  </p>
                </div>
              </Link>
            </header>

            {/* ── Message thread ───────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 chat-scroll bg-[#F2F4F7]">
              <div className="max-w-[680px] mx-auto">

                {/* Message load error */}
                {errorMessages && (
                  <div className="mb-4">
                    <InlineError
                      message={errorMessages}
                      onRetry={() => openThread(activePartner)}
                    />
                  </div>
                )}

                {/* Loading skeleton */}
                {isLoadingMessages && <MessageSkeleton />}

                {/* Empty thread state */}
                {!isLoadingMessages && messages.length === 0 && !errorMessages && (
                  <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                    <img
                      src={getAvatarUrl(activePartner.name, activePartner.image)}
                      alt=""
                      className="w-16 h-16 rounded-full object-cover mb-3 shadow-sm"
                    />
                    <p className="text-[14px] font-semibold text-slate-800">
                      {activePartner.name}
                    </p>
                    <p className="text-[12px] text-slate-400 mt-1">
                      @{activePartner.username}
                    </p>
                    <p className="text-[12.5px] text-slate-500 mt-4 max-w-[260px] leading-relaxed">
                      No messages yet. Say something to start the conversation!
                    </p>
                  </div>
                )}

                {/* Grouped messages */}
                {!isLoadingMessages &&
                  groupedMessages.map((group, groupIdx) => (
                    <div key={groupIdx} className="space-y-0.5">

                      {/* Date divider */}
                      <div className="flex justify-center py-3">
                        <span className="px-3 py-1 rounded-full bg-slate-200/70 text-[10.5px] font-semibold text-slate-500">
                          {group.label}
                        </span>
                      </div>

                      {group.msgs.map((msg, msgIdx) => {
                        const isMine = msg.sender === user?._id;
                        const prevMsg = group.msgs[msgIdx - 1];
                        const nextMsg = group.msgs[msgIdx + 1];

                        // Consecutive messages from the same sender get
                        // their bubble corners adjusted to look grouped
                        const isFirstInGroup =
                          !prevMsg || prevMsg.sender !== msg.sender;
                        const isLastInGroup =
                          !nextMsg || nextMsg.sender !== msg.sender;

                        return (
                          <div
                            key={msg._id}
                            className={`
                              flex items-end gap-2
                              ${isMine ? 'justify-end' : 'justify-start'}
                              ${isFirstInGroup ? 'mt-3' : 'mt-0.5'}
                            `}
                          >
                            {/* Partner avatar — only shown on last bubble */}
                            {!isMine && (
                              <div className="w-7 flex-shrink-0">
                                {isLastInGroup && (
                                  <img
                                    src={getAvatarUrl(
                                      activePartner.name,
                                      activePartner.image
                                    )}
                                    alt=""
                                    className="w-7 h-7 rounded-full object-cover"
                                  />
                                )}
                              </div>
                            )}

                            <div
                              className={`flex flex-col max-w-[68%] ${
                                isMine ? 'items-end' : 'items-start'
                              }`}
                            >
                              {/* Bubble */}
                              <div
                                className={`
                                  ${isMediaUrl(msg.message) ? 'p-0.5' : 'px-3.5 py-2.5'}
                                  ${
                                    isMine
                                      ? `bg-blue-500 text-white
                                          ${
                                            isFirstInGroup && isLastInGroup ? 'rounded-2xl'
                                            : isFirstInGroup ? 'rounded-2xl rounded-br-md'
                                            : isLastInGroup ? 'rounded-2xl rounded-tr-md'
                                            : 'rounded-l-2xl rounded-r-md'
                                          }`
                                      : `bg-white text-slate-800
                                          border border-slate-200
                                          ${
                                            isFirstInGroup && isLastInGroup ? 'rounded-2xl'
                                            : isFirstInGroup ? 'rounded-2xl rounded-bl-md'
                                            : isLastInGroup ? 'rounded-2xl rounded-tl-md'
                                            : 'rounded-r-2xl rounded-l-md'
                                          }`
                                  }
                                `}
                              >
                                {isMediaUrl(msg.message) ? (
                                  <img
                                    src={msg.message}
                                    alt="Shared media"
                                    loading="lazy"
                                    className="max-w-[220px] rounded-[18px]"
                                  />
                                ) : (
                                  <p className="text-[13.5px] leading-relaxed break-words whitespace-pre-wrap">
                                    {msg.message}
                                  </p>
                                )}
                              </div>

                              {/* Timestamp + read receipt (last bubble only) */}
                              {isLastInGroup && (
                                <div
                                  className={`flex items-center gap-1 mt-1 ${
                                    isMine ? 'flex-row-reverse' : ''
                                  }`}
                                >
                                  <span className="text-[10px] text-slate-400">
                                    {moment(msg.timeStamp).format('h:mm A')}
                                  </span>
                                  {isMine && <ReadReceipt status={msg.status} />}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}

                {/* Typing indicator */}
                {isPartnerTyping && <TypingBubble partner={activePartner} />}

                {/* Invisible anchor for auto-scroll */}
                <div ref={bottomRef} />
              </div>
            </div>

            {/* ── GIF picker panel ─────────────────────────────────────── */}
            {isGifOpen && (
              <div className="bg-white border-t border-slate-200 px-4 py-3 flex-shrink-0">
                <div className="max-w-[680px] mx-auto space-y-3">

                  {/* Search row */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        autoFocus
                        type="text"
                        placeholder="Search GIFs…"
                        value={gifQuery}
                        onChange={(e) => setGifQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchGifs()}
                        className="
                          w-full pl-9 pr-3 py-2 rounded-xl text-[12.5px] outline-none
                          bg-slate-50 border border-slate-200
                          focus:border-blue-400
                          placeholder:text-slate-400 transition-colors
                        "
                      />
                    </div>

                    <button
                      onClick={searchGifs}
                      disabled={isGifLoading || !gifQuery.trim()}
                      className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-[12px] font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isGifLoading ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Searching
                        </>
                      ) : (
                        'Search'
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setIsGifOpen(false);
                        setGifs([]);
                        setGifQuery('');
                        setErrorGif(null);
                      }}
                      aria-label="Close GIF picker"
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* GIF error */}
                  {errorGif && (
                    <InlineError message={errorGif} onRetry={searchGifs} />
                  )}

                  {/* GIF grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 max-h-40 overflow-y-auto gif-scroll">
                    {gifs.length === 0 && !errorGif ? (
                      <p className="col-span-full text-center text-[11.5px] text-slate-400 py-6">
                        Search to find GIFs
                      </p>
                    ) : (
                      gifs.map((gif: any) => (
                        <img
                          key={gif.id}
                          src={
                            gif.images.fixed_height_small?.url ||
                            gif.images.fixed_height.url
                          }
                          alt="GIF option"
                          loading="lazy"
                          onClick={() => pickGif(gif.images.fixed_height.url)}
                          className="w-full h-[70px] object-cover rounded-lg cursor-pointer hover:ring-2 ring-blue-400 transition-all"
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Message input bar ────────────────────────────────────── */}
            <footer className="flex-shrink-0 bg-white border-t border-slate-200 px-4 sm:px-5 py-3">
              <div className="max-w-[680px] mx-auto flex items-center gap-2">

                {/* GIF picker toggle */}
                <button
                  onClick={() => setIsGifOpen((v) => !v)}
                  title="Send a GIF"
                  aria-label="Open GIF picker"
                  className={`
                    w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors
                    ${
                      isGifOpen
                        ? 'text-blue-500 bg-blue-50'
                        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                    }
                  `}
                >
                  <ImageIcon className="w-[18px] h-[18px]" strokeWidth={1.8} />
                </button>

                {/* Text input pill */}
                <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-full px-4 focus-within:border-blue-400 transition-colors">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Message…"
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="flex-1 py-2.5 bg-transparent outline-none text-[13.5px] placeholder:text-slate-400"
                  />
                </div>

                {/* Send button */}
                <button
                  onClick={() => sendMessage()}
                  disabled={!inputText.trim()}
                  aria-label="Send message"
                  className={`
                    w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all
                    ${
                      inputText.trim()
                        ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:scale-105 active:scale-95'
                        : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                    }
                  `}
                >
                  <Send className="w-4 h-4" fill="currentColor" strokeWidth={0} />
                </button>
              </div>
            </footer>
          </>
        ) : (
          /* ── Desktop placeholder (no thread selected) ───────────────── */
          <div className="flex-1 hidden lg:flex flex-col items-center justify-center text-center px-6 bg-[#F2F4F7]">
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-4 shadow-sm">
              <MessageSquare className="w-7 h-7 text-slate-400" strokeWidth={1.5} />
            </div>
            <p className="text-[15px] font-semibold text-slate-800">
              Your messages
            </p>
            <p className="text-[12.5px] text-slate-400 mt-2 max-w-[260px] leading-relaxed">
              Select a conversation to read and reply, or visit a writer's
              profile to start one.
            </p>
          </div>
        )}
      </main>

      {/* ── Custom thin scrollbars ─────────────────────────────────────────── */}
      <style>{`
        .sidebar-scroll,
        .chat-scroll,
        .gif-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.25) transparent;
        }
        .sidebar-scroll::-webkit-scrollbar,
        .chat-scroll::-webkit-scrollbar,
        .gif-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track,
        .chat-scroll::-webkit-scrollbar-track,
        .gif-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb,
        .chat-scroll::-webkit-scrollbar-thumb,
        .gif-scroll::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.25);
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
};