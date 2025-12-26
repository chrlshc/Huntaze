# ✅ AWS Infrastructure Déployée - us-east-2

**Date**: 23 décembre 2025, 03:20 UTC  
**Région**: us-east-2  
**Environnement**: beta

---

## 🎯 Ressources Créées

### 1. ✅ RDS PostgreSQL
- **Instance ID**: `huntaze-beta-db`
- **Endpoint**: `huntaze-beta-db.c5ugu8oea3qv.us-east-2.rds.amazonaws.com`
- **Port**: 5432
- **Engine**: PostgreSQL 16.11
- **Instance Class**: db.t4g.micro
- **Storage**: 20 GB gp3
- **Database Name**: huntaze_production
- **Username**: huntaze_admin
- **Status**: ✅ Available
- **Backup**: 7 jours de rétention, fenêtre 03:00-04:00 UTC

### 2. ✅ ElastiCache Redis Serverless
- **Cluster Name**: `huntaze-beta-redis`
- **Endpoint**: `huntaze-beta-redis-dmgoy6.serverless.use2.cache.amazonaws.com`
- **Port**: 6379
- **Engine**: Redis 7
- **Type**: Serverless (auto-scaling)
- **Status**: ✅ Available
- **Snapshot**: Daily à 03:00 UTC

### 3. ✅ S3 Bucket
- **Bucket Name**: `huntaze-beta-storage-1766460248`
- **Region**: us-east-2
- **Versioning**: ✅ Enabled
- **Lifecycle Policies**:
  - Suppression fichiers temp/ après 7 jours
  - Transition videos/ vers INTELLIGENT_TIERING après 30 jours

### 4. ✅ VPC & Networking
- **VPC ID**: `vpc-07769b343ae40a638`
- **Subnets**:
  - `subnet-00b7422149f5745ab` (us-east-2a)
  - `subnet-0e743017fa5ebadbb` (us-east-2b)
- **Security Groups**:
  - RDS: `sg-0d2f753f72c2046e1` (port 5432 ouvert)
  - Redis: `sg-0a9b1e678aac92154` (port 6379 ouvert)

---

## ⚠️ ACTION REQUISE: Récupérer le Mot de Passe RDS

Le mot de passe RDS a été généré automatiquement lors de la création. Tu dois le récupérer pour créer les secrets.

**Option 1: Réinitialiser le mot de passe**
```bash
# Générer un nouveau mot de passe
NEW_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Modifier le mot de passe RDS
aws rds modify-db-instance \
  --region us-east-2 \
  --db-instance-identifier huntaze-beta-db \
  --master-user-password "$NEW_PASSWORD" \
  --apply-immediately

# Sauvegarder le mot de passe
echo "DB_PASSWORD=$NEW_PASSWORD" > deployment-beta-50users/.aws-secrets
chmod 600 deployment-beta-50users/.aws-secrets
```

**Option 2: Utiliser AWS Secrets Manager pour RDS**
```bash
# Créer un secret géré par RDS
aws secretsmanager create-secret \
  --region us-east-2 \
  --name huntaze/beta/rds-master-password \
  --description "RDS Master Password" \
  --secret-string '{"username":"huntaze_admin","password":"VOTRE_MOT_DE_PASSE"}'
```

---

## 📝 Prochaines Étapes

### 1. Créer les Secrets Manager
Une fois le mot de passe récupéré:

```bash
# DATABASE_URL
DATABASE_URL="postgresql://huntaze_admin:VOTRE_PASSWORD@huntaze-beta-db.c5ugu8oea3qv.us-east-2.rds.amazonaws.com:5432/huntaze_production"

aws secretsmanager create-secret \
  --region us-east-2 \
  --name "huntaze/beta/database-url" \
  --description "Huntaze Database URL" \
  --secret-string "$DATABASE_URL"

# REDIS_URL
REDIS_URL="redis://huntaze-beta-redis-dmgoy6.serverless.use2.cache.amazonaws.com:6379"

aws secretsmanager create-secret \
  --region us-east-2 \
  --name "huntaze/beta/redis-url" \
  --description "Huntaze Redis URL" \
  --secret-string "$REDIS_URL"
```

### 2. Configurer Vercel
Ajoute ces variables d'environnement dans Vercel:

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
```

### 3. Tester les Connexions
```bash
# Test PostgreSQL
psql "postgresql://huntaze_admin:PASSWORD@huntaze-beta-db.c5ugu8oea3qv.us-east-2.rds.amazonaws.com:5432/huntaze_production"

# Test Redis
redis-cli -h huntaze-beta-redis-dmgoy6.serverless.use2.cache.amazonaws.com -p 6379 ping

# Test S3
aws s3 ls s3://huntaze-beta-storage-1766460248 --region us-east-2
```

### 4. Initialiser la Base de Données
```bash
# Exporter DATABASE_URL
export DATABASE_URL="postgresql://huntaze_admin:PASSWORD@huntaze-beta-db.c5ugu8oea3qv.us-east-2.rds.amazonaws.com:5432/huntaze_production"

# Pousser le schéma Prisma
npx prisma db push

# Ou migrer
npx prisma migrate deploy
```

---

## 💰 Coût Estimé

| Service | Configuration | Coût/mois |
|---------|--------------|-----------|
| RDS PostgreSQL | db.t4g.micro, 20GB | ~$15 |
| ElastiCache Redis | Serverless (minimal) | ~$25-40 |
| S3 | 10GB stockage + transfert | ~$5 |
| Secrets Manager | 2 secrets | ~$1 |
| **TOTAL** | | **~$46-61/mois** |

---

## 🔒 Sécurité

### ⚠️ À FAIRE AVANT PRODUCTION:
1. **Restreindre les Security Groups**: Actuellement ouverts à 0.0.0.0/0
2. **Activer SSL/TLS**: Pour RDS et Redis
3. **Configurer IAM Roles**: Au lieu d'utiliser des access keys
4. **Activer CloudWatch Logs**: Pour monitoring
5. **Configurer AWS Backup**: Pour sauvegardes automatiques

### Commandes de Sécurisation:
```bash
# Restreindre RDS à Vercel IPs uniquement
aws ec2 revoke-security-group-ingress \
  --region us-east-2 \
  --group-id sg-0d2f753f72c2046e1 \
  --protocol tcp \
  --port 5432 \
  --cidr 0.0.0.0/0

# Ajouter les IPs Vercel (exemple)
aws ec2 authorize-security-group-ingress \
  --region us-east-2 \
  --group-id sg-0d2f753f72c2046e1 \
  --protocol tcp \
  --port 5432 \
  --cidr 76.76.21.0/24
```

---

## 📊 Monitoring

### CloudWatch Dashboards
```bash
# Créer un dashboard
aws cloudwatch put-dashboard \
  --region us-east-2 \
  --dashboard-name huntaze-beta \
  --dashboard-body file://cloudwatch-dashboard.json
```

### Alarmes Recommandées
- RDS CPU > 80%
- RDS Storage < 20%
- Redis Memory > 80%
- S3 Bucket Size > 100GB

---

## 🗑️ Nettoyage (si besoin)

```bash
# Supprimer RDS
aws rds delete-db-instance \
  --region us-east-2 \
  --db-instance-identifier huntaze-beta-db \
  --skip-final-snapshot

# Supprimer Redis
aws elasticache delete-serverless-cache \
  --region us-east-2 \
  --serverless-cache-name huntaze-beta-redis

# Supprimer S3 (vider d'abord)
aws s3 rm s3://huntaze-beta-storage-1766460248 --recursive
aws s3api delete-bucket \
  --region us-east-2 \
  --bucket huntaze-beta-storage-1766460248

# Supprimer Secrets
aws secretsmanager delete-secret \
  --region us-east-2 \
  --secret-id huntaze/beta/database-url \
  --force-delete-without-recovery
```

---

## ✅ Checklist Déploiement

- [x] VPC et Subnets créés
- [x] Security Groups configurés
- [x] RDS PostgreSQL déployé
- [x] ElastiCache Redis déployé
- [x] S3 Bucket créé avec lifecycle
- [ ] Mot de passe RDS récupéré
- [ ] Secrets Manager configuré
- [ ] Variables Vercel ajoutées
- [ ] Base de données initialisée
- [ ] Tests de connexion effectués
- [ ] Security Groups restreints
- [ ] Monitoring configuré

---

**Prêt pour la suite?** Récupère le mot de passe RDS et on configure Vercel! 🚀
