import React, { useEffect, useState } from 'react';
import { X, Upload, Trash2, Calendar, MessageSquare} from 'lucide-react';
import {apiClient } from './../utils/api';


const EditProfileModal = ({ isOpen, onClose, onProfileUpdate }) => {
const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    preferred_learning_style: '',
    academic_level: '',
    bio: '',
    cp_number: '',
    fb_url: '',
    subjects_of_interest: []
  });

  const [newSubject, setNewSubject] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState('');
  const [deleteProfilePicture, setDeleteProfilePicture] = useState(false);


  const campusOptions = [
    { label: 'Main Campus', value: 'main_campus' },
    { label: 'PUCU', value: 'pucu' }
  ];
  const learningStyles = [
    { label: 'Visual Learner', value: 'visual' },
    { label: 'Auditory Learner', value: 'auditory' },
    { label: 'Kinesthetic Learner', value: 'kinesthetic' },
    { label: 'Reading/Writing Learner', value: 'reading_writing' },
    { label: 'Mixed Learning Style', value: 'mixed' }
  ];
  const academicLevels = [
    { label: 'High School', value: 'high_school' },
    { label: 'SHS (Senior High School)', value: 'shs'},
    { label: 'Undergraduate (Freshman)', value: 'undergraduate_freshman' },
    { label: 'Undergraduate (Sophomore)', value: 'undergraduate_sophomore' },
    { label: 'Undergraduate (Junior)', value: 'undergraduate_junior' },
    { label: 'Undergraduate (Senior)', value: 'undergraduate_senior' },
  ];

  //PROFILE DATA
  useEffect(() => {
    if(isOpen) {
      fetchProfileData();
    }
  }, [isOpen]);

  const fetchProfileData = async() => {
      try {
        setIsLoading(true);
        const profileData = await apiClient.get('/api/student/profile');

        console.log('Profile data received', profileData)  

        setFormData({
          firstName: profileData.first_name || '', 
          lastName: profileData.last_name || '',
          email: profileData.email || '',
          campus_location: profileData.campus_location || '',
          preferred_learning_style: profileData.preferred_learning_style || '',
          academic_level: profileData.academic_level || '',
          bio: profileData.bio || '',
          cp_number: profileData.cp_number || '',
          fb_url: profileData.fb_url || '',
          subjects_of_interest: profileData.subjects_of_interest || []
        });

        //PROFILE PICTURE PREVIEW
        if(profileData.profile_picture) {
          //CHECK IF PROFILE PICTURE IS A FULL URL
          if(profileData.profile_picture.startsWith('http')){
            setProfilePicturePreview(profileData.profile_picture);
          }
          else {
            setProfilePicturePreview(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/${profileData.profile_picture}`);
          }
        }

        setDeleteProfilePicture(false);
        setProfilePicture(null);
      } catch (error) {
        console.error(`Error fetching profile data: `, error);
        // Set default values if profile doesn't exist
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          campus_location: '',
          academic_level: '',
          preferred_learning_style: '',
          bio: '',
          cp_number: '',
          fb_url: '',
          subjects_of_interest: []
        });
      }
      finally  {
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
    
    if(!formData.preferred_learning_style){
      newErrors.preferred_learning_style = 'Preferred learning style is required';
    }
    
    if (!formData.academic_level.trim()) {
      newErrors.academic_level = 'Academic level is required';
    }

    if(!formData.subjects_of_interest.length) {
      newErrors.subjects_of_interest = 'At least one subject of interest is required';
    }
    
    if(!formData.cp_number.trim()) {
      newErrors.cp_number = 'Cell phone number is required';
    } else if (!/^(\+63|0)?9\d{9}$/.test(formData.cp_number.replace(/\s/g, ''))) {
      newErrors.cp_number = 'Please enter a valid Philippine mobile number';
    }
    
    if(!formData.fb_url.trim()) {
      newErrors.fb_url = 'Facebook URL is required';
    } else if (!/^(https?:\/\/)?(www\.)?facebook\.com\/.+/.test(formData.fb_url)) {
      newErrors.fb_url = 'Please enter a valid Facebook URL';
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

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if(file){
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target.result);
        console.log('Profile picture preview updated')
      };
      reader.readAsDataURL(file);
    }
  }

  const handleSave = async() => {
    if (!validateForm()) {
      console.log('Validation failed:', errors);
      return;
    }

    try {
      setIsLoading(true);

    //PREPARE DATA FOR API REQUEST UPDATE
    const updateData = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      campus_location: formData.campus_location,
      academic_level: formData.academic_level,
      preferred_learning_style: formData.preferred_learning_style,
      bio: formData.bio,
      cp_number: formData.cp_number,
      fb_url: formData.fb_url,
      subjects_of_interest: formData.subjects_of_interest
    };

    console.log('Sending update data:', updateData);

    //UPDATE PROFILE 
    const updatedProfile = await apiClient.put('/api/student/updateProfile', updateData);
    console.log('Profile updated successfully:', updatedProfile);


    //HANDLE PROFILE DELETION
    if(deleteProfilePicture){
      try {
        console.log('Delete profile picture');
        await apiClient.delete('/api/student/profilePictureDelete');
        setProfilePicturePreview('');
      } catch (err){
        console.error('Profile picture deletion failed', err);
        alert('Failed to delete profile picture');
      }
    }

    // Handle profile picture upload if selected
    if(profilePicture) {
      try {
        const formDataForUpload = new FormData();
        formDataForUpload.append('profile_picture', profilePicture);
        console.log('Uploading profile picture...', profilePicture);

        const result = await apiClient.post('/api/student/profilePicture', formDataForUpload, { isFormData: true });
        console.log('Profile picture uploaded successfully', result);

        if(result.profile_picture){
          setProfilePicturePreview(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/${result.profile_picture}`);
        }
      }
      catch (err) {
        console.error('Profile picture upload failed: ', err);
        alert('Failed to upload profile picture. Please try again');
      }
    }

    //REFRESH PROFILE DATA TO GET LATEST INFO
    await fetchProfileData();

    //NOTIFY PARENT COMPONENT FOR SUCCESSFUL UPDATE
    if(onProfileUpdate) {
      onProfileUpdate(updatedProfile);
    }
    
    alert('Profile updated successfully!');
    onClose();
  }
  catch(error) {
    console.error('Error saving profile', error);
    alert(`Failed to save profile: ${error.message}`);
  }
  finally {
    setIsLoading(false);
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
        {isLoading && !formData.firstName || !formData.lastName ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-700"></div>
            <span className="ml-2 text-gray-600">Loading profile...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Profile */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-800">Profile</h2>
              
              {/* Profile Picture */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img 
                    src={profilePicturePreview || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" }
                    alt="Profile" 
                    className="w-20 h-20 rounded-full object-cover"
                  />
                </div>
                <div className="flex gap-2">
                  <label className="flex items-center gap-2 px-4 py-2 border border-teal-200 text-teal-700 rounded-lg hover:bg-teal-50 transition-colors cursor-pointer">
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
                        setDeleteProfilePicture(true);  
                      }}
                      className="flex items-center gap-2 px-4 py-2 border border-teal-200 text-teal-700 rounded-lg hover:bg-teal-50 transition-colors"
                    >
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
              {/* Campus Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Campus Location </label>
                  <select 
                    type="text"
                    value={formData.campus_location}
                    onChange={(e) => handleInputChange('campus_location', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      errors.campus_location ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select your campus location</option>
                    {campusOptions.map((campus) => (
                      <option key={campus.value} value={campus.value} >{campus.label}</option>
                    ) )}
                  </select>
                  {errors.campus_location && (
                    <p className="mt-1 text-sm text-red-600">{errors.campus_location}</p>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cell Phone Number</label>
                <input
                  type="tel"
                  value={formData.cp_number}
                  onChange={(e) => handleInputChange('cp_number', e.target.value)}
                  placeholder="09123456789"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    errors.cp_number ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.cp_number && (
                  <p className="mt-1 text-sm text-red-600">{errors.cp_number}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Facebook URL</label>
                <input
                  type="url"
                  value={formData.fb_url}
                  onChange={(e) => handleInputChange('fb_url', e.target.value)}
                  placeholder="https://facebook.com/yourprofile"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    errors.fb_url ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.fb_url && (
                  <p className="mt-1 text-sm text-red-600">{errors.fb_url}</p>
                )}
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
