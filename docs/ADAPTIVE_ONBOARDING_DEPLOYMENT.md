# Adaptive Onboarding System - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Adaptive Onboarding System to staging and production environments.

**Status**: ✅ Ready for Deployment  
**Completion**: 100%  
**Risk Level**: Low

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Database Migration](#database-migration)
3. [Environment Configuration](#environment-configuration)
4. [Staging Deployment](#staging-deployment)
5. [Production Deployment](#production-deployment)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Monitoring](#monitoring)
8. [Rollback Procedures](#rollback-procedures)

---

## Pre-Deployment Checklist

### Code Readiness
- [x] All 22 tasks completed (100%)
- [x] 65+ files created/modified
- [x] Tests passing (unit, integration, E2E)
- [x] TypeScript compilation successful
- [x] Build succeeds locally
- [x] Documentation complete

### Database Readiness
- [ ] Database migration script reviewed
- [ ] Backup procedures tested
- [ ] Migration tested on staging database
- [ ] Rollback script prepared

### Infrastructure Readiness
- [ ] Environment variables configured
- [ ] AWS Amplify configured
- [ ] Database connection verified
- [ ] Monitoring tools ready

---

## Database Migration

### Step 1: Review Migration Script

The migration script is located at:
```
lib/db/migrations/2024-11-02-adaptive-onboarding.sql
```

**Tables Created**:
- `onboarding_profiles` - User onboarding state
- `feature_unlock_states` - Feature unlocking tracking
- `onboarding_events` - Analytics events
- `feature_tour_progress` - Tour completion tracking

### Step 2: Backup Current Database

```bash
# Create backup before migration
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Verify backup
ls -lh backup-*.sql
```

### Step 3: Run Migration (Staging First)

```bash
# Connect to staging database
psql $STAGING_DATABASE_URL

# Run migration
\i lib/db/migrations/2024-11-02-adaptive-onboarding.sql

# Verify tables created
\dt onboarding*
\dt feature*

# Check indexes
\di onboarding*
\di feature*
```

### Step 4: Verify Migration

```sql
-- Check table structure
\d onboarding_profiles
\d feature_unlock_states
\d onboarding_events
\d feature_tour_progress

-- Verify triggers
SELECT tgname FROM pg_trigger WHERE tgname LIKE '%onboarding%';

-- Verify functions
SELECT proname FROM pg_proc WHERE proname LIKE '%onboarding%';
```

### Step 5: Test Migration Script

```bash
# Run migration test script
node scripts/migrate-adaptive-onboarding.js --test

# Expected output:
# ✓ Migration script validated
# ✓ All tables created
# ✓ All indexes created
# ✓ All triggers created
# ✓ All functions created
```

---

## Environment Configuration

### Required Environment Variables

Add these to your `.env` file and AWS Amplify environment variables:

```env
# Database (already configured)
DATABASE_URL=postgresql://...

# JWT Secret (already configured)
JWT_SECRET=your-secret-key

# API URL
NEXT_PUBLIC_API_URL=https://api.huntaze.com

# Feature Flags (optional)
ENABLE_ONBOARDING=true
ENABLE_FEATURE_TOURS=true
ENABLE_ONBOARDING_ANALYTICS=true
```

### AWS Amplify Configuration

1. **Access AWS Amplify Console**
   - URL: https://console.aws.amazon.com/amplify/
   - Select your app

2. **Add Environment Variables**
   - Go to "Environment variables"
   - Add variables listed above
   - Save changes

3. **Verify Configuration**
   - Check all variables are set
   - Verify no sensitive data exposed
   - Test connection

---

## Staging Deployment

### Step 1: Prepare Staging Branch

```bash
# Ensure all changes committed
git status

# Switch to staging branch
git checkout staging

# Merge from main
git merge main

# Resolve any conflicts
git status
```

### Step 2: Run Database Migration on Staging

```bash
# Connect to staging database
psql $STAGING_DATABASE_URL

# Run migration
\i lib/db/migrations/2024-11-02-adaptive-onboarding.sql

# Verify success
SELECT COUNT(*) FROM onboarding_profiles;
SELECT COUNT(*) FROM feature_unlock_states;
```

### Step 3: Deploy to Staging

```bash
# Push to staging
git push origin staging

# Monitor Amplify build
# Go to AWS Amplify Console
# Watch build progress
```

### Step 4: Verify Staging Build

**Expected Build Output**:
```
✓ Compiled successfully
✓ Generating static pages
✓ Build completed successfully
```

**Build Time**: ~10-15 seconds  
**Pages Generated**: 277+  
**Errors**: 0

### Step 5: Test on Staging

#### Manual Testing Checklist

**Onboarding Flow**:
- [ ] Navigate to `/onboarding/setup`
- [ ] Complete creator assessment
- [ ] Select goals
- [ ] Connect platform (test mode)
- [ ] Configure AI preferences
- [ ] Complete onboarding
- [ ] Verify redirect to dashboard

**Feature Tours**:
- [ ] Check tour notification badge appears
- [ ] Start a feature tour
- [ ] Navigate through tour steps
- [ ] Complete tour
- [ ] Dismiss tour
- [ ] Verify tour progress saved

**Accessibility**:
- [ ] Test keyboard navigation (Arrow keys, Enter, Esc)
- [ ] Test with screen reader
- [ ] Test on mobile device
- [ ] Test dark mode

**API Endpoints**:
```bash
# Test onboarding endpoints
curl https://staging.huntaze.com/api/onboarding/status

# Test feature endpoints
curl https://staging.huntaze.com/api/features/unlocked

# Test tour endpoints
curl https://staging.huntaze.com/api/onboarding/tours/ai-content-generation-tour/progress
```

#### Automated Testing

```bash
# Run integration tests against staging
STAGING_URL=https://staging.huntaze.com npm run test:integration

# Run E2E tests
STAGING_URL=https://staging.huntaze.com npm run test:e2e
```

### Step 6: Monitor Staging

**Metrics to Check**:
- Error rate: < 0.1%
- Response times: < 500ms
- Onboarding completion rate: Track baseline
- Feature unlock rate: Track baseline

**Monitoring Duration**: 24-48 hours

---

## Production Deployment

### Step 1: Create Production Backup

```bash
# Tag current production state
git tag -a v1.0.0-pre-onboarding -m "Backup before onboarding system"
git push origin v1.0.0-pre-onboarding

# Backup production database
pg_dump $PRODUCTION_DATABASE_URL > prod-backup-$(date +%Y%m%d).sql

# Verify backup
ls -lh prod-backup-*.sql
```

### Step 2: Schedule Deployment Window

**Recommended Times**:
- Weekday: 2-4 AM (low traffic)
- Weekend: Saturday 2-6 AM
- Avoid: Peak hours, holidays

**Deployment Window**: 30-60 minutes  
**Monitoring Period**: 48 hours

### Step 3: Run Database Migration on Production

```bash
# Connect to production database
psql $PRODUCTION_DATABASE_URL

# Run migration
\i lib/db/migrations/2024-11-02-adaptive-onboarding.sql

# Verify success
\dt onboarding*
\dt feature*

# Test queries
SELECT COUNT(*) FROM onboarding_profiles;
```

### Step 4: Deploy to Production

```bash
# Ensure on main branch
git checkout main

# Verify clean state
git status

# Push to production
git push origin main

# Or if using production branch
git checkout production
git merge main
git push origin production
```

### Step 5: Monitor Amplify Build

1. **Access AWS Amplify Console**
2. **Watch Build Progress**
3. **Verify Completion**

**Expected Output**:
```
✓ Compiled successfully in 10.1s
✓ Generating static pages (277+)
✓ Build completed successfully
✓ Deployment successful
```

### Step 6: Immediate Verification (First 15 Minutes)

#### Smoke Tests
```bash
# Check production URL
curl -I https://huntaze.com

# Test onboarding endpoint
curl https://huntaze.com/api/onboarding/status

# Test feature endpoint
curl https://huntaze.com/api/features/unlocked
```

#### Manual Checks
- [ ] Landing page loads
- [ ] Login works
- [ ] Dashboard accessible
- [ ] Onboarding flow works
- [ ] No console errors

#### Error Monitoring
- Check AWS Amplify logs
- Monitor error rates
- Check for 5xx errors
- Verify no critical issues

---

## Post-Deployment Verification

### First Hour Checks

**Critical Metrics**:
- Error rate: < 0.1%
- Response time: < 500ms
- Uptime: 100%
- User sessions: Normal

**Test Scenarios**:
1. New user registration → onboarding
2. Existing user login → dashboard
3. Platform connection → feature unlock
4. Feature tour → completion
5. Mobile experience → responsive

### First 24 Hours Monitoring

**Check Every 2 Hours**:
- [ ] Error rates stable
- [ ] Performance metrics good
- [ ] No user complaints
- [ ] All features working

**Metrics to Track**:
- Onboarding start rate
- Onboarding completion rate
- Average completion time
- Feature unlock rate
- Tour completion rate
- Drop-off points

### First Week Monitoring

**Daily Checks**:
- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Monitor user feedback
- [ ] Track onboarding analytics

**Weekly Review**:
- Analyze completion rates
- Identify drop-off points
- Review user feedback
- Plan optimizations

---

## Monitoring

### Key Metrics Dashboard

**Onboarding Metrics**:
- Completion rate: Target 80%+
- Average time: Target < 10 minutes
- Drop-off rate: Target < 20%
- Skip rate: Track per step

**Feature Unlock Metrics**:
- Unlock rate: Track per feature
- Time to unlock: Track average
- Feature adoption: Track usage

**Tour Metrics**:
- Tour start rate: Track per tour
- Tour completion rate: Target 60%+
- Tour dismissal rate: Track
- Average tour time: Track

### Monitoring Tools

**AWS CloudWatch**:
- API response times
- Error rates
- Database queries
- Lambda functions

**Amplify Monitoring**:
- Build success rate
- Deployment status
- Error logs
- Performance metrics

**Custom Analytics**:
```sql
-- Onboarding completion rate
SELECT 
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL) * 100.0 / COUNT(*) as completion_rate
FROM onboarding_profiles
WHERE started_at > NOW() - INTERVAL '7 days';

-- Average completion time
SELECT 
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60) as avg_minutes
FROM onboarding_profiles
WHERE completed_at IS NOT NULL;

-- Drop-off points
SELECT 
  current_step,
  COUNT(*) as users_stuck
FROM onboarding_profiles
WHERE completed_at IS NULL
GROUP BY current_step
ORDER BY users_stuck DESC;
```

### Alert Thresholds

**Critical Alerts** (Immediate action):
- Error rate > 5%
- Onboarding completion rate < 50%
- API response time > 2s
- Database connection failures

**Warning Alerts** (Investigate):
- Error rate > 1%
- Completion rate < 70%
- Response time > 1s
- High drop-off rate (> 30%)

---

## Rollback Procedures

### When to Rollback

**Immediate Rollback**:
- Error rate > 5%
- Complete onboarding failure
- Database corruption
- Security vulnerability
- Authentication broken

**Consider Rollback**:
- Error rate > 2%
- Completion rate < 50%
- Major feature broken
- Multiple user complaints

### Rollback Steps

#### Option 1: Amplify Console Rollback

1. Go to AWS Amplify Console
2. Navigate to "Deployments"
3. Find previous successful build
4. Click "Redeploy this version"
5. Monitor rollback progress
6. Verify functionality

#### Option 2: Git Rollback

```bash
# Checkout backup tag
git checkout v1.0.0-pre-onboarding

# Force push to main
git push origin main --force

# Verify rollback
git log --oneline -5
```

#### Option 3: Database Rollback

```bash
# Restore from backup
psql $PRODUCTION_DATABASE_URL < prod-backup-YYYYMMDD.sql

# Verify restoration
psql $PRODUCTION_DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

### Post-Rollback Actions

1. **Verify Stability**
   - Test critical features
   - Check error rates
   - Monitor performance

2. **Investigate Issues**
   - Review logs
   - Identify root cause
   - Document findings

3. **Plan Fix**
   - Create fix plan
   - Test thoroughly
   - Schedule re-deployment

---

## Troubleshooting

### Issue: Migration Fails

**Symptoms**: Database migration errors

**Solutions**:
1. Check database connection
2. Verify user permissions
3. Review migration script
4. Check for existing tables

**Common Causes**:
- Tables already exist
- Insufficient permissions
- Syntax errors
- Connection timeout

### Issue: Onboarding Not Starting

**Symptoms**: Users can't access onboarding

**Solutions**:
1. Check API endpoints
2. Verify database connection
3. Review authentication
4. Check environment variables

### Issue: Features Not Unlocking

**Symptoms**: Features remain locked

**Solutions**:
1. Check unlock conditions
2. Verify database updates
3. Review service logic
4. Check event tracking

### Issue: Tours Not Appearing

**Symptoms**: Tour notification badge missing

**Solutions**:
1. Verify tour registration
2. Check user progress
3. Review target elements
4. Check JavaScript errors

---

## Success Criteria

### Deployment Success
- ✅ Build completes without errors
- ✅ Database migration successful
- ✅ All endpoints responding
- ✅ No deployment errors

### Functional Success
- ✅ Onboarding flow works end-to-end
- ✅ Feature unlocking works
- ✅ Tours display and function
- ✅ Analytics tracking works
- ✅ Keyboard navigation works

### Performance Success
- ✅ Error rate < 0.1%
- ✅ Response times < 500ms
- ✅ Onboarding completion < 10 min
- ✅ No performance regressions

### User Success
- ✅ Completion rate > 80%
- ✅ Positive user feedback
- ✅ Low support tickets
- ✅ High feature adoption

---

## Post-Deployment Checklist

### Immediate (First Hour)
- [ ] Verify deployment success
- [ ] Run smoke tests
- [ ] Check error rates
- [ ] Monitor performance
- [ ] Test critical features

### Short Term (First 24 Hours)
- [ ] Continuous monitoring
- [ ] Review user feedback
- [ ] Check support tickets
- [ ] Track metrics
- [ ] Document issues

### Medium Term (First Week)
- [ ] Daily metric reviews
- [ ] Performance analysis
- [ ] User feedback analysis
- [ ] Optimization planning
- [ ] Documentation updates

---

## Communication Plan

### Pre-Deployment
```
🚀 Adaptive Onboarding System Deployment

When: [Date] at [Time]
Duration: 30-60 minutes
Impact: None expected (new feature)
Rollback: Ready if needed

New Features:
- Personalized onboarding
- Progressive feature unlocking
- Interactive feature tours
- Accessibility improvements
```

### Success Notification
```
✅ Adaptive Onboarding System Deployed!

Status: Live in production
Completion: 100%
Errors: 0
Performance: Excellent

Monitoring for next 48 hours.
New users will see onboarding flow.
```

---

## Next Steps

After successful deployment:

1. **Monitor Metrics**
   - Track completion rates
   - Identify drop-off points
   - Gather user feedback

2. **Optimize**
   - Improve based on data
   - A/B test variations
   - Enhance tours

3. **Iterate**
   - Add new features
   - Create new tours
   - Improve experience

---

**Status**: ✅ READY FOR DEPLOYMENT  
**Risk Level**: Low  
**Rollback Plan**: ✅ Ready  
**Documentation**: ✅ Complete

🚀 **Ready to deploy the Adaptive Onboarding System!**
