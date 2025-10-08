import React, { useState, useEffect } from 'react';
import { X, Mail, CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { auth } from '../utils/auth';

const EmailVerificationModal = ({ isOpen, onClose, email, onVerified }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(900); // 15 minutes
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60); // 1 minute cooldown

  useEffect(() => {
    if (isOpen) {
      setCountdown(900);
      startCountdown();
    }
  }, [isOpen]);

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
    setCanResend(false);
    setResendCountdown(60);
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

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // This would be implemented when email verification is added to the backend
      // const response = await auth.verifyEmailCode(email, code);
      
      // For now, simulate verification
      if (code.length === 6) {
        setSuccess('Email verified successfully!');
        setTimeout(() => {
          onVerified();
          onClose();
        }, 2000);
      } else {
        setError('Please enter a valid 6-digit code');
      }
    } catch (err) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');

    try {
      // This would be implemented when email verification is added to the backend
      // await auth.resendVerificationCode(email);
      
      setSuccess('Verification code resent to your email!');
      setCountdown(900);
      startCountdown();
      startResendCountdown();
    } catch (err) {
      setError(err.message || 'Failed to resend verification code');
    } finally {
      setLoading(false);
    }
  };
  
  const handleClose = () => {
    setCode('');
    setError('');
    setSuccess('');
    setCountdown(0);
    setResendCountdown(0);
    setCanResend(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Verify Your Email
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
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Check your email
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              We've sent a 6-digit verification code to
            </p>
            <p className="text-sm font-medium text-gray-900">{email}</p>
            
            {countdown > 0 && (
              <div className="flex items-center justify-center space-x-1 text-orange-600 text-sm mt-2">
                <Clock size={14} />
                <span>Code expires in {formatTime(countdown)}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setError('');
                }}
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
              disabled={loading || countdown === 0 || code.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Didn't receive the code?
              </p>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={!canResend || loading}
                className="text-blue-600 hover:text-blue-800 disabled:text-gray-400 font-medium text-sm flex items-center justify-center mx-auto"
              >
                {loading ? (
                  <RefreshCw size={14} className="animate-spin mr-1" />
                ) : (
                  <RefreshCw size={14} className="mr-1" />
                )}
                {canResend ? 'Resend Code' : `Resend in ${resendCountdown}s`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationModal;