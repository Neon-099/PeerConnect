// peer-connect/src/components/notification/NotificationDetailModal.jsx
import React from 'react';
import { X, Calendar, Clock, User, BookOpen, MapPin, Star, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const NotificationDetailModal = ({ isOpen, onClose, notification }) => {
  if (!isOpen || !notification) return null;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'session_request':
        return <Calendar className="w-6 h-6 text-blue-500" />;
      case 'session_confirmed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'session_cancelled':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'session_rescheduled':
        return <Clock className="w-6 h-6 text-orange-500" />;
      case 'session_completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'review_received':
        return <Star className="w-6 h-6 text-yellow-500" />;
      case 'tutor_match':
        return <User className="w-6 h-6 text-blue-500" />;
      case 'student_match':
        return <User className="w-6 h-6 text-green-500" />;
      default:
        return <AlertCircle className="w-6 h-6 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderSessionDetails = () => {
    if (!notification.data) return null;

    const { data } = notification;
    
    return (
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        {notification.type === 'session_request' && (
          <>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Student:</span>
              <span className="font-medium">{data.student_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Subject:</span>
              <span className="font-medium">{data.subject}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Date:</span>
              <span className="font-medium">{data.session_date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Time:</span>
              <span className="font-medium">{data.start_time} - {data.end_time}</span>
            </div>
            {data.total_cost && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Cost:</span>
                <span className="font-medium text-green-600">${data.total_cost}</span>
              </div>
            )}
          </>
        )}

        {notification.type === 'session_confirmed' && (
          <>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Tutor:</span>
              <span className="font-medium">{data.tutor_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Subject:</span>
              <span className="font-medium">{data.subject}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Date:</span>
              <span className="font-medium">{data.session_date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Time:</span>
              <span className="font-medium">{data.start_time} - {data.end_time}</span>
            </div>
          </>
        )}

        {notification.type === 'session_rescheduled' && (
          <>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">With:</span>
              <span className="font-medium">{data.other_user_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Subject:</span>
              <span className="font-medium">{data.subject}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">New Date:</span>
              <span className="font-medium">{data.session_date}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Rescheduled by:</span>
              <span className="font-medium capitalize">{data.rescheduled_by}</span>
            </div>
          </>
        )}

        {notification.type === 'session_completed' && (
          <>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">With:</span>
              <span className="font-medium">{data.tutor_name || data.student_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Subject:</span>
              <span className="font-medium">{data.subject}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Completed:</span>
              <span className="font-medium">{data.session_date}</span>
            </div>
          </>
        )}

        {notification.type === 'review_received' && (
          <>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">From:</span>
              <span className="font-medium">{data.student_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-gray-600">Rating:</span>
              <span className="font-medium">{data.rating}/5 stars</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Subject:</span>
              <span className="font-medium">{data.subject}</span>
            </div>
          </>
        )}

        {(notification.type === 'tutor_match' || notification.type === 'student_match') && (
          <>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Match Type:</span>
              <span className="font-medium capitalize">{notification.type.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Found:</span>
              <span className="font-medium">{formatDate(notification.created_at)}</span>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {getNotificationIcon(notification.type)}
            <h2 className="text-xl font-semibold text-gray-900">Notification Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Title and Message */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {notification.title}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {notification.message}
            </p>
          </div>

          {/* Session Details */}
          {renderSessionDetails()}

          {/* Timestamp */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Received: {formatDate(notification.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationDetailModal;