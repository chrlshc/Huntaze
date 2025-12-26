# AWS Amplify Build Fix - Missing NEXTAUTH_SECRET

## Problem
Build failed with error:
```
Error: NextAuth configuration invalid: NEXTAUTH_SECRET is required
```

## Root Cause
The `NEXTAUTH_SECRET` environment variable is not configured in AWS Amplify for the staging branch.

## Quick Fix (AWS Console)

### Option 1: AWS Amplify Console (Easiest)
1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Select your app: `d33l77zi1h78ce`
3. Click on the `staging` branch
4. Go to **Environment variables** section
5. Click **Manage variables**
6. Add these variables:

| Variable | Value |
|----------|-------|
| `NEXTAUTH_SECRET` | Generate with: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://staging.d33l77zi1h78ce.amplifyapp.com` |
| `JWT_SECRET` | Same as NEXTAUTH_SECRET or generate another |

7. Click **Save**
8. Trigger a new deployment (redeploy or push)

### Option 2: AWS CLI (Automated)

Run the interactive script:
```bash
./scripts/fix-amplify-env.sh
```

Or use direct AWS CLI commands:

```bash
# Generate secrets
NEXTAUTH_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)

# Set variables
aws amplify update-branch \
  --app-id d33l77zi1h78ce \
  --branch-name staging \
  --environment-variables \
    NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
    NEXTAUTH_URL="https://staging.d33l77zi1h78ce.amplifyapp.com" \
    JWT_SECRET="$JWT_SECRET"
```

### Option 3: Quick Manual Command

```bash
# 1. Generate a secret
openssl rand -base64 32

# 2. Copy the output and add it manually in AWS Console
# Or use this one-liner (replace YOUR_APP_ID and YOUR_BRANCH):

aws amplify update-branch \
  --app-id YOUR_APP_ID \
  --branch-name YOUR_BRANCH \
  --environment-variables \
    NEXTAUTH_SECRET="$(openssl rand -base64 32)" \
    NEXTAUTH_URL="https://YOUR_BRANCH.YOUR_APP_ID.amplifyapp.com" \
    JWT_SECRET="$(openssl rand -base64 32)"
```

## Verification

After adding the environment variables:

1. **Trigger a new build:**
   ```bash
   git commit --allow-empty -m "chore: trigger rebuild with NEXTAUTH_SECRET"
   git push origin staging
   ```

2. **Monitor the build:**
   - Go to AWS Amplify Console
   - Watch the build logs
   - Look for successful compilation

3. **Expected result:**
   - Build should complete successfully
   - No more "NEXTAUTH_SECRET is required" errors
   - Deployment should succeed

## Additional Missing Variables

While fixing this, also ensure these are set:

### Critical for NextAuth
- `NEXTAUTH_SECRET` - Required for session encryption
- `NEXTAUTH_URL` - Your app's public URL
- `JWT_SECRET` - For middleware authentication

### OAuth Providers (if using)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`
- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`
- `REDDIT_CLIENT_ID`
- `REDDIT_CLIENT_SECRET`

### Stripe (if using)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### Database/Cache
- `REDIS_URL` (if using Redis)
- Database connection strings

## Complete Environment Setup Script

For a complete setup including all OAuth credentials:
```bash
./scripts/configure-amplify-oauth.sh
```

## Troubleshooting

### If build still fails after adding NEXTAUTH_SECRET:

1. **Check the variable is actually set:**
   ```bash
   aws amplify get-branch \
     --app-id d33l77zi1h78ce \
     --branch-name staging \
     --query 'branch.environmentVariables'
   ```

2. **Verify the secret format:**
   - Should be a base64 string
   - At least 32 characters
   - No special characters that need escaping

3. **Check for typos:**
   - Variable name must be exactly `NEXTAUTH_SECRET`
   - Case sensitive

4. **Clear build cache:**
   - In AWS Amplify Console
   - Go to Build settings
   - Clear cache and redeploy

### If you see other missing variables:

Check the build logs for specific error messages and add those variables following the same process.

## Next Steps After Fix

1. ✅ Add NEXTAUTH_SECRET
2. ✅ Trigger new build
3. ✅ Verify build succeeds
4. ✅ Test the deployed application
5. ✅ Configure OAuth providers (if needed)
6. ✅ Set up monitoring and alerts

## Reference

- [NextAuth.js Environment Variables](https://next-auth.js.org/configuration/options#environment-variables)
- [AWS Amplify Environment Variables](https://docs.aws.amazon.com/amplify/latest/userguide/environment-variables.html)
- [Generating Secure Secrets](https://www.npmjs.com/package/next-auth#generating-a-secret)
