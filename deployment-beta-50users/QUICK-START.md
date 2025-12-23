# 🚀 Quick Start - Déploiement 50 Users

**Temps**: 45 minutes  
**Budget Réel**: $149-176/mois  
**Budget Disponible**: $1,300/mois ($300 AWS + $1,000 Azure AI)

---

## 📋 Pré-requis

```bash
# Vérifier installations
node --version  # v20+
aws --version
vercel --version  # npm i -g vercel si absent

# Vérifier AWS credentials
aws sts get-caller-identity
```

---

## ⚡ Déploiement (3 étapes)

### 1. Infrastructure AWS (30 min)

```bash
cd deployment-beta-50users
chmod +x deploy.sh
./deploy.sh
```

**Ce qui est créé**:
- RDS PostgreSQL (db.t4g.small) - $35-45/mois
- ElastiCache Redis (cache.t4g.small) - $25-30/mois
- S3 Bucket (150 GB) - $15-20/mois
- Security Groups
- CloudWatch Alarms

### 2. Configuration (10 min)

```bash
# Compléter .env.production.local
nano .env.production.local

# Ajouter:
# AZURE_AI_CHAT_ENDPOINT="https://..."
# AZURE_AI_CHAT_KEY="..."
# QSTASH_TOKEN="..."
# QSTASH_CURRENT_SIGNING_KEY="..."
# QSTASH_NEXT_SIGNING_KEY="..."
```

**Créer compte Upstash**:
1. https://upstash.com → Sign Up
2. Create QStash (région US East)
3. Copier credentials

### 3. Déploiement Vercel (5 min)

```bash
# Login
vercel login

# Déployer
vercel --prod

# Ajouter variables d'environnement
vercel env add DATABASE_URL production
vercel env add REDIS_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add AZURE_AI_CHAT_ENDPOINT production
vercel env add AZURE_AI_CHAT_KEY production
vercel env add QSTASH_TOKEN production
# ... etc (voir .env.production.local)

# Run migrations
npx prisma migrate deploy
```

---

## ✅ Vérification

```bash
# Tester les services
./verify.sh

# Health checks
curl https://app.huntaze.com/api/health
psql $DATABASE_URL -c "SELECT 1;"
redis-cli -h $REDIS_ENDPOINT ping
```

---

## 📊 Monitoring

### Dashboards
- **AWS Cost Explorer**: https://console.aws.amazon.com/cost-management/
- **Vercel Analytics**: https://vercel.com/analytics
- **Upstash QStash**: https://console.upstash.com/qstash
- **CloudWatch**: https://console.aws.amazon.com/cloudwatch/

### Alertes
- RDS CPU > 80%
- Redis Memory > 90%
- AWS Budget > $200/mois

---

## 💰 Budget Mensuel

### AWS ($103-130/mois) - Budget $300
| Service | Coût |
|---------|------|
| Vercel | $20 |
| RDS | $35-45 |
| Redis | $25-30 |
| S3 | $15-20 |
| Lambda | $3-5 |
| QStash | $5-10 |
| **TOTAL AWS** | **$103-130** |

**Marge AWS**: $170-197/mois

### Azure AI (~$46/mois) - Budget $1,000
| Service | Coût |
|---------|------|
| DeepSeek-V3 | ~$34 |
| Phi-4 Multimodal | ~$2.40 |
| DeepSeek-R1 | ~$10 |
| **TOTAL Azure** | **~$46** |

**Marge Azure**: $954/mois

### TOTAL
- **Coût réel**: $149-176/mois
- **Budget disponible**: $1,300/mois
- **Économie**: $1,124-1,151/mois pour scaling

---

## 🆘 Problèmes Courants

### RDS Connection Failed
```bash
# Vérifier endpoint
aws rds describe-db-instances \
  --db-instance-identifier huntaze-beta-db \
  --region us-east-2

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
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
```

---

## 📚 Documentation

- **README.md** - Vue d'ensemble et budget
- **ARCHITECTURE.md** - Architecture technique détaillée
- **PROS-CONS.md** - Avantages et inconvénients
- **deploy.sh** - Script de déploiement
- **verify.sh** - Script de vérification

---

**Prêt à déployer !** 🎉
