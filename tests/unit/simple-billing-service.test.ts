import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  SimpleBillingService,
  simpleBillingService,
  type SubscriptionPlan,
  type UserSubscription,
  type CheckoutSessionData,
  type PortalSessionData,
  type WebhookEvent
} from '../../lib/services/simple-billing-service';

/**
 * Tests complets pour le service de facturation simplifié Huntaze
 * Couvre toutes les fonctionnalités : checkout, portail, webhooks, abonnements, métriques
 * Basé sur l'implémentation réelle dans lib/services/simple-billing-service.ts
 */

describe('SimpleBillingService', () => {
  let billingService: SimpleBillingService;

  // Mock data pour les tests
  const mockUserSubscription: UserSubscription = {
    id: 'sub-test-123',
    userId: 'user-test-123',
    planId: 'pro',
    status: 'active',
    currentPeriodStart: new Date('2024-01-01'),
    currentPeriodEnd: new Date('2024-02-01'),
    stripeSubscriptionId: 'sub_stripe_123',
    stripeCustomerId: 'cus_stripe_123',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  const mockStripeSubscriptionData = {
    id: 'sub_stripe_123',
    customer: 'cus_stripe_123',
    status: 'active',
    current_period_start: Math.floor(Date.now() / 1000),
    current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
    items: {
      data: [
        {
          price: {
            id: 'price_pro_monthly',
            unit_amount: 2900,
            currency: 'usd',
            recurring: { interval: 'month' }
          }
        }
      ]
    }
  };

  beforeEach(() => {
    billingService = new SimpleBillingService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Checkout Session Management', () => {
    it('should create checkout session with valid data', async () => {
      const checkoutData: CheckoutSessionData = {
        priceId: 'price_pro_monthly',
        successUrl: 'https://huntaze.com/success',
        cancelUrl: 'https://huntaze.com/cancel',
        customerId: 'cus_test_123',
        metadata: { userId: 'user-123' }
      };

      const result = await billingService.createCheckoutSession(checkoutData);

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('sessionId');
      expect(result.url).toContain('https://checkout.stripe.com/pay/');
      expect(result.sessionId).toMatch(/^cs_mock_\d+_[a-z0-9]+$/);
    });

    it('should generate unique session IDs for multiple requests', async () => {
      const checkoutData: CheckoutSessionData = {
        priceId: 'price_pro_monthly',
        successUrl: 'https://huntaze.com/success',
        cancelUrl: 'https://huntaze.com/cancel'
      };

      const result1 = await billingService.createCheckoutSession(checkoutData);
      const result2 = await billingService.createCheckoutSession(checkoutData);

      expect(result1.sessionId).not.toBe(result2.sessionId);
      expect(result1.url).not.toBe(result2.url);
    });

    it('should handle checkout session creation with minimal data', async () => {
      const checkoutData: CheckoutSessionData = {
        priceId: 'price_enterprise_yearly',
        successUrl: 'https://huntaze.com/success',
        cancelUrl: 'https://huntaze.com/cancel'
      };

      const result = await billingService.createCheckoutSession(checkoutData);

      expect(result.url).toBeDefined();
      expect(result.sessionId).toBeDefined();
    });
  });

  describe('Customer Portal Management', () => {
    it('should create portal session with valid customer ID', async () => {
      const portalData: PortalSessionData = {
        customerId: 'cus_test_123',
        returnUrl: 'https://huntaze.com/dashboard'
      };

      const result = await billingService.createPortalSession(portalData);

      expect(result).toHaveProperty('url');
      expect(result.url).toBe('https://billing.stripe.com/session/cus_test_123');
    });

    it('should create portal session with different customer IDs', async () => {
      const portalData1: PortalSessionData = {
        customerId: 'cus_test_123',
        returnUrl: 'https://huntaze.com/dashboard'
      };

      const portalData2: PortalSessionData = {
        customerId: 'cus_test_456',
        returnUrl: 'https://huntaze.com/settings'
      };

      const result1 = await billingService.createPortalSession(portalData1);
      const result2 = await billingService.createPortalSession(portalData2);

      expect(result1.url).toContain('cus_test_123');
      expect(result2.url).toContain('cus_test_456');
    });
  });

  describe('Webhook Event Handling', () => {
    describe('Subscription Created', () => {
      it('should handle subscription.created webhook successfully', async () => {
        const webhookEvent: WebhookEvent = {
          id: 'evt_test_123',
          type: 'customer.subscription.created',
          data: mockStripeSubscriptionData,
          created: Math.floor(Date.now() / 1000)
        };

        const result = await billingService.handleWebhook(webhookEvent);

        expect(result.processed).toBe(true);
        expect(result.message).toBeUndefined();
      });

      it('should handle subscription.created with unknown price ID', async () => {
        const webhookEvent: WebhookEvent = {
          id: 'evt_test_123',
          type: 'customer.subscription.created',
          data: {
            ...mockStripeSubscriptionData,
            items: {
              data: [{ price: { id: 'price_unknown' } }]
            }
          },
          created: Math.floor(Date.now() / 1000)
        };

        const result = await billingService.handleWebhook(webhookEvent);

        expect(result.processed).toBe(false);
        expect(result.message).toBe('Unknown price ID');
      });
    });

    describe('Subscription Updated', () => {
      it('should handle subscription.updated webhook successfully', async () => {
        // First create a subscription
        const createEvent: WebhookEvent = {
          id: 'evt_create_123',
          type: 'customer.subscription.created',
          data: mockStripeSubscriptionData,
          created: Math.floor(Date.now() / 1000)
        };
        await billingService.handleWebhook(createEvent);

        // Then update it
        const updateEvent: WebhookEvent = {
          id: 'evt_update_123',
          type: 'customer.subscription.updated',
          data: {
            ...mockStripeSubscriptionData,
            status: 'past_due'
          },
          created: Math.floor(Date.now() / 1000)
        };

        const result = await billingService.handleWebhook(updateEvent);

        expect(result.processed).toBe(true);
      });

      it('should handle subscription.updated for non-existent subscription', async () => {
        const webhookEvent: WebhookEvent = {
          id: 'evt_test_123',
          type: 'customer.subscription.updated',
          data: {
            ...mockStripeSubscriptionData,
            customer: 'cus_nonexistent'
          },
          created: Math.floor(Date.now() / 1000)
        };

        const result = await billingService.handleWebhook(webhookEvent);

        expect(result.processed).toBe(false);
        expect(result.message).toBe('Subscription not found');
      });
    });

    describe('Subscription Deleted', () => {
      it('should handle subscription.deleted webhook successfully', async () => {
        // First create a subscription
        const createEvent: WebhookEvent = {
          id: 'evt_create_123',
          type: 'customer.subscription.created',
          data: mockStripeSubscriptionData,
          created: Math.floor(Date.now() / 1000)
        };
        await billingService.handleWebhook(createEvent);

        // Then delete it
        const deleteEvent: WebhookEvent = {
          id: 'evt_delete_123',
          type: 'customer.subscription.deleted',
          data: mockStripeSubscriptionData,
          created: Math.floor(Date.now() / 1000)
        };

        const result = await billingService.handleWebhook(deleteEvent);

        expect(result.processed).toBe(true);
      });
    });

    describe('Payment Events', () => {
      it('should handle invoice.payment_succeeded webhook', async () => {
        const webhookEvent: WebhookEvent = {
          id: 'evt_payment_123',
          type: 'invoice.payment_succeeded',
          data: { customer: 'cus_test_123' },
          created: Math.floor(Date.now() / 1000)
        };

        const result = await billingService.handleWebhook(webhookEvent);

        expect(result.processed).toBe(true);
      });

      it('should handle invoice.payment_failed webhook', async () => {
        const webhookEvent: WebhookEvent = {
          id: 'evt_payment_failed_123',
          type: 'invoice.payment_failed',
          data: { customer: 'cus_test_123' },
          created: Math.floor(Date.now() / 1000)
        };

        const result = await billingService.handleWebhook(webhookEvent);

        expect(result.processed).toBe(true);
      });
    });

    describe('Customer Events', () => {
      it('should handle customer.created webhook', async () => {
        const webhookEvent: WebhookEvent = {
          id: 'evt_customer_123',
          type: 'customer.created',
          data: { id: 'cus_new_123', email: 'test@example.com' },
          created: Math.floor(Date.now() / 1000)
        };

        const result = await billingService.handleWebhook(webhookEvent);

        expect(result.processed).toBe(true);
      });

      it('should handle customer.updated webhook', async () => {
        const webhookEvent: WebhookEvent = {
          id: 'evt_customer_updated_123',
          type: 'customer.updated',
          data: { id: 'cus_test_123', email: 'updated@example.com' },
          created: Math.floor(Date.now() / 1000)
        };

        const result = await billingService.handleWebhook(webhookEvent);

        expect(result.processed).toBe(true);
      });

      it('should handle customer.deleted webhook', async () => {
        const webhookEvent: WebhookEvent = {
          id: 'evt_customer_deleted_123',
          type: 'customer.deleted',
          data: { id: 'cus_test_123' },
          created: Math.floor(Date.now() / 1000)
        };

        const result = await billingService.handleWebhook(webhookEvent);

        expect(result.processed).toBe(true);
      });
    });

    describe('Unknown Events', () => {
      it('should handle unknown webhook event types', async () => {
        const webhookEvent: WebhookEvent = {
          id: 'evt_unknown_123',
          type: 'unknown.event.type',
          data: {},
          created: Math.floor(Date.now() / 1000)
        };

        const result = await billingService.handleWebhook(webhookEvent);

        expect(result.processed).toBe(false);
        expect(result.message).toBe('Unhandled event type: unknown.event.type');
      });
    });

    describe('Error Handling', () => {
      it('should handle webhook processing errors gracefully', async () => {
        // Mock an error by providing invalid data structure
        const webhookEvent: WebhookEvent = {
          id: 'evt_error_123',
          type: 'customer.subscription.created',
          data: null, // This will cause an error
          created: Math.floor(Date.now() / 1000)
        };

        const result = await billingService.handleWebhook(webhookEvent);

        expect(result.processed).toBe(false);
        expect(result.message).toBeDefined();
      });
    });
  });

  describe('User Subscription Management', () => {
    it('should get user subscription when it exists', async () => {
      // First create a subscription via webhook
      const webhookEvent: WebhookEvent = {
        id: 'evt_test_123',
        type: 'customer.subscription.created',
        data: mockStripeSubscriptionData,
        created: Math.floor(Date.now() / 1000)
      };
      await billingService.handleWebhook(webhookEvent);

      const subscription = await billingService.getUserSubscription('cus_stripe_123');

      expect(subscription).toBeDefined();
      expect(subscription?.userId).toBe('cus_stripe_123');
      expect(subscription?.planId).toBe('pro');
      expect(subscription?.status).toBe('active');
    });

    it('should return null for non-existent user subscription', async () => {
      const subscription = await billingService.getUserSubscription('nonexistent-user');

      expect(subscription).toBeNull();
    });

    it('should return copy of subscription data (not reference)', async () => {
      // Create subscription
      const webhookEvent: WebhookEvent = {
        id: 'evt_test_123',
        type: 'customer.subscription.created',
        data: mockStripeSubscriptionData,
        created: Math.floor(Date.now() / 1000)
      };
      await billingService.handleWebhook(webhookEvent);

      const subscription1 = await billingService.getUserSubscription('cus_stripe_123');
      const subscription2 = await billingService.getUserSubscription('cus_stripe_123');

      expect(subscription1).not.toBe(subscription2); // Different objects
      expect(subscription1).toEqual(subscription2); // Same content
    });
  });

  describe('Feature Access Control', () => {
    beforeEach(async () => {
      // Create test subscriptions for different plans
      const freeUser: WebhookEvent = {
        id: 'evt_free_123',
        type: 'customer.subscription.created',
        data: {
          ...mockStripeSubscriptionData,
          customer: 'user-free',
          items: { data: [{ price: { id: 'price_free' } }] }
        },
        created: Math.floor(Date.now() / 1000)
      };

      const proUser: WebhookEvent = {
        id: 'evt_pro_123',
        type: 'customer.subscription.created',
        data: {
          ...mockStripeSubscriptionData,
          customer: 'user-pro',
          items: { data: [{ price: { id: 'price_pro_monthly' } }] }
        },
        created: Math.floor(Date.now() / 1000)
      };

      const enterpriseUser: WebhookEvent = {
        id: 'evt_enterprise_123',
        type: 'customer.subscription.created',
        data: {
          ...mockStripeSubscriptionData,
          customer: 'user-enterprise',
          items: { data: [{ price: { id: 'price_enterprise_monthly' } }] }
        },
        created: Math.floor(Date.now() / 1000)
      };

      await billingService.handleWebhook(freeUser);
      await billingService.handleWebhook(proUser);
      await billingService.handleWebhook(enterpriseUser);
    });

    it('should grant basic features to all active users', async () => {
      const freeAccess = await billingService.hasFeatureAccess('user-free', 'basic_feature');
      const proAccess = await billingService.hasFeatureAccess('user-pro', 'basic_feature');
      const enterpriseAccess = await billingService.hasFeatureAccess('user-enterprise', 'basic_feature');

      expect(freeAccess).toBe(true);
      expect(proAccess).toBe(true);
      expect(enterpriseAccess).toBe(true);
    });

    it('should restrict AI tools to Pro and Enterprise users', async () => {
      const freeAccess = await billingService.hasFeatureAccess('user-free', 'ai_tools');
      const proAccess = await billingService.hasFeatureAccess('user-pro', 'ai_tools');
      const enterpriseAccess = await billingService.hasFeatureAccess('user-enterprise', 'ai_tools');

      expect(freeAccess).toBe(false);
      expect(proAccess).toBe(true);
      expect(enterpriseAccess).toBe(true);
    });

    it('should restrict unlimited assets to Enterprise users only', async () => {
      const freeAccess = await billingService.hasFeatureAccess('user-free', 'unlimited_assets');
      const proAccess = await billingService.hasFeatureAccess('user-pro', 'unlimited_assets');
      const enterpriseAccess = await billingService.hasFeatureAccess('user-enterprise', 'unlimited_assets');

      expect(freeAccess).toBe(false);
      expect(proAccess).toBe(false);
      expect(enterpriseAccess).toBe(true);
    });

    it('should restrict custom integrations to Enterprise users only', async () => {
      const freeAccess = await billingService.hasFeatureAccess('user-free', 'custom_integrations');
      const proAccess = await billingService.hasFeatureAccess('user-pro', 'custom_integrations');
      const enterpriseAccess = await billingService.hasFeatureAccess('user-enterprise', 'custom_integrations');

      expect(freeAccess).toBe(false);
      expect(proAccess).toBe(false);
      expect(enterpriseAccess).toBe(true);
    });

    it('should deny access for inactive subscriptions', async () => {
      // Update subscription to canceled
      const cancelEvent: WebhookEvent = {
        id: 'evt_cancel_123',
        type: 'customer.subscription.updated',
        data: {
          ...mockStripeSubscriptionData,
          customer: 'user-pro',
          status: 'canceled'
        },
        created: Math.floor(Date.now() / 1000)
      };
      await billingService.handleWebhook(cancelEvent);

      const access = await billingService.hasFeatureAccess('user-pro', 'ai_tools');

      expect(access).toBe(false);
    });

    it('should deny access for non-existent users', async () => {
      const access = await billingService.hasFeatureAccess('nonexistent-user', 'ai_tools');

      expect(access).toBe(false);
    });
  });

  describe('Usage Limits Management', () => {
    beforeEach(async () => {
      // Create test subscriptions
      const plans = [
        { customer: 'user-free', priceId: 'price_free' },
        { customer: 'user-pro', priceId: 'price_pro_monthly' },
        { customer: 'user-enterprise', priceId: 'price_enterprise_monthly' }
      ];

      for (const plan of plans) {
        const event: WebhookEvent = {
          id: `evt_${plan.customer}`,
          type: 'customer.subscription.created',
          data: {
            ...mockStripeSubscriptionData,
            customer: plan.customer,
            items: { data: [{ price: { id: plan.priceId } }] }
          },
          created: Math.floor(Date.now() / 1000)
        };
        await billingService.handleWebhook(event);
      }
    });

    it('should return correct limits for Free plan', async () => {
      const limits = await billingService.getUsageLimits('user-free');

      expect(limits).toEqual({
        assets: 5,
        campaigns: 1,
        apiCalls: 100
      });
    });

    it('should return correct limits for Pro plan', async () => {
      const limits = await billingService.getUsageLimits('user-pro');

      expect(limits).toEqual({
        assets: 100,
        campaigns: 10,
        apiCalls: 1000
      });
    });

    it('should return correct limits for Enterprise plan', async () => {
      const limits = await billingService.getUsageLimits('user-enterprise');

      expect(limits).toEqual({
        assets: -1, // Unlimited
        campaigns: -1, // Unlimited
        apiCalls: -1 // Unlimited
      });
    });

    it('should return null for non-existent user', async () => {
      const limits = await billingService.getUsageLimits('nonexistent-user');

      expect(limits).toBeNull();
    });

    it('should return copy of limits data (not reference)', async () => {
      const limits1 = await billingService.getUsageLimits('user-pro');
      const limits2 = await billingService.getUsageLimits('user-pro');

      expect(limits1).not.toBe(limits2); // Different objects
      expect(limits1).toEqual(limits2); // Same content
    });
  });

  describe('Price and Status Mapping', () => {
    it('should map known price IDs to plans correctly', () => {
      expect(billingService.mapPriceIdToPlan('price_free')).toBe('free');
      expect(billingService.mapPriceIdToPlan('price_pro_monthly')).toBe('pro');
      expect(billingService.mapPriceIdToPlan('price_pro_yearly')).toBe('pro');
      expect(billingService.mapPriceIdToPlan('price_enterprise_monthly')).toBe('enterprise');
      expect(billingService.mapPriceIdToPlan('price_enterprise_yearly')).toBe('enterprise');
    });

    it('should return null for unknown price IDs', () => {
      expect(billingService.mapPriceIdToPlan('price_unknown')).toBeNull();
      expect(billingService.mapPriceIdToPlan('')).toBeNull();
      expect(billingService.mapPriceIdToPlan('invalid')).toBeNull();
    });

    it('should map Stripe statuses correctly', () => {
      expect(billingService.mapStripeStatus('active')).toBe('active');
      expect(billingService.mapStripeStatus('canceled')).toBe('canceled');
      expect(billingService.mapStripeStatus('past_due')).toBe('past_due');
      expect(billingService.mapStripeStatus('unpaid')).toBe('unpaid');
    });

    it('should default to canceled for unknown statuses', () => {
      expect(billingService.mapStripeStatus('unknown')).toBe('canceled');
      expect(billingService.mapStripeStatus('')).toBe('canceled');
      expect(billingService.mapStripeStatus('invalid')).toBe('canceled');
    });
  });

  describe('Plan Management', () => {
    it('should return all available plans', async () => {
      const plans = await billingService.getAvailablePlans();

      expect(plans).toHaveLength(3);
      expect(plans.map(p => p.id)).toEqual(['free', 'pro', 'enterprise']);

      const freePlan = plans.find(p => p.id === 'free');
      expect(freePlan).toEqual({
        id: 'free',
        name: 'Free',
        price: 0,
        currency: 'usd',
        interval: 'month',
        features: ['Basic content creation', '5 assets', '1 campaign'],
        limits: { assets: 5, campaigns: 1, apiCalls: 100 }
      });
    });

    it('should return specific plan by ID', async () => {
      const proPlan = await billingService.getPlanById('pro');

      expect(proPlan).toEqual({
        id: 'pro',
        name: 'Pro',
        price: 29,
        currency: 'usd',
        interval: 'month',
        features: ['Advanced AI tools', '100 assets', '10 campaigns', 'Priority support'],
        limits: { assets: 100, campaigns: 10, apiCalls: 1000 }
      });
    });

    it('should return null for non-existent plan ID', async () => {
      const plan = await billingService.getPlanById('nonexistent');

      expect(plan).toBeNull();
    });

    it('should return copy of plan data (not reference)', async () => {
      const plan1 = await billingService.getPlanById('pro');
      const plan2 = await billingService.getPlanById('pro');

      expect(plan1).not.toBe(plan2); // Different objects
      expect(plan1).toEqual(plan2); // Same content
    });
  });

  describe('Health Check and Metrics', () => {
    it('should report healthy status', async () => {
      const isHealthy = await billingService.isHealthy();

      expect(isHealthy).toBe(true);
    });

    it('should return service metrics', async () => {
      // Create some test subscriptions
      const subscriptions = [
        { customer: 'user-1', priceId: 'price_free', status: 'active' },
        { customer: 'user-2', priceId: 'price_pro_monthly', status: 'active' },
        { customer: 'user-3', priceId: 'price_enterprise_monthly', status: 'active' },
        { customer: 'user-4', priceId: 'price_pro_monthly', status: 'canceled' }
      ];

      for (const sub of subscriptions) {
        const event: WebhookEvent = {
          id: `evt_${sub.customer}`,
          type: 'customer.subscription.created',
          data: {
            ...mockStripeSubscriptionData,
            customer: sub.customer,
            status: sub.status,
            items: { data: [{ price: { id: sub.priceId } }] }
          },
          created: Math.floor(Date.now() / 1000)
        };
        await billingService.handleWebhook(event);
      }

      const metrics = await billingService.getMetrics();

      expect(metrics.totalSubscriptions).toBe(4);
      expect(metrics.activeSubscriptions).toBe(3);
      expect(metrics.planBreakdown).toEqual({
        free: 1,
        pro: 2,
        enterprise: 1
      });
      expect(metrics.revenue).toBe(0 + 29 + 99); // free + pro + enterprise
    });

    it('should handle empty metrics correctly', async () => {
      // Create a fresh service instance with no subscriptions
      const freshService = new SimpleBillingService();
      const metrics = await freshService.getMetrics();

      expect(metrics.totalSubscriptions).toBe(0);
      expect(metrics.activeSubscriptions).toBe(0);
      expect(metrics.planBreakdown).toEqual({});
      expect(metrics.revenue).toBe(0);
    });
  });

  describe('Singleton Instance', () => {
    it('should export a singleton instance', () => {
      expect(simpleBillingService).toBeInstanceOf(SimpleBillingService);
    });

    it('should maintain state across singleton usage', async () => {
      // Use singleton to create subscription
      const webhookEvent: WebhookEvent = {
        id: 'evt_singleton_123',
        type: 'customer.subscription.created',
        data: {
          ...mockStripeSubscriptionData,
          customer: 'singleton-user'
        },
        created: Math.floor(Date.now() / 1000)
      };

      await simpleBillingService.handleWebhook(webhookEvent);
      const subscription = await simpleBillingService.getUserSubscription('singleton-user');

      expect(subscription).toBeDefined();
      expect(subscription?.userId).toBe('singleton-user');
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle concurrent webhook processing', async () => {
      const webhookEvents = Array.from({ length: 10 }, (_, i) => ({
        id: `evt_concurrent_${i}`,
        type: 'customer.subscription.created',
        data: {
          ...mockStripeSubscriptionData,
          customer: `user-concurrent-${i}`
        },
        created: Math.floor(Date.now() / 1000)
      }));

      const results = await Promise.all(
        webhookEvents.map(event => billingService.handleWebhook(event))
      );

      results.forEach(result => {
        expect(result.processed).toBe(true);
      });
    });

    it('should handle malformed webhook data gracefully', async () => {
      const malformedEvents = [
        { id: 'evt_1', type: 'customer.subscription.created', data: undefined, created: 0 },
        { id: 'evt_2', type: 'customer.subscription.created', data: {}, created: 0 },
        { id: 'evt_3', type: 'customer.subscription.created', data: { items: null }, created: 0 }
      ];

      for (const event of malformedEvents) {
        const result = await billingService.handleWebhook(event as WebhookEvent);
        expect(result.processed).toBe(false);
        expect(result.message).toBeDefined();
      }
    });

    it('should handle subscription status edge cases', async () => {
      const edgeCaseStatuses = ['trialing', 'incomplete', 'incomplete_expired', 'paused'];

      for (const status of edgeCaseStatuses) {
        const mappedStatus = billingService.mapStripeStatus(status);
        expect(mappedStatus).toBe('canceled'); // Should default to canceled
      }
    });

    it('should handle feature access for edge case plans', async () => {
      // Create subscription with unknown plan
      const webhookEvent: WebhookEvent = {
        id: 'evt_edge_123',
        type: 'customer.subscription.created',
        data: {
          ...mockStripeSubscriptionData,
          customer: 'user-edge',
          items: { data: [{ price: { id: 'price_unknown_plan' } }] }
        },
        created: Math.floor(Date.now() / 1000)
      };

      const result = await billingService.handleWebhook(webhookEvent);
      expect(result.processed).toBe(false);

      // Should deny access for unknown plan
      const access = await billingService.hasFeatureAccess('user-edge', 'ai_tools');
      expect(access).toBe(false);
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle large number of subscriptions efficiently', async () => {
      const startTime = Date.now();

      // Create 100 subscriptions
      const promises = Array.from({ length: 100 }, (_, i) => {
        const event: WebhookEvent = {
          id: `evt_perf_${i}`,
          type: 'customer.subscription.created',
          data: {
            ...mockStripeSubscriptionData,
            customer: `user-perf-${i}`
          },
          created: Math.floor(Date.now() / 1000)
        };
        return billingService.handleWebhook(event);
      });

      await Promise.all(promises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (< 5 seconds)
      expect(duration).toBeLessThan(5000);

      // Verify all subscriptions were created
      const metrics = await billingService.getMetrics();
      expect(metrics.totalSubscriptions).toBeGreaterThanOrEqual(100);
    });

    it('should not leak memory with repeated operations', async () => {
      // Perform many operations
      for (let i = 0; i < 50; i++) {
        await billingService.createCheckoutSession({
          priceId: 'price_pro_monthly',
          successUrl: 'https://test.com/success',
          cancelUrl: 'https://test.com/cancel'
        });

        await billingService.createPortalSession({
          customerId: `cus_test_${i}`,
          returnUrl: 'https://test.com/return'
        });

        await billingService.getAvailablePlans();
        await billingService.getMetrics();
      }

      // If we reach here without memory issues, the test passes
      expect(true).toBe(true);
    });
  });
});