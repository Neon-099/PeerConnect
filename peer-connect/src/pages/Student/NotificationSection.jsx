import React, { useState } from 'react';

import Header from './Header.jsx';
import Footer from './Footer.jsx';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';
import { Mail } from 'lucide-react';

const NotificationsSection = ({ notifications, onMarkRead, getProfilePictureUrl, studentProfile }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [filterTab, setFilterTab] = useState('all');
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [earlierNotifications, setEarlierNotifications] = useState([]);
  return (
      <div className="flex-1 flex flex-col">
        {/* Header */}
       <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
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
          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-semibold text-gray-800">Notifications</h1>
              
              {/* Filter Tabs */}
              <div className="flex gap-2 gap-12 ">
                <button 
                  onClick={() => setFilterTab('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    filterTab === 'all' 
                      ? 'bg-teal-700 text-white' 
                      : 'bg-white text-teal-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  All
                </button>
                <button 
                  onClick={() => setFilterTab('sessions')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    filterTab === 'sessions' 
                      ? 'bg-teal-700 text-white' 
                      : 'bg-white text-teal-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Sessions
                </button>
                <button 
                  onClick={() => setFilterTab('messages')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    filterTab === 'messages' 
                      ? 'bg-teal-700 text-white' 
                      : 'bg-white text-teal-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Messages
                </button>
                <button 
                  onClick={() => setFilterTab('system')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    filterTab === 'system' 
                      ? 'bg-teal-700 text-white' 
                      : 'bg-white text-teal-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  System
                </button>
              </div>
            </div>

            {/* Recent Notifications */}
            <div className="mb-8">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Recent</h2>
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-200 p-4 ">
                {recentNotifications.map((notification) => (
                  <div key={notification.id} className="flex items-center justify-between p-5 mx-2 hover:bg-gray-50 border  rounded-2xl">
                    <div className="flex items-start gap-4 flex-1">
                      {renderIcon(notification.icon, notification.iconBg, notification.iconColor)}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 mb-1">{notification.title}</h3>
                        <p className="text-sm text-gray-600">{notification.subtitle}</p>
                      </div>
                    </div>
                    <button className={`px-4 py-2 rounded-lg text-sm font-medium ml-4 flex-shrink-0 ${notification.actionColor}`}>
                      {notification.action}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Earlier Notifications */}
            <div className="mb-8">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Earlier</h2>
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-200">
                {earlierNotifications.map((notification) => (
                  <div key={notification.id} className="flex items-center justify-between p-5 hover:bg-gray-50">
                    <div className="flex items-start gap-4 flex-1">
                      {renderIcon(notification.icon, notification.iconBg, notification.iconColor)}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 mb-1">{notification.title}</h3>
                        <p className="text-sm text-gray-600">{notification.subtitle}</p>
                      </div>
                    </div>
                    <button className={`px-4 py-2 rounded-lg text-sm font-medium ml-4 flex-shrink-0 ${notification.actionColor}`}>
                      {notification.action}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Empty State */}
            <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
              <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">You're all caught up. New notifications will appear here.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-12 bg-white border-t border-gray-200 flex items-center justify-end px-8">
          <Footer/>
        </div>
        </div>
  );
};

export default NotificationsSection;