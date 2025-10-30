# 🚀 Go-Live Kit - Huntaze Production Deployment

**Account**: 317805897534 | **Region**: us-east-1 | **Duration**: 60-90 min

---

## ✅ Ultime Check GO/NO-GO (30 min)

### 1. ORR Checklist Signé
**Référence**: [AWS Well-Architected Operational Readiness Reviews (ORR)](https://docs.aws.amazon.com/wellarchitected/latest/operational-readiness-reviews/wa-operational-readiness-reviews.html)

```bash
# Exécuter l'audit ORR complet
./scripts/go-no-go-audit.sh

# Critères GO:
# - Exit code 0 (0 FAIL, ≤ 3 WARN)
# - Infrastructure: ECS, SQS, DynamoDB, SNS ✅
# - Security: GuardDuty, Security Hub, Config ✅
# - Cost: Budgets < 80% ($400/$500) ✅
# - Monitoring: Alarms, Canaries, Container Insights ✅
# - Operations: Lambda, RDS, Performance Insights ✅
```

**OPS07 Compliance**: Checklist Well-Architected validée

---

### 2. Blue/Green ECS via CodeDeploy
**Référence**: [AWS CodeDeploy Blue/Green Deployments for ECS](https://docs.aws.amazon.com/codedeploy/latest/userguide/deployment-steps-ecs.html)

```bash
# Vérifier la configuration Blue/Green
aws deploy get-deployment-config \
  --deployment-config-name CodeDeployDefault.ECSCanary10Percent5Minutes

# Options de shift:
# - Canary: 10% → 5 min → 100%
# - Linear: 10% every 1 min
# - All-at-once: 100% immédiat

# Auto-rollback activé sur:
# - CloudWatch Alarms
# - Deployment failures
```

**Stratégie recommandée**: `ECSCanary10Percent5Minutes` avec auto-rollback

---

### 3. Canaries CloudWatch Synthetics
**Référence**: [CloudWatch Synthetics Canaries](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Canaries.html)

```bash
# Vérifier les canaries
aws synthetics describe-canaries \
  --query 'Canaries[*].{Name:Name,State:Status.State,LastRun:Status.LastRun.Status}' \
  --output table

# Endpoints à monitorer:
# - /api/health (huntaze-api-health-prod)
# - /api/onlyfans (huntaze-onlyfans-api-prod)

# Critères GO:
# - State: RUNNING
# - LastRun: PASSED
# - Frequency: 1 minute
# - Success rate: > 95%
```

**Alarmes**: Configurées sur `SuccessPercent < 95%`

---

### 4. GameDay / FIS avec Stop Conditions
**Référence**: [AWS Fault Injection Simulator (FIS)](https://docs.aws.amazon.com/fis/latest/userguide/what-is.html)

```bash
# Templates FIS validés:
# 1. Stop ECS Tasks (test resilience)
# 2. Throttle API calls (test rate limiting)
# 3. Inject latency (test timeouts)

# Stop conditions configurées:
aws fis create-experiment-template \
  --stop-conditions sources='[{source="aws:cloudwatch:alarm",value="arn:aws:cloudwatch:us-east-1:317805897534:alarm:huntaze-ecs-cpu-high"}]'

# Critères GO:
# - Templates créés et testés en staging
# - Stop conditions validées (arrêt sur alarme)
# - Rollback automatique fonctionnel
```

**Best Practice**: Tester FIS en staging avant production

---

### 5. Coûts: Budgets + Cost Anomaly Detection
**Référence**: 
- [AWS Budgets](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html)
- [Cost Anomaly Detection](https://docs.aws.amazon.com/cost-management/latest/userguide/manage-ad.html)

```bash
# Vérifier Budgets
aws budgets describe-budgets \
  --account-id 317805897534 \
  --query 'Budgets[*].{Name:BudgetName,Limit:BudgetLimit.Amount,Actual:CalculatedSpend.ActualSpend.Amount}'

# Vérifier Cost Anomaly Detection
aws ce get-anomaly-monitors \
  --query 'AnomalyMonitors[*].{Name:MonitorName,Type:MonitorType}'

# Critères GO:
# - Budget: $500/month configuré
# - Alertes SNS: 80%, 90%, 100%
# - CAD monitors: Actifs
# - SNS topics: Vérifiés et testés
```

**Important**: Budgets suit la cadence de rafraîchissement Billing (pas temps réel, latence ~8-24h)

---

### 6. Kill Switch Testé
**Référence**: [Lambda Reserved Concurrency](https://docs.aws.amazon.com/lambda/latest/dg/configuration-concurrency.html)

```bash
# Test Kill Switch Lambda
aws lambda put-function-concurrency \
  --function-name huntaze-rate-limiter \
  --reserved-concurrent-executions 0

# Vérifier
aws lambda get-function-concurrency \
  --function-name huntaze-rate-limiter

# Pause event source mapping SQS
MAPPING_UUID=$(aws lambda list-event-source-mappings \
  --function-name huntaze-rate-limiter \
  --query 'EventSourceMappings[0].UUID' \
  --output text)

aws lambda update-event-source-mapping \
  --uuid $MAPPING_UUID \
  --enabled false

# Critères GO:
# - Reserved concurrency à 0 fonctionne
# - Event source mapping pause fonctionne
# - Restauration testée (concurrency > 0, enabled true)
```

**Rollback time**: < 30 secondes

---

## 🚀 Cutover (60-90 min)

### Phase 1: Dashboards & Canaries (T+0)
**Référence**: [CloudWatch Dashboards](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Dashboards.html)

```bash
# Ouvrir les dashboards
echo "📊 Dashboards à surveiller:"
echo "- CloudWatch: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:"
echo "- ECS: https://console.aws.amazon.com/ecs/home?region=us-east-1#/clusters"
echo "- Synthetics: https://console.aws.amazon.com/synthetics/home?region=us-east-1#/canaries"

# Vérifier canaries avant déploiement
aws synthetics describe-canaries \
  --query 'Canaries[*].{Name:Name,Success:Status.LastRun.Status}' \
  --output table
```

---

### Phase 2: Blue/Green ECS via CodeDeploy (T+0 - T+30)
**Référence**: [ECS Blue/Green Deployment](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-type-bluegreen.html)

```bash
# Lancer Blue/Green deployment
aws deploy create-deployment \
  --application-name huntaze-ecs-app \
  --deployment-group-name huntaze-ecs-dg \
  --deployment-config-name CodeDeployDefault.ECSCanary10Percent5Minutes \
  --description "Production deployment $(date +%Y%m%d-%H%M)"

# Shift canary activé:
# - T+0: 10% traffic → green
# - T+5: Validation (canaries, alarms)
# - T+5: 100% traffic → green si OK
# - Auto-rollback si alarmes déclenchées

# Surveiller le déploiement
aws deploy get-deployment \
  --deployment-id <deployment-id> \
  --query 'deploymentInfo.status'
```

**Auto-rollback**: Activé sur CloudWatch Alarms

---

### Phase 3: Smoke Test + Burst Rate Limiter (T+30 - T+45)
**Référence**: [SQS Metrics](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-available-cloudwatch-metrics.html)

```bash
# Smoke test API
curl -f https://huntaze.com/api/health || echo "❌ Health check failed"
curl -f https://huntaze.com/api/onlyfans || echo "❌ OnlyFans API failed"

# Burst test rate limiter (60 messages in 60 seconds)
for i in {1..60}; do
  aws sqs send-message \
    --queue-url https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue \
    --message-body "{\"action\":\"test\",\"creator_id\":\"prod_$i\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" &
  sleep 1
done
wait

# Attendre 2 minutes, puis vérifier métriques SQS
sleep 120

# Vérifier backlog SQS décroît
aws cloudwatch get-metric-statistics \
  --namespace AWS/SQS \
  --metric-name ApproximateNumberOfMessagesVisible \
  --dimensions Name=QueueName,Value=huntaze-rate-limiter-queue \
  --start-time $(date -u -d '10 min ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 60 \
  --statistics Maximum \
  --output table

# Vérifier ApproximateAgeOfOldestMessage
aws cloudwatch get-metric-statistics \
  --namespace AWS/SQS \
  --metric-name ApproximateAgeOfOldestMessage \
  --dimensions Name=QueueName,Value=huntaze-rate-limiter-queue \
  --start-time $(date -u -d '10 min ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 60 \
  --statistics Maximum \
  --output table

# Critères de succès:
# - Backlog décroît (ApproximateNumberOfMessagesVisible → 0)
# - Débit respecté (~10 msg/min)
# - Age des messages < 5 minutes
```

---

### Phase 4: Enhanced Cost Monitoring (T+45 - T+60)
**Référence**: [Cost Explorer API](https://docs.aws.amazon.com/cost-management/latest/userguide/ce-api.html)

```bash
# Démarrer job Enhanced Cost Monitoring
node -e "
const { getEnhancedCostMonitoring } = require('./lib/services/enhanced-cost-monitoring');
const monitor = getEnhancedCostMonitoring();
const today = new Date().toISOString().split('T')[0];
monitor.pullAwsCosts(today)
  .then(() => console.log('✅ Cost data pulled'))
  .catch(err => console.error('❌ Failed:', err));
"

# Vérifier écritures DynamoDB
aws dynamodb scan \
  --table-name huntaze-ai-costs-production \
  --limit 5 \
  --query 'Items[*].{Date:date.S,Provider:provider.S,Cost:cost.N}' \
  --output table

# Vérifier alertes SNS/CAD
aws sns list-subscriptions-by-topic \
  --topic-arn arn:aws:sns:us-east-1:317805897534:huntaze-cost-alerts \
  --query 'Subscriptions[*].{Protocol:Protocol,Endpoint:Endpoint}'

# Critères de succès:
# - Données écrites dans DynamoDB
# - SNS subscriptions confirmées
# - Pas d'erreurs dans CloudWatch Logs
```

**Rappel**: Budgets suit la cadence Billing (latence 8-24h, pas temps réel)

---

## 🔁 Rollback Immédiat (2 actions, < 5 min)

### Action 1: Rebasculer CodeDeploy vers Blue
**Référence**: [Stop Deployment](https://docs.aws.amazon.com/codedeploy/latest/userguide/deployments-stop.html)

```bash
# Stop deployment en cours
aws deploy stop-deployment \
  --deployment-id <deployment-id> \
  --auto-rollback-enabled

# Ou rollback manuel
aws deploy create-deployment \
  --application-name huntaze-ecs-app \
  --deployment-group-name huntaze-ecs-dg \
  --revision revisionType=AppSpecContent,appSpecContent={content='{"version":0.0,"Resources":[{"TargetService":{"Type":"AWS::ECS::Service","Properties":{"TaskDefinition":"<blue-task-def>","LoadBalancerInfo":{"ContainerName":"huntaze","ContainerPort":3000}}}}]}'} \
  --description "Rollback to blue"

# Vérifier rollback
aws ecs describe-services \
  --cluster huntaze-of-fargate \
  --services huntaze-onlyfans-scraper \
  --query 'services[0].{Desired:desiredCount,Running:runningCount,TaskDef:taskDefinition}'
```

**Rollback time**: < 2 minutes

---

### Action 2: Kill Switches d'Urgence
**Référence**: [Lambda Concurrency](https://docs.aws.amazon.com/lambda/latest/dg/configuration-concurrency.html)

```bash
# Lambda: Reserved concurrency à 0
aws lambda put-function-concurrency \
  --function-name huntaze-rate-limiter \
  --reserved-concurrent-executions 0

# Disable event source mapping SQS
MAPPING_UUID=$(aws lambda list-event-source-mappings \
  --function-name huntaze-rate-limiter \
  --query 'EventSourceMappings[0].UUID' \
  --output text)

aws lambda update-event-source-mapping \
  --uuid $MAPPING_UUID \
  --enabled false

# Scale ECS à 0 (kill switch ultime)
aws ecs update-service \
  --cluster huntaze-of-fargate \
  --service huntaze-onlyfans-scraper \
  --desired-count 0

# Vérifier
aws ecs describe-services \
  --cluster huntaze-of-fargate \
  --services huntaze-onlyfans-scraper \
  --query 'services[0].desiredCount'
```

**Rollback time**: < 30 secondes

---

## 🧭 Aftercare (24-72h)

### Surveillance Continue (T+2h - T+24h)
**Référence**: [Container Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/ContainerInsights.html)

```bash
# Surveiller canaries/alarms/Container Insights
watch -n 300 'aws cloudwatch describe-alarms --state-value ALARM --query "MetricAlarms[*].AlarmName"'

# Surveiller Container Insights
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ClusterName,Value=huntaze-of-fargate Name=ServiceName,Value=huntaze-onlyfans-scraper \
  --start-time $(date -u -d '2 hours ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 300 \
  --statistics Average \
  --output table

# Surveiller Memory
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name MemoryUtilization \
  --dimensions Name=ClusterName,Value=huntaze-of-fargate Name=ServiceName,Value=huntaze-onlyfans-scraper \
  --start-time $(date -u -d '2 hours ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 300 \
  --statistics Average \
  --output table
```

---

### Valider Alertes CAD / Budgets (T+24h)
**Référence**: [Cost Anomaly Detection Alerts](https://docs.aws.amazon.com/cost-management/latest/userguide/getting-started-ad.html)

```bash
# Vérifier réception alertes SNS
aws sns list-subscriptions-by-topic \
  --topic-arn arn:aws:sns:us-east-1:317805897534:huntaze-cost-alerts

# Vérifier anomalies détectées (si applicable)
aws ce get-anomalies \
  --date-interval Start=$(date -u -d '24 hours ago' +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
  --max-results 10

# Vérifier budget status
aws budgets describe-budgets \
  --account-id 317805897534 \
  --query 'Budgets[*].{Name:BudgetName,Actual:CalculatedSpend.ActualSpend.Amount,Limit:BudgetLimit.Amount}'

# Critères de succès:
# - SNS subscriptions confirmées
# - Alertes reçues si seuils dépassés
# - Pas d'anomalies critiques non notifiées
```

**Important**: CAD a une latence de détection (pas temps réel)

---

### Retour d'Expérience ORR (J+1)
**Référence**: [ORR Best Practices](https://docs.aws.amazon.com/wellarchitected/latest/operational-readiness-reviews/best-practices.html)

```bash
# Template retour d'expérience ORR (OPS07)
cat << 'EOF' > orr-postmortem-$(date +%Y%m%d).md
# ORR Post-Deployment Review

**Date**: $(date +%Y-%m-%d)
**Deployment ID**: prod-$(date +%Y%m%d-%H%M)

## Deployment Summary
- Start time: 
- End time: 
- Duration: 
- Status: ✅ Success / ❌ Rollback

## Metrics
- Canary success rate: 
- Alarms triggered: 
- Rollbacks: 
- Downtime: 

## What Went Well
- 

## What Could Be Improved
- 

## Action Items
- [ ] 
- [ ] 

## Lessons Learned
- 

**Next ORR**: [Date]
EOF

# Partager avec l'équipe
echo "📝 Post-mortem créé: orr-postmortem-$(date +%Y%m%d).md"
```

**Best Practice OPS07**: Retour d'expérience même si tout est vert

---

## 📊 Canevas de Déploiement

Quand vous lancez `./scripts/start-production-deployment.sh`, suivez ce canevas:

```
1. ORR Checklist (30 min)
   └─► ./scripts/go-no-go-audit.sh
   └─► Exit code 0 = GO

2. Blue/Green Deployment (30 min)
   └─► CodeDeploy ECSCanary10Percent5Minutes
   └─► Auto-rollback activé

3. Smoke Tests (15 min)
   └─► API health checks
   └─► Rate limiter burst test
   └─► SQS metrics validation

4. Cost Monitoring (15 min)
   └─► Enhanced Cost Monitoring job
   └─► DynamoDB writes verification
   └─► SNS alerts validation

5. Aftercare (24-72h)
   └─► Canaries/Alarms/Container Insights
   └─► CAD/Budgets alerts
   └─► ORR post-mortem (J+1)
```

---

## 🔗 Références AWS Officielles

### Deployment & Rollback
- [CodeDeploy Blue/Green for ECS](https://docs.aws.amazon.com/codedeploy/latest/userguide/deployment-steps-ecs.html)
- [ECS Deployment Types](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-types.html)
- [Lambda Reserved Concurrency](https://docs.aws.amazon.com/lambda/latest/dg/configuration-concurrency.html)

### Monitoring & Observability
- [CloudWatch Synthetics](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Canaries.html)
- [Container Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/ContainerInsights.html)
- [CloudWatch Dashboards](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Dashboards.html)

### Cost Management
- [AWS Budgets](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html)
- [Cost Anomaly Detection](https://docs.aws.amazon.com/cost-management/latest/userguide/manage-ad.html)
- [Cost Explorer API](https://docs.aws.amazon.com/cost-management/latest/userguide/ce-api.html)

### Resilience & Testing
- [AWS FIS](https://docs.aws.amazon.com/fis/latest/userguide/what-is.html)
- [FIS Stop Conditions](https://docs.aws.amazon.com/fis/latest/userguide/stop-conditions.html)

### Operational Excellence
- [ORR Well-Architected](https://docs.aws.amazon.com/wellarchitected/latest/operational-readiness-reviews/wa-operational-readiness-reviews.html)
- [ORR Best Practices](https://docs.aws.amazon.com/wellarchitected/latest/operational-readiness-reviews/best-practices.html)

---

## ✅ Checklist Finale

Avant le clic final:

- [ ] ORR checklist signée (./scripts/go-no-go-audit.sh = exit 0)
- [ ] Blue/Green CodeDeploy configuré avec auto-rollback
- [ ] Canaries verts sur /api/health & /api/onlyfans
- [ ] FIS templates testés avec stop conditions
- [ ] Budgets + CAD + SNS opérationnels
- [ ] Kill switches testés (Lambda concurrency=0, event mapping disabled)
- [ ] Dashboards ouverts et surveillés
- [ ] Équipe on-call notifiée
- [ ] Rollback procedures comprises et testées
- [ ] Post-mortem template préparé

---

**🚀 Vous avez tout le glue (scripts + docs). Prêt pour le GO-LIVE!**

**Version**: 1.0  
**Date**: 2025-10-29  
**Status**: ✅ PRODUCTION READY
