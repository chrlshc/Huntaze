'use client';

import { useEffect, useState } from 'react';

/**
 * SafeBadge Component
 * 
 * Renders a badge with a count that's safe from hydration mismatches.
 * Useful for notification badges, unread counts, etc.
 */

interface SafeBadgeProps {
  count: number;
  type?: 'unread' | 'alert' | 'notification';
  maxCount?: number;
  className?: string;
  ariaLabel?: string;
}

export function SafeBadge({
  count,
  type = 'unread',
  maxCount = 99,
  className = '',
  ariaLabel,
}: SafeBadgeProps) {
  const [isClient, setIsClient] = useState(false);
  const [displayCount, setDisplayCount] = useState(0);

  useEffect(() => {
    setIsClient(true);
    setDisplayCount(count);
  }, [count]);

  // Don't render on server to avoid hydration mismatch
  if (!isClient) {
    return null;
  }

  // Don't render if count is 0
  if (displayCount === 0) {
    return null;
  }

  const formattedCount = displayCount > maxCount ? `${maxCount}+` : displayCount;
  const label = ariaLabel || `${displayCount} ${type === 'unread' ? 'new messages' : 'alerts'}`;

  return (
    <span
      className={`nav-badge ${displayCount > 0 ? 'nav-badge-pulse' : ''} ${className}`}
      role="status"
      aria-label={label}
    >
      {formattedCount}
    </span>
  );
}

/**
 * SafeUnreadBadge Component
 * 
 * Specialized badge for unread message counts
 */
export function SafeUnreadBadge({ count, className = '' }: { count: number; className?: string }) {
  return (
    <SafeBadge
      count={count}
      type="unread"
      maxCount={99}
      className={className}
      ariaLabel={`${count} unread messages`}
    />
  );
}

/**
 * SafeNotificationBadge Component
 * 
 * Specialized badge for notification counts
 */
export function SafeNotificationBadge({ count, className = '' }: { count: number; className?: string }) {
  return (
    <SafeBadge
      count={count}
      type="notification"
      maxCount={9}
      className={className}
      ariaLabel={`${count} notifications`}
    />
  );
}
