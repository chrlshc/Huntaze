'use client';

/**
 * Marketing Calendar Page
 * 
 * Implements calendar view with scheduled content and drag-and-drop functionality.
 * 
 * Feature: dashboard-ux-overhaul
 * Requirements: 5.4
 */
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageLayout } from '@/components/layout/PageLayout';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Calendar as CalendarIcon,
  Image,
  Video,
  FileText,
  Sparkles,
  Clock,
  MoreHorizontal
} from 'lucide-react';

// Platform types
type PlatformType = 'instagram' | 'tiktok' | 'twitter' | 'reddit' | 'onlyfans';

// Scheduled content interface
interface ScheduledContent {
  id: string;
  title: string;
  platforms: PlatformType[];
  mediaType: 'image' | 'video' | 'text';
  scheduledAt: string;
  status: 'draft' | 'scheduled' | 'published';
  aiGenerated?: boolean;
}

// Calendar day interface
interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  content: ScheduledContent[];
}

// View type
type CalendarView = 'month' | 'week';

// Platform colors
const PLATFORM_COLORS: Record<PlatformType, string> = {
  instagram: 'bg-pink-500',
  tiktok: 'bg-black dark:bg-white dark:text-black',
  twitter: 'bg-blue-400',
  reddit: 'bg-orange-500',
  onlyfans: 'bg-blue-600',
};

export default function MarketingCalendarPage() {
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [scheduledContent, setScheduledContent] = useState<ScheduledContent[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      try {
        // Mock data
        const mockContent: ScheduledContent[] = [
          {
            id: '1',
            title: 'Beach photoshoot reveal',
            platforms: ['instagram', 'tiktok'],
            mediaType: 'image',
            scheduledAt: getDateString(5),
            status: 'scheduled',
            aiGenerated: true,
          },
          {
            id: '2',
            title: 'Behind the scenes video',
            platforms: ['tiktok'],
            mediaType: 'video',
            scheduledAt: getDateString(7),
            status: 'scheduled',
          },
          {
            id: '3',
            title: 'Q&A announcement',
            platforms: ['instagram', 'twitter'],
            mediaType: 'text',
            scheduledAt: getDateString(3),
            status: 'scheduled',
          },
          {
            id: '4',
            title: 'New content teaser',
            platforms: ['reddit'],
            mediaType: 'image',
            scheduledAt: getDateString(10),
            status: 'draft',
          },
          {
            id: '5',
            title: 'Holiday special',
            platforms: ['instagram', 'tiktok', 'onlyfans'],
            mediaType: 'video',
            scheduledAt: getDateString(14),
            status: 'scheduled',
            aiGenerated: true,
          },
        ];
        setScheduledContent(mockContent);
      } catch (error) {
        console.error('Failed to load content:', error);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  // Helper to get date string for mock data
  function getDateString(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString();
  }

  // Generate calendar days for current month
  function getCalendarDays(): CalendarDay[] {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Previous month days
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        content: getContentForDate(date),
      });
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        content: getContentForDate(date),
      });
    }

    // Next month days to fill grid
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        content: getContentForDate(date),
      });
    }

    return days;
  }

  // Get content for a specific date
  function getContentForDate(date: Date): ScheduledContent[] {
    return scheduledContent.filter(content => {
      const contentDate = new Date(content.scheduledAt);
      return (
        contentDate.getFullYear() === date.getFullYear() &&
        contentDate.getMonth() === date.getMonth() &&
        contentDate.getDate() === date.getDate()
      );
    });
  }

  // Navigate months
  function navigateMonth(direction: 'prev' | 'next') {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  }

  // Format month/year
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Page actions
  const PageActions = (
    <div className="flex items-center gap-2">
      <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
        <button
          onClick={() => setView('month')}
          className={`px-3 py-1.5 text-sm ${view === 'month' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
          data-testid="view-month"
        >
          Month
        </button>
        <button
          onClick={() => setView('week')}
          className={`px-3 py-1.5 text-sm ${view === 'week' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
          data-testid="view-week"
        >
          Week
        </button>
      </div>
      <Button variant="primary" size="sm" data-testid="schedule-post">
        <Plus className="h-4 w-4 mr-1" />
        Schedule Post
      </Button>
    </div>
  );

  if (loading) {
    return (
      <ProtectedRoute requireOnboarding={false}>
        <PageLayout
          title="Content Calendar"
          subtitle="Loading..."
          breadcrumbs={[
            { label: 'Marketing', href: '/marketing' },
            { label: 'Calendar' }
          ]}
        >
          <Card className="p-6 animate-pulse">
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded" />
          </Card>
        </PageLayout>
      </ProtectedRoute>
    );
  }

  const calendarDays = getCalendarDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <ProtectedRoute requireOnboarding={false}>
      <ContentPageErrorBoundary pageName="Content Calendar">
        <PageLayout
          title="Content Calendar"
          subtitle="Plan and schedule your content across platforms"
          breadcrumbs={[
            { label: 'Marketing', href: '/marketing' },
            { label: 'Calendar' }
          ]}
          actions={PageActions}
        >
          {/* Calendar Header */}
          <Card className="mb-6" data-testid="calendar-container">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    data-testid="prev-month"
                  >
                    <ChevronLeft className="h-5 w-5 text-[var(--color-text-main)]" />
                  </button>
                  <h2 className="text-xl font-semibold text-[var(--color-text-main)]" data-testid="current-month">
                    {monthYear}
                  </h2>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    data-testid="next-month"
                  >
                    <ChevronRight className="h-5 w-5 text-[var(--color-text-main)]" />
                  </button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                  data-testid="today-btn"
                >
                  Today
                </Button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-4">
              {/* Week day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(day => (
                  <div key={day} className="text-center text-sm font-medium text-[var(--color-text-sub)] py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1" data-testid="calendar-grid">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`min-h-[100px] p-2 border rounded-lg transition-colors cursor-pointer ${
                      day.isCurrentMonth 
                        ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
                        : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                    } ${day.isToday ? 'ring-2 ring-blue-500' : ''} hover:border-blue-400`}
                    onClick={() => setSelectedDay(day.date)}
                    data-testid={`day-${day.date.getDate()}`}
                    data-current-month={day.isCurrentMonth}
                    data-today={day.isToday}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      day.isCurrentMonth ? 'text-[var(--color-text-main)]' : 'text-[var(--color-text-muted)]'
                    } ${day.isToday ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                      {day.date.getDate()}
                    </div>
                    
                    {/* Content items */}
                    <div className="space-y-1">
                      {day.content.slice(0, 2).map(content => (
                        <div
                          key={content.id}
                          className={`text-xs p-1 rounded truncate ${
                            content.status === 'draft' 
                              ? 'bg-gray-100 dark:bg-gray-700 text-[var(--color-text-sub)]' 
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          }`}
                          data-testid={`content-${content.id}`}
                          data-status={content.status}
                          draggable
                        >
                          <div className="flex items-center gap-1">
                            {content.mediaType === 'image' && <Image className="h-3 w-3 flex-shrink-0" />}
                            {content.mediaType === 'video' && <Video className="h-3 w-3 flex-shrink-0" />}
                            {content.mediaType === 'text' && <FileText className="h-3 w-3 flex-shrink-0" />}
                            <span className="truncate">{content.title}</span>
                          </div>
                        </div>
                      ))}
                      {day.content.length > 2 && (
                        <div className="text-xs text-[var(--color-text-sub)] pl-1">
                          +{day.content.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Upcoming Content */}
          <section data-testid="upcoming-content">
            <h2 className="text-lg font-semibold text-[var(--color-text-main)] mb-4">Upcoming Content</h2>
            {scheduledContent.filter(c => c.status === 'scheduled').length === 0 ? (
              <EmptyState
                icon={CalendarIcon}
                title="No scheduled content"
                description="Schedule your first post to start building your content calendar"
                actionLabel="Schedule Post"
                actionHref="/content/schedule"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scheduledContent
                  .filter(c => c.status === 'scheduled')
                  .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                  .slice(0, 6)
                  .map(content => (
                    <Card key={content.id} className="p-4" data-testid={`upcoming-${content.id}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {content.mediaType === 'image' && <Image className="h-4 w-4 text-[var(--color-text-sub)]" />}
                          {content.mediaType === 'video' && <Video className="h-4 w-4 text-[var(--color-text-sub)]" />}
                          {content.mediaType === 'text' && <FileText className="h-4 w-4 text-[var(--color-text-sub)]" />}
                          {content.aiGenerated && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-xs">
                              <Sparkles className="h-3 w-3" />
                              AI
                            </span>
                          )}
                        </div>
                        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                          <MoreHorizontal className="h-4 w-4 text-[var(--color-text-sub)]" />
                        </button>
                      </div>
                      <h3 className="font-medium text-[var(--color-text-main)] mb-2">{content.title}</h3>
                      <div className="flex items-center gap-1 mb-3">
                        {content.platforms.map(platform => (
                          <span
                            key={platform}
                            className={`w-5 h-5 rounded-full ${PLATFORM_COLORS[platform]} flex items-center justify-center`}
                          >
                            <span className="text-white text-[10px] font-bold">
                              {platform.charAt(0).toUpperCase()}
                            </span>
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-[var(--color-text-sub)]">
                        <Clock className="h-3 w-3" />
                        {new Date(content.scheduledAt).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </div>
                    </Card>
                  ))}
              </div>
            )}
          </section>
        </PageLayout>
      </ContentPageErrorBoundary>
    </ProtectedRoute>
  );
}
