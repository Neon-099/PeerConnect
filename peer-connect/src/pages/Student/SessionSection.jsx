import React, { useState, useEffect } from 'react';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';
import BookingModal from '../../components/BookingModal.jsx';
import ReviewModal from '../../components/ReviewModal.jsx';
import RescheduleModal from '../../components/RescheduleModal.jsx';

import { Calendar, Book, Users, MessageSquare, Star, RotateCcw, Clock, DollarSign, CheckCircle, Eye, XCircle } from 'lucide-react';
import { apiClient } from '../../utils/api';


const SessionSection = ({ sessions, onAction, getProfilePictureUrl, studentProfile }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);
  const [requestSessions, setRequestSessions] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedSessionForReview, setSelectedSessionForReview] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/student/sessions');
      
      if (response) {
        const allSessions = response;
        
        // Updated filtering based on new workflow
        setUpcomingSessions(allSessions.filter(s => s.status === 'confirmed')); // Confirmed sessions waiting for student to complete
        setPastSessions(allSessions.filter(s => s.status === 'completed')); // Completed sessions
        setRequestSessions(allSessions.filter(s => s.status === 'pending')); // Pending tutor confirmation
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookSession = (bookingResult) => {
    alert(`Session booked successfully! Total cost: $${bookingResult.total_cost}`);
    fetchSessions();
  };

  const handleReviewSubmitted = () => {
    fetchSessions();
  };

  const handleRateSession = (session) => {
    setSelectedSessionForReview(session);
    setShowReviewModal(true);
  };

  const handleCompleteSession = async (sessionId) => {
    if (window.confirm('Mark this session as completed?')) {
      try {
        await apiClient.post('/api/student/complete-session', { session_id: sessionId });
        alert('Session marked as completed! You can now write a review.');
        fetchSessions();
      } catch (error) {
        console.error('Error completing session:', error);
        alert('Failed to complete session. Please try again.');
      }
    }
  };

  const handleCancelSession = async (sessionId) => {
    if (window.confirm('Are you sure you want to cancel this session?')) {
      try {
        await apiClient.post(`/api/student/sessions/${sessionId}/cancel`);
        alert('Session cancelled successfully');
        fetchSessions();
      } catch (error) {
        console.error('Error cancelling session:', error);
        alert('Failed to cancel session. Please try again.');
      }
    }
  };

  const handleRescheduleSession = (session) => {
    setSelectedSession(session);
    setShowRescheduleModal(true);
  };

  const formatSessionTime = (sessionDate, startTime, endTime) => {
    const date = new Date(sessionDate);
    const start = startTime.substring(0, 5);
    const end = endTime.substring(0, 5);
    
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: `${start} - ${end}`
    };
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={`${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-xs text-gray-600 ml-1">({rating})</span>
      </div>
    );
  };

  const renderSessionCard = (session, showActions = true) => {
    const timeInfo = formatSessionTime(session.session_date, session.start_time, session.end_time);
    return (
      <div key={session.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Calendar className="text-gray-400" size={24} />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                {session.subject_name} with {session.tutor_first_name} {session.tutor_last_name}
              </h3>
              <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                <span>{timeInfo.date}</span>
                <span>•</span>
                <span>{timeInfo.time}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <DollarSign size={14} />
                  {session.total_cost}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  session.session_type === 'virtual' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-teal-100 text-teal-700'
                }`}>
                  {session.session_type === 'virtual' ? 'Virtual' : 'In-Person'}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  session.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  session.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : // Confirmed = waiting for student to complete
                  session.status === 'completed' ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {session.status === 'confirmed' ? 'Ready to Complete' : 
                   session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                </span>
              </div>
              
              {/* Status Messages */}
              {session.status === 'pending' && (
                <div className="flex items-center gap-2 text-sm text-yellow-600">
                  <Clock size={16} />
                  <span>Waiting for tutor confirmation</span>
                </div>
              )}
              
              {session.status === 'confirmed' && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <CheckCircle size={16} />
                  <span>Session confirmed - Ready to complete</span>
                </div>
              )}
              
              {/* Review Status for Completed Sessions */}
              {session.status === 'completed' && (
                <div className="flex items-center gap-2 text-sm">
                  {session.has_review ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle size={16} />
                      <span>Reviewed</span>
                      {renderStars(session.review_rating)}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-orange-600">
                      <Clock size={16} />
                      <span>Awaiting Review</span>
                    </div>
                  )}
                </div>
              )}
              
              {session.notes && (
                <p className="text-sm text-gray-600 mt-1 italic">"{session.notes}"</p>
              )}
            </div>
          </div>
          
          {showActions && (
            <div className="flex items-center gap-2">
              {session.status === 'pending' && (
                <button 
                  onClick={() => handleCancelSession(session.id)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
                >
                  Cancel Request
                </button>
              )}
              {session.status === 'confirmed' && (
                <>
                  <button 
                    onClick={() => handleRescheduleSession(session)}
                    className="px-4 py-2 text-teal-600 hover:bg-teal-50 rounded-lg font-medium"
                  >
                    Reschedule
                  </button>
                  <button 
                    onClick={() => handleCompleteSession(session.id)}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium"
                  >
                    Complete Session
                  </button>
                  <button 
                    onClick={() => handleCancelSession(session.id)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                </>
              )}
              {session.status === 'completed' && (
                <div className="flex items-center gap-2">
                  {session.has_review ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg">
                      <CheckCircle size={16} />
                      <span className="text-sm font-medium">Reviewed</span>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleRateSession(session)}
                      className="px-4 py-2 border border-teal-600 text-teal-600 hover:bg-teal-50 rounded-lg font-medium flex items-center gap-2"
                    >
                      <Star size={16} />
                      Rate Session
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="h-23 bg-white border-b border-gray-200 flex items-center justify-between px-8">
        <div></div>
        <div className="flex items-center gap-4">
          <Header 
            userProfilePictureUrl={getProfilePictureUrl(studentProfile?.profile_picture)}
            userProfile={studentProfile?.first_name} 
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-8">    
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="max-w-6xl h-129">
            {/* Page Title and Actions */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">My Sessions</h1>
              <button 
                onClick={() => setShowBookingModal(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
              >
                <span className="text-lg">+</span>
                New Session
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-6">
                <button
                  onClick={() => setActiveTab('Upcoming')}
                  className={`pb-2 font-medium transition-colors ${
                    activeTab === 'Upcoming'
                      ? 'text-teal-600 border-b-2 border-teal-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Ready to Complete ({upcomingSessions.length})
                </button>
                <button
                  onClick={() => setActiveTab('Past')}
                  className={`pb-2 font-medium transition-colors ${
                    activeTab === 'Past'
                      ? 'text-teal-600 border-b-2 border-teal-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Completed ({pastSessions.length})
                </button>
                <button
                  onClick={() => setActiveTab('Requests')}
                  className={`pb-2 font-medium transition-colors ${
                    activeTab === 'Requests'
                      ? 'text-teal-600 border-b-2 border-teal-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Pending ({requestSessions.length})
                </button>
              </div>
            </div>

            {/* Session Lists */}
            {activeTab === 'Upcoming' && (
              <div className="space-y-3">
                {upcomingSessions.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions ready to complete</h3>
                    <p className="text-gray-600">Confirmed sessions will appear here for you to complete.</p>
                  </div>
                ) : (
                  upcomingSessions.map(session => renderSessionCard(session))
                )}
              </div>
            )}

            {activeTab === 'Past' && (
              <div className="space-y-3">
                {pastSessions.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No completed sessions</h3>
                    <p className="text-gray-600">Your completed sessions will appear here.</p>
                  </div>
                ) : (
                  pastSessions.map(session => renderSessionCard(session))
                )}
              </div>
            )}

            {activeTab === 'Requests' && (
              <div className="space-y-3">
                {requestSessions.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
                    <p className="text-gray-600">Your session requests will appear here.</p>
                  </div>
                ) : (
                  requestSessions.map(session => renderSessionCard(session))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="h-[49px] bg-white border-t border-gray-200 flex items-center justify-end px-8">
        <Footer/>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          tutor={selectedTutor}
          onBookSession={handleBookSession}
        />
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          session={selectedSessionForReview}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
      {showRescheduleModal && (
        <RescheduleModal
          isOpen={showRescheduleModal}
          onClose={() => {
            setShowRescheduleModal(false);
            setSelectedSession(null);
          }}
          session={selectedSession}
          userRole="student"
          onRescheduleSuccess={() => {
            fetchSessions();
          }}
        />
      )}
  </div>


  );
};

export default SessionSection;