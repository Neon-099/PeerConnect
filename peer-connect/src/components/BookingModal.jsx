import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, DollarSign, BookOpen, MessageSquare, CheckCircle } from 'lucide-react';
import {apiClient} from '../utils/api';

const BookingModal = ({ isOpen, onClose, tutor, onBookSession }) => {
  const [formData, setFormData] = useState({
    session_date: '',
    start_time: '',
    end_time: '',
    custom_subject: '',
    notes: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [details, setDetails] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchDetails();
    }
  }, [isOpen]);


  const fetchDetails = async () => {
    try {
      const tutorId = tutor?.user_id || tutor?.id;
      
      if(!tutorId){
        console.error('Tutor ID not found');
        setDetails(null);
        return;
      }

      const response = await apiClient.get(`/api/student/tutors/${tutorId}`);
      console.log('Details booking: ', response);
      setDetails(response);
    } catch (err){
      console.error('Error fetching details:', err);
      setDetails(null);
    }
  }

  // Get available dates from tutor availability
  const getAvailableDates = () => {
    if (!details?.availability || !Array.isArray(details.availability)) {
      return [];
    }
    
    // Filter only available slots and extract dates
    const availableDates = details.availability
      .filter(slot => slot.is_available === true || slot.is_available === 1)
      .map(slot => slot.availability_date)
      .filter(date => {
        // Only include future dates or today
        const dateObj = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dateObj.setHours(0, 0, 0, 0);
        return dateObj >= today;
      })
      .sort(); // Sort dates chronologically
    
    return availableDates;
  };

  // Check if selected date is in tutor's available dates
  const isDateAvailable = (date) => {
    const availableDates = getAvailableDates();
    return availableDates.includes(date);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.session_date) {
      newErrors.session_date = 'Date is required';
    } else if (!isDateAvailable(formData.session_date)) {
      newErrors.session_date = 'Selected date is not available. Please choose from tutor\'s available dates.';
    }
    
    if (!formData.start_time) newErrors.start_time = 'Start time is required';
    if (!formData.end_time) newErrors.end_time = 'End time is required';
    
    if (!formData.custom_subject.trim()) {
      newErrors.custom_subject = 'Custom subject is required';
    }
    
    if (formData.start_time && formData.end_time) {
      const start = new Date(`2000-01-01T${formData.start_time}`);
      const end = new Date(`2000-01-01T${formData.end_time}`);
      const duration = (end - start) / (1000 * 60 * 60);
      
      if (duration < 1) {
        newErrors.end_time = 'Minimum session duration is 1 hour';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const bookingData = {
        tutor_id: tutor.user_id || tutor?.id,  //FALLBACK TO ID IF USER_ID IS NOT AVAILABLE
        session_date: formData.session_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        notes: formData.notes || '', //IF EMPTY MAKE SURE A STRING
        custom_subject: formData.custom_subject.trim()
      };

      // Only include custom_subject if it's not empty
      if (formData.custom_subject.trim()) {
        bookingData.custom_subject = formData.custom_subject.trim();
      } else {
        setErrors({ general: 'Subject is required' });
        setIsLoading(false);
        return;
      }

      console.log('Sending booking data:', bookingData); // Debug log

      const response = await fetch('http://localhost:8000/api/student/book-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pc_access_token')}`
        },
        body: JSON.stringify(bookingData)
      });

      console.log('Response status:', response.status);
      
      const result = await response.json();
      console.log('Result data:', result);

      if (result.success) {
        onBookSession(result.data);
        onClose();
      } else {
        setErrors({ general: result.message || 'Failed to book session' });
      }
    } catch (error) {
      console.error('Booking error:', error);
      setErrors({ general: 'Failed to book session. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCost = () => {
    if (formData.start_time && formData.end_time && tutor?.hourly_rate) {
      const start = new Date(`2000-01-01T${formData.start_time}`);
      const end = new Date(`2000-01-01T${formData.end_time}`);
      const duration = (end - start) / (1000 * 60 * 60);
      return duration * tutor?.hourly_rate;
    }
    return 0;
  };

  const formatAvailabilityDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (!isOpen) return null;

  const availableDates = getAvailableDates();

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/25 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Book Session with {tutor?.first_name} {tutor?.last_name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tutor Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Tutor Information</h3>
            <div className="flex items-center gap-4">
              <img 
                src={details?.profile_picture || '/default-avatar.png'} 
                alt={tutor?.first_name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className="font-medium">{tutor?.first_name} {tutor?.last_name}</p>
                <p className="text-sm text-gray-600">${tutor?.hourly_rate}/hour</p>
              </div>
            </div>
          </div>

          {/* Tutor Availability */}
          {availableDates.length > 0 ? (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Available Dates ({availableDates.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availableDates.slice(0, 9).map((date, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-blue-700">
                    <CheckCircle className="w-3 h-3" />
                    <span>{formatAvailabilityDate(date)}</span>
                  </div>
                ))}
                {availableDates.length > 9 && (
                  <div className="text-sm text-blue-600">
                    +{availableDates.length - 9} more dates
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-yellow-800 text-sm">
                ⚠️ This tutor hasn't set their availability yet. Please contact them directly or check back later.
              </p>
            </div>
          )}

          {/* Session Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-2" />
                Session Date
                {availableDates.length > 0 && (
                  <span className="text-xs text-gray-500 ml-1">(Select from available dates)</span>
                )}
              </label>
              
              {availableDates.length > 0 ? (
                // Use select dropdown when dates are limited
                <select
                  value={formData.session_date}
                  onChange={(e) => setFormData({...formData, session_date: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                    errors.session_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a date</option>
                  {availableDates.map((date, index) => (
                    <option key={index} value={date}>
                      {formatAvailabilityDate(date)} ({new Date(date).toLocaleDateString('en-US', { weekday: 'long' })})
                    </option>
                  ))}
                </select>
              ) : (
                // Fallback to date input if no availability (though this should be disabled)
                <input
                  type="date"
                  value={formData.session_date}
                  onChange={(e) => setFormData({...formData, session_date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  disabled={availableDates.length === 0}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                    errors.session_date ? 'border-red-500' : 'border-gray-300'
                  } ${availableDates.length === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
              )}
              
              {errors.session_date && <p className="text-red-500 text-sm mt-1">{errors.session_date}</p>}
              {availableDates.length === 0 && (
                <p className="text-yellow-600 text-sm mt-1">
                  Cannot book: Tutor hasn't set availability dates
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <BookOpen size={16} className="inline mr-2" />
                Subject
              </label>
              
              {/* Subject Selection Toggle */}
                <input
                  type="text"
                  value={formData.custom_subject}
                  onChange={(e) => setFormData({...formData, custom_subject: e.target.value})}
                  placeholder="Enter custom subject (e.g., Advanced Calculus, Organic Chemistry)"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                    errors.custom_subject ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              
              {(errors.subject_id || errors.custom_subject) && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.subject_id || errors.custom_subject}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock size={16} className="inline mr-2" />
                Start Time
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                  errors.start_time ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.start_time && <p className="text-red-500 text-sm mt-1">{errors.start_time}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock size={16} className="inline mr-2" />
                End Time
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                  errors.end_time ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.end_time && <p className="text-red-500 text-sm mt-1">{errors.end_time}</p>}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare size={16} className="inline mr-2" />
              Notes for Tutor (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              placeholder="Any specific topics you'd like to cover or questions you have..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Cost Summary */}
          {formData.start_time && formData.end_time && (
            <div className="bg-teal-50 p-4 rounded-lg">
              <h3 className="font-semibold text-teal-800 mb-2">Session Cost</h3>
              <div className="flex justify-between items-center">
                <span className="text-teal-700">
                  Duration: {(() => {
                    const start = new Date(`2000-01-01T${formData.start_time}`);
                    const end = new Date(`2000-01-01T${formData.end_time}`);
                    const duration = (end - start) / (1000 * 60 * 60);
                    return `${duration.toFixed(1)} hour${duration !== 1 ? 's' : ''}`;
                  })()}
                </span>
                <span className="font-bold text-teal-800">
                  <DollarSign size={16} className="inline mr-1" />
                  {calculateCost().toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              {isLoading ? 'Booking...' : 'Book Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;