import React, { useState } from 'react';
import { X, Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Clock, Shield } from 'lucide-react';
import { auth } from '../../utils/auth';

const PasswordResetModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: email, 2: code verification, 3: new password
  const [formData, setFormData] = useState({
    email: '',
    code: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    
    // Check password strength
    if (e.target.name === 'password') {
      setPasswordStrength(calculatePasswordStrength(e.target.value));
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthColor = (strength) => {
    if (strength <= 2) return 'text-red-500';
    if (strength <= 3) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getPasswordStrengthText = (strength) => {
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Medium';
    return 'Strong';
  };

  const handleSendResetCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await auth.requestPasswordReset(formData.email);

      if (response.success) {
        setResetToken(response.token); // For development
        setSuccess('Password reset code sent to your email!');
        setStep(2);
        setCountdown(900); // 15 minutes countdown
        startCountdown();
      }
    } catch (err) {
      setError(err.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await auth.verifyResetCode(resetToken, formData.code);

      if (response.success) {
        setSuccess('Code verified! Please enter your new password.');
        setStep(3);
      }
    } catch (err) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordStrength < 3) {
      setError('Password is too weak. Please choose a stronger password.');
      setLoading(false);
      return;
    }

    try {
      const response = await auth.resetPassword(resetToken, formData.code, formData.password);

      if (response.success) {
        setSuccess('Password reset successful! You can now login with your new password.');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = () => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetModal = () => {
    setStep(1);
    setFormData({ email: '', code: '', password: '', confirmPassword: '' });
    setError('');
    setSuccess('');
    setResetToken('');
    setCountdown(0);
    setPasswordStrength(0);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {step === 1 && 'Reset Password'}
            {step === 2 && 'Verify Code'}
            {step === 3 && 'New Password'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Email Input */}
          {step === 1 && (
            <form onSubmit={handleSendResetCode} className="space-y-4">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Enter your email address
                </h3>
                <p className="text-sm text-gray-600">
                  We'll send you a verification code to reset your password
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center space-x-2 text-green-600 text-sm">
                  <CheckCircle size={16} />
                  <span>{success}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          )}

          {/* Step 2: Code Verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Enter verification code
                </h3>
                <p className="text-sm text-gray-600">
                  Check your email for the 6-digit code
                </p>
                {countdown > 0 && (
                  <div className="flex items-center justify-center space-x-1 text-orange-600 text-sm mt-2">
                    <Clock size={14} />
                    <span>Code expires in {formatTime(countdown)}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest"
                  placeholder="000000"
                  maxLength="6"
                  required
                />
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center space-x-2 text-green-600 text-sm">
                  <CheckCircle size={16} />
                  <span>{success}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || countdown === 0}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-gray-600 hover:text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Back to Email
              </button>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Create new password
                </h3>
                <p className="text-sm text-gray-600">
                  Choose a strong password for your account
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordStrength <= 2 ? 'bg-red-500' : 
                            passwordStrength <= 3 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className={`text-xs font-medium ${getPasswordStrengthColor(passwordStrength)}`}>
                        {getPasswordStrengthText(passwordStrength)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="text-xs text-gray-600 space-y-1">
                <p className="font-medium">Password must contain:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li className={formData.password.length >= 8 ? 'text-green-600' : ''}>At least 8 characters</li>
                  <li className={/[a-z]/.test(formData.password) ? 'text-green-600' : ''}>One lowercase letter</li>
                  <li className={/[A-Z]/.test(formData.password) ? 'text-green-600' : ''}>One uppercase letter</li>
                  <li className={/\d/.test(formData.password) ? 'text-green-600' : ''}>One number</li>
                  <li className={/[^a-zA-Z\d]/.test(formData.password) ? 'text-green-600' : ''}>One special character</li>
                </ul>
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )} 
              /*strik*/
              {success && (
                <div className="flex items-center space-x-2 text-green-600 text-sm">
                  <CheckCircle size={16} />
                  <span>{success}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || passwordStrength < 3}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full text-gray-600 hover:text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Back to Code Verification
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordResetModal;