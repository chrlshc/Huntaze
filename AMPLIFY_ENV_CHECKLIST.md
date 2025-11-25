# 🚀 Amplify Environment Variables - Quick Checklist

## ⚡ Quick Fix Applied

✅ **Fixed**: Import error for `prisma` from `@/lib/db-client` - now properly exported

## 📋 Minimum Required Variables (Copy-Paste Ready)

Go to: **AWS Amplify Console** → **huntaze** → **production-ready** → **Environment variables**

### 1️⃣ Core (Required)
```
NODE_ENV=production
AMPLIFY_ENV=production-ready
NEXT_PUBLIC_APP_URL=https://production-ready.d33l77zi1h78ce.amplifyapp.com
AUTH_TRUST_HOST=true
```

### 2️⃣ Database (Required)
```
DATABASE_URL=postgresql://username:password@huntaze-postgres-production-encrypted.c2ryoow8c5m4.us-east-1.rds.amazonaws.com:5432/huntaze?sslmode=require
```
⚠️ **Replace `username` and `password` with your actual RDS credentials**

### 3️⃣ Redis (Required)
```
REDIS_HOST=huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com
REDIS_PORT=6379
```

### 4️⃣ Authentication (Required - Generate These!)
```bash
# Run these commands to generate secrets:
openssl rand -base64 32  # Use for NEXTAUTH_SECRET
openssl rand -base64 32  # Use for CSRF_SECRET
```

Then add:
```
NEXTAUTH_URL=https://production-ready.d33l77zi1h78ce.amplifyapp.com
NEXTAUTH_SECRET=<paste-generated-secret-here>
CSRF_SECRET=<paste-generated-secret-here>
```

### 5️⃣ AWS (Required)
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-aws-access-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>
S3_BUCKET_NAME=huntaze-assets
S3_REGION=us-east-1
```

### 6️⃣ AI (Required for AI features)
```
GEMINI_API_KEY=<your-gemini-api-key>
```

### 7️⃣ Email/SES (Required for magic links)
```
AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=noreply@huntaze.com
AWS_SES_FROM_NAME=Huntaze
EMAIL_FROM=noreply@huntaze.com
EMAIL_SERVER_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=<your-ses-smtp-username>
EMAIL_SERVER_PASSWORD=<your-ses-smtp-password>
```

---

## 🎯 Optional Variables (Add if needed)

### Google OAuth
```
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-client-secret>
```

### Analytics
```
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Stripe
```
STRIPE_SECRET_KEY=sk_live_<your-key>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_<your-key>
STRIPE_WEBHOOK_SECRET=whsec_<your-secret>
```

---

## ✅ After Adding Variables

1. **Save** all environment variables in Amplify Console
2. **Trigger new deployment**:
   - Click "Redeploy this version" in Amplify Console
   - OR run: `aws amplify start-job --app-id d33l77zi1h78ce --branch-name production-ready --job-type RELEASE`
3. **Wait for build** to complete (~5-10 minutes)
4. **Verify** no import warnings in build logs
5. **Test** your deployed app

---

## 🐛 Current Build Issues

Your build log shows:
```
⚠ Compiled with warnings
Attempted import error: 'prisma' is not exported from '@/lib/db-client'
```

**Status**: ✅ **FIXED** - `prisma` is now properly exported from `lib/db-client.ts`

---

## 🔧 Quick Commands

### Generate secrets:
```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# CSRF_SECRET  
openssl rand -base64 32

# OF_SESSION_KEY (if using OnlyFans)
openssl rand -hex 16
```

### Check current env vars:
```bash
aws amplify get-branch \
  --app-id d33l77zi1h78ce \
  --branch-name production-ready \
  --query 'branch.environmentVariables'
```

### Trigger new build:
```bash
aws amplify start-job \
  --app-id d33l77zi1h78ce \
  --branch-name production-ready \
  --job-type RELEASE
```

---

## 📚 Full Documentation

- **Complete guide**: `AMPLIFY_ENV_VARS_SETUP.md`
- **Interactive setup**: Run `./scripts/setup-amplify-env.sh`
- **Environment reference**: `docs/ENVIRONMENT_VARIABLES.md`

---

## 🎉 Success Criteria

After setup, your build should:
- ✅ Complete without import warnings
- ✅ Show "Build completed successfully"
- ✅ Deploy to: `https://production-ready.d33l77zi1h78ce.amplifyapp.com`
- ✅ Connect to database at runtime (not during build)
- ✅ Connect to Redis at runtime (not during build)

**Note**: Database/Redis timeouts during build are EXPECTED and NORMAL. They're disabled during build with `DISABLE_DATABASE=true` and `DISABLE_REDIS_CACHE=true`.
