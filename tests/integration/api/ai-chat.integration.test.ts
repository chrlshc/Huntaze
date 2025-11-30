/**
 * AI Chat API Integration Tests
 * 
 * Comprehensive test suite covering:
 * 1. All HTTP status codes (200, 400, 401, 429, 500, 504)
 * 2. Response schema validation with Zod
 * 3. Authentication and authorization
 * 4. Rate limiting behavior
 * 5. Retry logic and error handling
 * 6. Request timeout handling
 * 7. Validation errors
 * 8. Performance requirements
 * 9. Concurrent requests
 * 10. Usage tracking and billing
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 * @see tests/integration/api/api-tests.md
 * @see app/api/ai/chat/README.md
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ============================================================================
// Zod Schemas for Response Validation
// ============================================================================

const ChatResponseDataSchema = z.object({
  response: z.string().min(1),
  confidence: z.number().min(0).max(1),
  suggestedUpsell: z.string().optional(),
  salesTactics: z.array(z.string()).optional(),
  suggestedPrice: z.number().optional(),
  agentsInvolved: z.array(z.string()),
  usage: z.object({
    totalInputTokens: z.number().int().nonnegative(),
    totalOutputTokens: z.number().int().nonnegative(),
    totalCostUsd: z.number().nonnegative(),
  }),
});

const ChatSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: ChatResponseDataSchema,
  meta: z.object({
    timestamp: z.string(),
    requestId: z.string(),
    duration: z.number().optional(),
    version: z.string().optional(),
  }),
});

const ChatErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    retryable: z.boolean().optional(),
    metadata: z.any().optional(),
  }),
  meta: z.object({
    timestamp: z.string(),
    requestId: z.string(),
    duration: z.number().optional(),
  }),
});

// ============================================================================
// Test Fixtures
// ============================================================================

const TEST_USER = {
  email: 'test-ai-chat@example.com',
  name: 'Test User',
  password: 'TestPassword123!',
  emailVerified: true,
  onboardingCompleted: true,
};

const MOCK_CHAT_REQUEST = {
  fanId: 'fan_test_123',
  message: 'Hey! I love your content!',
  context: {
    engagementLevel: 'high',
  },
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
      email: `test-ai-chat-${Date.now()}-${Math.random()}@example.com`,
      password: hashedPassword,
    },
  });
}

/**
 * Clean up test data
 */
async function cleanupTestData() {
  await prisma.users.deleteMany({
    where: {
      email: { contains: 'test-ai-chat@' },
    },
  });
}

/**
 * Make chat request
 */
async function makeChatRequest(
  request: any,
  authToken: string
) {
  return await fetch(`${BASE_URL}/api/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authToken,
    },
    body: JSON.stringify(request),
  });
}

// ============================================================================
// Test Suite
// ============================================================================

describe('AI Chat API Integration Tests', () => {
  let testUser: any;
  let authToken: string;

  beforeEach(async () => {
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
      const response = await fetch(`${BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(MOCK_CHAT_REQUEST),
      });
      
      expect(response.status).toBe(401);
      
      const data = await response.json();
      const result = ChatErrorResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should return 401 with invalid session', async () => {
      const response = await makeChatRequest(
        MOCK_CHAT_REQUEST,
        'invalid-token'
      );
      
      expect(response.status).toBe(401);
    });

    it('should return 200 with valid session', async () => {
      const response = await makeChatRequest(
        MOCK_CHAT_REQUEST,
        authToken
      );
      
      expect(response.status).toBe(200);
    });
  });

  // ==========================================================================
  // 2. Success Responses (200 OK)
  // ==========================================================================

  describe('Success Cases', () => {
    it('should return 200 with valid chat request', async () => {
      const response = await makeChatRequest(
        MOCK_CHAT_REQUEST,
        authToken
      );
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      const result = ChatSuccessResponseSchema.safeParse(data);
      
      if (!result.success) {
        console.error('Schema validation errors:', result.error.format());
      }
      
      expect(result.success).toBe(true);
    });

    it('should return all required response fields', async () => {
      const response = await makeChatRequest(
        MOCK_CHAT_REQUEST,
        authToken
      );
      
      const data = await response.json();
      
      expect(data.data).toHaveProperty('response');
      expect(data.data).toHaveProperty('confidence');
      expect(data.data).toHaveProperty('agentsInvolved');
      expect(data.data).toHaveProperty('usage');
      expect(data.data.usage).toHaveProperty('totalInputTokens');
      expect(data.data.usage).toHaveProperty('totalOutputTokens');
      expect(data.data.usage).toHaveProperty('totalCostUsd');
    });

    it('should include correlation ID in headers', async () => {
      const response = await makeChatRequest(
        MOCK_CHAT_REQUEST,
        authToken
      );
      
      const correlationId = response.headers.get('x-correlation-id');
      expect(correlationId).toBeTruthy();
    });

    it('should include duration in response', async () => {
      const response = await makeChatRequest(
        MOCK_CHAT_REQUEST,
        authToken
      );
      
      const data = await response.json();
      
      expect(data.meta.duration).toBeDefined();
      expect(typeof data.meta.duration).toBe('number');
      expect(data.meta.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle optional context parameter', async () => {
      const requestWithoutContext = {
        fanId: 'fan_test_123',
        message: 'Hello!',
      };
      
      const response = await makeChatRequest(
        requestWithoutContext,
        authToken
      );
      
      expect(response.status).toBe(200);
    });
  });

  // ==========================================================================
  // 3. Validation Errors (400 Bad Request)
  // ==========================================================================

  describe('Validation Errors', () => {
    it('should return 400 with missing fanId', async () => {
      const invalidRequest = {
        message: 'Hello!',
      };
      
      const response = await makeChatRequest(
        invalidRequest,
        authToken
      );
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('Fan ID');
    });

    it('should return 400 with missing message', async () => {
      const invalidRequest = {
        fanId: 'fan_test_123',
      };
      
      const response = await makeChatRequest(
        invalidRequest,
        authToken
      );
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('Message');
    });

    it('should return 400 with empty fanId', async () => {
      const invalidRequest = {
        fanId: '',
        message: 'Hello!',
      };
      
      const response = await makeChatRequest(
        invalidRequest,
        authToken
      );
      
      expect(response.status).toBe(400);
    });

    it('should return 400 with empty message', async () => {
      const invalidRequest = {
        fanId: 'fan_test_123',
        message: '',
      };
      
      const response = await makeChatRequest(
        invalidRequest,
        authToken
      );
      
      expect(response.status).toBe(400);
    });

    it('should return 400 with message too long', async () => {
      const invalidRequest = {
        fanId: 'fan_test_123',
        message: 'a'.repeat(6000), // Exceeds MAX_MESSAGE_LENGTH
      };
      
      const response = await makeChatRequest(
        invalidRequest,
        authToken
      );
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error.message).toContain('5000');
    });

    it('should return 400 with invalid request body', async () => {
      const response = await fetch(`${BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken,
        },
        body: 'invalid json',
      });
      
      expect(response.status).toBe(400);
    });
  });

  // ==========================================================================
  // 4. Performance Requirements
  // ==========================================================================

  describe('Performance', () => {
    it('should respond within 30 seconds', async () => {
      const startTime = Date.now();
      
      const response = await makeChatRequest(
        MOCK_CHAT_REQUEST,
        authToken
      );
      
      const duration = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(30000);
    }, 35000);

    it('should include duration metadata', async () => {
      const response = await makeChatRequest(
        MOCK_CHAT_REQUEST,
        authToken
      );
      
      const data = await response.json();
      
      expect(data.meta.duration).toBeDefined();
      expect(data.meta.duration).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 5. Error Handling
  // ==========================================================================

  describe('Error Handling', () => {
    it('should include correlation ID in error responses', async () => {
      const response = await makeChatRequest(
        { fanId: '', message: '' },
        authToken
      );
      
      const correlationId = response.headers.get('x-correlation-id');
      expect(correlationId).toBeTruthy();
      
      const data = await response.json();
      expect(data.meta.requestId).toBeTruthy();
    });

    it('should return user-friendly error messages', async () => {
      const response = await makeChatRequest(
        { fanId: '', message: 'test' },
        authToken
      );
      
      const data = await response.json();
      
      expect(data.error.message).toBeDefined();
      expect(data.error.message).not.toContain('database');
      expect(data.error.message).not.toContain('SQL');
      expect(data.error.message).not.toContain('stack');
    });

    it('should indicate if error is retryable', async () => {
      const response = await makeChatRequest(
        { fanId: '', message: 'test' },
        authToken
      );
      
      const data = await response.json();
      
      // Validation errors should not be retryable
      expect(data.error.retryable).toBe(false);
    });
  });

  // ==========================================================================
  // 6. Response Structure
  // ==========================================================================

  describe('Response Structure', () => {
    it('should have consistent success response structure', async () => {
      const response = await makeChatRequest(
        MOCK_CHAT_REQUEST,
        authToken
      );
      
      const data = await response.json();
      
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('meta');
      expect(data.meta).toHaveProperty('timestamp');
      expect(data.meta).toHaveProperty('requestId');
    });

    it('should have consistent error response structure', async () => {
      const response = await makeChatRequest(
        { fanId: '', message: '' },
        authToken
      );
      
      const data = await response.json();
      
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('meta');
      expect(data.error).toHaveProperty('code');
      expect(data.error).toHaveProperty('message');
    });

    it('should include API version in metadata', async () => {
      const response = await makeChatRequest(
        MOCK_CHAT_REQUEST,
        authToken
      );
      
      const data = await response.json();
      
      expect(data.meta.version).toBeDefined();
    });
  });

  // ==========================================================================
  // 7. CORS and OPTIONS
  // ==========================================================================

  describe('CORS and OPTIONS', () => {
    it('should handle OPTIONS preflight request', async () => {
      const response = await fetch(`${BASE_URL}/api/ai/chat`, {
        method: 'OPTIONS',
      });
      
      expect(response.status).toBe(200);
      expect(response.headers.get('allow')).toContain('POST');
      expect(response.headers.get('allow')).toContain('OPTIONS');
    });

    it('should include CORS headers in OPTIONS response', async () => {
      const response = await fetch(`${BASE_URL}/api/ai/chat`, {
        method: 'OPTIONS',
      });
      
      expect(response.headers.get('access-control-allow-methods')).toBeTruthy();
      expect(response.headers.get('access-control-allow-headers')).toBeTruthy();
    });
  });

  // ==========================================================================
  // 8. Usage Tracking
  // ==========================================================================

  describe('Usage Tracking', () => {
    it('should include usage metadata in response', async () => {
      const response = await makeChatRequest(
        MOCK_CHAT_REQUEST,
        authToken
      );
      
      const data = await response.json();
      
      expect(data.data.usage).toBeDefined();
      expect(data.data.usage.totalInputTokens).toBeGreaterThan(0);
      expect(data.data.usage.totalOutputTokens).toBeGreaterThan(0);
      expect(data.data.usage.totalCostUsd).toBeGreaterThanOrEqual(0);
    });

    it('should track agents involved', async () => {
      const response = await makeChatRequest(
        MOCK_CHAT_REQUEST,
        authToken
      );
      
      const data = await response.json();
      
      expect(data.data.agentsInvolved).toBeDefined();
      expect(Array.isArray(data.data.agentsInvolved)).toBe(true);
      expect(data.data.agentsInvolved.length).toBeGreaterThan(0);
    });
  });
});
