# NextAuth Migration - Staging Deployment Checklist

## Pre-Deployment Checklist

### Code Review
- [x] All tasks in implementation plan completed
- [x] Integration tests passing
- [x] Unit tests passing
- [x] No TypeScript errors
- [x] No ESLint errors
- [x] Documentation updated

### Environment Variables
- [ ] `NEXTAUTH_SECRET` set in staging environment
- [ ] `NEXTAUTH_URL` set to staging URL
- [ ] `DATABASE_URL` points to staging database
- [ ] All OAuth credentials configured (if using OAuth)

### Database
- [ ] Database migrations applied
- [ ] `onboarding_completed` column exists in users table
- [ ] Sessions table exists and is accessible
- [ ] Database connection tested

### Build Verification
- [ ] Production build completes without errors
- [ ] No build warnings related to authentication
- [ ] Bundle size is acceptable
- [ ] All pages render correctly in production mode

## Deployment Steps

### 1. Pre-Deployment Tests

```bash
# Run all tests
npm run test

# Run integration tests
npm run test:integration

# Type check
npm run type-check

# Build for production
npm run build
```

### 2. Database Preparation

```bash
# Connect to staging database
psql $STAGING_DATABASE_URL

# Verify schema
\d users
\d sessions

# Check for existing sessions
SELECT COUNT(*) FROM sessions;

# Check users with onboarding status
SELECT 
  COUNT(*) as total_users,
  SUM(CASE WHEN onboarding_completed THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN NOT onboarding_completed THEN 1 ELSE 0 END) as incomplete
FROM users;
```

### 3. Deploy to Staging

```bash
# Commit all changes
git add .
git commit -m "feat: complete NextAuth v5 migration

- Unified authentication across all pages
- Removed legacy localStorage-based auth
- Added comprehensive documentation
- All tests passing

Closes #TICKET_NUMBER"

# Push to staging branch
git push origin staging

# Or deploy via your CI/CD pipeline
# (AWS Amplify, Vercel, etc.)
```

### 4. Post-Deployment Verification

#### A. Health Check

```bash
# Check if app is running
curl https://staging.huntaze.com/api/health

# Check NextAuth endpoint
curl https://staging.huntaze.com/api/auth/session
```

#### B. Manual Testing

- [ ] Visit staging URL: https://staging.huntaze.com
- [ ] Register new test account
- [ ] Verify redirect to onboarding
- [ ] Complete onboarding
- [ ] Verify redirect to dashboard
- [ ] Navigate to analytics page
- [ ] Navigate to OnlyFans page
- [ ] Verify no disconnections
- [ ] Logout
- [ ] Login again
- [ ] Verify redirect based on onboarding status
- [ ] Refresh browser
- [ ] Verify session persists
- [ ] Close and reopen browser
- [ ] Verify session persists (if "Remember Me")

#### C. API Testing

```bash
# Test protected endpoint without auth
curl https://staging.huntaze.com/api/analytics/performance
# Expected: 401 Unauthorized

# Login and get session cookie
curl -X POST https://staging.huntaze.com/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  -c cookies.txt

# Test protected endpoint with auth
curl https://staging.huntaze.com/api/analytics/performance \
  -b cookies.txt
# Expected: 200 OK with data
```

#### D. Run Automated Tests on Staging

```bash
# Set staging URL
export NEXT_PUBLIC_APP_URL=https://staging.huntaze.com

# Run integration tests against staging
npm run test:integration:staging
```

### 5. Monitor Logs

```bash
# Check application logs for errors
# (Method depends on your hosting platform)

# AWS Amplify
amplify console

# Vercel
vercel logs

# Check for authentication errors
grep -i "auth" logs.txt
grep -i "401" logs.txt
grep -i "session" logs.txt
```

### 6. Performance Monitoring

- [ ] Check response times for auth endpoints
- [ ] Monitor database query performance
- [ ] Check session creation/validation times
- [ ] Verify no memory leaks

## Rollback Plan

If critical issues are discovered:

### Immediate Rollback

```bash
# Revert to previous deployment
git revert HEAD
git push origin staging

# Or rollback via hosting platform
amplify rollback
# or
vercel rollback
```

### Partial Rollback

If only specific pages have issues:

1. Revert individual page changes
2. Keep NextAuth for /auth and /onboarding
3. Restore legacy AuthProvider temporarily
4. Fix issues in development
5. Re-deploy when ready

## Success Criteria

Deployment is successful when:

- [x] All automated tests pass
- [ ] Manual testing checklist complete
- [ ] No 401 errors in logs (except for unauthenticated requests)
- [ ] No session-related errors in logs
- [ ] Users can register, login, and navigate without issues
- [ ] Session persists across page refreshes
- [ ] API requests work correctly
- [ ] No performance degradation

## Known Issues

Document any known issues discovered during staging:

### Issue 1: [Title]
- **Description**: 
- **Impact**: 
- **Workaround**: 
- **Fix Status**: 

## Post-Deployment Tasks

After successful staging deployment:

- [ ] Update team on deployment status
- [ ] Document any issues encountered
- [ ] Update production deployment plan
- [ ] Schedule production deployment
- [ ] Prepare user communication (if needed)

## Monitoring Period

Monitor staging for **48 hours** before proceeding to production:

- [ ] Day 1: Active monitoring, manual testing
- [ ] Day 2: Passive monitoring, check logs
- [ ] Day 3: Review metrics, prepare for production

## Sign-Off

- [ ] Developer: _______________
- [ ] QA: _______________
- [ ] Product Owner: _______________

---

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Status**: _______________
