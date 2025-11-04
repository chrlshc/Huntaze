/**
 * Instagram Credential Format Validator
 * 
 * Advanced format validation for Instagram OAuth credentials.
 * This module provides detailed format checking and validation rules.
 */

import {
  InstagramCredentials,
  ValidationError,
  ValidationWarning,
  ValidationErrorCode,
  ValidationWarningCode,
} from '../index';

/**
 * Instagram credential format validation rules
 */
export interface InstagramFormatValidationRules {
  appId: {
    minLength: number;
    maxLength: number;
    pattern: RegExp;
    allowedCharacters: string;
  };
  appSecret: {
    minLength: number;
    maxLength: number;
    pattern: RegExp;
    allowedCharacters: string;
  };
  redirectUri: {
    requireHttps: boolean;
    allowedDomains?: string[];
    forbiddenDomains: string[];
    maxLength: number;
  };
}

/**
 * Default Instagram format validation rules
 */
export const DEFAULT_INSTAGRAM_FORMAT_RULES: InstagramFormatValidationRules = {
  appId: {
    minLength: 10,
    maxLength: 20,
    pattern: /^\d+$/,
    allowedCharacters: 'numeric characters only',
  },
  appSecret: {
    minLength: 16,
    maxLength: 64,
    pattern: /^[a-zA-Z0-9]+$/,
    allowedCharacters: 'alphanumeric characters',
  },
  redirectUri: {
    requireHttps: true,
    forbiddenDomains: [
      'localhost',
      '127.0.0.1',
      'example.com',
      'test.com',
      'demo.com',
    ],
    maxLength: 2048,
  },
};

/**
 * Instagram format validation result
 */
export interface InstagramFormatValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  details: {
    appId: FieldValidationResult;
    appSecret: FieldValidationResult;
    redirectUri: FieldValidationResult;
  };
}

/**
 * Field validation result
 */
export interface FieldValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    length?: number;
    format?: string;
    domain?: string;
  };
}

/**
 * Instagram credential format validator
 */
export class InstagramFormatValidator {
  private rules: InstagramFormatValidationRules;

  constructor(rules: InstagramFormatValidationRules = DEFAULT_INSTAGRAM_FORMAT_RULES) {
    this.rules = rules;
  }

  /**
   * Validate Instagram credentials format comprehensively
   */
  validateFormat(credentials: InstagramCredentials): InstagramFormatValidationResult {
    const appIdResult = this.validateAppId(credentials.appId);
    const appSecretResult = this.validateAppSecret(credentials.appSecret);
    const redirectUriResult = this.validateRedirectUri(credentials.redirectUri);

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Collect errors from field validations
    if (!appIdResult.isValid) {
      appIdResult.errors.forEach(error => {
        errors.push({
          code: ValidationErrorCode.MISSING_APP_ID,
          message: error,
          field: 'appId',
          suggestion: 'Get a valid App ID from Facebook Developer Portal',
        });
      });
    }

    if (!appSecretResult.isValid) {
      appSecretResult.errors.forEach(error => {
        errors.push({
          code: ValidationErrorCode.MISSING_APP_SECRET,
          message: error,
          field: 'appSecret',
          suggestion: 'Get a valid App Secret from Facebook Developer Portal',
        });
      });
    }

    if (!redirectUriResult.isValid) {
      redirectUriResult.errors.forEach(error => {
        errors.push({
          code: ValidationErrorCode.INVALID_REDIRECT_URI,
          message: error,
          field: 'redirectUri',
          suggestion: 'Use a valid HTTPS URL for your redirect URI',
        });
      });
    }

    // Collect warnings from field validations
    [appIdResult, appSecretResult, redirectUriResult].forEach((result, index) => {
      const fieldNames = ['appId', 'appSecret', 'redirectUri'];
      result.warnings.forEach(warning => {
        warnings.push({
          code: ValidationWarningCode.DEVELOPMENT_CREDENTIALS,
          message: `${fieldNames[index]}: ${warning}`,
          severity: 'medium',
        });
      });
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      details: {
        appId: appIdResult,
        appSecret: appSecretResult,
        redirectUri: redirectUriResult,
      },
    };
  }

  /**
   * Validate Instagram App ID format
   */
  validateAppId(appId: string): FieldValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const metadata: FieldValidationResult['metadata'] = {
      length: appId?.length || 0,
      format: 'Instagram App ID',
    };

    if (!appId) {
      errors.push('App ID is required');
      return { isValid: false, errors, warnings, metadata };
    }

    // Length validation
    if (appId.length < this.rules.appId.minLength) {
      errors.push(`App ID is too short (minimum ${this.rules.appId.minLength} characters)`);
    }

    if (appId.length > this.rules.appId.maxLength) {
      errors.push(`App ID is too long (maximum ${this.rules.appId.maxLength} characters)`);
    }

    // Pattern validation
    if (!this.rules.appId.pattern.test(appId)) {
      errors.push(`App ID must contain ${this.rules.appId.allowedCharacters}`);
    }

    // Development/test credential detection
    const devIndicators = ['test', 'dev', 'demo', 'example', 'sample'];
    if (devIndicators.some(indicator => appId.toLowerCase().includes(indicator))) {
      warnings.push('Appears to be a development or test credential');
    }

    // Suspicious patterns
    if (/^(.)\1{9,}$/.test(appId)) {
      warnings.push('App ID appears to be a placeholder (repeated characters)');
    }

    // Check for common test App IDs
    const testAppIds = ['123456789012345', '000000000000000'];
    if (testAppIds.includes(appId)) {
      warnings.push('Using a common test App ID');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata,
    };
  }

  /**
   * Validate Instagram App Secret format
   */
  validateAppSecret(appSecret: string): FieldValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const metadata: FieldValidationResult['metadata'] = {
      length: appSecret?.length || 0,
      format: 'Instagram App Secret',
    };

    if (!appSecret) {
      errors.push('App Secret is required');
      return { isValid: false, errors, warnings, metadata };
    }

    // Length validation
    if (appSecret.length < this.rules.appSecret.minLength) {
      errors.push(`App Secret is too short (minimum ${this.rules.appSecret.minLength} characters)`);
    }

    if (appSecret.length > this.rules.appSecret.maxLength) {
      errors.push(`App Secret is too long (maximum ${this.rules.appSecret.maxLength} characters)`);
    }

    // Pattern validation
    if (!this.rules.appSecret.pattern.test(appSecret)) {
      errors.push(`App Secret must contain ${this.rules.appSecret.allowedCharacters}`);
    }

    // Security validations
    if (appSecret.length < 32) {
      warnings.push('App Secret is shorter than recommended (32+ characters)');
    }

    // Development/test credential detection
    const devIndicators = ['test', 'dev', 'demo', 'example', 'sample', 'secret'];
    if (devIndicators.some(indicator => appSecret.toLowerCase().includes(indicator))) {
      warnings.push('Appears to be a development or test credential');
    }

    // Suspicious patterns
    if (/^(.)\1{15,}$/.test(appSecret)) {
      warnings.push('App Secret appears to be a placeholder (repeated characters)');
    }

    if (appSecret.toLowerCase() === appSecret || appSecret.toUpperCase() === appSecret) {
      warnings.push('App Secret uses only lowercase or uppercase characters (unusual for Instagram)');
    }

    // Entropy check (basic)
    const uniqueChars = new Set(appSecret).size;
    if (uniqueChars < appSecret.length * 0.3) {
      warnings.push('App Secret has low character diversity (may be weak)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata,
    };
  }

  /**
   * Validate Instagram Redirect URI format
   */
  validateRedirectUri(redirectUri: string): FieldValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const metadata: FieldValidationResult['metadata'] = {
      length: redirectUri?.length || 0,
      format: 'URL',
    };

    if (!redirectUri) {
      errors.push('Redirect URI is required');
      return { isValid: false, errors, warnings, metadata };
    }

    // Length validation
    if (redirectUri.length > this.rules.redirectUri.maxLength) {
      errors.push(`Redirect URI is too long (maximum ${this.rules.redirectUri.maxLength} characters)`);
    }

    // URL format validation
    let url: URL;
    try {
      url = new URL(redirectUri);
      metadata.domain = url.hostname;
    } catch (error) {
      errors.push('Redirect URI is not a valid URL');
      return { isValid: false, errors, warnings, metadata };
    }

    // HTTPS requirement
    if (this.rules.redirectUri.requireHttps && url.protocol !== 'https:') {
      errors.push('Redirect URI must use HTTPS protocol');
    }

    // Domain validation
    const domain = url.hostname.toLowerCase();

    // Check forbidden domains
    if (this.rules.redirectUri.forbiddenDomains.some(forbidden => 
      domain === forbidden || domain.endsWith(`.${forbidden}`)
    )) {
      if (process.env.NODE_ENV === 'production') {
        errors.push(`Redirect URI domain "${domain}" is not allowed in production`);
      } else {
        warnings.push(`Using development domain "${domain}"`);
      }
    }

    // Check for localhost/IP addresses
    if (domain === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
      if (process.env.NODE_ENV === 'production') {
        errors.push('Localhost and IP addresses are not allowed in production');
      } else {
        warnings.push('Using localhost or IP address (development only)');
      }
    }

    // Path validation
    if (!url.pathname || url.pathname === '/') {
      warnings.push('Redirect URI should include a specific callback path (e.g., /api/auth/instagram/callback)');
    }

    // Query parameters warning
    if (url.search) {
      warnings.push('Redirect URI contains query parameters (may cause OAuth issues)');
    }

    // Fragment warning
    if (url.hash) {
      warnings.push('Redirect URI contains fragment (not recommended for OAuth)');
    }

    // Port validation
    if (url.port) {
      if (process.env.NODE_ENV === 'production') {
        warnings.push('Using custom port in production (ensure it\'s accessible)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata,
    };
  }

  /**
   * Update validation rules
   */
  updateRules(newRules: Partial<InstagramFormatValidationRules>): void {
    this.rules = { ...this.rules, ...newRules };
  }

  /**
   * Get current validation rules
   */
  getRules(): InstagramFormatValidationRules {
    return { ...this.rules };
  }

  /**
   * Validate credentials for production environment
   */
  validateForProduction(credentials: InstagramCredentials): InstagramFormatValidationResult {
    // Use stricter rules for production
    const productionRules: InstagramFormatValidationRules = {
      ...this.rules,
      appSecret: {
        ...this.rules.appSecret,
        minLength: 32, // Stricter minimum for production
      },
      redirectUri: {
        ...this.rules.redirectUri,
        requireHttps: true,
        forbiddenDomains: [
          ...this.rules.redirectUri.forbiddenDomains,
          'ngrok.io',
          'herokuapp.com',
          'vercel.app',
          'netlify.app',
        ],
      },
    };

    const originalRules = this.rules;
    this.rules = productionRules;
    
    const result = this.validateFormat(credentials);
    
    this.rules = originalRules; // Restore original rules
    
    return result;
  }
}