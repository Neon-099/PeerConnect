import React, { useEffect, useState } from 'react';
import { X, Upload, Trash2, User, GraduationCap, DollarSign, Camera, Star, BookOpen, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { apiClient } from '../utils/api';

const TutorEditProfileModal = ({ isOpen, onClose, onProfileUpdate }) => {
  const [formData, setFormData] = useState({
    // Personal Info
    firstName: '',
    lastName: '',
    email: '',
    gender: '',
    campus_location: '',
    bio: '',
    
    // Academic Qualifications
    highest_education: '',
    years_experience: '',
    specializations: [],
    
    // Rate and Teaching Preferences
    hourly_rate: '',
    teaching_styles: [],
    preferred_student_level: ''
  });

  const [newSpecialization, setNewSpecialization] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState('');
  // Options for dropdowns
  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' }
  ];

  const campusOptions = [
    { value: 'main_campus', label: 'Main Campus' },
    { value: 'pucu', label: 'PUCU' }
  ];

  const educationOptions = [
    { value: 'high_school', label: 'High School' },
    { value: 'associates', label: 'Associate Degree' },
    { value: 'bachelors', label: 'Bachelor\'s Degree' },
    { value: 'masters', label: 'Master\'s Degree' },
    { value: 'phd', label: 'PhD' },
    { value: 'other', label: 'Other' }
  ];

  const subjectOptions = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History',
    'Geography', 'Computer Science', 'Programming', 'Statistics', 'Economics',
    'Accounting', 'Business', 'Psychology', 'Sociology', 'Philosophy',
    'Literature', 'Foreign Languages', 'Art', 'Music', 'Physical Education'
  ];

  const teachingStyleOptions = [
    { value: 'visual', label: 'Visual' },
    { value: 'auditory', label: 'Auditory' },
    { value: 'kinesthetic', label: 'Kinesthetic' },
    { value: 'reading_writing', label: 'Reading/Writing' },
    { value: 'mixed', label: 'Mixed' }
  ];

  const studentLevelOptions = [
    { value: 'shs', label: 'Senior High School' },
    { value: 'college', label: 'College' }
  ];

  // Fetch profile data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchProfileData();
    }
  }, [isOpen]);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const profileData = await apiClient.get('/api/tutor/profile');

      console.log('Tutor profile data received', profileData);

      setFormData({
        firstName: profileData.first_name || '',
        lastName: profileData.last_name || '',
        email: profileData.email || '',
        gender: profileData.gender || '',
        campus_location: profileData.campus_location || '',
        bio: profileData.bio || '',
        highest_education: profileData.highest_education || '',
        years_experience: profileData.years_experience?.toString() || '',
        specializations: profileData.specializations || [],
        hourly_rate: profileData.hourly_rate?.toString() || '',
        teaching_styles: profileData.teaching_styles || [],
        preferred_student_level: profileData.preferred_student_level || ''
      });

      // Profile picture preview
      if (profileData.profile_picture) {
        if (profileData.profile_picture.startsWith('http')) {
          setProfilePicturePreview(profileData.profile_picture);
        } else {
          setProfilePicturePreview(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/${profileData.profile_picture}`);
        }
      }

      
    } catch (error) {
      console.error('Error fetching tutor profile data:', error);
      // Set default values if profile doesn't exist
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        gender: '',
        campus_location: '',
        bio: '',
        highest_education: '',
        years_experience: '',
        specializations: [],
        hourly_rate: '',
        teaching_styles: [],
        preferred_student_level: ''
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }
    
    if (!formData.campus_location) {
      newErrors.campus_location = 'Campus location is required';
    }
    
    if (!formData.highest_education) {
      newErrors.highest_education = 'Highest education is required';
    }
    
    if (!formData.years_experience || isNaN(formData.years_experience) || parseInt(formData.years_experience) < 0) {
      newErrors.years_experience = 'Years of experience is required and must be a valid number';
    }
    
    if (!formData.hourly_rate || isNaN(formData.hourly_rate) || parseFloat(formData.hourly_rate) < 0) {
      newErrors.hourly_rate = 'Hourly rate is required and must be a valid number';
    }
    
    if (!formData.specializations.length) {
      newErrors.specializations = 'At least one specialization is required';
    }
    
    if (!formData.teaching_styles.length) {
      newErrors.teaching_styles = 'At least one teaching style is required';
    }
    
    if (!formData.preferred_student_level) {
      newErrors.preferred_student_level = 'Preferred student level is required';
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

  const handleSpecializationChange = (specialization, checked) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        specializations: [...prev.specializations, specialization]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        specializations: prev.specializations.filter(s => s !== specialization)
      }));
    }
  };

  const handleTeachingStyleChange = (style, checked) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        teaching_styles: [...prev.teaching_styles, style]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        teaching_styles: prev.teaching_styles.filter(s => s !== style)
      }));
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target.result);
        console.log('Profile picture preview updated');
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProfileData();
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!validateForm()) {
      console.log('Validation failed:', errors);
      return;
    }

    try {
      setIsLoading(true);

      // Prepare data for API
      const updateData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        gender: formData.gender,
        campus_location: formData.campus_location,
        bio: formData.bio,
        highest_education: formData.highest_education,
        years_experience: parseInt(formData.years_experience),
        specializations: formData.specializations,
        hourly_rate: parseFloat(formData.hourly_rate),
        teaching_styles: formData.teaching_styles,
        preferred_student_level: formData.preferred_student_level,
      };

      // Update profile
      const updatedProfile = await apiClient.put('/api/tutor/profile', updateData);

      // Handle profile picture upload if selected
      if (profilePicture) {
        try {
          const formDataForUpload = new FormData();
          formDataForUpload.append('profile_picture', profilePicture);
          console.log('Uploading profile picture...', profilePicture);

          const result = await apiClient.post('/api/tutor/profilePicture', formDataForUpload, { isFormData: true });
          console.log('Profile picture uploaded successfully', result);

          if (result.profile_picture) {
            setProfilePicturePreview(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/${result.profile_picture}`);
          }
        } catch (err) {
          console.error('Profile picture upload failed:', err);
          alert('Failed to upload profile picture. Please try again');
        }
      }

      // Refresh profile data to get latest info
      await fetchProfileData();

      // Notify parent component for successful update
      if (onProfileUpdate) {
        onProfileUpdate(updatedProfile);
      }

      onClose();
    } catch (error) {
      console.error('Error saving tutor profile:', error);
      alert('Failed to save profile. Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/25 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Edit Tutor Profile</h1>
              <p className="text-sm text-gray-600">Update your teaching profile and preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {isLoading && (!formData.firstName || !formData.lastName) ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">Loading profile...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Personal Info & Academic */}
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-blue-500" />
                    <h2 className="text-lg font-semibold text-gray-800">Personal Information</h2>
                  </div>
                  
                  {/* Profile Picture */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      <img 
                        src={profilePicturePreview || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" }
                        alt="Profile" 
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                      />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Camera className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <label className="flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                        <Upload className="w-4 h-4" />
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePictureChange}
                          className="hidden"
                        />
                      </label>
                      <button 
                        onClick={() => {
                          setProfilePicture(null);
                          setProfilePicturePreview('');
                        }}
                        className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.lastName ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.lastName && (
                        <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  {/* Gender & Campus */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.gender ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select gender</option>
                        {genderOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {errors.gender && (
                        <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Campus Location</label>
                      <select
                        value={formData.campus_location}
                        onChange={(e) => handleInputChange('campus_location', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.campus_location ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select campus</option>
                        {campusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {errors.campus_location && (
                        <p className="mt-1 text-sm text-red-600">{errors.campus_location}</p>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows={3}
                      placeholder="Tell students about yourself and your teaching approach..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>

                {/* Academic Qualifications */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <GraduationCap className="w-5 h-5 text-blue-500" />
                    <h2 className="text-lg font-semibold text-gray-800">Academic Qualifications</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Highest Education</label>
                      <select
                        value={formData.highest_education}
                        onChange={(e) => handleInputChange('highest_education', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.highest_education ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select education level</option>
                        {educationOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {errors.highest_education && (
                        <p className="mt-1 text-sm text-red-600">{errors.highest_education}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.years_experience}
                        onChange={(e) => handleInputChange('years_experience', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.years_experience ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.years_experience && (
                        <p className="mt-1 text-sm text-red-600">{errors.years_experience}</p>
                      )}
                    </div>
                  </div>

                  {/* Specializations */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Specializations</label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {subjectOptions.map((subject) => (
                        <label key={subject} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.specializations.includes(subject)}
                            onChange={(e) => handleSpecializationChange(subject, e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{subject}</span>
                        </label>
                      ))}
                    </div>
                    {errors.specializations && (
                      <p className="mt-1 text-sm text-red-600">{errors.specializations}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Teaching Preferences & Stats */}
              <div className="space-y-6">
                {/* Rate and Teaching Preferences */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="w-5 h-5 text-blue-500" />
                    <h2 className="text-lg font-semibold text-gray-800">Rate & Teaching Preferences</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate (₱)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.hourly_rate}
                        onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.hourly_rate ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.hourly_rate && (
                        <p className="mt-1 text-sm text-red-600">{errors.hourly_rate}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Student Level</label>
                      <select
                        value={formData.preferred_student_level}
                        onChange={(e) => handleInputChange('preferred_student_level', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.preferred_student_level ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select student level</option>
                        {studentLevelOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {errors.preferred_student_level && (
                        <p className="mt-1 text-sm text-red-600">{errors.preferred_student_level}</p>
                      )}
                    </div>
                  </div>

                  {/* Teaching Styles */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Teaching Styles</label>
                    <div className="space-y-2">
                      {teachingStyleOptions.map((style) => (
                        <label key={style.value} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.teaching_styles.includes(style.value)}
                            onChange={(e) => handleTeachingStyleChange(style.value, e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{style.label}</span>
                        </label>
                      ))}
                    </div>
                    {errors.teaching_styles && (
                      <p className="mt-1 text-sm text-red-600">{errors.teaching_styles}</p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorEditProfileModal;