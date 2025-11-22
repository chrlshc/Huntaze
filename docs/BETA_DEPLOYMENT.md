# Beta Launch Deployment Runbook

## Overview

This runbook provides step-by-step instructions for deploying the Huntaze Beta Launch UI System to production. The deployment includes Next.js application, AWS infrastructure (S3, CloudFront, Lambda@Edge, SES, CloudWatch), and database migrations.

**Target Environment:** Production (Beta Launch)
**Expected Users:** 20-50 creators
**Deployment Platform:** Vercel (Application) + AWS (Infrastructure)
**Database:** PostgreSQL 15

---

## Pre-Deployment Checklist

### 1. Code Quality & Testing

- [ ] All unit tests passing (`npm test -- --run`)
- [ ] All integration tests passing (`npm run test:integration -- --run`)
- [ ] All property-based tests passing (19 properties implemented)
- [ ] No security vulnerabilities (`npm audit --production`)
- [ ] Code review completed and approved
- [ ] All feature branches merged to main

### 2. Environment Variables

Verify all required environment variables are set in production:

**Database:**
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] Database has sufficient capacity for 20-50 users

**Authentication:**
- [ ] `NEXTAUTH_URL` - Production URL (https://app.huntaze.com)
- [ ] `NEXTAUTH_SECRET` - Cryptographically secure secret (32+ characters)
- [ ] `ENCRYPTION_KEY` - 32-character encryption key for credentials

**AWS Credentials:**
- [ ] `AWS_ACCESS_KEY_ID` - IAM user with appropriate permissions
- [ ] `AWS_SECRET_ACCESS_KEY` - IAM secret key
- [ ] `AWS_REGION` - us-east-1 (required for Lambda@Edge)
- [ ] `AWS_SESSION_TOKEN` - (Optional) If using temporary credentials

**AWS Services:**
- [ ] `AWS_S3_BUCKET` - huntaze-beta-assets
- [ ] `CDN_URL` - CloudFront distribution URL
- [ ] `AWS_SQS_QUEUE_URL` - (If using SQS)
- [ ] `AWS_LAMBDA_FUNCTION_NAME` - (If using Lambda)

**OAuth Providers:**
- [ ] `INSTAGRAM_CLIENT_ID` - Instagram OAuth app ID
- [ ] `INSTAGRAM_CLIENT_SECRET` - Instagram OAuth secret
- [ ] `TIKTOK_CLIENT_KEY` - TikTok OAuth key
- [ ] `TIKTOK_CLIENT_SECRET` - TikTok OAuth secret
- [ ] `REDDIT_CLIENT_ID` - Reddit OAuth app ID
- [ ] `REDDIT_CLIENT_SECRET` - Reddit OAuth secret
- [ ] OnlyFans credentials (stored encrypted in database)

**Application:**
- [ ] `NEXT_PUBLIC_APP_URL` - https://app.huntaze.com
- [ ] `NODE_ENV` - production

### 3. AWS Infrastructure

**S3 Bucket:**
- [ ] Bucket `huntaze-beta-assets` created
- [ ] Versioning enabled
- [ ] Lifecycle policies configured (archive after 30 days, delete after 365 days)
- [ ] Bucket policies set (deny public access, CloudFront-only)
- [ ] CORS configuration set for web access

**CloudFront Distribution:**
- [ ] Distribution created and deployed
- [ ] S3 origin configured for static assets
- [ ] Vercel origin configured for dynamic content
- [ ] Cache behaviors set (1 year for immutable, 0 for dynamic)
- [ ] Compression enabled (gzip, brotli)
- [ ] Custom domain configured (cdn.huntaze.com)
- [ ] SSL certificate provisioned and attached

**Lambda@Edge Functions:**
- [ ] Security headers function deployed to us-east-1
- [ ] Image optimization function deployed to us-east-1
- [ ] Functions associated with CloudFront distribution
- [ ] Test security headers in responses
- [ ] Test image format detection (WebP/AVIF)

**SES (Email Service):**
- [ ] Domain verified (huntaze.com)
- [ ] DKIM records configured
- [ ] SPF records configured
- [ ] DMARC records configured
- [ ] Production access enabled (out of sandbox)
- [ ] Sending limits verified (sufficient for beta)

**CloudWatch:**
- [ ] Log groups created for application errors
- [ ] Custom metrics configured (API response times)
- [ ] Alarms set:
  - Error rate > 1%
  - API latency > 1s
  - Cache hit ratio < 80%
- [ ] SNS topic created for critical alerts
- [ ] Email/Slack notifications configured
- [ ] Dashboard created with key metrics

### 4. Database Migrations

- [ ] Review all pending migrations
- [ ] Test migrations in staging environment
- [ ] Backup production database before migration
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Verify schema matches expected state
- [ ] Verify data integrity after migration

---

## Deployment Steps

### Phase 1: Infrastructure Deployment (AWS)

**Estimated Time:** 30-45 minutes

#### 1.1 Deploy S3 Bucket

```bash
# Navigate to infrastructure directory
cd infra/aws

# Deploy S3 stack
aws cloudformation deploy \
  --template-file s3-bucket-stack.yaml \
  --stack-name huntaze-beta-s3 \
  --parameter-overrides BucketName=huntaze-beta-assets \
  --region us-east-1

# Verify bucket creation
aws s3 ls | grep huntaze-beta-assets
```

#### 1.2 Upload Static Assets

```bash
# Build Next.js application
npm run build

# Upload assets to S3
npm run upload-assets

# Verify assets uploaded
aws s3 ls s3://huntaze-beta-assets/ --recursive | head -20
```

#### 1.3 Deploy Lambda@Edge Functions

```bash
# Navigate to Lambda directory
cd infra/lambda

# Deploy security headers function
./deploy-lambda-edge.sh security-headers

# Deploy image optimization function
./deploy-lambda-edge.sh image-optimization

# Verify functions deployed
aws lambda list-functions --region us-east-1 | grep huntaze
```

#### 1.4 Deploy CloudFront Distribution

```bash
# Deploy CloudFront stack
cd infra/aws
aws cloudformation deploy \
  --template-file cloudfront-distribution-stack.yaml \
  --stack-name huntaze-beta-cloudfront \
  --parameter-overrides \
    S3BucketName=huntaze-beta-assets \
    VercelOrigin=huntaze.vercel.app \
  --region us-east-1

# Get CloudFront distribution ID
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name huntaze-beta-cloudfront \
  --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' \
  --output text)

echo "CloudFront Distribution ID: $DISTRIBUTION_ID"

# Wait for distribution to deploy (15-20 minutes)
aws cloudfront wait distribution-deployed --id $DISTRIBUTION_ID
```

#### 1.5 Configure CloudWatch Monitoring

```bash
# Run CloudWatch setup script
npm run setup:cloudwatch

# Verify alarms created
aws cloudwatch describe-alarms --region us-east-1 | grep huntaze

# Test alert system
npm run test:cloudwatch
```

### Phase 2: Application Deployment (Vercel)

**Estimated Time:** 10-15 minutes

#### 2.1 Set Environment Variables in Vercel

```bash
# Using Vercel CLI
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add ENCRYPTION_KEY production
vercel env add AWS_ACCESS_KEY_ID production
vercel env add AWS_SECRET_ACCESS_KEY production
vercel env add AWS_REGION production
vercel env add AWS_S3_BUCKET production
vercel env add CDN_URL production
# ... (add all other environment variables)
```

Or set via Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add all variables from `.env.example`
3. Set scope to "Production"

#### 2.2 Deploy to Vercel

```bash
# Deploy to production
vercel --prod

# Or via Git push (if auto-deploy enabled)
git push origin main
```

#### 2.3 Verify Deployment

```bash
# Check deployment status
vercel ls

# Get production URL
vercel inspect --prod

# Test production endpoint
curl -I https://app.huntaze.com
```

### Phase 3: Database Migration

**Estimated Time:** 5-10 minutes

#### 3.1 Backup Database

```bash
# Create backup before migration
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Or use managed backup service
# (Vercel Postgres, AWS RDS, etc.)
```

#### 3.2 Run Migrations

```bash
# Set production database URL
export DATABASE_URL="postgresql://..."

# Run migrations
npx prisma migrate deploy

# Verify schema
npx prisma db pull
npx prisma generate
```

#### 3.3 Verify Data Integrity

```bash
# Run verification script
npm run verify:database

# Check critical tables
npx prisma studio
# Verify: User, Integration, UserStats tables exist and are accessible
```

### Phase 4: Post-Deployment Verification

**Estimated Time:** 15-20 minutes

#### 4.1 Smoke Tests

**Authentication Flow:**
```bash
# Test registration
curl -X POST https://app.huntaze.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'

# Expected: 201 Created with userId and verificationToken
```

**Email Verification:**
- Check SES dashboard for sent emails
- Verify email delivery to test account
- Click verification link
- Verify redirect to onboarding

**Login:**
```bash
# Test login
curl -X POST https://app.huntaze.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}' \
  -c cookies.txt

# Expected: 200 OK with session cookie
```

**Home Page:**
```bash
# Test authenticated home page
curl https://app.huntaze.com/home \
  -b cookies.txt

# Expected: 200 OK with HTML content
```

**Integrations:**
```bash
# Test integrations status
curl https://app.huntaze.com/api/integrations/status \
  -b cookies.txt

# Expected: 200 OK with integration list
```

#### 4.2 Performance Tests

**Lighthouse Audit:**
```bash
# Run Lighthouse on key pages
npm run lighthouse

# Verify Core Web Vitals:
# - FCP < 1.5s
# - LCP < 2.5s
# - FID < 100ms
# - CLS < 0.1
```

**Load Testing:**
```bash
# Run load test (if configured)
npm run loadtest

# Monitor CloudWatch metrics during test
```

#### 4.3 Security Verification

**HTTPS:**
```bash
# Verify SSL certificate
curl -vI https://app.huntaze.com 2>&1 | grep "SSL certificate"

# Expected: Valid certificate, no warnings
```

**Security Headers:**
```bash
# Check security headers
curl -I https://app.huntaze.com

# Expected headers:
# - Content-Security-Policy
# - Strict-Transport-Security
# - X-Frame-Options: DENY
# - X-Content-Type-Options: nosniff
```

**CSRF Protection:**
```bash
# Test CSRF token endpoint
curl https://app.huntaze.com/api/csrf/token \
  -b cookies.txt

# Expected: 200 OK with CSRF token
```

#### 4.4 Monitoring Verification

**CloudWatch Dashboard:**
1. Open CloudWatch console
2. Navigate to Dashboards → huntaze-beta
3. Verify metrics are being collected:
   - API response times
   - Error rates
   - Cache hit ratios
   - Request counts

**Alarms:**
1. Verify alarms are in "OK" state
2. Test alarm by triggering condition (optional)
3. Verify SNS notifications received

**Logs:**
1. Check CloudWatch Logs for application errors
2. Verify log retention policies
3. Set up log insights queries for common issues

---

## Cache Warming

After deployment, warm the cache to improve initial user experience:

```bash
# Warm cache for common endpoints
curl https://app.huntaze.com/api/home/stats -b cookies.txt
curl https://app.huntaze.com/api/integrations/status -b cookies.txt

# Warm CloudFront cache for static assets
curl https://cdn.huntaze.com/_next/static/css/main.css
curl https://cdn.huntaze.com/_next/static/js/main.js
```

---

## Rollback Procedure

If critical issues are discovered post-deployment, follow this rollback procedure:

### Option 1: Vercel Instant Rollback

**Estimated Time:** 2-3 minutes

```bash
# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]

# Or via Vercel Dashboard:
# 1. Go to Deployments
# 2. Find previous stable deployment
# 3. Click "..." → "Promote to Production"
```

### Option 2: Git Revert

**Estimated Time:** 5-10 minutes

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Vercel will auto-deploy the reverted version
```

### Option 3: Database Rollback

**Only if database migration caused issues**

**Estimated Time:** 10-15 minutes

```bash
# Restore from backup
psql $DATABASE_URL < backup-YYYYMMDD-HHMMSS.sql

# Or use managed restore:
# - Vercel Postgres: Use dashboard restore
# - AWS RDS: Restore from automated snapshot
```

### Post-Rollback Actions

1. **Notify stakeholders** of rollback
2. **Document the issue** that caused rollback
3. **Create incident report** with root cause analysis
4. **Fix the issue** in development environment
5. **Test thoroughly** before re-deploying
6. **Schedule new deployment** when fix is verified

---

## Monitoring & Alerting

### CloudWatch Alarms

**Critical Alarms (Immediate Action Required):**

| Alarm | Threshold | Action |
|-------|-----------|--------|
| Error Rate | > 1% | Investigate logs, consider rollback |
| API Latency | > 1s | Check database performance, cache hit rate |
| Database Connections | > 80% of max | Scale database or optimize queries |
| Lambda Errors | > 5 errors/min | Check Lambda logs, verify permissions |

**Warning Alarms (Monitor Closely):**

| Alarm | Threshold | Action |
|-------|-----------|--------|
| Cache Hit Rate | < 80% | Review cache TTL settings, warm cache |
| CloudFront 4xx | > 50 requests/min | Check for broken links, invalid requests |
| SES Bounce Rate | > 5% | Review email list, check domain reputation |

### SNS Notifications

**Email Alerts:**
- Critical alarms → ops@huntaze.com
- Warning alarms → dev@huntaze.com

**Slack Integration (Optional):**
```bash
# Configure SNS → Slack webhook
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT:huntaze-alerts \
  --protocol https \                                                                                                                                                                                                                            
  --notification-endpoint https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Vercel Analytics

Monitor in Vercel Dashboard:
- Real User Monitoring (RUM)
- Core Web Vitals
- Error tracking
- Function execution times

---

## Troubleshooting

### Common Issues

#### Issue: Email verification not sending

**Symptoms:** Users not receiving verification emails

**Diagnosis:**
```bash
# Check SES sending statistics
aws ses get-send-statistics --region us-east-1

# Check SES reputation
aws ses get-account-sending-enabled --region us-east-1
```

**Resolution:**
1. Verify SES is out of sandbox mode
2. Check domain verification status
3. Review bounce/complaint rates
4. Check CloudWatch Logs for SES errors

#### Issue: OAuth connections failing

**Symptoms:** Users unable to connect Instagram/TikTok/Reddit

**Diagnosis:**
```bash
# Check OAuth callback logs
# In Vercel Dashboard → Functions → Logs
# Filter for: /api/integrations/callback

# Check integration service logs
grep "OAuth" /var/log/application.log
```

**Resolution:**
1. Verify OAuth credentials in environment variables
2. Check callback URLs match provider settings
3. Verify CSRF protection not blocking requests
4. Check rate limits on OAuth providers

#### Issue: Slow page loads

**Symptoms:** Pages taking > 3s to load

**Diagnosis:**
```bash
# Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name OriginLatency \
  --dimensions Name=DistributionId,Value=$DISTRIBUTION_ID \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average

# Check cache hit rate
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name CacheHitRate \
  --dimensions Name=DistributionId,Value=$DISTRIBUTION_ID \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

**Resolution:**
1. Warm CloudFront cache
2. Optimize database queries
3. Increase cache TTL for static content
4. Enable compression if not already enabled

#### Issue: Database connection errors

**Symptoms:** "Too many connections" or connection timeouts

**Diagnosis:**
```bash
# Check active connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Check connection pool settings
grep "connection" next.config.ts
```

**Resolution:**
1. Increase database connection limit
2. Optimize connection pooling in Prisma
3. Close idle connections
4. Scale database if needed

---

## Post-Deployment Tasks

### Day 1 (Launch Day)

- [ ] Monitor CloudWatch dashboard continuously
- [ ] Check error logs every hour
- [ ] Verify email delivery working
- [ ] Test OAuth flows with real accounts
- [ ] Monitor user registrations
- [ ] Check cache hit rates
- [ ] Verify all alarms in OK state

### Week 1

- [ ] Review CloudWatch metrics daily
- [ ] Analyze user feedback
- [ ] Monitor performance trends
- [ ] Check database growth
- [ ] Review error patterns
- [ ] Optimize slow queries
- [ ] Update documentation based on issues

### Month 1

- [ ] Conduct performance review
- [ ] Analyze cost metrics (AWS, Vercel)
- [ ] Review security logs
- [ ] Plan capacity scaling
- [ ] Document lessons learned
- [ ] Update runbook with new procedures

---

## Emergency Contacts

**On-Call Engineer:** [Your contact info]
**DevOps Lead:** [Contact info]
**Product Manager:** [Contact info]
**AWS Support:** [Support plan details]
**Vercel Support:** [Support plan details]

---

## Appendix

### A. Required IAM Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::huntaze-beta-assets",
        "arn:aws:s3:::huntaze-beta-assets/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetDistribution"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricData",
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

### B. Database Schema Verification

```sql
-- Verify critical tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('User', 'Integration', 'UserStats');

-- Verify indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public';

-- Check row counts
SELECT 
  'User' as table_name, COUNT(*) as row_count FROM "User"
UNION ALL
SELECT 
  'Integration', COUNT(*) FROM "Integration"
UNION ALL
SELECT 
  'UserStats', COUNT(*) FROM "UserStats";
```

### C. Performance Benchmarks

**Target Metrics (Beta Launch):**

| Metric | Target | Acceptable | Critical |
|--------|--------|------------|----------|
| FCP | < 1.5s | < 2.0s | > 2.5s |
| LCP | < 2.5s | < 3.0s | > 4.0s |
| FID | < 100ms | < 200ms | > 300ms |
| CLS | < 0.1 | < 0.15 | > 0.25 |
| API Response | < 200ms | < 500ms | > 1s |
| Cache Hit Rate | > 80% | > 70% | < 60% |
| Error Rate | < 0.1% | < 1% | > 2% |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-21 | Kiro | Initial deployment runbook |

