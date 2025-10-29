import React, { useEffect, useState } from 'react';
import { X, MapPin, GraduationCap, Target, BookOpen, User, Phone, Facebook, CheckCircle } from 'lucide-react';
import { apiClient } from '../../../utils/api';

const StudentProfileViewPage = ({ student, onClose }) => {
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const studentId = student?.user_id || student?.id;

  useEffect(() => {
    if (studentId) fetchDetails();
  }, [studentId]);

  const getProfilePictureUrl = (profilePicture) => {
    if (!profilePicture) return '/default-avatar.png';
    if (profilePicture.startsWith('http')) return profilePicture;
    return `${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/${profilePicture}`;
  };

  const fetchDetails = async () => {
    setIsLoading(true);
    try {
      const d = await apiClient.get(`/api/tutor/students/${studentId}`);
      setDetails(d || null);
    } catch (e) {
      console.error('Error fetching student profile data:', e);
      setDetails(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (!studentId) return null;

  const s = details || student || {};

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-4">
            <img
              src={getProfilePictureUrl(s.profile_picture)}
              alt={`${s.first_name || ''} ${s.last_name || ''}`}
              className="w-14 h-14 rounded-xl object-cover border-2 border-white"
            />
            <div>
              <h1 className="text-2xl font-semibold text-white">
                {s.first_name} {s.last_name}
              </h1>
              <p className="text-blue-100 text-sm">{s.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-700/60 rounded-lg transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading student profile...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left - Quick Info */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <div className="space-y-4">
                    {s.campus_location && (
                      <div className="flex items-center gap-3 text-gray-700">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Campus Location</p>
                          <p className="font-semibold">
                            {s.campus_location === 'main_campus' ? 'Main Campus' : 'PUCU'}
                          </p>
                        </div>
                      </div>
                    )}

                    {s.cp_number && (
                      <div className="flex items-center gap-3 text-gray-700">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Phone className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Contact Number</p>
                          <p className="font-semibold">{s.cp_number}</p>
                        </div>
                      </div>
                    )}

                    {s.fb_url && (
                      <div className="flex items-center gap-3 text-gray-700">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Facebook className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Facebook Profile</p>
                          <a
                            href={s.fb_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            View Profile
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-md">
                    <div className="flex items-center justify-between mb-1">
                      <BookOpen className="w-5 h-5" />
                      <span className="text-2xl font-bold">
                        {s.subjects_of_interest?.length || 0}
                      </span>
                    </div>
                    <p className="text-blue-50 font-semibold">Subjects</p>
                    <p className="text-blue-100 text-xs">Interests</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-md">
                    <div className="flex items-center justify-between mb-1">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-2xl font-bold">{s.profile_completed ? 'Yes' : 'No'}</span>
                    </div>
                    <p className="text-blue-50 font-semibold">Profile Complete</p>
                    <p className="text-blue-100 text-xs">{s.profile_completed_at ? 'Verified' : 'Pending'}</p>
                  </div>
                </div>
              </div>

              {/* Right - Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Academic Information */}
                <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-800">Academic Information</h2>
                      <p className="text-sm text-gray-600">Student’s academic details and learning style</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {s.academic_level && (
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                        <div className="flex items-start justify-between mb-2">
                          <User className="w-6 h-6 text-blue-600" />
                          <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-sm">
                            {s.academic_level.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-1">Academic Level</h3>
                        <p className="text-xs text-gray-600">Current level of study</p>
                      </div>
                    )}

                    {s.preferred_learning_style && (
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                        <div className="flex items-start justify-between mb-2">
                          <Target className="w-6 h-6 text-blue-600" />
                          <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-sm">
                            {s.preferred_learning_style.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-1">Learning Style</h3>
                        <p className="text-xs text-gray-600">How the student learns best</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Subjects of Interest */}
                {Array.isArray(s.subjects_of_interest) && s.subjects_of_interest.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-200">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold text-gray-800">Subjects of Interest</h2>
                        <p className="text-sm text-gray-600">Topics the student is passionate about</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {s.subjects_of_interest.map((subject, idx) => (
                        <span
                          key={idx}
                          className="px-6 py-3 bg-blue-50 border-2 border-blue-200 text-blue-700 rounded-xl text-sm font-semibold shadow-sm"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bio */}
                {s.bio && (
                  <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-200">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold text-gray-800">About</h2>
                        <p className="text-sm text-gray-600">Short bio</p>
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-6 border-l-4 border-blue-500">
                      <p className="text-gray-700 leading-relaxed font-medium">{s.bio}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentProfileViewPage;

