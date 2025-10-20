import React, { useState } from 'react';
import { Search, Users, Clock, Star, MapPin, BookOpen, CheckCircle, AlertCircle, RotateCcw, GraduationCap, Target } from 'lucide-react';
import { apiClient } from '../../utils/api.js';
import MatchingResults from '../MatchingResults';

const StudentMatchingSection = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchPhase, setSearchPhase] = useState('');
  const [matches, setMatches] = useState([]);
  const [searchComplete, setSearchComplete] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Search phases with tutor-focused messaging
  const searchPhases = [
    { phase: 'Analyzing your teaching profile...', duration: 3000 },
    { phase: 'Finding compatible students...', duration: 4000 },
    { phase: 'Matching learning preferences...', duration: 3000 },
    { phase: 'Calculating compatibility scores...', duration: 2000 },
    { phase: 'Preparing your matches...', duration: 1000 }
  ];

  const startSearch = async () => {
    setIsSearching(true);
    setSearchComplete(false);
    setError(null);
    setMatches([]);
    setSearchProgress(0);
    setHasSearched(true);

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

    try {
      // Make API call to find matching students
      const response = await apiClient.get('/api/matching/findStudents');
      
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

      setError(err.message || 'Failed to find matching students. Please try again.');
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

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-slate-800">Find Your Students</h1>
          <p className="text-slate-600 mt-1">Students who match your teaching preferences</p>
        </div>
        {searchComplete && (
          <button 
            onClick={retrySearch}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Search Again
          </button>
        )}
      </div>

      {/* Initial State - Before Search */}
      {!hasSearched && !isSearching && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Target className="w-12 h-12 text-blue-600" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">Ready to Find Your Students?</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Our smart matching system will analyze your teaching profile, specializations, 
            teaching styles, and location to find the best students for you.
          </p>
          
          <button
            onClick={startSearch}
            className="px-8 py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <Search className="w-5 h-5" />
            Start Matching
          </button>
        </div>
      )}

      {/* Searching State */}
      {isSearching && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">Finding Your Perfect Students</h3>
          <p className="text-gray-600 mb-8">{searchPhase}</p>
          
          {/* Progress Bar */}
          <div className="w-full max-w-md mx-auto mb-6">
            <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
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
                <p className="text-sm font-medium text-blue-900 mb-1">Matching Tips</p>
                <p className="text-sm text-blue-700">
                  This usually takes 20-30 seconds. We're analyzing compatibility, 
                  learning styles, and academic levels to find your best student matches.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
          
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">Search Failed</h3>
          <p className="text-gray-600 mb-8">{error}</p>
          
          <div className="flex gap-4 justify-center">
            <button
              onClick={retrySearch}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Results State */}
      {searchComplete && (
        <div>
          <div className="mb-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Your Student Matches</h3>
            <p className="text-gray-600">
              Found {matches.length} student{matches.length !== 1 ? 's' : ''} that match your teaching preferences
            </p>
          </div>

          {matches.length > 0 ? (
            <MatchingResults matches={matches} type="students" />
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">No Students Found</h3>
              <p className="text-gray-600 mb-8">
                We couldn't find any students matching your current teaching preferences. 
                Try adjusting your profile or check back later.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={retrySearch}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentMatchingSection;