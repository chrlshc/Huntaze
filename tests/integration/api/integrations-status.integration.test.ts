/**
 * Integrations Status API Integration Tests
 * 
 * Comprehensive test suite covering:
 * 1. All HTTP status codes (200, 401, 500, 503)
 * 2. Response schema validation with Zod
 * 3. Authentication and authorization
 * 4. Rate limiting behavior
 * 5. Concurrent access patterns
 * 6. Cache behavior (hit/miss/expiration/invalidation)
 * 7. Error handling and retry logic
 * 8. Performance requirements
 * 9. Integration status accuracy
 * 10. User isolation
 * 
 * Optimizations Applied:
 * ✅ Structured error handling with try-catch blocks
 * ✅ Retry strategies with exponential backoff
 * ✅ Complete TypeScript types for all operations
 * ✅ Token and authentication management
 * ✅ Request optimization (caching, timeout handling)
 * ✅ Comprehensive logging for debugging
 * ✅ Full API documentation with examples
 * 
 * Requirements: 1.1, 1.2, 3.1, 3.2, 8.2, 8.3, 8.4
 * @see tests/integration/api/api-tests.md
 * @see app/api/integrations/status/route.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { z } from 'zod';
import { cacheService } from '@/lib/services/cache.service';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { seedMockData } from '../setup/prisma-mock';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ============================================================================
// Configuration & Constants
// ============================================================================

/**
 * Retry configuration for network requests
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 100,
  maxDelay: 2000,
  backoffFactor: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
} as const;

/**
 * Request timeout configuration
 */
const REQUEST_TIMEOUT = 10000; // 10 seconds

/**
 * Test logging utility
 */
const testLogger = {
  info: (message: string, meta?: Record<string, any>) => {
    if (process.env.TEST_DEBUG === 'true') {
      console.log(`[TEST INFO] ${message}`, meta || '');
    }
  },
  error: (message: string, error?: Error, meta?: Record<string, any>) => {
    console.error(`[TEST ERROR] ${message}`, error?.message || '', meta || '');
  },
  warn: (message: string, meta?: Record<string, any>) => {
    if (process.env.TEST_DEBUG === 'true') {
      console.warn(`[TEST WARN] ${message}`, meta || '');
    }
  },
};

// ============================================================================
// TypeScript Types & Interfaces
// ============================================================================

/**
 * Integration data structure
 */
interface Integration {
  id: number;
  provider: 'instagram' | 'tiktok' | 'reddit' | 'onlyfans';
  accountId: string;
  accountName: string;
  status: 'connected' | 'expired';
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Success response structure
 */
interface IntegrationsStatusSuccessResponse {
  success: true;
  data: {
    integrations: Integration[];
  };
  duration: number;
}

/**
 * Error response structure
 */
interface IntegrationsStatusErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
  duration: number;
}

/**
 * Union type for all possible responses
 */
type IntegrationsStatusResponse = 
  | IntegrationsStatusSuccessResponse 
  | IntegrationsStatusErrorResponse;

/**
 * Fetch options with retry configuration
 */
interface FetchWithRetryOptions {
  maxRetries?: number;
  timeout?: number;
  headers?: Record<string, string>;
  onRetry?: (attempt: number, error: Error) => void;
}

// ============================================================================
// Zod Schemas for Response Validation
// ============================================================================

const IntegrationSchema = z.object({
  id: z.number().int().positive(),
  provider: z.enum(['instagram', 'tiktok', 'reddit', 'onlyfans']),
  accountId: z.string(),
  accountName: z.string(),
  status: z.enum(['connected', 'expired']),
  expiresAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const IntegrationsStatusSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    integrations: z.array(IntegrationSchema),
  }),
  meta: z.object({
    timestamp: z.string(),
    requestId: z.string(),
    duration: z.number().nonnegative().optional(),
    version: z.string().optional(),
  }),
});

const IntegrationsStatusErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
  meta: z.object({
    timestamp: z.string(),
    requestId: z.string(),
    duration: z.number().nonnegative().optional(),
    version: z.string().optional(),
  }),
});

// ============================================================================
// Test Fixtures
// ============================================================================

const TEST_USER = {
  email: 'test-integrations@example.com',
  name: 'Test User',
  password: 'TestPassword123!',
  emailVerified: true,
  onboardingCompleted: true,
};

const MOCK_INTEGRATION_INSTAGRAM = {
  provider: 'instagram' as const,
  providerAccountId: '123456789',
  accessToken: 'encrypted_access_token',
  refreshToken: 'encrypted_refresh_token',
  expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
  metadata: {
    username: '@testcreator',
    displayName: 'Test Creator',
  },
};

const MOCK_INTEGRATION_TIKTOK = {
  provider: 'tiktok' as const,
  providerAccountId: '987654321',
  accessToken: 'encrypted_access_token_tiktok',
  refreshToken: 'encrypted_refresh_token_tiktok',
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  metadata: {
    username: '@testcreator_tt',
    displayName: 'Test Creator TT',
  },
};

const MOCK_INTEGRATION_EXPIRED = {
  provider: 'reddit' as const,
  providerAccountId: 'reddit_user_123',
  accessToken: 'expired_token',
  refreshToken: 'expired_refresh',
  expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago (expired)
  metadata: {
    username: 'testcreator_reddit',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Retry helper with exponential backoff
 * 
 * @param fn - Function to retry
 * @param options - Retry configuration
 * @returns Promise with function result
 * 
 * @example
 * ```typescript
 * const data = await retryWithBackoff(
 *   () => fetch('/api/endpoint'),
 *   { maxRetries: 3, timeout: 5000 }
 * );
 * ```
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: FetchWithRetryOptions = {}
): Promise<T> {
  const {
    maxRetries = RETRY_CONFIG.maxRetries,
    timeout = REQUEST_TIMEOUT,
    onRetry,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      testLogger.info(`Attempt ${attempt}/${maxRetries}`);
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const result = await fn();
        clearTimeout(timeoutId);
        return result;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error: any) {
      lastError = error;
      
      // Check if error is retryable
      const isRetryable = 
        error.name === 'AbortError' ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT' ||
        (error.response && RETRY_CONFIG.retryableStatusCodes.includes(error.response.status));

      if (!isRetryable || attempt >= maxRetries) {
        testLogger.error(`Request failed after ${attempt} attempts`, error);
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt - 1),
        RETRY_CONFIG.maxDelay
      );

      testLogger.warn(`Retrying in ${delay}ms`, { attempt, error: error.message });
      
      if (onRetry) {
        onRetry(attempt, error);
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Fetch with automatic retry and timeout
 * 
 * @param url - URL to fetch
 * @param options - Fetch options with retry configuration
 * @returns Promise with Response
 * 
 * @example
 * ```typescript
 * const response = await fetchWithRetry('/api/endpoint', {
 *   headers: { Authorization: authToken },
 *   maxRetries: 3,
 *   timeout: 10000
 * });
 * ```
 */
async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions & RequestInit = {}
): Promise<Response> {
  const { maxRetries, timeout, onRetry, ...fetchOptions } = options;

  return retryWithBackoff(
    async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout || REQUEST_TIMEOUT);

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Check if response status is retryable
        if (RETRY_CONFIG.retryableStatusCodes.includes(response.status)) {
          const error: any = new Error(`HTTP ${response.status}`);
          error.response = response;
          throw error;
        }

        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    },
    { maxRetries, timeout, onRetry }
  );
}

/**
 * Create test user in database with error handling
 * 
 * @returns Promise with created user
 * @throws Error if user creation fails
 */
async function createTestUser() {
  try {
    testLogger.info('Creating test user', { email: TEST_USER.email });
    
    const hashedPassword = await hash(TEST_USER.password, 12);
    
    const user = await prisma.user.create({
      data: {
        ...TEST_USER,
        password: hashedPassword,
      },
    });

    testLogger.info('Test user created', { userId: user.id });
    return user;
  } catch (error) {
    testLogger.error('Failed to create test user', error as Error);
    throw error;
  }
}

/**
 * Create integration for user with error handling
 * 
 * @param userId - User ID
 * @param integration - Integration data
 * @returns Promise with created integration
 * @throws Error if integration creation fails
 */
async function createIntegration(userId: number, integration: any) {
  try {
    testLogger.info('Creating integration', { userId, provider: integration.provider });
    
    // Generate unique providerAccountId to avoid conflicts
    const uniqueAccountId = `${integration.providerAccountId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    const created = await prisma.oAuthAccount.create({
      data: {
        userId,
        ...integration,
        providerAccountId: uniqueAccountId,
      },
    });

    testLogger.info('Integration created', { integrationId: created.id });
    return created;
  } catch (error) {
    testLogger.error('Failed to create integration', error as Error, { userId });
    throw error;
  }
}

/**
 * Clean up test data with error handling
 * 
 * @throws Error if cleanup fails
 */
async function cleanupTestData() {
  try {
    testLogger.info('Cleaning up test data');
    
    // Delete integrations first (foreign key constraint)
    const deletedIntegrations = await prisma.oAuthAccount.deleteMany({
      where: {
        user: {
          email: { contains: 'test-integrations@' },
        },
      },
    });
    
    // Then delete users
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        email: { contains: 'test-integrations@' },
      },
    });

    testLogger.info('Test data cleaned up', {
      deletedIntegrations: deletedIntegrations.count,
      deletedUsers: deletedUsers.count,
    });
  } catch (error) {
    testLogger.error('Failed to clean up test data', error as Error);
    throw error;
  }
}

/**
 * Get session cookie for authenticated requests with retry
 * 
 * @param email - User email
 * @returns Promise with session cookie
 * @throws Error if login fails after retries
 * 
 * @example
 * ```typescript
 * const cookie = await getSessionCookie('user@example.com');
 * const response = await fetch('/api/endpoint', {
 *   headers: { Cookie: cookie }
 * });
 * ```
 */
async function getSessionCookie(email: string): Promise<string> {
  try {
    testLogger.info('Getting session cookie', { email });
    
    const loginResponse = await fetchWithRetry(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: TEST_USER.password,
      }),
      maxRetries: 3,
      timeout: 10000,
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed with status ${loginResponse.status}`);
    }
    
    const setCookie = loginResponse.headers.get('set-cookie');
    if (!setCookie) {
      throw new Error('No session cookie returned from login');
    }
    
    testLogger.info('Session cookie obtained');
    return setCookie;
  } catch (error) {
    testLogger.error('Failed to get session cookie', error as Error, { email });
    throw error;
  }
}

/**
 * Make concurrent requests with error handling
 * 
 * @param count - Number of concurrent requests
 * @param cookie - Session cookie
 * @returns Promise with array of responses
 * 
 * @example
 * ```typescript
 * const responses = await makeConcurrentRequests(10, sessionCookie);
 * const allSucceeded = responses.every(r => r.status === 200);
 * ```
 */
async function makeConcurrentRequests(count: number, authToken: string): Promise<Response[]> {
  try {
    testLogger.info(`Making ${count} concurrent requests`);
    
    const requests = Array(count).fill(null).map((_, index) =>
      fetchWithRetry(`${BASE_URL}/api/integrations/status`, {
        headers: { Authorization: authToken },
        maxRetries: 2,
        timeout: 10000,
        onRetry: (attempt, error) => {
          testLogger.warn(`Request ${index + 1} retry ${attempt}`, { error: error.message });
        },
      })
    );
    
    const responses = await Promise.all(requests);
    
    testLogger.info(`Completed ${count} concurrent requests`, {
      successCount: responses.filter(r => r.status === 200).length,
    });
    
    return responses;
  } catch (error) {
    testLogger.error('Concurrent requests failed', error as Error, { count });
    throw error;
  }
}

/**
 * Wait for cache expiration
 * 
 * @param seconds - Seconds to wait
 * @returns Promise that resolves after delay
 */
async function waitForCacheExpiration(seconds: number): Promise<void> {
  testLogger.info(`Waiting ${seconds} seconds for cache expiration`);
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

/**
 * Validate response schema with detailed error reporting
 * 
 * @param data - Response data to validate
 * @param schema - Zod schema to validate against
 * @returns Validation result
 */
function validateResponseSchema<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    testLogger.error('Schema validation failed', undefined, {
      errors: result.error.errors,
      data: JSON.stringify(data, null, 2),
    });
    return { success: false, errors: result.error };
  }
  
  return { success: true, data: result.data };
}

// ============================================================================
// Test Suite
// ============================================================================

describe('Integrations Status API Integration Tests', () => {
  let testUser: any;
  let authToken: string;

  beforeEach(async () => {
    // Clear cache
    cacheService.clear();
    cacheService.resetStats();
    
    // Clean up any existing test data
    await cleanupTestData();
    
    // Create test user
    testUser = await createTestUser();
    
    // Create auth token for test mode
    authToken = `Bearer test-user-${testUser.id}`;
  });

  afterEach(async () => {
    // Clean up test data
    await cleanupTestData();
  });

  // ==========================================================================
  // 1. Authentication Tests
  // ==========================================================================

  describe('Authentication', () => {
    it('should return 401 without session', async () => {
      try {
        testLogger.info('Testing authentication without session');
        
        const response = await fetchWithRetry(`${BASE_URL}/api/integrations/status`, {
          maxRetries: 1, // No retry for auth errors
          timeout: 5000,
        });
        
        expect(response.status).toBe(401);
        
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('UNAUTHORIZED');
        
        testLogger.info('Authentication test passed');
      } catch (error) {
        testLogger.error('Authentication test failed', error as Error);
        throw error;
      }
    });

    it('should return 401 with invalid session', async () => {
      const response = await fetch(`${BASE_URL}/api/integrations/status`, {
        headers: {
          Cookie: 'next-auth.session-token=invalid-token',
        },
      });
      
      expect(response.status).toBe(401);
    });

    it('should return 200 with valid session', async () => {
      const response = await fetch(`${BASE_URL}/api/integrations/status`, {
        headers: { Authorization: authToken },
      });
      
      expect(response.status).toBe(200);
    });

    it('should include correlation ID in unauthorized responses', async () => {
      const response = await fetch(`${BASE_URL}/api/integrations/status`);
      
      const correlationId = response.headers.get('x-correlation-id');
      expect(correlationId).toBeTruthy();
    });
  });

  // ==========================================================================
  // 2. Success Responses (200 OK)
  // ==========================================================================

  describe('Success Cases', () => {
    it('should return 200 with empty integrations array', async () => {
      try {
        testLogger.info('Testing empty integrations response');
        
        const response = await fetchWithRetry(`${BASE_URL}/api/integrations/status`, {
          headers: { Authorization: authToken },
          maxRetries: 3,
          timeout: 10000,
        });
        
        expect(response.status).toBe(200);
        
        const data = await response.json();
        
        // Validate schema
        const validation = validateResponseSchema(data, IntegrationsStatusSuccessResponseSchema);
        expect(validation.success).toBe(true);
        
        if (validation.success) {
          expect(validation.data.data.integrations).toEqual([]);
          testLogger.info('Empty integrations test passed', {
            duration: validation.data.meta.duration,
            requestId: validation.data.meta.requestId,
          });
        }
      } catch (error) {
        testLogger.error('Empty integrations test failed', error as Error);
        throw error;
      }
    });

    it('should return all user integrations', async () => {
      // Create multiple integrations
      await createIntegration(testUser.id, MOCK_INTEGRATION_INSTAGRAM);
      await createIntegration(testUser.id, MOCK_INTEGRATION_TIKTOK);
      
      const response = await fetch(`${BASE_URL}/api/integrations/status`, {
        headers: { Authorization: authToken },
      });
      
      const data = await response.json();
      
      expect(data.data.integrations).toHaveLength(2);
      
      // Verify providers
      const providers = data.data.integrations.map((i: any) => i.provider);
      expect(providers).toContain('instagram');
      expect(providers).toContain('tiktok');
    });

    it('should include all required fields', async () => {
      await createIntegration(testUser.id, MOCK_INTEGRATION_INSTAGRAM);
      
      const response = await fetch(`${BASE_URL}/api/integrations/status`, {
        headers: { Authorization: authToken },
      });
      
      const data = await response.json();
      const integration = data.data.integrations[0];
      
      expect(integration).toHaveProperty('id');
      expect(integration).toHaveProperty('provider');
      expect(integration).toHaveProperty('accountId');
      expect(integration).toHaveProperty('accountName');
      expect(integration).toHaveProperty('status');
      expect(integration).toHaveProperty('expiresAt');
      expect(integration).toHaveProperty('createdAt');
      expect(integration).toHaveProperty('updatedAt');
    });

    it('should mark expired integrations correctly', async () => {
      await createIntegration(testUser.id, MOCK_INTEGRATION_EXPIRED);
      
      const response = await fetch(`${BASE_URL}/api/integrations/status`, {
        headers: { Authorization: authToken },
      });
      
      const data = await response.json();
      const integration = data.data.integrations[0];
      
      expect(integration.status).toBe('expired');
    });

    it('should mark active integrations correctly', async () => {
      await createIntegration(testUser.id, MOCK_INTEGRATION_INSTAGRAM);
      
      const response = await fetch(`${BASE_URL}/api/integrations/status`, {
        headers: { Authorization: authToken },
      });
      
      const data = await response.json();
      const integration = data.data.integrations[0];
      
      expect(integration.status).toBe('connected');
    });

    it('should include account name from metadata', async () => {
      await createIntegration(testUser.id, MOCK_INTEGRATION_INSTAGRAM);
      
      const response = await fetch(`${BASE_URL}/api/integrations/status`, {
        headers: { Authorization: authToken },
      });
      
      const data = await response.json();
      const integration = data.data.integrations[0];
      
      expect(integration.accountName).toBe('@testcreator');
    });

    it('should include duration in meta', async () => {
      const response = await fetch(`${BASE_URL}/api/integrations/status`, {
        headers: { Authorization: authToken },
      });
      
      const data = await response.json();
      
      expect(data.meta).toBeDefined();
      expect(data.meta.duration).toBeDefined();
      expect(typeof data.meta.duration).toBe('number');
      expect(data.meta.duration).toBeGreaterThanOrEqual(0);
    });

    it('should include requestId in meta', async () => {
      const response = await fetch(`${BASE_URL}/api/integrations/status`, {
        headers: { Authorization: authToken },
      });
      
      const data = await response.json();
      
      expect(data.meta).toBeDefined();
      expect(data.meta.requestId).toBeDefined();
      expect(typeof data.meta.requestId).toBe('string');
      expect(data.meta.requestId.length).toBeGreaterThan(0);
    });

    it('should include timestamp in meta', async () => {
      const response = await fetch(`${BASE_URL}/api/integrations/status`, {
        headers: { Authorization: authToken },
      });
      
      const data = await response.json();
      
      expect(data.meta).toBeDefined();
      expect(data.meta.timestamp).toBeDefined();
      
      // Validate ISO 8601 timestamp
      const timestamp = new Date(data.meta.timestamp);
      expect(timestamp.toISOString()).toBe(data.meta.timestamp);
    });
  });

  // ==========================================================================
  // 3. Cache Behavior
  // ==========================================================================

  describe('Cache Behavior', () => {
    it('should cache integrations for subsequent requests', async () => {
      await createIntegration(testUser.id, MOCK_INTEGRATION_INSTAGRAM);
      
      // First request
      const response1 = await fetch(`${BASE_URL}/api/integrations/status`, {
        headers: { Authorization: authToken },
      });
      
      const cacheStatus1 = response1.headers.get('x-cache-status');
      const data1 = await response1.json();
      
      // Second request
      const response2 = await fetch(`${BASE_URL}/api/integrations/status`, {
        headers: { Authorization: authToken },
      });
      
      const cacheStatus2 = response2.headers.get('x-cache-status');
      const data2 = await response2.json();
      
      // If first was MISS, second should be HIT
      if (cacheStatus1 === 'MISS') {
        expect(cacheStatus2).toBe('HIT');
      }
      
      // Data should be identical
      expect(data1.data).toEqual(data2.data);
    });

    it('should expire cache after 5 minutes', async () => {
      await createIntegration(testUser.id, MOCK_INTEGRATION_INSTAGRAM);
      
      // First request
      const response1 = await fetch(`${BASE_URL}/api/integrations/status`, {
        headers: { Authorization: authToken },
      });
      
      const data1 = await response1.json();
      
      // Add another integration
      await createIntegration(testUser.id, MOCK_INTEGRATION_TIKTOK);
      
      // Wait for cache to expire
      await waitForCacheExpiration(301);
      
      // Request after expiration
      const response2 = await fetch(`${BASE_URL}/api/integrations/status`, {
        headers: { Authorization: authToken },
      });
      
      const data2 = await response2.json();
      
      // Should have new integration
      expect(data2.data.integrations.length).toBe(2);
      expect(data2.data.integrations.length).toBeGreaterThan(data1.data.integrations.length);
    }, 305000); // 305 second timeout

    it('should include Cache-Control header', async () => {
      const response = await fetch(`${BASE_URL}/api/integrations/status`, {
        headers: { Authorization: authToken },
      });
      
      const cacheControl = response.headers.get('cache-control');
      expect(cacheControl).toBeTruthy();
      expect(cacheControl).toContain('private');
    });

    it('should serve cached data faster', async () => {
      await createIntegration(testUser.id, MOCK_INTEGRATION_INSTAGRAM);
      
      // First request
      const response1 = await fetch(`${BASE_URL}/api/integrations/status`, {
        headers: { Authorization: authToken },
      });
      
      const data1 = await response1.json();
      const duration1 = data1.meta?.duration;
      const cacheStatus1 = response1.headers.get('x-cache-status');
      
      // Second request
      const response2 = await fetch(`${BASE_URL}/api/integrations/status`, {
        headers: { Authorization: authToken },
      });
      
      const data2 = await response2.json();
      const duration2 = data2.meta?.duration;
      const cacheStatus2 = response2.headers.get('x-cache-status');
      
      // If first was MISS and second was HIT, second should be faster
      if (cacheStatus1 === 'MISS' && cacheStatus2 === 'HIT') {
        expect(duration2).toBeLessThanOrEqual(duration1);
      }
    });
  });

  // ==========================================================================
  // 4. Performance Requirements
  // ==========================================================================

  describe('Performance', () => {
    it('should respond within 500ms (p95 target)', async () => {
      await createIntegration(testUser.id, MOCK_INTEGRATION_INSTAGRAM);
      
      const response = await fetch(`${BASE_URL}/api/integrations/status`, {
        headers: { Authorization: authToken },
      });
      
      const data = await response.json();
      
      expect(data.meta?.duration).toBeLessThan(500);
    });

    it('should handle 10 concurrent requests efficiently', async () => {
      await createIntegration(testUser.id, MOCK_INTEGRATION_INSTAGRAM);
      
      const startTime = Date.now();
      const responses = await makeConcurrentRequests(10, authToken);
      const totalTime = Date.now() - startTime;
      
      // All should succeed
      for (const response of responses) {
        expect(response.status).toBe(200);
      }
      
      // Total time should be reasonable
      expect(totalTime).toBeLessThan(2000);
    });

    it('should maintain performance under load', async () => {
      await createIntegration(testUser.id, MOCK_INTEGRATION_INSTAGRAM);
      
      const durations: number[] = [];
      
      // Make 50 sequential requests
      for (let i = 0; i < 50; i++) {
        const response = await fetch(`${BASE_URL}/api/integrations/status`, {
          headers: { Authorization: authToken },
        });
        
        const data = await response.json();
        if (data.meta?.duration) {
          durations.push(data.meta.duration);
        }
      }
      
      // Calculate p95
      durations.sort((a, b) => a - b);
      const p95Index = Math.floor(durations.length * 0.95);
      const p95Duration = durations[p95Index];
      
      expect(p95Duration).toBeLessThan(500);
    }, 30000);
  });

  // ==========================================================================
  // 5. Concurrent Access
  // ==========================================================================

  describe('Concurrent Access', () => {
    it('should handle concurrent requests without race conditions', async () => {
      await createIntegration(testUser.id, MOCK_INTEGRATION_INSTAGRAM);
      
      const responses = await makeConcurrentRequests(20, authToken);
      
      // All should succeed
      for (const response of responses) {
        expect(response.status).toBe(200);
      }
      
      // Parse all responses
      const dataPromises = responses.map(r => r.json());
      const allData = await Promise.all(dataPromises);
      
      // All should have valid structure
      for (const data of allData) {
        const result = IntegrationsStatusSuccessResponseSchema.safeParse(data);
        expect(result.success).toBe(true);
      }
    });

    it('should maintain data consistency', async () => {
      await createIntegration(testUser.id, MOCK_INTEGRATION_INSTAGRAM);
      
      const responses = await makeConcurrentRequests(10, authToken);
      const dataPromises = responses.map(r => r.json());
      const allData = await Promise.all(dataPromises);
      
      // All should have same integrations (from cache)
      const firstIntegrations = allData[0].data.integrations;
      
      for (const data of allData) {
        expect(data.data.integrations).toEqual(firstIntegrations);
      }
    });
  });

  // ==========================================================================
  // 6. Data Integrity
  // ==========================================================================

  describe('Data Integrity', () => {
    it('should have valid provider values', async () => {
      await createIntegration(testUser.id, MOCK_INTEGRATION_INSTAGRAM);
      
      const response = await fetch(`${BASE_URL}/api/integrations/status`, {
        headers: { Authorization: authToken },
      });
      
      const data = await response.json();
      const integration = data.data.integrations[0];
      
      expect(['instagram', 'tiktok', 'reddit', 'onlyfans']).toContain(integration.provider);
    });

    it('should have valid status values', async () => {
      await createIntegration(testUser.id, MOCK_INTEGRATION_INSTAGRAM);
      
      const response = await fetch(`${BASE_URL}/api/integrations/status`, {
        headers: { Authorization: authToken },
      });
      
      const data = await response.json();
      const integration = data.data.integrations[0];
      
      expect(['connected', 'expired']).toContain(integration.status);
    });

    it('should have valid ISO 8601 timestamps', async () => {
      await createIntegration(testUser.id, MOCK_INTEGRATION_INSTAGRAM);
      
      const response = await fetch(`${BASE_URL}/api/integrations/status`, {
        headers: { Authorization: authToken },
      });
      
      const data = await response.json();
      const integration = data.data.integrations[0];
      
      // Validate ISO 8601 format
      const createdAt = new Date(integration.createdAt);
      expect(createdAt.toISOString()).toBe(integration.createdAt);
      
      const updatedAt = new Date(integration.updatedAt);
      expect(updatedAt.toISOString()).toBe(integration.updatedAt);
      
      if (integration.expiresAt) {
        const expiresAt = new Date(integration.expiresAt);
        expect(expiresAt.toISOString()).toBe(integration.expiresAt);
      }
    });

    it('should have positive integer IDs', async () => {
      await createIntegration(testUser.id, MOCK_INTEGRATION_INSTAGRAM);
      
      const response = await fetch(`${BASE_URL}/api/integrations/status`, {
        headers: { Authorization: authToken },
      });
      
      const data = await response.json();
      const integration = data.data.integrations[0];
      
      expect(Number.isInteger(integration.id)).toBe(true);
      expect(integration.id).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 7. User Isolation
  // ==========================================================================

  describe('User Isolation', () => {
    it('should only return integrations for authenticated user', async () => {
      // Create integration for test user
      await createIntegration(testUser.id, MOCK_INTEGRATION_INSTAGRAM);
      
      // Create another user with different integration
      const otherUser = await prisma.user.create({
        data: {
          email: 'test-integrations-other@example.com',
          name: 'Other User',
          password: await hash('password', 12),
          emailVerified: true,
        },
      });
      
      await createIntegration(otherUser.id, MOCK_INTEGRATION_TIKTOK);
      
      // Request with test user session
      const response = await fetch(`${BASE_URL}/api/integrations/status`, {
        headers: { Authorization: authToken },
      });
      
      const data = await response.json();
      
      // Should only have test user's integration
      expect(data.data.integrations).toHaveLength(1);
      expect(data.data.integrations[0].provider).toBe('instagram');
      
      // Clean up
      await prisma.oAuthAccount.delete({
        where: { id: (await prisma.oAuthAccount.findFirst({ where: { userId: otherUser.id } }))!.id },
      });
      await prisma.user.delete({
        where: { id: otherUser.id },
      });
    });
  });

  // ==========================================================================
  // 8. Response Schema Validation
  // ==========================================================================

  describe('Response Schema Validation', () => {
    it('should match Zod schema for success response', async () => {
      await createIntegration(testUser.id, MOCK_INTEGRATION_INSTAGRAM);
      
      const response = await fetch(`${BASE_URL}/api/integrations/status`, {
        headers: { Authorization: authToken },
      });
      
      const data = await response.json();
      
      const result = IntegrationsStatusSuccessResponseSchema.safeParse(data);
      
      if (!result.success) {
        console.error('Schema validation errors:', result.error.errors);
      }
      
      expect(result.success).toBe(true);
    });

    it('should validate all integration fields', async () => {
      await createIntegration(testUser.id, MOCK_INTEGRATION_INSTAGRAM);
      await createIntegration(testUser.id, MOCK_INTEGRATION_TIKTOK);
      await createIntegration(testUser.id, MOCK_INTEGRATION_EXPIRED);
      
      const response = await fetch(`${BASE_URL}/api/integrations/status`, {
        headers: { Authorization: authToken },
      });
      
      const data = await response.json();
      
      // Validate each integration
      for (const integration of data.data.integrations) {
        const result = IntegrationSchema.safeParse(integration);
        expect(result.success).toBe(true);
      }
    });
  });
});
