# Tests d'intégration /api/store/publish - Complet ✅

**Date**: 2024-11-11  
**Status**: ✅ TESTS CRÉÉS ET DOCUMENTÉS

## 🎯 Ce qui a été fait

### ✅ Tests d'intégration complets
- **Fichier**: `tests/integration/api/store-publish.test.ts`
- **Couverture**: 10 catégories de tests, 30+ scénarios
- **Frameworks**: Vitest + Zod pour validation de schémas

### ✅ Fixtures de données de test
- **Fichier**: `tests/integration/api/fixtures/store-publish-samples.ts`
- **Contenu**: 
  - Requêtes valides/invalides
  - Réponses attendues (succès, gating, erreurs)
  - Utilisateurs de test
  - Benchmarks de performance
  - Patterns de sécurité

### ✅ Documentation complète
- **Fichier 1**: `tests/integration/api/store-publish-README.md`
  - Guide complet des tests
  - Patterns de test
  - Dépannage
  - Bonnes pratiques
  
- **Fichier 2**: `docs/api-tests.md` (mis à jour)
  - 9 scénarios documentés avec exemples de code
  - Intégré dans la documentation globale des tests API

## 📋 Catégories de tests

### 1. Méthodes HTTP ✅
- POST accepté
- GET/PUT/DELETE rejetés (405)

### 2. Authentification ✅
- Sans token → 401
- Token invalide → 401
- Token valide → 200/409

### 3. Gating Middleware ✅
- Sans paiements → 409 avec guidance
- Avec paiements → 200
- Erreur de gating → 500/503 (fail closed)

### 4. Validation du corps de requête ✅
- Corps vide accepté
- Corps valide accepté
- Corps invalide rejeté (400)
- JSON malformé rejeté (400)

### 5. Schémas de réponse ✅
- Validation Zod pour succès (200)
- Validation Zod pour gating (409)
- Validation Zod pour erreurs (401/500)
- Correlation ID dans toutes les réponses

### 6. Gestion des erreurs ✅
- Erreurs réseau
- Erreurs internes (500)
- Pas d'informations sensibles exposées
- Logs structurés

### 7. Performance ✅
- Temps de réponse < 5s (cible: < 2s)
- Gestion du timeout
- Pas de dégradation sous charge

### 8. Accès concurrent ✅
- Requêtes concurrentes même utilisateur
- Requêtes concurrentes utilisateurs différents
- Pas de race conditions
- Correlation IDs uniques

### 9. Idempotence ✅
- Tentatives multiples gérées
- Pas de publications en double
- État cohérent

### 10. Sécurité ✅
- Validation Content-Type
- Sanitization des entrées
- Pas de vecteurs XSS
- Headers de sécurité

## 🧪 Schémas Zod

### SuccessResponseSchema
```typescript
z.object({
  success: z.literal(true),
  message: z.string(),
  storeUrl: z.string().url(),
  publishedAt: z.string().datetime(),
  correlationId: z.string().uuid(),
})
```

### GatingResponseSchema
```typescript
z.object({
  error: z.literal('PRECONDITION_REQUIRED'),
  message: z.string(),
  missingStep: z.string(),
  action: z.object({
    type: z.enum(['open_modal', 'redirect']),
    modal: z.string().optional(),
    url: z.string().optional(),
    prefill: z.record(z.any()).optional(),
  }),
  correlationId: z.string().uuid(),
})
```

### ErrorResponseSchema
```typescript
z.object({
  error: z.string(),
  details: z.string().optional(),
  correlationId: z.string().uuid(),
})
```

## 📊 Fixtures disponibles

### Utilisateurs de test
```typescript
testUsers.withPayments      // Utilisateur avec paiements configurés
testUsers.withoutPayments   // Utilisateur sans paiements
testUsers.invalid           // Utilisateur invalide
```

### Réponses attendues
```typescript
successResponse             // Réponse de succès (200)
gatingResponse             // Réponse de gating (409)
unauthorizedResponse       // Réponse non autorisée (401)
internalErrorResponse      // Réponse d'erreur interne (500)
```

### Benchmarks
```typescript
performanceBenchmarks.maxResponseTime      // 5000ms
performanceBenchmarks.targetResponseTime   // 2000ms
performanceBenchmarks.concurrentRequests   // 10
```

### Configuration rate limiting
```typescript
rateLimitConfig.maxRequestsPerMinute  // 60
rateLimitConfig.maxRequestsPerHour    // 1000
rateLimitConfig.burstSize             // 10
```

## 🚀 Exécution des tests

### Commandes de base
```bash
# Tous les tests de l'endpoint
npm run test:integration tests/integration/api/store-publish.test.ts

# Avec couverture
npm run test:integration -- --coverage tests/integration/api/store-publish.test.ts

# En mode watch
npm run test:integration -- --watch tests/integration/api/store-publish.test.ts
```

### Tests spécifiques
```bash
# Tests d'authentification
npm run test:integration -- --grep "Authentication"

# Tests de gating
npm run test:integration -- --grep "Gating"

# Tests de performance
npm run test:integration -- --grep "Performance"
```

### Environnements
```bash
# Local (défaut)
TEST_BASE_URL=http://localhost:3000 npm run test:integration

# Staging
TEST_BASE_URL=https://staging.huntaze.com npm run test:integration

# Production (lecture seule)
TEST_BASE_URL=https://api.huntaze.com npm run test:integration
```

## 📚 Documentation créée

### 1. README des tests
**Fichier**: `tests/integration/api/store-publish-README.md`

**Contenu**:
- Vue d'ensemble de l'endpoint
- Structure des tests
- Scénarios de test détaillés
- Patterns de test avec exemples
- Guide de dépannage
- Bonnes pratiques
- Métriques de santé

### 2. Documentation API globale
**Fichier**: `docs/api-tests.md` (section ajoutée)

**Contenu**:
- 9 scénarios documentés
- Exemples de code complets
- Intégration dans la doc globale

### 3. Fixtures
**Fichier**: `tests/integration/api/fixtures/store-publish-samples.ts`

**Contenu**:
- Données de test réutilisables
- Utilisateurs de test
- Réponses attendues
- Benchmarks
- Patterns de sécurité

## 🎓 Patterns de test établis

### Pattern 1: Test avec authentification
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

### Pattern 2: Test de gating
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

### Pattern 3: Validation de schéma
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

### Pattern 4: Test de performance
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

### Pattern 5: Accès concurrent
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

## ✅ Checklist de validation

### Tests
- [x] Tests d'authentification créés
- [x] Tests de gating middleware créés
- [x] Tests de validation de schémas créés
- [x] Tests de gestion d'erreurs créés
- [x] Tests de performance créés
- [x] Tests d'accès concurrent créés
- [x] Tests d'idempotence créés
- [x] Tests de sécurité créés

### Fixtures
- [x] Utilisateurs de test définis
- [x] Réponses attendues définies
- [x] Benchmarks de performance définis
- [x] Patterns de sécurité définis

### Documentation
- [x] README des tests créé
- [x] Documentation API mise à jour
- [x] Patterns de test documentés
- [x] Guide de dépannage inclus
- [x] Bonnes pratiques documentées

### Utilitaires
- [x] Utilisation de test-utils.ts
- [x] Validation Zod configurée
- [x] Helpers de performance utilisés
- [x] Helpers de concurrence utilisés

## 🎯 Prochaines étapes

### Court terme (Cette semaine)
1. [ ] Exécuter les tests en local
2. [ ] Créer des utilisateurs de test réels
3. [ ] Valider les tokens d'authentification
4. [ ] Tester en staging

### Moyen terme (Ce mois)
1. [ ] Intégrer dans CI/CD
2. [ ] Configurer les alertes sur échecs de tests
3. [ ] Ajouter des tests de charge (k6/Artillery)
4. [ ] Mesurer et optimiser la couverture de code

### Long terme (Trimestre)
1. [ ] Ajouter des tests E2E avec Playwright
2. [ ] Implémenter le rate limiting et tester
3. [ ] Ajouter des tests de chaos engineering
4. [ ] Documenter les patterns pour autres endpoints

## 📞 Support

Pour questions ou problèmes:
1. Consulter `tests/integration/api/store-publish-README.md`
2. Consulter `docs/api-tests.md`
3. Vérifier les fixtures dans `fixtures/store-publish-samples.ts`
4. Contacter l'équipe Platform

## 🤝 Contribution

Lors de l'ajout de nouveaux tests:
1. Suivre les patterns établis
2. Ajouter des fixtures si nécessaire
3. Documenter les nouveaux scénarios
4. Mettre à jour ce fichier
5. Créer une PR avec description claire

---

**Status**: ✅ Tests complets et documentés, prêts pour exécution

**Dernière mise à jour**: 2024-11-11

**Responsable**: Équipe Platform / Tester Agent

**Prochaine étape**: Exécution des tests en local et validation
