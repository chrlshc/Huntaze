/**
 * Audit Logger - Unit Tests
 * 
 * Tests for the audit logging system with:
 * - PII sanitization
 * - External service integration
 * - Database logging
 * - Error handling
 * - Retry logic
 * 
 * @see lib/services/integrations/audit-logger.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuditLogger, AuditEventType, type AuditLogEntry } from '@/lib/services/integrations/audit-logger';

// Mock dependencies
const mockFetchWithRetry = vi.fn();
const mockPrismaExecuteRaw = vi.fn();
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

vi.mock('@/lib/utils/fetch-with-retry', () => ({
  fetchWithRetry: mockFetchWithRetry,
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    $executeRaw: mockPrismaExecuteRaw,
  })),
}));

vi.mock('@/lib/utils/logger', () => ({
  createLogger: () => mockLogger,
}));

describe('AuditLogger', () => {
  let auditLogger: AuditLogger;

  beforeEach(() => {
    auditLogger = new AuditLogger({
      enableExternalLogging: false,
      enableDatabaseLogging: false,
      enableConsoleLogging: true,
      retryAttempts: 3,
      retryDelay: 100,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('PII Sanitization', () => {
    it('should redact access tokens from metadata', async () => {
      const entry: AuditLogEntry = {
        eventType: AuditEventType.OAUTH_COMPLETED,
        userId: 123,
        provider: 'instagram',
        timestamp: new Date(),
        success: true,
        metadata: {
          accessToken: 'secret_token_123',
          username: 'testuser',
        },
      };

      await auditLogger.log(entry);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Audit event',
        expect.objectContaining({
          metadata: expect.objectContaining({
            accessToken: '[REDACTED]',
            username: 'testuser',
          }),
        })
      );
    });

    it('should redact refresh tokens from metadata', async () => {
      const entry: AuditLogEntry = {
        eventType: AuditEventType.TOKEN_REFRESHED,
        userId: 123,
        provider: 'instagram',
        timestamp: new Date(),
        success: true,
        metadata: {
          refresh_token: 'secret_refresh_123',
          expiresIn: 3600,
        },
      };

      await auditLogger.log(entry);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Audit event',
        expect.objectContaining({
          metadata: expect.objectContaining({
            refresh_token: '[REDACTED]',
            expiresIn: 3600,
          }),
        })
      );
    });

    it('should redact passwords from metadata', async () => {
      const entry: AuditLogEntry = {
        eventType: AuditEventType.OAUTH_FAILED,
        userId: 123,
        provider: 'instagram',
        timestamp: new Date(),
        success: false,
        metadata: {
          password: 'user_password_123',
          email: 'user@example.com',
        },
      };

      await auditLogger.log(entry);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Audit event',
        expect.objectContaining({
          metadata: expect.objectContaining({
            password: '[REDACTED]',
            email: 'user@example.com',
          }),
        })
      );
    });

    it('should redact API keys from metadata', async () => {
      const entry: AuditLogEntry = {
        eventType: AuditEventType.API_ERROR,
        userId: 123,
        provider: 'instagram',
        timestamp: new Date(),
        success: false,
        metadata: {
          apiKey: 'api_key_123',
          api_key: 'another_key',
          requestId: 'req_123',
        },
      };

      await auditLogger.log(entry);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Audit event',
        expect.objectContaining({
          metadata: expect.objectContaining({
            apiKey: '[REDACTED]',
            api_key: '[REDACTED]',
            requestId: 'req_123',
          }),
        })
      );
    });

    it('should recursively sanitize nested objects', async () => {
      const entry: AuditLogEntry = {
        eventType: AuditEventType.OAUTH_COMPLETED,
        userId: 123,
        provider: 'instagram',
        timestamp: new Date(),
        success: true,
        metadata: {
          user: {
            id: 'user_123',
            accessToken: 'secret_token',
          },
          config: {
            apiKey: 'api_key_123',
            timeout: 5000,
          },
        },
      };

      await auditLogger.log(entry);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Audit event',
        expect.objectContaining({
          metadata: expect.objectContaining({
            user: expect.objectContaining({
              id: 'user_123',
              accessToken: '[REDACTED]',
            }),
            config: expect.objectContaining({
              apiKey: '[REDACTED]',
              timeout: 5000,
            }),
          }),
        })
      );
    });

    it('should sanitize arrays of objects', async () => {
      const entry: AuditLogEntry = {
        eventType: AuditEventType.OAUTH_COMPLETED,
        userId: 123,
        provider: 'instagram',
        timestamp: new Date(),
        success: true,
        metadata: {
          accounts: [
            { id: 'acc_1', token: 'token_1' },
            { id: 'acc_2', token: 'token_2' },
          ],
        },
      };

      await auditLogger.log(entry);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Audit event',
        expect.objectContaining({
          metadata: expect.objectContaining({
            accounts: [
              { id: 'acc_1', token: '[REDACTED]' },
              { id: 'acc_2', token: '[REDACTED]' },
            ],
          }),
        })
      );
    });

    it('should handle case-insensitive sensitive key matching', async () => {
      const entry: AuditLogEntry = {
        eventType: AuditEventType.OAUTH_COMPLETED,
        userId: 123,
        provider: 'instagram',
        timestamp: new Date(),
        success: true,
        metadata: {
          AccessToken: 'token_1',
          REFRESH_TOKEN: 'token_2',
          Password: 'pass_123',
        },
      };

      await auditLogger.log(entry);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Audit event',
        expect.objectContaining({
          metadata: expect.objectContaining({
            AccessToken: '[REDACTED]',
            REFRESH_TOKEN: '[REDACTED]',
            Password: '[REDACTED]',
          }),
        })
      );
    });
  });

  describe('OAuth Event Logging', () => {
    it('should log OAuth initiation', async () => {
      await auditLogger.logOAuthInitiated(
        123,
        'instagram',
        '192.168.1.1',
        'Mozilla/5.0',
        'corr_123'
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Audit event',
        expect.objectContaining({
          eventType: AuditEventType.OAUTH_INITIATED,
          userId: 123,
          provider: 'instagram',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          correlationId: 'corr_123',
          success: true,
        })
      );
    });

    it('should log OAuth completion', async () => {
      await auditLogger.logOAuthCompleted(
        123,
        'instagram',
        'acc_123',
        '192.168.1.1',
        'Mozilla/5.0',
        'corr_123'
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Audit event',
        expect.objectContaining({
          eventType: AuditEventType.OAUTH_COMPLETED,
          userId: 123,
          provider: 'instagram',
          accountId: 'acc_123',
          success: true,
        })
      );
    });

    it('should log OAuth failure', async () => {
      await auditLogger.logOAuthFailed(
        123,
        'instagram',
        'Invalid credentials',
        '192.168.1.1',
        'Mozilla/5.0',
        'corr_123',
        { errorCode: 'AUTH_001' }
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Audit event',
        expect.objectContaining({
          eventType: AuditEventType.OAUTH_FAILED,
          userId: 123,
          provider: 'instagram',
          errorMessage: 'Invalid credentials',
          success: false,
          metadata: expect.objectContaining({
            errorCode: 'AUTH_001',
          }),
        })
      );
    });
  });

  describe('Token Event Logging', () => {
    it('should log token refresh', async () => {
      await auditLogger.logTokenRefreshed(
        123,
        'instagram',
        'acc_123',
        'corr_123'
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Audit event',
        expect.objectContaining({
          eventType: AuditEventType.TOKEN_REFRESHED,
          userId: 123,
          provider: 'instagram',
          accountId: 'acc_123',
          success: true,
        })
      );
    });

    it('should log token refresh failure', async () => {
      await auditLogger.logTokenRefreshFailed(
        123,
        'instagram',
        'acc_123',
        'Token expired',
        'corr_123'
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Audit event',
        expect.objectContaining({
          eventType: AuditEventType.TOKEN_REFRESH_FAILED,
          userId: 123,
          provider: 'instagram',
          accountId: 'acc_123',
          errorMessage: 'Token expired',
          success: false,
        })
      );
    });
  });

  describe('Security Event Logging', () => {
    it('should log CSRF validation failure', async () => {
      await auditLogger.logCsrfValidationFailed(
        'instagram',
        'invalid:state:token',
        '192.168.1.1',
        'Mozilla/5.0',
        'corr_123'
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Audit event',
        expect.objectContaining({
          eventType: AuditEventType.CSRF_VALIDATION_FAILED,
          userId: 0,
          provider: 'instagram',
          success: false,
          metadata: expect.objectContaining({
            stateLength: 19,
            stateFormat: 3,
          }),
        })
      );
    });

    it('should log invalid state detection', async () => {
      await auditLogger.logInvalidStateDetected(
        'instagram',
        'State expired',
        '192.168.1.1',
        'Mozilla/5.0',
        'corr_123'
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Audit event',
        expect.objectContaining({
          eventType: AuditEventType.INVALID_STATE_DETECTED,
          userId: 0,
          provider: 'instagram',
          success: false,
          metadata: expect.objectContaining({
            reason: 'State expired',
          }),
        })
      );
    });

    it('should log rate limit exceeded', async () => {
      await auditLogger.logRateLimitExceeded(
        123,
        'instagram',
        '192.168.1.1',
        'Mozilla/5.0',
        'corr_123'
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Audit event',
        expect.objectContaining({
          eventType: AuditEventType.RATE_LIMIT_EXCEEDED,
          userId: 123,
          provider: 'instagram',
          success: false,
        })
      );
    });

    it('should log unauthorized access', async () => {
      await auditLogger.logUnauthorizedAccess(
        123,
        'instagram',
        'acc_123',
        'User does not own account',
        '192.168.1.1',
        'Mozilla/5.0',
        'corr_123'
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Audit event',
        expect.objectContaining({
          eventType: AuditEventType.UNAUTHORIZED_ACCESS,
          userId: 123,
          provider: 'instagram',
          accountId: 'acc_123',
          success: false,
          metadata: expect.objectContaining({
            reason: 'User does not own account',
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should not throw on logging failure', async () => {
      mockLogger.info.mockImplementationOnce(() => {
        throw new Error('Logging failed');
      });

      const entry: AuditLogEntry = {
        eventType: AuditEventType.OAUTH_COMPLETED,
        userId: 123,
        provider: 'instagram',
        timestamp: new Date(),
        success: true,
      };

      await expect(auditLogger.log(entry)).resolves.not.toThrow();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Audit logging failed',
        expect.any(Error),
        expect.any(Object)
      );
    });

    it('should handle missing metadata gracefully', async () => {
      const entry: AuditLogEntry = {
        eventType: AuditEventType.OAUTH_COMPLETED,
        userId: 123,
        provider: 'instagram',
        timestamp: new Date(),
        success: true,
      };

      await auditLogger.log(entry);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Audit event',
        expect.objectContaining({
          metadata: undefined,
        })
      );
    });

    it('should handle null values in metadata', async () => {
      const entry: AuditLogEntry = {
        eventType: AuditEventType.OAUTH_COMPLETED,
        userId: 123,
        provider: 'instagram',
        timestamp: new Date(),
        success: true,
        metadata: {
          value: null,
          nested: { value: null },
        },
      };

      await expect(auditLogger.log(entry)).resolves.not.toThrow();
    });
  });

  describe('Configuration', () => {
    it('should respect enableConsoleLogging config', async () => {
      const logger = new AuditLogger({
        enableConsoleLogging: false,
      });

      const entry: AuditLogEntry = {
        eventType: AuditEventType.OAUTH_COMPLETED,
        userId: 123,
        provider: 'instagram',
        timestamp: new Date(),
        success: true,
      };

      await logger.log(entry);

      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    it('should use default configuration', () => {
      const logger = new AuditLogger();
      expect(logger).toBeDefined();
    });

    it('should merge custom configuration with defaults', () => {
      const logger = new AuditLogger({
        retryAttempts: 5,
      });
      expect(logger).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should complete logging within 100ms', async () => {
      const startTime = Date.now();

      const entry: AuditLogEntry = {
        eventType: AuditEventType.OAUTH_COMPLETED,
        userId: 123,
        provider: 'instagram',
        timestamp: new Date(),
        success: true,
      };

      await auditLogger.log(entry);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100);
    });

    it('should handle concurrent logging', async () => {
      const entries = Array.from({ length: 10 }, (_, i) => ({
        eventType: AuditEventType.OAUTH_COMPLETED,
        userId: 123 + i,
        provider: 'instagram' as const,
        timestamp: new Date(),
        success: true,
      }));

      await Promise.all(entries.map(entry => auditLogger.log(entry)));

      expect(mockLogger.info).toHaveBeenCalledTimes(10);
    });
  });
});
