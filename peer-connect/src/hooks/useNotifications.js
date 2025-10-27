// peer-connect/src/hooks/useNotifications.js (Updated)
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../utils/api';

export const useNotifications = (userRole) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [floatingNotification, setFloatingNotification] = useState(null);
  const [previousNotificationIds, setPreviousNotificationIds] = useState(new Set());

  const fetchNotifications = useCallback(async () => {
    try {
      const endpoint = userRole === 'student' ? '/api/student/notifications' : '/api/tutor/notifications';
      const response = await apiClient.get(endpoint);
      const newNotifications = response || [];
      
      // Parse JSON data field for each notification
      const parsedNotifications = newNotifications.map(notification => ({
        ...notification,
        data: typeof notification.data === 'string' ? JSON.parse(notification.data) : notification.data
      }));
      
      // Check for new notifications to show floating notification
      const currentIds = new Set(parsedNotifications.map(n => n.id));
      const newNotificationIds = [...currentIds].filter(id => !previousNotificationIds.has(id));
      
      console.log('Previous IDs:', Array.from(previousNotificationIds));
      console.log('Current IDs:', Array.from(currentIds));
      console.log('New notification IDs:', newNotificationIds);
      
      if (newNotificationIds.length > 0) {
        // Find the most recent new notification
        const latestNewNotification = parsedNotifications.find(n => 
          newNotificationIds.includes(n.id) && 
          !n.is_read &&
          ['session_booked', 'session_confirmed', 'session_request', 'session_cancelled', 'session_rescheduled', 'session_completed', 'review_received', 'tutor_match', 'student_match'].includes(n.type)
        );
        
        console.log('Latest new notification:', latestNewNotification);
        
        if (latestNewNotification) {
          setFloatingNotification(latestNewNotification);
        }
      }
      
      setNotifications(parsedNotifications);
      setPreviousNotificationIds(currentIds);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [userRole, previousNotificationIds]);

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
    console.log('Manually showing floating notification:', notification);
    setFloatingNotification(notification);
  }, []);

  const hideFloatingNotification = useCallback(() => {
    console.log('Hiding floating notification');
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

  // Poll for new notifications every 5 seconds for more responsive notifications
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 5000); // Reduced from 15 seconds to 5 seconds

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