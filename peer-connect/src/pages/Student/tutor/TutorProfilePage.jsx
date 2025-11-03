import React, { useState } from 'react';
import { Edit, Shield, Key, LogOut, MapPin, GraduationCap, BookOpen, User, Mail, Award, Target, CheckCircle, Phone, Facebook, DollarSign, Clock, Star } from 'lucide-react';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import TutorEditProfileModal from '../../../components/TutorEditProfileModal';
import StudentPasswordChangeModal from '../../../components/StudentPasswordChangeModal';
import Header from './Header.jsx';
import Footer from '../../Student/Footer.jsx';
import { auth } from '../../../utils/auth';
import { useNavigate } from 'react-router-dom';

const TutorProfilePage = ({ tutorProfile, userProfile, getProfilePictureUrl, onProfileUpdate }) => {
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isPasswordChangeModalOpen, setIsPasswordChangeModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const confirmed = window.confirm('Are you sure you want to logout?');
      if(!confirmed) return;

      await auth.logout();

      alert('Logout successfully');

      navigate('/');
    }
    catch (err) {
      console.log('Logout error:', err);
      alert('Logout failed please try again!');
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Content Area */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-800 mb-2">My Tutor Profile</h1>
            <p className="text-gray-600">Manage your information, qualifications, and teaching preferences</p>
          </div>

          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Profile Card */}
              <div className="lg:col-span-1 space-y-6">
                {/* Profile Card */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                  {/* Blue Header - consistent with tutor theme */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <img 
                          src={getProfilePictureUrl(tutorProfile?.profile_picture)}
                          alt={userProfile?.first_name || 'Tutor'} 
                          className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                        <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg"></div>
                      </div>
                      <h2 className="text-xl font-bold text-white mt-4 mb-1">
                        {userProfile?.first_name} {userProfile?.last_name}
                      </h2>
                      <p className="text-blue-50 text-sm">{userProfile?.email}</p>
                      {tutorProfile?.average_rating && (
                        <div className="flex items-center gap-1 mt-2">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-white font-semibold">{tutorProfile.average_rating}</span>
                          <span className="text-blue-100 text-xs">({tutorProfile.total_sessions || 0} reviews)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="p-6 space-y-4">
                    {tutorProfile?.campus_location && (
                      <div className="flex items-center gap-3 text-gray-700">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Campus Location</p>
                          <p className="font-semibold">{tutorProfile?.campus_location === 'main_campus' ? 'Main Campus' : 'PUCU'}</p>
                        </div>
                      </div>
                    )}

                    {tutorProfile?.cp_number && (
                      <div className="flex items-center gap-3 text-gray-700">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Phone className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Contact Number</p>
                          <p className="font-semibold">{tutorProfile.cp_number}</p>
                        </div>
                      </div>
                    )}

                    {tutorProfile?.fb_url && (
                      <div className="flex items-center gap-3 text-gray-700">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Facebook className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Facebook Profile</p>
                          <a 
                            href={tutorProfile.fb_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            View Profile
                          </a>
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-4">
            <button
              onClick={() => setIsEditProfileModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-700 text-white rounded-xl font-semibold hover:bg-blue-800 shadow-md hover:shadow-lg transition-all"
            >
                        <Edit className="w-5 h-5" />
              Edit Profile
            </button>
          </div>
                  </div>
                </div>

                {/* Security Section */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-800">Security & Privacy</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <button onClick={() => setIsPasswordChangeModalOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl font-medium hover:bg-blue-100 transition-colors">
                      <Key className="w-5 h-5" />
                      Change Password
                    </button>
                    
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 text-red-700 rounded-xl font-medium hover:bg-red-100 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      Logout
                    </button>
                  </div>
                </div>
            </div>

              {/* Right Column - Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Academic Information Card */}
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-800">Academic Qualifications</h2>
                      <p className="text-sm text-gray-600">Your education and experience</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Highest Education */}
                    {tutorProfile?.highest_education && (
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                        <div className="flex items-start justify-between mb-2">
                          <Award className="w-6 h-6 text-blue-600" />
                          <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-sm">
                            {tutorProfile.highest_education.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-1">Highest Education</h3>
                        <p className="text-xs text-gray-600">Your educational background</p>
                      </div>
                    )}

                    {/* Years of Experience */}
                    {tutorProfile?.years_experience !== undefined && (
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                        <div className="flex items-start justify-between mb-2">
                          <Clock className="w-6 h-6 text-blue-600" />
                          <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-sm">
                            {tutorProfile.years_experience} {tutorProfile.years_experience === 1 ? 'Year' : 'Years'}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-1">Experience</h3>
                        <p className="text-xs text-gray-600">Years of teaching experience</p>
                      </div>
                    )}
                  </div>

                  {/* Specializations */}
                  {tutorProfile?.specializations && tutorProfile.specializations.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Specializations</h3>
                      <div className="flex flex-wrap gap-3">
                        {tutorProfile.specializations.map((spec, index) => (
                          <span 
                            key={index}
                            className="px-6 py-3 bg-blue-50 border-2 border-blue-200 text-blue-700 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Teaching Preferences Card */}
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Target className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-800">Teaching Preferences</h2>
                      <p className="text-sm text-gray-600">Your teaching style and rates</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Hourly Rate */}
                    {tutorProfile?.hourly_rate && (
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                        <div className="flex items-start justify-between mb-2">
                          <DollarSign className="w-6 h-6 text-blue-600" />
                          <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-sm">
                            ₱{tutorProfile.hourly_rate}/hour
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-1">Hourly Rate</h3>
                        <p className="text-xs text-gray-600">Your tutoring rate</p>
                      </div>
                    )}

                    {/* Preferred Student Level */}
                    {tutorProfile?.preferred_student_level && (
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                        <div className="flex items-start justify-between mb-2">
                          <User className="w-6 h-6 text-blue-600" />
                          <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-sm">
                            {tutorProfile.preferred_student_level === 'shs' ? 'SHS' : 'College'}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-1">Student Level</h3>
                        <p className="text-xs text-gray-600">Preferred teaching level</p>
                      </div>
                    )}
                  </div>

                  {/* Teaching Styles */}
                  {tutorProfile?.teaching_styles && tutorProfile.teaching_styles.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Teaching Styles</h3>
                      <div className="flex flex-wrap gap-3">
                        {tutorProfile.teaching_styles.map((style, index) => (
                          <span 
                            key={index}
                            className="px-6 py-3 bg-blue-50 border-2 border-blue-200 text-blue-700 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {style.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bio Card */}
                {tutorProfile?.bio && (
                  <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold text-gray-800">About Me</h2>
                        <p className="text-sm text-gray-600">A little bit about yourself and teaching approach</p>
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-6 border-l-4 border-blue-500">
                      <p className="text-gray-700 leading-relaxed font-medium">{tutorProfile.bio}</p>
                    </div>
                  </div>
                )}

                {/* Stats Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Star className="w-6 h-6" />
                      <span className="text-3xl font-bold">{tutorProfile?.average_rating || '0.0'}</span>
                    </div>
                    <p className="text-blue-50 font-semibold">Average Rating</p>
                    <p className="text-blue-100 text-sm">Based on reviews</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <CheckCircle className="w-6 h-6" />
                      <span className="text-3xl font-bold">{tutorProfile?.total_sessions || 0}</span>
                    </div>
                    <p className="text-blue-50 font-semibold">Total Sessions</p>
                    <p className="text-blue-100 text-sm">Completed sessions</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
        <TutorEditProfileModal
          isOpen={isEditProfileModalOpen}
          onClose={() => setIsEditProfileModalOpen(false)}
          onProfileUpdate={onProfileUpdate}
        />
        <StudentPasswordChangeModal 
          isOpen={isPasswordChangeModalOpen} 
          onClose={() => setIsPasswordChangeModalOpen(false)} 
        />
    </div>
  );
};

export default TutorProfilePage;