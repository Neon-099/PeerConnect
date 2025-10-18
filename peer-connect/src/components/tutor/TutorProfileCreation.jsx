import { useState, useEffect } from 'react';

import {useNavigate } from 'react-router-dom';
import {User, GraduationCap, DollarSign, Upload, ArrowRight, CheckCircle, ArrowLeft, Camera, Clock, Calendar}  from 'lucide-react';
import {apiClient, getAccessToken } from '../../utils/api.js';

import ImageUploadProgress from '../ImageUploadProgress.jsx';

const TutorProfileCreation = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
      // Personal Info
      gender: '',
      campus_location: '',
      profile_picture: null,
      bio: '',
      
      // Academic Qualifications
      highest_education: '',
      years_experience: '',
      specializations: [],
      
      // Rate and Teaching Preferences
      hourly_rate: '',
      teaching_styles: [],
      preferred_student_level: '',
      
      // Availability
      availability: [],
    });
  
    const [errors, setErrors] = useState({});
    const [isAuthenticated, setIsAuthentication] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    
    const [selectedDay, setSelectedDay] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    const navigate = useNavigate();
  
    // Authentication check
    useEffect(() => {
      const token = getAccessToken();
      if (!token) {
        navigate('/tutor/signup');
        return;
      }
      setIsAuthentication(true);
    }, [navigate]);
  
    const steps = [
      { number: 1, title: 'Personal Info', icon: User },
      { number: 2, title: 'Academic Qualifications', icon: GraduationCap },
      { number: 3, title: 'Rate & Preferences', icon: DollarSign },
      { number: 4, title: 'Availability', icon: Calendar }
    ];
  
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
    
    const daysOfWeek = [
      { value: 'monday', label: 'Monday' },
      { value: 'tuesday', label: 'Tuesday' },
      { value: 'wednesday', label: 'Wednesday' },
      { value: 'thursday', label: 'Thursday' },
      { value: 'friday', label: 'Friday' },
      { value: 'saturday', label: 'Saturday' },
      { value: 'sunday', label: 'Sunday' }
    ];

    const timeSlots = [
      '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
      '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
      '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
      '22:00', '22:30', '23:00', '23:30'
    ];
    
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Clear error when user starts typing
      if (errors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: ''
        }));
      }
    };
  
    const handleMultiSelect = (name, value) => {
      setFormData(prev => ({
        ...prev,
        [name]: prev[name].includes(value)
          ? prev[name].filter(item => item !== value)
          : [...prev[name], value]
      }));
    };
  
    const handleFileUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
          return;
        }
        
        // Validate file size (6MB limit)
        if (file.size > 6 * 1024 * 1024) {
          alert('File size must be less than 6MB');
          return;
        }
        
        setFormData(prev => ({
          ...prev,
          profile_picture: file
        }));
      }
    };
    
    const handleAddAvailability = () => {
      if (selectedDay && startTime && endTime) {
        // Validate time range
        if (startTime >= endTime) {
          setErrors(prev => ({ ...prev, availability: 'End time must be after start time' }));
          return;
        }

        // Check for overlapping times on the same day
        const existingSlot = formData.availability.find(slot => slot.day === selectedDay);
        if (existingSlot) {
          const hasOverlap = (startTime < existingSlot.end_time && endTime > existingSlot.start_time);
          if (hasOverlap) {
            setErrors(prev => ({ ...prev, availability: 'Time slots cannot overlap on the same day' }));
            return;
          }
        }

        const newSlot = {
          day_of_week: selectedDay,
          start_time: startTime,
          end_time: endTime,
          is_available: 1
        };

        setFormData(prev => ({
          ...prev,
          availability: [...prev.availability, newSlot]
        }));

        // Clear form
        setSelectedDay('');
        setStartTime('');
        setEndTime('');
        setErrors(prev => ({ ...prev, availability: '' }));
      }
    };

    const handleRemoveAvailability = (index) => {
      setFormData(prev => ({
        ...prev,
        availability: prev.availability.filter((_, i) => i !== index)
      }));
    };
    
    const validateStep = (step) => {
      const newErrors = {};
  
      if (step === 1) {
        if (!formData.gender) newErrors.gender = 'Please select your gender';
        if (!formData.campus_location) newErrors.campus_location = 'Please select your campus location';
        if (!formData.profile_picture) newErrors.profile_picture = 'Profile picture is required';
        if (!formData.bio || formData.bio.length < 10) {
          newErrors.bio = 'Bio must be at least 10 characters long';
        }
      }
  
      if (step === 2) {
        if (!formData.highest_education) newErrors.highest_education = 'Please select your highest education';
        if (!formData.years_experience) newErrors.years_experience = 'Please enter years of experience';
        if (formData.specializations.length < 3) {
          newErrors.specializations = 'Please select at least 3 subjects';
        }
      }
  
      if (step === 3) {
        if (!formData.hourly_rate) newErrors.hourly_rate = 'Please enter your hourly rate';
        if (formData.teaching_styles.length < 2) {
          newErrors.teaching_styles = 'Please select at least 2 teaching styles';
        }
        if (!formData.preferred_student_level) {
          newErrors.preferred_student_level = 'Please select preferred student level';
        }
      }
  
      if (step === 4) {
        if (!formData.availability.length) {
          newErrors.availability = 'Please select at least one availability';
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
  
    const handleNext = () => {
      if (validateStep(currentStep)) {
        setCurrentStep(prev => Math.min(prev + 1, steps.length));
      }
    };
  
    const handlePrevious = () => {
      setCurrentStep(prev => Math.max(prev - 1, 1));
    };
  
    const handleSubmit = async () => {
      if (!validateStep(4)) return;
    
      setIsLoading(true);
      setIsUploading(true);
      setUploadProgress(0);
      
      try {
        console.log('Current formData', formData);
        
        // Create FormData for file upload (like student version)
        const submitData = new FormData();
    
        // Add all form fields with validation
        Object.keys(formData).forEach(key => {
          if (key === 'specializations' || key === 'teaching_styles') {
            submitData.append(key, JSON.stringify(formData[key]));
          } 
          else if (key === 'profile_picture' && formData[key]) {
            submitData.append('profile_picture', formData[key]);
          } 
          else if (formData[key]) {
            submitData.append(key, formData[key]);
          }
        });
    
        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);
    
        const result = await apiClient.post('/api/tutor/profile', submitData, {
          isFormData: true
        });
    
        clearInterval(progressInterval);
        setUploadProgress(100);
    
        console.log('Tutor profile created: ', result);
        
        if (result  || (result.success && result.data.profile_id)) {
          setTimeout(() => {
            alert('Tutor profile created successfully! You can now access all features.');
            navigate('/tutor/home');
          }, 500);
        } else {
          throw new Error('Failed to create profile');
        }
      } catch (error) {
        console.error('Profile creation error:', error);
        setErrors({ submit: 'Failed to create profile. Please try again.' });
      } finally {
        setIsLoading(false);
        setIsUploading(false);
        setUploadProgress(0);
      }
    };
  
    if (!isAuthenticated) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      );
    }
  
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header */}
        <header className="bg-gray-900 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">PeerConnect</span>
            </div>
            <div className="text-sm text-gray-400">
              Step {currentStep} of {steps.length}
            </div>
          </div>
        </header>
  
        <main className="max-w-4xl mx-auto px-6 py-8">
          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                    currentStep >= step.number
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'border-gray-600 text-gray-400'
                  }`}>
                    {currentStep > step.number ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </div>
                  <div className="ml-3">
                    <div className={`text-sm font-medium ${
                      currentStep >= step.number ? 'text-white' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      currentStep > step.number ? 'bg-blue-500' : 'bg-gray-600'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
  
          {/* Form Content */}
          <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl">
            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">Personal Information</h2>
                  <p className="text-gray-400">Tell us about yourself</p>
                </div>
  
                {/* Profile Picture */}
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-300 mb-4">Profile Picture *</label>
                  <div className="flex justify-center">
                    <div className="relative">
                      {formData.profile_picture ? (
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500">
                          <img
                            src={URL.createObjectURL(formData.profile_picture)}
                            alt="Profile preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-gray-700 border-4 border-dashed border-gray-600 flex items-center justify-center">
                          <Camera className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <input
                        type="file"
                        id="profile-picture"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    Upload a profile picture (JPEG, PNG, GIF, or WebP - Max 6MB)
                  </p>
                  {isUploading && <ImageUploadProgress progress={uploadProgress} isUploading={isUploading} />}
                  {errors.profile_picture && (
                    <p className="text-red-400 text-sm mt-2">{errors.profile_picture}</p>
                  )}
                </div>
  
                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Gender *</label>
                  <div className="grid grid-cols-3 gap-4">
                    {genderOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleInputChange({ target: { name: 'gender', value: option.value } })}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          formData.gender === option.value
                            ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                            : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {errors.gender && <p className="text-red-400 text-sm mt-2">{errors.gender}</p>}
                </div>
  
                {/* Campus Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Campus Location *</label>
                  <div className="grid grid-cols-2 gap-4">
                    {campusOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleInputChange({ target: { name: 'campus_location', value: option.value } })}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          formData.campus_location === option.value
                            ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                            : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {errors.campus_location && <p className="text-red-400 text-sm mt-2">{errors.campus_location}</p>}
                </div>
  
                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Short Bio *</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself (minimum 10 characters)"
                    className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    rows={4}
                  />
                  <div className="text-right text-sm text-gray-400 mt-1">
                    {formData.bio.length}/10 minimum
                  </div>
                  {errors.bio && <p className="text-red-400 text-sm mt-2">{errors.bio}</p>}
                </div>
              </div>
            )}
  
            {/* Step 2: Academic Qualifications */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">Academic Qualifications</h2>
                  <p className="text-gray-400">Share your educational background and expertise</p>
                </div>
  
                {/* Highest Education */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Highest Education *</label>
                  <select
                    name="highest_education"
                    value={formData.highest_education}
                    onChange={handleInputChange}
                    className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Select your highest education</option>
                    {educationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.highest_education && <p className="text-red-400 text-sm mt-2">{errors.highest_education}</p>}
                </div>
  
                {/* Years of Experience */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Years of Experience *</label>
                  <input
                    type="number"
                    name="years_experience"
                    value={formData.years_experience}
                    onChange={handleInputChange}
                    placeholder="Enter years of tutoring experience"
                    min="0"
                    className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                  {errors.years_experience && <p className="text-red-400 text-sm mt-2">{errors.years_experience}</p>}
                </div>
  
                {/* Specializations */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Specializations * (Select at least 3)</label>
                  <div className="grid grid-cols-3 gap-3">
                    {subjectOptions.map((subject) => (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => handleMultiSelect('specializations', subject)}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 text-sm ${
                          formData.specializations.includes(subject)
                            ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                            : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                  <div className="text-sm text-gray-400 mt-2">
                    Selected: {formData.specializations.length}/3 minimum
                  </div>
                  {errors.specializations && <p className="text-red-400 text-sm mt-2">{errors.specializations}</p>}
                </div>
              </div>
            )}
  
            {/* Step 3: Rate and Teaching Preferences */}
            {currentStep === 3 && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">Rate & Teaching Preferences</h2>
                  <p className="text-gray-400">Set your rates and teaching style</p>
                </div>
  
                {/* Hourly Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Hourly Rate ($php) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      name="hourly_rate"
                      value={formData.hourly_rate}
                      onChange={handleInputChange}
                      placeholder="Enter your hourly rate"
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  {errors.hourly_rate && <p className="text-red-400 text-sm mt-2">{errors.hourly_rate}</p>}
                </div>
  
                {/* Teaching Styles */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Teaching Style * (Select at least 2)</label>
                  <div className="grid grid-cols-2 gap-4">
                    {teachingStyleOptions.map((style) => (
                      <button
                        key={style.value}
                        type="button"
                        onClick={() => handleMultiSelect('teaching_styles', style.value)}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          formData.teaching_styles.includes(style.value)
                            ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                            : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                  <div className="text-sm text-gray-400 mt-2">
                    Selected: {formData.teaching_styles.length}/2 minimum
                  </div>
                  {errors.teaching_styles && <p className="text-red-400 text-sm mt-2">{errors.teaching_styles}</p>}
                </div>
  
                {/* Preferred Student Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Preferred Student Level *</label>
                  <div className="grid grid-cols-2 gap-4">
                    {studentLevelOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleInputChange({ target: { name: 'preferred_student_level', value: option.value } })}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          formData.preferred_student_level === option.value
                            ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                            : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {errors.preferred_student_level && <p className="text-red-400 text-sm mt-2">{errors.preferred_student_level}</p>}
                </div>
              </div>
            )}
  
            {/* Step 4: Availability */}
            {currentStep === 4 && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">Set Your Availability</h2>
                  <p className="text-gray-400">When are you available to tutor? Add your time slots</p>
                </div>

                {/* Add Availability Form */}
                <div className="bg-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Add Time Slot</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Day Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Day</label>
                      <select
                        value={selectedDay}
                        onChange={(e) => setSelectedDay(e.target.value)}
                        className="w-full px-3 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select day</option>
                        {daysOfWeek.map((day) => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Start Time */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
                      <select
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-3 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Start time</option>
                        {timeSlots.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* End Time */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">End Time</label>
                      <select
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-3 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">End time</option>
                        {timeSlots.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Add Button */}
                    <div className="flex items-end">
                      <button
                        onClick={handleAddAvailability}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Clock className="w-4 h-4" />
                        Add Slot
                      </button>
                    </div>
                  </div>

                  {errors.availability && (
                    <p className="text-red-400 text-sm mt-2">{errors.availability}</p>
                  )}
                </div>

                {/* Current Availability */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Your Availability</h3>
                  
                  {formData.availability.length === 0 ? (
                    <div className="text-center py-8 bg-gray-700 rounded-xl">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">No availability slots added yet</p>
                      <p className="text-sm text-gray-500 mt-1">Add at least 3 time slots to continue</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.availability.map((slot, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium text-white">
                                {daysOfWeek.find(d => d.value === slot.day)?.label}
                              </h4>
                              <p className="text-sm text-gray-300">
                                {slot.start_time} - {slot.end_time}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveAvailability(index)}
                            className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 text-sm text-gray-400">
                    Total slots: {formData.availability.length} (Minimum: 3 required)
                  </div>
                </div>

                {/* Availability Tips */}
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
                  <h4 className="font-medium text-blue-400 mb-2">💡 Tips for Setting Availability</h4>
                  <ul className="text-sm text-blue-300 space-y-1">
                    <li>• Add multiple time slots per day if you're available at different times</li>
                    <li>• Consider your peak productivity hours for tutoring</li>
                    <li>• You can always update your availability later</li>
                    <li>• Students will only see slots when you're actually available</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-12">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  currentStep === 1
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Previous</span>
              </button>
  
              {currentStep < steps.length ? (
                <button
                  onClick={handleNext}
                  className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
                >
                  <span>Next</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating Profile...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Complete Profile</span>
                    </>
                  )}
                </button>
              )}
            </div>
  
            {errors.submit && (
              <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
                <p className="text-red-400 text-sm">{errors.submit}</p>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  };

export default TutorProfileCreation;