/**
 * Billing Checkout API - Unit Tests
 * 
 * Tests for the optimized billing checkout endpoint with:
 * - Request validation
 * - Error handling
 * - Retry logic
 * - Stripe integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import Stripe from 'stripe';

// Mock Stripe
vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          create: vi.fn(),
        },
      },
    })),
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
      StripeConnectionError: class StripeConnectionError extends Error {
        type = 'StripeConnectionError';
      },
      StripeAPIError: class StripeAPIError extends Error {
        type = 'StripeAPIError';
      },
    },
  };
});

// Mock environment variables
process.env.STRIPE_SECRET_KEY = 'sk_test_123';
process.env.STRIPE_PRICE_MSGPACK_25K = 'price_25k';
process.env.STRIPE_PRICE_MSGPACK_100K = 'price_100k';
process.env.STRIPE_PRICE_MSGPACK_500K = 'price_500k';
process.env.DEMO_STRIPE_CUSTOMER_ID = 'cus_demo';
process.env.NEXT_PUBLIC_APP_URL = 'https://test.com';

describe('Billing Checkout API', () => {
  let mockStripeCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    const StripeConstructor = vi.mocked(Stripe);
    const stripeInstance = new StripeConstructor('sk_test_123', { apiVersion: '2023-10-16' });
    mockStripeCreate = vi.mocked(stripeInstance.checkout.sessions.create);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Request Validation', () => {
    it('should validate pack type', async () => {
      const request = new NextRequest('http://localhost/api/billing/message-packs/checkout', {
        method: 'POST',
        body: JSON.stringify({ pack: 'invalid' }),
      });

      const { POST } = await import('../../../app/api/billing/message-packs/checkout/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid request');
      expect(data.correlationId).toBeDefined();
    });

    it('should accept valid pack types', async () => {
      mockStripeCreate.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      } as any);

      const validPacks = ['25k', '100k', '500k'];

      for (const pack of validPacks) {
        const request = new NextRequest('http://localhost/api/billing/message-packs/checkout', {
          method: 'POST',
          body: JSON.stringify({ pack }),
        });

        const { POST } = await import('../../../app/api/billing/message-packs/checkout/route');
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      }
    });

    it('should handle missing request body', async () => {
      const request = new NextRequest('http://localhost/api/billing/message-packs/checkout', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const { POST } = await import('../../../app/api/billing/message-packs/checkout/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should accept optional customerId', async () => {
      mockStripeCreate.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      } as any);

      const request = new NextRequest('http://localhost/api/billing/message-packs/checkout', {
        method: 'POST',
        body: JSON.stringify({
          pack: '25k',
          customerId: 'cus_custom',
        }),
      });

      const { POST } = await import('../../../app/api/billing/message-packs/checkout/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Configuration Validation', () => {
    it('should return error if price ID not configured', async () => {
      const originalEnv = process.env.STRIPE_PRICE_MSGPACK_25K;
      delete process.env.STRIPE_PRICE_MSGPACK_25K;

      const request = new NextRequest('http://localhost/api/billing/message-packs/checkout', {
        method: 'POST',
        body: JSON.stringify({ pack: '25k' }),
      });

      const { POST } = await import('../../../app/api/billing/message-packs/checkout/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('configuration');

      process.env.STRIPE_PRICE_MSGPACK_25K = originalEnv;
    });

    it('should use demo customer if no customerId provided', async () => {
      mockStripeCreate.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      } as any);

      const request = new NextRequest('http://localhost/api/billing/message-packs/checkout', {
        method: 'POST',
        body: JSON.stringify({ pack: '25k' }),
      });

      const { POST } = await import('../../../app/api/billing/message-packs/checkout/route');
      await POST(request);

      expect(mockStripeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_demo',
        })
      );
    });
  });

  describe('Stripe Integration', () => {
    it('should create checkout session with correct parameters', async () => {
      mockStripeCreate.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      } as any);

      const request = new NextRequest('http://localhost/api/billing/message-packs/checkout', {
        method: 'POST',
        body: JSON.stringify({ pack: '100k' }),
      });

      const { POST } = await import('../../../app/api/billing/message-packs/checkout/route');
      await POST(request);

      expect(mockStripeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'payment',
          customer: 'cus_demo',
          line_items: [
            {
              price: 'price_100k',
              quantity: 1,
            },
          ],
          success_url: expect.stringContaining('/billing/packs/success'),
          cancel_url: expect.stringContaining('/billing/packs'),
          metadata: expect.objectContaining({
            pack: '100k',
            messages: '100000',
            packName: 'Pro Pack',
          }),
        })
      );
    });

    it('should include custom metadata', async () => {
      mockStripeCreate.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      } as any);

      const request = new NextRequest('http://localhost/api/billing/message-packs/checkout', {
        method: 'POST',
        body: JSON.stringify({
          pack: '25k',
          metadata: {
            userId: 'user_123',
            campaign: 'summer_sale',
          },
        }),
      });

      const { POST } = await import('../../../app/api/billing/message-packs/checkout/route');
      await POST(request);

      expect(mockStripeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            userId: 'user_123',
            campaign: 'summer_sale',
          }),
        })
      );
    });

    it('should return session URL and ID', async () => {
      mockStripeCreate.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      } as any);

      const request = new NextRequest('http://localhost/api/billing/message-packs/checkout', {
        method: 'POST',
        body: JSON.stringify({ pack: '25k' }),
      });

      const { POST } = await import('../../../app/api/billing/message-packs/checkout/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.url).toBe('https://checkout.stripe.com/test');
      expect(data.sessionId).toBe('cs_test_123');
      expect(data.correlationId).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle Stripe connection errors', async () => {
      const StripeErrors = vi.mocked(Stripe).errors;
      mockStripeCreate.mockRejectedValue(
        new StripeErrors.StripeConnectionError('Connection failed')
      );

      const request = new NextRequest('http://localhost/api/billing/message-packs/checkout', {
        method: 'POST',
        body: JSON.stringify({ pack: '25k' }),
      });

      const { POST } = await import('../../../app/api/billing/message-packs/checkout/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
      expect(data.correlationId).toBeDefined();
    });

    it('should handle Stripe API errors', async () => {
      const StripeErrors = vi.mocked(Stripe).errors;
      mockStripeCreate.mockRejectedValue(
        new StripeErrors.StripeAPIError('API error')
      );

      const request = new NextRequest('http://localhost/api/billing/message-packs/checkout', {
        method: 'POST',
        body: JSON.stringify({ pack: '25k' }),
      });

      const { POST } = await import('../../../app/api/billing/message-packs/checkout/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(data.success).toBe(false);
    });

    it('should include correlation ID in all responses', async () => {
      const request = new NextRequest('http://localhost/api/billing/message-packs/checkout', {
        method: 'POST',
        body: JSON.stringify({ pack: 'invalid' }),
      });

      const { POST } = await import('../../../app/api/billing/message-packs/checkout/route');
      const response = await POST(request);
      const data = await response.json();

      expect(data.correlationId).toBeDefined();
      expect(data.correlationId).toMatch(/^billing-\d+-[a-z0-9]+$/);
    });
  });

  describe('Retry Logic', () => {
    it('should retry on network errors', async () => {
      mockStripeCreate
        .mockRejectedValueOnce(new Error('network error'))
        .mockRejectedValueOnce(new Error('network timeout'))
        .mockResolvedValueOnce({
          id: 'cs_test_123',
          url: 'https://checkout.stripe.com/test',
        } as any);

      const request = new NextRequest('http://localhost/api/billing/message-packs/checkout', {
        method: 'POST',
        body: JSON.stringify({ pack: '25k' }),
      });

      const { POST } = await import('../../../app/api/billing/message-packs/checkout/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockStripeCreate).toHaveBeenCalledTimes(3);
    });

    it('should not retry on validation errors', async () => {
      const request = new NextRequest('http://localhost/api/billing/message-packs/checkout', {
        method: 'POST',
        body: JSON.stringify({ pack: 'invalid' }),
      });

      const { POST } = await import('../../../app/api/billing/message-packs/checkout/route');
      await POST(request);

      expect(mockStripeCreate).not.toHaveBeenCalled();
    });
  });

  describe('Logging', () => {
    it('should log request received', async () => {
      const consoleSpy = vi.spyOn(console, 'log');

      mockStripeCreate.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      } as any);

      const request = new NextRequest('http://localhost/api/billing/message-packs/checkout', {
        method: 'POST',
        body: JSON.stringify({ pack: '25k' }),
      });

      const { POST } = await import('../../../app/api/billing/message-packs/checkout/route');
      await POST(request);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Checkout request received'),
        expect.any(String)
      );

      consoleSpy.mockRestore();
    });

    it('should log errors with correlation ID', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');

      mockStripeCreate.mockRejectedValue(new Error('Test error'));

      const request = new NextRequest('http://localhost/api/billing/message-packs/checkout', {
        method: 'POST',
        body: JSON.stringify({ pack: '25k' }),
      });

      const { POST } = await import('../../../app/api/billing/message-packs/checkout/route');
      await POST(request);

      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
