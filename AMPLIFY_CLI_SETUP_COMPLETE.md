# ✅ Configuration Amplify CLI - Prête

## 🎯 Résumé

Toutes les informations nécessaires ont été récupérées automatiquement:

- ✅ **App ID**: `d33l77zi1h78ce`
- ✅ **Redis Endpoint**: `huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com:6379`
- ✅ **SQS Queue URL**: `https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue`
- ✅ **Toutes les variables**: Prêtes à configurer

## 🚀 Configuration en 3 Étapes (CLI)

### Étape 1: Configure tes credentials AWS

```bash
export AWS_ACCESS_KEY_ID="YOUR_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="YOUR_SECRET_KEY"
export AWS_SESSION_TOKEN="YOUR_SESSION_TOKEN"
export AWS_REGION="us-east-1"
```

### Étape 2: Configure les variables d'environnement

Copie-colle cette commande complète:

```bash
aws amplify update-branch \
  --app-id d33l77zi1h78ce \
  --branch-name main \
  --environment-variables '{
    "AWS_REGION": "us-east-1",
    "RATE_LIMITER_ENABLED": "true",
    "SQS_RATE_LIMITER_QUEUE_URL": "https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue",
    "SQS_RATE_LIMITER_DLQ_URL": "https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue-dlq",
    "REDIS_ENDPOINT": "huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com:6379",
    "CLOUDWATCH_NAMESPACE": "Huntaze/OnlyFans"
  }' \
  --region us-east-1
```

**Réponse attendue**:
```json
{
    "branch": {
        "branchName": "main",
        "environmentVariables": {
            "AWS_REGION": "us-east-1",
            "RATE_LIMITER_ENABLED": "true",
            ...
        }
    }
}
```

### Étape 3: Déclenche un redéploiement

```bash
aws amplify start-job \
  --app-id d33l77zi1h78ce \
  --branch-name main \
  --job-type RELEASE \
  --region us-east-1
```

**Réponse attendue**:
```json
{
    "jobSummary": {
        "jobId": "xxx",
        "status": "PENDING"
    }
}
```

## 📊 Suivi du Déploiement

### Option 1: AWS Console
```
https://console.aws.amazon.com/amplify/home?region=us-east-1#/d33l77zi1h78ce
```

### Option 2: CLI
```bash
aws amplify list-jobs \
  --app-id d33l77zi1h78ce \
  --branch-name main \
  --max-results 1 \
  --region us-east-1
```

## ✅ Tests Post-Déploiement

Une fois le déploiement terminé (~5-10 minutes):

### Test 1: Queue Status
```bash
curl https://d33l77zi1h78ce.amplifyapp.com/api/onlyfans/messages/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Réponse attendue**: HTTP 200
```json
{
  "queueDepth": 0,
  "dlqDepth": 0,
  "messagesInFlight": 0,
  "timestamp": "2024-11-02T..."
}
```

### Test 2: Send Message
```bash
curl -X POST https://d33l77zi1h78ce.amplifyapp.com/api/onlyfans/messages/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "recipientId": "test-recipient",
    "content": "Test message from production",
    "priority": 1
  }'
```

**Réponse attendue**: HTTP 202
```json
{
  "messageId": "xxx-xxx-xxx",
  "status": "queued",
  "queuedAt": "2024-11-02T..."
}
```

### Test 3: Monitoring
```bash
curl https://d33l77zi1h78ce.amplifyapp.com/api/monitoring/onlyfans \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Réponse attendue**: HTTP 200
```json
{
  "status": "healthy",
  "sqs": { "connected": true },
  "database": { "connected": true },
  "redis": { "connected": true }
}
```

## 🔍 Vérification CloudWatch

### Métriques Custom
```bash
aws cloudwatch list-metrics \
  --namespace "Huntaze/OnlyFans" \
  --region us-east-1
```

**Métriques attendues**:
- `OnlyFansMessagesQueued`
- `OnlyFansQueueDepth`

### Logs Lambda
```bash
aws logs tail /aws/lambda/huntaze-rate-limiter \
  --follow \
  --region us-east-1
```

## 📚 Scripts Disponibles

Tous les scripts ont été créés pour toi:

1. **`scripts/get-amplify-app-id.sh`** - Trouve l'App ID automatiquement
2. **`scripts/get-redis-endpoint.sh`** - Récupère l'endpoint Redis
3. **`scripts/configure-amplify.sh`** - Configuration automatique (si credentials valides)
4. **`scripts/amplify-commands.sh`** - Génère les commandes CLI

## 🎯 Checklist Finale

- [ ] Credentials AWS configurés
- [ ] Variables d'environnement configurées via CLI
- [ ] Déploiement déclenché
- [ ] Déploiement terminé (~5-10 min)
- [ ] Test 1: GET /api/onlyfans/messages/status → ✅ HTTP 200
- [ ] Test 2: POST /api/onlyfans/messages/send → ✅ HTTP 202
- [ ] Test 3: GET /api/monitoring/onlyfans → ✅ HTTP 200
- [ ] CloudWatch metrics visibles
- [ ] Lambda logs accessibles

## 💰 Coûts Mensuels

Avec l'infrastructure activée:
- Lambda: ~$20/mois
- SQS: ~$5/mois
- Redis: ~$40-80/mois
- CloudWatch: ~$5/mois

**Total**: ~$70-110/mois

## 🎊 Résultat Final

Une fois tous les tests validés:

✅ **OnlyFans CRM 100% Opérationnel en Production!**

- Infrastructure AWS active
- Backend complet déployé
- Monitoring en place
- Prêt pour les utilisateurs

---

**Dernière mise à jour**: 2024-11-02  
**Status**: Configuration CLI prête  
**Prochaine étape**: Exécuter les 3 commandes CLI ci-dessus
