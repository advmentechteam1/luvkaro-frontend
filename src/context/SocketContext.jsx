import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { userApi } from '../services/api';

const SocketContext = createContext(null);

// Use same-origin proxy by default so Vite handles /socket.io cleanly without cross-port WS errors
const SOCKET_URL =
  typeof window !== 'undefined' && window.location.port === '5173'
    ? undefined
    : (import.meta.env.VITE_API_URL || undefined);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated, updateUser } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [livePopup, setLivePopup] = useState(null);
  const [lastIncomingMessage, setLastIncomingMessage] = useState(null);
  const fetchedNotifsForUserRef = useRef(null);
  const currentUserId = (user?._id || user?.id)?.toString();
  const userIdRef = useRef(currentUserId);

  useEffect(() => {
    userIdRef.current = (user?._id || user?.id)?.toString();
  }, [user?._id, user?.id]);

  // Connect Socket.IO client safely (avoids StrictMode premature WebSocket close & offline spam)
  useEffect(() => {
    let activeSocket = null;
    let cancelled = false;

    const timer = setTimeout(async () => {
      if (cancelled) return;

      // Verify backend is reachable first before opening Socket.IO transport
      try {
        const healthRes = await fetch('/api/health').catch(() => null);
        const healthData = healthRes ? await healthRes.json().catch(() => null) : null;
        if (cancelled) return;
        if (!healthRes || !healthRes.ok || healthData?.offline) {
          return;
        }
      } catch {
        return;
      }

      if (cancelled) return;

      const newSocket = io(SOCKET_URL, {
        // Polling first, then upgrade to websocket: prevents "WebSocket is closed before connection is established"
        transports: ['polling', 'websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 3000,
        timeout: 8000,
      });

      activeSocket = newSocket;

      newSocket.on('connect', () => {
        if (cancelled) return;
        setConnected(true);
        if (userIdRef.current) {
          newSocket.emit('register_user', userIdRef.current);
        }
      });

      newSocket.on('disconnect', () => {
        if (!cancelled) setConnected(false);
      });

      newSocket.on('connect_error', () => {
        if (!cancelled) setConnected(false);
      });

      newSocket.on('online_users', (userIds) => {
        if (!cancelled) {
          setOnlineUsers(Array.isArray(userIds) ? userIds : []);
        }
      });

      newSocket.on('new_notification', (notif) => {
        if (!notif || cancelled) return;
        setNotifications((prev) => {
          const exists = prev.some((p) => p._id && p._id === notif._id);
          return exists ? prev : [notif, ...prev];
        });
        setLivePopup(notif);
        setTimeout(() => {
          setLivePopup((curr) => (curr?._id === notif._id ? null : curr));
        }, 6000);
      });

      newSocket.on('profile_liked', (data) => {
        if (!data || cancelled) return;
        const notif = data.notification || {
          _id: `like-${Date.now()}`,
          title: data.isMatch
            ? `🎉 It's a Mutual Match with ${data.likerName}!`
            : `💖 ${data.likerName} liked your profile!`,
          message: data.isMatch
            ? `You and ${data.likerName} both liked each other. Start chatting now!`
            : `${data.likerName} liked your profile. Check their profile now!`,
          read: false,
        };
        setNotifications((prev) => {
          const exists = prev.some((p) => p._id && p._id === notif._id);
          return exists ? prev : [notif, ...prev];
        });
        setLivePopup(notif);
        setTimeout(() => {
          setLivePopup((curr) => (curr?._id === notif._id ? null : curr));
        }, 6000);
      });

      newSocket.on('receive_message', (payload) => {
        if (!payload || cancelled) return;
        setLastIncomingMessage({
          ...payload,
          receivedAt: Date.now(),
        });
      });

      newSocket.on('payment_unlocked', (payload) => {
        if (payload?.user && !cancelled) {
          updateUser(payload.user);
        }
      });

      newSocket.on('social_access_requested', (data) => {
        if (!data || cancelled) return;
        const notif = data.notification || {
          _id: `soc-req-${Date.now()}`,
          senderId: data.requesterId,
          senderName: data.requesterName,
          senderAvatar: data.requesterAvatar,
          type: 'social_request',
          title: '🔐 Social Media Access Request',
          message: `${data.requesterName} requested permission to view your Social Media links.`,
          read: false,
        };
        setNotifications((prev) => [notif, ...prev.filter((p) => p._id !== notif._id)]);
        setLivePopup(notif);
        setTimeout(() => {
          setLivePopup((curr) => (curr?._id === notif._id ? null : curr));
        }, 7000);
      });

      newSocket.on('social_access_granted', (data) => {
        if (!data || cancelled) return;
        const notif = data.notification || {
          _id: `soc-grant-${Date.now()}`,
          senderId: data.targetUserId,
          senderName: data.targetUserName,
          type: 'social_granted',
          title: '🎉 Social Media Access Granted!',
          message: `${data.targetUserName} has granted you access to their social media links!`,
          read: false,
        };
        setNotifications((prev) => [notif, ...prev.filter((p) => p._id !== notif._id)]);
        setLivePopup(notif);
        setTimeout(() => {
          setLivePopup((curr) => (curr?._id === notif._id ? null : curr));
        }, 7000);
      });

      setSocket(newSocket);
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (activeSocket) {
        activeSocket.removeAllListeners();
        if (activeSocket.connected) {
          activeSocket.disconnect();
        } else {
          activeSocket.close();
        }
      }
    };
  }, []);

  // Register user room when socket connects or user changes
  useEffect(() => {
    const uid = (user?._id || user?.id)?.toString();
    if (socket && connected && uid) {
      socket.emit('register_user', uid);
    }
  }, [socket, connected, user?._id, user?.id]);

  const sendChatMessage = useCallback(
    ({ recipientId, text, time, senderName, senderAvatar }) => {
      if (!socket || !connected || !recipientId || !text) return false;
      const myId = (user?._id || user?.id)?.toString();
      socket.emit('send_chat_message', {
        recipientId: recipientId.toString(),
        senderId: myId,
        senderName: senderName || user?.name || 'Match',
        senderAvatar: senderAvatar || user?.avatar || '',
        text,
        time: time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      return true;
    },
    [socket, connected, user]
  );

  // Fetch stored notifications ONCE per logged-in user (prevents repeated /api/users/notifications calls)
  useEffect(() => {
    const uid = (user?._id || user?.id)?.toString();
    if (!isAuthenticated || !uid) {
      fetchedNotifsForUserRef.current = null;
      setNotifications([]);
      return;
    }

    if (fetchedNotifsForUserRef.current === uid) {
      return;
    }
    fetchedNotifsForUserRef.current = uid;

    userApi
      .getNotifications()
      .then((res) => {
        if (Array.isArray(res?.data)) {
          setNotifications(res.data);
        }
      })
      .catch(() => {});
  }, [isAuthenticated, user?._id, user?.id]);

  // Periodic notification sync every 6 seconds as backup to sockets when connected
  useEffect(() => {
    const uid = (user?._id || user?.id)?.toString();
    if (!isAuthenticated || !uid) return;

    const intervalId = setInterval(() => {
      if (!connected) return;
      userApi
        .getNotifications()
        .then((res) => {
          if (!res?.offline && Array.isArray(res?.data)) {
            setNotifications(res.data);
          }
        })
        .catch(() => {});
    }, 6000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, connected, user?._id, user?.id]);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      const res = await userApi.markNotificationsRead();
      if (Array.isArray(res?.data)) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.warn('Could not mark notifications read:', err.message);
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        onlineUsers,
        notifications,
        unreadCount,
        livePopup,
        setLivePopup,
        lastIncomingMessage,
        sendChatMessage,
        markAllRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return ctx;
};
