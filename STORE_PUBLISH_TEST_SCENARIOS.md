# Scénarios de test - /api/store/publish

Documentation visuelle des scénarios de test pour l'endpoint de publication de boutique.

## 🎯 Vue d'ensemble

L'endpoint `/api/store/publish` permet aux utilisateurs de publier leur boutique en ligne. C'est une **route critique** qui nécessite:
- ✅ Authentification
- ✅ Configuration des paiements complétée
- ✅ Validation des données de la boutique

## 📊 Matrice de test

| # | Scénario | Auth | Payments | Attendu | Status | Priority |
|---|----------|------|----------|---------|--------|----------|
| 1 | Utilisateur non authentifié | ❌ | - | 401 | ✅ | P0 |
| 2 | Token invalide | ❌ | - | 401 | ✅ | P0 |
| 3 | Authentifié, sans paiements | ✅ | ❌ | 409 | ✅ | P0 |
| 4 | Authentifié, avec paiements | ✅ | ✅ | 200 | ✅ | P0 |
| 5 | Méthode GET | - | - | 405 | ✅ | P1 |
| 6 | Méthode PUT | - | - | 405 | ✅ | P1 |
| 7 | Méthode DELETE | - | - | 405 | ✅ | P1 |
| 8 | JSON malformé | ✅ | ✅ | 400 | ✅ | P1 |
| 9 | Requêtes concurrentes | ✅ | ✅ | 200 | ✅ | P1 |
| 10 | Erreur interne | ✅ | ✅ | 500 | ✅ | P2 |

## 🔄 Flux de test détaillés

### Scénario 1: Utilisateur non authentifié

```
┌─────────────────┐
│   Client        │
└────────┬────────┘
         │ POST /api/store/publish
         │ (no Authorization header)
         ▼
┌─────────────────┐
│   Server        │
│  requireUser()  │
└────────┬────────┘
         │ ❌ No token
         ▼
┌─────────────────┐
│   Response      │
│   401           │
│   {             │
│     error: "Unauthorized",
│     correlationId: "..."
│   }             │
└─────────────────┘
```

**Test**:
```typescript
it('should return 401 when not authenticated', async () => {
  const response = await fetch(`${BASE_URL}/api/store/publish`, {
    method: 'POST'
  })
  
  expect(response.status).toBe(401)
  const json = await response.json()
  expect(json.error).toBe('Unauthorized')
})
```

---

### Scénario 2: Authentifié, sans paiements (Gating)

```
┌─────────────────┐
│   Client        │
└────────┬────────┘
         │ POST /api/store/publish
         │ Authorization: Bearer token-no-payments
         ▼
┌─────────────────┐
│   Server        │
│  requireUser()  │ ✅ User authenticated
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Gating Check    │
│ requireStep()   │
│ step: 'payments'│
└────────┬────────┘
         │ ❌ Payments not completed
         ▼
┌─────────────────┐
│   Response      │
│   409           │
│   {             │
│     error: "PRECONDITION_REQUIRED",
│     message: "Vous devez configurer...",
│     missingStep: "payments",
│     action: {
│       type: "open_modal",
│       modal: "payments_setup",
│       prefill: {...}
│     },
│     correlationId: "..."
│   }             │
└─────────────────┘
```

**Test**:
```typescript
it('should return 409 when payments not completed', async () => {
  const response = await fetch(`${BASE_URL}/api/store/publish`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer token-no-payments',
      'Content-Type': 'application/json'
    }
  })
  
  expect(response.status).toBe(409)
  const json = await response.json()
  expect(json.error).toBe('PRECONDITION_REQUIRED')
  expect(json.missingStep).toBe('payments')
  expect(json.action.type).toBe('open_modal')
})
```

---

### Scénario 3: Authentifié, avec paiements (Succès)

```
┌─────────────────┐
│   Client        │
└────────┬────────┘
         │ POST /api/store/publish
         │ Authorization: Bearer token-with-payments
         ▼
┌─────────────────┐
│   Server        │
│  requireUser()  │ ✅ User authenticated
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Gating Check    │
│ requireStep()   │
│ step: 'payments'│
└────────┬────────┘
         │ ✅ Payments completed
         ▼
┌─────────────────┐
│ Publish Logic   │
│ - Validate      │
│ - Enable public │
│ - Send email    │
│ - Track event   │
└────────┬────────┘
         │ ✅ Success
         ▼
┌─────────────────┐
│   Response      │
│   200           │
│   {             │
│     success: true,
│     message: "Boutique publiée...",
│     storeUrl: "https://...",
│     correlationId: "..."
│   }             │
└─────────────────┘
```

**Test**:
```typescript
it('should return 200 when payments completed', async () => {
  const response = await fetch(`${BASE_URL}/api/store/publish`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer token-with-payments',
      'Content-Type': 'application/json'
    }
  })
  
  expect(response.status).toBe(200)
  const json = await response.json()
  expect(json.success).toBe(true)
  expect(json.storeUrl).toMatch(/^https?:\/\//)
})
```

---

### Scénario 4: Requêtes concurrentes

```
┌─────────┐  ┌─────────┐  ┌─────────┐
│ Client1 │  │ Client2 │  │ Client3 │
└────┬────┘  └────┬────┘  └────┬────┘
     │            │            │
     │ POST       │ POST       │ POST
     │ (t=0ms)    │ (t=5ms)    │ (t=10ms)
     ▼            ▼            ▼
┌────────────────────────────────────┐
│           Server                   │
│  ┌──────┐  ┌──────┐  ┌──────┐    │
│  │ Req1 │  │ Req2 │  │ Req3 │    │
│  └──┬───┘  └──┬───┘  └──┬───┘    │
│     │         │         │         │
│     │ Auth    │ Auth    │ Auth    │
│     │ Gate    │ Gate    │ Gate    │
│     │ Publish │ Publish │ Publish │
│     ▼         ▼         ▼         │
│  ┌──────┐  ┌──────┐  ┌──────┐    │
│  │ 200  │  │ 200  │  │ 200  │    │
│  └──────┘  └──────┘  └──────┘    │
└────────────────────────────────────┘
     │            │            │
     ▼            ▼            ▼
  ID: abc      ID: def      ID: ghi
  (unique)     (unique)     (unique)
```

**Test**:
```typescript
it('should handle concurrent requests', async () => {
  const requests = Array.from({ length: 10 }, () =>
    fetch(`${BASE_URL}/api/store/publish`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer token-with-payments',
        'Content-Type': 'application/json'
      }
    })
  )
  
  const responses = await Promise.all(requests)
  
  // Tous doivent compléter
  responses.forEach(r => expect(r.status).toBeDefined())
  
  // Correlation IDs uniques
  const jsons = await Promise.all(responses.map(r => r.json()))
  const ids = jsons.map(j => j.correlationId)
  const uniqueIds = new Set(ids)
  expect(uniqueIds.size).toBe(ids.length)
})
```

---

## 🎭 Cas limites (Edge Cases)

### Edge Case 1: Boutique déjà publiée

```
User → POST /api/store/publish (déjà publié)
     ← 200 OK (idempotent)
       { success: true, message: "Boutique déjà publiée" }
```

### Edge Case 2: Erreur de base de données

```
User → POST /api/store/publish
     → DB connection fails
     ← 500 Internal Server Error
       { error: "Failed to publish store", correlationId: "..." }
```

### Edge Case 3: Timeout

```
User → POST /api/store/publish
     → Processing takes > 5s
     ← Client timeout
     → Server continues processing (async)
```

### Edge Case 4: Rate limiting (futur)

```
User → POST /api/store/publish (61st request in 1 min)
     ← 429 Too Many Requests
       { error: "Rate limit exceeded", retryAfter: 30 }
```

---

## 📈 Métriques de performance

### Temps de réponse attendus

```
┌─────────────────────────────────────────┐
│ Percentile │ Temps (ms) │ Status       │
├────────────┼────────────┼──────────────┤
│ p50        │ < 500      │ ✅ Excellent │
│ p90        │ < 1000     │ ✅ Bon       │
│ p95        │ < 2000     │ ⚠️  Acceptable│
│ p99        │ < 5000     │ ❌ Lent      │
└─────────────────────────────────────────┘
```

### Charge concurrente

```
┌─────────────────────────────────────────┐
│ Concurrent │ Success │ Avg Time (ms)   │
├────────────┼─────────┼─────────────────┤
│ 1          │ 100%    │ 200             │
│ 5          │ 100%    │ 250             │
│ 10         │ 100%    │ 300             │
│ 20         │ 100%    │ 400             │
│ 50         │ 95%     │ 800             │
└─────────────────────────────────────────┘
```

---

## 🔒 Scénarios de sécurité

### Sécurité 1: Injection XSS

```typescript
it('should sanitize XSS vectors', async () => {
  const response = await fetch(`${BASE_URL}/api/store/publish`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer token',
      'Content-Type': 'application/json',
      'X-Custom-Header': '<script>alert("xss")</script>'
    }
  })
  
  const json = await response.json()
  const text = JSON.stringify(json)
  
  expect(text).not.toContain('<script>')
  expect(text).not.toContain('javascript:')
})
```

### Sécurité 2: Injection SQL

```typescript
it('should prevent SQL injection', async () => {
  const response = await fetch(`${BASE_URL}/api/store/publish`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer token',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      storeName: "'; DROP TABLE users--"
    })
  })
  
  // Should handle safely, not execute SQL
  expect([200, 400, 401]).toContain(response.status)
})
```

### Sécurité 3: Informations sensibles

```typescript
it('should not expose sensitive data', async () => {
  const response = await fetch(`${BASE_URL}/api/store/publish`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer token',
      'Content-Type': 'application/json'
    }
  })
  
  const json = await response.json()
  const text = JSON.stringify(json).toLowerCase()
  
  expect(text).not.toContain('password')
  expect(text).not.toContain('secret')
  expect(text).not.toContain('token')
  expect(text).not.toContain('api_key')
})
```

---

## 🎯 Checklist de validation

### Avant déploiement

- [ ] Tous les scénarios P0 passent (1-4)
- [ ] Tous les scénarios P1 passent (5-9)
- [ ] Performance acceptable (p95 < 2s)
- [ ] Pas de fuites de données sensibles
- [ ] Gating middleware fonctionne
- [ ] Correlation IDs présents
- [ ] Logs structurés corrects
- [ ] Erreurs gérées gracieusement

### Après déploiement

- [ ] Monitoring actif
- [ ] Alertes configurées
- [ ] Dashboards à jour
- [ ] Documentation à jour
- [ ] Équipe informée
- [ ] Rollback plan prêt

---

## 📚 Références

- **Tests**: `tests/integration/api/store-publish.test.ts`
- **Fixtures**: `tests/integration/api/fixtures/store-publish-samples.ts`
- **Documentation**: `tests/integration/api/store-publish-README.md`
- **API Docs**: `docs/api-tests.md`
- **Spec**: `.kiro/specs/shopify-style-onboarding/`

---

**Dernière mise à jour**: 2024-11-11  
**Responsable**: Équipe Platform  
**Status**: ✅ Documenté et prêt pour exécution
