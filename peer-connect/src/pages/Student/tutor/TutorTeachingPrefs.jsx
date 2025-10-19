import React from 'react';

const TutorTeachingPrefs = ({ tutorProfile }) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200">
      <h3 className="text-xl font-semibold text-slate-800 mb-4">Teaching Preferences</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Hourly Rate</label>
          <p className="text-2xl font-bold text-green-600">₱{tutorProfile?.hourly_rate || '45'}/hour</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Student Level</label>
          <p className="text-slate-800">{tutorProfile?.preferred_student_level === 'shs' ? 'Senior High School' : 'College'}</p>
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
  );
};

export default TutorTeachingPrefs;