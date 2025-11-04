/**
 * TikTok OAuth Credentials Validator
 * 
 * Validates TikTok OAuth credentials by testing format, API connectivity,
 * and authentication flow components.
 */

import {
  CredentialValidator,
  CredentialValidationResult,
  ValidationError,
  ValidationWarning,
  TikTokCredentials,
  ValidationErrorCode,
  ValidationWarningCode,
  ValidationErrorUtils,
  ApiConnectivityError,
  ValidationTimeoutError,
  getPlatformConfig,
} from '../index';

import { TikTokApiTester } from './tiktokApiTester';
import { TikTokFormatValidator } from './tiktokFormatValidator';

/**
 * TikTok-specific credential validator
 */
export class TikTokCredentialValidator extends CredentialValidator {
  readonly platform = 'tiktok' as const;

  /**
   * Validate TikTok credentials comprehensively
   */
  async validateCredentials(credentials: TikTokCredentials): Promise<CredentialValidationResult> {
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

      // 2. Test authorization URL generation
      if (result.isValid) {
        try {
          await this.testAuthUrlGeneration(credentials);
        } catch (error) {
          result.errors.push({
            code: ValidationErrorCode.INVALID_CREDENTIALS,
            message: 'Failed to generate TikTok authorization URL',
            suggestion: 'Check if Client Key format is correct',
          });
          result.isValid = false;
        }
      }

      // 3. Test API connectivity (with timeout)
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
              message: 'Cannot connect to TikTok API',
              suggestion: 'Check if credentials are correct and TikTok API is accessible',
            });
            result.isValid = false;
          }
        } catch (error) {
          if (error instanceof Error && error.message === 'Validation timeout') {
            result.errors.push({
              code: ValidationErrorCode.VALIDATION_TIMEOUT,
              message: `TikTok API validation timeout after ${platformConfig.timeout}ms`,
              suggestion: 'Check network connectivity and TikTok API status',
            });
          } else {
            result.errors.push({
              code: ValidationErrorCode.API_CONNECTIVITY_FAILED,
              message: 'TikTok API connectivity test failed',
              suggestion: 'Verify credentials and network connectivity',
            });
          }
          result.isValid = false;
        }
      }

      // 4. Validate redirect URI accessibility (non-blocking)
      try {
        await this.validateRedirectUri(credentials.redirectUri);
      } catch (error) {
        result.warnings.push({
          code: ValidationWarningCode.REDIRECT_URI_WARNING,
          message: 'Redirect URI may not be accessible',
          severity: 'medium',
        });
      }

      // 5. Add format validation warnings
      if (this.lastFormatWarnings.length > 0) {
        result.warnings.push(...this.lastFormatWarnings);
        this.lastFormatWarnings = []; // Clear after use
      }

      // 6. Check for development credentials in production
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
  }

  /**
   * Validate TikTok credentials format using dedicated format validator
   */
  validateFormat(credentials: TikTokCredentials): ValidationError[] {
    const formatValidator = new TikTokFormatValidator();
    const formatResult = formatValidator.validateFormat(credentials);
    
    // Convert format validation errors to standard validation errors
    const errors: ValidationError[] = formatResult.errors.map(error => ({
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
  validateFormatEnhanced(credentials: TikTokCredentials): CredentialValidationResult {
    const formatValidator = new TikTokFormatValidator();
    const formatResult = formatValidator.validateFormat(credentials);
    
    const result: CredentialValidationResult = {
      isValid: formatResult.isValid,
      platform: this.platform,
      errors: formatResult.errors.map(error => ({
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
      [ValidationErrorCode.MISSING_CLIENT_KEY]: {
        clientKey: 'Obtain your Client Key from the TikTok Developer Portal at https://developers.tiktok.com/. Navigate to your app settings and copy the Client Key.',
      },
      [ValidationErrorCode.MISSING_CLIENT_SECRET]: {
        clientSecret: 'Obtain your Client Secret from the TikTok Developer Portal at https://developers.tiktok.com/. Navigate to your app settings and copy the Client Secret.',
      },
      [ValidationErrorCode.INVALID_REDIRECT_URI]: {
        redirectUri: 'Ensure your redirect URI uses HTTPS and matches the URI configured in your TikTok app settings. Example: https://yourdomain.com/api/auth/tiktok/callback',
      },
    };

    return suggestions[errorCode]?.[field || ''] || this.getErrorSuggestion(errorCode) || 'Please check the TikTok Developer Portal for correct credential format.';
  }

  /**
   * Validate credentials specifically for production environment
   */
  validateForProduction(credentials: TikTokCredentials): CredentialValidationResult {
    const formatValidator = new TikTokFormatValidator();
    const productionResult = formatValidator.validateForProduction(credentials);
    
    const result: CredentialValidationResult = {
      isValid: productionResult.isValid,
      platform: this.platform,
      errors: productionResult.errors.map(error => ({
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
        clientSecret: 'Production Client Secrets must be at least 32 characters long for security. Generate a new secret in the TikTok Developer Portal if needed.',
      },
    };

    return productionSuggestions[errorCode]?.[field || ''] || this.getFormatErrorSuggestion(errorCode, field);
  }

  /**
   * Test TikTok API connectivity
   */
  async testApiConnectivity(credentials: TikTokCredentials): Promise<boolean> {
    try {
      // Test by generating authorization URL - this validates client_key format
      // and tests basic connectivity to TikTok's OAuth endpoints
      const authUrl = this.generateTestAuthUrl(credentials);
      
      // Additional test: Try to make a basic request to TikTok's OAuth endpoint
      // to verify the credentials format is accepted
      const testResponse = await this.testOAuthEndpoint(credentials);
      
      return authUrl.length > 0 && testResponse;
    } catch (error) {
      console.error('TikTok API connectivity test failed:', error);
      return false;
    }
  }

  /**
   * Test authorization URL generation
   */
  private async testAuthUrlGeneration(credentials: TikTokCredentials): Promise<void> {
    const params = new URLSearchParams({
      client_key: credentials.clientKey,
      scope: 'user.info.basic',
      response_type: 'code',
      redirect_uri: credentials.redirectUri,
      state: 'test_validation_state',
    });

    const url = `https://www.tiktok.com/v2/auth/authorize?${params.toString()}`;

    // Validate URL format
    if (!this.isValidUrl(url)) {
      throw new Error('Generated authorization URL is invalid');
    }

    // Additional validation: ensure required parameters are present
    const urlObj = new URL(url);
    const requiredParams = ['client_key', 'scope', 'response_type', 'redirect_uri', 'state'];
    
    for (const param of requiredParams) {
      if (!urlObj.searchParams.has(param)) {
        throw new Error(`Missing required parameter: ${param}`);
      }
    }
  }

  /**
   * Test TikTok OAuth endpoint with credentials
   */
  private async testOAuthEndpoint(credentials: TikTokCredentials): Promise<boolean> {
    try {
      // Make a test request to TikTok's token endpoint with invalid grant type
      // This will return an error, but validates that the client_key format is accepted
      const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_key: credentials.clientKey,
          client_secret: credentials.clientSecret,
          grant_type: 'test_validation', // Invalid grant type for testing
        }).toString(),
      });

      const data = await response.json();
      
      // We expect an error, but specific error codes indicate valid credential format
      if (data.error) {
        // These errors indicate the credentials format is valid but the request is invalid
        const validationErrors = [
          'unsupported_grant_type',
          'invalid_grant',
          'invalid_request',
        ];
        
        if (validationErrors.includes(data.error)) {
          return true;
        }
        
        // These errors indicate invalid credentials
        const credentialErrors = [
          'invalid_client',
          'unauthorized_client',
          'invalid_client_id',
        ];
        
        if (credentialErrors.includes(data.error)) {
          throw new ApiConnectivityError(this.platform, new Error(data.error_description || data.error));
        }
      }

      return false;
    } catch (error) {
      if (error instanceof ApiConnectivityError) {
        throw error;
      }
      
      // Network or other errors
      console.error('TikTok OAuth endpoint test failed:', error);
      return false;
    }
  }

  /**
   * Validate redirect URI accessibility
   */
  private async validateRedirectUri(redirectUri: string): Promise<void> {
    try {
      // Test that redirect URI is accessible (HEAD request with timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(redirectUri, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // We expect 404 or 405 (Method Not Allowed) for callback endpoints
      // 200, 404, 405 are all acceptable responses
      if (!response.ok && ![404, 405].includes(response.status)) {
        throw new Error(`Redirect URI returned ${response.status}`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Redirect URI request timeout');
      }
      throw error;
    }
  }

  /**
   * Check if credentials appear to be development/test credentials
   */
  private isDevelopmentCredentials(credentials: TikTokCredentials): boolean {
    const devIndicators = [
      'test',
      'dev',
      'development',
      'localhost',
      'example.com',
      'demo',
      'sandbox',
    ];

    const credentialString = `${credentials.clientKey} ${credentials.clientSecret} ${credentials.redirectUri}`.toLowerCase();
    
    return devIndicators.some(indicator => credentialString.includes(indicator));
  }



  /**
   * Generate test authorization URL for validation
   */
  private generateTestAuthUrl(credentials: TikTokCredentials): string {
    const params = new URLSearchParams({
      client_key: credentials.clientKey,
      scope: 'user.info.basic',
      response_type: 'code',
      redirect_uri: credentials.redirectUri,
      state: 'validation_test',
    });

    return `https://www.tiktok.com/v2/auth/authorize?${params.toString()}`;
  }

  /**
   * Get TikTok-specific error suggestions
   */
  protected getErrorSuggestion(errorCode: string): string | null {
    const suggestions: Record<string, string> = {
      [ValidationErrorCode.MISSING_CLIENT_KEY]: 'Get your Client Key from TikTok Developer Portal at https://developers.tiktok.com/',
      [ValidationErrorCode.MISSING_CLIENT_SECRET]: 'Get your Client Secret from TikTok Developer Portal at https://developers.tiktok.com/',
      [ValidationErrorCode.INVALID_REDIRECT_URI]: 'Configure redirect URI in TikTok Developer Portal and ensure it matches your environment',
      [ValidationErrorCode.API_CONNECTIVITY_FAILED]: 'Check TikTok API status and verify your credentials in the Developer Portal',
      [ValidationErrorCode.INSUFFICIENT_PERMISSIONS]: 'Ensure your TikTok app has the required scopes: user.info.basic, video.upload',
    };

    return suggestions[errorCode] || null;
  }
}