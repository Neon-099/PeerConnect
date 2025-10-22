// peer-connect/src/components/notification/FloatingMatchingNotification.jsx
import React, { useEffect } from 'react';
import { Bell, X } from 'lucide-react';

export default function FloatingMatchingNotification({ title, message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-slide-up">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-blue-600" />
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 text-sm">{title}</h4>
            <p className="text-gray-600 text-xs mt-1">{message}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}