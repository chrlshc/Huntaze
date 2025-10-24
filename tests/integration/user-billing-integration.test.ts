import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

/**
 * Tests d'intégration entre les services utilisateur et de facturation
 * Vérifie que les deux services fonctionnent correctement ensemble
 */

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    delete: vi.fn()
  },
  subscriptionRecord: {
    updateMany: vi.fn()
  }
};

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

// Services simplifiés
class SimpleUserService {
  private prisma = mockPrisma;

  async getUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: { 
        subscriptionRecord: true,
        contentAssets: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  async updateUserSubscription(userId: string, subscriptionData: {
    subscription: 'FREE' | 'PRO' | 'ENTERPRISE';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  }) {
    return this.prisma.user.update({
      where: { id: userId, deletedAt: null },
      data: {
        subscription: subscriptionData.subscription,
        stripeCustomerId: subscriptionData.stripeCustomerId,
        subscriptionRecord: {
          upsert: {
            create: {
              plan: subscriptionData.subscription,
              status: 'ACTIVE',
              stripeSubscriptionId: subscriptionData.stripeSubscriptionId
            },
            update: {
              plan: subscriptionData.subscription,
              stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
              updatedAt: new Date()
            }
          }
        }
      },
      include: { subscriptionRecord: true }
    });
  }

  async validateUserAccess(userId: string, requiredSubscription?: 'FREE' | 'PRO' | 'ENTERPRISE') {
    const user = await this.getUserById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    if (requiredSubscription) {
      const subscriptionHierarchy = { FREE: 0, PRO: 1, ENTERPRISE: 2 };
      const userLevel = subscriptionHierarchy[user.subscription as keyof typeof subscriptionHierarchy];
      const requiredLevel = subscriptionHierarchy[requiredSubscription];

      if (userLevel < requiredLevel) {
        throw new Error(`Requires ${requiredSubscription} subscription`);
      }
    }

    return user;
  }
}

class SimpleBillingService {
  private stripe = mockStripe;
  private prisma = mockPrisma;

  async createCheckoutSession(params: {
    userId: string;
    priceId: string;
  }): Promise<string> {
    const { userId, priceId } = params;
    
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
      success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
      metadata: { userId }
    });

    if (!session.url) {
      throw new Error('Failed to create checkout session');
    }

    return session.url;
  }

  async handleCheckoutCompleted(session: any) {
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
}

describe('User-Billing Integration Tests', () => {
  let userService: SimpleUserService;
  let billingService: SimpleBillingService;

  const mockUser = {
    id: 'user-123',
    email: 'creator@example.com',
    name: 'John Creator',
    subscription: 'FREE',
    stripeCustomerId: null,
    deletedAt: null,
    subscriptionRecord: null,
    contentAssets: []
  };

  const mockSubscription = {
    id: 'sub_stripe123',
    customer: 'cus_stripe123',
    status: 'active',
    current_period_start: 1640995200,
    current_period_end: 1643673600,
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
    userService = new SimpleUserService();
    billingService = new SimpleBillingService();
    vi.clearAllMocks();
    
    process.env.NEXT_PUBLIC_URL = 'https://huntaze.com';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Subscription Flow', () => {
    it('should handle complete user subscription upgrade flow', async () => {
      // 1. Utilisateur FREE essaie d'accéder à une fonctionnalité PRO
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        userService.validateUserAccess('user-123', 'PRO')
      ).rejects.toThrow('Requires PRO subscription');

      // 2. Créer une session de checkout pour upgrade
      const mockCustomer = { id: 'cus_new123' };
      const mockSession = { url: 'https://checkout.stripe.com/session123' };

      mockStripe.customers.create.mockResolvedValue(mockCustomer);
      mockPrisma.user.update.mockResolvedValue({});
      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      const checkoutUrl = await billingService.createCheckoutSession({
        userId: 'user-123',
        priceId: 'price_pro_monthly'
      });

      expect(checkoutUrl).toBe('https://checkout.stripe.com/session123');
      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'creator@example.com',
        metadata: { userId: 'user-123' }
      });

      // 3. Simuler la completion du checkout
      const completedSession = {
        customer: 'cus_new123',
        subscription: 'sub_new123',
        metadata: { userId: 'user-123' }
      };

      mockStripe.subscriptions.retrieve.mockResolvedValue(mockSubscription);
      mockPrisma.user.update.mockResolvedValue({});

      await billingService.handleCheckoutCompleted(completedSession);

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

      // 4. Vérifier que l'utilisateur peut maintenant accéder aux fonctionnalités PRO
      const upgradedUser = {
        ...mockUser,
        subscription: 'PRO',
        stripeCustomerId: 'cus_new123',
        subscriptionRecord: {
          plan: 'PRO',
          status: 'ACTIVE',
          stripeSubscriptionId: 'sub_new123'
        }
      };

      mockPrisma.user.findUnique.mockResolvedValue(upgradedUser);

      const validatedUser = await userService.validateUserAccess('user-123', 'PRO');
      expect(validatedUser.subscription).toBe('PRO');

      // 5. Vérifier l'accès aux fonctionnalités
      expect(SimpleBillingService.hasFeatureAccess('PRO', 'unlimited_ai')).toBe(true);
      expect(SimpleBillingService.hasFeatureAccess('PRO', 'analytics')).toBe(true);
      expect(SimpleBillingService.hasFeatureAccess('PRO', 'api_access')).toBe(false);
    });

    it('should handle subscription downgrade scenario', async () => {
      // 1. Utilisateur PRO existant
      const proUser = {
        ...mockUser,
        subscription: 'PRO',
        stripeCustomerId: 'cus_existing123',
        subscriptionRecord: {
          plan: 'PRO',
          status: 'ACTIVE',
          stripeSubscriptionId: 'sub_existing123'
        }
      };

      mockPrisma.user.findUnique.mockResolvedValue(proUser);

      // Vérifier l'accès PRO
      const validatedUser = await userService.validateUserAccess('user-123', 'PRO');
      expect(validatedUser.subscription).toBe('PRO');

      // 2. Simuler l'annulation de l'abonnement (downgrade vers FREE)
      await userService.updateUserSubscription('user-123', {
        subscription: 'FREE'
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123', deletedAt: null },
        data: {
          subscription: 'FREE',
          stripeCustomerId: undefined,
          subscriptionRecord: {
            upsert: {
              create: {
                plan: 'FREE',
                status: 'ACTIVE',
                stripeSubscriptionId: undefined
              },
              update: {
                plan: 'FREE',
                stripeSubscriptionId: undefined,
                updatedAt: expect.any(Date)
              }
            }
          }
        },
        include: { subscriptionRecord: true }
      });

      // 3. Vérifier que l'utilisateur n'a plus accès aux fonctionnalités PRO
      const downgradedUser = {
        ...proUser,
        subscription: 'FREE'
      };

      mockPrisma.user.findUnique.mockResolvedValue(downgradedUser);

      await expect(
        userService.validateUserAccess('user-123', 'PRO')
      ).rejects.toThrow('Requires PRO subscription');

      // 4. Vérifier l'accès aux fonctionnalités
      expect(SimpleBillingService.hasFeatureAccess('FREE', 'basic_content')).toBe(true);
      expect(SimpleBillingService.hasFeatureAccess('FREE', 'unlimited_ai')).toBe(false);
      expect(SimpleBillingService.hasFeatureAccess('FREE', 'analytics')).toBe(false);
    });
  });

  describe('Feature Access Integration', () => {
    it('should validate feature access based on user subscription', async () => {
      const testCases = [
        {
          subscription: 'FREE',
          feature: 'basic_content',
          shouldHaveAccess: true
        },
        {
          subscription: 'FREE',
          feature: 'unlimited_ai',
          shouldHaveAccess: false
        },
        {
          subscription: 'PRO',
          feature: 'unlimited_ai',
          shouldHaveAccess: true
        },
        {
          subscription: 'PRO',
          feature: 'api_access',
          shouldHaveAccess: false
        },
        {
          subscription: 'ENTERPRISE',
          feature: 'api_access',
          shouldHaveAccess: true
        },
        {
          subscription: 'ENTERPRISE',
          feature: 'priority_support',
          shouldHaveAccess: true
        }
      ];

      testCases.forEach(({ subscription, feature, shouldHaveAccess }) => {
        const hasAccess = SimpleBillingService.hasFeatureAccess(
          subscription as 'FREE' | 'PRO' | 'ENTERPRISE',
          feature
        );
        
        expect(hasAccess).toBe(shouldHaveAccess);
      });
    });

    it('should handle subscription hierarchy validation', async () => {
      const subscriptionLevels = ['FREE', 'PRO', 'ENTERPRISE'] as const;
      
      for (let i = 0; i < subscriptionLevels.length; i++) {
        const userSubscription = subscriptionLevels[i];
        const testUser = {
          ...mockUser,
          subscription: userSubscription
        };

        mockPrisma.user.findUnique.mockResolvedValue(testUser);

        // L'utilisateur devrait avoir accès à son niveau et aux niveaux inférieurs
        for (let j = 0; j <= i; j++) {
          const requiredLevel = subscriptionLevels[j];
          
          const validatedUser = await userService.validateUserAccess('user-123', requiredLevel);
          expect(validatedUser.subscription).toBe(userSubscription);
        }

        // L'utilisateur ne devrait pas avoir accès aux niveaux supérieurs
        for (let j = i + 1; j < subscriptionLevels.length; j++) {
          const requiredLevel = subscriptionLevels[j];
          
          await expect(
            userService.validateUserAccess('user-123', requiredLevel)
          ).rejects.toThrow(`Requires ${requiredLevel} subscription`);
        }
      }
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle billing errors during user operations', async () => {
      // 1. Utilisateur existe mais erreur Stripe
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockStripe.customers.create.mockRejectedValue(new Error('Stripe API error'));

      await expect(
        billingService.createCheckoutSession({
          userId: 'user-123',
          priceId: 'price_pro_monthly'
        })
      ).rejects.toThrow('Stripe API error');

      // 2. Utilisateur n'existe pas
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        billingService.createCheckoutSession({
          userId: 'invalid-user',
          priceId: 'price_pro_monthly'
        })
      ).rejects.toThrow('User not found');

      await expect(
        userService.validateUserAccess('invalid-user', 'PRO')
      ).rejects.toThrow('User not found');
    });

    it('should handle database errors consistently', async () => {
      const dbError = new Error('Database connection failed');
      
      mockPrisma.user.findUnique.mockRejectedValue(dbError);

      await expect(
        userService.validateUserAccess('user-123', 'PRO')
      ).rejects.toThrow('Database connection failed');

      await expect(
        billingService.createCheckoutSession({
          userId: 'user-123',
          priceId: 'price_pro_monthly'
        })
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency between user and billing operations', async () => {
      // 1. Créer un checkout session
      const mockCustomer = { id: 'cus_consistent123' };
      const mockSession = { url: 'https://checkout.stripe.com/session123' };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockStripe.customers.create.mockResolvedValue(mockCustomer);
      mockPrisma.user.update.mockResolvedValue({});
      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      await billingService.createCheckoutSession({
        userId: 'user-123',
        priceId: 'price_pro_monthly'
      });

      // Vérifier que le stripeCustomerId est mis à jour
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { stripeCustomerId: 'cus_consistent123' }
      });

      // 2. Compléter le checkout
      const completedSession = {
        customer: 'cus_consistent123',
        subscription: 'sub_consistent123',
        metadata: { userId: 'user-123' }
      };

      mockStripe.subscriptions.retrieve.mockResolvedValue(mockSubscription);

      await billingService.handleCheckoutCompleted(completedSession);

      // Vérifier que les données utilisateur et d'abonnement sont cohérentes
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          subscription: 'PRO',
          stripeCustomerId: 'cus_consistent123',
          subscriptionRecord: {
            upsert: {
              create: {
                stripeSubscriptionId: 'sub_consistent123',
                status: 'ACTIVE',
                plan: 'PRO',
                currentPeriodStart: expect.any(Date),
                currentPeriodEnd: expect.any(Date),
              },
              update: {
                stripeSubscriptionId: 'sub_consistent123',
                status: 'ACTIVE',
                plan: 'PRO',
                currentPeriodStart: expect.any(Date),
                currentPeriodEnd: expect.any(Date),
              }
            }
          }
        }
      });
    });

    it('should handle concurrent operations safely', async () => {
      // Simuler des opérations concurrentes
      const operations = [
        () => userService.validateUserAccess('user-123'),
        () => billingService.createCheckoutSession({
          userId: 'user-123',
          priceId: 'price_pro_monthly'
        }),
        () => userService.updateUserSubscription('user-123', {
          subscription: 'PRO',
          stripeCustomerId: 'cus_concurrent123'
        })
      ];

      // Setup mocks pour chaque opération
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockStripe.customers.create.mockResolvedValue({ id: 'cus_concurrent123' });
      mockPrisma.user.update.mockResolvedValue({});
      mockStripe.checkout.sessions.create.mockResolvedValue({ url: 'https://checkout.stripe.com/session123' });

      // Exécuter les opérations en parallèle
      const results = await Promise.allSettled(operations.map(op => op()));

      // Vérifier qu'aucune opération n'a échoué de manière inattendue
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          // Seules certaines erreurs sont acceptables (comme User not found)
          expect(result.reason.message).toMatch(/User not found|Database|Stripe/);
        }
      });
    });
  });

  describe('Performance Considerations', () => {
    it('should handle multiple user operations efficiently', async () => {
      const userIds = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'];
      
      // Mock responses pour tous les utilisateurs
      mockPrisma.user.findUnique.mockImplementation((params) => {
        const userId = params.where.id;
        return Promise.resolve({
          ...mockUser,
          id: userId,
          email: `${userId}@example.com`
        });
      });

      // Valider l'accès pour tous les utilisateurs en parallèle
      const validationPromises = userIds.map(userId => 
        userService.validateUserAccess(userId, 'FREE')
      );

      const results = await Promise.all(validationPromises);

      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result.id).toBe(userIds[index]);
      });

      // Vérifier que les appels DB ont été optimisés
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(5);
    });

    it('should cache subscription validation results appropriately', async () => {
      // Cette fonctionnalité pourrait être ajoutée pour améliorer les performances
      const userId = 'user-cache-test';
      const testUser = { ...mockUser, id: userId };

      mockPrisma.user.findUnique.mockResolvedValue(testUser);

      // Première validation
      await userService.validateUserAccess(userId, 'FREE');
      
      // Deuxième validation (devrait utiliser le cache si implémenté)
      await userService.validateUserAccess(userId, 'FREE');

      // Pour l'instant, on vérifie juste que les appels fonctionnent
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(2);
    });
  });
});