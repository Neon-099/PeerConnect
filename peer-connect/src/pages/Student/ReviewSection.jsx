import React, { useState } from 'react';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';
import { Star, ChevronDown,  } from 'lucide-react';




const ReviewsSection = ({ reviews, onSubmitReview, getProfilePictureUrl, studentProfile }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [filterTab, setFilterTab] = useState('all');
  const [selectedTutor, setSelectedTutor] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const yourReviews = [
    {
      id: 1,
      tutor: 'Emma Wilson',
      subject: 'Calculus',
      review: '"Clear explanations and great examples."',
      date: 'Yesterday',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
    },
    {
      id: 2,
      tutor: 'Liam Chen',
      subject: 'Physics',
      review: '"Helpful strategies before the quiz."',
      date: 'Aug 24',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
    }
  ];

  const reviewsAboutYou = [
    {
      id: 1,
      tutor: 'Sophia Park',
      subject: 'Chemistry',
      review: '"Peer study with you was efficient and focused."',
      date: 'Aug 15',
      rating: 4,
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop'
    },
    {
      id: 2,
      tutor: 'Noah Patel',
      subject: 'CS',
      review: '"Collaborating on recursion problems was fun!"',
      date: 'Aug 02',
      rating: 3,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop'
    }
  ];

  const renderStars = (count, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={interactive ? 'cursor-pointer' : 'cursor-default'}
            disabled={!interactive}
          >
            <Star
              className={`w-5 h-5 ${
                star <= (interactive ? (hoverRating || rating) : count)
                  ? 'fill-gray-300 text-gray-300'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
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
          <div className="max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-semibold text-gray-800">Reviews</h1>
              
              {/* Filter Tabs */}
              <div className="flex gap-2">
                <button 
                  onClick={() => setFilterTab('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    filterTab === 'all' 
                      ? 'bg-teal-700 text-white' 
                      : 'bg-white text-teal-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  All
                </button>
                <button 
                  onClick={() => setFilterTab('given')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    filterTab === 'given' 
                      ? 'bg-teal-700 text-white' 
                      : 'bg-white text-teal-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Given
                </button>
                <button 
                  onClick={() => setFilterTab('received')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    filterTab === 'received' 
                      ? 'bg-teal-700 text-white' 
                      : 'bg-white text-teal-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Received
                </button>
              </div>
            </div>

            <div className="flex gap-6">
              {/* Left Column - Your Recent Reviews */}
              <div className="flex-1">
                <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Recent Reviews</h2>
                  
                  <div className="space-y-4">
                    {yourReviews.map((review) => (
                      <div key={review.id} className="flex items-start justify-between pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                        <div className="flex items-start gap-3 flex-1">
                          <img 
                            src={review.avatar} 
                            alt={review.tutor}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-800">{review.tutor}</h3>
                              <span className="text-gray-400">•</span>
                              <span className="text-sm text-gray-600">{review.subject}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{review.review}</p>
                            <p className="text-xs text-gray-500">• {review.date}</p>
                          </div>
                        </div>
                        <button className="text-sm text-teal-700 font-medium hover:text-teal-800 ml-4">
                          Edit
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reviews About You */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Reviews About You</h2>
                  
                  <div className="space-y-4">
                    {reviewsAboutYou.map((review) => (
                      <div key={review.id} className="flex items-start justify-between pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                        <div className="flex items-start gap-3 flex-1">
                          <img 
                            src={review.avatar} 
                            alt={review.tutor}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-800">{review.tutor}</h3>
                              <span className="text-gray-400">•</span>
                              <span className="text-sm text-gray-600">{review.subject}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{review.review}</p>
                            <p className="text-xs text-gray-500">• {review.date}</p>
                          </div>
                        </div>
                        <div className="ml-4">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Write a Review */}
              <div className="w-96">
                <div className="bg-white rounded-xl p-6 border border-gray-200 sticky top-8">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Write a Review</h2>
                  
                  <div className="mb-4">
                    <div className="relative">
                      <select
                        value={selectedTutor}
                        onChange={(e) => setSelectedTutor(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-teal-600 text-gray-600 bg-white"
                      >
                        <option value="">Select tutor</option>
                        <option value="emma">Emma Wilson</option>
                        <option value="liam">Liam Chen</option>
                        <option value="sophia">Sophia Park</option>
                        <option value="noah">Noah Patel</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                    {renderStars(rating, true)}
                  </div>

                  <div className="mb-6">
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Share your feedback..."
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button className="flex-1 px-4 py-3 bg-teal-700 text-white rounded-lg font-medium hover:bg-teal-800">
                      Submit Review
                    </button>
                    <button className="flex-1 px-4 py-3 bg-white text-teal-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50">
                      Save Draft
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-12 bg-white border-t border-gray-200 flex items-center justify-end px-8">
          <div className="flex gap-6 text-sm text-gray-600">
            <a href="#" className="hover:text-gray-800">Help Center</a>
            <a href="#" className="hover:text-gray-800">Contact</a>
            <a href="#" className="hover:text-gray-800">Privacy Policy</a>
          </div>
        </div>
      </div>
  );
};

export default ReviewsSection;