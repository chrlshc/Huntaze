/**
 * Instagram OAuth Credentials Validator
 * 
 * Validates Instagram OAuth credentials by testing format, API connectivity,
 * and authentication flow components using Facebook Graph API.
 */

import {
  CredentialValidator,
  CredentialValidationResult,
  ValidationError,
  ValidationWarning,
  InstagramCredentials,
  ValidationErrorCode,
  ValidationWarningCode,
  ValidationErrorUtils,
  ApiConnectivityError,
  getPlatformConfig,
} from '../index';

import { InstagramApiTester } from './instagramApiTester';
import { InstagramFormatValidator } from './instagramFormatValidator';

/**
 * Instagram-specific credential validator
 */
export class InstagramCredentialValidator extends CredentialValidator {
  readonly platform = 'instagram' as const;

  /**
   * Validate Instagram credentials comprehensively
   */
  async validateCredentials(credentials: InstagramCredentials): Promise<CredentialValidationResult> {
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
              message: 'Cannot connect to Facebook Graph API',
              suggestion: 'Check if credentials are correct and Facebook Graph API is accessible',
            });
            result.isValid = false;
          }
        } catch (error) {
          if (error instanceof Error && error.message === 'Validation timeout') {
            result.errors.push({
              code: ValidationErrorCode.VALIDATION_TIMEOUT,
              message: `Instagram API validation timeout after ${platformConfig.timeout}ms`,
              suggestion: 'Check network connectivity and Facebook Graph API status',
            });
          } else {
            result.errors.push({
              code: ValidationErrorCode.API_CONNECTIVITY_FAILED,
              message: 'Instagram API connectivity test failed',
              suggestion: 'Verify credentials and network connectivity',
            });
          }
          result.isValid = false;
        }
      }

      // 3. Validate redirect URI accessibility (non-blocking)
      try {
        await this.validateRedirectUri(credentials.redirectUri);
      } catch (error) {
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
  }

  /**
   * Validate Instagram credentials format using dedicated format validator
   */
  validateFormat(credentials: InstagramCredentials): ValidationError[] {
    const formatValidator = new InstagramFormatValidator();
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
  validateFormatEnhanced(credentials: InstagramCredentials): CredentialValidationResult {
    const formatValidator = new InstagramFormatValidator();
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
      [ValidationErrorCode.MISSING_APP_ID]: {
        appId: 'Obtain your App ID from the Facebook Developer Portal at https://developers.facebook.com/. Navigate to your app settings and copy the App ID.',
      },
      [ValidationErrorCode.MISSING_APP_SECRET]: {
        appSecret: 'Obtain your App Secret from the Facebook Developer Portal at https://developers.facebook.com/. Navigate to your app settings and copy the App Secret.',
      },
      [ValidationErrorCode.INVALID_REDIRECT_URI]: {
        redirectUri: 'Ensure your redirect URI uses HTTPS and matches the URI configured in your Facebook app settings. Example: https://yourdomain.com/api/auth/instagram/callback',
      },
    };

    return suggestions[errorCode]?.[field || ''] || this.getErrorSuggestion(errorCode) || 'Please check the Facebook Developer Portal for correct credential format.';
  }

  /**
   * Validate credentials specifically for production environment
   */
  validateForProduction(credentials: InstagramCredentials): CredentialValidationResult {
    const formatValidator = new InstagramFormatValidator();
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
      [ValidationErrorCode.MISSING_APP_SECRET]: {
        appSecret: 'Production App Secrets must be at least 32 characters long for security. Generate a new secret in the Facebook Developer Portal if needed.',
      },
    };

    return productionSuggestions[errorCode]?.[field || ''] || this.getFormatErrorSuggestion(errorCode, field);
  }

  /**
   * Validate Instagram permissions
   */
  async validatePermissions(credentials: InstagramCredentials): Promise<CredentialValidationResult> {
    const startTime = Date.now();
    const result: CredentialValidationResult = {
      isValid: true,
      platform: this.platform,
      errors: [],
      warnings: [],
      metadata: {
        validatedAt: new Date(),
        responseTime: 0,
        apiVersion: 'permission-validation',
      },
    };

    try {
      const apiTester = new InstagramApiTester();
      const testResult = await apiTester.testConnectivity(credentials);

      if (!testResult.isConnected) {
        result.errors.push({
          code: ValidationErrorCode.API_CONNECTIVITY_FAILED,
          message: 'Cannot connect to Facebook Graph API to check permissions',
          suggestion: 'Verify your credentials and ensure the Facebook Graph API is accessible',
        });
        result.isValid = false;
      } else if (testResult.permissions) {
        const permissionValidation = apiTester.validatePermissions(testResult.permissions);
        
        if (!permissionValidation.valid) {
          result.errors.push({
            code: ValidationErrorCode.INSUFFICIENT_PERMISSIONS,
            message: `Missing required permissions: ${permissionValidation.missing.join(', ')}`,
            suggestion: 'Add the required permissions in your Facebook app configuration',
          });
          result.isValid = false;
        }

        if (permissionValidation.warnings.length > 0) {
          permissionValidation.warnings.forEach(warning => {
            result.warnings.push({
              code: ValidationWarningCode.MISSING_PERMISSIONS,
              message: warning,
              severity: 'medium',
            });
          });
        }

        result.metadata.permissions = testResult.permissions;
      }

    } catch (error) {
      result.errors.push(ValidationErrorUtils.fromError(error as Error, this.platform));
      result.isValid = false;
    }

    result.metadata.responseTime = Date.now() - startTime;
    return result;
  }

  /**
   * Test Instagram API connectivity using Facebook Graph API
   */
  async testApiConnectivity(credentials: InstagramCredentials): Promise<boolean> {
    try {
      const apiTester = new InstagramApiTester();
      const testResult = await apiTester.testConnectivity(credentials);
      return testResult.isConnected;
    } catch (error) {
      console.error('Instagram API connectivity test failed:', error);
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
  private isDevelopmentCredentials(credentials: InstagramCredentials): boolean {
    const devIndicators = [
      'test',
      'dev',
      'development',
      'localhost',
      'example.com',
      'demo',
      'sandbox',
    ];

    const credentialString = `${credentials.appId} ${credentials.appSecret} ${credentials.redirectUri}`.toLowerCase();
    
    return devIndicators.some(indicator => credentialString.includes(indicator));
  }



  /**
   * Test comprehensive API connectivity including permissions and app info
   */
  async validateApiConnectivity(credentials: InstagramCredentials): Promise<CredentialValidationResult> {
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
      const apiTester = new InstagramApiTester();
      const testResult = await apiTester.testConnectivity(credentials);

      if (!testResult.isConnected) {
        result.errors.push({
          code: ValidationErrorCode.API_CONNECTIVITY_FAILED,
          message: 'Cannot connect to Facebook Graph API',
          suggestion: 'Check if credentials are correct and Facebook Graph API is accessible',
        });
        result.isValid = false;

        // Add specific error details
        if (testResult.errors.length > 0) {
          testResult.errors.forEach(error => {
            result.errors.push({
              code: ValidationErrorCode.API_CONNECTIVITY_FAILED,
              message: error,
              suggestion: 'Verify your App ID and App Secret in Facebook Developer Portal',
            });
          });
        }
      } else {
        // Add app info to metadata if available
        if (testResult.appInfo) {
          result.metadata.apiVersion = `api-connectivity-validation-${testResult.appInfo.id}`;
        }

        // Add permissions to metadata if available
        if (testResult.permissions) {
          result.metadata.permissions = testResult.permissions;
        }

        // Add warnings from API test
        if (testResult.warnings.length > 0) {
          testResult.warnings.forEach(warning => {
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
   * Test Instagram webhook configuration
   */
  async validateWebhookConfiguration(credentials: InstagramCredentials): Promise<CredentialValidationResult> {
    const startTime = Date.now();
    const result: CredentialValidationResult = {
      isValid: true,
      platform: this.platform,
      errors: [],
      warnings: [],
      metadata: {
        validatedAt: new Date(),
        responseTime: 0,
        apiVersion: 'webhook-validation',
      },
    };

    try {
      const apiTester = new InstagramApiTester();
      
      // First, get app access token
      const appAccessToken = await apiTester.generateAppAccessToken(credentials);
      if (!appAccessToken) {
        result.errors.push({
          code: ValidationErrorCode.API_CONNECTIVITY_FAILED,
          message: 'Cannot generate app access token for webhook validation',
          suggestion: 'Verify your credentials and try again',
        });
        result.isValid = false;
        return result;
      }

      // Test webhook configuration
      const webhookTest = await apiTester.testWebhookConfiguration(credentials.appId, appAccessToken);
      
      if (!webhookTest.configured) {
        result.warnings.push({
          code: ValidationWarningCode.MISSING_PERMISSIONS,
          message: 'Instagram webhooks are not configured',
          severity: 'low',
        });
      }

      if (webhookTest.errors.length > 0) {
        webhookTest.errors.forEach(error => {
          result.warnings.push({
            code: ValidationWarningCode.MISSING_PERMISSIONS,
            message: `Webhook configuration issue: ${error}`,
            severity: 'medium',
          });
        });
      }

    } catch (error) {
      result.warnings.push({
        code: ValidationWarningCode.MISSING_PERMISSIONS,
        message: 'Could not validate webhook configuration',
        severity: 'low',
      });
    }

    result.metadata.responseTime = Date.now() - startTime;
    return result;
  }

  /**
   * Validate specific Instagram permission requirements
   */
  async validateSpecificPermissions(credentials: InstagramCredentials, requiredPermissions: string[]): Promise<CredentialValidationResult> {
    const startTime = Date.now();
    const result: CredentialValidationResult = {
      isValid: true,
      platform: this.platform,
      errors: [],
      warnings: [],
      metadata: {
        validatedAt: new Date(),
        responseTime: 0,
        apiVersion: 'specific-permission-validation',
      },
    };

    try {
      const apiTester = new InstagramApiTester();
      const testResult = await apiTester.testConnectivity(credentials);

      if (!testResult.isConnected) {
        result.errors.push({
          code: ValidationErrorCode.API_CONNECTIVITY_FAILED,
          message: 'Cannot connect to Facebook Graph API to check permissions',
          suggestion: 'Verify your credentials and ensure the Facebook Graph API is accessible',
        });
        result.isValid = false;
      } else if (testResult.permissions) {
        // Check for specific required permissions
        const missingPermissions = requiredPermissions.filter(perm => 
          !testResult.permissions!.includes(perm)
        );

        if (missingPermissions.length > 0) {
          result.errors.push({
            code: ValidationErrorCode.INSUFFICIENT_PERMISSIONS,
            message: `Missing required permissions: ${missingPermissions.join(', ')}`,
            suggestion: `Add the following permissions in your Facebook app configuration: ${missingPermissions.join(', ')}`,
          });
          result.isValid = false;
        }

        result.metadata.permissions = testResult.permissions;
      }

    } catch (error) {
      result.errors.push(ValidationErrorUtils.fromError(error as Error, this.platform));
      result.isValid = false;
    }

    result.metadata.responseTime = Date.now() - startTime;
    return result;
  }

  /**
   * Validate Instagram Business Account setup
   */
  async validateBusinessAccountSetup(credentials: InstagramCredentials, pageId?: string): Promise<CredentialValidationResult> {
    const startTime = Date.now();
    const result: CredentialValidationResult = {
      isValid: true,
      platform: this.platform,
      errors: [],
      warnings: [],
      metadata: {
        validatedAt: new Date(),
        responseTime: 0,
        apiVersion: 'business-account-validation',
      },
    };

    try {
      const apiTester = new InstagramApiTester();
      
      // First, get app access token
      const appAccessToken = await apiTester.generateAppAccessToken(credentials);
      if (!appAccessToken) {
        result.errors.push({
          code: ValidationErrorCode.API_CONNECTIVITY_FAILED,
          message: 'Cannot generate app access token for business account validation',
          suggestion: 'Verify your credentials and try again',
        });
        result.isValid = false;
        return result;
      }

      // Check if pageId is provided
      if (!pageId) {
        result.warnings.push({
          code: ValidationWarningCode.MISSING_PERMISSIONS,
          message: 'No Facebook Page ID provided for business account validation',
          severity: 'low',
        });
        result.metadata.responseTime = Date.now() - startTime;
        return result;
      }

      // If pageId is provided, check for Instagram Business Account
      if (pageId) {
        try {
          const businessAccount = await apiTester.getInstagramBusinessAccount(pageId, appAccessToken);
          
          if (!businessAccount) {
            result.warnings.push({
              code: ValidationWarningCode.MISSING_PERMISSIONS,
              message: 'No Instagram Business Account connected to this Facebook Page',
              severity: 'medium',
            });
          } else {
            result.metadata.businessAccountId = businessAccount.id;
          }
        } catch (error) {
          result.warnings.push({
            code: ValidationWarningCode.MISSING_PERMISSIONS,
            message: 'Could not retrieve Instagram Business Account information',
            severity: 'low',
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
   * Get Instagram-specific error suggestions
   */
  protected getErrorSuggestion(errorCode: string): string | null {
    const suggestions: Record<string, string> = {
      [ValidationErrorCode.MISSING_APP_ID]: 'Get your App ID from Facebook Developer Portal at https://developers.facebook.com/',
      [ValidationErrorCode.MISSING_APP_SECRET]: 'Get your App Secret from Facebook Developer Portal at https://developers.facebook.com/',
      [ValidationErrorCode.INVALID_REDIRECT_URI]: 'Configure redirect URI in Facebook Developer Portal and ensure it matches your environment',
      [ValidationErrorCode.API_CONNECTIVITY_FAILED]: 'Check Facebook Graph API status and verify your credentials in the Developer Portal',
      [ValidationErrorCode.INSUFFICIENT_PERMISSIONS]: 'Ensure your Instagram app has the required permissions: instagram_basic, instagram_content_publish',
    };

    return suggestions[errorCode] || null;
  }
}