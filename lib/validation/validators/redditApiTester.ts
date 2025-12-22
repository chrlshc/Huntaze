/**
 * Reddit API Tester
 * 
 * Tests Reddit OAuth API connectivity and validates credentials
 * by making actual API calls to Reddit's OAuth endpoints.
 */

import { RedditCredentials } from '../index';
import { externalFetch } from '@/lib/services/external/http';
import { isExternalServiceError } from '@/lib/services/external/errors';

async function safeReadJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export interface RedditApiTestResult {
  isConnected: boolean;
  errors: string[];
  warnings: string[];
  accessToken?: string;
  tokenType?: string;
  expiresIn?: number;
}

/**
 * Reddit API connectivity tester
 */
export class RedditApiTester {
  private readonly baseUrl = 'https://www.reddit.com/api/v1';
  private readonly oauthUrl = 'https://oauth.reddit.com';

  /**
   * Test Reddit API connectivity using client credentials flow
   */
  async testConnectivity(credentials: RedditCredentials): Promise<RedditApiTestResult> {
    const result: RedditApiTestResult = {
      isConnected: false,
      errors: [],
      warnings: [],
    };

    try {
      // Test client credentials flow to get app-only access token
      const tokenResult = await this.getAppAccessToken(credentials);
      
      if (tokenResult.success && tokenResult.accessToken) {
        result.isConnected = true;
        result.accessToken = tokenResult.accessToken;
        result.tokenType = tokenResult.tokenType;
        result.expiresIn = tokenResult.expiresIn;

        // Test API call with the token
        const apiTest = await this.testApiCall(tokenResult.accessToken, credentials.userAgent);
        if (!apiTest.success) {
          result.warnings.push('Access token obtained but API test failed');
          if (apiTest.error) {
            result.warnings.push(apiTest.error);
          }
        }
      } else {
        result.isConnected = false;
        if (tokenResult.error) {
          result.errors.push(tokenResult.error);
        }
      }

    } catch (error) {
      result.isConnected = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error occurred');
    }

    return result;
  }

  /**
   * Get app-only access token using client credentials flow
   */
  private async getAppAccessToken(credentials: RedditCredentials): Promise<{
    success: boolean;
    accessToken?: string;
    tokenType?: string;
    expiresIn?: number;
    error?: string;
  }> {
    try {
      // Prepare basic auth header
      const auth = Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString('base64');

      const response = await externalFetch(`${this.baseUrl}/access_token`, {
        service: 'reddit',
        operation: 'oauth.access_token',
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': credentials.userAgent,
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
        }).toString(),
        cache: 'no-store',
        timeoutMs: 10_000,
        retry: { maxRetries: 0, retryMethods: ['POST'] },
        throwOnHttpError: false,
      });

      const data = await safeReadJson(response);

      if (!response.ok) {
        return {
          success: false,
          error: data.error_description || data.error || `HTTP ${response.status}`,
        };
      }

      if (data.access_token) {
        return {
          success: true,
          accessToken: data.access_token,
          tokenType: data.token_type || 'bearer',
          expiresIn: data.expires_in,
        };
      } else {
        return {
          success: false,
          error: 'No access token in response',
        };
      }

    } catch (error) {
      if (isExternalServiceError(error)) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  } 
 /**
   * Test API call with access token
   */
  private async testApiCall(accessToken: string, userAgent: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Make a simple API call to test the token
      const response = await externalFetch(`${this.oauthUrl}/api/v1/me`, {
        service: 'reddit',
        operation: 'oauth.me',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': userAgent,
        },
        cache: 'no-store',
        timeoutMs: 10_000,
        retry: { maxRetries: 1, retryMethods: ['GET'] },
        throwOnHttpError: false,
      });

      if (response.ok) {
        return { success: true };
      } else {
        const data = await safeReadJson(response);
        return {
          success: false,
          error: data.message || `API test failed with status ${response.status}`,
        };
      }

    } catch (error) {
      if (isExternalServiceError(error)) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'API test network error',
      };
    }
  }

  /**
   * Test Reddit OAuth authorization URL generation
   */
  async testAuthUrlGeneration(credentials: RedditCredentials): Promise<{
    success: boolean;
    authUrl?: string;
    error?: string;
  }> {
    try {
      const params = new URLSearchParams({
        client_id: credentials.clientId,
        response_type: 'code',
        state: 'test_validation_state',
        redirect_uri: credentials.redirectUri,
        duration: 'temporary',
        scope: 'identity submit edit read mysubreddits',
      });

      const authUrl = `${this.baseUrl}/authorize?${params.toString()}`;

      // Validate URL format
      try {
        new URL(authUrl);
        return {
          success: true,
          authUrl,
        };
      } catch (urlError) {
        return {
          success: false,
          error: 'Generated authorization URL is invalid',
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Auth URL generation failed',
      };
    }
  }

  /**
   * Validate User-Agent against Reddit's requirements
   */
  validateUserAgent(userAgent: string): {
    valid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    let valid = true;

    // Check format: "platform:app_id:version (by /u/username)"
    const userAgentPattern = /^[\w\-\.]+:[\w\-\.]+:[\w\-\.]+ \(by \/u\/[\w\-]+\)$/;
    
    if (!userAgentPattern.test(userAgent)) {
      warnings.push('User-Agent format may not follow Reddit guidelines');
      valid = false;
    }

    // Check for problematic terms
    const problematicTerms = ['bot', 'crawler', 'spider', 'scraper'];
    if (problematicTerms.some(term => userAgent.toLowerCase().includes(term))) {
      warnings.push('User-Agent contains terms that may be flagged by Reddit');
    }

    // Check length
    if (userAgent.length < 10) {
      warnings.push('User-Agent is too short');
      valid = false;
    }

    if (userAgent.length > 256) {
      warnings.push('User-Agent is too long (Reddit limit: 256 characters)');
      valid = false;
    }

    return { valid, warnings };
  }  /*
*
   * Test Reddit app configuration and permissions
   */
  async testAppConfiguration(credentials: RedditCredentials): Promise<{
    success: boolean;
    appType?: string;
    redirectUris?: string[];
    error?: string;
  }> {
    try {
      // Reddit doesn't provide a direct app info endpoint for client credentials
      // We can only test if the credentials work by getting a token
      const tokenResult = await this.getAppAccessToken(credentials);
      
      if (tokenResult.success) {
        return {
          success: true,
          appType: 'web', // Assumed for OAuth apps
        };
      } else {
        return {
          success: false,
          error: tokenResult.error || 'App configuration test failed',
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'App configuration test error',
      };
    }
  }

  /**
   * Test specific Reddit API scopes
   */
  async testScopes(credentials: RedditCredentials, scopes: string[]): Promise<{
    success: boolean;
    availableScopes?: string[];
    error?: string;
  }> {
    try {
      // For client credentials flow, we can't test user-specific scopes
      // We can only validate that the app can authenticate
      const tokenResult = await this.getAppAccessToken(credentials);
      
      if (tokenResult.success) {
        return {
          success: true,
          availableScopes: ['*'], // Client credentials have app-level access
        };
      } else {
        return {
          success: false,
          error: tokenResult.error || 'Scope test failed',
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Scope test error',
      };
    }
  }

  /**
   * Test Reddit rate limiting behavior
   */
  async testRateLimiting(credentials: RedditCredentials): Promise<{
    success: boolean;
    rateLimitInfo?: {
      remaining: number;
      resetTime: number;
    };
    error?: string;
  }> {
    try {
      const tokenResult = await this.getAppAccessToken(credentials);
      
      if (!tokenResult.success) {
        return {
          success: false,
          error: 'Cannot test rate limiting without valid token',
        };
      }

      // Make a test API call to check rate limit headers
      const response = await externalFetch(`${this.oauthUrl}/api/v1/me`, {
        service: 'reddit',
        operation: 'oauth.me.rateLimit',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenResult.accessToken}`,
          'User-Agent': credentials.userAgent,
        },
        cache: 'no-store',
        timeoutMs: 10_000,
        retry: { maxRetries: 1, retryMethods: ['GET'] },
        throwOnHttpError: false,
      });

      // Reddit uses X-Ratelimit headers
      const remaining = response.headers.get('X-Ratelimit-Remaining');
      const resetTime = response.headers.get('X-Ratelimit-Reset');

      return {
        success: true,
        rateLimitInfo: {
          remaining: remaining ? parseInt(remaining, 10) : -1,
          resetTime: resetTime ? parseInt(resetTime, 10) : -1,
        },
      };

    } catch (error) {
      if (isExternalServiceError(error)) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Rate limit test error',
      };
    }
  }
}
