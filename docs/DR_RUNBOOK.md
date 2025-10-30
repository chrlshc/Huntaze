# Disaster Recovery Runbook

**RPO:** 15 minutes  
**RTO:** 60 minutes

## 🚨 Emergency Contacts

- **On-Call Engineer:** PagerDuty rotation
- **Database Admin:** [Contact info]
- **AWS Support:** Enterprise Support case

---

## 📋 Recovery Procedures

### 1. Database Recovery (PostgreSQL RDS)

**Scenario:** Database corruption or data loss

```bash
# 1. Identify the recovery point
aws rds describe-db-instances --db-instance-identifier huntaze-prod

# 2. Restore to point-in-time (T-15 minutes)
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier huntaze-prod \
  --target-db-instance-identifier huntaze-prod-restored \
  --restore-time 2024-01-01T12:00:00Z

# 3. Wait for restoration (5-15 minutes)
aws rds wait db-instance-available \
  --db-instance-identifier huntaze-prod-restored

# 4. Update connection string
# Update DB_URL in environment variables/secrets manager
aws secretsmanager update-secret \
  --secret-id huntaze/prod/db-url \
  --secret-string "postgresql://..."

# 5. Restart application servers
kubectl rollout restart deployment/huntaze-api -n production
```

**Validation:**
- [ ] Database accessible
- [ ] Health check passes
- [ ] Sample queries return expected data

---

### 2. S3 File Recovery

**Scenario:** Accidental deletion or corruption

```bash
# 1. Check versioning status
aws s3api get-bucket-versioning --bucket huntaze-prod-uploads

# 2. List deleted objects
aws s3api list-object-versions \
  --bucket huntaze-prod-uploads \
  --prefix campaigns/

# 3. Restore specific version
aws s3api copy-object \
  --bucket huntaze-prod-uploads \
  --copy-source huntaze-prod-uploads/campaigns/file.jpg?versionId=VERSION_ID \
  --key campaigns/file.jpg

# 4. If using Cross-Region Replication, promote replica bucket
aws s3 sync s3://huntaze-prod-uploads-replica s3://huntaze-prod-uploads
```

**Validation:**
- [ ] Files accessible via CDN
- [ ] Sample uploads work
- [ ] No 404 errors in logs

---

### 3. Secrets Recovery (AWS Secrets Manager / KMS)

**Scenario:** Secrets compromised or lost

```bash
# 1. Rotate compromised secrets
aws secretsmanager rotate-secret \
  --secret-id huntaze/prod/api-keys \
  --rotation-lambda-arn arn:aws:lambda:...

# 2. Verify KMS key access
aws kms describe-key --key-id alias/huntaze-prod

# 3. Re-apply IAM policies if needed
aws iam put-role-policy \
  --role-name huntaze-prod-role \
  --policy-name SecretsAccess \
  --policy-document file://policy.json
```

**Validation:**
- [ ] Application can decrypt secrets
- [ ] No authentication errors
- [ ] Audit logs show proper access

---

### 4. Full System Recovery

**Scenario:** Complete region failure

```bash
# 1. Failover to DR region (us-west-2)
# Update Route53 to point to DR region
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456 \
  --change-batch file://failover.json

# 2. Promote read replica to primary
aws rds promote-read-replica \
  --db-instance-identifier huntaze-prod-replica-west

# 3. Update application configuration
kubectl set env deployment/huntaze-api \
  AWS_REGION=us-west-2 \
  DB_URL=$DR_DB_URL \
  -n production

# 4. Scale up DR infrastructure
kubectl scale deployment/huntaze-api --replicas=10 -n production
```

**Validation:**
- [ ] DNS resolves to DR region
- [ ] Health checks pass
- [ ] User traffic flows normally
- [ ] No data loss (check last transaction timestamp)

---

## 🧪 Smoke Tests

After any recovery, run these smoke tests:

```bash
# 1. Authentication
curl -X POST https://api.huntaze.com/auth/login \
  -d '{"email":"test@huntaze.com","password":"..."}'

# 2. OnlyFans campaigns
curl https://api.huntaze.com/onlyfans/campaigns \
  -H "Authorization: Bearer $TOKEN"

# 3. Message sending (mock)
curl -X POST https://api.huntaze.com/onlyfans/messages \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"userId":"test","content":"test","dryRun":true}'

# 4. Metrics endpoint
curl https://api.huntaze.com/metrics
```

---

## 📊 Post-Incident

1. **Export metrics & logs**
   ```bash
   # CloudWatch Logs
   aws logs create-export-task \
     --log-group-name /aws/lambda/huntaze-prod \
     --from 1640000000000 \
     --to 1640086400000 \
     --destination huntaze-incident-logs
   
   # Sentry events
   # Export from Sentry UI: Issues → Export
   ```

2. **Root Cause Analysis (RCA)**
   - Timeline of events
   - Root cause identification
   - Impact assessment
   - Action items

3. **Update runbook** with lessons learned

---

## 🔄 Regular Testing Schedule

- **Weekly:** Backup restoration test (non-prod)
- **Monthly:** Full DR drill (simulated)
- **Quarterly:** Cross-region failover test

---

## 📞 Escalation Path

1. On-call engineer (PagerDuty)
2. Engineering lead
3. CTO
4. AWS TAM (for infrastructure issues)
