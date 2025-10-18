import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, GraduationCap, BookOpen, MapPin, Calendar, Upload, ArrowRight, CheckCircle } from 'lucide-react';
import { apiClient, getAccessToken } from '../utils/api.js';

import CloudinaryImage from './CloudinaryImage.jsx';
import ImageUploadProgress from './ImageUploadProgress.jsx';

const StudentProfileCreation = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Basic Info
    school: '',
    bio: '',
    campus_location: '',
    // Academic Info
    subjects_of_interest: [],
    academic_level: '',
    // Preferences
    preferred_learning_style: '',
    // Profile Picture
    profile_picture: null
  });

  const [errors, setErrors] = useState({});
  const [newSubject, setNewSubject] = useState('');
  const [isAuthenticated, setIsAuthentication] = useState(false);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const navigate = useNavigate();


  
  //AUTHENTICATION CHECK for token
  useEffect(() => {
    const token = getAccessToken();
    if(!token) {  //if no token
      navigate('/signup'); //redirect to login
      return;
    }
    setIsAuthentication(true);
  }, [navigate]);


  const steps = [
    { number: 1, title: 'Basic Info', icon: User },
    { number: 2, title: 'Academic Details', icon: GraduationCap },
    { number: 3, title: 'Learning Preferences', icon: BookOpen },
    { number: 4, title: 'Profile Picture', icon: Upload }
  ];

  const academicLevels = [
    { label: 'High School', value: 'high_school' },
    { label: 'SHS (Senior High School)', value: 'shs'},
    { label: 'Undergraduate (Freshman)', value: 'undergraduate_freshman' },
    { label: 'Undergraduate (Sophomore)', value: 'undergraduate_sophomore' },
    { label: 'Undergraduate (Junior)', value: 'undergraduate_junior' },
    { label: 'Undergraduate (Senior)', value: 'undergraduate_senior' },
  ];

  const learningStyles = [
    { label: 'Visual Learner', value: 'visual' },
    { label: 'Auditory Learner', value: 'auditory' },
    { label: 'Kinesthetic Learner', value: 'kinesthetic' },
    { label: 'Reading/Writing Learner', value: 'reading_writing' },
    { label: 'Mixed Learning Style', value: 'mixed' }
  ];

  const campusOptions = [
    {label: 'Main Campus', value: 'main_campus'},
    {label: 'PUCU', value: 'pucu'},
  ]

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

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:

        if (!formData.school.trim()) {
         newErrors.school = 'School is required';
        }
        else if (formData.school.trim().length < 5) {
          newErrors.school = `School name must be at least 5 characters long`;
        }

        if(!formData.bio.trim()){
          newErrors.bio = `Bio is required - tell use about yourself`;
        }
        else if (formData.bio.trim().length <= 5) {
          newErrors.bio = 'Bio must be at least 5 characters long';
        }
        else if (formData.bio.trim().length > 500) {
          newErrors.bio = 'Bio cannot exceed 500 characters';
        }

        if (!formData.campus_location) {
          newErrors.campus_location = 'Campus location is required';
        }
        break;
      case 2:
        if (formData.subjects_of_interest.length === 0) {
          newErrors.subjects_of_interest = 'At least one subject of interest is required';
        }
        else if (formData.subjects_of_interest.length < 2) {
          newErrors.subjects_of_interest = 'At least two subjects of interest are required';
        }
        else if (formData.subjects_of_interest.length > 10) {
          newErrors.subjects_of_interest = 'Maximum of to 10 subjects of interest is allowed';
        }

        if (!formData.academic_level) {
          newErrors.academic_level = 'Academic level is required';
        }
        break;
      case 3:
        if (!formData.preferred_learning_style) {
          newErrors.preferred_learning_style = 'Learning style preference is required';
        }
        break;
      case 4:
        if(!formData.profile_picture) {
          newErrors.profile_picture = 'Profile picture is required to complete your setup';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

   //COMPREHENSIVE VALIDATION FOR FINAL SUBMISSION
  const validateAllSteps = () => {
    const allErrors = {};
    
    // Validate all steps
    for (let step = 1; step <= steps.length; step++) {
      const stepErrors = {};
      
      switch (step) {
        case 1:
          if (!formData.school.trim()) {
            stepErrors.school = 'School/University is required';
          } else if (formData.school.trim().length < 3) {
            stepErrors.school = 'School name must be at least 3 characters';
          }
          
          if (!formData.bio.trim()) {
            stepErrors.bio = 'Bio is required';
          } else if (formData.bio.trim().length < 5) {
            stepErrors.bio = 'Bio must be at least 5 characters';
          } else if (formData.bio.trim().length > 500) {
            stepErrors.bio = 'Bio must be less than 500 characters';
          }
          break;
          
        case 2:
          if (formData.subjects_of_interest.length < 2) {
            stepErrors.subjects_of_interest = 'At least 2 subjects of interest are required';
          }
          if (!formData.academic_level) {
            stepErrors.academic_level = 'Academic level is required';
          }
          break;
          
        case 3:
          if (!formData.preferred_learning_style) {
            stepErrors.preferred_learning_style = 'Learning style preference is required';
          }
          break;
          
        case 4:
          if (!formData.profile_picture) {
            stepErrors.profile_picture = 'Profile picture is required';
          }
          break;
      }
      
      Object.assign(allErrors, stepErrors);
    }
    
    setErrors(allErrors);
    return Object.keys(allErrors).length === 0;
  };

   const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      } else {
        // Final step - validate everything before submission
        if (validateAllSteps()) {
          handleSubmit();
        } else {
          // Show error message for incomplete profile
          alert('Please complete all required fields before submitting your profile.');
        }
      }
    } else {
      // Show specific error message for current step
      const errorFields = Object.keys(errors);
      if (errorFields.length > 0) {
        alert(`Please fix the following errors:\n• ${Object.values(errors).join('\n• ')}`);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateAllSteps()) {
      alert('Profile setup incomplete. Please fill all required fields.');
      return;
    }
    
    setIsLoading(true);
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      console.log('Current formData', formData);
      
      // Create FormData for file upload
      const submitData = new FormData();
  
      // Add all form fields with validation
      Object.keys(formData).forEach(key => {
        if (key === 'subjects_of_interest') {
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
  
      const result = await apiClient.post('/api/student/profileCreation', submitData, {
        isFormData: true
      });
  
      clearInterval(progressInterval);
      setUploadProgress(100);
  
      console.log('profile created: ', result);
      console.log('Profile picture:', result.profile_picture);
      
      if (result || (result.success && result.data.profile_id)) {
        setTimeout(() => {
          alert('Profile created successfully! You can now access all features.');
          navigate('/student/home');
        }, 500);
      } else {
        throw new Error('Failed to create profile');
      }
    } catch (error) {
      console.error('Profile setup error:', error);
      alert('Failed to create profile. Please try again.');
    } finally {
      setIsLoading(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if(!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">School or University *</label>
                <input
                  type="text"
                  value={formData.school}
                  onChange={(e) => handleInputChange('school', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    errors.school ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Your School name"
                />
                {errors.school && <p className="mt-1 text-sm text-red-600">{errors.school}</p>}
              </div>
            </div> 

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={4}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none
                  ${errors.bio ? 'border-red-500' : 'border-gray-300'}
                `}
                placeholder="Tell us about yourself, your academic goals, and what you're looking for in a tutor..."
              />
              <div className="flex justify-between items-center mt-1">
                {errors.bio && <p className="text-sm text-red-600">{errors.bio}</p>}
                <p className="text-xs text-gray-500 ml-auto">
                  {formData.bio.length}/500 characters
                </p>
              </div>
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Campus Location *</label>
              <select
                value={formData.campus_location}
                onChange={(e) => handleInputChange('campus_location', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.campus_location ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select your campus</option>
                {campusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              {errors.campus_location && <p className="mt-1 text-sm text-red-600">{errors.campus_location}</p>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Subjects of Interest *</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.subjects_of_interest.map((subject, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-sm font-medium flex items-center gap-2"
                  >
                    {subject}
                    <button
                      onClick={() => handleRemoveSubject(subject)}
                      className="text-teal-500 hover:text-teal-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Add subject (e.g., Calculus, Physics)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSubject()}
                />
                <button
                  onClick={handleAddSubject}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Add
                </button>
              </div>
              {errors.subjects_of_interest && <p className="mt-1 text-sm text-red-600">{errors.subjects_of_interest}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Academic Level *</label>
              <select
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
              {errors.academic_level && <p className="mt-1 text-sm text-red-600">{errors.academic_level}</p>}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Learning Style *</label>
              <select
                value={formData.preferred_learning_style}
                onChange={(e) => handleInputChange('preferred_learning_style', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.preferred_learning_style ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select your learning style</option>
                {learningStyles.map((style) => (
                  <option key={style.value} value={style.value}>{style.label}</option>
                ))}
              </select>
              {errors.preferred_learning_style && <p className="mt-1 text-sm text-red-600">{errors.preferred_learning_style}</p>}
            </div>

          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-4 overflow-hidden">
                {formData.profile_picture ? (
                  <img
                    src={URL.createObjectURL(formData.profile_picture)}
                    alt="Profile preview"
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-gray-400" />
                )}
              </div>
              <input
                type="file"
                id="profile-picture"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="profile-picture"
                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 cursor-pointer transition-colors"
              >
                <Upload className="w-5 h-5" />
                {formData.profile_picture ? 'Change Photo' : 'Upload Photo'}
              </label>
              <p className="text-sm text-gray-500 mt-2">
                Upload a profile picture (JPEG, PNG, GIF, or WebP - Max 6MB)
              </p>
              {errors.profile_picture && (
                <p className="mt-1 text-sm text-red-600">{errors.profile_picture}</p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-teal-600" />
            <h1 className="text-2xl font-bold text-gray-900">PeerConnect</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted 
                      ? 'bg-teal-600 border-teal-600 text-white' 
                      : isActive 
                        ? 'bg-teal-600 border-teal-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      isActive ? 'text-teal-600' : isCompleted ? 'text-teal-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      isCompleted ? 'bg-teal-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                {steps[currentStep - 1].title}
              </h2>
              <p className="text-gray-600">
                {currentStep === 1 && "Let's start with your basic information"}
                {currentStep === 2 && "Tell us about your academic background"}
                {currentStep === 3 && "Help us understand your learning preferences"}
                {currentStep === 4 && "Add a profile picture to complete your setup"}
              </p>
            </div>

            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="px-8 py-6 bg-gray-50 rounded-b-xl flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`px-6 py-3 rounded-lg font-medium ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            
            <button
              onClick={handleNext}
              disabled={isLoading}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                'Creating Profile...'
              ) : currentStep === steps.length ? (
                'Complete Setup'
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Image Upload Progress */}
      <ImageUploadProgress progress={uploadProgress} isUploading={isUploading} />
    </div>
  );
};

export default StudentProfileCreation;