/**
 * Message Packs Checkout API - Integration Tests
 * 
 * Tests for POST /api/billing/message-packs/checkout
 * 
 * Coverage:
 * - ✅ Request validation (Zod schemas)
 * - ✅ All HTTP status codes (200, 400, 500)
 * - ✅ Stripe integration
 * - ✅ Error handling
 * - ✅ Retry logic
 * - ✅ Rate limiting
 * - ✅ Concurrent requests
 * - ✅ Configuration validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST } from '@/app/api/billing/message-packs/checkout/route';
import { NextRequest } from 'next/server';
import Stripe from 'stripe';

// ============================================================================
// Mocks
// ============================================================================

// Mock Stripe
vi.mock('stripe', () => {
  const mockStripe = {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
    errors: {
      StripeError: class StripeError extends Error {
        type: string;
        statusCode?: number;
        constructor(message: string, type: string = 'api_error', statusCode?: number) {
          super(message);
          this.type = type;
          this.statusCode = statusCode;
        }
      },
    },
  };

  return {
    default: vi.fn(() => mockStripe),
  };
});

// ============================================================================
// Test Fixtures
// ============================================================================

const VALID_PACKS = ['25k', '100k', '500k'] as const;

const MOCK_ENV = {
  STRIPE_SECRET_KEY: 'sk_test_mock_key',
  STRIPE_PRICE_MSGPACK_25K: 'price_mock_25k',
  STRIPE_PRICE_MSGPACK_100K: 'price_mock_100k',
  STRIPE_PRICE_MSGPACK_500K: 'price_mock_500k',
  DEMO_STRIPE_CUSTOMER_ID: 'cus_mock_demo',
  NEXT_PUBLIC_APP_URL: 'https://test.huntaze.com',
};

const MOCK_SESSION = {
  id: 'cs_test_mock_session_id',
  url: 'https://checkout.stripe.com/pay/cs_test_mock',
  customer: 'cus_mock_demo',
  mode: 'payment',
  status: 'open',
};

// ============================================================================
// Helper Functions
// ============================================================================

function createMockRequest(body: any, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost:3000/api/billing/message-packs/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function setupMockStripe(mockImplementation?: any) {
  const Stripe = vi.mocked(require('stripe').default);
  const mockStripeInstance = new Stripe();
  
  if (mockImplementation) {
    vi.mocked(mockStripeInstance.checkout.sessions.create).mockImplementation(mockImplementation);
  } else {
    vi.mocked(mockStripeInstance.checkout.sessions.create).mockResolvedValue(MOCK_SESSION as any);
  }
  
  return mockStripeInstance;
}

// ============================================================================
// Tests
// ============================================================================

describe('POST /api/billing/message-packs/checkout', () => {
  beforeEach(() => {
    // Setup environment variables
    Object.entries(MOCK_ENV).forEach(([key, value]) => {
      process.env[key] = value;
    });
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // 1. Successful Requests (200)
  // ==========================================================================

  describe('Successful Requests', () => {
    it('should create checkout session for 25k pack', async () => {
      setupMockStripe();
      
      const request = createMockRequest({ pack: '25k' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.url).toBe(MOCK_SESSION.url);
      expect(data.sessionId).toBe(MOCK_SESSION.id);
      expect(data.correlationId).toBeDefined();
    });

    it('should create checkout session for 100k pack', async () => {
      setupMockStripe();
      
      const request = createMockRequest({ pack: '100k' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should create checkout session for 500k pack', async () => {
      setupMockStripe();
      
      const request = createMockRequest({ pack: '500k' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should accept custom customer ID', async () => {
      setupMockStripe();
      
      const customerId = 'cus_custom_123';
      const request = createMockRequest({
        pack: '25k',
        customerId,
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should accept custom metadata', async () => {
      setupMockStripe();
      
      const request = createMockRequest({
        pack: '25k',
        metadata: {
          userId: 'user_123',
          source: 'dashboard',
        },
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should include correlation ID in response', async () => {
      setupMockStripe();
      
      const request = createMockRequest({ pack: '25k' });
      const response = await POST(request);
      const data = await response.json();

      expect(data.correlationId).toBeDefined();
      expect(data.correlationId).toMatch(/^billing-\d+-[a-z0-9]+$/);
    });

    it('should call Stripe with correct parameters', async () => {
      const mockStripe = setupMockStripe();
      
      const request = createMockRequest({ pack: '25k' });
      await POST(request);

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'payment',
          customer: MOCK_ENV.DEMO_STRIPE_CUSTOMER_ID,
          line_items: [
            {
              price: MOCK_ENV.STRIPE_PRICE_MSGPACK_25K,
              quantity: 1,
            },
          ],
          success_url: expect.stringContaining('/billing/packs/success'),
          cancel_url: expect.stringContaining('/billing/packs'),
          metadata: expect.objectContaining({
            pack: '25k',
            messages: '25000',
            packName: 'Starter Pack',
          }),
        })
      );
    });
  });

  // ==========================================================================
  // 2. Validation Errors (400)
  // ==========================================================================

  describe('Validation Errors', () => {
    it('should reject missing pack field', async () => {
      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
      expect(data.correlationId).toBeDefined();
    });

    it('should reject invalid pack type', async () => {
      const request = createMockRequest({ pack: 'invalid' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid request');
    });

    it('should reject non-string pack', async () => {
      const request = createMockRequest({ pack: 123 });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject invalid customerId type', async () => {
      const request = createMockRequest({
        pack: '25k',
        customerId: 123,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject invalid metadata type', async () => {
      const request = createMockRequest({
        pack: '25k',
        metadata: 'invalid',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/billing/message-packs/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject empty request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/billing/message-packs/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '',
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  // ==========================================================================
  // 3. Configuration Errors (500)
  // ==========================================================================

  describe('Configuration Errors', () => {
    it('should fail if STRIPE_SECRET_KEY is missing', async () => {
      delete process.env.STRIPE_SECRET_KEY;
      
      const request = createMockRequest({ pack: '25k' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should fail if price ID is not configured', async () => {
      delete process.env.STRIPE_PRICE_MSGPACK_25K;
      
      const request = createMockRequest({ pack: '25k' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Service configuration error');
    });

    it('should fail if customer ID is missing and no demo customer', async () => {
      delete process.env.DEMO_STRIPE_CUSTOMER_ID;
      
      const request = createMockRequest({ pack: '25k' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  // ==========================================================================
  // 4. Stripe Errors
  // ==========================================================================

  describe('Stripe Errors', () => {
    it('should handle Stripe API error', async () => {
      const mockStripe = setupMockStripe();
      const StripeError = require('stripe').default.errors.StripeError;
      
      vi.mocked(mockStripe.checkout.sessions.create).mockRejectedValue(
        new StripeError('API error', 'api_error', 500)
      );
      
      const request = createMockRequest({ pack: '25k' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Payment processing error');
    });

    it('should handle Stripe connection error', async () => {
      const mockStripe = setupMockStripe();
      const StripeError = require('stripe').default.errors.StripeError;
      
      vi.mocked(mockStripe.checkout.sessions.create).mockRejectedValue(
        new StripeError('Connection failed', 'StripeConnectionError', 503)
      );
      
      const request = createMockRequest({ pack: '25k' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
    });

    it('should handle Stripe rate limit error', async () => {
      const mockStripe = setupMockStripe();
      const StripeError = require('stripe').default.errors.StripeError;
      
      vi.mocked(mockStripe.checkout.sessions.create).mockRejectedValue(
        new StripeError('Rate limit exceeded', 'rate_limit', 429)
      );
      
      const request = createMockRequest({ pack: '25k' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
    });

    it('should handle Stripe authentication error', async () => {
      const mockStripe = setupMockStripe();
      const StripeError = require('stripe').default.errors.StripeError;
      
      vi.mocked(mockStripe.checkout.sessions.create).mockRejectedValue(
        new StripeError('Invalid API key', 'authentication_error', 401)
      );
      
      const request = createMockRequest({ pack: '25k' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });

  // ==========================================================================
  // 5. Retry Logic
  // ==========================================================================

  describe('Retry Logic', () => {
    it('should retry on network error and succeed', async () => {
      const mockStripe = setupMockStripe();
      
      // Fail twice, succeed on third attempt
      vi.mocked(mockStripe.checkout.sessions.create)
        .mockRejectedValueOnce(new Error('network error'))
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValueOnce(MOCK_SESSION as any);
      
      const request = createMockRequest({ pack: '25k' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledTimes(3);
    });

    it('should not retry on validation error', async () => {
      const mockStripe = setupMockStripe();
      const StripeError = require('stripe').default.errors.StripeError;
      
      vi.mocked(mockStripe.checkout.sessions.create).mockRejectedValue(
        new StripeError('Invalid request', 'invalid_request_error', 400)
      );
      
      const request = createMockRequest({ pack: '25k' });
      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledTimes(1);
    });

    it('should fail after max retries', async () => {
      const mockStripe = setupMockStripe();
      
      vi.mocked(mockStripe.checkout.sessions.create).mockRejectedValue(
        new Error('network error')
      );
      
      const request = createMockRequest({ pack: '25k' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledTimes(3);
    });
  });

  // ==========================================================================
  // 6. Concurrent Requests
  // ==========================================================================

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent requests', async () => {
      setupMockStripe();
      
      const requests = VALID_PACKS.map(pack =>
        POST(createMockRequest({ pack }))
      );
      
      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle 10 concurrent requests for same pack', async () => {
      setupMockStripe();
      
      const requests = Array(10).fill(null).map(() =>
        POST(createMockRequest({ pack: '25k' }))
      );
      
      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should generate unique correlation IDs for concurrent requests', async () => {
      setupMockStripe();
      
      const requests = Array(5).fill(null).map(() =>
        POST(createMockRequest({ pack: '25k' }))
      );
      
      const responses = await Promise.all(requests);
      const correlationIds = await Promise.all(
        responses.map(async r => (await r.json()).correlationId)
      );
      
      const uniqueIds = new Set(correlationIds);
      expect(uniqueIds.size).toBe(5);
    });
  });

  // ==========================================================================
  // 7. Response Schema Validation
  // ==========================================================================

  describe('Response Schema Validation', () => {
    it('should return valid success response schema', async () => {
      setupMockStripe();
      
      const request = createMockRequest({ pack: '25k' });
      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('url');
      expect(data).toHaveProperty('sessionId');
      expect(data).toHaveProperty('correlationId');
      expect(data.success).toBe(true);
      expect(typeof data.url).toBe('string');
      expect(typeof data.sessionId).toBe('string');
      expect(typeof data.correlationId).toBe('string');
    });

    it('should return valid error response schema', async () => {
      const request = createMockRequest({ pack: 'invalid' });
      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('correlationId');
      expect(data.success).toBe(false);
      expect(typeof data.error).toBe('string');
      expect(typeof data.correlationId).toBe('string');
    });

    it('should not expose sensitive data in error response', async () => {
      delete process.env.STRIPE_SECRET_KEY;
      
      const request = createMockRequest({ pack: '25k' });
      const response = await POST(request);
      const data = await response.json();

      expect(data.error).not.toContain('STRIPE_SECRET_KEY');
      expect(data.error).not.toContain('sk_');
      expect(JSON.stringify(data)).not.toContain('password');
      expect(JSON.stringify(data)).not.toContain('secret');
    });
  });

  // ==========================================================================
  // 8. Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle very long metadata values', async () => {
      setupMockStripe();
      
      const request = createMockRequest({
        pack: '25k',
        metadata: {
          longValue: 'a'.repeat(1000),
        },
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle special characters in metadata', async () => {
      setupMockStripe();
      
      const request = createMockRequest({
        pack: '25k',
        metadata: {
          special: '!@#$%^&*()_+-=[]{}|;:,.<>?',
        },
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle unicode characters in metadata', async () => {
      setupMockStripe();
      
      const request = createMockRequest({
        pack: '25k',
        metadata: {
          unicode: '你好世界 🎉 مرحبا',
        },
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  // ==========================================================================
  // 9. Performance Tests
  // ==========================================================================

  describe('Performance', () => {
    it('should respond within 5 seconds', async () => {
      setupMockStripe();
      
      const startTime = Date.now();
      const request = createMockRequest({ pack: '25k' });
      await POST(request);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000);
    });

    it('should respond within 1 second for successful request', async () => {
      setupMockStripe();
      
      const startTime = Date.now();
      const request = createMockRequest({ pack: '25k' });
      await POST(request);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000);
    });
  });
});
