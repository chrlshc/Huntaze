# AWS Amplify - NEXTAUTH_SECRET Fix Commands

## Problem Summary
Build failing at "Collecting page data" stage with:
```
Error: NextAuth configuration invalid: NEXTAUTH_SECRET is required
```

The NextAuth configuration in `app/api/auth/[...nextauth]/route.ts` validates `NEXTAUTH_SECRET` on module load, causing the build to fail when this environment variable is missing.

## Quick Fix - Copy & Paste Commands

### Step 1: Generate Secrets
```bash
# Generate NEXTAUTH_SECRET (32+ characters required)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "NEXTAUTH_SECRET: $NEXTAUTH_SECRET"

# Generate JWT_SECRET (for middleware)
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET: $JWT_SECRET"
```

### Step 2: Set Environment Variables in AWS Amplify

#### For Staging Branch:
```bash
aws amplify update-branch \
  --app-id d33l77zi1h78ce \
  --branch-name staging \
  --environment-variables \
    NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
    NEXTAUTH_URL="https://staging.d33l77zi1h78ce.amplifyapp.com" \
    JWT_SECRET="$JWT_SECRET"
```

#### For Main/Production Branch:
```bash
aws amplify update-branch \
  --app-id d33l77zi1h78ce \
  --branch-name main \
  --environment-variables \
    NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
    NEXTAUTH_URL="https://main.d33l77zi1h78ce.amplifyapp.com" \
    JWT_SECRET="$JWT_SECRET"
```

### Step 3: Verify Environment Variables
```bash
# Check staging
aws amplify get-branch \
  --app-id d33l77zi1h78ce \
  --branch-name staging \
  --query 'branch.environmentVariables' \
  --output json

# Check main
aws amplify get-branch \
  --app-id d33l77zi1h78ce \
  --branch-name main \
  --query 'branch.environmentVariables' \
  --output json
```

### Step 4: Trigger Rebuild
```bash
# Option A: Empty commit (recommended)
git commit --allow-empty -m "chore: trigger rebuild with NEXTAUTH_SECRET"
git push origin staging

# Option B: Start build via AWS CLI
aws amplify start-job \
  --app-id d33l77zi1h78ce \
  --branch-name staging \
  --job-type RELEASE
```

## Alternative: AWS Console Method

If you prefer using the AWS Console:

1. Go to: https://console.aws.amazon.com/amplify/home
2. Select app: `d33l77zi1h78ce`
3. Click on branch: `staging`
4. Scroll to **Environment variables**
5. Click **Manage variables**
6. Add these three variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 32` | Required - 32+ chars |
| `NEXTAUTH_URL` | `https://staging.d33l77zi1h78ce.amplifyapp.com` | Your app URL |
| `JWT_SECRET` | Generate with `openssl rand -base64 32` | For middleware auth |

7. Click **Save**
8. Click **Redeploy this version** or push new commit

## Verification Checklist

After setting environment variables:

- [ ] Environment variables are visible in AWS Amplify Console
- [ ] NEXTAUTH_SECRET is at least 32 characters
- [ ] NEXTAUTH_URL matches your Amplify app URL
- [ ] JWT_SECRET is set
- [ ] New build triggered
- [ ] Build passes "Collecting page data" stage
- [ ] Build completes successfully
- [ ] Deployment succeeds

## Expected Build Output

After fix, you should see:
```
✓ Compiled successfully in 28.7s
Collecting page data using 3 workers ...
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

No more "NextAuth configuration invalid" errors.

## Additional Environment Variables

While fixing this, consider adding other required variables:

### Authentication (Google OAuth - Optional)
```bash
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Social Media OAuth (if using)
```bash
# TikTok
TIKTOK_CLIENT_KEY="your-tiktok-client-key"
TIKTOK_CLIENT_SECRET="your-tiktok-client-secret"

# Instagram/Facebook
FACEBOOK_APP_ID="your-facebook-app-id"
FACEBOOK_APP_SECRET="your-facebook-app-secret"

# Reddit
REDDIT_CLIENT_ID="your-reddit-client-id"
REDDIT_CLIENT_SECRET="your-reddit-client-secret"
REDDIT_USER_AGENT="Huntaze/1.0"
```

### Stripe (if using)
```bash
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
```

## Troubleshooting

### Build still fails after adding NEXTAUTH_SECRET

1. **Verify the variable is actually set:**
   ```bash
   aws amplify get-branch \
     --app-id d33l77zi1h78ce \
     --branch-name staging \
     --query 'branch.environmentVariables.NEXTAUTH_SECRET'
   ```

2. **Check for typos:**
   - Variable name must be exactly `NEXTAUTH_SECRET` (case-sensitive)
   - No extra spaces or quotes

3. **Verify secret length:**
   ```bash
   echo -n "$NEXTAUTH_SECRET" | wc -c
   # Should output 32 or more
   ```

4. **Clear build cache:**
   - In AWS Amplify Console
   - Go to Build settings
   - Clear cache and redeploy

### AWS CLI not working

1. **Check AWS credentials:**
   ```bash
   aws sts get-caller-identity
   ```

2. **Configure AWS CLI:**
   ```bash
   aws configure
   ```

3. **Check permissions:**
   - Your IAM user/role needs `amplify:UpdateBranch` permission

### Can't find App ID

```bash
# List all Amplify apps
aws amplify list-apps --query 'apps[*].[name,appId]' --output table
```

## Complete Setup Script

For a fully automated setup:

```bash
# Run the interactive script
./scripts/fix-amplify-env.sh

# Or use the OAuth configuration script
./scripts/configure-amplify-oauth.sh
```

## Next Steps After Fix

1. ✅ Verify build succeeds
2. ✅ Test authentication flows
3. ✅ Configure OAuth providers (if needed)
4. ✅ Set up monitoring
5. ✅ Test staging deployment
6. ✅ Promote to production

## Support

If you continue to have issues:

1. Check build logs in AWS Amplify Console
2. Look for other missing environment variables
3. Verify NextAuth configuration in `app/api/auth/[...nextauth]/route.ts`
4. Check middleware configuration
5. Review `.env.production` for required variables

## References

- [NextAuth.js Environment Variables](https://next-auth.js.org/configuration/options#environment-variables)
- [AWS Amplify Environment Variables](https://docs.aws.amazon.com/amplify/latest/userguide/environment-variables.html)
- [Generating Secure Secrets](https://next-auth.js.org/configuration/options#secret)
