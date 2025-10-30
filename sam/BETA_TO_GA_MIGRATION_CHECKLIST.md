# 🚀 Beta → GA Migration Checklist

## Overview

Ce checklist couvre les étapes critiques pour migrer Huntaze de Beta vers General Availability (GA), avec focus sur les 4 ajustements pratiques AWS.

## Déclencheurs de Migration

Migrer vers GA quand **AU MOINS UN** de ces critères est atteint :

- [ ] **>200 utilisateurs actifs** (charge justifie l'infrastructure)
- [ ] **>$5K MRR** (revenus justifient les coûts additionnels)
- [ ] **SLA 99% demandé** par clients enterprise
- [ ] **Compliance requise** (SOC 2, ISO 27001, etc.)

## 🔍 Pré-Migration: Vérification Best Practices

### 1. CloudTrail >90j Audit

**Objectif:** Audit trail long-terme au lieu de Event History (90j)

- [ ] Vérifier si trail S3 existe
  ```bash
  aws cloudtrail describe-trails --region us-east-1
  ```

- [ ] Si non, créer bucket S3 pour CloudTrail
  ```bash
  aws s3 mb s3://huntaze-cloudtrail-logs
  ```

- [ ] Créer trail S3 multi-région
  ```bash
  aws cloudtrail create-trail \
    --name huntaze-audit-trail \
    --s3-bucket-name huntaze-cloudtrail-logs \
    --is-multi-region-trail \
    --enable-log-file-validation
  ```

- [ ] Activer le trail
  ```bash
  aws cloudtrail start-logging --name huntaze-audit-trail
  ```

- [ ] Vérifier que le trail est actif
  ```bash
  aws cloudtrail get-trail-status --name huntaze-audit-trail
  ```

**⚠️ Important:** Event History (90j gratuit) ≠ Trail S3 (audit long-terme)

**Coût:** ~$2-5/mois (S3 storage)

---

### 2. KMS CMK Rotation

**Objectif:** Rotation automatique des clés de chiffrement

- [ ] Lister les CMK existantes
  ```bash
  aws kms list-keys --region us-east-1
  ```

- [ ] Pour chaque CMK symmetric, vérifier rotation
  ```bash
  aws kms get-key-rotation-status --key-id <key-id>
  ```

- [ ] Si rotation désactivée, l'activer
  ```bash
  aws kms enable-key-rotation --key-id <key-id>
  ```

- [ ] Créer nouvelle CMK pour RDS (si nécessaire)
  ```bash
  KEY_ID=$(aws kms create-key \
    --description "Huntaze RDS encryption key" \
    --key-usage ENCRYPT_DECRYPT \
    --key-spec SYMMETRIC_DEFAULT \
    --query 'KeyMetadata.KeyId' \
    --output text)
  
  # Activer rotation immédiatement
  aws kms enable-key-rotation --key-id $KEY_ID
  ```

**⚠️ Limitation:** Rotation automatique uniquement pour:
- Symmetric keys (SYMMETRIC_DEFAULT)
- Keys gérées par KMS (pas EXTERNAL)
- Rotation annuelle (non configurable)

**Coût:** $1/key/mois + $0.03 per 10K requests = ~$2/mois

---

### 3. RDS Architecture (Cross-Region DR)

**Objectif:** Vérifier compatibilité avec disaster recovery cross-région

- [ ] Vérifier type d'instance RDS
  ```bash
  aws rds describe-db-instances \
    --query 'DBInstances[*].[DBInstanceIdentifier,Engine,DBClusterIdentifier]' \
    --output table
  ```

- [ ] Si **DB Instance** (DBClusterIdentifier = None)
  - ✅ Cross-region automated backups supportés
  - ✅ Continuer avec configuration actuelle

- [ ] Si **Multi-AZ DB Cluster** (DBClusterIdentifier présent)
  - ❌ Automated backups cross-region NON supportés
  - Choisir une solution:
    - [ ] Option 1: Snapshots manuels + copie cross-region
    - [ ] Option 2: Rester sur DB Instance (pas cluster)
    - [ ] Option 3: Migrer vers Aurora Global Database (Palier 3)

- [ ] Configurer cross-region backups (si DB Instance)
  ```bash
  # Copier snapshot vers région secondaire
  aws rds copy-db-snapshot \
    --source-db-snapshot-identifier arn:aws:rds:us-east-1:...:snapshot:huntaze-daily \
    --target-db-snapshot-identifier huntaze-dr-eu-west-1 \
    --region eu-west-1 \
    --kms-key-id alias/aws/rds
  ```

**⚠️ Recommandation:** Garder RDS DB Instance si cross-region DR requis

**Coût:** ~$10-20/mois (storage dans région secondaire)

---

### 4. GuardDuty Free Trial

**Objectif:** Monitorer les coûts après free trial

- [ ] Vérifier si GuardDuty est activé
  ```bash
  aws guardduty list-detectors --region us-east-1
  ```

- [ ] Noter la date d'activation (pour tracking 30j)
  ```bash
  # Vérifier dans CloudTrail
  aws cloudtrail lookup-events \
    --lookup-attributes AttributeKey=EventName,AttributeValue=CreateDetector \
    --region us-east-1
  ```

- [ ] Créer budget alert pour GuardDuty
  ```bash
  # Via AWS Budgets
  # Alert si coût > $20/mois après free trial
  ```

- [ ] Configurer Cost Explorer pour monitoring
  - [ ] Filtrer par service: GuardDuty
  - [ ] Grouper par: Usage Type
  - [ ] Période: Mensuelle

- [ ] Après 30 jours, vérifier coûts réels
  ```bash
  # Via Cost Explorer ou CLI
  aws ce get-cost-and-usage \
    --time-period Start=2025-10-01,End=2025-10-31 \
    --granularity MONTHLY \
    --metrics BlendedCost \
    --filter file://guardduty-filter.json
  ```

**⚠️ Free Trial:** 30 jours gratuits par région/protection

**Coût estimé:** ~$5-15/mois après free trial

---

## 📋 Script de Vérification Automatique

Exécuter le script de vérification complet :

```bash
./scripts/verify-aws-best-practices.sh
```

Ce script vérifie automatiquement :
- ✅ CloudTrail S3 trail configuré
- ✅ KMS CMK rotation activée
- ✅ RDS architecture compatible cross-region DR
- ✅ GuardDuty free trial status

---

## 🎯 Palier 1: Early Production (200-1K users)

### Infrastructure

- [ ] **Multi-AZ RDS** (99.95% uptime)
  ```bash
  aws rds modify-db-instance \
    --db-instance-identifier huntaze-postgres-production \
    --multi-az \
    --apply-immediately
  ```
  - Coût: +100% (~$30/mois)
  - Downtime: 1-2 min pendant activation

- [ ] **RDS Cross-Region Backups** (DR régional)
  - Voir section 3 ci-dessus
  - Coût: ~$10-20/mois

- [ ] **KMS Customer Managed Keys** (contrôle total)
  - Voir section 2 ci-dessus
  - Coût: ~$2/mois

### Monitoring

- [ ] **CloudTrail S3 Trail** (audit >90j)
  - Voir section 1 ci-dessus
  - Coût: ~$2-5/mois

- [ ] **Security Hub + GuardDuty** (détection menaces)
  ```bash
  ./scripts/enable-security-hub.sh
  ./scripts/enable-guardduty.sh
  ```
  - Coût: ~$10-25/mois (30j gratuits)

- [ ] **IAM Access Analyzer** (accès externes)
  ```bash
  ./scripts/enable-access-analyzer.sh
  ```
  - Coût: Gratuit

### Coût Total Palier 1

**~$54-82/mois** (+$39-67 vs Beta)

---

## 🚀 Palier 2: Growth (1K-10K users)

### Infrastructure

- [ ] **Lambda Provisioned Concurrency** (cold starts)
- [ ] **RDS Read Replicas** (scaling lecture)
- [ ] **CloudFront CDN** (latence globale)
- [ ] **WAF Basic Rules** (protection DDoS)

### Monitoring

- [ ] **Enhanced RDS Monitoring** (1-sec metrics)
- [ ] **X-Ray Tracing** (debugging distribué)
- [ ] **Custom CloudWatch Dashboards**

**Coût Total Palier 2:** ~$150-250/mois

---

## 🌍 Palier 3: Scale (10K+ users)

### Infrastructure

- [ ] **Aurora Global Database** (multi-région)
- [ ] **Auto Scaling Groups** (élasticité)
- [ ] **WAF Advanced + Shield** (DDoS protection)
- [ ] **Route 53 Health Checks** (failover DNS)

### Monitoring

- [ ] **AWS Organizations** (multi-compte)
- [ ] **Control Tower** (governance)
- [ ] **Config Rules** (compliance automation)

**Coût Total Palier 3:** ~$500-1000/mois

---

## ✅ Post-Migration Validation

### 1. Vérifier Configuration

```bash
# Exécuter script de vérification
./scripts/verify-aws-best-practices.sh

# Vérifier tous les services
./scripts/verify-security-monitoring.sh
```

### 2. Tester Disaster Recovery

```bash
# Test PITR restore
./scripts/test-rds-pitr-restore.sh

# Test cross-region restore (si configuré)
```

### 3. Monitorer Coûts

- [ ] Vérifier Cost Explorer quotidiennement (première semaine)
- [ ] Configurer budget alerts
- [ ] Documenter coûts réels vs estimés

### 4. Documenter Changements

- [ ] Mettre à jour runbooks
- [ ] Former l'équipe sur nouveaux outils
- [ ] Créer incident response procedures

---

## 🚨 Rollback Plan

Si problèmes critiques après migration :

### 1. RDS Multi-AZ → Single-AZ

```bash
aws rds modify-db-instance \
  --db-instance-identifier huntaze-postgres-production \
  --no-multi-az \
  --apply-immediately
```

### 2. Désactiver Services Coûteux

```bash
# GuardDuty
aws guardduty delete-detector --detector-id <detector-id>

# Security Hub
aws securityhub disable-security-hub
```

### 3. Restaurer depuis Backup

```bash
# PITR restore vers état pré-migration
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier huntaze-postgres-production \
  --target-db-instance-identifier huntaze-postgres-rollback \
  --restore-time "2025-10-27T12:00:00Z"
```

---

## 📊 Métriques de Succès

### Uptime

- **Beta:** 99.5% (3.6h downtime/mois)
- **Palier 1:** 99.9% (43min downtime/mois)
- **Palier 2:** 99.95% (21min downtime/mois)
- **Palier 3:** 99.99% (4min downtime/mois)

### RTO/RPO

- **Beta:** RTO 4h, RPO 24h
- **Palier 1:** RTO 2h, RPO 5min
- **Palier 2:** RTO 1h, RPO 1min
- **Palier 3:** RTO 15min, RPO 0 (sync replication)

### Coûts

- **Beta:** ~$15/mois
- **Palier 1:** ~$54-82/mois
- **Palier 2:** ~$150-250/mois
- **Palier 3:** ~$500-1000/mois

---

## 📖 Documentation Référence

- [GA Readiness Roadmap](./GA_READINESS_ROADMAP.md)
- [Security Monitoring Guide](./SECURITY_MONITORING_GUIDE.md)
- [RDS Backup & Recovery Guide](./RDS_BACKUP_RECOVERY_GUIDE.md)
- [Security Cost Optimization](./SECURITY_COST_OPTIMIZATION_COMPLETE.md)

---

## 🆘 Support

### Problèmes Courants

1. **CloudTrail trail non actif**
   - Vérifier: `aws cloudtrail get-trail-status --name huntaze-audit-trail`
   - Fix: `aws cloudtrail start-logging --name huntaze-audit-trail`

2. **KMS rotation non activée**
   - Vérifier: `aws kms get-key-rotation-status --key-id <key-id>`
   - Fix: `aws kms enable-key-rotation --key-id <key-id>`

3. **RDS cluster incompatible avec cross-region DR**
   - Vérifier: `aws rds describe-db-instances --query 'DBInstances[*].DBClusterIdentifier'`
   - Fix: Rester sur DB Instance ou utiliser snapshots manuels

4. **GuardDuty coûts élevés après free trial**
   - Vérifier: Cost Explorer > GuardDuty
   - Fix: Ajuster détection ou désactiver temporairement

### Contacts

- **AWS Support:** https://console.aws.amazon.com/support/
- **Documentation:** https://docs.aws.amazon.com/
- **Huntaze Team:** [email]

---

**Dernière mise à jour:** 2025-10-27  
**Version:** 1.0.0
