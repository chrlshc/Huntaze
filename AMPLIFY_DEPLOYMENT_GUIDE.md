# 🚀 Huntaze - AWS Amplify Deployment Guide

## 📋 OVERVIEW

Ton app Next.js est déployée sur **AWS Amplify** avec l'orchestrateur hybride intégré.

**Architecture:**
```
GitHub Repo
    ↓ (auto-deploy on push)
AWS Amplify
    ↓ (builds & hosts)
Next.js App (SSR + API Routes)
    ↓ (connects to)
┌─────────────┬─────────────┬─────────────┐
│ RDS         │ DynamoDB    │ SQS         │
│ PostgreSQL  │ Cost Data   │ Queues      │
└─────────────┴─────────────┴─────────────┘
    ↓ (calls)
┌─────────────┬─────────────┐
│ Azure       │ OpenAI      │
│ GPT-4 Turbo │ GPT-3.5     │
└─────────────┴─────────────┘
```

---

## 🔧 CONFIGURATION AMPLIFY

### 1. Variables d'environnement (Amplify Console)

Va dans **Amplify Console > App Settings > Environment variables** et ajoute :

#### Database & Cache
```
DATABASE_URL=postgresql://huntazeadmin:***@huntaze-postgres-production.***:5432/huntaze
REDIS_URL=redis://huntaze-redis-production.***:6379
```

#### Azure OpenAI (Primary Provider)
```
AZURE_OPENAI_ENDPOINT=https://huntaze-openai.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4-turbo
AZURE_OPENAI_API_KEY=***
AZURE_OPENAI_API_VERSION=2024-02-15-preview
USE_AZURE_RESPONSES=true
ENABLE_AZURE_AI=true
AZURE_BILLING_LOCK=false
```

#### OpenAI (Secondary Provider)
```
OPENAI_API_KEY=sk-***
OPENAI_ORG_ID=org-***
```

#### AWS Services
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA***
AWS_SECRET_ACCESS_KEY=***
```

#### DynamoDB Tables
```
DYNAMODB_COSTS_TABLE=huntaze-ai-costs-production
DYNAMODB_ALERTS_TABLE=huntaze-cost-alerts-production
```

#### SQS Queues
```
SQS_URL=https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-enrichment-production
SQS_WORKFLOW_QUEUE=https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-hybrid-workflows
SQS_RATE_LIMITER_QUEUE=https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue
```

#### SNS Topics
```
COST_ALERTS_SNS_TOPIC=arn:aws:sns:us-east-1:317805897534:huntaze-cost-alerts
```

#### Cost Monitoring
```
COST_ALERT_EMAIL=admin@huntaze.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/***
DAILY_COST_THRESHOLD=50
MONTHLY_COST_THRESHOLD=1000
```

#### Feature Flags
```
HYBRID_ORCHESTRATOR_ENABLED=true
COST_MONITORING_ENABLED=true
RATE_LIMITER_ENABLED=true
```

#### OnlyFans
```
ONLYFANS_API_URL=https://onlyfans.com/api2/v2
ONLYFANS_USER_AGENT=Mozilla/5.0 (compatible; Huntaze/1.0)
```

#### Auth & Security
```
JWT_SECRET=***
NEXTAUTH_SECRET=***
NEXTAUTH_URL=https://app.huntaze.com
```

#### Stripe
```
STRIPE_SECRET_KEY=sk_live_***
STRIPE_WEBHOOK_SECRET=whsec_***
```

#### App URLs
```
NEXT_PUBLIC_APP_URL=https://app.huntaze.com
NEXT_PUBLIC_API_URL=https://app.huntaze.com/api
```

#### Logging
```
API_LOG_GROUP=/aws/amplify/huntaze
AI_SMOKE_TOKEN=***
```

---

### 2. Build Settings (amplify.yml)

Le fichier `amplify.yml` est déjà configuré avec :
- ✅ Node 20
- ✅ npm ci avec cache
- ✅ Toutes les env vars injectées au build
- ✅ Cache Next.js optimisé

**Aucune modification nécessaire** - le fichier est prêt ! 🎉

---

### 3. IAM Permissions (Amplify Service Role)

Ton app Amplify a besoin d'accéder à AWS services. Crée/vérifie le service role :

#### Créer le role si nécessaire

```bash
# 1. Créer la policy
cat > amplify-huntaze-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:UpdateItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:317805897534:table/huntaze-*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage",
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": [
        "arn:aws:sqs:us-east-1:317805897534:huntaze-*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": [
        "arn:aws:sns:us-east-1:317805897534:huntaze-*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricData"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": [
        "arn:aws:logs:us-east-1:317805897534:log-group:/aws/amplify/*"
      ]
    }
  ]
}
EOF

# 2. Créer la policy
aws iam create-policy \
  --policy-name AmplifyHuntazeServicePolicy \
  --policy-document file://amplify-huntaze-policy.json

# 3. Attacher au role Amplify
aws iam attach-role-policy \
  --role-name amplifyconsole-backend-role \
  --policy-arn arn:aws:iam::317805897534:policy/AmplifyHuntazeServicePolicy
```

---

### 4. Domaine Custom (optionnel)

Si tu veux utiliser `app.huntaze.com` :

1. **Amplify Console > Domain Management**
2. **Add domain** → `huntaze.com`
3. **Add subdomain** → `app`
4. Amplify va créer automatiquement le certificat SSL

---

## 🚀 DÉPLOIEMENT

### Déploiement automatique (recommandé)

```bash
# 1. Commit & push
git add .
git commit -m "feat: add hybrid orchestrator"
git push origin main

# 2. Amplify détecte le push et build automatiquement
# 3. Vérifie le build dans Amplify Console
```

### Déploiement manuel

```bash
# Via Amplify Console
# App > Deployments > Redeploy this version
```

---

## ✅ VÉRIFICATION POST-DÉPLOIEMENT

### 1. Check Build Logs

Dans **Amplify Console > Build history**, vérifie :
- ✅ Provision (< 1 min)
- ✅ Build (< 5 min)
- ✅ Deploy (< 1 min)
- ✅ Verify (< 30 sec)

### 2. Test Health Check

```bash
curl https://app.huntaze.com/api/health/hybrid-orchestrator

# Expected:
{
  "status": "healthy",
  "checks": {
    "database": { "status": "healthy" },
    "orchestrator": { "status": "healthy" },
    "azureProvider": { "status": "healthy" },
    "openaiProvider": { "status": "healthy" }
  }
}
```

### 3. Test Campaign Creation

```bash
curl -X POST https://app.huntaze.com/api/v2/campaigns/hybrid \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "content_planning",
    "platforms": ["instagram"],
    "data": { "theme": "fitness" }
  }'
```

### 4. Check Costs

```bash
curl https://app.huntaze.com/api/v2/costs/stats
```

---

## 📊 MONITORING

### Amplify Metrics

**Amplify Console > Monitoring** montre :
- Requests per minute
- Error rate
- Latency (p50, p95, p99)
- Data transfer

### CloudWatch Logs

```bash
# View Amplify logs
aws logs tail /aws/amplify/huntaze --follow

# Search for errors
aws logs filter-log-events \
  --log-group-name /aws/amplify/huntaze \
  --filter-pattern "ERROR"
```

### Custom Metrics

Les métriques de l'orchestrateur sont dans CloudWatch :
- `Huntaze/AI/Costs/AIProviderCost`
- `Huntaze/AI/Costs/AITokenUsage`
- `Huntaze/AI/Costs/AIRequestDuration`

---

## 🐛 TROUBLESHOOTING

### Build Failed

**Symptôme:** Build échoue dans Amplify

**Solutions:**
```bash
# 1. Check build logs dans Amplify Console
# 2. Vérifie que toutes les env vars sont définies
# 3. Test le build localement:
npm run build

# 4. Si ça marche localement, clear cache Amplify:
# Amplify Console > App Settings > Clear cache
```

### Runtime Errors

**Symptôme:** App déployée mais erreurs 500

**Solutions:**
```bash
# 1. Check CloudWatch logs
aws logs tail /aws/amplify/huntaze --follow

# 2. Vérifie les env vars dans Amplify Console
# 3. Test les connexions AWS:
curl https://app.huntaze.com/api/health/hybrid-orchestrator

# 4. Rollback si nécessaire:
# Amplify Console > Deployments > Redeploy previous version
```

### High Costs

**Symptôme:** Coûts AI trop élevés

**Solutions:**
```bash
# 1. Check cost breakdown
curl https://app.huntaze.com/api/v2/costs/breakdown?startDate=2024-01-01&endDate=2024-01-31

# 2. Disable hybrid orchestrator temporairement
# Amplify Console > Environment variables
# HYBRID_ORCHESTRATOR_ENABLED=false

# 3. Redeploy
```

---

## 🔄 ROLLBACK

### Rollback rapide (< 2 min)

```bash
# Via Amplify Console
# 1. App > Deployments
# 2. Find previous working version
# 3. Click "Redeploy this version"
```

### Rollback avec code

```bash
# 1. Revert commit
git revert HEAD
git push origin main

# 2. Amplify auto-deploy
```

---

## 💰 COÛTS AMPLIFY

### Hosting
```
Build minutes:  1000 min/month free, then $0.01/min
Hosting:        15 GB storage free, then $0.023/GB
Data transfer:  15 GB/month free, then $0.15/GB
```

### Estimation mensuelle
```
Builds:         ~100 builds/month × 5 min = 500 min = $0 (free tier)
Hosting:        ~5 GB = $0 (free tier)
Data transfer:  ~50 GB = $5.25 (35 GB × $0.15)

Total Amplify:  ~$5-10/month
```

### Total Infrastructure
```
Amplify:        ~$5-10/month
AWS Services:   ~$32/month (RDS, DynamoDB, SQS, etc.)
AI Providers:   ~$32/month (Azure + OpenAI)

TOTAL:          ~$70-75/month
```

---

## 🔐 SECURITY BEST PRACTICES

### 1. Secrets Management

✅ **DO:**
- Store secrets in Amplify Environment Variables
- Use AWS Secrets Manager for sensitive data
- Rotate API keys regularly

❌ **DON'T:**
- Commit secrets to Git
- Hardcode API keys in code
- Share secrets in Slack/Email

### 2. IAM Permissions

✅ **DO:**
- Use least privilege principle
- Create specific policies for Amplify
- Audit permissions regularly

❌ **DON'T:**
- Use admin credentials
- Share AWS access keys
- Grant wildcard permissions

### 3. Rate Limiting

✅ **DO:**
- Enable rate limiter for OnlyFans
- Monitor rate limit violations
- Set up alerts for abuse

---

## 📚 RESSOURCES

**Amplify Console:**
https://console.aws.amazon.com/amplify/home?region=us-east-1

**CloudWatch Logs:**
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/$252Faws$252Famplify$252Fhuntaze

**Documentation:**
- `HUNTAZE_COMPLETE_ARCHITECTURE.md` - Architecture complète
- `HUNTAZE_QUICK_REFERENCE.md` - Guide rapide
- `README_DEPLOYMENT.md` - Déploiement général

---

## 🆘 SUPPORT

**AWS Account:** 317805897534  
**Region:** us-east-1  
**Amplify App:** huntaze  
**Environment:** Production  

**En cas de problème:**
1. Check Amplify build logs
2. Check CloudWatch logs
3. Test health endpoint
4. Rollback si nécessaire

---

**Ready to deploy?** Push to `main` branch! 🚀
