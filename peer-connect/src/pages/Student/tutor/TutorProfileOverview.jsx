import React from 'react';
import { Star, MapPin, GraduationCap, Clock, DollarSign, Award } from 'lucide-react';

const TutorProfileOverview = ({ tutorProfile, userProfile, getProfilePictureUrl }) => {
  return (
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
            <span className="text-sm font-medium text-slate-700">
              {tutorProfile?.average_rating || '4.9'} ({tutorProfile?.total_sessions || '127'} reviews)
            </span>
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex items-center justify-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{tutorProfile?.campus_location === 'main_campus' ? 'Main Campus' : 'PUCU'}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <GraduationCap className="w-4 h-4" />
              <span>{tutorProfile?.highest_education || 'Bachelor\'s Degree'}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{tutorProfile?.years_experience || '3'} years experience</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>₱{tutorProfile?.hourly_rate || '45'}/hour</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorProfileOverview;