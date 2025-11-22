# Home Page Hydration Error Fix

## Issue
The `/home` page was causing a build failure during AWS Amplify deployment with the error:
```
TypeError: Cannot read properties of null (reading 'useState')
Export encountered an error on /(app)/home/page: /home
```

## Root Cause
The page was attempting to fetch data with `cache: 'no-store'` during static generation, but wasn't configured for dynamic rendering. This caused Next.js to try to prerender the page statically while the code required runtime data fetching.

## Solution
Added `export const dynamic = 'force-dynamic'` to the home page to explicitly configure it for dynamic rendering.

### Changes Made
**File: `app/(app)/home/page.tsx`**
- Added: `export const dynamic = 'force-dynamic';` after imports
- This tells Next.js to render this page dynamically at request time instead of attempting static generation

## Impact
- ✅ Build process will complete successfully
- ✅ Home page will render without hydration errors
- ✅ Data will be fetched at request time as intended
- ✅ Deployment to AWS Amplify will succeed

## Testing
The fix can be verified by:
1. Running `npm run build` locally
2. Checking that the build completes without errors
3. Verifying the home page renders correctly in production

## Related Pages
The following pages also use `cache: 'no-store'` and may need similar treatment if they encounter build issues:
- `app/(app)/fans/page.tsx`
- `app/automations/page.tsx`
- `app/campaigns/page.tsx`

Note: The beta page (`app/beta/page.tsx`) already has the correct configuration.
