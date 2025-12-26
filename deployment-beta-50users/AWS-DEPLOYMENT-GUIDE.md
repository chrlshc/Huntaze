# 🚀 Guide de Déploiement AWS - Huntaze Beta

**Date**: 22 décembre 2024  
**Coût**: ~$60-80/mois  
**Temps**: ~20 minutes

---

## 📋 Ce Qui Va Être Créé

1. **RDS PostgreSQL** (db.t4g.micro) - ~$15/mois
2. **ElastiCache Redis Serverless** - ~$25/mois
3. **S3 Bucket** avec lifecycle policies - ~$5/mois
4. **Secrets Manager** - ~$1/mois
5. **Security Groups** - Gratuit

**Total: ~$60-80/mois** (selon l'usage)

---

## ⚡ Déploiement Rapide

### 1. Rendre le Script Exécutable

```bash
chmod +x deployment-beta-50users/scripts/deploy-aws-infrastructure.sh
```

### 2. Lancer le Déploiement

```bash
./deployment-beta-50users/scripts/deploy-aws-infrastructure.sh
```

Le script va:
- ✅ Créer le VPC et subnets (si nécessaire)
- ✅ Créer les Security Groups
- ✅ Créer RDS PostgreSQL (~10 min)
- ✅ Créer Redis Serverless (~5 min)
- ✅ Créer S3 Bucket
- ✅ Stocker les secrets dans Secrets Manager
- ✅ Générer le fichier de config

**Durée totale: ~15-20 minutes**

### 3. Charger la Configuration

```bash
source deployment-beta-50users/aws-infrastructure-config.env
```

### 4. Tester les Connexions

```bash
# Test PostgreSQL
psql "$DATABASE_URL" -c "SELECT version();"

# Test Redis
redis-cli -u "$REDIS_URL" PING

# Test S3
aws s3 ls s3://$S3_BUCKET
```

### 5. Migrer la Base de Données

```bash
npx prisma migrate deploy
```

### 6. Configurer Vercel

Va sur Vercel → Settings → Environment Variables et ajoute:

```bash
DATABASE_URL=<from config file>
REDIS_URL=<from config file>
AWS_S3_BUCKET=<from config file>
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=<your key>
AWS_SECRET_ACCESS_KEY=<your secret>
```

### 7. Déployer sur Vercel

```bash
git add .
git commit -m "Add AWS infrastructure"
git push origin main
```

Vercel va auto-déployer!

---

## 🔧 Configuration Détaillée

### RDS PostgreSQL

```yaml
Instance: db.t4g.micro
vCPU: 2 (ARM Graviton)
RAM: 1 GB
Storage: 20 GB gp3
Engine: PostgreSQL 16.1
Backup: 7 jours
Multi-AZ: Non (beta)
Public: Oui (beta only!)
```

**Coût**: ~$15/mois

### ElastiCache Redis

```yaml
Type: Serverless
Engine: Redis 7.x
Snapshots: 1 jour
Auto-scaling: Oui
```

**Coût**: ~$25/mois (pay-per-use)

### S3 Bucket

```yaml
Versioning: Enabled
Lifecycle:
  - temp/ → Delete after 7 days
  - videos/ → Intelligent-Tiering after 30 days
```

**Coût**: ~$5/mois (pour 150 GB)

---

## 🔒 Sécurité

### Security Groups

**RDS Security Group:**
- Port 5432 ouvert à 0.0.0.0/0 (beta only!)
- ⚠️ À restreindre en production

**Redis Security Group:**
- Port 6379 ouvert à 0.0.0.0/0 (beta only!)
- ⚠️ À restreindre en production

### Secrets Manager

Tous les secrets sont stockés dans AWS Secrets Manager:
- `huntaze/beta/database-url`
- `huntaze/beta/redis-url`

**Coût**: $0.40/secret/mois

---

## 📊 Monitoring

### CloudWatch Alarms (Optionnel)

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
  --dimensions Name=DBInstanceIdentifier,Value=huntaze-beta-db \
  --evaluation-periods 2

# RDS Connections
aws cloudwatch put-metric-alarm \
  --alarm-name huntaze-beta-rds-connections \
  --alarm-description "RDS Connections > 80" \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=DBInstanceIdentifier,Value=huntaze-beta-db \
  --evaluation-periods 2
```

---

## 🔄 Backup & Recovery

### RDS Backups

- **Automated**: 7 jours de rétention
- **Window**: 03:00-04:00 UTC
- **Manual**: Créer un snapshot avant deploy

```bash
# Créer un snapshot manuel
aws rds create-db-snapshot \
  --db-instance-identifier huntaze-beta-db \
  --db-snapshot-identifier huntaze-beta-snapshot-$(date +%Y%m%d)
```

### Redis Snapshots

- **Daily**: 03:00-04:00 UTC
- **Retention**: 1 jour

---

## 📈 Scaling

### Vertical Scaling (50 → 100 users)

```bash
# Upgrade RDS
aws rds modify-db-instance \
  --db-instance-identifier huntaze-beta-db \
  --db-instance-class db.t4g.small \
  --apply-immediately

# Redis Serverless scale automatiquement
```

**Nouveau coût**: ~$100-120/mois

### Horizontal Scaling (100+ users)

- Add Read Replicas (RDS)
- Enable Multi-AZ
- Add CloudFront CDN
- Consider Aurora Serverless

---

## 🧹 Cleanup (Si Besoin)

```bash
# Delete RDS
aws rds delete-db-instance \
  --db-instance-identifier huntaze-beta-db \
  --skip-final-snapshot

# Delete Redis
aws elasticache delete-serverless-cache \
  --serverless-cache-name huntaze-beta-redis

# Delete S3 Bucket
aws s3 rb s3://huntaze-beta-storage-* --force

# Delete Secrets
aws secretsmanager delete-secret \
  --secret-id huntaze/beta/database-url \
  --force-delete-without-recovery

aws secretsmanager delete-secret \
  --secret-id huntaze/beta/redis-url \
  --force-delete-without-recovery

# Delete Security Groups
aws ec2 delete-security-group --group-id <RDS_SG_ID>
aws ec2 delete-security-group --group-id <REDIS_SG_ID>
```

---

## 🐛 Troubleshooting

### RDS Connection Failed

```bash
# Vérifier le Security Group
aws ec2 describe-security-groups --group-ids <RDS_SG_ID>

# Vérifier que l'instance est disponible
aws rds describe-db-instances \
  --db-instance-identifier huntaze-beta-db \
  --query 'DBInstances[0].DBInstanceStatus'

# Tester la connexion
psql "$DATABASE_URL" -c "SELECT 1;"
```

### Redis Connection Failed

```bash
# Vérifier le statut
aws elasticache describe-serverless-caches \
  --serverless-cache-name huntaze-beta-redis

# Tester la connexion
redis-cli -u "$REDIS_URL" PING
```

### S3 Access Denied

```bash
# Vérifier les permissions IAM
aws iam get-user

# Vérifier la bucket policy
aws s3api get-bucket-policy --bucket $S3_BUCKET
```

---

## 💰 Optimisation des Coûts

### Réduire les Coûts

1. **RDS**: Utiliser Reserved Instances (-40%)
2. **Redis**: Utiliser Serverless (pay-per-use)
3. **S3**: Activer Intelligent-Tiering
4. **CloudWatch**: Limiter les logs à 7 jours

### Monitoring des Coûts

```bash
# Voir les coûts du mois
aws ce get-cost-and-usage \
  --time-period Start=2024-12-01,End=2024-12-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE
```

---

## ✅ Checklist de Déploiement

- [ ] Script exécuté avec succès
- [ ] RDS accessible depuis Vercel
- [ ] Redis accessible depuis Vercel
- [ ] S3 bucket créé
- [ ] Secrets stockés dans Secrets Manager
- [ ] Prisma migrations appliquées
- [ ] Variables d'environnement configurées sur Vercel
- [ ] Application déployée sur Vercel
- [ ] Tests de connexion réussis
- [ ] Monitoring configuré (optionnel)

---

## 🎯 Prochaines Étapes

1. ✅ Déployer l'infrastructure AWS
2. ✅ Configurer Vercel
3. ✅ Déployer l'application
4. ⏭️ Configurer Azure AI (déjà fait!)
5. ⏭️ Tester l'application
6. ⏭️ Inviter les beta testers

---

**Questions?** Vérifie les logs dans `deployment-beta-50users/aws-infrastructure-config.env`
