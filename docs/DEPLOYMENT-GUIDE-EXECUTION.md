# Guide d'Exécution - Déploiement Huntaze Beta
**Date**: 2025-12-22  
**Budget**: $64-87/mois  
**Durée estimée**: 1h30

---

## 🎯 Vue d'Ensemble

Tu vas déployer Huntaze avec cette architecture:

```
Vercel ($20/mois)
├── Frontend Next.js 16
├── API Routes
└── Background Functions (workers rapides)

AWS Minimal ($42-52/mois)
├── RDS PostgreSQL (db.t4g.micro) - $15/mois
├── ElastiCache Redis (cache.t4g.micro) - $12/mois
├── S3 (assets) - $3/mois
├── Lambda (AI Router Python) - $0.50/mois
├── Lambda (Cron jobs) - $2/mois
└── API Gateway (HTTP API) - $1/mois

Upstash QStash ($2-5/mois)
└── Workers longs (video processing)

Azure AI Foundry ($10-30/mois)
├── DeepSeek-R1 (reasoning)
├── DeepSeek-V3 (generation)
└── Phi-4 Multimodal (vision)
```

**Total**: $64-87/mois ✅

---

## 📋 Pré-requis

### Comptes Requis
- [ ] Compte AWS (317805897534) avec AWS CLI configuré
- [ ] Compte Vercel (gratuit → Hobby $20/mois)
- [ ] Compte Upstash (gratuit → $2-5/mois)
- [ ] Compte Azure AI Foundry (actif)
- [ ] Repo GitHub connecté

### Outils Installés
```bash
# Vérifier installations
node --version  # v20+
npm --version
aws --version
vercel --version  # Si pas installé: npm i -g vercel
```

---

## 🚀 Phase 1: Infrastructure AWS (30 min)

### Étape 1.1: Créer RDS PostgreSQL (10 min)

```bash
# Générer mot de passe sécurisé
DB_PASSWORD=$(openssl rand -base64 32)
echo "DB_PASSWORD=$DB_PASSWORD" >> .env.production.local

# Créer RDS
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
  --region us-east-2 \
  --tags Key=Project,Value=Huntaze Key=Environment,Value=Beta

# Attendre que RDS soit disponible (5-10 min)
echo "⏳ Attente RDS (5-10 min)..."
aws rds wait db-instance-available \
  --db-instance-identifier huntaze-beta-db \
  --region us-east-2

# Récupérer endpoint
DB_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier huntaze-beta-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text \
  --region us-east-2)

DATABASE_URL="postgresql://huntaze:$DB_PASSWORD@$DB_ENDPOINT:5432/huntaze"
echo "DATABASE_URL=$DATABASE_URL" >> .env.production.local
echo "✅ RDS créé: $DB_ENDPOINT"
```

### Étape 1.2: Créer ElastiCache Redis (10 min)

```bash
# Créer Redis
aws elasticache create-cache-cluster \
  --cache-cluster-id huntaze-beta-redis \
  --cache-node-type cache.t4g.micro \
  --engine redis \
  --engine-version 7.1 \
  --num-cache-nodes 1 \
  --region us-east-2 \
  --tags Key=Project,Value=Huntaze Key=Environment,Value=Beta

# Attendre que Redis soit disponible (5-10 min)
echo "⏳ Attente Redis (5-10 min)..."
aws elasticache wait cache-cluster-available \
  --cache-cluster-id huntaze-beta-redis \
  --region us-east-2

# Récupérer endpoint
REDIS_ENDPOINT=$(aws elasticache describe-cache-clusters \
  --cache-cluster-id huntaze-beta-redis \
  --show-cache-node-info \
  --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
  --output text \
  --region us-east-2)

REDIS_URL="redis://$REDIS_ENDPOINT:6379"
echo "REDIS_URL=$REDIS_URL" >> .env.production.local
echo "✅ Redis créé: $REDIS_ENDPOINT"
```

### Étape 1.3: Créer S3 Bucket (2 min)

```bash
# Créer bucket
aws s3 mb s3://huntaze-beta-assets --region us-east-2

# Configurer CORS
cat > /tmp/s3-cors.json <<EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://app.huntaze.com", "https://*.vercel.app"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

aws s3api put-bucket-cors \
  --bucket huntaze-beta-assets \
  --cors-configuration file:///tmp/s3-cors.json \
  --region us-east-2

# Configurer lifecycle
cat > /tmp/s3-lifecycle.json <<EOF
{
  "Rules": [
    {
      "Id": "DeleteTempFiles",
      "Status": "Enabled",
      "Prefix": "temp/",
      "Expiration": { "Days": 7 }
    },
    {
      "Id": "TransitionToIA",
      "Status": "Enabled",
      "Transitions": [
        { "Days": 30, "StorageClass": "STANDARD_IA" }
      ]
    }
  ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
  --bucket huntaze-beta-assets \
  --lifecycle-configuration file:///tmp/s3-lifecycle.json \
  --region us-east-2

echo "AWS_S3_BUCKET=huntaze-beta-assets" >> .env.production.local
echo "✅ S3 bucket créé: huntaze-beta-assets"
```

### Étape 1.4: Configurer Security Groups (5 min)

```bash
# Récupérer VPC par défaut
VPC_ID=$(aws ec2 describe-vpcs \
  --filters "Name=isDefault,Values=true" \
  --query 'Vpcs[0].VpcId' \
  --output text \
  --region us-east-2)

# Créer Security Group pour RDS/Redis (accès public pour beta)
SG_ID=$(aws ec2 create-security-group \
  --group-name huntaze-beta-db-redis \
  --description "Allow PostgreSQL and Redis from anywhere (beta only)" \
  --vpc-id $VPC_ID \
  --region us-east-2 \
  --query 'GroupId' \
  --output text)

# Autoriser PostgreSQL (5432)
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 5432 \
  --cidr 0.0.0.0/0 \
  --region us-east-2

# Autoriser Redis (6379)
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 6379 \
  --cidr 0.0.0.0/0 \
  --region us-east-2

# Appliquer SG à RDS
aws rds modify-db-instance \
  --db-instance-identifier huntaze-beta-db \
  --vpc-security-group-ids $SG_ID \
  --apply-immediately \
  --region us-east-2

# Appliquer SG à Redis
aws elasticache modify-cache-cluster \
  --cache-cluster-id huntaze-beta-redis \
  --security-group-ids $SG_ID \
  --apply-immediately \
  --region us-east-2

echo "✅ Security Groups configurés"
```

---

## 🚀 Phase 2: Déployer AI Router Lambda (20 min)

### Étape 2.1: Préparer le code Python (5 min)

```bash
# Créer dossier de build
mkdir -p /tmp/lambda-ai-router
cd /tmp/lambda-ai-router

# Copier code AI Router
cp -r ~/huntaze/lib/ai/router/* .

# Créer lambda_handler.py (wrapper Mangum)
cat > lambda_handler.py <<'EOF'
from mangum import Mangum
from main import app

# Wrapper Lambda
handler = Mangum(app, lifespan="off")
EOF

# Installer dépendances
pip install -r requirements.txt -t . --platform manylinux2014_x86_64 --only-binary=:all:

# Créer ZIP
zip -r lambda-ai-router.zip . -x "*.pyc" -x "__pycache__/*"

echo "✅ Lambda package créé: lambda-ai-router.zip"
```

### Étape 2.2: Créer IAM Role (3 min)

```bash
# Créer trust policy
cat > /tmp/lambda-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "lambda.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Créer role
aws iam create-role \
  --role-name HuntazeLambdaAIRouterRole \
  --assume-role-policy-document file:///tmp/lambda-trust-policy.json \
  --region us-east-2

# Attacher policy CloudWatch Logs
aws iam attach-role-policy \
  --role-name HuntazeLambdaAIRouterRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
  --region us-east-2

LAMBDA_ROLE_ARN=$(aws iam get-role \
  --role-name HuntazeLambdaAIRouterRole \
  --query 'Role.Arn' \
  --output text)

echo "✅ IAM Role créé: $LAMBDA_ROLE_ARN"
```

### Étape 2.3: Créer Lambda Function (5 min)

```bash
# Créer fonction Lambda
aws lambda create-function \
  --function-name huntaze-ai-router \
  --runtime python3.11 \
  --role $LAMBDA_ROLE_ARN \
  --handler lambda_handler.handler \
  --zip-file fileb://lambda-ai-router.zip \
  --timeout 30 \
  --memory-size 512 \
  --environment Variables="{AZURE_AI_CHAT_ENDPOINT=$AZURE_AI_CHAT_ENDPOINT,AZURE_AI_CHAT_KEY=$AZURE_AI_CHAT_KEY}" \
  --region us-east-2

echo "✅ Lambda AI Router créée"
```

### Étape 2.4: Créer API Gateway (5 min)

```bash
# Créer HTTP API
API_ID=$(aws apigatewayv2 create-api \
  --name huntaze-ai-router \
  --protocol-type HTTP \
  --target arn:aws:lambda:us-east-2:317805897534:function:huntaze-ai-router \
  --query 'ApiId' \
  --output text \
  --region us-east-2)

# Donner permission à API Gateway d'invoquer Lambda
aws lambda add-permission \
  --function-name huntaze-ai-router \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-2:317805897534:$API_ID/*/*" \
  --region us-east-2

# Récupérer URL
AI_ROUTER_URL=$(aws apigatewayv2 get-apis \
  --query "Items[?Name=='huntaze-ai-router'].ApiEndpoint" \
  --output text \
  --region us-east-2)

echo "AI_ROUTER_URL=$AI_ROUTER_URL" >> .env.production.local
echo "✅ API Gateway créé: $AI_ROUTER_URL"
```

---

## 🚀 Phase 3: Configurer Upstash QStash (10 min)

### Étape 3.1: Créer compte Upstash (5 min)

1. Aller sur https://upstash.com
2. Créer un compte (gratuit)
3. Aller dans "QStash" → "Create QStash"
4. Copier les credentials:

```bash
# Ajouter à .env.production.local
echo "QSTASH_TOKEN=your-token-here" >> .env.production.local
echo "QSTASH_CURRENT_SIGNING_KEY=your-signing-key" >> .env.production.local
echo "QSTASH_NEXT_SIGNING_KEY=your-next-signing-key" >> .env.production.local
```

### Étape 3.2: Installer package (2 min)

```bash
cd ~/huntaze
npm install @upstash/qstash
```

---

## 🚀 Phase 4: Déployer sur Vercel (20 min)

### Étape 4.1: Préparer variables d'environnement (5 min)

```bash
# Générer NEXTAUTH_SECRET
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET" >> .env.production.local

# Créer fichier .env.production pour Vercel
cat > .env.production <<EOF
# Database
DATABASE_URL=$DATABASE_URL
REDIS_URL=$REDIS_URL

# Auth
NEXTAUTH_URL=https://app.huntaze.com
NEXTAUTH_SECRET=$NEXTAUTH_SECRET

# AWS
AWS_REGION=us-east-2
AWS_S3_BUCKET=huntaze-beta-assets
CDN_URL=https://huntaze-beta-assets.s3.us-east-2.amazonaws.com

# AI Router
AI_ROUTER_URL=$AI_ROUTER_URL

# Azure AI Foundry
AZURE_AI_CHAT_ENDPOINT=$AZURE_AI_CHAT_ENDPOINT
AZURE_AI_CHAT_KEY=$AZURE_AI_CHAT_KEY

# Upstash QStash
QSTASH_TOKEN=$QSTASH_TOKEN
QSTASH_CURRENT_SIGNING_KEY=$QSTASH_CURRENT_SIGNING_KEY
QSTASH_NEXT_SIGNING_KEY=$QSTASH_NEXT_SIGNING_KEY

# Feature Flags
NODE_ENV=production
ENABLE_RATE_LIMITING=true
ENABLE_CACHING=true
EOF

echo "✅ Variables d'environnement préparées"
```

### Étape 4.2: Déployer sur Vercel (10 min)

```bash
# Login Vercel
vercel login

# Déployer
vercel --prod

# Ajouter variables d'environnement
while IFS='=' read -r key value; do
  [[ $key =~ ^#.*$ ]] && continue
  [[ -z $key ]] && continue
  vercel env add $key production <<< "$value"
done < .env.production

echo "✅ Déployé sur Vercel"
```

### Étape 4.3: Configurer domaine (5 min)

```bash
# Ajouter domaine custom (optionnel)
vercel domains add app.huntaze.com

# Ou utiliser domaine Vercel par défaut
# https://huntaze-xxx.vercel.app
```

---

## 🚀 Phase 5: Migrations Database (10 min)

### Étape 5.1: Run Prisma Migrations

```bash
cd ~/huntaze

# Générer Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Vérifier tables
npx prisma db pull

echo "✅ Migrations appliquées"
```

### Étape 5.2: Seed Initial Data (optionnel)

```bash
# Créer seed script si nécessaire
npx prisma db seed
```

---

## ✅ Phase 6: Tests & Vérification (10 min)

### Étape 6.1: Health Checks

```bash
# Test AI Router
curl $AI_ROUTER_URL/health

# Test Vercel
curl https://app.huntaze.com/api/health

# Test Database
psql $DATABASE_URL -c "SELECT 1;"

# Test Redis
redis-cli -h $REDIS_ENDPOINT ping
```

### Étape 6.2: Tests Fonctionnels

1. **Login Flow**
   - Aller sur https://app.huntaze.com
   - Créer un compte
   - Vérifier email
   - Login

2. **OnlyFans Messages**
   - Aller sur /onlyfans/messages
   - Vérifier interface 3 colonnes
   - Tester AI suggestions

3. **Content Upload**
   - Aller sur /content
   - Upload une vidéo
   - Vérifier processing (QStash)

4. **Analytics**
   - Aller sur /analytics
   - Vérifier métriques

---

## 📊 Monitoring & Alertes

### CloudWatch Alarms

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

# Alarme Lambda Errors
aws cloudwatch put-metric-alarm \
  --alarm-name huntaze-beta-lambda-errors \
  --alarm-description "Lambda Errors > 5" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --dimensions Name=FunctionName,Value=huntaze-ai-router \
  --region us-east-2

echo "✅ CloudWatch Alarms configurées"
```

### Vercel Monitoring

- Dashboard: https://vercel.com/dashboard
- Logs: `vercel logs --follow`
- Analytics: https://vercel.com/analytics

### Upstash Monitoring

- Dashboard: https://console.upstash.com/qstash
- Voir tous les messages
- Retry failed messages
- Dead Letter Queue

---

## 💰 Vérification des Coûts

### AWS Cost Explorer

```bash
# Voir coûts du mois en cours
aws ce get-cost-and-usage \
  --time-period Start=$(date -d "$(date +%Y-%m-01)" +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --region us-east-1

# Activer Budget Alert
aws budgets create-budget \
  --account-id 317805897534 \
  --budget file://budget.json \
  --notifications-with-subscribers file://notifications.json
```

**budget.json**:
```json
{
  "BudgetName": "Huntaze-Beta-Monthly",
  "BudgetLimit": {
    "Amount": "100",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST"
}
```

**notifications.json**:
```json
[
  {
    "Notification": {
      "NotificationType": "ACTUAL",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 80,
      "ThresholdType": "PERCENTAGE"
    },
    "Subscribers": [
      {
        "SubscriptionType": "EMAIL",
        "Address": "alerts@huntaze.com"
      }
    ]
  }
]
```

---

## 🔧 Troubleshooting

### RDS Connection Failed
```bash
# Vérifier Security Group
aws ec2 describe-security-groups --group-ids $SG_ID --region us-east-2

# Vérifier endpoint
aws rds describe-db-instances \
  --db-instance-identifier huntaze-beta-db \
  --query 'DBInstances[0].Endpoint' \
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

### Lambda Errors
```bash
# Voir logs
aws logs tail /aws/lambda/huntaze-ai-router --follow --region us-east-2

# Tester invocation
aws lambda invoke \
  --function-name huntaze-ai-router \
  --payload '{"httpMethod":"GET","path":"/health"}' \
  /tmp/response.json \
  --region us-east-2

cat /tmp/response.json
```

### Vercel Build Failed
```bash
# Voir logs
vercel logs

# Rebuild
vercel --prod --force
```

---

## 📝 Checklist Finale

### Infrastructure
- [ ] RDS PostgreSQL créé et accessible
- [ ] ElastiCache Redis créé et accessible
- [ ] S3 bucket créé avec CORS/lifecycle
- [ ] Security Groups configurés
- [ ] Lambda AI Router déployée
- [ ] API Gateway configuré
- [ ] Upstash QStash configuré

### Application
- [ ] Vercel déployé
- [ ] Variables d'environnement configurées
- [ ] Domaine configuré
- [ ] Prisma migrations appliquées
- [ ] Health checks OK

### Monitoring
- [ ] CloudWatch Alarms configurées
- [ ] AWS Budget Alert configuré
- [ ] Vercel Analytics activé
- [ ] Upstash Dashboard vérifié

### Tests
- [ ] Login flow OK
- [ ] OnlyFans messages OK
- [ ] Content upload OK
- [ ] Analytics OK
- [ ] AI suggestions OK

---

## 🎉 Déploiement Terminé !

**URL Production**: https://app.huntaze.com  
**Coût Mensuel**: $64-87/mois  
**Temps Total**: ~1h30

### Prochaines Étapes

1. **Monitorer les coûts** (AWS Cost Explorer + Vercel Dashboard)
2. **Optimiser les performances** (CloudWatch Insights)
3. **Ajouter des features** (workers, automations, etc.)
4. **Scaler si nécessaire** (augmenter RDS/Redis size)

---

**Guide créé le**: 2025-12-22  
**Par**: Kiro AI Assistant  
**Statut**: ✅ PRÊT À EXÉCUTER
