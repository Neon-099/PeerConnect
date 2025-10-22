import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, DollarSign, BookOpen, MessageSquare, CheckCircle } from 'lucide-react';

const BookingModal = ({ isOpen, onClose, tutor, onBookSession }) => {
  const [formData, setFormData] = useState({
    session_date: '',
    start_time: '',
    end_time: '',
    subject_id: '',
    custom_subject: '',
    notes: '',
    session_type: 'virtual'
  });
  const [subjects, setSubjects] = useState([
    { id: 1, name: 'Mathematics' },
    { id: 2, name: 'Physics' },
    { id: 3, name: 'Chemistry' },
    { id: 4, name: 'Biology' },
    { id: 5, name: 'English' },
    { id: 6, name: 'History' },
    { id: 7, name: 'Geography' },
    { id: 8, name: 'Computer Science' },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [useCustomSubject, setUseCustomSubject] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSubjects();
    }
  }, [isOpen]);

  const fetchSubjects = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/subjects');
      const data = await response.json();
      if (data.success) {
        setSubjects(data.data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.session_date) newErrors.session_date = 'Date is required';
    if (!formData.start_time) newErrors.start_time = 'Start time is required';
    if (!formData.end_time) newErrors.end_time = 'End time is required';
    
    if (!useCustomSubject && !formData.subject_id) {
      newErrors.subject_id = 'Subject is required';
    }
    if (useCustomSubject && !formData.custom_subject.trim()) {
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
        tutor_id: tutor.user_id,
        session_date: formData.session_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        notes: formData.notes,
        session_type: formData.session_type
      };

      // Add subject data based on selection
      if (useCustomSubject) {
        bookingData.custom_subject = formData.custom_subject;
      } else {
        bookingData.subject_id = parseInt(formData.subject_id);
      }


      const response = await fetch('http://localhost:8000/api/student/book-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pc_access_token')}`
        },
        body: JSON.stringify(bookingData)
      });

      console.log('Response:', response.status);
      console.log('Response:', response.headers);

      const result = await response.json();
      console.log('Result data:', result)

      if (result.success) {
        onBookSession(result.data);
        onClose();
      } else {
        setErrors({ general: result.message });
      }
    } catch (error) {
      setErrors({ general: 'Failed to book session' });
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
                src={tutor?.profile_picture || '/default-avatar.png'} 
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
          {tutor?.availability && tutor?.availability.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Tutor Availability
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {tutor?.availability
                  .filter(slot => slot.is_available)
                  .slice(0, 6)
                  .map((slot, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-blue-700">
                      <CheckCircle className="w-3 h-3" />
                      <span>{formatAvailabilityDate(slot.availability_date)}</span>
                    </div>
                  ))}
                {tutor?.availability.filter(slot => slot.is_available).length > 6 && (
                  <div className="text-sm text-blue-600">
                    +{tutor?.availability.filter(slot => slot.is_available).length - 6} more dates
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Session Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-2" />
                Session Date
              </label>
              <input
                type="date"
                value={formData.session_date}
                onChange={(e) => setFormData({...formData, session_date: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                  errors.session_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.session_date && <p className="text-red-500 text-sm mt-1">{errors.session_date}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <BookOpen size={16} className="inline mr-2" />
                Subject
              </label>
              
              {/* Subject Selection Toggle */}
              <div className="flex gap-4 mb-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!useCustomSubject}
                    onChange={() => setUseCustomSubject(false)}
                    className="mr-2"
                  />
                  Select from list
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={useCustomSubject}
                    onChange={() => setUseCustomSubject(true)}
                    className="mr-2"
                  />
                  Custom subject
                </label>
              </div>

              {!useCustomSubject ? (
                <select
                  value={formData.subject_id}
                  onChange={(e) => setFormData({...formData, subject_id: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                    errors.subject_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a subject</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.custom_subject}
                  onChange={(e) => setFormData({...formData, custom_subject: e.target.value})}
                  placeholder="Enter custom subject (e.g., Advanced Calculus, Organic Chemistry)"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                    errors.custom_subject ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              )}
              
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

          {/* Session Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Session Type</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="virtual"
                  checked={formData.session_type === 'virtual'}
                  onChange={(e) => setFormData({...formData, session_type: e.target.value})}
                  className="mr-2"
                />
                Virtual
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="in_person"
                  checked={formData.session_type === 'in_person'}
                  onChange={(e) => setFormData({...formData, session_type: e.target.value})}
                  className="mr-2"
                />
                In-Person
              </label>
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
                    return `${duration} hour${duration > 1 ? 's' : ''}`;
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