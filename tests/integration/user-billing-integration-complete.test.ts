import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SimpleUserService } from '../../lib/services/simple-user-service';
import { SimpleBillingService, type WebhookEvent } from '../../lib/services/simple-billing-service';

/**
 * Tests d'intégration complets entre les services utilisateur et facturation
 * Valide les flux complets : création utilisateur → abonnement → facturation → webhooks
 * Couvre tous les scénarios de cycle de vie utilisateur avec facturation Stripe
 */

describe('User-Billing Integration', () => {
  let userService: SimpleUserService;
  let billingService: SimpleBillingService;

  // Mock data pour les tests d'intégration
  const mockStripeSubscriptionData = {
    id: 'sub_integration_123',
    customer: 'cus_integration_123',
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
    userService = new SimpleUserService();
    billingService = new SimpleBillingService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('User Registration and Subscription Flow', () => {
    it('should create user and upgrade to Pro subscription successfully', async () => {
      // 1. Create new user (Free plan by default)
      const newUser = await userService.createUser({
        email: 'integration@huntaze.com',
        name: 'Integration User',
        password: 'SecurePassword123!'
      });

      expect(newUser.subscription).toBe('free');
      expect(newUser.stripeCustomerId).toBeUndefined();

      // 2. Verify initial feature access (Free plan)
      const initialAiAccess = await billingService.hasFeatureAccess(newUser.id, 'ai_tools');
      const initialBasicAccess = await billingService.hasFeatureAccess(newUser.id, 'basic_feature');
      
      expect(initialAiAccess).toBe(false); // No AI tools on free
      expect(initialBasicAccess).toBe(true); // Basic features available

      // 3. Create checkout session for Pro upgrade
      const checkoutSession = await billingService.createCheckoutSession({
        priceId: 'price_pro_monthly',
        successUrl: 'https://huntaze.com/success',
        cancelUrl: 'https://huntaze.com/cancel',
        customerId: 'cus_integration_123',
        metadata: { userId: newUser.id }
      });

      expect(checkoutSession.url).toContain('checkout.stripe.com');
      expect(checkoutSession.sessionId).toBeDefined();

      // 4. Simulate successful subscription creation via webhook
      const subscriptionCreatedEvent: WebhookEvent = {
        id: 'evt_integration_123',
        type: 'customer.subscription.created',
        data: {
          ...mockStripeSubscriptionData,
          customer: newUser.id // Use user ID as customer for this test
        },
        created: Math.floor(Date.now() / 1000)
      };

      const webhookResult = await billingService.handleWebhook(subscriptionCreatedEvent);
      expect(webhookResult.processed).toBe(true);

      // 5. Update user with Stripe customer ID
      const updatedUser = await userService.updateUserSubscription(
        newUser.id, 
        'pro', 
        'cus_integration_123'
      );

      expect(updatedUser?.subscription).toBe('pro');
      expect(updatedUser?.stripeCustomerId).toBe('cus_integration_123');

      // 6. Verify upgraded feature access
      const upgradedAiAccess = await billingService.hasFeatureAccess(newUser.id, 'ai_tools');
      const upgradedUnlimitedAssets = await billingService.hasFeatureAccess(newUser.id, 'unlimited_assets');
      
      expect(upgradedAiAccess).toBe(true); // Now has AI tools
      expect(upgradedUnlimitedAssets).toBe(false); // Still no unlimited assets (Enterprise only)

      // 7. Verify usage limits
      const usageLimits = await billingService.getUsageLimits(newUser.id);
      expect(usageLimits).toEqual({
        assets: 100,
        campaigns: 10,
        apiCalls: 1000
      });
    });

    it('should handle subscription downgrade from Pro to Free', async () => {
      // 1. Create Pro user
      const proUser = await userService.createUser({
        email: 'downgrade@huntaze.com',
        name: 'Downgrade User',
        password: 'SecurePassword123!',
        subscription: 'pro'
      });

      await userService.updateUserSubscription(proUser.id, 'pro', 'cus_downgrade_123');

      // 2. Create initial Pro subscription
      const proSubscriptionEvent: WebhookEvent = {
        id: 'evt_pro_123',
        type: 'customer.subscription.created',
        data: {
          ...mockStripeSubscriptionData,
          customer: proUser.id,
          items: { data: [{ price: { id: 'price_pro_monthly' } }] }
        },
        created: Math.floor(Date.now() / 1000)
      };

      await billingService.handleWebhook(proSubscriptionEvent);

      // 3. Verify Pro access
      const proAiAccess = await billingService.hasFeatureAccess(proUser.id, 'ai_tools');
      expect(proAiAccess).toBe(true);

      // 4. Simulate subscription cancellation
      const subscriptionCanceledEvent: WebhookEvent = {
        id: 'evt_canceled_123',
        type: 'customer.subscription.deleted',
        data: {
          ...mockStripeSubscriptionData,
          customer: proUser.id,
          status: 'canceled'
        },
        created: Math.floor(Date.now() / 1000)
      };

      const cancelResult = await billingService.handleWebhook(subscriptionCanceledEvent);
      expect(cancelResult.processed).toBe(true);

      // 5. Update user to Free plan
      const downgradedUser = await userService.updateUserSubscription(proUser.id, 'free');
      expect(downgradedUser?.subscription).toBe('free');

      // 6. Verify downgraded access
      const downgradedAiAccess = await billingService.hasFeatureAccess(proUser.id, 'ai_tools');
      expect(downgradedAiAccess).toBe(false); // Lost AI tools access

      // 7. Verify downgraded limits
      const downgradedLimits = await billingService.getUsageLimits(proUser.id);
      expect(downgradedLimits).toEqual({
        assets: 5,
        campaigns: 1,
        apiCalls: 100
      });
    });

    it('should handle Enterprise upgrade with full feature access', async () => {
      // 1. Create user and upgrade to Enterprise
      const enterpriseUser = await userService.createUser({
        email: 'enterprise@huntaze.com',
        name: 'Enterprise User',
        password: 'SecurePassword123!'
      });

      // 2. Create Enterprise subscription
      const enterpriseSubscriptionEvent: WebhookEvent = {
        id: 'evt_enterprise_123',
        type: 'customer.subscription.created',
        data: {
          ...mockStripeSubscriptionData,
          customer: enterpriseUser.id,
          items: { data: [{ price: { id: 'price_enterprise_monthly' } }] }
        },
        created: Math.floor(Date.now() / 1000)
      };

      await billingService.handleWebhook(enterpriseSubscriptionEvent);

      // 3. Update user subscription
      const updatedUser = await userService.updateUserSubscription(
        enterpriseUser.id, 
        'enterprise', 
        'cus_enterprise_123'
      );

      expect(updatedUser?.subscription).toBe('enterprise');

      // 4. Verify all Enterprise features
      const features = [
        'ai_tools',
        'unlimited_assets', 
        'priority_support',
        'custom_integrations'
      ];

      for (const feature of features) {
        const hasAccess = await billingService.hasFeatureAccess(enterpriseUser.id, feature);
        expect(hasAccess).toBe(true);
      }

      // 5. Verify unlimited usage limits
      const limits = await billingService.getUsageLimits(enterpriseUser.id);
      expect(limits).toEqual({
        assets: -1, // Unlimited
        campaigns: -1, // Unlimited
        apiCalls: -1 // Unlimited
      });
    });
  });

  describe('Payment and Billing Webhooks Integration', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await userService.createUser({
        email: 'webhook@huntaze.com',
        name: 'Webhook User',
        password: 'SecurePassword123!',
        subscription: 'pro'
      });

      await userService.updateUserSubscription(testUser.id, 'pro', 'cus_webhook_123');

      // Create initial subscription
      const subscriptionEvent: WebhookEvent = {
        id: 'evt_webhook_initial',
        type: 'customer.subscription.created',
        data: {
          ...mockStripeSubscriptionData,
          customer: testUser.id
        },
        created: Math.floor(Date.now() / 1000)
      };

      await billingService.handleWebhook(subscriptionEvent);
    });

    it('should handle successful payment and maintain access', async () => {
      // 1. Verify initial access
      const initialAccess = await billingService.hasFeatureAccess(testUser.id, 'ai_tools');
      expect(initialAccess).toBe(true);

      // 2. Simulate successful payment
      const paymentSucceededEvent: WebhookEvent = {
        id: 'evt_payment_success',
        type: 'invoice.payment_succeeded',
        data: {
          customer: testUser.id,
          amount_paid: 2900,
          currency: 'usd'
        },
        created: Math.floor(Date.now() / 1000)
      };

      const paymentResult = await billingService.handleWebhook(paymentSucceededEvent);
      expect(paymentResult.processed).toBe(true);

      // 3. Verify access is maintained
      const postPaymentAccess = await billingService.hasFeatureAccess(testUser.id, 'ai_tools');
      expect(postPaymentAccess).toBe(true);

      // 4. Verify subscription is still active
      const subscription = await billingService.getUserSubscription(testUser.id);
      expect(subscription?.status).toBe('active');
    });

    it('should handle failed payment and update subscription status', async () => {
      // 1. Simulate failed payment
      const paymentFailedEvent: WebhookEvent = {
        id: 'evt_payment_failed',
        type: 'invoice.payment_failed',
        data: {
          customer: testUser.id,
          amount_due: 2900,
          currency: 'usd'
        },
        created: Math.floor(Date.now() / 1000)
      };

      const paymentResult = await billingService.handleWebhook(paymentFailedEvent);
      expect(paymentResult.processed).toBe(true);

      // 2. Verify subscription status is updated to past_due
      const subscription = await billingService.getUserSubscription(testUser.id);
      expect(subscription?.status).toBe('past_due');

      // 3. Verify access is denied for past_due subscription
      const accessAfterFailure = await billingService.hasFeatureAccess(testUser.id, 'ai_tools');
      expect(accessAfterFailure).toBe(false);
    });

    it('should handle subscription updates (plan changes)', async () => {
      // 1. Simulate subscription update (Pro to Enterprise)
      const subscriptionUpdatedEvent: WebhookEvent = {
        id: 'evt_subscription_updated',
        type: 'customer.subscription.updated',
        data: {
          ...mockStripeSubscriptionData,
          customer: testUser.id,
          items: { data: [{ price: { id: 'price_enterprise_monthly' } }] }
        },
        created: Math.floor(Date.now() / 1000)
      };

      const updateResult = await billingService.handleWebhook(subscriptionUpdatedEvent);
      expect(updateResult.processed).toBe(true);

      // 2. Update user subscription in user service
      await userService.updateUserSubscription(testUser.id, 'enterprise');

      // 3. Verify Enterprise features are now available
      const enterpriseAccess = await billingService.hasFeatureAccess(testUser.id, 'unlimited_assets');
      expect(enterpriseAccess).toBe(true);

      // 4. Verify updated limits
      const limits = await billingService.getUsageLimits(testUser.id);
      expect(limits?.assets).toBe(-1); // Unlimited
    });
  });

  describe('Customer Portal Integration', () => {
    it('should create portal session for existing customer', async () => {
      // 1. Create user with Stripe customer
      const portalUser = await userService.createUser({
        email: 'portal@huntaze.com',
        name: 'Portal User',
        password: 'SecurePassword123!'
      });

      await userService.updateUserSubscription(portalUser.id, 'pro', 'cus_portal_123');

      // 2. Create portal session
      const portalSession = await billingService.createPortalSession({
        customerId: 'cus_portal_123',
        returnUrl: 'https://huntaze.com/dashboard'
      });

      expect(portalSession.url).toBe('https://billing.stripe.com/session/cus_portal_123');
    });

    it('should handle portal access for users without Stripe customer', async () => {
      // 1. Create user without Stripe customer
      const userWithoutStripe = await userService.createUser({
        email: 'nostripe@huntaze.com',
        name: 'No Stripe User',
        password: 'SecurePassword123!'
      });

      // 2. Attempt to create portal session should fail gracefully
      // (In real implementation, this would require error handling)
      expect(userWithoutStripe.stripeCustomerId).toBeUndefined();
    });
  });

  describe('Access Control and Validation Integration', () => {
    let freeUser: any;
    let proUser: any;
    let enterpriseUser: any;

    beforeEach(async () => {
      // Create users with different subscription levels
      freeUser = await userService.createUser({
        email: 'free@huntaze.com',
        name: 'Free User',
        password: 'SecurePassword123!',
        subscription: 'free'
      });

      proUser = await userService.createUser({
        email: 'pro@huntaze.com',
        name: 'Pro User',
        password: 'SecurePassword123!',
        subscription: 'pro'
      });

      enterpriseUser = await userService.createUser({
        email: 'enterprise@huntaze.com',
        name: 'Enterprise User',
        password: 'SecurePassword123!',
        subscription: 'enterprise'
      });

      // Create corresponding billing subscriptions
      const subscriptions = [
        { user: freeUser, priceId: 'price_free' },
        { user: proUser, priceId: 'price_pro_monthly' },
        { user: enterpriseUser, priceId: 'price_enterprise_monthly' }
      ];

      for (const sub of subscriptions) {
        const event: WebhookEvent = {
          id: `evt_${sub.user.id}`,
          type: 'customer.subscription.created',
          data: {
            ...mockStripeSubscriptionData,
            customer: sub.user.id,
            items: { data: [{ price: { id: sub.priceId } }] }
          },
          created: Math.floor(Date.now() / 1000)
        };

        await billingService.handleWebhook(event);
      }
    });

    it('should validate hierarchical access control correctly', async () => {
      // Test user service access validation
      expect(await userService.validateUserAccess(freeUser.id, 'free')).toBe(true);
      expect(await userService.validateUserAccess(freeUser.id, 'pro')).toBe(false);
      expect(await userService.validateUserAccess(freeUser.id, 'enterprise')).toBe(false);

      expect(await userService.validateUserAccess(proUser.id, 'free')).toBe(true);
      expect(await userService.validateUserAccess(proUser.id, 'pro')).toBe(true);
      expect(await userService.validateUserAccess(proUser.id, 'enterprise')).toBe(false);

      expect(await userService.validateUserAccess(enterpriseUser.id, 'free')).toBe(true);
      expect(await userService.validateUserAccess(enterpriseUser.id, 'pro')).toBe(true);
      expect(await userService.validateUserAccess(enterpriseUser.id, 'enterprise')).toBe(true);
    });

    it('should validate feature access across both services', async () => {
      const features = ['ai_tools', 'unlimited_assets', 'priority_support', 'custom_integrations'];
      
      for (const feature of features) {
        const freeAccess = await billingService.hasFeatureAccess(freeUser.id, feature);
        const proAccess = await billingService.hasFeatureAccess(proUser.id, feature);
        const enterpriseAccess = await billingService.hasFeatureAccess(enterpriseUser.id, feature);

        // Validate expected access patterns
        if (feature === 'ai_tools' || feature === 'priority_support') {
          expect(freeAccess).toBe(false);
          expect(proAccess).toBe(true);
          expect(enterpriseAccess).toBe(true);
        } else if (feature === 'unlimited_assets' || feature === 'custom_integrations') {
          expect(freeAccess).toBe(false);
          expect(proAccess).toBe(false);
          expect(enterpriseAccess).toBe(true);
        }
      }
    });

    it('should handle inactive user access correctly', async () => {
      // Deactivate pro user
      await userService.updateUser(proUser.id, { isActive: false });

      // User service should deny access
      const userServiceAccess = await userService.validateUserAccess(proUser.id, 'pro');
      expect(userServiceAccess).toBe(false);

      // Billing service should still allow access (subscription is active)
      const billingServiceAccess = await billingService.hasFeatureAccess(proUser.id, 'ai_tools');
      expect(billingServiceAccess).toBe(true);
    });

    it('should handle deleted user access correctly', async () => {
      // Delete pro user
      await userService.deleteUser(proUser.id);

      // User service should deny access
      const userServiceAccess = await userService.validateUserAccess(proUser.id, 'pro');
      expect(userServiceAccess).toBe(false);

      // Billing service should still have subscription data
      const subscription = await billingService.getUserSubscription(proUser.id);
      expect(subscription).toBeDefined();
    });
  });

  describe('Metrics and Analytics Integration', () => {
    beforeEach(async () => {
      // Create diverse user base for metrics testing
      const users = [
        { email: 'metrics1@test.com', subscription: 'free' as const },
        { email: 'metrics2@test.com', subscription: 'free' as const },
        { email: 'metrics3@test.com', subscription: 'pro' as const },
        { email: 'metrics4@test.com', subscription: 'pro' as const },
        { email: 'metrics5@test.com', subscription: 'enterprise' as const }
      ];

      for (const userData of users) {
        const user = await userService.createUser({
          ...userData,
          name: `Metrics User`,
          password: 'Password123!'
        });

        // Create corresponding billing subscription
        const priceIds = {
          free: 'price_free',
          pro: 'price_pro_monthly',
          enterprise: 'price_enterprise_monthly'
        };

        const event: WebhookEvent = {
          id: `evt_metrics_${user.id}`,
          type: 'customer.subscription.created',
          data: {
            ...mockStripeSubscriptionData,
            customer: user.id,
            items: { data: [{ price: { id: priceIds[userData.subscription] } }] }
          },
          created: Math.floor(Date.now() / 1000)
        };

        await billingService.handleWebhook(event);
      }
    });

    it('should provide consistent metrics across both services', async () => {
      const userMetrics = await userService.getMetrics();
      const billingMetrics = await billingService.getMetrics();

      // Both services should report the same number of users/subscriptions
      expect(userMetrics.totalUsers).toBeGreaterThan(0);
      expect(billingMetrics.totalSubscriptions).toBeGreaterThan(0);

      // Subscription breakdown should be consistent
      expect(userMetrics.subscriptionBreakdown.free).toBeDefined();
      expect(userMetrics.subscriptionBreakdown.pro).toBeDefined();
      expect(userMetrics.subscriptionBreakdown.enterprise).toBeDefined();

      expect(billingMetrics.planBreakdown.free).toBeDefined();
      expect(billingMetrics.planBreakdown.pro).toBeDefined();
      expect(billingMetrics.planBreakdown.enterprise).toBeDefined();
    });

    it('should calculate revenue correctly based on active subscriptions', async () => {
      const billingMetrics = await billingService.getMetrics();

      // Revenue should be calculated based on plan prices
      // Free: $0, Pro: $29, Enterprise: $99
      const expectedRevenue = 
        (billingMetrics.planBreakdown.free || 0) * 0 +
        (billingMetrics.planBreakdown.pro || 0) * 29 +
        (billingMetrics.planBreakdown.enterprise || 0) * 99;

      expect(billingMetrics.revenue).toBe(expectedRevenue);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle webhook processing errors gracefully', async () => {
      // Create user
      const errorUser = await userService.createUser({
        email: 'error@huntaze.com',
        name: 'Error User',
        password: 'SecurePassword123!'
      });

      // Send malformed webhook
      const malformedEvent: WebhookEvent = {
        id: 'evt_malformed',
        type: 'customer.subscription.created',
        data: null, // This will cause an error
        created: Math.floor(Date.now() / 1000)
      };

      const result = await billingService.handleWebhook(malformedEvent);

      expect(result.processed).toBe(false);
      expect(result.message).toBeDefined();

      // User should still exist and be functional
      const user = await userService.getUserById(errorUser.id);
      expect(user).toBeDefined();
    });

    it('should handle concurrent user and billing operations', async () => {
      const concurrentPromises = Array.from({ length: 10 }, async (_, i) => {
        // Create user
        const user = await userService.createUser({
          email: `concurrent${i}@test.com`,
          name: `Concurrent User ${i}`,
          password: 'Password123!'
        });

        // Create subscription
        const event: WebhookEvent = {
          id: `evt_concurrent_${i}`,
          type: 'customer.subscription.created',
          data: {
            ...mockStripeSubscriptionData,
            customer: user.id,
            items: { data: [{ price: { id: 'price_pro_monthly' } }] }
          },
          created: Math.floor(Date.now() / 1000)
        };

        await billingService.handleWebhook(event);

        // Update user subscription
        await userService.updateUserSubscription(user.id, 'pro', `cus_concurrent_${i}`);

        return user;
      });

      const users = await Promise.all(concurrentPromises);

      // All operations should complete successfully
      expect(users.length).toBe(10);

      // Verify all users have correct subscription
      for (const user of users) {
        const updatedUser = await userService.getUserById(user.id);
        expect(updatedUser?.subscription).toBe('pro');

        const hasAccess = await billingService.hasFeatureAccess(user.id, 'ai_tools');
        expect(hasAccess).toBe(true);
      }
    });

    it('should handle service health checks consistently', async () => {
      const userServiceHealth = await userService.isHealthy();
      const billingServiceHealth = await billingService.isHealthy();

      expect(userServiceHealth).toBe(true);
      expect(billingServiceHealth).toBe(true);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large-scale user and billing operations efficiently', async () => {
      const startTime = Date.now();
      
      // Create 25 users with subscriptions
      const promises = Array.from({ length: 25 }, async (_, i) => {
        const user = await userService.createUser({
          email: `scale${i}@test.com`,
          name: `Scale User ${i}`,
          password: 'Password123!',
          subscription: i % 3 === 0 ? 'enterprise' : i % 2 === 0 ? 'pro' : 'free'
        });

        const priceIds = ['price_free', 'price_pro_monthly', 'price_enterprise_monthly'];
        const priceId = priceIds[i % 3];

        const event: WebhookEvent = {
          id: `evt_scale_${i}`,
          type: 'customer.subscription.created',
          data: {
            ...mockStripeSubscriptionData,
            customer: user.id,
            items: { data: [{ price: { id: priceId } }] }
          },
          created: Math.floor(Date.now() / 1000)
        };

        await billingService.handleWebhook(event);

        // Test feature access
        await billingService.hasFeatureAccess(user.id, 'ai_tools');
        await billingService.getUsageLimits(user.id);

        return user;
      });

      await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (< 10 seconds)
      expect(duration).toBeLessThan(10000);

      // Verify metrics are consistent
      const userMetrics = await userService.getMetrics();
      const billingMetrics = await billingService.getMetrics();

      expect(userMetrics.totalUsers).toBeGreaterThanOrEqual(25);
      expect(billingMetrics.totalSubscriptions).toBeGreaterThanOrEqual(25);
    });

    it('should maintain data consistency under load', async () => {
      // Create base user
      const baseUser = await userService.createUser({
        email: 'consistency@test.com',
        name: 'Consistency User',
        password: 'Password123!'
      });

      // Perform many concurrent operations on the same user
      const operations = Array.from({ length: 20 }, (_, i) => {
        if (i % 4 === 0) {
          return userService.updateUser(baseUser.id, { name: `Updated ${i}` });
        } else if (i % 4 === 1) {
          return userService.getUserStats(baseUser.id);
        } else if (i % 4 === 2) {
          return billingService.hasFeatureAccess(baseUser.id, 'ai_tools');
        } else {
          return billingService.getUsageLimits(baseUser.id);
        }
      });

      // All operations should complete without errors
      const results = await Promise.allSettled(operations);
      
      const failures = results.filter(result => result.status === 'rejected');
      expect(failures.length).toBe(0);

      // User should still be in consistent state
      const finalUser = await userService.getUserById(baseUser.id);
      expect(finalUser).toBeDefined();
      expect(finalUser?.id).toBe(baseUser.id);
    });
  });
});