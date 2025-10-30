# 🚀 Plan de Bascule GA - Huntaze Infrastructure

**Version:** 1.0  
**Date:** 27 octobre 2024  
**Status Actuel:** ✅ Beta Ready (50-200 users)

---

## 📊 Matrice de Décision

### Règle Simple

```
Beta (50-200 users)
  → Setup actuel + Secrets Manager/KMS ✅ → GO

GA / $$$ en jeu / SLA
  → + Incident Manager
  → + Multi-AZ
  → + Cross-region backups
  → + CloudTrail extended
```

---

## 🎯 Paliers d'Évolution

### Palier 0: Beta (ACTUEL) ✅

**Seuils:**
- Users: 50-200
- MRR: $0-5K
- SLA: Best effort
- Uptime target: 95%

**Infrastructure:**
- ✅ Cost Monitoring (Budget + Anomaly Detection)
- ✅ Security Hub + GuardDuty + Access Analyzer
- ✅ WAF avec AWS Managed Rules
- ✅ RDS Single-AZ + Backups 7j + PITR
- ✅ CloudTrail Event History (90j gratuit)
- ✅ Secrets Manager (credentials DB)
- ✅ KMS AWS-managed keys (rotation auto)
- ✅ CloudWatch Alarms → SNS

**Coût:** ~$30/mois

**Status:** ✅ Déployé et opérationnel

---

### Palier 1: Early GA

**Déclencheurs (AU MOINS 2 sur 3):**
- Users: > 200
- MRR: > $5K
- SLA demandé: 99%

**Ajouts Recommandés:**

#### 1. Secrets Manager Rotation (5 min)

**Pourquoi:** Conformité sécurité, rotation automatique des credentials

**Coût:** $0.40/secret/mois + $0.05 per 10K API calls = ~$1/mois

**Implémentation:**
```bash
# Activer rotation automatique (30 jours)
aws secretsmanager rotate-secret \
  --secret-id huntaze/database \
  --rotation-lambda-arn arn:aws:lambda:us-east-1:123456789012:function:SecretsManagerRDSPostgreSQLRotationSingleUser \
  --rotation-rules AutomaticallyAfterDays=30
```

**Documentation:** Déjà disponible dans `sam/SECRETS_ROTATION_GUIDE.md`

#### 2. KMS Customer Managed Keys (10 min)

**Pourquoi:** Contrôle total sur les clés, audit complet, rotation auto

**Coût:** $1/key/mois + $0.03 per 10K requests = ~$2/mois

**Implémentation:**
```bash
# Créer CMK pour RDS (symmetric key)
aws kms create-key \
  --description "Huntaze RDS encryption key" \
  --key-policy file://kms-policy.json

# Activer rotation automatique (1 an)
aws kms enable-key-rotation --key-id <key-id>
```

**⚠️ Important:** 
- Rotation automatique **uniquement pour symmetric keys** gérées par KMS
- Rotation annuelle, transparent pour les applications
- Asymmetric keys nécessitent rotation manuelle

**Documentation:** [KMS Key Rotation](https://docs.aws.amazon.com/kms/latest/developerguide/rotate-keys.html)

#### 3. CloudWatch Logs Retention Extended (2 min)

**Pourquoi:** Audit et troubleshooting sur période plus longue

**Coût:** ~$5-10/mois (dépend du volume)

**Implémentation:**
```bash
# Augmenter rétention à 90 jours
aws logs put-retention-policy \
  --log-group-name /aws/lambda/huntaze-mock-read \
  --retention-in-days 90
```

**Coût Total Palier 1:** ~$38-43/mois (+$8-13)

---

### Palier 2: Production GA

**Déclencheurs (AU MOINS 2 sur 3):**
- Users: > 1,000
- MRR: > $20K
- SLA contractuel: 99.5%

**Ajouts Recommandés:**

#### 1. RDS Multi-AZ (15 min)

**Pourquoi:** High Availability, failover automatique < 2 min

**Coût:** ~2× le coût de l'instance = +$15-20/mois

**Implémentation:**
```bash
aws rds modify-db-instance \
  --db-instance-identifier huntaze-postgres-production \
  --multi-az \
  --apply-immediately
```

**Bénéfice:**
- Uptime: 99.5% → 99.95%
- Failover: Automatique < 2 min
- Maintenance: Zero-downtime

**Documentation:** [RDS Multi-AZ](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html)

#### 2. AWS Incident Manager (30 min)

**Pourquoi:** Gestion d'incidents structurée, escalation automatique, runbooks

**Coût:** $0.50 per incident + $0.10 per engagement = ~$5-10/mois

**Implémentation:**
```yaml
# Response Plan
ResponsePlan:
  Name: huntaze-critical-incident
  IncidentTemplate:
    Title: "Critical Service Disruption"
    Impact: 1  # Critical
  Engagements:
    - ContactChannelArn: arn:aws:ssm-contacts:...
  Actions:
    - SSMAutomation:
        DocumentName: AWS-RestartEC2Instance
```

**Bénéfices:**
- Escalation automatique selon severity
- Runbooks automatisés
- Post-mortem tracking
- Intégration PagerDuty/Slack

**Documentation:** [Incident Manager](https://docs.aws.amazon.com/incident-manager/latest/userguide/what-is-incident-manager.html)

#### 3. CloudTrail S3 Trail (10 min)

**Pourquoi:** Audit > 90 jours, compliance, forensics

**Coût:** ~$2-5/mois (S3 storage + data events optionnels)

**Implémentation:**
```bash
aws cloudtrail create-trail \
  --name huntaze-audit-trail \
  --s3-bucket-name huntaze-cloudtrail-logs \
  --is-multi-region-trail \
  --enable-log-file-validation
```

**Note:** Garder Event History gratuit (90j) + Trail S3 pour long-term

**Coût Total Palier 2:** ~$60-78/mois (+$22-35)

---

### Palier 3: Enterprise / Multi-Region

**Déclencheurs (AU MOINS 2 sur 3):**
- Users: > 10,000
- MRR: > $100K
- SLA contractuel: 99.9%
- Compliance: SOC 2, ISO 27001

**Ajouts Recommandés:**

#### 1. RDS Cross-Region Backups (20 min)

**Pourquoi:** Disaster recovery régional, RTO < 1h

**Coût:** ~$10-20/mois (storage dans région secondaire)

**Implémentation:**
```bash
# Copier snapshots vers eu-west-1
aws rds copy-db-snapshot \
  --source-db-snapshot-identifier arn:aws:rds:us-east-1:...:snapshot:huntaze-daily \
  --target-db-snapshot-identifier huntaze-dr-eu-west-1 \
  --region eu-west-1 \
  --kms-key-id alias/aws/rds
```

**Automatisation:** EventBridge rule daily

#### 2. Aurora Global Database (si migration)

**Pourquoi:** Réplication cross-region < 1s, failover < 1 min

**Coût:** ~$100-200/mois (dépend de la taille)

**Bénéfice:**
- RPO: < 1 seconde
- RTO: < 1 minute
- Read replicas globales

#### 3. AWS Organizations + Multi-Account

**Pourquoi:** Isolation prod/staging/dev, billing consolidé

**Coût:** Gratuit (Organizations) + coûts des comptes

**Structure:**
```
huntaze-org/
├── prod-account
├── staging-account
├── dev-account
└── security-account (GuardDuty/Security Hub central)
```

#### 4. Shield Advanced (si DDoS critique)

**Pourquoi:** Protection DDoS avancée, cost protection, DRT support

**Coût:** $3,000/mois + data transfer out

**Note:** Overkill pour < 10K users. Shield Standard (gratuit) + WAF suffisent.

**Coût Total Palier 3:** ~$170-298/mois (+$110-220)

---

## 📋 Checklist par Palier

### Palier 0: Beta ✅

- [x] Cost Monitoring
- [x] Security Hub + GuardDuty
- [x] WAF Basic
- [x] RDS Single-AZ + Backups
- [x] CloudTrail Event History (90j)
- [x] Secrets Manager (basic)
- [x] KMS AWS-managed
- [x] CloudWatch Alarms

### Palier 1: Early GA

- [ ] Secrets Manager Rotation (30j)
- [ ] KMS Customer Managed Keys
- [ ] CloudWatch Logs 90j retention
- [ ] WAF Bot Control (Common)
- [ ] Performance Insights (7j)

### Palier 2: Production GA

- [ ] RDS Multi-AZ
- [ ] AWS Incident Manager
- [ ] CloudTrail S3 Trail
- [ ] CloudWatch Logs 180j retention
- [ ] AWS Config (drift detection)
- [ ] Backup cross-region (optionnel)

### Palier 3: Enterprise

- [ ] Aurora Global Database
- [ ] AWS Organizations
- [ ] Multi-region deployment
- [ ] Shield Advanced (si nécessaire)
- [ ] AWS Support Enterprise

---

## 💰 Évolution des Coûts

| Palier | Users | MRR | Infra Cost | % of MRR |
|--------|-------|-----|------------|----------|
| 0: Beta | 50-200 | $0-5K | $30 | 0.6-∞% |
| 1: Early GA | 200-1K | $5-20K | $38-43 | 0.2-0.9% |
| 2: Production GA | 1K-10K | $20-100K | $60-78 | 0.06-0.4% |
| 3: Enterprise | 10K+ | $100K+ | $170-298 | 0.17-0.3% |

**Règle d'or:** Infrastructure cost < 1% of MRR

---

## 🎯 Métriques de Décision

### Quand Passer au Palier Suivant ?

**Signaux Positifs (GO):**
- ✅ MRR croît de > 20% MoM pendant 3 mois
- ✅ Churn rate < 5%
- ✅ Incidents < 1 par mois
- ✅ Uptime actuel > target du palier actuel
- ✅ Demandes clients pour SLA plus élevé

**Signaux Négatifs (WAIT):**
- ⚠️ MRR stagnant ou en baisse
- ⚠️ Churn rate > 10%
- ⚠️ Incidents fréquents (> 2 par mois)
- ⚠️ Coûts infra > 2% of MRR
- ⚠️ Pas de demande client pour meilleur SLA

---

## 🔄 Processus de Migration

### Template de Décision

```markdown
## Migration vers Palier X

**Date:** YYYY-MM-DD
**Décideur:** [Name]

### Métriques Actuelles
- Users: XXX
- MRR: $XXX
- SLA actuel: XX%
- Uptime 30j: XX%
- Incidents 30j: X

### Déclencheurs Atteints
- [ ] Users > seuil
- [ ] MRR > seuil
- [ ] SLA demandé

### Coût Additionnel
- Actuel: $XX/mois
- Nouveau: $XX/mois
- Delta: +$XX/mois (+XX%)

### ROI Estimé
- Réduction incidents: -XX%
- Amélioration uptime: +XX%
- Satisfaction client: +XX%

### Décision
- [ ] GO - Migrer maintenant
- [ ] WAIT - Réévaluer dans X mois
- [ ] SKIP - Pas nécessaire

### Timeline
- Semaine 1: Préparation
- Semaine 2: Implémentation
- Semaine 3: Validation
- Semaine 4: Monitoring
```

---

## 📖 Documentation par Palier

### Palier 0 (Actuel)

**Guides Disponibles:**
- ✅ `sam/COST_MONITORING_GUIDE.md`
- ✅ `sam/SECURITY_MONITORING_GUIDE.md`
- ✅ `sam/RDS_BACKUP_RECOVERY_GUIDE.md`
- ✅ `sam/SECRETS_ROTATION_GUIDE.md` (prêt pour Palier 1)

### Palier 1 (À Créer)

**Guides Nécessaires:**
- [ ] `sam/KMS_CMK_SETUP_GUIDE.md`
- [ ] `sam/WAF_BOT_CONTROL_GUIDE.md`

### Palier 2 (À Créer)

**Guides Nécessaires:**
- [ ] `sam/RDS_MULTI_AZ_MIGRATION.md`
- [ ] `sam/INCIDENT_MANAGER_SETUP.md`
- [ ] `sam/CLOUDTRAIL_EXTENDED_GUIDE.md`

### Palier 3 (À Créer)

**Guides Nécessaires:**
- [ ] `sam/AURORA_GLOBAL_MIGRATION.md`
- [ ] `sam/MULTI_ACCOUNT_STRATEGY.md`

---

## 🚨 Ce Qu'il NE FAUT PAS Faire

### ❌ Anti-Patterns

1. **Over-Engineering Précoce**
   - ❌ Multi-AZ pour 50 users
   - ❌ Shield Advanced pour beta
   - ❌ Aurora Global pour < 1K users

2. **Sous-Estimation des Coûts**
   - ❌ Activer tous les services "au cas où"
   - ❌ CloudTrail data events sans besoin
   - ❌ Logs retention infinie

3. **Ignorer les Métriques**
   - ❌ Migrer sans mesurer l'uptime actuel
   - ❌ Ajouter Multi-AZ sans incidents documentés
   - ❌ Payer pour SLA 99.9% sans demande client

### ✅ Best Practices

1. **Mesurer Avant d'Investir**
   - ✅ Tracker uptime pendant 3 mois
   - ✅ Documenter tous les incidents
   - ✅ Calculer le coût réel des downtimes

2. **Itérer Progressivement**
   - ✅ Un palier à la fois
   - ✅ Valider chaque amélioration
   - ✅ Mesurer le ROI réel

3. **Écouter les Clients**
   - ✅ SLA basé sur demandes clients
   - ✅ Features basées sur feedback
   - ✅ Investir où ça compte

---

## 📞 Support & Ressources

### AWS Well-Architected Framework

- [Reliability Pillar](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html)
- [Cost Optimization Pillar](https://docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/welcome.html)
- [Security Pillar](https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/welcome.html)

### AWS Support Plans

| Plan | Coût | Use Case |
|------|------|----------|
| Basic | Gratuit | Beta (actuel) |
| Developer | $29/mois | Early GA |
| Business | $100/mois | Production GA |
| Enterprise | $15K/mois | Enterprise |

**Recommandation:** Developer pour Palier 1, Business pour Palier 2

---

## 🎉 Conclusion

**Status Actuel:** ✅ Beta Ready

**Setup Actuel Suffit Pour:**
- 50-200 users
- MRR < $5K
- SLA best effort
- Uptime target 95%

**Prochaine Évaluation:** Quand 2+ déclencheurs Palier 1 atteints

**Action Immédiate:** Aucune - Monitorer et itérer

---

**Dernière Mise à Jour:** 27 octobre 2024  
**Prochaine Revue:** Mensuelle ou quand déclencheurs atteints
