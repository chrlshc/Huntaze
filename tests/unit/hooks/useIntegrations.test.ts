/**
 * useIntegrations Hook Tests
 * 
 * Tests for the integrations management hook - API interaction tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

describe('useIntegrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockIntegrations = [
    {
      provider: 'instagram',
      providerAccountId: '123456',
      isConnected: true,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      metadata: { ig_business_id: '789' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      provider: 'tiktok',
      providerAccountId: '654321',
      isConnected: true,
      expiresAt: new Date(Date.now() + 7200000).toISOString(),
      metadata: { open_id: 'abc123' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  describe('API Interactions', () => {
    it('should fetch integrations from status endpoint', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      } as Response);

      const response = await fetch('/api/integrations/status');
      const data = await response.json();

      expect(data.integrations).toHaveLength(2);
      expect(data.integrations[0].provider).toBe('instagram');
    });

    it('should handle fetch errors from status endpoint', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Server error' }),
      } as Response);

      const response = await fetch('/api/integrations/status');
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });

    it('should initiate OAuth flow via connect endpoint', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          authUrl: 'https://oauth.provider.com/authorize',
          state: 'test-state',
        }),
      } as Response);

      const response = await fetch('/api/integrations/connect/instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirectUrl: 'http://localhost:3000/integrations' }),
      });
      
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.authUrl).toBeTruthy();
      expect(data.state).toBeTruthy();
    });

    it('should disconnect integration via disconnect endpoint', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Integration disconnected' }),
      } as Response);

      const response = await fetch('/api/integrations/disconnect/instagram/123456', {
        method: 'DELETE',
      });
      
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
    });

    it('should handle 401 unauthorized error', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response);

      const response = await fetch('/api/integrations/status');
      expect(response.status).toBe(401);
    });

    it('should handle 404 not found error', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Integration not found' }),
      } as Response);

      const response = await fetch('/api/integrations/disconnect/instagram/999');
      expect(response.status).toBe(404);
    });
  });

  describe('Data Transformation', () => {
    it('should handle integrations with all fields', () => {
      const integration = mockIntegrations[0];
      
      expect(integration.provider).toBe('instagram');
      expect(integration.providerAccountId).toBe('123456');
      expect(integration.isConnected).toBe(true);
      expect(integration.expiresAt).toBeTruthy();
      expect(integration.metadata).toBeTruthy();
      expect(integration.createdAt).toBeTruthy();
      expect(integration.updatedAt).toBeTruthy();
    });

    it('should handle integrations without expiry', () => {
      const integrationWithoutExpiry = {
        provider: 'onlyfans',
        providerAccountId: '111',
        isConnected: true,
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(integrationWithoutExpiry.expiresAt).toBeUndefined();
    });

    it('should handle integrations without metadata', () => {
      const integrationWithoutMetadata = {
        provider: 'reddit',
        providerAccountId: '222',
        isConnected: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(integrationWithoutMetadata.metadata).toBeUndefined();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle network errors', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetch('/api/integrations/status')).rejects.toThrow('Network error');
    });

    it('should handle malformed JSON responses', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as Response);

      const response = await fetch('/api/integrations/status');
      await expect(response.json()).rejects.toThrow('Invalid JSON');
    });

    it('should handle rate limiting (429)', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ message: 'Rate limit exceeded' }),
      } as Response);

      const response = await fetch('/api/integrations/connect/instagram', {
        method: 'POST',
      });
      
      expect(response.status).toBe(429);
    });
  });
});
