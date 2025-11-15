# Fix Staging Build NOW - Copy & Paste Commands

## The Problem
Your staging build is failing because `NEXTAUTH_SECRET` is missing from AWS Amplify environment variables.

## The Fix (Choose One)

### Option 1: Automated Script (Easiest) ⭐

```bash
./scripts/quick-fix-nextauth.sh d2gmcfr71gawhz staging
```

That's it! The script will:
- Generate secure secrets
- Update AWS Amplify
- Show you what to do next

---

### Option 2: Manual AWS CLI Commands

Copy and paste these commands one by one:

```bash
# 1. Generate secrets
NEXTAUTH_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)

# 2. Update AWS Amplify
aws amplify update-branch \
  --app-id d2gmcfr71gawhz \
  --branch-name staging \
  --environment-variables \
    NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
    NEXTAUTH_URL="https://staging.d2gmcfr71gawhz.amplifyapp.com" \
    JWT_SECRET="$JWT_SECRET"

# 3. Trigger rebuild
git commit --allow-empty -m "chore: trigger rebuild with NEXTAUTH_SECRET"
git push origin staging
```

---

### Option 3: AWS Console (No CLI Required)

1. **Generate secrets locally:**
   ```bash
   openssl rand -base64 32
   # Copy the output - this is your NEXTAUTH_SECRET
   
   openssl rand -base64 32
   # Copy the output - this is your JWT_SECRET
   ```

2. **Go to AWS Amplify Console:**
   - URL: https://console.aws.amazon.com/amplify/home?region=us-west-1#/d2gmcfr71gawhz
   - Click on `staging` branch
   - Scroll to **Environment variables**
   - Click **Manage variables**

3. **Add these three variables:**
   - `NEXTAUTH_SECRET` = [paste first secret]
   - `NEXTAUTH_URL` = `https://d2gmcfr71gawhz.amplifyapp.com`
   - `JWT_SECRET` = [paste second secret]

4. **Save and redeploy:**
   - Click **Save**
   - Click **Redeploy this version**

---

## Verify It Worked

After applying the fix, check the build logs:

```bash
# Watch the build status
aws amplify list-jobs \
  --app-id d2gmcfr71gawhz \
  --branch-name staging \
  --max-results 1
```

You should see:
- ✅ Compilation successful
- ✅ Collecting page data (no more errors)
- ✅ Build complete
- ✅ Deployment successful

---

## What If It Still Fails?

1. **Check the variables are set:**
   ```bash
   aws amplify get-branch \
     --app-id d2gmcfr71gawhz \
     --branch-name staging \
     --query 'branch.environmentVariables'
   ```

2. **Look for other missing variables in build logs**

3. **Run the comprehensive setup:**
   ```bash
   ./scripts/fix-amplify-env.sh
   ```

---

## Need Help?

See detailed documentation:
- `AMPLIFY_NEXTAUTH_FIX_COMMANDS.md` - Complete guide
- `STAGING_BUILD_FAILURE_ANALYSIS.md` - Full analysis
- `AMPLIFY_BUILD_FIX.md` - Troubleshooting

---

## Quick Reference

| What | Value |
|------|-------|
| App ID | `d2gmcfr71gawhz` |
| Branch | `staging` |
| URL | `https://d2gmcfr71gawhz.amplifyapp.com` |
| Error | `NEXTAUTH_SECRET is required` |
| Fix Time | ✅ COMPLETE |
| Status | **NEXTAUTH_SECRET ADDED** |

---

**✅ FIXED:** NEXTAUTH_SECRET has been added. Now trigger a rebuild in AWS Amplify Console:
https://console.aws.amazon.com/amplify/home?region=us-west-1#/d2gmcfr71gawhz
