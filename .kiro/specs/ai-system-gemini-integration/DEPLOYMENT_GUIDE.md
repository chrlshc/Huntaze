# AI System Deployment Guide

## Overview

This guide covers the complete deployment process for the AI System Gemini Integration to AWS Amplify production environment.

## Prerequisites

✅ All migrations created:
- `20241121_add_ai_tables` - UsageLog, MonthlyCharge, AIInsight tables
- `20241122_add_ai_plan_to_users` - ai_plan field in users table
- `20241122_add_user_role` - role field in users table

✅ All code implemented:
- Core Gemini SDK integration
- Billing and cost tracking
- Quota management
- Rate limiting with ElastiCache Redis
- AI agents and coordinator
- API routes
- UI components

## Step 1: Database Migration

### 1.1 Verify Local Migrations

```bash
# Check migration status
npx prisma migrate status

# Generate Prisma client
npx prisma generate
```

### 1.2 Apply Migrations to Production

**Option A: Using Prisma Migrate (Recommended)**

```bash
# Set production DATABASE_URL
export DATABASE_URL="postgresql://user:password@production-host:5432/huntaze_prod"

# Apply all pending migrations
npx prisma migrate deploy

# Verify tables exist
npx prisma db execute --stdin < scripts/check-ai-tables.ts
```

**Option B: Manual SQL Execution**

If you prefer to review SQL before applying:

```bash
# Review migration SQL
cat prisma/migrations/20241121_add_ai_tables/migration.sql
cat prisma/migrations/20241122_add_ai_plan_to_users/migration.sql
cat prisma/migrations/20241122_add_user_role/migration.sql

# Execute manually in your PostgreSQL client
psql $DATABASE_URL -f prisma/migrations/20241121_add_ai_tables/migration.sql
psql $DATABASE_URL -f prisma/migrations/20241122_add_ai_plan_to_users/migration.sql
psql $DATABASE_URL -f prisma/migrations/20241122_add_user_role/migration.sql
```

### 1.3 Verify Migration Success

```bash
# Run verification script
npm run verify:ai-tables

# Or manually check
psql $DATABASE_URL -c "\d usage_logs"
psql $DATABASE_URL -c "\d monthly_charges"
psql $DATABASE_URL -c "\d ai_insights"
psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name IN ('ai_plan', 'role');"
```

## Step 2: Configure Environment Variables

### 2.1 Required Environment Variables

Add these to your Amplify environment configuration:

```bash
# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key-from-google-ai-studio
GEMINI_MODEL=gemini-2.0-flash-exp

# AWS ElastiCache Redis (for AI rate limiting)
ELASTICACHE_REDIS_HOST=huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com
ELASTICACHE_REDIS_PORT=6379

# Database (should already be set)
DATABASE_URL=postgresql://user:password@host:5432/huntaze_prod

# NextAuth (should already be set)
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-nextauth-secret

# AWS Region (should already be set)
AWS_REGION=us-east-1
```

### 2.2 Set Variables in Amplify Console

1. Go to AWS Amplify Console
2. Select your app
3. Go to "Environment variables"
4. Add each variable listed above
5. Save changes

### 2.3 Verify Environment Variables

Create a test endpoint to verify (remove after verification):

```typescript
// app/api/test-env/route.ts
export async function GET() {
  return Response.json({
    gemini: !!process.env.GEMINI_API_KEY,
    redis: !!process.env.ELASTICACHE_REDIS_HOST,
    database: !!process.env.DATABASE_URL,
  });
}
```

## Step 3: Deploy to Amplify

### 3.1 Commit and Push Changes

```bash
# Ensure all changes are committed
git status
git add .
git commit -m "feat: AI system deployment ready"
git push origin main
```

### 3.2 Trigger Amplify Build

Amplify will automatically detect the push and start building. Monitor the build:

1. Go to AWS Amplify Console
2. Select your app
3. Watch the build progress
4. Check build logs for any errors

### 3.3 Build Verification Checklist

During the build, verify:
- ✅ Dependencies install successfully
- ✅ Prisma client generates
- ✅ TypeScript compiles without errors
- ✅ Next.js build completes
- ✅ No missing environment variables warnings

## Step 4: Post-Deployment Verification

### 4.1 Test Database Connectivity

```bash
# Test from production environment
curl https://your-domain.com/api/test-env
```

Expected response:
```json
{
  "gemini": true,
  "redis": true,
  "database": true
}
```

### 4.2 Test AI API Endpoints

```bash
# Test AI chat endpoint (requires authentication)
curl -X POST https://your-domain.com/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "fanId": "test-fan-123",
    "message": "Hello!"
  }'

# Test quota endpoint
curl https://your-domain.com/api/ai/quota \
  -H "Cookie: your-session-cookie"

# Test admin costs endpoint (requires admin role)
curl https://your-domain.com/api/admin/ai-costs \
  -H "Cookie: your-admin-session-cookie"
```

### 4.3 Test Redis Connectivity

```bash
# Test Redis connection
curl https://your-domain.com/api/test-redis
```

Expected response:
```json
{
  "success": true,
  "message": "Redis connection successful",
  "ping": "PONG"
}
```

### 4.4 Verify Rate Limiting

```bash
# Make multiple requests to test rate limiting
for i in {1..60}; do
  curl -X POST https://your-domain.com/api/ai/chat \
    -H "Content-Type: application/json" \
    -H "Cookie: your-session-cookie" \
    -d '{"fanId":"test","message":"test"}' &
done
wait

# Should see 429 responses after hitting limit
```

## Step 5: Test with Real Users

### 5.1 Create Test User Accounts

```bash
# Create test users with different plans
npm run script:create-test-users
```

Or manually:
```sql
INSERT INTO users (email, name, password, ai_plan, role)
VALUES 
  ('test-starter@example.com', 'Test Starter', 'hashed-password', 'starter', 'user'),
  ('test-pro@example.com', 'Test Pro', 'hashed-password', 'pro', 'user'),
  ('test-business@example.com', 'Test Business', 'hashed-password', 'business', 'user'),
  ('test-admin@example.com', 'Test Admin', 'hashed-password', 'pro', 'admin');
```

### 5.2 Test User Flows

**Starter Plan User:**
1. Login as starter user
2. Navigate to AI chat assistant
3. Send 10 messages (should work)
4. Check quota indicator (should show usage)
5. Try to exceed $10 monthly quota (should be blocked)

**Pro Plan User:**
1. Login as pro user
2. Test all AI features:
   - Chat assistant
   - Caption generator
   - Analytics dashboard
3. Verify higher quota ($50/month)
4. Test rate limiting (100 req/hour)

**Business Plan User:**
1. Login as business user
2. Verify unlimited quota
3. Test higher rate limit (500 req/hour)

**Admin User:**
1. Login as admin
2. Access admin dashboard
3. View AI costs by creator
4. Export cost data
5. Verify all metrics are accurate

### 5.3 Monitor Usage Logs

```sql
-- Check usage logs are being created
SELECT * FROM usage_logs ORDER BY "createdAt" DESC LIMIT 10;

-- Check monthly charges are aggregating
SELECT * FROM monthly_charges ORDER BY month DESC;

-- Check AI insights are being stored
SELECT * FROM ai_insights ORDER BY "createdAt" DESC LIMIT 10;
```

## Step 6: Monitoring and Alerts

### 6.1 Set Up CloudWatch Alarms

```bash
# Run monitoring setup script
npm run setup:monitoring
```

Or manually create alarms:
- Daily AI costs > $200
- AI error rate > 5%
- Rate limit rejections > 1000/hour
- Database connection failures

### 6.2 Verify Metrics

Check CloudWatch dashboard for:
- AI request count
- AI cost per hour
- Error rates by endpoint
- Rate limit hits
- Response times

### 6.3 Test Alerting

```bash
# Trigger test alert
curl -X POST https://your-domain.com/api/monitoring/test-alert
```

Verify you receive alerts via configured channels (email, Slack, etc.)

## Step 7: Performance Optimization

### 7.1 Enable Caching

Verify caching is working:
```bash
# First request (cache miss)
time curl https://your-domain.com/api/ai/chat -d '{"fanId":"test","message":"hello"}'

# Second request (cache hit - should be faster)
time curl https://your-domain.com/api/ai/chat -d '{"fanId":"test","message":"hello"}'
```

### 7.2 Monitor Response Times

Target metrics:
- AI chat: < 3 seconds (95th percentile)
- Caption generation: < 2 seconds
- Analytics: < 1 second
- Quota check: < 100ms

### 7.3 Database Query Optimization

```sql
-- Verify indexes are being used
EXPLAIN ANALYZE SELECT * FROM usage_logs WHERE "creatorId" = 1 AND "createdAt" > NOW() - INTERVAL '30 days';

-- Should use idx_usage_logs_creatorId_createdAt index
```

## Step 8: Rollback Plan

If issues occur, follow this rollback procedure:

### 8.1 Immediate Rollback

```bash
# Revert to previous Amplify deployment
aws amplify start-job --app-id YOUR_APP_ID --branch-name main --job-type RELEASE --job-id PREVIOUS_JOB_ID
```

### 8.2 Database Rollback (if needed)

```bash
# Rollback migrations (CAUTION: may lose data)
npx prisma migrate resolve --rolled-back 20241122_add_user_role
npx prisma migrate resolve --rolled-back 20241122_add_ai_plan_to_users
npx prisma migrate resolve --rolled-back 20241121_add_ai_tables
```

### 8.3 Disable AI Features

If you need to disable AI temporarily without rolling back:

```typescript
// Add feature flag
export const AI_ENABLED = process.env.AI_ENABLED === 'true';

// In API routes
if (!AI_ENABLED) {
  return Response.json({ error: 'AI features temporarily disabled' }, { status: 503 });
}
```

## Troubleshooting

### Issue: Gemini API Key Not Working

```bash
# Test API key directly
curl https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=YOUR_API_KEY \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

### Issue: Redis Connection Timeout

```bash
# Check security group allows connection from Amplify
# Verify ELASTICACHE_REDIS_HOST is correct
# Test connection from EC2 instance in same VPC
```

### Issue: Database Migration Failed

```bash
# Check migration status
npx prisma migrate status

# Resolve failed migration
npx prisma migrate resolve --applied 20241121_add_ai_tables

# Or rollback and retry
npx prisma migrate resolve --rolled-back 20241121_add_ai_tables
npx prisma migrate deploy
```

### Issue: High AI Costs

```bash
# Check usage by creator
curl https://your-domain.com/api/admin/ai-costs?startDate=2024-11-01

# Identify high-usage creators
# Consider adjusting quotas or rate limits
```

## Success Criteria

Deployment is successful when:

- ✅ All migrations applied successfully
- ✅ All environment variables configured
- ✅ Build completes without errors
- ✅ All API endpoints respond correctly
- ✅ Rate limiting works as expected
- ✅ Quota enforcement blocks over-limit requests
- ✅ Usage logs are being created
- ✅ Monthly charges are aggregating
- ✅ AI insights are being stored
- ✅ Admin dashboard shows accurate data
- ✅ Real users can use AI features
- ✅ Monitoring and alerts are active
- ✅ Performance meets targets

## Next Steps

After successful deployment:

1. Monitor costs daily for first week
2. Gather user feedback on AI features
3. Optimize prompts based on usage patterns
4. Adjust quotas if needed
5. Implement additional monitoring as needed
6. Plan for scaling (if usage grows significantly)

## Support

For issues during deployment:
- Check CloudWatch logs
- Review Amplify build logs
- Check database logs
- Contact AWS support if infrastructure issues
- Review this guide's troubleshooting section
