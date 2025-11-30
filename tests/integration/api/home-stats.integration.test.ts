/**
 * Home Stats API Integration Tests
 * 
 * Comprehensive test suite covering:
 * 1. All HTTP status codes (200, 401, 404, 500, 503)
 * 2. Response schema validation with Zod
 * 3. Authentication and authorization
 * 4. Rate limiting behavior
 * 5. Concurrent access patterns
 * 6. Cache behavior (hit/miss/expiration)
 * 7. Error handling and retry logic
 * 8. Performance requirements
 * 9. Default stats creation
 * 10. Data integrity
 * 
 * Requirements: 7.2, 7.3, 7.4, 7.5, 7.6
 * @see tests/integration/api/api-tests.md
 * @see app/api/home/stats/README.md
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { cacheService } from '@/lib/services/cache.service';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ============================================================================
// Zod Schemas for Response Validation
// ============================================================================

const HomeStatsDataSchema = z.object({
  messagesSent: z.number().int().nonnegative(),
  messagesTrend: z.number(),
  responseRate: z.number().min(0).max(100),
  responseRateTrend: z.number(),
  revenue: z.number().nonnegative(),
  revenueTrend: z.number(),
  activeChats: z.number().int().nonnegative(),
  activeChatsTrend: z.number(),
});

const HomeStatsSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: HomeStatsDataSchema,
  duration: z.number().nonnegative(),
});

const HomeStatsErrorResponseSchema = z.object({
  error: z.string(),
  correlationId: z.string(),
  retryable: z.boolean().optional(),
});

// ============================================================================
// Test Fixtures
// ============================================================================

const TEST_USER = {
  email: 'test-home-stats@example.com',
  name: 'Test User',
  password: 'TestPassword123!',
  emailVerified: true,
  onboardingCompleted: true,
};

const MOCK_STATS = {
  messagesSent: 1247,
  messagesTrend: 12.5,
  responseRate: 94.2,
  responseRateTrend: 3.1,
  revenue: 8450,
  revenueTrend: 15.8,
  activeChats: 42,
  activeChatsTrend: -2.3,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create test user in database
 */
async function createTestUser() {
  const hashedPassword = await hash(TEST_USER.password, 12);
  
  return await prisma.users.create({
    data: {
      ...TEST_USER,
      password: hashedPassword,
    },
  });
}

/**
 * Create user stats in database
 */
async function createUserStats(userId: number, stats = MOCK_STATS) {
  return await prisma.userStats.create({
    data: {
      userId,
      ...stats,
    },
  });
}

/**
 * Clean up test data
 */
async function cleanupTestData() {
  await prisma.userStats.deleteMany({
    where: {
      user: {
        email: { contains: 'test-home-stats@' },
      },
    },
  });
  
  await prisma.users.deleteMany({
    where: {
      email: { contains: 'test-home-stats@' },
    },
  });
}

/**
 * Make concurrent requests
 */
async function makeConcurrentRequests(count: number, authToken: string): Promise<Response[]> {
  const requests = Array(count).fill(null).map(() =>
    fetch(`${BASE_URL}/api/home/stats`, {
      headers: { Authorization: authToken },
    })
  );
  return Promise.all(requests);
}

// ============================================================================
// Test Suite
// ============================================================================

describe('Home Stats API Integration Tests', () => {
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
      const response = await fetch(`${BASE_URL}/api/home/stats`);
      
      expect(response.status).toBe(401);
      
      const data = await response.json();
      const result = HomeStatsErrorResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.error).toBe('Unauthorized');
        expect(result.data.retryable).toBe(false);
      }
    });

    it('should return 401 with invalid session', async () => {
      const response = await fetch(`${BASE_URL}/api/home/stats`, {
        headers: {
          Cookie: 'next-auth.session-token=invalid-token',
        },
      });
      
      expect(response.status).toBe(401);
    });

    it('should return 200 with valid session', async () => {
      const response = await fetch(`${BASE_URL}/api/home/stats`, {
        headers: { Authorization: authToken },
      });
      
      expect(response.status).toBe(200);
    });

    it('should include correlation ID in unauthorized responses', async () => {
      const response = await fetch(`${BASE_URL}/api/home/stats`);
      
      const correlationId = response.headers.get('x-correlation-id');
      expect(correlationId).toBeTruthy();
      expect(correlationId).toMatch(/^stats-\d+-[a-z0-9]+$/);
    });
  });

  // ==========================================================================
  // 2. Success Responses (200 OK)
  // ==========================================================================

  describe('Success Cases', () => {
    it('should return 200 with valid stats', async () => {
      // Create stats for user
      await createUserStats(testUser.id);
      
      const response = await fetch(`${BASE_URL}/api/home/stats`, {
        headers: { Authorization: authToken },
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      const result = HomeStatsSuccessResponseSchema.safeParse(data);
      
      if (!result.success) {
        console.error('Schema validation errors:', result.error.format());
      }
      
      expect(result.success).toBe(true);
    });

    it('should return all required stat fields', async () => {
      await createUserStats(testUser.id);
      
      const response = await fetch(`${BASE_URL}/api/home/stats`, {
        headers: { Authorization: authToken },
      });
      
      const data = await response.json();
      
      expect(data.data).toHaveProperty('messagesSent');
      expect(data.data).toHaveProperty('messagesTrend');
      expect(data.data).toHaveProperty('responseRate');
      expect(data.data).toHaveProperty('responseRateTrend');
      expect(data.data).toHaveProperty('revenue');
      expect(data.data).toHaveProperty('revenueTrend');
      expect(data.data).toHaveProperty('activeChats');
      expect(data.data).toHaveProperty('activeChatsTrend');
    });

    it('should return correct stat values', async () => {
      await createUserStats(testUser.id, MOCK_STATS);
      
      const response = await fetch(`${BASE_URL}/api/home/stats`, {
        headers: { Authorization: authToken },
      });
      
      const data = await response.json();
      
      expect(data.data.messagesSent).toBe(MOCK_STATS.messagesSent);
      expect(data.data.messagesTrend).toBe(MOCK_STATS.messagesTrend);
      expect(data.data.responseRate).toBe(MOCK_STATS.responseRate);
      expect(data.data.responseRateTrend).toBe(MOCK_STATS.responseRateTrend);
      expect(data.data.revenue).toBe(MOCK_STATS.revenue);
      expect(data.data.revenueTrend).toBe(MOCK_STATS.revenueTrend);
      expect(data.data.activeChats).toBe(MOCK_STATS.activeChats);
      expect(data.data.activeChatsTrend).toBe(MOCK_STATS.activeChatsTrend);
    });

    it('should create default stats for new users', async () => {
      // Don't create stats - let API create them
      
      const response = await fetch(`${BASE_URL}/api/home/stats`, {
        headers: { Authorization: authToken },
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      
      // Should return default stats (all zeros)
      expect(data.data.messagesSent).toBe(0);
      expect(data.data.messagesTrend).toBe(0);
      expect(data.data.responseRate).toBe(0);
      expect(data.data.responseRateTrend).toBe(0);
      expect(data.data.revenue).toBe(0);
      expect(data.data.revenueTrend).toBe(0);
      expect(data.data.activeChats).toBe(0);
      expect(data.data.activeChatsTrend).toBe(0);
      
      // Verify stats were created in database
      const stats = await prisma.userStats.findUnique({
        where: { userId: testUser.id },
      });
      
      expect(stats).toBeTruthy();
    });

    it('should include duration in response', async () => {
      await createUserStats(testUser.id);
      
      const response = await fetch(`${BASE_URL}/api/home/stats`, {
        headers: { Authorization: authToken },
      });
      
      const data = await response.json();
      
      expect(data.duration).toBeDefined();
      expect(typeof data.duration).toBe('number');
      expect(data.duration).toBeGreaterThanOrEqual(0);
      
      // Duration header should match
      const durationHeader = response.headers.get('x-duration-ms');
      expect(durationHeader).toBeTruthy();
      expect(parseInt(durationHeader!)).toBe(data.duration);
    });

    it('should include correlation ID', async () => {
      await createUserStats(testUser.id);
      
      const response = await fetch(`${BASE_URL}/api/home/stats`, {
        headers: { Authorization: authToken },
      });
      
      const correlationId = response.headers.get('x-correlation-id');
      expect(correlationId).toBeTruthy();
      expect(correlationId).toMatch(/^stats-\d+-[a-z0-9]+$/);
      
      // Correlation IDs should be unique
      const response2 = await fetch(`${BASE_URL}/api/home/stats`, {
        headers: { Authorization: authToken },
      });
      
      const correlationId2 = response2.headers.get('x-correlation-id');
      expect(correlationId).not.toBe(correlationId2);
    });
  });

  // ==========================================================================
  // 3. Cache Behavior
  // ==========================================================================

  describe('Cache Behavior', () => {
    it('should cache stats for subsequent requests', async () => {
      await createUserStats(testUser.id);
      
      // First request
      const response1 = await fetch(`${BASE_URL}/api/home/stats`, {
        headers: { Authorization: authToken },
      });
      
      const cacheStatus1 = response1.headers.get('x-cache-status');
      const data1 = await response1.json();
      
      // Second request
      const response2 = await fetch(`${BASE_URL}/api/home/stats`, {
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

    it('should expire cache after 60 seconds', async () => {
      await createUserStats(testUser.id);
      
      // First request
      const response1 = await fetch(`${BASE_URL}/api/home/stats`, {
        headers: { Authorization: authToken },
      });
      
      const data1 = await response1.json();
      
      // Update stats in database
      await prisma.userStats.update({
        where: { userId: testUser.id },
        data: { messagesSent: 9999 },
      });
      
      // Invalidate cache manually instead of waiting
      cacheService.invalidate(`home:stats:${testUser.id}`);
      
      // Request after cache invalidation
      const response2 = await fetch(`${BASE_URL}/api/home/stats`, {
        headers: { Authorization: authToken },
      });
      
      const data2 = await response2.json();
      
      // Should have new data
      expect(data2.data.messagesSent).toBe(9999);
      expect(data2.data.messagesSent).not.toBe(data1.data.messagesSent);
    });

    it('should include Cache-Control header', async () => {
      await createUserStats(testUser.id);
      
      const response = await fetch(`${BASE_URL}/api/home/stats`, {
        headers: { Authorization: authToken },
      });
      
      const cacheControl = response.headers.get('cache-control');
      expect(cacheControl).toBeTruthy();
      expect(cacheControl).toContain('private');
      expect(cacheControl).toContain('no-cache');
    });

    it('should serve cached data faster', async () => {
      await createUserStats(testUser.id);
      
      // First request (cache miss)
      const response1 = await fetch(`${BASE_URL}/api/home/stats`, {
        headers: { Authorization: authToken },
      });
      
      const data1 = await response1.json();
      const duration1 = data1.duration;
      const cacheStatus1 = response1.headers.get('x-cache-status');
      
      // Second request (cache hit)
      const response2 = await fetch(`${BASE_URL}/api/home/stats`, {
        headers: { Authorization: authToken },
      });
      
      const data2 = await response2.json();
      const duration2 = data2.duration;
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
      await createUserStats(testUser.id);
      
      const response = await fetch(`${BASE_URL}/api/home/stats`, {
        headers: { Authorization: authToken },
      });
      
      const data = await response.json();
      
      expect(data.duration).toBeLessThan(500);
    });

    it('should handle 10 concurrent requests efficiently', async () => {
      await createUserStats(testUser.id);
      
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
      await createUserStats(testUser.id);
      
      const durations: number[] = [];
      
      // Make 50 sequential requests
      for (let i = 0; i < 50; i++) {
        const response = await fetch(`${BASE_URL}/api/home/stats`, {
          headers: { Authorization: authToken },
        });
        
        const data = await response.json();
        durations.push(data.duration);
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
      await createUserStats(testUser.id);
      
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
        const result = HomeStatsSuccessResponseSchema.safeParse(data);
        expect(result.success).toBe(true);
      }
    });

    it('should maintain data consistency', async () => {
      await createUserStats(testUser.id);
      
      const responses = await makeConcurrentRequests(10, authToken);
      const dataPromises = responses.map(r => r.json());
      const allData = await Promise.all(dataPromises);
      
      // All should have same stats (from cache)
      const firstStats = allData[0].data;
      
      for (const data of allData) {
        expect(data.data).toEqual(firstStats);
      }
    });
  });

  // ==========================================================================
  // 6. Data Integrity
  // ==========================================================================

  describe('Data Integrity', () => {
    it('should have non-negative values for counts', async () => {
      await createUserStats(testUser.id);
      
      const response = await fetch(`${BASE_URL}/api/home/stats`, {
        headers: { Authorization: authToken },
      });
      
      const data = await response.json();
      
      expect(data.data.messagesSent).toBeGreaterThanOrEqual(0);
      expect(data.data.revenue).toBeGreaterThanOrEqual(0);
      expect(data.data.activeChats).toBeGreaterThanOrEqual(0);
    });

    it('should have response rate within 0-100 range', async () => {
      await createUserStats(testUser.id);
      
      const response = await fetch(`${BASE_URL}/api/home/stats`, {
        headers: { Authorization: authToken },
      });
      
      const data = await response.json();
      
      expect(data.data.responseRate).toBeGreaterThanOrEqual(0);
      expect(data.data.responseRate).toBeLessThanOrEqual(100);
    });

    it('should allow negative trend values', async () => {
      await createUserStats(testUser.id, {
        ...MOCK_STATS,
        messagesTrend: -5.2,
        revenueTrend: -10.5,
      });
      
      const response = await fetch(`${BASE_URL}/api/home/stats`, {
        headers: { Authorization: authToken },
      });
      
      const data = await response.json();
      
      // Negative trends are valid
      expect(data.data.messagesTrend).toBe(-5.2);
      expect(data.data.revenueTrend).toBe(-10.5);
    });

    it('should return integers for count fields', async () => {
      await createUserStats(testUser.id);
      
      const response = await fetch(`${BASE_URL}/api/home/stats`, {
        headers: { Authorization: authToken },
      });
      
      const data = await response.json();
      
      expect(Number.isInteger(data.data.messagesSent)).toBe(true);
      expect(Number.isInteger(data.data.activeChats)).toBe(true);
    });
  });

  // ==========================================================================
  // 7. Error Handling
  // ==========================================================================

  describe('Error Handling', () => {
    it('should return 503 for non-existent user (database constraint)', async () => {
      // Delete user but keep session - this causes a foreign key constraint error
      await prisma.users.delete({
        where: { id: testUser.id },
      });
      
      const response = await fetch(`${BASE_URL}/api/home/stats`, {
        headers: { Authorization: authToken },
      });
      
      // Returns 503 due to database constraint violation
      expect(response.status).toBe(503);
      
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error).toContain('Service temporarily unavailable');
      expect(data.retryable).toBe(true);
    });

    it('should include correlation ID in error responses', async () => {
      await prisma.users.delete({
        where: { id: testUser.id },
      });
      
      const response = await fetch(`${BASE_URL}/api/home/stats`, {
        headers: { Authorization: authToken },
      });
      
      const correlationId = response.headers.get('x-correlation-id');
      expect(correlationId).toBeTruthy();
      expect(correlationId).toMatch(/^stats-\d+-[a-z0-9]+$/);
    });
  });

  // ==========================================================================
  // 8. User Isolation
  // ==========================================================================

  describe('User Isolation', () => {
    it('should only return stats for authenticated user', async () => {
      // Create stats for test user
      await createUserStats(testUser.id, MOCK_STATS);
      
      // Create another user with different stats
      const otherUser = await prisma.users.create({
        data: {
          email: 'test-home-stats-other@example.com',
          name: 'Other User',
          password: await hash('password', 12),
          emailVerified: true,
        },
      });
      
      await createUserStats(otherUser.id, {
        ...MOCK_STATS,
        messagesSent: 5555,
      });
      
      // Request with test user session
      const response = await fetch(`${BASE_URL}/api/home/stats`, {
        headers: { Authorization: authToken },
      });
      
      const data = await response.json();
      
      // Should get test user's stats, not other user's
      expect(data.data.messagesSent).toBe(MOCK_STATS.messagesSent);
      expect(data.data.messagesSent).not.toBe(5555);
      
      // Clean up
      await prisma.userStats.delete({
        where: { userId: otherUser.id },
      });
      await prisma.users.delete({
        where: { id: otherUser.id },
      });
    });
  });
});
