import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, XCircle, Clock, Calendar, User, BookOpen } from 'lucide-react';
import { apiClient } from '../../utils/api';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

const NotificationSection = ({ onMarkRead, getProfilePictureUrl, studentProfile }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/api/student/notifications');
      setNotifications(response);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await apiClient.get('/api/student/notifications/unread-count');
      setUnreadCount(response.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await apiClient.put(`/api/student/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'session_request':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'session_confirmed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'session_cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'session_rescheduled':
        return <Clock className="w-5 h-5 text-orange-500" />;
      case 'session_completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'review_received':
        return <Star className="w-5 h-5 text-yellow-500" />;
      case 'tutor_match':
        return <User className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

if (isLoading) {
  return (
    <div className="flex-1 flex justify-center ">
      <LoadingSpinner />
    </div>
  )
}

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="h-23 bg-white border-b border-gray-200 flex items-center justify-between px-8">
        <div></div>
        <div className="flex items-center gap-4">
          <Header 
            userProfilePictureUrl={getProfilePictureUrl(studentProfile?.profile_picture)}
            userProfile={studentProfile?.first_name} 
          />
        </div>
      </div>

      <div className="flex items-center justify-between mx-14 my-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-600">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>


      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
          <p className="text-gray-500">You'll see session confirmations and updates here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg border p-4 ${
                !notification.is_read ? 'border-l-4 border-l-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">{notification.title}</h3>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">{notification.message}</p>
                    
                    {notification.data && (
                    <div className="bg-gray-50 rounded-md p-3 text-sm">
                      {notification.type === 'session_request' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">Student:</span>
                            <span className="font-medium">{notification.data.student_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">Subject:</span>
                            <span className="font-medium">{notification.data.subject}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">Date:</span>
                            <span className="font-medium">{notification.data.session_date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">Time:</span>
                            <span className="font-medium">
                              {notification.data.start_time} - {notification.data.end_time}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {notification.type === 'session_rescheduled' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">With:</span>
                            <span className="font-medium">{notification.data.other_user_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">Subject:</span>
                            <span className="font-medium">{notification.data.subject}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">New Date:</span>
                            <span className="font-medium">{notification.data.session_date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-600">Rescheduled by:</span>
                            <span className="font-medium capitalize">{notification.data.rescheduled_by}</span>
                          </div>
                        </div>
                      )}
                      
                      {notification.type === 'session_completed' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">With:</span>
                            <span className="font-medium">{notification.data.student_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">Subject:</span>
                            <span className="font-medium">{notification.data.subject}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">Completed:</span>
                            <span className="font-medium">{notification.data.session_date}</span>
                          </div>
                        </div>
                      )}
                      
                      {notification.type === 'review_received' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">From:</span>
                            <span className="font-medium">{notification.data.student_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-gray-600">Rating:</span>
                            <span className="font-medium">{notification.data.rating}/5 stars</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">Subject:</span>
                            <span className="font-medium">{notification.data.subject}</span>
                          </div>
                        </div>
                      )}
                      
                      {notification.type === 'student_match' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">Match Type:</span>
                            <span className="font-medium">Student Match</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">Found:</span>
                            <span className="font-medium">{new Date(notification.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                    
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDate(notification.created_at)}
                    </p>
                  </div>
                </div>
                
                {!notification.is_read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationSection;