import React, { useState } from 'react';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';
import { Calendar, Book, Users, MessageSquare, Star, RotateCcw } from 'lucide-react';

const SessionsSection = ({ sessions, onAction, getProfilePictureUrl, studentProfile }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);


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
          {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="max-w-6xl h-129">
            {/* Page Title and Actions */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">My Sessions</h1>
              <button className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium">
                <span className="text-lg">+</span>
                New Session
              </button>
            </div>

            {/* Tabs and Filters */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-6">
                <button
                  onClick={() => setActiveTab('Upcoming')}
                  className={`pb-2 font-medium transition-colors ${
                    activeTab === 'Upcoming'
                      ? 'text-teal-600 border-b-2 border-teal-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setActiveTab('Past')}
                  className={`pb-2 font-medium transition-colors ${
                    activeTab === 'Past'
                      ? 'text-teal-600 border-b-2 border-teal-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Past
                </button>
                <button
                  onClick={() => setActiveTab('Requests')}
                  className={`pb-2 font-medium transition-colors ${
                    activeTab === 'Requests'
                      ? 'text-teal-600 border-b-2 border-teal-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Requests
                </button>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" strokeWidth="2"/>
                  <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search sessions"
                  className="border-none outline-none text-gray-600 placeholder-gray-400"
                />
              </div>
            </div>

            {activeTab === 'Upcoming' && (
              <>
                {/* Upcoming Sessions Header */}
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Sessions</h2>
                  
                  {/* Filter Row */}
                  <div className="flex gap-4 mb-4">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50">
                      <Calendar size={16} className="text-gray-600" />
                      <span className="text-sm text-gray-700">This Month</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50">
                      <Book size={16} className="text-gray-600" />
                      <span className="text-sm text-gray-700">All Subjects</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50">
                      <Users size={16} className="text-gray-600" />
                      <span className="text-sm text-gray-700">All Tutors</span>
                    </button>
                  </div>
                </div>

                {/* Session Cards */}
                <div className="space-y-3">
                  {upcomingSessions.map((session, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-5 flex items-center justify-between hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <Calendar className="text-gray-400" size={24} />
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {session.subject} with {session.tutor} <span className="font-normal text-gray-600">• {session.date}</span>
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span>{session.location}</span>
                            <span>•</span>
                            <span>{session.duration}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              session.type === 'Virtual' 
                                ? 'bg-purple-100 text-purple-700' 
                                : 'bg-teal-100 text-teal-700'
                            }`}>
                              {session.type}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="px-4 py-2 text-teal-600 hover:bg-teal-50 rounded-lg font-medium">
                          Reschedule
                        </button>
                        <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium">
                          Join
                        </button>
                        <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'Past' && (
              <>
                {/* Past Sessions Header */}
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Past Sessions & Feedback</h2>
                </div>

                {/* Past Session Cards */}
                <div className="space-y-3">
                  {pastSessions.map((session, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <MessageSquare className="text-gray-400 mt-1" size={24} />
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {session.tutor} <span className="font-normal text-gray-600">• {session.subject} • {session.date}</span>
                            </h3>
                            <p className="text-sm text-gray-600 italic">"{session.feedback}"</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="px-4 py-2 bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-lg font-medium flex items-center gap-2">
                            View Notes
                          </button>
                          {index === 0 ? (
                            <button className="px-4 py-2 border border-teal-600 text-teal-600 hover:bg-teal-50 rounded-lg font-medium flex items-center gap-2">
                              <Star size={16} />
                              Rate
                            </button>
                          ) : (
                            <button className="px-4 py-2 border border-teal-600 text-teal-600 hover:bg-teal-50 rounded-lg font-medium flex items-center gap-2">
                              <RotateCcw size={16} />
                              Rebook
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
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

export default SessionsSection;