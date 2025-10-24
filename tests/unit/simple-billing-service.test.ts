import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

/**
 * Tests pour le service de facturation simplifié
 * Basé sur l'architecture simplifiée dans ARCHITECTURE_SIMPLIFIED.md
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
  },
  webhooks: {
    constructEvent: vi.fn()
  }
};

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
    create: vi.fn()
  },
  subscriptionRecord: {
    updateMany: vi.fn()
  }
};

// Mock du service de facturation simplifié
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
    console.log(`Processing webhook: ${event.type}`);

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

    console.log(`Subscription activated for user ${userId}: ${plan}`);
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

    console.log(`Subscription updated for user ${user.id}: ${plan} (${status})`);
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

    console.log(`Subscription canceled for user ${user.id}`);
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

    console.log(`Payment succeeded for user ${user.id}`);
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

    console.log(`Payment failed for user ${user.id}`);
  }

  private getPlanFromSubscription(subscription: any): 'FREE' | 'PRO' | 'ENTERPRISE' {
    const priceId = subscription.items.data[0]?.price.id;
    
    const priceMap: Record<string, 'FREE' | 'PRO' | 'ENTERPRISE'> = {
      [process.env.STRIPE_PRO_MONTHLY_PRICE_ID!]: 'PRO',
      [process.env.STRIPE_PRO_YEARLY_PRICE_ID!]: 'PRO',
      [process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID!]: 'ENTERPRISE',
      [process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID!]: 'ENTERPRISE',
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

describe('SimpleBillingService', () => {
  let billingService: SimpleBillingService;
  const mockUser = {
    id: 'user-123',
    email: 'creator@example.com',
    name: 'John Creator',
    stripeCustomerId: 'cus_stripe123'
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
      const mockSession = {
        url: 'https://checkout.stripe.com/session123'
      };

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

    it('should handle Stripe customer creation errors', async () => {
      const userWithoutStripe = { ...mockUser, stripeCustomerId: null };
      mockPrisma.user.findUnique.mockResolvedValue(userWithoutStripe);
      mockStripe.customers.create.mockRejectedValue(new Error('Stripe customer creation failed'));

      await expect(
        billingService.createCheckoutSession({
          userId: 'user-123',
          priceId: 'price_pro_monthly'
        })
      ).rejects.toThrow('Stripe customer creation failed');
    });
  });

  describe('createPortalSession', () => {
    it('should create portal session for user with Stripe customer', async () => {
      const mockSession = {
        url: 'https://billing.stripe.com/portal123'
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockStripe.billingPortal.sessions.create.mockResolvedValue(mockSession);

      const result = await billingService.createPortalSession('user-123');

      expect(result).toBe('https://billing.stripe.com/portal123');
      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_stripe123',
        return_url: 'https://huntaze.com/dashboard'
      });
    });

    it('should throw error for user without Stripe customer', async () => {
      const userWithoutStripe = { ...mockUser, stripeCustomerId: null };
      mockPrisma.user.findUnique.mockResolvedValue(userWithoutStripe);

      await expect(
        billingService.createPortalSession('user-123')
      ).rejects.toThrow('No Stripe customer found');
    });

    it('should throw error for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        billingService.createPortalSession('invalid-user')
      ).rejects.toThrow('No Stripe customer found');
    });
  });

  describe('handleWebhook', () => {
    it('should handle checkout.session.completed event', async () => {
      const event = {
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_new123',
            subscription: 'sub_123',
            metadata: { userId: 'user-123' },
            line_items: {
              data: [{ price: { id: 'price_pro_monthly' } }]
            }
          }
        }
      };

      mockPrisma.user.update.mockResolvedValue({});

      await billingService.handleWebhook(event);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          stripeCustomerId: 'cus_new123',
          subscription: {
            upsert: {
              create: {
                stripeSubscriptionId: 'sub_123',
                status: 'active',
                plan: 'pro'
              },
              update: {
                stripeSubscriptionId: 'sub_123',
                status: 'active'
              }
            }
          }
        }
      });
    });

    it('should handle customer.subscription.updated event', async () => {
      const event = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            customer: 'cus_stripe123',
            status: 'active',
            current_period_start: 1640995200, // 2022-01-01
            current_period_end: 1643673600    // 2022-02-01
          }
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
          subscription: {
            update: {
              status: 'active',
              currentPeriodStart: new Date(1640995200 * 1000),
              currentPeriodEnd: new Date(1643673600 * 1000)
            }
          }
        }
      });
    });

    it('should handle customer.subscription.deleted event', async () => {
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
          subscription: {
            update: {
              status: 'canceled'
            }
          }
        }
      });
    });

    it('should ignore unknown webhook events', async () => {
      const event = {
        type: 'unknown.event',
        data: { object: {} }
      };

      await billingService.handleWebhook(event);

      // Aucune action ne devrait être effectuée
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should handle checkout completed without userId in metadata', async () => {
      const event = {
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_new123',
            subscription: 'sub_123',
            metadata: {}, // Pas de userId
            line_items: {
              data: [{ price: { id: 'price_pro_monthly' } }]
            }
          }
        }
      };

      await billingService.handleWebhook(event);

      // Aucune mise à jour ne devrait être effectuée
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('getPlanFromPriceId', () => {
    it('should map price IDs to correct plans', () => {
      const service = new SimpleBillingService();
      
      // Accéder à la méthode privée pour les tests
      const getPlan = (service as any).getPlanFromPriceId.bind(service);

      expect(getPlan('price_pro_monthly')).toBe('pro');
      expect(getPlan('price_pro_yearly')).toBe('pro');
      expect(getPlan('price_enterprise_monthly')).toBe('enterprise');
      expect(getPlan('price_enterprise_yearly')).toBe('enterprise');
      expect(getPlan('unknown_price')).toBe('free');
      expect(getPlan(undefined)).toBe('free');
      expect(getPlan('')).toBe('free');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        billingService.createCheckoutSession('user-123', 'price_pro_monthly')
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle Stripe API rate limiting', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).type = 'StripeRateLimitError';
      mockStripe.checkout.sessions.create.mockRejectedValue(rateLimitError);

      await expect(
        billingService.createCheckoutSession('user-123', 'price_pro_monthly')
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle invalid price IDs gracefully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      
      const invalidPriceError = new Error('No such price');
      (invalidPriceError as any).type = 'StripeInvalidRequestError';
      mockStripe.checkout.sessions.create.mockRejectedValue(invalidPriceError);

      await expect(
        billingService.createCheckoutSession('user-123', 'invalid_price_id')
      ).rejects.toThrow('No such price');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete subscription flow', async () => {
      // 1. Créer une session de checkout
      const mockSession = { url: 'https://checkout.stripe.com/session123' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      const checkoutUrl = await billingService.createCheckoutSession('user-123', 'price_pro_monthly');
      expect(checkoutUrl).toBe('https://checkout.stripe.com/session123');

      // 2. Simuler le webhook de completion
      const completedEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_new123',
            subscription: 'sub_123',
            metadata: { userId: 'user-123' },
            line_items: {
              data: [{ price: { id: 'price_pro_monthly' } }]
            }
          }
        }
      };

      mockPrisma.user.update.mockResolvedValue({});
      await billingService.handleWebhook(completedEvent);

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-123' },
          data: expect.objectContaining({
            stripeCustomerId: 'cus_new123'
          })
        })
      );

      // 3. Créer une session de portail
      const updatedUser = { ...mockUser, stripeCustomerId: 'cus_new123' };
      mockPrisma.user.findUnique.mockResolvedValue(updatedUser);
      
      const mockPortalSession = { url: 'https://billing.stripe.com/portal123' };
      mockStripe.billingPortal.sessions.create.mockResolvedValue(mockPortalSession);

      const portalUrl = await billingService.createPortalSession('user-123');
      expect(portalUrl).toBe('https://billing.stripe.com/portal123');
    });

    it('should handle subscription cancellation flow', async () => {
      // Simuler l'annulation d'un abonnement
      const canceledEvent = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            customer: 'cus_stripe123'
          }
        }
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({});

      await billingService.handleWebhook(canceledEvent);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          subscription: {
            update: {
              status: 'canceled'
            }
          }
        }
      });
    });

    it('should handle subscription upgrade flow', async () => {
      // Simuler la mise à jour d'un abonnement (upgrade)
      const updatedEvent = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            customer: 'cus_stripe123',
            status: 'active',
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 2592000 // +30 jours
          }
        }
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({});

      await billingService.handleWebhook(updatedEvent);

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-123' },
          data: expect.objectContaining({
            subscription: expect.objectContaining({
              update: expect.objectContaining({
                status: 'active'
              })
            })
          })
        })
      );
    });
  });
});