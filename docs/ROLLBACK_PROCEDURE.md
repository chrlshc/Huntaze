# Rollback Procedure for Huntaze Onboarding System

## Overview

This document describes the step-by-step procedure to rollback the Huntaze Onboarding system in case of critical issues in production.

**Target Time:** < 15 minutes  
**Last Updated:** November 11, 2025

## When to Rollback

Rollback should be initiated when:
- Critical bugs affecting user experience
- Data corruption detected
- Performance degradation > 50%
- Security vulnerability discovered
- 5xx error rate > 5% for > 10 minutes
- SLO violations across multiple metrics

## Prerequisites

Before starting the rollback:
- [ ] Verify backup exists and is valid
- [ ] Notify team in #incidents Slack channel
- [ ] Activate kill switch to stop new traffic
- [ ] Document the issue and reason for rollback

## Rollback Steps

### Step 1: Activate Kill Switch (30 seconds)

```bash
# Activate kill switch to disable onboarding
curl -X POST https://api.huntaze.com/api/admin/kill-switch \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"active": true, "reason": "Emergency rollback"}'
```

**Verification:**
- Onboarding UI should be hidden
- Gating middleware should be disabled
- Users can access all features without onboarding

### Step 2: Stop Application (1 minute)

```bash
# On production server
sudo systemctl stop huntaze-app

# Or with PM2
pm2 stop huntaze-app

# Or with Docker
docker-compose stop app
```

**Verification:**
```bash
# Check application is stopped
curl https://api.huntaze.com/health
# Should return connection error or 503
```

### Step 3: Backup Current State (2 minutes)

Even during rollback, create a backup of the current state for forensics:

```bash
# Create emergency backup
./scripts/backup-database.sh --tables-only

# Tag it as pre-rollback
mv backups/pre-onboarding-*.sql.gz \
   backups/emergency-pre-rollback-$(date +%Y%m%d-%H%M%S).sql.gz
```

### Step 4: Restore Database from Backup (5 minutes)

```bash
# Find the last known good backup
ls -lt backups/pre-onboarding-*.sql.gz | head -n 1

# Set backup file
BACKUP_FILE="backups/pre-onboarding-YYYYMMDD-HHMMSS.sql.gz"

# Verify backup integrity
./scripts/verify-backup.sh "$BACKUP_FILE"

# Restore database
gunzip -c "$BACKUP_FILE" | psql $DATABASE_URL
```

**Verification:**
```bash
# Check tables exist
psql $DATABASE_URL -c "\dt *onboarding*"

# Check row counts
psql $DATABASE_URL -c "SELECT COUNT(*) FROM onboarding_step_definitions;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM user_onboarding;"
```

### Step 5: Deploy Previous Application Version (4 minutes)

```bash
# Get previous version tag
PREVIOUS_VERSION=$(git describe --tags --abbrev=0 HEAD^)

# Checkout previous version
git checkout $PREVIOUS_VERSION

# Install dependencies
npm ci

# Build application
npm run build

# Deploy
# (deployment method depends on your infrastructure)
```

**For Docker:**
```bash
# Pull previous image
docker pull huntaze/app:$PREVIOUS_VERSION

# Update docker-compose.yml
# Change image tag to $PREVIOUS_VERSION

# Restart containers
docker-compose up -d
```

**For Kubernetes:**
```bash
# Rollback deployment
kubectl rollout undo deployment/huntaze-app

# Check rollout status
kubectl rollout status deployment/huntaze-app
```

### Step 6: Verify System Health (2 minutes)

```bash
# Check application is running
curl https://api.huntaze.com/health
# Should return 200 OK

# Check database connectivity
curl https://api.huntaze.com/api/health/db
# Should return 200 OK

# Check metrics endpoint
curl https://api.huntaze.com/api/metrics
# Should return Prometheus metrics

# Run smoke tests
npm run test:smoke
```

**Manual Verification:**
- [ ] Homepage loads correctly
- [ ] User can log in
- [ ] Core features work (create content, publish, etc.)
- [ ] No onboarding UI visible
- [ ] No 409 gating responses

### Step 7: Deactivate Kill Switch (30 seconds)

```bash
# Deactivate kill switch
curl -X POST https://api.huntaze.com/api/admin/kill-switch \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"active": false}'
```

### Step 8: Monitor System (5 minutes)

Monitor key metrics for 5 minutes:
- Error rates (should be < 0.5%)
- Latency (p95 should be < 300ms)
- Traffic patterns
- User complaints

**Dashboards to watch:**
- https://grafana.huntaze.com/d/onboarding
- https://grafana.huntaze.com/d/overview

## Alternative: Database-Only Rollback

If the issue is only with database schema/data:

```bash
# 1. Activate kill switch
curl -X POST .../api/admin/kill-switch -d '{"active": true}'

# 2. Run rollback SQL script
psql $DATABASE_URL < lib/db/migrations/rollback-onboarding.sql

# 3. Restore from backup
gunzip -c $BACKUP_FILE | psql $DATABASE_URL

# 4. Deactivate kill switch
curl -X POST .../api/admin/kill-switch -d '{"active": false}'
```

## Post-Rollback Actions

After successful rollback:

1. **Update Status Page**
   - Mark incident as resolved
   - Provide brief explanation

2. **Notify Stakeholders**
   - Send update to #general Slack channel
   - Email product team
   - Update status in incident tracker

3. **Document Incident**
   - Create post-mortem document
   - Document root cause
   - List action items to prevent recurrence

4. **Schedule Post-Mortem**
   - Schedule meeting within 24 hours
   - Invite all relevant stakeholders

## Rollback Verification Checklist

- [ ] Kill switch activated
- [ ] Application stopped
- [ ] Emergency backup created
- [ ] Database restored from backup
- [ ] Previous application version deployed
- [ ] Health checks passing
- [ ] Smoke tests passing
- [ ] No errors in logs
- [ ] Metrics look normal
- [ ] Kill switch deactivated
- [ ] Stakeholders notified

## Troubleshooting

### Backup Restore Fails

```bash
# Check backup integrity
./scripts/verify-backup.sh $BACKUP_FILE

# Try alternative backup
BACKUP_FILE=$(ls -lt backups/*.sql.gz | sed -n '2p' | awk '{print $NF}')
gunzip -c "$BACKUP_FILE" | psql $DATABASE_URL
```

### Application Won't Start

```bash
# Check logs
tail -f /var/log/huntaze-app.log

# Check environment variables
env | grep DATABASE_URL
env | grep REDIS_URL

# Verify dependencies
npm ci
```

### Database Connection Issues

```bash
# Test database connectivity
psql $DATABASE_URL -c "SELECT 1;"

# Check database is running
sudo systemctl status postgresql

# Check connection pool
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

## Emergency Contacts

- **On-Call Engineer:** Check PagerDuty
- **Database Admin:** dba@huntaze.com
- **DevOps Lead:** devops@huntaze.com
- **CTO:** cto@huntaze.com

## Related Documentation

- [Backup Procedure](./BACKUP_PROCEDURE.md)
- [Incident Response](https://docs.huntaze.com/incident-response)
- [Runbook](https://docs.huntaze.com/runbooks/onboarding)
- [Architecture](../design.md)

## Rollback History

| Date | Version | Reason | Duration | Outcome |
|------|---------|--------|----------|---------|
| - | - | - | - | - |

---

**Remember:** Stay calm, follow the steps, and communicate clearly with the team.
