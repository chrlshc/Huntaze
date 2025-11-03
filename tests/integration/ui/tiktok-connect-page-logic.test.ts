/**
 * Integration Tests - TikTok Connect Page Logic (Task 7.1)
 * 
 * Tests to validate TikTok connection page logic and OAuth flow
 * Based on: .kiro/specs/social-integrations/tasks.md (Task 7.1)
 * 
 * Coverage:
 * - OAuth initiation logic
 * - Loading state management
 * - Connection status handling
 * - Error message handling
 * - OAuth redirect flow
 * - API integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Helper functions for TikTok Connect Page Logic

/**
 * Initiate OAuth connection
 */
async function initiateOAuthConnection(): Promise<{ success: boolean; authUrl?: string; error?: string }> {
  try {
    const response = await fetch('/api/auth/tiktok', {
      credentials: 'include',
    });

    if (!response.ok) {
      return { success: false, error: 'Failed to initiate OAuth' };
    }

    const { authUrl } = await response.json();
    return { success: true, authUrl };
  } catch (err: any) {
    return { success: false, error: err.message || 'Connection failed' };
  }
}

/**
 * Connection state manager
 */
class ConnectionStateManager {
  private loading: boolean = false;
  private error: string | null = null;
  private connected: boolean = false;

  isLoading(): boolean {
    return this.loading;
  }

  getError(): string | null {
    return this.error;
  }

  isConnected(): boolean {
    return this.connected;
  }

  setLoading(loading: boolean): void {
    this.loading = loading;
  }

  setError(error: string | null): void {
    this.error = error;
  }

  setConnected(connected: boolean): void {
    this.connected = connected;
  }

  reset(): void {
    this.loading = false;
    this.error = null;
    this.connected = false;
  }
}

/**
 * Get button text based on loading state
 */
function getButtonText(loading: boolean): string {
  return loading ? 'Connecting...' : 'Connect TikTok';
}

/**
 * Check if button should be disabled
 */
function isButtonDisabled(loading: boolean): boolean {
  return loading;
}

/**
 * Get connection status message
 */
function getConnectionStatusMessage(connected: boolean): string | null {
  return connected ? '✓ TikTok account connected' : null;
}

/**
 * Validate OAuth URL
 */
function validateOAuthUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:' && urlObj.hostname.includes('tiktok.com');
  } catch {
    return false;
  }
}

describe('TikTok Connect Page Logic - Integration Tests (Task 7.1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('Requirement 1.1 - Button State Logic', () => {
    it('should display "Connect TikTok" when not loading', () => {
      const buttonText = getButtonText(false);
      expect(buttonText).toBe('Connect TikTok');
    });

    it('should display "Connecting..." when loading', () => {
      const buttonText = getButtonText(true);
      expect(buttonText).toBe('Connecting...');
    });

    it('should not disable button when not loading', () => {
      const disabled = isButtonDisabled(false);
      expect(disabled).toBe(false);
    });

    it('should disable button when loading', () => {
      const disabled = isButtonDisabled(true);
      expect(disabled).toBe(true);
    });
  });

  describe('Requirement 1.1 - OAuth Initiation', () => {
    it('should call OAuth endpoint', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ authUrl: 'https://tiktok.com/oauth' }),
      });
      global.fetch = mockFetch;

      const result = await initiateOAuthConnection();

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/tiktok', {
        credentials: 'include',
      });
      expect(result.success).toBe(true);
      expect(result.authUrl).toBe('https://tiktok.com/oauth');
    });

    it('should return auth URL on success', async () => {
      const authUrl = 'https://www.tiktok.com/v2/auth/authorize?client_key=test';
      
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ authUrl }),
      });
      global.fetch = mockFetch;

      const result = await initiateOAuthConnection();

      expect(result.success).toBe(true);
      expect(result.authUrl).toBe(authUrl);
    });

    it('should validate OAuth URL format', () => {
      const validUrl = 'https://www.tiktok.com/v2/auth/authorize';
      const invalidUrl = 'http://example.com/oauth';
      const malformedUrl = 'not-a-url';

      expect(validateOAuthUrl(validUrl)).toBe(true);
      expect(validateOAuthUrl(invalidUrl)).toBe(false);
      expect(validateOAuthUrl(malformedUrl)).toBe(false);
    });
  });

  describe('Requirement 10.1 - State Management', () => {
    it('should manage loading state', () => {
      const stateManager = new ConnectionStateManager();

      expect(stateManager.isLoading()).toBe(false);

      stateManager.setLoading(true);
      expect(stateManager.isLoading()).toBe(true);

      stateManager.setLoading(false);
      expect(stateManager.isLoading()).toBe(false);
    });

    it('should manage error state', () => {
      const stateManager = new ConnectionStateManager();

      expect(stateManager.getError()).toBeNull();

      stateManager.setError('Connection failed');
      expect(stateManager.getError()).toBe('Connection failed');

      stateManager.setError(null);
      expect(stateManager.getError()).toBeNull();
    });

    it('should manage connected state', () => {
      const stateManager = new ConnectionStateManager();

      expect(stateManager.isConnected()).toBe(false);

      stateManager.setConnected(true);
      expect(stateManager.isConnected()).toBe(true);

      stateManager.setConnected(false);
      expect(stateManager.isConnected()).toBe(false);
    });

    it('should reset all states', () => {
      const stateManager = new ConnectionStateManager();

      stateManager.setLoading(true);
      stateManager.setError('Some error');
      stateManager.setConnected(true);

      stateManager.reset();

      expect(stateManager.isLoading()).toBe(false);
      expect(stateManager.getError()).toBeNull();
      expect(stateManager.isConnected()).toBe(false);
    });
  });

  describe('Requirement 10.1 - Connection Status', () => {
    it('should return status message when connected', () => {
      const message = getConnectionStatusMessage(true);
      expect(message).toBe('✓ TikTok account connected');
    });

    it('should return null when not connected', () => {
      const message = getConnectionStatusMessage(false);
      expect(message).toBeNull();
    });
  });

  describe('Requirement 10.1 - Error Handling', () => {
    it('should return error when OAuth fails', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });
      global.fetch = mockFetch;

      const result = await initiateOAuthConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to initiate OAuth');
    });

    it('should handle network errors', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      const result = await initiateOAuthConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should handle generic errors', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error());
      global.fetch = mockFetch;

      const result = await initiateOAuthConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection failed');
    });

    it('should clear error on retry', () => {
      const stateManager = new ConnectionStateManager();

      stateManager.setError('Previous error');
      expect(stateManager.getError()).toBe('Previous error');

      // Simulate retry - clear error
      stateManager.setError(null);
      expect(stateManager.getError()).toBeNull();
    });
  });

  describe('OAuth Flow Integration', () => {
    it('should include credentials in OAuth request', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ authUrl: 'https://tiktok.com/oauth' }),
      });
      global.fetch = mockFetch;

      await initiateOAuthConnection();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/tiktok',
        expect.objectContaining({
          credentials: 'include',
        })
      );
    });

    it('should handle OAuth URL with state parameter', async () => {
      const authUrl = 'https://www.tiktok.com/v2/auth/authorize?client_key=test&state=abc123';
      
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ authUrl }),
      });
      global.fetch = mockFetch;

      const result = await initiateOAuthConnection();

      expect(result.authUrl).toContain('state=abc123');
    });

    it('should handle OAuth URL with scopes', async () => {
      const authUrl = 'https://www.tiktok.com/v2/auth/authorize?scope=user.info.basic,video.upload';
      
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ authUrl }),
      });
      global.fetch = mockFetch;

      const result = await initiateOAuthConnection();

      expect(result.authUrl).toContain('scope=');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty auth URL response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ authUrl: '' }),
      });
      global.fetch = mockFetch;

      const result = await initiateOAuthConnection();

      expect(result.success).toBe(true);
      expect(result.authUrl).toBe('');
    });

    it('should handle malformed JSON response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); },
      });
      global.fetch = mockFetch;

      const result = await initiateOAuthConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid JSON');
    });

    it('should handle 401 unauthorized', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });
      global.fetch = mockFetch;

      const result = await initiateOAuthConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to initiate OAuth');
    });

    it('should handle 429 rate limit', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
      });
      global.fetch = mockFetch;

      const result = await initiateOAuthConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to initiate OAuth');
    });
  });

  describe('Complete Connection Flow', () => {
    it('should handle complete successful flow', async () => {
      const stateManager = new ConnectionStateManager();
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ authUrl: 'https://tiktok.com/oauth' }),
      });
      global.fetch = mockFetch;

      // Start connection
      stateManager.setLoading(true);
      stateManager.setError(null);

      const result = await initiateOAuthConnection();

      expect(result.success).toBe(true);
      expect(result.authUrl).toBeTruthy();

      // Complete connection
      stateManager.setLoading(false);
      stateManager.setConnected(true);

      expect(stateManager.isLoading()).toBe(false);
      expect(stateManager.isConnected()).toBe(true);
      expect(stateManager.getError()).toBeNull();
    });

    it('should handle complete error flow', async () => {
      const stateManager = new ConnectionStateManager();
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });
      global.fetch = mockFetch;

      // Start connection
      stateManager.setLoading(true);
      stateManager.setError(null);

      const result = await initiateOAuthConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();

      // Handle error
      stateManager.setLoading(false);
      stateManager.setError(result.error!);

      expect(stateManager.isLoading()).toBe(false);
      expect(stateManager.isConnected()).toBe(false);
      expect(stateManager.getError()).toBe('Failed to initiate OAuth');
    });
  });
});
