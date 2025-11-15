/**
 * Validation Health API - Unit Tests
 * 
 * Tests for /api/validation/health endpoint
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/validation/health/route';

// Mock OAuthValidators
vi.mock('@/lib/security/oauth-validators', () => ({
  OAuthValidators: {
    validateAll: vi.fn(),
  },
}));

import { OAuthValidators } from '@/lib/security/oauth-validators';

describe('GET /api/validation/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Success Cases', () => {
    it('should return healthy status when all platforms are valid', async () => {
      const mockReport = {
        timestamp: new Date(),
        overall: {
          isValid: true,
          validPlatforms: 3,
          totalPlatforms: 3,
          score: 100,
        },
        platforms: {
          tiktok: {
            platform: 'TikTok',
            isValid: true,
            credentialsSet: true,
            formatValid: true,
            apiConnectivity: true,
            errors: [],
            warnings: [],
          },
          instagram: {
            platform: 'Instagram',
            isValid: true,
            credentialsSet: true,
            formatValid: true,
            apiConnectivity: true,
            errors: [],
            warnings: [],
          },
          reddit: {
            platform: 'Reddit',
            isValid: true,
            credentialsSet: true,
            formatValid: true,
            apiConnectivity: true,
            errors: [],
            warnings: [],
          },
        },
        recommendations: [],
      };

      vi.mocked(OAuthValidators.validateAll).mockResolvedValueOnce(mockReport);

      const request = new NextRequest('http://localhost:3000/api/validation/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.summary.healthy).toBe(3);
      expect(data.summary.total).toBe(3);
      expect(data.summary.healthPercentage).toBe(100);
      expect(data.correlationId).toBeDefined();
      expect(data.duration).toBeDefined();
    });

    it('should return degraded status when some platforms are invalid', async () => {
      const mockReport = {
        timestamp: new Date(),
        overall: {
          isValid: false,
          validPlatforms: 2,
          totalPlatforms: 3,
          score: 67,
        },
        platforms: {
          tiktok: {
            platform: 'TikTok',
            isValid: true,
            credentialsSet: true,
            formatValid: true,
            apiConnectivity: true,
            errors: [],
            warnings: [],
          },
          instagram: {
            platform: 'Instagram',
            isValid: true,
            credentialsSet: true,
            formatValid: true,
            apiConnectivity: true,
            errors: [],
            warnings: [],
          },
          reddit: {
            platform: 'Reddit',
            isValid: false,
            credentialsSet: false,
            formatValid: false,
            apiConnectivity: false,
            errors: ['Missing credentials'],
            warnings: [],
          },
        },
        recommendations: [],
      };

      vi.mocked(OAuthValidators.validateAll).mockResolvedValueOnce(mockReport);

      const request = new NextRequest('http://localhost:3000/api/validation/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('degraded');
      expect(data.summary.healthy).toBe(2);
      expect(data.summary.unhealthy).toBe(1);
    });

    it('should return unhealthy status when all platforms are invalid', async () => {
      const mockReport = {
        timestamp: new Date(),
        overall: {
          isValid: false,
          validPlatforms: 0,
          totalPlatforms: 3,
          score: 0,
        },
        platforms: {
          tiktok: {
            platform: 'TikTok',
            isValid: false,
            credentialsSet: false,
            formatValid: false,
            apiConnectivity: false,
            errors: ['Missing credentials'],
            warnings: [],
          },
          instagram: {
            platform: 'Instagram',
            isValid: false,
            credentialsSet: false,
            formatValid: false,
            apiConnectivity: false,
            errors: ['Missing credentials'],
            warnings: [],
          },
          reddit: {
            platform: 'Reddit',
            isValid: false,
            credentialsSet: false,
            formatValid: false,
            apiConnectivity: false,
            errors: ['Missing credentials'],
            warnings: [],
          },
        },
        recommendations: [],
      };

      vi.mocked(OAuthValidators.validateAll).mockResolvedValueOnce(mockReport);

      const request = new NextRequest('http://localhost:3000/api/validation/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('unhealthy');
      expect(data.summary.healthy).toBe(0);
      expect(data.summary.unhealthy).toBe(3);
    });

    it('should include correlation ID in response', async () => {
      const mockReport = {
        timestamp: new Date(),
        overall: {
          isValid: true,
          validPlatforms: 3,
          totalPlatforms: 3,
          score: 100,
        },
        platforms: {
          tiktok: { platform: 'TikTok', isValid: true, credentialsSet: true, formatValid: true, apiConnectivity: true, errors: [], warnings: [] },
          instagram: { platform: 'Instagram', isValid: true, credentialsSet: true, formatValid: true, apiConnectivity: true, errors: [], warnings: [] },
          reddit: { platform: 'Reddit', isValid: true, credentialsSet: true, formatValid: true, apiConnectivity: true, errors: [], warnings: [] },
        },
        recommendations: [],
      };

      vi.mocked(OAuthValidators.validateAll).mockResolvedValueOnce(mockReport);

      const request = new NextRequest('http://localhost:3000/api/validation/health');
      const response = await GET(request);
      const data = await response.json();

      expect(data.correlationId).toBeDefined();
      expect(data.correlationId).toMatch(/^vh-\d+-[a-z0-9]+$/);
    });

    it('should include cache headers', async () => {
      const mockReport = {
        timestamp: new Date(),
        overall: {
          isValid: true,
          validPlatforms: 3,
          totalPlatforms: 3,
          score: 100,
        },
        platforms: {
          tiktok: { platform: 'TikTok', isValid: true, credentialsSet: true, formatValid: true, apiConnectivity: true, errors: [], warnings: [] },
          instagram: { platform: 'Instagram', isValid: true, credentialsSet: true, formatValid: true, apiConnectivity: true, errors: [], warnings: [] },
          reddit: { platform: 'Reddit', isValid: true, credentialsSet: true, formatValid: true, apiConnectivity: true, errors: [], warnings: [] },
        },
        recommendations: [],
      };

      vi.mocked(OAuthValidators.validateAll).mockResolvedValueOnce(mockReport);

      const request = new NextRequest('http://localhost:3000/api/validation/health');
      const response = await GET(request);

      expect(response.headers.get('Cache-Control')).toBe('public, max-age=300');
      expect(response.headers.get('X-Correlation-ID')).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      vi.mocked(OAuthValidators.validateAll).mockRejectedValueOnce(
        new Error('Validation failed')
      );

      const request = new NextRequest('http://localhost:3000/api/validation/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.status).toBe('error');
      expect(data.error).toBe('VALIDATION_FAILED');
      expect(data.message).toBe('Validation failed');
      expect(data.correlationId).toBeDefined();
    });

    it('should handle timeout errors', async () => {
      vi.mocked(OAuthValidators.validateAll).mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 20000))
      );

      const request = new NextRequest('http://localhost:3000/api/validation/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.status).toBe('error');
      expect(data.message).toContain('timeout');
    });

    it('should include correlation ID in error response', async () => {
      vi.mocked(OAuthValidators.validateAll).mockRejectedValueOnce(
        new Error('Test error')
      );

      const request = new NextRequest('http://localhost:3000/api/validation/health');
      const response = await GET(request);
      const data = await response.json();

      expect(data.correlationId).toBeDefined();
      expect(response.headers.get('X-Correlation-ID')).toBeDefined();
    });
  });

  describe('Response Structure', () => {
    it('should include all required fields', async () => {
      const mockReport = {
        timestamp: new Date(),
        overall: {
          isValid: true,
          validPlatforms: 3,
          totalPlatforms: 3,
          score: 100,
        },
        platforms: {
          tiktok: { platform: 'TikTok', isValid: true, credentialsSet: true, formatValid: true, apiConnectivity: true, errors: [], warnings: [] },
          instagram: { platform: 'Instagram', isValid: true, credentialsSet: true, formatValid: true, apiConnectivity: true, errors: [], warnings: [] },
          reddit: { platform: 'Reddit', isValid: true, credentialsSet: true, formatValid: true, apiConnectivity: true, errors: [], warnings: [] },
        },
        recommendations: [],
      };

      vi.mocked(OAuthValidators.validateAll).mockResolvedValueOnce(mockReport);

      const request = new NextRequest('http://localhost:3000/api/validation/health');
      const response = await GET(request);
      const data = await response.json();

      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('platforms');
      expect(data).toHaveProperty('summary');
      expect(data).toHaveProperty('correlationId');
      expect(data).toHaveProperty('duration');
    });

    it('should include platform details', async () => {
      const mockReport = {
        timestamp: new Date(),
        overall: {
          isValid: true,
          validPlatforms: 3,
          totalPlatforms: 3,
          score: 100,
        },
        platforms: {
          tiktok: { platform: 'TikTok', isValid: true, credentialsSet: true, formatValid: true, apiConnectivity: true, errors: [], warnings: [] },
          instagram: { platform: 'Instagram', isValid: true, credentialsSet: true, formatValid: true, apiConnectivity: true, errors: [], warnings: [] },
          reddit: { platform: 'Reddit', isValid: true, credentialsSet: true, formatValid: true, apiConnectivity: true, errors: [], warnings: [] },
        },
        recommendations: [],
      };

      vi.mocked(OAuthValidators.validateAll).mockResolvedValueOnce(mockReport);

      const request = new NextRequest('http://localhost:3000/api/validation/health');
      const response = await GET(request);
      const data = await response.json();

      expect(data.platforms).toHaveLength(3);
      
      data.platforms.forEach((platform: any) => {
        expect(platform).toHaveProperty('platform');
        expect(platform).toHaveProperty('status');
        expect(platform).toHaveProperty('credentialsSet');
        expect(platform).toHaveProperty('formatValid');
        expect(platform).toHaveProperty('apiConnectivity');
        expect(platform).toHaveProperty('errors');
        expect(platform).toHaveProperty('warnings');
      });
    });
  });

  describe('Performance', () => {
    it('should complete within reasonable time', async () => {
      const mockReport = {
        timestamp: new Date(),
        overall: {
          isValid: true,
          validPlatforms: 3,
          totalPlatforms: 3,
          score: 100,
        },
        platforms: {
          tiktok: { platform: 'TikTok', isValid: true, credentialsSet: true, formatValid: true, apiConnectivity: true, errors: [], warnings: [] },
          instagram: { platform: 'Instagram', isValid: true, credentialsSet: true, formatValid: true, apiConnectivity: true, errors: [], warnings: [] },
          reddit: { platform: 'Reddit', isValid: true, credentialsSet: true, formatValid: true, apiConnectivity: true, errors: [], warnings: [] },
        },
        recommendations: [],
      };

      vi.mocked(OAuthValidators.validateAll).mockResolvedValueOnce(mockReport);

      const request = new NextRequest('http://localhost:3000/api/validation/health');
      const startTime = Date.now();
      await GET(request);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // Should complete in < 1 second
    });

    it('should include duration in response', async () => {
      const mockReport = {
        timestamp: new Date(),
        overall: {
          isValid: true,
          validPlatforms: 3,
          totalPlatforms: 3,
          score: 100,
        },
        platforms: {
          tiktok: { platform: 'TikTok', isValid: true, credentialsSet: true, formatValid: true, apiConnectivity: true, errors: [], warnings: [] },
          instagram: { platform: 'Instagram', isValid: true, credentialsSet: true, formatValid: true, apiConnectivity: true, errors: [], warnings: [] },
          reddit: { platform: 'Reddit', isValid: true, credentialsSet: true, formatValid: true, apiConnectivity: true, errors: [], warnings: [] },
        },
        recommendations: [],
      };

      vi.mocked(OAuthValidators.validateAll).mockResolvedValueOnce(mockReport);

      const request = new NextRequest('http://localhost:3000/api/validation/health');
      const response = await GET(request);
      const data = await response.json();

      expect(data.duration).toBeDefined();
      expect(typeof data.duration).toBe('number');
      expect(data.duration).toBeGreaterThan(0);
    });
  });
});
