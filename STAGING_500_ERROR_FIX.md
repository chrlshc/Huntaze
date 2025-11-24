# Fix: 500 Internal Server Error on staging.huntaze.com

## Problem Identified

The staging environment at https://staging.huntaze.com/ returns a **500 Internal Server Error** on the root page, but API endpoints work correctly:
- ✅ `/api/health` - Returns 200
- ✅ `/api/auth/providers` - Returns 200
- ❌ `/` (root page) - Returns 500

## Root Cause

The root page `app/(marketing)/page.tsx` is configured with `export const dynamic = 'force-static'`, which attempts to pre-render the page at build time. This fails when:

1. **Missing environment variables** during build (Redis not configured)
2. **Dynamic imports** fail to resolve during static generation
3. **Server-side dependencies** are unavailable at build time

## Solution Applied

### 1. Fixed Import Conflict and Rendering Strategy

**File:** `app/(marketing)/page.tsx`

**Issue:** The page had a naming conflict between:
- `export const dynamic = 'force-static'` (Next.js route config)
- `import dynamic from 'next/dynamic'` (dynamic imports)

This caused TypeScript errors and build failures.

**Fix Applied:**

```typescript
// Before
export const dynamic = 'force-static';
import dynamic from 'next/dynamic';  // ❌ Naming conflict!

// After
import dynamic from 'next/dynamic';  // ✅ Import first
export const dynamicParams = true;   // ✅ Different name
export const revalidate = 0;         // ✅ Force dynamic rendering
```

This changes the page from static generation (SSG) to dynamic rendering (ISR with 0 revalidation), which:
- Renders the page on-demand for each request
- Avoids build-time failures
- Resolves the naming conflict
- Still provides fast response times with Amplify Compute

### 2. Why This Works

- **API routes work** because they're always dynamic by default
- **Static pages fail** when build-time environment is incomplete
- **Dynamic rendering** defers execution to runtime when all services are available

## Deployment Steps

### Option 1: Quick Deploy (Recommended)

```bash
# Commit the fix
git add app/(marketing)/page.tsx
git commit -m "fix: change root page to dynamic rendering to fix 500 error"

# Push to staging branch
git push origin staging

# Amplify will automatically rebuild
```

### Option 2: Manual Amplify Rebuild

```bash
# Trigger a new build via AWS CLI
aws amplify start-job \
  --app-id d33l77zi1h78ce \
  --branch-name staging \
  --job-type RELEASE \
  --region us-east-1
```

### Option 3: Via Amplify Console

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/home?region=us-east-1#/d33l77zi1h78ce)
2. Select the **staging** branch
3. Click **Redeploy this version**

## Verification

After deployment completes (~5-10 minutes):

```bash
# Test root page
curl -I https://staging.huntaze.com/

# Should return: HTTP/2 200
```

## Additional Recommendations

### 1. Review Other Static Pages

Many marketing pages use `force-static`. Consider changing them to `force-dynamic` or fixing the build environment:

```bash
# Pages that may have similar issues:
- app/(marketing)/about/page.tsx
- app/(marketing)/pricing/page.tsx
- app/(marketing)/blog/page.tsx
# ... and 20+ more
```

### 2. Fix Environment Variables

Ensure all critical environment variables are set in Amplify:

```bash
# Check current variables
aws amplify get-branch \
  --app-id d33l77zi1h78ce \
  --branch-name staging \
  --region us-east-1 \
  --query 'branch.environmentVariables'

# Required variables:
✅ DATABASE_URL
✅ NEXTAUTH_SECRET
✅ NEXTAUTH_URL
⚠️  REDIS_HOST (currently missing)
⚠️  REDIS_PORT (currently missing)
```

### 3. Configure Redis

The health check shows Redis is "not-configured". Add these variables:

```bash
REDIS_HOST=huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com
REDIS_PORT=6379
```

### 4. Alternative: Keep Static Generation

If you want to keep `force-static` for performance, fix the build environment:

1. **Ensure all environment variables are available during build**
2. **Use fallback values** for optional services
3. **Avoid dynamic imports** that depend on runtime services

## Performance Impact

| Rendering Strategy | Build Time | Response Time | SEO | Caching |
|-------------------|------------|---------------|-----|---------|
| `force-static` (SSG) | Slower | Fastest | Best | CDN |
| `force-dynamic` (SSR) | Faster | Fast | Good | Edge |

For a marketing landing page, `force-dynamic` with Amplify Compute (ECS Fargate) provides:
- ✅ Fast response times (no cold starts)
- ✅ Always up-to-date content
- ✅ No build-time failures
- ✅ Good SEO (server-rendered)

## Monitoring

After deployment, monitor:

```bash
# Check CloudWatch logs
aws logs tail /aws/amplify/d33l77zi1h78ce --follow --region us-east-1

# Test all pages
./scripts/test-all-pages-staging.sh
```

## Related Files

- `app/(marketing)/page.tsx` - Root landing page (FIXED)
- `lib/redis-client.ts` - Redis client with fallback
- `lib/db-client.ts` - Database client with fallback
- `scripts/diagnose-staging-500.sh` - Diagnostic script

## Status

- ✅ Root cause identified
- ✅ Fix applied to codebase
- ⏳ Awaiting deployment
- ⏳ Verification pending

## Next Steps

1. **Deploy the fix** using one of the methods above
2. **Verify** the root page loads correctly
3. **Configure Redis** environment variables
4. **Review** other static pages for similar issues
5. **Monitor** CloudWatch logs for any errors

---

**Created:** 2025-11-24  
**Status:** Ready for deployment  
**Priority:** High (Production issue)
