'use client';

import { useMemo } from 'react';
import { useIsClient } from '@/hooks/useIsClient';

/**
 * SafeDateRenderer Component
 * 
 * Renders dates safely without hydration mismatches.
 * Server renders a placeholder, client renders the actual formatted date.
 */

interface SafeDateRendererProps {
  date: Date | string | number;
  format?: 'full' | 'short' | 'time' | 'relative';
  locale?: string;
  className?: string;
}

export function SafeDateRenderer({
  date,
  format = 'full',
  locale = 'en-US',
  className = '',
}: SafeDateRendererProps) {
  const isClient = useIsClient();
  const formattedDate = useMemo(() => {
    if (!isClient) return null;
    const dateObj = date instanceof Date ? date : new Date(date);

    switch (format) {
      case 'full':
        return dateObj.toLocaleDateString(locale, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      case 'short':
        return dateObj.toLocaleDateString(locale, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      case 'time':
        return dateObj.toLocaleTimeString(locale, {
          hour: '2-digit',
          minute: '2-digit',
        });
      case 'relative':
        return getRelativeTime(dateObj);
      default:
        return dateObj.toLocaleDateString(locale);
    }
  }, [date, format, isClient, locale]);

  // Server-side: render ISO string as fallback
  if (formattedDate === null) {
    const dateObj = date instanceof Date ? date : new Date(date);
    return <time className={className} dateTime={dateObj.toISOString()}>
      {dateObj.toISOString().split('T')[0]}
    </time>;
  }

  // Client-side: render formatted date
  const dateObj = date instanceof Date ? date : new Date(date);
  return <time className={className} dateTime={dateObj.toISOString()}>
    {formattedDate}
  </time>;
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'just now';
  } else if (diffMin < 60) {
    return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  } else if (diffHour < 24) {
    return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  } else if (diffDay < 7) {
    return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * SafeTimestamp Component
 * 
 * Specialized component for timestamps
 */
export function SafeTimestamp({ timestamp, className = '' }: { timestamp: number | string | Date; className?: string }) {
  return <SafeDateRenderer date={timestamp} format="relative" className={className} />;
}
