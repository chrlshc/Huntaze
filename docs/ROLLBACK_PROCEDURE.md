# Rollback Procedure

## Overview

This document provides detailed procedures for rolling back deployments in case of critical issues. The rollback strategy is designed to minimize downtime and restore service quickly.

**Recovery Time Objective (RTO):** < 15 minutes
**Recovery Point Objective (RPO):** < 5 minutes

---

## When to Rollback

Rollback should be initiated when:

1. **Critical Bugs:** Application crashes, data corruption, security vulnerabilities
2. **Performance Degradation:** Response times > 5s, error rates > 5%
3. **Data Loss:** User data being deleted or corrupted
4. **Security Breach:** Unauthorized access, credential leaks
5. **Integration Failures:** OAuth providers failing, email service down
6. **Database Issues:** Migration failures, connection pool exhaustion

**Decision Matrix:**

| Severity | Impact | Action | Timeline |
|----------|--------|--------|----------|
| P0 - Critical | Service down, data loss | Immediate rollback | < 5 min |
| P1 - High | Major feature broken, high error rate | Rollback within 15 min | < 15 min |
| P2 - Medium | Minor feature broken, some errors | Fix forward or rollback | < 1 hour |
| P3 - Low | UI issues, non-critical bugs | Fix forward | Next deploy |

---

## Rollback Options

### Option 1: Vercel Instant Rollback (Recommended)

**Best for:** Application code issues, UI bugs, API errors
**Estimated Time:** 2-3 minutes
**Risk Level:** Low

#### Steps:

1. **Identify Previous Stable Deployment**

```bash
# List recent deployments
vercel ls

# Output example:
# huntaze-abc123.vercel.app  main  Ready  2m ago
# huntaze-def456.vercel.app  main  Ready  1h ago  ← Previous stable
# huntaze-ghi789.vercel.app  main  Ready  2h ago
```

2. **Initiate Rollback**

```bash
# Option A: Via CLI
vercel rollback huntaze-def456.vercel.app

# Option B: Via Dashboard
# 1. Go to https://vercel.com/huntaze/deployments
# 2. Find previous stable deployment
# 3. Click "..." menu → "Promote to Production"
```

3. **Verify Rollback**

```bash
# Check current production deployment
vercel inspect --prod

# Test critical endpoints
curl -I https://app.huntaze.com
curl https://app.huntaze.com/api/health

# Expected: Previous deployment URL and 200 OK responses
```

4. **Monitor Post-Rollback**

- Check CloudWatch metrics for error rate decrease
- Verify user sessions still valid
- Test authentication flow
- Check integration connections

**Rollback Time:** ~2-3 minutes

---

### Option 2: Git Revert

**Best for:** Code changes that need to be reverted permanently
**Estimated Time:** 5-10 minutes
**Risk Level:** Low-Medium

#### Steps:

1. **Identify Problematic Commit**

```bash
# View recent commits
git log --oneline -10

# Output example:
# abc1234 (HEAD -> main) Add new feature
# def5678 Fix bug in auth
# ghi9012 Update dependencies
```

2. **Revert Commit**

```bash
# Revert the problematic commit
git revert abc1234

# Or revert multiple commits
git revert abc1234..HEAD

# Push revert
git push origin main
```

3. **Wait for Auto-Deploy**

```bash
# Vercel will automatically deploy the revert
# Monitor deployment status
vercel ls --prod

# Wait for "Ready" status (~2-3 minutes)
```

4. **Verify Revert**

```bash
# Check deployed version
curl https://app.huntaze.com/api/version

# Test critical flows
npm run test:smoke
```

**Rollback Time:** ~5-10 minutes

---

### Option 3: Database Rollback

**Best for:** Database migration failures, schema issues
**Estimated Time:** 10-20 minutes
**Risk Level:** High (Data loss possible)

⚠️ **WARNING:** Database rollbacks can result in data loss. Only use when absolutely necessary.

#### Steps:

1. **Assess Database State**

```bash
# Connect to database
psql $DATABASE_URL

# Check migration status
SELECT * FROM "_prisma_migrations" ORDER BY finished_at DESC LIMIT 5;

# Check for data corruption
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Integration";
SELECT COUNT(*) FROM "UserStats";
```

2. **Create Emergency Backup**

```bash
# Create backup before rollback
pg_dump $DATABASE_URL > emergency-backup-$(date +%Y%m%d-%H%M%S).sql

# Verify backup created
ls -lh emergency-backup-*.sql
```

3. **Option A: Restore from Automated Backup**

**For Vercel Postgres:**
```bash
# Via Vercel Dashboard:
# 1. Go to Storage → Database
# 2. Click "Backups" tab
# 3. Select backup from before deployment
# 4. Click "Restore"
# 5. Confirm restoration
```

**For AWS RDS:**
```bash
# Restore from automated snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier huntaze-db-restored \
  --db-snapshot-identifier huntaze-db-snapshot-YYYYMMDD \
  --region us-east-1

# Wait for restoration (10-15 minutes)
aws rds wait db-instance-available \
  --db-instance-identifier huntaze-db-restored

# Update DATABASE_URL to point to restored instance
```

4. **Option B: Restore from Manual Backup**

```bash
# Drop current database (DANGEROUS!)
dropdb $DATABASE_NAME

# Create new database
createdb $DATABASE_NAME

# Restore from backup
psql $DATABASE_URL < backup-YYYYMMDD-HHMMSS.sql

# Verify restoration
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"User\";"
```

5. **Rollback Prisma Migrations**

```bash
# Mark failed migration as rolled back
npx prisma migrate resolve --rolled-back "MIGRATION_NAME"

# Verify migration status
npx prisma migrate status
```

6. **Verify Database Integrity**

```bash
# Run integrity checks
npm run verify:database

# Test critical queries
psql $DATABASE_URL << EOF
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Integration";
SELECT COUNT(*) FROM "UserStats";
SELECT * FROM "User" LIMIT 1;
EOF
```

**Rollback Time:** ~10-20 minutes

---

### Option 4: Infrastructure Rollback (AWS)

**Best for:** CloudFront, Lambda@Edge, S3 configuration issues
**Estimated Time:** 15-30 minutes
**Risk Level:** Medium

#### CloudFront Rollback

```bash
# Get current distribution config
aws cloudfront get-distribution-config \
  --id $DISTRIBUTION_ID \
  > current-config.json

# Restore previous configuration
aws cloudfront update-distribution \
  --id $DISTRIBUTION_ID \
  --if-match $ETAG \
  --distribution-config file://previous-config.json

# Wait for deployment
aws cloudfront wait distribution-deployed --id $DISTRIBUTION_ID
```

#### Lambda@Edge Rollback

```bash
# List function versions
aws lambda list-versions-by-function \
  --function-name huntaze-security-headers \
  --region us-east-1

# Update CloudFront to use previous version
aws cloudfront update-distribution \
  --id $DISTRIBUTION_ID \
  --if-match $ETAG \
  --distribution-config file://config-with-previous-lambda.json
```

#### S3 Rollback

```bash
# Restore previous version of object
aws s3api list-object-versions \
  --bucket huntaze-beta-assets \
  --prefix "path/to/file"

# Copy previous version to current
aws s3api copy-object \
  --bucket huntaze-beta-assets \
  --copy-source huntaze-beta-assets/path/to/file?versionId=VERSION_ID \
  --key path/to/file
```

**Rollback Time:** ~15-30 minutes

---

## Post-Rollback Checklist

After completing rollback, verify:

### 1. Service Health

- [ ] Application accessible at https://app.huntaze.com
- [ ] Health check endpoint returning 200 OK
- [ ] No 5xx errors in CloudWatch logs
- [ ] Error rate < 1%

### 2. Critical Flows

- [ ] User registration working
- [ ] Email verification sending
- [ ] Login working
- [ ] Session persistence working
- [ ] Home page loading with stats
- [ ] Integrations page accessible
- [ ] OAuth connections working

### 3. Data Integrity

- [ ] User count matches expected
- [ ] No missing integrations
- [ ] Stats displaying correctly
- [ ] No orphaned records

### 4. Performance

- [ ] API response times < 500ms
- [ ] Page load times < 3s
- [ ] Cache hit rate > 70%
- [ ] No memory leaks

### 5. Monitoring

- [ ] CloudWatch alarms in OK state
- [ ] No critical alerts firing
- [ ] Metrics being collected
- [ ] Logs being written

---

## Communication Plan

### Internal Communication

**Immediate (< 5 minutes):**
1. Notify on-call engineer
2. Post in #incidents Slack channel
3. Update status page (if applicable)

**During Rollback (every 5 minutes):**
1. Post progress updates in #incidents
2. Notify stakeholders of ETA
3. Document actions taken

**Post-Rollback (< 30 minutes):**
1. Confirm service restored
2. Post summary in #incidents
3. Schedule post-mortem meeting

### External Communication

**For P0 Incidents (Service Down):**

**Email Template:**
```
Subject: [RESOLVED] Huntaze Service Interruption

Dear Huntaze Beta Users,

We experienced a brief service interruption today from [START_TIME] to [END_TIME] UTC.

What happened:
[Brief description of issue]

What we did:
We rolled back to a previous stable version to restore service quickly.

Current status:
Service is fully restored and operating normally.

Next steps:
We're conducting a thorough investigation and will implement additional safeguards.

We apologize for any inconvenience.

- The Huntaze Team
```

**For P1 Incidents (Major Feature Broken):**

**In-App Banner:**
```
"We recently fixed an issue affecting [FEATURE]. 
If you experienced problems, please try again. 
Contact support if issues persist."
```

---

## Incident Documentation

After rollback, create incident report:

### Incident Report Template

```markdown
# Incident Report: [YYYY-MM-DD] [Brief Description]

## Summary
- **Date:** YYYY-MM-DD
- **Duration:** X minutes
- **Severity:** P0/P1/P2/P3
- **Impact:** X users affected, Y% error rate
- **Root Cause:** [Brief description]

## Timeline
- **HH:MM** - Deployment initiated
- **HH:MM** - Issue detected
- **HH:MM** - Rollback decision made
- **HH:MM** - Rollback initiated
- **HH:MM** - Service restored
- **HH:MM** - Verification complete

## Root Cause Analysis
[Detailed explanation of what went wrong]

## Impact Assessment
- Users affected: X
- Requests failed: Y
- Data loss: None/Minimal/Significant
- Revenue impact: $Z

## Resolution
[What was done to fix the issue]

## Prevention
[What will be done to prevent recurrence]

## Action Items
- [ ] Fix underlying bug
- [ ] Add test coverage
- [ ] Update monitoring
- [ ] Improve deployment process
- [ ] Update documentation

## Lessons Learned
[Key takeaways from the incident]
```

---

## Rollback Testing

Test rollback procedures quarterly:

### Rollback Drill Checklist

- [ ] Schedule drill during low-traffic period
- [ ] Notify team of drill
- [ ] Deploy test change to production
- [ ] Execute rollback procedure
- [ ] Time each step
- [ ] Document any issues
- [ ] Update procedures based on findings
- [ ] Conduct team retrospective

---

## Emergency Contacts

**On-Call Engineer:** [Phone/Slack]
**DevOps Lead:** [Phone/Slack]
**Database Admin:** [Phone/Slack]
**AWS Support:** [Support plan details]
**Vercel Support:** [Support plan details]

---

## Appendix

### A. Rollback Decision Tree

```
Issue Detected
    ↓
Is service down or data being lost?
    ↓ YES → Immediate rollback (Option 1)
    ↓ NO
    ↓
Is error rate > 5%?
    ↓ YES → Rollback within 15 min (Option 1 or 2)
    ↓ NO
    ↓
Is major feature broken?
    ↓ YES → Assess: Fix forward or rollback?
    ↓ NO
    ↓
Minor issue → Fix forward in next deployment
```

### B. Rollback Commands Quick Reference

```bash
# Vercel instant rollback
vercel rollback [deployment-url]

# Git revert
git revert [commit-hash]
git push origin main

# Database backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Database restore
psql $DATABASE_URL < backup-YYYYMMDD-HHMMSS.sql

# CloudFront invalidation
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"

# Check service health
curl -I https://app.huntaze.com
curl https://app.huntaze.com/api/health
```

### C. Rollback Metrics

Track rollback metrics to improve process:

| Metric | Target | Current |
|--------|--------|---------|
| Mean Time to Detect (MTTD) | < 5 min | - |
| Mean Time to Decide (MTTD) | < 2 min | - |
| Mean Time to Rollback (MTTR) | < 10 min | - |
| Mean Time to Verify (MTTV) | < 5 min | - |
| Total Recovery Time | < 15 min | - |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-21 | Kiro | Initial rollback procedure |

