# 🏗️ Huntaze - Architecture Complète & Infrastructure AWS

## 📊 VUE D'ENSEMBLE

Huntaze est une plateforme OnlyFans management avec AI hybride (Azure + OpenAI) pour la génération de contenu et messaging automatisé.

---

## 🎯 STACK TECHNIQUE

### Frontend / API
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Auth:** NextAuth.js
- **Styling:** Tailwind CSS

### Backend Services
- **Runtime:** Node.js
- **ORM:** Prisma
- **Database:** PostgreSQL (AWS RDS)
- **Cache:** Redis (ElastiCache)
- **Queue:** AWS SQS
- **Storage:** AWS S3

### AI Providers
- **Azure OpenAI:** GPT-4 Turbo (content planning, multi-platform)
- **OpenAI:** GPT-3.5 Turbo (message generation, quick responses)

---

## 🏢 INFRASTRUCTURE AWS (Account: 317805897534)

### ✅ RDS PostgreSQL
```
Instance: huntaze-postgres-production
Class: db.t3.micro
Engine: PostgreSQL 17
Status: ✅ Available
Endpoint: [auto-configured]
```

**Tables Prisma:**
- `users` - Utilisateurs et auth
- `campaigns` - Campagnes marketing
- `messages` - Messages OnlyFans
- `content` - Contenu généré
- `workflows` - États des workflows AI

---

### ✅ DynamoDB Tables

**Tables existantes:**
```
huntaze-users                  → User profiles & settings
huntaze-posts                  → Generated content posts
huntaze-oauth-tokens           → OAuth credentials
huntaze-of-sessions            → OnlyFans sessions
huntaze-of-threads             → OnlyFans conversations
huntaze-of-messages            → OnlyFans messages
huntaze-of-aggregates          → Analytics aggregates
huntaze-analytics-events       → Event tracking
huntaze-stripe-events          → Payment events
huntaze-pubkeys                → Encryption keys
```

**Tables à créer (Cost Monitoring):**
```
huntaze-ai-costs-production    → Cost tracking entries
huntaze-cost-alerts-production → Cost alerts history
```

---

### ✅ SQS Queues

**Queues existantes:**
```
huntaze-enrichment-production  → Content enrichment jobs
huntaze-notifications-production → User notifications
huntaze-analytics              → Analytics events
huntaze-email                  → Email sending
huntaze-webhooks               → Webhook processing
huntaze-ai-processing-dlq      → AI job dead letter queue
```

**Queues à créer (Hybrid Orchestrator):**
```
huntaze-hybrid-workflows       → Workflow orchestration
huntaze-rate-limiter-queue     → Rate-limited requests
```

---

### ✅ ECS Fargate Clusters

**Clusters existants:**
```
huntaze-cluster                → Main application cluster
huntaze-of-fargate             → OnlyFans gateway services
ai-team                        → AI processing workers
```

**Services déployés:**
- Next.js API (huntaze-cluster)
- OnlyFans Gateway (huntaze-of-fargate)
- AI Workers (ai-team)

---

### ⚠️ Services à vérifier/créer

**CloudWatch:**
- Logs groups: `/aws/ecs/huntaze-*`
- Metrics namespace: `Huntaze/AI/Costs`
- Alarms: Cost thresholds

**SNS Topics:**
- `huntaze-cost-alerts` → Cost alert notifications

**SES (Email):**
- Verified domain: huntaze.com
- From address: alerts@huntaze.com

**ElastiCache Redis:**
- Cluster: huntaze-redis-production
- Node type: cache.t3.micro
- Purpose: Rate limiting, caching

---

## 🔄 ARCHITECTURE DES FLUX

### 1️⃣ User Request Flow

```
User (Web/Mobile)
    ↓
Next.js API (/api/v2/campaigns/hybrid)
    ↓
IntegrationMiddleware (Feature Flags)
    ↓
ProductionHybridOrchestrator
    ↓
┌─────────────┬─────────────┐
│ Azure       │ OpenAI      │
│ GPT-4 Turbo │ GPT-3.5     │
└─────────────┴─────────────┘
    ↓
CostMonitoringService (Track $$$)
    ↓
DynamoDB (huntaze-ai-costs-production)
    ↓
CloudWatch Metrics
```

---

### 2️⃣ OnlyFans Message Flow

```
Campaign Request
    ↓
EnhancedRateLimiter (10 msg/min check)
    ↓
Redis (rate limit state)
    ↓
IntelligentQueueManager
    ↓
SQS (huntaze-rate-limiter-queue)
    ↓
OnlyFansGateway
    ↓
OnlyFans API
```

---

### 3️⃣ Cost Monitoring Flow

```
AI Request (Azure/OpenAI)
    ↓
ProductionHybridOrchestrator
    ↓
CostMonitoringService.trackUsage()
    ↓
┌──────────────┬──────────────┬──────────────┐
│ DynamoDB     │ CloudWatch   │ Check        │
│ Store cost   │ Send metrics │ Thresholds   │
└──────────────┴──────────────┴──────────────┘
    ↓ (if threshold exceeded)
Email/Slack Alert
```

---

## 📁 STRUCTURE DU CODE

### Services Core (lib/services/)

```
production-hybrid-orchestrator-v2.ts  ✅ Orchestration Azure/OpenAI
├─ Distributed tracing (X-Ray)
├─ Circuit breaker pattern
├─ Fallback matrix
└─ RDS persistence

integration-middleware.ts              ✅ Feature flags & routing
├─ shouldUseHybridOrchestrator()
├─ Feature flag management
└─ Backward compatibility

enhanced-rate-limiter.ts               ✅ OnlyFans compliance
├─ 10 messages/minute limit
├─ Redis-backed state
└─ Recipient-based limiting

intelligent-queue-manager.ts           ✅ SQS queue management
├─ Priority queuing
├─ Exponential backoff
└─ Dead letter queue handling

cost-monitoring-service.ts             ✅ Cost tracking
├─ Real-time tracking
├─ DynamoDB storage
├─ CloudWatch metrics
└─ Alert generation
```

---

### API Endpoints (app/api/)

**MVP Endpoints (À garder):**
```
POST   /api/v2/campaigns/hybrid        → Main orchestration endpoint
GET    /api/v2/campaigns/status        → Workflow status
GET    /api/v2/costs/breakdown         → Cost breakdown
GET    /api/v2/costs/stats             → Real-time stats
GET    /api/health/hybrid-orchestrator → Health check
```

**Phase 2 Endpoints (Optionnels):**
```
GET    /api/v2/costs/alerts            → Alert management
GET    /api/v2/costs/forecast          → ML forecasting
POST   /api/v2/costs/optimize          → Auto-optimization
GET    /api/admin/feature-flags        → Feature flag admin
```

---

## 🔐 VARIABLES D'ENVIRONNEMENT REQUISES

### Database
```bash
DATABASE_URL="postgresql://huntazeadmin:***@huntaze-postgres-production.***:5432/huntaze"
REDIS_URL="redis://huntaze-redis-production.***:6379"
```

### AWS
```bash
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="***"
AWS_SECRET_ACCESS_KEY="***"

# DynamoDB Tables
DYNAMODB_COSTS_TABLE="huntaze-ai-costs-production"
DYNAMODB_ALERTS_TABLE="huntaze-cost-alerts-production"

# SQS Queues
SQS_WORKFLOW_QUEUE="huntaze-hybrid-workflows"
SQS_RATE_LIMITER_QUEUE="huntaze-rate-limiter-queue"

# SNS Topics
COST_ALERTS_SNS_TOPIC="arn:aws:sns:us-east-1:317805897534:huntaze-cost-alerts"
```

### AI Providers
```bash
# Azure OpenAI
AZURE_OPENAI_API_KEY="***"
AZURE_OPENAI_ENDPOINT="https://huntaze-openai.openai.azure.com/"
AZURE_OPENAI_DEPLOYMENT="gpt-4-turbo"

# OpenAI
OPENAI_API_KEY="***"
OPENAI_ORG_ID="***"
```

### Alerting
```bash
# Email (SES)
SES_FROM_EMAIL="alerts@huntaze.com"
COST_ALERT_EMAIL="admin@huntaze.com"

# Slack
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/***"
```

### OnlyFans
```bash
ONLYFANS_API_URL="https://onlyfans.com/api2/v2"
ONLYFANS_USER_AGENT="***"
```

---

## 🚀 DÉPLOIEMENT

### 1. Créer les tables DynamoDB manquantes

```bash
# Cost tracking table
aws dynamodb create-table \
  --table-name huntaze-ai-costs-production \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=timestamp,AttributeType=S \
  --key-schema \
    AttributeName=id,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

# Cost alerts table
aws dynamodb create-table \
  --table-name huntaze-cost-alerts-production \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
  --key-schema \
    AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### 2. Créer les SQS queues

```bash
# Workflow queue
aws sqs create-queue \
  --queue-name huntaze-hybrid-workflows \
  --region us-east-1

# Rate limiter queue
aws sqs create-queue \
  --queue-name huntaze-rate-limiter-queue \
  --region us-east-1
```

### 3. Créer le SNS topic

```bash
aws sns create-topic \
  --name huntaze-cost-alerts \
  --region us-east-1

# Subscribe email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:317805897534:huntaze-cost-alerts \
  --protocol email \
  --notification-endpoint admin@huntaze.com
```

### 4. Déployer sur ECS Fargate

```bash
# Build Docker image
docker build -t huntaze-api:latest .

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 317805897534.dkr.ecr.us-east-1.amazonaws.com
docker tag huntaze-api:latest 317805897534.dkr.ecr.us-east-1.amazonaws.com/huntaze-api:latest
docker push 317805897534.dkr.ecr.us-east-1.amazonaws.com/huntaze-api:latest

# Update ECS service
aws ecs update-service \
  --cluster huntaze-cluster \
  --service huntaze-api \
  --force-new-deployment \
  --region us-east-1
```

---

## 📊 MONITORING

### CloudWatch Dashboards

**Metrics à surveiller:**
- `Huntaze/AI/Costs/AIProviderCost` - Coûts par provider
- `Huntaze/AI/Costs/AITokenUsage` - Usage tokens
- `Huntaze/AI/Costs/AIRequestDuration` - Latence
- `AWS/ECS/CPUUtilization` - CPU usage
- `AWS/ECS/MemoryUtilization` - Memory usage

### Alarms recommandés

```bash
# Daily cost > $50
aws cloudwatch put-metric-alarm \
  --alarm-name huntaze-daily-cost-high \
  --metric-name AIProviderCost \
  --namespace Huntaze/AI/Costs \
  --statistic Sum \
  --period 86400 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold

# Error rate > 5%
aws cloudwatch put-metric-alarm \
  --alarm-name huntaze-error-rate-high \
  --metric-name Errors \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 0.05 \
  --comparison-operator GreaterThanThreshold
```

---

## 🔍 TROUBLESHOOTING

### Check service health
```bash
curl https://api.huntaze.com/api/health/hybrid-orchestrator
```

### Check costs
```bash
curl https://api.huntaze.com/api/v2/costs/stats
```

### View logs
```bash
aws logs tail /aws/ecs/huntaze-cluster --follow
```

### Check queue depth
```bash
aws sqs get-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-hybrid-workflows \
  --attribute-names ApproximateNumberOfMessages
```

---

## 💰 COÛTS ESTIMÉS (Monthly)

| Service | Usage | Cost |
|---------|-------|------|
| RDS (db.t3.micro) | 24/7 | ~$15 |
| ECS Fargate (0.25 vCPU) | 24/7 | ~$10 |
| DynamoDB (On-Demand) | 1M reads/writes | ~$1.25 |
| SQS | 1M requests | ~$0.40 |
| CloudWatch | Logs + Metrics | ~$5 |
| **AWS Total** | | **~$32/month** |
| | | |
| Azure OpenAI (GPT-4) | 1M tokens | ~$30 |
| OpenAI (GPT-3.5) | 1M tokens | ~$2 |
| **AI Total** | | **~$32/month** |
| | | |
| **TOTAL** | | **~$64/month** |

---

## ✅ CHECKLIST DÉPLOIEMENT

- [ ] Tables DynamoDB créées
- [ ] SQS queues créées
- [ ] SNS topic créé + email subscribed
- [ ] Variables d'environnement configurées
- [ ] Docker image buildée et pushée
- [ ] ECS service updated
- [ ] Health check OK
- [ ] CloudWatch alarms configurées
- [ ] Test end-to-end passé
- [ ] Monitoring dashboard créé

---

## 📞 SUPPORT

**AWS Account:** 317805897534  
**Region:** us-east-1  
**Environment:** Production  

**Contacts:**
- DevOps: [email]
- AWS Support: Premium tier
