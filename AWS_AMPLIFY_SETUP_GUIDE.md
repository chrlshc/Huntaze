# 🚀 AWS Amplify Setup Guide - Huntaze Beta Launch

**Date:** 2024-11-14  
**Purpose:** Configure OAuth credentials in AWS Amplify for production deployment

---

## 📋 Prerequisites

- ✅ AWS Account with Amplify access
- ✅ AWS CLI installed and configured
- ✅ OAuth credentials from TikTok, Instagram (Facebook), and Reddit
- ✅ Amplify App already created

---

## 🔍 Step 1: Find Your Amplify App ID

### Option A: Using AWS Console
1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click on your app (Huntaze)
3. Copy the App ID from the URL or app details

### Option B: Using AWS CLI
```bash
aws amplify list-apps --query 'apps[*].[name,appId]' --output table
```

**Your App ID:** `d2yx5aqwvvvvvv` (example - replace with actual)

---

## 🔑 Step 2: Prepare OAuth Credentials

### TikTok Credentials
Get from: [TikTok Developer Portal](https://developers.tiktok.com/)

```bash
TIKTOK_CLIENT_KEY="your_client_key"
TIKTOK_CLIENT_SECRET="your_client_secret"
TIKTOK_REDIRECT_URI="https://huntaze.com/api/auth/tiktok/callback"
```

### Instagram (Facebook) Credentials
Get from: [Facebook Developers](https://developers.facebook.com/)

```bash
FACEBOOK_APP_ID="your_app_id"
FACEBOOK_APP_SECRET="your_app_secret"
INSTAGRAM_REDIRECT_URI="https://huntaze.com/api/auth/instagram/callback"
```

### Reddit Credentials
Get from: [Reddit Apps](https://www.reddit.com/prefs/apps)

```bash
REDDIT_CLIENT_ID="your_client_id"
REDDIT_CLIENT_SECRET="your_client_secret"
REDDIT_REDIRECT_URI="https://huntaze.com/api/auth/reddit/callback"
REDDIT_USER_AGENT="Huntaze/1.0"
```

---

## ⚙️ Step 3: Configure Environment Variables

### Option A: Using AWS Amplify Console (Recommended)

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Select your app (Huntaze)
3. Click on "Environment variables" in the left menu
4. Click "Manage variables"
5. Add each variable:

**TikTok:**
- Key: `TIKTOK_CLIENT_KEY` → Value: `your_client_key`
- Key: `TIKTOK_CLIENT_SECRET` → Value: `your_client_secret`
- Key: `TIKTOK_REDIRECT_URI` → Value: `https://huntaze.com/api/auth/tiktok/callback`

**Instagram:**
- Key: `FACEBOOK_APP_ID` → Value: `your_app_id`
- Key: `FACEBOOK_APP_SECRET` → Value: `your_app_secret`
- Key: `INSTAGRAM_REDIRECT_URI` → Value: `https://huntaze.com/api/auth/instagram/callback`

**Reddit:**
- Key: `REDDIT_CLIENT_ID` → Value: `your_client_id`
- Key: `REDDIT_CLIENT_SECRET` → Value: `your_client_secret`
- Key: `REDDIT_REDIRECT_URI` → Value: `https://huntaze.com/api/auth/reddit/callback`
- Key: `REDDIT_USER_AGENT` → Value: `Huntaze/1.0`

6. Click "Save"

### Option B: Using AWS CLI

```bash
# Set your App ID and Branch
APP_ID="d2yx5aqwvvvvvv"
BRANCH="main"

# TikTok
aws amplify update-branch \
  --app-id $APP_ID \
  --branch-name $BRANCH \
  --environment-variables \
    TIKTOK_CLIENT_KEY="your_client_key" \
    TIKTOK_CLIENT_SECRET="your_client_secret" \
    TIKTOK_REDIRECT_URI="https://huntaze.com/api/auth/tiktok/callback"

# Instagram
aws amplify update-branch \
  --app-id $APP_ID \
  --branch-name $BRANCH \
  --environment-variables \
    FACEBOOK_APP_ID="your_app_id" \
    FACEBOOK_APP_SECRET="your_app_secret" \
    INSTAGRAM_REDIRECT_URI="https://huntaze.com/api/auth/instagram/callback"

# Reddit
aws amplify update-branch \
  --app-id $APP_ID \
  --branch-name $BRANCH \
  --environment-variables \
    REDDIT_CLIENT_ID="your_client_id" \
    REDDIT_CLIENT_SECRET="your_client_secret" \
    REDDIT_REDIRECT_URI="https://huntaze.com/api/auth/reddit/callback" \
    REDDIT_USER_AGENT="Huntaze/1.0"
```

### Option C: Using Bulk Update Script

Create a file `amplify-env-vars.json`:

```json
{
  "TIKTOK_CLIENT_KEY": "your_client_key",
  "TIKTOK_CLIENT_SECRET": "your_client_secret",
  "TIKTOK_REDIRECT_URI": "https://huntaze.com/api/auth/tiktok/callback",
  "FACEBOOK_APP_ID": "your_app_id",
  "FACEBOOK_APP_SECRET": "your_app_secret",
  "INSTAGRAM_REDIRECT_URI": "https://huntaze.com/api/auth/instagram/callback",
  "REDDIT_CLIENT_ID": "your_client_id",
  "REDDIT_CLIENT_SECRET": "your_client_secret",
  "REDDIT_REDIRECT_URI": "https://huntaze.com/api/auth/reddit/callback",
  "REDDIT_USER_AGENT": "Huntaze/1.0"
}
```

Then run:

```bash
APP_ID="d2yx5aqwvvvvvv"
BRANCH="main"

aws amplify update-branch \
  --app-id $APP_ID \
  --branch-name $BRANCH \
  --environment-variables file://amplify-env-vars.json
```

---

## ✅ Step 4: Verify Configuration

### Using Our Check Script

```bash
# Update the script with your App ID first
# Edit scripts/check-amplify-env.sh and set AMPLIFY_APP_ID

# Then run:
./scripts/check-amplify-env.sh
```

**Expected Output:**
```
🔍 Checking AWS Amplify Environment Variables...
================================================

✅ AWS CLI found

📋 Checking environment variables for app: d2yx5aqwvvvvvv, branch: main

🔍 Checking required OAuth variables:

✅ TIKTOK_CLIENT_KEY - Configured
✅ TIKTOK_CLIENT_SECRET - Configured
✅ TIKTOK_REDIRECT_URI - Configured
✅ FACEBOOK_APP_ID - Configured
✅ FACEBOOK_APP_SECRET - Configured
✅ INSTAGRAM_REDIRECT_URI - Configured
✅ REDDIT_CLIENT_ID - Configured
✅ REDDIT_CLIENT_SECRET - Configured
✅ REDDIT_REDIRECT_URI - Configured
✅ REDDIT_USER_AGENT - Configured

================================================
📊 Summary:
   Configured: 10/10
   Missing: 0/10

🎉 All OAuth credentials are configured!
✅ Ready for deployment
```

### Manual Verification

```bash
APP_ID="d2yx5aqwvvvvvv"
BRANCH="main"

aws amplify get-branch \
  --app-id $APP_ID \
  --branch-name $BRANCH \
  --query 'branch.environmentVariables' \
  --output json
```

---

## 🚀 Step 5: Trigger Deployment

### Option A: Automatic (on git push)

```bash
git add .
git commit -m "feat: configure OAuth credentials for production"
git push origin main
```

Amplify will automatically detect the push and start building.

### Option B: Manual Trigger

```bash
APP_ID="d2yx5aqwvvvvvv"
BRANCH="main"

aws amplify start-job \
  --app-id $APP_ID \
  --branch-name $BRANCH \
  --job-type RELEASE
```

---

## 🔍 Step 6: Monitor Deployment

### Using AWS Console

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Select your app
3. Click on the branch (main)
4. Watch the build progress

### Using AWS CLI

```bash
APP_ID="d2yx5aqwvvvvvv"
BRANCH="main"

# Get latest job
aws amplify list-jobs \
  --app-id $APP_ID \
  --branch-name $BRANCH \
  --max-results 1
```

---

## ✅ Step 7: Test OAuth Flows

Once deployed, test each OAuth integration:

### Test TikTok
```bash
curl https://huntaze.com/api/validation/credentials \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "tiktok",
    "credentials": {
      "clientKey": "your_key",
      "clientSecret": "your_secret",
      "redirectUri": "https://huntaze.com/api/auth/tiktok/callback"
    }
  }'
```

### Test Instagram
```bash
curl https://huntaze.com/api/validation/credentials \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "instagram",
    "credentials": {
      "appId": "your_id",
      "appSecret": "your_secret",
      "redirectUri": "https://huntaze.com/api/auth/instagram/callback"
    }
  }'
```

### Test Reddit
```bash
curl https://huntaze.com/api/validation/credentials \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "reddit",
    "credentials": {
      "clientId": "your_id",
      "clientSecret": "your_secret",
      "redirectUri": "https://huntaze.com/api/auth/reddit/callback",
      "userAgent": "Huntaze/1.0"
    }
  }'
```

### Check Overall Health
```bash
curl https://huntaze.com/api/validation/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "platforms": [
    { "platform": "tiktok", "status": "healthy" },
    { "platform": "instagram", "status": "healthy" },
    { "platform": "reddit", "status": "healthy" }
  ],
  "summary": {
    "total": 3,
    "healthy": 3,
    "unhealthy": 0
  }
}
```

---

## 🔒 Security Best Practices

### ✅ Do's
- ✅ Use environment variables for all secrets
- ✅ Never commit credentials to git
- ✅ Rotate credentials regularly
- ✅ Use different credentials for staging/production
- ✅ Monitor OAuth validation health endpoint

### ❌ Don'ts
- ❌ Don't hardcode credentials in code
- ❌ Don't share credentials in Slack/email
- ❌ Don't use production credentials in development
- ❌ Don't commit `.env` files
- ❌ Don't expose credentials in logs

---

## 🐛 Troubleshooting

### Issue: "Failed to get Amplify environment variables"

**Solution:**
1. Check AWS credentials are configured:
   ```bash
   aws sts get-caller-identity
   ```
2. Verify App ID is correct
3. Check you have Amplify permissions

### Issue: "OAuth validation fails"

**Solution:**
1. Verify credentials are correct in OAuth provider dashboard
2. Check redirect URIs match exactly
3. Test with validation endpoint:
   ```bash
   curl https://huntaze.com/api/validation/health
   ```

### Issue: "Build fails after adding env vars"

**Solution:**
1. Check for typos in variable names
2. Verify all required variables are set
3. Check Amplify build logs for specific errors

---

## 📋 Checklist

### Pre-Deployment
- [ ] All OAuth credentials obtained
- [ ] Redirect URIs configured in OAuth providers
- [ ] Environment variables set in Amplify
- [ ] Verification script passes
- [ ] Build succeeds locally

### Post-Deployment
- [ ] Deployment completes successfully
- [ ] Health endpoint returns "healthy"
- [ ] Each OAuth flow tested manually
- [ ] No errors in Amplify logs
- [ ] Monitoring configured

---

## 🎉 Success!

Once all checks pass, your Huntaze app is ready for beta launch with full OAuth integration! 🚀

**Next Steps:**
1. Monitor health endpoint regularly
2. Set up alerts for OAuth failures
3. Collect user feedback
4. Iterate and improve

---

**Status:** Ready for Production  
**OAuth Platforms:** 3/3 Configured  
**Deployment:** Automated via Amplify

**🚀 READY TO LAUNCH! 🎉**
