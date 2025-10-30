import { vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

/**
 * Configuration et setup pour les tests des services simplifiés Huntaze
 * Initialise les mocks, l'environnement de test et les utilitaires communs
 */

// Configuration globale des timeouts
vi.setConfig({
  testTimeout: 30000,
  hookTimeout: 10000
});

// Mock des modules externes
vi.mock('stripe', () => ({
  default: vi.fn(() => ({
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
      cancel: vi.fn()
    },
    checkout: {
      sessions: {
        create: vi.fn(),
        retrieve: vi.fn()
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
    }
  }))
}));

// Mock de Prisma (si utilisé)
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn()
    },
    subscription: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $transaction: vi.fn()
  }))
}));

// Mock des variables d'environnement
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_URL = 'https://test.huntaze.com';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key_for_simple_services';
process.env.STRIPE_PRO_MONTHLY_PRICE_ID = 'price_pro_monthly_mock';
process.env.STRIPE_PRO_YEARLY_PRICE_ID = 'price_pro_yearly_mock';
process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID = 'price_enterprise_monthly_mock';
process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID = 'price_enterprise_yearly_mock';

// Utilitaires de test globaux
global.testUtils = {
  // Créer un utilisateur mock
  createMockUser: (overrides = {}) => ({
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email: 'test@huntaze.com',
    name: 'Test User',
    subscription: 'free' as const,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  // Créer des stats utilisateur mock
  createMockUserStats: (overrides = {}) => ({
    totalAssets: 10,
    totalCampaigns: 3,
    totalRevenue: 1500,
    engagementRate: 0.85,
    lastLoginAt: new Date(),
    ...overrides
  }),

  // Créer un abonnement mock
  createMockSubscription: (overrides = {}) => ({
    id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId: 'user-test-123',
    planId: 'pro',
    status: 'active' as const,
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    stripeSubscriptionId: 'sub_stripe_123',
    stripeCustomerId: 'cus_stripe_123',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  // Créer un événement webhook Stripe mock
  createMockWebhookEvent: (type: string, data: any = {}) => ({
    id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    data: {
      id: 'sub_mock_123',
      customer: 'cus_mock_123',
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
      },
      ...data
    },
    created: Math.floor(Date.now() / 1000)
  }),

  // Créer un client Stripe mock
  createMockStripeCustomer: (overrides = {}) => ({
    id: 'cus_mock_123',
    email: 'test@huntaze.com',
    name: 'Test User',
    created: Math.floor(Date.now() / 1000),
    metadata: {},
    ...overrides
  }),

  // Attendre de manière asynchrone
  waitForAsync: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),

  // Générer un ID unique
  generateId: (prefix = 'test') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,

  // Mock d'une date fixe
  mockDate: (dateString: string) => {
    const mockDate = new Date(dateString);
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
    return mockDate;
  },

  // Restaurer les timers réels
  restoreDate: () => {
    vi.useRealTimers();
  },

  // Créer des données de test en lot
  createBulkTestData: (count: number, factory: (index: number) => any) => {
    return Array.from({ length: count }, (_, index) => factory(index));
  },

  // Vérifier qu'une promesse se résout dans un délai donné
  expectToResolveWithin: async (promise: Promise<any>, timeoutMs: number) => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Promise did not resolve within ${timeoutMs}ms`)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  },

  // Simuler une erreur réseau
  simulateNetworkError: () => {
    const error = new Error('Network Error');
    (error as any).code = 'NETWORK_ERROR';
    return error;
  },

  // Simuler une erreur Stripe
  simulateStripeError: (type = 'card_error', code = 'card_declined') => {
    const error = new Error('Your card was declined.');
    (error as any).type = type;
    (error as any).code = code;
    (error as any).decline_code = 'generic_decline';
    return error;
  }
};

// Matchers personnalisés pour Vitest
expect.extend({
  // Vérifier qu'un objet est un utilisateur valide
  toBeValidUser(received) {
    const isValid = received &&
      typeof received.id === 'string' &&
      typeof received.email === 'string' &&
      typeof received.name === 'string' &&
      ['free', 'pro', 'enterprise'].includes(received.subscription) &&
      typeof received.isActive === 'boolean' &&
      received.createdAt instanceof Date &&
      received.updatedAt instanceof Date;

    return {
      pass: isValid,
      message: () => isValid 
        ? `Expected ${received} not to be a valid user`
        : `Expected ${received} to be a valid user with required fields`
    };
  },

  // Vérifier qu'un objet est un abonnement valide
  toBeValidSubscription(received) {
    const isValid = received &&
      typeof received.id === 'string' &&
      typeof received.userId === 'string' &&
      typeof received.planId === 'string' &&
      ['active', 'canceled', 'past_due', 'unpaid'].includes(received.status) &&
      received.currentPeriodStart instanceof Date &&
      received.currentPeriodEnd instanceof Date;

    return {
      pass: isValid,
      message: () => isValid 
        ? `Expected ${received} not to be a valid subscription`
        : `Expected ${received} to be a valid subscription with required fields`
    };
  },

  // Vérifier qu'une promesse se résout dans un délai donné
  async toResolveWithin(received: Promise<any>, timeoutMs: number) {
    try {
      await global.testUtils.expectToResolveWithin(received, timeoutMs);
      return {
        pass: true,
        message: () => `Expected promise not to resolve within ${timeoutMs}ms`
      };
    } catch (error) {
      return {
        pass: false,
        message: () => `Expected promise to resolve within ${timeoutMs}ms but it didn't`
      };
    }
  }
});

// Configuration avant tous les tests
beforeAll(async () => {
  // Initialiser les mocks globaux
  console.log('🚀 Initializing Simple Services Test Suite');
  
  // Configurer les mocks de console pour réduire le bruit
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  
  // Garder console.error pour les vrais problèmes
  const originalError = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args) => {
    // Afficher seulement les erreurs importantes
    if (args[0]?.includes?.('Test error') || args[0]?.includes?.('Expected')) {
      return;
    }
    originalError(...args);
  });
});

// Configuration après tous les tests
afterAll(async () => {
  console.log('✅ Simple Services Test Suite Completed');
  
  // Nettoyer les mocks globaux
  vi.restoreAllMocks();
  vi.clearAllTimers();
  vi.useRealTimers();
});

// Configuration avant chaque test
beforeEach(() => {
  // Réinitialiser tous les mocks
  vi.clearAllMocks();
  
  // Réinitialiser les timers si nécessaire
  if (vi.isFakeTimers()) {
    vi.clearAllTimers();
  }
  
  // Réinitialiser les variables d'environnement
  process.env.NODE_ENV = 'test';
  process.env.NEXT_PUBLIC_URL = 'https://test.huntaze.com';
});

// Configuration après chaque test
afterEach(() => {
  // Nettoyer les mocks
  vi.clearAllMocks();
  
  // Restaurer les timers réels si des faux timers étaient utilisés
  if (vi.isFakeTimers()) {
    vi.useRealTimers();
  }
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Export des utilitaires pour utilisation dans les tests
export { global as testUtils };

// Types pour TypeScript
declare global {
  var testUtils: {
    createMockUser: (overrides?: any) => any;
    createMockUserStats: (overrides?: any) => any;
    createMockSubscription: (overrides?: any) => any;
    createMockWebhookEvent: (type: string, data?: any) => any;
    createMockStripeCustomer: (overrides?: any) => any;
    waitForAsync: (ms?: number) => Promise<void>;
    generateId: (prefix?: string) => string;
    mockDate: (dateString: string) => Date;
    restoreDate: () => void;
    createBulkTestData: (count: number, factory: (index: number) => any) => any[];
    expectToResolveWithin: (promise: Promise<any>, timeoutMs: number) => Promise<any>;
    simulateNetworkError: () => Error;
    simulateStripeError: (type?: string, code?: string) => Error;
  };

  namespace Vi {
    interface AsymmetricMatchersContaining {
      toBeValidUser(): any;
      toBeValidSubscription(): any;
      toResolveWithin(timeoutMs: number): any;
    }
  }
}

export default {};