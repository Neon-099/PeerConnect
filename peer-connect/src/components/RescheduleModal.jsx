import React, { useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { apiClient } from '../utils/api';

const RescheduleModal = ({ isOpen, onClose, session, userRole, onRescheduleSuccess }) => {
  const [formData, setFormData] = useState({
    new_date: '',
    new_start_time: '',
    new_end_time: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [newTotalCost, setNewTotalCost] = useState(null); // Add this state

  // NEW: tutor availability state
  const [availableDates, setAvailableDates] = useState([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  // Helper: derive tutorId from session
  const getTutorIdFromSession = () => {
    return (
      session?.tutor_id ||
      session?.tutor_user_id ||
      session?.tutorId ||
      session?.tutor?.user_id ||
      session?.tutor?.id ||
      null
    );
  };

  React.useEffect(() => {
    if (isOpen && session) {
      // Pre-fill with current session data
      // FIX: Extract just the date part from datetime string
      const sessionDate = session.session_date ? 
        session.session_date.split(' ')[0] : // Extract date part from "2025-10-22 00:00:00"
        '';
      
      setFormData({
        new_date: sessionDate,
        new_start_time: session.start_time || '',
        new_end_time: session.end_time || ''
      });
      // Calculate initial cost
      setTimeout(calculateNewTotalCost, 100);

      // NEW: fetch tutor availability for strict date selection
      const tutorId = getTutorIdFromSession();
      if (tutorId) {
        fetchTutorAvailability(tutorId, sessionDate);
      } else {
        // No tutor id -> clear availability; validation will block
        setAvailableDates([]);
      }
    }
  }, [isOpen, session]);

  const fetchTutorAvailability = async (tutorId, currentSessionDate) => {
    try {
      setIsLoadingAvailability(true);
      // Reuse same endpoint as BookingModal to get tutor details inc. availability
      const details = await apiClient.get(`/api/student/tutors/${tutorId}`);
      const slots = Array.isArray(details?.availability) ? details.availability : [];

      // Build a unique set of dates marked available (YYYY-MM-DD)
      const dateSet = new Set(
        slots
          .filter(s => s.is_available && (s.availability_date || s.date))
          .map(s => (s.availability_date || s.date))
      );

      const dates = Array.from(dateSet).sort((a, b) => new Date(a) - new Date(b));

      setAvailableDates(dates);

      // If the current prefilled date is not in available dates, clear it to force a valid pick
      if (currentSessionDate && !dateSet.has(currentSessionDate)) {
        setFormData(prev => ({ ...prev, new_date: '' }));
        setErrors(prev => ({ ...prev, new_date: 'Please select an available date for this tutor' }));
      }
    } catch (e) {
      console.error('Failed to load tutor availability:', e);
      setAvailableDates([]);
      setErrors(prev => ({ ...prev, new_date: 'Unable to load tutor availability. Please try again.' }));
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  const calculateNewTotalCost = () => {
    if (formData.new_start_time && formData.new_end_time && session?.hourly_rate) {
      const startTime = new Date(`2000-01-01T${formData.new_start_time}`);
      const endTime = new Date(`2000-01-01T${formData.new_end_time}`);
      const duration = (endTime - startTime) / (1000 * 60 * 60); // Convert to hours
      
      if (duration > 0) {
        const cost = duration * session.hourly_rate;
        setNewTotalCost(cost.toFixed(2));
      } else {
        setNewTotalCost(null);
      }
    } else {
      setNewTotalCost(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // NEW: If changing the date, strictly enforce allowed dates
    if (name === 'new_date') {
      if (value && !availableDates.includes(value)) {
        setErrors(prev => ({ ...prev, new_date: 'Selected date is not available for this tutor' }));
        // Keep the previous valid date (do not update)
        return;
      }
    }

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
    
    // Recalculate cost when time changes
    if (name === 'new_start_time' || name === 'new_end_time') {
      setTimeout(calculateNewTotalCost, 100); // Small delay to ensure state is updated
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.new_date) {
      newErrors.new_date = 'Date is required';
    } else {
      const selectedDate = new Date(formData.new_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.new_date = 'Date cannot be in the past';
      }
      // NEW: ensure selected date is in allowed availability
      if (!availableDates.includes(formData.new_date)) {
        newErrors.new_date = 'Please select a date from the tutor’s available days';
      }
    }
    
    if (!formData.new_start_time) {
      newErrors.new_start_time = 'Start time is required';
    }
    
    if (!formData.new_end_time) {
      newErrors.new_end_time = 'End time is required';
    }
    
    if (formData.new_start_time && formData.new_end_time) {
      const startTime = new Date(`2000-01-01T${formData.new_start_time}`);
      const endTime = new Date(`2000-01-01T${formData.new_end_time}`);
      
      if (endTime <= startTime) {
        newErrors.new_end_time = 'End time must be after start time';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const endpoint = userRole === 'student' ? 
        `/api/student/sessions/${session.id}/reschedule` : 
        `/api/tutor/sessions/${session.id}/reschedule`;
      
      await apiClient.post(endpoint, formData);
      
      alert('Session rescheduled successfully!');
      onRescheduleSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error rescheduling session:', error);
      alert('Failed to reschedule session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/25 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-teal-600" />
            <h2 className="text-xl font-bold text-gray-900">Reschedule Session</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Current Session Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Current Session</h3>
              <div className="text-sm text-gray-600">
                <p><strong>Date:</strong> {new Date(session?.session_date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {session?.start_time} - {session?.end_time}</p>
                <p><strong>Subject:</strong> {session?.subject_name}</p>
              </div>
            </div>

            {/* New Date - STRICT to available dates */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Date
              </label>

              {/* If we have availability, show a strict dropdown of only valid dates */}
              {availableDates.length > 0 ? (
                <select
                  name="new_date"
                  value={formData.new_date}
                  onChange={handleInputChange}
                  disabled={isLoadingAvailability}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    errors.new_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="" disabled>{isLoadingAvailability ? 'Loading...' : 'Select an available date'}</option>
                  {availableDates.map(d => (
                    <option key={d} value={d}>
                      {new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </option>
                  ))}
                </select>
              ) : (
                // Fallback: if we don't have availability, keep input but validation will block
                <input
                  type="date"
                  name="new_date"
                  value={formData.new_date}
                  onChange={handleInputChange}
                  disabled={isLoadingAvailability}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    errors.new_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              )}

              {errors.new_date && (
                <p className="text-red-500 text-sm mt-1">{errors.new_date}</p>
              )}
            </div>

            {/* New Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Start Time
              </label>
              <input
                type="time"
                name="new_start_time"
                value={formData.new_start_time}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.new_start_time ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.new_start_time && (
                <p className="text-red-500 text-sm mt-1">{errors.new_start_time}</p>
              )}
            </div>

            {/* New End Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New End Time
              </label>
              <input
                type="time"
                name="new_end_time"
                value={formData.new_end_time}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.new_end_time ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.new_end_time && (
                <p className="text-red-500 text-sm mt-1">{errors.new_end_time}</p>
              )}
            </div>

            {/* New Total Cost Display */}
            {newTotalCost && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-700 mb-2">New Session Cost</h3>
                <div className="text-lg font-semibold text-blue-900">
                  Php: {newTotalCost}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Based on php: {session?.hourly_rate}/hour rate
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Rescheduling...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  Reschedule Session
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RescheduleModal;