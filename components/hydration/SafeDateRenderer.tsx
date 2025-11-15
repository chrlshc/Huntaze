'use client';

import { useEffect, useState } from 'react';

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
  const [formattedDate, setFormattedDate] = useState<string | null>(null);

  useEffect(() => {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    let formatted: string;
    
    switch (format) {
      case 'full':
        formatted = dateObj.toLocaleDateString(locale, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        break;
      
      case 'short':
        formatted = dateObj.toLocaleDateString(locale, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
        break;
      
      case 'time':
        formatted = dateObj.toLocaleTimeString(locale, {
          hour: '2-digit',
          minute: '2-digit',
        });
        break;
      
      case 'relative':
        formatted = getRelativeTime(dateObj);
        break;
      
      default:
        formatted = dateObj.toLocaleDateString(locale);
    }
    
    setFormattedDate(formatted);
  }, [date, format, locale]);

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
