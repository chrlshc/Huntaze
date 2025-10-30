# 🚀 Huntaze - Quick Reference Guide

## 📋 TL;DR - Ce que tu as

**Plateforme:** OnlyFans management avec AI hybride  
**Stack:** Next.js + PostgreSQL + AWS  
**AI:** Azure OpenAI (GPT-4) + OpenAI (GPT-3.5)  
**Infra:** ECS Fargate + RDS + DynamoDB + SQS  

---

## 🎯 SERVICES PRINCIPAUX

### 1. Hybrid Orchestrator
**Fichier:** `lib/services/production-hybrid-orchestrator-v2.ts`  
**Rôle:** Route les requêtes AI entre Azure et OpenAI  
**Features:**
- Circuit breaker
- Fallback automatique
- Distributed tracing
- Cost tracking intégré

**Usage:**
```typescript
const orchestrator = getProductionHybridOrchestrator();
const result = await orchestrator.executeWorkflow(userId, {
  type: 'content_planning',
  platforms: ['instagram', 'onlyfans'],
  data: { theme: 'fitness' }
});
```

---

### 2. Rate Limiter (OnlyFans)
**Fichier:** `lib/services/enhanced-rate-limiter.ts`  
**Rôle:** Compliance OnlyFans (10 messages/minute)  
**Features:**
- Redis-backed state
- Intelligent queuing
- Recipient-based limits

**Usage:**
```typescript
const canSend = await rateLimiter.checkLimit(userId, 'onlyfans_message');
if (!canSend.allowed) {
  // Queue for later
  await queueManager.enqueue(message, canSend.retryAfter);
}
```

---

### 3. Cost Monitoring
**Fichier:** `lib/services/cost-monitoring-service.ts`  
**Rôle:** Track coûts AI en temps réel  
**Features:**
- DynamoDB storage
- CloudWatch metrics
- Email alerts

**Usage:**
```typescript
await costMonitoringService.trackUsage(
  'azure',      // provider
  2500,         // tokens
  0.025,        // cost in $
  userId,
  workflowId,
  'content_planning'
);
```

---

## 🌐 API ENDPOINTS

### MVP (Production-ready)

```bash
# Main orchestration
POST /api/v2/campaigns/hybrid
Body: {
  "type": "content_planning",
  "platforms": ["instagram"],
  "data": { "theme": "fitness" }
}

# Check status
GET /api/v2/campaigns/status?workflowId=xxx

# Cost breakdown
GET /api/v2/costs/breakdown?startDate=2024-01-01&endDate=2024-01-31

# Real-time stats
GET /api/v2/costs/stats

# Health check
GET /api/health/hybrid-orchestrator
```

---

## 🗄️ AWS RESOURCES

### Existing (✅ Ready)
```
RDS:        huntaze-postgres-production (db.t3.micro)
ECS:        huntaze-cluster, huntaze-of-fargate, ai-team
DynamoDB:   huntaze-users, huntaze-posts, huntaze-of-*
SQS:        huntaze-enrichment-production, huntaze-notifications-production
```

### To Create (⚠️ Missing)
```
DynamoDB:   huntaze-ai-costs-production
DynamoDB:   huntaze-cost-alerts-production
SQS:        huntaze-hybrid-workflows
SQS:        huntaze-rate-limiter-queue
SNS:        huntaze-cost-alerts
```

**Run this to create:**
```bash
./scripts/setup-aws-infrastructure.sh
```

---

## 🔐 ENV VARIABLES (Minimal)

```bash
# Database
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."

# AWS
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."

# AI Providers
AZURE_OPENAI_API_KEY="..."
AZURE_OPENAI_ENDPOINT="https://huntaze-openai.openai.azure.com/"
OPENAI_API_KEY="..."

# Alerts
COST_ALERT_EMAIL="admin@huntaze.com"
SLACK_WEBHOOK_URL="https://hooks.slack.com/..."
```

---

## 🚀 DEPLOYMENT CHECKLIST

```bash
# 1. Create AWS resources
./scripts/setup-aws-infrastructure.sh

# 2. Run database migrations
npx prisma migrate deploy

# 3. Build Docker image
docker build -t huntaze-api:latest .

# 4. Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 317805897534.dkr.ecr.us-east-1.amazonaws.com
docker tag huntaze-api:latest 317805897534.dkr.ecr.us-east-1.amazonaws.com/huntaze-api:latest
docker push 317805897534.dkr.ecr.us-east-1.amazonaws.com/huntaze-api:latest

# 5. Update ECS service
aws ecs update-service --cluster huntaze-cluster --service huntaze-api --force-new-deployment

# 6. Verify health
curl https://api.huntaze.com/api/health/hybrid-orchestrator
```

---

## 📊 MONITORING

### CloudWatch Logs
```bash
# View logs
aws logs tail /aws/ecs/huntaze-cluster --follow

# Search for errors
aws logs filter-log-events \
  --log-group-name /aws/ecs/huntaze-cluster \
  --filter-pattern "ERROR"
```

### Metrics
```bash
# Check costs
curl https://api.huntaze.com/api/v2/costs/stats

# Check queue depth
aws sqs get-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-hybrid-workflows \
  --attribute-names ApproximateNumberOfMessages
```

---

## 🐛 TROUBLESHOOTING

### Service not responding
```bash
# Check ECS tasks
aws ecs list-tasks --cluster huntaze-cluster

# Check task logs
aws logs tail /aws/ecs/huntaze-cluster --follow
```

### High costs
```bash
# Check cost breakdown
curl https://api.huntaze.com/api/v2/costs/breakdown?startDate=$(date -d '7 days ago' +%Y-%m-%d)&endDate=$(date +%Y-%m-%d)

# Check which provider is expensive
curl https://api.huntaze.com/api/v2/costs/stats | jq '.data.providerBreakdown'
```

### Rate limit issues
```bash
# Check Redis connection
redis-cli -h huntaze-redis-production.xxx.cache.amazonaws.com ping

# Check rate limit stats
curl https://api.huntaze.com/api/v2/onlyfans/stats
```

---

## 💰 COST OPTIMIZATION

### Current costs (~$64/month)
- AWS Infrastructure: ~$32/month
- AI (Azure + OpenAI): ~$32/month

### Quick wins
1. **Use GPT-3.5 for simple tasks** → Save 90% on those requests
2. **Cache frequent requests** → Reduce API calls
3. **Batch small requests** → Reduce overhead
4. **Monitor daily** → Catch spikes early

### Set alerts
```bash
# Daily threshold: $50
# Monthly threshold: $1000
# Configure in: lib/services/cost-monitoring-service.ts
```

---

## 📚 KEY FILES

```
lib/services/
├── production-hybrid-orchestrator-v2.ts  ← Main orchestrator
├── integration-middleware.ts             ← Feature flags
├── enhanced-rate-limiter.ts              ← OnlyFans limits
├── intelligent-queue-manager.ts          ← SQS queuing
└── cost-monitoring-service.ts            ← Cost tracking

app/api/v2/
├── campaigns/hybrid/route.ts             ← Main endpoint
├── campaigns/status/route.ts             ← Status check
├── costs/breakdown/route.ts              ← Cost details
└── costs/stats/route.ts                  ← Real-time stats

app/api/
├── health/hybrid-orchestrator/route.ts   ← Health check
└── admin/feature-flags/route.ts          ← Feature flags

scripts/
└── setup-aws-infrastructure.sh           ← AWS setup
```

---

## 🎯 NEXT STEPS

1. **Today:** Run `./scripts/setup-aws-infrastructure.sh`
2. **Today:** Configure env variables
3. **Tomorrow:** Deploy to ECS
4. **Week 1:** Monitor costs, adjust thresholds
5. **Month 1:** Add Phase 2 features if needed

---

## 📞 QUICK COMMANDS

```bash
# Deploy
npm run build && docker build -t huntaze-api . && docker push ... && aws ecs update-service ...

# Check health
curl https://api.huntaze.com/api/health/hybrid-orchestrator

# View logs
aws logs tail /aws/ecs/huntaze-cluster --follow

# Check costs
curl https://api.huntaze.com/api/v2/costs/stats

# Restart service
aws ecs update-service --cluster huntaze-cluster --service huntaze-api --force-new-deployment
```

---

## 🆘 EMERGENCY

### Service down
```bash
# Rollback to previous version
aws ecs update-service --cluster huntaze-cluster --service huntaze-api --task-definition huntaze-api:PREVIOUS_VERSION

# Check what's wrong
aws logs tail /aws/ecs/huntaze-cluster --follow | grep ERROR
```

### Costs exploding
```bash
# Disable hybrid orchestrator (use legacy)
# Set feature flag: HYBRID_ORCHESTRATOR_ENABLED=false

# Or reduce usage
# Set in cost-monitoring-service.ts: DAILY_THRESHOLD=10
```

### Rate limit violations
```bash
# Check OnlyFans status
curl https://api.huntaze.com/api/v2/onlyfans/stats

# Flush Redis cache
redis-cli -h huntaze-redis-production.xxx.cache.amazonaws.com FLUSHDB
```

---

**Account:** 317805897534  
**Region:** us-east-1  
**Environment:** Production  

**Docs:**
- Full Architecture: `HUNTAZE_COMPLETE_ARCHITECTURE.md`
- MVP Roadmap: `HUNTAZE_MVP_VS_FUTURE_ROADMAP.md`
