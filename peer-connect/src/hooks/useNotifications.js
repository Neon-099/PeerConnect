import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../utils/api';

export const useNotifications = (userRole) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [floatingNotification, setFloatingNotification] = useState(null);
  const previousNotificationIdsRef = useRef(new Set());
  const shownNotificationIdsRef = useRef(new Set()); // Track which ones we've already shown

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
      const newNotificationIds = [...currentIds].filter(id => !previousNotificationIdsRef.current.has(id));
      
      console.log('Previous IDs:', Array.from(previousNotificationIdsRef.current));
      console.log('Current IDs:', Array.from(currentIds));
      console.log('New notification IDs:', newNotificationIds);
      
      if (newNotificationIds.length > 0) {
        // Find the most recent new notification that we haven't shown yet
        const latestNewNotification = parsedNotifications.find(n => 
          newNotificationIds.includes(n.id) &&
          !n.is_read &&
          !shownNotificationIdsRef.current.has(n.id) && // Don't show if already shown
          ['session_booked', 'session_confirmed', 'session_request', 'session_cancelled', 'session_rescheduled', 'session_completed', 'review_received', 'tutor_match', 'student_match'].includes(n.type)
        );
        
        console.log('Latest new notification:', latestNewNotification);
        
        if (latestNewNotification) {
          setFloatingNotification(latestNewNotification);
          // Mark this notification as shown so we don't show it again
          shownNotificationIdsRef.current.add(latestNewNotification.id);
        }
      }
      
      setNotifications(parsedNotifications);
      previousNotificationIdsRef.current = currentIds; // Update ref
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [userRole]); // Only depend on userRole

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