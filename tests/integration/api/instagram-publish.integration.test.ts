/**
 * Instagram Publish API - Integration Tests
 * 
 * Full integration tests for the Instagram publish endpoint with:
 * - Authentication validation
 * - Request validation
 * - Media publishing (image, video, carousel)
 * - Error handling
 * - Retry logic
 * - Rate limiting
 * 
 * @see app/api/instagram/publish/route.ts
 * @see docs/api/instagram-publish.md
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { z } from 'zod';

// Mock Instagram services
vi.mock('@/lib/services/instagramPublish', () => ({
  instagramPublish: {
    publishMedia: vi.fn(),
    publishCarousel: vi.fn(),
    getMediaDetails: vi.fn(),
  },
}));

vi.mock('@/lib/services/tokenManager', () => ({
  tokenManager: {
    getAccount: vi.fn(),
    getValidToken: vi.fn(),
  },
}));

vi.mock('@/lib/services/instagramOAuth', () => ({
  instagramOAuth: {
    refreshLongLivedToken: vi.fn(),
  },
}));

describe('POST /api/instagram/publish - Integration Tests', () => {
  const baseUrl = process.env.TEST_API_URL || 'http://localhost:3000';
  let testSessionCookie: string;

  beforeAll(async () => {
    // Setup: Get test session
    // In real tests, this would authenticate a test user
    testSessionCookie = 'test-session-cookie';
  });

  // Helper to make publish request
  const publishToInstagram = async (data: any, sessionCookie?: string) => {
    const response = await fetch(`${baseUrl}/api/instagram/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionCookie && { Cookie: sessionCookie }),
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();
    
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData,
    };
  };

  describe('Authentication', () => {
    it('should require authentication', async () => {
      const response = await publishToInstagram({
        mediaType: 'IMAGE',
        mediaUrl: 'https://example.com/photo.jpg',
      });

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
      expect(response.data.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject invalid session', async () => {
      const response = await publishToInstagram(
        {
          mediaType: 'IMAGE',
          mediaUrl: 'https://example.com/photo.jpg',
        },
        'invalid-session'
      );

      expect(response.status).toBe(401);
    });
  });

  describe('Request Validation', () => {
    it('should validate mediaType', async () => {
      const response = await publishToInstagram(
        {
          mediaType: 'INVALID',
          mediaUrl: 'https://example.com/photo.jpg',
        },
        testSessionCookie
      );

      expect(response.status).toBe(400);
      expect(response.data.error.code).toBe('VALIDATION_ERROR');
      expect(response.data.error.message).toContain('mediaType');
    });

    it('should require mediaUrl for IMAGE', async () => {
      const response = await publishToInstagram(
        {
          mediaType: 'IMAGE',
          caption: 'Test caption',
        },
        testSessionCookie
      );

      expect(response.status).toBe(400);
      expect(response.data.error.message).toContain('mediaUrl');
    });

    it('should require mediaUrl for VIDEO', async () => {
      const response = await publishToInstagram(
        {
          mediaType: 'VIDEO',
          caption: 'Test video',
        },
        testSessionCookie
      );

      expect(response.status).toBe(400);
      expect(response.data.error.message).toContain('mediaUrl');
    });

    it('should require children for CAROUSEL', async () => {
      const response = await publishToInstagram(
        {
          mediaType: 'CAROUSEL',
          caption: 'Test carousel',
        },
        testSessionCookie
      );

      expect(response.status).toBe(400);
      expect(response.data.error.message).toContain('children');
    });

    it('should validate carousel has 2-10 items', async () => {
      const response = await publishToInstagram(
        {
          mediaType: 'CAROUSEL',
          children: [
            { mediaType: 'IMAGE', mediaUrl: 'https://example.com/1.jpg' },
          ],
        },
        testSessionCookie
      );

      expect(response.status).toBe(400);
      expect(response.data.error.message).toContain('at least 2');
    });

    it('should validate caption length', async () => {
      const longCaption = 'a'.repeat(2201);
      
      const response = await publishToInstagram(
        {
          mediaType: 'IMAGE',
          mediaUrl: 'https://example.com/photo.jpg',
          caption: longCaption,
        },
        testSessionCookie
      );

      expect(response.status).toBe(400);
      expect(response.data.error.message).toContain('2200');
    });

    it('should validate media URLs', async () => {
      const response = await publishToInstagram(
        {
          mediaType: 'IMAGE',
          mediaUrl: 'not-a-url',
        },
        testSessionCookie
      );

      expect(response.status).toBe(400);
      expect(response.data.error.message).toContain('Invalid media URL');
    });

    it('should handle malformed JSON', async () => {
      const response = await fetch(`${baseUrl}/api/instagram/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: testSessionCookie,
        },
        body: 'invalid json{',
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.message).toContain('Invalid JSON');
    });
  });

  describe('Response Format', () => {
    it('should return correlation ID in success response', async () => {
      // Mock successful publish
      const { instagramPublish } = await import('@/lib/services/instagramPublish');
      const { tokenManager } = await import('@/lib/services/tokenManager');

      vi.mocked(tokenManager.getAccount).mockResolvedValue({
        id: '123',
        metadata: { ig_business_id: '456' },
      } as any);

      vi.mocked(tokenManager.getValidToken).mockResolvedValue('test-token');

      vi.mocked(instagramPublish.publishMedia).mockResolvedValue({
        id: '789',
      } as any);

      vi.mocked(instagramPublish.getMediaDetails).mockResolvedValue({
        id: '789',
        media_type: 'IMAGE',
        media_url: 'https://example.com/photo.jpg',
        permalink: 'https://instagram.com/p/ABC123',
        timestamp: '2025-11-17T10:00:00Z',
        caption: 'Test',
      } as any);

      const response = await publishToInstagram(
        {
          mediaType: 'IMAGE',
          mediaUrl: 'https://example.com/photo.jpg',
        },
        testSessionCookie
      );

      expect(response.status).toBe(200);
      expect(response.data.correlationId).toBeDefined();
      expect(response.data.correlationId).toMatch(/^[a-f0-9-]+$/);
    });

    it('should return correlation ID in error response', async () => {
      const response = await publishToInstagram(
        {
          mediaType: 'INVALID',
        },
        testSessionCookie
      );

      expect(response.data.correlationId).toBeDefined();
    });

    it('should include X-Correlation-Id header', async () => {
      const response = await publishToInstagram(
        {
          mediaType: 'IMAGE',
          mediaUrl: 'https://example.com/photo.jpg',
        },
        testSessionCookie
      );

      expect(response.headers['x-correlation-id']).toBeDefined();
    });

    it('should include duration in headers', async () => {
      const response = await publishToInstagram(
        {
          mediaType: 'IMAGE',
          mediaUrl: 'https://example.com/photo.jpg',
        },
        testSessionCookie
      );

      if (response.status === 200) {
        expect(response.headers['x-duration-ms']).toBeDefined();
        expect(parseInt(response.headers['x-duration-ms'])).toBeGreaterThan(0);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle account not connected', async () => {
      const { tokenManager } = await import('@/lib/services/tokenManager');
      vi.mocked(tokenManager.getAccount).mockResolvedValue(null);

      const response = await publishToInstagram(
        {
          mediaType: 'IMAGE',
          mediaUrl: 'https://example.com/photo.jpg',
        },
        testSessionCookie
      );

      expect(response.status).toBe(404);
      expect(response.data.error.code).toBe('NOT_FOUND');
      expect(response.data.error.message).toContain('not connected');
    });

    it('should handle missing Instagram Business ID', async () => {
      const { tokenManager } = await import('@/lib/services/tokenManager');
      vi.mocked(tokenManager.getAccount).mockResolvedValue({
        id: '123',
        metadata: {},
      } as any);

      const response = await publishToInstagram(
        {
          mediaType: 'IMAGE',
          mediaUrl: 'https://example.com/photo.jpg',
        },
        testSessionCookie
      );

      expect(response.status).toBe(400);
      expect(response.data.error.message).toContain('Business ID');
    });

    it('should handle token refresh failure', async () => {
      const { tokenManager } = await import('@/lib/services/tokenManager');
      
      vi.mocked(tokenManager.getAccount).mockResolvedValue({
        id: '123',
        metadata: { ig_business_id: '456' },
      } as any);

      vi.mocked(tokenManager.getValidToken).mockResolvedValue(null);

      const response = await publishToInstagram(
        {
          mediaType: 'IMAGE',
          mediaUrl: 'https://example.com/photo.jpg',
        },
        testSessionCookie
      );

      expect(response.status).toBe(401);
      expect(response.data.error.message).toContain('access token');
    });

    it('should handle Instagram API errors', async () => {
      const { instagramPublish } = await import('@/lib/services/instagramPublish');
      const { tokenManager } = await import('@/lib/services/tokenManager');

      vi.mocked(tokenManager.getAccount).mockResolvedValue({
        id: '123',
        metadata: { ig_business_id: '456' },
      } as any);

      vi.mocked(tokenManager.getValidToken).mockResolvedValue('test-token');

      vi.mocked(instagramPublish.publishMedia).mockRejectedValue(
        new Error('invalid_media: Media URL is not accessible')
      );

      const response = await publishToInstagram(
        {
          mediaType: 'IMAGE',
          mediaUrl: 'https://example.com/photo.jpg',
        },
        testSessionCookie
      );

      expect(response.status).toBe(400);
      expect(response.data.error.message).toContain('Invalid media');
    });

    it('should mark retryable errors', async () => {
      const { instagramPublish } = await import('@/lib/services/instagramPublish');
      const { tokenManager } = await import('@/lib/services/tokenManager');

      vi.mocked(tokenManager.getAccount).mockResolvedValue({
        id: '123',
        metadata: { ig_business_id: '456' },
      } as any);

      vi.mocked(tokenManager.getValidToken).mockResolvedValue('test-token');

      vi.mocked(instagramPublish.publishMedia).mockRejectedValue(
        new Error('rate_limit: Too many requests')
      );

      const response = await publishToInstagram(
        {
          mediaType: 'IMAGE',
          mediaUrl: 'https://example.com/photo.jpg',
        },
        testSessionCookie
      );

      expect(response.status).toBe(429);
      expect(response.data.error.retryable).toBe(true);
      expect(response.headers['retry-after']).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should include rate limit headers', async () => {
      const response = await publishToInstagram(
        {
          mediaType: 'IMAGE',
          mediaUrl: 'https://example.com/photo.jpg',
        },
        testSessionCookie
      );

      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });

    it('should enforce rate limits', async () => {
      const requests = [];

      // Make 15 rapid requests (limit is 10/min)
      for (let i = 0; i < 15; i++) {
        requests.push(
          publishToInstagram(
            {
              mediaType: 'IMAGE',
              mediaUrl: `https://example.com/photo${i}.jpg`,
            },
            testSessionCookie
          )
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);

      expect(rateLimited).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should complete within 5 seconds', async () => {
      const startTime = Date.now();

      await publishToInstagram(
        {
          mediaType: 'IMAGE',
          mediaUrl: 'https://example.com/photo.jpg',
        },
        testSessionCookie
      );

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000);
    });
  });
});
