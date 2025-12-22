'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";

interface SchedulePickerProps {
  value?: string; // ISO 8601 datetime string
  onChange: (datetime: string) => void;
  minDate?: Date;
  platform?: string;
  disabled?: boolean;
}

export function SchedulePicker({
  value,
  onChange,
  minDate = new Date(),
  platform,
  disabled = false,
}: SchedulePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    return value ? new Date(value) : new Date();
  });
  const [selectedTime, setSelectedTime] = useState<string>(() => {
    if (value) {
      const date = new Date(value);
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
    return '12:00';
  });
  const [viewMode, setViewMode] = useState<'calendar' | 'input'>('input');

  // Update parent when date or time changes
  useEffect(() => {
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const datetime = new Date(selectedDate);
    datetime.setHours(hours, minutes, 0, 0);
    
    // Only update if datetime is valid and in the future
    if (datetime > minDate) {
      onChange(datetime.toISOString());
    }
  }, [selectedDate, selectedTime, minDate, onChange]);

  // Best time suggestions based on platform
  const getBestTimes = () => {
    const suggestions = {
      onlyfans: [
        { time: '20:00', label: 'Evening Peak (8 PM)' },
        { time: '22:00', label: 'Night Peak (10 PM)' },
        { time: '12:00', label: 'Lunch Time (12 PM)' },
      ],
      instagram: [
        { time: '11:00', label: 'Morning Peak (11 AM)' },
        { time: '19:00', label: 'Evening Peak (7 PM)' },
        { time: '21:00', label: 'Night Peak (9 PM)' },
      ],
      tiktok: [
        { time: '15:00', label: 'Afternoon Peak (3 PM)' },
        { time: '19:00', label: 'Evening Peak (7 PM)' },
        { time: '21:00', label: 'Night Peak (9 PM)' },
      ],
      default: [
        { time: '09:00', label: 'Morning (9 AM)' },
        { time: '12:00', label: 'Noon (12 PM)' },
        { time: '18:00', label: 'Evening (6 PM)' },
      ],
    };

    return suggestions[platform as keyof typeof suggestions] || suggestions.default;
  };

  // Generate calendar days
  const getCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handlePreviousMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const formatDateInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setViewMode('input')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            viewMode === 'input'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          disabled={disabled}
          type="button"
        >
          Quick Input
        </button>
        <button
          onClick={() => setViewMode('calendar')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            viewMode === 'calendar'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          disabled={disabled}
          type="button"
        >
          Calendar View
        </button>
      </div>

      {viewMode === 'input' ? (
        /* Quick Input Mode */
        <div className="space-y-4">
          {/* Date & Time Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date
              </label>
              <input
                type="date"
                value={formatDateInput(selectedDate)}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                min={formatDateInput(minDate)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2c6ecb] focus:border-transparent dark:bg-gray-800 dark:text-white"
                disabled={disabled}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2c6ecb] focus:border-transparent dark:bg-gray-800 dark:text-white"
                disabled={disabled}
              />
            </div>
          </div>

          {/* Best Time Suggestions */}
          {platform && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Best Times for {platform}
              </label>
              <div className="flex flex-wrap gap-2">
                {getBestTimes().map((suggestion) => (
                  <button
                    key={suggestion.time}
                    onClick={() => handleTimeSelect(suggestion.time)}
                    className="px-3 py-1.5 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                    disabled={disabled}
                    type="button"
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Calendar View Mode */
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={handlePreviousMonth} disabled={disabled} type="button">
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
</Button>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </h3>
            <Button variant="ghost" onClick={handleNextMonth} disabled={disabled} type="button">
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
</Button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {getCalendarDays().map((date, index) => (
              <button
                key={index}
                onClick={() => date && !isPast(date) && handleDateSelect(date)}
                disabled={!date || isPast(date) || disabled}
                className={`
                  aspect-square p-2 text-sm rounded-lg transition-colors
                  ${!date ? 'invisible' : ''}
                  ${isPast(date!) ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : ''}
                  ${isSelected(date!) ? 'bg-purple-600 text-white font-semibold' : ''}
                  ${isToday(date!) && !isSelected(date!) ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium' : ''}
                  ${!isSelected(date!) && !isToday(date!) && !isPast(date!) ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white' : ''}
                `}
                type="button"
              >
                {date?.getDate()}
              </button>
            ))}
          </div>

          {/* Time Selection */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Time
            </label>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2c6ecb] focus:border-transparent dark:bg-gray-800 dark:text-white"
              disabled={disabled}
            />
          </div>
        </div>
      )}

      {/* Selected DateTime Preview */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Scheduled for:</p>
        <p className="text-lg font-semibold text-gray-900 dark:text-white">
          {selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}{' '}
          at {selectedTime}
        </p>
      </div>
    </div>
  );
}
