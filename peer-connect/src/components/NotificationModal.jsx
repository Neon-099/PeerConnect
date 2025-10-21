import React, { useState, useEffect } from 'react';
import { X, Bell } from 'lucide-react';
import { apiClient } from '../utils/api';

// Import notification components
import SessionRequestNotification from './notification/SessionRequestNotification';
import SessionCompletedNotification from './notification/SessionCompletedNotification';
import ReviewReceivedNotification from './notification/ReviewReceivedNotification';

const NotificationModal = ({ isOpen, onClose, userRole = 'student' }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const endpoint = userRole === 'student' ? '/api/student/notifications' : '/api/tutor/notifications';
      const response = await apiClient.get(endpoint);
      
      if (response) {
        setNotifications(response);
        setUnreadCount(response.filter(n => !n.is_read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const endpoint = userRole === 'student' ? 
        `/api/student/notifications/${notificationId}/read` : 
        `/api/tutor/notifications/${notificationId}/read`;
      
      await apiClient.put(endpoint);
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const endpoint = userRole === 'student' ? 
        '/api/student/notifications/mark-all-read' : 
        '/api/tutor/notifications/mark-all-read';
      
      await apiClient.put(endpoint);
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const renderNotification = (notification) => {
    switch (notification.type) {
      case 'session_request':
        return (
          <SessionRequestNotification
            key={notification.id}
            notification={notification}
            onMarkAsRead={() => markAsRead(notification.id)}
          />
        );
      case 'session_completed':
        return (
          <SessionCompletedNotification
            key={notification.id}
            notification={notification}
            onMarkAsRead={() => markAsRead(notification.id)}
          />
        );
      case 'review_received':
        return (
          <ReviewReceivedNotification
            key={notification.id}
            notification={notification}
            onMarkAsRead={() => markAsRead(notification.id)}
          />
        );
      default:
        return (
          <div key={notification.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <Bell className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900">
                  {notification.title}
                </h4>
                <p className="text-sm mt-1 text-gray-600">
                  {notification.message}
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/25 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-teal-600" />
            <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                Mark all read
              </button>
            )}
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Bell className="w-12 h-12 mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-sm text-gray-600">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map(renderNotification)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;