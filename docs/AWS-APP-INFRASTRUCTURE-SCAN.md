# Huntaze - Scan Complet de l'Application
**Date**: 2025-12-22  
**Compte AWS**: 317805897534  
**Objectif**: Déploiement A-Z sur AWS (Amplify + ECS)

---

## 📊 Vue d'Ensemble de l'Application

### Stack Technique
- **Framework**: Next.js 16 (App Router)
- **Runtime**: Node.js 20
- **Database**: PostgreSQL (Prisma ORM)
- **Cache**: Redis (ElastiCache)
- **AI**: Multi-provider (Gemini, Azure AI Foundry, OpenAI)
- **Storage**: AWS S3
- **Queue**: AWS SQS + BullMQ
- **Email**: AWS SES

### Architecture Actuelle
```
Frontend (Next.js SSR)
├── App Router (/app)
├── API Routes (/app/api)
└── Components (React 18)

Backend Services
├── AI Router (Python FastAPI) → ECS Fargate
├── Video Processor → ECS Fargate + SQS
├── Cron Jobs → EventBridge + Lambda
└── Workers → SQS + Lambda

Data Layer
├── PostgreSQL (RDS Multi-AZ)
├── Redis (ElastiCache Multi-AZ)
└── S3 (Assets + Backups)
```

---

## 🗂️ Structure de Navigation (Sidebar)

### Sections Principales

#### 1. **Home** (`/home`)
- Dashboard principal
- Métriques globales
- Quick actions

#### 2. **OnlyFans** (`/onlyfans`)
- **Messages** (`/onlyfans/messages`) - Interface 3 colonnes
  - Fan list (gauche)
  - Chat container (centre)
  - Context panel (droite)
  - Fan notes system
  - AI suggestions
- **Fans** (`/onlyfans/fans`) - Gestion des fans
  - Segmentation
  - LTV/Churn analysis
  - Fan profiles
- **PPV** (`/onlyfans/ppv`) - Pay-Per-View
  - Create PPV
  - PPV analytics
  - Price suggestions (AI)
- **Settings** (`/onlyfans/settings`)

#### 3. **Analytics** (`/analytics`)
- **Overview** (`/analytics`)
- **Revenue** (`/analytics/revenue`)
- **Content** (`/analytics/content`)
- **Fans** (`/analytics/fans`)
- **Platforms** (`/analytics/platforms`)
- **Funnel** (`/analytics/funnel`)
- **Forecast** (`/analytics/forecast`)
- **Churn** (`/analytics/churn`)
- **Pricing** (`/analytics/pricing`)

#### 4. **Content** (`/content`)
- **Studio** (`/content/factory`)
- **Editor** (`/content/editor`)
- **Templates** (`/content/templates`)
- **Calendar** (`/content/calendar`)
- **Trends** (`/content-trends`) - AI-powered

#### 5. **Marketing** (`/marketing`)
- **Calendar** (`/marketing/calendar`)
- **Campaigns** (`/marketing/campaigns`)
  - Create campaign
  - AI campaign generator
- **Social Marketing** (`/social-marketing`)

#### 6. **Automations** (`/automations`)
- **List** (`/automations`)
- **Create** (`/automations/new`)
- **Templates** (`/automations/templates`)
- **Analytics** (`/automations/analytics`)
- **AI Flow Generator**

#### 7. **Integrations** (`/integrations`)
- TikTok
- Instagram
- Reddit
- Twitter/X
- OnlyFans

#### 8. **Settings** (`/settings`)
- Account settings
- Billing
- API keys

---

## 🗄️ Base de Données (PostgreSQL)

### Tables Critiques

#### Authentification & Utilisateurs
```sql
users (id, email, name, password, email_verified, onboarding_completed, ai_plan, role)
nextauth_accounts (userId, provider, providerAccountId, access_token, refresh_token)
nextauth_sessions (sessionToken, userId, expires)
oauth_accounts (user_id, provider, provider_account_id, access_token, refresh_token)
```

#### OnlyFans Core
```sql
content (id, user_id, title, text, type, platform, status, scheduled_at, published_at)
subscriptions (id, user_id, fan_id, platform, tier, amount, status)
transactions (id, user_id, amount, currency, status, type, platform)
user_stats (user_id, messages_sent, response_rate, revenue, active_chats)
```

#### Marketing & Campaigns
```sql
marketing_campaigns (id, user_id, name, status, channel, goal, audience_segment, message)
```

#### AI & Analytics
```sql
ai_plan (id, source, account_id, created_at, raw)
ai_plan_item (id, plan_id, platform, scheduled_at, content, status)
ai_insights (id, creatorId, source, type, confidence, data)
insight_snapshot (id, platform, account_id, period_start, period_end, raw)
insight_summary (id, platform, account_id, period, summary)
```

#### Automations & Offers
```sql
automations (id, userId, name, description, steps, status)
automation_executions (id, automationId, triggerType, status, stepsExecuted)
offers (id, userId, name, discountType, discountValue, validFrom, validUntil, status)
offer_redemptions (id, offerId, fanId, amount, redeemedAt)
```

#### Content Publishing (TikTok/Instagram)
```sql
content_tasks (id, userId, platform, status, sourceType, sourceUrl, caption, scheduledAt)
social_accounts (id, userId, platform, platformUserId, accessToken, refreshToken)
```

#### Knowledge Base (RAG)
```sql
knowledge_base_items (id, creatorId, kind, source, niche, platform, inputText, outputText, embedding)
```

#### AI Assistant
```sql
assistant_conversations (id, userId, title, createdAt, updatedAt)
assistant_messages (id, conversationId, role, content, createdAt)
```

#### Analytics & Monitoring
```sql
usage_logs (id, creatorId, feature, agentId, model, tokensInput, tokensOutput, costUsd)
monthly_charges (id, creatorId, month, totalTokensInput, totalTokensOutput, totalCostUsd)
signup_analytics (sessionId, userId, email, landingPage, methodSelected, signupCompleted)
events_outbox (id, aggregate_type, aggregate_id, event_type, payload, sent_at)
```

**Total**: 30+ tables

---

## 🔌 Dépendances Critiques

### Services AWS Requis

#### Compute
- ✅ **Amplify Compute** (Next.js SSR) - Frontend
- ✅ **ECS Fargate** (AI Router) - Backend Python
- ✅ **ECS Fargate** (Video Processor) - Workers
- ⚠️ **Lambda** (Cron jobs) - EventBridge triggers
- ⚠️ **Lambda@Edge** (CloudFront) - Security headers

#### Data & Storage
- ✅ **RDS PostgreSQL** (Multi-AZ, encrypted)
- ✅ **ElastiCache Redis** (Multi-AZ, encrypted)
- ✅ **S3** (Assets, backups, logs)
- ⚠️ **DynamoDB** (Optional - rate limiting)

#### Networking
- ✅ **VPC** (Private subnets + NAT Gateway)
- ✅ **ALB** (Application Load Balancer)
- ✅ **CloudFront** (CDN)
- ✅ **Route53** (DNS)
- ✅ **ACM** (SSL/TLS certificates)

#### Messaging & Events
- ✅ **SQS** (Video processing queue)
- ✅ **EventBridge** (Cron triggers)
- ✅ **SES** (Email notifications)
- ⚠️ **SNS** (Alerting)

#### Security & Secrets
- ✅ **Secrets Manager** (API keys, credentials)
- ✅ **IAM** (Roles, policies)
- ✅ **KMS** (Encryption keys)
- ⚠️ **WAF** (CloudFront protection)

#### Monitoring
- ✅ **CloudWatch Logs** (Application logs)
- ✅ **CloudWatch Alarms** (Metrics)
- ⚠️ **X-Ray** (Tracing)
- ⚠️ **CloudWatch Insights** (Log analytics)

### Services Externes

#### AI Providers
- **Google Gemini** (Primary AI)
  - `GEMINI_API_KEY`
  - Model: `gemini-2.0-flash-exp`
- **Azure AI Foundry** (Multi-model)
  - DeepSeek-R1 (reasoning)
  - DeepSeek-V3 (generation)
  - Phi-4 Multimodal (vision)
  - Azure Speech (transcription)
- **OpenAI** (Fallback)
  - `OPENAI_API_KEY`

#### Social Media APIs
- **TikTok**
  - `TIKTOK_CLIENT_KEY`
  - `TIKTOK_CLIENT_SECRET`
- **Instagram/Facebook**
  - `FACEBOOK_APP_ID`
  - `FACEBOOK_APP_SECRET`
  - `INSTAGRAM_CLIENT_ID`
- **Reddit**
  - `REDDIT_CLIENT_ID`
  - `REDDIT_CLIENT_SECRET`
- **Twitter/X**
  - `TWITTER_BEARER_TOKEN`

#### Content Scraping
- **Apify** (Social media scraping)
  - `APIFY_API_TOKEN`
  - Actors: TikTok, Instagram, Reddit scrapers

#### Proxies
- **Bright Data** (OnlyFans automation)
  - `BRIGHT_DATA_CUSTOMER`
  - `BRIGHT_DATA_PASSWORD`

---

## 🔐 Variables d'Environnement Critiques

### Catégorie 1: Base de Données & Cache (CRITIQUE)
```bash
DATABASE_URL="postgresql://user:pass@rds-endpoint:5432/huntaze"
REDIS_URL="redis://elasticache-endpoint:6379"
REDIS_HOST="elasticache-endpoint.cache.amazonaws.com"
REDIS_PORT="6379"
```

### Catégorie 2: Authentification (CRITIQUE)
```bash
NEXTAUTH_URL="https://app.huntaze.com"
NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"
JWT_SECRET="<jwt-secret>"
TOKEN_ENCRYPTION_KEY="<32-char-key>"
ENCRYPTION_KEY="<32-char-key>"
```

### Catégorie 3: AWS Services (CRITIQUE)
```bash
AWS_REGION="us-east-2"
AWS_S3_BUCKET="huntaze-production-assets"
AWS_SQS_QUEUE_URL="https://sqs.us-east-2.amazonaws.com/317805897534/huntaze-video-queue"
CDN_URL="https://d1234567890.cloudfront.net"
```

### Catégorie 4: AI Services (HAUTE PRIORITÉ)
```bash
# Google Gemini
GEMINI_API_KEY="<gemini-key>"
GEMINI_MODEL="gemini-2.0-flash-exp"

# Azure AI Foundry
AZURE_AI_CHAT_ENDPOINT="https://endpoint.eastus2.inference.ai.azure.com"
AZURE_AI_CHAT_KEY="<azure-key>"
AZURE_DEEPSEEK_R1_ENDPOINT="<deepseek-endpoint>"
AZURE_PHI4_MULTIMODAL_ENDPOINT="<phi4-endpoint>"
AZURE_SPEECH_KEY="<speech-key>"

# AI Router
AI_ROUTER_URL="http://ai-router.internal:8000"
```

### Catégorie 5: Social Media (MOYENNE PRIORITÉ)
```bash
# TikTok
TIKTOK_CLIENT_KEY="<tiktok-key>"
TIKTOK_CLIENT_SECRET="<tiktok-secret>"
TIKTOK_REDIRECT_URI="https://app.huntaze.com/auth/tiktok/callback"

# Instagram
INSTAGRAM_CLIENT_ID="<instagram-id>"
INSTAGRAM_CLIENT_SECRET="<instagram-secret>"
INSTAGRAM_REDIRECT_URI="https://app.huntaze.com/auth/instagram/callback"

# Reddit
REDDIT_CLIENT_ID="<reddit-id>"
REDDIT_CLIENT_SECRET="<reddit-secret>"
```

### Catégorie 6: Monitoring & Alerting (MOYENNE PRIORITÉ)
```bash
CLOUDWATCH_LOG_GROUP="/aws/huntaze/production"
CLOUDWATCH_NAMESPACE="Huntaze/Production"
ALERT_EMAIL="alerts@huntaze.com"
SLACK_WEBHOOK_URL="<slack-webhook>"
```

### Catégorie 7: Feature Flags (BASSE PRIORITÉ)
```bash
NODE_ENV="production"
ENABLE_RATE_LIMITING="true"
ENABLE_CACHING="true"
API_MODE="real"
```

**Total**: 50+ variables d'environnement

---

## 📦 Dépendances NPM Critiques

### Production Dependencies (Top 20)
```json
{
  "next": "^16.0.3",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "@prisma/client": "^6.19.0",
  "ioredis": "^5.8.2",
  "@google/generative-ai": "^0.21.0",
  "@azure/openai": "^2.0.0",
  "openai": "^4.77.3",
  "@aws-sdk/client-s3": "^3.931.0",
  "@aws-sdk/client-sqs": "^3.931.0",
  "@aws-sdk/client-ses": "^3.931.0",
  "@aws-sdk/client-cloudwatch": "^3.934.0",
  "bullmq": "^5.66.2",
  "next-auth": "^5.0.0-beta.30",
  "zod": "^4.1.12",
  "framer-motion": "^12.23.24",
  "@shopify/polaris": "^13.9.5",
  "recharts": "^3.4.1",
  "sharp": "^0.34.5",
  "stripe": "^19.3.1"
}
```

### Build Size
- **node_modules**: ~1.2GB
- **Build output (.next)**: ~150MB
- **Docker image**: ~800MB (estimated)

---

## 🚀 Services Backend à Déployer

### 1. AI Router (Python FastAPI)
**Localisation**: `lib/ai/router/`
**Déploiement**: ECS Fargate (us-east-2)
**Port**: 8000
**Health Check**: `GET /health`

**Fichiers**:
- `main.py` - FastAPI app
- `routing.py` - Model routing logic
- `classifier.py` - Request classification
- `Dockerfile` - Container image
- `requirements.txt` - Python deps

**Infrastructure**:
- `infra/aws/ecs-router-service.tf` - Terraform config
- `infra/aws/ecr-router-setup.sh` - ECR setup

**Ressources**:
- CPU: 512 (0.5 vCPU)
- Memory: 1024 MB
- Auto-scaling: 2-10 tasks
- ALB: HTTP/HTTPS

### 2. Video Processor (Node.js Worker)
**Localisation**: `lib/ai/content-trends/`
**Déploiement**: ECS Fargate + SQS
**Queue**: `huntaze-video-processing-queue`

**Fichiers**:
- `video-processor.ts` - Main worker
- `queue/workers/video-processing-worker.ts` - Queue consumer
- `llama-vision-service.ts` - Vision analysis
- `phi4-multimodal-service.ts` - Multimodal analysis
- `audio-transcription-service.ts` - Speech-to-text

**Infrastructure**:
- `infra/aws/video-processor/cloudformation.yaml`
- `infra/aws/video-processor/ecs-only.yaml`
- `infra/aws/video-processor/s3-sqs.yaml`

**Ressources**:
- CPU: 1024 (1 vCPU)
- Memory: 2048 MB
- SQS: Standard queue + DLQ
- S3: Video storage bucket

### 3. Cron Jobs (EventBridge + Lambda)
**Localisation**: `app/api/cron/`
**Déploiement**: EventBridge → HTTP API

**Jobs**:
- `POST /api/cron/offers/expire` - Expire offers (daily)
- `POST /api/cron/offers/activate` - Activate scheduled offers (hourly)
- `POST /api/cron/monthly-billing` - Monthly billing (monthly)
- `POST /api/analytics/ai/summary/run` - AI insights (daily)
- `POST /api/admin/outbox/dispatch` - Event dispatcher (every 5min)

**Infrastructure**:
- `infra/aws/eventbridge-offers-cron.tf` - Terraform config
- `scripts/deploy-offers-cron.sh` - Deployment script

### 4. Lambda@Edge (CloudFront)
**Localisation**: `lambda/edge/`
**Déploiement**: CloudFront distribution

**Functions**:
- Security headers
- Image optimization
- Request routing

**Infrastructure**:
- `scripts/deploy-lambda-edge.ts`
- `scripts/setup-lambda-edge-alarms.ts`

---

## 🔄 Flux de Données Critiques

### 1. OnlyFans Messages (Real-time)
```
User → Next.js API → Redis (cache) → PostgreSQL
                  ↓
              AI Router → Azure AI Foundry
                  ↓
              Suggestions → WebSocket → User
```

### 2. Content Publishing (Async)
```
User → Upload → S3
            ↓
        SQS Queue → Video Processor (ECS)
                        ↓
                    Azure Vision API
                        ↓
                    Analysis → PostgreSQL
                        ↓
                    TikTok/Instagram API
```

### 3. Analytics Pipeline (Batch)
```
EventBridge (cron) → Lambda → API Route
                                ↓
                            PostgreSQL (aggregate)
                                ↓
                            Redis (cache)
                                ↓
                            Dashboard
```

---

## 📊 Métriques de Performance

### Objectifs (SLA)
- **Uptime**: 99.9% (43 min downtime/mois)
- **Response Time (p95)**: < 500ms
- **Response Time (p99)**: < 1000ms
- **Database Queries**: < 100ms (p95)
- **Redis Cache Hit Rate**: > 80%
- **AI Router Latency**: < 2000ms (p95)

### Monitoring Requis
- CloudWatch Alarms:
  - ECS CPU > 70%
  - ECS Memory > 80%
  - ALB 5xx > 1%
  - RDS Connections > 80%
  - Redis Memory > 90%
  - SQS Queue Age > 5min
- CloudWatch Logs:
  - Application logs (JSON structured)
  - Error logs (with stack traces)
  - Access logs (ALB)
- CloudWatch Insights:
  - Error rate trends
  - Slow query detection
  - User behavior analytics

---

## 🔒 Sécurité & Compliance

### Secrets à Créer (AWS Secrets Manager)
```bash
huntaze/production/database-url
huntaze/production/redis-url
huntaze/production/nextauth-secret
huntaze/production/gemini-api-key
huntaze/production/azure-ai-key
huntaze/production/tiktok-credentials
huntaze/production/instagram-credentials
huntaze/production/stripe-secret-key
huntaze/production/encryption-key
```

### IAM Roles Requis
- `HuntazeAmplifyServiceRole` - Amplify deployment
- `HuntazeECSTaskExecutionRole` - ECS task execution
- `HuntazeECSTaskRole` - ECS task runtime (S3, SQS, Secrets)
- `HuntazeLambdaExecutionRole` - Lambda functions
- `HuntazeEventBridgeRole` - EventBridge → API Gateway

### Security Groups
- `huntaze-alb-sg` - ALB (80, 443 from 0.0.0.0/0)
- `huntaze-ecs-sg` - ECS tasks (8000 from ALB)
- `huntaze-rds-sg` - RDS (5432 from ECS, Amplify)
- `huntaze-redis-sg` - Redis (6379 from ECS, Amplify)

---

## 📝 Checklist de Déploiement

### Phase 1: Infrastructure de Base (30 min)
- [ ] VPC + Subnets (public + private)
- [ ] NAT Gateway (pour subnets privés)
- [ ] Security Groups
- [ ] RDS PostgreSQL (Multi-AZ, encrypted)
- [ ] ElastiCache Redis (Multi-AZ, encrypted)
- [ ] S3 Buckets (assets, backups, logs)
- [ ] Secrets Manager (tous les secrets)

### Phase 2: Frontend Amplify (20 min)
- [ ] Créer Amplify App
- [ ] Connecter repo GitHub
- [ ] Configurer build settings (`amplify.yml`)
- [ ] Ajouter variables d'environnement
- [ ] Configurer VPC access (Redis/RDS)
- [ ] Déployer branche `main`
- [ ] Vérifier health checks

### Phase 3: Backend Services (30 min)
- [ ] ECR Repository (AI Router)
- [ ] Build & Push Docker image
- [ ] ECS Cluster + Task Definition
- [ ] ECS Service + ALB
- [ ] Auto-scaling policies
- [ ] CloudWatch Logs
- [ ] Health checks

### Phase 4: Async Workers (20 min)
- [ ] SQS Queue + DLQ
- [ ] ECS Task Definition (Video Processor)
- [ ] ECS Service (worker mode)
- [ ] CloudWatch Alarms (queue age)

### Phase 5: Cron Jobs (15 min)
- [ ] EventBridge Rules
- [ ] API Gateway (HTTP API)
- [ ] IAM Roles
- [ ] CloudWatch Alarms (DLQ)

### Phase 6: CDN & Edge (15 min)
- [ ] CloudFront Distribution
- [ ] ACM Certificate (SSL/TLS)
- [ ] Lambda@Edge Functions
- [ ] Route53 DNS

### Phase 7: Monitoring & Alerting (15 min)
- [ ] CloudWatch Dashboards
- [ ] CloudWatch Alarms (all services)
- [ ] SNS Topics (alerting)
- [ ] Slack/Email notifications

### Phase 8: Database Migration (10 min)
- [ ] Run Prisma migrations
- [ ] Seed initial data
- [ ] Verify tables

### Phase 9: Smoke Tests (10 min)
- [ ] Health checks (all services)
- [ ] Login flow
- [ ] OnlyFans messages
- [ ] Content upload
- [ ] AI suggestions
- [ ] Analytics dashboard

**Temps total estimé**: ~2h30

---

## 💰 Estimation des Coûts (Mensuel)

### Compute
- Amplify Compute (2GB RAM, 1 vCPU): $15-30
- ECS Fargate (AI Router, 2 tasks): $30-40
- ECS Fargate (Video Processor, 1 task): $15-20
- Lambda (Cron jobs): $5-10
- **Subtotal**: $65-100/mois

### Data & Storage
- RDS PostgreSQL (db.t3.medium, Multi-AZ): $80-120
- ElastiCache Redis (cache.t3.medium, Multi-AZ): $60-80
- S3 (100GB storage + requests): $10-15
- **Subtotal**: $150-215/mois

### Networking
- ALB (2 instances): $32
- NAT Gateway (2 AZs): $64
- CloudFront (100GB transfer): $10-15
- Route53 (hosted zone): $0.50
- **Subtotal**: $106-111/mois

### Monitoring & Logs
- CloudWatch Logs (10GB): $5
- CloudWatch Alarms (20 alarms): $2
- CloudWatch Insights: $5
- **Subtotal**: $12/mois

### AI Services (External)
- Google Gemini: $20-50/mois
- Azure AI Foundry: $30-80/mois
- **Subtotal**: $50-130/mois

### **TOTAL ESTIMÉ**: $383-568/mois

**Optimisations possibles**:
- Utiliser RDS Aurora Serverless v2 (scaling automatique)
- Utiliser Spot Instances pour ECS (50% moins cher)
- Activer S3 Intelligent-Tiering
- Utiliser CloudFront caching agressif

---

## 🎯 Prochaines Étapes

1. **Valider l'architecture** avec toi
2. **Créer les scripts Terraform/CloudFormation**
3. **Préparer les variables d'environnement**
4. **Déployer l'infrastructure de base**
5. **Déployer le frontend (Amplify)**
6. **Déployer les services backend (ECS)**
7. **Configurer le monitoring**
8. **Tests de smoke**
9. **Go-live** 🚀

---

**Rapport généré le**: 2025-12-22  
**Par**: Kiro AI Assistant  
**Statut**: ✅ SCAN COMPLET
