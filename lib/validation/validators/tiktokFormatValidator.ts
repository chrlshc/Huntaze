/**
 * TikTok Credential Format Validator
 * 
 * Advanced format validation for TikTok OAuth credentials.
 * This module provides detailed format checking and validation rules.
 */

import {
  TikTokCredentials,
  ValidationError,
  ValidationWarning,
  ValidationErrorCode,
  ValidationWarningCode,
} from '../index';

/**
 * TikTok credential format validation rules
 */
export interface TikTokFormatValidationRules {
  clientKey: {
    minLength: number;
    maxLength: number;
    pattern: RegExp;
    allowedCharacters: string;
  };
  clientSecret: {
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
 * Default TikTok format validation rules
 */
export const DEFAULT_TIKTOK_FORMAT_RULES: TikTokFormatValidationRules = {
  clientKey: {
    minLength: 8,
    maxLength: 64,
    pattern: /^[a-zA-Z0-9_-]+$/,
    allowedCharacters: 'alphanumeric characters, underscores, and hyphens',
  },
  clientSecret: {
    minLength: 16,
    maxLength: 128,
    pattern: /^[a-zA-Z0-9_-]+$/,
    allowedCharacters: 'alphanumeric characters, underscores, and hyphens',
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
 * TikTok format validation result
 */
export interface TikTokFormatValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  details: {
    clientKey: FieldValidationResult;
    clientSecret: FieldValidationResult;
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
 * TikTok credential format validator
 */
export class TikTokFormatValidator {
  private rules: TikTokFormatValidationRules;

  constructor(rules: TikTokFormatValidationRules = DEFAULT_TIKTOK_FORMAT_RULES) {
    this.rules = rules;
  }

  /**
   * Validate TikTok credentials format comprehensively
   */
  validateFormat(credentials: TikTokCredentials): TikTokFormatValidationResult {
    const clientKeyResult = this.validateClientKey(credentials.clientKey);
    const clientSecretResult = this.validateClientSecret(credentials.clientSecret);
    const redirectUriResult = this.validateRedirectUri(credentials.redirectUri);

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Collect errors from field validations
    if (!clientKeyResult.isValid) {
      clientKeyResult.errors.forEach(error => {
        errors.push({
          code: ValidationErrorCode.MISSING_CLIENT_KEY,
          message: error,
          field: 'clientKey',
          suggestion: 'Get a valid Client Key from TikTok Developer Portal',
        });
      });
    }

    if (!clientSecretResult.isValid) {
      clientSecretResult.errors.forEach(error => {
        errors.push({
          code: ValidationErrorCode.MISSING_CLIENT_SECRET,
          message: error,
          field: 'clientSecret',
          suggestion: 'Get a valid Client Secret from TikTok Developer Portal',
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
    [clientKeyResult, clientSecretResult, redirectUriResult].forEach((result, index) => {
      const fieldNames = ['clientKey', 'clientSecret', 'redirectUri'];
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
        clientKey: clientKeyResult,
        clientSecret: clientSecretResult,
        redirectUri: redirectUriResult,
      },
    };
  }

  /**
   * Validate TikTok Client Key format
   */
  validateClientKey(clientKey: string): FieldValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const metadata: FieldValidationResult['metadata'] = {
      length: clientKey?.length || 0,
      format: 'TikTok Client Key',
    };

    if (!clientKey) {
      errors.push('Client Key is required');
      return { isValid: false, errors, warnings, metadata };
    }

    // Length validation
    if (clientKey.length < this.rules.clientKey.minLength) {
      errors.push(`Client Key is too short (minimum ${this.rules.clientKey.minLength} characters)`);
    }

    if (clientKey.length > this.rules.clientKey.maxLength) {
      errors.push(`Client Key is too long (maximum ${this.rules.clientKey.maxLength} characters)`);
    }

    // Pattern validation
    if (!this.rules.clientKey.pattern.test(clientKey)) {
      errors.push(`Client Key contains invalid characters. Only ${this.rules.clientKey.allowedCharacters} are allowed`);
    }

    // Development/test credential detection
    const devIndicators = ['test', 'dev', 'demo', 'example', 'sample'];
    if (devIndicators.some(indicator => clientKey.toLowerCase().includes(indicator))) {
      warnings.push('Appears to be a development or test credential');
    }

    // Suspicious patterns
    if (/^(.)\1{7,}$/.test(clientKey)) {
      warnings.push('Client Key appears to be a placeholder (repeated characters)');
    }

    if (clientKey.toLowerCase() === clientKey || clientKey.toUpperCase() === clientKey) {
      warnings.push('Client Key uses only lowercase or uppercase characters (unusual for TikTok)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata,
    };
  }

  /**
   * Validate TikTok Client Secret format
   */
  validateClientSecret(clientSecret: string): FieldValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const metadata: FieldValidationResult['metadata'] = {
      length: clientSecret?.length || 0,
      format: 'TikTok Client Secret',
    };

    if (!clientSecret) {
      errors.push('Client Secret is required');
      return { isValid: false, errors, warnings, metadata };
    }

    // Length validation
    if (clientSecret.length < this.rules.clientSecret.minLength) {
      errors.push(`Client Secret is too short (minimum ${this.rules.clientSecret.minLength} characters)`);
    }

    if (clientSecret.length > this.rules.clientSecret.maxLength) {
      errors.push(`Client Secret is too long (maximum ${this.rules.clientSecret.maxLength} characters)`);
    }

    // Pattern validation
    if (!this.rules.clientSecret.pattern.test(clientSecret)) {
      errors.push(`Client Secret contains invalid characters. Only ${this.rules.clientSecret.allowedCharacters} are allowed`);
    }

    // Security validations
    if (clientSecret.length < 32) {
      warnings.push('Client Secret is shorter than recommended (32+ characters)');
    }

    // Development/test credential detection
    const devIndicators = ['test', 'dev', 'demo', 'example', 'sample', 'secret'];
    if (devIndicators.some(indicator => clientSecret.toLowerCase().includes(indicator))) {
      warnings.push('Appears to be a development or test credential');
    }

    // Suspicious patterns
    if (/^(.)\1{15,}$/.test(clientSecret)) {
      warnings.push('Client Secret appears to be a placeholder (repeated characters)');
    }

    if (clientSecret.toLowerCase() === clientSecret || clientSecret.toUpperCase() === clientSecret) {
      warnings.push('Client Secret uses only lowercase or uppercase characters (unusual for TikTok)');
    }

    // Entropy check (basic)
    const uniqueChars = new Set(clientSecret).size;
    if (uniqueChars < clientSecret.length * 0.3) {
      warnings.push('Client Secret has low character diversity (may be weak)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata,
    };
  }

  /**
   * Validate TikTok Redirect URI format
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
      warnings.push('Redirect URI should include a specific callback path (e.g., /api/auth/tiktok/callback)');
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
  updateRules(newRules: Partial<TikTokFormatValidationRules>): void {
    this.rules = { ...this.rules, ...newRules };
  }

  /**
   * Get current validation rules
   */
  getRules(): TikTokFormatValidationRules {
    return { ...this.rules };
  }

  /**
   * Validate credentials for production environment
   */
  validateForProduction(credentials: TikTokCredentials): TikTokFormatValidationResult {
    // Use stricter rules for production
    const productionRules: TikTokFormatValidationRules = {
      ...this.rules,
      clientSecret: {
        ...this.rules.clientSecret,
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