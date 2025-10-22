// peer-connect/src/hooks/useNotifications.js
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../utils/api';

export const useNotifications = (userRole) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [floatingNotification, setFloatingNotification] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
        // CHECK IF USER IS STUDENT OR TUTOR
      const endpoint = userRole === 'student' ? '/api/student/notifications' : '/api/tutor/notifications';
      //AFTER CHECKING, FETCH NOTIFICATIONS ENDPOINT
      const response = await apiClient.get(endpoint);
      //SET OR STORE NOTIFICATIONS IN STATE
      setNotifications(response || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [userRole]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const endpoint = userRole === 'student' ? '/api/student/notifications/unread-count' : '/api/tutor/notifications/unread-count';
      const response = await apiClient.get(endpoint);
      setUnreadCount(response.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [userRole]);

  const showFloatingNotification = useCallback((notification) => {
    setFloatingNotification(notification);
  }, []);

  const hideFloatingNotification = useCallback(() => {
    setFloatingNotification(null);
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const endpoint = userRole === 'student' ? 
        `/api/student/notifications/${notificationId}/read` : 
        `/api/tutor/notifications/${notificationId}/read`;
      
      await apiClient.put(endpoint);
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [userRole]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    floatingNotification,
    showFloatingNotification,
    hideFloatingNotification,
    markAsRead,
    refreshNotifications: fetchNotifications
  };
};