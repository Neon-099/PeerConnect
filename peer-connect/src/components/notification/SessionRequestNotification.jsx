import React from 'react';
import { Calendar, User, Clock } from 'lucide-react';

const SessionRequestNotification = ({ notification, onMarkAsRead }) => {
  const data = notification.data || {};
  
  return (
    <div className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <Calendar className="w-5 h-5 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              {notification.title}
            </h4>
            <span className="text-xs text-gray-500">
              {new Date(notification.created_at).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-sm mt-1 text-gray-600">
            {notification.message}
          </p>
          {data.session_date && (
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{new Date(data.session_date).toLocaleDateString()}</span>
            </div>
          )}
          {!notification.is_read && (
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionRequestNotification;