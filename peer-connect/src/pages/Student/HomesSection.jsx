import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, User, Users, Search, Calendar, Bell, Star, Target} from 'lucide-react';
import {apiClient} from '../../utils/api.js';
import { useNotifications } from '../../hooks/useNotifications.js';

import Header from '../Student/Header.jsx';
import Footer from '../Student/Footer.jsx';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';
import FindTutorModal from '../../components/FindTutorModal.jsx';
import StudentFloatingNotification from '../../components/notification/StudentFloatingNotification.jsx';

import ProfileSection from '../Student/ProfileSection.jsx';
import StudentMatchingSection from './StudentMatchingSection.jsx';
import SessionSection from './SessionSection.jsx';
import NotificationSection from './NotificationSection.jsx';
import ReviewModal from '../../components/ReviewModal.jsx';


const Homes = () =>  {
  const [activeTab, setActiveTab] = useState('home');
  const [searchInput, setSearchInput] = useState('');
  const [sessions, setSessions] = useState([]);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('My Sessions');

  const [userProfile, setUserProfile] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [isFindTutorModalOpen, setIsFindTutorModalOpen] = useState(false);
  const [isShowNotificationModal, setIsShowNotificationModal] = useState(false);

  const { 
    floatingNotification, hideFloatingNotification, 
    markAsRead } = useNotifications('student');
  const [showReviewModal, setShowReviewModal] = useState(false);

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
  
  const handleFloatingNotificationAction = async (notification, action) => {
    try {
      switch (action) {
        case 'dismiss':
          await markAsRead(notification.id); // strict rule: mark read on dismiss
          break;
        case 'view_session':
          setActiveNav('My Sessions');
          setActiveTab('sessions');
          break;
        case 'complete_session':
          // Navigate to sessions and trigger completion
          setActiveNav('My Sessions');
          setActiveTab('sessions');
          // You could add additional logic here to highlight the specific session
          break;
        case 'view_request':
          setActiveNav('My Sessions');
          setActiveTab('sessions');
          break;
        case 'write_review':
          setActiveNav('Reviews');
          setShowReviewModal(true);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error handling notification action:', error);
    }
  };
  
  const handleReviewSubmitted = () => {
    setShowReviewModal(false);
  }

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
            <div className="flex gap-30 overflow-auto p-20 mt" style={{ maxWidth: '1800px' }}>
              {/* Left Column */}
              <div className="flex-1 ">
                {/* Welcome Header */}
                <div className="flex items-center justify-between my-6 ">
                  <h1 className="text-2xl font-semibold text-gray-800">Welcome back, {studentProfile?.first_name}</h1>
                  <p className="text-sm text-gray-500">Stay motivated. You're 62% to your study goals this month.</p>
                </div>

                {/* Find Tutor Card */}
                <div className="bg-[#E6F0F2] p-5 to-gray-100 rounded-xl my-15 w-[1000px]">
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
                    <button className="px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50">
                      Advanced filters
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsFindTutorModalOpen(true)}
                      className="px-6 py-3 bg-teal-700 text-white rounded-lg font-medium hover:bg-teal-800 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Find a Tutor
                    </button>
                  </div>
                </div>

                {/* Upcoming Sessions */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 h-120 w-250">
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
              <div className="my-29">
                {/* Quick Actions */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 mb-7 w-90">
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
                <div className="bg-white rounded-xl p-6 border border-gray-200  w-90">
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
          onClose={() => setShowReviewModal(false)}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
      {/* Find Tutor Modal */}
      <FindTutorModal 
        isOpen={isFindTutorModalOpen} 
        onClose={() => setIsFindTutorModalOpen(false)}
      />

      {/* Floating Session Notification */}
      {floatingNotification && (
        <StudentFloatingNotification
          notification={floatingNotification}
          onClose={hideFloatingNotification}
          onAction={handleFloatingNotificationAction}
        />
      )}
     
      {isShowNotificationModal && (
        <TutorNotificationModal
          isOpen={isShowNotificationModal}
          onClose={() => setIsShowNotificationModal(false)}
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