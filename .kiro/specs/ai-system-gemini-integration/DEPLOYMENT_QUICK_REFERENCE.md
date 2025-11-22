# AI System Deployment - Quick Reference Card

## 🚀 Pre-Deployment (5 minutes)

```bash
# 1. Run pre-deployment checks
npm run deploy:ai:check

# 2. Verify all tests pass
npm run test:ai

# 3. Review deployment guide
cat .kiro/specs/ai-system-gemini-integration/DEPLOYMENT_GUIDE.md
```

## 📊 Database Migration (10 minutes)

```bash
# 1. Set production DATABASE_URL
export DATABASE_URL="postgresql://user:password@host:5432/huntaze_prod"

# 2. Apply migrations
npx prisma migrate deploy

# 3. Verify migrations
npm run verify:ai-migrations

# 4. Check tables exist
npm run verify:ai-tables
```

## ⚙️ Environment Variables (5 minutes)

**Required in Amplify Console:**

```bash
# Google Gemini AI
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-2.0-flash-exp

# AWS ElastiCache Redis
ELASTICACHE_REDIS_HOST=your-redis-host.cache.amazonaws.com
ELASTICACHE_REDIS_PORT=6379

# Database (should already be set)
DATABASE_URL=postgresql://...

# NextAuth (should already be set)
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret

# AWS (should already be set)
AWS_REGION=us-east-1
```

**How to set:**
1. Go to AWS Amplify Console
2. Select your app
3. Click "Environment variables"
4. Add each variable
5. Save changes

## 🚢 Deploy (2 minutes)

```bash
# 1. Commit all changes
git add .
git commit -m "feat: AI system production deployment"

# 2. Push to trigger deployment
git push origin main

# 3. Monitor in Amplify Console
# Watch build logs for errors
```

## ✅ Post-Deployment Verification (10 minutes)

```bash
# 1. Set environment variables
export PRODUCTION_URL="https://your-domain.com"
export SESSION_COOKIE="your-session-cookie"
export ADMIN_COOKIE="your-admin-cookie"

# 2. Run verification script
npm run deploy:ai:verify

# 3. Test endpoints manually
curl $PRODUCTION_URL/api/test-env
curl $PRODUCTION_URL/api/test-redis
curl $PRODUCTION_URL/api/ai/quota -H "Cookie: $SESSION_COOKIE"
```

## 🧪 Test with Real Users (15 minutes)

### Create Test Users

```sql
INSERT INTO users (email, name, password, ai_plan, role)
VALUES 
  ('test-starter@example.com', 'Test Starter', 'hashed-pw', 'starter', 'user'),
  ('test-pro@example.com', 'Test Pro', 'hashed-pw', 'pro', 'user'),
  ('test-admin@example.com', 'Test Admin', 'hashed-pw', 'pro', 'admin');
```

### Test Flows

1. **Starter User:**
   - Login
   - Send AI chat message
   - Generate caption
   - Check quota indicator
   - Try to exceed quota (should block)

2. **Pro User:**
   - Login
   - Test all AI features
   - Verify higher quota
   - Test rate limiting

3. **Admin User:**
   - Login
   - Access admin dashboard
   - View AI costs
   - Export data

## 📈 Monitor (Ongoing)

### Check Metrics

```bash
# CloudWatch Logs
aws logs tail /aws/amplify/huntaze/ai-system --follow

# Database usage
psql $DATABASE_URL -c "SELECT COUNT(*) FROM usage_logs;"
psql $DATABASE_URL -c "SELECT * FROM monthly_charges ORDER BY month DESC LIMIT 5;"

# Redis connection
redis-cli -h $ELASTICACHE_REDIS_HOST ping
```

### Key Metrics to Watch

- AI request count per hour
- AI costs per day (alert if > $200)
- Error rate (alert if > 5%)
- Response times (target < 3s)
- Rate limit rejections

## 🔄 Rollback (If Needed)

```bash
# Option 1: Revert Amplify deployment
aws amplify start-job \
  --app-id YOUR_APP_ID \
  --branch-name main \
  --job-type RELEASE \
  --job-id PREVIOUS_JOB_ID

# Option 2: Rollback database migrations
npx prisma migrate resolve --rolled-back 20241122_add_user_role
npx prisma migrate resolve --rolled-back 20241122_add_ai_plan_to_users
npx prisma migrate resolve --rolled-back 20241121_add_ai_tables

# Option 3: Disable AI features temporarily
# Set in Amplify Console:
AI_ENABLED=false
```

## 🆘 Troubleshooting

### Issue: Gemini API Key Not Working

```bash
# Test API key directly
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=YOUR_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

### Issue: Redis Connection Timeout

```bash
# Check security group allows connection
# Verify ELASTICACHE_REDIS_HOST is correct
# Test from EC2 in same VPC
redis-cli -h $ELASTICACHE_REDIS_HOST ping
```

### Issue: Database Migration Failed

```bash
# Check status
npx prisma migrate status

# Resolve and retry
npx prisma migrate resolve --applied 20241121_add_ai_tables
npx prisma migrate deploy
```

### Issue: High AI Costs

```bash
# Check usage by creator
curl https://your-domain.com/api/admin/ai-costs?startDate=2024-11-01 \
  -H "Cookie: $ADMIN_COOKIE"

# Adjust quotas if needed
psql $DATABASE_URL -c "UPDATE users SET ai_plan = 'starter' WHERE ai_plan = 'pro';"
```

## 📚 Documentation Links

- **Full Deployment Guide:** `.kiro/specs/ai-system-gemini-integration/DEPLOYMENT_GUIDE.md`
- **Integration Guide:** `lib/ai/INTEGRATION_GUIDE.md`
- **Quick Start:** `lib/ai/QUICK_START.md`
- **Component Guide:** `components/ai/README.md`
- **Admin Auth:** `lib/auth/ADMIN_AUTH_GUIDE.md`

## 🎯 Success Criteria

Deployment is successful when:

- ✅ All migrations applied
- ✅ All environment variables set
- ✅ Build completes without errors
- ✅ All API endpoints respond correctly
- ✅ Rate limiting works
- ✅ Quota enforcement blocks over-limit requests
- ✅ Usage logs are being created
- ✅ Admin dashboard shows data
- ✅ Real users can use AI features
- ✅ Monitoring is active

## ⏱️ Estimated Time

- **Pre-deployment:** 5 minutes
- **Database migration:** 10 minutes
- **Environment config:** 5 minutes
- **Deploy:** 2 minutes (+ 10 minutes build time)
- **Verification:** 10 minutes
- **User testing:** 15 minutes
- **Total:** ~45-60 minutes

## 📞 Support

- **Deployment Issues:** Check CloudWatch logs
- **Database Issues:** Check RDS console
- **Redis Issues:** Check ElastiCache console
- **Build Issues:** Check Amplify build logs
- **API Issues:** Check application logs

## 🎉 Post-Deployment

After successful deployment:

1. ✅ Monitor costs daily for first week
2. ✅ Gather user feedback
3. ✅ Optimize prompts based on usage
4. ✅ Adjust quotas if needed
5. ✅ Plan for scaling

---

**Last Updated:** November 22, 2024  
**Version:** 1.0  
**Status:** Production Ready
