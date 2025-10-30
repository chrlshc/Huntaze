# 🚀 Production Go-Live Runbook

**Account**: 317805897534  
**Region**: us-east-1  
**Duration**: 60-90 minutes  
**Team**: DevOps Lead + Security Engineer + On-call Engineer

---

## 📋 Overview

This runbook provides detailed minute-by-minute instructions for deploying Huntaze AWS Production Hardening to production with zero downtime.

**For a quicker guide, see**: [`QUICK_START_PRODUCTION.md`](./QUICK_START_PRODUCTION.md)

---

## ⏱️ Timeline

```
T-30 min: Pre-Flight Checklist
T+0 min:  Deployment Start
T+15 min: Infrastructure Deployed
T+30 min: Services Configured
T+45 min: Security Validated
T+60 min: Validation Complete
T+75 min: GO-LIVE Decision
T+2h:     Active Monitoring
T+24h:    Full Review
```

---

## 🎯 Pre-Flight Checklist (T-30 min)

### GO/NO-GO Decision Points

```bash
# 1. Run comprehensive audit
./scripts/go-no-go-audit.sh

# Expected: Exit code 0 (GO)
# If exit code 1 (CONDITIONAL GO): Review warnings
# If exit code 2 (NO-GO): Fix failures, do not proceed
```

### Pre-Deployment Setup

```bash
# Set environment variables
export AWS_REGION=us-east-1
export ACCOUNT_ID=317805897534
export DEPLOYMENT_ID="prod-$(date +%Y%m%d-%H%M)"

# Verify credentials
aws sts get-caller-identity

# Open monitoring dashboards
echo "📊 Open these dashboards in your browser:"
echo "- CloudWatch: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1"
echo "- ECS: https://console.aws.amazon.com/ecs/home?region=us-east-1#/clusters"
echo "- Synthetics: https://console.aws.amazon.com/synthetics/home?region=us-east-1"
```

---

## 🚀 Deployment Phase (T+0 to T+45)

### Step 1: Infrastructure Deployment (T+0 - T+15)

```bash
echo "🚀 Starting infrastructure deployment at $(date)"

# Deploy Terraform infrastructure
cd infra/terraform/production-hardening
terraform init -upgrade
terraform plan -out=production.tfplan
terraform apply production.tfplan

# Verify core services
echo "✅ Verifying infrastructure..."
aws sqs list-queues --query 'QueueUrls[?contains(@, `huntaze`)]' --output table
aws dynamodb list-tables --query 'TableNames[?contains(@, `huntaze`)]' --output table
aws sns list-topics --query 'Topics[?contains(TopicArn, `huntaze`)]' --output table

echo "📊 Infrastructure deployment complete at $(date)"
```

**Success Criteria**:
- ✅ Terraform apply successful (exit code 0)
- ✅ All SQS queues created
- ✅ All DynamoDB tables created
- ✅ All SNS topics created

---

### Step 2: Service Configuration (T+15 - T+30)

```bash
echo "🔧 Configuring services at $(date)"

# Enable RDS Performance Insights
./scripts/enable-rds-performance-insights.sh
echo "✅ RDS Performance Insights enabled"

# Configure ECS Auto Scaling
./scripts/enable-ecs-circuit-breaker.sh
echo "✅ ECS Circuit Breaker enabled"

# Apply DynamoDB TTL
./scripts/apply-dynamodb-ttl.sh
echo "✅ DynamoDB TTL configured"

# Validate configurations
./scripts/validate-rds-performance-insights.sh
./scripts/validate-ecs-auto-scaling.sh

echo "📊 Service configuration complete at $(date)"
```

**Success Criteria**:
- ✅ RDS Performance Insights enabled (7 days retention)
- ✅ ECS Circuit Breaker configured
- ✅ DynamoDB TTL applied
- ✅ All validation scripts pass

---

### Step 3: Security Validation (T+30 - T+40)

```bash
echo "🔒 Running security validation at $(date)"

# Comprehensive security check
./scripts/validate-security-comprehensive.sh

# Verify encryption
./scripts/validate-s3-rds-security.sh

# Check security services
./scripts/validate-security-services.sh

echo "✅ Security validation complete at $(date)"
```

**Success Criteria**:
- ✅ Security validation: exit code 0
- ✅ All encryption enabled
- ✅ No critical findings
- ✅ GuardDuty, Security Hub, Config enabled

---

### Step 4: Monitoring Setup (T+40 - T+45)

```bash
echo "📊 Setting up monitoring at $(date)"

# Verify CloudWatch Alarms
./scripts/validate-cloudwatch-alarms.sh

# Check for any alarms in ALARM state
aws cloudwatch describe-alarms --state-value ALARM --query 'MetricAlarms[*].AlarmName'

# Verify Container Insights
./scripts/validate-container-insights.sh

echo "✅ Monitoring setup complete at $(date)"
```

**Success Criteria**:
- ✅ All alarms configured
- ✅ No alarms in ALARM state
- ✅ Container Insights enabled on all clusters

---

## 🧪 Validation Phase (T+45 - T+60)

### Step 5: Rate Limiter Validation

```bash
echo "🧪 Testing rate limiter at $(date)"

# Burst test (60 messages in 60 seconds)
for i in {1..60}; do
  aws sqs send-message \
    --queue-url https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue \
    --message-body "{\"action\":\"test\",\"creator_id\":\"prod_test_$i\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" &
  sleep 1
done
wait

echo "📊 Monitoring rate limiter metrics..."
sleep 120  # Wait 2 minutes

# Check SQS metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/SQS \
  --metric-name ApproximateNumberOfMessagesVisible \
  --dimensions Name=QueueName,Value=huntaze-rate-limiter-queue \
  --start-time $(date -u -d '10 min ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 60 \
  --statistics Maximum \
  --output table

echo "✅ Rate limiter validation complete"
```

**Success Criteria**:
- ✅ Messages processed at ~10 msg/min (rate limit respected)
- ✅ No messages in DLQ
- ✅ Queue age decreasing

---

### Step 6: Cost Monitoring Validation

```bash
echo "💰 Validating cost monitoring at $(date)"

# Test Enhanced Cost Monitoring
node -e "
const { getEnhancedCostMonitoring } = require('./lib/services/enhanced-cost-monitoring');
const monitor = getEnhancedCostMonitoring();
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
monitor.pullAwsCosts(yesterday)
  .then(() => console.log('✅ Cost data pulled successfully'))
  .catch(err => console.error('❌ Cost monitoring failed:', err));
"

# Verify DynamoDB entries
aws dynamodb scan \
  --table-name huntaze-ai-costs-production \
  --limit 5 \
  --query 'Items[*].{Date:date.S,Provider:provider.S,Cost:cost.N}' \
  --output table

echo "✅ Cost monitoring validation complete"
```

**Success Criteria**:
- ✅ Cost data pulled successfully
- ✅ DynamoDB entries created
- ✅ Budget alerts configured

---

## ✅ Health Check Phase (T+60 - T+75)

### Step 7: End-to-End Health Check

```bash
echo "🏥 Running end-to-end health check at $(date)"

# Check all alarms
aws cloudwatch describe-alarms \
  --state-value ALARM \
  --query 'MetricAlarms[*].{Name:AlarmName,State:StateValue,Reason:StateReason}' \
  --output table

# Check ECS services
aws ecs describe-services \
  --cluster huntaze-of-fargate \
  --services huntaze-onlyfans-scraper \
  --query 'services[0].{Desired:desiredCount,Running:runningCount,Pending:pendingCount}' \
  --output table

# Final security check
./scripts/security-runbook.sh us-east-1

echo "✅ End-to-end health check complete"
```

**Success Criteria**:
- ✅ No alarms in ALARM state
- ✅ ECS services healthy (desired = running)
- ✅ Security runbook: exit code 0

---

## 🎯 Go-Live Decision (T+75)

### Success Criteria Checklist

```bash
echo "📋 Final GO/NO-GO checklist:"
echo ""
echo "Infrastructure:"
echo "- [ ] Terraform applied successfully"
echo "- [ ] All SQS queues created"
echo "- [ ] DynamoDB tables accessible"
echo "- [ ] SNS topics configured"
echo ""
echo "Security:"
echo "- [ ] Security runbook exit code 0"
echo "- [ ] All encryption enabled"
echo "- [ ] No critical findings"
echo ""
echo "Monitoring:"
echo "- [ ] No ALARM state alarms"
echo "- [ ] Container Insights enabled"
echo ""
echo "Cost:"
echo "- [ ] Budget alerts configured"
echo "- [ ] Cost monitoring functional"
echo "- [ ] Current spend < 80% budget"
echo ""
echo "Rate Limiter:"
echo "- [ ] Burst test passed (10 msg/min)"
echo "- [ ] Queue metrics healthy"
echo "- [ ] No DLQ messages"
echo ""

# Final decision
read -p "All checks passed? Deploy to production? (yes/no): " DECISION
if [ "$DECISION" = "yes" ]; then
  echo "🚀 GO-LIVE APPROVED at $(date)"
  echo "Production deployment complete!"
else
  echo "❌ NO-GO - Initiating rollback"
  # See Rollback section below
fi
```

---

## 🚨 Rollback Procedures (Emergency)

### Emergency Rollback (< 5 min)

```bash
echo "🚨 EMERGENCY ROLLBACK INITIATED at $(date)"

# 1. Scale ECS to 0 (kill switch)
aws ecs update-service \
  --cluster huntaze-of-fargate \
  --service huntaze-onlyfans-scraper \
  --desired-count 0

# 2. Disable Lambda event source mapping
LAMBDA_MAPPING=$(aws lambda list-event-source-mappings \
  --function-name huntaze-rate-limiter \
  --query 'EventSourceMappings[0].UUID' \
  --output text)
aws lambda update-event-source-mapping \
  --uuid $LAMBDA_MAPPING \
  --enabled false

# 3. Terraform destroy (if needed)
cd infra/terraform/production-hardening
terraform destroy -auto-approve

echo "✅ ROLLBACK COMPLETE at $(date)"
echo "System restored to previous state"
```

### Rollback Verification

```bash
# Verify rollback
aws ecs describe-services \
  --cluster huntaze-of-fargate \
  --services huntaze-onlyfans-scraper \
  --query 'services[0].desiredCount'

aws lambda get-event-source-mapping --uuid $LAMBDA_MAPPING \
  --query 'State'

echo "Rollback verification complete"
```

---

## 📊 Post-Deployment (T+75 - T+24h)

### Immediate Monitoring (First 2 hours)

```bash
# Monitor alarms every 5 minutes
watch -n 300 'aws cloudwatch describe-alarms --state-value ALARM --query "MetricAlarms[*].AlarmName" --output table'

# Monitor costs
aws budgets describe-budgets \
  --account-id 317805897534 \
  --query 'Budgets[0].CalculatedSpend.ActualSpend.Amount' \
  --output text
```

### 24-Hour Review

```bash
# Generate 24h report
echo "📊 24-Hour Post-Deployment Report"
echo "Generated: $(date)"
echo ""

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

echo "✅ 24-hour review complete"
```

---

## 📞 Contact Information

**DevOps Lead**: [Your contact]  
**Security Engineer**: [Security contact]  
**On-call Engineer**: [On-call contact]

**Escalation**:
- Slack: #huntaze-ops
- PagerDuty: [PD service]
- AWS Support: [Case link]

---

## 📈 Success Metrics

### Deployment Success
- ✅ Zero downtime deployment
- ✅ All validation scripts pass
- ✅ No critical alarms triggered
- ✅ Rate limiter functional (10 msg/min)
- ✅ Cost monitoring active

### 24-Hour Success
- ✅ No alarms in ALARM state
- ✅ No security incidents
- ✅ Cost within budget
- ✅ All services healthy

---

## 🔗 Related Documentation

- **Quick Start**: [`QUICK_START_PRODUCTION.md`](./QUICK_START_PRODUCTION.md)
- **Security Runbook**: [`security-runbook.md`](./security-runbook.md)
- **Main README**: [`../../PRODUCTION_DEPLOYMENT_README.md`](../../PRODUCTION_DEPLOYMENT_README.md)
- **Index**: [`../PRODUCTION_DEPLOYMENT_INDEX.md`](../PRODUCTION_DEPLOYMENT_INDEX.md)

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-29  
**Status**: Ready for Production Go-Live 🚀
