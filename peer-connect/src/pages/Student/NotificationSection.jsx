import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, XCircle, Clock, Calendar, User, BookOpen, Star, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { apiClient } from '../../utils/api';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';
import Header from '../Student/Header.jsx';
import Footer from '../Student/Footer.jsx';

const NotificationSection = ({ onMarkRead, getProfilePictureUrl, studentProfile }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [showAll, setShowAll] = useState({
    'ALL': false,
    'Sessions': false,
    'Unread Notifications': false,
    'Recent Notifications': false
  });

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    // Refresh notifications every minute to update the 10-minute threshold
    const interval = setInterval(() => {
      fetchNotifications();
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
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

  // Helper function to check if notification is older than 10 minutes
  const isOlderThan10Minutes = (createdAt) => {
    const notificationTime = new Date(createdAt).getTime();
    const now = Date.now();
    const tenMinutesInMs = 10 * 60 * 1000;
    return (now - notificationTime) > tenMinutesInMs;
  };

  // Categorize notifications based on age and read status
  const getNotificationCategory = (notification) => {
    // If already read, it doesn't belong to unread or recent
    if (notification.is_read) {
      return null;
    }
    
    // If unread and older than 10 minutes, it's an "unread notification"
    if (isOlderThan10Minutes(notification.created_at)) {
      return 'unread';
    }
    
    // If unread and within 10 minutes, it's a "recent notification"
    return 'recent';
  };

  // Filter notifications based on active filter
  const getFilteredNotifications = () => {
    let filtered = [];
    
    switch (activeFilter) {
      case 'Sessions':
        filtered = notifications.filter(n => 
          ['session_request', 'session_confirmed', 'session_cancelled', 'session_rescheduled', 'session_completed'].includes(n.type)
        );
        break;
      case 'Unread Notifications':
        // Notifications that are unread AND older than 10 minutes
        filtered = notifications.filter(n => {
          return !n.is_read && isOlderThan10Minutes(n.created_at);
        });
        break;
      case 'Recent Notifications':
        // Notifications that are unread AND within the last 10 minutes
        filtered = notifications.filter(n => {
          return !n.is_read && !isOlderThan10Minutes(n.created_at);
        });
        break;
      default:
        filtered = notifications;
    }
    
    return filtered;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'session_request':
      case 'session_confirmed':
      case 'session_cancelled':
      case 'session_rescheduled':
      case 'session_completed':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'review_received':
        return <Star className="w-5 h-5 text-yellow-500" />;
      case 'tutor_match':
        return <User className="w-5 h-5 text-purple-500" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-teal-500" />;
      case 'feedback':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
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

  const filteredNotifications = getFilteredNotifications();

  // Get displayed notifications based on "show all" state
  const getDisplayedNotifications = () => {
    if (showAll[activeFilter]) {
      return filteredNotifications;
    }
    return filteredNotifications.slice(0, 5);
  };

  const displayedNotifications = getDisplayedNotifications();
  const hasMore = filteredNotifications.length > 5;

  // Count notifications by type
  const getCountByType = (type) => {
    if (type === 'Sessions') {
      return notifications.filter(n => 
        ['session_request', 'session_confirmed', 'session_cancelled', 'session_rescheduled', 'session_completed'].includes(n.type)
      ).length;
    } else if (type === 'Unread Notifications') {
      // Only count unread notifications older than 10 minutes
      return notifications.filter(n => !n.is_read && isOlderThan10Minutes(n.created_at)).length;
    } else if (type === 'Recent Notifications') {
      // Only count unread notifications within the last 10 minutes
      return notifications.filter(n => !n.is_read && !isOlderThan10Minutes(n.created_at)).length;
    }
    return notifications.length;
  };

  const handleShowAllToggle = () => {
    setShowAll(prev => ({
      ...prev,
      [activeFilter]: !prev[activeFilter]
    }));
  };

  // Reset showAll when filter changes
  useEffect(() => {
    setShowAll(prev => ({
      ...prev,
      [activeFilter]: false
    }));
  }, [activeFilter]);

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
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

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-8">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="max-w-6xl mx-auto">
            {/* Page Title */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-teal-600" />
                <span className="text-sm text-gray-600">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all ${
                  activeFilter === 'ALL'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                }`}
              >
                All ({getCountByType('ALL')})
              </button>
              <button
                onClick={() => setActiveFilter('Unread Notifications')}
                className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all ${
                  activeFilter === 'Unread Notifications'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                }`}
              >
                Unread Notifications ({getCountByType('Unread Notifications')})
              </button>
              <button
                onClick={() => setActiveFilter('Recent Notifications')}
                className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all ${
                  activeFilter === 'Recent Notifications'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                }`}
              >
                Recent Notifications ({getCountByType('Recent Notifications')})
              </button>
            </div>

            {/* Notification List */}
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No {activeFilter === 'ALL' ? '' : activeFilter.toLowerCase()} notifications
                </h3>
                <p className="text-gray-500">
                  {activeFilter === 'ALL' 
                    ? "You'll see notifications here." 
                    : `You don't have any ${activeFilter.toLowerCase()} notifications yet.`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`bg-white rounded-xl border p-5 hover:shadow-md transition-shadow ${
                      !notification.is_read ? 'border-l-4 border-l-teal-500 bg-teal-50/30' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                            {!notification.is_read && (
                              <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-gray-600 mb-3">{notification.message}</p>
                          
                          {notification.data && (
                            <div className="bg-gray-50 rounded-lg p-4 text-sm mb-3">
                              {notification.type === 'session_request' && (
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-600">Student:</span>
                                    <span className="font-semibold text-gray-900">{notification.data.student_name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-600">Subject:</span>
                                    <span className="font-semibold text-gray-900">{notification.data.subject}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-600">Date:</span>
                                    <span className="font-semibold text-gray-900">{notification.data.session_date}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-600">Time:</span>
                                    <span className="font-semibold text-gray-900">
                                      {notification.data.start_time} - {notification.data.end_time}
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              {notification.type === 'session_rescheduled' && (
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-600">With:</span>
                                    <span className="font-semibold text-gray-900">{notification.data.other_user_name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-600">Subject:</span>
                                    <span className="font-semibold text-gray-900">{notification.data.subject}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-600">New Date:</span>
                                    <span className="font-semibold text-gray-900">{notification.data.session_date}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-600">Rescheduled by:</span>
                                    <span className="font-semibold text-gray-900 capitalize">{notification.data.rescheduled_by}</span>
                                  </div>
                                </div>
                              )}
                              
                              {notification.type === 'session_completed' && (
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-600">With:</span>
                                    <span className="font-semibold text-gray-900">{notification.data.student_name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-600">Subject:</span>
                                    <span className="font-semibold text-gray-900">{notification.data.subject}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-600">Completed:</span>
                                    <span className="font-semibold text-gray-900">{notification.data.session_date}</span>
                                  </div>
                                </div>
                              )}
                              
                              {notification.type === 'review_received' && (
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-600">From:</span>
                                    <span className="font-semibold text-gray-900">{notification.data.student_name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-yellow-500" />
                                    <span className="text-gray-600">Rating:</span>
                                    <span className="font-semibold text-gray-900">{notification.data.rating}/5 stars</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-600">Subject:</span>
                                    <span className="font-semibold text-gray-900">{notification.data.subject}</span>
                                  </div>
                                </div>
                              )}
                              
                              {notification.type === 'student_match' && (
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-600">Match Type:</span>
                                    <span className="font-semibold text-gray-900">Student Match</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-600">Found:</span>
                                    <span className="font-semibold text-gray-900">{new Date(notification.created_at).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <p className="text-xs text-gray-500">
                            {formatDate(notification.created_at)}
                          </p>
                        </div>
                      </div>
                      
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="px-4 py-2 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg text-sm font-medium transition-colors"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* See All / Show Less Button */}
                {hasMore && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={handleShowAllToggle}
                      className="flex items-center gap-2 px-6 py-3 bg-white text-teal-600 border-2 border-teal-600 hover:bg-teal-50 rounded-lg font-semibold transition-all"
                    >
                      {showAll[activeFilter] ? (
                        <>
                          <ChevronUp className="w-5 h-5" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-5 h-5" />
                          See All ({filteredNotifications.length})
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="h-[49px] bg-white border-t border-gray-200 flex items-center justify-end px-8">
        <Footer/>
      </div>
    </div>
  );
};

export default NotificationSection;