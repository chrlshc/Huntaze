/**
 * Configuration et setup pour les tests des services simplifiés
 */

import { vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Configuration globale des mocks
beforeAll(() => {
  // Mock des variables d'environnement
  process.env.NODE_ENV = 'test';
  process.env.NEXT_PUBLIC_URL = 'https://test.huntaze.com';
  process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';
  process.env.STRIPE_PRO_MONTHLY_PRICE_ID = 'price_pro_monthly';
  process.env.STRIPE_PRO_YEARLY_PRICE_ID = 'price_pro_yearly';
  process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID = 'price_enterprise_monthly';
  process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID = 'price_enterprise_yearly';

  // Mock des modules externes
  vi.mock('stripe', () => {
    return {
      default: vi.fn().mockImplementation(() => ({
        customers: {
          create: vi.fn(),
          retrieve: vi.fn(),
          update: vi.fn(),
          delete: vi.fn()
        },
        subscriptions: {
          create: vi.fn(),
          retrieve: vi.fn(),
          update: vi.fn(),
          cancel: vi.fn(),
          list: vi.fn()
        },
        checkout: {
          sessions: {
            create: vi.fn(),
            retrieve: vi.fn(),
            list: vi.fn()
          }
        },
        billingPortal: {
          sessions: {
            create: vi.fn()
          }
        },
        webhooks: {
          constructEvent: vi.fn()
        },
        prices: {
          list: vi.fn(),
          retrieve: vi.fn()
        },
        products: {
          list: vi.fn(),
          retrieve: vi.fn()
        }
      }))
    };
  });

  // Mock de Prisma
  vi.mock('@/lib/db', () => ({
    prisma: {
      user: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        upsert: vi.fn(),
        count: vi.fn()
      },
      subscriptionRecord: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
        upsert: vi.fn()
      },
      contentAsset: {
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      },
      $transaction: vi.fn(),
      $connect: vi.fn(),
      $disconnect: vi.fn()
    }
  }));

  // Mock des services de logging
  vi.mock('console', () => ({
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  }));

  // Mock des timers pour les tests de performance
  vi.useFakeTimers();
});

afterAll(() => {
  // Nettoyer les mocks
  vi.restoreAllMocks();
  vi.useRealTimers();
});

beforeEach(() => {
  // Réinitialiser les mocks avant chaque test
  vi.clearAllMocks();
  
  // Réinitialiser les timers
  vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
});

afterEach(() => {
  // Nettoyer après chaque test
  vi.clearAllTimers();
});

// Utilitaires de test globaux
declare global {
  var testUtils: {
    createMockUser: (overrides?: any) => any;
    createMockSubscription: (overrides?: any) => any;
    createMockStripeCustomer: (overrides?: any) => any;
    createMockStripeSession: (overrides?: any) => any;
    waitForAsync: (ms?: number) => Promise<void>;
    mockDate: (date: string | Date) => void;
    restoreDate: () => void;
  };
}

// Utilitaires de test
globalThis.testUtils = {
  /**
   * Crée un utilisateur mock avec des valeurs par défaut
   */
  createMockUser: (overrides = {}) => ({
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    subscription: 'FREE',
    stripeCustomerId: null,
    role: 'CREATOR',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    deletedAt: null,
    subscriptionRecord: null,
    contentAssets: [],
    ...overrides
  }),

  /**
   * Crée un abonnement mock avec des valeurs par défaut
   */
  createMockSubscription: (overrides = {}) => ({
    id: 'sub-123',
    userId: 'user-123',
    plan: 'PRO',
    status: 'ACTIVE',
    stripeSubscriptionId: 'sub_stripe123',
    currentPeriodStart: new Date('2024-01-01'),
    currentPeriodEnd: new Date('2024-02-01'),
    cancelAtPeriodEnd: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    ...overrides
  }),

  /**
   * Crée un client Stripe mock avec des valeurs par défaut
   */
  createMockStripeCustomer: (overrides = {}) => ({
    id: 'cus_stripe123',
    email: 'test@example.com',
    name: 'Test User',
    metadata: {
      userId: 'user-123'
    },
    created: Math.floor(Date.now() / 1000),
    ...overrides
  }),

  /**
   * Crée une session Stripe mock avec des valeurs par défaut
   */
  createMockStripeSession: (overrides = {}) => ({
    id: 'cs_session123',
    url: 'https://checkout.stripe.com/session123',
    customer: 'cus_stripe123',
    subscription: 'sub_stripe123',
    mode: 'subscription',
    status: 'complete',
    metadata: {
      userId: 'user-123'
    },
    ...overrides
  }),

  /**
   * Utilitaire pour attendre de manière asynchrone
   */
  waitForAsync: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Mock une date spécifique
   */
  mockDate: (date: string | Date) => {
    const mockDate = new Date(date);
    vi.setSystemTime(mockDate);
  },

  /**
   * Restaure la date réelle
   */
  restoreDate: () => {
    vi.useRealTimers();
    vi.useFakeTimers();
  }
};

// Configuration des matchers personnalisés
expect.extend({
  /**
   * Vérifie qu'un objet a les propriétés d'un utilisateur valide
   */
  toBeValidUser(received) {
    const requiredProperties = ['id', 'email', 'name', 'subscription', 'role'];
    const missingProperties = requiredProperties.filter(prop => !(prop in received));
    
    if (missingProperties.length > 0) {
      return {
        message: () => `Expected object to have user properties: ${missingProperties.join(', ')}`,
        pass: false
      };
    }

    const validSubscriptions = ['FREE', 'PRO', 'ENTERPRISE'];
    if (!validSubscriptions.includes(received.subscription)) {
      return {
        message: () => `Expected subscription to be one of: ${validSubscriptions.join(', ')}, got: ${received.subscription}`,
        pass: false
      };
    }

    const validRoles = ['CREATOR', 'ADMIN'];
    if (!validRoles.includes(received.role)) {
      return {
        message: () => `Expected role to be one of: ${validRoles.join(', ')}, got: ${received.role}`,
        pass: false
      };
    }

    return {
      message: () => 'Expected object not to be a valid user',
      pass: true
    };
  },

  /**
   * Vérifie qu'un objet a les propriétés d'un abonnement valide
   */
  toBeValidSubscription(received) {
    const requiredProperties = ['id', 'userId', 'plan', 'status'];
    const missingProperties = requiredProperties.filter(prop => !(prop in received));
    
    if (missingProperties.length > 0) {
      return {
        message: () => `Expected object to have subscription properties: ${missingProperties.join(', ')}`,
        pass: false
      };
    }

    const validPlans = ['FREE', 'PRO', 'ENTERPRISE'];
    if (!validPlans.includes(received.plan)) {
      return {
        message: () => `Expected plan to be one of: ${validPlans.join(', ')}, got: ${received.plan}`,
        pass: false
      };
    }

    const validStatuses = ['ACTIVE', 'CANCELED', 'PAST_DUE', 'UNPAID'];
    if (!validStatuses.includes(received.status)) {
      return {
        message: () => `Expected status to be one of: ${validStatuses.join(', ')}, got: ${received.status}`,
        pass: false
      };
    }

    return {
      message: () => 'Expected object not to be a valid subscription',
      pass: true
    };
  },

  /**
   * Vérifie qu'une promesse se résout dans un délai donné
   */
  async toResolveWithin(received, timeout) {
    const startTime = Date.now();
    
    try {
      await Promise.race([
        received,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]);
      
      const duration = Date.now() - startTime;
      
      return {
        message: () => `Expected promise to take longer than ${timeout}ms, but resolved in ${duration}ms`,
        pass: true
      };
    } catch (error) {
      if (error.message === 'Timeout') {
        return {
          message: () => `Expected promise to resolve within ${timeout}ms, but it timed out`,
          pass: false
        };
      }
      
      // Re-throw other errors
      throw error;
    }
  }
});

// Types pour les matchers personnalisés
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeValidUser(): T;
    toBeValidSubscription(): T;
    toResolveWithin(timeout: number): Promise<T>;
  }
  interface AsymmetricMatchersContaining {
    toBeValidUser(): any;
    toBeValidSubscription(): any;
    toResolveWithin(timeout: number): any;
  }
}

// Configuration des handlers d'erreur pour les tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Export des utilitaires pour utilisation dans les tests
export { testUtils } from './simple-services-setup';