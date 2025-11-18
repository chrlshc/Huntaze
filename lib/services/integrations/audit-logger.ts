/**
 * Audit Logger for Integration Operations
 * 
 * Provides comprehensive audit logging for all integration-related operations
 * to support security monitoring, compliance, and debugging.
 * 
 * Requirements: 11.5
 * 
 * Features:
 * - Structured logging with correlation IDs
 * - PII-safe logging (no tokens or sensitive data)
 * - Operation tracking with timestamps
 * - User action attribution
 * - Security event detection
 * - Retry logic for external service failures
 * - Type-safe API responses
 * - Error boundaries and graceful degradation
 * 
 * @see .kiro/specs/integrations-management/SECURITY_IMPLEMENTATION_COMPLETE.md
 */

import { PrismaClient } from '@prisma/client';
import type { Provider } from './types';
import { fetchWithRetry } from '@/lib/utils/fetch-with-retry';
import { createLogger } from '@/lib/utils/logger';

const prisma = new PrismaClient();
const logger = createLogger('audit-logger');

/**
 * Audit event types
 */
export enum AuditEventType {
  // OAuth operations
  OAUTH_INITIATED = 'oauth_initiated',
  OAUTH_COMPLETED = 'oauth_completed',
  OAUTH_FAILED = 'oauth_failed',
  OAUTH_CANCELLED = 'oauth_cancelled',
  
  // Token operations
  TOKEN_REFRESHED = 'token_refreshed',
  TOKEN_REFRESH_FAILED = 'token_refresh_failed',
  TOKEN_EXPIRED = 'token_expired',
  
  // Connection operations
  INTEGRATION_CONNECTED = 'integration_connected',
  INTEGRATION_DISCONNECTED = 'integration_disconnected',
  INTEGRATION_RECONNECTED = 'integration_reconnected',
  
  // Security events
  CSRF_VALIDATION_FAILED = 'csrf_validation_failed',
  INVALID_STATE_DETECTED = 'invalid_state_detected',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  
  // Error events
  API_ERROR = 'api_error',
  DATABASE_ERROR = 'database_error',
  NETWORK_ERROR = 'network_error',
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  eventType: AuditEventType;
  userId: number;
  provider?: Provider;
  accountId?: string;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

/**
 * External audit service response
 */
export interface ExternalAuditResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Audit logger configuration
 */
export interface AuditLoggerConfig {
  enableExternalLogging: boolean;
  enableDatabaseLogging: boolean;
  enableConsoleLogging: boolean;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Audit logger class
 */
export class AuditLogger {
  private config: AuditLoggerConfig;

  constructor(config?: Partial<AuditLoggerConfig>) {
    this.config = {
      enableExternalLogging: process.env.AUDIT_LOG_ENDPOINT !== undefined,
      enableDatabaseLogging: process.env.ENABLE_AUDIT_DB === 'true',
      enableConsoleLogging: process.env.NODE_ENV !== 'production',
      retryAttempts: 3,
      retryDelay: 1000,
      ...config,
    };
  }

  /**
   * Log an audit event
   * 
   * @param entry - Audit log entry
   * @returns Promise that resolves when logging is complete
   * 
   * @example
   * ```typescript
   * await auditLogger.log({
   *   eventType: AuditEventType.OAUTH_COMPLETED,
   *   userId: 123,
   *   provider: 'instagram',
   *   accountId: 'acc_123',
   *   timestamp: new Date(),
   *   success: true,
   * });
   * ```
   */
  async log(entry: AuditLogEntry): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Sanitize metadata to remove sensitive data
      const sanitizedMetadata = this.sanitizeMetadata(entry.metadata);
      
      const logData = {
        eventType: entry.eventType,
        userId: entry.userId,
        provider: entry.provider,
        accountId: entry.accountId,
        correlationId: entry.correlationId,
        success: entry.success,
        timestamp: entry.timestamp.toISOString(),
        metadata: sanitizedMetadata,
        errorMessage: entry.errorMessage,
      };
      
      // Log to console for immediate visibility (development/staging)
      if (this.config.enableConsoleLogging) {
        logger.info('Audit event', logData);
      }
      
      // Store in database for long-term audit trail (async, non-blocking)
      if (this.config.enableDatabaseLogging) {
        this.logToDatabase(entry, sanitizedMetadata).catch(error => {
          logger.error('Failed to log to database', error as Error, {
            correlationId: entry.correlationId,
          });
        });
      }
      
      // Send to external logging service (async, with retry)
      if (this.config.enableExternalLogging && process.env.AUDIT_LOG_ENDPOINT) {
        this.sendToExternalService(entry, sanitizedMetadata).catch(error => {
          logger.error('Failed to send to external service', error as Error, {
            correlationId: entry.correlationId,
          });
        });
      }
      
      const duration = Date.now() - startTime;
      logger.debug('Audit log completed', {
        correlationId: entry.correlationId,
        duration,
      });
    } catch (error) {
      // Never let audit logging break the main flow
      logger.error('Audit logging failed', error as Error, {
        correlationId: entry.correlationId,
        eventType: entry.eventType,
      });
    }
  }
  
  /**
   * Log to database
   * 
   * @param entry - Audit log entry
   * @param sanitizedMetadata - Sanitized metadata
   * @private
   */
  private async logToDatabase(
    entry: AuditLogEntry,
    sanitizedMetadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Note: This requires an audit_logs table in the database
      // Schema:
      // CREATE TABLE audit_logs (
      //   id SERIAL PRIMARY KEY,
      //   event_type VARCHAR(100) NOT NULL,
      //   user_id INTEGER NOT NULL,
      //   provider VARCHAR(50),
      //   account_id VARCHAR(255),
      //   ip_address VARCHAR(45),
      //   user_agent TEXT,
      //   correlation_id VARCHAR(100),
      //   metadata JSONB,
      //   success BOOLEAN NOT NULL,
      //   error_message TEXT,
      //   created_at TIMESTAMP DEFAULT NOW()
      // );
      
      await prisma.$executeRaw`
        INSERT INTO audit_logs (
          event_type, user_id, provider, account_id,
          ip_address, user_agent, correlation_id,
          metadata, success, error_message, created_at
        ) VALUES (
          ${entry.eventType}, ${entry.userId}, ${entry.provider || null}, ${entry.accountId || null},
          ${entry.ipAddress || null}, ${entry.userAgent || null}, ${entry.correlationId || null},
          ${JSON.stringify(sanitizedMetadata || {})}::jsonb, ${entry.success}, ${entry.errorMessage || null}, ${entry.timestamp}
        )
      `;
      
      logger.debug('Audit log saved to database', {
        correlationId: entry.correlationId,
        eventType: entry.eventType,
      });
    } catch (error) {
      // If table doesn't exist, log warning but don't fail
      if (error instanceof Error && error.message.includes('does not exist')) {
        logger.warn('Audit logs table does not exist. Skipping database logging.', {
          correlationId: entry.correlationId,
        });
      } else {
        throw error;
      }
    }
  }
  
  /**
   * Log OAuth initiation
   */
  async logOAuthInitiated(
    userId: number,
    provider: Provider,
    ipAddress?: string,
    userAgent?: string,
    correlationId?: string
  ): Promise<void> {
    await this.log({
      eventType: AuditEventType.OAUTH_INITIATED,
      userId,
      provider,
      ipAddress,
      userAgent,
      correlationId,
      timestamp: new Date(),
      success: true,
    });
  }
  
  /**
   * Log OAuth completion
   */
  async logOAuthCompleted(
    userId: number,
    provider: Provider,
    accountId: string,
    ipAddress?: string,
    userAgent?: string,
    correlationId?: string
  ): Promise<void> {
    await this.log({
      eventType: AuditEventType.OAUTH_COMPLETED,
      userId,
      provider,
      accountId,
      ipAddress,
      userAgent,
      correlationId,
      timestamp: new Date(),
      success: true,
    });
  }
  
  /**
   * Log OAuth failure
   */
  async logOAuthFailed(
    userId: number,
    provider: Provider,
    errorMessage: string,
    ipAddress?: string,
    userAgent?: string,
    correlationId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      eventType: AuditEventType.OAUTH_FAILED,
      userId,
      provider,
      ipAddress,
      userAgent,
      correlationId,
      errorMessage,
      metadata,
      timestamp: new Date(),
      success: false,
    });
  }
  
  /**
   * Log token refresh
   */
  async logTokenRefreshed(
    userId: number,
    provider: Provider,
    accountId: string,
    correlationId?: string
  ): Promise<void> {
    await this.log({
      eventType: AuditEventType.TOKEN_REFRESHED,
      userId,
      provider,
      accountId,
      correlationId,
      timestamp: new Date(),
      success: true,
    });
  }
  
  /**
   * Log token refresh failure
   */
  async logTokenRefreshFailed(
    userId: number,
    provider: Provider,
    accountId: string,
    errorMessage: string,
    correlationId?: string
  ): Promise<void> {
    await this.log({
      eventType: AuditEventType.TOKEN_REFRESH_FAILED,
      userId,
      provider,
      accountId,
      errorMessage,
      correlationId,
      timestamp: new Date(),
      success: false,
    });
  }
  
  /**
   * Log integration disconnection
   */
  async logIntegrationDisconnected(
    userId: number,
    provider: Provider,
    accountId: string,
    ipAddress?: string,
    userAgent?: string,
    correlationId?: string
  ): Promise<void> {
    await this.log({
      eventType: AuditEventType.INTEGRATION_DISCONNECTED,
      userId,
      provider,
      accountId,
      ipAddress,
      userAgent,
      correlationId,
      timestamp: new Date(),
      success: true,
    });
  }
  
  /**
   * Log CSRF validation failure
   */
  async logCsrfValidationFailed(
    provider: Provider,
    state: string,
    ipAddress?: string,
    userAgent?: string,
    correlationId?: string
  ): Promise<void> {
    await this.log({
      eventType: AuditEventType.CSRF_VALIDATION_FAILED,
      userId: 0, // Unknown user for security events
      provider,
      ipAddress,
      userAgent,
      correlationId,
      metadata: {
        stateLength: state?.length || 0,
        stateFormat: state?.split(':').length || 0,
      },
      timestamp: new Date(),
      success: false,
    });
  }
  
  /**
   * Log invalid state detection
   */
  async logInvalidStateDetected(
    provider: Provider,
    reason: string,
    ipAddress?: string,
    userAgent?: string,
    correlationId?: string
  ): Promise<void> {
    await this.log({
      eventType: AuditEventType.INVALID_STATE_DETECTED,
      userId: 0,
      provider,
      ipAddress,
      userAgent,
      correlationId,
      metadata: { reason },
      timestamp: new Date(),
      success: false,
    });
  }
  
  /**
   * Log rate limit exceeded
   */
  async logRateLimitExceeded(
    userId: number,
    provider: Provider,
    ipAddress?: string,
    userAgent?: string,
    correlationId?: string
  ): Promise<void> {
    await this.log({
      eventType: AuditEventType.RATE_LIMIT_EXCEEDED,
      userId,
      provider,
      ipAddress,
      userAgent,
      correlationId,
      timestamp: new Date(),
      success: false,
    });
  }
  
  /**
   * Log unauthorized access attempt
   */
  async logUnauthorizedAccess(
    userId: number,
    provider: Provider,
    accountId: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string,
    correlationId?: string
  ): Promise<void> {
    await this.log({
      eventType: AuditEventType.UNAUTHORIZED_ACCESS,
      userId,
      provider,
      accountId,
      ipAddress,
      userAgent,
      correlationId,
      metadata: { reason },
      timestamp: new Date(),
      success: false,
    });
  }
  
  /**
   * Sanitize metadata to remove sensitive information
   * 
   * Removes:
   * - Access tokens
   * - Refresh tokens
   * - Passwords
   * - API keys
   * - Session tokens
   */
  private sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
    if (!metadata) return undefined;
    
    const sanitized: Record<string, any> = {};
    const sensitiveKeys = [
      'accesstoken',
      'access_token',
      'refreshtoken',
      'refresh_token',
      'password',
      'apikey',
      'api_key',
      'secret',
      'token',
      'sessiontoken',
      'session_token',
      'authorization',
    ];
    
    for (const [key, value] of Object.entries(metadata)) {
      // Check if key is sensitive (case-insensitive)
      const keyLower = key.toLowerCase();
      const isSensitive = sensitiveKeys.some(
        sensitiveKey => keyLower.includes(sensitiveKey)
      );
      
      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeMetadata(value as Record<string, any>);
      } else if (Array.isArray(value)) {
        // Sanitize arrays
        sanitized[key] = value.map(item => 
          typeof item === 'object' && item !== null 
            ? this.sanitizeMetadata(item as Record<string, any>)
            : item
        );
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
  
  /**
   * Send audit log to external service with retry logic
   * 
   * @param entry - Audit log entry
   * @param sanitizedMetadata - Sanitized metadata
   * @returns Promise that resolves with the response
   * @private
   */
  private async sendToExternalService(
    entry: AuditLogEntry,
    sanitizedMetadata?: Record<string, any>
  ): Promise<ExternalAuditResponse> {
    const endpoint = process.env.AUDIT_LOG_ENDPOINT;
    if (!endpoint) {
      throw new Error('AUDIT_LOG_ENDPOINT not configured');
    }
    
    const apiKey = process.env.AUDIT_LOG_API_KEY;
    if (!apiKey) {
      throw new Error('AUDIT_LOG_API_KEY not configured');
    }
    
    try {
      // Use fetchWithRetry for automatic retry logic
      const response = await fetchWithRetry<ExternalAuditResponse>(
        endpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'X-Correlation-Id': entry.correlationId || '',
          },
          body: JSON.stringify({
            eventType: entry.eventType,
            userId: entry.userId,
            provider: entry.provider,
            accountId: entry.accountId,
            ipAddress: entry.ipAddress,
            userAgent: entry.userAgent,
            correlationId: entry.correlationId,
            metadata: sanitizedMetadata,
            success: entry.success,
            errorMessage: entry.errorMessage,
            timestamp: entry.timestamp.toISOString(),
          }),
        },
        {
          maxRetries: this.config.retryAttempts,
          retryDelay: this.config.retryDelay,
          retryOn: [408, 429, 500, 502, 503, 504],
          timeout: 5000,
        }
      );
      
      logger.debug('Audit log sent to external service', {
        correlationId: entry.correlationId,
        messageId: response.messageId,
      });
      
      return response;
    } catch (error) {
      logger.error('Failed to send audit log to external service', error as Error, {
        correlationId: entry.correlationId,
        endpoint,
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();
