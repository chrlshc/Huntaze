# 🚀 Huntaze Beta - Commandes Essentielles

Toutes les commandes utiles pour déployer et gérer Huntaze Beta.

---

## 📦 Déploiement

### Déploiement Automatique
```bash
# Déploiement complet AWS
./scripts/deploy-beta-complete.sh

# Vérification post-déploiement
./scripts/verify-deployment.sh

# Rollback (si problème)
./scripts/rollback-deployment.sh
```

### Déploiement Vercel
```bash
# Login
vercel login

# Déployer en production
vercel --prod

# Déployer avec force rebuild
vercel --prod --force

# Lister les déploiements
vercel ls

# Supprimer un déploiement
vercel rm <deployment-url>
```

---

## 🔧 Configuration

### Variables d'Environnement Vercel
```bash
# Ajouter une variable
vercel env add <VAR_NAME> production

# Lister les variables
vercel env ls

# Supprimer une variable
vercel env rm <VAR_NAME> production

# Pull les variables localement
vercel env pull .env.local
```

### Générer des Secrets
```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# ENCRYPTION_KEY (32 caractères)
openssl rand -hex 32

# JWT_SECRET
openssl rand -base64 32

# Mot de passe RDS
openssl rand -base64 32
```

---

## 🗄️ Database (Prisma)

### Migrations
```bash
# Générer Prisma Client
npx prisma generate

# Créer une migration
npx prisma migrate dev --name <migration-name>

# Appliquer les migrations en production
npx prisma migrate deploy

# Reset database (DEV ONLY)
npx prisma migrate reset

# Pull schema depuis la DB
npx prisma db pull

# Push schema vers la DB (sans migration)
npx prisma db push
```

### Prisma Studio
```bash
# Ouvrir Prisma Studio (GUI)
npx prisma studio
```

### Database Connection
```bash
# Se connecter à RDS
psql $DATABASE_URL

# Tester la connexion
psql $DATABASE_URL -c "SELECT 1;"

# Voir les tables
psql $DATABASE_URL -c "\dt"

# Voir la version PostgreSQL
psql $DATABASE_URL -c "SELECT version();"
```

---

## 🔴 Redis

### Connection
```bash
# Se connecter à Redis
redis-cli -h $REDIS_ENDPOINT

# Tester la connexion
redis-cli -h $REDIS_ENDPOINT ping

# Voir les clés
redis-cli -h $REDIS_ENDPOINT KEYS '*'

# Voir la mémoire utilisée
redis-cli -h $REDIS_ENDPOINT INFO memory

# Flush toutes les clés (DANGER)
redis-cli -h $REDIS_ENDPOINT FLUSHALL
```

---

## ☁️ AWS

### RDS
```bash
# Lister les instances RDS
aws rds describe-db-instances --region us-east-2

# Voir l'endpoint RDS
aws rds describe-db-instances \
  --db-instance-identifier huntaze-beta-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text \
  --region us-east-2

# Modifier RDS (ex: augmenter la taille)
aws rds modify-db-instance \
  --db-instance-identifier huntaze-beta-db \
  --db-instance-class db.t4g.small \
  --apply-immediately \
  --region us-east-2

# Créer un snapshot
aws rds create-db-snapshot \
  --db-instance-identifier huntaze-beta-db \
  --db-snapshot-identifier huntaze-beta-snapshot-$(date +%Y%m%d) \
  --region us-east-2
```

### ElastiCache Redis
```bash
# Lister les clusters Redis
aws elasticache describe-cache-clusters --region us-east-2

# Voir l'endpoint Redis
aws elasticache describe-cache-clusters \
  --cache-cluster-id huntaze-beta-redis \
  --show-cache-node-info \
  --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
  --output text \
  --region us-east-2

# Modifier Redis (ex: augmenter la taille)
aws elasticache modify-cache-cluster \
  --cache-cluster-id huntaze-beta-redis \
  --cache-node-type cache.t4g.small \
  --apply-immediately \
  --region us-east-2
```

### S3
```bash
# Lister les buckets
aws s3 ls

# Lister les fichiers dans un bucket
aws s3 ls s3://huntaze-beta-assets --recursive

# Upload un fichier
aws s3 cp file.txt s3://huntaze-beta-assets/

# Download un fichier
aws s3 cp s3://huntaze-beta-assets/file.txt .

# Supprimer un fichier
aws s3 rm s3://huntaze-beta-assets/file.txt

# Vider un bucket
aws s3 rm s3://huntaze-beta-assets --recursive

# Voir la taille du bucket
aws s3 ls s3://huntaze-beta-assets --recursive --summarize
```

### Lambda
```bash
# Lister les fonctions Lambda
aws lambda list-functions --region us-east-2

# Voir les logs Lambda
aws logs tail /aws/lambda/huntaze-beta-ai-router --follow --region us-east-2

# Invoquer une fonction Lambda
aws lambda invoke \
  --function-name huntaze-beta-ai-router \
  --payload '{"httpMethod":"GET","path":"/health"}' \
  /tmp/response.json \
  --region us-east-2

cat /tmp/response.json

# Mettre à jour le code Lambda
aws lambda update-function-code \
  --function-name huntaze-beta-ai-router \
  --zip-file fileb://lambda.zip \
  --region us-east-2

# Mettre à jour les variables d'environnement
aws lambda update-function-configuration \
  --function-name huntaze-beta-ai-router \
  --environment Variables="{AZURE_AI_CHAT_ENDPOINT=$AZURE_ENDPOINT,AZURE_AI_CHAT_KEY=$AZURE_KEY}" \
  --region us-east-2
```

### CloudWatch
```bash
# Lister les alarmes
aws cloudwatch describe-alarms --region us-east-2

# Voir les alarmes actives
aws cloudwatch describe-alarms \
  --state-value ALARM \
  --region us-east-2

# Voir les logs d'un groupe
aws logs tail /aws/lambda/huntaze-beta-ai-router --follow --region us-east-2

# Créer une alarme
aws cloudwatch put-metric-alarm \
  --alarm-name huntaze-beta-test \
  --alarm-description "Test alarm" \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --region us-east-2
```

### Coûts
```bash
# Voir les coûts du mois en cours
aws ce get-cost-and-usage \
  --time-period Start=$(date -d "$(date +%Y-%m-01)" +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --region us-east-1

# Voir les coûts par service
aws ce get-cost-and-usage \
  --time-period Start=$(date -d "$(date +%Y-%m-01)" +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE \
  --region us-east-1
```

---

## 📊 Monitoring

### Vercel
```bash
# Voir les logs
vercel logs

# Voir les logs en temps réel
vercel logs --follow

# Voir les logs d'un déploiement spécifique
vercel logs <deployment-url>

# Voir les analytics
# https://vercel.com/analytics
```

### Upstash QStash
```bash
# Dashboard
# https://console.upstash.com/qstash

# Tester un worker
curl https://app.huntaze.com/api/workers/video-processing

# Voir le status d'un message
curl "https://app.huntaze.com/api/workers/status?messageId=<message-id>"
```

### Health Checks
```bash
# API Health
curl https://app.huntaze.com/api/health

# AI Router Health
curl $AI_ROUTER_URL/health

# Database
psql $DATABASE_URL -c "SELECT 1;"

# Redis
redis-cli -h $REDIS_ENDPOINT ping
```

---

## 🔧 Troubleshooting

### Vérifier les Services
```bash
# Vérifier RDS
aws rds describe-db-instances \
  --db-instance-identifier huntaze-beta-db \
  --query 'DBInstances[0].DBInstanceStatus' \
  --region us-east-2

# Vérifier Redis
aws elasticache describe-cache-clusters \
  --cache-cluster-id huntaze-beta-redis \
  --query 'CacheClusters[0].CacheClusterStatus' \
  --region us-east-2

# Vérifier Lambda
aws lambda get-function \
  --function-name huntaze-beta-ai-router \
  --query 'Configuration.State' \
  --region us-east-2

# Vérifier S3
aws s3 ls s3://huntaze-beta-assets
```

### Vérifier les Security Groups
```bash
# Lister les Security Groups
aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=huntaze-beta-*" \
  --region us-east-2

# Voir les règles d'un Security Group
aws ec2 describe-security-groups \
  --group-ids <sg-id> \
  --region us-east-2
```

### Vérifier les Variables d'Environnement
```bash
# Vercel
vercel env ls

# Lambda
aws lambda get-function-configuration \
  --function-name huntaze-beta-ai-router \
  --query 'Environment.Variables' \
  --region us-east-2

# Local
cat .env.production.local
```

---

## 🧹 Nettoyage

### Supprimer les Ressources AWS
```bash
# Rollback complet
./scripts/rollback-deployment.sh

# Ou manuellement:

# Supprimer RDS
aws rds delete-db-instance \
  --db-instance-identifier huntaze-beta-db \
  --skip-final-snapshot \
  --region us-east-2

# Supprimer Redis
aws elasticache delete-cache-cluster \
  --cache-cluster-id huntaze-beta-redis \
  --region us-east-2

# Supprimer S3 bucket
aws s3 rm s3://huntaze-beta-assets --recursive
aws s3 rb s3://huntaze-beta-assets

# Supprimer Lambda
aws lambda delete-function \
  --function-name huntaze-beta-ai-router \
  --region us-east-2
```

### Supprimer Vercel
```bash
# Supprimer un déploiement
vercel rm <deployment-url>

# Supprimer toutes les variables d'environnement
vercel env rm <VAR_NAME> production
```

---

## 📚 Ressources

### Documentation
- **AWS CLI**: https://docs.aws.amazon.com/cli/
- **Vercel CLI**: https://vercel.com/docs/cli
- **Prisma CLI**: https://www.prisma.io/docs/reference/api-reference/command-reference
- **Redis CLI**: https://redis.io/docs/manual/cli/

### Dashboards
- **AWS Console**: https://console.aws.amazon.com/
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Upstash Dashboard**: https://console.upstash.com/
- **Azure AI Foundry**: https://ai.azure.com/

---

**Cheatsheet créé le**: 2025-12-22  
**Par**: Kiro AI Assistant  
**Statut**: ✅ COMPLET
