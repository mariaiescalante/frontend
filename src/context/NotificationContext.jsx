import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { http } from '../services/api';
import useAuth from '../hooks/useAuth';

const NotificationContext = createContext();

export const useNotifications = () => {
  return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await http.get('/notifications');
      setNotifications(data);
      const unread = data.filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [user]);

  // Socket connection reference
  const socketRef = useRef(null);

  // Initial fetch on login & WebSocket connection
  useEffect(() => {
    if (user) {
      // 1. Cargar notificaciones existentes
      fetchNotifications();

      // 2. Conectar WebSocket
      const url = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const baseUrl = url.replace('/api', ''); // remove /api if present

      const newSocket = io(baseUrl, {
        query: { userId: user.id || user.id_user }
      });
      socketRef.current = newSocket;

      // Escuchar nuevas notificaciones en vivo
      newSocket.on('new_notification', (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        
        // Aquí podríamos disparar un Toast si quisiéramos:
        // toast.info(notification.title);
      });

      return () => {
        newSocket.disconnect();
        socketRef.current = null;
      };
    } else {
      // Limpiar cuando el usuario cierra sesión
      setNotifications([]);
      setUnreadCount(0);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    }
  }, [user, fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await http.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id_notification === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await http.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
