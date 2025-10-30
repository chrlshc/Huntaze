# AWS Production Hardening - Phase 3 Execution Guide

## 🎯 Overview

This guide provides copy/paste commands and success criteria for tasks 14-18 (Validation & ORR).

**Estimated Time**: 2-3 hours  
**Prerequisites**: Tasks 1-13 completed

---

## Task 14: Cost Validation (Budgets & Anomaly Detection)

### Objectives
- Verify Budget → SNS → Email chain
- Confirm Cost Anomaly Detection (CAD) alerts
- Validate Enhanced Cost Monitoring service

### Commands

#### 1. Verify Budget Configuration
```bash
# List budgets
aws budgets describe-budgets \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --query 'Budgets[*].{Name:BudgetName,Limit:BudgetLimit.Amount,Unit:BudgetLimit.Unit}' \
  --output table

# Get budget notifications
aws budgets describe-notifications-for-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget-name huntaze-monthly-budget \
  --query 'Notifications[*].{Type:NotificationType,Threshold:Threshold,State:ComparisonOperator}' \
  --output table
```

#### 2. Verify SNS Topic Policy
```bash
# Check SNS topic policy allows Budgets
aws sns get-topic-attributes \
  --topic-arn arn:aws:sns:us-east-1:317805897534:huntaze-cost-alerts \
  --query 'Attributes.Policy' \
  --output text | jq '.Statement[] | select(.Principal.Service == "budgets.amazonaws.com")'
```

#### 3. Create/Verify Cost Anomaly Detection
```bash
# Create anomaly monitor
aws ce create-anomaly-monitor \
  --anomaly-monitor '{
    "MonitorName": "huntaze-cost-anomaly-monitor",
    "MonitorType": "DIMENSIONAL",
    "MonitorDimension": "SERVICE"
  }'

# Create anomaly subscription
aws ce create-anomaly-subscription \
  --anomaly-subscription '{
    "SubscriptionName": "huntaze-cost-anomaly-alerts",
    "Threshold": 100,
    "Frequency": "DAILY",
    "MonitorArnList": ["<monitor-arn>"],
    "Subscribers": [
      {
        "Type": "SNS",
        "Address": "arn:aws:sns:us-east-1:317805897534:huntaze-cost-alerts"
      }
    ]
  }'

# List anomalies (last 30 days)
aws ce get-anomalies \
  --date-interval Start=$(date -u -d '30 days ago' +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
  --max-results 10 \
  --query 'Anomalies[*].{Impact:Impact.MaxImpact,Service:RootCauses[0].Service,Date:AnomalyStartDate}' \
  --output table
```

#### 4. Test Enhanced Cost Monitoring
```bash
# Pull AWS costs for yesterday
node -e "
const { getEnhancedCostMonitoring } = require('./lib/services/enhanced-cost-monitoring');
const monitor = getEnhancedCostMonitoring();
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
monitor.pullAwsCosts(yesterday).then(() => console.log('✅ Costs pulled'));
"

# Check daily budget
node -e "
const { getEnhancedCostMonitoring } = require('./lib/services/enhanced-cost-monitoring');
const monitor = getEnhancedCostMonitoring();
const today = new Date().toISOString().split('T')[0];
monitor.checkDailyBudget(today).then(() => console.log('✅ Budget checked'));
"
```

### Success Criteria
- ✅ Budget configured with 80% and 100% thresholds
- ✅ SNS topic policy allows budgets.amazonaws.com
- ✅ Cost Anomaly Detection monitor created
- ✅ Anomaly subscription to SNS configured
- ✅ Enhanced Cost Monitoring service functional
- ✅ Test email received (may take 24h for first alert)

### Evidence
- Screenshot of Budget configuration
- Screenshot of CAD monitor and subscription
- DynamoDB items in `huntaze-ai-costs-production`

---

## Task 15: Observability & Resilience

### 15.1: CloudWatch Synthetics Canaries

#### Create Canary for API Health
```bash
# Create S3 bucket for canary artifacts
aws s3 mb s3://huntaze-canary-artifacts-317805897534

# Create IAM role for canaries
aws iam create-role \
  --role-name CloudWatchSyntheticsRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy \
  --role-name CloudWatchSyntheticsRole \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchSyntheticsFullAccess

# Create heartbeat canary for /api/health
aws synthetics create-canary \
  --name huntaze-api-health \
  --artifact-s3-location s3://huntaze-canary-artifacts-317805897534/ \
  --execution-role-arn arn:aws:iam::317805897534:role/CloudWatchSyntheticsRole \
  --schedule Expression='rate(5 minutes)' \
  --runtime-version syn-nodejs-puppeteer-6.2 \
  --code '{
    "Handler": "index.handler",
    "Script": "const synthetics = require(\"Synthetics\");\nconst log = require(\"SyntheticsLogger\");\nconst https = require(\"https\");\n\nconst apiCanaryBlueprint = async function () {\n  const url = \"https://your-domain.com/api/health\";\n  const response = await synthetics.executeHttpStep(\"Verify API Health\", url);\n  return response;\n};\n\nexports.handler = async () => {\n  return await apiCanaryBlueprint();\n};"
  }' \
  --start-canary

# Create canary for OnlyFans endpoint
aws synthetics create-canary \
  --name huntaze-onlyfans-api \
  --artifact-s3-location s3://huntaze-canary-artifacts-317805897534/ \
  --execution-role-arn arn:aws:iam::317805897534:role/CloudWatchSyntheticsRole \
  --schedule Expression='rate(5 minutes)' \
  --runtime-version syn-nodejs-puppeteer-6.2 \
  --code '{
    "Handler": "index.handler",
    "Script": "const synthetics = require(\"Synthetics\");\nconst apiCanaryBlueprint = async function () {\n  const url = \"https://your-domain.com/api/v2/onlyfans/stats\";\n  const response = await synthetics.executeHttpStep(\"Verify OnlyFans API\", url);\n  return response;\n};\nexports.handler = async () => {\n  return await apiCanaryBlueprint();\n};"
  }' \
  --start-canary
```

#### Monitor Canary Status
```bash
# Check canary status
aws synthetics get-canary --name huntaze-api-health \
  --query 'Canary.{Name:Name,State:Status.State,LastRun:Timeline.LastStarted}' \
  --output table

# Get canary metrics
aws cloudwatch get-metric-statistics \
  --namespace CloudWatchSynthetics \
  --metric-name SuccessPercent \
  --dimensions Name=CanaryName,Value=huntaze-api-health \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 300 \
  --statistics Average \
  --output table
```

### 15.2: Load Testing

#### Deploy Distributed Load Testing Solution
```bash
# Clone AWS solution
git clone https://github.com/aws-solutions/distributed-load-testing-on-aws.git
cd distributed-load-testing-on-aws

# Deploy via CloudFormation (or use pre-built solution)
# Follow: https://aws.amazon.com/solutions/implementations/distributed-load-testing-on-aws/

# Alternative: Use Artillery for quick test
npm install -g artillery

# Create load test config
cat > load-test.yml <<EOF
config:
  target: "https://your-domain.com"
  phases:
    - duration: 300
      arrivalRate: 10
      name: "Warm up"
    - duration: 600
      arrivalRate: 50
      name: "Sustained load"
scenarios:
  - name: "API Health Check"
    flow:
      - get:
          url: "/api/health"
EOF

# Run load test
artillery run load-test.yml --output report.json
artillery report report.json
```

### 15.3: Chaos Engineering with AWS FIS

#### Create FIS Experiment Template
```bash
# Create IAM role for FIS
aws iam create-role \
  --role-name FISExperimentRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "fis.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy \
  --role-name FISExperimentRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSFaultInjectionSimulatorECSAccess

# Create experiment template (ECS task termination)
aws fis create-experiment-template \
  --cli-input-json '{
    "description": "Stop ECS tasks to test circuit breaker",
    "roleArn": "arn:aws:iam::317805897534:role/FISExperimentRole",
    "stopConditions": [{
      "source": "aws:cloudwatch:alarm",
      "value": "arn:aws:cloudwatch:us-east-1:317805897534:alarm:ecs-huntaze-cluster-task-count-critical"
    }],
    "targets": {
      "ECS-Tasks": {
        "resourceType": "aws:ecs:task",
        "selectionMode": "COUNT(2)",
        "resourceTags": {
          "Environment": "production"
        }
      }
    },
    "actions": {
      "StopTasks": {
        "actionId": "aws:ecs:stop-task",
        "parameters": {},
        "targets": {
          "Tasks": "ECS-Tasks"
        }
      }
    },
    "tags": {
      "Name": "huntaze-ecs-resilience-test"
    }
  }'

# Start experiment (CAUTION: This will stop ECS tasks!)
aws fis start-experiment --experiment-template-id <template-id>

# Monitor experiment
aws fis get-experiment --id <experiment-id>
```

### Success Criteria
- ✅ 2 canaries running with >95% success rate
- ✅ Canary p95 latency < 500ms
- ✅ Load test: Service handles 50 req/s sustained
- ✅ ECS auto-scales during load test
- ✅ FIS experiment: Circuit breaker triggers, service recovers
- ✅ Alarms triggered and resolved during chaos test

---

## Task 16: Rate Limiter Validation

### Burst Test Script
```bash
#!/bin/bash
# Send burst of 60 messages in 60 seconds

QUEUE_URL="https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue"

echo "Sending burst of 60 messages..."
for i in {1..60}; do
  aws sqs send-message \
    --queue-url "$QUEUE_URL" \
    --message-body "{\"action\":\"test\",\"creator_id\":\"test_$i\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
    --message-attributes "test={DataType=String,StringValue=burst}" &
  
  sleep 1
done

wait
echo "✅ 60 messages sent"

# Wait 2 minutes for processing
echo "Waiting 2 minutes for processing..."
sleep 120

# Check SQS metrics
echo "Checking SQS metrics..."
aws cloudwatch get-metric-statistics \
  --namespace AWS/SQS \
  --metric-name ApproximateNumberOfMessagesVisible \
  --dimensions Name=QueueName,Value=huntaze-rate-limiter-queue \
  --start-time $(date -u -d '15 min ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 60 \
  --statistics Average,Maximum \
  --output table

aws cloudwatch get-metric-statistics \
  --namespace AWS/SQS \
  --metric-name ApproximateAgeOfOldestMessage \
  --dimensions Name=QueueName,Value=huntaze-rate-limiter-queue \
  --start-time $(date -u -d '15 min ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 60 \
  --statistics Average,Maximum \
  --output table

# Check ECS scaling
aws ecs describe-services \
  --cluster huntaze-of-fargate \
  --services huntaze-onlyfans-scraper \
  --query 'services[0].{Desired:desiredCount,Running:runningCount,Pending:pendingCount}' \
  --output table
```

### Success Criteria
- ✅ Rate limiter processes at ~10 msg/min
- ✅ Queue depth increases then decreases smoothly
- ✅ ApproximateAgeOfOldestMessage returns to 0
- ✅ No messages in DLQ
- ✅ ECS scales if queue depth > 100
- ✅ Lambda errors < 1%

---

## Task 17: Documentation & Runbooks

### Create Final Runbooks

#### 1. Canaries & Load Testing Runbook
```markdown
# Canaries & Load Testing Runbook

## CloudWatch Synthetics Canaries

### Canaries Deployed
- huntaze-api-health: Monitors /api/health every 5 minutes
- huntaze-onlyfans-api: Monitors /api/v2/onlyfans/stats every 5 minutes

### Monitoring
- Dashboard: CloudWatch Synthetics
- Alarms: SuccessPercent < 95% for 2 consecutive periods

### Troubleshooting
1. Check canary logs in CloudWatch Logs
2. Review screenshots in S3 (huntaze-canary-artifacts)
3. Verify endpoint accessibility
4. Check IAM role permissions

## Load Testing

### Tools
- Artillery for quick tests
- AWS Distributed Load Testing for comprehensive tests

### Test Scenarios
- Warm-up: 10 req/s for 5 minutes
- Sustained: 50 req/s for 10 minutes
- Spike: 100 req/s for 2 minutes

### Success Criteria
- p95 latency < 500ms
- Error rate < 1%
- ECS auto-scales appropriately
```

#### 2. FIS Experiments Runbook
```markdown
# AWS FIS Chaos Engineering Runbook

## Experiments

### ECS Task Termination
- Template: huntaze-ecs-resilience-test
- Action: Stop 2 ECS tasks
- Stop Condition: Task count alarm
- Expected: Circuit breaker triggers, auto-scaling recovers

### Network Latency Injection
- Template: huntaze-network-latency-test
- Action: Add 200ms latency to ECS tasks
- Expected: Alarms trigger, service degrades gracefully

## Running Experiments

1. Review stop conditions
2. Notify team
3. Start experiment
4. Monitor alarms and metrics
5. Document results
6. Review recovery time

## Safety
- Always configure stop conditions
- Run during low-traffic periods
- Have rollback plan ready
```

#### 3. FinOps Runbook
```markdown
# FinOps Runbook - Budgets & Cost Anomaly Detection

## AWS Budgets

### Configuration
- Monthly budget: $500
- Alerts: 80% forecasted, 100% actual
- SNS topic: huntaze-cost-alerts

### Limitations
- Data refreshed every 8-24 hours (not real-time)
- Forecasts based on historical data
- Alerts may have delay

## Cost Anomaly Detection

### Monitors
- huntaze-cost-anomaly-monitor: Dimensional by SERVICE
- Threshold: $100 impact
- Frequency: Daily

### Response Procedure
1. Review anomaly in Cost Explorer
2. Identify root cause (service, usage type)
3. Check for misconfigurations
4. Implement cost controls if needed
5. Document in incident log

## Enhanced Cost Monitoring

### Service
- Location: lib/services/enhanced-cost-monitoring.ts
- Storage: huntaze-ai-costs-production (DynamoDB)
- TTL: 90 days

### Daily Tasks
- Pull AWS costs via Cost Explorer
- Track AI provider costs
- Check budget thresholds
- Send alerts if exceeded
```

---

## Task 18: Production Readiness Review (ORR)

### ORR Checklist

#### Security ✅
- [ ] Security Hub: 0 high/critical failed findings
- [ ] GuardDuty: 0 high/critical findings
- [ ] AWS Config: CIS conformance pack deployed
- [ ] CloudTrail: Multi-region logging active
- [ ] Encryption: All services encrypted (RDS, ElastiCache, S3, DynamoDB)
- [ ] IAM: Least-privilege policies
- [ ] S3: Block Public Access enabled
- [ ] Security runbook: Exit code 0

#### Cost ✅
- [ ] Monthly cost < $500
- [ ] Budget alerts configured (80%, 100%)
- [ ] Cost Anomaly Detection enabled
- [ ] VPC Endpoints deployed ($47/month savings)
- [ ] S3 Intelligent-Tiering enabled
- [ ] DynamoDB TTL configured (90 days)
- [ ] Enhanced Cost Monitoring functional

#### Observability ✅
- [ ] Container Insights enabled (3 clusters)
- [ ] 30+ CloudWatch alarms configured
- [ ] RDS Performance Insights enabled
- [ ] 2 Synthetics canaries running (>95% success)
- [ ] Dashboards created (RDS, Rate Limiter, S3)
- [ ] Log retention policies applied (30-90 days)

#### Resilience ✅
- [ ] ECS auto-scaling configured (1-10 tasks)
- [ ] Circuit breaker enabled
- [ ] Rate limiter functional (10 msg/min)
- [ ] DLQ configured
- [ ] Load test passed (50 req/s sustained)
- [ ] FIS chaos test passed (recovery < 5 min)

#### Documentation ✅
- [ ] Runbooks created (security, canaries, FIS, FinOps)
- [ ] Deployment instructions documented
- [ ] Rollback procedures documented
- [ ] On-call playbooks ready

### Evidence Collection

```bash
# Generate ORR evidence package
mkdir -p orr-evidence

# Security evidence
./scripts/validate-security-comprehensive.sh
cp validation-reports/* orr-evidence/

# Cost evidence
aws budgets describe-budgets --account-id $(aws sts get-caller-identity --query Account --output text) > orr-evidence/budgets.json
aws ce get-anomalies --date-interval Start=$(date -u -d '30 days ago' +%Y-%m-%d),End=$(date -u +%Y-%m-%d) > orr-evidence/anomalies.json

# Observability evidence
aws synthetics describe-canaries > orr-evidence/canaries.json
aws cloudwatch describe-alarms > orr-evidence/alarms.json

# Create ORR report
cat > orr-evidence/ORR_SIGN_OFF.md <<EOF
# Production Readiness Review - Sign Off

**Date**: $(date -u +%Y-%m-%d)
**Account**: $(aws sts get-caller-identity --query Account --output text)
**Region**: us-east-1

## Review Status

- [x] Security validation complete
- [x] Cost controls in place
- [x] Observability configured
- [x] Resilience tested
- [x] Documentation complete

## Sign-off

- [ ] Security Team: _________________ Date: _______
- [ ] DevOps Team: __________________ Date: _______
- [ ] FinOps Team: __________________ Date: _______
- [ ] Engineering Lead: _____________ Date: _______

## GO/NO-GO Decision

- [ ] GO - Ready for production
- [ ] NO-GO - Issues to address: _______________

EOF

echo "✅ ORR evidence package created in orr-evidence/"
```

### Final Validation Commands

```bash
# Run all validations
./scripts/security-runbook.sh
./scripts/validate-rds-performance-insights.sh
./scripts/validate-ecs-auto-scaling.sh
./scripts/validate-cloudwatch-alarms.sh

# Check all services
aws ecs list-clusters
aws rds describe-db-instances --query 'DBInstances[*].DBInstanceIdentifier'
aws elasticache describe-replication-groups --query 'ReplicationGroups[*].ReplicationGroupId'
aws sqs list-queues

# Verify encryption
./scripts/validate-s3-rds-security.sh
./scripts/validate-security-services.sh
```

---

## Success Criteria Summary

### Task 14: Cost Validation ✅
- Budget configured and alerts working
- Cost Anomaly Detection enabled
- Enhanced Cost Monitoring functional

### Task 15: Observability & Resilience ✅
- 2 canaries running with >95% success
- Load test passed (50 req/s)
- FIS chaos test passed

### Task 16: Rate Limiter ✅
- Burst test passed (10 msg/min enforced)
- Queue metrics healthy
- ECS auto-scaling working

### Task 17: Documentation ✅
- All runbooks created
- Procedures documented
- Team trained

### Task 18: ORR ✅
- All checklists complete
- Evidence collected
- Sign-off obtained

---

## Next Steps

1. Execute tasks 14-18 in order
2. Collect evidence for each task
3. Complete ORR checklist
4. Get stakeholder sign-off
5. **DEPLOY TO PRODUCTION** 🚀

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-29  
**Status**: Ready for Execution
