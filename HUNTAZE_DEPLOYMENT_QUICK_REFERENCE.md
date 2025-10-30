# ⚡ Huntaze - Référence Rapide Déploiement

## 🚀 Stack Technique

```
Frontend:  Next.js 14 + React 18 + TypeScript
Backend:   Next.js API Routes
Database:  PostgreSQL (Supabase)
AI:        Azure OpenAI (GPT-4o + mini)
Payment:   Stripe
CI/CD:     AWS CodeBuild + GitHub Actions
Hosting:   Vercel / AWS Amplify
Storage:   AWS S3 + CloudFront
```

## 🔑 Variables d'Environnement Essentielles

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_URL=https://huntaze.com

# Azure OpenAI
AZURE_OPENAI_API_KEY=<key>
AZURE_OPENAI_ENDPOINT=https://huntaze-ai-eus2-29796.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=gpt-4o

# Database
DATABASE_URL=postgresql://user:pass@host:5432/huntaze_prod

# Stripe
STRIPE_SECRET_KEY=sk_live_<key>
STRIPE_WEBHOOK_SECRET=whsec_<secret>

# AWS
AWS_REGION=us-east-1
AWS_S3_BUCKET=huntaze-media-prod
```

## 📦 Commandes Essentielles

```bash
# Installation
npm ci

# Development
npm run dev

# Tests
npm run test
npm run test:coverage

# Build
npm run build
npm run start

# Deploy
vercel --prod
# ou
./scripts/deploy-aws-infrastructure.sh

# Database
npx prisma migrate deploy
npx prisma generate
```

## 🏗️ Services Azure

```yaml
Resource Group: huntaze-ai-rg
Location: East US 2

OpenAI Resource: huntaze-ai-eus2-29796
Deployments:
  - gpt-4o (100K TPM)
  - gpt-4o-mini (500K TPM)

AI Team Project: huntaze-agents
Endpoint: https://eastus.api.azureml.ms
```

## ☁️ Infrastructure AWS

```yaml
CodeBuild: huntaze-simple-services
S3 Buckets:
  - huntaze-media-prod
  - huntaze-backups
  - huntaze-test-artifacts

Secrets Manager:
  - huntaze/stripe-secrets
  - huntaze/database
  - huntaze/azure

CloudFront: d123456.cloudfront.net
```

## 🔄 CI/CD Pipeline

```
Push → GitHub → CodeBuild → Tests → Build → Deploy → Notify
```

## 💾 Base de Données

```sql
Tables:
  - users (id, email, name, tier)
  - subscriptions (id, user_id, stripe_id, status)
  - content (id, user_id, title, body, type)
  - analytics (id, user_id, event_type, data)
```

## 🤖 AI Routing

```
80-95% → GPT-4o-mini ($0.001-0.003/req)
5-20%  → GPT-4o ($0.02-0.10/req)

Économies: 98% avec cache
```

## 📊 Monitoring

```
Sentry:     Errors & Traces
DataDog:    APM & Metrics
CloudWatch: Logs & Alarms
Analytics:  Events & Revenue
```

## 🔒 Sécurité

```
- SSL/TLS (CloudFront)
- Secrets Manager (AWS)
- JWT Auth (NextAuth.js)
- CORS configuré
- Rate limiting
- GDPR compliant
```

## 📈 Métriques Cibles

```
Response Time: < 200ms (p95)
Error Rate:    < 0.1%
Uptime:        > 99.9%
AI Cost:       < $500/month
Coverage:      > 80%
```

## 🚨 Alertes

```
Error rate > 1%        → PagerDuty
Response time > 1s     → Slack
AI cost > $100/day     → Email
Database CPU > 80%     → Slack
```

## 🔧 Dépannage Rapide

```bash
# Logs CodeBuild
aws logs tail /aws/codebuild/huntaze-simple-services --follow

# Secrets
aws secretsmanager get-secret-value --secret-id huntaze/stripe-secrets

# S3 Artifacts
aws s3 ls s3://huntaze-test-artifacts-<account>/

# Database
psql $DATABASE_URL

# Vercel Logs
vercel logs huntaze-prod
```

## 📞 Liens Utiles

- [Guide Complet](HUNTAZE_DEPLOYMENT_COMPLETE_GUIDE.md)
- [Architecture](HUNTAZE_ARCHITECTURE_DIAGRAM.md)
- [AWS Guide](AWS_DEPLOYMENT_GUIDE.md)
- [AI Routing](AI_ROUTING_IMPLEMENTATION_COMPLETE.md)

---

**🎯 Tout ce dont vous avez besoin pour déployer Huntaze en production !**
