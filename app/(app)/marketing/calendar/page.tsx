'use client';

/**
 * Marketing Calendar Page - Polaris Design
 */
export const dynamic = 'force-dynamic';

import { useMemo, useState } from 'react';
import '@/styles/polaris-analytics.css';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { useContent, type ContentItem } from '@/hooks/useContent';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Calendar as CalendarIcon,
  Image as ImageIcon,
  Video,
  FileText,
  Sparkles,
  Clock
} from 'lucide-react';

type PlatformType = 'instagram' | 'tiktok' | 'twitter' | 'reddit' | 'onlyfans';

interface ScheduledContent {
  id: string;
  title: string;
  platforms: PlatformType[];
  mediaType: 'image' | 'video' | 'text';
  scheduledAt: string;
  status: 'draft' | 'scheduled' | 'published';
  aiGenerated?: boolean;
}

const PLATFORM_COLORS: Record<PlatformType, string> = {
  instagram: '#E1306C',
  tiktok: '#000000',
  twitter: '#1DA1F2',
  reddit: '#FF4500',
  onlyfans: '#00AFF0',
};

// Polaris Card Component
const PCard = ({ children, title, noPadding, headerAction }: { 
  children: React.ReactNode; 
  title?: string; 
  noPadding?: boolean;
  headerAction?: React.ReactNode;
}) => (
  <div className="p-card">
    {title && (
      <div className="p-card-header" style={{ justifyContent: 'space-between' }}>
        <h3 className="p-card-title">{title}</h3>
        {headerAction}
      </div>
    )}
    <div className={noPadding ? "p-card-body no-padding" : "p-card-body"}>
      {children}
    </div>
  </div>
);

export default function MarketingCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { data: contentResponse, error: contentError, isLoading: contentLoading } = useContent({
    status: 'all',
    limit: 200,
  });

  function getDateString(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString();
  }

  const mapPlatform = (platform: ContentItem['platform']): PlatformType => {
    switch (platform) {
      case 'instagram':
        return 'instagram';
      case 'tiktok':
        return 'tiktok';
      case 'onlyfans':
      case 'fansly':
      default:
        return 'onlyfans';
    }
  };

  const scheduledContent = useMemo(() => {
    const items = contentResponse?.data?.items ?? [];
    return items
      .map<ScheduledContent | null>((item) => {
        const scheduledAt = item.scheduledAt || item.createdAt || item.updatedAt;
        if (!scheduledAt) return null;

        return {
          id: item.id,
          title: item.title,
          platforms: [mapPlatform(item.platform)],
          mediaType: item.type,
          scheduledAt,
          status: item.status,
          aiGenerated: Boolean(item.metadata?.aiGenerated),
        };
      })
      .filter((item): item is ScheduledContent => Boolean(item));
  }, [contentResponse]);

  function getCalendarDays() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const days: { date: Date; isCurrentMonth: boolean; isToday: boolean; content: ScheduledContent[] }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false, isToday: false, content: getContentForDate(date) });
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true, isToday: date.getTime() === today.getTime(), content: getContentForDate(date) });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false, isToday: false, content: getContentForDate(date) });
    }
    return days;
  }

  function getContentForDate(date: Date): ScheduledContent[] {
    return scheduledContent.filter(content => {
      const contentDate = new Date(content.scheduledAt);
      return contentDate.getFullYear() === date.getFullYear() && 
             contentDate.getMonth() === date.getMonth() && 
             contentDate.getDate() === date.getDate();
    });
  }

  function navigateMonth(direction: 'prev' | 'next') {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  }

  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const calendarDays = getCalendarDays();

  const upcomingContent = scheduledContent
    .filter(c => c.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 4);

  if (contentLoading) {
    return (
      <ContentPageErrorBoundary pageName="Content Calendar">
        <div className="polaris-analytics">
          <div className="empty-state">
            <p className="empty-state-text">Loading...</p>
          </div>
        </div>
      </ContentPageErrorBoundary>
    );
  }

  if (contentError) {
    return (
      <ContentPageErrorBoundary pageName="Content Calendar">
        <div className="polaris-analytics">
          <div className="empty-state">
            <p className="empty-state-text">Failed to load calendar data.</p>
          </div>
        </div>
      </ContentPageErrorBoundary>
    );
  }

  return (
    <ContentPageErrorBoundary pageName="Content Calendar">
      <div className="polaris-analytics">
        {/* Page Header */}
        <div className="page-header" style={{ justifyContent: 'space-between' }}>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarIcon size={22} />
            Content Calendar
          </h1>
          <button className="filter-pill cta-button">
            <Plus size={14} />
            Schedule Post
          </button>
        </div>

        <div className="content-wrapper">
          {/* Calendar Card */}
          <PCard noPadding>
            {/* Calendar Navigation */}
            <div style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px', borderBottom: '1px solid #E3E3E3'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={() => navigateMonth('prev')} className="filter-pill">
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#303030', minWidth: 160, textAlign: 'center' }}>
                  {monthYear}
                </span>
                <button onClick={() => navigateMonth('next')} className="filter-pill">
                  <ChevronRight size={16} />
                </button>
              </div>
              <button onClick={() => setCurrentDate(new Date())} className="filter-pill">
                Today
              </button>
            </div>

            {/* Scrollable Calendar Container */}
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: 700 }}>
                {/* Weekday Headers */}
                <div style={{ 
                  display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
                  background: '#F9FAFB', borderBottom: '1px solid #E3E3E3'
                }}>
                  {weekDays.map(day => (
                    <div key={day} style={{ 
                      padding: '12px 8px', textAlign: 'center',
                      fontSize: 12, fontWeight: 600, color: '#616161',
                      textTransform: 'uppercase', letterSpacing: '0.5px'
                    }}>
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                {[0, 1, 2, 3, 4, 5].map(rowIndex => (
                  <div key={rowIndex} style={{ 
                    display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
                    borderBottom: rowIndex < 5 ? '1px solid #E3E3E3' : 'none'
                  }}>
                    {calendarDays.slice(rowIndex * 7, (rowIndex + 1) * 7).map((day, colIndex) => (
                      <div
                        key={colIndex}
                        style={{
                          height: 80, padding: '6px 8px',
                          background: day.isToday ? '#F0F9FF' : day.isCurrentMonth ? '#fff' : '#FAFAFA',
                          borderRight: colIndex < 6 ? '1px solid #E3E3E3' : 'none',
                          cursor: 'pointer', position: 'relative', overflow: 'hidden'
                        }}
                      >
                        <div style={{ 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 24, height: 24, borderRadius: '50%',
                          fontSize: 12, fontWeight: day.isToday ? 600 : 500, 
                          color: day.isToday ? '#fff' : day.isCurrentMonth ? '#303030' : '#D1D5DB',
                          background: day.isToday ? '#303030' : 'transparent',
                          marginBottom: 4
                        }}>
                          {day.date.getDate()}
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {day.content.slice(0, 2).map(content => (
                            <div key={content.id} style={{
                              fontSize: 10, padding: '2px 4px', borderRadius: 3,
                              background: content.status === 'draft' ? '#F3F4F6' : '#EEF2FF',
                              color: content.status === 'draft' ? '#616161' : '#4F46E5',
                              fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                            }}>
                              {content.title}
                            </div>
                          ))}
                          {day.content.length > 2 && (
                            <div style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 500 }}>
                              +{day.content.length - 2}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </PCard>

          {/* Upcoming Content */}
          <PCard title="Upcoming Content" noPadding headerAction={
            <span style={{ fontSize: 12, color: '#616161' }}>{upcomingContent.length} scheduled</span>
          }>
            {upcomingContent.length === 0 ? (
              <div className="empty-state">
                <CalendarIcon size={32} color="#9CA3AF" style={{ marginBottom: 12 }} />
                <p className="empty-state-text">No scheduled content</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <div style={{ display: 'flex', gap: 0, minWidth: 'fit-content' }}>
                  {upcomingContent.map((content, index) => (
                    <div key={content.id} style={{ 
                      padding: 16,
                      borderRight: index < upcomingContent.length - 1 ? '1px solid #E3E3E3' : 'none',
                      minWidth: 200, flex: '0 0 auto'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <div style={{ 
                          width: 32, height: 32, borderRadius: 6, 
                          background: content.mediaType === 'video' ? '#FEF3C7' : '#DBEAFE',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: content.mediaType === 'video' ? '#D97706' : '#2563EB'
                        }}>
                          {content.mediaType === 'image' && <ImageIcon size={16} />}
                          {content.mediaType === 'video' && <Video size={16} />}
                          {content.mediaType === 'text' && <FileText size={16} />}
                        </div>
                        {content.aiGenerated && (
                          <span className="scope-tag" style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Sparkles size={10} /> AI
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontSize: 13, fontWeight: 600, color: '#303030', margin: '0 0 8px 0' }}>
                        {content.title}
                      </h3>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                        {content.platforms.map(platform => (
                          <span key={platform} style={{ 
                            width: 6, height: 6, borderRadius: '50%',
                            background: PLATFORM_COLORS[platform]
                          }} />
                        ))}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#616161' }}>
                        <Clock size={12} />
                        {new Date(content.scheduledAt).toLocaleDateString('en-US', { 
                          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </PCard>
        </div>
      </div>
    </ContentPageErrorBoundary>
  );
}
