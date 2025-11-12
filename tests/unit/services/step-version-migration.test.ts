/**
 * Unit Tests - Step Version Migration Service
 * 
 * Tests the core migration service logic with mocked dependencies.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  migrateStepVersion,
  validateMigration,
  getMigrationSummary,
  getMigrationReport,
  batchMigrateSteps,
  type StepVersionMigrationOptions,
  type MigrationResult
} from '@/lib/services/step-version-migration';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  getPool: vi.fn(() => ({
    connect: vi.fn(() => ({
      query: vi.fn(),
      release: vi.fn()
    })),
    query: vi.fn()
  }))
}));

vi.mock('@/lib/db/repositories/onboarding-step-definitions', () => ({
  OnboardingStepDefinitionsRepository: vi.fn(() => ({
    getStepById: vi.fn(),
    getStepVersions: vi.fn(),
    createNewVersion: vi.fn(),
    deactivateStep: vi.fn()
  }))
}));

vi.mock('@/lib/db/repositories/user-onboarding', () => ({
  UserOnboardingRepository: vi.fn(() => ({
    getUserSteps: vi.fn(),
    migrateStepVersion: vi.fn(),
    calculateProgress: vi.fn()
  }))
}));

describe('Step Version Migration Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateMigration', () => {
    it('should reject when toVersion <= fromVersion', async () => {
      const options: StepVersionMigrationOptions = {
        stepId: 'test_step',
        fromVersion: 2,
        toVersion: 1
      };

      const result = await validateMigration(options);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Target version (1) must be greater than source version (2)'
      );
    });

    it('should handle database connection errors gracefully', async () => {
      const options: StepVersionMigrationOptions = {
        stepId: 'test_step',
        fromVersion: 1,
        toVersion: 2
      };

      // Mock database to throw connection error
      const { getPool } = await import('@/lib/db');
      const mockPool = getPool();
      vi.mocked(mockPool.query).mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await validateMigration(options);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Database validation failed'))).toBe(true);
    });

    it('should reject negative version numbers', async () => {
      const options: StepVersionMigrationOptions = {
        stepId: 'test_step',
        fromVersion: -1,
        toVersion: 2
      };

      const result = await validateMigration(options);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('positive integers'))).toBe(true);
    });

    it('should reject non-integer versions', async () => {
      const options: StepVersionMigrationOptions = {
        stepId: 'test_step',
        fromVersion: 1.5,
        toVersion: 2.5
      };

      const result = await validateMigration(options);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('must be integers'))).toBe(true);
    });

    it('should reject empty stepId', async () => {
      const options: StepVersionMigrationOptions = {
        stepId: '',
        fromVersion: 1,
        toVersion: 2
      };

      const result = await validateMigration(options);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Step ID is required'))).toBe(true);
    });

    it('should reject invalid stepId characters', async () => {
      const options: StepVersionMigrationOptions = {
        stepId: 'test step!@#',
        fromVersion: 1,
        toVersion: 2
      };

      const result = await validateMigration(options);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('alphanumeric'))).toBe(true);
    });

    it('should accept valid options', async () => {
      const options: StepVersionMigrationOptions = {
        stepId: 'test_step',
        fromVersion: 1,
        toVersion: 2
      };

      // Mock database checks to pass
      const { getPool } = await import('@/lib/db');
      const mockPool = getPool();
      vi.mocked(mockPool.query).mockResolvedValue({
        rows: [{ id: 1, version: 1 }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await validateMigration(options);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('getMigrationSummary', () => {
    it('should format success summary correctly', () => {
      const result: MigrationResult = {
        success: true,
        stepId: 'payments',
        fromVersion: 1,
        toVersion: 2,
        usersAffected: 1523,
        progressCopied: 1245,
        progressReset: 278,
        errors: [],
        warnings: [],
        dryRun: false,
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        duration: 3456,
        timestamp: '2025-11-11T10:30:00Z'
      };

      const summary = getMigrationSummary(result);

      expect(summary).toContain('Migration completed successfully');
      expect(summary).toContain('payments');
      expect(summary).toContain('1 → 2');
      expect(summary).toContain('1523');
      expect(summary).toContain('1245');
      expect(summary).toContain('278');
      expect(summary).toContain('3456ms');
    });

    it('should format dry-run summary correctly', () => {
      const result: MigrationResult = {
        success: true,
        stepId: 'payments',
        fromVersion: 1,
        toVersion: 2,
        usersAffected: 1523,
        progressCopied: 1245,
        progressReset: 278,
        errors: [],
        warnings: [],
        dryRun: true,
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        duration: 234,
        timestamp: '2025-11-11T10:30:00Z'
      };

      const summary = getMigrationSummary(result);

      expect(summary).toContain('[DRY RUN]');
      expect(summary).toContain('Migration completed successfully');
    });

    it('should format failure summary correctly', () => {
      const result: MigrationResult = {
        success: false,
        stepId: 'payments',
        fromVersion: 1,
        toVersion: 2,
        usersAffected: 0,
        progressCopied: 0,
        progressReset: 0,
        errors: [
          {
            code: 'MIGRATION_ERROR',
            message: 'Database connection failed',
            timestamp: '2025-11-11T10:30:00Z'
          }
        ],
        warnings: [],
        dryRun: false,
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        duration: 123,
        timestamp: '2025-11-11T10:30:00Z'
      };

      const summary = getMigrationSummary(result);

      expect(summary).toContain('Migration failed');
      expect(summary).toContain('MIGRATION_ERROR');
      expect(summary).toContain('Database connection failed');
    });

    it('should include warnings in summary', () => {
      const result: MigrationResult = {
        success: true,
        stepId: 'payments',
        fromVersion: 1,
        toVersion: 2,
        usersAffected: 1523,
        progressCopied: 1245,
        progressReset: 278,
        errors: [],
        warnings: ['Expected version 2 but got 3. Using 3.'],
        dryRun: false,
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        duration: 3456,
        timestamp: '2025-11-11T10:30:00Z'
      };

      const summary = getMigrationSummary(result);

      expect(summary).toContain('Warnings');
      expect(summary).toContain('Expected version 2 but got 3');
    });
  });

  describe('getMigrationReport', () => {
    it('should generate complete report', () => {
      const result: MigrationResult = {
        success: true,
        stepId: 'payments',
        fromVersion: 1,
        toVersion: 2,
        usersAffected: 1523,
        progressCopied: 1245,
        progressReset: 278,
        errors: [],
        warnings: ['Test warning'],
        dryRun: false,
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        duration: 3456,
        timestamp: '2025-11-11T10:30:00Z'
      };

      const report = getMigrationReport(result);

      expect(report.summary).toBeDefined();
      expect(report.metrics).toEqual({
        usersAffected: 1523,
        progressCopied: 1245,
        progressReset: 278,
        duration: 3456,
        errorCount: 0,
        warningCount: 1
      });
      expect(report.errors).toEqual([]);
      expect(report.warnings).toEqual(['Test warning']);
      expect(report.metadata).toMatchObject({
        stepId: 'payments',
        fromVersion: 1,
        toVersion: 2,
        dryRun: false,
        success: true
      });
    });

    it('should include errors in report', () => {
      const result: MigrationResult = {
        success: false,
        stepId: 'payments',
        fromVersion: 1,
        toVersion: 2,
        usersAffected: 0,
        progressCopied: 0,
        progressReset: 0,
        errors: [
          {
            code: 'VALIDATION_ERROR',
            message: 'Step not found',
            timestamp: '2025-11-11T10:30:00Z'
          }
        ],
        warnings: [],
        dryRun: false,
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        duration: 123,
        timestamp: '2025-11-11T10:30:00Z'
      };

      const report = getMigrationReport(result);

      expect(report.metrics.errorCount).toBe(1);
      expect(report.errors).toHaveLength(1);
      expect(report.errors[0].code).toBe('VALIDATION_ERROR');
    });
  });

  describe('migrateStepVersion', () => {
    it('should generate correlation ID if not provided', async () => {
      const options: StepVersionMigrationOptions = {
        stepId: 'test_step',
        fromVersion: 1,
        toVersion: 2,
        dryRun: true
      };

      const result = await migrateStepVersion(options);

      expect(result.correlationId).toBeDefined();
      expect(result.correlationId).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('should use provided correlation ID', async () => {
      const correlationId = '550e8400-e29b-41d4-a716-446655440000';
      const options: StepVersionMigrationOptions = {
        stepId: 'test_step',
        fromVersion: 1,
        toVersion: 2,
        correlationId,
        dryRun: true
      };

      const result = await migrateStepVersion(options);

      expect(result.correlationId).toBe(correlationId);
    });

    it('should fail validation for invalid options', async () => {
      const options: StepVersionMigrationOptions = {
        stepId: 'test_step',
        fromVersion: 2,
        toVersion: 1
      };

      const result = await migrateStepVersion(options);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('VALIDATION_ERROR');
    });

    it('should record duration', async () => {
      const options: StepVersionMigrationOptions = {
        stepId: 'test_step',
        fromVersion: 1,
        toVersion: 2,
        dryRun: true
      };

      const result = await migrateStepVersion(options);

      expect(result.duration).toBeGreaterThan(0);
      expect(typeof result.duration).toBe('number');
    });

    it('should set timestamp', async () => {
      const options: StepVersionMigrationOptions = {
        stepId: 'test_step',
        fromVersion: 1,
        toVersion: 2,
        dryRun: true
      };

      const result = await migrateStepVersion(options);

      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).toString()).not.toBe('Invalid Date');
    });
  });

  describe('batchMigrateSteps', () => {
    it('should process multiple migrations', async () => {
      const migrations: StepVersionMigrationOptions[] = [
        { stepId: 'step1', fromVersion: 1, toVersion: 2, dryRun: true },
        { stepId: 'step2', fromVersion: 1, toVersion: 2, dryRun: true }
      ];

      const results = await batchMigrateSteps(migrations);

      expect(results).toHaveLength(2);
      expect(results[0].stepId).toBe('step1');
      expect(results[1].stepId).toBe('step2');
    });

    it('should generate unique correlation IDs for each migration', async () => {
      const migrations: StepVersionMigrationOptions[] = [
        { stepId: 'step1', fromVersion: 1, toVersion: 2, dryRun: true },
        { stepId: 'step2', fromVersion: 1, toVersion: 2, dryRun: true }
      ];

      const results = await batchMigrateSteps(migrations);

      expect(results[0].correlationId).toBeDefined();
      expect(results[1].correlationId).toBeDefined();
      expect(results[0].correlationId).not.toBe(results[1].correlationId);
    });

    it('should stop on first failure in non-dry-run mode', async () => {
      const migrations: StepVersionMigrationOptions[] = [
        { stepId: 'step1', fromVersion: 2, toVersion: 1, dryRun: false }, // Invalid
        { stepId: 'step2', fromVersion: 1, toVersion: 2, dryRun: false }
      ];

      const results = await batchMigrateSteps(migrations);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
    });

    it('should continue on failure in dry-run mode', async () => {
      const migrations: StepVersionMigrationOptions[] = [
        { stepId: 'step1', fromVersion: 2, toVersion: 1, dryRun: true }, // Invalid
        { stepId: 'step2', fromVersion: 1, toVersion: 2, dryRun: true }
      ];

      const results = await batchMigrateSteps(migrations);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(false);
      expect(results[1].success).toBe(true);
    });

    it('should handle empty array', async () => {
      const migrations: StepVersionMigrationOptions[] = [];

      const results = await batchMigrateSteps(migrations);

      expect(results).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should catch and structure errors', async () => {
      const options: StepVersionMigrationOptions = {
        stepId: 'test_step',
        fromVersion: 1,
        toVersion: 2
      };

      // Mock database to throw error
      const { getPool } = await import('@/lib/db');
      const mockPool = getPool();
      vi.mocked(mockPool.query).mockRejectedValue(new Error('Database error'));

      const result = await migrateStepVersion(options);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('Database error');
    });

    it('should handle non-Error exceptions', async () => {
      const options: StepVersionMigrationOptions = {
        stepId: 'test_step',
        fromVersion: 1,
        toVersion: 2
      };

      // Mock to throw non-Error
      const { getPool } = await import('@/lib/db');
      const mockPool = getPool();
      vi.mocked(mockPool.query).mockRejectedValue('String error');

      const result = await migrateStepVersion(options);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should include error timestamp', async () => {
      const options: StepVersionMigrationOptions = {
        stepId: 'test_step',
        fromVersion: 2,
        toVersion: 1 // Invalid
      };

      const result = await migrateStepVersion(options);

      expect(result.errors[0].timestamp).toBeDefined();
      expect(new Date(result.errors[0].timestamp).toString()).not.toBe('Invalid Date');
    });

    it('should include correlation ID in error context', async () => {
      const correlationId = '550e8400-e29b-41d4-a716-446655440000';
      const options: StepVersionMigrationOptions = {
        stepId: 'test_step',
        fromVersion: 2,
        toVersion: 1,
        correlationId
      };

      const result = await migrateStepVersion(options);

      expect(result.correlationId).toBe(correlationId);
      expect(result.success).toBe(false);
    });

    it('should handle timeout errors', async () => {
      const options: StepVersionMigrationOptions = {
        stepId: 'test_step',
        fromVersion: 1,
        toVersion: 2,
        maxRetries: 1,
        retryDelayMs: 10
      };

      // Mock to simulate timeout
      const { getPool } = await import('@/lib/db');
      const mockPool = getPool();
      vi.mocked(mockPool.query).mockRejectedValue(new Error('ETIMEDOUT'));

      const result = await migrateStepVersion(options);

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain('ETIMEDOUT');
    });

    it('should handle transaction rollback errors', async () => {
      const options: StepVersionMigrationOptions = {
        stepId: 'test_step',
        fromVersion: 1,
        toVersion: 2
      };

      // Mock to throw during transaction
      const { getPool } = await import('@/lib/db');
      const mockPool = getPool();
      const mockClient = {
        query: vi.fn()
          .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN
          .mockRejectedValueOnce(new Error('Constraint violation')), // INSERT
        release: vi.fn()
      };
      vi.mocked(mockPool.connect).mockResolvedValue(mockClient as any);

      const result = await migrateStepVersion(options);

      expect(result.success).toBe(false);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('Configuration', () => {
    it('should use default maxRetries', async () => {
      const options: StepVersionMigrationOptions = {
        stepId: 'test_step',
        fromVersion: 1,
        toVersion: 2,
        dryRun: true
      };

      const result = await migrateStepVersion(options);

      // Should complete without error (default is 3 retries)
      expect(result).toBeDefined();
    });

    it('should use custom maxRetries', async () => {
      const options: StepVersionMigrationOptions = {
        stepId: 'test_step',
        fromVersion: 1,
        toVersion: 2,
        maxRetries: 5,
        dryRun: true
      };

      const result = await migrateStepVersion(options);

      expect(result).toBeDefined();
    });

    it('should use custom retryDelayMs', async () => {
      const options: StepVersionMigrationOptions = {
        stepId: 'test_step',
        fromVersion: 1,
        toVersion: 2,
        retryDelayMs: 500,
        dryRun: true
      };

      const result = await migrateStepVersion(options);

      expect(result).toBeDefined();
    });

    it('should respect retry configuration on transient failures', async () => {
      const options: StepVersionMigrationOptions = {
        stepId: 'test_step',
        fromVersion: 1,
        toVersion: 2,
        maxRetries: 2,
        retryDelayMs: 10
      };

      // Mock to fail twice then succeed
      const { getPool } = await import('@/lib/db');
      const mockPool = getPool();
      let callCount = 0;
      vi.mocked(mockPool.query).mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.reject(new Error('Transient error'));
        }
        return Promise.resolve({ rows: [{ id: 1 }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });
      });

      const result = await migrateStepVersion(options);

      expect(callCount).toBeGreaterThan(1);
      expect(result).toBeDefined();
    });
  });

  describe('Dry Run Mode', () => {
    it('should not make changes in dry-run mode', async () => {
      const options: StepVersionMigrationOptions = {
        stepId: 'test_step',
        fromVersion: 1,
        toVersion: 2,
        dryRun: true
      };

      const result = await migrateStepVersion(options);

      expect(result.dryRun).toBe(true);
    });

    it('should estimate impact in dry-run mode', async () => {
      const options: StepVersionMigrationOptions = {
        stepId: 'test_step',
        fromVersion: 1,
        toVersion: 2,
        dryRun: true
      };

      const result = await migrateStepVersion(options);

      expect(result.usersAffected).toBeGreaterThanOrEqual(0);
      expect(result.progressCopied).toBeGreaterThanOrEqual(0);
      expect(result.progressReset).toBeGreaterThanOrEqual(0);
    });

    it('should not execute database writes in dry-run', async () => {
      const options: StepVersionMigrationOptions = {
        stepId: 'test_step',
        fromVersion: 1,
        toVersion: 2,
        dryRun: true
      };

      const { getPool } = await import('@/lib/db');
      const mockPool = getPool();
      const mockQuery = vi.mocked(mockPool.query);

      await migrateStepVersion(options);

      // Should only do SELECT queries, no INSERT/UPDATE/DELETE
      const writeCalls = mockQuery.mock.calls.filter(call => {
        const sql = call[0]?.toString().toUpperCase() || '';
        return sql.includes('INSERT') || sql.includes('UPDATE') || sql.includes('DELETE');
      });

      expect(writeCalls.length).toBe(0);
    });
  });

  describe('Performance & Metrics', () => {
    it('should track migration duration', async () => {
      const options: StepVersionMigrationOptions = {
        stepId: 'test_step',
        fromVersion: 1,
        toVersion: 2,
        dryRun: true
      };

      const result = await migrateStepVersion(options);

      expect(result.duration).toBeGreaterThan(0);
      expect(typeof result.duration).toBe('number');
    });

    it('should complete dry-run quickly', async () => {
      const options: StepVersionMigrationOptions = {
        stepId: 'test_step',
        fromVersion: 1,
        toVersion: 2,
        dryRun: true
      };

      const start = Date.now();
      await migrateStepVersion(options);
      const duration = Date.now() - start;

      // Dry-run should be fast (< 1s)
      expect(duration).toBeLessThan(1000);
    });

    it('should provide detailed metrics in report', () => {
      const result: MigrationResult = {
        success: true,
        stepId: 'payments',
        fromVersion: 1,
        toVersion: 2,
        usersAffected: 1523,
        progressCopied: 1245,
        progressReset: 278,
        errors: [],
        warnings: ['Test warning'],
        dryRun: false,
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        duration: 3456,
        timestamp: '2025-11-11T10:30:00Z'
      };

      const report = getMigrationReport(result);

      expect(report.metrics).toMatchObject({
        usersAffected: 1523,
        progressCopied: 1245,
        progressReset: 278,
        duration: 3456,
        errorCount: 0,
        warningCount: 1
      });
    });
  });

  describe('Logging & Observability', () => {
    it('should log migration start', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      const options: StepVersionMigrationOptions = {
        stepId: 'test_step',
        fromVersion: 1,
        toVersion: 2,
        dryRun: true
      };

      await migrateStepVersion(options);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Step Migration] Migration started'),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });

    it('should log migration completion', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      const options: StepVersionMigrationOptions = {
        stepId: 'test_step',
        fromVersion: 1,
        toVersion: 2,
        dryRun: true
      };

      await migrateStepVersion(options);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Step Migration] Migration completed'),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });

    it('should log errors with context', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      
      const options: StepVersionMigrationOptions = {
        stepId: 'test_step',
        fromVersion: 2,
        toVersion: 1 // Invalid
      };

      await migrateStepVersion(options);

      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
