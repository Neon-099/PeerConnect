import React, { useState, useEffect } from 'react';
import { Search, Users, AlertCircle, RotateCcw, Target } from 'lucide-react';
import { apiClient } from '../../utils/api';
import MatchingResults from '../../components/MatchingResults';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import TutorProfileViewPage from './tutor/TutorProfileViewPage.jsx';


const StudentMatchingSection = ({getProfilePictureUrl, studentProfile}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchPhase, setSearchPhase] = useState('');
  const [matches, setMatches] = useState([]);
  const [searchComplete, setSearchComplete] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedTutorForView, setSelectedTutorForView] = useState(null);
  const [showTutorProfileViewModal, setShowTutorProfileViewModal] = useState(false);

  // Match phases and durations (consistent with tutor side)
  const searchPhases = [
    { phase: 'Analyzing your profile...', duration: 3000 },
    { phase: 'Finding compatible tutors...', duration: 4000 },
    { phase: 'Checking availability...', duration: 3000 },
    { phase: 'Calculating match scores...', duration: 2000 },
    { phase: 'Finalizing results...', duration: 1000 }
  ];

  const startSearch = async () => {
    setIsSearching(true);
    setHasSearched(true);
    setSearchComplete(false);
    setError(null);
    setMatches([]);
    setSearchProgress(0);

    let currentPhaseIndex = 0;
    const totalDuration = searchPhases.reduce((acc, p) => acc + p.duration, 0);

    const phaseInterval = setInterval(() => {
      if (currentPhaseIndex < searchPhases.length) {
        setSearchPhase(searchPhases[currentPhaseIndex].phase);
        currentPhaseIndex++;
      }
    }, 1000);

    const progressInterval = setInterval(() => {
      setSearchProgress(prev => Math.min(prev + (100 / (totalDuration / 100)), 95));
    }, 100);

    // Max timeout fallback
    const timeout = setTimeout(() => {
      clearInterval(phaseInterval);
      clearInterval(progressInterval);
      setIsSearching(false);
      setError('Search is taking longer than expected. Please try again.');
    }, 50000);

    try {
      const response = await apiClient.get('/api/matching/findTutors');

      clearInterval(phaseInterval);
      clearInterval(progressInterval);
      clearTimeout(timeout);

      setSearchProgress(100);
      setSearchPhase('Search complete!');
      
      setTimeout(async () => {
        const matches = response.matches || [];
        setMatches(matches);
        setSearchComplete(true);
        setIsSearching(false);
      
      }, 500);
    } catch (err) {
      clearInterval(phaseInterval);
      clearInterval(progressInterval);
      clearTimeout(timeout);

      setIsSearching(false);
      setError(err?.message || 'Failed to find matching tutors. Please try again.');
    }
  };

  const retrySearch = () => {
    setError(null);
    startSearch();
  };  
 
  const handleViewProfile = (tutor) => {
    setSelectedTutorForView(tutor);
    setShowTutorProfileViewModal(true);
  }

  return (
    <div className='flex-1 flex flex-col'>
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
      
      <div className="flex items-center justify-between mb-8 overflow-auto">
        <div>
          <h1 className="text-3xl font-semibold text-slate-800">Find Your Tutor</h1>
          <p className="text-slate-600 mt-1">Tutors who match your profile and subjects</p>
        </div>
        {searchComplete && (
          <button
            onClick={retrySearch}
            className="flex items-center gap-2 px-4 py-2 bg-teal-100 text-teal-700 rounded-xl hover:bg-teal-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Search Again
          </button>
        )}
      </div>

      {!hasSearched && !isSearching && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Target className="w-12 h-12 text-teal-600" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">Ready to Find Your Perfect Tutor?</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            We’ll analyze your profile, subjects and location to find the best tutors for you.
          </p>
          <button
            onClick={startSearch}
            className="px-8 py-4 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <Search className="w-5 h-5" />
            Start Matching
          </button>
        </div>
      )}

      {isSearching && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">Finding Your Best Matches</h3>
          <p className="text-gray-600 mb-8">{searchPhase}</p>

          <div className="w-full max-w-md mx-auto mb-6">
            <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-teal-600 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${searchProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">{Math.round(searchProgress)}% Complete</p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-medium text-blue-900 mb-1">Matching Tips</p>
                <p className="text-sm text-blue-700">
                  This usually takes 20–30 seconds while we analyze compatibility and subjects.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">Search Failed</h3>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={retrySearch}
            className="px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Try Again
          </button>
        </div>
      )}

      {searchComplete && (
        <div>
          <div className="mb-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Your Tutor Matches</h3>
            <p className="text-gray-600">
              Found {matches.length} tutor{matches.length !== 1 ? 's' : ''} that match your preferences
            </p>
          </div>

          {matches.length > 0 ? (
            <MatchingResults 
              matches={matches} 
              type="tutors" 
              onViewProfile={handleViewProfile}
            />
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">No Tutors Found</h3>
              <p className="text-gray-600 mb-8">
                We couldn’t find tutors matching your current profile. Try again later.
              </p>
              <button
                onClick={retrySearch}
                className="px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="h-[49px] mt-auto bg-white border-t border-gray-200 flex items-center justify-end px-8">
        <Footer/>
      </div>
      {showTutorProfileViewModal && selectedTutorForView && (
        <div className="fixed inset-0 z-50 bg-white overflow-auto">
          <TutorProfileViewPage
            tutor={selectedTutorForView}
            onClose={() => {
              setShowTutorProfileViewModal(false);
              setSelectedTutorForView(null);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default StudentMatchingSection;