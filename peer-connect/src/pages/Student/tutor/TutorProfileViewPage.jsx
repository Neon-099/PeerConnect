import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, Calendar, MapPin, Mail, Globe, Users, GraduationCap } from 'lucide-react';
import { apiClient } from '../../../utils/api';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import BookingModal from '../../../components/BookingModal';

const TutorProfileViewPage = ({ tutor, onClose }) => {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [ratingDistribution, setRatingDistribution] = useState({5: 0, 4: 0, 3: 0, 2: 0, 1: 0});

  useEffect(() => {
    if (tutor) {
      fetchReviews();
    }
  }, [tutor]);

  const fetchReviews = async () => {
    try {
      const tutorId = tutor.user_id || tutor.id;
      const response = await apiClient.get(`/api/tutor/${tutorId}/reviews`);
      setReviews(response.reviews || []);
      
      // Calculate rating distribution
      const distribution = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0};
      response.reviews?.forEach(review => {
        distribution[review.rating]++;
      });
      setRatingDistribution(distribution);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // Set mock reviews for demo purposes
      setMockReviews();
    }
  };

  const setMockReviews = () => {
    const mockReviews = [
      {
        rating: 5,
        comment: "Exceptional tutor! Dr. Chen explains complex concepts clearly and makes learning enjoyable. My grades have improved significantly.",
        student_name: "Ethan Harper",
        created_at: new Date('2024-06-15').toISOString()
      },
      {
        rating: 5,
        comment: "Very knowledgeable and supportive. Makes learning fun and helped me understand difficult topics with ease.",
        student_name: "Sophia Bennett",
        created_at: new Date('2024-05-22').toISOString()
      }
    ];
    setReviews(mockReviews);
    setRatingDistribution({5: 2, 4: 0, 3: 0, 2: 0, 1: 0});
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

  const getTotalReviews = () => {
    return reviews.length;
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return tutor?.average_rating || '4.9';
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const getRatingPercentage = (rating) => {
    const total = getTotalReviews();
    if (total === 0) return 0;
    return (ratingDistribution[rating] / total) * 100;
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

  const handleBookingSuccess = (bookingResult) => {
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

  return (
    <div className="min-h-screen bg-[#F0F5FA] p-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={onClose}
          className="mb-6 text-teal-700 hover:text-teal-800 font-medium flex items-center gap-2"
        >
          ← Back to Search
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-start gap-6">
                <div className="relative">
                  <img
                    src={getProfilePictureUrl(tutor.profile_picture)}
                    alt={`${tutor.first_name} ${tutor.last_name}`}
                    className="w-24 h-24 rounded-xl object-cover border-2 border-gray-100"
                  />
                  {tutor.is_verified_tutor && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-semibold text-gray-900 mb-3">
                    {tutor.first_name} {tutor.last_name}
                  </h1>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {tutor.specializations?.slice(0, 3).map((subject, index) => (
                      <span
                        key={index}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getSubjectColor(index)}`}
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
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
                {tutor.bio || `Seasoned tutor with ${tutor.years_experience || 5} years of experience specializing in ${tutor.specializations?.join(', ') || 'various subjects'}. I have a proven track record of helping students achieve their academic goals through personalized, patient instruction. My teaching approach focuses on building strong foundations, fostering a love for learning, and adapting to each student's unique learning style.`}
              </p>
            </div>

            {/* Ratings & Reviews Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Ratings & Reviews</h2>
              
              <div className="flex items-start gap-8 mb-8">
                <div className="flex items-center gap-2">
                  <Star className="w-8 h-8 text-yellow-500 fill-current" />
                  <span className="text-4xl font-bold text-gray-900">
                    {getAverageRating()}
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

              {/* Individual Reviews */}
              <div className="space-y-6">
                {reviews.slice(0, 5).map((review, index) => (
                  <div key={index} className={index < reviews.length - 1 ? 'border-b border-gray-200 pb-6' : ''}>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full" />
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
                          {review.comment || 'Great tutor, very patient and helpful!'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {reviews.length === 0 && (
                  <p className="text-gray-500">No reviews yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Subjects Taught */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Subjects Taught</h2>
              <div className="flex flex-wrap gap-2">
                {tutor.specializations?.map((subject, index) => (
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
                  <span className="text-gray-700">{tutor.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">English, Filipino</span>
                </div>
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                  <Users className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">{tutor.total_sessions || 150}+ Past Sessions</span>
                </div>
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">
                    {tutor.years_experience || 5} years experience
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">
                    {tutor.campus_location === 'main_campus' ? 'Main Campus' : 'PUCU'}
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
    </div>
  );
};

export default TutorProfileViewPage;