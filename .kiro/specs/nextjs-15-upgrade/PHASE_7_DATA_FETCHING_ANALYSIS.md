# Phase 7: Data Fetching Analysis

## Overview
Phase 7 focuses on reviewing and updating fetch() usage across the codebase to ensure proper caching strategies are in place for Next.js 15.

## Fetch Usage Categories

### 1. External API Calls (Should NOT be cached)
These are calls to third-party APIs that should always use `cache: 'no-store'`:

**Social Platform APIs:**
- `lib/services/tiktokOAuth.ts` - TikTok OAuth token exchange
- `lib/services/tiktokUpload.ts` - TikTok video upload
- `lib/services/instagramOAuth.ts` - Instagram/Facebook OAuth
- `lib/services/instagramPublish.ts` - Instagram media publishing
- `lib/services/redditOAuth.ts` - Reddit OAuth
- `lib/services/redditPublish.ts` - Reddit post submission
- `src/lib/integration/tiktok.ts` - TikTok integration
- `src/lib/integration/instagram.ts` - Instagram integration
- `src/lib/integration/reddit.ts` - Reddit integration
- `src/lib/integration/twitter.ts` - Twitter API calls

**AI Provider APIs:**
- `src/lib/ai/providers/openai.ts` - OpenAI API
- `src/lib/ai/providers/anthropic.ts` - Anthropic API
- `src/lib/ai/providers/azure.ts` - Azure OpenAI API

**Other External Services:**
- `lib/services/contentExtractor.ts` - Web scraping
- `lib/services/alertService.ts` - Webhook notifications
- `src/lib/of/proxy-manager.ts` - IP detection

### 2. Internal API Calls from Client Components
These are client-side fetch calls that should remain as-is (browser handles caching):

**Authentication:**
- `src/components/header-improved.tsx` - Auth status check
- `src/components/header-mobile-optimized.tsx` - Auth status check

**OnlyFans CRM:**
- `src/components/of/conversation-view.tsx` - Send messages
- `src/components/of/campaigns.tsx` - Campaign management

**UI Components:**
- Various dashboard and analytics components

### 3. Internal API Calls from Server Components
These need explicit caching configuration:

**Analytics Pages:**
- `app/analytics/advanced/page.tsx` - Already using proper fetch
- `app/analytics/page.tsx` - Already has `cache: 'no-store'`

**Dashboard Pages:**
- `app/fans/page.tsx` - Has `cache: 'no-store'`
- `app/campaigns/page.tsx` - Has `cache: 'no-store'`
- `app/monitoring/page.tsx` - Needs review
- `app/automations/page.tsx` - Has `cache: 'no-store'`

**Onboarding:**
- `app/onboarding/setup/page.tsx` - Client-side calls (OK)
- `app/onboarding/setup/page-old.tsx` - Has `cache: 'no-store'`

### 4. Service Worker Fetch Calls
These are in service workers and don't need changes:
- `public/sw.js`
- `public/sw-advanced.js`

## Caching Strategy

### Next.js 15 Fetch Caching Rules

1. **Default Behavior**: fetch() is cached by default in Next.js 15
2. **Dynamic Data**: Use `cache: 'no-store'` for real-time data
3. **Static Data**: Use `cache: 'force-cache'` for rarely changing data
4. **Revalidation**: Use `next: { revalidate: seconds }` for periodic updates

### Our Strategy

**External API Calls:**
- Add `cache: 'no-store'` to all third-party API calls
- These should never be cached as they involve authentication tokens and real-time data

**Internal API Calls (Server Components):**
- User profile data: `cache: 'no-store'` (user-specific)
- Analytics data: `cache: 'no-store'` (real-time metrics)
- CRM data: `cache: 'no-store'` (dynamic user data)
- Configuration: Could use short revalidation (60s)

**Client Component Calls:**
- No changes needed (browser handles caching)

## Implementation Plan

### Task 13.1: Review fetch caching ✅

**Files to Update:**

1. **lib/services/tiktokOAuth.ts** (4 fetch calls)
   - Token exchange: Add `cache: 'no-store'`
   - Refresh token: Add `cache: 'no-store'`
   - Revoke token: Add `cache: 'no-store'`
   - User info: Add `cache: 'no-store'`

2. **lib/services/tiktokUpload.ts** (3 fetch calls)
   - Init upload: Add `cache: 'no-store'`
   - Upload chunks: Add `cache: 'no-store'`
   - Query status: Add `cache: 'no-store'`

3. **lib/services/instagramOAuth.ts** (6 fetch calls)
   - Token exchange: Add `cache: 'no-store'`
   - Refresh token: Add `cache: 'no-store'`
   - Long-lived token: Add `cache: 'no-store'`
   - User info: Add `cache: 'no-store'`
   - IG account info: Add `cache: 'no-store'`
   - Revoke access: Add `cache: 'no-store'`

4. **lib/services/instagramPublish.ts** (4 fetch calls)
   - Create container: Add `cache: 'no-store'`
   - Check status: Add `cache: 'no-store'`
   - Publish: Add `cache: 'no-store'`
   - Get media: Add `cache: 'no-store'`

5. **lib/services/redditOAuth.ts** (4 fetch calls)
   - Token exchange: Add `cache: 'no-store'`
   - Refresh token: Add `cache: 'no-store'`
   - User info: Add `cache: 'no-store'`
   - Revoke token: Add `cache: 'no-store'`

6. **lib/services/redditPublish.ts** (4 fetch calls)
   - Submit post: Add `cache: 'no-store'`
   - Get post: Add `cache: 'no-store'`
   - Delete post: Add `cache: 'no-store'`
   - Edit post: Add `cache: 'no-store'`

7. **lib/services/contentExtractor.ts** (1 fetch call)
   - Extract content: Add `cache: 'no-store'`

8. **lib/services/tiktok.ts** (3 fetch calls)
   - Init upload: Add `cache: 'no-store'`
   - Upload video: Add `cache: 'no-store'`
   - Publish: Add `cache: 'no-store'`

9. **lib/services/alertService.ts** (1 fetch call)
   - Webhook: Add `cache: 'no-store'`

10. **src/lib/integration/** files (multiple)
    - All external API calls: Add `cache: 'no-store'`

11. **src/lib/ai/providers/** files (3)
    - OpenAI: Add `cache: 'no-store'`
    - Anthropic: Add `cache: 'no-store'`
    - Azure: Add `cache: 'no-store'`

12. **src/lib/platform-auth.ts** (2 fetch calls)
    - Token exchange: Add `cache: 'no-store'`

13. **src/lib/cache-manager.ts** (4 fetch calls)
    - Review caching logic (this is a cache manager, may need special handling)

### Task 13.2: Update revalidation

**No revalidation needed** - All our data is dynamic and user-specific, so we use `cache: 'no-store'` everywhere.

## Files NOT Requiring Changes

1. **Service Workers** (`public/sw.js`, `public/sw-advanced.js`)
   - These run in browser context, not Next.js

2. **Client Components** (all `'use client'` components)
   - Browser handles caching for client-side fetch

3. **API Routes** (already configured with `force-dynamic`)
   - Already handled in Phase 5

4. **Server Components with explicit cache** (already correct)
   - `app/analytics/page.tsx`
   - `app/fans/page.tsx`
   - etc.

## Testing Strategy

After implementing changes:

1. **Build Test**: Run `npm run build` to ensure no errors
2. **Runtime Test**: Test key flows:
   - TikTok OAuth and upload
   - Instagram OAuth and publish
   - Reddit OAuth and publish
   - Analytics data fetching
   - User profile loading
3. **Cache Verification**: Check that no stale data is served
4. **Performance**: Ensure no performance regression

## Expected Outcomes

- All external API calls explicitly marked as non-cacheable
- No stale data from third-party APIs
- Consistent behavior across all social platform integrations
- Build completes successfully
- All tests pass
