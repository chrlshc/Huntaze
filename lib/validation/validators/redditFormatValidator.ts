/**
 * Reddit Format Validator
 * 
 * Validates Reddit OAuth credentials format without making API calls.
 * Focuses on format validation, required fields, and basic structure checks.
 */

import {
  ValidationError,
  ValidationWarning,
  RedditCredentials,
  ValidationErrorCode,
  ValidationWarningCode,
} from '../index';

export interface FormatValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Reddit-specific format validator
 */
export class RedditFormatValidator {
  /**
   * Validate Reddit credentials format
   */
  validateFormat(credentials: RedditCredentials): FormatValidationResult {
    const result: FormatValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Validate Client ID
    if (!credentials.clientId || credentials.clientId.trim().length === 0) {
      result.errors.push({
        code: ValidationErrorCode.MISSING_CLIENT_ID,
        message: 'Reddit Client ID is required',
        field: 'clientId',
      });
      result.isValid = false;
    } else {
      // Reddit Client ID format validation
      if (credentials.clientId.length < 14 || credentials.clientId.length > 30) {
        result.warnings.push({
          code: ValidationWarningCode.INVALID_USER_AGENT,
          message: 'Reddit Client ID length seems unusual (expected 14-30 characters)',
          severity: 'low',
        });
      }
    }

    // Validate Client Secret
    if (!credentials.clientSecret || credentials.clientSecret.trim().length === 0) {
      result.errors.push({
        code: ValidationErrorCode.MISSING_CLIENT_SECRET,
        message: 'Reddit Client Secret is required',
        field: 'clientSecret',
      });
      result.isValid = false;
    } else {
      // Reddit Client Secret format validation
      if (credentials.clientSecret.length < 20) {
        result.warnings.push({
          code: ValidationWarningCode.INVALID_USER_AGENT,
          message: 'Reddit Client Secret seems too short (expected at least 20 characters)',
          severity: 'medium',
        });
      }
    }

    // Validate User-Agent
    if (!credentials.userAgent || credentials.userAgent.trim().length === 0) {
      result.errors.push({
        code: ValidationErrorCode.MISSING_USER_AGENT,
        message: 'User-Agent is required for Reddit API',
        field: 'userAgent',
      });
      result.isValid = false;
    } else {
      const userAgentValidation = this.validateUserAgentFormat(credentials.userAgent);
      if (userAgentValidation.errors.length > 0) {
        result.errors.push(...userAgentValidation.errors);
        result.isValid = false;
      }
      if (userAgentValidation.warnings.length > 0) {
        result.warnings.push(...userAgentValidation.warnings);
      }
    }

    // Validate Redirect URI
    const redirectUriValidation = this.validateRedirectUriFormat(credentials.redirectUri);
    if (redirectUriValidation.errors.length > 0) {
      result.errors.push(...redirectUriValidation.errors);
      result.isValid = false;
    }
    if (redirectUriValidation.warnings.length > 0) {
      result.warnings.push(...redirectUriValidation.warnings);
    }

    return result;
  }  
/**
   * Validate credentials for production environment with stricter rules
   */
  validateForProduction(credentials: RedditCredentials): FormatValidationResult {
    const result = this.validateFormat(credentials);

    // Additional production-specific validations
    if (credentials.redirectUri) {
      // Production must use HTTPS
      if (!credentials.redirectUri.startsWith('https://')) {
        result.errors.push({
          code: ValidationErrorCode.INVALID_REDIRECT_URI,
          message: 'Production redirect URI must use HTTPS',
          field: 'redirectUri',
        });
        result.isValid = false;
      }

      // Check for development domains
      const devDomains = ['localhost', '127.0.0.1', 'example.com', 'test.com'];
      const url = new URL(credentials.redirectUri);
      if (devDomains.some(domain => url.hostname.includes(domain))) {
        result.errors.push({
          code: ValidationErrorCode.INVALID_REDIRECT_URI,
          message: 'Production redirect URI cannot use development domains',
          field: 'redirectUri',
        });
        result.isValid = false;
      }
    }

    // Production User-Agent should not contain test indicators
    if (credentials.userAgent) {
      const testIndicators = ['test', 'dev', 'debug', 'local'];
      if (testIndicators.some(indicator => credentials.userAgent.toLowerCase().includes(indicator))) {
        result.warnings.push({
          code: ValidationWarningCode.DEVELOPMENT_CREDENTIALS,
          message: 'User-Agent contains development indicators',
          severity: 'medium',
        });
      }
    }

    return result;
  }

  /**
   * Validate User-Agent format according to Reddit guidelines
   */
  private validateUserAgentFormat(userAgent: string): FormatValidationResult {
    const result: FormatValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Reddit User-Agent guidelines: "platform:app_id:version (by /u/username)"
    const userAgentPattern = /^[\w\-\.]+:[\w\-\.]+:[\w\-\.]+ \(by \/u\/[\w\-]+\)$/;
    
    if (!userAgentPattern.test(userAgent)) {
      result.warnings.push({
        code: ValidationWarningCode.INVALID_USER_AGENT,
        message: 'User-Agent format may not follow Reddit guidelines. Expected: "platform:app_id:version (by /u/username)"',
        severity: 'medium',
      });
    }

    // Check for minimum length
    if (userAgent.length < 10) {
      result.errors.push({
        code: ValidationErrorCode.MISSING_USER_AGENT,
        message: 'User-Agent is too short (minimum 10 characters)',
        field: 'userAgent',
      });
      result.isValid = false;
    }

    // Check for maximum length (Reddit has a 256 character limit)
    if (userAgent.length > 256) {
      result.errors.push({
        code: ValidationErrorCode.MISSING_USER_AGENT,
        message: 'User-Agent is too long (maximum 256 characters)',
        field: 'userAgent',
      });
      result.isValid = false;
    }

    // Check for problematic terms
    const problematicTerms = ['bot', 'crawler', 'spider', 'scraper'];
    if (problematicTerms.some(term => userAgent.toLowerCase().includes(term))) {
      result.warnings.push({
        code: ValidationWarningCode.INVALID_USER_AGENT,
        message: 'User-Agent contains terms that may be flagged by Reddit',
        severity: 'high',
      });
    }

    return result;
  }  /**
 
  * Validate redirect URI format
   */
  private validateRedirectUriFormat(redirectUri: string): FormatValidationResult {
    const result: FormatValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    if (!redirectUri || redirectUri.trim().length === 0) {
      result.errors.push({
        code: ValidationErrorCode.INVALID_REDIRECT_URI,
        message: 'Redirect URI is required',
        field: 'redirectUri',
      });
      result.isValid = false;
      return result;
    }

    try {
      const url = new URL(redirectUri);

      // Must be HTTP or HTTPS
      if (!['http:', 'https:'].includes(url.protocol)) {
        result.errors.push({
          code: ValidationErrorCode.INVALID_REDIRECT_URI,
          message: 'Redirect URI must use HTTP or HTTPS protocol',
          field: 'redirectUri',
        });
        result.isValid = false;
      }

      // Warn about HTTP in production
      if (url.protocol === 'http:' && process.env.NODE_ENV === 'production') {
        result.warnings.push({
          code: ValidationWarningCode.REDIRECT_URI_WARNING,
          message: 'Using HTTP redirect URI in production is not recommended',
          severity: 'high',
        });
      }

      // Check for localhost in production
      if (url.hostname === 'localhost' && process.env.NODE_ENV === 'production') {
        result.warnings.push({
          code: ValidationWarningCode.REDIRECT_URI_WARNING,
          message: 'Using localhost redirect URI in production',
          severity: 'high',
        });
      }

      // Validate path exists
      if (!url.pathname || url.pathname === '/') {
        result.warnings.push({
          code: ValidationWarningCode.REDIRECT_URI_WARNING,
          message: 'Redirect URI should have a specific callback path',
          severity: 'low',
        });
      }

    } catch (error) {
      result.errors.push({
        code: ValidationErrorCode.INVALID_REDIRECT_URI,
        message: 'Redirect URI is not a valid URL',
        field: 'redirectUri',
      });
      result.isValid = false;
    }

    return result;
  }
}