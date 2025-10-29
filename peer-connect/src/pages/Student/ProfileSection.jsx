import React, { useState } from 'react';
import Header from './Header.jsx';
import Footer from '../Student/Footer.jsx';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';
import EditProfileModal from '../../components/EditProfileModal.jsx';
import { Edit, Shield, Key, LogOut, MapPin, GraduationCap, BookOpen, User, Mail, Award, Target, CheckCircle, Phone, Facebook } from 'lucide-react';
import { auth } from '../../utils/auth.js';
import { useNavigate } from 'react-router-dom';
import StudentPasswordChangeModal from '../../components/StudentPasswordChangeModal.jsx';

const ProfileSection = ({ userProfile, studentProfile, onProfileUpdate, getProfilePictureUrl}) => {
    const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isPasswordChangeModalOpen, setIsPasswordChangeModalOpen] = useState(false);
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
          {/* Header */}
          <div className="h-23 bg-[#E6F0F2] border-b border-gray-200 flex items-center justify-between px-8">
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
            <div className="max-w-7xl mx-auto">
              {/* Page Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-semibold text-gray-800 mb-2">My Profile</h1>
                <p className="text-gray-600">Manage your information, preferences, and account settings</p>
              </div>

              {isLoading ? (
                <LoadingSpinner />
              ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Profile Card */}
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                    {/* Teal Header - consistent with sidebar */}
                    <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-8">
                      <div className="flex flex-col items-center">
                        <div className="relative">
                          <img 
                            src={getProfilePictureUrl(studentProfile?.profile_picture)}
                            alt={userProfile?.first_name || 'Student'} 
                            className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg"
                          />
                          <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg"></div>
                        </div>
                        <h2 className="text-xl font-bold text-white mt-4 mb-1">
                          {userProfile?.first_name} {userProfile?.last_name}
                        </h2>
                        <p className="text-teal-50 text-sm">{userProfile?.email}</p>
                      </div>
                    </div>

                    {/* Profile Info */}
                    <div className="p-6 space-y-4">
                      {studentProfile?.campus_location && (
                        <div className="flex items-center gap-3 text-gray-700">
                          <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-teal-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Campus Location</p>
                            <p className="font-semibold">{studentProfile?.campus_location === 'main_campus' ? 'Main Campus' : 'PUCU'}</p>
                          </div>
                        </div>
                      )}

                      {studentProfile?.cp_number && (
                        <div className="flex items-center gap-3 text-gray-700">
                          <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                            <Phone className="w-5 h-5 text-teal-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Contact Number</p>
                            <p className="font-semibold">{studentProfile.cp_number}</p>
                          </div>
                        </div>
                      )}

                      {studentProfile?.fb_url && (
                        <div className="flex items-center gap-3 text-gray-700">
                          <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                            <Facebook className="w-5 h-5 text-teal-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Facebook Profile</p>
                            <a 
                              href={studentProfile.fb_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                            >
                              View Profile
                            </a>
                          </div>
                        </div>
                      )}
                      
                      <div className="pt-4">
                        <button 
                          onClick={() => setIsEditProfileModalOpen(true)}
                          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-teal-700 text-white rounded-xl font-semibold hover:bg-teal-800 shadow-md hover:shadow-lg transition-all"
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
                      <Shield className="w-5 h-5 text-teal-600" />
                      <h3 className="font-semibold text-gray-800">Security & Privacy</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <button onClick={() => setIsPasswordChangeModalOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 bg-teal-50 text-teal-700 rounded-xl font-medium hover:bg-teal-100 transition-colors">
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
                      <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                        <GraduationCap className="w-6 h-6 text-teal-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold text-gray-800">Academic Information</h2>
                        <p className="text-sm text-gray-600">Your current academic status</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Academic Level */}
                      {studentProfile?.academic_level && (
                        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-6 border border-teal-200">
                          <div className="flex items-start justify-between mb-2">
                            <Award className="w-6 h-6 text-teal-600" />
                            <span className="px-3 py-1 bg-teal-600 text-white text-xs font-bold rounded-full shadow-sm">
                              {studentProfile.academic_level.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-1">Academic Level</h3>
                          <p className="text-xs text-gray-600">Your current level of study</p>
                        </div>
                      )}

                      {/* Learning Style */}
                      {studentProfile?.preferred_learning_style && (
                        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-6 border border-teal-200">
                          <div className="flex items-start justify-between mb-2">
                            <Target className="w-6 h-6 text-teal-600" />
                            <span className="px-3 py-1 bg-teal-600 text-white text-xs font-bold rounded-full shadow-sm">
                              {studentProfile.preferred_learning_style.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-1">Learning Style</h3>
                          <p className="text-xs text-gray-600">How you learn best</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Subjects of Interest Card */}
                  {studentProfile?.subjects_of_interest && studentProfile.subjects_of_interest.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-teal-600" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-semibold text-gray-800">Subjects of Interest</h2>
                          <p className="text-sm text-gray-600">Topics you're passionate about learning</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {studentProfile.subjects_of_interest.map((subject, index) => (
                          <div 
                            key={index}
                            className="group relative"
                          >
                            <span className="px-6 py-3 bg-teal-50 border-2 border-teal-200 text-teal-700 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md hover:border-teal-300 transition-all flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              {subject}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bio Card */}
                  {studentProfile?.bio && (
                    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                          <User className="w-6 h-6 text-teal-600" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-semibold text-gray-800">About Me</h2>
                          <p className="text-sm text-gray-600">A little bit about yourself</p>
                        </div>
                      </div>
                      <div className="bg-teal-50 rounded-xl p-6 border-l-4 border-teal-500">
                        <p className="text-gray-700 leading-relaxed font-medium">{studentProfile.bio}</p>
                      </div>
                    </div>
                  )}

                  {/* Stats Card */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
                      <div className="flex items-center justify-between mb-2">
                        <BookOpen className="w-6 h-6" />
                        <span className="text-3xl font-bold">{studentProfile?.subjects_of_interest?.length || 0}</span>
                      </div>
                      <p className="text-teal-50 font-semibold">Subjects</p>
                      <p className="text-teal-100 text-sm">Total interests</p>
                    </div>
                    <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
                      <div className="flex items-center justify-between mb-2">
                        <CheckCircle className="w-6 h-6" />
                        <span className="text-3xl font-bold">Active</span>
                      </div>
                      <p className="text-teal-50 font-semibold">Status</p>
                      <p className="text-teal-100 text-sm">Profile complete</p>
                    </div>
                  </div>
                </div>
              </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="h-[49px] bg-[#E6F0F2] border-t border-gray-200 flex items-center justify-end px-8">
              <Footer/>
          </div>

          <EditProfileModal 
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

export default ProfileSection;