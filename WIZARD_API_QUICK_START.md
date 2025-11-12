# Wizard API - Quick Start Guide

## 🚀 TL;DR

L'endpoint `/api/onboarding/wizard` a été optimisé avec validation Zod, transactions DB, logging structuré et gestion d'erreurs granulaire.

## 📋 Ce qui a changé

### ✅ Validation Automatique
```typescript
// Avant: validation manuelle
if (!payload.platform || !payload.primary_goal) { ... }

// Après: Zod schema
const WizardPayloadSchema = z.object({
  platform: z.enum(['onlyfans', 'instagram', 'tiktok', 'reddit', 'other']),
  primary_goal: z.enum(['grow', 'automate', 'content', 'all']),
  // ...
});
```

### ✅ Transactions Database
```typescript
// Avant: queries séparées (risque de données partielles)
await pool.query('INSERT ...');
await pool.query('INSERT ...');

// Après: transaction atomique
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('INSERT INTO user_wizard_completions ...');
  await client.query('INSERT INTO onboarding_events ...');
  await client.query('COMMIT');
} catch {
  await client.query('ROLLBACK');
  throw;
} finally {
  client.release();
}
```

### ✅ Erreurs Granulaires
```typescript
// Avant: erreur générique
catch (error) {
  return NextResponse.json({ error: 'Failed' }, { status: 500 });
}

// Après: codes HTTP appropriés
if (error.message.includes('Unauthorized')) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
if (error.message.includes('duplicate key')) {
  return NextResponse.json({ error: 'Wizard already completed' }, { status: 409 });
}
if (error.message.includes('connection')) {
  return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
}
```

## 🧪 Tester Localement

### 1. Requête Valide
```bash
curl -X POST http://localhost:3000/api/onboarding/wizard \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "instagram",
    "primary_goal": "grow",
    "ai_tone": "professional"
  }'
```

**Réponse attendue (200):**
```json
{
  "success": true,
  "user_id": "user-123",
  "services_enabled": ["hashtag_analyzer", "engagement_predictor", ...],
  "templates_loaded": ["dm_template", "hashtag_template", ...],
  "dashboard_config": { ... },
  "ai_config": { ... },
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 2. Validation Error
```bash
curl -X POST http://localhost:3000/api/onboarding/wizard \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "facebook",
    "primary_goal": "grow"
  }'
```

**Réponse attendue (400):**
```json
{
  "error": "Invalid request body",
  "details": "platform: Invalid enum value. Expected 'onlyfans' | 'instagram' | 'tiktok' | 'reddit' | 'other', received 'facebook'",
  "correlationId": "..."
}
```

### 3. Auth Error
```bash
curl -X POST http://localhost:3000/api/onboarding/wizard \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "instagram",
    "primary_goal": "grow"
  }'
```

**Réponse attendue (401):**
```json
{
  "error": "Unauthorized",
  "correlationId": "..."
}
```

## 📊 Monitoring

### Logs à Surveiller

**Success:**
```
[Wizard API] Wizard completed successfully {
  userId: "user-123",
  platform: "instagram",
  goal: "grow",
  servicesEnabled: 4,
  templatesLoaded: 3,
  correlationId: "..."
}
```

**Validation Error:**
```
[Wizard API] Validation failed {
  userId: "user-123",
  errors: [...],
  correlationId: "..."
}
```

**Database Error:**
```
[Wizard API] Error processing wizard {
  error: "connection timeout",
  stack: "...",
  correlationId: "..."
}
```

### Métriques Prometheus

```promql
# Request rate
rate(wizard_requests_total[5m])

# Error rate
rate(wizard_errors_total[5m])

# Latency p99
histogram_quantile(0.99, wizard_request_duration_seconds)

# Completions by platform
wizard_completions_total{platform="instagram"}
```

## 🐛 Debugging

### Utiliser le Correlation ID

1. **Utilisateur signale une erreur**
2. **Récupérer le correlationId de la réponse**
3. **Chercher dans les logs:**
   ```bash
   grep "550e8400-e29b-41d4-a716-446655440000" /var/log/app.log
   ```
4. **Voir toute la trace de la requête**

### Erreurs Communes

| Erreur | Cause | Solution |
|--------|-------|----------|
| 400 + "Invalid enum value" | Platform/goal invalide | Vérifier les valeurs acceptées |
| 401 + "Unauthorized" | Token manquant/invalide | Vérifier l'authentification |
| 409 + "Wizard already completed" | Tentative de re-complétion | Normal, wizard déjà fait |
| 503 + "Service temporarily unavailable" | DB down | Vérifier connexion database |

## 📚 Documentation Complète

- **API Docs:** `docs/api/wizard-endpoint.md`
- **Tests:** `tests/integration/api/wizard.test.ts`
- **Implementation:** `WIZARD_API_OPTIMIZATION_COMPLETE.md`

## 🔧 Pour les Développeurs

### Ajouter un Nouveau Champ

1. **Mettre à jour le schema Zod:**
   ```typescript
   const WizardPayloadSchema = z.object({
     // ... existing fields
     new_field: z.string().optional()
   });
   ```

2. **Mettre à jour le type:**
   ```typescript
   type WizardPayload = z.infer<typeof WizardPayloadSchema>;
   ```

3. **Utiliser dans le handler:**
   ```typescript
   const newField = payload.new_field;
   ```

4. **Mettre à jour les tests:**
   ```typescript
   it('should accept new_field', async () => {
     const response = await fetch(WIZARD_ENDPOINT, {
       body: JSON.stringify({
         platform: 'instagram',
         primary_goal: 'grow',
         new_field: 'value'
       })
     });
     expect(response.ok).toBe(true);
   });
   ```

### Ajouter une Nouvelle Plateforme

1. **Mettre à jour l'enum Zod:**
   ```typescript
   platform: z.enum(['onlyfans', 'instagram', 'tiktok', 'reddit', 'other', 'new_platform'])
   ```

2. **Ajouter les services:**
   ```typescript
   function getServicesForPlatform(platform: string): string[] {
     const serviceMap = {
       // ... existing platforms
       new_platform: ['service1', 'service2']
     };
     return serviceMap[platform] || serviceMap.other;
   }
   ```

3. **Ajouter les templates:**
   ```typescript
   function getTemplatesForPlatform(platform: string, goal: string): string[] {
     const platformTemplates = {
       // ... existing platforms
       new_platform: ['template1', 'template2']
     };
     // ...
   }
   ```

4. **Mettre à jour la doc:**
   - `docs/api/wizard-endpoint.md`
   - Ajouter section "New Platform"

## ✅ Checklist Avant Commit

- [ ] Code compile sans erreurs TypeScript
- [ ] Tests d'intégration passent
- [ ] Documentation mise à jour
- [ ] Logs structurés ajoutés
- [ ] Correlation IDs présents
- [ ] Gestion d'erreurs granulaire
- [ ] Validation Zod complète

## 🚀 Déploiement

### Staging
```bash
# 1. Deploy
git push origin staging

# 2. Smoke test
curl -X POST https://staging.example.com/api/onboarding/wizard \
  -H "Authorization: Bearer <staging-token>" \
  -H "Content-Type: application/json" \
  -d '{"platform":"instagram","primary_goal":"grow"}'

# 3. Check logs
kubectl logs -f deployment/app -n staging | grep "Wizard API"

# 4. Check metrics
curl https://staging.example.com/api/metrics | grep wizard
```

### Production
```bash
# 1. Validate staging OK
# 2. Deploy
git push origin main

# 3. Monitor
watch -n 5 'curl https://api.example.com/api/metrics | grep wizard'

# 4. Check error rate
# Should be <1%
```

## 🆘 Support

### Questions?
- Consulter `docs/api/wizard-endpoint.md`
- Consulter `WIZARD_API_OPTIMIZATION_COMPLETE.md`
- Contacter Platform Team

### Bugs?
1. Récupérer le correlationId
2. Chercher dans les logs
3. Créer issue GitHub avec:
   - correlationId
   - Request payload
   - Expected vs actual behavior
   - Logs pertinents

---

**Last Updated:** 2025-11-11  
**Status:** ✅ Production Ready  
**Maintainer:** Platform Team
