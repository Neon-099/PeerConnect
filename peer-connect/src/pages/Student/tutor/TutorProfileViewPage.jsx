import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, Calendar, MapPin, Mail, Facebook, Users, GraduationCap, X, ChevronDown, Phone, Bell } from 'lucide-react';
import { apiClient } from '../../../utils/api';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import BookingModal from '../../../components/BookingModal';


// All Reviews Modal Component
const AllReviewsModal = ({ isOpen, onClose, reviews, averageRating, totalReviews, ratingDistribution }) => {
  if (!isOpen) return null;

  const getRatingPercentage = (rating) => {
    if (totalReviews === 0) return 0;
    return (ratingDistribution[rating] / totalReviews) * 100;
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/25 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">All Reviews</h2>
            <p className="text-sm text-gray-600 mt-1">{totalReviews} total reviews</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Rating Summary */}
          <div className="flex items-start gap-8 mb-8 pb-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Star className="w-10 h-10 text-yellow-500 fill-current" />
              <span className="text-5xl font-bold text-gray-900">
                {averageRating.toFixed(1)}
              </span>
            </div>
            
            <div className="flex-1">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-3 mb-2">
                  <span className="text-sm text-gray-600 w-12">{rating} star</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        getRatingPercentage(rating) > 50 ? 'bg-teal-700' : 'bg-teal-400'
                      }`}
                      style={{ width: `${getRatingPercentage(rating)}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-12 text-right">
                    {Math.round(getRatingPercentage(rating))}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* All Reviews List */}
          <div className="space-y-6">
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No reviews yet.</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                      {review.student_profile_picture ? (
                        <img 
                          src={review.student_profile_picture.startsWith('http') 
                            ? review.student_profile_picture 
                            : `${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/${review.student_profile_picture}`}
                          alt={review.student_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-500 text-sm font-semibold">
                          {review.student_name?.charAt(0) || 'S'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{review.student_name || 'Student'}</h4>
                        <span className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                      <div className="flex gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating 
                                ? 'text-yellow-500 fill-current' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {review.comment}
                      </p>
                      {review.subject && (
                        <span className="inline-block mt-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {review.subject}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TutorProfileViewPage = ({ tutor, onClose }) => {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState({5: 0, 4: 0, 3: 0, 2: 0, 1: 0});
  const [showAllReviewsModal, setShowAllReviewsModal] = useState(false);
  const [details, setDetails] = useState(null);
  const [completedSessions, setCompletedSessions] = useState(0);

  useEffect(() => {
    if (showAllReviewsModal && tutor) {
      fetchDetailsAndReviews(); // refetch stats + reviews
    }
  }, [showAllReviewsModal, tutor]);
  console.log(tutor);
  const fetchDetailsAndReviews = async () => {
    setIsLoading(true);
    try {
      const tutorId = tutor.user_id || tutor.id;
      
      // Fetch full tutor details (bio, specializations, user_profile_picture, etc.)
      const d = await apiClient.get(`/api/student/tutors/${tutorId}`);
      setDetails(d || null);

      // Fetch reviews + stats (includes average, distribution, completed_sessions)
      const r = await apiClient.get(`/api/tutor/${tutorId}/reviews`);
      setReviews(r.reviews || []);
      setAverageRating(r.average_rating || 0);
      setTotalReviews(r.total_reviews || 0);
      setRatingDistribution(r.rating_distribution || {5:0,4:0,3:0,2:0,1:0});
      setCompletedSessions(r.completed_sessions || 0);
    } catch (e) {
      console.error('Error fetching tutor profile data:', e);
      setDetails(null);
      setReviews([]);
      setAverageRating(0);
      setTotalReviews(0);
      setRatingDistribution({5:0,4:0,3:0,2:0,1:0});
      setCompletedSessions(0);
    } finally {
      setIsLoading(false);
    }
  };

  const getProfilePictureUrl = (profilePicture) => {
    if (!profilePicture) {
      return "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop";
    }
    if (profilePicture.startsWith('http')) {
      return profilePicture;
    }
    return `${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/${profilePicture}`;
  };

  const profileImg = getProfilePictureUrl(
    details?.user_profile_picture || details?.profile_picture || tutor.profile_picture
  );
  console.log('details', details);
  console.log('profileImg', profileImg);
  const getRatingPercentage = (rating) => {
    if (totalReviews === 0) return 0;
    return (ratingDistribution[rating] / totalReviews) * 100;
  };

  const getSubjectColor = (index) => {
    const colors = [
      'bg-blue-100 text-blue-700',
      'bg-green-100 text-green-700',
      'bg-purple-100 text-purple-700',
      'bg-yellow-100 text-yellow-700',
      'bg-pink-100 text-pink-700',
    ];
    return colors[index % colors.length];
  };

  const handleBookSession = () => {
    setShowBookingModal(true);
  };

  const handleBookingSuccess = async (bookingResult) => {
    setShowBookingModal(false);
    console.log('Session booked:', bookingResult);
  };

  if (!tutor) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F0F5FA]">
        <p className="text-gray-600">Tutor not found</p>
      </div>
    );
  }
  
  // Show only first 3 reviews
  const displayedReviews = reviews.slice(0, 3);
  const hasMoreReviews = reviews.length > 3;

  return (
    <div className="min-h-screen bg-[#F0F5FA] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back button and Notification Bell */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onClose}
            className="text-teal-700 hover:text-teal-800 font-medium flex items-center gap-2"
          >
            ← Back to Search
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-start gap-6">
                <div className="relative">
                  <img
                    src={profileImg}
                    alt={`${tutor.first_name} ${tutor.last_name}`}
                    className="w-24 h-24 rounded-xl object-cover border-2 border-gray-100"
                  />
                  {details?.is_verified_tutor && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-semibold text-gray-900 mb-3">
                    {details?.first_name || tutor.first_name} {details?.last_name || tutor.last_name}
                  </h1>
                </div>
                <div>
                  <button
                    onClick={handleBookSession}
                    className="px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors flex items-center gap-2"
                  >
                    <Calendar className="w-5 h-5" />
                    Book a Session
                  </button>
                </div>
              </div>
            </div>

            {/* About Me Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About Me</h2>
              <p className="text-gray-700 leading-relaxed">
                {details?.bio || tutor.bio || 'No bio provided.'}
              </p>
            </div>

            {/* Ratings & Reviews Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Ratings & Reviews</h2>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-8 mb-8">
                    <div className="flex items-center gap-2">
                      <Star className="w-8 h-8 text-yellow-500 fill-current" />
                      <span className="text-4xl font-bold text-gray-900">
                        {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      {/* Rating Distribution Bars */}
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="flex items-center gap-3 mb-2">
                          <span className="text-sm text-gray-600 w-8">{rating} star</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                getRatingPercentage(rating) > 50 ? 'bg-teal-700' : 'bg-teal-400'
                              }`}
                              style={{ width: `${getRatingPercentage(rating)}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-500 w-8">
                            {Math.round(getRatingPercentage(rating))}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Individual Reviews - Limited to 3 */}
                  <div className="space-y-6">
                    {displayedReviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                            {review.student_profile_picture ? (
                              <img 
                                src={review.student_profile_picture.startsWith('http') 
                                  ? review.student_profile_picture 
                                  : `${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/${review.student_profile_picture}`}
                                alt={review.student_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-gray-500 text-sm font-semibold">
                                {review.student_name?.charAt(0) || 'S'}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-gray-900">{review.student_name || 'Student'}</h4>
                              <span className="text-sm text-gray-500">
                                {new Date(review.created_at).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                })}
                              </span>
                            </div>
                            <div className="flex gap-1 mb-3">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= review.rating 
                                      ? 'text-yellow-500 fill-current' 
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-gray-700 leading-relaxed">
                              {review.comment}
                            </p>
                            {review.subject && (
                              <span className="inline-block mt-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {review.subject}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {reviews.length === 0 && (
                      <p className="text-gray-500 text-center py-8">No reviews yet.</p>
                    )}

                    {/* See All Reviews Button */}
                    {hasMoreReviews && (
                      <div className="flex justify-center pt-4">
                        <button
                          onClick={() => setShowAllReviewsModal(true)}
                          className="flex items-center gap-2 px-6 py-3 bg-white text-teal-600 border-2 border-teal-600 hover:bg-teal-50 rounded-lg font-semibold transition-all"
                        >
                          <ChevronDown className="w-5 h-5" />
                          See All Reviews ({totalReviews})
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Subjects Taught */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Subjects Taught</h2>
              <div className="flex flex-wrap gap-2">
                {(details?.specializations || tutor.specializations || []).map((subject, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getSubjectColor(index)}`}
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>

            {/* Other Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Other Info</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">{details?.email || tutor.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">{details?.cp_number || tutor.cp_number || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                  <Facebook className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Facebook Profile</p>
                    <a 
                      href={details?.fb_url || tutor.fb_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                    >
                      View Profile
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                  <Users className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">{completedSessions} Completed Sessions</span>
                </div>
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">
                    {details?.years_experience || tutor.years_experience || 5} years experience
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">
                    {details?.campus_location === 'main_campus' ? 'Main Campus' : 'PUCU'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          tutor={tutor}
          onBookSession={handleBookingSuccess}
        />
      )}

      {/* All Reviews Modal */}
      <AllReviewsModal
        isOpen={showAllReviewsModal}
        onClose={() => setShowAllReviewsModal(false)}
        reviews={reviews}
        averageRating={averageRating}
        totalReviews={totalReviews}
        ratingDistribution={ratingDistribution}
      />

      
    </div>
  );
};

export default TutorProfileViewPage;