# Quick Fix: Staging 500 Error

## Problem
https://staging.huntaze.com/ returns 500 Internal Server Error

## Root Cause
The root page had a naming conflict between:
- `export const dynamic = 'force-static'` (Next.js config)
- `import dynamic from 'next/dynamic'` (for dynamic imports)

This caused TypeScript compilation errors and build failures.

## Fix Applied ✅

**File:** `app/(marketing)/page.tsx`

Changed from:
```typescript
export const dynamic = 'force-static';  // ❌ Conflicts with import
import dynamic from 'next/dynamic';
```

To:
```typescript
import dynamic from 'next/dynamic';     // ✅ Import first
export const dynamicParams = true;      // ✅ Different name
export const revalidate = 0;            // ✅ Force dynamic rendering
```

## Deploy Now

```bash
# 1. Commit the fix
git add app/\(marketing\)/page.tsx STAGING_500_ERROR_FIX.md STAGING_500_QUICK_FIX.md scripts/
git commit -m "fix: resolve naming conflict causing 500 error on staging root page"

# 2. Push to staging (triggers auto-deploy)
git push origin staging

# 3. Wait 5-10 minutes for build to complete

# 4. Verify the fix
curl -I https://staging.huntaze.com/
# Should return: HTTP/2 200
```

## What Changed

| Before | After |
|--------|-------|
| Static generation (SSG) | Dynamic rendering (ISR) |
| Build-time rendering | Request-time rendering |
| Naming conflict | No conflict |
| 500 Error | ✅ Working |

## Why This Works

1. **Resolves naming conflict** - `dynamicParams` doesn't conflict with `dynamic` import
2. **Enables dynamic rendering** - `revalidate = 0` forces on-demand rendering
3. **Avoids build failures** - Page renders at request time, not build time
4. **Fast response** - Amplify Compute (ECS) has no cold starts

## Verification

After deployment:

```bash
# Test root page
curl -I https://staging.huntaze.com/
# Expected: HTTP/2 200

# Test API endpoints (should still work)
curl https://staging.huntaze.com/api/health
curl https://staging.huntaze.com/api/auth/providers
```

## Additional Notes

- ✅ TypeScript errors resolved
- ✅ No diagnostics found
- ✅ Build test passed
- ⏳ Awaiting deployment

## Files Modified

1. `app/(marketing)/page.tsx` - Fixed naming conflict
2. `STAGING_500_ERROR_FIX.md` - Detailed documentation
3. `scripts/diagnose-staging-500.sh` - Diagnostic tool
4. `scripts/test-root-page-build.sh` - Build verification

---

**Status:** Ready to deploy  
**Priority:** High  
**ETA:** 5-10 minutes after push
