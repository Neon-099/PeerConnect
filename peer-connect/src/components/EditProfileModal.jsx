import React, { useState } from 'react';
import { X, Upload, Trash2, Calendar, MessageSquare, Key, LogOut, ArrowLeft } from 'lucide-react';

const EditProfileModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    fullName: 'Alex Johnson',
    email: 'alex.johnson@university.edu',
    major: 'Computer Science',
    graduationYear: '2026',
    bio: 'Passionate about peer learning and tutoring for algorithms and math foundations.',
    subjects: ['Calculus', 'Physics', 'Algorithms']
  });

  const [newSubject, setNewSubject] = useState('');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.major.trim()) {
      newErrors.major = 'Major is required';
    }
    
    if (!formData.graduationYear.trim()) {
      newErrors.graduationYear = 'Graduation year is required';
    } else if (!/^\d{4}$/.test(formData.graduationYear)) {
      newErrors.graduationYear = 'Graduation year must be 4 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleAddSubject = () => {
    if (newSubject.trim() && !formData.subjects.includes(newSubject.trim())) {
      setFormData(prev => ({
        ...prev,
        subjects: [...prev.subjects, newSubject.trim()]
      }));
      setNewSubject('');
    }
  };

  const handleRemoveSubject = (subjectToRemove) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter(subject => subject !== subjectToRemove)
    }));
  };

  const handleSave = () => {
    if (validateForm()) {
      // TODO: Implement actual save functionality with API call
      console.log('Saving profile:', formData);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-800">Edit Profile</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Profile */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-800">Profile</h2>
              
              {/* Profile Picture */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" 
                    alt="Profile" 
                    className="w-20 h-20 rounded-full object-cover"
                  />
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 border border-teal-200 text-teal-700 rounded-lg hover:bg-teal-50 transition-colors">
                    <Upload className="w-4 h-4" />
                    Upload
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 border border-teal-200 text-teal-700 rounded-lg hover:bg-teal-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    errors.fullName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Major & Graduation Year */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Major</label>
                  <input
                    type="text"
                    value={formData.major}
                    onChange={(e) => handleInputChange('major', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      errors.major ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.major && (
                    <p className="mt-1 text-sm text-red-600">{errors.major}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Graduation Year</label>
                  <input
                    type="text"
                    value={formData.graduationYear}
                    onChange={(e) => handleInputChange('graduationYear', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      errors.graduationYear ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.graduationYear && (
                    <p className="mt-1 text-sm text-red-600">{errors.graduationYear}</p>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  className="px-6 py-3 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-teal-200 text-teal-700 rounded-lg hover:bg-teal-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Right Column - Preferences & Security */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-800">Preferences & Security</h2>
              
              {/* Subjects of Interest */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Subjects of Interest</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.subjects.map((subject, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-sm font-medium flex items-center gap-2"
                    >
                      {subject}
                      <button
                        onClick={() => handleRemoveSubject(subject)}
                        className="text-teal-500 hover:text-teal-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="Add subject"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSubject()}
                  />
                  <button
                    onClick={handleAddSubject}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    + Add subject
                  </button>
                </div>
              </div>

              {/* Upcoming Sessions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Upcoming Sessions</label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <h4 className="font-medium text-gray-800">Calculus with Emma</h4>
                        <p className="text-sm text-gray-600">Sep 12, 4:00 PM • Room B203 • 60 min</p>
                      </div>
                    </div>
                    <button className="px-3 py-1 bg-teal-50 text-teal-700 rounded-lg text-sm hover:bg-teal-100 transition-colors">
                      Reschedule
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <h4 className="font-medium text-gray-800">Physics with Liam</h4>
                        <p className="text-sm text-gray-600">Sep 15, 10:00 AM • Library 2F • 45 min</p>
                      </div>
                    </div>
                    <button className="px-3 py-1 bg-teal-50 text-teal-700 rounded-lg text-sm hover:bg-teal-100 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>

              {/* Past Sessions & Feedback */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Past Sessions & Feedback</label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-gray-400" />
                      <div>
                        <h4 className="font-medium text-gray-800">Emma Wilson • Calculus</h4>
                        <p className="text-sm text-gray-600">"Clear explanations and great examples."</p>
                      </div>
                    </div>
                    <button className="px-3 py-1 bg-teal-50 text-teal-700 rounded-lg text-sm hover:bg-teal-100 transition-colors">
                      View
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-gray-400" />
                      <div>
                        <h4 className="font-medium text-gray-800">Liam Chen • Physics</h4>
                        <p className="text-sm text-gray-600">"Helpful strategies before the quiz."</p>
                      </div>
                    </div>
                    <button className="px-3 py-1 bg-teal-50 text-teal-700 rounded-lg text-sm hover:bg-teal-100 transition-colors">
                      View
                    </button>
                  </div>
                </div>
              </div>

              {/* Security */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Security</label>
                <div className="space-y-3">
                  <button className="w-full flex items-center gap-3 px-4 py-3 border border-teal-200 text-teal-700 rounded-lg hover:bg-teal-50 transition-colors">
                    <Key className="w-5 h-5" />
                    Change Password
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                    <LogOut className="w-5 h-5" />
                    Log Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
