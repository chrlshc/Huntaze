# 🎯 OnlyFans CRM - Configuration Amplify Prête

## ✅ Infrastructure AWS Vérifiée

Toutes les ressources AWS sont actives et fonctionnelles:

- ✅ **Lambda**: `huntaze-rate-limiter` (Node.js 20.x)
- ✅ **SQS Queue**: `huntaze-rate-limiter-queue`
- ✅ **Redis**: `huntaze-redis-production`
- ✅ **Endpoints**: Tous récupérés avec succès

## 📋 Variables d'Environnement pour Amplify

Copie ces variables exactes dans **Amplify Console** → **Environment variables**:

```bash
# AWS Configuration
AWS_REGION=us-east-1

# OnlyFans Rate Limiter
RATE_LIMITER_ENABLED=true
SQS_RATE_LIMITER_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue
SQS_RATE_LIMITER_DLQ_URL=https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue-dlq

# Redis ElastiCache
REDIS_ENDPOINT=huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com:6379

# CloudWatch Monitoring
CLOUDWATCH_NAMESPACE=Huntaze/OnlyFans
```

## 🚀 Étapes de Configuration (5-10 minutes)

### 1. Accéder à Amplify Console
```
https://console.aws.amazon.com/amplify/
```

### 2. Configurer les Variables
1. Sélectionne ton app **huntaze**
2. Menu gauche → **Environment variables**
3. Clique **Manage variables**
4. Pour chaque variable ci-dessus:
   - Clique **Add variable**
   - Entre le **Key** (ex: `AWS_REGION`)
   - Entre la **Value** (ex: `us-east-1`)
   - Sélectionne l'environnement (production)
5. Clique **Save**

### 3. Redéployer
1. Va dans **Deployments**
2. Clique **Redeploy this version**
3. Attends ~5-10 minutes

## ✅ Tests de Validation

Une fois le déploiement terminé, teste les endpoints:

### Test 1: Queue Status
```bash
curl https://huntaze.com/api/onlyfans/messages/status \
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
curl -X POST https://huntaze.com/api/onlyfans/messages/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "recipientId": "test-recipient",
    "content": "Test message",
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
curl https://huntaze.com/api/monitoring/onlyfans \
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

## 📊 Monitoring Post-Configuration

### CloudWatch Metrics
```
https://console.aws.amazon.com/cloudwatch/
→ Metrics → Custom Namespaces → Huntaze/OnlyFans
```

Métriques à surveiller:
- `OnlyFansMessagesQueued`
- `OnlyFansQueueDepth`

### SQS Queue
```
https://console.aws.amazon.com/sqs/
→ huntaze-rate-limiter-queue
```

Vérifier:
- Messages Available: 0 (au repos)
- Messages in Flight: 0 (au repos)
- DLQ Messages: 0 (toujours)

### Lambda Logs
```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups
→ /aws/lambda/huntaze-rate-limiter
```

## 🎯 Checklist Finale

- [ ] Variables configurées dans Amplify Console
- [ ] Application redéployée avec succès
- [ ] Test 1: GET /api/onlyfans/messages/status → ✅ HTTP 200
- [ ] Test 2: POST /api/onlyfans/messages/send → ✅ HTTP 202
- [ ] Test 3: GET /api/monitoring/onlyfans → ✅ HTTP 200
- [ ] CloudWatch metrics visibles
- [ ] SQS queue reçoit des messages
- [ ] Lambda traite les messages
- [ ] Aucun message dans DLQ

## 💰 Coûts Mensuels Estimés

Avec l'infrastructure activée:
- Lambda: ~$20/mois (10k invocations/jour)
- SQS: ~$5/mois (100k messages/jour)
- Redis: ~$40-80/mois (ElastiCache)
- CloudWatch: ~$5/mois (métriques custom)

**Total**: ~$70-110/mois

## 📚 Documentation Complète

- **Guide Setup**: `docs/ONLYFANS_AMPLIFY_SETUP.md`
- **Guide Développeur**: `docs/ONLYFANS_DEVELOPER_GUIDE.md`
- **Guide Utilisateur**: `docs/ONLYFANS_USER_GUIDE.md`
- **Status Infrastructure**: `ONLYFANS_AWS_INFRASTRUCTURE_STATUS.md`

## 🎊 Prochaines Étapes

Une fois la configuration Amplify complète et les tests validés:

1. ✅ **OnlyFans CRM à 100%** - Toutes les features backend + UI complètes
2. ✅ **Infrastructure AWS active** - Lambda + SQS + Redis opérationnels
3. ✅ **Monitoring en place** - CloudWatch metrics + logs
4. 🚀 **Production Ready** - Prêt pour les utilisateurs

---

**Task 24 Status**: ⏳ En attente de configuration manuelle Amplify  
**Durée estimée**: 5-10 minutes  
**Dernière étape**: Configuration des variables d'environnement

**Une fois complété**: OnlyFans CRM sera 100% opérationnel en production! 🎉
