import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  DollarSign, 
  MessageSquare,
  MapPin,
  Video,
  Phone,
  Star,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '../../../utils/api';

const SessionPage = () => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, [activeTab]);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/api/tutor/sessions?status=${activeTab}`);
      setSessions(response || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSessionStatus = async (sessionId, status) => {
    try {
      await apiClient.put(`/api/tutor/sessions/${sessionId}/status`, { status });
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      
      // Show success message
      const statusMessages = {
        confirmed: 'Session confirmed successfully!',
        rejected: 'Session rejected.',
        cancelled: 'Session cancelled.'
      };
      alert(statusMessages[status] || `Session ${status} successfully!`);
      
      // Refresh the list to update counts
      fetchSessions();
    } catch (error) {
      console.error('Error updating session status:', error);
      alert('Failed to update session status. Please try again.');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-gray-500" />;
      case 'completed':
        return <Star className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSessionTypeIcon = (sessionType) => {
    switch (sessionType) {
      case 'virtual':
        return <Video className="w-4 h-4 text-blue-500" />;
      case 'in-person':
        return <MapPin className="w-4 h-4 text-green-500" />;
      default:
        return <Video className="w-4 h-4 text-gray-500" />;
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = !searchTerm || 
      session.student_first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.student_last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.subject_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !filterDate || session.session_date === filterDate;
    
    return matchesSearch && matchesDate;
  });

  const tabs = [
    { key: 'pending', label: 'Pending Requests', count: sessions.filter(s => s.status === 'pending').length },
    { key: 'confirmed', label: 'Confirmed', count: sessions.filter(s => s.status === 'confirmed').length },
    { key: 'completed', label: 'Completed', count: sessions.filter(s => s.status === 'completed').length },
    { key: 'rejected', label: 'Rejected', count: sessions.filter(s => s.status === 'rejected').length },
    { key: 'cancelled', label: 'Cancelled', count: sessions.filter(s => s.status === 'cancelled').length }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Session Management</h1>
          <p className="text-gray-600 mt-1">Manage your tutoring sessions and requests</p>
        </div>
        <button
          onClick={fetchSessions}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by student name or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
        
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Date</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <button
                onClick={() => setFilterDate('')}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear Date Filter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterDate ? 'No sessions match your filters' : `No ${activeTab} sessions`}
          </h3>
          <p className="text-gray-500">
            {activeTab === 'pending' 
              ? 'You\'ll see new session requests here.' 
              : `You have no ${activeTab} sessions.`
            }
          </p>
          {(searchTerm || filterDate) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterDate('');
              }}
              className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => (
            <div key={session.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <img
                    src={session.student_profile_picture || '/default-avatar.png'}
                    alt={session.student_first_name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {getStatusIcon(session.status)}
                      <h3 className="text-lg font-semibold text-gray-900">
                        {session.student_first_name} {session.student_last_name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-700">Subject: </span>
                      <span className="text-sm text-gray-600">{session.subject_name}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <div>
                          <span className="text-gray-600">Date:</span>
                          <span className="font-medium ml-1">{formatDate(session.session_date)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <div>
                          <span className="text-gray-600">Time:</span>
                          <span className="font-medium ml-1">
                            {formatTime(session.start_time)} - {formatTime(session.end_time)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <div>
                          <span className="text-gray-600">Cost:</span>
                          <span className="font-medium ml-1">${session.total_cost}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getSessionTypeIcon(session.session_type)}
                        <div>
                          <span className="text-gray-600">Type:</span>
                          <span className="font-medium ml-1 capitalize">{session.session_type}</span>
                        </div>
                      </div>
                    </div>

                    {session.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-md">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Student Notes:</p>
                            <p className="text-sm text-gray-600">{session.notes}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {session.meeting_link && session.session_type === 'virtual' && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-md">
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium text-blue-700">Meeting Link:</span>
                          <a 
                            href={session.meeting_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                          >
                            Join Session
                          </a>
                        </div>
                      </div>
                    )}

                    {session.location && session.session_type === 'in-person' && (
                      <div className="mt-3 p-3 bg-green-50 rounded-md">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-green-700">Location:</span>
                          <span className="text-sm text-green-600">{session.location}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  {session.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateSessionStatus(session.id, 'confirmed')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Confirm
                      </button>
                      <button
                        onClick={() => updateSessionStatus(session.id, 'rejected')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm font-medium"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </>
                  )}
                  
                  {session.status === 'confirmed' && (
                    <button
                      onClick={() => updateSessionStatus(session.id, 'completed')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                      <Star className="w-4 h-4" />
                      Mark Complete
                    </button>
                  )}

                  {(session.status === 'confirmed' || session.status === 'pending') && (
                    <button
                      onClick={() => updateSessionStatus(session.id, 'cancelled')}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">
                {sessions.filter(s => s.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Confirmed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {sessions.filter(s => s.status === 'confirmed').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Star className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {sessions.filter(s => s.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${sessions
                  .filter(s => s.status === 'completed')
                  .reduce((sum, s) => sum + parseFloat(s.total_cost || 0), 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionPage;