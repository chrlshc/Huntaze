# 🚀 Déploiement Production Hardening

## ✅ Ce qui a été fait

1. ✅ Template SAM mis à jour avec optimisations
2. ✅ Metric Math alarm ajoutée
3. ✅ Log retention configurée (30 jours)
4. ✅ SNS topic pour alertes
5. ✅ X-Ray sampling rule (10%)
6. ✅ P95 latency alarm
7. ✅ Dead Letter Queue
8. ✅ Prisma handler prêt pour Accelerate

## 🔐 Étape 1: Configurer AWS Credentials

```bash
# Option 1: AWS CLI configure
aws configure
# Entrer:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: us-east-1
# - Default output format: json

# Option 2: Variables d'environnement
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-east-1"

# Vérifier
aws sts get-caller-identity
```

## 🚀 Étape 2: Déployer les Optimisations

```bash
cd sam

# Build
sam build --region us-east-1

# Deploy
sam deploy \
    --stack-name huntaze-prisma-skeleton \
    --region us-east-1 \
    --capabilities CAPABILITY_IAM \
    --no-fail-on-empty-changeset \
    --parameter-overrides \
        DatabaseSecretArn="arn:aws:secretsmanager:us-east-1:317805897534:secret:huntaze/database"
```

## 📧 Étape 3: Confirmer SNS Subscription

Après le déploiement, tu recevras un email de confirmation AWS SNS.

1. Ouvre l'email "AWS Notification - Subscription Confirmation"
2. Clique sur "Confirm subscription"
3. Tu recevras maintenant les alertes de production

## 📊 Étape 4: Activer RDS Performance Insights

```bash
# Activer Performance Insights
aws rds modify-db-instance \
    --db-instance-identifier huntaze-prod \
    --enable-performance-insights \
    --performance-insights-retention-period 7 \
    --region us-east-1 \
    --apply-immediately

# Vérifier le status
aws rds describe-db-instances \
    --db-instance-identifier huntaze-prod \
    --region us-east-1 \
    --query 'DBInstances[0].PerformanceInsightsEnabled'
```

## 🔍 Étape 5: Vérifier le Déploiement

```bash
# Vérifier les alarmes
aws cloudwatch describe-alarms \
    --alarm-names "huntaze-lambda-error-rate-metric-math" \
    --region us-east-1

# Vérifier les log groups
aws logs describe-log-groups \
    --log-group-name-prefix "/aws/lambda/huntaze" \
    --region us-east-1 \
    --query 'logGroups[*].[logGroupName,retentionInDays]' \
    --output table

# Vérifier X-Ray sampling rule
aws xray get-sampling-rules \
    --region us-east-1 \
    --query 'SamplingRuleRecords[?SamplingRule.RuleName==`huntaze-production-sampling`]'
```

## 🎯 Étape 6: Prisma Accelerate (Optionnel mais Recommandé)

### 6.1 Créer un compte Prisma Data Platform

1. Va sur https://cloud.prisma.io
2. Crée un compte (gratuit pour commencer)
3. Crée un nouveau projet
4. Obtiens ton `ACCELERATE_URL`

### 6.2 Mettre à jour Lambda Environment Variables

```bash
# Via AWS CLI
aws lambda update-function-configuration \
    --function-name huntaze-prisma-read \
    --environment "Variables={
        DATABASE_URL=\$DATABASE_URL,
        ACCELERATE_URL=prisma://accelerate.prisma-data.net/?api_key=YOUR_API_KEY,
        NODE_ENV=production
    }" \
    --region us-east-1

# Ou via Console AWS:
# 1. Lambda > Functions > huntaze-prisma-read
# 2. Configuration > Environment variables
# 3. Ajouter ACCELERATE_URL
```

### 6.3 Redéployer

```bash
cd sam
sam build --region us-east-1
sam deploy --stack-name huntaze-prisma-skeleton --region us-east-1 --capabilities CAPABILITY_IAM
```

## 📈 Étape 7: Monitorer les Résultats

### CloudWatch Dashboard
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=huntaze-prisma-migration

### Performance Insights
https://console.aws.amazon.com/rds/home?region=us-east-1#performance-insights:

### X-Ray Traces
https://console.aws.amazon.com/xray/home?region=us-east-1#/traces

### Cost Explorer
https://console.aws.amazon.com/cost-management/home?region=us-east-1#/dashboard

## 🎯 Métriques à Surveiller (Premières 24h)

### Avant Optimisations (Baseline)
- Error rate: < 1%
- P95 latency: ~300-500ms
- Logs: Rétention infinie
- X-Ray: 100% sampling

### Après Optimisations (Objectif)
- Error rate: < 0.5%
- P95 latency: ~200-300ms (avec Accelerate)
- Logs: Rétention 30 jours
- X-Ray: 10% sampling
- Coûts: -$5-10/mois

## 🔄 Rollback si Problème

```bash
# Rollback complet
aws cloudformation rollback-stack \
    --stack-name huntaze-prisma-skeleton \
    --region us-east-1

# Ou désactiver une alarme spécifique
aws cloudwatch disable-alarm-actions \
    --alarm-names "huntaze-lambda-error-rate-metric-math" \
    --region us-east-1
```

## 📋 Checklist Post-Déploiement

- [ ] Credentials AWS configurées
- [ ] Stack déployée avec succès
- [ ] SNS subscription confirmée
- [ ] Performance Insights activé
- [ ] Alarmes fonctionnelles
- [ ] Log retention configurée
- [ ] X-Ray sampling actif
- [ ] Dashboard accessible
- [ ] Prisma Accelerate configuré (optionnel)
- [ ] Métriques surveillées pendant 24h

## 🎉 Résultat Attendu

Après 24h de monitoring:
- ✅ Alarmes plus précises (Metric Math)
- ✅ Coûts logs réduits (~$5-10/mois)
- ✅ Visibilité SQL (Performance Insights)
- ✅ Alertes email fonctionnelles
- ✅ X-Ray optimisé (10% sampling)
- ✅ Latency améliorée (si Accelerate)

---

**Status:** ✅ Prêt à déployer  
**Temps estimé:** 30-45 minutes  
**Impact:** 🔥 High (coûts + perf + fiabilité)
