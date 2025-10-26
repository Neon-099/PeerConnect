// peer-connect/src/components/notification/FloatingSessionNotification.jsx
import React, { useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, Star, User, BookOpen, X } from 'lucide-react';

const StudentFloatingNotification = ({ notification, onClose, onAction }) => {
  useEffect(() => {
    // Auto-hide after 8 seconds for session notifications
    const timer = setTimeout(onClose, 8000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'session_confirmed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'session_request':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'session_cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'session_rescheduled':
        return <Clock className="w-5 h-5 text-orange-600" />;
      case 'session_completed':
        return <Star className="w-5 h-5 text-purple-600" />;
      case 'review_received':
        return <Star className="w-5 h-5 text-yellow-600" />;
      default:
        return <Calendar className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
        case 'session_booked' :
            return 'border-1-yellow-500 bg-yellow-50';
        case 'session_confirmed':
            return 'border-l-green-500 bg-green-50';
        case 'session_request':
            return 'border-l-blue-500 bg-blue-50';
        case 'session_cancelled':
            return 'border-l-red-500 bg-red-50';
        case 'session_rescheduled':
            return 'border-l-orange-500 bg-orange-50';
        case 'session_completed':
            return 'border-l-purple-500 bg-purple-50';
        case 'review_received':
            return 'border-l-yellow-500 bg-yellow-50';
        case 'tutor_match':
            return 'border-l-blue-500 bg-blue-50';
        case 'student_match':
            return 'border-l-green-500 bg-green-50';
        default:
            return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAction = (action) => {
    if (onAction) {
      onAction(notification, action);
    }
    onClose();
  };

  const renderActionButtons = () => {
    switch (notification.type) {
        case 'session_booked':
            return (
            <div className="flex gap-2 mt-3">
                <button
                onClick={() => handleAction('view_request')}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                >
                View Request
                </button>
            </div>
            );
        case 'session_confirmed':
            return (
            <div className="flex gap-2 mt-3">
                <button
                onClick={() => handleAction('view_session')}
                className="px-3 py-1 bg-teal-600 text-white text-xs rounded-md hover:bg-teal-700 transition-colors"
                >
                View Session
                </button>
                <button
                onClick={() => handleAction('complete_session')}
                className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                >
                Complete
                </button>
            </div>
            );
        case 'session_request':
            return (
            <div className="flex gap-2 mt-3">
                <button
                onClick={() => handleAction('view_request')}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                >
                View Request
                </button>
            </div>
            );
        case 'session_completed':
        return (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => handleAction('write_review')}
              className="px-3 py-1 bg-yellow-600 text-white text-xs rounded-md hover:bg-yellow-700 transition-colors"
            >
              Write Review
            </button>
          </div>
        );
        case 'review_cancelled':
            return (
                <div className='flex gap-2 mt-3'>

                </div>
            )
        default:
            return null;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className={`bg-white rounded-lg shadow-lg border-l-4 p-4 max-w-sm ${getNotificationColor(notification.type)}`}>
        <div className="flex items-start gap-3">
          {getNotificationIcon(notification.type)}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 text-sm">{notification.title}</h4>
              <button 
                onClick={onClose} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-gray-600 text-xs mt-1">{notification.message}</p>
            
            {/* Session Details */}
            {notification.data && (
              <div className="mt-2 space-y-1">
                {notification.data.tutor_name && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <User className="w-3 h-3" />
                    <span>with {notification.data.tutor_name}</span>
                  </div>
                )}
                {notification.data.subject && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <BookOpen className="w-3 h-3" />
                    <span>{notification.data.subject}</span>
                  </div>
                )}
                {notification.data.session_date && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(notification.data.session_date).toLocaleDateString()}</span>
                    {notification.data.start_time && (
                      <span> at {formatTime(notification.data.session_date + 'T' + notification.data.start_time)}</span>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Action Buttons */}
            {renderActionButtons()}
            
            <p className="text-xs text-gray-400 mt-2">
              {formatTime(notification.created_at)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentFloatingNotification;