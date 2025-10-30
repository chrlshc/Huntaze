# Huntaze Prisma Walking Skeleton - AWS SAM Deployment

## Overview

This is a **walking skeleton** implementation for migrating Huntaze from mock data to Prisma/PostgreSQL using AWS-native services for progressive delivery.

**Timeline:** ½ day (4 hours)

## Architecture

```
User Request
    ↓
Lambda "huntaze-mock-read" (weighted alias)
    ├─→ Mock (control) → returns immediately
    │   └─→ Shadow traffic → async Prisma comparison
    └─→ Prisma (canary 1%) → if flag enabled
    ↓
CloudWatch Alarm (error rate > 2%)
    ↓
CodeDeploy Rollback (automatic)
```

## AWS Services Used

- **AWS AppConfig** - Feature flags with canary deployment
- **Lambda** - Weighted aliases for canary routing
- **CodeDeploy** - Automatic rollback on alarm
- **CloudWatch** - Alarms, metrics, logs, dashboard
- **X-Ray** - Distributed tracing
- **EventBridge** - Scheduled cleanup after 7 days

## Prerequisites

1. **AWS CLI** configured with credentials
2. **SAM CLI** installed (`brew install aws-sam-cli`)
3. **Node.js 20+** installed
4. **RDS PostgreSQL** instance running (huntaze-prod)
5. **Secrets Manager** secret `huntaze/database` with `DATABASE_URL`

## Quick Start

### 1. Deploy the Stack

```bash
cd sam
./deploy.sh
```

This will:
- Install Lambda dependencies
- Build SAM application
- Deploy CloudFormation stack
- Create AppConfig feature flag (disabled)
- Set up CloudWatch alarm and dashboard

### 2. Test Mock Lambda (Flag Disabled)

```bash
aws lambda invoke \
  --function-name huntaze-mock-read \
  --payload '{"userId":"user-1"}' \
  response.json

cat response.json
```

Expected: Returns mock data from in-memory Map

### 3. Enable Prisma Canary (1%)

```bash
./enable-canary.sh
```

This will:
- Create enabled configuration
- Start canary deployment (1% over 5 minutes)
- Add 5 minute bake time
- Monitor with CloudWatch alarm

### 4. Monitor Shadow Traffic

```bash
# Watch logs in real-time
sam logs -n huntaze-mock-read --tail

# Look for these log patterns:
# [SHADOW-OK] - Mock and Prisma match
# [SHADOW-DIFF] - Differences detected
# [SHADOW-FAILED] - Prisma invocation failed
```

### 5. Check Error Rate Alarm

```bash
aws cloudwatch describe-alarms \
  --alarm-names huntaze-lambda-error-rate-gt-2pct
```

If error rate > 2% for 3 out of 5 minutes, CodeDeploy will automatically rollback.

### 6. View CloudWatch Dashboard

```bash
open "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=huntaze-prisma-migration"
```

Dashboard shows:
- Mock Lambda metrics (invocations, errors, latency)
- Prisma Lambda metrics
- Error rate over time

### 7. View X-Ray Traces

```bash
open "https://console.aws.amazon.com/xray/home?region=us-east-1#/traces"
```

Filter by:
- Service: `huntaze-mock-read`
- Annotation: `prismaEnabled=true` or `prismaEnabled=false`

## Monitoring

### CloudWatch Logs Insights Queries

**Shadow Traffic Comparison:**
```
fields @timestamp, userId, match, duration
| filter @message like /SHADOW/
| sort @timestamp desc
| limit 100
```

**Error Rate:**
```
fields @timestamp, error, userId
| filter @message like /ERROR/
| stats count() by bin(5m)
```

**Latency P95:**
```
fields @timestamp, duration
| filter @message like /SUCCESS/
| stats avg(duration), pct(duration, 95) by bin(5m)
```

### Metrics to Watch

1. **Error Rate** - Should stay < 2%
2. **Latency P95** - Mock vs Prisma comparison
3. **Shadow Diff Rate** - % of requests with differences
4. **Invocation Count** - Traffic distribution

## Rollout Plan

### Phase 0: Shadow Traffic (Current)
- Flag: `disabled`
- Traffic: 100% Mock
- Shadow: 100% async Prisma comparison
- Duration: 24 hours

### Phase 1: Canary 1%
- Flag: `enabled` with 1% rollout
- Traffic: 99% Mock, 1% Prisma
- Duration: 48 hours
- Success criteria: error rate < 1%, latency < 500ms

### Phase 2: Ramp-up 5%
```bash
# Update feature flag to 5%
# Redeploy with new percentage
```

### Phase 3: Ramp-up 25% → 50% → 100%
- Gradual increase every 24h if stable
- Monitor metrics at each step
- Rollback if any issues

### Phase 4: Cleanup (Day 7)
- EventBridge automatically disables flag
- Remove mock code
- Deploy Prisma-only version

## Rollback

### Automatic Rollback
- Triggered by CloudWatch Alarm (error rate > 2%)
- CodeDeploy reverts to previous Lambda version
- AppConfig can also rollback flag deployment

### Manual Rollback

**Disable flag immediately:**
```bash
aws appconfig stop-deployment \
  --application-id <APP_ID> \
  --environment-id <ENV_ID> \
  --deployment-number <DEPLOYMENT_NUM>
```

**Rollback Lambda:**
```bash
aws lambda update-alias \
  --function-name huntaze-mock-read \
  --name live \
  --function-version <PREVIOUS_VERSION>
```

## Troubleshooting

### Lambda Errors

```bash
# Check recent errors
sam logs -n huntaze-mock-read --filter ERROR

# Check Prisma connection
sam logs -n huntaze-prisma-read --filter PRISMA-ERROR
```

### AppConfig Issues

```bash
# Check deployment status
aws appconfig get-deployment \
  --application-id <APP_ID> \
  --environment-id <ENV_ID> \
  --deployment-number <NUM>

# List all deployments
aws appconfig list-deployments \
  --application-id <APP_ID> \
  --environment-id <ENV_ID>
```

### Database Connection

```bash
# Test Prisma Lambda directly
aws lambda invoke \
  --function-name huntaze-prisma-read \
  --payload '{"userId":"user-1"}' \
  prisma-response.json

cat prisma-response.json
```

## Cost Estimate

- Lambda: ~$0.20/day (50 users, 1000 req/day)
- AppConfig: $0.50/day
- CloudWatch: $0.30/day (logs + metrics)
- X-Ray: $0.50/day
- **Total: ~$1.50/day = $45/month**

## Cleanup

To delete all resources:

```bash
sam delete --stack-name huntaze-prisma-skeleton --region us-east-1
```

## Next Steps

1. ✅ Deploy walking skeleton
2. ✅ Test shadow traffic
3. ✅ Enable 1% canary
4. Monitor for 48h
5. Ramp up to 5% → 25% → 50% → 100%
6. Add contract tests (Pact)
7. Migrate write operations (POST/PUT)
8. Cleanup flags after 7 days stable

## References

- [AWS AppConfig Feature Flags](https://docs.aws.amazon.com/appconfig/latest/userguide/what-is-appconfig.html)
- [Lambda Weighted Aliases](https://docs.aws.amazon.com/lambda/latest/dg/configuration-aliases.html)
- [CodeDeploy Lambda](https://docs.aws.amazon.com/codedeploy/latest/userguide/deployment-steps-lambda.html)
- [CloudWatch Alarms](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html)
- [X-Ray Tracing](https://docs.aws.amazon.com/xray/latest/devguide/xray-services-lambda.html)
