# ⚡ Quick Deployment Guide - 15 Minutes

## Prerequisites (2 min)

```bash
# Verify installations
aws --version
git status
npm --version
node --version
```

## Step 1: Generate Secrets (1 min)

```bash
# Generate all required secrets
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)"
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
echo "PREVIEW_TOKEN_SECRET=$(openssl rand -base64 32)"
```

## Step 2: AWS Infrastructure (5 min)

### Create SQS Queue
```bash
aws sqs create-queue --queue-name onlyfans-rate-limiter
```

### Create S3 Bucket
```bash
aws s3 mb s3://huntaze-content-media-prod
```

### Get Queue URL
```bash
aws sqs get-queue-url --queue-name onlyfans-rate-limiter
```

## Step 3: Configure Amplify (5 min)

1. Go to AWS Amplify Console
2. Connect your GitHub repository
3. Add environment variables (see below)
4. Configure build settings (copy from ONLYFANS_AMPLIFY_CONFIG.md)
5. Deploy

### Minimum Required Variables

```bash
# Core
NODE_ENV=production
DATABASE_URL=<your-postgres-url>
JWT_SECRET=<generated-above>
JWT_REFRESH_SECRET=<generated-above>
NEXTAUTH_SECRET=<generated-above>
NEXTAUTH_URL=https://<your-amplify-domain>

# OnlyFans
AWS_SQS_QUEUE_URL=<from-step-2>
ONLYFANS_API_URL=https://onlyfans.com/api2/v2

# Content Creation
AWS_S3_BUCKET=huntaze-content-media-prod
OPENAI_API_KEY=<your-openai-key>
PREVIEW_TOKEN_SECRET=<generated-above>
```

## Step 4: Deploy (2 min)

```bash
# Commit and push
git add .
git commit -m "chore: configure production deployment"
git push origin main

# Amplify will auto-deploy
```

## Step 5: Verify (2 min)

```bash
# Wait for deployment to complete, then test
DOMAIN="https://your-amplify-domain.amplifyapp.com"

# Health check
curl $DOMAIN/api/health

# OnlyFans status
curl $DOMAIN/api/onlyfans/messages/status

# Content media
curl $DOMAIN/api/content/media
```

## Troubleshooting

### Build Failed
- Check Amplify build logs
- Verify all environment variables are set
- Ensure DATABASE_URL is accessible

### Database Connection Error
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

### S3 Access Denied
```bash
# Verify IAM permissions
aws s3 ls s3://huntaze-content-media-prod
```

## Success Checklist

- [ ] All secrets generated
- [ ] SQS queue created
- [ ] S3 bucket created
- [ ] Amplify configured
- [ ] Build successful
- [ ] Health checks passing
- [ ] Domain accessible

## Next Steps

1. Configure custom domain
2. Set up monitoring alerts
3. Review CloudWatch logs
4. Test user workflows

**Total Time**: 15-20 minutes  
**Status**: 🚀 Production Ready
