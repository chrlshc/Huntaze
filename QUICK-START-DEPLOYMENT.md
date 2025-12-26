# 🚀 Huntaze Beta - Quick Start Deployment

**Budget**: $64-87/mois | **Durée**: 1h30 | **Date**: 2025-12-22

> 📚 **Documentation complète**: [docs/README.md](docs/README.md)

---

## 📋 Pré-requis (5 min)

```bash
# Vérifier installations
node --version  # v20+
aws --version
vercel --version  # npm i -g vercel si absent

# Vérifier AWS credentials
aws sts get-caller-identity

# Cloner repo (si pas déjà fait)
git clone https://github.com/your-org/huntaze.git
cd huntaze
```

---

## ⚡ Déploiement Automatique (30 min)

### Option A: Script Automatisé (Recommandé)

```bash
# 1. Rendre le script exécutable
chmod +x scripts/deploy-beta-complete.sh

# 2. Exécuter le déploiement
./scripts/deploy-beta-complete.sh

# 3. Compléter les variables Azure AI Foundry
nano .env.production.local
# Ajouter:
# AZURE_AI_CHAT_ENDPOINT="https://..."
# AZURE_AI_CHAT_KEY="..."

# 4. Créer compte Upstash et ajouter credentials
# Voir: docs/UPSTASH-QSTASH-SETUP.md
nano .env.production.local
# Ajouter:
# QSTASH_TOKEN="..."
# QSTASH_CURRENT_SIGNING_KEY="..."
# QSTASH_NEXT_SIGNING_KEY="..."
```

---

## 🎯 Déploiement Manuel (1h30)

### Étape 1: Infrastructure AWS (30 min)

```bash
# RDS PostgreSQL
DB_PASSWORD=$(openssl rand -base64 32)
aws rds create-db-instance \
  --db-instance-identifier huntaze-beta-db \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --engine-version 16.1 \
  --master-username huntaze \
  --master-user-password "$DB_PASSWORD" \
  --allocated-storage 20 \
  --storage-type gp3 \
  --publicly-accessible \
  --region us-east-2

# ElastiCache Redis
aws elasticache create-cache-cluster \
  --cache-cluster-id huntaze-beta-redis \
  --cache-node-type cache.t4g.micro \
  --engine redis \
  --engine-version 7.1 \
  --num-cache-nodes 1 \
  --region us-east-2

# S3 Bucket
aws s3 mb s3://huntaze-beta-assets --region us-east-2

# Attendre 10 minutes que RDS et Redis soient disponibles
```

### Étape 2: Upstash QStash (10 min)

```bash
# 1. Créer compte: https://upstash.com
# 2. Créer QStash (région US East)
# 3. Copier credentials dans .env.production.local
# 4. Installer package
npm install @upstash/qstash
```

### Étape 3: Déployer sur Vercel (20 min)

```bash
# 1. Login
vercel login

# 2. Déployer
vercel --prod

# 3. Ajouter variables d'environnement
# Voir .env.production.local pour les valeurs
vercel env add DATABASE_URL production
vercel env add REDIS_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add AZURE_AI_CHAT_ENDPOINT production
vercel env add AZURE_AI_CHAT_KEY production
vercel env add QSTASH_TOKEN production
# ... etc
```

### Étape 4: Migrations Database (10 min)

```bash
# Générer Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Vérifier
npx prisma db pull
```

---

## ✅ Vérification (10 min)

```bash
# Rendre le script exécutable
chmod +x scripts/verify-deployment.sh

# Exécuter les tests
./scripts/verify-deployment.sh
```

**Tests effectués**:
- ✅ RDS PostgreSQL accessible
- ✅ ElastiCache Redis accessible
- ✅ S3 bucket accessible
- ✅ Lambda AI Router (si déployé)
- ✅ CloudWatch Alarms configurées
- ✅ Vercel déployé
- ✅ Variables d'environnement
- ✅ Coûts AWS < $100/mois

---

## 🧪 Tests Fonctionnels (10 min)

### 1. Health Check

```bash
# API Health
curl https://app.huntaze.com/api/health

# AI Router Health (si déployé)
curl $AI_ROUTER_URL/health

# Database
psql $DATABASE_URL -c "SELECT 1;"

# Redis
redis-cli -h $REDIS_ENDPOINT ping
```

### 2. Login Flow

1. Aller sur https://app.huntaze.com
2. Créer un compte
3. Vérifier email
4. Login

### 3. OnlyFans Messages

1. Aller sur /onlyfans/messages
2. Vérifier interface 3 colonnes
3. Tester AI suggestions

### 4. Content Upload

1. Aller sur /content
2. Upload une vidéo
3. Vérifier processing (QStash)

---

## 📊 Monitoring

### AWS CloudWatch

```bash
# Voir logs Lambda
aws logs tail /aws/lambda/huntaze-beta-ai-router --follow

# Voir alarmes
aws cloudwatch describe-alarms --alarm-name-prefix huntaze-beta

# Voir coûts
aws ce get-cost-and-usage \
  --time-period Start=$(date -d "$(date +%Y-%m-01)" +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost
```

### Vercel

```bash
# Voir logs
vercel logs --follow

# Voir deployments
vercel ls

# Voir analytics
# https://vercel.com/analytics
```

### Upstash QStash

```bash
# Dashboard
# https://console.upstash.com/qstash

# Voir messages
# Messages → Filter by status

# Retry failed
# Messages → Failed → Retry
```

---

## 💰 Coûts Estimés

| Service | Coût/mois |
|---------|-----------|
| **Vercel** (Hobby) | $20 |
| **RDS** (db.t4g.micro) | $15 |
| **ElastiCache** (cache.t4g.micro) | $12 |
| **S3** (10 GB) | $3 |
| **Lambda** (AI Router) | $0.50 |
| **Lambda** (Cron jobs) | $2 |
| **Upstash QStash** | $0-5 |
| **Azure AI Foundry** | $10-30 |
| **CloudWatch** | $0 (gratuit) |
| **TOTAL** | **$62-87/mois** ✅ |

---

## 🔧 Troubleshooting

### RDS Connection Failed

```bash
# Vérifier endpoint
aws rds describe-db-instances \
  --db-instance-identifier huntaze-beta-db \
  --query 'DBInstances[0].Endpoint' \
  --region us-east-2

# Vérifier Security Group
aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=huntaze-beta-db-redis" \
  --region us-east-2

# Test connection
psql $DATABASE_URL -c "SELECT version();"
```

### Redis Connection Failed

```bash
# Vérifier endpoint
aws elasticache describe-cache-clusters \
  --cache-cluster-id huntaze-beta-redis \
  --show-cache-node-info \
  --region us-east-2

# Test connection
redis-cli -h $REDIS_ENDPOINT ping
```

### Vercel Build Failed

```bash
# Voir logs
vercel logs

# Rebuild
vercel --prod --force

# Vérifier variables
vercel env ls
```

### QStash Messages Failed

```bash
# Voir dashboard
# https://console.upstash.com/qstash

# Vérifier worker URL
curl https://app.huntaze.com/api/workers/video-processing

# Vérifier signing keys
echo $QSTASH_CURRENT_SIGNING_KEY
```

---

## 📚 Documentation Complète

- **Guide d'Exécution**: `docs/DEPLOYMENT-GUIDE-EXECUTION.md`
- **Architecture Budget**: `docs/AWS-BETA-BUDGET-DEPLOYMENT.md`
- **Workers Solution**: `docs/AWS-WORKERS-BUDGET-SOLUTION.md`
- **Upstash Setup**: `docs/UPSTASH-QSTASH-SETUP.md`
- **App Scan**: `docs/AWS-APP-INFRASTRUCTURE-SCAN.md`

---

## 🎉 Déploiement Terminé !

**URL Production**: https://app.huntaze.com  
**Coût Mensuel**: $64-87/mois  
**Économies**: 83% vs architecture initiale ($383-568/mois)

### Prochaines Étapes

1. **Monitorer les coûts** (AWS Cost Explorer)
2. **Optimiser les performances** (CloudWatch Insights)
3. **Ajouter des features** (workers, automations)
4. **Scaler si nécessaire** (augmenter RDS/Redis)

---

## 🆘 Support

- **AWS Issues**: Vérifier CloudWatch Logs
- **Vercel Issues**: `vercel logs --follow`
- **QStash Issues**: https://console.upstash.com/qstash
- **Database Issues**: `psql $DATABASE_URL`

---

**Guide créé le**: 2025-12-22  
**Par**: Kiro AI Assistant  
**Statut**: ✅ PRÊT À DÉPLOYER
