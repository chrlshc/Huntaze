# Guide des Tests d'Intégration

Guide complet pour écrire et maintenir les tests d'intégration dans Huntaze.

## Vue d'ensemble

Les tests d'intégration vérifient que les différents composants du système fonctionnent correctement ensemble. Ils testent les interactions entre les API routes, les services, la base de données et les services externes.

## Structure des Tests

```
tests/integration/
├── setup/
│   ├── global-setup.ts          # Configuration globale
│   ├── test-database.ts         # Gestion DB de test
│   └── mock-redis.ts            # Mock Redis
├── fixtures/
│   ├── factories.ts             # Factories de données
│   └── test-helpers.ts          # Helpers réutilisables
├── auth/
│   └── oauth-flows.test.ts      # Tests OAuth
├── dashboard/
│   └── dashboard.test.ts        # Tests dashboard
├── content/
│   └── content.test.ts          # Tests content
├── messages/
│   ├── unified.test.ts          # Tests messages unifiés
│   └── thread.test.ts           # Tests threads
├── revenue/
│   ├── pricing.test.ts          # Tests pricing
│   └── churn.test.ts            # Tests churn
├── marketing/
│   └── campaigns.test.ts        # Tests campaigns
└── rate-limiter/
    └── middleware.test.ts       # Tests rate limiting
```

## Configuration

### Vitest Config

```typescript
// vitest.config.integration.ts
export default defineConfig({
  test: {
    name: 'integration',
    include: ['tests/integration/**/*.test.ts'],
    globals: true,
    environment: 'node',
    setupFiles: ['tests/integration/setup/global-setup.ts'],
    testTimeout: 15000,
    coverage: {
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85,
      },
    },
  },
});
```

### Variables d'environnement

```bash
# .env.test
DATABASE_URL="postgresql://test:test@localhost:5432/huntaze_test"
REDIS_URL="redis://localhost:6379"
NODE_ENV="test"
```

## Écrire un Test d'Intégration

### Structure de Base

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestUser, cleanupTestData } from '../fixtures/test-helpers';

describe('API Endpoint Tests', () => {
  let testUser: TestUser;

  beforeEach(async () => {
    // Setup: créer les données de test
    testUser = await createTestUser();
  });

  afterEach(async () => {
    // Cleanup: nettoyer les données
    await cleanupTestData(testUser.id);
  });

  it('should return expected data', async () => {
    // Arrange: préparer la requête
    const url = `http://localhost:3000/api/endpoint`;
    
    // Act: exécuter l'action
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${testUser.token}`,
      },
    });
    
    // Assert: vérifier les résultats
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('expectedField');
  });
});
```

### Exemple Complet: Test Dashboard

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestUser } from '../fixtures/test-helpers';
import { createTestContent } from '../fixtures/factories';

describe('Dashboard API Integration Tests', () => {
  let testUser: TestUser;

  beforeEach(async () => {
    testUser = await createTestUser({
      role: 'creator',
      platforms: ['instagram', 'tiktok'],
    });
    
    // Créer du contenu de test
    await createTestContent({
      userId: testUser.id,
      platform: 'instagram',
      status: 'published',
    });
  });

  describe('GET /api/dashboard', () => {
    it('should return dashboard data for authenticated user', async () => {
      const response = await fetch('http://localhost:3000/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
        },
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toMatchObject({
        metrics: expect.any(Object),
        recentContent: expect.any(Array),
        platforms: expect.arrayContaining(['instagram', 'tiktok']),
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await fetch('http://localhost:3000/api/dashboard');
      expect(response.status).toBe(401);
    });

    it('should handle rate limiting', async () => {
      // Faire plusieurs requêtes rapidement
      const requests = Array(150).fill(null).map(() =>
        fetch('http://localhost:3000/api/dashboard', {
          headers: { 'Authorization': `Bearer ${testUser.token}` },
        })
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);
      
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });
});
```

## Gestion des Données de Test

### Utiliser les Factories

```typescript
// tests/integration/fixtures/factories.ts
import { randomString } from './utils';

export function createTestUser(overrides?: Partial<TestUser>): TestUser {
  return {
    id: `user-${randomString(10)}`,
    email: `test-${randomString(8)}@example.com`,
    name: 'Test User',
    role: 'creator',
    platforms: [],
    token: generateTestToken(),
    ...overrides,
  };
}

export function createTestContent(overrides?: Partial<TestContent>): TestContent {
  return {
    id: `content-${randomString(10)}`,
    userId: '',
    platform: 'instagram',
    type: 'post',
    caption: 'Test content',
    status: 'draft',
    ...overrides,
  };
}
```

### Utiliser les Helpers

```typescript
// tests/integration/fixtures/test-helpers.ts
export async function createAuthenticatedRequest(
  url: string,
  userId: string,
  options?: RequestInit
): Promise<Response> {
  const token = await getTestToken(userId);
  
  return fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
}

export async function cleanupTestData(userId: string): Promise<void> {
  // Nettoyer toutes les données de test
  await deleteTestUser(userId);
  await deleteTestContent(userId);
  await deleteTestMessages(userId);
}
```

## Mocking

### Mock Redis

```typescript
// tests/integration/setup/mock-redis.ts
import { vi } from 'vitest';

export function mockRedis() {
  const store = new Map();
  
  return {
    get: vi.fn((key) => store.get(key)),
    set: vi.fn((key, value) => store.set(key, value)),
    del: vi.fn((key) => store.delete(key)),
    expire: vi.fn(),
  };
}
```

### Mock Services Externes

```typescript
import { vi } from 'vitest';

// Mock Instagram API
vi.mock('@/lib/services/instagram', () => ({
  InstagramService: {
    publishPost: vi.fn().mockResolvedValue({ id: 'post-123' }),
    getProfile: vi.fn().mockResolvedValue({ followers: 1000 }),
  },
}));
```

## Tests de Sécurité

### Test d'Authentification

```typescript
describe('Authentication Security', () => {
  it('should reject requests without token', async () => {
    const response = await fetch('http://localhost:3000/api/dashboard');
    expect(response.status).toBe(401);
  });

  it('should reject requests with invalid token', async () => {
    const response = await fetch('http://localhost:3000/api/dashboard', {
      headers: { 'Authorization': 'Bearer invalid-token' },
    });
    expect(response.status).toBe(401);
  });

  it('should reject expired tokens', async () => {
    const expiredToken = generateExpiredToken();
    const response = await fetch('http://localhost:3000/api/dashboard', {
      headers: { 'Authorization': `Bearer ${expiredToken}` },
    });
    expect(response.status).toBe(401);
  });
});
```

### Test d'Autorisation

```typescript
describe('Authorization Security', () => {
  it('should prevent cross-user data access', async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    
    const content = await createTestContent({ userId: user1.id });
    
    // User2 essaie d'accéder au contenu de User1
    const response = await fetch(
      `http://localhost:3000/api/content/${content.id}`,
      {
        headers: { 'Authorization': `Bearer ${user2.token}` },
      }
    );
    
    expect(response.status).toBe(403);
  });
});
```

## Tests de Performance

### Mesurer les Temps de Réponse

```typescript
import { performance } from 'perf_hooks';

it('should respond within acceptable time', async () => {
  const start = performance.now();
  
  const response = await fetch('http://localhost:3000/api/dashboard', {
    headers: { 'Authorization': `Bearer ${testUser.token}` },
  });
  
  const duration = performance.now() - start;
  
  expect(response.status).toBe(200);
  expect(duration).toBeLessThan(500); // < 500ms
});
```

## Exécution des Tests

### Tous les tests d'intégration

```bash
npm run test:integration
```

### Tests spécifiques

```bash
# Tests dashboard
npm run test:integration tests/integration/dashboard

# Tests revenue
npm run test:integration tests/integration/revenue

# Avec watch mode
npm run test:integration:watch
```

### Avec coverage

```bash
npm run test:integration:coverage
```

## Best Practices

### 1. Isolation des Tests

Chaque test doit être indépendant:

```typescript
// ✅ Bon
beforeEach(async () => {
  testUser = await createTestUser();
});

afterEach(async () => {
  await cleanupTestData(testUser.id);
});

// ❌ Mauvais - partage d'état entre tests
let sharedUser;
beforeAll(async () => {
  sharedUser = await createTestUser();
});
```

### 2. Nommage Descriptif

```typescript
// ✅ Bon
it('should return 404 when content does not exist', async () => {});

// ❌ Mauvais
it('test content', async () => {});
```

### 3. Arrange-Act-Assert

```typescript
it('should create content successfully', async () => {
  // Arrange: préparer les données
  const contentData = {
    platform: 'instagram',
    caption: 'Test post',
  };

  // Act: exécuter l'action
  const response = await fetch('http://localhost:3000/api/content', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testUser.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(contentData),
  });

  // Assert: vérifier les résultats
  expect(response.status).toBe(201);
  const data = await response.json();
  expect(data.platform).toBe('instagram');
});
```

### 4. Tester les Cas d'Erreur

```typescript
describe('Error Handling', () => {
  it('should handle invalid input', async () => {
    const response = await fetch('http://localhost:3000/api/content', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testUser.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invalid: 'data' }),
    });

    expect(response.status).toBe(400);
    const error = await response.json();
    expect(error).toHaveProperty('message');
  });
});
```

### 5. Cleanup Systématique

```typescript
afterEach(async () => {
  // Toujours nettoyer les données de test
  await cleanupTestData(testUser.id);
  
  // Réinitialiser les mocks
  vi.clearAllMocks();
});
```

## Troubleshooting

### Tests qui échouent de manière intermittente

**Cause**: Conditions de course, données partagées
**Solution**: Vérifier l'isolation des tests, utiliser des IDs uniques

### Tests lents

**Cause**: Trop de requêtes, pas de parallélisation
**Solution**: Utiliser `Promise.all()`, optimiser les fixtures

### Erreurs de timeout

**Cause**: Opérations longues, services externes
**Solution**: Augmenter le timeout, mocker les services externes

```typescript
it('should handle long operation', async () => {
  // Augmenter le timeout pour ce test
}, { timeout: 30000 });
```

## Ressources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://testingjavascript.com/)
- Tests existants dans `tests/integration/`
- `.kiro/specs/production-testing-suite/design.md`

## Support

Pour questions ou problèmes:
- Consulter les tests existants comme exemples
- Vérifier la documentation Vitest
- Créer une issue dans Linear
