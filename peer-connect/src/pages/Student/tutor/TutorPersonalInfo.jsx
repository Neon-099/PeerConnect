import React from 'react';

const TutorPersonalInfo = ({ tutorProfile, userProfile }) => {
  return (
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
          <p className="text-slate-800">{tutorProfile?.campus_location === 'main_campus' ? 'Main Campus' : 'PUCU'}</p>
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
  );
};

export default TutorPersonalInfo;