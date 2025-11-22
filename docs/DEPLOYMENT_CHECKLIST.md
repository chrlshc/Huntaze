# Production Deployment Checklist

## Pre-Deployment (1-2 days before)

### Code Quality
- [ ] All unit tests passing (`npm test -- --run`)
- [ ] All integration tests passing (`npm run test:integration -- --run`)
- [ ] All property-based tests passing (19 properties)
- [ ] Code review completed and approved
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Security audit clean (`npm audit --production`)
- [ ] Dependencies up to date (no critical vulnerabilities)

### Testing
- [ ] Smoke tests passing in staging
- [ ] Authentication flow tested (register, verify, login)
- [ ] Onboarding flow tested (all 3 steps)
- [ ] Home page tested (stats, platform status, quick actions)
- [ ] Integrations tested (connect, disconnect, refresh)
- [ ] Email verification tested (SES sending)
- [ ] OAuth flows tested (Instagram, TikTok, Reddit)
- [ ] Mobile responsive design tested (320px, 375px, 768px)
- [ ] Accessibility tested (keyboard navigation, screen reader)
- [ ] Performance tested (Lighthouse audit)

### Environment Variables
- [ ] `DATABASE_URL` set in Vercel
- [ ] `NEXTAUTH_URL` set to production URL
- [ ] `NEXTAUTH_SECRET` set (32+ characters)
- [ ] `ENCRYPTION_KEY` set (32 characters)
- [ ] `AWS_ACCESS_KEY_ID` set
- [ ] `AWS_SECRET_ACCESS_KEY` set
- [ ] `AWS_REGION` set to us-east-1
- [ ] `AWS_S3_BUCKET` set to huntaze-beta-assets
- [ ] `CDN_URL` set to CloudFront URL
- [ ] `INSTAGRAM_CLIENT_ID` and `INSTAGRAM_CLIENT_SECRET` set
- [ ] `TIKTOK_CLIENT_KEY` and `TIKTOK_CLIENT_SECRET` set
- [ ] `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET` set
- [ ] `NEXT_PUBLIC_APP_URL` set to production URL
- [ ] `NODE_ENV` set to production

### AWS Infrastructure
- [ ] S3 bucket created and configured
- [ ] CloudFront distribution deployed
- [ ] Lambda@Edge functions deployed
- [ ] SES domain verified and out of sandbox
- [ ] CloudWatch alarms configured
- [ ] SNS notifications configured
- [ ] IAM permissions verified

### Database
- [ ] Database backup created
- [ ] Migration scripts reviewed
- [ ] Migration tested in staging
- [ ] Database connection pool configured
- [ ] Database indexes verified

### Documentation
- [ ] Deployment runbook reviewed
- [ ] Rollback procedure reviewed
- [ ] Emergency contacts updated
- [ ] Monitoring dashboards configured

---

## Deployment Day

### Phase 1: Infrastructure (30-45 min)

#### S3 Deployment
- [ ] Deploy S3 bucket stack
- [ ] Verify bucket created
- [ ] Upload static assets
- [ ] Verify assets accessible
- [ ] Test asset versioning

#### Lambda@Edge Deployment
- [ ] Deploy security headers function
- [ ] Deploy image optimization function
- [ ] Verify functions in us-east-1
- [ ] Test function execution

#### CloudFront Deployment
- [ ] Deploy CloudFront distribution
- [ ] Wait for distribution deployment (15-20 min)
- [ ] Verify cache behaviors
- [ ] Test compression enabled
- [ ] Verify SSL certificate

#### CloudWatch Setup
- [ ] Run CloudWatch setup script
- [ ] Verify alarms created
- [ ] Test alert notifications
- [ ] Verify dashboard created

### Phase 2: Application (10-15 min)

#### Vercel Deployment
- [ ] Set all environment variables
- [ ] Deploy to production (`vercel --prod`)
- [ ] Wait for deployment completion
- [ ] Verify deployment URL
- [ ] Check build logs for errors

### Phase 3: Database (5-10 min)

#### Migration
- [ ] Create pre-migration backup
- [ ] Run migrations (`npx prisma migrate deploy`)
- [ ] Verify schema updated
- [ ] Check migration logs
- [ ] Verify data integrity

### Phase 4: Verification (15-20 min)

#### Smoke Tests
- [ ] Test registration endpoint
- [ ] Test login endpoint
- [ ] Test home page
- [ ] Test integrations page
- [ ] Test OAuth callback
- [ ] Test email sending
- [ ] Test CSRF protection

#### Performance Tests
- [ ] Run Lighthouse audit
- [ ] Verify FCP < 1.5s
- [ ] Verify LCP < 2.5s
- [ ] Verify FID < 100ms
- [ ] Verify CLS < 0.1
- [ ] Check API response times < 500ms
- [ ] Verify cache hit rate > 70%

#### Security Tests
- [ ] Verify HTTPS enabled
- [ ] Check security headers
- [ ] Test CSRF protection
- [ ] Verify password hashing
- [ ] Test credential encryption
- [ ] Check rate limiting

#### Monitoring
- [ ] Verify CloudWatch metrics collecting
- [ ] Check all alarms in OK state
- [ ] Verify logs being written
- [ ] Test alert notifications
- [ ] Check Vercel analytics

---

## Post-Deployment (First Hour)

### Immediate Checks (Every 5 minutes)
- [ ] Monitor error rate (should be < 1%)
- [ ] Monitor API latency (should be < 500ms)
- [ ] Check CloudWatch alarms
- [ ] Review error logs
- [ ] Monitor user registrations

### First Hour Tasks
- [ ] Warm cache for common endpoints
- [ ] Test with real user accounts
- [ ] Monitor email delivery
- [ ] Check OAuth connections
- [ ] Verify stats updating
- [ ] Monitor database connections
- [ ] Check cache hit rates

---

## Post-Deployment (First Day)

### Hourly Checks
- [ ] Review CloudWatch metrics
- [ ] Check error logs
- [ ] Monitor performance trends
- [ ] Verify email delivery
- [ ] Check user feedback
- [ ] Monitor database growth

### End of Day
- [ ] Review all metrics
- [ ] Document any issues
- [ ] Update runbook if needed
- [ ] Send status update to team
- [ ] Plan next day monitoring

---

## Post-Deployment (First Week)

### Daily Tasks
- [ ] Review CloudWatch dashboard
- [ ] Analyze error patterns
- [ ] Monitor performance trends
- [ ] Check database growth
- [ ] Review user feedback
- [ ] Optimize slow queries
- [ ] Update documentation

### End of Week
- [ ] Conduct performance review
- [ ] Analyze cost metrics
- [ ] Review security logs
- [ ] Document lessons learned
- [ ] Plan improvements

---

## Rollback Triggers

Initiate rollback if:

- [ ] Error rate > 5%
- [ ] API latency > 5s
- [ ] Service completely down
- [ ] Data corruption detected
- [ ] Security breach detected
- [ ] Database migration failed
- [ ] Critical feature broken
- [ ] Email service failing

---

## Emergency Procedures

### If Deployment Fails

1. **Stop deployment immediately**
2. **Assess impact** (users affected, data loss)
3. **Decide:** Fix forward or rollback?
4. **Execute rollback** if needed (see ROLLBACK_PROCEDURE.md)
5. **Notify stakeholders**
6. **Document incident**

### If Service Degrades

1. **Check CloudWatch alarms**
2. **Review error logs**
3. **Identify root cause**
4. **Decide:** Can we fix quickly?
5. **If no:** Initiate rollback
6. **If yes:** Deploy hotfix
7. **Monitor closely**

---

## Communication Plan

### Internal

**Before Deployment:**
- [ ] Notify team in #deployments channel
- [ ] Post deployment window
- [ ] Share deployment checklist

**During Deployment:**
- [ ] Post progress updates every 15 minutes
- [ ] Notify of any issues immediately
- [ ] Share verification results

**After Deployment:**
- [ ] Post completion message
- [ ] Share metrics summary
- [ ] Document any issues

### External

**For Beta Users:**
- [ ] Send "We're live!" email (if first deployment)
- [ ] Post in community/Discord (if applicable)
- [ ] Update status page

**If Issues Occur:**
- [ ] Update status page immediately
- [ ] Send email if service down > 15 minutes
- [ ] Post resolution update

---

## Success Criteria

Deployment is successful when:

- [ ] All smoke tests passing
- [ ] Error rate < 1%
- [ ] API latency < 500ms
- [ ] Core Web Vitals meeting targets
- [ ] All CloudWatch alarms in OK state
- [ ] No critical errors in logs
- [ ] User registrations working
- [ ] Email verification working
- [ ] OAuth connections working
- [ ] Cache hit rate > 70%
- [ ] No data loss or corruption

---

## Contacts

**On-Call Engineer:** [Contact]
**DevOps Lead:** [Contact]
**Product Manager:** [Contact]
**AWS Support:** [Support plan]
**Vercel Support:** [Support plan]

---

## Notes

Use this space to document deployment-specific notes:

**Deployment Date:** _______________
**Deployment By:** _______________
**Start Time:** _______________
**End Time:** _______________
**Issues Encountered:** 
_______________________________________________
_______________________________________________

**Lessons Learned:**
_______________________________________________
_______________________________________________

**Action Items:**
- [ ] _______________________________________________
- [ ] _______________________________________________
- [ ] _______________________________________________

