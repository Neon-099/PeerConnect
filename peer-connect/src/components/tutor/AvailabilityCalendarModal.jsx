import React, { useState, useEffect } from 'react';
import { Calendar } from 'react-calendar';
import { X, Check, XCircle, Calendar as CalendarIcon } from 'lucide-react';
import 'react-calendar/dist/Calendar.css';
import './CalendarProfile.css';

const AvailabilityCalendarModal = ({ isOpen, onClose, onSave, initialAvailability }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [availability, setAvailability] = useState({});
    const [hoveredDate, setHoveredDate] = useState(null);
    const [showDateTooltip, setShowDateTooltip] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    // Convert initial availability from backend format to frontend format
    useEffect(() => {
        if (initialAvailability && Array.isArray(initialAvailability)) {
            const convertedAvailability = {};
            
            initialAvailability.forEach(slot => {
                // Only handle date-based format - no more day-based fallback
                if (slot.availability_date) {
                    const dateStr = slot.availability_date;
                    if (!convertedAvailability[dateStr]) {
                        convertedAvailability[dateStr] = {
                            isAvailable: Boolean(slot.is_available),
                            timeSlots: []
                        };
                    }
                    
                    if (slot.start_time && slot.end_time) {
                        convertedAvailability[dateStr].timeSlots.push({
                            start_time: slot.start_time.substring(0, 5),
                            end_time: slot.end_time.substring(0, 5)
                        });
                    }
                }
                // Remove the day_of_week fallback completely
            });
            
            setAvailability(convertedAvailability);
        }
    }, [initialAvailability]);

    const getTileClassName = ({ date, view }) => {
        const dateStr = date.toISOString().split('T')[0];
        const dayAvailability = availability[dateStr];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isPastDate = date < today;
        
        if (isPastDate) {
            return 'past-date-disabled';
        }
        
        if (dayAvailability?.isAvailable) {
            return 'available-day';
        } else if (dayAvailability?.isAvailable === false) {
            return 'unavailable-day';
        }
        return 'default-day';
    };

    const handleDateClick = (date) => {
        const dateStr = date.toISOString().split('T')[0];
        setSelectedDate(date);
        
        // Only allow current and future dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) {
            return;
        }
        
        // Toggle availability for the clicked date
        setAvailability(prev => ({
            ...prev,
            [dateStr]: {
                isAvailable: !prev[dateStr]?.isAvailable,
                timeSlots: prev[dateStr]?.timeSlots || [{ start_time: '09:00', end_time: '17:00' }]
            }
        }));
    };

    const handleDateMouseEnter = (event, date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isPastDate = date < today;
        
        if (isPastDate) {
            setHoveredDate(date);
            setShowDateTooltip(true);
            setTooltipPosition({
                x: event.clientX,
                y: event.clientY
            });
        }
    };

    const handleDateMouseLeave = () => {
        setShowDateTooltip(false);
        setHoveredDate(null);
    };

    const handleSave = () => {
        // Convert availability to the format expected by the backend
        const backendFormat = [];
        Object.entries(availability).forEach(([dateStr, data]) => {
            if (data.isAvailable) {
                // Parse the date string to get the day of week for backward compatibility
                const [year, month, day] = dateStr.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                
                // Add time slots for this date
                if (data.timeSlots && data.timeSlots.length > 0) {
                    data.timeSlots.forEach(slot => {
                        backendFormat.push({
                            date: dateStr,  // This is the actual date
                            day_of_week: dayOfWeek, // This is just for backward compatibility
                            start_time: slot.start_time + ':00',
                            end_time: slot.end_time + ':00',
                            is_available: true
                        });
                    });
                } else {
                    // Default time slot
                    backendFormat.push({
                        date: dateStr,  // This is the actual date
                        day_of_week: dayOfWeek, // This is just for backward compatibility
                        start_time: '09:00:00',
                        end_time: '17:00:00',
                        is_available: true
                    });
                }
            }
        });
        
        console.log('Sending availability data to backend:', backendFormat);
        console.log('Availability object before conversion:', availability);
        
        // Call onSave with the converted data
        onSave(backendFormat);
    };

    const renderTileContent = ({ date }) => {
        const dateStr = date.toISOString().split('T')[0];
        const dayAvailability = availability[dateStr];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isPastDate = date < today;
        
        return (
            <div className="relative">
                {dayAvailability && !isPastDate ? (
                    <div className="availability-indicator">
                        {dayAvailability.isAvailable ? <Check size={12} /> : <XCircle size={12} />}
                    </div>
                ) : isPastDate ? (
                    <div className="past-date-indicator">
                        <XCircle size={12} className="text-gray-500" />
                    </div>
                ) : null}
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/25 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold flex items-center space-x-2">
                        <CalendarIcon size={24} />
                        <span>Set Your Availability</span>
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Calendar */}
                    <div className="profile-calendar-container">
                        <Calendar
                            className="profile-calendar"
                            onChange={setSelectedDate}
                            value={selectedDate}
                            tileClassName={getTileClassName}
                            onClickDay={handleDateClick}
                            onMouseEnter={(event) => {
                                const date = event.target.closest('.react-calendar__tile')?.getAttribute('data-date');
                                if (date) {
                                    handleDateMouseEnter(event, new Date(date));
                                }
                            }}
                            onMouseLeave={handleDateMouseLeave}
                            tileContent={renderTileContent}
                            minDate={new Date()}
                            locale="en-US"
                        />
                    </div>

                    {/* Instructions and Time Selection */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">How to Use:</h3>
                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                                    <span>Click: Mark as Available</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                                    <span>Click again: Mark as Unavailable</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 bg-gray-400 rounded"></div>
                                    <span>No mark: Not set</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 bg-gray-600 rounded border border-gray-500"></div>
                                    <span>Past dates: Cannot be selected</span>
                                </div>
                            </div>
                        </div>

                        {/* Selected Date Info */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2">Selected Date:</h4>
                            <p className="text-sm text-gray-700">
                                {selectedDate.toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                                Status: {availability[selectedDate.toISOString().split('T')[0]]?.isAvailable ? 'Available' : 'Not set'}
                            </p>
                        </div>

                        {/* Summary of Selected Dates */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2">Selected Dates Summary</h4>
                            <div className="space-y-1 text-sm text-gray-600">
                                {Object.keys(availability).length === 0 ? (
                                    <p className="text-gray-500">No dates selected yet</p>
                                ) : (
                                    Object.entries(availability)
                                        .filter(([_, data]) => data.isAvailable)
                                        .sort(([a], [b]) => new Date(a) - new Date(b))
                                        .map(([dateStr, data]) => {
                                            const [year, month, day] = dateStr.split('-').map(Number);
                                            const date = new Date(year, month - 1, day);
                                            
                                            return (
                                                <div key={dateStr} className="flex justify-between items-center">
                                                    <span>
                                                        {date.toLocaleDateString('en-US', { 
                                                            weekday: 'short', 
                                                            month: 'short', 
                                                            day: 'numeric'
                                                        })}
                                                    </span>
                                                    <span className="text-green-600">
                                                        {data.timeSlots?.length || 0} slot(s)
                                                    </span>
                                                </div>
                                            );
                                        })
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Save Availability
                    </button>
                </div>
            </div>

            {/* Tooltip for past dates */}
            {showDateTooltip && hoveredDate && (
                <div 
                    className="fixed z-50 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm border border-gray-600 pointer-events-none"
                    style={{
                        left: tooltipPosition.x + 10,
                        top: tooltipPosition.y - 40,
                    }}
                >
                    <div className="flex items-center space-x-2">
                        <XCircle size={16} className="text-red-400" />
                        <span>Past dates cannot be selected</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                        {hoveredDate.toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric'
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AvailabilityCalendarModal;