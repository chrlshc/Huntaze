# Step Migration API - Quick Start Guide 🚀

Guide rapide pour utiliser l'API de migration de version des étapes d'onboarding.

## 📋 TL;DR

```bash
# 1. Dry-run pour tester
curl -X POST /api/admin/onboarding/migrate-version \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"stepId":"payments","fromVersion":1,"toVersion":2,"dryRun":true}'

# 2. Exécuter la migration
curl -X POST /api/admin/onboarding/migrate-version \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"stepId":"payments","fromVersion":1,"toVersion":2,"dryRun":false}'

# 3. Vérifier l'historique
curl -X GET "/api/admin/onboarding/migrate-version?stepId=payments" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🎯 Cas d'Usage Principaux

### 1. Migrer un Step Simple

```typescript
// TypeScript
const response = await fetch('/api/admin/onboarding/migrate-version', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    stepId: 'payments',
    fromVersion: 1,
    toVersion: 2,
    newStepData: {
      title: 'Configure Payment Methods',
      weight: 35
    },
    dryRun: false
  })
});

const result = await response.json();
console.log(result.message);
```

### 2. Batch Migration

```typescript
const migrations = [
  { stepId: 'payments', fromVersion: 1, toVersion: 2 },
  { stepId: 'theme', fromVersion: 1, toVersion: 2 },
  { stepId: 'product', fromVersion: 1, toVersion: 2 }
];

const response = await fetch('/api/admin/onboarding/migrate-version', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(migrations)
});

const result = await response.json();
console.log(`${result.summary.successful}/${result.summary.total} successful`);
```

### 3. Consulter l'Historique

```typescript
const response = await fetch(
  '/api/admin/onboarding/migrate-version?stepId=payments',
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);

const history = await response.json();
console.log(`Active: v${history.activeVersion}`);
```

---

## 🔧 Paramètres Importants

### Request Body (POST)

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `stepId` | string | ✅ | Identifiant du step |
| `fromVersion` | number | ✅ | Version actuelle |
| `toVersion` | number | ✅ | Version cible |
| `newStepData` | object | ❌ | Nouvelles données du step |
| `dryRun` | boolean | ❌ | Mode test (défaut: false) |
| `maxRetries` | number | ❌ | Nombre de tentatives (défaut: 3) |
| `retryDelayMs` | number | ❌ | Délai entre tentatives (défaut: 1000) |

### Response (Success)

```typescript
{
  success: true,
  message: "Migration completed successfully...",
  result: {
    stepId: "payments",
    fromVersion: 1,
    toVersion: 2,
    usersAffected: 1523,
    progressCopied: 1245,
    progressReset: 278,
    warnings: [],
    dryRun: false,
    duration: 3456,
    timestamp: "2025-11-11T10:30:00Z"
  },
  correlationId: "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## ⚠️ Erreurs Communes

### 1. "Missing required fields"
```json
{
  "error": "Missing required fields",
  "required": ["stepId", "fromVersion", "toVersion"]
}
```
**Solution:** Vérifier que tous les champs requis sont présents.

### 2. "Target version must be greater than source version"
```json
{
  "error": "Validation failed",
  "errors": ["Target version (1) must be greater than source version (2)"]
}
```
**Solution:** `toVersion` doit être > `fromVersion`.

### 3. "Step not found"
```json
{
  "error": "Validation failed",
  "errors": ["Step payments version 1 does not exist"]
}
```
**Solution:** Vérifier que le step et la version existent.

### 4. "Target version already exists"
```json
{
  "error": "Validation failed",
  "errors": ["Step payments version 2 already exists"]
}
```
**Solution:** Utiliser un numéro de version non utilisé.

---

## 🎓 Best Practices

### ✅ DO

1. **Toujours tester avec dry-run d'abord**
   ```typescript
   // Step 1: Dry run
   await migrate({ ..., dryRun: true });
   
   // Step 2: Review results
   
   // Step 3: Execute
   await migrate({ ..., dryRun: false });
   ```

2. **Migrer pendant les heures creuses**
   ```typescript
   // Planifier pour 3h du matin
   const scheduledTime = new Date('2025-11-12T03:00:00Z');
   ```

3. **Backup avant migration importante**
   ```bash
   ./scripts/backup-database.sh
   ```

4. **Surveiller les logs**
   ```bash
   tail -f /var/log/app.log | grep "Step Migration"
   ```

5. **Utiliser correlation IDs pour debugging**
   ```typescript
   console.log(`Migration ID: ${result.correlationId}`);
   ```

### ❌ DON'T

1. **Ne pas migrer en production sans dry-run**
2. **Ne pas migrer pendant les heures de pointe**
3. **Ne pas ignorer les warnings**
4. **Ne pas migrer plus de 10 steps en batch**
5. **Ne pas oublier de vérifier l'historique après**

---

## 📊 Monitoring

### Logs à Surveiller

```bash
# Migration started
[Step Migration] Migration started { stepId: "payments", ... }

# Transaction committed
[Step Migration] Transaction committed { usersAffected: 1523, ... }

# Migration completed
[Step Migration] Migration completed { success: true, duration: 3456, ... }
```

### Métriques à Tracker

- `usersAffected` - Nombre d'utilisateurs impactés
- `duration` - Durée de la migration (ms)
- `errorCount` - Nombre d'erreurs
- `warningCount` - Nombre d'avertissements

---

## 🆘 Troubleshooting

### Migration Timeout

**Symptôme:** Pas de réponse après 30s

**Solution:**
```typescript
// Augmenter le timeout
const response = await fetch('/api/admin/onboarding/migrate-version', {
  method: 'POST',
  headers: { ... },
  body: JSON.stringify({
    stepId: 'payments',
    fromVersion: 1,
    toVersion: 2,
    maxRetries: 5,
    retryDelayMs: 2000
  }),
  signal: AbortSignal.timeout(60000) // 60s timeout
});
```

### Transaction Rollback

**Symptôme:** "Transaction rolled back"

**Solution:**
1. Vérifier les logs avec correlation ID
2. Vérifier la santé de la base de données
3. Réessayer la migration

### Trop d'Utilisateurs Affectés

**Symptôme:** `usersAffected > 10000`

**Solution:**
1. Planifier pendant heures creuses
2. Considérer migration par chunks
3. Augmenter timeout

---

## 📚 Documentation Complète

- **API Reference:** `docs/api/step-version-migration.md`
- **Service Code:** `lib/services/step-version-migration.ts`
- **Tests:** `tests/integration/api/step-version-migration.test.ts`
- **Résumé:** `STEP_MIGRATION_INTEGRATION_COMPLETE.md`

---

## 🚀 Commandes Utiles

```bash
# Tester l'API
npm run test:integration tests/integration/api/step-version-migration.test.ts

# Vérifier les types
npm run type-check

# Linter
npm run lint

# Build
npm run build

# Backup DB
./scripts/backup-database.sh

# Voir les logs
tail -f /var/log/app.log | grep "Step Migration"
```

---

## 💡 Tips

1. **Correlation IDs** - Toujours noter le correlation ID pour debugging
2. **Warnings** - Ne pas ignorer les warnings dans la réponse
3. **Duration** - Si > 10s, considérer optimisation
4. **Batch** - Max 10 migrations, stop on first failure
5. **Dry-run** - Gratuit, utiliser sans modération

---

**Need Help?** Consulter `docs/api/step-version-migration.md` ou contacter l'équipe Platform.

**Status:** ✅ Production Ready  
**Version:** 1.0  
**Last Updated:** 2025-11-11
