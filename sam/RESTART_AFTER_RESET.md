# 🔄 Restart Guide - After AWS Reset

## Quick Restart (10 minutes)

### 1. Configure AWS CLI

```bash
aws configure
# AWS Access Key ID: [your-key]
# AWS Secret Access Key: [your-secret]
# Default region name: us-east-1
# Default output format: json
```

**Verify:**
```bash
aws sts get-caller-identity
aws configure get region
```

---

### 2. Create Database Secret

```bash
# Create temporary secret for Prisma Lambda
aws secretsmanager create-secret \
  --name huntaze/database \
  --description "Huntaze database credentials" \
  --secret-string '{
    "host": "localhost",
    "port": "5432",
    "database": "huntaze",
    "username": "postgres",
    "password": "temporary"
  }' \
  --region us-east-1
```

---

### 3. Deploy Infrastructure

```bash
cd sam

# Build
sam build

# Deploy (guided first time)
sam deploy --guided
```

**Deployment prompts:**
- Stack Name: `huntaze-prisma-skeleton`
- AWS Region: `us-east-1`
- Parameter DatabaseSecretArn: (use the ARN from step 2)
- Confirm changes: `Y`
- Allow SAM CLI IAM role creation: `Y`
- Disable rollback: `Y`
- Save arguments to config: `Y`

---

### 4. Verify Deployment

```bash
# Run pre-flight checks
./preflight-check.sh

# Or run readiness tests
./test-beta-ready.sh
```

**Expected:** All checks pass ✅

---

### 5. Launch Beta

```bash
# Enable canary 1%
./enable-canary.sh

# Start monitoring
./monitor-beta.sh --watch
```

---

## Troubleshooting

### Secret Already Exists

```bash
# Delete old secret
aws secretsmanager delete-secret \
  --secret-id huntaze/database \
  --force-delete-without-recovery \
  --region us-east-1

# Recreate (see step 2)
```

### Stack Already Exists

```bash
# Delete old stack
aws cloudformation delete-stack \
  --stack-name huntaze-prisma-skeleton \
  --region us-east-1

# Wait for deletion
aws cloudformation wait stack-delete-complete \
  --stack-name huntaze-prisma-skeleton \
  --region us-east-1

# Redeploy (see step 3)
```

### SAM Build Fails

```bash
# Clean and rebuild
cd sam
rm -rf .aws-sam
sam build --use-container
```

---

## What Gets Deployed

**Lambda Functions:**
- `huntaze-mock-read` - Mock handler with shadow traffic
- `huntaze-prisma-read` - Prisma adapter
- `huntaze-cleanup` - Cleanup function

**AppConfig:**
- Application: `huntaze-flags`
- Environment: `production`
- Profile: `feature-flags`
- Flag: `prismaAdapter.enabled` (false by default)

**Monitoring:**
- CloudWatch Dashboard: `huntaze-prisma-migration`
- CloudWatch Alarm: `huntaze-lambda-error-rate-gt-2pct`
- X-Ray Tracing: Active

**Deployment:**
- CodeDeploy Application: `huntaze-prisma-skeleton`
- Lambda Alias: `live` (weighted routing)

---

## Quick Commands Reference

```bash
# Check AWS config
aws sts get-caller-identity

# List stacks
aws cloudformation list-stacks --region us-east-1

# List secrets
aws secretsmanager list-secrets --region us-east-1

# List Lambda functions
aws lambda list-functions --region us-east-1

# Tail logs
sam logs -n huntaze-mock-read --tail

# Test Lambda
aws lambda invoke \
  --function-name huntaze-mock-read \
  --region us-east-1 \
  --cli-binary-format raw-in-base64-out \
  --payload '{"userId":"test-1"}' \
  /tmp/test.json && cat /tmp/test.json
```

---

## Full Cleanup (If Needed)

```bash
# Delete stack
aws cloudformation delete-stack \
  --stack-name huntaze-prisma-skeleton \
  --region us-east-1

# Delete secret
aws secretsmanager delete-secret \
  --secret-id huntaze/database \
  --force-delete-without-recovery \
  --region us-east-1

# Delete S3 bucket (SAM artifacts)
aws s3 rb s3://aws-sam-cli-managed-default-samclisourcebucket-* --force

# Clean local
cd sam && rm -rf .aws-sam
```

---

## Next Steps After Deployment

1. **Verify:** `./preflight-check.sh`
2. **Review:** `cat GO_NO_GO_CHECKLIST.md`
3. **Launch:** `./enable-canary.sh`
4. **Monitor:** `./monitor-beta.sh --watch`
5. **Follow:** `BETA_PLAYBOOK.md` for 3h beta

---

**🚀 Ready to restart!**

