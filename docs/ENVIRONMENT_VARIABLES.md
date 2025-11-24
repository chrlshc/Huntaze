# Environment Variables Reference

## Quick Setup

### 1. Create your production environment file

```bash
cp .env.production.template .env.production
```

### 2. Fill in the required values

Edit `.env.production` with your actual credentials. **Critical variables** that must be set:

#### ✅ Required (App won't work without these)

```bash
# Database
DATABASE_URL=postgresql://username:password@huntaze-postgres-production-encrypted.c2ryoow8c5m4.us-east-1.rds.amazonaws.com:5432/huntaze?sslmode=require

# Redis
REDIS_HOST=huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com
REDIS_PORT=6379

# Authentication
NEXTAUTH_URL=https://app.huntaze.com
NEXTAUTH_SECRET=<generate-with: openssl rand -base64 32>
CSRF_SECRET=<generate-with: openssl rand -base64 32>

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
```

#### ⚙️ Important (Features won't work without these)

```bash
# AI Features
GEMINI_API_KEY=<your-gemini-key>

# File Storage
S3_BUCKET_NAME=huntaze-assets

# Email
SES_FROM_EMAIL=noreply@huntaze.com
```

#### 🔌 Optional (Only if using these integrations)

```bash
# Social Media
IG_PAGE_TOKEN=<instagram-token>
TT_USER_TOKEN=<tiktok-token>
REDDIT_CLIENT_ID=<reddit-id>

# OnlyFans
OF_SESSION_KEY=<32-char-key>
BRIGHT_DATA_CUSTOMER=<proxy-customer>
```

### 3. Push to AWS Amplify

#### Option A: Using the script (recommended)

```bash
chmod +x scripts/push-env-to-amplify.sh
./scripts/push-env-to-amplify.sh
```

#### Option B: Manual via AWS Console

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Select your app: `huntaze` (ID: `d33l77zi1h78ce`)
3. Go to **App settings** > **Environment variables**
4. Click **Manage variables**
5. Add each variable from `.env.production`

#### Option C: Using AWS CLI directly

```bash
aws amplify update-app \
  --app-id d33l77zi1h78ce \
  --region us-east-1 \
  --environment-variables \
    DATABASE_URL="your-value" \
    REDIS_HOST="your-value" \
    NEXTAUTH_SECRET="your-value"
```

## Verified AWS Resources

From `scripts/verify-aws-resources.ts`:

### PostgreSQL (RDS)
- **Endpoint**: `huntaze-postgres-production-encrypted.c2ryoow8c5m4.us-east-1.rds.amazonaws.com:5432`
- **Engine**: PostgreSQL 17.4
- **VPC**: `vpc-033be7e71ec9548d2`

### Redis (ElastiCache)
- **Endpoint**: `huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com:6379`
- **Engine**: Redis 7.1.0
- **Node Type**: cache.t3.micro

## Security Best Practices

### ✅ DO
- Use AWS Secrets Manager for sensitive values
- Rotate secrets regularly (every 90 days)
- Use different secrets for staging/production
- Enable encryption at rest for RDS
- Use VPC security groups to restrict access

### ❌ DON'T
- Commit `.env.production` to git (it's in `.gitignore`)
- Share credentials in Slack/email
- Use the same secrets across environments
- Hardcode secrets in code

## Generating Secure Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate CSRF_SECRET
openssl rand -base64 32

# Generate OF_SESSION_KEY (exactly 32 characters)
openssl rand -hex 16
```

## Troubleshooting

### Build fails with "Redis connection timeout"
- Check `REDIS_HOST` and `REDIS_PORT` are correct
- Verify VPC security groups allow connections
- Ensure `LAMBDA_SECURITY_GROUP_ID` and subnet IDs are set

### Database connection fails
- Verify `DATABASE_URL` format is correct
- Check RDS security group allows connections from Lambda
- Ensure `?sslmode=require` is in the connection string

### AI features not working
- Verify `GEMINI_API_KEY` is set and valid
- Check API key has sufficient quota
- Review CloudWatch logs for specific errors

## Environment-Specific Variables

### Production
```bash
NODE_ENV=production
AMPLIFY_ENV=production
NEXT_PUBLIC_APP_URL=https://app.huntaze.com
```

### Staging
```bash
NODE_ENV=production
AMPLIFY_ENV=staging
NEXT_PUBLIC_APP_URL=https://staging.huntaze.com
```

## Testing Connections

Run the connection test script:

```bash
npx tsx scripts/test-connections.ts
```

This will verify:
- ✅ Redis connectivity
- ✅ PostgreSQL connectivity
- ⚠️ Fallback mode if unavailable

## Related Documentation

- [AWS Amplify Configuration](./AMPLIFY_SETUP.md)
- [Database Setup](./DATABASE_SETUP.md)
- [Redis Configuration](./REDIS_SETUP.md)
- [Security Guide](./SECURITY.md)
