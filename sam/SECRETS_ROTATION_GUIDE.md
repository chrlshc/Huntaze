# 🔐 AWS Secrets Manager - Rotation Automatique

Guide pour configurer la rotation automatique des credentials de base de données.

---

## 📋 Pourquoi Rotation Automatique ?

- ✅ Conformité sécurité (SOC2, ISO 27001)
- ✅ Réduction risque de compromission
- ✅ Best practice AWS
- ✅ Zéro downtime avec rotation

---

## 🎯 Stratégies de Rotation

### 1. Single User Rotation (Recommandé pour Beta)

**Avantages:**
- Simple à configurer
- Pas besoin de permissions supplémentaires
- Fonctionne avec RDS standard

**Inconvénients:**
- Brève interruption possible (~2-3 secondes)

### 2. Alternating Users Rotation (Production)

**Avantages:**
- Zéro downtime garanti
- Rollback immédiat possible

**Inconvénients:**
- Nécessite 2 users DB
- Configuration plus complexe

---

## 🚀 Configuration Single User Rotation

### Étape 1: Vérifier le Secret

```bash
# Lister les secrets
aws secretsmanager list-secrets --region us-east-1

# Décrire le secret
aws secretsmanager describe-secret \
    --secret-id huntaze/database \
    --region us-east-1
```

### Étape 2: Activer la Rotation

```bash
# Rotation tous les 30 jours
aws secretsmanager rotate-secret \
    --secret-id huntaze/database \
    --rotation-lambda-arn arn:aws:lambda:us-east-1:317805897534:function:SecretsManagerRDSPostgreSQLRotationSingleUser \
    --rotation-rules AutomaticallyAfterDays=30 \
    --region us-east-1
```

### Étape 3: Créer la Lambda de Rotation

AWS fournit des templates prêts à l'emploi :

```bash
# Via SAM Template
aws serverlessrepo create-cloud-formation-change-set \
    --application-id arn:aws:serverlessrepo:us-east-1:297356227824:applications/SecretsManagerRDSPostgreSQLRotationSingleUser \
    --stack-name huntaze-secrets-rotation \
    --capabilities CAPABILITY_IAM CAPABILITY_RESOURCE_POLICY \
    --parameter-overrides \
        endpoint=https://secretsmanager.us-east-1.amazonaws.com \
        functionName=huntaze-secrets-rotation-function

# Exécuter le changeset
aws cloudformation execute-change-set \
    --change-set-name <changeset-name> \
    --stack-name huntaze-secrets-rotation
```

### Étape 4: Configurer les Permissions

La Lambda de rotation a besoin de:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:DescribeSecret",
        "secretsmanager:GetSecretValue",
        "secretsmanager:PutSecretValue",
        "secretsmanager:UpdateSecretVersionStage"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:317805897534:secret:huntaze/database*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetRandomPassword"
      ],
      "Resource": "*"
    }
  ]
}
```

### Étape 5: Tester la Rotation

```bash
# Rotation immédiate (test)
aws secretsmanager rotate-secret \
    --secret-id huntaze/database \
    --region us-east-1

# Vérifier le status
aws secretsmanager describe-secret \
    --secret-id huntaze/database \
    --region us-east-1 \
    --query 'RotationEnabled'
```

---

## 🔄 Configuration Alternating Users (Production)

### Étape 1: Créer un Second User DB

```sql
-- Connecté en tant que master user
CREATE USER huntaze_app_2 WITH PASSWORD 'temporary_password';
GRANT ALL PRIVILEGES ON DATABASE huntaze TO huntaze_app_2;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO huntaze_app_2;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO huntaze_app_2;
```

### Étape 2: Mettre à Jour le Secret

```json
{
  "engine": "postgres",
  "host": "huntaze-prod.xxxxx.us-east-1.rds.amazonaws.com",
  "username": "huntaze_app_1",
  "password": "current_password",
  "dbname": "huntaze",
  "port": 5432,
  "masterarn": "arn:aws:secretsmanager:us-east-1:317805897534:secret:huntaze/database-master"
}
```

### Étape 3: Activer Alternating Rotation

```bash
aws secretsmanager rotate-secret \
    --secret-id huntaze/database \
    --rotation-lambda-arn arn:aws:lambda:us-east-1:317805897534:function:SecretsManagerRDSPostgreSQLRotationMultiUser \
    --rotation-rules AutomaticallyAfterDays=30 \
    --region us-east-1
```

---

## 📊 Monitoring de la Rotation

### CloudWatch Metrics

```bash
# Vérifier les métriques de rotation
aws cloudwatch get-metric-statistics \
    --namespace AWS/SecretsManager \
    --metric-name RotationSucceeded \
    --dimensions Name=SecretId,Value=huntaze/database \
    --start-time 2024-01-01T00:00:00Z \
    --end-time 2024-12-31T23:59:59Z \
    --period 86400 \
    --statistics Sum \
    --region us-east-1
```

### CloudWatch Alarms

```yaml
# Ajouter au template SAM
RotationFailureAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: huntaze-secrets-rotation-failure
    AlarmDescription: "Alert on secrets rotation failure"
    ComparisonOperator: GreaterThanThreshold
    EvaluationPeriods: 1
    MetricName: RotationFailed
    Namespace: AWS/SecretsManager
    Period: 300
    Statistic: Sum
    Threshold: 0
    TreatMissingData: notBreaching
    AlarmActions:
      - !Ref ErrorRateAlarmTopic
    Dimensions:
      - Name: SecretId
        Value: huntaze/database
```

---

## 🔍 Troubleshooting

### Rotation Échoue

```bash
# Vérifier les logs Lambda
aws logs tail /aws/lambda/huntaze-secrets-rotation-function \
    --follow \
    --region us-east-1

# Vérifier les permissions
aws secretsmanager get-resource-policy \
    --secret-id huntaze/database \
    --region us-east-1
```

### Connexion DB Échoue Après Rotation

```bash
# Vérifier la version actuelle du secret
aws secretsmanager get-secret-value \
    --secret-id huntaze/database \
    --version-stage AWSCURRENT \
    --region us-east-1

# Rollback si nécessaire
aws secretsmanager update-secret-version-stage \
    --secret-id huntaze/database \
    --version-stage AWSCURRENT \
    --move-to-version-id <previous-version-id> \
    --region us-east-1
```

---

## 📋 Checklist de Configuration

### Single User Rotation
- [ ] Secret existe dans Secrets Manager
- [ ] Lambda de rotation déployée
- [ ] Permissions IAM configurées
- [ ] VPC configuration (si RDS privé)
- [ ] Rotation activée (30 jours)
- [ ] Test de rotation réussi
- [ ] Alarme CloudWatch configurée
- [ ] Logs monitoring actif

### Alternating Users Rotation
- [ ] Tous les items ci-dessus
- [ ] Second user DB créé
- [ ] Permissions DB accordées
- [ ] Master secret configuré
- [ ] Test de basculement réussi

---

## 💰 Coûts

### Secrets Manager
- $0.40/secret/mois
- $0.05 par 10,000 API calls

### Lambda Rotation
- Gratuit (AWS Free Tier)
- ~1-2 invocations/mois

**Total estimé:** ~$0.50/mois

---

## 🎯 Best Practices

1. **Rotation Frequency**
   - Beta: 30 jours
   - Production: 7-14 jours
   - Haute sécurité: 1 jour

2. **Testing**
   - Tester rotation en staging d'abord
   - Vérifier connexions Lambda après rotation
   - Monitorer logs pendant 24h

3. **Backup**
   - Garder versions précédentes (AWSPREVIOUS)
   - Documenter procédure de rollback
   - Tester rollback régulièrement

4. **Monitoring**
   - Alarme sur échec de rotation
   - Logs centralisés
   - Dashboard dédié

---

## 🚀 Commandes Rapides

```bash
# Status rotation
aws secretsmanager describe-secret \
    --secret-id huntaze/database \
    --region us-east-1 \
    --query '{Rotation:RotationEnabled,LastRotation:LastRotatedDate,NextRotation:NextRotationDate}'

# Forcer rotation immédiate
aws secretsmanager rotate-secret \
    --secret-id huntaze/database \
    --region us-east-1

# Désactiver rotation (urgence)
aws secretsmanager cancel-rotate-secret \
    --secret-id huntaze/database \
    --region us-east-1
```

---

**Status:** ✅ Prêt à configurer  
**Temps estimé:** 30-45 minutes  
**Impact:** 🔐 High (sécurité + conformité)
