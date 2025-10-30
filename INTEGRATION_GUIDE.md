# 🚀 Guide d'Intégration - API Optimization

## Vue d'ensemble

Ce guide vous aide à intégrer les optimisations API dans votre workflow de développement.

## 📋 Checklist d'Intégration

### Phase 1: Validation (5 min)

```bash
# 1. Vérifier que toutes les optimisations sont en place
node scripts/validate-api-integration.mjs

# Résultat attendu: Score 100%
```

### Phase 2: Tests (10 min)

```bash
# 2. Exécuter les tests unitaires
npm test tests/unit/production-hybrid-orchestrator-v2-enhanced.test.ts

# 3. Exécuter les tests d'intégration
npm test tests/integration/

# 4. Vérifier la coverage
npm run test:coverage
```

### Phase 3: Review du Code (15 min)

```bash
# 5. Review des changements
git diff lib/services/production-hybrid-orchestrator-v2.ts

# Points à vérifier:
# - Custom error types présents
# - Retry logic implémentée
# - Cost tracking actif
# - Data sanitization en place
# - Logging structuré
```

### Phase 4: Documentation (10 min)

```bash
# 6. Lire la documentation API
cat docs/api/production-hybrid-orchestrator-api.md

# 7. Lire le résumé des optimisations
cat docs/api/api-integration-optimization-summary.md

# 8. Lire le guide complet
cat API_INTEGRATION_OPTIMIZATION_COMPLETE.md
```

### Phase 5: Déploiement Staging (30 min)

```bash
# 9. Build du projet
npm run build

# 10. Déployer en staging
npm run deploy:staging

# 11. Vérifier le health check
curl https://staging.huntaze.com/api/workflows/health

# 12. Tester un workflow simple
curl -X POST https://staging.huntaze.com/api/workflows/execute \
  -H "Authorization: Bearer $STAGING_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "intent": {
      "type": "message_generation",
      "userId": "test-user",
      "data": { "message": "Hello world" }
    }
  }'
```

### Phase 6: Monitoring (Continu)

```bash
# 13. Monitorer CloudWatch
aws cloudwatch get-metric-statistics \
  --namespace Huntaze/HybridOrchestrator \
  --metric-name workflow_completed \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum

# 14. Vérifier les coûts
npm run check:costs

# 15. Vérifier les erreurs
npm run check:errors
```

## 🔧 Configuration

### Variables d'Environnement

Assurez-vous que ces variables sont configurées :

```bash
# PostgreSQL RDS
DATABASE_URL=postgresql://user:pass@host:5432/db

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# SQS Queues
SQS_ONLYFANS_QUEUE=https://sqs.us-east-1.amazonaws.com/...
SQS_RETRY_QUEUE=https://sqs.us-east-1.amazonaws.com/...
SQS_DLQ=https://sqs.us-east-1.amazonaws.com/...

# OpenAI
OPENAI_API_KEY=sk-...

# Azure
AZURE_OPENAI_ENDPOINT=https://...
AZURE_OPENAI_KEY=...

# OnlyFans
ONLYFANS_SESSION_TOKEN=...
```

### Timeouts

Les timeouts sont configurés dans le code :

```typescript
// OpenAI: 30 secondes
const OPENAI_TIMEOUT = 30000;

// Azure: 45 secondes
const AZURE_TIMEOUT = 45000;
```

Pour les modifier, éditez `lib/services/production-hybrid-orchestrator-v2.ts`.

### Retry Configuration

Les retries sont configurés dans le code :

```typescript
const maxRetries = 3;
const retryDelays = [1000, 2000, 5000]; // 1s, 2s, 5s
```

## 📊 Monitoring

### CloudWatch Dashboards

Créez un dashboard CloudWatch avec ces métriques :

1. **Workflow Metrics**
   - `workflow_started`
   - `workflow_completed`
   - `workflow_error`

2. **Provider Metrics**
   - `azure_execution_completed`
   - `openai_execution_completed`
   - `azure_execution_failed`
   - `openai_execution_failed`

3. **Cost Metrics**
   - `cost_tracking_failed`
   - Total cost per hour
   - Average cost per workflow

4. **Performance Metrics**
   - Average duration
   - P95 duration
   - P99 duration

### Alertes

Configurez des alertes CloudWatch pour :

1. **Error Rate > 5%**
   ```
   Metric: workflow_error
   Threshold: > 5% of workflow_started
   Action: SNS notification
   ```

2. **High Cost**
   ```
   Metric: Total cost
   Threshold: > $10/hour
   Action: SNS notification
   ```

3. **High Latency**
   ```
   Metric: Average duration
   Threshold: > 10 seconds
   Action: SNS notification
   ```

## 🐛 Debugging

### Trouver un Workflow

```bash
# Par traceId
aws logs filter-log-events \
  --log-group-name /aws/lambda/huntaze-orchestrator \
  --filter-pattern "trace-abc-123"

# Par userId
aws logs filter-log-events \
  --log-group-name /aws/lambda/huntaze-orchestrator \
  --filter-pattern "user-123"

# Par workflowId
aws logs filter-log-events \
  --log-group-name /aws/lambda/huntaze-orchestrator \
  --filter-pattern "workflow-ghi-789"
```

### Analyser les Erreurs

```bash
# Erreurs OpenAI
aws logs filter-log-events \
  --log-group-name /aws/lambda/huntaze-orchestrator \
  --filter-pattern "openai_execution_failed"

# Erreurs Azure
aws logs filter-log-events \
  --log-group-name /aws/lambda/huntaze-orchestrator \
  --filter-pattern "azure_execution_failed"

# Erreurs de retry
aws logs filter-log-events \
  --log-group-name /aws/lambda/huntaze-orchestrator \
  --filter-pattern "MAX_RETRIES_EXCEEDED"
```

### Analyser les Coûts

```bash
# Coûts par utilisateur
SELECT userId, SUM(cost) as total_cost
FROM cost_tracking
WHERE timestamp > NOW() - INTERVAL '1 day'
GROUP BY userId
ORDER BY total_cost DESC;

# Coûts par provider
SELECT provider, SUM(cost) as total_cost, AVG(tokens) as avg_tokens
FROM cost_tracking
WHERE timestamp > NOW() - INTERVAL '1 day'
GROUP BY provider;

# Workflows les plus coûteux
SELECT workflowId, cost, tokens, duration
FROM cost_tracking
WHERE timestamp > NOW() - INTERVAL '1 day'
ORDER BY cost DESC
LIMIT 10;
```

## 🔒 Sécurité

### Checklist de Sécurité

- [ ] Pas de secrets dans les logs
- [ ] Data sanitization activée
- [ ] Authentication requise sur tous les endpoints
- [ ] Rate limiting configuré
- [ ] HTTPS uniquement
- [ ] CORS configuré correctement
- [ ] Input validation en place

### Audit de Sécurité

```bash
# Vérifier qu'il n'y a pas de secrets dans les logs
grep -r "sk-" logs/ # OpenAI keys
grep -r "Bearer" logs/ # Auth tokens
grep -r "password" logs/ # Passwords

# Vérifier la sanitization
node scripts/validate-api-integration.mjs
```

## 📈 Performance

### Optimisations Recommandées

1. **Caching**
   ```typescript
   // Implémenter un cache Redis pour les résultats fréquents
   const cachedResult = await redis.get(`workflow:${userId}:${hash}`);
   if (cachedResult) return cachedResult;
   ```

2. **Connection Pooling**
   ```typescript
   // Utiliser un pool de connexions PostgreSQL
   const prisma = new PrismaClient({
     datasources: {
       db: {
         url: process.env.DATABASE_URL,
         pool: { max: 20, min: 5 }
       }
     }
   });
   ```

3. **Batch Processing**
   ```typescript
   // Traiter les workflows par batch
   const workflows = await getQueuedWorkflows(10);
   await Promise.all(workflows.map(w => executeWorkflow(w)));
   ```

## 🧪 Tests

### Exécuter Tous les Tests

```bash
# Tests unitaires
npm test tests/unit/

# Tests d'intégration
npm test tests/integration/

# Tests de performance
npm test tests/performance/

# Tests de régression
npm test tests/regression/
```

### Tests Spécifiques

```bash
# Retry strategy
npm test -- --grep "Retry Strategy"

# Cost tracking
npm test -- --grep "Cost Tracking"

# Error handling
npm test -- --grep "Error"
```

## 📚 Ressources

### Documentation
- [API Documentation](docs/api/production-hybrid-orchestrator-api.md)
- [Optimization Summary](docs/api/api-integration-optimization-summary.md)
- [Complete Guide](API_INTEGRATION_OPTIMIZATION_COMPLETE.md)

### Scripts
- [Validation Script](scripts/validate-api-integration.mjs)

### Tests
- [Enhanced Tests](tests/unit/production-hybrid-orchestrator-v2-enhanced.test.ts)

## 🤝 Support

### Problèmes Courants

#### 1. Timeout Errors
```
Solution: Augmenter les timeouts dans le code
- OpenAI: 30s → 45s
- Azure: 45s → 60s
```

#### 2. Rate Limit Errors
```
Solution: Vérifier les quotas et augmenter si nécessaire
- OpenAI: 3,500 req/min
- Azure: 60 req/min
```

#### 3. Cost Tracking Failures
```
Solution: Vérifier que costMonitoringService est accessible
- Vérifier les credentials AWS
- Vérifier la connexion réseau
```

### Contact

- **Email**: support@huntaze.com
- **Slack**: #api-support
- **Documentation**: https://docs.huntaze.com

## ✅ Checklist Finale

Avant de déployer en production :

- [ ] Validation script passe à 100%
- [ ] Tous les tests passent
- [ ] Documentation lue et comprise
- [ ] Variables d'environnement configurées
- [ ] Monitoring configuré
- [ ] Alertes configurées
- [ ] Audit de sécurité effectué
- [ ] Tests de charge effectués
- [ ] Rollback plan préparé
- [ ] Équipe informée

## 🎉 Conclusion

Vous êtes maintenant prêt à utiliser l'API optimisée !

Pour toute question, consultez la documentation ou contactez le support.

**Bonne intégration ! 🚀**
