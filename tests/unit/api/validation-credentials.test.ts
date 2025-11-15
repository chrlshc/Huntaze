/**
 * Credentials Validation API - Unit Tests
 * 
 * Tests for POST /api/validation/credentials
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock ValidationOrchestrator
vi.mock('@/lib/security/validation-orchestrator', () => ({
  ValidationOrchestrator: vi.fn().mockImplementation(() => ({
    validatePlatform: vi.fn().mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: [],
      cached: false,
    }),
  })),
}));

describe('POST /api/validation/credentials', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Request Validation', () => {
    it('should return 400 for missing platform', async () => {
      const response = await fetch('/api/validation/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentials: { clientId: 'test' },
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('platform');
    });

    it('should return 400 for invalid platform', async () => {
      const response = await fetch('/api/validation/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'invalid',
          credentials: { clientId: 'test' },
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('Invalid platform');
    });

    it('should return 400 for missing credentials', async () => {
      const response = await fetch('/api/validation/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'instagram',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('credentials');
    });

    it('should return 400 for invalid JSON', async () => {
      const response = await fetch('/api/validation/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('JSON');
    });
  });

  describe('Instagram Validation', () => {
    it('should validate Instagram credentials successfully', async () => {
      const response = await fetch('/api/validation/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'instagram',
          credentials: {
            clientId: 'test_client_id',
            clientSecret: 'test_client_secret',
          },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.platform).toBe('instagram');
      expect(data.isValid).toBe(true);
    });

    it('should return 400 for missing Instagram clientId', async () => {
      const response = await fetch('/api/validation/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'instagram',
          credentials: {
            clientSecret: 'test_secret',
          },
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toContain('clientId');
    });
  });

  describe('TikTok Validation', () => {
    it('should validate TikTok credentials successfully', async () => {
      const response = await fetch('/api/validation/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'tiktok',
          credentials: {
            clientKey: 'test_client_key',
            clientSecret: 'test_client_secret',
          },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.platform).toBe('tiktok');
    });

    it('should return 400 for missing TikTok clientKey', async () => {
      const response = await fetch('/api/validation/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'tiktok',
          credentials: {
            clientSecret: 'test_secret',
          },
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toContain('clientKey');
    });
  });

  describe('Reddit Validation', () => {
    it('should validate Reddit credentials successfully', async () => {
      const response = await fetch('/api/validation/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'reddit',
          credentials: {
            clientId: 'test_client_id',
            clientSecret: 'test_client_secret',
          },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.platform).toBe('reddit');
    });
  });

  describe('Response Structure', () => {
    it('should include correlation ID', async () => {
      const response = await fetch('/api/validation/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'instagram',
          credentials: {
            clientId: 'test',
            clientSecret: 'test',
          },
        }),
      });

      const data = await response.json();
      expect(data.correlationId).toBeDefined();
      expect(data.correlationId).toMatch(/^val-\d+-[a-z0-9]+$/);
    });

    it('should include performance metrics', async () => {
      const response = await fetch('/api/validation/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'instagram',
          credentials: {
            clientId: 'test',
            clientSecret: 'test',
          },
        }),
      });

      const data = await response.json();
      expect(data.details).toBeDefined();
      expect(data.details.duration).toBeGreaterThan(0);
      expect(data.details.timestamp).toBeDefined();
    });

    it('should include response time header', async () => {
      const response = await fetch('/api/validation/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'instagram',
          credentials: {
            clientId: 'test',
            clientSecret: 'test',
          },
        }),
      });

      const responseTime = response.headers.get('X-Response-Time');
      expect(responseTime).toBeDefined();
      expect(responseTime).toMatch(/^\d+ms$/);
    });

    it('should include correlation ID header', async () => {
      const response = await fetch('/api/validation/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'instagram',
          credentials: {
            clientId: 'test',
            clientSecret: 'test',
          },
        }),
      });

      const correlationId = response.headers.get('X-Correlation-Id');
      expect(correlationId).toBeDefined();
      expect(correlationId).toMatch(/^val-\d+-[a-z0-9]+$/);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      // Mock validation failure
      const { ValidationOrchestrator } = await import(
        '@/lib/security/validation-orchestrator'
      );
      vi.mocked(ValidationOrchestrator).mockImplementationOnce(
        () =>
          ({
            validatePlatform: vi.fn().mockResolvedValue({
              isValid: false,
              errors: [
                { field: 'clientId', message: 'Invalid client ID' },
              ],
              warnings: [],
            }),
          } as any)
      );

      const response = await fetch('/api/validation/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'instagram',
          credentials: {
            clientId: 'invalid',
            clientSecret: 'test',
          },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.isValid).toBe(false);
      expect(data.errors).toHaveLength(1);
      expect(data.errors[0].message).toContain('Invalid');
    });

    it('should return 500 for server errors', async () => {
      // Mock server error
      const { ValidationOrchestrator } = await import(
        '@/lib/security/validation-orchestrator'
      );
      vi.mocked(ValidationOrchestrator).mockImplementationOnce(
        () =>
          ({
            validatePlatform: vi
              .fn()
              .mockRejectedValue(new Error('Server error')),
          } as any)
      );

      const response = await fetch('/api/validation/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'instagram',
          credentials: {
            clientId: 'test',
            clientSecret: 'test',
          },
        }),
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal Server Error');
    });
  });

  describe('Caching', () => {
    it('should indicate cached results', async () => {
      // Mock cached result
      const { ValidationOrchestrator } = await import(
        '@/lib/security/validation-orchestrator'
      );
      vi.mocked(ValidationOrchestrator).mockImplementationOnce(
        () =>
          ({
            validatePlatform: vi.fn().mockResolvedValue({
              isValid: true,
              errors: [],
              warnings: [],
              cached: true,
            }),
          } as any)
      );

      const response = await fetch('/api/validation/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'instagram',
          credentials: {
            clientId: 'test',
            clientSecret: 'test',
          },
        }),
      });

      const data = await response.json();
      expect(data.details.cached).toBe(true);
    });
  });
});
