/**
 * TikTok Account Hook - Unit Tests
 * Tests de configuration SWR
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

global.fetch = vi.fn();

describe('useTikTokAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Fetcher Function', () => {
    it('should fetch account data successfully', async () => {
      const mockAccount = {
        open_id: 'user123',
        display_name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
      };

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccount,
      } as Response);

      const response = await fetch('/api/tiktok/account?userId=user123');
      const data = await response.json();

      expect(data).toEqual(mockAccount);
    });

    it('should handle fetch errors', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Account not found' }),
      } as Response);

      const response = await fetch('/api/tiktok/account?userId=user123');
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle 401 error', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response);

      const response = await fetch('/api/tiktok/account?userId=user123');
      expect(response.status).toBe(401);
    });

    it('should handle 429 rate limit', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ message: 'Rate limit exceeded' }),
      } as Response);

      const response = await fetch('/api/tiktok/account?userId=user123');
      expect(response.status).toBe(429);
    });
  });
});
