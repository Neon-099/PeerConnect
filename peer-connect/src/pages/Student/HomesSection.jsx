import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, User, Users, Search, Calendar, Bell, Star, Target, Clock, DollarSign, CheckCircle} from 'lucide-react';
import {apiClient} from '../../utils/api.js';

import Header from '../Student/Header.jsx';
import Footer from '../Student/Footer.jsx';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';
import FindTutorModal from '../../components/FindTutorModal.jsx';
import RescheduleModal from '../../components/RescheduleModal.jsx';

import ProfileSection from '../Student/ProfileSection.jsx';
import StudentMatchingSection from './StudentMatchingSection.jsx';
import SessionSection from './SessionSection.jsx';
import NotificationSection from './NotificationSection.jsx';
import ReviewModal from '../../components/ReviewModal.jsx';


const Homes = () =>  {
  const [activeTab, setActiveTab] = useState('home');
  const [searchInput, setSearchInput] = useState('');
  const [sessions, setSessions] = useState([]);
  const [allSessions, setAllSessions] = useState([]); // Add this to store all sessions
  const [filteredSessions, setFilteredSessions] = useState([]); // Add this for filtered results
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('My Sessions');

  const [userProfile, setUserProfile] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [isFindTutorModalOpen, setIsFindTutorModalOpen] = useState(false);
  const [isShowNotificationModal, setIsShowNotificationModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedSessionForReview, setSelectedSessionForReview] = useState(null);

  const navigate = useNavigate();
  //PROFILE DATA
  const fetchProfileData = async() => {
    try {
      setIsLoading(true);

      //FETCH USER PROFILE
      const userResponse = await apiClient.get('/api/user/profile');
      console.log('User profile received:', userResponse);
      setUserProfile(userResponse);

      //FETCH STUDENT DATA
      const studentData = await apiClient.get('/api/student/profile');
      console.log('Student profile received:', studentData);
      setStudentProfile(studentData);

    }
    catch (error) {
      console.error(`Error fetching profile data:`, error);
    }
    finally {
      setIsLoading(false);
    }
  }

  // Add function to fetch all sessions
  const fetchAllSessions = async () => {
    try {
      const response = await apiClient.get('/api/student/sessions');
      if (response && Array.isArray(response)) {
        setAllSessions(response);
      } else {
        setAllSessions([]);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setAllSessions([]);
    }
  };

  // Fetch sessions when component mounts or when needed
  useEffect(() => {
    if (activeTab === 'home') {
      fetchAllSessions();
    }
  }, [activeTab]);

  // Filter sessions when searchInput changes
  useEffect(() => {
    if (searchInput.trim() === '') {
      setFilteredSessions([]);
    } else {
      const searchTerm = searchInput.toLowerCase().trim();
      const filtered = allSessions.filter(session => {
        const subjectMatch = session.subject_name?.toLowerCase().includes(searchTerm);
        const tutorFirstNameMatch = session.tutor_first_name?.toLowerCase().includes(searchTerm);
        const tutorLastNameMatch = session.tutor_last_name?.toLowerCase().includes(searchTerm);
        const tutorFullNameMatch = `${session.tutor_first_name || ''} ${session.tutor_last_name || ''}`.toLowerCase().includes(searchTerm);
        
        return subjectMatch || tutorFirstNameMatch || tutorLastNameMatch || tutorFullNameMatch;
      });
      setFilteredSessions(filtered);
    }
  }, [searchInput, allSessions]);

  useEffect(() => {
    if(!isEditProfileModalOpen){
      fetchProfileData();
    }
  }, [isEditProfileModalOpen, activeNav]);


  const getProfilePictureUrl = (profilePicture) => {
    if(!profilePicture) {
      console.log('No profile picture, using default');
      return "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop"
    }
  
    if(profilePicture.startsWith('http')){
      return profilePicture;
    }
  
    //OTHERWISE, CONSTRUCT THE FULL Url
    const fullUrl = `${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/${profilePicture}`;
    console.log('Constructed profile picture URL:', fullUrl);
    return fullUrl;
  }
  const handleReviewSubmitted = () => {
    setShowReviewModal(false);
    fetchAllSessions();
  };

  const handleRateSession = (session) => {
    setSelectedSessionForReview(session);
    setShowReviewModal(true);
  };

  const handleCompleteSession = async (sessionId) => {
    if (window.confirm('Mark this session as completed?')) {
      try {
        await apiClient.post('/api/student/complete-session', { session_id: sessionId });
        alert('Session marked as completed! You can now write a review.');
        fetchAllSessions();
      } catch (error) {
        console.error('Error completing session:', error);
        alert('Failed to complete session. Please try again.');
      }
    }
  };

  const handleCancelSession = async (sessionId) => {
    if (window.confirm('Are you sure you want to cancel this session?')) {
      try {
        await apiClient.post(`/api/student/sessions/${sessionId}/cancel`);
        alert('Session cancelled successfully');
        fetchAllSessions();
      } catch (error) {
        console.error('Error cancelling session:', error);
        alert('Failed to cancel session. Please try again.');
      }
    }
  };

  const handleRescheduleSession = (session) => {
    setSelectedSession(session);
    setShowRescheduleModal(true);
  };

  const recentNotifications = [
    {
      id: 1,
      type: 'session',
      icon: 'calendar',
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
      title: 'Session confirmed: Calculus with Emma Wilson',
      subtitle: 'Today • 9:12 AM',
      action: 'Confirmed',
      actionColor: 'bg-green-600 text-white'
    },
    {
      id: 2,
      type: 'message',
      icon: 'message',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      title: 'New message from Emma Wilson',
      subtitle: '"Looking forward to our session. Please review limits."',
      action: 'Unread',
      actionColor: 'bg-teal-50 text-teal-700'
    },
    {
      id: 3,
      type: 'reminder',
      icon: 'alert',
      iconBg: 'bg-orange-500',
      iconColor: 'text-white',
      title: 'Upcoming session in 1 hour: Physics with Liam Chen',
      subtitle: 'Reminder',
      action: 'Snooze',
      actionColor: 'bg-teal-50 text-teal-700'
    },
    {
      id: 4,
      type: 'feedback',
      icon: 'check',
      iconBg: 'bg-green-600',
      iconColor: 'text-white',
      title: 'Feedback received: CS with Noah Patel',
      subtitle: '"Great progress on recursion." • Yesterday',
      action: 'View',
      actionColor: 'bg-teal-50 text-teal-700'
    },
    {
      id: 5,
      type: 'security',
      icon: 'key',
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
      title: 'Security: Password changed successfully',
      subtitle: 'Aug 27 • via Account',
      action: 'Details',
      actionColor: 'bg-teal-50 text-teal-700'
    }
  ];

  // Add function to format session time (similar to SessionSection)
  const formatSessionTime = (sessionDate, startTime, endTime) => {
    const date = new Date(sessionDate);
    const start = startTime?.substring(0, 5) || '';
    const end = endTime?.substring(0, 5) || '';
    
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: `${start} - ${end}`
    };
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={`${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-xs text-gray-600 ml-1">({rating})</span>
      </div>
    );
  };

  const renderSessionCard = (session, showActions = true) => {
    const timeInfo = formatSessionTime(session.session_date, session.start_time, session.end_time);
    return (
      <div key={session.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Calendar className="text-gray-400" size={24} />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                {session.subject_name} with {session.tutor_first_name} {session.tutor_last_name}
              </h3>
              <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                <span>{timeInfo.date}</span>
                <span>•</span>
                <span>{timeInfo.time}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <DollarSign size={14} />
                  {session.total_cost}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  session.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  session.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                  session.status === 'completed' ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {session.status === 'confirmed' ? 'Ready to Complete' : 
                   session.status?.charAt(0).toUpperCase() + session.status?.slice(1)}
                </span>
              </div>
              
              {/* Status Messages */}
              {session.status === 'pending' && (
                <div className="flex items-center gap-2 text-sm text-yellow-600">
                  <Clock size={16} />
                  <span>Waiting for tutor confirmation</span>
                </div>
              )}
              
              {session.status === 'confirmed' && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <CheckCircle size={16} />
                  <span>Session confirmed - Ready to complete</span>
                </div>
              )}
              
              {/* Review Status for Completed Sessions */}
              {session.status === 'completed' && (
                <div className="flex items-center gap-2 text-sm">
                  {session.has_review ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle size={16} />
                      <span>Reviewed</span>
                      {renderStars(session.review_rating)}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-orange-600">
                      <Clock size={16} />
                      <span>Awaiting Review</span>
                    </div>
                  )}
                </div>
              )}
              
              {session.notes && (
                <p className="text-sm text-gray-600 mt-1 italic">"{session.notes}"</p>
              )}
            </div>
          </div>
          
          {showActions && (
            <div className="flex items-center gap-2">
              {session.status === 'pending' && (
                <button 
                  onClick={() => handleCancelSession(session.id)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
                >
                  Cancel Request
                </button>
              )}
              {session.status === 'confirmed' && (
                <>
                  <button 
                    onClick={() => handleRescheduleSession(session)}
                    className="px-4 py-2 text-teal-600 hover:bg-teal-50 rounded-lg font-medium"
                  >
                    Reschedule
                  </button>
                  <button 
                    onClick={() => handleCompleteSession(session.id)}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium"
                  >
                    Complete Session
                  </button>
                  <button 
                    onClick={() => handleCancelSession(session.id)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                </>
              )}
              {session.status === 'completed' && (
                <div className="flex items-center gap-2">
                  {session.has_review ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg">
                      <CheckCircle size={16} />
                      <span className="text-sm font-medium">Reviewed</span>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleRateSession(session)}
                      className="px-4 py-2 border border-teal-600 text-teal-600 hover:bg-teal-50 rounded-lg font-medium flex items-center gap-2"
                    >
                      <Star size={16} />
                      Rate Session
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50" style={{ minWidth: '1400px' }}>
      {/* Sidebar */}
      <div className="w-60 bg-[#E6F0F2] border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 flex items-center gap-2">
          <div className="w-6 h-6 text-gray-800">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
          </div>
          <span className="text-xl font-semibold text-gray-800">PeerConnect</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Navigation</p>
          
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${
              activeTab === 'profile' 
                ? 'bg-teal-700 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="font-medium">Profile</span>
          </button>
          
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
            onClick={() => setActiveTab('find_tutors')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${
              activeTab === 'find_tutors' 
                ? 'bg-teal-700 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Target className="w-5 h-5" />
            <span className="font-medium">Find Tutors</span>
          </button>

          <button 
            onClick={() => setActiveTab('session')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${
              activeTab === 'session' 
                ? 'bg-teal-700 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="font-medium">My Sessions</span>
          </button>

          <button 
            onClick={() => setActiveTab('notification')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${
              activeTab === 'notification' 
                ? 'bg-teal-700 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Bell className="w-5 h-5" />
            <span className="font-medium">Notifications</span>
          </button>
        </nav>
        
        {/* Footer */}
        <div className="p-4 text-xs text-gray-500 border-t border-gray-200">
          © 2025 PeerConnect
        </div>
      </div>

      {/* Main Content */}
      {/* Profile Section */}
      {activeTab === 'profile' && (
        <ProfileSection
          userProfile={userProfile}
          studentProfile={studentProfile}
          onProfileUpdate={fetchProfileData}
          getProfilePictureUrl={getProfilePictureUrl}
          isLoading={isLoading}
        />
      )}

      {/* Home Section */}
      {activeTab === 'home' && (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="h-32 bg-white border-b border-gray-200 flex items-center justify-between px-8">
            <div></div>
            <div className="flex items-center gap-4">
              <Header 
                userProfilePictureUrl={getProfilePictureUrl(studentProfile?.profile_picture)}
                userProfile={studentProfile?.first_name} 
              />
            </div>
          </div>
          {isLoading ? (
            <div className='h-270 overflow-auto'>
              <LoadingSpinner />
            </div>
          ) : (
            <div className="flex-1 overflow-auto p-8">
              <div className="max-w-6xl mx-auto">
                {/* Welcome Header */}
                <div className="flex items-center justify-start mb-6">
                  <h1 className="text-2xl font-semibold text-gray-800">Welcome back, {studentProfile?.first_name}</h1>
                </div>

                {/* Find Tutor Card */}
                <div className="bg-[#E6F0F2] p-5 rounded-xl mb-6">
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
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setActiveTab('find_tutors')}
                      className="px-6 py-3 bg-teal-700 text-white rounded-lg font-medium hover:bg-teal-800 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Find a Tutor
                    </button>
                  </div>
                </div>

                {/* Upcoming Sessions - Hide when searchInput has value */}
                {searchInput.trim() === '' && (
                  <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Sessions</h2>
                    
                    <div className="space-y-4">
                      {allSessions.filter(s => s.status === 'confirmed').length === 0 ? (
                        <div className="text-center py-12">
                          <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming sessions</h3>
                          <p className="text-gray-600">Your confirmed sessions will appear here.</p>
                        </div>
                      ) : (
                        allSessions
                          .filter(s => s.status === 'confirmed')
                          .slice(0, 3)
                          .map(session => renderSessionCard(session))
                      )}
                    </div>
                  </div>
                )}

                {/* Sessions Section - Show when searchInput has value */}
                {searchInput.trim() !== '' && (
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Sessions</h2>
                    
                    <div className="space-y-4">
                      {filteredSessions.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-gray-600">No sessions found matching "{searchInput}"</p>
                        </div>
                      ) : (
                        filteredSessions.map(session => renderSessionCard(session))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="h-[63px] bg-white border-t border-gray-200 flex items-center justify-end px-8">
            <Footer/>
          </div>
        </div>
      )}

      {/* Find Tutors Section */}
      {activeTab === 'find_tutors' && (
          <StudentMatchingSection
            getProfilePictureUrl={getProfilePictureUrl}
            studentProfile={studentProfile}
          />
      )}

      {/* Session Section*/}
      {activeTab === 'session' && (
        <SessionSection
         sessions={sessions}
         onAction={() => {}}
         getProfilePictureUrl={getProfilePictureUrl}
         studentProfile={studentProfile}
         />
      )}

      {/* Notification Section */}
      {activeTab === 'notification' && (
        <NotificationSection
        notifications={recentNotifications}
        onMarkRead={() => {}}
        getProfilePictureUrl={getProfilePictureUrl}
        studentProfile={studentProfile}
      />
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedSessionForReview(null);
          }}
          session={selectedSessionForReview}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <RescheduleModal
          isOpen={showRescheduleModal}
          onClose={() => {
            setShowRescheduleModal(false);
            setSelectedSession(null);
          }}
          session={selectedSession}
          userRole="student"
          onRescheduleSuccess={() => {
            fetchAllSessions();
          }}
        />
      )}

      {isShowNotificationModal && (
        <StudentNotificationModal
          isOpen={isShowNotificationModal}
          onClose={() => setIsShowNotificationModal(false)}
        />
      )}
    </div>
  );
}

export default Homes;