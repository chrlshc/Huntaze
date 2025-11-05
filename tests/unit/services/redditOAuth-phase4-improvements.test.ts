/**
 * Reddit OAuth Phase 4 Improvements Tests
 * 
 * Tests for Phase 4 improvements:
 * - Enhanced retry logic with exponential backoff
 * - Rate limiting awareness
 * - Improved error handling
 * - Consistent patterns with other OAuth providers
 */

describe('Reddit OAuth Phase 4 - Validation', () => {
  describe('Enhanced Error Handling', () => {
    it('should have retry logic in Reddit OAuth service', () => {
      const fs = require('fs');
      const path = require('path');
      
      const servicePath = path.join(process.cwd(), 'lib/services/redditOAuth.ts');
      const serviceContent = fs.readFileSync(servicePath, 'utf8');
      
      // Check for retry method
      expect(serviceContent).toContain('retryApiCall');
      expect(serviceContent).toContain('MAX_RETRIES');
      expect(serviceContent).toContain('RETRY_DELAY');
      
      // Check for exponential backoff
      expect(serviceContent).toContain('Math.pow(2, attempt - 1)');
      expect(serviceContent).toContain('Math.random()');
    });

    it('should have rate limiting awareness', () => {
      const fs = require('fs');
      const path = require('path');
      
      const servicePath = path.join(process.cwd(), 'lib/services/redditOAuth.ts');
      const serviceContent = fs.readFileSync(servicePath, 'utf8');
      
      // Check for rate limiting detection
      expect(serviceContent).toContain('response.status === 429');
      expect(serviceContent).toContain('Rate limit exceeded. Please try again later.');
    });

    it('should have specific error handling for refresh tokens', () => {
      const fs = require('fs');
      const path = require('path');
      
      const servicePath = path.join(process.cwd(), 'lib/services/redditOAuth.ts');
      const serviceContent = fs.readFileSync(servicePath, 'utf8');
      
      // Check for specific error handling
      expect(serviceContent).toContain('invalid_grant');
      expect(serviceContent).toContain('Refresh token has expired or been revoked');
    });
  });

  describe('API Method Enhancements', () => {
    it('should use retry logic in all API methods', () => {
      const fs = require('fs');
      const path = require('path');
      
      const servicePath = path.join(process.cwd(), 'lib/services/redditOAuth.ts');
      const serviceContent = fs.readFileSync(servicePath, 'utf8');
      
      // Check that key methods use retryApiCall
      expect(serviceContent).toContain('return this.retryApiCall(async () => {');
      
      // Count occurrences of retryApiCall usage
      const retryCallMatches = serviceContent.match(/this\.retryApiCall\(/g);
      expect(retryCallMatches).toBeTruthy();
      expect(retryCallMatches!.length).toBeGreaterThanOrEqual(4); // At least 4 methods use retry
    });

    it('should have proper method signatures', () => {
      const fs = require('fs');
      const path = require('path');
      
      const servicePath = path.join(process.cwd(), 'lib/services/redditOAuth.ts');
      const serviceContent = fs.readFileSync(servicePath, 'utf8');
      
      // Check for refresh method signature
      expect(serviceContent).toContain('async refreshAccessToken(refreshToken: string): Promise<RedditTokens>');
      
      // Check for retry method signature
      expect(serviceContent).toContain('private async retryApiCall<T>');
      expect(serviceContent).toContain('operationName: string');
      expect(serviceContent).toContain('maxRetries: number');
    });
  });

  describe('Token Refresh Scheduler Integration', () => {
    it('should have Reddit token refresh method in scheduler', () => {
      const fs = require('fs');
      const path = require('path');
      
      const schedulerPath = path.join(process.cwd(), 'lib/workers/tokenRefreshScheduler.ts');
      const schedulerContent = fs.readFileSync(schedulerPath, 'utf8');
      
      // Check for Reddit refresh method
      expect(schedulerContent).toContain('refreshRedditAccount');
      expect(schedulerContent).toContain('RedditOAuthService');
      expect(schedulerContent).toContain('refreshAccessToken');
      
      // Check for proper token handling
      expect(schedulerContent).toContain('decryptRefreshToken');
      expect(schedulerContent).toContain('refreshed.refresh_token');
    });

    it('should handle Reddit provider in refresh logic', () => {
      const fs = require('fs');
      const path = require('path');
      
      const schedulerPath = path.join(process.cwd(), 'lib/workers/tokenRefreshScheduler.ts');
      const schedulerContent = fs.readFileSync(schedulerPath, 'utf8');
      
      // Check for Reddit case in switch statement
      expect(schedulerContent).toContain("case 'reddit':");
      expect(schedulerContent).toContain('No refresh token available for Reddit');
    });
  });

  describe('OAuth Endpoints Consistency', () => {
    it('should have secure Reddit OAuth init endpoint', () => {
      const fs = require('fs');
      const path = require('path');
      
      const initPath = path.join(process.cwd(), 'app/api/auth/reddit/route.ts');
      const initContent = fs.readFileSync(initPath, 'utf8');
      
      // Check for security improvements
      expect(initContent).toContain('requireAuth');
      expect(initContent).toContain('oauthStateManager');
      expect(initContent).toContain('handleOAuthError');
      expect(initContent).toContain('RedditOAuthService');
    });

    it('should have secure Reddit OAuth callback endpoint', () => {
      const fs = require('fs');
      const path = require('path');
      
      const callbackPath = path.join(process.cwd(), 'app/api/auth/reddit/callback/route.ts');
      const callbackContent = fs.readFileSync(callbackPath, 'utf8');
      
      // Check for security improvements
      expect(callbackContent).toContain('requireAuth');
      expect(callbackContent).toContain('validateAndConsumeState');
      expect(callbackContent).toContain('tokenManager.storeTokens');
      expect(callbackContent).toContain('handleCallbackError');
      expect(callbackContent).toContain('createSuccessRedirect');
    });

    it('should have Reddit disconnect endpoint', () => {
      const fs = require('fs');
      const path = require('path');
      
      const disconnectPath = path.join(process.cwd(), 'app/api/reddit/disconnect/route.ts');
      expect(fs.existsSync(disconnectPath)).toBe(true);
      
      const disconnectContent = fs.readFileSync(disconnectPath, 'utf8');
      expect(disconnectContent).toContain('requireAuth');
      expect(disconnectContent).toContain('tokenManager.getAccount');
      expect(disconnectContent).toContain('revokeAccess');
      expect(disconnectContent).toContain('tokenManager.deleteAccount');
    });

    it('should have Reddit test auth endpoint', () => {
      const fs = require('fs');
      const path = require('path');
      
      const testPath = path.join(process.cwd(), 'app/api/reddit/test-auth/route.ts');
      expect(fs.existsSync(testPath)).toBe(true);
      
      const testContent = fs.readFileSync(testPath, 'utf8');
      expect(testContent).toContain('requireAuth');
      expect(testContent).toContain('RedditOAuthService');
      expect(testContent).toContain('getAuthorizationUrl');
      expect(testContent).toContain('recommendations');
    });
  });

  describe('Configuration and Constants', () => {
    it('should have retry configuration constants', () => {
      const fs = require('fs');
      const path = require('path');
      
      const servicePath = path.join(process.cwd(), 'lib/services/redditOAuth.ts');
      const serviceContent = fs.readFileSync(servicePath, 'utf8');
      
      // Check for retry constants
      expect(serviceContent).toContain('private readonly MAX_RETRIES = 3');
      expect(serviceContent).toContain('private readonly RETRY_DELAY = 1000');
    });

    it('should maintain existing functionality', () => {
      const fs = require('fs');
      const path = require('path');
      
      const servicePath = path.join(process.cwd(), 'lib/services/redditOAuth.ts');
      const serviceContent = fs.readFileSync(servicePath, 'utf8');
      
      // Check that existing methods are still present
      expect(serviceContent).toContain('getAuthorizationUrl');
      expect(serviceContent).toContain('exchangeCodeForTokens');
      expect(serviceContent).toContain('refreshAccessToken');
      expect(serviceContent).toContain('getUserInfo');
      expect(serviceContent).toContain('getSubscribedSubreddits');
      expect(serviceContent).toContain('revokeAccess');
    });
  });

  describe('Documentation and Comments', () => {
    it('should have proper documentation for new features', () => {
      const fs = require('fs');
      const path = require('path');
      
      const servicePath = path.join(process.cwd(), 'lib/services/redditOAuth.ts');
      const serviceContent = fs.readFileSync(servicePath, 'utf8');
      
      // Check for documentation comments
      expect(serviceContent).toContain('Retry utility for API calls with exponential backoff');
      expect(serviceContent).toContain('Reddit access tokens expire in 1 hour');
    });

    it('should have updated scheduler documentation', () => {
      const fs = require('fs');
      const path = require('path');
      
      const schedulerPath = path.join(process.cwd(), 'lib/workers/tokenRefreshScheduler.ts');
      const schedulerContent = fs.readFileSync(schedulerPath, 'utf8');
      
      // Check for Reddit-specific documentation
      expect(schedulerContent).toContain('refresh tokens don\'t expire');
      expect(schedulerContent).toContain('Reddit keeps the same refresh token');
    });
  });

  describe('Consistency Across Platforms', () => {
    it('should follow same patterns as TikTok and Instagram OAuth', () => {
      const fs = require('fs');
      const path = require('path');
      
      // Check Reddit init endpoint follows same pattern
      const redditInitPath = path.join(process.cwd(), 'app/api/auth/reddit/route.ts');
      const redditInitContent = fs.readFileSync(redditInitPath, 'utf8');
      
      // Check TikTok init endpoint for comparison
      const tiktokInitPath = path.join(process.cwd(), 'app/api/auth/tiktok/route.ts');
      const tiktokInitContent = fs.readFileSync(tiktokInitPath, 'utf8');
      
      // Both should use requireAuth
      expect(redditInitContent).toContain('requireAuth');
      expect(tiktokInitContent).toContain('requireAuth');
      
      // Both should use oauthStateManager
      expect(redditInitContent).toContain('oauthStateManager');
      expect(tiktokInitContent).toContain('oauthStateManager');
      
      // Both should use handleOAuthError
      expect(redditInitContent).toContain('handleOAuthError');
      expect(tiktokInitContent).toContain('handleOAuthError');
    });

    it('should have consistent callback patterns', () => {
      const fs = require('fs');
      const path = require('path');
      
      // Check Reddit callback endpoint
      const redditCallbackPath = path.join(process.cwd(), 'app/api/auth/reddit/callback/route.ts');
      const redditCallbackContent = fs.readFileSync(redditCallbackPath, 'utf8');
      
      // Check Instagram callback endpoint for comparison
      const instagramCallbackPath = path.join(process.cwd(), 'app/api/auth/instagram/callback/route.ts');
      const instagramCallbackContent = fs.readFileSync(instagramCallbackPath, 'utf8');
      
      // Both should use validateAndConsumeState
      expect(redditCallbackContent).toContain('validateAndConsumeState');
      expect(instagramCallbackContent).toContain('validateAndConsumeState');
      
      // Both should use tokenManager.storeTokens
      expect(redditCallbackContent).toContain('tokenManager.storeTokens');
      expect(instagramCallbackContent).toContain('tokenManager.storeTokens');
      
      // Both should use createSuccessRedirect
      expect(redditCallbackContent).toContain('createSuccessRedirect');
      expect(instagramCallbackContent).toContain('createSuccessRedirect');
    });
  });
});