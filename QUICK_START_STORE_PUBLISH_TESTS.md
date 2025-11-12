# Quick Start - Tests /api/store/publish

Guide rapide pour exécuter et comprendre les tests de l'endpoint `/api/store/publish`.

## 🚀 Démarrage rapide (5 minutes)

### 1. Démarrer le serveur

```bash
# Terminal 1: Démarrer le serveur de dev
npm run dev
```

### 2. Exécuter les tests

```bash
# Terminal 2: Exécuter les tests
npm run test:integration tests/integration/api/store-publish.test.ts
```

### 3. Voir les résultats

```bash
✓ Integration: /api/store/publish (30 tests)
  ✓ HTTP Methods (4 tests)
  ✓ Authentication (2 tests)
  ✓ Request Body Validation (5 tests)
  ✓ Response Headers (2 tests)
  ✓ Response Schema Validation (3 tests)
  ✓ Error Handling (2 tests)
  ✓ Performance (1 test)
  ✓ Concurrent Requests (2 tests)
  ✓ Idempotency (1 test)

Test Files  1 passed (1)
     Tests  30 passed (30)
  Duration  2.5s
```

## 📋 Commandes essentielles

```bash
# Tous les tests
npm run test:integration tests/integration/api/store-publish.test.ts

# Tests spécifiques
npm run test:integration -- --grep "Authentication"
npm run test:integration -- --grep "Gating"
npm run test:integration -- --grep "Performance"

# Mode watch (re-exécute automatiquement)
npm run test:integration -- --watch tests/integration/api/store-publish.test.ts

# Avec couverture de code
npm run test:integration -- --coverage tests/integration/api/store-publish.test.ts

# Verbose (plus de détails)
npm run test:integration -- --reporter=verbose tests/integration/api/store-publish.test.ts
```

## 🎯 Scénarios clés à tester

### ✅ Scénario 1: Utilisateur sans paiements (Gating)

**Attendu**: 409 avec message de guidance

```bash
# Le test vérifie que l'utilisateur est bloqué
# et reçoit des instructions pour configurer les paiements
```

### ✅ Scénario 2: Utilisateur avec paiements (Succès)

**Attendu**: 200 avec URL de la boutique

```bash
# Le test vérifie que la publication réussit
# et retourne l'URL de la boutique publiée
```

### ✅ Scénario 3: Utilisateur non authentifié

**Attendu**: 401 Unauthorized

```bash
# Le test vérifie que l'authentification est requise
```

## 📊 Comprendre les résultats

### ✅ Test réussi
```
✓ should return 409 when payments not completed (45ms)
```
- Le test a passé
- Durée: 45ms
- Comportement conforme aux attentes

### ❌ Test échoué
```
✗ should return 200 when payments completed (120ms)
  Expected: 200
  Received: 401
```
- Le test a échoué
- Vérifier l'authentification
- Vérifier que l'utilisateur de test existe

### ⏭️ Test ignoré
```
○ should handle rate limiting (skipped)
```
- Test temporairement désactivé
- Peut nécessiter configuration spéciale

## 🔧 Dépannage rapide

### Problème: "connect ECONNREFUSED"

**Cause**: Serveur non démarré

**Solution**:
```bash
# Terminal 1
npm run dev

# Attendre "Ready on http://localhost:3000"
# Puis dans Terminal 2
npm run test:integration tests/integration/api/store-publish.test.ts
```

### Problème: "Timeout of 5000ms exceeded"

**Cause**: Serveur trop lent ou surchargé

**Solution**:
```bash
# Redémarrer le serveur
# Ou augmenter le timeout dans le test
```

### Problème: Tests flaky (passent parfois)

**Cause**: Race conditions ou timing issues

**Solution**:
```bash
# Exécuter plusieurs fois pour confirmer
for i in {1..5}; do npm run test:integration tests/integration/api/store-publish.test.ts; done
```

## 📁 Fichiers importants

```
tests/integration/api/
├── store-publish.test.ts              # 👈 Tests principaux
├── store-publish-README.md            # 👈 Documentation complète
├── fixtures/
│   └── store-publish-samples.ts       # 👈 Données de test
└── helpers/
    └── test-utils.ts                  # Utilitaires partagés

docs/
└── api-tests.md                       # 👈 Documentation globale (section ajoutée)
```

## 🎓 Patterns de test

### Pattern 1: Test simple
```typescript
it('should reject GET method', async () => {
  const response = await fetch(`${BASE_URL}/api/store/publish`, {
    method: 'GET'
  })
  
  expect(response.status).toBe(405)
})
```

### Pattern 2: Test avec authentification
```typescript
it('should publish when authenticated', async () => {
  const response = await fetch(`${BASE_URL}/api/store/publish`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer test-token',
      'Content-Type': 'application/json'
    }
  })
  
  expect(response.status).toBe(200)
})
```

### Pattern 3: Test de validation de schéma
```typescript
it('should return valid schema', async () => {
  const response = await fetch(`${BASE_URL}/api/store/publish`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer test-token',
      'Content-Type': 'application/json'
    }
  })
  
  const json = await response.json()
  const result = SuccessResponseSchema.safeParse(json)
  
  expect(result.success).toBe(true)
})
```

## 📈 Métriques de succès

### Cibles
- ✅ Tous les tests passent (30/30)
- ✅ Temps d'exécution < 30s
- ✅ Couverture de code > 80%
- ✅ Aucun test flaky

### Vérifier
```bash
# Nombre de tests
npm run test:integration tests/integration/api/store-publish.test.ts | grep "Tests"

# Temps d'exécution
npm run test:integration tests/integration/api/store-publish.test.ts | grep "Duration"

# Couverture
npm run test:integration -- --coverage tests/integration/api/store-publish.test.ts
```

## 🔄 Workflow typique

### 1. Développement
```bash
# Terminal 1: Serveur en mode watch
npm run dev

# Terminal 2: Tests en mode watch
npm run test:integration -- --watch tests/integration/api/store-publish.test.ts

# Modifier le code → Tests se ré-exécutent automatiquement
```

### 2. Avant commit
```bash
# Exécuter tous les tests une fois
npm run test:integration tests/integration/api/store-publish.test.ts

# Vérifier qu'ils passent tous
# Puis commit
```

### 3. CI/CD
```bash
# Les tests s'exécutent automatiquement sur:
# - Push vers main
# - Pull requests
# - Déploiements staging/production
```

## 📚 Documentation complète

Pour plus de détails, consulter:

1. **README des tests**: `tests/integration/api/store-publish-README.md`
   - Guide complet
   - Tous les scénarios
   - Dépannage avancé

2. **Documentation API**: `docs/api-tests.md`
   - Exemples de code
   - Patterns établis
   - Bonnes pratiques

3. **Fixtures**: `tests/integration/api/fixtures/store-publish-samples.ts`
   - Données de test
   - Utilisateurs de test
   - Benchmarks

## 💡 Tips

### Tip 1: Exécuter un seul test
```typescript
it.only('should test this specific case', async () => {
  // Ce test sera le seul à s'exécuter
})
```

### Tip 2: Ignorer un test temporairement
```typescript
it.skip('should test this later', async () => {
  // Ce test sera ignoré
})
```

### Tip 3: Déboguer un test
```typescript
it('should debug this', async () => {
  const response = await fetch(...)
  const json = await response.json()
  
  console.log('Response:', json) // Affiche dans la console
  
  expect(response.status).toBe(200)
})
```

### Tip 4: Tester contre staging
```bash
TEST_BASE_URL=https://staging.huntaze.com npm run test:integration tests/integration/api/store-publish.test.ts
```

## ✅ Checklist avant PR

- [ ] Tous les tests passent localement
- [ ] Aucun test ignoré sans raison
- [ ] Temps d'exécution acceptable (< 30s)
- [ ] Aucun console.log oublié
- [ ] Documentation mise à jour si nécessaire
- [ ] Fixtures ajoutées si nouvelles données de test

## 🆘 Besoin d'aide ?

1. **Consulter la doc**: `tests/integration/api/store-publish-README.md`
2. **Vérifier les fixtures**: `tests/integration/api/fixtures/store-publish-samples.ts`
3. **Demander à l'équipe**: Slack #platform-tests
4. **Créer une issue**: GitHub avec label `tests`

---

**Temps estimé pour démarrer**: 5 minutes  
**Temps estimé pour maîtriser**: 30 minutes  
**Temps d'exécution des tests**: ~2-5 secondes

**Prochaine étape**: Exécuter `npm run test:integration tests/integration/api/store-publish.test.ts` 🚀
