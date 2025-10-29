import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, User, Users,  Calendar,  
     Bell, Star,  LogOut, MessageSquare, DollarSign,MapPin, Video, Settings, Target, 
     ChevronLeft, ChevronRight, GraduationCapIcon, X, CheckCircle} from 'lucide-react';

import TutorProfilePage from './TutorProfilePage.jsx';
import SessionPage from './SessionPage.jsx';
import NotificationPage from './NotificationPage.jsx';
import TutorEditProfileModal from '../../../components/TutorEditProfileModal.jsx';
import TutorMatchingSection from './TutorMatchingSection.jsx';
import { auth } from '../../../utils/auth';
import {apiClient} from '../../../utils/api';


import Header from './Header.jsx';
import Footer from '../../Student/Footer.jsx';
import { LoadingSpinner } from '../../../components/tutor/LoadingSpinner.jsx';
import AvailabilityCalendarModal from '../../../components/tutor/AvailabilityCalendarModal.jsx';
import RescheduleModal from '../../../components/RescheduleModal.jsx';

const Homes = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  const [userProfile, setUserProfile] = useState(null);
  const [tutorProfile, setTutorProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Add state for sessions
  const [tutorSessions, setTutorSessions] = useState([]);
  
  // Add state for modals
  const [showRecentSessionsModal, setShowRecentSessionsModal] = useState(false);
  const [showPastSessionsModal, setShowPastSessionsModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedSessionForReschedule, setSelectedSessionForReschedule] = useState(null);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [availability, setAvailability] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const [showStudentProfileView, setShowStudentProfileView] = useState(false);
  const [selectedStudentForView, setSelectedStudentForView] = useState(null); 

  const navigate = useNavigate();

  // PROFILE DATA
  const fetchProfileData = async() => {
    try {
      setIsLoading(true);

      // FETCH USER PROFILE
      const userResponse = await apiClient.get('/api/user/profile');
      console.log('User profile received:', userResponse);
      setUserProfile(userResponse);

      // FETCH TUTOR DATA
      const tutorData = await apiClient.get('/api/tutor/profile');
      console.log('Tutor profile received:', tutorData);
      setTutorProfile(tutorData);

    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [activeTab]);

  // Add useEffect to fetch sessions
  useEffect(() => {
    fetchTutorSessions();
  }, []);

  // Add function to fetch tutor sessions
  const fetchTutorSessions = async () => {
    try {
      const response = await apiClient.get('/api/tutor/sessions');
      if (Array.isArray(response)) {
        setTutorSessions(response);
      } else {
        setTutorSessions([]);
      }
    } catch (error) {
      console.error('Error fetching tutor sessions:', error);
      setTutorSessions([]);
    }
  };

  // Helper function to get current week boundaries (Sunday to Saturday)
  const getCurrentWeekBoundaries = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Calculate Sunday of current week
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - dayOfWeek);
    sunday.setHours(0, 0, 0, 0);
    
    // Calculate Saturday of current week
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    saturday.setHours(23, 59, 59, 999);
    
    return { start: sunday, end: saturday };
  };

  // Calculate COMPLETED sessions count for current week
  const getThisWeekCompletedSessions = () => {
    if (!Array.isArray(tutorSessions)) return 0;
    
    const { start, end } = getCurrentWeekBoundaries();
    
    return tutorSessions.filter(session => {
      // Only count completed sessions
      if (session.status !== 'completed') {
        return false;
      }
      
      // Check if session date is within current week
      if (!session.session_date) return false;
      
      const sessionDate = new Date(session.session_date);
      sessionDate.setHours(0, 0, 0, 0);
      
      return sessionDate >= start && sessionDate <= end;
    }).length;
  };

  // Calculate earnings from COMPLETED sessions this week
  const getThisWeekEarnings = () => {
    if (!Array.isArray(tutorSessions)) return 0;
    
    const { start, end } = getCurrentWeekBoundaries();
    
    const completedSessionsThisWeek = tutorSessions.filter(session => {
      // Only count completed sessions
      if (session.status !== 'completed') {
        return false;
      }
      
      // Check if session date is within current week
      if (!session.session_date) return false;
      
      const sessionDate = new Date(session.session_date);
      sessionDate.setHours(0, 0, 0, 0);
      
      return sessionDate >= start && sessionDate <= end;
    });
    
    // Sum up total_cost from all completed sessions this week
    return completedSessionsThisWeek.reduce((total, session) => {
      const cost = parseFloat(session.total_cost) || 0;
      return total + cost;
    }, 0);
  };

  // Add this useEffect to initialize availability from profile data
  useEffect(() => {
    if (tutorProfile && tutorProfile.availability) {
      setAvailability(tutorProfile.availability);
    }
  }, [tutorProfile]);

  // Add notification count fetch function
  const fetchUnreadNotificationCount = async () => {
    try {
      const response = await apiClient.get('/api/tutor/notifications/unread-count');
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
    }
  };

  // Add useEffect to fetch notification count
  useEffect(() => {
    fetchUnreadNotificationCount();
    // Set up interval to check for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadNotificationCount, 30000);
    return () => clearInterval(interval);
  }, []);

  
  const getProfilePictureUrl = (profilePicture) => {
    if (!profilePicture) return '/default-avatar.png';
    if (profilePicture.startsWith('http')) return profilePicture;
    return `${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/${profilePicture}`;
  };

  const handleLogout = async () => {
    try {
      const confirmed = window.confirm('Are you sure you want to logout?');
      if(!confirmed) return;

      await auth.logout();
      alert('Logout successfully');
      navigate('/tutor/landing');
    } catch (err) {
      console.log('Logout error:', err);
      alert('Logout failed please try again!');
    }
  }

  // Function to generate week data with real dates
  const generateWeekData = (startDate) => {
    try {
      const week = [];
      
      // Validate startDate
      if (!startDate || isNaN(new Date(startDate).getTime())) {
        console.error('Invalid startDate provided to generateWeekData');
        return [];
      }
      
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        console.error('Invalid start date');
        return [];
      }
      
      start.setDate(start.getDate() - start.getDay()); // Start from Sunday
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        
        // Validate the date before using toISOString
        if (isNaN(date.getTime())) {
          console.error(`Invalid date generated at index ${i}`);
          continue;
        }
        
        const dateStr = date.toISOString().split('T')[0];
        
        // Check availability - handle both date-based and day-based formats
        const isAvailable = availability && Array.isArray(availability) ? availability.some(slot => {
          try {
            // If slot has availability_date, compare dates directly
            if (slot.availability_date) {
              return slot.availability_date === dateStr && slot.is_available;
            }
            
            // If slot has day_of_week, check if it matches the current day
            if (slot.day_of_week) {
              const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
              return slot.day_of_week.toLowerCase() === dayOfWeek && slot.is_available;
            }
            
            return false;
          } catch (error) {
            console.error('Error checking availability for slot:', slot, error);
            return false;
          }
        }) : false;
        
        // Count confirmed AND completed sessions for this date (exclude cancelled and pending)
        const sessionCount = tutorSessions.filter(session => {
          // Count both confirmed and completed sessions
          if (session.status !== 'confirmed' && session.status !== 'completed') {
            return false;
          }
          
          // Match the session date with the current day
          const sessionDateStr = session.session_date 
            ? new Date(session.session_date).toISOString().split('T')[0]
            : null;
          
          return sessionDateStr === dateStr;
        }).length;
        
        week.push({
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          date: date.getDate(),
          fullDate: date,
          isAvailable: isAvailable,
          sessions: sessionCount // Use real session count instead of random
        });
      }
      
      return week;
    } catch (error) {
      console.error('Error in generateWeekData:', error);
      return [];
    }
  };

  // Function to get week range string
  const getWeekRangeString = (startDate) => {
    const start = new Date(startDate);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  // Function to navigate weeks
  const navigateWeek = (direction) => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction * 7));
    setCurrentWeek(newWeek);
    // Refresh sessions when navigating weeks to ensure accurate counts
    fetchTutorSessions();
  };

  // Function to handle availability save
  const handleAvailabilitySave = async (newAvailability) => {
    try {
      console.log('Saving availability:', newAvailability);
      
      // Ensure we have valid availability data
      if (!Array.isArray(newAvailability)) {
        console.error('Invalid availability data format');
        return;
      }
      
      // Save to backend
      const response = await apiClient.put('/api/tutor/profile', { 
        availability: newAvailability 
      });
      
      console.log('Availability saved successfully:', response);
      
      // Update local state
      setAvailability(newAvailability);
      
      // Refresh profile data
      await fetchProfileData();
      
      // Close the modal
      setShowAvailabilityModal(false);
      
    } catch (error) {
      console.error('Failed to save availability:', error);
      // You might want to show a user-friendly error message here
    }
  };

  // Helper functions to format session data
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '';
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0 && diffMinutes > 0) {
      return `${diffHours}hr ${diffMinutes}min`;
    } else if (diffHours > 0) {
      return `${diffHours}hr`;
    } else {
      return `${diffMinutes}min`;
    }
  };

  const getSessionType = (location) => {
    if (!location || location.toLowerCase().includes('online') || location.toLowerCase().includes('virtual')) {
      return 'Online';
    }
    return 'In person';
  };

  // Filter sessions - confirmed for recent, completed for past
  const getRecentSessions = () => {
    if (!Array.isArray(tutorSessions)) return [];
    return tutorSessions
      .filter(session => session.status === 'confirmed')
      .sort((a, b) => {
        const dateA = new Date(`${a.session_date}T${a.start_time}`);
        const dateB = new Date(`${b.session_date}T${b.start_time}`);
        return dateA - dateB;
      });
  };

  const getPastSessions = () => {
    if (!Array.isArray(tutorSessions)) return [];
    return tutorSessions
      .filter(session => session.status === 'completed')
      .sort((a, b) => {
        const dateA = new Date(`${a.session_date}T${a.start_time}`);
        const dateB = new Date(`${b.session_date}T${b.start_time}`);
        return dateB - dateA; // Most recent first
      });
  };

  const recentSessions = getRecentSessions();
  const pastSessions = getPastSessions();

  // Render session card component with reschedule functionality
  const renderSessionCard = (session, showActions = true) => {
    const studentName = `${session.student_first_name || ''} ${session.student_last_name || ''}`.trim();
    const sessionDate = formatDate(session.session_date);
    const timeRange = `${formatTime(session.start_time)} - ${formatTime(session.end_time)}`;
    const duration = calculateDuration(session.start_time, session.end_time);
    const sessionType = getSessionType(session.location);
    const studentImage = session.student_profile_picture 
      ? getProfilePictureUrl(session.student_profile_picture)
      : '/default-avatar.png';

    return (
      <div key={session.id} className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200 hover:shadow-md transition-all">
        <img 
          src={studentImage} 
          alt={studentName || 'Student'}
          className="w-12 h-12 rounded-xl object-cover border-2 border-blue-200"
        />
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800">
            {session.subject_name || 'Subject'} with {studentName || 'Student'}
          </h4>
          <p className="text-sm text-gray-600">{sessionDate} - {timeRange}</p>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-sm text-gray-500">{duration}</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
              {sessionType}
            </span>
          </div>
        </div>
        {showActions && (
          <div className="flex gap-2">
            {session.status === 'confirmed' && (
              <>
                <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                  Confirmed
                </button>
                <button 
                  onClick={() => {
                    setSelectedSessionForReschedule(session);
                    setShowRescheduleModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Reschedule
                </button>
              </>
            )}
            {session.status === 'completed' && (
              <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                Completed
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#E6F0F2]">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-slate-200 border-r border-slate-200 flex flex-col">
        {/* Profile Section */}
        <div className="p-6  flex items-center gap-3">
           <span className="text-xl font-semibold text-slate-800 ">PeerConnect</span>
           <GraduationCapIcon className="w-5 h-5" />
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4">
          <nav className="space-y-2">
            {[
              { id: 'profile', label: 'Profile', icon: User, active: activeTab === 'profile' },
              { id: 'home', label: 'Home', icon: Home, active: activeTab === 'home' },
              { id: 'matches', label: 'Find Students', icon: Target, active: activeTab === 'matches' },
              { id: 'sessions', label: 'Sessions', icon: Calendar, active: activeTab === 'sessions' },
              { id: 'notifications', label: 'Notifications', icon: Bell, active: activeTab === 'notifications' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  item.active 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom Links */}
        <div className="p-2 ">
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
              onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex flex-col min-h-screen">  
        {/* Header */}
        <div className="h-16 sticky top-0 z-10 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <div></div>
          <div className="flex items-center gap-4">
            <Header 
              userProfilePictureUrl={getProfilePictureUrl(tutorProfile?.profile_picture)}
              userProfile={tutorProfile?.first_name} 
            />
          </div>
        </div>

        {/* Profile Section */}
        {activeTab === 'profile' && (
          <TutorProfilePage 
            tutorProfile={tutorProfile}
            userProfile={userProfile}
            getProfilePictureUrl={getProfilePictureUrl}
            onProfileUpdate={fetchProfileData}
          />
        )}

        {/* Home Section - REDESIGNED */}
        {activeTab === 'home' && (
          <div className="flex-1 flex flex-col">
            {isLoading ? (
              <div className='h-270 overflow-auto'>
                <LoadingSpinner />
              </div>
            ) : (
              <div className="flex-1 overflow-auto p-8">
                <div className="max-w-7xl mx-auto">
                  {/* Page Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h1 className="text-3xl font-semibold text-gray-800 mb-2">Welcome back, {tutorProfile?.first_name || 'Tutor'}!</h1>
                      <p className="text-gray-600">Here's what's happening with your tutoring sessions</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('matches')}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
                      >
                        <Target className="w-5 h-5" />
                        Find Students
                      </button>
                    </div>
                  </div>

                  {/* Quick Stats - UPDATED WITH BLUE COLORS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Completed Sessions This Week */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-gray-800">{getThisWeekCompletedSessions()}</p>
                          <p className="text-sm text-gray-600 font-medium">Completed this week</p>
                        </div>
                      </div>
                    </div>

                    {/* Earnings This Week */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md">
                          <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-gray-800">₱{getThisWeekEarnings().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          <p className="text-sm text-gray-600 font-medium">Earnings this week</p>
                        </div>
                      </div>
                    </div>

                    {/* Average Rating */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-md">
                          <Star className="w-6 h-6 text-white fill-current" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-gray-800">{tutorProfile?.average_rating || '0.0'}</p>
                          <p className="text-sm text-gray-600 font-medium">Average rating</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Weekly Overview - UPDATED DESIGN */}
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 mb-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => navigateWeek(-1)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5 text-blue-600" />
                        </button>
                        <h3 className="text-xl font-semibold text-gray-800">
                          Week of {getWeekRangeString(currentWeek)}
                        </h3>
                        <button 
                          onClick={() => navigateWeek(1)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <ChevronRight className="w-5 h-5 text-blue-600" />
                        </button>
                      </div>
                      <button 
                        onClick={() => setShowAvailabilityModal(true)} 
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
                      >
                        <Calendar className="w-5 h-5" />
                        Set Availability
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-4">
                      {(() => {
                        const weekData = generateWeekData(currentWeek);
                        if (weekData.length === 0) {
                          return (
                            <div className="col-span-7 text-center py-8 text-gray-500">
                              Unable to load week data. Please try again.
                            </div>
                          );
                        }
                        
                        return weekData.map((day, index) => (
                          <div key={index} className="text-center">
                            <div className={`rounded-xl p-4 border-2 transition-all ${
                              day.isAvailable 
                                ? 'bg-blue-50 border-blue-300 shadow-sm' 
                                : 'bg-gray-50 border-gray-200'
                            }`}>
                              <p className="text-sm font-medium text-gray-600">{day.day}</p>
                              <p className="text-lg font-semibold text-gray-800 mt-1">{day.date}</p>
                              <div className="mt-2">
                                {day.isAvailable ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <p className="text-xs text-blue-600 font-medium">Available</p>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                    <p className="text-xs text-gray-500">Not Available</p>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {day.sessions === 0 ? 'No sessions' : `${day.sessions} session${day.sessions > 1 ? 's' : ''}`}
                              </p>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Sessions Section - UPDATED DESIGN */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Upcoming Sessions */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800">Upcoming Sessions</h3>
                          <p className="text-sm text-gray-600">Confirmed sessions</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {recentSessions.length === 0 ? (
                          <div className="text-center py-12 text-gray-500 bg-blue-50 rounded-xl">
                            <Calendar className="w-12 h-12 mx-auto mb-3 text-blue-300" />
                            <p className="font-medium">No confirmed sessions scheduled</p>
                            <p className="text-sm mt-1">Your upcoming sessions will appear here</p>
                          </div>
                        ) : (
                          recentSessions.slice(0, 3).map(session => renderSessionCard(session))
                        )}
                      </div>
                      {recentSessions.length > 3 && (
                        <button
                          onClick={() => setShowRecentSessionsModal(true)}
                          className="w-full mt-4 px-4 py-3 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors"
                        >
                          See More ({recentSessions.length} total)
                        </button>
                      )}
                    </div>

                    {/* Past Sessions */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-800">Completed Sessions</h3>
                            <p className="text-sm text-gray-600">Past 30 days</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {pastSessions.length === 0 ? (
                          <div className="text-center py-12 text-gray-500 bg-green-50 rounded-xl">
                            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
                            <p className="font-medium">No completed sessions yet</p>
                            <p className="text-sm mt-1">Your completed sessions will appear here</p>
                          </div>
                        ) : (
                          pastSessions.slice(0, 3).map(session => renderSessionCard(session))
                        )}
                      </div>
                      {pastSessions.length > 3 && (
                        <button
                          onClick={() => setShowPastSessionsModal(true)}
                          className="w-full mt-4 px-4 py-3 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors"
                        >
                          See More ({pastSessions.length} total)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Find Students Section */}
        {activeTab === 'matches' && (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-auto p-8">
              <TutorMatchingSection />
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <SessionPage />
        )}

        {activeTab === 'notifications' && (
          <NotificationPage
            tutorProfile={tutorProfile}
            getProfilePictureUrl={getProfilePictureUrl}
          />
        )}
        {/* Footer */}
        <div className="h-16 sticky bottom-0 z-10 mt-auto bg-white border-t border-gray-200 flex items-center justify-end px-8">
          <Footer />
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditProfileModalOpen && (
        <TutorEditProfileModal
          isOpen={isEditProfileModalOpen}
          onClose={() => setIsEditProfileModalOpen(false)}
          onProfileUpdate={fetchProfileData}
        />
      )}

      {showAvailabilityModal && (
        <AvailabilityCalendarModal
          isOpen={showAvailabilityModal}
          onClose={() => setShowAvailabilityModal(false)}
          onSave={handleAvailabilitySave}
          initialAvailability={availability}
        />
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedSessionForReschedule && (
        <RescheduleModal
          isOpen={showRescheduleModal}
          onClose={() => {
            setShowRescheduleModal(false);
            setSelectedSessionForReschedule(null);
          }}
          session={selectedSessionForReschedule}
          userRole="tutor"
          onRescheduleSuccess={() => {
            fetchTutorSessions(); // Refresh sessions after reschedule
            setShowRescheduleModal(false);
            setSelectedSessionForReschedule(null);
          }}
        />
      )}

      {/* Recent Sessions Modal - UPDATED */}
      {showRecentSessionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
              <h2 className="text-2xl font-semibold text-white">All Upcoming Sessions</h2>
              <button
                onClick={() => setShowRecentSessionsModal(false)}
                className="p-2 hover:bg-blue-700 rounded-lg transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {recentSessions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="font-medium text-lg">No confirmed sessions scheduled</p>
                  </div>
                ) : (
                  recentSessions.map(session => renderSessionCard(session))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Past Sessions Modal - UPDATED */}
      {showPastSessionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-600 to-green-700">
              <h2 className="text-2xl font-semibold text-white">All Completed Sessions</h2>
              <button
                onClick={() => setShowPastSessionsModal(false)}
                className="p-2 hover:bg-green-700 rounded-lg transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {pastSessions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="font-medium text-lg">No completed sessions yet</p>
                  </div>
                ) : (
                  pastSessions.map(session => renderSessionCard(session))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Homes;