# Emergency Minimal NextAuth Fallback

**Use this if the full NextAuth implementation continues to fail with 500 errors**

## Quick Fix (2 minutes)

### Step 1: Backup Current File
```bash
cp app/api/auth/\[...nextauth\]/route.ts app/api/auth/\[...nextauth\]/route.full.ts.backup
```

### Step 2: Replace with Minimal Version
```bash
cp app/api/auth/\[...nextauth\]/route.minimal.ts.backup app/api/auth/\[...nextauth\]/route.ts
```

### Step 3: Deploy
```bash
git add app/api/auth/\[...nextauth\]/route.ts
git commit -m "Emergency: Switch to minimal NextAuth implementation"
git push origin staging
```

### Step 4: Wait & Test (3-5 minutes)
```bash
# Wait for deployment
aws amplify list-jobs --app-id d33l77zi1h78ce --branch-name staging --region us-east-1 --max-results 1

# Test
curl -I https://staging.huntaze.com/api/auth/signin
```

## What This Minimal Version Does

✅ **Includes:**
- Google OAuth authentication
- JWT session strategy
- Basic NextAuth configuration
- Proper runtime configuration

❌ **Excludes:**
- Credentials provider (email/password login)
- Database authentication
- Custom error handling
- Retry logic
- Timeout handling
- Correlation IDs
- Custom logging

## Impact

### Users Can:
- ✅ Sign in with Google
- ✅ Access protected pages
- ✅ Maintain sessions

### Users Cannot:
- ❌ Sign in with email/password
- ❌ Register new accounts via credentials
- ❌ See detailed error messages

## Temporary Workaround for Email/Password

If users need email/password authentication:

1. They can use Google OAuth for now
2. We can add a separate `/api/auth/login` endpoint later
3. Or fix the full implementation and redeploy

## Restoring Full Version

Once the issue is identified and fixed:

```bash
# Restore full version
cp app/api/auth/\[...nextauth\]/route.full.ts.backup app/api/auth/\[...nextauth\]/route.ts

# Deploy
git add app/api/auth/\[...nextauth\]/route.ts
git commit -m "Restore full NextAuth implementation with fixes"
git push origin staging
```

## Why This Might Work

The minimal version removes:
1. **Database imports** - No `@/lib/db` import that might fail
2. **Complex error handling** - No custom error wrapper
3. **Timeout logic** - No `withTimeout` wrapper
4. **Credentials provider** - No async database calls in authorize()

If this works, it means the problem is in one of these removed features.

## Decision Tree

```
Is minimal version working?
├─ YES → Problem is in removed features
│   ├─ Add features back one by one
│   ├─ Test after each addition
│   └─ Identify the problematic feature
│
└─ NO → Problem is more fundamental
    ├─ Check NextAuth v4 compatibility with Next.js 16
    ├─ Check Amplify runtime configuration
    └─ Consider NextAuth v5 migration
```

## Files

- **Current (full):** `app/api/auth/[...nextauth]/route.ts`
- **Minimal (backup):** `app/api/auth/[...nextauth]/route.minimal.ts.backup`
- **Full (backup):** `app/api/auth/[...nextauth]/route.full.ts.backup` (after step 1)

## When to Use This

Use this emergency fallback if:
- ⏰ Deploy 126 (with logging) still shows 500 errors
- 🔍 Logs don't reveal the root cause
- ⚡ You need authentication working ASAP
- 🎯 Google OAuth is acceptable temporarily

## When NOT to Use This

Don't use if:
- ✅ Deploy 126 logs show the exact problem
- 🛠️ You have a specific fix to apply
- 📧 Email/password login is critical right now
- 🔒 You need the custom security features
