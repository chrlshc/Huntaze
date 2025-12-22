# Plan de Déploiement AWS - Huntaze

**Région:** `us-east-2`  
**Account:** `317805897534`  
**Date:** 2024-12-22

---

## Phase 1: Amplify Hosting (Frontend + API Routes)

### 1.1 Créer l'app Amplify

```bash
# Via CLI
aws amplify create-app \
  --name huntaze-prod \
  --region us-east-2 \
  --platform WEB_COMPUTE \
  --iam-service-role-arn arn:aws:iam::317805897534:role/AmplifyServiceRole

# Ou via Console: https://us-east-2.console.aws.amazon.com/amplify/
```

### 1.2 Connecter le repo GitHub

```bash
aws amplify create-branch \
  --app-id <APP_ID> \
  --branch-name main \
  --enable-auto-build \
  --framework "Next.js - SSR"
```

### 1.3 Variables d'environnement requises

```bash
# Dans Amplify Console > App settings > Environment variables
DATABASE_URL=postgresql://user:pass@host:5432/huntaze?sslmode=require
REDIS_HOST=<elasticache-endpoint>
REDIS_PORT=6379
NEXTAUTH_URL=https://app.huntaze.com
NEXTAUTH_SECRET=<generate-with-openssl>
GEMINI_API_KEY=<your-key>
NODE_ENV=production
```

---

## Phase 2: Base de données (RDS PostgreSQL)

### 2.1 Créer le subnet group

```bash
# D'abord créer un VPC dédié
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --region us-east-2 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=huntaze-vpc}]'

# Créer les subnets privés (2 AZs minimum pour RDS)
aws ec2 create-subnet \
  --vpc-id <VPC_ID> \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-2a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=huntaze-private-1}]'

aws ec2 create-subnet \
  --vpc-id <VPC_ID> \
  --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-2b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=huntaze-private-2}]'

# Créer le DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name huntaze-db-subnet \
  --db-subnet-group-description "Huntaze RDS subnets" \
  --subnet-ids subnet-xxx subnet-yyy
```

### 2.2 Créer l'instance RDS

```bash
aws rds create-db-instance \
  --db-instance-identifier huntaze-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16.4 \
  --master-username huntaze_admin \
  --master-user-password <STRONG_PASSWORD> \
  --allocated-storage 20 \
  --storage-type gp3 \
  --vpc-security-group-ids <SG_ID> \
  --db-subnet-group-name huntaze-db-subnet \
  --backup-retention-period 7 \
  --multi-az false \
  --publicly-accessible false \
  --storage-encrypted \
  --region us-east-2
```

**Coût estimé:** ~$15/mois (db.t3.micro)

---

## Phase 3: Cache (ElastiCache Redis)

### 3.1 Créer le cluster Redis

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id huntaze-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --engine-version 7.1 \
  --num-cache-nodes 1 \
  --cache-subnet-group-name huntaze-cache-subnet \
  --security-group-ids <SG_ID> \
  --region us-east-2
```

**Coût estimé:** ~$12/mois (cache.t3.micro)

---

## Phase 4: Storage (S3)

### 4.1 Créer le bucket assets

```bash
aws s3api create-bucket \
  --bucket huntaze-assets-prod \
  --region us-east-2 \
  --create-bucket-configuration LocationConstraint=us-east-2

# Activer le versioning
aws s3api put-bucket-versioning \
  --bucket huntaze-assets-prod \
  --versioning-configuration Status=Enabled

# Bloquer l'accès public
aws s3api put-public-access-block \
  --bucket huntaze-assets-prod \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

---

## Phase 5: Secrets Manager

### 5.1 Stocker les secrets

```bash
aws secretsmanager create-secret \
  --name huntaze/prod/database \
  --secret-string '{"username":"huntaze_admin","password":"<PASSWORD>","host":"<RDS_ENDPOINT>","port":"5432","dbname":"huntaze"}' \
  --region us-east-2

aws secretsmanager create-secret \
  --name huntaze/prod/nextauth \
  --secret-string '{"secret":"<NEXTAUTH_SECRET>"}' \
  --region us-east-2

aws secretsmanager create-secret \
  --name huntaze/prod/gemini \
  --secret-string '{"api_key":"<GEMINI_API_KEY>"}' \
  --region us-east-2
```

---

## Phase 6: Monitoring (CloudWatch)

### 6.1 Activer les alarmes existantes

Les 8 alarmes sont déjà créées mais en `INSUFFICIENT_DATA`. Elles s'activeront automatiquement quand l'app enverra des métriques.

### 6.2 Créer les alarmes critiques manquantes

```bash
# Alarme RDS CPU
aws cloudwatch put-metric-alarm \
  --alarm-name huntaze-rds-cpu-high \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=DBInstanceIdentifier,Value=huntaze-prod \
  --evaluation-periods 2 \
  --alarm-actions <SNS_TOPIC_ARN> \
  --region us-east-2

# Alarme Redis Memory
aws cloudwatch put-metric-alarm \
  --alarm-name huntaze-redis-memory-high \
  --metric-name DatabaseMemoryUsagePercentage \
  --namespace AWS/ElastiCache \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=CacheClusterId,Value=huntaze-redis \
  --evaluation-periods 2 \
  --alarm-actions <SNS_TOPIC_ARN> \
  --region us-east-2
```

---

## Phase 7: Domaine & SSL

### 7.1 Configurer le domaine custom

```bash
# Dans Amplify Console > Domain management
# Ajouter: app.huntaze.com
# Amplify génère automatiquement le certificat SSL
```

---

## Checklist de Déploiement

| Étape | Commande | Statut |
|-------|----------|--------|
| 1. Créer VPC | `aws ec2 create-vpc` | ⬜ TODO |
| 2. Créer Subnets | `aws ec2 create-subnet` | ⬜ TODO |
| 3. Créer Security Groups | `aws ec2 create-security-group` | ⬜ TODO |
| 4. Créer RDS | `aws rds create-db-instance` | ⬜ TODO |
| 5. Créer ElastiCache | `aws elasticache create-cache-cluster` | ⬜ TODO |
| 6. Créer S3 Bucket | `aws s3api create-bucket` | ⬜ TODO |
| 7. Créer Secrets | `aws secretsmanager create-secret` | ⬜ TODO |
| 8. Créer Amplify App | `aws amplify create-app` | ⬜ TODO |
| 9. Connecter GitHub | Amplify Console | ⬜ TODO |
| 10. Configurer Env Vars | Amplify Console | ⬜ TODO |
| 11. Premier déploiement | `git push` | ⬜ TODO |
| 12. Configurer domaine | Amplify Console | ⬜ TODO |
| 13. Vérifier alarmes | CloudWatch | ✅ DONE (8 alarmes) |

---

## Coûts Estimés (Mensuel)

| Service | Tier | Coût |
|---------|------|------|
| Amplify Hosting | Build + Hosting | ~$5-15 |
| RDS PostgreSQL | db.t3.micro | ~$15 |
| ElastiCache Redis | cache.t3.micro | ~$12 |
| S3 | 10GB + requests | ~$1 |
| CloudWatch | Logs + Alarms | ~$3 |
| Secrets Manager | 5 secrets | ~$2 |
| **TOTAL** | | **~$38-48/mois** |

---

## Script de Déploiement Automatisé

Voir `scripts/aws-deploy-infrastructure.sh` pour le script complet.
