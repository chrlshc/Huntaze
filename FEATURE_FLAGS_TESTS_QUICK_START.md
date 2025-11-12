# Feature Flags API Tests - Quick Start Guide

Guide rapide pour exécuter les tests d'intégration de l'API Feature Flags.

## 🚀 Démarrage Rapide (2 minutes)

### 1. Configuration Minimale

```bash
# Démarrer le serveur de dev
npm run dev

# Dans un autre terminal, lancer les tests
npm run test:integration tests/integration/api/admin-feature-flags.test.ts
```

**Note:** Sans tokens d'authentification, seuls les tests d'erreur (401/403) s'exécuteront.

### 2. Configuration Complète (avec authentification)

```bash
# Définir les tokens d'authentification
export TEST_ADMIN_TOKEN="your-admin-token-here"
export TEST_AUTH_TOKEN="your-regular-user-token-here"

# Lancer tous les tests
npm run test:integration tests/integration/api/admin-feature-flags.test.ts
```

## 📋 Commandes Essentielles

```bash
# Tous les tests
npm run test:integration tests/integration/api/admin-feature-flags.test.ts

# Tests avec couverture
npm run test:integration -- --coverage tests/integration/api/admin-feature-flags.test.ts

# Mode watch (re-run automatique)
npm run test:integration -- --watch tests/integration/api/admin-feature-flags.test.ts

# Tests spécifiques
npm run test:integration -- --grep "Authentication" tests/integration/api/admin-feature-flags.test.ts
npm run test:integration -- --grep "Validation" tests/integration/api/admin-feature-flags.test.ts
npm run test:integration -- --grep "Concurrent" tests/integration/api/admin-feature-flags.test.ts
```

## 🧪 Tests Manuels Rapides

### Test GET (récupérer les flags)

```bash
# Sans auth (devrait retourner 401)
curl http://localhost:3000/api/admin/feature-flags

# Avec auth admin
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:3000/api/admin/feature-flags
```

**Réponse attendue (200 OK):**
```json
{
  "flags": {
    "enabled": true,
    "rolloutPercentage": 50,
    "markets": ["FR", "DE"],
    "userWhitelist": []
  },
  "correlationId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Test POST (mettre à jour les flags)

```bash
# Activer le système
curl -X POST http://localhost:3000/api/admin/feature-flags \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'

# Définir le rollout à 25%
curl -X POST http://localhost:3000/api/admin/feature-flags \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rolloutPercentage": 25}'

# Cibler des marchés spécifiques
curl -X POST http://localhost:3000/api/admin/feature-flags \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"markets": ["FR", "DE", "US"]}'

# Mise à jour multiple
curl -X POST http://localhost:3000/api/admin/feature-flags \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "rolloutPercentage": 75,
    "markets": ["FR", "DE"]
  }'
```

**Réponse attendue (200 OK):**
```json
{
  "success": true,
  "flags": {
    "enabled": true,
    "rolloutPercentage": 75,
    "markets": ["FR", "DE"],
    "userWhitelist": []
  },
  "correlationId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Test d'erreur (validation)

```bash
# Rollout percentage invalide (devrait retourner 400)
curl -X POST http://localhost:3000/api/admin/feature-flags \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rolloutPercentage": 150}'
```

**Réponse attendue (400 Bad Request):**
```json
{
  "error": "Invalid rolloutPercentage",
  "message": "Must be between 0 and 100",
  "correlationId": "123e4567-e89b-12d3-a456-426614174000"
}
```

## 📊 Résultats Attendus

### Tous les tests passent ✅

```
✓ GET /api/admin/feature-flags
  ✓ Authentication & Authorization (5 tests)
  ✓ Response Schema Validation (5 tests)
  ✓ Error Handling (2 tests)
  ✓ Performance (1 test)

✓ POST /api/admin/feature-flags
  ✓ Authentication & Authorization (2 tests)
  ✓ Request Validation (10 tests)
  ✓ Success Response (3 tests)
  ✓ Idempotence (1 test)
  ✓ Concurrent Access (2 tests)
  ✓ Error Handling (2 tests)
  ✓ Performance (1 test)

✓ HTTP Methods (5 tests)
✓ Security (2 tests)

Total: 41 tests passed
Duration: ~5-10 seconds
```

### Tests partiels (sans auth) ⚠️

```
✓ GET /api/admin/feature-flags
  ✓ should return 401 when not authenticated
  ✓ should return 401 with invalid token
  ⊘ Skipped: 10 tests (require TEST_ADMIN_TOKEN)

✓ POST /api/admin/feature-flags
  ✓ should return 401 when not authenticated
  ⊘ Skipped: 20 tests (require TEST_ADMIN_TOKEN)

Total: 11 tests passed, 30 skipped
```

## 🔧 Dépannage Rapide

### Problème: "Connection refused"

```bash
# Solution: Démarrer le serveur
npm run dev
```

### Problème: "401 Unauthorized" sur tous les tests

```bash
# Solution: Définir le token admin
export TEST_ADMIN_TOKEN="your-token-here"

# Vérifier que le token est défini
echo $TEST_ADMIN_TOKEN
```

### Problème: Tests timeout

```bash
# Solution: Augmenter le timeout
# Dans vitest.config.ts:
export default defineConfig({
  test: {
    testTimeout: 10000 // 10 secondes
  }
})
```

### Problème: "Schema validation failed"

```bash
# Solution: Vérifier la réponse de l'API
curl -v http://localhost:3000/api/admin/feature-flags

# Comparer avec le schéma attendu dans le test
```

## 📁 Structure des Fichiers

```
tests/integration/api/
├── admin-feature-flags.test.ts          # Tests principaux
├── admin-feature-flags-README.md        # Documentation détaillée
└── fixtures/
    └── feature-flags-samples.ts         # Données de test

docs/api/
├── admin-feature-flags.md               # Documentation API
└── admin-feature-flags-client.md        # Exemples clients

lib/
├── feature-flags.ts                     # Logique métier
└── onboarding-kill-switch.ts           # Kill switch

app/api/admin/feature-flags/
└── route.ts                             # Endpoint API
```

## 🎯 Scénarios de Test Clés

### 1. Authentification ✅
- ❌ Sans token → 401
- ❌ Token invalide → 401
- ❌ Non-admin → 403
- ✅ Admin valide → 200

### 2. Validation ✅
- ✅ enabled: true/false
- ✅ rolloutPercentage: 0-100
- ❌ rolloutPercentage: <0 ou >100 → 400
- ✅ markets: array de strings
- ✅ userWhitelist: array de strings
- ❌ Objet vide → 400

### 3. Concurrence ✅
- ✅ 5 requêtes simultanées
- ✅ État final cohérent
- ✅ Pas de race conditions

### 4. Performance ✅
- ✅ GET < 500ms
- ✅ POST < 1s
- ✅ Concurrent < 2s

## 📚 Documentation Complète

Pour plus de détails, consultez:

- **Tests détaillés:** `tests/integration/api/admin-feature-flags-README.md`
- **Documentation API:** `docs/api/admin-feature-flags.md`
- **Exemples clients:** `docs/api/admin-feature-flags-client.md`
- **Guide général:** `docs/api-tests.md`

## 🚦 Checklist Avant Commit

- [ ] Tous les tests passent localement
- [ ] Tests avec et sans auth fonctionnent
- [ ] Performance acceptable (<500ms GET, <1s POST)
- [ ] Pas de warnings ESLint
- [ ] Documentation à jour
- [ ] Fixtures à jour si schéma changé

## 💡 Tips

1. **Développement rapide:** Utilisez `--watch` pour re-run automatique
2. **Debug:** Ajoutez `console.log` dans les tests pour voir les réponses
3. **Isolation:** Testez un seul scénario avec `--grep`
4. **Performance:** Utilisez `Date.now()` pour mesurer les temps
5. **Fixtures:** Réutilisez les données de `feature-flags-samples.ts`

## 🎓 Exemples de Code

### Test Simple

```typescript
it('should update enabled flag', async () => {
  const response = await fetch(`${BASE_URL}/api/admin/feature-flags`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ enabled: true })
  })
  
  expect(response.status).toBe(200)
  const json = await response.json()
  expect(json.success).toBe(true)
  expect(json.flags.enabled).toBe(true)
})
```

### Test avec Fixtures

```typescript
import { validUpdateRequests } from './fixtures/feature-flags-samples'

for (const update of validUpdateRequests) {
  it(`should accept ${JSON.stringify(update)}`, async () => {
    const response = await fetch(`${BASE_URL}/api/admin/feature-flags`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(update)
    })
    
    expect(response.ok).toBe(true)
  })
}
```

### Test de Performance

```typescript
it('should respond quickly', async () => {
  const start = Date.now()
  await fetch(`${BASE_URL}/api/admin/feature-flags`, {
    headers: { 'Authorization': `Bearer ${TEST_ADMIN_TOKEN}` }
  })
  const duration = Date.now() - start
  
  expect(duration).toBeLessThan(500)
})
```

---

**Prêt à tester ?** Lancez `npm run dev` puis `npm run test:integration tests/integration/api/admin-feature-flags.test.ts` ! 🚀
