import React, { useState } from 'react';
import { Star, MapPin, Clock, BookOpen, CheckCircle, Users, Calendar } from 'lucide-react';
import BookingModal from './BookingModal.jsx';
import { useNavigate } from 'react-router-dom';


const MatchingResults = ({ matches, type = 'tutors', onViewProfile, getProfilePictureUrl }) => {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState(null);

  // Helper function to get profile picture URL - works for both tutors and students
  const getImageUrl = (profilePicture) => {
    if (!profilePicture) {
      return "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop";
    }
    
    // If it's already a full HTTP URL (from Cloudinary or external), use it directly
    if (profilePicture.startsWith('http://') || profilePicture.startsWith('https://')) {
      return profilePicture;
    }
    
    // If it's a relative path, construct the full URL
    // For tutor images from Cloudinary, they should already be full URLs
    // But if they're stored locally, we construct the path
    const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
    return `${apiBase}/${profilePicture}`;
  };

  const getMatchColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600 bg-green-50';
    if (percentage >= 70) return 'text-blue-600 bg-blue-50';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getMatchLabel = (percentage) => {
    if (percentage >= 90) return 'Excellent Match';
    if (percentage >= 70) return 'Great Match';
    if (percentage >= 50) return 'Good Match';
    return 'Fair Match';
  };

  const handleBookSession = (tutor) => {
    setSelectedTutor(tutor);
    setShowBookingModal(true);
  };

  const handleBookingSuccess = (bookingResult) => {
    // Show success notification
    alert(`Session booked successfully! Total cost: $${bookingResult.total_cost}`);
    setShowBookingModal(false);
    setSelectedTutor(null);
  };

  console.log('matches', matches);
  console.log('getImageUrl', getImageUrl(matches[0].profile_picture));
  return (
    <>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {matches.map((match, index) => (
          <div key={match.user_id || match.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <img
                  src={getImageUrl(match.profile_picture)}
                  alt={`${match.first_name} ${match.last_name}`}
                  className="w-16 h-16 rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop";
                  }}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {match.first_name} {match.last_name}
                    </h3>
                    {match.is_verified_tutor && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{match.bio}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {match.campus_location === 'main_campus' ? 'Main Campus' : 'PUCU'}
                    </div>
                    {type === 'tutors' && (
                      <>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 mr-1" />
                          {match.average_rating ? `${match.average_rating}/5` : 'No rating'}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {match.available_slots} slots
                        </div>
                        <div className="flex items-center">
                          <span className="text-teal-600 font-medium">₱{match.hourly_rate}/hr</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getMatchColor(match.match_percentage)}`}>
                  {match.match_percentage}% Match
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {getMatchLabel(match.match_percentage)}
                </div>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Match Details:</h4>
                <ul className="space-y-1">
                  {Object.entries(match.match_details || {}).map(([key, value]) => (
                    <li key={key} className="flex items-center text-gray-600">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                      <span className="truncate">{value}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 mb-2">
                  {type === 'tutors' ? 'Specializations:' : ''}
                </h4>
                <div className="flex flex-wrap gap-1">
                  {(type === 'tutors' ? (match.specializations || []) : (match.subjects_of_interest || []))?.slice(0, 3).map((subject, idx) => (
                    <span key={idx} className="px-2 py-1 bg-teal-50 text-teal-700 rounded text-xs">
                      {subject}
                    </span>
                  ))}
                  {(type === 'tutors' ? (match.specializations || []) : (match.subjects_of_interest || []))?.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      +{(type === 'tutors' ? (match.specializations || []) : (match.subjects_of_interest || [])).length - 3} more
                    </span>
                  )}
                  {(type === 'tutors' && (!match.specializations || match.specializations.length === 0)) && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-400 rounded text-xs italic">
                      No specializations listed
                    </span>
                  )}
                </div>
              </div>
              
            </div>
            
            <div className="mt-4 flex justify-end space-x-2">
              {/* View Profile Button - Show for both tutors and students */}
              {onViewProfile && (
                <button 
                  onClick={() => onViewProfile(match)}
                  className={`px-4 py-2 border rounded-lg hover:transition-colors flex items-center gap-2 ${
                    type === 'tutors' 
                      ? 'border-gray-300 text-gray-700 hover:bg-gray-50' 
                      : 'border-blue-300 text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  View Profile
                </button>
              )}
              
              {/* Book Session Button - Only for tutors */}
              {type === 'tutors' ? (
                <button 
                  onClick={() => handleBookSession(match)}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Book Session
                </button>
              ) : (
                // For students, show a contact button or leave empty if not needed
                null
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedTutor && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedTutor(null);
          }}
          tutor={selectedTutor}
          onBookSession={handleBookingSuccess}
        />
      )}
    </>
  );
};

export default MatchingResults;