import React, { useState, useEffect } from 'react';
import { Edit } from 'lucide-react';
import { apiClient } from '../../../utils/api';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import TutorEditProfileModal from '../../../components/TutorEditProfileModal';
import TutorProfileOverview from './TutorProfileOverview';
import TutorPersonalInfo from './TutorPersonalInfo';
import TutorAcademicInfo from './TutorAcademicInfo';
import TutorTeachingPrefs from './TutorTeachingPrefs';

const TutorProfilePage = ({ tutorProfile, userProfile, getProfilePictureUrl, onProfileUpdate }) => {
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">
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
              <TutorProfileOverview 
                tutorProfile={tutorProfile}
                userProfile={userProfile}
                getProfilePictureUrl={getProfilePictureUrl}
              />

              {/* Profile Details */}
              <div className="lg:col-span-2 space-y-6">
                <TutorPersonalInfo 
                  tutorProfile={tutorProfile}
                  userProfile={userProfile}
                />
                <TutorAcademicInfo tutorProfile={tutorProfile} />
                <TutorTeachingPrefs tutorProfile={tutorProfile} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditProfileModalOpen && (
        <TutorEditProfileModal
          isOpen={isEditProfileModalOpen}
          onClose={() => setIsEditProfileModalOpen(false)}
          onProfileUpdate={onProfileUpdate}
        />
      )}
    </div>
  );
};

export default TutorProfilePage;