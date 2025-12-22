/**
 * Tests for Date Grouping Logic
 * 
 * Validates the date grouping and labeling functionality
 * for message separators (Aujourd'hui/Hier/Date)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isToday,
  isYesterday,
  formatDateLabel,
  getStartOfDay,
  groupMessagesByDate,
  isSameDay,
  type Message
} from '../../../lib/messages/date-grouping';

describe('Date Grouping Logic', () => {
  beforeEach(() => {
    // Reset date mocks before each test
    vi.useRealTimers();
  });

  describe('isToday', () => {
    it('should return true for current date', () => {
      const now = new Date();
      expect(isToday(now)).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });

    it('should return false for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isToday(tomorrow)).toBe(false);
    });
  });

  describe('isYesterday', () => {
    it('should return true for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isYesterday(yesterday)).toBe(true);
    });

    it('should return false for today', () => {
      const today = new Date();
      expect(isYesterday(today)).toBe(false);
    });

    it('should return false for two days ago', () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      expect(isYesterday(twoDaysAgo)).toBe(false);
    });
  });

  describe('formatDateLabel', () => {
    it('should return "Aujourd\'hui" for today', () => {
      const today = new Date();
      expect(formatDateLabel(today)).toBe("Aujourd'hui");
    });

    it('should return "Hier" for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(formatDateLabel(yesterday)).toBe("Hier");
    });

    it('should return formatted date without year for current year', () => {
      const date = new Date(new Date().getFullYear(), 0, 15); // January 15 of current year
      const label = formatDateLabel(date);
      expect(label).toMatch(/15 janvier/);
      expect(label).not.toMatch(/\d{4}/); // Should not contain year
    });

    it('should return formatted date with year for previous years', () => {
      const date = new Date(2023, 0, 15); // January 15, 2023
      const label = formatDateLabel(date);
      expect(label).toMatch(/15 janvier 2023/);
    });
  });

  describe('getStartOfDay', () => {
    it('should return midnight for any time', () => {
      const date = new Date(2024, 0, 15, 14, 30, 45); // 2:30:45 PM
      const startOfDay = getStartOfDay(date);
      
      expect(startOfDay.getHours()).toBe(0);
      expect(startOfDay.getMinutes()).toBe(0);
      expect(startOfDay.getSeconds()).toBe(0);
      expect(startOfDay.getMilliseconds()).toBe(0);
    });

    it('should preserve the date', () => {
      const date = new Date(2024, 0, 15, 14, 30, 45);
      const startOfDay = getStartOfDay(date);
      
      expect(startOfDay.getDate()).toBe(15);
      expect(startOfDay.getMonth()).toBe(0);
      expect(startOfDay.getFullYear()).toBe(2024);
    });
  });

  describe('isSameDay', () => {
    it('should return true for same day at different times', () => {
      const date1 = new Date(2024, 0, 15, 10, 0, 0);
      const date2 = new Date(2024, 0, 15, 18, 30, 0);
      expect(isSameDay(date1, date2)).toBe(true);
    });

    it('should return false for different days', () => {
      const date1 = new Date(2024, 0, 15);
      const date2 = new Date(2024, 0, 16);
      expect(isSameDay(date1, date2)).toBe(false);
    });

    it('should return false for same day in different months', () => {
      const date1 = new Date(2024, 0, 15);
      const date2 = new Date(2024, 1, 15);
      expect(isSameDay(date1, date2)).toBe(false);
    });
  });

  describe('groupMessagesByDate', () => {
    it('should group messages by date', () => {
      const messages: Message[] = [
        { id: '1', timestamp: new Date(2024, 0, 15, 10, 0), content: 'Message 1', senderId: 'user1' },
        { id: '2', timestamp: new Date(2024, 0, 15, 14, 0), content: 'Message 2', senderId: 'user2' },
        { id: '3', timestamp: new Date(2024, 0, 14, 10, 0), content: 'Message 3', senderId: 'user1' },
      ];

      const groups = groupMessagesByDate(messages);
      
      expect(groups).toHaveLength(2);
      expect(groups[0].messages).toHaveLength(2); // Jan 15
      expect(groups[1].messages).toHaveLength(1); // Jan 14
    });

    it('should sort groups by date (newest first)', () => {
      const messages: Message[] = [
        { id: '1', timestamp: new Date(2024, 0, 14), content: 'Old', senderId: 'user1' },
        { id: '2', timestamp: new Date(2024, 0, 16), content: 'New', senderId: 'user2' },
        { id: '3', timestamp: new Date(2024, 0, 15), content: 'Middle', senderId: 'user1' },
      ];

      const groups = groupMessagesByDate(messages);
      
      expect(groups[0].date.getDate()).toBe(16); // Newest
      expect(groups[1].date.getDate()).toBe(15);
      expect(groups[2].date.getDate()).toBe(14); // Oldest
    });

    it('should handle string timestamps', () => {
      const messages: Message[] = [
        { id: '1', timestamp: '2024-01-15T10:00:00Z', content: 'Message 1', senderId: 'user1' },
        { id: '2', timestamp: '2024-01-15T14:00:00Z', content: 'Message 2', senderId: 'user2' },
      ];

      const groups = groupMessagesByDate(messages);
      
      expect(groups).toHaveLength(1);
      expect(groups[0].messages).toHaveLength(2);
    });

    it('should create correct labels for groups', () => {
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      const messages: Message[] = [
        { id: '1', timestamp: today, content: 'Today', senderId: 'user1' },
        { id: '2', timestamp: yesterday, content: 'Yesterday', senderId: 'user2' },
        { id: '3', timestamp: lastWeek, content: 'Last week', senderId: 'user1' },
      ];

      const groups = groupMessagesByDate(messages);
      
      expect(groups[0].label).toBe("Aujourd'hui");
      expect(groups[1].label).toBe("Hier");
      expect(groups[2].label).toMatch(/\d+ \w+/); // Should be a formatted date
    });

    it('should handle empty message array', () => {
      const groups = groupMessagesByDate([]);
      expect(groups).toHaveLength(0);
    });

    it('should preserve message order within groups (newest first)', () => {
      const messages: Message[] = [
        { id: '1', timestamp: new Date(2024, 0, 15, 10, 0), content: 'First', senderId: 'user1' },
        { id: '2', timestamp: new Date(2024, 0, 15, 14, 0), content: 'Second', senderId: 'user2' },
        { id: '3', timestamp: new Date(2024, 0, 15, 18, 0), content: 'Third', senderId: 'user1' },
      ];

      const groups = groupMessagesByDate(messages);
      
      expect(groups[0].messages[0].content).toBe('Third'); // Newest
      expect(groups[0].messages[1].content).toBe('Second');
      expect(groups[0].messages[2].content).toBe('First'); // Oldest
    });
  });
});
