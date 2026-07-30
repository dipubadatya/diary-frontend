import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { ThemeToggle } from './ThemeToggle';
import { Feather, MessageSquare, Bell, User, Settings, LogOut, Menu, X, PlusCircle } from 'lucide-react';
import api from '../services/api';

export const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Fetch initial unread counts
  useEffect(() => {
    if (!user) return;

    const fetchUnreadCounts = async () => {
      try {
        // Notifications count
        const notifRes = await api.get('/users/notifications/unread-count');
        if (notifRes.data.success) {
          setUnreadNotifications(notifRes.data.unreadCount || 0);
        }

        // Messages count
        const chatRes = await api.get('/chat/conversations');
        if (chatRes.data.success) {
          const totalUnread = chatRes.data.conversations.reduce((acc: number, c: any) => acc + (c.unreadCount || 0), 0);
          setUnreadMessages(totalUnread);
        }
      } catch (err) {
        console.error('Failed to load notification or chat unread counts', err);
      }
    };

    fetchUnreadCounts();
  }, [user, location.pathname]); // Refresh counts when user navigates

  // Listen for real-time notifications/messages
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewNotification = () => {
      setUnreadNotifications(prev => prev + 1);
    };

    const handleNewMessage = (_msg: any) => {
      // Increment unread count only if we are not actively on the chat page with this sender
      if (!location.pathname.startsWith(`/chat`)) {
        setUnreadMessages(prev => prev + 1);
      }
    };

    const handleMessagesSeen = () => {
      // Reload unread count if other user sees messages
      api.get('/chat/conversations').then(res => {
        if (res.data.success) {
          const totalUnread = res.data.conversations.reduce((acc: number, c: any) => acc + (c.unreadCount || 0), 0);
          setUnreadMessages(totalUnread);
        }
      });
    };

    socket.on('newNotification', handleNewNotification);
    socket.on('newMessage', handleNewMessage);
    socket.on('messagesSeen', handleMessagesSeen);

    return () => {
      socket.off('newNotification', handleNewNotification);
      socket.off('newMessage', handleNewMessage);
      socket.off('messagesSeen', handleMessagesSeen);
    };
  }, [socket, user, location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <Link to="/stories" className="flex-shrink-0 flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-brand flex items-center justify-center text-white shadow-sm shadow-orange-500/20">
                <Feather className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg tracking-tight font-sans text-slate-950 dark:text-white">
                DIARY.
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <Link
              to="/write"
              className="flex items-center gap-1.5 px-4 py-2 border border-brand text-brand hover:bg-brand hover:text-white dark:border-orange-500 dark:text-orange-500 dark:hover:bg-orange-500 dark:hover:text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Write Story</span>
            </Link>

            <Link
              to="/stories"
              className={`px-3 py-2 text-sm font-bold rounded-lg transition-colors ${
                location.pathname === '/stories' 
                  ? 'text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800' 
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Feed
            </Link>

            {/* Chat Icon */}
            <Link
              to="/chat"
              className="relative p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Chat"
            >
              <MessageSquare className="w-5 h-5" />
              {unreadMessages > 0 && (
                <span className="absolute top-1.5 right-1.5 block w-4 h-4 rounded-full bg-brand text-[9px] font-black text-center text-white leading-4 ring-2 ring-white dark:ring-slate-900">
                  {unreadMessages}
                </span>
              )}
            </Link>

            {/* Notification Icon */}
            <Link
              to="/notifications"
              className="relative p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 block w-4 h-4 rounded-full bg-brand text-[9px] font-black text-center text-white leading-4 ring-2 ring-white dark:ring-slate-900">
                  {unreadNotifications}
                </span>
              )}
            </Link>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Avatar Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex text-sm border-2 border-transparent rounded-full focus:outline-none focus:border-slate-300 transition-colors"
              >
                <img
                  className="h-8 w-8 rounded-full object-cover"
                  src={user.image?.url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80'}
                  alt={user.name}
                />
              </button>

              {dropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-2xl shadow-xl py-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 z-20 transition-all font-sans">
                    <Link
                      to={`/profile/${user.username}`}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>My Profile</span>
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Settings</span>
                    </Link>
                    <hr className="my-1 border-slate-100 dark:border-slate-800" />
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 font-sans">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/write"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-1.5 w-full py-2.5 px-4 bg-brand text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-brand-dark transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Write Story</span>
            </Link>

            <Link
              to="/stories"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-xl text-base font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850"
            >
              Feed
            </Link>

            <Link
              to="/chat"
              onClick={() => setIsOpen(false)}
              className="flex justify-between items-center px-3 py-2 rounded-xl text-base font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850"
            >
              <span>Chat</span>
              {unreadMessages > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-brand text-white text-xs font-black">
                  {unreadMessages}
                </span>
              )}
            </Link>

            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="flex justify-between items-center px-3 py-2 rounded-xl text-base font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850"
            >
              <span>Notifications</span>
              {unreadNotifications > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-brand text-white text-xs font-black">
                  {unreadNotifications}
                </span>
              )}
            </Link>

            <Link
              to={`/profile/${user.username}`}
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-xl text-base font-bold text-slate-700 dark:text-slate-355 hover:bg-slate-50 dark:hover:bg-slate-850"
            >
              My Profile
            </Link>

            <Link
              to="/settings"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-xl text-base font-bold text-slate-700 dark:text-slate-355 hover:bg-slate-50 dark:hover:bg-slate-850"
            >
              Settings
            </Link>

            <button
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center gap-2 px-3 py-3 rounded-xl text-base font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
