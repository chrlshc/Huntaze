# Production Deployment Guide
## Huntaze Onboarding System

**Last Updated:** November 11, 2025  
**Version:** 1.0.0  
**Target:** Production Environment

---

## Pre-Deployment Checklist

### ✅ Phase 1: Testing (Complete)
- [x] Unit tests passing (80%+ coverage)
- [x] Integration tests passing
- [x] E2E tests passing
- [x] All tests run in CI/CD

### ✅ Phase 2: Feature Flags & Kill Switch (Complete)
- [x] Feature flags configured
- [x] Kill switch tested
- [x] Rollout percentages defined
- [x] Admin API endpoints secured

### ✅ Phase 3: Security (Complete)
- [x] Rate limiting implemented
- [x] CSRF protection enabled
- [x] Security headers configured
- [x] RBAC implemented
- [x] Audit logging active

### ✅ Phase 4: Observability (Complete)
- [x] SLOs defined
- [x] Metrics collection active
- [x] Grafana dashboard created
- [x] Alerts configured
- [x] Distributed tracing enabled

### ✅ Phase 5: Backup & Recovery (Complete)
- [x] Backup scripts tested
- [x] Continuous backups configured
- [x] Rollback procedure documented
- [x] Dry-run migration successful

### ✅ Phase 6: Versioning & Concurrency (Complete)
- [x] Step version migration implemented
- [x] Optimistic locking enabled
- [x] Concurrency tests passing

### ✅ Phase 7: GDPR Compliance (Complete)
- [x] Data processing registry complete
- [x] Data retention policy active
- [x] DSR endpoints implemented
- [x] Cookie consent banner deployed

---

## Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/huntaze_prod"

# Redis
REDIS_URL="redis://host:6379"

# Feature Flags
ONBOARDING_ENABLED="true"
ONBOARDING_ROLLOUT_PERCENTAGE="0"  # Start at 0%
ONBOARDING_MARKETS="FR,US,UK"
ONBOARDING_USER_WHITELIST=""  # Comma-separated user IDs

# Kill Switch
ONBOARDING_KILL_SWITCH_ACTIVE="false"

# Security
CSRF_SECRET="[GENERATE_SECURE_SECRET]"
SESSION_SECRET="[GENERATE_SECURE_SECRET]"

# Monitoring
PROMETHEUS_ENABLED="true"
GRAFANA_URL="https://grafana.huntaze.com"

# Alerts
PAGERDUTY_API_KEY="[YOUR_KEY]"
SLACK_WEBHOOK_URL="[YOUR_WEBHOOK]"

# GDPR
DPO_EMAIL="dpo@huntaze.com"
DSR_EMAIL="dsr@huntaze.com"
```

### Optional Variables

```bash
# Backup
BACKUP_S3_BUCKET="huntaze-db-backups"
BACKUP_S3_REGION="eu-west-1"

# Analytics
ANALYTICS_ENABLED="true"
```

---

## Database Migrations

### 1. Pre-Migration Backup

```bash
# Create backup before migration
./scripts/backup-database.sh

# Verify backup
./scripts/verify-backup.sh --latest
```

### 2. Run Migration

```bash
# Test on staging first
export STAGING_DATABASE_URL="postgresql://..."
./scripts/dry-run-migration.sh

# Run on production
psql $DATABASE_URL < lib/db/migrations/2024-11-11-shopify-style-onboarding.sql
```

### 3. Verify Migration

```bash
# Check tables created
psql $DATABASE_URL -c "\dt *onboarding*"

# Check row counts
psql $DATABASE_URL -c "SELECT COUNT(*) FROM onboarding_step_definitions;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM user_onboarding;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM onboarding_events;"
```

### 4. Seed Data

```bash
# Seed onboarding steps
node scripts/seed-huntaze-onboarding.js
```

---

## Deployment Steps

### Step 1: Pre-Deployment (T-24h)

1. **Notify Team**
   - Send deployment notification
   - Schedule deployment window
   - Assign on-call engineer

2. **Final Testing**
   ```bash
   npm run test
   npm run test:integration
   npm run test:e2e
   ```

3. **Create Backup**
   ```bash
   ./scripts/backup-database.sh
   ```

### Step 2: Deployment (T-0)

1. **Deploy Application**
   ```bash
   # Build
   npm run build
   
   # Deploy (method depends on infrastructure)
   # Docker:
   docker build -t huntaze/app:v1.0.0 .
   docker push huntaze/app:v1.0.0
   
   # Kubernetes:
   kubectl set image deployment/huntaze-app app=huntaze/app:v1.0.0
   kubectl rollout status deployment/huntaze-app
   ```

2. **Run Migrations**
   ```bash
   psql $DATABASE_URL < lib/db/migrations/2024-11-11-shopify-style-onboarding.sql
   node scripts/seed-huntaze-onboarding.js
   ```

3. **Verify Deployment**
   ```bash
   # Health check
   curl https://api.huntaze.com/health
   
   # Database check
   curl https://api.huntaze.com/api/health/db
   
   # Metrics check
   curl https://api.huntaze.com/api/metrics
   ```

### Step 3: Progressive Rollout

#### Stage 1: Internal Testing (0%)

```bash
# Keep rollout at 0%
curl -X POST https://api.huntaze.com/api/admin/feature-flags \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"rolloutPercentage": 0, "userWhitelist": ["internal-user-1", "internal-user-2"]}'
```

**Duration:** 24 hours  
**Monitor:** Error rates, latency, user feedback

#### Stage 2: Early Adopters (5%)

```bash
# Increase to 5%
curl -X POST https://api.huntaze.com/api/admin/feature-flags \
  -d '{"rolloutPercentage": 5}'
```

**Duration:** 48 hours  
**Monitor:** SLO compliance, 409 rates, completion rates

#### Stage 3: Validation (25%)

```bash
# Increase to 25%
curl -X POST https://api.huntaze.com/api/admin/feature-flags \
  -d '{"rolloutPercentage": 25}'
```

**Duration:** 72 hours  
**Monitor:** All metrics, user feedback, support tickets

#### Stage 4: Monitoring (50%)

```bash
# Increase to 50%
curl -X POST https://api.huntaze.com/api/admin/feature-flags \
  -d '{"rolloutPercentage": 50}'
```

**Duration:** 1 week  
**Monitor:** Long-term stability, performance trends

#### Stage 5: Full Rollout (100%)

```bash
# Increase to 100%
curl -X POST https://api.huntaze.com/api/admin/feature-flags \
  -d '{"rolloutPercentage": 100}'
```

**Monitor:** Continuous monitoring via dashboards

---

## Monitoring During Rollout

### Key Metrics to Watch

1. **Error Rates**
   - Target: < 0.5% (5xx)
   - Alert: > 1% for 5 minutes

2. **Latency**
   - Target: p95 < 300ms
   - Alert: p95 > 500ms for 10 minutes

3. **409 Responses**
   - Target: < 10%
   - Alert: > 20% for 10 minutes

4. **Cache Hit Rate**
   - Target: > 80%
   - Alert: < 60% for 15 minutes

### Dashboards

- **Main Dashboard:** https://grafana.huntaze.com/d/onboarding
- **SLO Dashboard:** https://grafana.huntaze.com/d/onboarding-slo
- **Alerts:** https://grafana.huntaze.com/alerting

### Logs

```bash
# Application logs
kubectl logs -f deployment/huntaze-app

# Database logs
tail -f /var/log/postgresql/postgresql.log

# Backup logs
tail -f /var/log/huntaze/data-cleanup.log
```

---

## Rollback Triggers

Initiate rollback if:

- 5xx error rate > 5% for > 10 minutes
- p95 latency > 1000ms for > 10 minutes
- Critical security vulnerability discovered
- Data corruption detected
- SLO violations across multiple metrics

### Rollback Procedure

See [ROLLBACK_PROCEDURE.md](./ROLLBACK_PROCEDURE.md) for detailed steps.

**Quick Rollback:**
```bash
# 1. Activate kill switch
curl -X POST .../api/admin/kill-switch -d '{"active": true}'

# 2. Follow rollback procedure
cat docs/ROLLBACK_PROCEDURE.md
```

---

## Post-Deployment

### Day 1

- [ ] Monitor dashboards continuously
- [ ] Check error logs every hour
- [ ] Verify SLO compliance
- [ ] Review user feedback
- [ ] Check support tickets

### Week 1

- [ ] Daily SLO reports
- [ ] Review completion rates
- [ ] Analyze 409 patterns
- [ ] Optimize slow queries
- [ ] Update documentation

### Month 1

- [ ] Monthly SLO review
- [ ] Performance optimization
- [ ] User feedback analysis
- [ ] Security audit
- [ ] Update GDPR documentation

---

## Configuration Changes

### Cron Jobs

```bash
# Setup continuous backups
./scripts/setup-continuous-backups.sh

# Setup data cleanup
./scripts/setup-data-cleanup-cron.sh

# Verify cron jobs
crontab -l
```

### Security Headers

Already configured in `next.config.js`:
- Content-Security-Policy
- Strict-Transport-Security
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy

### Rate Limits

Configured in `lib/middleware/rate-limit.ts`:
- PATCH /api/onboarding/steps/:id: 20/min
- POST /api/onboarding/snooze: 3/day

---

## Emergency Contacts

**On-Call Engineer:** Check PagerDuty  
**Database Admin:** dba@huntaze.com  
**DevOps Lead:** devops@huntaze.com  
**CTO:** cto@huntaze.com  
**DPO:** dpo@huntaze.com

---

## Success Criteria

### Technical

- ✅ 80%+ test coverage
- ✅ p95 latency < 300ms
- ✅ Error rate < 0.5%
- ✅ Availability > 99.9%
- ✅ Zero critical incidents

### Business

- ✅ User completion rate > 60%
- ✅ Time to complete < 10 minutes
- ✅ Support tickets < 5% of users
- ✅ Positive user feedback

---

## Related Documentation

- [Requirements](../requirements.md)
- [Design](../design.md)
- [Rollback Procedure](./ROLLBACK_PROCEDURE.md)
- [SLO Documentation](./SLO_DOCUMENTATION.md)
- [GDPR Registry](./GDPR_DATA_PROCESSING_REGISTRY.md)
- [DSR Procedures](./DSR_PROCEDURES.md)
- [Optimistic Locking](./OPTIMISTIC_LOCKING.md)

---

**Deployment Status:** Ready for Production  
**Last Review:** November 11, 2025  
**Next Review:** December 11, 2025
