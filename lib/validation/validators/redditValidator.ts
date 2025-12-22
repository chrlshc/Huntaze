/**
 * Reddit OAuth Credentials Validator
 * 
 * Validates Reddit OAuth credentials by testing format, API connectivity,
 * and authentication flow components using Reddit OAuth API.
 */

import {
  CredentialValidator,
  CredentialValidationResult,
  ValidationError,
  ValidationWarning,
  RedditCredentials,
  ValidationErrorCode,
  ValidationWarningCode,
  ValidationErrorUtils,
  ApiConnectivityError,
  getPlatformConfig,
} from '../index';

import { RedditApiTester } from './redditApiTester';
import { RedditFormatValidator } from './redditFormatValidator';
import { externalFetch } from '@/lib/services/external/http';
import { isExternalServiceError } from '@/lib/services/external/errors';

/**
 * Reddit-specific credential validator
 */
export class RedditCredentialValidator extends CredentialValidator {
  readonly platform = 'reddit' as const;

  /**
   * Validate Reddit credentials comprehensively
   */
  async validateCredentials(credentials: RedditCredentials): Promise<CredentialValidationResult> {
    const startTime = Date.now();
    const result: CredentialValidationResult = {
      isValid: true,
      platform: this.platform,
      errors: [],
      warnings: [],
      metadata: {
        validatedAt: new Date(),
        responseTime: 0,
      },
    };

    try {
      // 1. Format validation (quick checks)
      const formatErrors = this.validateFormat(credentials);
      if (formatErrors.length > 0) {
        result.errors.push(...formatErrors);
        result.isValid = false;
      }

      // 2. Test API connectivity (with timeout)
      if (result.isValid) {   
     const platformConfig = getPlatformConfig(this.platform);
        try {
          const isConnected = await Promise.race([
            this.testApiConnectivity(credentials),
            this.createTimeoutPromise(platformConfig.timeout),
          ]);

          if (!isConnected) {
            result.errors.push({
              code: ValidationErrorCode.API_CONNECTIVITY_FAILED,
              message: 'Cannot connect to Reddit OAuth API',
              suggestion: 'Check if credentials are correct and Reddit API is accessible',
            });
            result.isValid = false;
          }
        } catch (error) {
          if (error instanceof Error && error.message === 'Validation timeout') {
            result.errors.push({
              code: ValidationErrorCode.VALIDATION_TIMEOUT,
              message: `Reddit API validation timeout after ${platformConfig.timeout}ms`,
              suggestion: 'Check network connectivity and Reddit API status',
            });
          } else {
            result.errors.push({
              code: ValidationErrorCode.API_CONNECTIVITY_FAILED,
              message: 'Reddit API connectivity test failed',
              suggestion: 'Verify credentials and network connectivity',
            });
          }
          result.isValid = false;
        }
      }

      // 3. Validate redirect URI accessibility (non-blocking)
      try {
        await this.validateRedirectUri(credentials.redirectUri);
      } catch (error: unknown) {
        result.warnings.push({
          code: ValidationWarningCode.REDIRECT_URI_WARNING,
          message: 'Redirect URI may not be accessible',
          severity: 'medium',
        });
      }

      // 4. Add format validation warnings
      if (this.lastFormatWarnings.length > 0) {
        result.warnings.push(...this.lastFormatWarnings);
        this.lastFormatWarnings = []; // Clear after use
      }

      // 5. Check for development credentials in production
      if (this.isDevelopmentCredentials(credentials)) {
        result.warnings.push({
          code: ValidationWarningCode.DEVELOPMENT_CREDENTIALS,
          message: 'Using development credentials',
          severity: process.env.NODE_ENV === 'production' ? 'high' : 'low',
        });
      }

    } catch (error) {
      result.errors.push(ValidationErrorUtils.fromError(error as Error, this.platform));
      result.isValid = false;
    }

    result.metadata.responseTime = Date.now() - startTime;
    return result;
  }  /**
  
 * Validate Reddit credentials format using dedicated format validator
   */
  validateFormat(credentials: RedditCredentials): ValidationError[] {
    const formatValidator = new RedditFormatValidator();
    const formatResult = formatValidator.validateFormat(credentials);
    
    // Convert format validation errors to standard validation errors
    const errors: ValidationError[] = formatResult.errors.map((error: ValidationError) => ({
      ...error,
      platform: this.platform,
    }));

    // Add warnings to the result (they will be handled in the main validation method)
    if (formatResult.warnings.length > 0) {
      // Store warnings for later use in validateCredentials method
      this.lastFormatWarnings = formatResult.warnings;
    }

    return errors;
  }

  private lastFormatWarnings: ValidationWarning[] = [];

  /**
   * Enhanced format validation with detailed error messages and suggestions
   */
  validateFormatEnhanced(credentials: RedditCredentials): CredentialValidationResult {
    const formatValidator = new RedditFormatValidator();
    const formatResult = formatValidator.validateFormat(credentials);
    
    const result: CredentialValidationResult = {
      isValid: formatResult.isValid,
      platform: this.platform,
      errors: formatResult.errors.map((error: ValidationError) => ({
        ...error,
        platform: this.platform,
      })),
      warnings: formatResult.warnings,
      metadata: {
        validatedAt: new Date(),
        responseTime: 0,
        apiVersion: 'format-validation',
      },
    };

    // Add specific suggestions for common format errors
    result.errors.forEach(error => {
      if (!error.suggestion) {
        error.suggestion = this.getFormatErrorSuggestion(error.code, error.field);
      }
    });

    return result;
  } 
 /**
   * Get specific suggestions for format validation errors
   */
  private getFormatErrorSuggestion(errorCode: string, field?: string): string {
    const suggestions: Record<string, Record<string, string>> = {
      [ValidationErrorCode.MISSING_CLIENT_ID]: {
        clientId: 'Obtain your Client ID from the Reddit App Preferences at https://www.reddit.com/prefs/apps. Create a new app and copy the Client ID.',
      },
      [ValidationErrorCode.MISSING_CLIENT_SECRET]: {
        clientSecret: 'Obtain your Client Secret from the Reddit App Preferences at https://www.reddit.com/prefs/apps. Create a new app and copy the Client Secret.',
      },
      [ValidationErrorCode.MISSING_USER_AGENT]: {
        userAgent: 'Set a unique User-Agent string following Reddit guidelines: "platform:app_id:version (by /u/username)". Example: "web:myapp:v1.0 (by /u/myusername)"',
      },
      [ValidationErrorCode.INVALID_REDIRECT_URI]: {
        redirectUri: 'Ensure your redirect URI uses HTTPS and matches the URI configured in your Reddit app settings. Example: https://yourdomain.com/api/auth/reddit/callback',
      },
    };

    return suggestions[errorCode]?.[field || ''] || this.getErrorSuggestion(errorCode) || 'Please check the Reddit App Preferences for correct credential format.';
  }

  /**
   * Validate credentials specifically for production environment
   */
  validateForProduction(credentials: RedditCredentials): CredentialValidationResult {
    const formatValidator = new RedditFormatValidator();
    const productionResult = formatValidator.validateForProduction(credentials);
    
    const result: CredentialValidationResult = {
      isValid: productionResult.isValid,
      platform: this.platform,
      errors: productionResult.errors.map((error: ValidationError) => ({
        ...error,
        platform: this.platform,
      })),
      warnings: productionResult.warnings,
      metadata: {
        validatedAt: new Date(),
        responseTime: 0,
        apiVersion: 'production-validation',
      },
    };

    // Add production-specific error suggestions
    result.errors.forEach(error => {
      if (!error.suggestion) {
        error.suggestion = this.getProductionErrorSuggestion(error.code, error.field);
      }
    });

    return result;
  } 
 /**
   * Get production-specific error suggestions
   */
  private getProductionErrorSuggestion(errorCode: string, field?: string): string {
    const productionSuggestions: Record<string, Record<string, string>> = {
      [ValidationErrorCode.INVALID_REDIRECT_URI]: {
        redirectUri: 'Production redirect URIs must use HTTPS and point to a publicly accessible domain. Localhost, IP addresses, and development domains are not allowed.',
      },
      [ValidationErrorCode.MISSING_CLIENT_SECRET]: {
        clientSecret: 'Production Client Secrets must be kept secure. Ensure you are using the correct secret from your Reddit app configuration.',
      },
      [ValidationErrorCode.MISSING_USER_AGENT]: {
        userAgent: 'Production User-Agent must follow Reddit guidelines and be unique to your application. Use format: "platform:app_id:version (by /u/username)"',
      },
    };

    return productionSuggestions[errorCode]?.[field || ''] || this.getFormatErrorSuggestion(errorCode, field);
  }

  /**
   * Test Reddit API connectivity using OAuth client credentials flow
   */
  async testApiConnectivity(credentials: RedditCredentials): Promise<boolean> {
    try {
      const apiTester = new RedditApiTester();
      const testResult = await apiTester.testConnectivity(credentials);
      return testResult.isConnected;
    } catch (error) {
      console.error('Reddit API connectivity test failed:', error);
      return false;
    }
  }

  /**
   * Test Reddit OAuth authorization URL generation
   */
  private async testAuthUrlGeneration(credentials: RedditCredentials): Promise<void> {
    const params = new URLSearchParams({
      client_id: credentials.clientId,
      response_type: 'code',
      state: 'test_validation_state',
      redirect_uri: credentials.redirectUri,
      duration: 'temporary',
      scope: 'identity submit edit read mysubreddits',
    });

    const url = `https://www.reddit.com/api/v1/authorize?${params.toString()}`;

    // Validate URL format
    if (!this.isValidUrl(url)) {
      throw new Error('Generated authorization URL is invalid');
    }

    // Additional validation: ensure required parameters are present
    const urlObj = new URL(url);
    const requiredParams = ['client_id', 'response_type', 'state', 'redirect_uri', 'scope'];
    
    for (const param of requiredParams) {
      if (!urlObj.searchParams.has(param)) {
        throw new Error(`Missing required parameter: ${param}`);
      }
    }
  }  
/**
   * Validate redirect URI accessibility
   */
  private async validateRedirectUri(redirectUri: string): Promise<void> {
    try {
      const response = await externalFetch(redirectUri, {
        service: 'redirect-uri',
        operation: 'reddit.validate',
        method: 'HEAD',
        timeoutMs: 5_000,
        retry: { maxRetries: 0, retryMethods: ['HEAD'] },
        throwOnHttpError: false,
      });

      // We expect 404 or 405 (Method Not Allowed) for callback endpoints
      // 200, 404, 405 are all acceptable responses
      if (!response.ok && ![404, 405].includes(response.status)) {
        throw new Error(`Redirect URI returned ${response.status}`);
      }
    } catch (error: unknown) {
      if (isExternalServiceError(error) && error.code === 'TIMEOUT') {
        throw new Error('Redirect URI request timeout');
      }
      throw error;
    }
  }

  /**
   * Check if credentials appear to be development/test credentials
   */
  private isDevelopmentCredentials(credentials: RedditCredentials): boolean {
    const devIndicators = [
      'test',
      'dev',
      'development',
      'localhost',
      'example.com',
      'demo',
      'sandbox',
    ];

    const credentialString = `${credentials.clientId} ${credentials.clientSecret} ${credentials.redirectUri} ${credentials.userAgent}`.toLowerCase();
    
    return devIndicators.some(indicator => credentialString.includes(indicator));
  }

  /**
   * Validate Reddit scope permissions
   */
  async validateScopes(credentials: RedditCredentials, requiredScopes: string[]): Promise<CredentialValidationResult> {
    const startTime = Date.now();
    const result: CredentialValidationResult = {
      isValid: true,
      platform: this.platform,
      errors: [],
      warnings: [],
      metadata: {
        validatedAt: new Date(),
        responseTime: 0,
        apiVersion: 'scope-validation',
      },
    };

    try {
      const apiTester = new RedditApiTester();
      const testResult = await apiTester.testConnectivity(credentials);

      if (!testResult.isConnected) {
        result.errors.push({
          code: ValidationErrorCode.API_CONNECTIVITY_FAILED,
          message: 'Cannot connect to Reddit API to check scopes',
          suggestion: 'Verify your credentials and ensure the Reddit API is accessible',
        });
        result.isValid = false;
      } else {
        // Reddit doesn't provide scope validation in client credentials flow
        // We can only validate that the app can authenticate
        result.warnings.push({
          code: ValidationWarningCode.MISSING_PERMISSIONS,
          message: 'Scope validation requires user authorization flow',
          severity: 'low',
        });
      }

    } catch (error) {
      result.errors.push(ValidationErrorUtils.fromError(error as Error, this.platform));
      result.isValid = false;
    }

    result.metadata.responseTime = Date.now() - startTime;
    return result;
  }

  /**
   * Validate User-Agent format according to Reddit guidelines
   */
  validateUserAgent(credentials: RedditCredentials): CredentialValidationResult {
    const startTime = Date.now();
    const result: CredentialValidationResult = {
      isValid: true,
      platform: this.platform,
      errors: [],
      warnings: [],
      metadata: {
        validatedAt: new Date(),
        responseTime: 0,
        apiVersion: 'user-agent-validation',
      },
    };

    const userAgent = credentials.userAgent;
    
    // Reddit User-Agent guidelines: "platform:app_id:version (by /u/username)"
    const userAgentPattern = /^[\w\-\.]+:[\w\-\.]+:[\w\-\.]+ \(by \/u\/[\w\-]+\)$/;
    
    if (!userAgent || userAgent.trim().length === 0) {
      result.errors.push({
        code: ValidationErrorCode.MISSING_USER_AGENT,
        message: 'User-Agent is required for Reddit API',
        suggestion: 'Set a User-Agent following Reddit guidelines: "platform:app_id:version (by /u/username)"',
      });
      result.isValid = false;
    } else if (!userAgentPattern.test(userAgent)) {
      result.warnings.push({
        code: ValidationWarningCode.INVALID_USER_AGENT,
        message: 'User-Agent format may not follow Reddit guidelines',
        severity: 'medium',
      });
    }

    // Check for common problematic User-Agent strings
    const problematicPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
    ];

    if (problematicPatterns.some(pattern => pattern.test(userAgent))) {
      result.warnings.push({
        code: ValidationWarningCode.INVALID_USER_AGENT,
        message: 'User-Agent contains terms that may be flagged by Reddit',
        severity: 'high',
      });
    }

    result.metadata.responseTime = Date.now() - startTime;
    return result;
  }

  /**
   * Test comprehensive API connectivity including user agent validation
   */
  async validateApiConnectivity(credentials: RedditCredentials): Promise<CredentialValidationResult> {
    const startTime = Date.now();
    const result: CredentialValidationResult = {
      isValid: true,
      platform: this.platform,
      errors: [],
      warnings: [],
      metadata: {
        validatedAt: new Date(),
        responseTime: 0,
        apiVersion: 'api-connectivity-validation',
      },
    };

    try {
      const apiTester = new RedditApiTester();
      const testResult = await apiTester.testConnectivity(credentials);

      if (!testResult.isConnected) {
        result.errors.push({
          code: ValidationErrorCode.API_CONNECTIVITY_FAILED,
          message: 'Cannot connect to Reddit OAuth API',
          suggestion: 'Check if credentials are correct and Reddit API is accessible',
        });
        result.isValid = false;

        // Add specific error details
        if (testResult.errors.length > 0) {
          testResult.errors.forEach((error: string) => {
            result.errors.push({
              code: ValidationErrorCode.API_CONNECTIVITY_FAILED,
              message: error,
              suggestion: 'Verify your Client ID and Client Secret in Reddit App Preferences',
            });
          });
        }
      } else {
        // Add warnings from API test
        if (testResult.warnings.length > 0) {
          testResult.warnings.forEach((warning: string) => {
            result.warnings.push({
              code: ValidationWarningCode.MISSING_PERMISSIONS,
              message: warning,
              severity: 'medium',
            });
          });
        }
      }

    } catch (error) {
      result.errors.push(ValidationErrorUtils.fromError(error as Error, this.platform));
      result.isValid = false;
    }

    result.metadata.responseTime = Date.now() - startTime;
    return result;
  }

  /**
   * Validate Reddit-specific scope requirements
   */
  validateRedditScopes(requestedScopes: string[]): CredentialValidationResult {
    const startTime = Date.now();
    const result: CredentialValidationResult = {
      isValid: true,
      platform: this.platform,
      errors: [],
      warnings: [],
      metadata: {
        validatedAt: new Date(),
        responseTime: 0,
        apiVersion: 'reddit-scope-validation',
      },
    };

    // Define Reddit scope requirements
    const availableScopes = [
      'identity',      // Access to user's identity
      'edit',          // Edit and delete comments and submissions
      'flair',         // Manage user and link flair
      'history',       // Access to user's history
      'modconfig',     // Manage configuration of subreddits
      'modflair',      // Manage flair in moderated subreddits
      'modlog',        // Access to moderation log
      'modposts',      // Approve, remove, mark nsfw, and distinguish content
      'modwiki',       // Change wiki settings and edit wiki pages
      'mysubreddits',  // Access to user's subreddit subscriptions and contributor status
      'privatemessages', // Access to user's private messages
      'read',          // Access to user's voting history and comments
      'report',        // Report content for rules violations
      'save',          // Save and unsave comments and submissions
      'submit',        // Submit content to subreddits
      'subscribe',     // Manage subreddit subscriptions
      'vote',          // Submit and change votes on comments and submissions
      'wikiedit',      // Edit wiki pages
      'wikiread',      // Read wiki pages
    ];

    // Validate each requested scope
    const invalidScopes = requestedScopes.filter(scope => 
      !availableScopes.includes(scope)
    );

    if (invalidScopes.length > 0) {
      result.errors.push({
        code: ValidationErrorCode.INSUFFICIENT_PERMISSIONS,
        message: `Invalid Reddit scopes: ${invalidScopes.join(', ')}`,
        suggestion: `Valid Reddit scopes are: ${availableScopes.join(', ')}`,
      });
      result.isValid = false;
    }

    // Check for recommended scope combinations
    if (requestedScopes.includes('submit') && !requestedScopes.includes('read')) {
      result.warnings.push({
        code: ValidationWarningCode.MISSING_PERMISSIONS,
        message: 'Requesting "submit" without "read" may limit functionality',
        severity: 'medium',
      });
    }

    if (requestedScopes.includes('edit') && !requestedScopes.includes('read')) {
      result.warnings.push({
        code: ValidationWarningCode.MISSING_PERMISSIONS,
        message: 'Requesting "edit" without "read" may limit functionality',
        severity: 'medium',
      });
    }

    // Warn about sensitive scopes
    const sensitiveScopes = ['modconfig', 'modlog', 'modposts', 'modwiki'];
    const requestedSensitiveScopes = requestedScopes.filter(scope => 
      sensitiveScopes.includes(scope)
    );

    if (requestedSensitiveScopes.length > 0) {
      result.warnings.push({
        code: ValidationWarningCode.MISSING_PERMISSIONS,
        message: `Requesting sensitive moderator scopes: ${requestedSensitiveScopes.join(', ')}`,
        severity: 'high',
      });
    }

    result.metadata.responseTime = Date.now() - startTime;
    return result;
  }

  /**
   * Get Reddit-specific error suggestions
   */
  protected getErrorSuggestion(errorCode: string): string | null {
    const suggestions: Record<string, string> = {
      [ValidationErrorCode.MISSING_CLIENT_ID]: 'Get your Client ID from Reddit App Preferences at https://www.reddit.com/prefs/apps',
      [ValidationErrorCode.MISSING_CLIENT_SECRET]: 'Get your Client Secret from Reddit App Preferences at https://www.reddit.com/prefs/apps',
      [ValidationErrorCode.MISSING_USER_AGENT]: 'Set a unique User-Agent following Reddit guidelines: "platform:app_id:version (by /u/username)"',
      [ValidationErrorCode.INVALID_REDIRECT_URI]: 'Configure redirect URI in Reddit App Preferences and ensure it matches your environment',
      [ValidationErrorCode.API_CONNECTIVITY_FAILED]: 'Check Reddit API status and verify your credentials in App Preferences',
      [ValidationErrorCode.INSUFFICIENT_PERMISSIONS]: 'Ensure your Reddit app has the required scopes: identity, submit, edit, read, mysubreddits',
    };

    return suggestions[errorCode] || null;
  }
}
