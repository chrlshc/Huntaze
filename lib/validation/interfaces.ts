/**
 * Core interfaces for OAuth credentials validation framework
 */

import {
  CredentialValidationResult,
  ValidationError,
  PlatformCredentials,
  ValidationHealthStatus,
  BatchValidationRequest,
  Platform,
} from './types';

/**
 * Abstract base class for platform-specific credential validators
 */
export abstract class CredentialValidator {
  abstract readonly platform: Platform;
  
  /**
   * Validate credentials by making test API calls
   * @param credentials Platform-specific credentials
   * @returns Validation result with errors, warnings, and metadata
   */
  abstract validateCredentials(credentials: PlatformCredentials): Promise<CredentialValidationResult>;
  
  /**
   * Quick validation without API calls (format, presence)
   * @param credentials Platform-specific credentials
   * @returns Array of validation errors
   */
  abstract validateFormat(credentials: PlatformCredentials): ValidationError[];
  
  /**
   * Test specific API endpoint to verify credentials work
   * @param credentials Platform-specific credentials
   * @returns True if API connectivity test passes
   */
  abstract testApiConnectivity(credentials: PlatformCredentials): Promise<boolean>;
  
  /**
   * Get platform-specific error suggestions
   * @param errorCode Error code to get suggestion for
   * @returns User-friendly suggestion or null
   */
  protected getErrorSuggestion(errorCode: string): string | null {
    // Default implementation - can be overridden by platform validators
    return null;
  }
  
  /**
   * Validate URL format (helper method)
   * @param url URL to validate
   * @param requireHttps Whether HTTPS is required
   * @returns True if URL is valid
   */
  protected isValidUrl(url: string, requireHttps: boolean = true): boolean {
    try {
      const parsed = new URL(url);
      return requireHttps ? parsed.protocol === 'https:' : true;
    } catch {
      return false;
    }
  }
  
  /**
   * Create timeout promise for API calls
   * @param timeout Timeout in milliseconds
   * @returns Promise that rejects after timeout
   */
  protected createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Validation timeout')), timeout);
    });
  }
}

/**
 * Interface for validation orchestrator
 */
export interface IValidationOrchestrator {
  /**
   * Validate credentials for a specific platform
   * @param platform Platform name
   * @param credentials Platform credentials
   * @returns Validation result
   */
  validatePlatform(platform: Platform, credentials: PlatformCredentials): Promise<CredentialValidationResult>;
  
  /**
   * Validate credentials for multiple platforms
   * @param validations Array of validation requests
   * @returns Array of validation results
   */
  validateMultiplePlatforms(validations: BatchValidationRequest[]): Promise<CredentialValidationResult[]>;
  
  /**
   * Get validation health status for all platforms
   * @returns Health status summary
   */
  getHealthStatus(): Promise<ValidationHealthStatus>;
  
  /**
   * Clear validation cache
   */
  clearCache(): void;
}

/**
 * Interface for validation monitoring
 */
export interface IValidationMonitor {
  /**
   * Record validation attempt
   * @param platform Platform name
   * @param result Validation result
   */
  recordValidation(platform: Platform, result: CredentialValidationResult): void;
  
  /**
   * Get validation metrics
   * @param platform Optional platform filter
   * @returns Validation metrics
   */
  getMetrics(platform?: Platform): ValidationMetrics;
  
  /**
   * Check if alerts should be triggered
   * @returns Array of active alerts
   */
  checkAlerts(): ValidationAlert[];
}

/**
 * Validation metrics interface
 */
export interface ValidationMetrics {
  successRate: number;
  averageResponseTime: number;
  totalValidations: number;
  errorCounts: Record<string, number>;
  lastValidation?: Date;
}

/**
 * Validation alert interface
 */
export interface ValidationAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  platform?: Platform;
  triggeredAt: Date;
  resolved: boolean;
}

/**
 * Interface for credential validation service
 */
export interface ICredentialValidationService {
  /**
   * Initialize the validation service
   */
  initialize(): Promise<void>;
  
  /**
   * Validate single platform credentials
   * @param platform Platform name
   * @param credentials Platform credentials
   * @returns Validation result
   */
  validate(platform: Platform, credentials: PlatformCredentials): Promise<CredentialValidationResult>;
  
  /**
   * Validate multiple platform credentials
   * @param requests Array of validation requests
   * @returns Array of validation results
   */
  validateBatch(requests: BatchValidationRequest[]): Promise<CredentialValidationResult[]>;
  
  /**
   * Get service health status
   * @returns Health status
   */
  getHealth(): Promise<ValidationHealthStatus>;
  
  /**
   * Shutdown the validation service
   */
  shutdown(): Promise<void>;
}