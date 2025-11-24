/**
 * Unit tests for Changelog API type helpers
 * 
 * Tests the utility functions and type guards in the changelog types module.
 */

import { describe, it, expect } from 'vitest';
import {
  isChangelogError,
  parseChangelogDate,
  formatChangelogDate,
  isNewChangelogEntry,
  sortChangelogEntries,
  type ChangelogEntry,
  type ChangelogResponse,
  type ChangelogErrorResponse,
} from '@/app/api/changelog/types';

describe('Changelog Type Helpers', () => {
  describe('isChangelogError', () => {
    it('should return true for error response', () => {
      const errorResponse: ChangelogErrorResponse = {
        entries: [],
        latestReleaseDate: new Date(0).toISOString(),
      };

      expect(isChangelogError(errorResponse)).toBe(true);
    });

    it('should return false for valid response with entries', () => {
      const validResponse: ChangelogResponse = {
        entries: [
          {
            id: '1',
            title: 'Test',
            description: 'Test description',
            releaseDate: '2024-01-15T00:00:00Z',
            features: ['Feature 1'],
          },
        ],
        latestReleaseDate: '2024-01-15T00:00:00Z',
      };

      expect(isChangelogError(validResponse)).toBe(false);
    });

    it('should return false for empty entries with non-epoch date', () => {
      const response: ChangelogResponse = {
        entries: [],
        latestReleaseDate: '2024-01-15T00:00:00Z',
      };

      expect(isChangelogError(response)).toBe(false);
    });
  });

  describe('parseChangelogDate', () => {
    it('should parse valid ISO 8601 date string', () => {
      const dateString = '2024-01-15T00:00:00Z';
      const date = parseChangelogDate(dateString);

      expect(date).toBeInstanceOf(Date);
      // Check that the date is valid and matches the expected timestamp
      expect(date.getTime()).toBe(new Date(dateString).getTime());
    });

    it('should throw error for invalid date string', () => {
      expect(() => parseChangelogDate('invalid-date')).toThrow('Invalid changelog date');
    });

    it('should throw error for empty string', () => {
      expect(() => parseChangelogDate('')).toThrow('Invalid changelog date');
    });

    it('should parse various valid date formats', () => {
      const validDates = [
        '2024-01-15T00:00:00Z',
        '2024-01-15T12:30:45Z',
        '2024-12-31T23:59:59Z',
      ];

      validDates.forEach((dateString) => {
        const date = parseChangelogDate(dateString);
        expect(date).toBeInstanceOf(Date);
        expect(date.toString()).not.toBe('Invalid Date');
      });
    });
  });

  describe('formatChangelogDate', () => {
    it('should format valid date string to readable format', () => {
      const dateString = '2024-01-15T00:00:00Z';
      const formatted = formatChangelogDate(dateString);

      // Check that it's a valid formatted date (format may vary by timezone)
      expect(formatted).toMatch(/^(January 14|January 15), 2024$/);
    });

    it('should return "Invalid date" for invalid date string', () => {
      const formatted = formatChangelogDate('invalid-date');
      expect(formatted).toBe('Invalid date');
    });

    it('should format various dates correctly', () => {
      const testCases = [
        '2024-01-01T00:00:00Z',
        '2024-12-31T00:00:00Z',
        '2024-06-15T00:00:00Z',
      ];

      testCases.forEach((input) => {
        const formatted = formatChangelogDate(input);
        // Check that it's a valid formatted date (not "Invalid date")
        expect(formatted).not.toBe('Invalid date');
        // Check that it contains a month name and year
        expect(formatted).toMatch(/^[A-Z][a-z]+ \d{1,2}, \d{4}$/);
      });
    });
  });

  describe('isNewChangelogEntry', () => {
    it('should return true when entry is newer than last viewed date', () => {
      const entry: ChangelogEntry = {
        id: '1',
        title: 'New Feature',
        description: 'Description',
        releaseDate: '2024-01-15T00:00:00Z',
        features: [],
      };
      const lastViewedDate = new Date('2024-01-10T00:00:00Z');

      expect(isNewChangelogEntry(entry, lastViewedDate)).toBe(true);
    });

    it('should return false when entry is older than last viewed date', () => {
      const entry: ChangelogEntry = {
        id: '1',
        title: 'Old Feature',
        description: 'Description',
        releaseDate: '2024-01-05T00:00:00Z',
        features: [],
      };
      const lastViewedDate = new Date('2024-01-10T00:00:00Z');

      expect(isNewChangelogEntry(entry, lastViewedDate)).toBe(false);
    });

    it('should return false when entry date equals last viewed date', () => {
      const entry: ChangelogEntry = {
        id: '1',
        title: 'Feature',
        description: 'Description',
        releaseDate: '2024-01-10T00:00:00Z',
        features: [],
      };
      const lastViewedDate = new Date('2024-01-10T00:00:00Z');

      expect(isNewChangelogEntry(entry, lastViewedDate)).toBe(false);
    });

    it('should return false for invalid entry date', () => {
      const entry: ChangelogEntry = {
        id: '1',
        title: 'Feature',
        description: 'Description',
        releaseDate: 'invalid-date',
        features: [],
      };
      const lastViewedDate = new Date('2024-01-10T00:00:00Z');

      expect(isNewChangelogEntry(entry, lastViewedDate)).toBe(false);
    });
  });

  describe('sortChangelogEntries', () => {
    it('should sort entries by date in descending order (newest first)', () => {
      const entries: ChangelogEntry[] = [
        {
          id: '1',
          title: 'Old',
          description: 'Description',
          releaseDate: '2024-01-01T00:00:00Z',
          features: [],
        },
        {
          id: '2',
          title: 'Newest',
          description: 'Description',
          releaseDate: '2024-01-15T00:00:00Z',
          features: [],
        },
        {
          id: '3',
          title: 'Middle',
          description: 'Description',
          releaseDate: '2024-01-10T00:00:00Z',
          features: [],
        },
      ];

      const sorted = sortChangelogEntries(entries);

      expect(sorted[0].id).toBe('2'); // Newest
      expect(sorted[1].id).toBe('3'); // Middle
      expect(sorted[2].id).toBe('1'); // Oldest
    });

    it('should not mutate the original array', () => {
      const entries: ChangelogEntry[] = [
        {
          id: '1',
          title: 'First',
          description: 'Description',
          releaseDate: '2024-01-01T00:00:00Z',
          features: [],
        },
        {
          id: '2',
          title: 'Second',
          description: 'Description',
          releaseDate: '2024-01-15T00:00:00Z',
          features: [],
        },
      ];

      const originalOrder = entries.map((e) => e.id);
      sortChangelogEntries(entries);

      expect(entries.map((e) => e.id)).toEqual(originalOrder);
    });

    it('should handle empty array', () => {
      const entries: ChangelogEntry[] = [];
      const sorted = sortChangelogEntries(entries);

      expect(sorted).toEqual([]);
    });

    it('should handle single entry', () => {
      const entries: ChangelogEntry[] = [
        {
          id: '1',
          title: 'Only',
          description: 'Description',
          releaseDate: '2024-01-01T00:00:00Z',
          features: [],
        },
      ];

      const sorted = sortChangelogEntries(entries);

      expect(sorted).toEqual(entries);
    });

    it('should handle entries with invalid dates gracefully', () => {
      const entries: ChangelogEntry[] = [
        {
          id: '1',
          title: 'Valid',
          description: 'Description',
          releaseDate: '2024-01-15T00:00:00Z',
          features: [],
        },
        {
          id: '2',
          title: 'Invalid',
          description: 'Description',
          releaseDate: 'invalid-date',
          features: [],
        },
      ];

      // Should not throw error
      expect(() => sortChangelogEntries(entries)).not.toThrow();
    });

    it('should maintain stable sort for entries with same date', () => {
      const entries: ChangelogEntry[] = [
        {
          id: '1',
          title: 'First',
          description: 'Description',
          releaseDate: '2024-01-15T00:00:00Z',
          features: [],
        },
        {
          id: '2',
          title: 'Second',
          description: 'Description',
          releaseDate: '2024-01-15T00:00:00Z',
          features: [],
        },
      ];

      const sorted = sortChangelogEntries(entries);

      // Order should be preserved for same dates
      expect(sorted[0].id).toBe('1');
      expect(sorted[1].id).toBe('2');
    });
  });
});
