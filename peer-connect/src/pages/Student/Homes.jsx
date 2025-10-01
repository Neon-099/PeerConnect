import React, { useState } from 'react';
import { Search, Calendar, Video, Bell, MessageSquare, Star, Users, Home, BookOpen, TrendingUp } from 'lucide-react';

const Homes = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [searchInput, setSearchInput] = useState('');

  const sessions = [
    {
      id: 1,
      tutor: 'Emma Wilson',
      subject: 'Mathematics',
      date: 'Tue, Sep 2',
      time: '4:00-5:00 PM',
      status: 'Confirmed',
      initials: 'EW'
    },
    {
      id: 2,
      tutor: 'Emma Wilson',
      subject: 'Mathematics',
      date: 'Tue, Sep 2',
      time: '4:00-5:00 PM',
      status: 'Pending',
      initials: 'EW'
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50" style={{ minWidth: '1400px' }}>
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-gray-800">PeerConnect</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <button 
            onClick={() => setActiveTab('home')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${
              activeTab === 'home' 
                ? 'bg-teal-700 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Home</span>
          </button>

          <button 
            onClick={() => setActiveTab('search')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${
              activeTab === 'search' 
                ? 'bg-teal-700 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Search className="w-5 h-5" />
            <span className="font-medium">Search Tutors</span>
          </button>

          <button 
            onClick={() => setActiveTab('bookings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${
              activeTab === 'bookings' 
                ? 'bg-teal-700 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="font-medium">My Bookings</span>
          </button>

          <button 
            onClick={() => setActiveTab('sessions')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${
              activeTab === 'sessions' 
                ? 'bg-teal-700 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Video className="w-5 h-5" />
            <span className="font-medium">My Sessions</span>
          </button>

          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${
              activeTab === 'notifications' 
                ? 'bg-teal-700 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Bell className="w-5 h-5" />
            <span className="font-medium">Notifications</span>
          </button>

          <button 
            onClick={() => setActiveTab('ratings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${
              activeTab === 'ratings' 
                ? 'bg-teal-700 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Star className="w-5 h-5" />
            <span className="font-medium">Ratings & Reviews</span>
          </button>
        </nav>

        {/* Footer */}
        <div className="p-4 text-xs text-gray-500 border-t border-gray-200">
          © 2025 PeerConnect
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col" style={{ width: 'calc(100% - 256px)' }}>
        {/* Header */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <div></div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-gray-700" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5 text-gray-700" />
            </button>
            <div className="w-10 h-10 bg-amber-200 rounded-lg flex items-center justify-center font-semibold text-gray-700">
              AW
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8">
          <div className="flex gap-6" style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {/* Left Column */}
            <div className="flex-1">
              {/* Welcome Header */}
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Welcome back, Alex</h1>
                <p className="text-sm text-gray-500">Stay motivated. You're 62% to your study goals this month.</p>
              </div>

              {/* Find Tutor Card */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Find the perfect tutor, fast</h2>
                <p className="text-sm text-gray-600 mb-6">Search by subject, level, or availability. Get matched instantly.</p>
                
                <div className="flex gap-3 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder='Try "Calculus weekly session"'
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                  <button className="px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50">
                    Advanced filters
                  </button>
                </div>

                <div className="flex gap-3">
                  <button className="px-6 py-3 bg-teal-700 text-white rounded-lg font-medium hover:bg-teal-800 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Find a Tutor
                  </button>
                  <button className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Get Matched
                  </button>
                </div>
              </div>

              {/* Upcoming Sessions */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Sessions</h2>
                
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-lg font-semibold text-gray-600">{session.initials}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-800">{session.tutor}</h3>
                            <span className="text-gray-400">•</span>
                          </div>
                          <p className="text-sm text-gray-600">{session.subject}</p>
                          <p className="text-sm text-gray-500">{session.date} • {session.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                          session.status === 'Confirmed' 
                            ? 'bg-green-600 text-white' 
                            : 'bg-orange-500 text-white'
                        }`}>
                          {session.status}
                        </span>
                        <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="w-80">
              {/* Progress Card */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Progress & Insights</h2>
                  <TrendingUp className="w-5 h-5 text-teal-600" />
                </div>
                <p className="text-sm text-gray-600 mb-4">Monthly study goal completion</p>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div className="bg-orange-500 h-3 rounded-full" style={{ width: '62%' }}></div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">🎯</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Goal:</p>
                    <p className="font-semibold text-gray-800">12/20 hrs</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 mb-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <button className="flex flex-col items-center justify-center p-4 bg-green-100 rounded-lg hover:bg-green-200">
                    <Calendar className="w-6 h-6 text-gray-700 mb-2" />
                    <span className="text-sm font-medium text-gray-700">Book a new</span>
                    <span className="text-sm font-medium text-gray-700">session</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-4 bg-teal-100 rounded-lg hover:bg-teal-200">
                    <Users className="w-6 h-6 text-gray-700 mb-2" />
                    <span className="text-sm font-medium text-gray-700">Check my</span>
                    <span className="text-sm font-medium text-gray-700">tutors</span>
                  </button>
                </div>
                <button className="w-full flex items-center justify-center gap-2 p-4 bg-gray-100 rounded-lg hover:bg-gray-200">
                  <Star className="w-5 h-5 text-gray-700" />
                  <span className="text-sm font-medium text-gray-700">Leave a Review</span>
                </button>
              </div>

              {/* Reminders */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-start gap-3 mb-4 pb-4 border-b border-gray-200">
                  <Bell className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Reminder: Session starts in 30 minutes</h3>
                    <p className="text-sm text-gray-600">Physics with Liam today at 6:30 PM</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">How was your last session?</h3>
                    <p className="text-sm text-gray-600">Leave a quick review for Emma</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-12 bg-white border-t border-gray-200 flex items-center justify-end px-8">
          <div className="flex gap-6 text-sm text-gray-600">
            <a href="#" className="hover:text-gray-800">Help Center</a>
            <a href="#" className="hover:text-gray-800">Contact</a>
            <a href="#" className="hover:text-gray-800">Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
}   

export default Homes;