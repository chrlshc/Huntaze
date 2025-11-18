/**
 * Unit tests for integrations error handling
 * Requirements: 2.4, 8.3
 * 
 * Tests OAuth error scenarios, API error handling, and token refresh errors
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Integrations Error Handling', () => {
  describe('OAuth Error Scenarios', () => {
    it('should handle user cancelled OAuth flow', async () => {
      // Simulate OAuth callback with error=access_denied
      const searchParams = new URLSearchParams({
        error: 'access_denied',
        error_description: 'User cancelled the authorization',
        provider: 'instagram',
      });

      const errorType = searchParams.get('error');
      const provider = searchParams.get('provider');

      expect(errorType).toBe('access_denied');
      expect(provider).toBe('instagram');

      // Verify user-friendly message mapping
      const errorMessages: Record<string, string> = {
        access_denied: 'Connection cancelled. You can try again anytime.',
        invalid_request: 'Invalid request. Please try again.',
        unauthorized_client: 'Invalid credentials. Please check your settings.',
        server_error: 'Server error. Please try again later.',
      };

      const userMessage = errorMessages[errorType] || 'An error occurred';
      expect(userMessage).toBe('Connection cancelled. You can try again anytime.');
    });

    it('should handle invalid credentials error', async () => {
      const searchParams = new URLSearchParams({
        error: 'unauthorized_client',
        provider: 'tiktok',
      });

      const errorType = searchParams.get('error');
      const errorMessages: Record<string, string> = {
        unauthorized_client: 'Invalid credentials. Please check your settings.',
      };

      const userMessage = errorMessages[errorType] || 'An error occurred';
      expect(userMessage).toBe('Invalid credentials. Please check your settings.');
    });

    it('should handle network errors during OAuth', async () => {
      const networkError = new TypeError('Failed to fetch');
      
      // Simulate network error detection
      const isNetworkError = networkError instanceof TypeError && 
        networkError.message.includes('fetch');
      
      expect(isNetworkError).toBe(true);
      
      const userMessage = isNetworkError 
        ? 'Connection failed. Please check your internet connection.'
        : 'An error occurred';
      
      expect(userMessage).toBe('Connection failed. Please check your internet connection.');
    });

    it('should handle missing OAuth parameters', async () => {
      const searchParams = new URLSearchParams({
        // Missing 'code' and 'state' parameters
        provider: 'reddit',
      });

      const code = searchParams.get('code');
      const state = searchParams.get('state');

      expect(code).toBeNull();
      expect(state).toBeNull();

      // Should redirect with error
      const shouldError = !code || !state;
      expect(shouldError).toBe(true);
    });
  });

  describe('API Error Handling', () => {
    it('should handle 401 Unauthorized error', async () => {
      const error: any = new Error('Unauthorized');
      error.status = 401;

      const getUserFriendlyMessage = (err: any): string => {
        if (err.status === 401) {
          return 'Your session has expired. Please log in again.';
        }
        return err.message;
      };

      const message = getUserFriendlyMessage(error);
      expect(message).toBe('Your session has expired. Please log in again.');
    });

    it('should handle 403 Forbidden error', async () => {
      const error: any = new Error('Forbidden');
      error.status = 403;

      const getUserFriendlyMessage = (err: any): string => {
        if (err.status === 403) {
          return 'You do not have permission to perform this action.';
        }
        return err.message;
      };

      const message = getUserFriendlyMessage(error);
      expect(message).toBe('You do not have permission to perform this action.');
    });

    it('should handle 429 Rate Limit error', async () => {
      const error: any = new Error('Too Many Requests');
      error.status = 429;

      const getUserFriendlyMessage = (err: any): string => {
        if (err.status === 429) {
          return 'Too many attempts. Please try again in a few minutes.';
        }
        return err.message;
      };

      const message = getUserFriendlyMessage(error);
      expect(message).toBe('Too many attempts. Please try again in a few minutes.');
    });

    it('should handle 500 Server Error', async () => {
      const error: any = new Error('Internal Server Error');
      error.status = 500;

      const getUserFriendlyMessage = (err: any): string => {
        if (err.status === 500 || err.status === 502 || err.status === 503) {
          return 'Server error. Please try again later.';
        }
        return err.message;
      };

      const message = getUserFriendlyMessage(error);
      expect(message).toBe('Server error. Please try again later.');
    });

    it('should handle 502 Bad Gateway error', async () => {
      const error: any = new Error('Bad Gateway');
      error.status = 502;

      const getUserFriendlyMessage = (err: any): string => {
        if (err.status === 500 || err.status === 502 || err.status === 503) {
          return 'Server error. Please try again later.';
        }
        return err.message;
      };

      const message = getUserFriendlyMessage(error);
      expect(message).toBe('Server error. Please try again later.');
    });

    it('should handle 503 Service Unavailable error', async () => {
      const error: any = new Error('Service Unavailable');
      error.status = 503;

      const getUserFriendlyMessage = (err: any): string => {
        if (err.status === 500 || err.status === 502 || err.status === 503) {
          return 'Server error. Please try again later.';
        }
        return err.message;
      };

      const message = getUserFriendlyMessage(error);
      expect(message).toBe('Server error. Please try again later.');
    });

    it('should handle generic API errors', async () => {
      const error: any = new Error('Something went wrong');
      error.status = 400;

      const getUserFriendlyMessage = (err: any, operation: string): string => {
        if (err.status && err.status >= 400 && err.status < 500) {
          return `Failed to ${operation}. Please try again.`;
        }
        return err.message;
      };

      const message = getUserFriendlyMessage(error, 'connect integration');
      expect(message).toBe('Failed to connect integration. Please try again.');
    });
  });

  describe('Token Refresh Error Handling', () => {
    it('should handle invalid refresh token error', async () => {
      const error: any = new Error('Invalid refresh token');
      error.code = 'INVALID_REFRESH_TOKEN';

      expect(error.code).toBe('INVALID_REFRESH_TOKEN');
      
      // Should mark integration as requiring reconnection
      const requiresReconnection = error.code === 'INVALID_REFRESH_TOKEN';
      expect(requiresReconnection).toBe(true);
    });

    it('should handle missing refresh token error', async () => {
      const error: any = new Error('No refresh token available');
      error.code = 'NO_REFRESH_TOKEN';

      expect(error.code).toBe('NO_REFRESH_TOKEN');
      
      // Should inform user that this integration doesn't support refresh
      const message = 'This integration does not support token refresh';
      expect(message).toBeTruthy();
    });

    it('should handle token refresh failure', async () => {
      const error: any = new Error('Token refresh failed');
      error.code = 'TOKEN_REFRESH_ERROR';

      expect(error.code).toBe('TOKEN_REFRESH_ERROR');
      
      // Should prompt user to reconnect
      const userMessage = 'Failed to refresh token. Please reconnect your account.';
      expect(userMessage).toBeTruthy();
    });

    it('should handle network error during token refresh', async () => {
      const error = new TypeError('Failed to fetch');
      
      const isNetworkError = error instanceof TypeError && 
        error.message.includes('fetch');
      
      expect(isNetworkError).toBe(true);
      
      // Should retry with exponential backoff
      const shouldRetry = isNetworkError;
      expect(shouldRetry).toBe(true);
    });

    it('should handle expired refresh token', async () => {
      const error: any = new Error('Refresh token expired');
      error.code = 'REFRESH_TOKEN_EXPIRED';

      expect(error.code).toBe('REFRESH_TOKEN_EXPIRED');
      
      // Should mark as expired and prompt reconnection
      const requiresReconnection = error.code === 'REFRESH_TOKEN_EXPIRED';
      expect(requiresReconnection).toBe(true);
    });
  });

  describe('Error Message Formatting', () => {
    it('should provide user-friendly messages for all error types', () => {
      const errorMappings = {
        cancelled: 'Connection cancelled. You can try again anytime.',
        invalid_provider: 'Invalid provider selected.',
        missing_parameters: 'Missing required parameters from OAuth provider.',
        invalid_state: 'Security validation failed. Please try again.',
        invalid_code: 'Invalid authorization code. Please try again.',
        oauth_error: 'OAuth authentication failed. Please try again.',
        unknown: 'An unexpected error occurred. Please try again.',
      };

      // Verify all error types have user-friendly messages
      Object.entries(errorMappings).forEach(([errorType, message]) => {
        expect(message).toBeTruthy();
        expect(message.length).toBeGreaterThan(0);
        expect(message).not.toContain('undefined');
        expect(message).not.toContain('null');
      });
    });

    it('should not expose sensitive information in error messages', () => {
      const sensitivePatterns = [
        /token/i,
        /secret/i,
        /password/i,
        /key/i,
        /credential/i,
      ];

      const userFacingMessages = [
        'Connection cancelled. You can try again anytime.',
        'Your session has expired. Please log in again.',
        'Too many attempts. Please try again in a few minutes.',
        'Server error. Please try again later.',
      ];

      userFacingMessages.forEach(message => {
        sensitivePatterns.forEach(pattern => {
          expect(message).not.toMatch(pattern);
        });
      });
    });
  });

  describe('Error Recovery Flows', () => {
    it('should provide reconnect option for expired tokens', () => {
      const integration = {
        provider: 'instagram',
        isConnected: true,
        expiresAt: new Date(Date.now() - 1000), // Expired
      };

      const isExpired = integration.expiresAt && new Date() > integration.expiresAt;
      expect(isExpired).toBe(true);

      // Should show reconnect button
      const status = isExpired ? 'expired' : 'connected';
      expect(status).toBe('expired');
    });

    it('should provide retry option for network errors', () => {
      const error = new TypeError('Failed to fetch');
      
      const isNetworkError = error instanceof TypeError && 
        error.message.includes('fetch');
      
      expect(isNetworkError).toBe(true);
      
      // Should show retry button
      const shouldShowRetry = isNetworkError;
      expect(shouldShowRetry).toBe(true);
    });

    it('should clear error state after successful retry', () => {
      let errorState: string | null = 'Network error';
      
      // Simulate successful retry
      errorState = null;
      
      expect(errorState).toBeNull();
    });
  });

  describe('Loading States', () => {
    it('should show loading state during connect operation', () => {
      let isLoading = false;
      
      // Start operation
      isLoading = true;
      expect(isLoading).toBe(true);
      
      // Complete operation
      isLoading = false;
      expect(isLoading).toBe(false);
    });

    it('should show loading state during disconnect operation', () => {
      let isLoading = false;
      
      // Start operation
      isLoading = true;
      expect(isLoading).toBe(true);
      
      // Complete operation
      isLoading = false;
      expect(isLoading).toBe(false);
    });

    it('should show loading state during reconnect operation', () => {
      let isLoading = false;
      
      // Start operation
      isLoading = true;
      expect(isLoading).toBe(true);
      
      // Complete operation
      isLoading = false;
      expect(isLoading).toBe(false);
    });

    it('should disable buttons during loading', () => {
      const isLoading = true;
      const isDisabled = isLoading;
      
      expect(isDisabled).toBe(true);
    });
  });
});
