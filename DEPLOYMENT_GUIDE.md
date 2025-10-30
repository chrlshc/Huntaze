# 🚀 Huntaze Deployment Guide

**Date**: 2025-10-29  
**Status**: Ready for Production Deployment

---

## 📋 Pre-Deployment Checklist

### ✅ Code Ready
- [x] AWS Rate Limiter Backend Integration (100% complete)
- [x] Marketing Campaigns Backend (CampaignService + AutomationService)
- [x] All tests written and passing
- [x] Documentation complete

### ✅ Infrastructure Ready
- [x] Lambda `huntaze-rate-limiter` deployed
- [x] SQS Queue `huntaze-rate-limiter-queue` created
- [x] Redis ElastiCache configured
- [x] CloudWatch monitoring active
- [x] Terraform scripts ready

---

## 🔧 Step 1: Database Migration

### Generate and Apply Prisma Migrations

```bash
# Generate Prisma client with new models
npx prisma generate

# Create migration for new models (OnlyFansMessage, Campaign, etc.)
npx prisma migrate dev --name add_marketing_and_rate_limiter_models

# Apply migration to production database
npx prisma migrate deploy
```

**New Models Added:**
- `OnlyFansMessage` (rate limiter)
- `Campaign`, `CampaignTemplate`, `CampaignMetric`, `CampaignConversion`
- `ABTest`, `ABTestVariant`
- `Automation`, `AutomationExecution`
- `Segment`, `SegmentMember`

---

## 🌐 Step 2: Configure AWS Amplify Environment Variables

### Required Environment Variables

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>

# SQS Rate Limiter
SQS_RATE_LIMITER_QUEUE=https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue
RATE_LIMITER_ENABLED=false  # Start with false, enable progressively

# Database
DATABASE_URL=<your-postgres-connection-string>

# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<your-secret>
```

### Apply via AWS CLI

```bash
# Update Amplify app environment variables
aws amplify update-app \
  --app-id d33l77zi1h78ce \
  --environment-variables \
    SQS_RATE_LIMITER_QUEUE=https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue \
    RATE_LIMITER_ENABLED=false \
    AWS_REGION=us-east-1
```

Or use the Amplify Console:
1. Go to AWS Amplify Console
2. Select your app (d33l77zi1h78ce)
3. Environment variables → Add variables
4. Save and redeploy

---

## 📦 Step 3: Deploy Infrastructure (Terraform)

### Deploy CloudWatch Monitoring

```bash
cd infra/terraform/production-hardening

# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Apply (creates alarms and dashboard)
terraform apply -auto-approve
```

**What gets deployed:**
- CloudWatch Alarms (High Error Rate, Queue Depth, Latency)
- CloudWatch Dashboard (6 widgets for monitoring)
- SNS topics for notifications

---

## 🔨 Step 4: Build and Deploy Application

### Option A: Git Push (Automatic Deployment)

```bash
# Commit all changes
git add .
git commit -m "feat: Add Marketing Campaigns Backend + Rate Limiter Integration"

# Push to main branch (triggers Amplify auto-deploy)
git push origin main
```

### Option B: Manual Amplify Deployment

```bash
# Trigger manual deployment via AWS CLI
aws amplify start-job \
  --app-id d33l77zi1h78ce \
  --branch-name main \
  --job-type RELEASE
```

### Monitor Deployment

```bash
# Check deployment status
aws amplify get-job \
  --app-id d33l77zi1h78ce \
  --branch-name main \
  --job-id <job-id>
```

Or watch in Amplify Console:
https://console.aws.amazon.com/amplify/home?region=us-east-1#/d33l77zi1h78ce

---

## 🧪 Step 5: Post-Deployment Validation

### 5.1 Health Checks

```bash
# Check application health
curl https://your-domain.com/api/health

# Check rate limiter status
curl https://your-domain.com/api/onlyfans/messages/status \
  -H "Authorization: Bearer <your-token>"
```

### 5.2 Smoke Tests

```bash
# Run smoke tests
npm run test:e2e:smoke

# Or manually test key endpoints
curl -X POST https://your-domain.com/api/onlyfans/messages/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "recipientId": "test_user",
    "content": "Test message",
    "priority": "low"
  }'
```

### 5.3 Verify CloudWatch Metrics

```bash
# Check if metrics are being sent
aws cloudwatch get-metric-statistics \
  --namespace Huntaze/OnlyFans \
  --metric-name MessagesQueued \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

### 5.4 Check Logs

```bash
# View application logs
aws logs tail /aws/amplify/d33l77zi1h78ce --follow

# View Lambda logs
aws logs tail /aws/lambda/huntaze-rate-limiter --follow
```

---

## 🎚️ Step 6: Progressive Rollout (Rate Limiter)

### Phase 1: 10% Traffic (Day 1)

```bash
# Enable for 10% of users (implement in code or use feature flag service)
aws amplify update-app \
  --app-id d33l77zi1h78ce \
  --environment-variables RATE_LIMITER_ENABLED=true RATE_LIMITER_ROLLOUT_PERCENTAGE=10
```

**Monitor for 24 hours:**
- Error rates
- Queue depth
- Latency
- User feedback

### Phase 2: 50% Traffic (Day 2-3)

```bash
# Increase to 50%
aws amplify update-app \
  --app-id d33l77zi1h78ce \
  --environment-variables RATE_LIMITER_ROLLOUT_PERCENTAGE=50
```

### Phase 3: 100% Traffic (Day 4+)

```bash
# Full rollout
aws amplify update-app \
  --app-id d33l77zi1h78ce \
  --environment-variables RATE_LIMITER_ROLLOUT_PERCENTAGE=100
```

---

## 📊 Step 7: Monitoring & Alerts

### CloudWatch Dashboard

Access your dashboard:
```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=OnlyFans-Rate-Limiter
```

**Key Metrics to Watch:**
- MessagesQueued (should be steady)
- MessagesFailed (should be < 5%)
- QueueDepth (should be < 100)
- QueueLatency (should be < 5s)

### Set Up Alerts

Alarms are already configured via Terraform. Verify they're active:

```bash
aws cloudwatch describe-alarms \
  --alarm-name-prefix "OnlyFans-RateLimiter"
```

### Configure SNS Notifications

```bash
# Subscribe your email to SNS topic
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:317805897534:onlyfans-rate-limiter-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com
```

---

## 🔄 Rollback Plan

### If Issues Occur

#### Quick Rollback (Disable Rate Limiter)

```bash
# Disable rate limiter immediately
aws amplify update-app \
  --app-id d33l77zi1h78ce \
  --environment-variables RATE_LIMITER_ENABLED=false
```

#### Full Rollback (Previous Version)

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or rollback in Amplify Console
aws amplify start-job \
  --app-id d33l77zi1h78ce \
  --branch-name main \
  --job-type RELEASE \
  --commit-id <previous-commit-sha>
```

#### Emergency: Purge SQS Queue

```bash
# If queue is backed up
aws sqs purge-queue \
  --queue-url https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue
```

---

## 🎯 Success Criteria

### Deployment is successful when:

- ✅ Application builds and deploys without errors
- ✅ All health checks pass
- ✅ Database migrations applied successfully
- ✅ CloudWatch metrics are being received
- ✅ No critical alarms triggered
- ✅ API endpoints respond correctly
- ✅ Rate limiting works as expected (10 msg/min)
- ✅ Error rate < 1%
- ✅ P95 latency < 3s

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue: Database connection errors**
```bash
# Check DATABASE_URL is correct
echo $DATABASE_URL

# Test connection
npx prisma db pull
```

**Issue: SQS permissions denied**
```bash
# Verify IAM role has SQS permissions
aws iam get-role-policy \
  --role-name amplify-backend-role \
  --policy-name sqs-access
```

**Issue: High error rate**
```bash
# Check Lambda logs for errors
aws logs tail /aws/lambda/huntaze-rate-limiter --follow

# Check application logs
aws logs tail /aws/amplify/d33l77zi1h78ce --follow
```

### Documentation

- [AWS Rate Limiter Integration](./docs/onlyfans-rate-limiter-integration.md)
- [Marketing Campaigns Design](./kiro/specs/marketing-campaigns-backend/design.md)
- [Troubleshooting Guide](./docs/troubleshooting.md)

---

## 🎉 Post-Deployment

### Week 1: Monitor Closely
- Check metrics daily
- Review error logs
- Gather user feedback
- Adjust rate limits if needed

### Week 2-4: Optimize
- Analyze performance data
- Optimize Lambda memory/timeout
- Tune SQS batch sizes
- Implement cost optimizations

### Month 2+: Enhance
- Add new features
- Implement ML-based rate limiting
- Multi-region deployment
- Advanced analytics

---

**Deployment Owner**: DevOps Team  
**Emergency Contact**: ops@huntaze.com  
**Status Page**: https://status.huntaze.com
