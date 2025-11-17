# NextAuth Migration - Production Deployment Guide

## ⚠️ Prerequisites

**CRITICAL: Do not proceed to production until:**

- [ ] Staging deployment has been running for **at least 48 hours**
- [ ] No critical issues found in staging
- [ ] All manual testing completed successfully
- [ ] Team sign-off received
- [ ] User communication prepared (if needed)
- [ ] Rollback plan reviewed and understood

## Pre-Deployment Checklist

### Staging Validation

- [ ] Staging has been stable for 48+ hours
- [ ] No authentication errors in staging logs
- [ ] No unexpected 401 errors
- [ ] Session persistence working correctly
- [ ] All protected pages accessible
- [ ] API endpoints functioning correctly
- [ ] Performance metrics acceptable

### Environment Preparation

- [ ] `NEXTAUTH_SECRET` set in production (different from staging!)
- [ ] `NEXTAUTH_URL` set to production URL
- [ ] `DATABASE_URL` points to production database
- [ ] All OAuth credentials configured for production
- [ ] SSL/HTTPS enabled and verified
- [ ] Database migrations applied to production

### Team Readiness

- [ ] Development team available during deployment
- [ ] Operations team on standby
- [ ] Support team briefed on changes
- [ ] Rollback plan reviewed with team
- [ ] Communication plan ready

### Backup and Safety

- [ ] Database backup completed
- [ ] Previous deployment tagged in git
- [ ] Rollback procedure tested
- [ ] Monitoring alerts configured
- [ ] Incident response plan ready

## Deployment Window

### Recommended Timing

Deploy during **low-traffic period**:
- Weekday: Tuesday-Thursday
- Time: 2:00 AM - 4:00 AM (your timezone)
- Avoid: Fridays, weekends, holidays, peak hours

### Duration Estimate

- Deployment: 10-15 minutes
- Verification: 30-60 minutes
- Monitoring: 2-4 hours active monitoring

## Deployment Steps

### Step 1: Final Verification (15 minutes before)

```bash
# Verify staging is still healthy
curl https://staging.huntaze.com/api/health
curl https://staging.huntaze.com/api/auth/session

# Check staging logs for recent errors
# (Method depends on your platform)

# Verify production database is ready
psql $PRODUCTION_DATABASE_URL -c "SELECT COUNT(*) FROM users;"
psql $PRODUCTION_DATABASE_URL -c "\d users" | grep onboarding_completed
```

### Step 2: Pre-Deployment Backup

```bash
# Backup production database
pg_dump $PRODUCTION_DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Tag current production version
git tag -a v1.0-pre-nextauth-migration -m "Pre-NextAuth migration"
git push origin v1.0-pre-nextauth-migration
```

### Step 3: Deploy to Production

#### Option A: Automated Deployment

```bash
# Set production environment
export PRODUCTION_URL=https://app.huntaze.com
export PRODUCTION_DATABASE_URL=postgresql://...

# Deploy
git checkout main
git merge staging
git push origin main

# Or use platform-specific deployment
amplify publish --environment production
# or
vercel --prod
```

#### Option B: Manual Deployment

```bash
# 1. Merge staging to main
git checkout main
git merge staging

# 2. Run final tests
npm run test:integration
npm run build

# 3. Push to production
git push origin main

# 4. Monitor deployment pipeline
# (Check your CI/CD platform)
```

### Step 4: Immediate Verification (5 minutes)

```bash
# Wait for deployment to complete
sleep 60

# Check if production is accessible
curl https://app.huntaze.com/api/health

# Check NextAuth endpoint
curl https://app.huntaze.com/api/auth/session

# Check for errors in logs
# (Method depends on your platform)
```

### Step 5: Smoke Testing (15 minutes)

Perform these tests immediately after deployment:

#### Test 1: Registration
- [ ] Visit https://app.huntaze.com/auth
- [ ] Register new test account
- [ ] Verify redirect to onboarding
- [ ] Complete onboarding
- [ ] Verify redirect to dashboard

#### Test 2: Login
- [ ] Logout
- [ ] Login with test account
- [ ] Verify redirect to dashboard
- [ ] Check session persists on refresh

#### Test 3: Navigation
- [ ] Navigate to /dashboard
- [ ] Navigate to /analytics/advanced
- [ ] Navigate to OnlyFans pages
- [ ] Verify no disconnections

#### Test 4: API
- [ ] Make authenticated API request
- [ ] Verify 200 response
- [ ] Logout
- [ ] Make API request
- [ ] Verify 401 response

### Step 6: Monitoring (2-4 hours)

Monitor these metrics closely:

#### Application Metrics
- [ ] Authentication success rate (target: >95%)
- [ ] 401 error rate (should be low)
- [ ] Session creation rate
- [ ] Page load times
- [ ] API response times

#### Database Metrics
- [ ] Session table growth
- [ ] Query performance
- [ ] Connection pool usage
- [ ] Lock contention

#### User Metrics
- [ ] Active users
- [ ] Login attempts
- [ ] Registration rate
- [ ] Error reports

## Monitoring Commands

### Check Application Health

```bash
# Health check
curl https://app.huntaze.com/api/health

# Session endpoint
curl https://app.huntaze.com/api/auth/session

# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://app.huntaze.com/dashboard
```

### Check Database

```sql
-- Active sessions
SELECT COUNT(*) FROM sessions WHERE expires_at > NOW();

-- Recent sessions
SELECT COUNT(*) FROM sessions WHERE created_at > NOW() - INTERVAL '1 hour';

-- Users by onboarding status
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN onboarding_completed THEN 1 ELSE 0 END) as completed
FROM users;

-- Recent errors (if you have error logging)
SELECT * FROM error_logs 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 20;
```

### Check Logs

```bash
# Authentication errors
grep -i "auth" production.log | grep -i "error" | tail -20

# 401 errors
grep "401" production.log | tail -20

# Session errors
grep -i "session" production.log | grep -i "error" | tail -20

# Recent errors
tail -100 production.log | grep -i "error"
```

## Success Criteria

Deployment is successful when:

- ✅ All smoke tests pass
- ✅ No critical errors in logs
- ✅ Authentication success rate >95%
- ✅ 401 error rate is low and expected
- ✅ No user reports of issues
- ✅ Performance metrics normal
- ✅ Database metrics normal

## Rollback Procedure

### When to Rollback

Rollback immediately if:
- ❌ Authentication success rate <90%
- ❌ Critical errors in logs
- ❌ Users cannot login
- ❌ Database issues
- ❌ Performance degradation >50%

### How to Rollback

#### Option 1: Platform Rollback (Fastest)

```bash
# AWS Amplify
amplify rollback --environment production

# Vercel
vercel rollback

# Or use your platform's UI
```

#### Option 2: Git Revert

```bash
# Revert the merge commit
git revert -m 1 HEAD
git push origin main

# Or checkout previous tag
git checkout v1.0-pre-nextauth-migration
git push origin main --force
```

#### Option 3: Database Rollback (if needed)

```bash
# Only if database changes were made
psql $PRODUCTION_DATABASE_URL < backup_TIMESTAMP.sql
```

### After Rollback

1. Notify team of rollback
2. Investigate root cause
3. Fix issues in development
4. Re-test in staging
5. Schedule new deployment

## Post-Deployment Tasks

### Immediate (First Hour)
- [ ] Monitor logs continuously
- [ ] Check key metrics every 5 minutes
- [ ] Respond to any alerts
- [ ] Test with real user accounts

### Short-term (First 24 Hours)
- [ ] Monitor error rates
- [ ] Review user feedback
- [ ] Check performance metrics
- [ ] Document any issues

### Medium-term (First Week)
- [ ] Analyze authentication metrics
- [ ] Review session patterns
- [ ] Optimize based on usage
- [ ] Update documentation

### Long-term (First Month)
- [ ] Review overall impact
- [ ] Gather user feedback
- [ ] Plan optimizations
- [ ] Update runbooks

## Communication

### Internal Team Notification

**Before Deployment:**
```
🚀 NextAuth Migration - Production Deployment

Deployment Window: [DATE] [TIME]
Expected Duration: 15 minutes
Expected Downtime: None

What's changing:
- Unified authentication system
- Improved security
- Better session management

Team availability required:
- Development: [NAMES]
- Operations: [NAMES]
- Support: [NAMES]

Rollback plan: Ready
Monitoring: Active

Please be available during deployment window.
```

**After Deployment:**
```
✅ NextAuth Migration - Deployed to Production

Status: Successful
Deployment Time: [TIME]
Issues: None

Monitoring:
- All metrics normal
- No errors detected
- Users logging in successfully

Next steps:
- Continue monitoring for 24 hours
- Report any issues immediately

Thank you for your support!
```

### User Communication (Optional)

**If user-facing changes:**
```
We've upgraded our authentication system!

What's new:
✅ More secure login
✅ Better session management
✅ Smoother navigation

What you need to do:
Nothing! Just log in as usual.

If you experience any issues, please contact support.
```

## Incident Response

### If Issues Occur

1. **Assess Severity**
   - Critical: Rollback immediately
   - High: Fix forward if possible
   - Medium: Monitor and fix
   - Low: Document and fix later

2. **Communicate**
   - Notify team immediately
   - Update status page (if applicable)
   - Prepare user communication

3. **Take Action**
   - Rollback if critical
   - Apply hotfix if possible
   - Monitor closely

4. **Document**
   - Record what happened
   - Document resolution
   - Update runbooks

### Contact Information

- **Development Lead**: [NAME] - [CONTACT]
- **Operations Lead**: [NAME] - [CONTACT]
- **Product Owner**: [NAME] - [CONTACT]
- **On-Call Engineer**: [NAME] - [CONTACT]

## Metrics Dashboard

### Key Metrics to Monitor

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Authentication Success Rate | >95% | <90% |
| 401 Error Rate | <5% | >10% |
| Session Creation Rate | Normal | >2x normal |
| Page Load Time | <2s | >5s |
| API Response Time | <500ms | >2s |
| Database Connections | <80% | >90% |

### Monitoring Tools

- Application logs: [LOCATION]
- Database metrics: [LOCATION]
- Error tracking: [TOOL]
- Performance monitoring: [TOOL]
- User analytics: [TOOL]

## Documentation

### For Reference During Deployment

- [Migration Guide](../../docs/NEXTAUTH_MIGRATION_GUIDE.md)
- [Troubleshooting Guide](../../docs/NEXTAUTH_TROUBLESHOOTING.md)
- [Session Auth API](../../docs/api/SESSION_AUTH.md)
- [Rollback Procedure](../../docs/ROLLBACK_PROCEDURE.md)

### For Post-Deployment

- [Monitoring Guide](../../docs/MONITORING_GUIDE.md)
- [Incident Response](../../docs/INCIDENT_RESPONSE.md)
- [User Support Guide](../../docs/USER_SUPPORT.md)

## Sign-Off

### Pre-Deployment Approval

- [ ] Development Lead: _________________ Date: _______
- [ ] QA Lead: _________________ Date: _______
- [ ] Operations Lead: _________________ Date: _______
- [ ] Product Owner: _________________ Date: _______

### Post-Deployment Verification

- [ ] Smoke tests passed: _________________ Time: _______
- [ ] Monitoring normal: _________________ Time: _______
- [ ] No critical issues: _________________ Time: _______
- [ ] Deployment successful: _________________ Time: _______

---

**Last Updated**: November 16, 2025  
**Version**: 1.0  
**Status**: Ready for Production Deployment
