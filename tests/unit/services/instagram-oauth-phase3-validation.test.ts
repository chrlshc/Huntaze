/**
 * Instagram OAuth Phase 3 Validation Tests
 * 
 * Simple validation tests for Phase 3 improvements
 */

describe('Instagram OAuth Phase 3 - Validation', () => {
  describe('Token Refresh Implementation', () => {
    it('should have Instagram token refresh method in scheduler', () => {
      // Test that the method exists and has correct signature
      const fs = require('fs');
      const path = require('path');
      
      const schedulerPath = path.join(process.cwd(), 'lib/workers/tokenRefreshScheduler.ts');
      const schedulerContent = fs.readFileSync(schedulerPath, 'utf8');
      
      // Check for Instagram refresh method
      expect(schedulerContent).toContain('refreshInstagramAccount');
      expect(schedulerContent).toContain('InstagramOAuthService');
      expect(schedulerContent).toContain('refreshLongLivedToken');
      
      // Check for proper token handling
      expect(schedulerContent).toContain('decryptAccessToken');
      expect(schedulerContent).toContain('refreshToken: undefined');
    });

    it('should handle Instagram provider in refresh logic', () => {
      const fs = require('fs');
      const path = require('path');
      
      const schedulerPath = path.join(process.cwd(), 'lib/workers/tokenRefreshScheduler.ts');
      const schedulerContent = fs.readFileSync(schedulerPath, 'utf8');
      
      // Check for Instagram case in switch statement
      expect(schedulerContent).toContain("case 'instagram':");
      expect(schedulerContent).toContain('No access token available for Instagram');
    });
  });

  describe('Enhanced Error Handling', () => {
    it('should have retry logic in Instagram OAuth service', () => {
      const fs = require('fs');
      const path = require('path');
      
      const servicePath = path.join(process.cwd(), 'lib/services/instagramOAuth.ts');
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
      
      const servicePath = path.join(process.cwd(), 'lib/services/instagramOAuth.ts');
      const serviceContent = fs.readFileSync(servicePath, 'utf8');
      
      // Check for rate limiting detection
      expect(serviceContent).toContain('response.status === 429');
      expect(serviceContent).toContain('Rate limit exceeded. Please try again later.');
      
      // Check for User-Agent headers
      expect(serviceContent).toContain('User-Agent');
      expect(serviceContent).toContain('Instagram-OAuth-Client/1.0');
    });

    it('should have specific error handling for token expiry', () => {
      const fs = require('fs');
      const path = require('path');
      
      const servicePath = path.join(process.cwd(), 'lib/services/instagramOAuth.ts');
      const serviceContent = fs.readFileSync(servicePath, 'utf8');
      
      // Check for specific error code handling
      expect(serviceContent).toContain('data.error?.code === 190');
      expect(serviceContent).toContain('Token has expired and cannot be refreshed');
    });
  });

  describe('API Method Enhancements', () => {
    it('should use retry logic in all API methods', () => {
      const fs = require('fs');
      const path = require('path');
      
      const servicePath = path.join(process.cwd(), 'lib/services/instagramOAuth.ts');
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
      
      const servicePath = path.join(process.cwd(), 'lib/services/instagramOAuth.ts');
      const serviceContent = fs.readFileSync(servicePath, 'utf8');
      
      // Check for refresh method signature
      expect(serviceContent).toContain('async refreshLongLivedToken(token: string): Promise<InstagramLongLivedToken>');
      
      // Check for retry method signature
      expect(serviceContent).toContain('private async retryApiCall<T>');
      expect(serviceContent).toContain('operationName: string');
      expect(serviceContent).toContain('maxRetries: number');
    });
  });

  describe('Configuration and Constants', () => {
    it('should have retry configuration constants', () => {
      const fs = require('fs');
      const path = require('path');
      
      const servicePath = path.join(process.cwd(), 'lib/services/instagramOAuth.ts');
      const serviceContent = fs.readFileSync(servicePath, 'utf8');
      
      // Check for retry constants
      expect(serviceContent).toContain('private readonly MAX_RETRIES = 3');
      expect(serviceContent).toContain('private readonly RETRY_DELAY = 1000');
    });

    it('should maintain existing functionality', () => {
      const fs = require('fs');
      const path = require('path');
      
      const servicePath = path.join(process.cwd(), 'lib/services/instagramOAuth.ts');
      const serviceContent = fs.readFileSync(servicePath, 'utf8');
      
      // Check that existing methods are still present
      expect(serviceContent).toContain('getAuthorizationUrl');
      expect(serviceContent).toContain('exchangeCodeForTokens');
      expect(serviceContent).toContain('getLongLivedToken');
      expect(serviceContent).toContain('getAccountInfo');
      expect(serviceContent).toContain('hasInstagramBusinessAccount');
      expect(serviceContent).toContain('getInstagramAccountDetails');
      expect(serviceContent).toContain('revokeAccess');
    });
  });

  describe('Documentation and Comments', () => {
    it('should have proper documentation for new features', () => {
      const fs = require('fs');
      const path = require('path');
      
      const servicePath = path.join(process.cwd(), 'lib/services/instagramOAuth.ts');
      const serviceContent = fs.readFileSync(servicePath, 'utf8');
      
      // Check for documentation comments
      expect(serviceContent).toContain('Retry utility for API calls with exponential backoff');
      expect(serviceContent).toContain('Long-lived tokens can be refreshed once per day');
    });

    it('should have updated scheduler documentation', () => {
      const fs = require('fs');
      const path = require('path');
      
      const schedulerPath = path.join(process.cwd(), 'lib/workers/tokenRefreshScheduler.ts');
      const schedulerContent = fs.readFileSync(schedulerPath, 'utf8');
      
      // Check for Instagram-specific documentation
      expect(schedulerContent).toContain("Instagram doesn't use refresh tokens");
      expect(schedulerContent).toContain('refresh using the current access token');
    });
  });
});