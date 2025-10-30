# 🚀 Guide Complet de Déploiement Huntaze

## 📋 Table des Matières

1. [Architecture Globale](#architecture-globale)
2. [Configuration Environnement](#configuration-environnement)
3. [Services Azure](#services-azure)
4. [Infrastructure AWS](#infrastructure-aws)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Base de Données](#base-de-données)
7. [Services Externes](#services-externes)
8. [Déploiement Production](#déploiement-production)

---

## 🏗️ Architecture Globale

### Stack Technique

```
Frontend:  Next.js 14 + React 18 + TypeScript
Backend:   Next.js API Routes + Serverless
Database:  PostgreSQL (Supabase/AWS RDS)
AI:        Azure OpenAI (GPT-4o + GPT-4o-mini)
Payment:   Stripe
CI/CD:     AWS CodeBuild + GitHub Actions
Hosting:   Vercel / AWS Amplify
Storage:   AWS S3
CDN:       CloudFront
```

### Diagramme d'Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Users / Clients                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              CloudFront CDN (Global)                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         Next.js App (Vercel/AWS Amplify)                │
│  • SSR/SSG Pages                                         │
│  • API Routes                                            │
│  • Edge Functions                                        │
└──────┬──────────────────────────────────────────────────┘
       │
       ├──────────────────────────────────────────────────┐
       │                                                   │
       ▼                                                   ▼
┌──────────────────┐                          ┌──────────────────┐
│  Azure OpenAI    │                          │   PostgreSQL     │
│  • GPT-4o        │                          │   (Supabase)     │
│  • GPT-4o-mini   │                          │   • Users        │
│  • Routing       │                          │   • Content      │
└──────────────────┘                          │   • Analytics    │
       │                                       └──────────────────┘
       │                                                   │
       ▼                                                   ▼
┌──────────────────┐                          ┌──────────────────┐
│     Stripe       │                          │      AWS S3      │
│  • Payments      │                          │  • Media Files   │
│  • Subscriptions │                          │  • Backups       │
└──────────────────┘                          └──────────────────┘
```

---

## ⚙️ Configuration Environnement

### 1. Variables d'Environnement (.env)

#### Production (.env.production)
```bash
# ============================================
# APPLICATION
# ============================================
NODE_ENV=production
NEXT_PUBLIC_URL=https://huntaze.com
NEXT_PUBLIC_API_URL=https://api.huntaze.com

# ============================================
# AZURE OPENAI (AI Services)
# ============================================
AZURE_OPENAI_API_KEY=<your-azure-openai-key>
AZURE_OPENAI_ENDPOINT=https://huntaze-ai-eus2-29796.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-05-01-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4o

# AI Configuration
DEFAULT_AI_MODEL=gpt-4o
DEFAULT_AI_PROVIDER=azure
ENABLE_AI_ROUTING=true
ENABLE_PROMPT_CACHING=true

# ============================================
# AZURE AI TEAM (Multi-Agents)
# ============================================
AZURE_SUBSCRIPTION_ID=<your-subscription-id>
AZURE_RESOURCE_GROUP=huntaze-ai-rg
AZURE_PROJECT_NAME=huntaze-agents
AZURE_AI_PROJECT_ENDPOINT=https://eastus.api.azureml.ms

ENABLE_AZURE_AI_TEAM=1
ENABLE_AZURE_AI=1
USE_AZURE_RESPONSES=1
LLM_PROVIDER=azure

# ============================================
# DATABASE (PostgreSQL)
# ============================================
DATABASE_URL=postgresql://user:password@host:5432/huntaze_prod
DATABASE_POOL_SIZE=20
DATABASE_SSL=true

# ============================================
# STRIPE (Payments)
# ============================================
STRIPE_SECRET_KEY=sk_live_<your-stripe-key>
STRIPE_PUBLISHABLE_KEY=pk_live_<your-publishable-key>
STRIPE_WEBHOOK_SECRET=whsec_<your-webhook-secret>

# Price IDs
STRIPE_PRO_MONTHLY_PRICE_ID=price_<id>
STRIPE_PRO_YEARLY_PRICE_ID=price_<id>
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_<id>
STRIPE_ENTERPRISE_YEARLY_PRICE_ID=price_<id>

# ============================================
# AWS (Storage & Services)
# ============================================
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
AWS_S3_BUCKET=huntaze-media-prod
AWS_CLOUDFRONT_DOMAIN=d123456.cloudfront.net

# ============================================
# AUTHENTICATION
# ============================================
NEXTAUTH_URL=https://huntaze.com
NEXTAUTH_SECRET=<your-nextauth-secret>
JWT_SECRET=<your-jwt-secret>

# ============================================
# MONITORING & ANALYTICS
# ============================================
SENTRY_DSN=<your-sentry-dsn>
GOOGLE_ANALYTICS_ID=G-<your-ga-id>
DATADOG_API_KEY=<your-datadog-key>

# ============================================
# FEATURE FLAGS
# ============================================
ENABLE_AI_CONTENT_GENERATION=true
ENABLE_MULTI_AGENTS=true
ENABLE_ANALYTICS_DASHBOARD=true
ENABLE_BETA_FEATURES=false
```

#### Staging (.env.staging)
```bash
NODE_ENV=staging
NEXT_PUBLIC_URL=https://staging.huntaze.com
# ... mêmes variables avec valeurs staging
```

#### Development (.env.local)
```bash
NODE_ENV=development
NEXT_PUBLIC_URL=http://localhost:3000
# ... mêmes variables avec valeurs dev/test
```

### 2. Configuration par Environnement

#### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  
  // Image optimization
  images: {
    domains: [
      'huntaze-media-prod.s3.amazonaws.com',
      'd123456.cloudfront.net',
    ],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Headers de sécurité
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ]
  },
  
  // Redirections
  async redirects() {
    return [
      {
        source: '/old-path',
        destination: '/new-path',
        permanent: true,
      },
    ]
  },
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig
```

---

## ☁️ Services Azure

### 1. Azure OpenAI

#### Configuration
```yaml
Resource Group: huntaze-ai-rg
Location: East US 2
Resource Name: huntaze-ai-eus2-29796
Endpoint: https://huntaze-ai-eus2-29796.openai.azure.com
```

#### Déploiements
```yaml
Deployments:
  - Name: gpt-4o
    Model: gpt-4o
    Version: 2024-08-06
    Capacity: 100K TPM
    
  - Name: gpt-4o-mini
    Model: gpt-4o-mini
    Version: 2024-07-18
    Capacity: 500K TPM
```

#### Accès
```bash
# Lister les déploiements
az cognitiveservices account deployment list \
  --name huntaze-ai-eus2-29796 \
  --resource-group huntaze-ai-rg

# Tester la connexion
curl https://huntaze-ai-eus2-29796.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2024-05-01-preview \
  -H "Content-Type: application/json" \
  -H "api-key: $AZURE_OPENAI_API_KEY" \
  -d '{
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 100
  }'
```

### 2. Azure AI Team (Multi-Agents)

#### Configuration
```yaml
Subscription: 50dd5632-01dc-4188-b338-0da5ddd8494b
Resource Group: huntaze-ai-rg
Project: huntaze-agents
Endpoint: https://eastus.api.azureml.ms
```

#### Agents Configurés
- Content Creator Agent
- Analytics Agent
- Moderation Agent
- Strategy Agent

---

## 🔧 Infrastructure AWS

### 1. AWS CodeBuild (CI/CD)

#### Configuration Projet
```yaml
Project Name: huntaze-simple-services
Source: GitHub / CodeCommit
Environment:
  Type: Linux
  Image: aws/codebuild/standard:7.0
  Compute: BUILD_GENERAL1_MEDIUM
  Privileged Mode: true (pour Docker)
  
Build Spec: buildspec.yml
Timeout: 30 minutes
```

#### Phases de Build
```yaml
install:
  - Node.js 20
  - npm dependencies
  
pre_build:
  - Fetch secrets (Stripe)
  - Start PostgreSQL (Docker)
  - Start Stripe Mock (Docker)
  - Run migrations
  
build:
  - TypeScript check
  - Run tests
  - Generate coverage
  
post_build:
  - Cleanup containers
  - Upload artifacts
```

### 2. AWS S3 (Storage)

#### Buckets
```yaml
huntaze-media-prod:
  Purpose: User uploaded media
  Encryption: AES-256
  Versioning: Enabled
  Lifecycle: 90 days to Glacier
  
huntaze-backups:
  Purpose: Database backups
  Encryption: AES-256
  Versioning: Enabled
  Lifecycle: 30 days retention
  
huntaze-test-artifacts:
  Purpose: CI/CD artifacts
  Encryption: AES-256
  Lifecycle: 14 days deletion
```

### 3. AWS Secrets Manager

#### Secrets Stockés
```yaml
huntaze/stripe-secrets:
  STRIPE_SECRET_KEY
  STRIPE_PRO_MONTHLY_PRICE_ID
  STRIPE_PRO_YEARLY_PRICE_ID
  STRIPE_ENTERPRISE_MONTHLY_PRICE_ID
  STRIPE_ENTERPRISE_YEARLY_PRICE_ID
  
huntaze/database:
  DATABASE_URL
  DATABASE_PASSWORD
  
huntaze/azure:
  AZURE_OPENAI_API_KEY
  AZURE_SUBSCRIPTION_ID
```

### 4. AWS CloudFront (CDN)

#### Distribution
```yaml
Origin: huntaze-media-prod.s3.amazonaws.com
Price Class: Use All Edge Locations
SSL Certificate: ACM Certificate
Behaviors:
  - PathPattern: /media/*
    CacheTTL: 86400 (24h)
  - PathPattern: /static/*
    CacheTTL: 31536000 (1 year)
```

---

## 🔄 CI/CD Pipeline

### 1. GitHub Actions (Alternative)

#### .github/workflows/ci.yml
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: huntaze_test
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Run tests
        run: npm run test:ci
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/huntaze_test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
  
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 2. Déploiement Automatique

#### Workflow
```
1. Push code → GitHub
2. Trigger → GitHub Actions / AWS CodeBuild
3. Tests → Run all tests
4. Build → Create production build
5. Deploy → Vercel / AWS Amplify
6. Notify → Slack / Email
```

---

## 💾 Base de Données

### 1. PostgreSQL (Supabase)

#### Configuration
```yaml
Provider: Supabase
Region: us-east-1
Version: PostgreSQL 15
Instance: db.t3.medium
Storage: 100GB SSD
Backups: Daily, 7 days retention
```

#### Schema Principal
```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  tier VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  stripe_subscription_id VARCHAR(255),
  status VARCHAR(50),
  plan VARCHAR(50),
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Content
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title VARCHAR(500),
  body TEXT,
  type VARCHAR(50),
  status VARCHAR(50),
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Analytics
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  event_type VARCHAR(100),
  event_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Migrations
```bash
# Créer une migration
npx prisma migrate dev --name add_analytics_table

# Appliquer en production
npx prisma migrate deploy

# Reset (dev only)
npx prisma migrate reset
```

### 2. Redis (Cache)

#### Configuration
```yaml
Provider: AWS ElastiCache / Upstash
Type: Redis 7.0
Instance: cache.t3.micro
Use Cases:
  - Session storage
  - API rate limiting
  - AI response caching
  - Real-time analytics
```

---

## 🔌 Services Externes

### 1. Stripe (Payments)

#### Configuration
```yaml
Mode: Live
Webhook Endpoint: https://huntaze.com/api/webhooks/stripe
Events:
  - customer.subscription.created
  - customer.subscription.updated
  - customer.subscription.deleted
  - invoice.payment_succeeded
  - invoice.payment_failed
```

#### Plans
```yaml
Pro Monthly:
  Price: $29/month
  Features: AI content, Analytics, Priority support
  
Pro Yearly:
  Price: $290/year (2 months free)
  
Enterprise Monthly:
  Price: $99/month
  Features: Everything + Multi-agents, Custom AI
```

### 2. Monitoring

#### Sentry (Error Tracking)
```javascript
// sentry.config.js
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

#### DataDog (APM)
```javascript
// datadog.config.js
const tracer = require('dd-trace').init({
  service: 'huntaze-api',
  env: process.env.NODE_ENV,
});
```

---

## 🚀 Déploiement Production

### 1. Checklist Pré-Déploiement

```markdown
- [ ] Tests passent à 100%
- [ ] Coverage > 80%
- [ ] Type check OK
- [ ] Lint OK
- [ ] Secrets configurés
- [ ] Database migrations prêtes
- [ ] Backup database
- [ ] DNS configuré
- [ ] SSL certificates valides
- [ ] Monitoring activé
- [ ] Rollback plan prêt
```

### 2. Commandes de Déploiement

```bash
# 1. Build local
npm run build

# 2. Test production build
npm run start

# 3. Deploy to Vercel
vercel --prod

# 4. Ou deploy to AWS
./scripts/deploy-aws-infrastructure.sh

# 5. Run migrations
npm run prisma:migrate:deploy

# 6. Verify deployment
curl https://huntaze.com/api/health
```

### 3. Rollback Procedure

```bash
# Vercel
vercel rollback

# AWS
aws amplify start-deployment \
  --app-id <app-id> \
  --branch-name main \
  --job-id <previous-job-id>

# Database
npx prisma migrate resolve --rolled-back <migration-name>
```

---

## 📊 Monitoring Production

### Métriques Clés
- Response time < 200ms (p95)
- Error rate < 0.1%
- Uptime > 99.9%
- AI cost < $500/month
- Database connections < 80%

### Alertes
- Error rate > 1% → PagerDuty
- Response time > 1s → Slack
- AI cost > $100/day → Email
- Database CPU > 80% → Slack

---

**🎉 Votre plateforme Huntaze est maintenant prête pour la production !**
