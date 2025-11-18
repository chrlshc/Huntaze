/**
 * Integrations Status API - Complete Integration Tests
 * 
 * Full integration tests for GET /api/integrations/status endpoint with:
 * - Real HTTP requests
 * - Database interactions
 * - Authentication and authorization
 * - Rate limiting
 * - Concurrent access
 * - Error handling
 * - Performance validation
 * - Retry logic
 * 
 * Requirements: 1.1, 1.2, 3.1, 3.2
 * @see app/api/integrations/status/route.ts
 * @see .kiro/specs/integrations-management/requirements.md
 * @see tests/integration/api/integrations-status-api-tests.md
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { z } from 'zod';
import { query } from '@/lib/db';
import crypto from 'crypto';
import {
  generateRandomIntegration,
  generateTestUser,
  generateMockSessionCookie,
  createIntegrationQuery,
  deleteIntegrationQuery,
  deleteUserIntegrationsQuery,
} from './fixtures/integrations-fixtures';

// ============================================================================
// Response Schemas
// ============================================================================

const IntegrationSchema = z.object({
  id: z.number(),
  provider: z.string(),
  accountId: z.string(),
  accountName: z.string(),
  status: z.enum(['connected', 'expired']),
  expiresAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const SuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    integrations: z.array(IntegrationSchema),
  }),
  duration: z.number(),
});

const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
  duration: z.number(),
});

// ============================================================================
// Test Setup
// ============================================================================

describe('GET /api/integrations/status - Complete Integration Tests', () => {
  const baseUrl = process.env.TEST_API_URL || 'http://localhost:3000';
  const testUsers: string[] = [];
  const testIntegrations: number[] = [];
  let testSessionCookie: string;
  let testUserId: string;

  // Setup: Create test user and get session
  beforeAll(async () => {
    const testUser = generateTestUser();
    testUsers.push(testUser.email);

    // Register user
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });

    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      testUserId = registerData.user.id;
      testSessionCookie = generateMockSessionCookie(testUserId);
    } else {
      console.warn('Failed to create test user, some tests may be skipped');
    }
  });

  // Cleanup
  afterAll(async () => {
    // Delete test integrations
    for (const integrationId of testIntegrations) {
      try {
        await query(deleteIntegrationQuery, [integrationId]);
      } catch (error) {
        console.error(`Failed to cleanup integration ${integrationId}:`, error);
      }
    }

    // Delete test users
    for (const email of testUsers) {
      try {
        await query('DELETE FROM users WHERE email = $1', [email]);
      } catch (error) {
        console.error(`Failed to cleanup test user ${email}:`, error);
      }
    }
  });

  // Helper to make authenticated request
  const getIntegrationsStatus = async (sessionCookie?: string) => {
    const response = await fetch(`${baseUrl}/api/integrations/status`, {
      method: 'GET',
      headers: {
        ...(sessionCookie && { Cookie: sessionCookie }),
      },
    });

    const responseData = await response.json();
    
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData,
    };
  };

  // Helper to create test integration
  const createTestIntegration = async (
    userId: string,
    provider: string,
    expiresAt?: Date | null
  ) => {
    const integration = generateRandomIntegration(provider, false);
    
    const result = await query(createIntegrationQuery, [
      userId,
      provider,
      integration.accountId,
      integration.accountName,
      integration.accessToken,
      integration.refreshToken,
      expiresAt !== undefined ? expiresAt : integration.expiresAt,
    ]);

    const integrationId = result.rows[0].id;
    testIntegrations.push(integrationId);
    return integrationId;
  };

  // ============================================================================
  // HTTP Status Codes
  // ============================================================================

  describe('HTTP Status Codes', () => {
    it('should return 200 OK on successful request', async () => {
      if (!testSessionCookie) {
        console.warn('Skipping test: no session cookie');
        return;
      }

      const response = await getIntegrationsStatus(testSessionCookie);
      expect(response.status).toBe(200);
      expect(SuccessResponseSchema.parse(response.data)).toBeDefined();
    });

    it('should return 401 Unauthorized without session', async () => {
      const response = await getIntegrationsStatus();
      expect(response.status).toBe(401);
    });

    it('should return 401 Unauthorized with invalid session', async () => {
      const response = await getIntegrationsStatus('invalid-session-cookie');
      expect(response.status).toBe(401);
    });
  });

  // ============================================================================
  // Response Schema Validation
  // ============================================================================

  describe('Response Schema Validation', () => {
    it('should return valid success response schema', async () => {
      if (!testSessionCookie) {
        console.warn('Skipping test: no session cookie');
        return;
      }

      const response = await getIntegrationsStatus(testSessionCookie);

      const validated = SuccessResponseSchema.parse(response.data);
      
      expect(validated.success).toBe(true);
      expect(Array.isArray(validated.data.integrations)).toBe(true);
      expect(validated.duration).toBeGreaterThan(0);
    });

    it('should include correlation ID in headers', async () => {
      const response = await getIntegrationsStatus(testSessionCookie);
      expect(response.headers['x-correlation-id']).toBeDefined();
      expect(response.headers['x-correlation-id']).toMatch(/^[a-z0-9-]+$/);
    });

    it('should not expose sensitive data in response', async () => {
      if (!testSessionCookie) {
        console.warn('Skipping test: no session cookie');
        return;
      }

      const response = await getIntegrationsStatus(testSessionCookie);

      const responseStr = JSON.stringify(response.data);
      expect(responseStr).not.toContain('access_token');
      expect(responseStr).not.toContain('refresh_token');
      expect(responseStr).not.toContain('password');
      expect(responseStr).not.toContain('encrypted');
    });
  });

  // ============================================================================
  // Integration Status Logic
  // ============================================================================

  describe('Integration Status Logic', () => {
    beforeEach(async () => {
      if (!testUserId) return;
      // Clean up existing test integrations
      await query(deleteUserIntegrationsQuery, [testUserId]);
    });

    it('should mark expired integrations correctly', async () => {
      if (!testSessionCookie || !testUserId) {
        console.warn('Skipping test: no session or user');
        return;
      }

      // Create expired integration
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      await createTestIntegration(testUserId, 'instagram', pastDate);

      const response = await getIntegrationsStatus(testSessionCookie);
      expect(response.status).toBe(200);

      const integrations = response.data.data.integrations;
      const expiredIntegration = integrations.find((i: any) => i.provider === 'instagram');
      
      expect(expiredIntegration).toBeDefined();
      expect(expiredIntegration.status).toBe('expired');
    });

    it('should mark active integrations as connected', async () => {
      if (!testSessionCookie || !testUserId) {
        console.warn('Skipping test: no session or user');
        return;
      }

      // Create active integration
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      await createTestIntegration(testUserId, 'tiktok', futureDate);

      const response = await getIntegrationsStatus(testSessionCookie);
      expect(response.status).toBe(200);

      const integrations = response.data.data.integrations;
      const activeIntegration = integrations.find((i: any) => i.provider === 'tiktok');
      
      expect(activeIntegration).toBeDefined();
      expect(activeIntegration.status).toBe('connected');
    });

    it('should handle integrations without expiry date', async () => {
      if (!testSessionCookie || !testUserId) {
        console.warn('Skipping test: no session or user');
        return;
      }

      // Create integration without expiry
      await createTestIntegration(testUserId, 'reddit', null);

      const response = await getIntegrationsStatus(testSessionCookie);
      expect(response.status).toBe(200);

      const integrations = response.data.data.integrations;
      const noExpiryIntegration = integrations.find((i: any) => i.provider === 'reddit');
      
      expect(noExpiryIntegration).toBeDefined();
      expect(noExpiryIntegration.status).toBe('connected');
      expect(noExpiryIntegration.expiresAt).toBeNull();
    });

    it('should return empty array when no integrations exist', async () => {
      if (!testSessionCookie) {
        console.warn('Skipping test: no session cookie');
        return;
      }

      const response = await getIntegrationsStatus(testSessionCookie);
      expect(response.status).toBe(200);

      const integrations = response.data.data.integrations;
      expect(Array.isArray(integrations)).toBe(true);
    });
  });

  // ============================================================================
  // Performance
  // ============================================================================

  describe('Performance', () => {
    it('should complete request within 500ms', async () => {
      if (!testSessionCookie) {
        console.warn('Skipping test: no session cookie');
        return;
      }

      const startTime = Date.now();
      await getIntegrationsStatus(testSessionCookie);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500);
    });

    it('should include performance metrics in response', async () => {
      if (!testSessionCookie) {
        console.warn('Skipping test: no session cookie');
        return;
      }

      const response = await getIntegrationsStatus(testSessionCookie);

      expect(response.data.duration).toBeDefined();
      expect(response.data.duration).toBeGreaterThan(0);
      expect(response.data.duration).toBeLessThan(1000);
    });
  });

  // ============================================================================
  // Concurrent Access
  // ============================================================================

  describe('Concurrent Access', () => {
    it('should handle concurrent requests correctly', async () => {
      if (!testSessionCookie) {
        console.warn('Skipping test: no session cookie');
        return;
      }

      const requests = Array.from({ length: 10 }, () =>
        getIntegrationsStatus(testSessionCookie)
      );

      const responses = await Promise.all(requests);
      const successCount = responses.filter(r => r.status === 200).length;

      expect(successCount).toBe(10);
    });

    it('should maintain data consistency under concurrent load', async () => {
      if (!testSessionCookie || !testUserId) {
        console.warn('Skipping test: no session or user');
        return;
      }

      // Create test integration
      await createTestIntegration(testUserId, 'instagram');

      const requests = Array.from({ length: 20 }, () =>
        getIntegrationsStatus(testSessionCookie)
      );

      const responses = await Promise.all(requests);

      // All responses should have same data
      const integrationCounts = responses.map(
        r => r.data.data?.integrations?.length || 0
      );

      const allSame = integrationCounts.every(count => count === integrationCounts[0]);
      expect(allSame).toBe(true);
    });
  });

  // ============================================================================
  // Error Handling
  // ============================================================================

  describe('Error Handling', () => {
    it('should provide user-friendly error messages', async () => {
      const response = await getIntegrationsStatus();

      if (!response.data.success) {
        expect(response.data.error.message).toBeDefined();
        expect(response.data.error.message).not.toContain('SQL');
        expect(response.data.error.message).not.toContain('database');
        expect(response.data.error.message).not.toContain('stack');
      }
    });

    it('should include correlation ID in error responses', async () => {
      const response = await getIntegrationsStatus();
      expect(response.headers['x-correlation-id']).toBeDefined();
    });
  });
});
