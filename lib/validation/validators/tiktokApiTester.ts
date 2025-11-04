/**
 * TikTok API Connectivity Tester
 * 
 * Advanced API connectivity tests for TikTok OAuth credentials validation.
 * This module provides comprehensive testing of TikTok API endpoints.
 */

import {
  TikTokCredentials,
  ApiConnectivityError,
  ValidationTimeoutError,
  RateLimitExceededError,
  ValidationErrorCode,
} from '../index';

/**
 * TikTok API endpoints for testing
 */
const TIKTOK_API_ENDPOINTS = {
  OAUTH_AUTHORIZE: 'https://www.tiktok.com/v2/auth/authorize',
  OAUTH_TOKEN: 'https://open.tiktokapis.com/v2/oauth/token/',
  USER_INFO: 'https://open.tiktokapis.com/v2/user/info/',
  VIDEO_QUERY: 'https://open.tiktokapis.com/v2/video/query/',
} as const;

/**
 * TikTok API test results
 */
export interface TikTokApiTestResult {
  endpoint: string;
  success: boolean;
  responseTime: number;
  statusCode?: number;
  error?: string;
  errorCode?: string;
}

/**
 * Comprehensive TikTok API connectivity test results
 */
export interface TikTokConnectivityTestResult {
  overall: boolean;
  tests: TikTokApiTestResult[];
  totalResponseTime: number;
  errors: string[];
  warnings: string[];
}

/**
 * TikTok API connectivity tester
 */
export class TikTokApiTester {
  private timeout: number;

  constructor(timeout: number = 15000) {
    this.timeout = timeout;
  }

  /**
   * Run comprehensive connectivity tests
   */
  async runConnectivityTests(credentials: TikTokCredentials): Promise<TikTokConnectivityTestResult> {
    const startTime = Date.now();
    const tests: TikTokApiTestResult[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Test 1: OAuth Authorization URL Generation
      const authUrlTest = await this.testAuthorizationUrl(credentials);
      tests.push(authUrlTest);

      // Test 2: OAuth Token Endpoint Connectivity
      const tokenEndpointTest = await this.testTokenEndpoint(credentials);
      tests.push(tokenEndpointTest);

      // Test 3: API Base Connectivity (User Info endpoint)
      const userInfoTest = await this.testUserInfoEndpoint(credentials);
      tests.push(userInfoTest);

      // Test 4: Video API Endpoint Connectivity
      const videoApiTest = await this.testVideoApiEndpoint(credentials);
      tests.push(videoApiTest);

      // Analyze results
      const successfulTests = tests.filter(test => test.success);
      const overall = successfulTests.length >= 2; // At least 2 tests should pass

      // Collect errors and warnings
      tests.forEach(test => {
        if (!test.success && test.error) {
          errors.push(`${test.endpoint}: ${test.error}`);
        }
      });

      // Add warnings for partial failures
      if (successfulTests.length > 0 && successfulTests.length < tests.length) {
        warnings.push('Some TikTok API endpoints are not accessible, but basic connectivity works');
      }

      return {
        overall,
        tests,
        totalResponseTime: Date.now() - startTime,
        errors,
        warnings,
      };

    } catch (error) {
      errors.push(`Connectivity test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        overall: false,
        tests,
        totalResponseTime: Date.now() - startTime,
        errors,
        warnings,
      };
    }
  }

  /**
   * Test OAuth authorization URL generation and validation
   */
  async testAuthorizationUrl(credentials: TikTokCredentials): Promise<TikTokApiTestResult> {
    const startTime = Date.now();
    
    try {
      // Generate authorization URL
      const params = new URLSearchParams({
        client_key: credentials.clientKey,
        scope: 'user.info.basic',
        response_type: 'code',
        redirect_uri: credentials.redirectUri,
        state: 'connectivity_test',
      });

      const authUrl = `${TIKTOK_API_ENDPOINTS.OAUTH_AUTHORIZE}?${params.toString()}`;

      // Validate URL structure
      const url = new URL(authUrl);
      const requiredParams = ['client_key', 'scope', 'response_type', 'redirect_uri', 'state'];
      
      for (const param of requiredParams) {
        if (!url.searchParams.has(param)) {
          throw new Error(`Missing required parameter: ${param}`);
        }
      }

      // Test URL accessibility (HEAD request)
      const response = await this.makeRequest(TIKTOK_API_ENDPOINTS.OAUTH_AUTHORIZE, {
        method: 'HEAD',
      });

      return {
        endpoint: 'OAuth Authorization',
        success: response.ok || response.status === 405, // 405 Method Not Allowed is acceptable
        responseTime: Date.now() - startTime,
        statusCode: response.status,
      };

    } catch (error) {
      return {
        endpoint: 'OAuth Authorization',
        success: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Test OAuth token endpoint with invalid request (to validate credentials format)
   */
  async testTokenEndpoint(credentials: TikTokCredentials): Promise<TikTokApiTestResult> {
    const startTime = Date.now();
    
    try {
      const response = await this.makeRequest(TIKTOK_API_ENDPOINTS.OAUTH_TOKEN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_key: credentials.clientKey,
          client_secret: credentials.clientSecret,
          grant_type: 'connectivity_test', // Invalid grant type for testing
        }).toString(),
      });

      const data = await response.json();

      // Analyze response to determine if credentials format is valid
      if (data.error) {
        const validFormatErrors = [
          'unsupported_grant_type',
          'invalid_grant',
          'invalid_request',
        ];

        const invalidCredentialErrors = [
          'invalid_client',
          'unauthorized_client',
          'invalid_client_id',
        ];

        if (validFormatErrors.includes(data.error)) {
          // Credentials format is valid, just the request is invalid (expected)
          return {
            endpoint: 'OAuth Token',
            success: true,
            responseTime: Date.now() - startTime,
            statusCode: response.status,
          };
        } else if (invalidCredentialErrors.includes(data.error)) {
          // Credentials are invalid
          return {
            endpoint: 'OAuth Token',
            success: false,
            responseTime: Date.now() - startTime,
            statusCode: response.status,
            error: `Invalid credentials: ${data.error_description || data.error}`,
            errorCode: data.error,
          };
        }
      }

      // Unexpected response
      return {
        endpoint: 'OAuth Token',
        success: false,
        responseTime: Date.now() - startTime,
        statusCode: response.status,
        error: 'Unexpected response from token endpoint',
      };

    } catch (error) {
      return {
        endpoint: 'OAuth Token',
        success: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Test User Info API endpoint (requires valid access token, so we test endpoint availability)
   */
  async testUserInfoEndpoint(credentials: TikTokCredentials): Promise<TikTokApiTestResult> {
    const startTime = Date.now();
    
    try {
      // Test with invalid token to check endpoint availability
      const response = await this.makeRequest(TIKTOK_API_ENDPOINTS.USER_INFO, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid_token_for_testing',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      // We expect an authentication error, which indicates the endpoint is accessible
      if (data.error && (
        data.error.code === 'access_token_invalid' ||
        data.error.code === 'invalid_token' ||
        response.status === 401
      )) {
        return {
          endpoint: 'User Info API',
          success: true,
          responseTime: Date.now() - startTime,
          statusCode: response.status,
        };
      }

      return {
        endpoint: 'User Info API',
        success: false,
        responseTime: Date.now() - startTime,
        statusCode: response.status,
        error: 'Unexpected response from user info endpoint',
      };

    } catch (error) {
      return {
        endpoint: 'User Info API',
        success: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Test Video API endpoint availability
   */
  async testVideoApiEndpoint(credentials: TikTokCredentials): Promise<TikTokApiTestResult> {
    const startTime = Date.now();
    
    try {
      // Test with invalid token to check endpoint availability
      const response = await this.makeRequest(TIKTOK_API_ENDPOINTS.VIDEO_QUERY, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer invalid_token_for_testing',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: {
            and: [
              { operation: 'EQ', field_name: 'region_code', field_values: ['US'] }
            ]
          }
        }),
      });

      const data = await response.json();

      // We expect an authentication error, which indicates the endpoint is accessible
      if (data.error && (
        data.error.code === 'access_token_invalid' ||
        data.error.code === 'invalid_token' ||
        response.status === 401
      )) {
        return {
          endpoint: 'Video API',
          success: true,
          responseTime: Date.now() - startTime,
          statusCode: response.status,
        };
      }

      return {
        endpoint: 'Video API',
        success: false,
        responseTime: Date.now() - startTime,
        statusCode: response.status,
        error: 'Unexpected response from video API endpoint',
      };

    } catch (error) {
      return {
        endpoint: 'Video API',
        success: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Make HTTP request with timeout and error handling
   */
  private async makeRequest(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;

    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ValidationTimeoutError('tiktok', this.timeout);
        }
        
        // Check for rate limiting
        if (error.message.includes('429') || error.message.includes('rate limit')) {
          throw new RateLimitExceededError('tiktok');
        }
      }

      throw new ApiConnectivityError('tiktok', error as Error);
    }
  }

  /**
   * Quick connectivity test (simplified version)
   */
  async quickConnectivityTest(credentials: TikTokCredentials): Promise<boolean> {
    try {
      const tokenTest = await this.testTokenEndpoint(credentials);
      return tokenTest.success;
    } catch (error) {
      return false;
    }
  }
}