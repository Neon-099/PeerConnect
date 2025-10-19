

import React from 'react';

const TutorAcademicInfo = ({ tutorProfile }) => {
  return (
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
  );
};

export default TutorAcademicInfo;