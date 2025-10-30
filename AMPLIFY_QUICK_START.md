# ⚡ Huntaze Amplify - Quick Start

## 🎯 TL;DR

Ton app Next.js est sur **AWS Amplify** avec auto-deploy depuis GitHub.

**Setup en 3 étapes:**
1. Créer les ressources AWS (5 min)
2. Configurer les env vars dans Amplify (10 min)
3. Push to main → Auto-deploy ! (5 min)

---

## 📋 CHECKLIST PRÉ-DÉPLOIEMENT

### ✅ Étape 1: Ressources AWS (5 min)

```bash
# Créer les tables DynamoDB + SQS queues + SNS topic
./scripts/setup-aws-infrastructure.sh

# Subscribe aux alertes email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:317805897534:huntaze-cost-alerts \
  --protocol email \
  --notification-endpoint admin@huntaze.com
```

### ✅ Étape 2: Variables Amplify (10 min)

Va dans **Amplify Console > Environment variables** et copie-colle :

```bash
# Database
DATABASE_URL=postgresql://huntazeadmin:***@huntaze-postgres-production.***:5432/huntaze
REDIS_URL=redis://huntaze-redis-production.***:6379

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://huntaze-openai.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4-turbo
AZURE_OPENAI_API_KEY=***
AZURE_OPENAI_API_VERSION=2024-02-15-preview
ENABLE_AZURE_AI=true

# OpenAI
OPENAI_API_KEY=sk-***
OPENAI_ORG_ID=org-***

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA***
AWS_SECRET_ACCESS_KEY=***

# DynamoDB
DYNAMODB_COSTS_TABLE=huntaze-ai-costs-production
DYNAMODB_ALERTS_TABLE=huntaze-cost-alerts-production

# SQS
SQS_WORKFLOW_QUEUE=https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-hybrid-workflows
SQS_RATE_LIMITER_QUEUE=https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue

# SNS
COST_ALERTS_SNS_TOPIC=arn:aws:sns:us-east-1:317805897534:huntaze-cost-alerts

# Monitoring
COST_ALERT_EMAIL=admin@huntaze.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/***

# Feature Flags
HYBRID_ORCHESTRATOR_ENABLED=true
COST_MONITORING_ENABLED=true
RATE_LIMITER_ENABLED=true

# Auth
JWT_SECRET=***
NEXTAUTH_SECRET=***
NEXTAUTH_URL=https://app.huntaze.com

# Stripe
STRIPE_SECRET_KEY=sk_live_***

# URLs
NEXT_PUBLIC_APP_URL=https://app.huntaze.com
NEXT_PUBLIC_API_URL=https://app.huntaze.com/api
```

**Voir la liste complète:** `AMPLIFY_DEPLOYMENT_GUIDE.md`

### ✅ Étape 3: Deploy (5 min)

```bash
# Commit & push
git add .
git commit -m "feat: configure hybrid orchestrator for Amplify"
git push origin main

# Amplify auto-deploy ! 🚀
# Vérifie le build: https://console.aws.amazon.com/amplify
```

---

## 🧪 VÉRIFICATION

### 1. Build Success

Dans **Amplify Console > Build history** :
- ✅ Provision (< 1 min)
- ✅ Build (< 5 min)  
- ✅ Deploy (< 1 min)
- ✅ Verify (< 30 sec)

### 2. Health Check

```bash
curl https://app.huntaze.com/api/health/hybrid-orchestrator

# Expected: { "status": "healthy", ... }
```

### 3. Test Campaign

```bash
curl -X POST https://app.huntaze.com/api/v2/campaigns/hybrid \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"type":"content_planning","platforms":["instagram"],"data":{"theme":"fitness"}}'
```

---

## 🐛 TROUBLESHOOTING

### Build Failed?

```bash
# 1. Check build logs dans Amplify Console
# 2. Test localement:
npm run build

# 3. Vérifie les env vars:
./scripts/check-amplify-env.sh

# 4. Clear cache Amplify:
# Amplify Console > App Settings > Clear cache
```

### Runtime Errors?

```bash
# 1. Check CloudWatch logs
aws logs tail /aws/amplify/huntaze --follow

# 2. Test health
curl https://app.huntaze.com/api/health/hybrid-orchestrator

# 3. Rollback
# Amplify Console > Deployments > Redeploy previous version
```

---

## 📊 MONITORING

### Amplify Metrics
**Amplify Console > Monitoring**
- Requests/min
- Error rate
- Latency

### Cost Tracking
```bash
curl https://app.huntaze.com/api/v2/costs/stats
```

### Logs
```bash
aws logs tail /aws/amplify/huntaze --follow
```

---

## 💰 COÛTS

```
Amplify:        ~$5-10/month
AWS Services:   ~$32/month
AI Providers:   ~$32/month
─────────────────────────────
TOTAL:          ~$70-75/month
```

---

## 📚 DOCS

- **Full Guide:** `AMPLIFY_DEPLOYMENT_GUIDE.md`
- **Architecture:** `HUNTAZE_COMPLETE_ARCHITECTURE.md`
- **Quick Ref:** `HUNTAZE_QUICK_REFERENCE.md`

---

## 🚀 NEXT STEPS

1. ✅ Setup AWS resources
2. ✅ Configure Amplify env vars
3. ✅ Push to main
4. ✅ Verify deployment
5. 📊 Monitor costs
6. 🎉 Profit!

---

**Amplify Console:** https://console.aws.amazon.com/amplify/home?region=us-east-1  
**Account:** 317805897534  
**Region:** us-east-1  

**Ready?** `git push origin main` 🚀
