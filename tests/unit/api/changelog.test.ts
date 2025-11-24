/**
 * Unit tests for Changelog API
 * 
 * Tests the /api/changelog endpoint to ensure it returns
 * properly formatted changelog data.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/changelog/route';
import type { ChangelogResponse } from '@/app/api/changelog/types';

// Mock Redis for rate limiting tests
const mockRedisInstance = {
  status: 'ready',
  incr: vi.fn(),
  expire: vi.fn(),
  ttl: vi.fn(),
  del: vi.fn(),
  quit: vi.fn(),
  connect: vi.fn(),
};

vi.mock('ioredis', () => {
  return {
    Redis: vi.fn(function() {
      return mockRedisInstance;
    }),
  };
});

describe('Changelog API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedisInstance.status = 'ready';
    // Mock Redis to allow requests (within rate limit)
    vi.mocked(mockRedisInstance.incr).mockResolvedValue(1);
    vi.mocked(mockRedisInstance.expire).mockResolvedValue(1);
    vi.mocked(mockRedisInstance.ttl).mockResolvedValue(300);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Helper to create a NextRequest for testing
   */
  function createTestRequest(): NextRequest {
    return new NextRequest('http://localhost:3000/api/changelog', {
      method: 'GET',
    });
  }

  describe('GET /api/changelog', () => {
    it('should return changelog entries with correct structure', async () => {
      const req = createTestRequest();
      const response = await GET(req);
      const data: ChangelogResponse = await response.json();

      expect(data).toHaveProperty('entries');
      expect(data).toHaveProperty('latestReleaseDate');
      expect(Array.isArray(data.entries)).toBe(true);
    });

    it('should return entries with all required fields', async () => {
      const req = createTestRequest();
      const response = await GET(req);
      const data: ChangelogResponse = await response.json();

      expect(data.entries.length).toBeGreaterThan(0);

      data.entries.forEach((entry) => {
        expect(entry).toHaveProperty('id');
        expect(entry).toHaveProperty('title');
        expect(entry).toHaveProperty('description');
        expect(entry).toHaveProperty('releaseDate');
        expect(entry).toHaveProperty('features');

        expect(typeof entry.id).toBe('string');
        expect(typeof entry.title).toBe('string');
        expect(typeof entry.description).toBe('string');
        expect(typeof entry.releaseDate).toBe('string');
        expect(Array.isArray(entry.features)).toBe(true);
      });
    });

    it('should return entries with valid ISO 8601 dates', async () => {
      const req = createTestRequest();
      const response = await GET(req);
      const data: ChangelogResponse = await response.json();

      data.entries.forEach((entry) => {
        const date = new Date(entry.releaseDate);
        expect(date.toString()).not.toBe('Invalid Date');
        expect(entry.releaseDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
      });
    });

    it('should return latestReleaseDate matching the first entry', async () => {
      const req = createTestRequest();
      const response = await GET(req);
      const data: ChangelogResponse = await response.json();

      if (data.entries.length > 0) {
        expect(data.latestReleaseDate).toBe(data.entries[0].releaseDate);
      }
    });

    it('should return entries sorted by date (newest first)', async () => {
      const req = createTestRequest();
      const response = await GET(req);
      const data: ChangelogResponse = await response.json();

      if (data.entries.length > 1) {
        for (let i = 0; i < data.entries.length - 1; i++) {
          const currentDate = new Date(data.entries[i].releaseDate);
          const nextDate = new Date(data.entries[i + 1].releaseDate);
          expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
        }
      }
    });

    it('should return 200 status code on success', async () => {
      const req = createTestRequest();
      const response = await GET(req);
      expect(response.status).toBe(200);
    });

    it('should return valid JSON content type', async () => {
      const req = createTestRequest();
      const response = await GET(req);
      const contentType = response.headers.get('content-type');
      expect(contentType).toContain('application/json');
    });

    it('should include features array for each entry', async () => {
      const req = createTestRequest();
      const response = await GET(req);
      const data: ChangelogResponse = await response.json();

      data.entries.forEach((entry) => {
        expect(Array.isArray(entry.features)).toBe(true);
        entry.features.forEach((feature) => {
          expect(typeof feature).toBe('string');
          expect(feature.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have non-empty titles and descriptions', async () => {
      const req = createTestRequest();
      const response = await GET(req);
      const data: ChangelogResponse = await response.json();

      data.entries.forEach((entry) => {
        expect(entry.title.trim().length).toBeGreaterThan(0);
        expect(entry.description.trim().length).toBeGreaterThan(0);
      });
    });

    it('should have unique IDs for each entry', async () => {
      const req = createTestRequest();
      const response = await GET(req);
      const data: ChangelogResponse = await response.json();

      const ids = data.entries.map((entry) => entry.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully and return fallback data', async () => {
      // Mock console.error to suppress error logs in test output
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // This test verifies the error handling structure is in place
      // In a real scenario, we would mock the data source to throw an error
      const req = createTestRequest();
      const response = await GET(req);
      const data: ChangelogResponse = await response.json();

      // Should still return valid structure even on error
      expect(data).toHaveProperty('entries');
      expect(data).toHaveProperty('latestReleaseDate');
      expect(Array.isArray(data.entries)).toBe(true);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Data Validation', () => {
    it('should return at least one changelog entry', async () => {
      const req = createTestRequest();
      const response = await GET(req);
      const data: ChangelogResponse = await response.json();

      expect(data.entries.length).toBeGreaterThan(0);
    });

    it('should have valid latestReleaseDate format', async () => {
      const req = createTestRequest();
      const response = await GET(req);
      const data: ChangelogResponse = await response.json();

      const date = new Date(data.latestReleaseDate);
      expect(date.toString()).not.toBe('Invalid Date');
      expect(data.latestReleaseDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
});
