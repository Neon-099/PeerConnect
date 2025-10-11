import React, { useEffect, useState } from 'react';
import { X, Upload, Trash2, Calendar, MessageSquare, Key, LogOut, ArrowLeft } from 'lucide-react';
import {apiClient } from './../utils/api';


const EditProfileModal = ({ isOpen, onClose, onProfileUpdate }) => {
const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    school: '',
    preferred_learning_style: '',
    academic_level: '',
    bio: '',
    subjects_of_interest: []
  });

  const [newSubject, setNewSubject] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState('');

  const learningStyles = [
    { label: 'Visual Learner', value: 'visual' },
    { label: 'Auditory Learner', value: 'auditory' },
    { label: 'Kinesthetic Learner', value: 'kinesthetic' },
    { label: 'Reading/Writing Learner', value: 'reading_writing' },
    { label: 'Mixed Learning Style', value: 'mixed' }
  ];
  const academicLevels = [
    { label: 'High School', value: 'high_school' },
    { label: 'Undergraduate (Freshman)', value: 'undergraduate_freshman' },
    { label: 'Undergraduate (Sophomore)', value: 'undergraduate_sophomore' },
    { label: 'Undergraduate (Junior)', value: 'undergraduate_junior' },
    { label: 'Undergraduate (Senior)', value: 'undergraduate_senior' },
    { label: 'Graduate Student', value: 'graduate' },
  ];

  //PROFILE DATA
  useEffect(() => {
    if(isOpen) {
      fetchProfileData();
    }
  }, [isOpen]);

  const fetchProfileData = async() => {
      try {
        setLoading(true);
        const profileData = await apiClient.get('/api/student/profile');
        setFormData({
          firstName: profileData.first_name || '', 
          lastName: profileData.last_name || '',
          email: profileData.email || '',
          school: profileData.school || '',
          preferred_learning_style: profileData.preferred_learning_style || '',
          academic_level: profileData.academic_level || '',
          bio: profileData.bio || '',
          subjects_of_interest: profileData.subject_of_interest || []
        });

        //PROFILE PICTURE PREVIEW
        if(profileData.profile_picture) {
          setProfilePicture(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/${profileData.profile_picture}`);
        }
      }
      catch (error) {
        console.error(`Error fetching profile data: `, error);
        // Set default values if profile doesn't exist
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          school: '',
          academic_level: '',
          preferred_learning_style: '',
          bio: '',
          subjects_of_interest: []
        });
      }
      finally  {
        setLoading(false);
      }
    };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Full name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.school.trim()) {
      newErrors.school = 'school is required';
    }

    if(!formData.preferred_learning_style){
      newErrors.preferred_learning_style = 'Preferred learning style is required';
    }
    
    if (!formData.academic_level.trim()) {
      newErrors.academic_level = 'Graduation year is required';
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
    if (newSubject.trim() && !formData.subjects_of_interest.includes(newSubject.trim())) {
      setFormData(prev => ({
        ...prev,
        subjects_of_interest: [...prev.subjects_of_interest, newSubject.trim()]
      }));
      setNewSubject('');
    }
  };

  const handleRemoveSubject = (subjectToRemove) => {
    setFormData(prev => ({
      ...prev,
      subjects_of_interest: prev.subjects_of_interest.filter(subject => subject !== subjectToRemove)
    }));
  };

  const handleProfileChange = (e) => {
    const file = e.target.files[0];
    if(file){
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target.result);
      };
      reader.readAsDefault(file);
    }
  }

  const handleSave = async() => {
    if (!validateForm()) {
      console.log('Saving profile:', formData);
      return;
    }

    try {
      setLoading(true);

    //PREPARE DATA FOR API
    const updateData = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      school: formData.school,
      academic_level: formData.academic_level,
      preferred_learning_style: formData.preferred_learning_style,
      bio: formData.bio,
      subjects_of_interest: formData.subjects_of_interest
    };

    //UPDATE PROFILE 
    const updatedProfile = await apiClient.put('/api/student/updateProfile', updateData);

    //HANDLE PROFILE PICTURE UPLOAD IF SELECTED
    if(profilePicture) {
      const formData = new FormData();//INSTANTIATE FORM DATA OBJECT
      formData.append('profile_picture', profilePicture);

      // You might need to create a separate endpoint for profile picture updates
      // For now, we'll include it in the main update
      //await apiClient.post('/api/student/profilePicture', formData, { isFormData: true });
    }

    //NOTIFY PARENT COMPONENT FOR SUCCESSFUL UPDATE
    if(onProfileUpdate) {
      onProfileUpdate(updatedProfile);
    }
    onClose();
  }
  catch(error) {
    console.error('Error saving profile', error);
    alert('Failed to save profile. Please try again');
  }
  finally {
    setLoading(false);
  }
}
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-xs bg-black/25 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-800">Edit Profile</h1>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      errors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      errors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>
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
              {/* School */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">School </label>
                <input
                  type="text"
                  value={formData.school}
                  onChange={(e) => handleInputChange('school', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    errors.school ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.school && (
                  <p className="mt-1 text-sm text-red-600">{errors.school}</p>
                )}
              </div>


              {/* Learning Style & Academic Level*/}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Learning style </label>
                  <select 
                    type="text"
                    value={formData.preferred_learning_style}
                    onChange={(e) => handleInputChange('preferred_learning_style', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      errors.preferred_learning_style ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select your learning style</option>
                    {learningStyles.map((style) => (
                      <option key={style.value} value={style.value} >{style.label}</option>
                    ) )}
                  </select>
                  {errors.preferred_learning_style && (
                    <p className="mt-1 text-sm text-red-600">{errors.preferred_learning_style}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Academic Level</label>
                  <select
                    type="text"
                    value={formData.academic_level}
                    onChange={(e) => handleInputChange('academic_level', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      errors.academic_level ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select your academic level</option>
                    {academicLevels.map((level) => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                  {errors.academic_level && (
                    <p className="mt-1 text-sm text-red-600">{errors.academic_level}</p>
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
              <h2 className="text-lg font-semibold text-gray-800">Preferences</h2>
              
              {/* Subjects of Interest */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Subjects of Interest</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {/*SAFETY CHECK */}
                  {(formData.subjects_of_interest || []).map((subject, index) => (
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

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
