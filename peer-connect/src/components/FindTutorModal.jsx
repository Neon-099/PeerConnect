import React, { useState, useEffect } from 'react';
import { X, Search, Users, Clock, Star, MapPin, BookOpen, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { apiClient } from '../utils/api';
import MatchingResults from './MatchingResults';

const FindTutorModal = ({ isOpen, onClose }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchPhase, setSearchPhase] = useState('');
  const [matches, setMatches] = useState([]);
  const [searchComplete, setSearchComplete] = useState(false);
  const [error, setError] = useState(null);
  const [timeoutId, setTimeoutId] = useState(null);

  // Search phases with realistic timing
  const searchPhases = [
    { phase: 'Analyzing your profile...', duration: 3000 },
    { phase: 'Finding compatible tutors...', duration: 4000 },
    { phase: 'Checking availability...', duration: 3000 },
    { phase: 'Calculating match scores...', duration: 2000 },
    { phase: 'Finalizing results...', duration: 1000 }
  ];

  const startSearch = async () => {
    setIsSearching(true);
    setSearchComplete(false);
    setError(null);
    setMatches([]);
    setSearchProgress(0);

    let currentPhaseIndex = 0;
    let totalDuration = 0;

    // Calculate total duration
    searchPhases.forEach(phase => {
      totalDuration += phase.duration;
    });

    // Start phase progression
    const phaseInterval = setInterval(() => {
      if (currentPhaseIndex < searchPhases.length) {
        setSearchPhase(searchPhases[currentPhaseIndex].phase);
        currentPhaseIndex++;
      }
    }, 1000);

    // Start progress animation
    const progressInterval = setInterval(() => {
      setSearchProgress(prev => {
        const newProgress = prev + (100 / (totalDuration / 100));
        return Math.min(newProgress, 95); // Stop at 95% until API call completes
      });
    }, 100);

    // Set timeout for forced completion (50 seconds max)
    const timeout = setTimeout(() => {
      if (isSearching) {
        handleSearchTimeout();
      }
    }, 50000);

    setTimeoutId(timeout);

    try {
      // Make API call to find matching tutors
      const response = await apiClient.get('/api/matching/findTutors');
      
      // Clear intervals
      clearInterval(phaseInterval);
      clearInterval(progressInterval);
      clearTimeout(timeout);

      // Complete the search
      setSearchProgress(100);
      setSearchPhase('Search complete!');
      
      setTimeout(() => {
        setMatches(response.matches || []);
        setSearchComplete(true);
        setIsSearching(false);
      }, 500);

    } catch (err) {
      console.error('Search error:', err);
      
      // Clear intervals
      clearInterval(phaseInterval);
      clearInterval(progressInterval);
      clearTimeout(timeout);

      setError(err.message || 'Failed to find matching tutors. Please try again.');
      setIsSearching(false);
    }
  };

  const handleSearchTimeout = () => {
    setError('Search is taking longer than expected. Please try again.');
    setIsSearching(false);
    setSearchProgress(0);
    setSearchPhase('');
  };

  const retrySearch = () => {
    setError(null);
    startSearch();
  };

  const handleClose = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    onClose();
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsSearching(false);
      setSearchComplete(false);
      setError(null);
      setMatches([]);
      setSearchProgress(0);
      setSearchPhase('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-xs bg-black/25 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Find Your Perfect Tutor</h2>
              <p className="text-sm text-gray-600">We'll match you with tutors based on your preferences</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isSearching && !searchComplete && !error && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 text-teal-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Ready to Find Your Match?</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Our smart matching system will analyze your profile, subjects of interest, 
                learning style, and location to find the best tutors for you.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={startSearch}
                  className="px-8 py-4 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Start Matching
                </button>
                <button
                  onClick={handleClose}
                  className="px-8 py-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          )}

          {/* Searching State */}
          {isSearching && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
              </div>
              
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Finding Your Perfect Match</h3>
              <p className="text-gray-600 mb-8">{searchPhase}</p>
              
              {/* Progress Bar */}
              <div className="w-full max-w-md mx-auto mb-6">
                <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-teal-600 h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${searchProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-2">{Math.round(searchProgress)}% Complete</p>
              </div>

              {/* Search Tips */}
              <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-blue-900 mb-1">Search Tips</p>
                    <p className="text-sm text-blue-700">
                      This usually takes 20-30 seconds. We're analyzing compatibility, 
                      availability, and teaching styles to find your best matches.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-12 h-12 text-red-600" />
              </div>
              
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Search Failed</h3>
              <p className="text-gray-600 mb-8">{error}</p>
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={retrySearch}
                  className="px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  Try Again
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Results State */}
          {searchComplete && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">Your Matches</h3>
                  <p className="text-gray-600">
                    Found {matches.length} tutor{matches.length !== 1 ? 's' : ''} that match your preferences
                  </p>
                </div>
                <button
                  onClick={retrySearch}
                  className="px-4 py-2 bg-teal-100 text-teal-700 rounded-lg font-medium hover:bg-teal-200 transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Search Again
                </button>
              </div>

              {matches.length > 0 ? (
                <MatchingResults matches={matches} type="tutors" />
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">No Matches Found</h3>
                  <p className="text-gray-600 mb-8">
                    We couldn't find any tutors matching your current preferences. 
                    Try adjusting your search criteria or check back later.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={retrySearch}
                      className="px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={handleClose}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FindTutorModal;