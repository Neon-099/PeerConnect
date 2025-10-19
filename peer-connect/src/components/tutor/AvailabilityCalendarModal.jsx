import React, { useState } from 'react';
import { Calendar } from 'react-calendar';
import { X, Check, XCircle, Calendar as CalendarIcon } from 'lucide-react';
import 'react-calendar/dist/Calendar.css';
import './Calendar.css';

const AvailabilityCalendarModal = ({ isOpen, onClose, onSave, initialAvailability }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [availability, setAvailability] = useState(initialAvailability || {});

    const getTileClassName = ({ date, view }) => {
        const dateStr = date.toISOString().split('T')[0];
        const dayAvailability = availability[dateStr];
        
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
        
        // Single click: Toggle availability
        setAvailability(prev => ({
            ...prev,
            [dateStr]: {
                isAvailable: !prev[dateStr]?.isAvailable
            }
        }));
    };

    // Update the handleSave function to properly pass the availability data
    const handleSave = () => {
        // Convert availability to the format expected by the backend
        const backendFormat = [];
        Object.entries(availability).forEach(([dateStr, data]) => {
            if (data.isAvailable) {
                // Parse the date string to get the day of week
                const [year, month, day] = dateStr.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                
                // Add a default time slot for the day
                backendFormat.push({
                    day_of_week: dayOfWeek,
                    start_time: '09:00:00',
                    end_time: '17:00:00',
                    is_available: 1
                });
            }
        });
        
        // Call onSave with the converted data
        onSave(backendFormat);
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/25 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
                    <div>
                        <Calendar
                            onChange={setSelectedDate}
                            value={selectedDate}
                            tileClassName={getTileClassName}
                            onClickDay={handleDateClick}
                            tileContent={({ date }) => {
                                const dateStr = date.toISOString().split('T')[0];
                                const dayAvailability = availability[dateStr];
                                return dayAvailability ? (
                                    <div className="availability-indicator">
                                        {dayAvailability.isAvailable ? <Check size={12} /> : <XCircle size={12} />}
                                    </div>
                                ) : null;
                            }}
                        />
                    </div>

                    {/* Instructions */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">How to Use:</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                                    <span>Single Click: Mark as Available</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                                    <span>Single Click: Mark as Unavailable</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 bg-gray-400 rounded"></div>
                                    <span>Double Click: Remove from Calendar</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-2">Legend:</h4>
                            <div className="space-y-1 text-sm text-blue-800">
                                <p>• <strong>Green</strong> = Available for tutoring</p>
                                <p>• <strong>Red</strong> = Unavailable</p>
                                <p>• <strong>Gray</strong> = No data (students won't see you)</p>
                            </div>
                        </div>

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
                                Status: {availability[selectedDate.toISOString().split('T')[0]]?.isAvailable ? 'Available' : 'Unavailable'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Save Availability
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AvailabilityCalendarModal;