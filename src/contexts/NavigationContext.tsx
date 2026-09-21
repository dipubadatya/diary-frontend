import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import api from "../services/api";

interface NavigationContextType {
  unreadMsg: number;
  unreadNotif: number;
  setUnreadMsg: React.Dispatch<React.SetStateAction<number>>;
  setUnreadNotif: React.Dispatch<React.SetStateAction<number>>;
  refreshBadges: () => Promise<void>;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  mobileSearchOpen: boolean;
  setMobileSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const location = useLocation();

  const [unreadMsg, setUnreadMsg] = useState(0);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Close mobile drawers automatically on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  // Fetch unread notification and message counts
  const refreshBadges = useCallback(async () => {
    if (!user) {
      setUnreadNotif(0);
      setUnreadMsg(0);
      return;
    }

    try {
      const [notifRes, chatRes] = await Promise.allSettled([
        api.get("/users/notifications/unread-count"),
        api.get("/chat/conversations"),
      ]);

      if (notifRes.status === "fulfilled" && notifRes.value.data?.success) {
        setUnreadNotif(Number(notifRes.value.data.unreadCount) || 0);
      }

      if (chatRes.status === "fulfilled" && chatRes.value.data?.success) {
        const convos = chatRes.value.data.conversations || [];
        const total = convos.reduce(
          (acc: number, c: { unreadCount?: number }) => acc + (c.unreadCount || 0),
          0
        );
        setUnreadMsg(total);
      }
    } catch {
      // Non-critical background failure
    }
  }, [user]);

  // Initial fetch and interval refresh
  useEffect(() => {
    if (!user) {
      setUnreadNotif(0);
      setUnreadMsg(0);
      return;
    }

    refreshBadges();
    const interval = setInterval(refreshBadges, 20000);
    return () => clearInterval(interval);
  }, [user, refreshBadges]);

  // Real-time Socket.IO listeners
  useEffect(() => {
    if (!socket || !user) return;

    const onNotification = () => setUnreadNotif((prev) => prev + 1);
    const onMessage = () => setUnreadMsg((prev) => prev + 1);

    socket.on("newNotification", onNotification);
    socket.on("newMessage", onMessage);

    return () => {
      socket.off("newNotification", onNotification);
      socket.off("newMessage", onMessage);
    };
  }, [socket, user]);

  return (
    <NavigationContext.Provider
      value={{
        unreadMsg,
        unreadNotif,
        setUnreadMsg,
        setUnreadNotif,
        refreshBadges,
        mobileMenuOpen,
        setMobileMenuOpen,
        mobileSearchOpen,
        setMobileSearchOpen,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}

export default NavigationContext;
