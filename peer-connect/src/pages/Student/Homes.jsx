import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, User, Users, Search, Calendar, AlertTriangle, CheckCircle, 
    Mail, Bell, Star, Edit, TrendingUp, Shield, Key, LogOut, MessageSquare,
    ChevronUp, ChevronDown, Book, RotateCcw} from 'lucide-react';
import EditProfileModal from '../../components/EditProfileModal';
import { auth } from '../../utils/auth';
import {apiClient} from '../../utils/api';

const Homes = () =>  {
  const [activeTab, setActiveTab] = useState('home');
  const [isProfile, setIsProfile] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [sessions, setSessions] = useState([]);
  const [filterTab, setFilterTab] = useState('all');
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('My Sessions');
  const [selectedTutor, setSelectedTutor] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const [userProfile, setUserProfile] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  //PROFILE DATA
  useEffect(() => {
    const fetchProfileData = async() => {
        try {
          setIsLoading(true);

          //FETCH USER PROFILE
          const userResponse = await apiClient.get('/api/user/profile');
          setUserProfile(userResponse);

          //FETCH STUDENT DATA
          const studentData = await apiClient.get('/api/student/profile');
          setStudentProfile(studentData);

        }
        catch (error) {
          console.error(`Error fetching profile data:`, error);
        }
        finally {
          setIsLoading(false);
        }
    }
    fetchProfileData();
  }, []);

  const navigate = useNavigate();

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
      navigate('/');
    }
    catch (err) {
      console.log('Logout error:', err);
      alert('Logout failed please try again!');
    }
  }

  const upcomingSessions = [
    {
      id: 1,
      subject: 'Calculus',
      tutor: 'Emma',
      date: 'Sep 12, 4:00 PM',
      location: 'Room B203',
      duration: '60 min',
      type: 'In-person',
      status: 'Confirmed'
    },
    {
      id: 2,
      subject: 'Physics',
      tutor: 'Liam',
      date: 'Sep 15, 10:00 AM',
      location: 'Library 2F',
      duration: '45 min',
      type: 'In-person',
      status: 'Confirmed'
    },
    {
      id: 3,
      subject: 'Algorithms',
      tutor: 'Noah',
      date: 'Sep 20, 2:30 PM',
      location: 'Zoom',
      duration: '50 min',
      type: 'Virtual',
      status: 'Pending'
    }
  ];

  const subjectsOfInterest = [
    'Calculus',
    'Physics',
    'Organic Chemistry',
    'Computer Science'
  ];

  const pastSessions = [
    {
      id: 1,
      title: 'Chemistry with Sophia Park',
      feedback: '"Explained mechanisms clearly. Great pacing."',
      date: 'Aug 21'
    },
    {
      id: 2,
      title: 'CS with Noah Patel',
      feedback: '"Helpful debugging tips. Very responsive."',
      date: 'Aug 12'
    }
  ];

 
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

  const earlierNotifications = [
    {
      id: 6,
      type: 'session',
      icon: 'calendar',
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
      title: 'Session rescheduled: Chemistry with Sophia Park',
      subtitle: 'Aug 21 • 3:14 PM',
      action: 'See changes',
      actionColor: 'bg-teal-50 text-teal-700'
    },
    {
      id: 7,
      type: 'rating',
      icon: 'star',
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
      title: 'Tutor rated: Emma Wilson',
      subtitle: 'You rated 5 stars • Aug 12',
      action: 'View review',
      actionColor: 'bg-teal-50 text-teal-700'
    }
  ];

  const renderIcon = (iconType, iconBg, iconColor) => {
    const iconClass = "w-5 h-5";
    const containerClass = `w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`;
    
    switch(iconType) {
      case 'calendar':
        return (
          <div className={containerClass}>
            <Calendar className={`${iconClass} ${iconColor}`} />
          </div>
        );
      case 'message':
        return (
          <div className={containerClass}>
            <MessageSquare className={`${iconClass} ${iconColor}`} />
          </div>
        );
      case 'alert':
        return (
          <div className={containerClass}>
            <AlertTriangle className={`${iconClass} ${iconColor}`} />
          </div>
        );
      case 'check':
        return (
          <div className={containerClass}>
            <CheckCircle className={`${iconClass} ${iconColor}`} />
          </div>
        );
      case 'key':
        return (
          <div className={containerClass}>
            <Key className={`${iconClass} ${iconColor}`} />
          </div>
        );
      case 'star':
        return (
          <div className={containerClass}>
            <Star className={`${iconClass} ${iconColor}`} />
          </div>
        );
      default:
        return null;
    }
  };  

   const yourReviews = [
    {
      id: 1,
      tutor: 'Emma Wilson',
      subject: 'Calculus',
      review: '"Clear explanations and great examples."',
      date: 'Yesterday',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
    },
    {
      id: 2,
      tutor: 'Liam Chen',
      subject: 'Physics',
      review: '"Helpful strategies before the quiz."',
      date: 'Aug 24',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
    }
  ];

  const reviewsAboutYou = [
    {
      id: 1,
      tutor: 'Sophia Park',
      subject: 'Chemistry',
      review: '"Peer study with you was efficient and focused."',
      date: 'Aug 15',
      rating: 4,
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop'
    },
    {
      id: 2,
      tutor: 'Noah Patel',
      subject: 'CS',
      review: '"Collaborating on recursion problems was fun!"',
      date: 'Aug 02',
      rating: 3,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop'
    }
  ];

  const renderStars = (count, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={interactive ? 'cursor-pointer' : 'cursor-default'}
            disabled={!interactive}
          >
            <Star
              className={`w-5 h-5 ${
                star <= (interactive ? (hoverRating || rating) : count)
                  ? 'fill-gray-300 text-gray-300'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50" style={{ minWidth: '1400px' }}>
      {/* Sidebar */}
      <div className="w-60 bg-white border-r border-gray-200 flex flex-col">
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

          <button 
            onClick={() => setActiveTab('review')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${
              activeTab === 'review' 
                ? 'bg-teal-700 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Star className="w-5 h-5" />
            <span className="font-medium">Reviews</span>
          </button>
        </nav>

        {/* Footer */}
        <div className="p-4 text-xs text-gray-500 border-t border-gray-200">
          © 2025 PeerConnect
        </div>
      </div>

      {/* Profile Section */}
      {activeTab === 'profile' && (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
            <div></div>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-teal-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Bell className="w-5 h-5 text-teal-600" />
              </button>
              <img 
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" 
                alt="Profile" 
                className="w-10 h-10 rounded-lg object-cover"
              />
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-8">
            <div className="max-w-6xl mx-auto">
              {/* Page Header */}
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-semibold text-gray-800">Student Profile</h1>
                <p className="text-sm text-gray-500">Manage your information and upcoming sessions</p>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
                </div>
              ) : (

              

              <div className="flex gap-30">
                {/* Left Column - Profile Card */}
                <div className="w-96 ml-[-140px]">
                  <div className="bg-white rounded-xl p-8 border border-gray-200">
                    <div className="flex flex-col items-center mb-6">
                      <img 
                        src={userProfile?.profile_picture  || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop"} 
                        alt={userProfile?.first_name || 'Student'} 
                        className="w-24 h-24 rounded-full object-cover mb-4"
                      />
                      <h2 className="text-xl font-semibold text-gray-800 mb-1">
                         {userProfile?.first_name} {userProfile?.last_name}
                      </h2>
                      <p className="text-sm text-gray-600">{userProfile?.email}</p>
                      {studentProfile?.school && (
                        <p className="text-sm text-gray-600">{studentProfile?.school}</p>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => setIsEditProfileModalOpen(true)}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-teal-700 text-white rounded-lg font-medium hover:bg-teal-800"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Profile
                    </button>
                  </div>

                  {/* Security Section */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200 mt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Shield className="w-5 h-5 text-gray-400" />
                      <p className="text-sm text-gray-600">Keep your account secure and up to date</p>
                    </div>
                    
                    <div className="space-y-3">
                      <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-50 text-teal-700 rounded-lg font-medium hover:bg-teal-100">
                        <Key className="w-4 h-4" />
                        Change Password
                      </button>
                      
                      <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600"
                        onClick={handleLogout}>
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column - Details */}
                  <div className="flex-1">
                    <div className="bg-white rounded-xl p-8 border border-gray-200">
                      <h2 className="text-xl font-semibold text-gray-800 mb-6">Details</h2>
                    
                    {/* Academic Level */}
                    {studentProfile?.academic_level && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Academic Level</h3>
                        <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                          {studentProfile.academic_level.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    )}

                    {/* Learning Style */}
                    {studentProfile?.preferred_learning_style && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Preferred Learning Style</h3>
                        <span className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
                          {studentProfile.preferred_learning_style.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    )}

                    {/* Bio */}
                    {studentProfile?.bio && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Bio</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{studentProfile.bio}</p>
                      </div>
                    )}

                    {/* Subjects of Interest */}
                    {studentProfile?.subjects_of_interest && studentProfile.subjects_of_interest.length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Subjects of Interest</h3>
                        <div className="flex flex-wrap gap-2">
                          {studentProfile.subjects_of_interest.map((subject, index) => (
                            <span 
                              key={index}
                              className="px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-sm font-medium"
                            >
                              {subject}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upcoming Tutoring Sessions */}
                    <div className="mb-8">
                      <h3 className="text-sm font-semibold text-gray-700 mb-4">Upcoming tutoring sessions</h3>
                      <div className="space-y-3">
                        {upcomingSessions.map((session) => (
                          <div key={session.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Calendar className="w-5 h-5 text-gray-400" />
                              <div>
                                <h4 className="font-semibold text-gray-800">{session.title}</h4>
                                <p className="text-sm text-gray-600">{session.date}</p>
                              </div>
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                              session.status === 'Confirmed' 
                                ? 'bg-green-600 text-white' 
                                : 'bg-orange-500 text-white'
                            }`}>
                              {session.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Past Sessions & Feedback */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-4">Past sessions & feedback</h3>
                      <div className="space-y-3">
                        {pastSessions.map((session) => (
                          <div key={session.id} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-start gap-3 flex-1">
                              <Star className="w-5 h-5 text-gray-400 mt-0.5" />
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-1">{session.title}</h4>
                                <p className="text-sm text-gray-600">{session.feedback}</p>
                              </div>
                            </div>
                            <span className="text-sm text-gray-500 whitespace-nowrap ml-4">{session.date}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              )}
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
      )}

      {/* Home Section */}
      {activeTab === 'home' && (
        
        <div className="flex-1 flex flex-col overflow-auto">
          {/* Header */}
          <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
            <div></div>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-teal-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Bell className="w-5 h-5 text-teal-600" />
              </button>
              <img 
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" 
                alt="Profile" 
                className="w-10 h-10 rounded-lg object-cover"
              />
            </div>
          </div>

            <div className="flex gap-25" style={{ maxWidth: '1400px', margin: '0 auto' }}>
              {/* Left Column */}
              <div className="flex-1 ">
                {/* Welcome Header */}
                <div className="flex items-center justify-between my-6 ">
                  <h1 className="text-2xl font-semibold text-gray-800">Welcome back, Alex</h1>
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
              <div className="w-80 my-29">
                {/* Progress Card
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
                </div> */}

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
        </div>
      )}

      {/* Session Section*/}
      {activeTab === 'session' && (
        <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-end gap-4">
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg relative">
            <Bell className="w-6 h-6 text-gray-600" />
          </button>
          <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-orange-400 rounded-full"></div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl">
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

          {/* Footer */}
          <footer className="mt-12 pt-6 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
            <span>© 2025 PeerConnect</span>
            <div className="flex gap-6">
              <a href="#" className="hover:text-teal-600">Help Center</a>
              <a href="#" className="hover:text-teal-600">Contact</a>
              <a href="#" className="hover:text-teal-600">Privacy Policy</a>
            </div>
          </footer>
        </div>
      </div>
      )}

      {/* Notification Section */}
      {activeTab === 'notification' && (
         <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <div></div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-teal-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5 text-teal-600" />
            </button>
            <img 
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" 
              alt="Profile" 
              className="w-10 h-10 rounded-lg object-cover"
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
          <div className="flex gap-6 text-sm text-gray-600">
            <a href="#" className="hover:text-gray-800">Help Center</a>
            <a href="#" className="hover:text-gray-800">Contact</a>
            <a href="#" className="hover:text-gray-800">Privacy Policy</a>
          </div>
        </div>
      </div>
      )}

      {/* Reviews Section*/}
      {activeTab === 'review' && (
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <div></div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-teal-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5 text-teal-600" />
            </button>
            <img 
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" 
              alt="Profile" 
              className="w-10 h-10 rounded-lg object-cover"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-semibold text-gray-800">Reviews</h1>
              
              {/* Filter Tabs */}
              <div className="flex gap-2">
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
                  onClick={() => setFilterTab('given')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    filterTab === 'given' 
                      ? 'bg-teal-700 text-white' 
                      : 'bg-white text-teal-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Given
                </button>
                <button 
                  onClick={() => setFilterTab('received')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    filterTab === 'received' 
                      ? 'bg-teal-700 text-white' 
                      : 'bg-white text-teal-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Received
                </button>
              </div>
            </div>

            <div className="flex gap-6">
              {/* Left Column - Your Recent Reviews */}
              <div className="flex-1">
                <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Recent Reviews</h2>
                  
                  <div className="space-y-4">
                    {yourReviews.map((review) => (
                      <div key={review.id} className="flex items-start justify-between pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                        <div className="flex items-start gap-3 flex-1">
                          <img 
                            src={review.avatar} 
                            alt={review.tutor}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-800">{review.tutor}</h3>
                              <span className="text-gray-400">•</span>
                              <span className="text-sm text-gray-600">{review.subject}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{review.review}</p>
                            <p className="text-xs text-gray-500">• {review.date}</p>
                          </div>
                        </div>
                        <button className="text-sm text-teal-700 font-medium hover:text-teal-800 ml-4">
                          Edit
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reviews About You */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Reviews About You</h2>
                  
                  <div className="space-y-4">
                    {reviewsAboutYou.map((review) => (
                      <div key={review.id} className="flex items-start justify-between pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                        <div className="flex items-start gap-3 flex-1">
                          <img 
                            src={review.avatar} 
                            alt={review.tutor}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-800">{review.tutor}</h3>
                              <span className="text-gray-400">•</span>
                              <span className="text-sm text-gray-600">{review.subject}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{review.review}</p>
                            <p className="text-xs text-gray-500">• {review.date}</p>
                          </div>
                        </div>
                        <div className="ml-4">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Write a Review */}
              <div className="w-96">
                <div className="bg-white rounded-xl p-6 border border-gray-200 sticky top-8">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Write a Review</h2>
                  
                  <div className="mb-4">
                    <div className="relative">
                      <select
                        value={selectedTutor}
                        onChange={(e) => setSelectedTutor(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-teal-600 text-gray-600 bg-white"
                      >
                        <option value="">Select tutor</option>
                        <option value="emma">Emma Wilson</option>
                        <option value="liam">Liam Chen</option>
                        <option value="sophia">Sophia Park</option>
                        <option value="noah">Noah Patel</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                    {renderStars(rating, true)}
                  </div>

                  <div className="mb-6">
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Share your feedback..."
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button className="flex-1 px-4 py-3 bg-teal-700 text-white rounded-lg font-medium hover:bg-teal-800">
                      Submit Review
                    </button>
                    <button className="flex-1 px-4 py-3 bg-white text-teal-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50">
                      Save Draft
                    </button>
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
      )}  

      
      {/* Edit Profile Modal */}
      <EditProfileModal 
        isOpen={isEditProfileModalOpen} 
        onClose={() => setIsEditProfileModalOpen(false)} 
      />
    </div>
  );
}

export default Homes;