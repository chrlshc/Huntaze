# 🔐 Security Monitoring Guide

## Overview

Le security monitoring Huntaze utilise AWS Security Hub, GuardDuty, et IAM Access Analyzer pour détecter les vulnérabilités, menaces, et accès non autorisés.

## Services Activés

### 1. AWS Security Hub

**Status:** ✅ Activé  
**Standards:**
- AWS Foundational Security Best Practices (FSBP) v1.0.0
- CIS AWS Foundations Benchmark v3.0.0

**Ce qu'il fait:**
- Évalue la conformité de toutes les ressources AWS
- Agrège les findings de GuardDuty, Access Analyzer, et autres services
- Fournit un score de sécurité global
- Recommande des remédiations priorisées

**Console:** https://console.aws.amazon.com/securityhub/home?region=us-east-1

### 2. AWS GuardDuty

**Status:** ✅ Activé  
**Detector ID:** 34cd137406c7fec4785fe54c0dcb2fff  
**Frequency:** Findings every 15 minutes

**Ce qu'il détecte:**
- **Reconnaissance:** Port scanning, unusual API calls
- **Instance compromise:** Malware, crypto mining, backdoors
- **Account compromise:** Credential exfiltration, brute force
- **Bucket compromise:** Suspicious S3 access patterns

**Alertes:** HIGH/CRITICAL findings (severity >= 7) → SNS → Email

**Console:** https://console.aws.amazon.com/guardduty/home?region=us-east-1

### 3. IAM Access Analyzer

**Status:** ✅ Activé  
**Analyzer:** huntaze-access-analyzer  
**Type:** ACCOUNT

**Ce qu'il détecte:**
- S3 buckets accessibles depuis l'extérieur
- IAM roles assumables par comptes externes
- KMS keys partagées
- Lambda functions avec permissions externes
- SQS queues avec cross-account access
- Secrets Manager secrets partagés

**Console:** https://console.aws.amazon.com/access-analyzer/home?region=us-east-1

## Comment Lire les Alertes

### Security Hub Finding Email

```
Subject: AWS Security Hub Finding - [CRITICAL] CIS.1.20

A critical security finding has been detected:

Title: Ensure a support role has been created
Severity: CRITICAL (90)
Resource: AWS Account 317805897534
Standard: CIS AWS Foundations Benchmark v3.0.0

Recommendation: Create an IAM role for AWS Support access
```

**Actions:**
1. Ouvrir Security Hub console
2. Cliquer sur le finding pour voir les détails
3. Suivre la recommandation de remédiation
4. Marquer comme résolu une fois corrigé

### GuardDuty Finding Email

```
Subject: AWS GuardDuty Finding - UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration

A HIGH severity threat has been detected:

Type: UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration
Severity: 8.0 (HIGH)
Resource: IAM User huntaze-api
Description: Credentials from an EC2 instance are being used from an external IP

Recommendation: Rotate credentials immediately and investigate the source
```

**Actions:**
1. **Immédiat:** Désactiver les credentials compromises
2. Investiguer l'IP source
3. Vérifier les logs CloudTrail
4. Créer de nouvelles credentials
5. Archiver le finding une fois résolu

### Access Analyzer Finding

```
Finding: S3 bucket huntaze-uploads is publicly accessible

Status: ACTIVE
Resource Type: AWS::S3::Bucket
External Principal: *
Access Level: READ

Recommendation: Review bucket policy and remove public access if not intended
```

**Actions:**
1. Vérifier si l'accès public est intentionnel
2. Si non intentionnel, bloquer l'accès public
3. Si intentionnel, archiver le finding comme RESOLVED

## Investiguer les Findings

### 1. Security Hub - Compliance Score

**Voir le score global:**
```bash
aws securityhub get-findings \
    --region us-east-1 \
    --filters '{"ComplianceStatus":[{"Value":"FAILED","Comparison":"EQUALS"}]}' \
    --query 'Findings | length(@)'
```

**Top 5 findings par sévérité:**
```bash
aws securityhub get-findings \
    --region us-east-1 \
    --max-results 5 \
    --filters '{"SeverityLabel":[{"Value":"CRITICAL","Comparison":"EQUALS"}]}' \
    --query 'Findings[*].[Title,Severity.Label,Resources[0].Id]' \
    --output table
```

### 2. GuardDuty - Threat Analysis

**Findings par type:**
```bash
aws guardduty list-findings \
    --detector-id 34cd137406c7fec4785fe54c0dcb2fff \
    --region us-east-1 \
    --finding-criteria '{"Criterion":{"severity":{"Gte":7}}}' \
    --query 'FindingIds | length(@)'
```

**Détails d'un finding:**
```bash
# Remplacer FINDING_ID par l'ID du finding
aws guardduty get-findings \
    --detector-id 34cd137406c7fec4785fe54c0dcb2fff \
    --region us-east-1 \
    --finding-ids FINDING_ID \
    --query 'Findings[0].[Type,Severity,Title,Description]' \
    --output table
```

### 3. Access Analyzer - External Access

**Lister tous les accès externes:**
```bash
aws accessanalyzer list-findings \
    --analyzer-arn arn:aws:access-analyzer:us-east-1:317805897534:analyzer/huntaze-access-analyzer \
    --region us-east-1 \
    --query 'findings[*].[resourceType,status,resource,principal]' \
    --output table
```

## Actions de Remédiation

### Findings Critiques Communs

#### 1. IAM Password Policy Non Conforme

**Finding:** CIS.1.5 - Ensure IAM password policy requires minimum length of 14

**Remédiation:**
```bash
aws iam update-account-password-policy \
    --minimum-password-length 14 \
    --require-symbols \
    --require-numbers \
    --require-uppercase-characters \
    --require-lowercase-characters \
    --allow-users-to-change-password \
    --max-password-age 90 \
    --password-reuse-prevention 24
```

#### 2. MFA Non Activé sur Root Account

**Finding:** CIS.1.13 - Ensure MFA is enabled for the root account

**Remédiation:**
1. Se connecter avec le root account
2. Aller dans IAM > Dashboard
3. Cliquer "Activate MFA on your root account"
4. Suivre les instructions (Virtual MFA recommandé)

#### 3. CloudTrail Non Activé

**Finding:** CIS.3.1 - Ensure CloudTrail is enabled in all regions

**⚠️ Important:** Event History (90j gratuit) ≠ Trail S3 (audit long-terme)

**Remédiation:**
```bash
# Créer bucket S3 pour CloudTrail
aws s3 mb s3://huntaze-cloudtrail-logs

# Créer trail S3 (remplace Event History pour >90j)
aws cloudtrail create-trail \
    --name huntaze-cloudtrail \
    --s3-bucket-name huntaze-cloudtrail-logs \
    --is-multi-region-trail \
    --enable-log-file-validation

# Activer le trail
aws cloudtrail start-logging \
    --name huntaze-cloudtrail
```

**⚠️ Pour Organizations (multi-compte):**
```bash
aws cloudtrail create-trail \
    --name huntaze-org-trail \
    --s3-bucket-name huntaze-org-cloudtrail-logs \
    --is-organization-trail \
    --is-multi-region-trail
```

#### 4. S3 Bucket Public

**Finding:** S3.1 - S3 Block Public Access setting should be enabled

**Remédiation:**
```bash
aws s3api put-public-access-block \
    --bucket huntaze-uploads \
    --public-access-block-configuration \
        BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

#### 5. RDS Instance Non Chiffrée

**Finding:** RDS.3 - RDS DB instances should have encryption at rest enabled

**Remédiation:**
```bash
# Créer un snapshot
aws rds create-db-snapshot \
    --db-instance-identifier huntaze-prod \
    --db-snapshot-identifier huntaze-prod-pre-encryption

# Copier le snapshot avec encryption
aws rds copy-db-snapshot \
    --source-db-snapshot-identifier huntaze-prod-pre-encryption \
    --target-db-snapshot-identifier huntaze-prod-encrypted \
    --kms-key-id alias/aws/rds

# Restaurer depuis le snapshot chiffré
aws rds restore-db-instance-from-db-snapshot \
    --db-instance-identifier huntaze-prod-encrypted \
    --db-snapshot-identifier huntaze-prod-encrypted
```

### GuardDuty Threat Response

#### Credential Exfiltration

**Finding:** UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration

**Actions immédiates:**
1. Désactiver les credentials:
```bash
aws iam update-access-key \
    --access-key-id AKIAIOSFODNN7EXAMPLE \
    --status Inactive \
    --user-name huntaze-api
```

2. Créer de nouvelles credentials:
```bash
aws iam create-access-key --user-name huntaze-api
```

3. Mettre à jour Secrets Manager:
```bash
aws secretsmanager update-secret \
    --secret-id huntaze/api-credentials \
    --secret-string '{"AccessKeyId":"NEW_KEY","SecretAccessKey":"NEW_SECRET"}'
```

#### Crypto Mining

**Finding:** CryptoCurrency:EC2/BitcoinTool.B!DNS

**Actions immédiates:**
1. Isoler l'instance:
```bash
aws ec2 modify-instance-attribute \
    --instance-id i-1234567890abcdef0 \
    --groups sg-isolated
```

2. Créer un snapshot pour forensics:
```bash
aws ec2 create-snapshot \
    --volume-id vol-1234567890abcdef0 \
    --description "Forensics snapshot - crypto mining incident"
```

3. Terminer l'instance:
```bash
aws ec2 terminate-instances --instance-ids i-1234567890abcdef0
```

## Suppression Rules (False Positives)

### Security Hub

Si un finding est un faux positif légitime:

```bash
# Créer une suppression rule
aws securityhub create-insight \
    --name "Suppress known false positives" \
    --filters '{
        "ResourceId": [{"Value": "arn:aws:s3:::huntaze-public-assets", "Comparison": "EQUALS"}],
        "ComplianceStatus": [{"Value": "FAILED", "Comparison": "EQUALS"}]
    }' \
    --group-by-attribute "ResourceId"
```

### GuardDuty

Pour supprimer des findings connus:

```bash
# Créer un filtre de suppression
aws guardduty create-filter \
    --detector-id 34cd137406c7fec4785fe54c0dcb2fff \
    --name "Suppress known scanner" \
    --action ARCHIVE \
    --finding-criteria '{
        "Criterion": {
            "service.action.networkConnectionAction.remoteIpDetails.ipAddressV4": {
                "Eq": ["203.0.113.0"]
            }
        }
    }' \
    --region us-east-1
```

### Access Analyzer

Pour archiver un accès externe légitime:

```bash
aws accessanalyzer update-findings \
    --analyzer-arn arn:aws:access-analyzer:us-east-1:317805897534:analyzer/huntaze-access-analyzer \
    --status RESOLVED \
    --ids FINDING_ID \
    --region us-east-1
```

## Monitoring Dashboard

### Créer un Dashboard de Sécurité

```bash
# Voir le script: scripts/create-security-dashboard.sh
# (À créer dans la tâche 2.3)
```

## Best Practices

### 1. Review Quotidien (Première Semaine)

- [ ] Vérifier Security Hub compliance score
- [ ] Review GuardDuty findings
- [ ] Vérifier Access Analyzer findings
- [ ] Archiver les faux positifs

### 2. Review Hebdomadaire (Après Stabilisation)

- [ ] Analyser les tendances de sécurité
- [ ] Mettre à jour les suppression rules
- [ ] Vérifier les nouvelles recommandations
- [ ] Tester les runbooks de réponse

### 3. Alertes Proactives

- Configurer des alertes pour CRITICAL findings uniquement
- Créer des runbooks pour les findings fréquents
- Automatiser les remédiations simples (Lambda)

### 4. Compliance Tracking

- Maintenir un score > 80% sur Security Hub
- Résoudre les findings CRITICAL dans les 24h
- Résoudre les findings HIGH dans les 7 jours
- Review les findings MEDIUM mensuellement

## Troubleshooting

### Security Hub Findings Non Reçus

**Cause:** Standards en cours d'activation (PENDING)

**Solution:** Attendre 2 heures pour la première évaluation

### GuardDuty Trop de Faux Positifs

**Cause:** Détection trop sensible pour votre environnement

**Solution:** Créer des suppression rules pour patterns légitimes

### Access Analyzer Findings Légitimes

**Cause:** Accès externe intentionnel (ex: CDN, partenaires)

**Solution:** Archiver comme RESOLVED avec commentaire explicatif

## Coûts Estimés

| Service | Coût Mensuel | Notes |
|---------|--------------|-------|
| Security Hub | $5-10 | ~$0.0010 per check |
| GuardDuty | $5-15 | ~$4.60 per million events |
| Access Analyzer | $0 | Free for account-level |
| **Total** | **$10-25/month** | **⚠️ First 30 days FREE trial per région/protection** |

### ⚠️ Free Trial Details

- **GuardDuty:** 30 jours gratuits par région
- **Security Hub:** 30 jours gratuits (checks + findings)
- **Coût démarre automatiquement** après la période d'essai
- **Utile pour:** Affiner le budget par palier avant engagement long-terme
- **Monitoring:** Vérifier les coûts dans Cost Explorer après 30j

## Support

### Documentation AWS

- [Security Hub](https://docs.aws.amazon.com/securityhub/latest/userguide/what-is-securityhub.html)
- [GuardDuty](https://docs.aws.amazon.com/guardduty/latest/ug/what-is-guardduty.html)
- [Access Analyzer](https://docs.aws.amazon.com/IAM/latest/UserGuide/what-is-access-analyzer.html)
- [CIS Benchmark](https://docs.aws.amazon.com/securityhub/latest/userguide/securityhub-cis-controls.html)

### Commandes Utiles

```bash
# Vérifier tous les services
./scripts/verify-security-monitoring.sh

# Security Hub compliance
aws securityhub get-compliance-summary --region us-east-1

# GuardDuty findings count
aws guardduty list-findings \
    --detector-id 34cd137406c7fec4785fe54c0dcb2fff \
    --region us-east-1 \
    --query 'FindingIds | length(@)'

# Access Analyzer findings
aws accessanalyzer list-findings \
    --analyzer-arn arn:aws:access-analyzer:us-east-1:317805897534:analyzer/huntaze-access-analyzer \
    --region us-east-1 \
    --query 'findings | length(@)'
```

## Incident Response Runbook

### 1. Credential Compromise (CRITICAL)

**Détection:** GuardDuty finding UnauthorizedAccess

**Actions (< 15 min):**
1. Désactiver credentials compromises
2. Créer nouvelles credentials
3. Mettre à jour applications
4. Investiguer l'origine
5. Documenter l'incident

### 2. Instance Compromise (HIGH)

**Détection:** GuardDuty finding CryptoCurrency ou Backdoor

**Actions (< 1h):**
1. Isoler l'instance (security group)
2. Créer snapshot pour forensics
3. Terminer l'instance
4. Lancer nouvelle instance depuis AMI propre
5. Investiguer la cause
6. Documenter l'incident

### 3. Data Exfiltration (CRITICAL)

**Détection:** GuardDuty finding Exfiltration

**Actions (< 30 min):**
1. Bloquer l'IP destination
2. Désactiver les credentials utilisées
3. Vérifier les données exfiltrées
4. Notifier les parties concernées
5. Investiguer la cause
6. Documenter l'incident

## Conformité

### Standards Supportés

- ✅ SOC 2 Type II
- ✅ ISO 27001
- ✅ PCI DSS (partiel)
- ✅ GDPR (monitoring)
- ✅ HIPAA (avec configuration additionnelle)

### Audit Trail

Tous les findings et actions sont loggés dans:
- CloudTrail (API calls)
- Security Hub (findings history)
- GuardDuty (threat history)
- Access Analyzer (findings history)

Rétention: 90 jours minimum (configurable)
