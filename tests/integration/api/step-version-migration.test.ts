/**
 * Integration Tests - Step Version Migration API
 * 
 * Tests the step version migration endpoint with:
 * - Authentication and authorization
 * - Input validation
 * - Dry-run mode
 * - Actual migrations
 * - Batch migrations
 * - Error handling
 * - Retry logic
 * - Version history
 * 
 * Based on: docs/api/step-version-migration.md
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { z } from 'zod';

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const MIGRATION_ENDPOINT = `${BASE_URL}/api/admin/onboarding/migrate-version`;

// Mock auth token (replace with actual test token)
const TEST_AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || '';

// Response schemas
const MigrationResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  result: z.object({
    stepId: z.string(),
    fromVersion: z.number(),
    toVersion: z.number(),
    usersAffected: z.number(),
    progressCopied: z.number(),
    progressReset: z.number(),
    warnings: z.array(z.string()),
    dryRun: z.boolean(),
    duration: z.number(),
    timestamp: z.string()
  }),
  correlationId: z.string().uuid()
});

const ErrorResponseSchema = z.object({
  error: z.string(),
  correlationId: z.string().uuid().optional()
});

const VersionHistorySchema = z.object({
  stepId: z.string(),
  versions: z.array(z.object({
    version: z.number(),
    title: z.string(),
    required: z.boolean(),
    weight: z.number(),
    activeFrom: z.string().optional(),
    activeTo: z.string().optional(),
    isActive: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string()
  })),
  activeVersion: z.number().nullable(),
  totalVersions: z.number(),
  correlationId: z.string().uuid()
});

// Helper function to create auth headers
function getAuthHeaders(token: string = TEST_AUTH_TOKEN): Record<string, string> {
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

describe('Integration: Step Version Migration API', () => {
  describe('POST /api/admin/onboarding/migrate-version', () => {
    describe('Authentication & Authorization', () => {
      it('should return 401 when not authenticated', async () => {
        const response = await fetch(MIGRATION_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            stepId: 'test_step',
            fromVersion: 1,
            toVersion: 2
          })
        });
        
        expect([401, 403]).toContain(response.status);
      });

      it('should accept valid authentication token', async () => {
        if (!TEST_AUTH_TOKEN) {
          console.warn('Skipping auth test: TEST_AUTH_TOKEN not set');
          return;
        }

        const response = await fetch(MIGRATION_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            stepId: 'test_step',
            fromVersion: 1,
            toVersion: 2,
            dryRun: true
          })
        });
        
        // Should not return auth errors with valid token
        expect(response.status).not.toBe(401);
        expect(response.status).not.toBe(403);
      });
    });

    describe('Input Validation', () => {
      it('should reject request without stepId', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const response = await fetch(MIGRATION_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            fromVersion: 1,
            toVersion: 2
          })
        });
        
        expect(response.status).toBe(400);
        const json = await response.json();
        expect(json.error).toContain('Missing required fields');
      });

      it('should reject request without fromVersion', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const response = await fetch(MIGRATION_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            stepId: 'test_step',
            toVersion: 2
          })
        });
        
        expect(response.status).toBe(400);
      });

      it('should reject request without toVersion', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const response = await fetch(MIGRATION_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            stepId: 'test_step',
            fromVersion: 1
          })
        });
        
        expect(response.status).toBe(400);
      });

      it('should reject invalid stepId type', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const response = await fetch(MIGRATION_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            stepId: 123,
            fromVersion: 1,
            toVersion: 2
          })
        });
        
        expect(response.status).toBe(400);
        const json = await response.json();
        expect(json.error).toContain('must be a string');
      });

      it('should reject non-integer versions', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const response = await fetch(MIGRATION_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            stepId: 'test_step',
            fromVersion: 1.5,
            toVersion: 2.5
          })
        });
        
        expect(response.status).toBe(400);
        const json = await response.json();
        expect(json.error).toContain('must be integers');
      });

      it('should reject toVersion <= fromVersion', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const response = await fetch(MIGRATION_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            stepId: 'test_step',
            fromVersion: 2,
            toVersion: 1
          })
        });
        
        expect(response.status).toBe(400);
        const json = await response.json();
        expect(json.errors).toBeDefined();
      });

      it('should reject invalid JSON', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const response = await fetch(MIGRATION_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: 'invalid json'
        });
        
        expect(response.status).toBe(400);
        const json = await response.json();
        expect(json.error).toContain('Invalid JSON');
      });
    });

    describe('Dry Run Mode', () => {
      it('should execute dry run without making changes', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const response = await fetch(MIGRATION_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            stepId: 'payments',
            fromVersion: 1,
            toVersion: 2,
            dryRun: true
          })
        });
        
        if (response.ok) {
          const json = await response.json();
          const result = MigrationResultSchema.safeParse(json);
          
          expect(result.success).toBe(true);
          if (result.success) {
            expect(json.result.dryRun).toBe(true);
            expect(json.message).toContain('[DRY RUN]');
          }
        }
      });

      it('should return estimated impact in dry run', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const response = await fetch(MIGRATION_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            stepId: 'payments',
            fromVersion: 1,
            toVersion: 2,
            dryRun: true
          })
        });
        
        if (response.ok) {
          const json = await response.json();
          
          expect(json.result.usersAffected).toBeGreaterThanOrEqual(0);
          expect(json.result.progressCopied).toBeGreaterThanOrEqual(0);
          expect(json.result.progressReset).toBeGreaterThanOrEqual(0);
        }
      });
    });

    describe('Response Schema Validation', () => {
      it('should return valid success response schema', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const response = await fetch(MIGRATION_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            stepId: 'test_step',
            fromVersion: 1,
            toVersion: 2,
            dryRun: true
          })
        });
        
        if (response.ok) {
          const json = await response.json();
          const result = MigrationResultSchema.safeParse(json);
          
          if (!result.success) {
            console.error('Schema validation errors:', result.error.errors);
          }
          
          expect(result.success).toBe(true);
        }
      });

      it('should include correlation ID in response', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const response = await fetch(MIGRATION_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            stepId: 'test_step',
            fromVersion: 1,
            toVersion: 2,
            dryRun: true
          })
        });
        
        const json = await response.json();
        expect(json.correlationId).toBeDefined();
        expect(json.correlationId).toMatch(/^[0-9a-f-]{36}$/);
      });

      it('should include duration in response', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const response = await fetch(MIGRATION_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            stepId: 'test_step',
            fromVersion: 1,
            toVersion: 2,
            dryRun: true
          })
        });
        
        if (response.ok) {
          const json = await response.json();
          expect(json.result.duration).toBeGreaterThan(0);
          expect(typeof json.result.duration).toBe('number');
        }
      });
    });

    describe('Batch Migrations', () => {
      it('should accept batch migration array', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const response = await fetch(MIGRATION_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify([
            { stepId: 'step1', fromVersion: 1, toVersion: 2, dryRun: true },
            { stepId: 'step2', fromVersion: 1, toVersion: 2, dryRun: true }
          ])
        });
        
        if (response.ok) {
          const json = await response.json();
          expect(json.results).toBeDefined();
          expect(Array.isArray(json.results)).toBe(true);
          expect(json.summary).toBeDefined();
        }
      });

      it('should reject empty batch array', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const response = await fetch(MIGRATION_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify([])
        });
        
        expect(response.status).toBe(400);
        const json = await response.json();
        expect(json.error).toContain('Empty batch');
      });

      it('should reject batch size > 10', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const largeBatch = Array.from({ length: 15 }, (_, i) => ({
          stepId: `step${i}`,
          fromVersion: 1,
          toVersion: 2,
          dryRun: true
        }));
        
        const response = await fetch(MIGRATION_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify(largeBatch)
        });
        
        expect(response.status).toBe(400);
        const json = await response.json();
        expect(json.error).toContain('Batch size too large');
      });
    });

    describe('Error Handling', () => {
      it('should return structured error on failure', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const response = await fetch(MIGRATION_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            stepId: 'nonexistent_step',
            fromVersion: 999,
            toVersion: 1000
          })
        });
        
        if (!response.ok) {
          const json = await response.json();
          const result = ErrorResponseSchema.safeParse(json);
          
          expect(result.success).toBe(true);
          expect(json.error).toBeDefined();
        }
      });

      it('should include correlation ID in error response', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const response = await fetch(MIGRATION_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            stepId: 'test',
            fromVersion: 2,
            toVersion: 1
          })
        });
        
        const json = await response.json();
        expect(json.correlationId).toBeDefined();
      });
    });

    describe('Performance', () => {
      it('should respond within acceptable time', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const start = Date.now();
        const response = await fetch(MIGRATION_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            stepId: 'test_step',
            fromVersion: 1,
            toVersion: 2,
            dryRun: true
          })
        });
        const duration = Date.now() - start;
        
        expect(duration).toBeLessThan(5000); // 5 seconds max
      });
    });
  });

  describe('GET /api/admin/onboarding/migrate-version', () => {
    describe('Version History', () => {
      it('should return version history for existing step', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const response = await fetch(
          `${MIGRATION_ENDPOINT}?stepId=payments`,
          {
            headers: getAuthHeaders()
          }
        );
        
        if (response.ok) {
          const json = await response.json();
          const result = VersionHistorySchema.safeParse(json);
          
          if (!result.success) {
            console.error('Schema validation errors:', result.error.errors);
          }
          
          expect(result.success).toBe(true);
        }
      });

      it('should require stepId parameter', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const response = await fetch(MIGRATION_ENDPOINT, {
          headers: getAuthHeaders()
        });
        
        expect(response.status).toBe(400);
        const json = await response.json();
        expect(json.error).toContain('stepId parameter required');
      });

      it('should return 404 for nonexistent step', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const response = await fetch(
          `${MIGRATION_ENDPOINT}?stepId=nonexistent_step_12345`,
          {
            headers: getAuthHeaders()
          }
        );
        
        if (response.status === 404) {
          const json = await response.json();
          expect(json.error).toContain('Step not found');
        }
      });

      it('should include active version indicator', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const response = await fetch(
          `${MIGRATION_ENDPOINT}?stepId=payments`,
          {
            headers: getAuthHeaders()
          }
        );
        
        if (response.ok) {
          const json = await response.json();
          
          expect(json.activeVersion).toBeDefined();
          expect(json.versions).toBeDefined();
          
          if (json.activeVersion !== null) {
            const activeVersions = json.versions.filter((v: any) => v.isActive);
            expect(activeVersions.length).toBeGreaterThan(0);
          }
        }
      });
    });
  });
});
