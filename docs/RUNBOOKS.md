# 🚨 Runbooks - Incident Response

## 📋 Vue d'ensemble

Procédures d'intervention pour les incidents critiques.

---

## 1️⃣ Auth Down (Authentification Indisponible)

### Symptômes
- Users ne peuvent pas se connecter
- Erreurs 500 sur `/api/auth/*`
- CloudWatch alarm: `AuthErrors > 5%`

### Diagnostic

```bash
# 1. Check Auth.js health
curl https://app.huntaze.com/api/auth/session

# 2. Check database connectivity
psql $DATABASE_URL -c "SELECT 1"

# 3. Check logs
aws logs tail /huntaze/production --follow --filter-pattern "auth"
```

### Actions

#### Si Database Down
```bash
# 1. Check RDS status
aws rds describe-db-instances --db-instance-identifier huntaze-prod

# 2. Check connections
aws rds describe-db-log-files --db-instance-identifier huntaze-prod

# 3. Restart if needed
aws rds reboot-db-instance --db-instance-identifier huntaze-prod
```

#### Si Auth.js Issue
```bash
# 1. Rollback to previous version
git revert HEAD
npm run build
npm run deploy

# 2. Or rollback Auth.js version
npm install next-auth@4.24.13
npm run build
npm run deploy
```

#### Si Session Store Issue
```bash
# 1. Clear Redis cache (if using Redis)
redis-cli FLUSHDB

# 2. Restart application
# (Amplify: redeploy)
# (SST: sst deploy)
```

### Communication
```
Status: Investigating
Impact: Users cannot login
ETA: 15 minutes
Workaround: None
```

---

## 2️⃣ Database Saturation

### Symptômes
- Slow queries (> 5s)
- Connection pool exhausted
- CloudWatch alarm: `DBConnections > 90%`

### Diagnostic

```bash
# 1. Check active connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity"

# 2. Check slow queries
psql $DATABASE_URL -c "
  SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
  FROM pg_stat_activity 
  WHERE state = 'active' 
  ORDER BY duration DESC
"

# 3. Check locks
psql $DATABASE_URL -c "
  SELECT * FROM pg_locks 
  WHERE NOT granted
"
```

### Actions

#### Immediate (< 5 min)
```bash
# 1. Kill long-running queries
psql $DATABASE_URL -c "
  SELECT pg_terminate_backend(pid) 
  FROM pg_stat_activity 
  WHERE state = 'active' 
  AND now() - query_start > interval '5 minutes'
"

# 2. Scale up RDS (if needed)
aws rds modify-db-instance \
  --db-instance-identifier huntaze-prod \
  --db-instance-class db.t3.large \
  --apply-immediately
```

#### Short-term (< 1 hour)
```bash
# 1. Enable Prisma Accelerate
# Update DATABASE_URL to use Accelerate

# 2. Add connection pooling
# Configure RDS Proxy

# 3. Optimize queries
# Add indexes, use EXPLAIN ANALYZE
```

#### Long-term (< 1 week)
```bash
# 1. Implement read replicas
# 2. Add caching layer (Redis)
# 3. Implement materialized views
# 4. Archive old data
```

---

## 3️⃣ S3 Access Denied (403)

### Symptômes
- Upload failures
- 403 errors on S3 operations
- CloudWatch alarm: `S3Errors > 2%`

### Diagnostic

```bash
# 1. Check IAM role
aws sts get-caller-identity

# 2. Check bucket policy
aws s3api get-bucket-policy --bucket huntaze-media

# 3. Check CORS
aws s3api get-bucket-cors --bucket huntaze-media

# 4. Test upload
aws s3 cp test.txt s3://huntaze-media/test.txt
```

### Actions

#### Si IAM Role Issue
```bash
# 1. Verify role has S3 permissions
aws iam get-role-policy \
  --role-name HuntazeAppRole \
  --policy-name S3Access

# 2. Update policy if needed
aws iam put-role-policy \
  --role-name HuntazeAppRole \
  --policy-name S3Access \
  --policy-document file://s3-policy.json
```

#### Si Bucket Policy Issue
```bash
# 1. Update bucket policy
aws s3api put-bucket-policy \
  --bucket huntaze-media \
  --policy file://bucket-policy.json

# 2. Verify
aws s3api get-bucket-policy --bucket huntaze-media
```

#### Fallback: Queue Uploads
```typescript
// Temporarily queue uploads to SQS
await sqs.sendMessage({
  QueueUrl: process.env.UPLOAD_QUEUE_URL,
  MessageBody: JSON.stringify({
    file: base64File,
    userId,
    timestamp: Date.now(),
  }),
});
```

---

## 4️⃣ SQS Queue Backlog

### Symptômes
- Queue depth > 5000 messages
- Message age > 15 minutes
- CloudWatch alarm: `QueueDepth > 5000`

### Diagnostic

```bash
# 1. Check queue metrics
aws sqs get-queue-attributes \
  --queue-url $SQS_QUEUE_URL \
  --attribute-names All

# 2. Check DLQ
aws sqs get-queue-attributes \
  --queue-url $SQS_DLQ_URL \
  --attribute-names ApproximateNumberOfMessages

# 3. Sample messages
aws sqs receive-message \
  --queue-url $SQS_QUEUE_URL \
  --max-number-of-messages 10
```

### Actions

#### Immediate
```bash
# 1. Scale up consumers
# (Increase Lambda concurrency or ECS tasks)

# 2. Increase batch size
# Update consumer to process more messages per invocation

# 3. Pause non-critical producers
# Temporarily disable low-priority message sources
```

#### If Messages Failing
```bash
# 1. Check DLQ
aws sqs receive-message \
  --queue-url $SQS_DLQ_URL \
  --max-number-of-messages 10

# 2. Analyze failure pattern
# Look for common errors

# 3. Fix and replay
# Fix issue, then move messages back to main queue
```

---

## 5️⃣ High API Latency

### Symptômes
- p95 latency > 1s
- Slow page loads
- CloudWatch alarm: `APILatencyP95 > 1000ms`

### Diagnostic

```bash
# 1. Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Latency \
  --dimensions Name=ApiName,Value=huntaze-api \
  --statistics Average,Maximum \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300

# 2. Check slow endpoints
# Review CloudWatch Logs Insights

# 3. Check database performance
psql $DATABASE_URL -c "
  SELECT query, mean_exec_time, calls 
  FROM pg_stat_statements 
  ORDER BY mean_exec_time DESC 
  LIMIT 10
"
```

### Actions

#### Quick Wins
```bash
# 1. Enable caching
# Add revalidateTag to API routes

# 2. Optimize queries
# Add indexes, reduce N+1 queries

# 3. Enable CDN
# CloudFront for static assets
```

#### Database Optimization
```sql
-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_subscribers_user_id 
ON subscribers(user_id);

CREATE INDEX CONCURRENTLY idx_messages_conversation_id 
ON messages(conversation_id);

-- Analyze tables
ANALYZE subscribers;
ANALYZE messages;
```

---

## 6️⃣ Deployment Rollback

### Quand Rollback?
- Critical bugs in production
- Performance degradation > 50%
- Error rate > 5%

### Procédure

#### Amplify
```bash
# 1. List recent deployments
aws amplify list-jobs --app-id $APP_ID --branch-name main

# 2. Rollback to previous
aws amplify start-job \
  --app-id $APP_ID \
  --branch-name main \
  --job-type RELEASE \
  --job-id $PREVIOUS_JOB_ID
```

#### SST
```bash
# 1. Checkout previous version
git log --oneline -10
git checkout <previous-commit>

# 2. Deploy
sst deploy --stage production

# 3. Verify
curl https://app.huntaze.com/api/health
```

#### Database Migrations
```bash
# 1. Rollback migration
npx prisma migrate resolve --rolled-back <migration-name>

# 2. Apply previous state
npx prisma migrate deploy

# 3. Verify
psql $DATABASE_URL -c "\dt"
```

---

## 7️⃣ Data Breach Response

### Immediate Actions (< 15 min)

```bash
# 1. Isolate affected systems
# Disable compromised API keys
aws secretsmanager update-secret \
  --secret-id huntaze/api-key \
  --secret-string "REVOKED"

# 2. Enable CloudTrail logging
aws cloudtrail start-logging --name huntaze-trail

# 3. Snapshot current state
aws rds create-db-snapshot \
  --db-instance-identifier huntaze-prod \
  --db-snapshot-identifier breach-$(date +%Y%m%d-%H%M%S)
```

### Investigation (< 1 hour)

```bash
# 1. Review CloudTrail logs
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=GetObject \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S)

# 2. Check access logs
aws logs filter-log-events \
  --log-group-name /huntaze/production \
  --filter-pattern "403 OR 401" \
  --start-time $(date -u -d '24 hours ago' +%s)000

# 3. Identify affected users
psql $DATABASE_URL -c "
  SELECT DISTINCT user_id, created_at 
  FROM audit_logs 
  WHERE event = 'suspicious_activity' 
  AND created_at > NOW() - INTERVAL '24 hours'
"
```

### Remediation

```bash
# 1. Rotate all secrets
./scripts/rotate-secrets.sh

# 2. Force password reset
psql $DATABASE_URL -c "
  UPDATE users 
  SET password_reset_required = true
"

# 3. Notify affected users
# Send email via SES

# 4. Document incident
# Create incident report
```

---

## 📞 Escalation

### Severity Levels

**P0 - Critical**
- Complete service outage
- Data breach
- Response: Immediate (< 15 min)
- Escalate: CTO + Security Team

**P1 - High**
- Partial service outage
- Performance degradation > 50%
- Response: < 1 hour
- Escalate: Engineering Lead

**P2 - Medium**
- Non-critical feature broken
- Performance degradation < 50%
- Response: < 4 hours
- Escalate: On-call engineer

**P3 - Low**
- Minor bugs
- Cosmetic issues
- Response: Next business day
- Escalate: Product team

### Contact List

```
CTO: [email]
Security Lead: [email]
Engineering Lead: [email]
On-call: PagerDuty rotation
```

---

## 🧪 Chaos Testing

### Monthly DR Tests

```bash
# 1. Database restore test
./scripts/test-db-restore.sh

# 2. S3 failover test
./scripts/test-s3-failover.sh

# 3. Auth failover test
./scripts/test-auth-failover.sh
```

### Quarterly Chaos Tests

```bash
# 1. Simulate database failure
# 2. Simulate S3 outage
# 3. Simulate high load (10x normal)
# 4. Simulate network partition
```

---

**Last Updated**: 2025-01-30
**Version**: 1.0
**Owner**: Engineering Team
