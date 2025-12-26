# Huntaze Beta - Déploiement Budget AWS
**Date**: 2025-12-22  
**Compte AWS**: 317805897534  
**Budget Cible**: $50-80/mois  
**AI Provider**: Azure AI Foundry uniquement

---

## 🎯 Objectif

Déployer Huntaze en **mode beta économique** avec :
- ✅ Coût total < $80/mois
- ✅ Scalable (peut monter en charge)
- ✅ Pas de cold starts
- ✅ Azure AI Foundry uniquement (pas de Gemini/OpenAI)

---

## 💰 Architecture Budget-Optimisée

### Option Retenue: **Vercel + AWS Minimal**

```
Frontend (Vercel)
├── Next.js 16 SSR
├── Edge Functions (gratuit)
├── CDN global (gratuit)
└── $20/mois (Hobby plan)

Backend AWS (Minimal)
├── RDS PostgreSQL (db.t4g.micro) - $15/mois
├── ElastiCache Redis (cache.t4g.micro) - $12/mois
├── S3 (assets) - $3/mois
└── Lambda (cron jobs) - $2/mois

AI (Azure AI Foundry)
├── DeepSeek-R1 (reasoning) - $10-20/mois
├── Phi-4 (multimodal) - $5-10/mois
└── Pay-per-use (pas de coût fixe)
```

**Total estimé**: **$67-82/mois**

---

## 📋 Plan de Déploiement Budget

### Phase 1: Base de Données AWS (15 min)

#### RDS PostgreSQL (db.t4g.micro)
```bash
# Créer RDS PostgreSQL minimal
aws rds create-db-instance \
  --db-instance-identifier huntaze-beta-db \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --engine-version 16.1 \
  --master-username huntaze \
  --master-user-password <SECURE_PASSWORD> \
  --allocated-storage 20 \
  --storage-type gp3 \
  --storage-encrypted \
  --backup-retention-period 7 \
  --publicly-accessible \
  --region us-east-2 \
  --tags Key=Project,Value=Huntaze Key=Environment,Value=Beta
```

**Coût**: ~$15/mois
- CPU: 2 vCPU (ARM Graviton)
- RAM: 1 GB
- Storage: 20 GB SSD
- Backup: 7 jours

**Optimisations**:
- ✅ ARM Graviton (20% moins cher)
- ✅ gp3 storage (20% moins cher que gp2)
- ✅ Single-AZ (pas Multi-AZ pour beta)
- ✅ Publicly accessible (pas de NAT Gateway = -$32/mois)

#### ElastiCache Redis (cache.t4g.micro)
```bash
# Créer ElastiCache Redis minimal
aws elasticache create-cache-cluster \
  --cache-cluster-id huntaze-beta-redis \
  --cache-node-type cache.t4g.micro \
  --engine redis \
  --engine-version 7.1 \
  --num-cache-nodes 1 \
  --region us-east-2 \
  --tags Key=Project,Value=Huntaze Key=Environment,Value=Beta
```

**Coût**: ~$12/mois
- CPU: 2 vCPU (ARM Graviton)
- RAM: 555 MB
- Single-node (pas de replication pour beta)

**Optimisations**:
- ✅ ARM Graviton (20% moins cher)
- ✅ Single-node (pas de replication)
- ✅ Pas de backup automatique

#### S3 Bucket (Assets)
```bash
# Créer S3 bucket
aws s3 mb s3://huntaze-beta-assets --region us-east-2

# Configurer lifecycle (auto-delete après 90 jours)
aws s3api put-bucket-lifecycle-configuration \
  --bucket huntaze-beta-assets \
  --lifecycle-configuration file://s3-lifecycle.json
```

**s3-lifecycle.json**:
```json
{
  "Rules": [
    {
      "Id": "DeleteOldAssets",
      "Status": "Enabled",
      "Prefix": "temp/",
      "Expiration": {
        "Days": 7
      }
    },
    {
      "Id": "TransitionToIA",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        }
      ]
    }
  ]
}
```

**Coût**: ~$3/mois
- Storage: 10 GB (beta)
- Requests: 10K/mois
- Transfer: 5 GB/mois

**Optimisations**:
- ✅ Lifecycle policies (auto-cleanup)
- ✅ Intelligent-Tiering après 30 jours
- ✅ Pas de versioning (beta)

---

### Phase 2: Frontend Vercel (10 min)

#### Pourquoi Vercel au lieu d'Amplify ?
- ✅ **$20/mois** vs $30-50/mois (Amplify)
- ✅ **Pas de cold starts** (Edge Functions)
- ✅ **CDN global gratuit** (300+ locations)
- ✅ **CI/CD intégré** (GitHub)
- ✅ **Preview deployments** (branches)
- ✅ **Analytics gratuit**

#### Déploiement Vercel
```bash
# 1. Installer Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Déployer
vercel --prod

# 4. Configurer variables d'environnement
vercel env add DATABASE_URL production
vercel env add REDIS_URL production
vercel env add AZURE_AI_CHAT_ENDPOINT production
vercel env add AZURE_AI_CHAT_KEY production
vercel env add NEXTAUTH_SECRET production
```

**Configuration Vercel** (`vercel.json`):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "app/api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}
```

**Coût**: $20/mois (Hobby plan)
- Bandwidth: 100 GB/mois
- Build time: 100 heures/mois
- Edge Functions: Illimité
- Serverless Functions: 100 GB-heures

---

### Phase 3: Cron Jobs Lambda (10 min)

#### Créer Lambda Functions (au lieu d'ECS)
```bash
# 1. Créer fonction Lambda pour cron jobs
aws lambda create-function \
  --function-name huntaze-beta-cron \
  --runtime nodejs20.x \
  --role arn:aws:iam::317805897534:role/HuntazeLambdaRole \
  --handler index.handler \
  --zip-file fileb://lambda-cron.zip \
  --timeout 60 \
  --memory-size 512 \
  --environment Variables="{DATABASE_URL=$DATABASE_URL,REDIS_URL=$REDIS_URL}" \
  --region us-east-2
```

**lambda-cron.zip** (code):
```typescript
// index.ts
export const handler = async (event: any) => {
  const { jobType } = event;
  
  switch (jobType) {
    case 'expire-offers':
      // Call Vercel API: POST https://app.huntaze.com/api/cron/offers/expire
      break;
    case 'activate-offers':
      // Call Vercel API: POST https://app.huntaze.com/api/cron/offers/activate
      break;
    case 'monthly-billing':
      // Call Vercel API: POST https://app.huntaze.com/api/cron/monthly-billing
      break;
  }
};
```

#### Configurer EventBridge (Cron)
```bash
# Créer règle EventBridge
aws events put-rule \
  --name huntaze-beta-expire-offers \
  --schedule-expression "cron(0 0 * * ? *)" \
  --state ENABLED \
  --region us-east-2

# Ajouter target Lambda
aws events put-targets \
  --rule huntaze-beta-expire-offers \
  --targets "Id"="1","Arn"="arn:aws:lambda:us-east-2:317805897534:function:huntaze-beta-cron","Input"='{"jobType":"expire-offers"}' \
  --region us-east-2
```

**Coût**: ~$2/mois
- Invocations: 1000/mois (cron jobs)
- Compute: 512 MB x 10s = 5 GB-sec/mois
- EventBridge: Gratuit (< 1M events)

---

### Phase 4: AI Configuration (Azure uniquement)

#### Supprimer Gemini/OpenAI
```typescript
// lib/ai/config/provider-config.ts
export const AI_PROVIDERS = {
  // ❌ SUPPRIMÉ: Gemini (économie: $20-50/mois)
  // gemini: {
  //   apiKey: process.env.GEMINI_API_KEY,
  //   model: 'gemini-2.0-flash-exp',
  // },
  
  // ❌ SUPPRIMÉ: OpenAI (économie: $30-80/mois)
  // openai: {
  //   apiKey: process.env.OPENAI_API_KEY,
  //   model: 'gpt-4o-mini',
  // },
  
  // ✅ GARDÉ: Azure AI Foundry uniquement
  azure: {
    endpoint: process.env.AZURE_AI_CHAT_ENDPOINT,
    apiKey: process.env.AZURE_AI_CHAT_KEY,
    models: {
      reasoning: 'deepseek-r1',      // $0.00135/1K input
      generation: 'deepseek-v3',     // $0.00114/1K input
      multimodal: 'phi-4-multimodal', // $0.40/1M tokens
    },
  },
};
```

#### Optimiser les Appels AI
```typescript
// lib/ai/service.ts
export async function generateAIResponse(prompt: string) {
  // ✅ Cache Redis (évite appels AI)
  const cached = await redis.get(`ai:${hash(prompt)}`);
  if (cached) return cached;
  
  // ✅ Utiliser DeepSeek-V3 (le moins cher)
  const response = await azureClient.chat.completions.create({
    model: 'deepseek-v3',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 500, // ✅ Limiter tokens
    temperature: 0.7,
  });
  
  // ✅ Cache 1 heure
  await redis.setex(`ai:${hash(prompt)}`, 3600, response);
  
  return response;
}
```

**Coût AI estimé**: $10-30/mois
- DeepSeek-R1: $0.00135/1K input → ~$5-10/mois
- DeepSeek-V3: $0.00114/1K input → ~$3-8/mois
- Phi-4 Multimodal: $0.40/1M tokens → ~$2-5/mois
- Cache hit rate: 60-80% (économie 60-80%)

---

### Phase 5: Monitoring Minimal (5 min)

#### CloudWatch Alarms (Gratuit)
```bash
# Alarme RDS CPU
aws cloudwatch put-metric-alarm \
  --alarm-name huntaze-beta-rds-cpu \
  --alarm-description "RDS CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=DBInstanceIdentifier,Value=huntaze-beta-db \
  --region us-east-2

# Alarme Redis Memory
aws cloudwatch put-metric-alarm \
  --alarm-name huntaze-beta-redis-memory \
  --alarm-description "Redis Memory > 90%" \
  --metric-name DatabaseMemoryUsagePercentage \
  --namespace AWS/ElastiCache \
  --statistic Average \
  --period 300 \
  --threshold 90 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=CacheClusterId,Value=huntaze-beta-redis \
  --region us-east-2
```

**Coût**: Gratuit
- 10 alarmes gratuites/mois
- CloudWatch Logs: 5 GB gratuit/mois

---

## 📊 Comparaison des Coûts

### Architecture Initiale (Trop Chère)
| Service | Coût/mois |
|---------|-----------|
| Amplify Compute | $30-50 |
| ECS Fargate (AI Router) | $30-40 |
| ECS Fargate (Video Processor) | $15-20 |
| RDS (db.t3.medium, Multi-AZ) | $80-120 |
| ElastiCache (cache.t3.medium, Multi-AZ) | $60-80 |
| ALB | $32 |
| NAT Gateway | $64 |
| S3 | $10-15 |
| Gemini AI | $20-50 |
| Azure AI | $30-80 |
| **TOTAL** | **$371-551/mois** ❌

### Architecture Budget (Optimisée)
| Service | Coût/mois |
|---------|-----------|
| Vercel (Hobby) | $20 |
| RDS (db.t4g.micro, Single-AZ) | $15 |
| ElastiCache (cache.t4g.micro, Single-node) | $12 |
| S3 (10 GB) | $3 |
| Lambda (Cron jobs) | $2 |
| Azure AI Foundry | $10-30 |
| CloudWatch | $0 (gratuit) |
| **TOTAL** | **$62-82/mois** ✅

**Économies**: **$309-469/mois** (83% moins cher)

---

## 🚀 Script de Déploiement Automatisé

```bash
#!/bin/bash
# scripts/deploy-beta-budget.sh

set -e

echo "🚀 Déploiement Huntaze Beta (Budget)"

# Variables
REGION="us-east-2"
DB_PASSWORD=$(openssl rand -base64 32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# 1. Créer RDS PostgreSQL
echo "📦 Création RDS PostgreSQL..."
aws rds create-db-instance \
  --db-instance-identifier huntaze-beta-db \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --engine-version 16.1 \
  --master-username huntaze \
  --master-user-password "$DB_PASSWORD" \
  --allocated-storage 20 \
  --storage-type gp3 \
  --storage-encrypted \
  --backup-retention-period 7 \
  --publicly-accessible \
  --region $REGION

# Attendre que RDS soit disponible
echo "⏳ Attente RDS (5-10 min)..."
aws rds wait db-instance-available \
  --db-instance-identifier huntaze-beta-db \
  --region $REGION

# Récupérer endpoint RDS
DB_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier huntaze-beta-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text \
  --region $REGION)

DATABASE_URL="postgresql://huntaze:$DB_PASSWORD@$DB_ENDPOINT:5432/huntaze"

# 2. Créer ElastiCache Redis
echo "📦 Création ElastiCache Redis..."
aws elasticache create-cache-cluster \
  --cache-cluster-id huntaze-beta-redis \
  --cache-node-type cache.t4g.micro \
  --engine redis \
  --engine-version 7.1 \
  --num-cache-nodes 1 \
  --region $REGION

# Attendre que Redis soit disponible
echo "⏳ Attente Redis (5-10 min)..."
aws elasticache wait cache-cluster-available \
  --cache-cluster-id huntaze-beta-redis \
  --region $REGION

# Récupérer endpoint Redis
REDIS_ENDPOINT=$(aws elasticache describe-cache-clusters \
  --cache-cluster-id huntaze-beta-redis \
  --show-cache-node-info \
  --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
  --output text \
  --region $REGION)

REDIS_URL="redis://$REDIS_ENDPOINT:6379"

# 3. Créer S3 bucket
echo "📦 Création S3 bucket..."
aws s3 mb s3://huntaze-beta-assets --region $REGION

# 4. Déployer sur Vercel
echo "🚀 Déploiement Vercel..."
vercel --prod \
  --env DATABASE_URL="$DATABASE_URL" \
  --env REDIS_URL="$REDIS_URL" \
  --env NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
  --env AZURE_AI_CHAT_ENDPOINT="$AZURE_AI_CHAT_ENDPOINT" \
  --env AZURE_AI_CHAT_KEY="$AZURE_AI_CHAT_KEY"

# 5. Sauvegarder credentials
echo "💾 Sauvegarde credentials..."
cat > .env.production.local <<EOF
DATABASE_URL="$DATABASE_URL"
REDIS_URL="$REDIS_URL"
NEXTAUTH_SECRET="$NEXTAUTH_SECRET"
NEXTAUTH_URL="https://app.huntaze.com"
EOF

echo "✅ Déploiement terminé !"
echo ""
echo "📊 Credentials:"
echo "  DATABASE_URL: $DATABASE_URL"
echo "  REDIS_URL: $REDIS_URL"
echo "  NEXTAUTH_SECRET: $NEXTAUTH_SECRET"
echo ""
echo "🌐 URL: https://app.huntaze.com"
echo "💰 Coût estimé: $62-82/mois"
```

---

## ✅ Checklist de Déploiement

### Pré-requis
- [ ] Compte AWS configuré (317805897534)
- [ ] Compte Vercel créé
- [ ] Compte Azure AI Foundry actif
- [ ] GitHub repo connecté à Vercel
- [ ] AWS CLI installé et configuré
- [ ] Vercel CLI installé

### Déploiement
- [ ] Créer RDS PostgreSQL (db.t4g.micro)
- [ ] Créer ElastiCache Redis (cache.t4g.micro)
- [ ] Créer S3 bucket
- [ ] Déployer sur Vercel
- [ ] Configurer variables d'environnement
- [ ] Run Prisma migrations
- [ ] Créer Lambda cron jobs
- [ ] Configurer EventBridge rules
- [ ] Configurer CloudWatch alarms

### Vérification
- [ ] Health check: `https://app.huntaze.com/api/health`
- [ ] Database connection OK
- [ ] Redis connection OK
- [ ] Azure AI Foundry OK
- [ ] Login flow OK
- [ ] OnlyFans messages OK

---

## 🎯 Prochaines Étapes

1. **Valider l'architecture** avec toi
2. **Exécuter le script de déploiement**
3. **Configurer Vercel**
4. **Tester l'application**
5. **Monitorer les coûts**

**Temps estimé**: 30-45 minutes

---

**Rapport généré le**: 2025-12-22  
**Par**: Kiro AI Assistant  
**Budget**: ✅ $62-82/mois (83% moins cher)
