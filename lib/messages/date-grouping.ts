/**
 * Date Grouping Utilities
 * 
 * Handles grouping messages by date for display with date separators
 */

import type { Message } from './message-grouping';

export interface DateGroup {
  date: Date;
  label: string;
  messages: Message[];
}

/**
 * Group messages by date
 * 
 * Returns array of date groups with formatted labels:
 * - Today
 * - Yesterday
 * - This week (Mon, Tue, etc.)
 * - Older dates (formatted as "Month Day, Year")
 */
export function groupMessagesByDate(messages: Message[]): DateGroup[] {
  if (messages.length === 0) return [];

  const groups: Map<string, DateGroup> = new Map();

  for (const message of messages) {
    const messageDate = typeof message.timestamp === 'string'
      ? new Date(message.timestamp)
      : message.timestamp;

    // Normalize to start of day for grouping
    const dayStart = new Date(messageDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayKey = dayStart.toISOString().split('T')[0];

    if (!groups.has(dayKey)) {
      const label = formatDateLabel(dayStart);
      groups.set(dayKey, {
        date: dayStart,
        label,
        messages: [],
      });
    }

    groups.get(dayKey)!.messages.push(message);
  }

  // Convert to array and sort by date (oldest first)
  return Array.from(groups.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Format date label for display
 * 
 * Returns:
 * - "Today" for today
 * - "Yesterday" for yesterday
 * - "Monday", "Tuesday", etc. for this week
 * - "December 15, 2024" for older dates
 */
export function formatDateLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const messageDate = new Date(date);
  messageDate.setHours(0, 0, 0, 0);

  // Check if today
  if (messageDate.getTime() === today.getTime()) {
    return 'Today';
  }

  // Check if yesterday
  if (messageDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }

  // Check if this week (last 7 days)
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  if (messageDate > weekAgo) {
    return messageDate.toLocaleDateString('en-US', { weekday: 'long' });
  }

  // Older than a week
  return messageDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Check if two dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

/**
 * Get start of day for a given date
 */
export function getStartOfDay(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Get end of day for a given date
 */
export function getEndOfDay(date: Date): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Get messages for a specific date
 */
export function getMessagesForDate(messages: Message[], date: Date): Message[] {
  const dayStart = getStartOfDay(date);
  const dayEnd = getEndOfDay(date);

  return messages.filter(msg => {
    const msgDate = typeof msg.timestamp === 'string'
      ? new Date(msg.timestamp)
      : msg.timestamp;
    return msgDate >= dayStart && msgDate <= dayEnd;
  });
}

/**
 * Get relative date string
 * 
 * Returns:
 * - "Today" for today
 * - "Yesterday" for yesterday
 * - "2 days ago" for 2 days ago
 * - "1 week ago" for 1 week ago
 * - "2 weeks ago" for 2 weeks ago
 * - "1 month ago" for 1 month ago
 * - "December 15, 2024" for older dates
 */
export function getRelativeDateString(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  }

  if (diffDays === 1) {
    return 'Yesterday';
  }

  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) {
    return '1 week ago';
  }

  if (diffWeeks < 4) {
    return `${diffWeeks} weeks ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) {
    return '1 month ago';
  }

  if (diffMonths < 12) {
    return `${diffMonths} months ago`;
  }

  const diffYears = Math.floor(diffDays / 365);
  if (diffYears === 1) {
    return '1 year ago';
  }

  return `${diffYears} years ago`;
}
