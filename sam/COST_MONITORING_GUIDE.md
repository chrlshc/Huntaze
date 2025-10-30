# 💰 Cost Monitoring Guide

## Overview

Le cost monitoring Huntaze utilise AWS Budgets et Cost Anomaly Detection pour surveiller les dépenses et détecter les anomalies automatiquement.

## Configuration Actuelle

### Budget Mensuel

- **Montant:** $100 USD/mois
- **Alertes:**
  - 50% ($50) - Warning
  - 80% ($80) - Alert
  - 100% ($100) - Critical
  - Forecast > 100% - Prévision de dépassement

### Cost Anomaly Detection

- **Type:** Dimensional (par service AWS)
- **Seuil:** $10 USD ou 20% de déviation
- **Fréquence:** Alertes immédiates
- **ML:** Détection automatique basée sur patterns historiques

## Comment Lire les Alertes

### Budget Alert Email

```
Subject: AWS Budgets: huntaze-monthly-budget has exceeded 50% of your budget

Your budget huntaze-monthly-budget has exceeded 50.0% of your $100.00 budget.
Current spend: $52.34
```

**Actions:**
1. Ouvrir Cost Explorer: https://console.aws.amazon.com/cost-management/home?region=us-east-1#/dashboard
2. Vérifier le breakdown par service
3. Identifier les services avec augmentation inhabituelle
4. Investiguer les ressources spécifiques

### Anomaly Detection Alert

```
Subject: AWS Cost Anomaly Detection Alert

An anomaly has been detected in your AWS spending:
Service: Amazon RDS
Impact: $15.23 (increase of 45%)
Date: 2024-10-27
```

**Actions:**
1. Ouvrir Anomaly Detection: https://console.aws.amazon.com/cost-management/home?region=us-east-1#/anomaly-detection
2. Cliquer sur l'anomalie pour voir les détails
3. Vérifier si c'est légitime (ex: migration, nouveau feature)
4. Si illégitime, investiguer la cause (misconfiguration, attack)

## Investiguer les Coûts

### 1. Cost Explorer

**URL:** https://console.aws.amazon.com/cost-management/home?region=us-east-1#/custom

**Vues utiles:**

**Par Service:**
```
Group by: Service
Time range: Last 30 days
Granularity: Daily
```

**Par Tag:**
```
Group by: Tag (Environment, Project, etc.)
Time range: Last 30 days
```

**Top 5 Services:**
```bash
aws ce get-cost-and-usage \
    --time-period Start=2024-10-01,End=2024-10-31 \
    --granularity MONTHLY \
    --metrics BlendedCost \
    --group-by Type=DIMENSION,Key=SERVICE \
    --query 'ResultsByTime[0].Groups | sort_by(@, &Metrics.BlendedCost.Amount) | reverse(@) | [0:5]' \
    --output table
```

### 2. Identifier les Ressources Coûteuses

**Lambda:**
```bash
# Invocations par fonction
aws cloudwatch get-metric-statistics \
    --namespace AWS/Lambda \
    --metric-name Invocations \
    --dimensions Name=FunctionName,Value=huntaze-mock-read \
    --start-time $(date -u -d '30 days ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 86400 \
    --statistics Sum
```

**RDS:**
```bash
# Vérifier la taille de l'instance
aws rds describe-db-instances \
    --db-instance-identifier huntaze-prod \
    --query 'DBInstances[0].[DBInstanceClass,AllocatedStorage,StorageType]' \
    --output table
```

**CloudWatch Logs:**
```bash
# Taille des log groups
aws logs describe-log-groups \
    --log-group-name-prefix "/aws/lambda/huntaze" \
    --query 'logGroups[*].[logGroupName,storedBytes]' \
    --output table
```

### 3. Analyser les Tendances

**Coût par jour (30 derniers jours):**
```bash
aws ce get-cost-and-usage \
    --time-period Start=$(date -u -d '30 days ago' +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
    --granularity DAILY \
    --metrics BlendedCost \
    --query 'ResultsByTime[*].[TimePeriod.Start,Total.BlendedCost.Amount]' \
    --output table
```

**Forecast (7 prochains jours):**
```bash
aws ce get-cost-forecast \
    --time-period Start=$(date -u +%Y-%m-%d),End=$(date -u -d '7 days' +%Y-%m-%d) \
    --metric BLENDED_COST \
    --granularity DAILY \
    --query 'Total.Amount' \
    --output text
```

## Actions Correctives

### Réduire les Coûts Lambda

**1. Optimiser la mémoire:**
```bash
# Tester différentes configurations
aws lambda update-function-configuration \
    --function-name huntaze-mock-read \
    --memory-size 256  # Réduire de 512 à 256 si possible
```

**2. Réduire le timeout:**
```bash
aws lambda update-function-configuration \
    --function-name huntaze-mock-read \
    --timeout 10  # Réduire de 30 à 10 si possible
```

### Réduire les Coûts RDS

**1. Vérifier les connexions inutilisées:**
```sql
SELECT count(*) FROM pg_stat_activity WHERE state = 'idle';
```

**2. Activer Performance Insights (gratuit 7 jours):**
```bash
aws rds modify-db-instance \
    --db-instance-identifier huntaze-prod \
    --enable-performance-insights \
    --performance-insights-retention-period 7
```

**3. Considérer Reserved Instances (si usage stable):**
- Économie: 30-60% vs On-Demand
- Engagement: 1 ou 3 ans

### Réduire les Coûts CloudWatch

**1. Logs retention (déjà configuré à 30 jours):**
```bash
aws logs put-retention-policy \
    --log-group-name /aws/lambda/huntaze-mock-read \
    --retention-in-days 30
```

**2. X-Ray sampling (déjà configuré à 10%):**
- Économie: 90% des coûts X-Ray
- Impact: Minimal sur observabilité

### Réduire les Coûts Data Transfer

**1. Utiliser VPC Endpoints (si applicable):**
- Évite les coûts de NAT Gateway
- Gratuit pour S3, DynamoDB

**2. Activer S3 Transfer Acceleration (si uploads fréquents):**
- Peut réduire les coûts de retry

## Ajuster le Budget

### Augmenter le Budget

Si l'augmentation est légitime (nouveau feature, croissance):

```bash
# Via AWS CLI (nécessite account ID)
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

aws budgets update-budget \
    --account-id $ACCOUNT_ID \
    --budget '{
        "BudgetName": "huntaze-monthly-budget",
        "BudgetLimit": {
            "Amount": "150",
            "Unit": "USD"
        },
        "TimeUnit": "MONTHLY",
        "BudgetType": "COST"
    }'
```

Ou modifier dans `sam/template.yaml`:
```yaml
MonthlyBudget:
  Type: AWS::Budgets::Budget
  Properties:
    Budget:
      BudgetLimit:
        Amount: 150  # Augmenter ici
```

Puis redéployer:
```bash
cd sam
sam build
sam deploy
```

### Ajuster les Seuils d'Alerte

Modifier dans `sam/template.yaml`:
```yaml
NotificationsWithSubscribers:
  - Notification:
      Threshold: 60  # Changer de 50 à 60
```

## Exclure des Services de l'Anomaly Detection

Si un service a des patterns irréguliers légitimes:

```bash
# Via Console AWS
# 1. Aller dans Cost Anomaly Detection
# 2. Cliquer sur le monitor
# 3. Edit > Add filter
# 4. Exclude: Service = "Amazon S3" (exemple)
```

## Dashboard CloudWatch

**URL:** https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=huntaze-prisma-migration

**Widgets Cost Monitoring:**
- Current Spend vs Budget
- Forecasted Spend
- Anomaly Detection Alerts

## Rapports Mensuels

### Générer un Rapport de Coûts

```bash
# Coûts du mois en cours
MONTH_START=$(date -u +%Y-%m-01)
MONTH_END=$(date -u +%Y-%m-%d)

aws ce get-cost-and-usage \
    --time-period Start=$MONTH_START,End=$MONTH_END \
    --granularity MONTHLY \
    --metrics BlendedCost \
    --group-by Type=DIMENSION,Key=SERVICE \
    --query 'ResultsByTime[0].Groups | sort_by(@, &Metrics.BlendedCost.Amount) | reverse(@)' \
    --output table > monthly-cost-report.txt

echo "Report saved to monthly-cost-report.txt"
```

### Comparer avec le Mois Précédent

```bash
# Mois précédent
PREV_MONTH_START=$(date -u -d '1 month ago' +%Y-%m-01)
PREV_MONTH_END=$(date -u -d '1 month ago' +%Y-%m-%d)

aws ce get-cost-and-usage \
    --time-period Start=$PREV_MONTH_START,End=$PREV_MONTH_END \
    --granularity MONTHLY \
    --metrics BlendedCost \
    --query 'ResultsByTime[0].Total.BlendedCost.Amount' \
    --output text
```

## Best Practices

### 1. Review Mensuel

- [ ] Vérifier le budget vs actual
- [ ] Analyser les anomalies détectées
- [ ] Identifier les opportunités d'optimisation
- [ ] Ajuster le budget si nécessaire

### 2. Tagging

Ajouter des tags aux ressources pour meilleur tracking:

```yaml
Tags:
  - Key: Environment
    Value: production
  - Key: Project
    Value: huntaze
  - Key: CostCenter
    Value: engineering
```

### 3. Reserved Instances / Savings Plans

Si usage stable > 6 mois:
- Analyser les recommandations AWS
- Calculer le ROI
- Acheter des Reserved Instances

### 4. Alertes Proactives

- Configurer des alertes à 50% (pas seulement 100%)
- Activer les forecasts
- Monitorer les anomalies hebdomadairement

## Troubleshooting

### Alerte Reçue Mais Pas d'Anomalie Visible

**Cause:** Délai de propagation des métriques

**Solution:** Attendre 24h et revérifier

### Anomaly Detection Trop Sensible

**Cause:** Seuil trop bas ($10)

**Solution:** Augmenter le seuil dans `sam/template.yaml`:
```yaml
CostAnomalySubscription:
  Properties:
    Threshold: 20  # Augmenter à $20
```

### Budget Alerts Non Reçues

**Cause:** SNS subscription non confirmée

**Solution:**
```bash
# Vérifier le status
aws sns list-subscriptions-by-topic \
    --topic-arn $(aws sns list-topics --query 'Topics[?contains(TopicArn, `huntaze-production-alerts`)].TopicArn' --output text)

# Si PendingConfirmation, check email et confirmer
```

## Support

### Documentation AWS

- [AWS Budgets](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html)
- [Cost Anomaly Detection](https://docs.aws.amazon.com/cost-management/latest/userguide/manage-ad.html)
- [Cost Explorer](https://docs.aws.amazon.com/cost-management/latest/userguide/ce-what-is.html)

### Commandes Utiles

```bash
# Vérifier la configuration
./scripts/verify-cost-monitoring.sh

# Coûts actuels
aws ce get-cost-and-usage \
    --time-period Start=$(date -u +%Y-%m-01),End=$(date -u +%Y-%m-%d) \
    --granularity MONTHLY \
    --metrics BlendedCost

# Anomalies récentes
aws ce get-anomalies \
    --date-interval Start=$(date -u -d '7 days ago' +%Y-%m-%d) \
    --max-results 10
```

## Coûts Estimés du Monitoring

- AWS Budgets: $0.02/budget/mois = **$0.02/mois**
- Cost Anomaly Detection: **Gratuit**
- CloudWatch Dashboard: **Gratuit** (3 dashboards inclus)

**Total: ~$0.02/mois** pour surveiller ~$100/mois de dépenses = **ROI excellent**
