# 💾 RDS Backup & Recovery Guide

## Overview

RDS automated backups + PITR (Point-in-Time Recovery) permettent de restaurer la base de données à n'importe quel instant des 7 derniers jours, avec une granularité à la seconde.

## Configuration Actuelle

### Automated Backups

- **DB Instance:** huntaze-postgres-production
- **Retention:** 7 jours
- **Backup Window:** 03:00-04:00 UTC (off-peak)
- **PITR:** ✅ Enabled
- **Latest Restorable Time:** Mis à jour en continu (lag < 5 min)

### Backup Storage

- **Gratuit:** Jusqu'à 100% de la taille totale des DB instances
- **Coût additionnel:** ~$0.095/GB-month au-delà
- **Estimation:** ~$2-5/month pour 7 jours de rétention

## Point-in-Time Recovery (PITR)

### Qu'est-ce que PITR ?

PITR permet de restaurer la base de données à **n'importe quelle seconde** dans la fenêtre de rétention (7 jours). C'est différent des snapshots quotidiens qui ne permettent de restaurer qu'à des moments précis.

### Comment ça marche ?

1. **Snapshots automatiques quotidiens** (pendant la backup window)
2. **Transaction logs** capturés en continu
3. **Restauration** = Snapshot + Replay des transaction logs jusqu'au timestamp demandé

### Fenêtre de Restauration

```
Aujourd'hui - 7 jours  ←→  LatestRestorableTime (maintenant - 5 min)
```

Vous pouvez restaurer à n'importe quel instant dans cette fenêtre.

## Procédures de Restauration

### 1. Restauration PITR (Recommandé)

**Cas d'usage:** Corruption de données, erreur humaine, besoin de revenir à un état précis

**Commande:**
```bash
# Restaurer au timestamp le plus récent
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier huntaze-postgres-production \
  --target-db-instance-identifier huntaze-postgres-restored-$(date +%Y%m%d-%H%M) \
  --use-latest-restorable-time \
  --db-instance-class db.t3.micro \
  --no-publicly-accessible \
  --region us-east-1

# Ou restaurer à un timestamp spécifique
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier huntaze-postgres-production \
  --target-db-instance-identifier huntaze-postgres-restored-20251027 \
  --restore-time "2025-10-27T12:00:00Z" \
  --db-instance-class db.t3.micro \
  --no-publicly-accessible \
  --region us-east-1
```

**Temps de restauration:** 10-30 minutes (dépend de la taille de la DB)

### 2. Restauration depuis Snapshot

**Cas d'usage:** Restauration plus rapide si le snapshot quotidien suffit

**Commande:**
```bash
# Lister les snapshots disponibles
aws rds describe-db-snapshots \
  --db-instance-identifier huntaze-postgres-production \
  --snapshot-type automated \
  --region us-east-1 \
  --query 'DBSnapshots[*].[DBSnapshotIdentifier,SnapshotCreateTime]' \
  --output table

# Restaurer depuis un snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier huntaze-postgres-restored-snapshot \
  --db-snapshot-identifier rds:huntaze-postgres-production-2025-10-27-03-19 \
  --db-instance-class db.t3.micro \
  --no-publicly-accessible \
  --region us-east-1
```

**Temps de restauration:** 5-15 minutes (plus rapide que PITR)

### 3. Créer un Snapshot Manuel

**Cas d'usage:** Avant une migration majeure, changement de schéma, etc.

**Commande:**
```bash
aws rds create-db-snapshot \
  --db-instance-identifier huntaze-postgres-production \
  --db-snapshot-identifier huntaze-manual-pre-migration-$(date +%Y%m%d) \
  --region us-east-1
```

**Rétention:** Les snapshots manuels ne sont **jamais supprimés automatiquement**

## Disaster Recovery Runbook

### Scénario 1: Corruption de Données Détectée

**Objectif:** Restaurer à l'état juste avant la corruption

**RTO:** 2 heures  
**RPO:** 5 minutes

**Étapes:**

1. **Identifier le timestamp de corruption**
   ```bash
   # Vérifier les logs applicatifs
   # Identifier le dernier état sain
   RESTORE_TIME="2025-10-27T14:30:00Z"
   ```

2. **Créer un snapshot de l'état actuel (forensics)**
   ```bash
   aws rds create-db-snapshot \
     --db-instance-identifier huntaze-postgres-production \
     --db-snapshot-identifier huntaze-corrupted-$(date +%Y%m%d-%H%M) \
     --region us-east-1
   ```

3. **Restaurer PITR vers nouvelle instance**
   ```bash
   aws rds restore-db-instance-to-point-in-time \
     --source-db-instance-identifier huntaze-postgres-production \
     --target-db-instance-identifier huntaze-postgres-dr-$(date +%Y%m%d) \
     --restore-time "$RESTORE_TIME" \
     --db-instance-class db.t3.micro \
     --region us-east-1
   ```

4. **Attendre que l'instance soit disponible**
   ```bash
   aws rds wait db-instance-available \
     --db-instance-identifier huntaze-postgres-dr-$(date +%Y%m%d) \
     --region us-east-1
   ```

5. **Vérifier l'intégrité des données**
   ```bash
   # Se connecter à la nouvelle instance
   # Vérifier que les données sont saines
   # Compter les enregistrements, vérifier les tables critiques
   ```

6. **Basculer l'application**
   ```bash
   # Mettre à jour DATABASE_URL dans Secrets Manager
   aws secretsmanager update-secret \
     --secret-id huntaze/database \
     --secret-string '{"DATABASE_URL":"postgresql://user:pass@new-endpoint:5432/db"}' \
     --region us-east-1
   
   # Redémarrer les Lambdas pour prendre en compte le nouveau endpoint
   ```

7. **Supprimer l'ancienne instance (après validation)**
   ```bash
   # Attendre 24-48h pour être sûr
   aws rds delete-db-instance \
     --db-instance-identifier huntaze-postgres-production \
     --skip-final-snapshot \
     --region us-east-1
   ```

### Scénario 2: Perte Complète de l'Instance

**Objectif:** Restaurer rapidement depuis le dernier backup

**RTO:** 1 heure  
**RPO:** 5 minutes

**Étapes:**

1. **Restaurer au timestamp le plus récent**
   ```bash
   aws rds restore-db-instance-to-point-in-time \
     --source-db-instance-identifier huntaze-postgres-production \
     --target-db-instance-identifier huntaze-postgres-production \
     --use-latest-restorable-time \
     --db-instance-class db.t3.micro \
     --region us-east-1
   ```

2. **Attendre disponibilité et basculer**

### Scénario 3: Test de Restauration (Mensuel)

**Objectif:** Valider que les backups sont fonctionnels

**Fréquence:** 1er de chaque mois à 03:00 UTC

**Étapes:**

1. **Restaurer vers instance de test**
   ```bash
   aws rds restore-db-instance-to-point-in-time \
     --source-db-instance-identifier huntaze-postgres-production \
     --target-db-instance-identifier huntaze-postgres-dr-test-$(date +%Y%m) \
     --use-latest-restorable-time \
     --db-instance-class db.t3.micro \
     --region us-east-1
   ```

2. **Vérifier la connectivité**
   ```bash
   # Attendre disponibilité
   aws rds wait db-instance-available \
     --db-instance-identifier huntaze-postgres-dr-test-$(date +%Y%m) \
     --region us-east-1
   
   # Tester la connexion
   psql -h <endpoint> -U <user> -d <db> -c "SELECT COUNT(*) FROM users;"
   ```

3. **Supprimer l'instance de test**
   ```bash
   aws rds delete-db-instance \
     --db-instance-identifier huntaze-postgres-dr-test-$(date +%Y%m) \
     --skip-final-snapshot \
     --region us-east-1
   ```

4. **Alerter si échec**
   ```bash
   # Via SNS
   aws sns publish \
     --topic-arn arn:aws:sns:us-east-1:317805897534:huntaze-production-alerts \
     --subject "RDS Backup Test Failed" \
     --message "Monthly backup restore test failed. Investigate immediately." \
     --region us-east-1
   ```

## Monitoring & Alertes

### Métriques à Surveiller

1. **BackupRetentionPeriod**
   - Doit être = 7 jours
   - Alarme si < 7

2. **LatestRestorableTime**
   - Doit être < 1 heure du temps actuel
   - Alarme si lag > 1 heure

3. **Automated Snapshots**
   - Doit y avoir 1 snapshot par jour
   - Alarme si aucun snapshot dans les 25 dernières heures

### Commandes de Vérification

```bash
# Vérifier la configuration
aws rds describe-db-instances \
  --db-instance-identifier huntaze-postgres-production \
  --query 'DBInstances[0].[BackupRetentionPeriod,PreferredBackupWindow,LatestRestorableTime]' \
  --output table

# Vérifier les snapshots récents
aws rds describe-db-snapshots \
  --db-instance-identifier huntaze-postgres-production \
  --snapshot-type automated \
  --query 'DBSnapshots[0:7].[DBSnapshotIdentifier,SnapshotCreateTime,Status]' \
  --output table

# Calculer le PITR lag
LATEST=$(aws rds describe-db-instances \
  --db-instance-identifier huntaze-postgres-production \
  --query 'DBInstances[0].LatestRestorableTime' \
  --output text)

echo "Latest restorable time: $LATEST"
echo "Current time: $(date -u +%Y-%m-%dT%H:%M:%S)"
```

## Best Practices

### 1. Tester Régulièrement

- ✅ Test mensuel automatisé
- ✅ Test manuel trimestriel avec validation complète
- ✅ Documenter les temps de restauration réels

### 2. Snapshots Manuels Avant Changements Majeurs

```bash
# Avant migration de schéma
aws rds create-db-snapshot \
  --db-instance-identifier huntaze-postgres-production \
  --db-snapshot-identifier huntaze-pre-schema-migration-v2 \
  --region us-east-1
```

### 3. Cross-Region Backups (Optionnel)

Pour disaster recovery géographique :

**⚠️ Architecture Consideration:**

**Pour RDS DB Instance (actuel):**
```bash
# Copier un snapshot vers une autre région
aws rds copy-db-snapshot \
  --source-db-snapshot-identifier arn:aws:rds:us-east-1:317805897534:snapshot:huntaze-manual-20251027 \
  --target-db-snapshot-identifier huntaze-dr-eu-west-1 \
  --region eu-west-1 \
  --kms-key-id alias/aws/rds
```

**⚠️ Pour Multi-AZ DB Clusters (si migration future):**
- Automated backups cross-region **NON SUPPORTÉS**
- Solutions alternatives:
  1. Snapshots manuels + copie cross-region
  2. Rester sur DB Instance (pas cluster)
  3. Aurora Global Database (Palier 3 GA)

**Recommandation:** Garder RDS DB Instance si cross-region DR requis

**Coût:** ~$0.095/GB-month dans la région de destination

### 4. Encryption at Rest

Vérifier que les backups sont chiffrés :

```bash
aws rds describe-db-snapshots \
  --db-instance-identifier huntaze-postgres-production \
  --query 'DBSnapshots[0].Encrypted' \
  --output text
```

Si non chiffré, créer une copie chiffrée avec KMS CMK :

```bash
# Créer CMK pour RDS (symmetric key)
KEY_ID=$(aws kms create-key \
  --description "Huntaze RDS encryption key" \
  --key-usage ENCRYPT_DECRYPT \
  --key-spec SYMMETRIC_DEFAULT \
  --query 'KeyMetadata.KeyId' \
  --output text)

# ⚠️ IMPORTANT: Activer rotation automatique (1 an)
# Uniquement pour symmetric keys gérées par KMS
aws kms enable-key-rotation --key-id $KEY_ID

# Vérifier que la rotation est activée
aws kms get-key-rotation-status --key-id $KEY_ID

# Copier snapshot avec encryption
aws rds copy-db-snapshot \
  --source-db-snapshot-identifier rds:huntaze-postgres-production-2025-10-27-03-19 \
  --target-db-snapshot-identifier huntaze-encrypted-20251027 \
  --kms-key-id $KEY_ID \
  --region us-east-1
```

**⚠️ Limitation KMS Rotation:**
- Rotation automatique uniquement pour symmetric keys (SYMMETRIC_DEFAULT)
- Keys gérées par KMS (pas les EXTERNAL)
- Rotation annuelle (non configurable)
- Transparente pour les applications

## Troubleshooting

### Problème: LatestRestorableTime est None

**Cause:** Backups pas encore initialisés ou désactivés

**Solution:**
```bash
# Vérifier la rétention
aws rds describe-db-instances \
  --db-instance-identifier huntaze-postgres-production \
  --query 'DBInstances[0].BackupRetentionPeriod'

# Si 0, activer les backups
./scripts/configure-rds-backups.sh
```

### Problème: Restauration échoue avec "InvalidParameterValue"

**Cause:** Timestamp en dehors de la fenêtre de rétention

**Solution:**
```bash
# Vérifier la fenêtre disponible
aws rds describe-db-instances \
  --db-instance-identifier huntaze-postgres-production \
  --query 'DBInstances[0].[LatestRestorableTime,BackupRetentionPeriod]'

# Utiliser un timestamp dans la fenêtre
```

### Problème: Restauration très lente

**Cause:** Grande base de données ou beaucoup de transaction logs à rejouer

**Solution:**
- Utiliser un snapshot quotidien si la granularité à la seconde n'est pas nécessaire
- Augmenter la classe d'instance de la cible pour accélérer

## Coûts

### Backup Storage

| Composant | Coût | Notes |
|-----------|------|-------|
| Automated backups | Gratuit | Jusqu'à 100% de la taille DB |
| Snapshots manuels | $0.095/GB-month | Pas de limite gratuite |
| Cross-region copy | $0.095/GB-month | Dans la région de destination |

### Restauration

| Opération | Coût | Notes |
|-----------|------|-------|
| PITR restore | Gratuit | Coût de la nouvelle instance seulement |
| Snapshot restore | Gratuit | Coût de la nouvelle instance seulement |
| Data transfer | Gratuit | Si dans la même région |

### Estimation Mensuelle

- **7 jours de rétention:** ~$2-5/month
- **Snapshots manuels (3):** ~$1-3/month
- **Test mensuel:** ~$0.50/month (instance éphémère)
- **Total:** ~$3.50-8.50/month

## Support

### Documentation AWS

- [RDS Automated Backups](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.html)
- [Point-in-Time Recovery](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PIT.html)
- [Restoring from Snapshot](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_RestoreFromSnapshot.html)

### Commandes Utiles

```bash
# Configuration actuelle
./scripts/configure-rds-backups.sh

# Test PITR
./scripts/test-rds-pitr-restore.sh

# Vérifier les backups
aws rds describe-db-snapshots \
  --db-instance-identifier huntaze-postgres-production \
  --region us-east-1
```

## RTO/RPO

### Objectifs

- **RTO (Recovery Time Objective):** 2 heures
- **RPO (Recovery Point Objective):** 5 minutes

### Réalité Mesurée

- **RTO réel:** 30-60 minutes (PITR) / 15-30 minutes (snapshot)
- **RPO réel:** < 5 minutes (PITR continu)

### Amélioration Possible

Pour RTO < 30 min :
- Utiliser Aurora avec Read Replicas
- Activer Multi-AZ
- Pré-provisionner une instance de standby

Pour RPO < 1 min :
- Utiliser Aurora avec Backtrack
- Réplication synchrone vers standby
