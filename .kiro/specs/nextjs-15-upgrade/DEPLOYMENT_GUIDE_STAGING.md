# Task 20: Staging Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying Next.js 15 to the staging environment.

**Status**: Ready for deployment  
**Build Status**: ✅ Passing (10.1s)  
**Tests**: ✅ All passing  
**Documentation**: ✅ Complete

---

## Pre-Deployment Checklist

### ✅ Completed
- [x] All code migrations complete
- [x] Build succeeds locally
- [x] Performance optimized
- [x] Documentation complete
- [x] No regressions detected

### Before Deployment
- [ ] Verify git status is clean
- [ ] Ensure all changes are committed
- [ ] Review deployment checklist
- [ ] Notify team of deployment

---

## Task 20.1: Deploy to Staging Environment

### Step 1: Prepare Deployment

```bash
# Check git status
git status

# Ensure on correct branch
git branch

# View recent commits
git log --oneline -5
```

### Step 2: Push to Staging Branch

```bash
# Option A: If staging branch exists
git checkout staging
git merge main
git push origin staging

# Option B: If creating new staging branch
git checkout -b staging
git push -u origin staging
```

### Step 3: Monitor Amplify Build

1. **Access AWS Amplify Console**
   - URL: https://console.aws.amazon.com/amplify/
   - Region: us-east-1 (or your region)

2. **Select Your App**
   - Find "Huntaze" application
   - Click to open

3. **Monitor Build Progress**
   - Go to "Deployments" tab
   - Watch for new build to start
   - Monitor build logs

### Step 4: Verify Build Success

**Expected Build Output**:
```
✓ Compiled successfully in 10.1s
✓ Generating static pages (277/277)
✓ Finalizing page optimization
✓ Build completed successfully
```

**Build Metrics to Check**:
- Build time: ~10-15 seconds
- Static pages: 277
- Errors: 0
- Warnings: Non-critical only

### Step 5: Get Staging URL

Once build completes:
1. Copy staging URL from Amplify console
2. Format: `https://staging.d[app-id].amplifyapp.com`
3. Save URL for testing

---

## Task 20.2: Perform QA on Staging

### Manual Testing Checklist

#### Critical Features
- [ ] **Landing Page** (`/`)
  - Page loads correctly
  - Images display
  - Links work
  - No console errors

- [ ] **Authentication** (`/auth/login`, `/auth/register`)
  - Login form works
  - Register form works
  - Validation works
  - Redirects correctly

- [ ] **Dashboard** (`/dashboard`)
  - Page loads with data
  - Charts render
  - Stats display
  - Navigation works

- [ ] **API Routes**
  - Test key endpoints
  - Verify responses
  - Check error handling

#### Feature Testing
- [ ] **Content Creation**
  - Create new content
  - Edit content
  - Delete content
  - Upload media

- [ ] **Social Integrations**
  - TikTok connection
  - Instagram connection
  - Reddit connection
  - OAuth flows

- [ ] **Analytics**
  - Dashboard loads
  - Charts display
  - Data accurate
  - Filters work

#### UI/UX Testing
- [ ] **Responsive Design**
  - Mobile view (375px)
  - Tablet view (768px)
  - Desktop view (1920px)

- [ ] **Dark Mode**
  - Toggle works
  - All pages support
  - No visual issues

- [ ] **Forms**
  - All inputs work
  - Validation works
  - Submit works
  - Error messages display

#### Performance Testing
- [ ] **Page Load Times**
  - Landing: < 2s
  - Dashboard: < 3s
  - Auth pages: < 1.5s

- [ ] **Console Errors**
  - No errors in console
  - No warnings (or only expected)
  - No network failures

### Automated Testing

```bash
# Run Lighthouse on staging
npx lighthouse https://staging.huntaze.com --view

# Expected scores:
# Performance: > 90
# Accessibility: > 90
# Best Practices: > 90
# SEO: > 90
```

### Test Core Web Vitals

```bash
# Use testing script
node scripts/test-core-web-vitals.js

# Or use Web Vitals extension
# Install: https://chrome.google.com/webstore/detail/web-vitals/
```

---

## Task 20.3: Monitor Staging

### Step 1: Check Error Rates

**Amplify Console**:
1. Go to "Monitoring" tab
2. Check error rates
3. Review logs for issues

**Expected**:
- Error rate: < 0.1%
- 4xx errors: Minimal
- 5xx errors: None

### Step 2: Monitor Performance

**Metrics to Track**:
- Response times: < 500ms p95
- Build success rate: 100%
- Uptime: 100%

**Tools**:
- AWS CloudWatch
- Amplify Monitoring
- Browser DevTools

### Step 3: Gather Feedback

**Team Testing**:
- Share staging URL with team
- Request testing of key features
- Collect feedback
- Document issues

**Issue Template**:
```markdown
## Issue Found

**Page**: [URL]
**Issue**: [Description]
**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected**: [What should happen]
**Actual**: [What actually happens]
**Severity**: [Critical/High/Medium/Low]
```

---

## Success Criteria

### Deployment Success
- ✅ Build completes without errors
- ✅ All 277 pages generated
- ✅ Staging URL accessible
- ✅ No deployment errors

### QA Success
- ✅ All critical features work
- ✅ No console errors
- ✅ Performance acceptable
- ✅ Mobile responsive
- ✅ Dark mode works

### Monitoring Success
- ✅ Error rate < 0.1%
- ✅ Response times < 500ms
- ✅ No critical issues
- ✅ Team feedback positive

---

## Troubleshooting

### Issue: Build Fails

**Symptoms**: Amplify build fails with errors

**Solutions**:
1. Check build logs in Amplify console
2. Verify environment variables are set
3. Ensure dependencies are correct
4. Check for missing files

**Common Causes**:
- Missing environment variables
- Dependency conflicts
- Build timeout
- Memory issues

### Issue: Pages Not Loading

**Symptoms**: 404 errors or blank pages

**Solutions**:
1. Check Amplify routing configuration
2. Verify build output
3. Check for JavaScript errors
4. Review network requests

### Issue: Slow Performance

**Symptoms**: Pages load slowly

**Solutions**:
1. Check bundle sizes
2. Review network waterfall
3. Check for blocking resources
4. Verify CDN configuration

### Issue: Authentication Not Working

**Symptoms**: Login/register fails

**Solutions**:
1. Verify JWT_SECRET is set
2. Check database connection
3. Review API logs
4. Test locally first

---

## Rollback Procedure

If critical issues are found:

### Quick Rollback

1. **Amplify Console**:
   - Go to "Deployments"
   - Find previous successful build
   - Click "Redeploy this version"

2. **Git Rollback**:
```bash
git checkout staging
git reset --hard HEAD~1
git push origin staging --force
```

3. **Verify Rollback**:
   - Check staging URL
   - Verify previous version
   - Test critical features

---

## Post-Deployment Actions

### If Successful
- [ ] Mark Task 20 as complete
- [ ] Document any issues found
- [ ] Update team on status
- [ ] Proceed to Task 21 (Production)

### If Issues Found
- [ ] Document all issues
- [ ] Prioritize by severity
- [ ] Fix critical issues
- [ ] Re-deploy to staging
- [ ] Re-test

---

## Deployment Commands Reference

```bash
# Check current branch
git branch

# Switch to staging
git checkout staging

# Merge from main
git merge main

# Push to staging
git push origin staging

# View deployment logs (if using CLI)
amplify status
amplify publish

# Rollback if needed
git reset --hard HEAD~1
git push origin staging --force
```

---

## Next Steps

After successful staging deployment:

1. ✅ Complete Task 20
2. ⏭️ Move to Task 21: Production Deployment
3. 📝 Document lessons learned
4. 🎉 Celebrate successful staging!

---

**Last Updated**: November 2, 2025  
**Status**: Ready for Deployment  
**Next**: Production Deployment (Task 21)
