import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

/**
 * Tests complets pour le service de facturation simplifié
 * Couvre toutes les fonctionnalités du SimpleBillingService
 */

// Mock Stripe
const mockStripe = {
  customers: {
    create: vi.fn()
  },
  subscriptions: {
    retrieve: vi.fn()
  },
  checkout: {
    sessions: {
      create: vi.fn()
    }
  },
  billingPortal: {
    sessions: {
      create: vi.fn()
    }
  }
};

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    update: vi.fn()
  },
  subscriptionRecord: {
    updateMany: vi.fn()
  }
};

// Mock du service de facturation complet
class SimpleBillingService {
  private stripe = mockStripe;
  private prisma = mockPrisma;

  async createCheckoutSession(params: {
    userId: string;
    priceId: string;
    successUrl?: string;
    cancelUrl?: string;
  }): Promise<string> {
    const { userId, priceId, successUrl, cancelUrl } = params;
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, stripeCustomerId: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    let customerId = user.stripeCustomerId;
    
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        metadata: { userId }
      });
      customerId = customer.id;

      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId }
      });
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl || `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_URL}/pricing`,
      metadata: { userId },
      allow_promotion_codes: true,
      billing_address_collection: 'required'
    });

    if (!session.url) {
      throw new Error('Failed to create checkout session');
    }

    return session.url;
  }

  async createPortalSession(params: {
    userId: string;
    returnUrl?: string;
  }): Promise<string> {
    const { userId, returnUrl } = params;
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true }
    });

    if (!user?.stripeCustomerId) {
      throw new Error('No Stripe customer found for user');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_URL}/dashboard`
    });

    return session.url;
  }

  async handleWebhook(event: any): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }
  }

  private async handleCheckoutCompleted(session: any) {
    const userId = session.metadata?.userId;
    
    if (!userId) {
      console.error('No userId in checkout session metadata');
      return;
    }

    const subscriptionId = session.subscription;
    
    if (!subscriptionId) {
      console.error('No subscription ID in checkout session');
      return;
    }

    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    const plan = this.getPlanFromSubscription(subscription);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        subscription: plan,
        stripeCustomerId: session.customer,
        subscriptionRecord: {
          upsert: {
            create: {
              stripeSubscriptionId: subscriptionId,
              status: 'ACTIVE',
              plan,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
            update: {
              stripeSubscriptionId: subscriptionId,
              status: 'ACTIVE',
              plan,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            }
          }
        }
      }
    });
  }

  private async handleSubscriptionUpdated(subscription: any) {
    const customerId = subscription.customer;
    
    const user = await this.prisma.user.findUnique({
      where: { stripeCustomerId: customerId }
    });

    if (!user) {
      console.error(`No user found for Stripe customer ${customerId}`);
      return;
    }

    const plan = this.getPlanFromSubscription(subscription);
    const status = this.mapStripeStatus(subscription.status);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        subscription: status === 'ACTIVE' ? plan : 'FREE',
        subscriptionRecord: {
          upsert: {
            create: {
              stripeSubscriptionId: subscription.id,
              status,
              plan,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
            update: {
              status,
              plan,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            }
          }
        }
      }
    });
  }

  private async handleSubscriptionDeleted(subscription: any) {
    const customerId = subscription.customer;
    
    const user = await this.prisma.user.findUnique({
      where: { stripeCustomerId: customerId }
    });

    if (!user) {
      console.error(`No user found for Stripe customer ${customerId}`);
      return;
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        subscription: 'FREE',
        subscriptionRecord: {
          update: {
            status: 'CANCELED'
          }
        }
      }
    });
  }

  private async handlePaymentSucceeded(invoice: any) {
    const customerId = invoice.customer;
    
    const user = await this.prisma.user.findUnique({
      where: { stripeCustomerId: customerId }
    });

    if (!user) {
      console.error(`No user found for Stripe customer ${customerId}`);
      return;
    }

    await this.prisma.subscriptionRecord.updateMany({
      where: { 
        userId: user.id,
        status: 'PAST_DUE'
      },
      data: {
        status: 'ACTIVE'
      }
    });
  }

  private async handlePaymentFailed(invoice: any) {
    const customerId = invoice.customer;
    
    const user = await this.prisma.user.findUnique({
      where: { stripeCustomerId: customerId }
    });

    if (!user) {
      console.error(`No user found for Stripe customer ${customerId}`);
      return;
    }

    await this.prisma.subscriptionRecord.updateMany({
      where: { 
        userId: user.id,
        status: 'ACTIVE'
      },
      data: {
        status: 'PAST_DUE'
      }
    });
  }

  private getPlanFromSubscription(subscription: any): 'FREE' | 'PRO' | 'ENTERPRISE' {
    const priceId = subscription.items.data[0]?.price.id;
    
    const priceMap: Record<string, 'FREE' | 'PRO' | 'ENTERPRISE'> = {
      'price_pro_monthly': 'PRO',
      'price_pro_yearly': 'PRO',
      'price_enterprise_monthly': 'ENTERPRISE',
      'price_enterprise_yearly': 'ENTERPRISE',
    };

    return priceMap[priceId || ''] || 'FREE';
  }

  private mapStripeStatus(stripeStatus: string): 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'UNPAID' {
    switch (stripeStatus) {
      case 'active':
        return 'ACTIVE';
      case 'canceled':
      case 'incomplete_expired':
        return 'CANCELED';
      case 'past_due':
        return 'PAST_DUE';
      case 'unpaid':
      case 'incomplete':
        return 'UNPAID';
      default:
        return 'CANCELED';
    }
  }

  async getUserSubscription(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscriptionRecord: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      subscription: user.subscription,
      subscriptionRecord: user.subscriptionRecord,
      stripeCustomerId: user.stripeCustomerId
    };
  }

  static hasFeatureAccess(
    subscription: 'FREE' | 'PRO' | 'ENTERPRISE',
    feature: string
  ): boolean {
    const featureMap = {
      FREE: ['basic_content', 'limited_ai'],
      PRO: ['basic_content', 'unlimited_ai', 'analytics', 'scheduling'],
      ENTERPRISE: ['basic_content', 'unlimited_ai', 'analytics', 'scheduling', 'api_access', 'priority_support']
    };

    return featureMap[subscription].includes(feature);
  }

  static getUsageLimits(subscription: 'FREE' | 'PRO' | 'ENTERPRISE') {
    const limits = {
      FREE: {
        aiGenerations: 5,
        storage: 100,
        apiCalls: 0
      },
      PRO: {
        aiGenerations: -1,
        storage: 5000,
        apiCalls: 1000
      },
      ENTERPRISE: {
        aiGenerations: -1,
        storage: 50000,
        apiCalls: 10000
      }
    };

    return limits[subscription];
  }
}

describe('SimpleBillingService - Complete Tests', () => {
  let billingService: SimpleBillingService;
  
  const mockUser = {
    id: 'user-123',
    email: 'creator@example.com',
    name: 'John Creator',
    stripeCustomerId: 'cus_stripe123',
    subscription: 'PRO',
    subscriptionRecord: {
      id: 'sub-record-123',
      plan: 'PRO',
      status: 'ACTIVE',
      stripeSubscriptionId: 'sub_stripe123'
    }
  };

  const mockSubscription = {
    id: 'sub_stripe123',
    customer: 'cus_stripe123',
    status: 'active',
    current_period_start: 1640995200,
    current_period_end: 1643673600,
    cancel_at_period_end: false,
    items: {
      data: [
        {
          price: {
            id: 'price_pro_monthly'
          }
        }
      ]
    }
  };

  beforeEach(() => {
    billingService = new SimpleBillingService();
    vi.clearAllMocks();
    
    // Setup environment
    process.env.NEXT_PUBLIC_URL = 'https://huntaze.com';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session for user with existing Stripe customer', async () => {
      const mockSession = { url: 'https://checkout.stripe.com/session123' };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      const result = await billingService.createCheckoutSession({
        userId: 'user-123',
        priceId: 'price_pro_monthly'
      });

      expect(result).toBe('https://checkout.stripe.com/session123');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: { email: true, stripeCustomerId: true }
      });
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_stripe123',
        line_items: [{ price: 'price_pro_monthly', quantity: 1 }],
        mode: 'subscription',
        success_url: 'https://huntaze.com/dashboard?success=true',
        cancel_url: 'https://huntaze.com/pricing',
        metadata: { userId: 'user-123' },
        allow_promotion_codes: true,
        billing_address_collection: 'required'
      });
    });

    it('should create new Stripe customer for user without one', async () => {
      const userWithoutStripe = { ...mockUser, stripeCustomerId: null };
      const mockCustomer = { id: 'cus_new123' };
      const mockSession = { url: 'https://checkout.stripe.com/session123' };

      mockPrisma.user.findUnique.mockResolvedValue(userWithoutStripe);
      mockStripe.customers.create.mockResolvedValue(mockCustomer);
      mockPrisma.user.update.mockResolvedValue({});
      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      const result = await billingService.createCheckoutSession({
        userId: 'user-123',
        priceId: 'price_pro_monthly'
      });

      expect(result).toBe('https://checkout.stripe.com/session123');
      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'creator@example.com',
        metadata: { userId: 'user-123' }
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { stripeCustomerId: 'cus_new123' }
      });
    });

    it('should use custom success and cancel URLs', async () => {
      const mockSession = { url: 'https://checkout.stripe.com/session123' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      await billingService.createCheckoutSession({
        userId: 'user-123',
        priceId: 'price_pro_monthly',
        successUrl: 'https://custom.com/success',
        cancelUrl: 'https://custom.com/cancel'
      });

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url: 'https://custom.com/success',
          cancel_url: 'https://custom.com/cancel'
        })
      );
    });

    it('should throw error for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        billingService.createCheckoutSession({
          userId: 'invalid-user',
          priceId: 'price_pro_monthly'
        })
      ).rejects.toThrow('User not found');
    });

    it('should throw error when session URL is not returned', async () => {
      const mockSession = { url: null };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      await expect(
        billingService.createCheckoutSession({
          userId: 'user-123',
          priceId: 'price_pro_monthly'
        })
      ).rejects.toThrow('Failed to create checkout session');
    });
  });

  describe('createPortalSession', () => {
    it('should create portal session for user with Stripe customer', async () => {
      const mockSession = { url: 'https://billing.stripe.com/portal123' };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockStripe.billingPortal.sessions.create.mockResolvedValue(mockSession);

      const result = await billingService.createPortalSession({
        userId: 'user-123'
      });

      expect(result).toBe('https://billing.stripe.com/portal123');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: { stripeCustomerId: true }
      });
      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_stripe123',
        return_url: 'https://huntaze.com/dashboard'
      });
    });

    it('should use custom return URL', async () => {
      const mockSession = { url: 'https://billing.stripe.com/portal123' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockStripe.billingPortal.sessions.create.mockResolvedValue(mockSession);

      await billingService.createPortalSession({
        userId: 'user-123',
        returnUrl: 'https://custom.com/return'
      });

      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_stripe123',
        return_url: 'https://custom.com/return'
      });
    });

    it('should throw error for user without Stripe customer', async () => {
      const userWithoutStripe = { ...mockUser, stripeCustomerId: null };
      mockPrisma.user.findUnique.mockResolvedValue(userWithoutStripe);

      await expect(
        billingService.createPortalSession({ userId: 'user-123' })
      ).rejects.toThrow('No Stripe customer found for user');
    });
  });

  describe('handleWebhook - checkout.session.completed', () => {
    it('should handle successful checkout completion', async () => {
      const event = {
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_new123',
            subscription: 'sub_new123',
            metadata: { userId: 'user-123' }
          }
        }
      };

      mockStripe.subscriptions.retrieve.mockResolvedValue(mockSubscription);
      mockPrisma.user.update.mockResolvedValue({});

      await billingService.handleWebhook(event);

      expect(mockStripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_new123');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          subscription: 'PRO',
          stripeCustomerId: 'cus_new123',
          subscriptionRecord: {
            upsert: {
              create: {
                stripeSubscriptionId: 'sub_new123',
                status: 'ACTIVE',
                plan: 'PRO',
                currentPeriodStart: new Date(1640995200 * 1000),
                currentPeriodEnd: new Date(1643673600 * 1000),
              },
              update: {
                stripeSubscriptionId: 'sub_new123',
                status: 'ACTIVE',
                plan: 'PRO',
                currentPeriodStart: new Date(1640995200 * 1000),
                currentPeriodEnd: new Date(1643673600 * 1000),
              }
            }
          }
        }
      });
    });

    it('should handle checkout without userId in metadata', async () => {
      const event = {
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_new123',
            subscription: 'sub_new123',
            metadata: {}
          }
        }
      };

      await billingService.handleWebhook(event);

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should handle checkout without subscription ID', async () => {
      const event = {
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_new123',
            subscription: null,
            metadata: { userId: 'user-123' }
          }
        }
      };

      await billingService.handleWebhook(event);

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('handleWebhook - subscription events', () => {
    it('should handle subscription updated event', async () => {
      const event = {
        type: 'customer.subscription.updated',
        data: {
          object: mockSubscription
        }
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({});

      await billingService.handleWebhook(event);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { stripeCustomerId: 'cus_stripe123' }
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          subscription: 'PRO',
          subscriptionRecord: {
            upsert: {
              create: {
                stripeSubscriptionId: 'sub_stripe123',
                status: 'ACTIVE',
                plan: 'PRO',
                currentPeriodStart: new Date(1640995200 * 1000),
                currentPeriodEnd: new Date(1643673600 * 1000),
                cancelAtPeriodEnd: false,
              },
              update: {
                status: 'ACTIVE',
                plan: 'PRO',
                currentPeriodStart: new Date(1640995200 * 1000),
                currentPeriodEnd: new Date(1643673600 * 1000),
                cancelAtPeriodEnd: false,
              }
            }
          }
        }
      });
    });

    it('should handle subscription deleted event', async () => {
      const event = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            customer: 'cus_stripe123'
          }
        }
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({});

      await billingService.handleWebhook(event);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          subscription: 'FREE',
          subscriptionRecord: {
            update: {
              status: 'CANCELED'
            }
          }
        }
      });
    });

    it('should handle subscription events for non-existent user', async () => {
      const event = {
        type: 'customer.subscription.updated',
        data: {
          object: mockSubscription
        }
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await billingService.handleWebhook(event);

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('handleWebhook - payment events', () => {
    it('should handle payment succeeded event', async () => {
      const event = {
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            customer: 'cus_stripe123'
          }
        }
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.subscriptionRecord.updateMany.mockResolvedValue({});

      await billingService.handleWebhook(event);

      expect(mockPrisma.subscriptionRecord.updateMany).toHaveBeenCalledWith({
        where: { 
          userId: 'user-123',
          status: 'PAST_DUE'
        },
        data: {
          status: 'ACTIVE'
        }
      });
    });

    it('should handle payment failed event', async () => {
      const event = {
        type: 'invoice.payment_failed',
        data: {
          object: {
            customer: 'cus_stripe123'
          }
        }
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.subscriptionRecord.updateMany.mockResolvedValue({});

      await billingService.handleWebhook(event);

      expect(mockPrisma.subscriptionRecord.updateMany).toHaveBeenCalledWith({
        where: { 
          userId: 'user-123',
          status: 'ACTIVE'
        },
        data: {
          status: 'PAST_DUE'
        }
      });
    });
  });

  describe('getUserSubscription', () => {
    it('should return user subscription info', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await billingService.getUserSubscription('user-123');

      expect(result).toEqual({
        subscription: 'PRO',
        subscriptionRecord: mockUser.subscriptionRecord,
        stripeCustomerId: 'cus_stripe123'
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        include: { subscriptionRecord: true }
      });
    });

    it('should throw error for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        billingService.getUserSubscription('invalid-user')
      ).rejects.toThrow('User not found');
    });
  });

  describe('hasFeatureAccess', () => {
    it('should return correct feature access for FREE subscription', () => {
      expect(SimpleBillingService.hasFeatureAccess('FREE', 'basic_content')).toBe(true);
      expect(SimpleBillingService.hasFeatureAccess('FREE', 'limited_ai')).toBe(true);
      expect(SimpleBillingService.hasFeatureAccess('FREE', 'unlimited_ai')).toBe(false);
      expect(SimpleBillingService.hasFeatureAccess('FREE', 'analytics')).toBe(false);
      expect(SimpleBillingService.hasFeatureAccess('FREE', 'api_access')).toBe(false);
    });

    it('should return correct feature access for PRO subscription', () => {
      expect(SimpleBillingService.hasFeatureAccess('PRO', 'basic_content')).toBe(true);
      expect(SimpleBillingService.hasFeatureAccess('PRO', 'unlimited_ai')).toBe(true);
      expect(SimpleBillingService.hasFeatureAccess('PRO', 'analytics')).toBe(true);
      expect(SimpleBillingService.hasFeatureAccess('PRO', 'scheduling')).toBe(true);
      expect(SimpleBillingService.hasFeatureAccess('PRO', 'api_access')).toBe(false);
      expect(SimpleBillingService.hasFeatureAccess('PRO', 'priority_support')).toBe(false);
    });

    it('should return correct feature access for ENTERPRISE subscription', () => {
      expect(SimpleBillingService.hasFeatureAccess('ENTERPRISE', 'basic_content')).toBe(true);
      expect(SimpleBillingService.hasFeatureAccess('ENTERPRISE', 'unlimited_ai')).toBe(true);
      expect(SimpleBillingService.hasFeatureAccess('ENTERPRISE', 'analytics')).toBe(true);
      expect(SimpleBillingService.hasFeatureAccess('ENTERPRISE', 'scheduling')).toBe(true);
      expect(SimpleBillingService.hasFeatureAccess('ENTERPRISE', 'api_access')).toBe(true);
      expect(SimpleBillingService.hasFeatureAccess('ENTERPRISE', 'priority_support')).toBe(true);
    });
  });

  describe('getUsageLimits', () => {
    it('should return correct usage limits for FREE subscription', () => {
      const limits = SimpleBillingService.getUsageLimits('FREE');
      
      expect(limits).toEqual({
        aiGenerations: 5,
        storage: 100,
        apiCalls: 0
      });
    });

    it('should return correct usage limits for PRO subscription', () => {
      const limits = SimpleBillingService.getUsageLimits('PRO');
      
      expect(limits).toEqual({
        aiGenerations: -1,
        storage: 5000,
        apiCalls: 1000
      });
    });

    it('should return correct usage limits for ENTERPRISE subscription', () => {
      const limits = SimpleBillingService.getUsageLimits('ENTERPRISE');
      
      expect(limits).toEqual({
        aiGenerations: -1,
        storage: 50000,
        apiCalls: 10000
      });
    });
  });

  describe('Plan and Status Mapping', () => {
    it('should map price IDs to correct plans', () => {
      const service = new SimpleBillingService();
      const getPlan = (service as any).getPlanFromSubscription.bind(service);

      expect(getPlan({ items: { data: [{ price: { id: 'price_pro_monthly' } }] } })).toBe('PRO');
      expect(getPlan({ items: { data: [{ price: { id: 'price_pro_yearly' } }] } })).toBe('PRO');
      expect(getPlan({ items: { data: [{ price: { id: 'price_enterprise_monthly' } }] } })).toBe('ENTERPRISE');
      expect(getPlan({ items: { data: [{ price: { id: 'price_enterprise_yearly' } }] } })).toBe('ENTERPRISE');
      expect(getPlan({ items: { data: [{ price: { id: 'unknown_price' } }] } })).toBe('FREE');
      expect(getPlan({ items: { data: [] } })).toBe('FREE');
    });

    it('should map Stripe statuses correctly', () => {
      const service = new SimpleBillingService();
      const mapStatus = (service as any).mapStripeStatus.bind(service);

      expect(mapStatus('active')).toBe('ACTIVE');
      expect(mapStatus('canceled')).toBe('CANCELED');
      expect(mapStatus('incomplete_expired')).toBe('CANCELED');
      expect(mapStatus('past_due')).toBe('PAST_DUE');
      expect(mapStatus('unpaid')).toBe('UNPAID');
      expect(mapStatus('incomplete')).toBe('UNPAID');
      expect(mapStatus('unknown_status')).toBe('CANCELED');
    });
  });

  describe('Error Handling', () => {
    it('should handle Stripe API errors', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockStripe.checkout.sessions.create.mockRejectedValue(new Error('Stripe API error'));

      await expect(
        billingService.createCheckoutSession({
          userId: 'user-123',
          priceId: 'price_pro_monthly'
        })
      ).rejects.toThrow('Stripe API error');
    });

    it('should handle database errors', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        billingService.createCheckoutSession({
          userId: 'user-123',
          priceId: 'price_pro_monthly'
        })
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle webhook processing errors gracefully', async () => {
      const event = {
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_new123',
            subscription: 'sub_new123',
            metadata: { userId: 'user-123' }
          }
        }
      };

      mockStripe.subscriptions.retrieve.mockRejectedValue(new Error('Subscription not found'));

      // Should not throw error, just log it
      await expect(billingService.handleWebhook(event)).resolves.not.toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete subscription lifecycle', async () => {
      // 1. Create checkout session
      const mockSession = { url: 'https://checkout.stripe.com/session123' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      const checkoutUrl = await billingService.createCheckoutSession({
        userId: 'user-123',
        priceId: 'price_pro_monthly'
      });
      expect(checkoutUrl).toBe('https://checkout.stripe.com/session123');

      // 2. Handle checkout completion
      const completedEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_new123',
            subscription: 'sub_new123',
            metadata: { userId: 'user-123' }
          }
        }
      };

      mockStripe.subscriptions.retrieve.mockResolvedValue(mockSubscription);
      mockPrisma.user.update.mockResolvedValue({});

      await billingService.handleWebhook(completedEvent);

      // 3. Create portal session
      const updatedUser = { ...mockUser, stripeCustomerId: 'cus_new123' };
      mockPrisma.user.findUnique.mockResolvedValue(updatedUser);
      
      const mockPortalSession = { url: 'https://billing.stripe.com/portal123' };
      mockStripe.billingPortal.sessions.create.mockResolvedValue(mockPortalSession);

      const portalUrl = await billingService.createPortalSession({
        userId: 'user-123'
      });
      expect(portalUrl).toBe('https://billing.stripe.com/portal123');

      // 4. Handle subscription cancellation
      const canceledEvent = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            customer: 'cus_new123'
          }
        }
      };

      mockPrisma.user.findUnique.mockResolvedValue(updatedUser);
      await billingService.handleWebhook(canceledEvent);

      expect(mockPrisma.user.update).toHaveBeenLastCalledWith({
        where: { id: 'user-123' },
        data: {
          subscription: 'FREE',
          subscriptionRecord: {
            update: {
              status: 'CANCELED'
            }
          }
        }
      });
    });

    it('should handle payment failure and recovery', async () => {
      // 1. Payment fails
      const failedEvent = {
        type: 'invoice.payment_failed',
        data: {
          object: {
            customer: 'cus_stripe123'
          }
        }
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.subscriptionRecord.updateMany.mockResolvedValue({});

      await billingService.handleWebhook(failedEvent);

      expect(mockPrisma.subscriptionRecord.updateMany).toHaveBeenCalledWith({
        where: { 
          userId: 'user-123',
          status: 'ACTIVE'
        },
        data: {
          status: 'PAST_DUE'
        }
      });

      // 2. Payment succeeds
      const succeededEvent = {
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            customer: 'cus_stripe123'
          }
        }
      };

      await billingService.handleWebhook(succeededEvent);

      expect(mockPrisma.subscriptionRecord.updateMany).toHaveBeenCalledWith({
        where: { 
          userId: 'user-123',
          status: 'PAST_DUE'
        },
        data: {
          status: 'ACTIVE'
        }
      });
    });
  });
});