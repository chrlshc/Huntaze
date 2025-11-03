'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';

interface ScheduledContent {
  id: string;
  text: string;
  scheduled_at: string;
  status: string;
  platforms: Array<{ platform: string }>;
  media: Array<{ thumbnail_url: string }>;
}

interface ContentCalendarProps {
  userId: string;
  onReschedule?: (contentId: string, newDate: Date) => Promise<void>;
  onContentClick?: (content: ScheduledContent) => void;
}

export default function ContentCalendar({ userId, onReschedule, onContentClick }: ContentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [scheduledContent, setScheduledContent] = useState<ScheduledContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedContent, setDraggedContent] = useState<ScheduledContent | null>(null);

  useEffect(() => {
    fetchScheduledContent();
  }, [currentDate, view, userId]);

  const fetchScheduledContent = async () => {
    setLoading(true);
    try {
      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);

      const response = await fetch(
        `/api/content/schedule?userId=${userId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setScheduledContent(data.scheduledContent || []);
      }
    } catch (error) {
      console.error('Error fetching scheduled content:', error);
    } finally {
      setLoading(false);
    }
  };

  const getContentForDate = (date: Date) => {
    return scheduledContent.filter(content => 
      isSameDay(new Date(content.scheduled_at), date)
    );
  };

  const handleDragStart = (content: ScheduledContent) => {
    setDraggedContent(content);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (date: Date) => {
    if (!draggedContent || !onReschedule) return;

    try {
      // Combine the new date with the original time
      const originalDate = new Date(draggedContent.scheduled_at);
      const newDateTime = new Date(date);
      newDateTime.setHours(originalDate.getHours());
      newDateTime.setMinutes(originalDate.getMinutes());

      await onReschedule(draggedContent.id, newDateTime);
      await fetchScheduledContent();
    } catch (error) {
      console.error('Error rescheduling content:', error);
    } finally {
      setDraggedContent(null);
    }
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-semibold text-sm text-gray-600 py-2">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map(day => {
          const dayContent = getContentForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(day)}
              className={`min-h-24 border rounded-lg p-2 ${
                isCurrentMonth ? 'bg-white' : 'bg-gray-50'
              } ${isToday ? 'border-blue-500 border-2' : 'border-gray-200'} hover:bg-gray-50 transition-colors`}
            >
              <div className={`text-sm font-medium mb-1 ${
                isToday ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {format(day, 'd')}
              </div>

              <div className="space-y-1">
                {dayContent.map(content => {
                  const platformColors: Record<string, string> = {
                    instagram: 'bg-pink-100 border-pink-300',
                    twitter: 'bg-blue-100 border-blue-300',
                    facebook: 'bg-indigo-100 border-indigo-300',
                    linkedin: 'bg-cyan-100 border-cyan-300',
                    tiktok: 'bg-purple-100 border-purple-300',
                    youtube: 'bg-red-100 border-red-300'
                  };

                  const platform = content.platforms[0]?.platform || 'default';
                  const colorClass = platformColors[platform] || 'bg-gray-100 border-gray-300';

                  return (
                    <div
                      key={content.id}
                      draggable
                      onDragStart={() => handleDragStart(content)}
                      onClick={() => onContentClick?.(content)}
                      className={`text-xs p-1.5 rounded border ${colorClass} cursor-pointer hover:shadow-sm transition-shadow truncate`}
                      title={content.text}
                    >
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{format(new Date(content.scheduled_at), 'HH:mm')}</span>
                        {content.media.length > 0 && <span>📷</span>}
                      </div>
                      <div className="truncate">{content.text.substring(0, 30)}...</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map(day => {
          const dayContent = getContentForDate(day);
          const isToday = isSameDay(day, new Date());

          return (
            <div key={day.toISOString()} className="space-y-2">
              <div className={`text-center p-2 rounded-lg ${isToday ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}>
                <div className="text-xs font-medium">{format(day, 'EEE')}</div>
                <div className="text-lg font-bold">{format(day, 'd')}</div>
              </div>

              <div
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(day)}
                className="min-h-96 border rounded-lg p-2 bg-white space-y-2"
              >
                {dayContent.map(content => {
                  const platform = content.platforms[0]?.platform || 'default';
                  const platformColors: Record<string, string> = {
                    instagram: 'bg-pink-100 border-pink-300',
                    twitter: 'bg-blue-100 border-blue-300',
                    facebook: 'bg-indigo-100 border-indigo-300',
                    linkedin: 'bg-cyan-100 border-cyan-300',
                    tiktok: 'bg-purple-100 border-purple-300',
                    youtube: 'bg-red-100 border-red-300'
                  };
                  const colorClass = platformColors[platform] || 'bg-gray-100 border-gray-300';

                  return (
                    <div
                      key={content.id}
                      draggable
                      onDragStart={() => handleDragStart(content)}
                      onClick={() => onContentClick?.(content)}
                      className={`p-2 rounded border ${colorClass} cursor-pointer hover:shadow-sm transition-shadow`}
                    >
                      <div className="font-medium text-sm mb-1">
                        {format(new Date(content.scheduled_at), 'HH:mm')}
                      </div>
                      <div className="text-xs line-clamp-2">{content.text}</div>
                      {content.media.length > 0 && (
                        <div className="mt-1">
                          <img 
                            src={content.media[0].thumbnail_url} 
                            alt="Preview" 
                            className="w-full h-16 object-cover rounded"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayContent = getContentForDate(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="space-y-2">
        {hours.map(hour => {
          const hourContent = dayContent.filter(content => {
            const contentHour = new Date(content.scheduled_at).getHours();
            return contentHour === hour;
          });

          return (
            <div key={hour} className="flex gap-4">
              <div className="w-20 text-sm font-medium text-gray-600 pt-2">
                {format(new Date().setHours(hour, 0), 'HH:00')}
              </div>
              <div
                onDragOver={handleDragOver}
                onDrop={() => {
                  const newDate = new Date(currentDate);
                  newDate.setHours(hour, 0);
                  handleDrop(newDate);
                }}
                className="flex-1 min-h-16 border rounded-lg p-2 bg-white space-y-2"
              >
                {hourContent.map(content => {
                  const platform = content.platforms[0]?.platform || 'default';
                  const platformColors: Record<string, string> = {
                    instagram: 'bg-pink-100 border-pink-300',
                    twitter: 'bg-blue-100 border-blue-300',
                    facebook: 'bg-indigo-100 border-indigo-300',
                    linkedin: 'bg-cyan-100 border-cyan-300',
                    tiktok: 'bg-purple-100 border-purple-300',
                    youtube: 'bg-red-100 border-red-300'
                  };
                  const colorClass = platformColors[platform] || 'bg-gray-100 border-gray-300';

                  return (
                    <div
                      key={content.id}
                      draggable
                      onDragStart={() => handleDragStart(content)}
                      onClick={() => onContentClick?.(content)}
                      className={`p-3 rounded border ${colorClass} cursor-pointer hover:shadow-sm transition-shadow`}
                    >
                      <div className="flex items-start gap-3">
                        {content.media.length > 0 && (
                          <img 
                            src={content.media[0].thumbnail_url} 
                            alt="Preview" 
                            className="w-20 h-20 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-sm mb-1">
                            {format(new Date(content.scheduled_at), 'HH:mm')} - {platform}
                          </div>
                          <div className="text-sm">{content.text}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ←
          </button>
          <h2 className="text-xl font-bold">
            {format(currentDate, view === 'day' ? 'MMMM d, yyyy' : 'MMMM yyyy')}
          </h2>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            →
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setView('month')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              view === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setView('week')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              view === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setView('day')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              view === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Day
          </button>
        </div>
      </div>

      {/* Calendar View */}
      {loading ? (
        <div className="flex justify-center items-center h-96">
          <div className="text-gray-500">Loading calendar...</div>
        </div>
      ) : (
        <>
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
          {view === 'day' && renderDayView()}
        </>
      )}

      {/* Legend */}
      <div className="mt-6 pt-6 border-t">
        <div className="text-sm font-medium text-gray-700 mb-2">Platform Colors:</div>
        <div className="flex flex-wrap gap-3">
          {[
            { name: 'Instagram', color: 'bg-pink-100 border-pink-300' },
            { name: 'Twitter', color: 'bg-blue-100 border-blue-300' },
            { name: 'Facebook', color: 'bg-indigo-100 border-indigo-300' },
            { name: 'LinkedIn', color: 'bg-cyan-100 border-cyan-300' },
            { name: 'TikTok', color: 'bg-purple-100 border-purple-300' },
            { name: 'YouTube', color: 'bg-red-100 border-red-300' }
          ].map(platform => (
            <div key={platform.name} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded border ${platform.color}`} />
              <span className="text-xs text-gray-600">{platform.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
