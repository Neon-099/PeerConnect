
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, User, Users, Search, Calendar, AlertTriangle, CheckCircle, 
    Mail, Bell, Star, Edit, TrendingUp, Shield, Key, LogOut, MessageSquare,
    ChevronUp, ChevronDown, Book, RotateCcw, DollarSign, Clock, MapPin, 
    Video, UserCheck, BarChart3, Settings, Plus, GraduationCap} from 'lucide-react';
import TutorEditProfileModal from '../../../components/TutorEditProfileModal.jsx';
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
  }, []);

  const getProfilePictureUrl = (profilePicture) => {
    if (!profilePicture) return '/default-avatar.png';
    if (profilePicture.startsWith('http')) return profilePicture;
    return `${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/${profilePicture}`;
  };

  const handleLogout = async () => {
    try {
      //SHOW CONFIRMATION DIALOG
      const confirmed = window.confirm('Are you sure you want to logout?');
      if(!confirmed) return;

      //CALL LOGOUT FUNC
      await auth.logout();

      //SHOW SUCCESS MESSAGE
      alert('Logout successfully');

      //REDIRECT TO LOGIN PAGE
      navigate('/tutor/landing');
    }
    catch (err) {
      console.log('Logout error:', err);
      alert('Logout failed please try again!');
    }
  }
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
          <div className="flex-1 flex flex-col">
            {/* Content Area */}
            <div className="flex-1 overflow-auto p-8">
              <div className="max-w-6xl mx-auto">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h1 className="text-3xl font-semibold text-slate-800">Tutor Profile</h1>
                    <p className="text-slate-600 mt-1">Manage your information and teaching preferences</p>
                  </div>
                  <button
                    onClick={() => setIsEditProfileModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </button>
                </div>

                {isLoading ? (
                  <div className='h-270 overflow-auto'>
                    <LoadingSpinner />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Overview */}
                    <div className="lg:col-span-1">
                      <div className="bg-white rounded-2xl p-6 border border-slate-200">
                        <div className="text-center">
                          <img 
                            src={getProfilePictureUrl(tutorProfile?.profile_picture)} 
                            alt={tutorProfile?.first_name || 'Tutor'} 
                            className="w-24 h-24 rounded-2xl object-cover mx-auto mb-4 border-4 border-slate-200"
                          />
                          <h2 className="text-2xl font-semibold text-slate-800">
                            {tutorProfile?.first_name || 'Sarah'} {tutorProfile?.last_name || 'Thompson'}
                          </h2>
                          <p className="text-slate-600 mb-2">Tutor</p>
                          <div className="flex items-center justify-center gap-2 mb-4">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium text-slate-700">4.9 (127 reviews)</span>
                          </div>
                          <div className="space-y-2 text-sm text-slate-600">
                            <div className="flex items-center justify-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{tutorProfile?.campus_location || 'Main Campus'}</span>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                              <GraduationCap className="w-4 h-4" />
                              <span>{tutorProfile?.highest_education || 'Bachelor\'s Degree'}</span>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{tutorProfile?.years_experience || '3'} years experience</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="bg-white rounded-2xl p-6 border border-slate-200 mt-6">
                        <h3 className="font-semibold text-slate-800 mb-4">Quick Stats</h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600">Total Sessions</span>
                            <span className="font-semibold text-slate-800">247</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600">Students Helped</span>
                            <span className="font-semibold text-slate-800">89</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600">Success Rate</span>
                            <span className="font-semibold text-green-600">96%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600">Response Time</span>
                            <span className="font-semibold text-slate-800">2.3 hrs</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Profile Details */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Personal Information */}
                      <div className="bg-white rounded-2xl p-6 border border-slate-200">
                        <h3 className="text-xl font-semibold text-slate-800 mb-4">Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                            <p className="text-slate-800">{tutorProfile?.first_name || 'Sarah'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                            <p className="text-slate-800">{tutorProfile?.last_name || 'Thompson'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                            <p className="text-slate-800">{userProfile?.email || 'sarah.thompson@email.com'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
                            <p className="text-slate-800 capitalize">{tutorProfile?.gender || 'Female'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Campus Location</label>
                            <p className="text-slate-800">{tutorProfile?.campus_location || 'Main Campus'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                            <p className="text-slate-800">{userProfile?.phone || '+1 (555) 123-4567'}</p>
                          </div>
                        </div>
                        <div className="mt-6">
                          <label className="block text-sm font-medium text-slate-700 mb-2">Bio</label>
                          <p className="text-slate-800 leading-relaxed">
                            {tutorProfile?.bio || 'Experienced tutor with a passion for helping students achieve their academic goals. Specializing in mathematics and science subjects with a patient and encouraging teaching approach.'}
                          </p>
                        </div>
                      </div>

                      {/* Academic Qualifications */}
                      <div className="bg-white rounded-2xl p-6 border border-slate-200">
                        <h3 className="text-xl font-semibold text-slate-800 mb-4">Academic Qualifications</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Highest Education</label>
                            <p className="text-slate-800">{tutorProfile?.highest_education || 'Bachelor\'s Degree in Mathematics'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Years of Experience</label>
                            <p className="text-slate-800">{tutorProfile?.years_experience || '3'} years</p>
                          </div>
                        </div>
                        <div className="mt-6">
                          <label className="block text-sm font-medium text-slate-700 mb-2">Specializations</label>
                          <div className="flex flex-wrap gap-2">
                            {(tutorProfile?.specializations || ['Mathematics', 'Physics', 'Chemistry']).map((spec, index) => (
                              <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                {spec}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Teaching Preferences */}
                      <div className="bg-white rounded-2xl p-6 border border-slate-200">
                        <h3 className="text-xl font-semibold text-slate-800 mb-4">Teaching Preferences</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Hourly Rate</label>
                            <p className="text-2xl font-bold text-green-600">${tutorProfile?.hourly_rate || '45'}/hour</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Student Level</label>
                            <p className="text-slate-800">{tutorProfile?.preferred_student_level || 'High School & College'}</p>
                          </div>
                        </div>
                        <div className="mt-6">
                          <label className="block text-sm font-medium text-slate-700 mb-2">Teaching Styles</label>
                          <div className="flex flex-wrap gap-2">
                            {(tutorProfile?.teaching_styles || ['Visual Learning', 'Interactive', 'Step-by-step']).map((style, index) => (
                              <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                {style}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Availability */}
                      <div className="bg-white rounded-2xl p-6 border border-slate-200">
                        <h3 className="text-xl font-semibold text-slate-800 mb-4">Availability</h3>
                        <div className="grid grid-cols-7 gap-2">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                            <div key={day} className="text-center">
                              <div className={`p-3 rounded-xl border ${
                                index < 5 
                                  ? 'bg-green-50 border-green-200 text-green-700' 
                                  : 'bg-slate-50 border-slate-200 text-slate-500'
                              }`}>
                                <p className="text-sm font-medium">{day}</p>
                                <p className="text-xs mt-1">
                                  {index < 5 ? '9AM-6PM' : 'Limited'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4">
                          <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors">
                            <Calendar className="w-4 h-4" />
                            Update Availability
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="h-16 bg-white border-t border-slate-200 flex items-center justify-end px-8">
              <Footer />
            </div>
          </div>
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
              </div>

              {/* Filters Section */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 mb-8">
                <h3 className="font-semibold text-slate-800 mb-4">Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Search by student or subject</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                    <select className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option>All statuses</option>
                      <option>Confirmed</option>
                      <option>Pending</option>
                      <option>Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Date Range</label>
                    <select className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option>This week</option>
                      <option>Next week</option>
                      <option>This month</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                    <select className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option>All subjects</option>
                      <option>Mathematics</option>
                      <option>Science</option>
                      <option>English</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                    <Search className="w-4 h-4" />
                    Apply Filters
                  </button>
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

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
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
                      <p className="text-2xl font-bold text-slate-800">$480</p>
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
                      <p className="text-2xl font-bold text-slate-800">4.9</p>
                      <p className="text-sm text-slate-600">Average rating</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

            {/* Footer */}
            <div className="h-16 bg-white border-t border-slate-200 flex items-center justify-end px-8">
              <Footer />
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