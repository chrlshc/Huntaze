# Deployment Guide: Onboarding Completed Migration

This guide provides step-by-step instructions for deploying the `onboarding_completed` column migration to staging and production environments.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Staging Deployment](#staging-deployment)
3. [Production Deployment](#production-deployment)
4. [Rollback Procedures](#rollback-procedures)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

Before deploying to any environment, ensure:

- [ ] Database backup has been created
- [ ] You have database admin credentials
- [ ] Application code is ready to deploy (tasks 1-7 completed)
- [ ] You've reviewed the migration scripts
- [ ] You've estimated the migration duration based on user count
- [ ] Maintenance window has been scheduled (if needed for production)
- [ ] Rollback plan is understood and tested

### Estimating Migration Duration

| User Count | Estimated Duration | Recommended Script |
|------------|-------------------|-------------------|
| < 10,000 | < 30 seconds | Standard |
| 10,000 - 100,000 | 1-5 minutes | Standard |
| 100,000 - 1,000,000 | 5-15 minutes | Batch |
| > 1,000,000 | 15-60 minutes | Batch |

---

## Staging Deployment

### Step 1: Create Database Backup

```bash
# PostgreSQL backup
pg_dump -h staging-db-host -U db-user -d huntaze_staging > backup_staging_$(date +%Y%m%d_%H%M%S).sql

# Or use your cloud provider's backup tool
# AWS RDS: Create manual snapshot
# Azure: Create database backup
```

### Step 2: Connect to Staging Database

```bash
# PostgreSQL
psql -h staging-db-host -U db-user -d huntaze_staging

# Or use your preferred database client (pgAdmin, DBeaver, etc.)
```

### Step 3: Check Current State

```sql
-- Check if column already exists
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'onboarding_completed';

-- Check user count
SELECT COUNT(*) as total_users FROM users;

-- Check table size
SELECT pg_size_pretty(pg_total_relation_size('users')) as table_size;
```

### Step 4: Run Migration

**For small/medium databases:**

```bash
# From your local machine
psql -h staging-db-host -U db-user -d huntaze_staging -f migrations/001_add_onboarding_completed.sql
```

**For large databases:**

```bash
# From your local machine
psql -h staging-db-host -U db-user -d huntaze_staging -f migrations/001_add_onboarding_completed_batch.sql
```

### Step 5: Verify Migration

```sql
-- Verify column exists
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'onboarding_completed';

-- Verify data distribution
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN onboarding_completed = true THEN 1 END) as completed_users,
  COUNT(CASE WHEN onboarding_completed = false THEN 1 END) as incomplete_users,
  COUNT(CASE WHEN onboarding_completed IS NULL THEN 1 END) as null_users
FROM users;

-- Expected result: All existing users should have onboarding_completed = true

-- Verify index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users' AND indexname = 'idx_users_onboarding_completed';
```

### Step 6: Deploy Application Code

```bash
# Deploy the updated application code to staging
# This includes the NextAuth configuration, auth page, and onboarding page updates

# Example for AWS Amplify
git push origin staging

# Example for manual deployment
npm run build
# Deploy build artifacts to staging environment
```

### Step 7: Test Staging Environment

1. **Test New User Registration**:
   - Register a new user
   - Verify redirect to `/onboarding`
   - Complete onboarding
   - Verify redirect to `/dashboard`
   - Check database: `SELECT onboarding_completed FROM users WHERE email = 'test@example.com';`
   - Expected: `onboarding_completed = true`

2. **Test Existing User Login**:
   - Login with an existing user account
   - Verify direct redirect to `/dashboard` (no onboarding)

3. **Test Incomplete Onboarding**:
   - Manually set a user to `onboarding_completed = false`
   - Login with that user
   - Verify redirect to `/onboarding`

### Step 8: Monitor Staging

Monitor staging for 24-48 hours before proceeding to production:

- Check application logs for errors
- Monitor database performance
- Verify user flows are working correctly
- Check for any unexpected behavior

---

## Production Deployment

### Pre-Production Checklist

- [ ] Staging deployment successful and stable for 24+ hours
- [ ] All tests passing in staging
- [ ] Database backup created
- [ ] Maintenance window scheduled (if needed)
- [ ] Team notified of deployment
- [ ] Rollback plan reviewed
- [ ] Monitoring alerts configured

### Step 1: Schedule Maintenance Window (Optional)

For large databases (100k+ users), consider scheduling a brief maintenance window:

```
Recommended window: 15-30 minutes during low-traffic hours
```

**Note**: The migration can run without downtime using `CREATE INDEX CONCURRENTLY`, but a maintenance window provides extra safety.

### Step 2: Create Production Backup

```bash
# PostgreSQL backup
pg_dump -h prod-db-host -U db-user -d huntaze_production > backup_production_$(date +%Y%m%d_%H%M%S).sql

# Or use your cloud provider's backup tool
# AWS RDS: Create manual snapshot before migration
# Azure: Create database backup
```

**CRITICAL**: Verify the backup was created successfully before proceeding.

### Step 3: Connect to Production Database

```bash
# PostgreSQL
psql -h prod-db-host -U db-user -d huntaze_production

# Use read-only connection first to verify state
```

### Step 4: Pre-Migration Verification

```sql
-- Check current state
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'onboarding_completed';

-- Check user count
SELECT COUNT(*) as total_users FROM users;

-- Check for any active long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND query NOT LIKE '%pg_stat_activity%'
ORDER BY duration DESC;

-- Check table locks
SELECT * FROM pg_locks WHERE relation = 'users'::regclass;
```

### Step 5: Run Production Migration

**For small/medium databases:**

```bash
# Run migration
psql -h prod-db-host -U db-user -d huntaze_production -f migrations/001_add_onboarding_completed.sql

# Monitor progress
# The migration should complete in under 5 minutes for most databases
```

**For large databases:**

```bash
# Run batch migration
psql -h prod-db-host -U db-user -d huntaze_production -f migrations/001_add_onboarding_completed_batch.sql

# Monitor progress in real-time
# The script will output progress updates
```

### Step 6: Verify Production Migration

```sql
-- Verify column exists
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'onboarding_completed';

-- Verify data distribution
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN onboarding_completed = true THEN 1 END) as completed_users,
  COUNT(CASE WHEN onboarding_completed = false THEN 1 END) as incomplete_users,
  COUNT(CASE WHEN onboarding_completed IS NULL THEN 1 END) as null_users
FROM users;

-- Verify index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users' AND indexname = 'idx_users_onboarding_completed';

-- Check index is being used
EXPLAIN ANALYZE
SELECT * FROM users WHERE onboarding_completed = false LIMIT 10;
-- Should show "Index Scan using idx_users_onboarding_completed"
```

### Step 7: Deploy Application Code to Production

```bash
# Deploy the updated application code to production
# Ensure zero-downtime deployment strategy

# Example for AWS Amplify
git push origin main

# Example for manual deployment
npm run build
# Deploy build artifacts to production environment
```

### Step 8: Post-Deployment Monitoring

Monitor production closely for the first 24 hours:

1. **Application Metrics**:
   - Error rates
   - Response times
   - User registration success rate
   - Login success rate

2. **Database Metrics**:
   - Query performance
   - Connection pool usage
   - Index usage statistics

3. **User Flows**:
   - New user registrations → onboarding → dashboard
   - Existing user logins → dashboard
   - Onboarding completion rate

### Step 9: Verify Production User Flows

1. **Create Test Account**:
   ```bash
   # Register a new test user in production
   # Verify onboarding flow works correctly
   ```

2. **Check Database**:
   ```sql
   -- Verify new users have onboarding_completed = false
   SELECT id, email, onboarding_completed, created_at
   FROM users
   WHERE created_at > NOW() - INTERVAL '1 hour'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

3. **Monitor Logs**:
   ```bash
   # Check application logs for errors
   # Look for any onboarding-related issues
   ```

---

## Rollback Procedures

### When to Rollback

Consider rollback if:

- Migration fails or times out
- Application errors increase significantly
- User flows are broken
- Database performance degrades
- Critical bugs are discovered

### Staging Rollback

```sql
-- Connect to staging database
psql -h staging-db-host -U db-user -d huntaze_staging

-- Run rollback
DROP INDEX IF EXISTS idx_users_onboarding_completed;
ALTER TABLE users DROP COLUMN IF EXISTS onboarding_completed;

-- Verify rollback
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'onboarding_completed';
-- Should return 0 rows
```

```bash
# Rollback application code
git revert <commit-hash>
git push origin staging
```

### Production Rollback

**CRITICAL**: Only rollback production if absolutely necessary.

```sql
-- Connect to production database
psql -h prod-db-host -U db-user -d huntaze_production

-- Create backup before rollback
pg_dump -h prod-db-host -U db-user -d huntaze_production > backup_before_rollback_$(date +%Y%m%d_%H%M%S).sql

-- Run rollback
DROP INDEX IF EXISTS idx_users_onboarding_completed;
ALTER TABLE users DROP COLUMN IF EXISTS onboarding_completed;

-- Verify rollback
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'onboarding_completed';
-- Should return 0 rows
```

```bash
# Rollback application code
git revert <commit-hash>
git push origin main

# Or redeploy previous version
git checkout <previous-commit>
# Deploy to production
```

### Post-Rollback Actions

1. Investigate root cause of failure
2. Fix issues in development environment
3. Re-test in staging
4. Plan new deployment with fixes

---

## Post-Deployment Verification

### Day 1 Checklist

- [ ] No increase in error rates
- [ ] New user registrations working
- [ ] Existing user logins working
- [ ] Onboarding flow completing successfully
- [ ] Database performance stable
- [ ] No user complaints

### Week 1 Checklist

- [ ] Monitor onboarding completion rates
- [ ] Check for any edge cases or bugs
- [ ] Verify data integrity
- [ ] Review application logs
- [ ] Gather user feedback

### Verification Queries

```sql
-- Check onboarding completion rate for new users
SELECT 
  DATE(created_at) as date,
  COUNT(*) as new_users,
  COUNT(CASE WHEN onboarding_completed = true THEN 1 END) as completed,
  ROUND(100.0 * COUNT(CASE WHEN onboarding_completed = true THEN 1 END) / COUNT(*), 2) as completion_rate
FROM users
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Check for any users stuck in onboarding
SELECT id, email, created_at, onboarding_completed
FROM users
WHERE onboarding_completed = false
  AND created_at < NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Monitor index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE indexname = 'idx_users_onboarding_completed';
```

---

## Troubleshooting

### Issue: Migration Times Out

**Symptoms**: Migration runs for more than expected duration

**Solution**:
1. Cancel the migration (Ctrl+C)
2. Check for blocking queries: `SELECT * FROM pg_stat_activity WHERE state = 'active';`
3. Use the batch migration script instead
4. Consider running during low-traffic hours

### Issue: Index Creation Fails

**Symptoms**: `CREATE INDEX CONCURRENTLY` fails

**Solution**:
```sql
-- Drop the invalid index
DROP INDEX IF EXISTS idx_users_onboarding_completed;

-- Recreate without CONCURRENTLY (requires brief table lock)
CREATE INDEX idx_users_onboarding_completed ON users(onboarding_completed);
```

### Issue: Column Already Exists

**Symptoms**: Error "column already exists"

**Solution**: This is safe to ignore. The migration uses `IF NOT EXISTS` to handle this case. Verify the column is correct:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'onboarding_completed';
```

### Issue: Users Not Redirecting Correctly

**Symptoms**: Users not being redirected to onboarding or dashboard

**Solution**:
1. Check application logs for errors
2. Verify NextAuth session includes `onboardingCompleted`:
   ```javascript
   console.log(session.user.onboardingCompleted);
   ```
3. Clear browser cache and cookies
4. Verify database has correct values:
   ```sql
   SELECT id, email, onboarding_completed FROM users WHERE email = 'user@example.com';
   ```

### Issue: Performance Degradation

**Symptoms**: Slow queries after migration

**Solution**:
1. Verify index is being used:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM users WHERE onboarding_completed = false;
   ```
2. Update table statistics:
   ```sql
   ANALYZE users;
   ```
3. Check for table bloat:
   ```sql
   SELECT pg_size_pretty(pg_total_relation_size('users'));
   ```

### Issue: Rollback Needed

**Symptoms**: Critical issues requiring immediate rollback

**Solution**: Follow the [Rollback Procedures](#rollback-procedures) section above.

---

## Support and Escalation

### Contact Information

- **Database Issues**: DBA team
- **Application Issues**: Development team
- **Infrastructure Issues**: DevOps team

### Documentation References

- Design Document: `.kiro/specs/auth-onboarding-flow/design.md`
- Requirements: `.kiro/specs/auth-onboarding-flow/requirements.md`
- Tasks: `.kiro/specs/auth-onboarding-flow/tasks.md`
- Migration README: `migrations/README.md`

### Emergency Contacts

- On-call Engineer: [Contact info]
- Database Administrator: [Contact info]
- Product Owner: [Contact info]

---

## Appendix: Database Connection Examples

### PostgreSQL (psql)

```bash
# Local connection
psql -U username -d database_name

# Remote connection
psql -h hostname -p 5432 -U username -d database_name

# With SSL
psql "postgresql://username:password@hostname:5432/database_name?sslmode=require"
```

### AWS RDS PostgreSQL

```bash
# Using IAM authentication
psql -h your-rds-endpoint.region.rds.amazonaws.com \
     -U your-username \
     -d your-database \
     --set=sslmode=require
```

### Azure Database for PostgreSQL

```bash
psql "host=your-server.postgres.database.azure.com \
      port=5432 \
      dbname=your-database \
      user=your-username@your-server \
      password=your-password \
      sslmode=require"
```

### Google Cloud SQL PostgreSQL

```bash
# Using Cloud SQL Proxy
./cloud_sql_proxy -instances=PROJECT:REGION:INSTANCE=tcp:5432 &
psql -h 127.0.0.1 -U username -d database_name
```

---

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2024-01-16 | 1.0 | Initial deployment guide | Kiro AI |

---

**Last Updated**: 2024-01-16
**Next Review**: After production deployment
