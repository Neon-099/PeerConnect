import React, { useState } from 'react';
import { X, Eye, EyeOff, Key, Lock } from 'lucide-react';
import { apiClient } from '../utils/api';
import PasswordResetModal from './PasswordResetModal.jsx';

const StudentPasswordChangeModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isShowPasswordResetModal, setIsShowPasswordResetModal] = useState(false);

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

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await apiClient.put('/api/user/changePassword', {
        old_password: formData.currentPassword,
        new_password: formData.newPassword
      });

      console.log('Password changed successfully:', response);
      
      alert('Password changed successfully!');
      
      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setErrors({});
      
      onClose();
    } catch (error) {
      console.error('Error changing password:', error);
      
      // Handle password change restriction
      if (error.status === 429) {
        const lockoutMinutes = error.data?.lockout_minutes || 15;
        const lockoutTime = error.data?.lockout_time_remaining || 0;
        
        setErrors({ 
          submit: `Password change is temporarily restricted for ${lockoutMinutes} minutes due to too many failed attempts.`,
          restrictionData: {
            minutes: lockoutMinutes,
            seconds: lockoutTime
          }
        });
      } else if (error.message?.includes('Incorrect') || error.message?.includes('incorrect') || error.message?.includes('old password')) {
        const remainingAttempts = error.data?.remaining_attempts;
        
        if (remainingAttempts !== undefined && remainingAttempts > 0) {
          setErrors({ 
            currentPassword: `Incorrect current password. ${remainingAttempts} attempt(s) remaining.`,
            remainingAttempts 
          });
        } else if (remainingAttempts === 0) {
          setErrors({ 
            currentPassword: `Too many failed attempts. Password change is now restricted for 15 minutes.`,
            submit: `Password change temporarily restricted. Please use 'Forgot Password' or wait 15 minutes.`,
            restrictionData: {
              minutes: 15,
              seconds: 900
            }
          });
        } else {
          setErrors({ 
            currentPassword: 'Incorrect current password. Please try again.',
          });
        }
      } else if (error.data?.errors) { // Handle validation errors - show specific field errors
        const validationErrors = error.data.errors;
        const newErrors = {};
        
        if (validationErrors.old_password) {
          newErrors.currentPassword = validationErrors.old_password[0] || 'Current password is required';
        }
        if (validationErrors.new_password) {
          newErrors.newPassword = validationErrors.new_password[0] || 'Invalid new password';
        }
        if (validationErrors.new_password_confirmation) {
          newErrors.confirmPassword = validationErrors.new_password_confirmation[0] || 'Passwords do not match';
        }
        
        setErrors(newErrors);
      } else {// Generic error
        setErrors({ submit: error.message || 'Failed to change password' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-xs bg-black/25 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-teal-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-800">Change Password</h1>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {errors.submit && (
            <div className={`p-4 rounded-xl ${
                errors.restrictionData ? 'bg-orange-50 border border-orange-200' : 'bg-red-50 border border-red-200'
            }`}>
                <p className={`text-sm ${
                errors.restrictionData ? 'text-orange-600' : 'text-red-600'
                }`}>
                {errors.submit}
                </p>
                {errors.restrictionData && (
                <div className="mt-3 space-y-2">
                    <p className="text-xs text-gray-600">
                    ⚠️ Your account is NOT locked. Only the password change feature is temporarily restricted.
                    </p>
                    <div className="flex gap-2">
                    <button 
                        onClick={() => setIsShowPasswordResetModal(true)}
                        className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                    >
                        Use Forgot Password
                    </button>
                    </div>
                </div>
                )}
            </div>
        )}

        {/* Show remaining attempts warning */}
        {errors.remainingAttempts !== undefined && errors.remainingAttempts > 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-sm text-yellow-700">
            ⚠️ {errors.remainingAttempts} attempt(s) remaining before password change is temporarily restricted.
            </p>
        </div>
        )}

        {/* Show remaining attempts warning */}
        {errors.remainingAttempts !== undefined && errors.remainingAttempts > 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-sm text-yellow-700">
            ⚠️ {errors.remainingAttempts} attempt(s) remaining before password change is temporarily restricted.
            </p>
        </div>
        )}
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.currentPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your current password"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.newPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your new password"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Confirm your new password"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <button onClick={() => setIsShowPasswordResetModal(true)} className="text-teal-600 hover:text-teal-700 transition-colors">Forgot Password?</button>
            
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-teal-700 text-white rounded-xl font-semibold hover:bg-teal-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Key className="w-5 h-5" />
                  Change Password
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
      {isShowPasswordResetModal && (
      <PasswordResetModal 
            isOpen={isShowPasswordResetModal} 
            onClose={() => setIsShowPasswordResetModal(false)} 
            onSuccess={() => {
                setIsShowPasswordResetModal(false);
                onClose();
            }}
        />
        )}
    </div>
  );
};

export default StudentPasswordChangeModal;