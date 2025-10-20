import React, { useState } from 'react';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';
import EditProfileModal from '../../components/EditProfileModal.jsx';
import { Edit, Shield, Key, LogOut, MapPin } from 'lucide-react';
import { auth } from '../../utils/auth.js';
import { useNavigate } from 'react-router-dom';

const ProfileSection = ({ userProfile, studentProfile, onProfileUpdate, getProfilePictureUrl}) => {
    const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

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
            <div className="max-w-6xl mx-auto">
              {/* Page Header */}
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-semibold text-gray-800">Student Profile</h1>
                <p className="text-sm text-gray-500">Manage your information and upcoming sessions</p>
              </div>

              {isLoading ? (
                <LoadingSpinner />
              ) : (
              <div className="flex gap-30">
                {/* Left Column - Profile Card */}
                <div className="w-96 ml-[-140px]">
                  <div className="bg-white rounded-xl p-8 border border-gray-200">
                    <div className="flex flex-col items-center mb-6">
                      <img 
                        src={getProfilePictureUrl(studentProfile?.profile_picture)}
                        alt={userProfile?.first_name || 'Student'} 
                        className="w-24 h-24 rounded-full object-cover mb-4"
                      />
                      <h2 className="text-xl font-semibold text-gray-800 mb-1">
                         {userProfile?.first_name} {userProfile?.last_name}
                      </h2>
                      <p className="text-sm text-gray-600">{userProfile?.email}</p>
                      {studentProfile?.campus_location && (   
                        <p className="text-sm text-gray-600 flex">{studentProfile?.campus_location === 'main_campus' ? 'Main Campus' : 'PUCU'} <MapPin className="w-4 h-4 text-gray-400" /></p>
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

                    {/* Subjects of Interest */}
                    {studentProfile?.subjects_of_interest && studentProfile.subjects_of_interest.length > 0 && (
                      <div className="mb-6">
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

                    {/* Bio */}
                    {studentProfile?.bio && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Bio</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{studentProfile.bio}</p>
                      </div>
                    )}                    
                  </div>
                </div>
              </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="h-[49px] bg-white border-t border-gray-200 flex items-center justify-end px-8">
              <Footer/>
          </div>

          <EditProfileModal 
                isOpen={isEditProfileModalOpen} 
                onClose={() => setIsEditProfileModalOpen(false)} 
                onProfileUpdate={onProfileUpdate}
            />
        </div>
  );
};

export default ProfileSection;