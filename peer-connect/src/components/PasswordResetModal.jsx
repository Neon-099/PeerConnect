// peer-connect/src/components/PasswordResetModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Clock, Shield, Info, RefreshCw } from 'lucide-react';
import { auth } from '../utils/auth';
import toast, { Toaster } from 'react-hot-toast';

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
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Toast notification configuration
  const showToast = (message, type = 'success') => {
    if (type === 'success') {
      toast.success(message, {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#10B981',
          color: '#fff',
        },
      });
    } else if (type === 'error') {
      toast.error(message, {
        duration: 5000,
        position: 'top-center',
        style: {
          background: '#EF4444',
          color: '#fff',
        },
      });
    } else if (type === 'loading') {
      toast.loading(message, {
        duration: 2000,
        position: 'top-center',
      });
    }
  };

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

    // Show loading toast
    const loadingToast = toast.loading('Sending reset code...', {
      duration: 2000,
    });

    try {
      const response = await auth.requestPasswordReset(formData.email);

      if (response && (response.token) || (response.data && response.data.token)) {
        const token = response.token || response.data.token;
        console.log('token set: ', token);

        setStep(2);   
        setResetToken(token);
        setSuccess('Password reset code sent to your email!');
        
        setCountdown(900); // 15 minutes countdown
        setResendCountdown(60); // 1 minute before can resend
        setCanResend(false);
        
        //START NEW TIMERS
        startCountdown();
        startResendCountdown();

        console.log('moving to step 2: ', step);
        // Dismiss loading toast and show success
        toast.dismiss(loadingToast);
        showToast('Reset code sent! Check your email inbox and spam folder.', 'success');
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      
      if (err.message.includes('Google sign-in')) {
        setError('This account uses Google sign-in. Please use "Sign in with Google" instead.');
        showToast('This account uses Google sign-in. Please use "Sign in with Google" instead.', 'error');
      } else {
        setError(err.message || 'Failed to send reset code');
        showToast(err.message || 'Failed to send reset code. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const loadingToast = toast.loading('Verifying code...', {
      duration: 2000,
    });

    try {
      const response = await auth.verifyResetCode(resetToken, formData.code);

      console.log('CHECK response for verify code', response)

    if (response && response.success === true) {
        setSuccess('Code verified! Please enter your new password.');
        setStep(3);  //STEP 2  
        console.log("step 3: ", step);
        toast.dismiss(loadingToast);
        showToast('Code verified successfully! Please create your new password.', 'success');
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      setError(err.message || 'Invalid verification code');
      showToast(err.message || 'Invalid verification code. Please try again.', 'error');
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
      showToast('Passwords do not match. Please check and try again.', 'error');
      setLoading(false);
      return;
    }

    if (passwordStrength < 3) {
      setError('Password is too weak. Please choose a stronger password.');
      showToast('Password is too weak. Please choose a stronger password.', 'error');
      setLoading(false);
      return;
    }

    const loadingToast = toast.loading('Resetting password...', {
      duration: 2000,
    });

    try {
      const response = await auth.resetPassword(resetToken, formData.code, formData.password);

      if (response && Object.keys(response).length > 0) {
        setSuccess('Password reset successful! You can now login with your new password.');
        toast.dismiss(loadingToast);
        showToast('Password reset successful! You can now login with your new password.', 'success');
        
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      setError(err.message || 'Failed to reset password');
      showToast(err.message || 'Failed to reset password. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    
    setLoading(true);
    setError('');

    const loadingToast = toast.loading('Resending code...', {
      duration: 2000,
    });

    try {
      const response = await auth.requestPasswordReset(formData.email);

      if (response && Object.keys(response).length > 0) {
        setResetToken(response.token);
        setSuccess('New verification code sent to your email!');
        
        setCountdown(900); // Reset 15 minutes countdown
        setResendCountdown(60); // Reset 1 minute countdown
        setCanResend(false);

        startCountdown();
        startResendCountdown();
        
        toast.dismiss(loadingToast);
        showToast('New verification code sent! Check your email.', 'success');
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      setError(err.message || 'Failed to resend code');
      showToast(err.message || 'Failed to resend code. Please try again.', 'error');
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

  const startResendCountdown = () => {
    const timer = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
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
    setCanResend(false);
    setResendCountdown(0);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // ADD useEffect cleanup:
  // useEffect(() => {
  //   return () => {
  //     // Cleanup timers on component unmount
  //     if (countdownTimer) clearInterval(countdownTimer);
  //     if (resendTimer) clearInterval(resendTimer);
  //   };
  // }, [countdownTimer, resendTimer]);

  if (!isOpen) return null;

  return (
    <>
      <Toaster />
      <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
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
                  <p className="text-sm text-gray-600 mb-4">
                    We'll send you a verification code to reset your password
                  </p>
                  
                  {/* Clear Instructions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                    <div className="flex items-start space-x-2">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">What happens next:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>We'll send a 6-digit code to your email</li>
                          <li>The code expires in 15 minutes</li>
                          <li>Check your spam folder if you don't see it</li>
                          <li>You can request a new code after 1 minute</li>
                        </ul>
                      </div>
                    </div>
                  </div>
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
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Code'
                  )}
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
                  <p className="text-sm text-gray-600 mb-4">
                    Check your email for the 6-digit code sent to <strong>{formData.email}</strong>
                  </p>
                  
                  {/* Clear Instructions */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
                    <div className="flex items-start space-x-2">
                      <Info className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-green-800">
                        <p className="font-medium mb-1">Code verification tips:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>Enter the 6-digit code exactly as shown</li>
                          <li>No spaces or special characters needed</li>
                          <li>Code is case-sensitive</li>
                          <li>If you don't see the email, check your spam folder</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {countdown >= 0 && (
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
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </button>

                {/* Resend Code Button */}
                <div className="text-center">
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={loading}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
                    >
                      Resend Code
                    </button>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      Resend code in {resendCountdown}s
                    </p>
                  )}
                </div>

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
                  <p className="text-sm text-gray-600 mb-4">
                    Choose a strong password for your account
                  </p>
                  
                  {/* Clear Instructions */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-left">
                    <div className="flex items-start space-x-2">
                      <Info className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-purple-800">
                        <p className="font-medium mb-1">Password requirements:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>At least 8 characters long</li>
                          <li>Include uppercase and lowercase letters</li>
                          <li>Include numbers and special characters</li>
                          <li>Make it unique and memorable</li>
                        </ul>
                      </div>
                    </div>
                  </div>
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
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
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
    </>
  );
};

export default PasswordResetModal;