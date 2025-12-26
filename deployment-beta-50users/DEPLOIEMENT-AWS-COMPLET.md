# 🎉 Déploiement AWS Complété!

**Date**: 23 décembre 2025  
**Région**: us-east-2 (Ohio)  
**Statut**: ✅ Infrastructure déployée, secrets à finaliser

---

## 📊 Résumé Rapide

✅ **RDS PostgreSQL 16.11** - db.t4g.micro - 20GB  
✅ **Redis Serverless** - Auto-scaling  
✅ **S3 Bucket** - Versioning + Lifecycle  
✅ **VPC + Security Groups** - 2 AZs  
⏳ **Secrets Manager** - À finaliser

**Coût estimé**: ~$46-61/mois

---

## 🚀 Prochaine Étape: Finaliser les Secrets

### Option 1: Script Automatique (RECOMMANDÉ)
```bash
./deployment-beta-50users/scripts/finalize-aws-setup.sh
```

Ce script va:
1. Récupérer tous les endpoints
2. Te demander de générer un nouveau mot de passe OU entrer l'existant
3. Créer les secrets dans AWS Secrets Manager
4. Générer le fichier de config
5. Afficher les variables pour Vercel

### Option 2: Manuel

#### 1. Générer un nouveau mot de passe RDS
```bash
NEW_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

aws rds modify-db-instance \
  --region us-east-2 \
  --db-instance-identifier huntaze-beta-db \
  --master-user-password "$NEW_PASSWORD" \
  --apply-immediately

echo "Nouveau mot de passe: $NEW_PASSWORD"
```

#### 2. Créer les secrets
```bash
# DATABASE_URL
DATABASE_URL="postgresql://huntaze_admin:$NEW_PASSWORD@huntaze-beta-db.c5ugu8oea3qv.us-east-2.rds.amazonaws.com:5432/huntaze_production"

aws secretsmanager create-secret \
  --region us-east-2 \
  --name "huntaze/beta/database-url" \
  --secret-string "$DATABASE_URL"

# REDIS_URL
REDIS_URL="redis://huntaze-beta-redis-dmgoy6.serverless.use2.cache.amazonaws.com:6379"

aws secretsmanager create-secret \
  --region us-east-2 \
  --name "huntaze/beta/redis-url" \
  --secret-string "$REDIS_URL"
```

---

## 📋 Ressources Déployées

### RDS PostgreSQL
```
Endpoint: huntaze-beta-db.c5ugu8oea3qv.us-east-2.rds.amazonaws.com
Port: 5432
Database: huntaze_production
Username: huntaze_admin
Engine: PostgreSQL 16.11
Instance: db.t4g.micro
Storage: 20 GB gp3
```

### ElastiCache Redis
```
Endpoint: huntaze-beta-redis-dmgoy6.serverless.use2.cache.amazonaws.com
Port: 6379
Engine: Redis 7 Serverless
Auto-scaling: Oui
```

### S3 Bucket
```
Name: huntaze-beta-storage-1766460248
Region: us-east-2
Versioning: Enabled
Lifecycle: temp/ (7j), videos/ (30j → IA)
```

### Networking
```
VPC: vpc-07769b343ae40a638
Subnets: 
  - subnet-00b7422149f5745ab (us-east-2a)
  - subnet-0e743017fa5ebadbb (us-east-2b)
Security Groups:
  - RDS: sg-0d2f753f72c2046e1
  - Redis: sg-0a9b1e678aac92154
```

---

## 🔧 Configuration Vercel

Une fois les secrets créés, ajoute ces variables dans Vercel:

### Variables Critiques
```bash
# Database
DATABASE_URL=postgresql://huntaze_admin:PASSWORD@huntaze-beta-db.c5ugu8oea3qv.us-east-2.rds.amazonaws.com:5432/huntaze_production

# Redis
REDIS_URL=redis://huntaze-beta-redis-dmgoy6.serverless.use2.cache.amazonaws.com:6379

# AWS
AWS_REGION=us-east-2
AWS_S3_BUCKET=huntaze-beta-storage-1766460248
AWS_ACCESS_KEY_ID=<ton_access_key>
AWS_SECRET_ACCESS_KEY=<ton_secret_key>

# Service Bus (déjà configuré)
SERVICEBUS_CONNECTION_SEND=Endpoint=sb://huntaze-sb-1eaef9fe.servicebus.windows.net/;SharedAccessKeyName=vercel-send;SharedAccessKey=REDACTED

# NextAuth
NEXTAUTH_URL=https://ton-app.vercel.app
NEXTAUTH_SECRET=<générer avec: openssl rand -base64 32>

# Encryption
ENCRYPTION_KEY=<générer avec: openssl rand -hex 32>
```

### Variables Azure AI (déjà exportées)
```bash
AZURE_DEEPSEEK_V3_ENDPOINT=https://huntaze-ai-deepseek-v3.francecentral.models.ai.azure.com
AZURE_DEEPSEEK_R1_ENDPOINT=https://huntaze-ai-deepseek-r1.francecentral.models.ai.azure.com
AZURE_PHI4_MULTIMODAL_ENDPOINT=https://huntaze-ai-phi4-multimodal.francecentral.models.ai.azure.com
AZURE_AI_API_KEY=<ta_clé>
```

---

## 🧪 Tests de Connexion

### Test PostgreSQL
```bash
# Avec psql
psql "postgresql://huntaze_admin:PASSWORD@huntaze-beta-db.c5ugu8oea3qv.us-east-2.rds.amazonaws.com:5432/huntaze_production"

# Ou avec Node.js
node -e "const { Client } = require('pg'); const client = new Client('postgresql://...'); client.connect().then(() => console.log('✅ Connected')).catch(console.error);"
```

### Test Redis
```bash
# Avec redis-cli
redis-cli -h huntaze-beta-redis-dmgoy6.serverless.use2.cache.amazonaws.com -p 6379 ping

# Devrait retourner: PONG
```

### Test S3
```bash
# Lister le bucket
aws s3 ls s3://huntaze-beta-storage-1766460248 --region us-east-2

# Upload test
echo "test" > test.txt
aws s3 cp test.txt s3://huntaze-beta-storage-1766460248/test.txt --region us-east-2
```

---

## 🗄️ Initialiser la Base de Données

```bash
# 1. Exporter DATABASE_URL
export DATABASE_URL="postgresql://huntaze_admin:PASSWORD@huntaze-beta-db.c5ugu8oea3qv.us-east-2.rds.amazonaws.com:5432/huntaze_production"

# 2. Pousser le schéma Prisma
npx prisma db push

# Ou si tu as des migrations
npx prisma migrate deploy

# 3. Seed (optionnel)
npx prisma db seed
```

---

## 🔒 Sécurité - À FAIRE

### ⚠️ URGENT (avant production):

1. **Restreindre les Security Groups**
```bash
# Actuellement: 0.0.0.0/0 (tout le monde)
# À faire: Restreindre aux IPs Vercel uniquement

# Révoquer l'accès public
aws ec2 revoke-security-group-ingress \
  --region us-east-2 \
  --group-id sg-0d2f753f72c2046e1 \
  --protocol tcp --port 5432 --cidr 0.0.0.0/0

# Ajouter les IPs Vercel (obtenir via: https://vercel.com/docs/concepts/edge-network/regions)
aws ec2 authorize-security-group-ingress \
  --region us-east-2 \
  --group-id sg-0d2f753f72c2046e1 \
  --protocol tcp --port 5432 --cidr 76.76.21.0/24
```

2. **Activer SSL/TLS**
```bash
# RDS: Forcer SSL
aws rds modify-db-instance \
  --region us-east-2 \
  --db-instance-identifier huntaze-beta-db \
  --db-parameter-group-name <créer un parameter group avec rds.force_ssl=1>

# Redis: Activer TLS
aws elasticache modify-serverless-cache \
  --region us-east-2 \
  --serverless-cache-name huntaze-beta-redis \
  --security-group-ids sg-0a9b1e678aac92154 \
  --transit-encryption-enabled
```

3. **Configurer IAM Roles** (au lieu d'access keys)
4. **Activer CloudWatch Logs**
5. **Configurer AWS Backup**

---

## 📊 Monitoring

### CloudWatch Alarmes Recommandées
```bash
# RDS CPU
aws cloudwatch put-metric-alarm \
  --alarm-name huntaze-beta-rds-cpu \
  --alarm-description "RDS CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=DBInstanceIdentifier,Value=huntaze-beta-db

# RDS Storage
aws cloudwatch put-metric-alarm \
  --alarm-name huntaze-beta-rds-storage \
  --alarm-description "RDS Storage < 20%" \
  --metric-name FreeStorageSpace \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 4000000000 \
  --comparison-operator LessThanThreshold \
  --dimensions Name=DBInstanceIdentifier,Value=huntaze-beta-db
```

---

## 💰 Coûts Détaillés

| Service | Configuration | Coût/mois | Coût/an |
|---------|--------------|-----------|---------|
| RDS PostgreSQL | db.t4g.micro, 20GB, Multi-AZ disabled | $15 | $180 |
| ElastiCache Redis | Serverless, minimal usage | $25-40 | $300-480 |
| S3 | 10GB + 1000 requests | $5 | $60 |
| Data Transfer | 10GB sortant | $1 | $12 |
| Secrets Manager | 2 secrets | $1 | $12 |
| **TOTAL** | | **$47-62** | **$564-744** |

### Optimisations Possibles:
- **RDS**: Passer à Reserved Instance (-40%)
- **Redis**: Utiliser ElastiCache t4g.micro au lieu de Serverless (-50%)
- **S3**: Activer Intelligent-Tiering (-30% sur stockage)

**Coût optimisé**: ~$30-35/mois

---

## 🗑️ Rollback / Nettoyage

Si tu veux tout supprimer:

```bash
# 1. Supprimer RDS
aws rds delete-db-instance \
  --region us-east-2 \
  --db-instance-identifier huntaze-beta-db \
  --skip-final-snapshot

# 2. Supprimer Redis
aws elasticache delete-serverless-cache \
  --region us-east-2 \
  --serverless-cache-name huntaze-beta-redis

# 3. Vider et supprimer S3
aws s3 rm s3://huntaze-beta-storage-1766460248 --recursive
aws s3api delete-bucket \
  --region us-east-2 \
  --bucket huntaze-beta-storage-1766460248

# 4. Supprimer Secrets
aws secretsmanager delete-secret \
  --region us-east-2 \
  --secret-id huntaze/beta/database-url \
  --force-delete-without-recovery

aws secretsmanager delete-secret \
  --region us-east-2 \
  --secret-id huntaze/beta/redis-url \
  --force-delete-without-recovery

# 5. Supprimer Security Groups
aws ec2 delete-security-group --region us-east-2 --group-id sg-0d2f753f72c2046e1
aws ec2 delete-security-group --region us-east-2 --group-id sg-0a9b1e678aac92154

# 6. Supprimer Subnets et VPC
aws ec2 delete-subnet --region us-east-2 --subnet-id subnet-00b7422149f5745ab
aws ec2 delete-subnet --region us-east-2 --subnet-id subnet-0e743017fa5ebadbb
aws ec2 delete-vpc --region us-east-2 --vpc-id vpc-07769b343ae40a638
```

---

## ✅ Checklist Finale

### Infrastructure
- [x] VPC créé (2 AZs)
- [x] Security Groups configurés
- [x] RDS PostgreSQL déployé
- [x] ElastiCache Redis déployé
- [x] S3 Bucket créé avec lifecycle
- [ ] Secrets Manager configuré ← **À FAIRE**

### Configuration
- [ ] Mot de passe RDS récupéré/réinitialisé
- [ ] Secrets créés dans AWS
- [ ] Variables Vercel ajoutées
- [ ] Base de données initialisée (Prisma)
- [ ] Tests de connexion effectués

### Sécurité
- [ ] Security Groups restreints aux IPs Vercel
- [ ] SSL/TLS activé sur RDS
- [ ] TLS activé sur Redis
- [ ] IAM Roles configurés
- [ ] CloudWatch Logs activés
- [ ] Alarmes CloudWatch configurées
- [ ] AWS Backup configuré

### Production
- [ ] Monitoring en place
- [ ] Alertes configurées
- [ ] Documentation à jour
- [ ] Runbook créé
- [ ] Équipe formée

---

## 📚 Documentation

- [AWS-INFRASTRUCTURE-DEPLOYED.md](./AWS-INFRASTRUCTURE-DEPLOYED.md) - Détails complets
- [AWS-DEPLOYMENT-GUIDE.md](./AWS-DEPLOYMENT-GUIDE.md) - Guide original
- [VERCEL-ENV-VARS.md](./VERCEL-ENV-VARS.md) - Variables d'environnement

---

## 🆘 Support

### Problèmes Courants

**Connexion RDS refusée**
- Vérifier Security Group (port 5432 ouvert)
- Vérifier que l'instance est "available"
- Tester avec `telnet huntaze-beta-db.c5ugu8oea3qv.us-east-2.rds.amazonaws.com 5432`

**Redis timeout**
- Vérifier Security Group (port 6379 ouvert)
- Redis Serverless peut prendre 1-2 min pour "wake up"
- Tester avec `redis-cli -h ... ping`

**S3 Access Denied**
- Vérifier AWS_ACCESS_KEY_ID et AWS_SECRET_ACCESS_KEY
- Vérifier les permissions IAM
- Vérifier la région (us-east-2)

---

## 🎯 Prochaine Action

**Lance le script de finalisation:**
```bash
./deployment-beta-50users/scripts/finalize-aws-setup.sh
```

Puis configure Vercel et tu es prêt à déployer! 🚀
