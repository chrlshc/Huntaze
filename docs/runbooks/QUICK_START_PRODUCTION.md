# 🚀 Quick Start: Production Deployment

**Durée totale**: 60-90 minutes  
**Prérequis**: Credentials AWS avec AdministratorAccess

---

## 📋 Checklist Rapide (5 min)

```bash
# 1. Configurer les credentials AWS
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_SESSION_TOKEN="..."  # Si SSO
export AWS_REGION="us-east-1"

# 2. Vérifier l'accès
aws sts get-caller-identity

# 3. Quick health check
./scripts/quick-infrastructure-check.sh

# 4. GO/NO-GO audit complet
./scripts/go-no-go-audit.sh
```

**Critères GO**: 
- ✅ Exit code 0 du GO/NO-GO audit
- ✅ Pas de FAIL checks
- ✅ Maximum 3 WARN checks

---

## 🎯 Déploiement Production (45 min)

### Phase 1: Infrastructure Core (15 min)

```bash
cd infra/terraform/production-hardening

# Init Terraform
terraform init -upgrade

# Plan (review changes)
terraform plan -out=production.tfplan

# Apply
terraform apply production.tfplan
```

**Validation**:
```bash
# Vérifier les ressources créées
aws sqs list-queues --query 'QueueUrls[?contains(@, `huntaze`)]'
aws dynamodb list-tables --query 'TableNames[?contains(@, `huntaze`)]'
aws sns list-topics --query 'Topics[?contains(TopicArn, `huntaze`)]'
```

### Phase 2: Services Configuration (15 min)

```bash
# Enable RDS Performance Insights
./scripts/enable-rds-performance-insights.sh

# Enable ECS Circuit Breaker
./scripts/enable-ecs-circuit-breaker.sh

# Apply DynamoDB TTL
./scripts/apply-dynamodb-ttl.sh
```

**Validation**:
```bash
./scripts/validate-rds-performance-insights.sh
./scripts/validate-ecs-auto-scaling.sh
```

### Phase 3: Security & Monitoring (15 min)

```bash
# Security validation
./scripts/validate-security-comprehensive.sh

# Setup CloudWatch Alarms
aws cloudwatch describe-alarms --state-value ALARM

# Deploy Synthetics Canaries (if not exists)
# See docs/runbooks/PRODUCTION_GO_LIVE_RUNBOOK.md Step 4
```

**Validation**:
```bash
./scripts/security-runbook.sh us-east-1
./scripts/validate-cloudwatch-alarms.sh
```

---

## 🧪 Tests de Validation (15 min)

### Test 1: Rate Limiter

```bash
# Burst test (60 messages in 60 seconds)
for i in {1..60}; do
  aws sqs send-message \
    --queue-url https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue \
    --message-body "{\"action\":\"test\",\"creator_id\":\"test_$i\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" &
  sleep 1
done
wait

# Wait 2 minutes, then check metrics
sleep 120

aws cloudwatch get-metric-statistics \
  --namespace AWS/SQS \
  --metric-name ApproximateNumberOfMessagesVisible \
  --dimensions Name=QueueName,Value=huntaze-rate-limiter-queue \
  --start-time $(date -u -d '10 min ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 60 \
  --statistics Maximum
```

**Critère de succès**: Messages traités à ~10 msg/min (rate limit respecté)

### Test 2: Cost Monitoring

```bash
# Test Enhanced Cost Monitoring
node -e "
const { getEnhancedCostMonitoring } = require('./lib/services/enhanced-cost-monitoring');
const monitor = getEnhancedCostMonitoring();
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
monitor.pullAwsCosts(yesterday)
  .then(() => console.log('✅ Cost data pulled'))
  .catch(err => console.error('❌ Failed:', err));
"

# Verify DynamoDB entries
aws dynamodb scan \
  --table-name huntaze-ai-costs-production \
  --limit 5 \
  --query 'Items[*].{Date:date.S,Provider:provider.S,Cost:cost.N}'
```

**Critère de succès**: Données de coûts écrites dans DynamoDB

### Test 3: Canaries Health

```bash
# Check all canaries
aws synthetics describe-canaries \
  --query 'Canaries[*].{Name:Name,State:Status.State,LastRun:Status.LastRun.Status}'

# Check success rate (last hour)
aws cloudwatch get-metric-statistics \
  --namespace CloudWatchSynthetics \
  --metric-name SuccessPercent \
  --dimensions Name=CanaryName,Value=huntaze-api-health-prod \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 300 \
  --statistics Average
```

**Critère de succès**: SuccessPercent > 95%

---

## ✅ Validation Finale (5 min)

```bash
# Run comprehensive validation
./scripts/validate-security-comprehensive.sh

# Check for alarms
aws cloudwatch describe-alarms --state-value ALARM

# Verify budget status
aws budgets describe-budgets \
  --account-id 317805897534 \
  --query 'Budgets[0].{Limit:BudgetLimit.Amount,Actual:CalculatedSpend.ActualSpend.Amount}'
```

**Critères GO-LIVE**:
- ✅ Security validation: exit code 0
- ✅ No alarms in ALARM state
- ✅ Budget < 80% ($400/$500)
- ✅ All canaries green
- ✅ Rate limiter functional

---

## 🚨 Rollback (< 5 min)

Si problème critique:

```bash
# Option 1: Terraform destroy
cd infra/terraform/production-hardening
terraform destroy -auto-approve

# Option 2: Kill switches
# Stop ECS services
aws ecs update-service \
  --cluster huntaze-of-fargate \
  --service huntaze-onlyfans-scraper \
  --desired-count 0

# Disable Lambda event source
LAMBDA_MAPPING=$(aws lambda list-event-source-mappings \
  --function-name huntaze-rate-limiter \
  --query 'EventSourceMappings[0].UUID' \
  --output text)
aws lambda update-event-source-mapping \
  --uuid $LAMBDA_MAPPING \
  --enabled false

# Stop canaries
aws synthetics stop-canary --name huntaze-api-health-prod
```

---

## 📊 Monitoring Post-Déploiement

### Premières 2 heures (surveillance active)

```bash
# Monitor canaries every 15 min
watch -n 900 'aws synthetics describe-canaries --query "Canaries[*].{Name:Name,Success:Status.LastRun.Status}"'

# Monitor alarms every 5 min
watch -n 300 'aws cloudwatch describe-alarms --state-value ALARM --query "MetricAlarms[*].AlarmName"'
```

### Dashboards à surveiller

1. **CloudWatch**: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:
2. **ECS**: https://console.aws.amazon.com/ecs/home?region=us-east-1#/clusters
3. **Synthetics**: https://console.aws.amazon.com/synthetics/home?region=us-east-1#/canaries
4. **Cost Explorer**: https://console.aws.amazon.com/cost-management/home#/cost-explorer

### Revue 24h

```bash
# Generate 24h report
echo "📊 24-Hour Post-Deployment Report"
echo "Generated: $(date)"

# Canary success rate
aws cloudwatch get-metric-statistics \
  --namespace CloudWatchSynthetics \
  --metric-name SuccessPercent \
  --dimensions Name=CanaryName,Value=huntaze-api-health-prod \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 3600 \
  --statistics Average

# Cost impact
node -e "
const { getEnhancedCostMonitoring } = require('./lib/services/enhanced-cost-monitoring');
const monitor = getEnhancedCostMonitoring();
const today = new Date().toISOString().split('T')[0];
monitor.getDailyCosts(today)
  .then(summary => console.log('Daily cost:', summary.totalCost))
  .catch(err => console.error('Cost check failed:', err));
"

# Security posture
./scripts/security-runbook.sh us-east-1
```

---

## 📚 Documentation Complète

Pour le runbook détaillé avec timing minute par minute:
- **Runbook complet**: `docs/runbooks/PRODUCTION_GO_LIVE_RUNBOOK.md`
- **Phase 3 Guide**: `AWS_PRODUCTION_HARDENING_PHASE3_GUIDE.md`
- **Security Runbook**: `docs/runbooks/security-runbook.md`

---

## 🆘 Support & Escalation

**En cas de problème**:
1. Consulter les logs CloudWatch
2. Vérifier les alarmes actives
3. Exécuter le rollback si critique
4. Documenter l'incident

**Contacts**:
- DevOps Lead: [Your contact]
- Security Engineer: [Security contact]
- AWS Support: [Case link]

---

**Version**: 1.0  
**Dernière mise à jour**: 2025-10-29  
**Status**: ✅ Ready for Production
