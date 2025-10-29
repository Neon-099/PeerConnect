import { useState, useEffect } from 'react';

import {useNavigate } from 'react-router-dom';
import {User, GraduationCap, DollarSign,  ArrowRight, CheckCircle, 
  ArrowLeft, Camera, CalendarIcon, Check, XCircle}  from 'lucide-react';

import { Calendar } from 'react-calendar';
import './CalendarProfile.css';

import {apiClient, getAccessToken } from '../../../utils/api.js';

import ImageUploadProgress from '../../../components/ImageUploadProgress.jsx';

const TutorProfileCreation = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
      // Personal Info
      gender: '',
      campus_location: '',
      profile_picture: null,
      bio: '',
      cp_number: '',
      fb_url: '',
      
      // Academic Qualifications
      highest_education: '',
      years_experience: '',
      specializations: [],
      
      // Rate and Teaching Preferences
      hourly_rate: '',
      teaching_styles: [],
      preferred_student_level: '',
      
      // Availability - now includes time slots
      availability: {}, // { "2024-01-15": { isAvailable: true, timeSlots: [{ start_time: "09:00", end_time: "17:00" }] } }
    });
    
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [hoveredDate, setHoveredDate] = useState(null);
    
    const [errors, setErrors] = useState({});
    const [isAuthenticated, setIsAuthentication] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const navigate = useNavigate();

    const [showDateTooltip, setShowDateTooltip] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    
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
      { number: 4, title: 'Availability', icon: CalendarIcon }
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
    
    const handleDateClick = (date) => {
      // Create a date string in YYYY-MM-DD format using local timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      setSelectedDate(date);
      
      // Only allow current and future dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        // Show notification for past date
        setErrors(prev => ({ 
          ...prev, 
          availability: 'Past dates cannot be selected. Please choose current or future dates only.' 
        }));
        return;
      }
      
      // Toggle availability for the clicked date
      setFormData(prev => ({
        ...prev,
        availability: {
          ...prev.availability,
          [dateStr]: {
            isAvailable: !prev.availability[dateStr]?.isAvailable,
            timeSlots: prev.availability[dateStr]?.timeSlots || [{ start_time: '09:00', end_time: '17:00' }]
          }
        }
      }));
      
      // Clear any availability errors
      if (errors.availability) {
        setErrors(prev => ({ ...prev, availability: '' }));
      }
    };
    
    // Update the getTileClassName function to use the same date format
    const getTileClassName = ({ date, view }) => {
      // Create a date string in YYYY-MM-DD format using local timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const dayAvailability = formData.availability[dateStr];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isPastDate = date < today;
      
      if (isPastDate) {
        return 'past-date-disabled';
      }
      
      if (dayAvailability?.isAvailable) {
        return 'available-day';
      } else if (dayAvailability?.isAvailable === false) {
        return 'unavailable-day';
      }
      return 'default-day';
    };
    
    // Update the handleDateMouseEnter function
    const handleDateMouseEnter = (event, date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isPastDate = date < today;
      
      if (isPastDate) {
        setHoveredDate(date);
        setShowDateTooltip(true);
        setTooltipPosition({
          x: event.clientX,
          y: event.clientY
        });
      }
    };
    
    const handleDateMouseLeave = () => {
      setShowDateTooltip(false);
      setHoveredDate(null);
    };

    // Update the tileContent function to use the same date format
    const renderTileContent = ({ date }) => {
      // Create a date string in YYYY-MM-DD format using local timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const dayAvailability = formData.availability[dateStr];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isPastDate = date < today;
      
      return (
        <div className="relative">
          {dayAvailability && !isPastDate ? (
            <div className="availability-indicator">
              {dayAvailability.isAvailable ? <Check size={12} /> : <XCircle size={12} />}
            </div>
          ) : isPastDate ? (
            <div className="past-date-indicator">
              <XCircle size={12} className="text-gray-500" />
            </div>
          ) : null}
        </div>
      );
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
        if (!formData.cp_number) {
          newErrors.cp_number = 'Contact number is required';
        } else if (!/^(\+63|0)?9\d{9}$/.test(formData.cp_number.replace(/\s/g, ''))) {
          newErrors.cp_number = 'Please enter a valid Philippine mobile number';
        }
        if (!formData.fb_url) {
          newErrors.fb_url = 'Facebook URL is required';
        } else if (!/^(https?:\/\/)?(www\.)?facebook\.com\/.+/.test(formData.fb_url)) {
          newErrors.fb_url = 'Please enter a valid Facebook URL';
        }
      }
  
      if (step === 2) {
        if (!formData.highest_education) newErrors.highest_education = 'Please select your highest education';
        
        if (!formData.years_experience) { 
          newErrors.years_experience = 'Please enter years of experience';
        }        
        else if (formData.years_experience.length > 2) {
          newErrors.years_experience = 'Exp can only be 2 digits'
        }

        if (formData.specializations.length < 3) {
          newErrors.specializations = 'Please select at least 3 subjects';
        }
      }
  
      if (step === 3) {
        if (!formData.hourly_rate) {
           newErrors.hourly_rate = 'Please enter your hourly rate';
        }
        else if(formData.hourly_rate.length > 3) {
          newErrors.hourly_rate = 'Digits must only be 3';
        }
        else if(formData.hourly_rate > 150 ){
          newErrors.hourly_rate = 'Prefer 150 PHP or below';
        }

        if (formData.teaching_styles.length < 2) {
          newErrors.teaching_styles = 'Please select at least 2 teaching styles';
        }
        if (!formData.preferred_student_level) {
          newErrors.preferred_student_level = 'Please select preferred student level';
        }
      }
  
      if (step === 4) {
        const availableDates = Object.keys(formData.availability).filter(date => formData.availability[date].isAvailable);
        if (availableDates.length < 3) {
          newErrors.availability = 'Please select at least 3 available dates';
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
  
    // Update the handleSubmit function to convert with time slots
    const handleSubmit = async () => {
      if (!validateStep(4)) return;

      setIsLoading(true);
      setIsUploading(true);
      setUploadProgress(0);
      
      try {
        console.log('Current formData', formData);
        
        // Convert availability format for backend (convert date-based to day-based with time slots)
        const availabilityForBackend = [];
        Object.entries(formData.availability).forEach(([dateStr, data]) => {
          if (data.isAvailable) {
            // Parse the date string to get the day of week
            const [year, month, day] = dateStr.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            
            // Send in the new date-based format
            availabilityForBackend.push({
              date: dateStr,  // This is the actual date
              day_of_week: dayOfWeek, // For backward compatibility
              is_available: true
            });
          }
        });
        
        // Create FormData for file upload
        const submitData = new FormData();

        // Add all form fields with validation
        Object.keys(formData).forEach(key => {
          if (key === 'specializations' || key === 'teaching_styles') {
            submitData.append(key, JSON.stringify(formData[key]));
          } 
          else if (key === 'profile_picture' && formData[key]) {
            submitData.append('profile_picture', formData[key]);
          } 
          else if (key === 'availability') {
            submitData.append('availability', JSON.stringify(availabilityForBackend));
          }
          else if (formData[key]) {
            submitData.append(key, formData[key]);
          }
        });

        console.log('Availability data being sent:', availabilityForBackend);

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
        
        if (result && result.profile_id) {
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
  
        <main className="max-w-6xl mx-auto px-6 py-8">
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
          <div className="w-full bg-gray-800 rounded-2xl p-8 shadow-2xl">
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

                {/* Contact Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Contact Number *</label>
                  <input
                    type="tel"
                    name="cp_number"
                    value={formData.cp_number}
                    onChange={handleInputChange}
                    placeholder="09XX XXX XXXX"
                    className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                  <p className="text-sm text-gray-400 mt-1">Enter your Philippine mobile number</p>
                  {errors.cp_number && <p className="text-red-400 text-sm mt-2">{errors.cp_number}</p>}
                </div>

                {/* Facebook URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Facebook Profile URL *</label>
                  <input
                    type="url"
                    name="fb_url"
                    value={formData.fb_url}
                    onChange={handleInputChange}
                    placeholder="https://facebook.com/your.profile"
                    className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                  <p className="text-sm text-gray-400 mt-1">Enter your Facebook profile URL</p>
                  {errors.fb_url && <p className="text-red-400 text-sm mt-2">{errors.fb_url}</p>}
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
                <p className="text-gray-400">When are you available to tutor? Select your available dates</p>
              </div>

              {/* Real Calendar-based Availability Selection */}
              <div className="bg-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  Select Your Available Dates
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Calendar */}
                  <div className="profile-calendar-container">
                    <Calendar
                      className="profile-calendar"
                      onChange={setSelectedDate}
                      value={selectedDate}
                      tileClassName={getTileClassName}
                      onClickDay={handleDateClick}
                      onMouseEnter={(event) => {
                        const date = event.target.closest('.react-calendar__tile')?.getAttribute('data-date');
                        if (date) {
                          handleDateMouseEnter(event, new Date(date));
                        }
                      }}
                      onMouseLeave={handleDateMouseLeave}
                      tileContent={renderTileContent}
                      minDate={new Date()}
                      locale="en-US"
                    />
                  </div>

                  {/* Instructions and Summary */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-md font-medium text-gray-300 mb-2">How to Use:</h4>
                      <div className="space-y-2 text-sm text-gray-400">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-green-500 rounded"></div>
                          <span>Click: Mark as Available</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-red-500 rounded"></div>
                          <span>Click again: Mark as Unavailable</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-gray-400 rounded"></div>
                          <span>No mark: Not set</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-gray-600 rounded border border-gray-500"></div>
                          <span>Past dates: Cannot be selected</span>
                        </div>
                      </div>
                    </div>

                    {/* Selected Date Info */}
                    <div className="bg-gray-600 p-4 rounded-lg">
                      <h4 className="font-medium text-white mb-2">Selected Date:</h4>
                      <p className="text-sm text-gray-300">
                        {selectedDate.toLocaleDateString('en-PH', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          timeZone: 'Asia/Manila'
                        })}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Status: {(() => {
                          const year = selectedDate.getFullYear();
                          const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                          const day = String(selectedDate.getDate()).padStart(2, '0');
                          const dateStr = `${year}-${month}-${day}`;
                          return formData.availability[dateStr]?.isAvailable ? 'Available' : 'Not set';
                        })()}
                      </p>
                    </div>

                    {/* Summary of Selected Dates - Fixed to show correct dates */}
                    <div className="bg-gray-600 p-4 rounded-lg">
                      <h4 className="font-medium text-white mb-2">Selected Dates Summary</h4>
                      <div className="space-y-1 text-sm text-gray-300">
                        {Object.keys(formData.availability).length === 0 ? (
                          <p className="text-gray-400">No dates selected yet</p>
                        ) : (
                          Object.entries(formData.availability)
                            .filter(([_, data]) => data.isAvailable)
                            .sort(([a], [b]) => new Date(a) - new Date(b)) // Sort by date
                            .map(([dateStr, data]) => {
                              // Parse the date string and create a proper Date object
                              const [year, month, day] = dateStr.split('-').map(Number);
                              const date = new Date(year, month - 1, day);
                              
                              return (
                                <div key={dateStr} className="flex justify-between items-center">
                                  <span>
                                    {date.toLocaleDateString('en-PH', { 
                                      weekday: 'short', 
                                      month: 'short', 
                                      day: 'numeric',
                                      timeZone: 'Asia/Manila'
                                    })}
                                  </span>
                                  <span className="text-green-400">Available</span>
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {errors.availability && (
                  <p className="text-red-400 text-sm mt-4">{errors.availability}</p>
                )}

                <div className="mt-4 text-sm text-gray-400">
                  Total available dates: {Object.keys(formData.availability).filter(date => formData.availability[date].isAvailable).length} (Minimum: 3 required)
                </div>
              </div>

              {/* Availability Tips */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
                <h4 className="font-medium text-blue-400 mb-2">💡 Tips for Setting Availability</h4>
                <ul className="text-sm text-blue-300 space-y-1">
                  <li>• Click on calendar dates to mark them as available</li>
                  <li>• Only current and future dates can be selected</li>
                  <li>• You can always update your availability later</li>
                  <li>• Students will see you as available on selected dates</li>
                </ul>
              </div>
            </div>
            )}

            {/* Tooltip for past dates */}
            {showDateTooltip && hoveredDate && (
              <div 
                className="fixed z-50 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm border border-gray-600 pointer-events-none"
                style={{
                  left: tooltipPosition.x + 10,
                  top: tooltipPosition.y - 40,
                }}
              >
                <div className="flex items-center space-x-2">
                  <XCircle size={16} className="text-red-400" />
                  <span>Past dates cannot be selected</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {hoveredDate.toLocaleDateString('en-PH', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric',
                    timeZone: 'Asia/Manila'
                  })}
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