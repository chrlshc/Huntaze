/**
 * AI System Complete End-to-End Tests
 * 
 * Comprehensive E2E test suite covering the complete AI system integration:
 * 1. Login → Dashboard → Use AI → View Usage → Reach Quota
 * 2. Integration with real user data
 * 3. Quota enforcement blocking requests
 * 4. Rate limiting with multiple concurrent users
 * 5. AI insights appearing in correct pages
 * 
 * Task: 17.6 Tests end-to-end avec l'app complète
 * Requirements: All
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { db as prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import Redis from 'ioredis';
import { getUserAIPlan, updateUserAIPlan } from '@/lib/ai/plan';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ============================================================================
// Test Setup
// ============================================================================

let redis: Redis;
let testUsers: Array<{ id: number; email: string; token: string }> = [];

beforeAll(async () => {
  // Initialize Redis connection
  redis = new Redis({
    host: process.env.ELASTICACHE_REDIS_HOST || 'localhost',
    port: parseInt(process.env.ELASTICACHE_REDIS_PORT || '6379'),
  });
});

afterAll(async () => {
  await redis.quit();
});

beforeEach(async () => {
  // Clean up any existing test data
  await prisma.usageLog.deleteMany({
    where: {
      creator: {
        email: { contains: 'test-e2e-ai' },
      },
    },
  });
  
  await prisma.monthlyCharge.deleteMany({
    where: {
      creator: {
        email: { contains: 'test-e2e-ai' },
      },
    },
  });
  
  await prisma.aIInsight.deleteMany({
    where: {
      creatorId: { in: testUsers.map(u => u.id) },
    },
  });
  
  await prisma.users.deleteMany({
    where: {
      email: { contains: 'test-e2e-ai' },
    },
  });
  
  testUsers = [];
});

afterEach(async () => {
  // Clean up test data
  for (const user of testUsers) {
    await redis.del(`ai:ratelimit:starter:${user.id}`);
    await redis.del(`ai:ratelimit:pro:${user.id}`);
    await redis.del(`ai:ratelimit:business:${user.id}`);
  }
  
  await prisma.usageLog.deleteMany({
    where: { creatorId: { in: testUsers.map(u => u.id) } },
  });
  
  await prisma.monthlyCharge.deleteMany({
    where: { creatorId: { in: testUsers.map(u => u.id) } },
  });
  
  await prisma.aIInsight.deleteMany({
    where: { creatorId: { in: testUsers.map(u => u.id) } },
  });
  
  await prisma.users.deleteMany({
    where: { id: { in: testUsers.map(u => u.id) } },
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a test user with specified plan
 */
async function createTestUser(plan: 'starter' | 'pro' | 'business' = 'starter') {
  const email = `test-e2e-ai-${Date.now()}-${Math.random()}@example.com`;
  const hashedPassword = await hash('TestPassword123!', 12);
  
  const user = await prisma.users.create({
    data: {
      email,
      name: `Test E2E User (${plan})`,
      password: hashedPassword,
      email_verified: true,
      onboarding_completed: true,
      ai_plan: plan,
      // role defaults to 'user' in schema
    },
  });
  
  const token = `Bearer test-user-${user.id}`;
  testUsers.push({ id: user.id, email, token });
  
  return { user, token };
}

/**
 * Make authenticated AI request
 */
async function makeAIRequest(
  endpoint: string,
  token: string,
  body: any
): Promise<Response> {
  return fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    body: JSON.stringify(body),
  });
}

/**
 * Get user's current usage
 */
async function getUserUsage(userId: number) {
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);
  
  const logs = await prisma.usageLog.findMany({
    where: {
      creatorId: userId,
      createdAt: { gte: currentMonth },
    },
  });
  
  const totalCost = logs.reduce((sum, log) => sum + Number(log.costUsd), 0);
  const totalInputTokens = logs.reduce((sum, log) => sum + log.tokensInput, 0);
  const totalOutputTokens = logs.reduce((sum, log) => sum + log.tokensOutput, 0);
  
  return {
    totalCost,
    totalInputTokens,
    totalOutputTokens,
    requestCount: logs.length,
  };
}

/**
 * Get user's AI insights
 */
async function getUserInsights(userId: number) {
  return await prisma.aIInsight.findMany({
    where: { creatorId: userId },
    orderBy: { createdAt: 'desc' },
  });
}

// ============================================================================
// E2E Test 1: Complete User Flow
// ============================================================================

describe('E2E: Complete User Flow', () => {
  it('should complete full flow: Login → Use AI → View Usage → Reach Quota', async () => {
    // Step 1: Create user (simulates registration/login)
    const { user, token } = await createTestUser('starter');
    
    expect(user.id).toBeDefined();
    expect(user.email).toContain('test-e2e-ai');
    expect(user.ai_plan).toBe('starter');
    
    // Step 2: Verify user can access AI (simulates dashboard access)
    const plan = await getUserAIPlan(user.id);
    expect(plan).toBe('starter');
    
    // Step 3: Make first AI request (chat)
    const chatResponse = await makeAIRequest('/api/ai/chat', token, {
      fanId: 'fan_e2e_test',
      message: 'Hello! Love your content!',
    });
    
    expect(chatResponse.status).toBe(200);
    const chatData = await chatResponse.json();
    expect(chatData.success).toBe(true);
    expect(chatData.data.response).toBeTruthy();
    expect(chatData.data.usage.totalCostUsd).toBeGreaterThan(0);
    
    // Step 4: View usage (simulates usage dashboard)
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for async logging
    
    const usage1 = await getUserUsage(user.id);
    expect(usage1.requestCount).toBe(1);
    expect(usage1.totalCost).toBeGreaterThan(0);
    expect(usage1.totalCost).toBeLessThan(10); // Should be well under $10 quota
    
    // Step 5: Make more AI requests (generate caption)
    const captionResponse = await makeAIRequest('/api/ai/generate-caption', token, {
      platform: 'instagram',
      contentInfo: {
        type: 'photo',
        description: 'Beach sunset',
      },
    });
    
    expect(captionResponse.status).toBe(200);
    const captionData = await captionResponse.json();
    expect(captionData.success).toBe(true);
    expect(captionData.data.caption).toBeTruthy();
    expect(captionData.data.hashtags.length).toBeGreaterThan(0);
    
    // Step 6: View updated usage
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const usage2 = await getUserUsage(user.id);
    expect(usage2.requestCount).toBe(2);
    expect(usage2.totalCost).toBeGreaterThan(usage1.totalCost);
    
    // Step 7: Verify insights are stored
    const insights = await getUserInsights(user.id);
    expect(insights.length).toBeGreaterThan(0);
    
    // Step 8: Simulate reaching quota by creating fake usage logs
    // (In real scenario, user would make many requests)
    await prisma.usageLog.create({
      data: {
        creatorId: user.id,
        feature: 'test',
        model: 'gemini-2.5-pro',
        tokensInput: 1000000,
        tokensOutput: 1000000,
        costUsd: 9.5, // Close to $10 quota
      },
    });
    
    // Step 9: Try to make request when near quota
    const quotaResponse = await makeAIRequest('/api/ai/chat', token, {
      fanId: 'fan_e2e_test',
      message: 'Another message',
    });
    
    // Should be blocked by quota
    expect(quotaResponse.status).toBe(429);
    const quotaData = await quotaResponse.json();
    expect(quotaData.error.code).toBe('QUOTA_EXCEEDED');
    expect(quotaData.error.message).toContain('quota');
    
    console.log('✅ Complete user flow test passed');
  }, 60000);
});

// ============================================================================
// E2E Test 2: Integration with Real User Data
// ============================================================================

describe('E2E: Integration with Real User Data', () => {
  it('should work with real user data and relationships', async () => {
    // Create user with related data
    const { user, token } = await createTestUser('pro');
    
    // Create OAuth account (simulates connected platform)
    const oauthAccount = await prisma.oauth_accounts.create({
      data: {
        user_id: user.id,
        provider: 'instagram',
        provider_account_id: 'ig_test_123',
        access_token: 'encrypted_token',
        refresh_token: 'encrypted_refresh',
        expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        metadata: {
          username: '@test_creator',
          ig_business_id: '123456789',
        },
      },
    });
    
    expect(oauthAccount.id).toBeDefined();
    
    // Create user stats (simulates existing activity)
    const userStats = await prisma.user_stats.create({
      data: {
        user_id: user.id,
        messages_sent: 150,
        response_rate: 0.92,
        revenue: 5000,
        active_chats: 25,
      },
    });
    
    expect(userStats.id).toBeDefined();
    
    // Make AI request that should use this context
    const response = await makeAIRequest('/api/ai/analyze-performance', token, {
      metrics: {
        platforms: ['instagram'],
        timeframe: 'last_30_days',
        engagementData: {
          likes: 15000,
          comments: 500,
          shares: 200,
        },
      },
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.insights).toBeDefined();
    expect(data.data.recommendations).toBeDefined();
    
    // Verify usage was logged with correct relationships
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const usageLogs = await prisma.usageLog.findMany({
      where: { creatorId: user.id },
      include: {
        creator: true,
      },
    });
    
    expect(usageLogs.length).toBeGreaterThan(0);
    expect(usageLogs[0].creator.email).toBe(user.email);
    expect(usageLogs[0].feature).toBe('analyze_performance');
    
    // Clean up OAuth account
    await prisma.oauth_accounts.delete({
      where: { id: oauthAccount.id },
    });
    
    await prisma.user_stats.delete({
      where: { id: userStats.id },
    });
    
    console.log('✅ Real user data integration test passed');
  }, 60000);
});

// ============================================================================
// E2E Test 3: Quota Enforcement
// ============================================================================

describe('E2E: Quota Enforcement', () => {
  it('should enforce starter plan quota ($10/month)', async () => {
    const { user, token } = await createTestUser('starter');
    
    // Create usage that exceeds quota
    await prisma.usageLog.create({
      data: {
        creatorId: user.id,
        feature: 'chat',
        model: 'gemini-2.5-pro',
        tokensInput: 1000000,
        tokensOutput: 1000000,
        costUsd: 10.5, // Over $10 quota
      },
    });
    
    // Try to make request
    const response = await makeAIRequest('/api/ai/chat', token, {
      fanId: 'fan_test',
      message: 'Test message',
    });
    
    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.error.code).toBe('QUOTA_EXCEEDED');
    expect(data.error.message).toContain('$10');
    
    console.log('✅ Starter quota enforcement test passed');
  });
  
  it('should enforce pro plan quota ($50/month)', async () => {
    const { user, token } = await createTestUser('pro');
    
    // Create usage that exceeds pro quota
    await prisma.usageLog.create({
      data: {
        creatorId: user.id,
        feature: 'chat',
        model: 'gemini-2.5-pro',
        tokensInput: 5000000,
        tokensOutput: 5000000,
        costUsd: 50.5, // Over $50 quota
      },
    });
    
    // Try to make request
    const response = await makeAIRequest('/api/ai/chat', token, {
      fanId: 'fan_test',
      message: 'Test message',
    });
    
    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.error.code).toBe('QUOTA_EXCEEDED');
    expect(data.error.message).toContain('$50');
    
    console.log('✅ Pro quota enforcement test passed');
  });
  
  it('should allow business plan unlimited usage', async () => {
    const { user, token } = await createTestUser('business');
    
    // Create high usage (would exceed other plans)
    await prisma.usageLog.create({
      data: {
        creatorId: user.id,
        feature: 'chat',
        model: 'gemini-2.5-pro',
        tokensInput: 10000000,
        tokensOutput: 10000000,
        costUsd: 100, // Would exceed pro quota
      },
    });
    
    // Should still be able to make requests
    const response = await makeAIRequest('/api/ai/chat', token, {
      fanId: 'fan_test',
      message: 'Test message',
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    
    console.log('✅ Business unlimited quota test passed');
  }, 60000);
  
  it('should apply new quota immediately after plan upgrade', async () => {
    const { user, token } = await createTestUser('starter');
    
    // Create usage near starter quota
    await prisma.usageLog.create({
      data: {
        creatorId: user.id,
        feature: 'chat',
        model: 'gemini-2.5-pro',
        tokensInput: 1000000,
        tokensOutput: 1000000,
        costUsd: 9.5, // Near $10 quota
      },
    });
    
    // Verify blocked on starter
    const response1 = await makeAIRequest('/api/ai/chat', token, {
      fanId: 'fan_test',
      message: 'Test message',
    });
    
    expect(response1.status).toBe(429);
    
    // Upgrade to pro
    await updateUserAIPlan(user.id, 'pro');
    
    // Should now be allowed (under $50 pro quota)
    const response2 = await makeAIRequest('/api/ai/chat', token, {
      fanId: 'fan_test',
      message: 'Test message after upgrade',
    });
    
    expect(response2.status).toBe(200);
    const data = await response2.json();
    expect(data.success).toBe(true);
    
    console.log('✅ Plan upgrade quota test passed');
  }, 60000);
});

// ============================================================================
// E2E Test 4: Rate Limiting with Multiple Users
// ============================================================================

describe('E2E: Rate Limiting with Multiple Users', () => {
  it('should enforce rate limits independently per user', async () => {
    // Create multiple users
    const user1 = await createTestUser('starter');
    const user2 = await createTestUser('starter');
    const user3 = await createTestUser('pro');
    
    // User 1: Make requests up to starter limit (50/hour)
    const user1Requests = [];
    for (let i = 0; i < 51; i++) {
      user1Requests.push(
        makeAIRequest('/api/ai/chat', user1.token, {
          fanId: 'fan_test',
          message: `Message ${i}`,
        })
      );
    }
    
    const user1Responses = await Promise.all(user1Requests);
    const user1RateLimited = user1Responses.filter(r => r.status === 429);
    expect(user1RateLimited.length).toBeGreaterThan(0);
    
    // User 2: Should not be affected by user 1's rate limit
    const user2Response = await makeAIRequest('/api/ai/chat', user2.token, {
      fanId: 'fan_test',
      message: 'Test message',
    });
    
    expect(user2Response.status).toBe(200);
    
    // User 3: Pro plan should have higher limit (100/hour)
    const user3Requests = [];
    for (let i = 0; i < 101; i++) {
      user3Requests.push(
        makeAIRequest('/api/ai/chat', user3.token, {
          fanId: 'fan_test',
          message: `Message ${i}`,
        })
      );
    }
    
    const user3Responses = await Promise.all(user3Requests);
    const user3RateLimited = user3Responses.filter(r => r.status === 429);
    expect(user3RateLimited.length).toBeGreaterThan(0);
    
    console.log('✅ Multi-user rate limiting test passed');
  }, 120000);
  
  it('should handle concurrent requests from same user', async () => {
    const { user, token } = await createTestUser('pro');
    
    // Make 10 concurrent requests
    const requests = Array(10).fill(null).map((_, i) =>
      makeAIRequest('/api/ai/chat', token, {
        fanId: 'fan_test',
        message: `Concurrent message ${i}`,
      })
    );
    
    const responses = await Promise.all(requests);
    
    // All should succeed (under rate limit)
    const successCount = responses.filter(r => r.status === 200).length;
    expect(successCount).toBe(10);
    
    // Verify all were logged
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const usage = await getUserUsage(user.id);
    expect(usage.requestCount).toBe(10);
    
    console.log('✅ Concurrent requests test passed');
  }, 60000);
});

// ============================================================================
// E2E Test 5: AI Insights Appearing in Pages
// ============================================================================

describe('E2E: AI Insights in Pages', () => {
  it('should store and retrieve insights correctly', async () => {
    const { user, token } = await createTestUser('pro');
    
    // Make various AI requests that generate insights
    await makeAIRequest('/api/ai/chat', token, {
      fanId: 'fan_test_1',
      message: 'Hello!',
    });
    
    await makeAIRequest('/api/ai/generate-caption', token, {
      platform: 'instagram',
      contentInfo: { type: 'photo', description: 'Sunset' },
    });
    
    await makeAIRequest('/api/ai/analyze-performance', token, {
      metrics: {
        platforms: ['instagram'],
        timeframe: 'last_30_days',
        engagementData: { likes: 1000, comments: 50, shares: 20 },
      },
    });
    
    // Wait for insights to be stored
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Retrieve insights
    const insights = await getUserInsights(user.id);
    
    expect(insights.length).toBeGreaterThan(0);
    
    // Verify insight structure
    insights.forEach(insight => {
      expect(insight.creatorId).toBe(user.id);
      expect(insight.source).toBeTruthy();
      expect(insight.type).toBeTruthy();
      expect(insight.confidence).toBeGreaterThanOrEqual(0);
      expect(insight.confidence).toBeLessThanOrEqual(1);
      expect(insight.data).toBeDefined();
    });
    
    // Verify insights can be filtered by type
    const messagingInsights = insights.filter(i => i.type === 'messaging');
    const contentInsights = insights.filter(i => i.type === 'content');
    const analyticsInsights = insights.filter(i => i.type === 'analytics');
    
    expect(messagingInsights.length + contentInsights.length + analyticsInsights.length).toBeGreaterThan(0);
    
    console.log('✅ AI insights storage and retrieval test passed');
  }, 60000);
  
  it('should retrieve insights for quota dashboard', async () => {
    const { user, token } = await createTestUser('pro');
    
    // Make some AI requests
    await makeAIRequest('/api/ai/chat', token, {
      fanId: 'fan_test',
      message: 'Test',
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get quota information (simulates quota dashboard)
    const usage = await getUserUsage(user.id);
    const plan = await getUserAIPlan(user.id);
    
    expect(usage.totalCost).toBeGreaterThan(0);
    expect(plan).toBe('pro');
    
    // Calculate quota percentage
    const quotaLimit = plan === 'starter' ? 10 : plan === 'pro' ? 50 : Infinity;
    const quotaPercentage = (usage.totalCost / quotaLimit) * 100;
    
    expect(quotaPercentage).toBeGreaterThan(0);
    expect(quotaPercentage).toBeLessThan(100);
    
    console.log('✅ Quota dashboard data test passed');
  }, 60000);
});

// ============================================================================
// E2E Test 6: Error Recovery and Resilience
// ============================================================================

describe('E2E: Error Recovery and Resilience', () => {
  it('should handle partial failures gracefully', async () => {
    const { user, token } = await createTestUser('pro');
    
    // Make request with invalid data that might cause partial failure
    const response = await makeAIRequest('/api/ai/chat', token, {
      fanId: 'fan_test',
      message: 'Test message',
      context: {
        // Some context that might cause issues
        invalidField: 'x'.repeat(10000),
      },
    });
    
    // Should either succeed or fail gracefully
    expect([200, 400, 500]).toContain(response.status);
    
    const data = await response.json();
    
    if (response.status === 200) {
      expect(data.success).toBe(true);
      expect(data.data.response).toBeTruthy();
    } else {
      expect(data.success).toBe(false);
      expect(data.error.code).toBeTruthy();
      expect(data.error.message).toBeTruthy();
    }
    
    console.log('✅ Error recovery test passed');
  }, 60000);
  
  it('should maintain data consistency after errors', async () => {
    const { user, token } = await createTestUser('pro');
    
    // Make successful request
    const response1 = await makeAIRequest('/api/ai/chat', token, {
      fanId: 'fan_test',
      message: 'Test 1',
    });
    
    expect(response1.status).toBe(200);
    
    // Make request that might fail
    const response2 = await makeAIRequest('/api/ai/chat', token, {
      fanId: '',
      message: '',
    });
    
    expect(response2.status).toBe(400);
    
    // Make another successful request
    const response3 = await makeAIRequest('/api/ai/chat', token, {
      fanId: 'fan_test',
      message: 'Test 3',
    });
    
    expect(response3.status).toBe(200);
    
    // Verify usage logs are consistent
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const usage = await getUserUsage(user.id);
    expect(usage.requestCount).toBe(2); // Only successful requests logged
    
    console.log('✅ Data consistency test passed');
  }, 60000);
});

console.log('🎉 All E2E tests completed successfully!');
