import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, User, Users, Search, Calendar, AlertTriangle, CheckCircle, 
    Mail, Bell, Star, Edit, TrendingUp, Shield, Key, LogOut, MessageSquare,
    ChevronUp, ChevronDown, Book, RotateCcw, DollarSign, Clock, MapPin, 
    Video, UserCheck, BarChart3, Settings, Plus, GraduationCap, Eye, 
    Target, Zap, Award, BookOpen, Timer} from 'lucide-react';

import TutorProfilePage from './TutorProfilePage.jsx';
import TutorEditProfileModal from '../../../components/TutorEditProfileModal.jsx';
import MatchingResults from '../../../components/MatchingResults.jsx';
import { auth } from '../../../utils/auth';
import {apiClient} from '../../../utils/api';

import Header from '../Header.jsx';
import Footer from '../Footer.jsx';
import { LoadingSpinner } from '../../../components/LoadingSpinner.jsx';

const Homes = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isProfile, setIsProfile] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [sessions, setSessions] = useState([]);
  const [filterTab, setFilterTab] = useState('all');
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const [userProfile, setUserProfile] = useState(null);
  const [tutorProfile, setTutorProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // New state for matching functionality
  const [matchingStudents, setMatchingStudents] = useState([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

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

  // FETCH MATCHING STUDENTS
  const fetchMatchingStudents = async() => {
    try {
      setIsLoadingMatches(true);
      const response = await apiClient.get('/api/matching/findStudents');
      setMatchingStudents(response.matches || []);
    } catch (error) {
      console.error('Error fetching matching students:', error);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
    fetchMatchingStudents();
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

  // Format availability for display
  const formatAvailability = (availability) => {
    if (!availability || availability.length === 0) return 'Not set';
    
    const groupedByDay = availability.reduce((acc, slot) => {
      if (!acc[slot.day]) acc[slot.day] = [];
      acc[slot.day].push(`${slot.start_time}-${slot.end_time}`);
      return acc;
    }, {});

    return Object.entries(groupedByDay).map(([day, times]) => 
      `${day.charAt(0).toUpperCase() + day.slice(1)}: ${times.join(', ')}`
    ).join(' | ');
  };

  // Mock data for demonstration
  const mockSessions = [
    {
      id: 1,
      student: 'Ava Patel',
      subject: 'Algebra II',
      date: 'Mon, Mar 11',
      time: '10:00-11:00 AM',
      duration: '1hr',
      type: 'Online',
      status: 'Confirmed',
      studentImage: '/default-avatar.png'
    },
    {
      id: 2,
      student: 'Liam Chen',
      subject: 'Chemistry',
      date: 'Mon, Mar 11',
      time: '2:00-3:00 PM',
      duration: '1hr',
      type: 'In person',
      status: 'Pending',
      studentImage: '/default-avatar.png'
    },
    {
      id: 3,
      student: 'Noah Reed',
      subject: 'English Essay',
      date: 'Thu, Mar 14',
      time: '4:00-5:30 PM',
      duration: '90 min',
      type: 'Online',
      status: 'Confirmed',
      studentImage: '/default-avatar.png'
    }
  ];

  const mockPastSessions = [
    {
      id: 4,
      student: 'Emma Davis',
      subject: 'Biology Review',
      date: 'Sat, Mar 9',
      time: '11:00 AM-12:00 PM',
      duration: '1hr',
      type: 'Online',
      status: 'Completed',
      studentImage: '/default-avatar.png'
    },
    {
      id: 5,
      student: 'Olivia Park',
      subject: 'Geometry',
      date: 'Fri, Mar 8',
      time: '3:00-4:00 PM',
      duration: '1hr',
      type: 'In person',
      status: 'Completed',
      studentImage: '/default-avatar.png'
    }
  ];

  const weeklyData = [
    { day: 'Sun', date: '10', sessions: 0 },
    { day: 'Mon', date: '11', sessions: 2 },
    { day: 'Tue', date: '12', sessions: 1 },
    { day: 'Wed', date: '13', sessions: 0 },
    { day: 'Thu', date: '14', sessions: 1 },
    { day: 'Fri', date: '15', sessions: 0 },
    { day: 'Sat', date: '16', sessions: 0 }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-slate-100 border-r border-slate-200 flex flex-col">
        {/* Profile Section */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <img 
              src={getProfilePictureUrl(tutorProfile?.profile_picture)} 
              alt={tutorProfile?.first_name || 'Tutor'} 
              className="w-12 h-12 rounded-xl object-cover border-2 border-slate-200"
            />
            <div>
              <h3 className="font-semibold text-slate-800">{tutorProfile?.first_name || 'Sarah'} {tutorProfile?.last_name || 'Thompson'}</h3>
              <p className="text-sm text-slate-600">Tutor</p>
              {tutorProfile?.is_verified_tutor && (
                <div className="flex items-center gap-1 mt-1">
                  <Award className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">Verified</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4">
          <nav className="space-y-2">
            {[
              { id: 'profile', label: 'Profile', icon: User, active: activeTab === 'profile' },
              { id: 'home', label: 'Dashboard', icon: Home, active: activeTab === 'home' },
              { id: 'sessions', label: 'Sessions', icon: Calendar, active: activeTab === 'sessions' },
              { id: 'students', label: 'Students', icon: Users, active: activeTab === 'students' },
              { id: 'matches', label: 'Find Students', icon: Target, active: activeTab === 'matches' },
              { id: 'earnings', label: 'Earnings', icon: DollarSign, active: activeTab === 'earnings' },
              { id: 'messages', label: 'Messages', icon: MessageSquare, active: activeTab === 'messages' }
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
        <div className="p-4 border-t border-slate-200">
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors">
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </button>
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
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
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
        
        {/* Home Section */}
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
                      <h1 className="text-3xl font-semibold text-slate-800">Dashboard</h1>
                      <p className="text-slate-600 mt-1">Welcome back, {tutorProfile?.first_name || 'Sarah'}! Here's what's happening.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('matches')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                      >
                        <Target className="w-4 h-4" />
                        Find Students
                      </button>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                          <Calendar className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-800">12</p>
                          <p className="text-sm text-slate-600">Sessions this week</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 border border-slate-200">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-xl">
                          <Users className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-800">8</p>
                          <p className="text-sm text-slate-600">Active students</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 border border-slate-200">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-100 rounded-xl">
                          <DollarSign className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-800">₱480</p>
                          <p className="text-sm text-slate-600">Earnings this week</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 border border-slate-200">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-xl">
                          <Star className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-800">{tutorProfile?.average_rating || '4.9'}</p>
                          <p className="text-sm text-slate-600">Average rating</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Weekly Overview */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 mb-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-slate-800">Week of Mar 10 - Mar 16</h3>
                      <div className="flex items-center gap-4">
                        <p className="text-sm text-slate-500">All times in your timezone</p>
                        <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors">
                          <Calendar className="w-4 h-4" />
                          Set Availability
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-4">
                      {weeklyData.map((day, index) => (
                        <div key={index} className="text-center">
                          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <p className="text-sm font-medium text-slate-600">{day.day}</p>
                            <p className="text-lg font-semibold text-slate-800 mt-1">{day.date}</p>
                            <p className="text-xs text-slate-500 mt-2">
                              {day.sessions === 0 ? 'No sessions' : `${day.sessions} session${day.sessions > 1 ? 's' : ''}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Upcoming Sessions */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200">
                      <h3 className="text-xl font-semibold text-slate-800 mb-6">Upcoming Sessions</h3>
                      <div className="space-y-4">
                        {mockSessions.map((session) => (
                          <div key={session.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <img 
                              src={session.studentImage} 
                              alt={session.student}
                              className="w-12 h-12 rounded-xl object-cover"
                            />
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-800">{session.subject} with {session.student}</h4>
                              <p className="text-sm text-slate-600">{session.date} - {session.time}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-sm text-slate-500">{session.duration}</span>
                                <div className="flex items-center gap-1">
                                  {session.type === 'Online' ? <Video className="w-4 h-4 text-blue-500" /> : <MapPin className="w-4 h-4 text-green-500" />}
                                  <span className="text-sm text-slate-500">{session.type}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                session.status === 'Confirmed' 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {session.status}
                              </button>
                              <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
                                {session.status === 'Pending' ? 'Confirm' : 'Reschedule'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Past Sessions */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-slate-800">Past Sessions</h3>
                        <p className="text-sm text-slate-500">Last 30 days</p>
                      </div>
                      <div className="space-y-4">
                        {mockPastSessions.map((session) => (
                          <div key={session.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <img 
                              src={session.studentImage} 
                              alt={session.student}
                              className="w-12 h-12 rounded-xl object-cover"
                            />
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-800">{session.subject} with {session.student}</h4>
                              <p className="text-sm text-slate-600">{session.date} - {session.time}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-sm text-slate-500">{session.duration}</span>
                                <div className="flex items-center gap-1">
                                  {session.type === 'Online' ? <Video className="w-4 h-4 text-blue-500" /> : <MapPin className="w-4 h-4 text-green-500" />}
                                  <span className="text-sm text-slate-500">{session.type}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                                Completed
                              </button>
                              <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
                                View Notes
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
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
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h1 className="text-3xl font-semibold text-slate-800">Find Your Students</h1>
                    <p className="text-slate-600 mt-1">Students who match your teaching preferences</p>
                  </div>
                  <button 
                    onClick={fetchMatchingStudents}
                    disabled={isLoadingMatches}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Refresh Matches
                  </button>
                </div>

                {isLoadingMatches ? (
                  <div className="text-center py-12">
                    <LoadingSpinner />
                    <p className="text-slate-600 mt-4">Finding matching students...</p>
                  </div>
                ) : matchingStudents.length > 0 ? (
                  <MatchingResults matches={matchingStudents} type="students" />
                ) : (
                  <div className="text-center py-12">
                    <Target className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">No Students Found</h3>
                    <p className="text-slate-600 mb-6">We couldn't find any students matching your preferences right now.</p>
                    <button 
                      onClick={fetchMatchingStudents}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="h-16 bg-white border-t border-slate-200 flex items-center justify-end px-8">
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
    </div>
  );
};

export default Homes;