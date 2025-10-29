import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../utils/api';

const storageKeyForRole = (role) => `pc_shown_notif_ids_${role}`;

const loadShownIds = (role) => {
  try {
    const raw = localStorage.getItem(storageKeyForRole(role));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

const saveShownIds = (role, setObj) => {
  try {
    localStorage.setItem(storageKeyForRole(role), JSON.stringify(Array.from(setObj)));
  } catch {}
};

export const useNotifications = (userRole) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [floatingNotification, setFloatingNotification] = useState(null);

  const previousNotificationIdsRef = useRef(new Set());
  const shownNotificationIdsRef = useRef(loadShownIds(userRole)); // persisted across refresh

  const fetchNotifications = useCallback(async () => {
    try {
      const endpoint = userRole === 'student' ? '/api/student/notifications' : '/api/tutor/notifications';
      const response = await apiClient.get(endpoint);
      const newNotifications = response || [];

      const parsedNotifications = newNotifications.map(n => ({
        ...n,
        data: typeof n.data === 'string' ? JSON.parse(n.data) : (n.data || {})
      }));

      const currentIds = new Set(parsedNotifications.map(n => n.id));
      const newIds = [...currentIds].filter(id => !previousNotificationIdsRef.current.has(id));

      // Find the latest eligible notification to float:
      // - must be unread
      // - must not have been shown before (persisted)
      // - type is one of the allowed types
      const allowedTypes = ['session_booked', 'session_confirmed', 'session_request', 'session_cancelled', 'session_rescheduled', 'session_completed', 'review_received', 'tutor_match', 'student_match'];

      const latestNew = parsedNotifications.find(n =>
        newIds.includes(n.id) &&
        !n.is_read &&
        !shownNotificationIdsRef.current.has(n.id) &&
        allowedTypes.includes(n.type)
      );

      if (latestNew) {
        setFloatingNotification(latestNew);
        shownNotificationIdsRef.current.add(latestNew.id);
        saveShownIds(userRole, shownNotificationIdsRef.current);
      }

      setNotifications(parsedNotifications);
      previousNotificationIdsRef.current = currentIds;

      // Update unread count
      setUnreadCount(parsedNotifications.filter(n => !n.is_read).length);
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
    if (notification?.id) {
      shownNotificationIdsRef.current.add(notification.id);
      saveShownIds(userRole, shownNotificationIdsRef.current);
    }
  }, [userRole]);

  const hideFloatingNotification = useCallback(() => {
    setFloatingNotification(null);
  }, []);

  // Strict rule: when “mark as done” (read), never show it again
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const endpoint = userRole === 'student'
        ? `/api/student/notifications/${notificationId}/read`
        : `/api/tutor/notifications/${notificationId}/read`;

      await apiClient.put(endpoint);

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Persist as shown so floating will never re-trigger on refresh
      shownNotificationIdsRef.current.add(notificationId);
      saveShownIds(userRole, shownNotificationIdsRef.current);

      // If the floating notification is the same, close it
      setFloatingNotification(curr => (curr?.id === notificationId ? null : curr));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [userRole]);

  // Dismiss (used by floating toast close/dismiss button) → strictly mark as read
  const dismissFloatingNotification = useCallback(async () => {
    if (!floatingNotification?.id) {
      setFloatingNotification(null);
      return;
    }
    try {
      await markAsRead(floatingNotification.id);
    } finally {
      setFloatingNotification(null);
    }
  }, [floatingNotification, markAsRead]);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    floatingNotification,
    showFloatingNotification,
    hideFloatingNotification,
    dismissFloatingNotification, // new: always marks read
    markAsRead,
    refreshNotifications: fetchNotifications
  };
};