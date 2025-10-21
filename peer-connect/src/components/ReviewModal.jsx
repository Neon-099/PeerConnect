import React, { useState } from 'react';
import { X, Star, MessageSquare, CheckCircle } from 'lucide-react';
import { apiClient } from '../utils/api';

const ReviewModal = ({ isOpen, onClose, session, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleStarClick = (starRating) => {
    setRating(starRating);
    setErrors({ ...errors, rating: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (rating === 0) {
      newErrors.rating = 'Please select a rating';
    }
    if (!comment.trim()) {
      newErrors.comment = 'Please write a review comment';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const reviewData = {
        session_id: session.id,
        rating: rating,
        comment: comment.trim()
      };

      console.log('Submitting review:', reviewData);
      
      const response = await apiClient.post('/api/student/rate-tutor', reviewData);
      
      if (response) {
        setIsSubmitted(true);
        setTimeout(() => {
          onReviewSubmitted();
          onClose();
          // Reset form
          setRating(0);
          setComment('');
          setErrors({});
          setIsSubmitted(false);
        }, 1500);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setErrors({ general: 'Failed to submit review. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    setErrors({});
    setIsSubmitted(false);
    onClose();
  };

  if (!isOpen || !session) return null;

  // Success state
  if (isSubmitted) {
    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-black/25 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 w-full max-w-md mx-4 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="text-green-500" size={64} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Submitted!</h2>
          <p className="text-gray-600 mb-4">
            Thank you for your feedback. Your review has been submitted successfully.
          </p>
          <div className="flex items-center justify-center gap-2 text-yellow-500">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={20}
                className={`${
                  star <= rating
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
            <span className="ml-2 text-gray-700">({rating} stars)</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/25 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Write a Review</h2>
          <button 
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Session Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">
              Session with {session.tutor_first_name} {session.tutor_last_name}
            </h3>
            <p className="text-sm text-gray-600">
              {session.subject_name} • {new Date(session.session_date).toLocaleDateString()}
            </p>
          </div>

          {/* Rating Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating *
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  className="focus:outline-none transition-colors"
                >
                  <Star
                    size={32}
                    className={`${
                      star <= rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    } hover:text-yellow-400 transition-colors`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {rating > 0 ? `${rating} star${rating !== 1 ? 's' : ''}` : 'Select rating'}
              </span>
            </div>
            {errors.rating && (
              <p className="text-red-500 text-sm mt-1">{errors.rating}</p>
            )}
          </div>

          {/* Comment Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share your feedback *
            </label>
            <textarea
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setErrors({ ...errors, comment: '' });
              }}
              placeholder="Share your feedback..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
            />
            {errors.comment && (
              <p className="text-red-500 text-sm mt-1">{errors.comment}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading || rating === 0 || !comment.trim()}
              className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <MessageSquare size={16} />
                  Submit Review
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;