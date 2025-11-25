# AWS Amplify Environment Variables Setup

## 🚨 Critical Issue Fixed

Your build is failing with import errors because `prisma` wasn't exported from `@/lib/db-client`. This has been fixed.

## 📋 Required Environment Variables for Amplify

### Method 1: Using AWS Amplify Console (Recommended)

1. Go to: https://console.aws.amazon.com/amplify
2. Select your app: **huntaze** (App ID: `d33l77zi1h78ce`)
3. Click on your branch: **production-ready**
4. Go to **Environment variables** in the left sidebar
5. Click **Manage variables**
6. Add the following variables:

### ✅ CRITICAL - Must Have (App won't work without these)

```bash
# Node Environment
NODE_ENV=production
AMPLIFY_ENV=production-ready

# Application URL
NEXT_PUBLIC_APP_URL=https://production-ready.d33l77zi1h78ce.amplifyapp.com

# Database (PostgreSQL RDS)
DATABASE_URL=postgresql://username:password@huntaze-postgres-production-encrypted.c2ryoow8c5m4.us-east-1.rds.amazonaws.com:5432/huntaze?sslmode=require

# Redis (ElastiCache)
REDIS_HOST=huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com
REDIS_PORT=6379

# Authentication (NextAuth v5)
NEXTAUTH_URL=https://production-ready.d33l77zi1h78ce.amplifyapp.com
NEXTAUTH_SECRET=<generate-with: openssl rand -base64 32>
AUTH_TRUST_HOST=true

# CSRF Protection
CSRF_SECRET=<generate-with: openssl rand -base64 32>

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-aws-access-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>
```

### ⚙️ IMPORTANT - Features Need These

```bash
# AI Services (Gemini)
GEMINI_API_KEY=<your-gemini-api-key>

# S3 File Storage
S3_BUCKET_NAME=huntaze-assets
S3_REGION=us-east-1

# AWS SES (Email/Magic Links)
AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=noreply@huntaze.com
AWS_SES_FROM_NAME=Huntaze
EMAIL_FROM=noreply@huntaze.com
EMAIL_SERVER_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=<your-ses-smtp-username>
EMAIL_SERVER_PASSWORD=<your-ses-smtp-password>

# Google Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### 🔌 OPTIONAL - Only if Using These Features

```bash
# Google OAuth
GOOGLE_CLIENT_ID=<your-google-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

# Instagram Integration
IG_PAGE_TOKEN=<your-instagram-page-token>
IG_USER_ID=<your-instagram-user-id>

# TikTok Integration
TIKTOK_CLIENT_KEY=<your-tiktok-client-key>
TIKTOK_CLIENT_SECRET=<your-tiktok-client-secret>
TIKTOK_REDIRECT_URI=https://production-ready.d33l77zi1h78ce.amplifyapp.com/api/auth/callback/tiktok

# Reddit Integration
REDDIT_CLIENT_ID=<your-reddit-client-id>
REDDIT_CLIENT_SECRET=<your-reddit-client-secret>
REDDIT_REDIRECT_URI=https://production-ready.d33l77zi1h78ce.amplifyapp.com/api/auth/callback/reddit

# Stripe Payments
STRIPE_SECRET_KEY=sk_live_<your-stripe-secret-key>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_<your-stripe-publishable-key>
STRIPE_WEBHOOK_SECRET=whsec_<your-webhook-secret>

# OnlyFans Integration
OF_SESSION_KEY=<32-character-encryption-key>
OF_SESSIONS_BACKEND=aws
OF_AWS_REGION=us-east-1
OF_DDB_SESSIONS_TABLE=HuntazeOfSessions
OF_DDB_FAN_CAPS_TABLE=HuntazeFanCaps
OF_SQS_SEND_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/<account-id>/huntaze-of-send-queue

# Bright Data Proxy
BRIGHT_DATA_CUSTOMER=<your-customer-id>
BRIGHT_DATA_PASSWORD=<your-password>
BRIGHT_DATA_ZONE=residential

# Feature Flags
ENABLE_SMART_ONBOARDING=true
ENABLE_AI_FEATURES=true
ENABLE_BETA_FEATURES=false

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

---

## 🔐 Generate Secure Secrets

Run these commands to generate secure random secrets:

```bash
# NEXTAUTH_SECRET (minimum 32 characters)
openssl rand -base64 32

# CSRF_SECRET (minimum 32 characters)
openssl rand -base64 32

# OF_SESSION_KEY (exactly 32 characters)
openssl rand -hex 16
```

---

## 🚀 Method 2: Using AWS CLI

If you prefer automation, use the AWS CLI:

```bash
# Set your app ID and branch
APP_ID="d33l77zi1h78ce"
BRANCH_NAME="production-ready"

# Update environment variables
aws amplify update-branch \
  --app-id $APP_ID \
  --branch-name $BRANCH_NAME \
  --environment-variables \
    NODE_ENV=production \
    AMPLIFY_ENV=production-ready \
    NEXT_PUBLIC_APP_URL=https://production-ready.d33l77zi1h78ce.amplifyapp.com \
    DATABASE_URL="postgresql://username:password@huntaze-postgres-production-encrypted.c2ryoow8c5m4.us-east-1.rds.amazonaws.com:5432/huntaze?sslmode=require" \
    REDIS_HOST=huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com \
    REDIS_PORT=6379 \
    NEXTAUTH_URL=https://production-ready.d33l77zi1h78ce.amplifyapp.com \
    NEXTAUTH_SECRET="<your-generated-secret>" \
    AUTH_TRUST_HOST=true \
    CSRF_SECRET="<your-generated-secret>" \
    AWS_REGION=us-east-1 \
    AWS_ACCESS_KEY_ID="<your-key>" \
    AWS_SECRET_ACCESS_KEY="<your-secret>" \
    GEMINI_API_KEY="<your-gemini-key>" \
    S3_BUCKET_NAME=huntaze-assets \
    S3_REGION=us-east-1 \
    AWS_SES_REGION=us-east-1 \
    AWS_SES_FROM_EMAIL=noreply@huntaze.com \
    EMAIL_FROM=noreply@huntaze.com \
    NEXT_PUBLIC_GA_ID="<your-ga-id>"
```

---

## 🔍 Method 3: Using AWS Systems Manager (SSM) Parameter Store

Amplify automatically loads parameters from SSM if they exist at:
`/amplify/{app-id}/{branch-name}/`

Your current path: `/amplify/d33l77zi1h78ce/production-ready/`

Store sensitive values in SSM:

```bash
# Store DATABASE_URL securely
aws ssm put-parameter \
  --name "/amplify/d33l77zi1h78ce/production-ready/DATABASE_URL" \
  --value "postgresql://username:password@huntaze-postgres-production-encrypted.c2ryoow8c5m4.us-east-1.rds.amazonaws.com:5432/huntaze?sslmode=require" \
  --type "SecureString" \
  --overwrite

# Store NEXTAUTH_SECRET
aws ssm put-parameter \
  --name "/amplify/d33l77zi1h78ce/production-ready/NEXTAUTH_SECRET" \
  --value "$(openssl rand -base64 32)" \
  --type "SecureString" \
  --overwrite

# Store CSRF_SECRET
aws ssm put-parameter \
  --name "/amplify/d33l77zi1h78ce/production-ready/CSRF_SECRET" \
  --value "$(openssl rand -base64 32)" \
  --type "SecureString" \
  --overwrite
```

---

## ✅ Verify Setup

After adding environment variables, trigger a new build:

```bash
# Trigger rebuild via AWS CLI
aws amplify start-job \
  --app-id d33l77zi1h78ce \
  --branch-name production-ready \
  --job-type RELEASE
```

Or click **Redeploy this version** in the Amplify Console.

---

## 🐛 Troubleshooting

### Build still shows import warnings?

The warnings about `prisma` not being exported are now fixed. Redeploy to see the fix.

### Database connection timeout during build?

This is expected! The build sets `DISABLE_DATABASE=true` to prevent timeouts. The database is only used at runtime.

### Redis connection timeout during build?

Also expected! Redis is disabled during build with `DISABLE_REDIS_CACHE=true`.

### How to check current environment variables?

```bash
aws amplify get-branch \
  --app-id d33l77zi1h78ce \
  --branch-name production-ready \
  --query 'branch.environmentVariables'
```

---

## 📚 Related Documentation

- [Environment Variables Reference](./docs/ENVIRONMENT_VARIABLES.md)
- [AWS Amplify Setup](./docs/AMPLIFY_ENV_SETUP.md)
- [Database Configuration](./docs/DATABASE_SETUP.md)
- [Security Best Practices](./docs/SECURITY.md)

---

## 🎯 Quick Start Checklist

- [ ] Generate `NEXTAUTH_SECRET` with `openssl rand -base64 32`
- [ ] Generate `CSRF_SECRET` with `openssl rand -base64 32`
- [ ] Update `DATABASE_URL` with actual credentials
- [ ] Set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
- [ ] Configure `GEMINI_API_KEY` for AI features
- [ ] Set up AWS SES credentials for email
- [ ] Add Google OAuth credentials (if using)
- [ ] Configure Stripe keys (if using payments)
- [ ] Add all variables to Amplify Console
- [ ] Trigger a new deployment
- [ ] Verify build succeeds without import warnings
- [ ] Test the deployed application

---

**Need help?** Check the build logs in Amplify Console or run:
```bash
aws amplify get-job \
  --app-id d33l77zi1h78ce \
  --branch-name production-ready \
  --job-id <job-id>
```
