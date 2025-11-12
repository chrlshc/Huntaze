# Store Publish Endpoint Tests

Tests d'intégration pour l'endpoint `/api/store/publish` avec gating middleware.

## Vue d'ensemble

L'endpoint `/api/store/publish` permet aux utilisateurs de publier leur boutique en ligne. C'est une **route critique** qui nécessite que l'utilisateur ait complété la configuration des paiements avant de pouvoir publier.

### Caractéristiques

- **Authentification requise**: Utilisateur doit être connecté
- **Gating middleware**: Vérifie que l'étape 'payments' est complétée
- **Route critique**: Fail closed en cas d'erreur (bloque l'accès)
- **Idempotence**: Gère les tentatives de publication multiples
- **Correlation IDs**: Chaque requête a un ID unique pour le traçage

## Structure des tests

```
tests/integration/api/
├── store-publish.test.ts           # Tests principaux
├── fixtures/
│   └── store-publish-samples.ts    # Données de test
└── helpers/
    └── test-utils.ts               # Utilitaires partagés
```

## Scénarios de test

### 1. Méthodes HTTP

- ✅ POST accepté
- ✅ GET rejeté (405)
- ✅ PUT rejeté (405)
- ✅ DELETE rejeté (405)

### 2. Authentification

- ✅ Requête sans token → 401
- ✅ Requête avec token invalide → 401
- ✅ Requête avec token valide → 200/409

### 3. Gating Middleware

- ✅ Utilisateur sans paiements configurés → 409 avec guidance
- ✅ Utilisateur avec paiements configurés → 200
- ✅ Erreur de gating check → 500/503 (fail closed)

### 4. Validation du corps de requête

- ✅ Corps vide accepté
- ✅ Corps valide accepté
- ✅ Corps invalide rejeté (400)
- ✅ JSON malformé rejeté (400)

### 5. Schémas de réponse

- ✅ Réponse de succès (200)
- ✅ Réponse de gating (409)
- ✅ Réponse d'erreur (401/500)
- ✅ Correlation ID présent dans toutes les réponses

### 6. Gestion des erreurs

- ✅ Erreurs réseau gérées gracieusement
- ✅ Erreurs internes retournent 500 avec détails
- ✅ Pas d'informations sensibles exposées
- ✅ Logs structurés avec correlation IDs

### 7. Performance

- ✅ Temps de réponse < 5s (cible: < 2s)
- ✅ Gestion du timeout
- ✅ Pas de dégradation sous charge

### 8. Accès concurrent

- ✅ Requêtes concurrentes du même utilisateur
- ✅ Requêtes concurrentes d'utilisateurs différents
- ✅ Pas de race conditions
- ✅ Correlation IDs uniques

### 9. Idempotence

- ✅ Tentatives de publication multiples gérées
- ✅ Pas de publications en double
- ✅ État cohérent après requêtes multiples

### 10. Sécurité

- ✅ Validation du Content-Type
- ✅ Sanitization des entrées utilisateur
- ✅ Pas de vecteurs XSS dans les réponses
- ✅ Headers de sécurité présents

## Exécution des tests

### Prérequis

```bash
# Démarrer le serveur de développement
npm run dev

# Ou démarrer le build de production
npm run build
npm start
```

### Exécuter tous les tests

```bash
# Tous les tests de l'endpoint
npm run test:integration tests/integration/api/store-publish.test.ts

# Avec couverture
npm run test:integration -- --coverage tests/integration/api/store-publish.test.ts

# En mode watch
npm run test:integration -- --watch tests/integration/api/store-publish.test.ts
```

### Exécuter des tests spécifiques

```bash
# Tests d'authentification uniquement
npm run test:integration -- --grep "Authentication" tests/integration/api/store-publish.test.ts

# Tests de gating uniquement
npm run test:integration -- --grep "Gating" tests/integration/api/store-publish.test.ts

# Tests de performance uniquement
npm run test:integration -- --grep "Performance" tests/integration/api/store-publish.test.ts
```

### Variables d'environnement

```bash
# Tester contre un serveur local (défaut)
TEST_BASE_URL=http://localhost:3000 npm run test:integration

# Tester contre staging
TEST_BASE_URL=https://staging.huntaze.com npm run test:integration

# Tester contre production (tests en lecture seule uniquement)
TEST_BASE_URL=https://api.huntaze.com npm run test:integration
```

## Fixtures de données

### Utilisateurs de test

```typescript
import { testUsers } from './fixtures/store-publish-samples'

// Utilisateur avec paiements configurés
testUsers.withPayments.token // 'test-token-with-payments'

// Utilisateur sans paiements configurés
testUsers.withoutPayments.token // 'test-token-no-payments'

// Utilisateur invalide
testUsers.invalid.token // 'invalid-token-12345'
```

### Réponses attendues

```typescript
import {
  successResponse,
  gatingResponse,
  unauthorizedResponse,
  internalErrorResponse
} from './fixtures/store-publish-samples'

// Valider contre les schémas Zod
const result = SuccessResponseSchema.safeParse(successResponse)
expect(result.success).toBe(true)
```

### Benchmarks de performance

```typescript
import { performanceBenchmarks } from './fixtures/store-publish-samples'

expect(duration).toBeLessThan(performanceBenchmarks.maxResponseTime)
```

## Schémas de réponse

### Succès (200)

```typescript
{
  success: true,
  message: "Boutique publiée avec succès",
  storeUrl: "https://user-123.huntaze.com",
  correlationId: "550e8400-e29b-41d4-a716-446655440000"
}
```

### Gating (409)

```typescript
{
  error: "PRECONDITION_REQUIRED",
  message: "Vous devez configurer les paiements avant de publier votre boutique",
  missingStep: "payments",
  action: {
    type: "open_modal",
    modal: "payments_setup",
    prefill: {
      returnUrl: "/api/store/publish",
      userId: "user-123"
    }
  },
  correlationId: "550e8400-e29b-41d4-a716-446655440001"
}
```

### Erreur (401/500)

```typescript
{
  error: "Unauthorized" | "Failed to publish store",
  details?: "Additional error information",
  correlationId: "550e8400-e29b-41d4-a716-446655440002"
}
```

## Patterns de test

### Test avec authentification

```typescript
it('should publish store when authenticated', async () => {
  const response = await fetch(`${BASE_URL}/api/store/publish`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testUsers.withPayments.token}`,
      'Content-Type': 'application/json'
    }
  })
  
  expect(response.status).toBe(200)
})
```

### Test de gating

```typescript
it('should block publish without payments', async () => {
  const response = await fetch(`${BASE_URL}/api/store/publish`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testUsers.withoutPayments.token}`,
      'Content-Type': 'application/json'
    }
  })
  
  expect(response.status).toBe(409)
  
  const json = await response.json()
  expect(json.missingStep).toBe('payments')
})
```

### Test de validation de schéma

```typescript
import { validateSchema } from './helpers/test-utils'

it('should return valid response schema', async () => {
  const response = await fetch(`${BASE_URL}/api/store/publish`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testUsers.withPayments.token}`,
      'Content-Type': 'application/json'
    }
  })
  
  const json = await response.json()
  const result = validateSchema(SuccessResponseSchema, json)
  
  expect(result.success).toBe(true)
})
```

### Test de performance

```typescript
import { measureTime } from './helpers/test-utils'

it('should respond quickly', async () => {
  const { duration } = await measureTime(() =>
    fetch(`${BASE_URL}/api/store/publish`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testUsers.withPayments.token}`,
        'Content-Type': 'application/json'
      }
    })
  )
  
  expect(duration).toBeLessThan(2000)
})
```

### Test d'accès concurrent

```typescript
import { concurrentRequests } from './helpers/test-utils'

it('should handle concurrent requests', async () => {
  const makeRequest = () =>
    fetch(`${BASE_URL}/api/store/publish`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testUsers.withPayments.token}`,
        'Content-Type': 'application/json'
      }
    })
  
  const responses = await concurrentRequests(makeRequest, 10)
  
  responses.forEach(response => {
    expect(response.status).toBeDefined()
  })
})
```

## Dépannage

### Serveur non démarré

```bash
Error: connect ECONNREFUSED 127.0.0.1:3000
```

**Solution**: Démarrer le serveur d'abord
```bash
npm run dev
```

### Erreurs de timeout

```bash
Error: Timeout of 5000ms exceeded
```

**Solution**: Augmenter le timeout dans le test
```typescript
it('should handle slow operation', async () => {
  // ... test code
}, 10000) // 10 secondes
```

### Tests flaky

**Symptômes**: Tests passent parfois, échouent d'autres fois

**Solutions**:
1. Ajouter de la logique de retry
2. Augmenter les temps d'attente
3. Assurer l'isolation des tests
4. Utiliser `waitFor` pour les conditions

```typescript
import { retry } from './helpers/test-utils'

it('should handle flaky network', async () => {
  const response = await retry(
    () => fetch(`${BASE_URL}/api/store/publish`, { method: 'POST' }),
    { maxAttempts: 3, initialDelay: 1000 }
  )
  
  expect(response.ok).toBe(true)
})
```

## Bonnes pratiques

### 1. Indépendance des tests

Chaque test doit être indépendant et ne pas dépendre d'autres tests.

```typescript
// ❌ Mauvais: Dépend du test précédent
let storeUrl: string

it('should publish store', async () => {
  const response = await publishStore()
  storeUrl = response.storeUrl // État partagé
})

it('should access published store', async () => {
  const response = await fetch(storeUrl) // Dépend du test précédent
})

// ✅ Bon: Tests indépendants
it('should publish store', async () => {
  const response = await publishStore()
  expect(response.storeUrl).toBeDefined()
})

it('should access published store', async () => {
  const { storeUrl } = await publishStore() // Crée ses propres données
  const response = await fetch(storeUrl)
  expect(response.ok).toBe(true)
})
```

### 2. Noms de tests descriptifs

```typescript
// ❌ Mauvais: Vague
it('works', async () => { ... })

// ✅ Bon: Descriptif
it('should return 409 when payments not completed', async () => { ... })
```

### 3. Tester les chemins d'erreur

```typescript
it('should handle errors gracefully', async () => {
  const response = await fetch(`${BASE_URL}/api/store/publish`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer invalid-token',
      'Content-Type': 'application/json'
    }
  })
  
  expect(response.status).toBe(401)
  const json = await response.json()
  expect(json.error).toBeDefined()
})
```

### 4. Valider les schémas de réponse

```typescript
import { z } from 'zod'

const ResponseSchema = z.object({
  success: z.boolean(),
  storeUrl: z.string().url(),
  correlationId: z.string().uuid()
})

it('should return valid response schema', async () => {
  const response = await fetch(`${BASE_URL}/api/store/publish`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testUsers.withPayments.token}`,
      'Content-Type': 'application/json'
    }
  })
  
  const json = await response.json()
  const result = ResponseSchema.safeParse(json)
  expect(result.success).toBe(true)
})
```

### 5. Utiliser des fixtures

```typescript
import { testUsers, successResponse } from './fixtures/store-publish-samples'

it('should accept valid user', async () => {
  const response = await publishStore(testUsers.withPayments)
  expect(response.ok).toBe(true)
})
```

## Métriques de santé

Suivre la santé de la suite de tests:

- **Temps d'exécution**: Doit être < 30 secondes
- **Taux de flakiness**: Doit être < 1%
- **Couverture de code**: Cible > 80%
- **Tests par endpoint**: Minimum 10 scénarios

## Documentation connexe

- [API Tests Documentation](../../../docs/api-tests.md)
- [Shopify-Style Onboarding Spec](../../../.kiro/specs/shopify-style-onboarding/)
- [Gating Middleware README](../../../lib/middleware/README.md)
- [Test Utilities](./helpers/test-utils.ts)

## Contribution

Lors de l'ajout de nouveaux tests:

1. Suivre la structure de test établie
2. Ajouter des fixtures pour les données de test
3. Tester tous les codes de statut HTTP
4. Valider les schémas de réponse avec Zod
5. Tester la gestion des erreurs et les cas limites
6. Inclure des benchmarks de performance
7. Tester les patterns d'accès concurrent
8. Documenter les scénarios de test dans ce fichier

## Checklist de maintenance

- [ ] Revoir et mettre à jour les benchmarks de performance trimestriellement
- [ ] Ajouter des tests pour les nouvelles fonctionnalités
- [ ] Mettre à jour les fixtures quand les contrats API changent
- [ ] Surveiller et optimiser les tests lents
- [ ] Revoir et mettre à jour l'intégration CI/CD
- [ ] Suivre et réduire le flakiness des tests
- [ ] Maintenir > 80% de couverture de code
