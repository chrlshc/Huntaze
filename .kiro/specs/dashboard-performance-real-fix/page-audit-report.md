# Page Data Requirements Audit Report

**Generated:** 11/26/2025, 6:22:35 PM

## Summary

- **Total Pages:** 98
- **Real-Time Data Pages:** 23
- **User-Specific Pages:** 7
- **Static Pages:** 68
- **Pages with force-dynamic:** 51

## 🔴 Real-Time Data Pages (Keep Dynamic)

These pages fetch frequently changing data and should remain dynamic:


### /app/(app)/analytics/page.tsx

- **Reason:** Fetches real-time data from API or database
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Keep dynamic rendering
  - Add SWR caching with appropriate dedupingInterval
  - Consider stale-while-revalidate strategy


### /app/(app)/automations/page.tsx

- **Reason:** Fetches real-time data from API or database
- **Has force-dynamic:** ✅
- **Recommendations:**
  - Keep dynamic rendering
  - Add SWR caching with appropriate dedupingInterval
  - Consider stale-while-revalidate strategy


### /app/(app)/billing/packs/page.tsx

- **Reason:** Fetches real-time data from API or database
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Keep dynamic rendering
  - Add SWR caching with appropriate dedupingInterval
  - Consider stale-while-revalidate strategy


### /app/(app)/campaigns/page.tsx

- **Reason:** Fetches real-time data from API or database
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Keep dynamic rendering
  - Add SWR caching with appropriate dedupingInterval
  - Consider stale-while-revalidate strategy


### /app/(app)/chatbot/page.tsx

- **Reason:** Fetches real-time data from API or database
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Keep dynamic rendering
  - Add SWR caching with appropriate dedupingInterval
  - Consider stale-while-revalidate strategy


### /app/(app)/complete-onboarding/page.tsx

- **Reason:** Fetches real-time data from API or database
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Keep dynamic rendering
  - Add SWR caching with appropriate dedupingInterval
  - Consider stale-while-revalidate strategy


### /app/(app)/configure/page.tsx

- **Reason:** Fetches real-time data from API or database
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Keep dynamic rendering
  - Add SWR caching with appropriate dedupingInterval
  - Consider stale-while-revalidate strategy


### /app/(app)/content/page.tsx

- **Reason:** Fetches real-time data from API or database
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Keep dynamic rendering
  - Add SWR caching with appropriate dedupingInterval
  - Consider stale-while-revalidate strategy


### /app/(app)/dashboard/page.tsx

- **Reason:** Fetches real-time data from API or database
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Keep dynamic rendering
  - Add SWR caching with appropriate dedupingInterval
  - Consider stale-while-revalidate strategy


### /app/(app)/diagnostics/page.tsx

- **Reason:** Fetches real-time data from API or database
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Keep dynamic rendering
  - Add SWR caching with appropriate dedupingInterval
  - Consider stale-while-revalidate strategy


### /app/(app)/fans/page.tsx

- **Reason:** Fetches real-time data from API or database
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Keep dynamic rendering
  - Add SWR caching with appropriate dedupingInterval
  - Consider stale-while-revalidate strategy


### /app/(app)/home/layout.tsx

- **Reason:** Fetches real-time data from API or database
- **Has force-dynamic:** ✅
- **Recommendations:**
  - Keep dynamic rendering
  - Add SWR caching with appropriate dedupingInterval
  - Consider stale-while-revalidate strategy


### /app/(app)/home/page.tsx

- **Reason:** Fetches real-time data from API or database
- **Has force-dynamic:** ✅
- **Recommendations:**
  - Keep dynamic rendering
  - Add SWR caching with appropriate dedupingInterval
  - Consider stale-while-revalidate strategy


### /app/(app)/marketing/campaigns/[id]/page.tsx

- **Reason:** Fetches real-time data from API or database
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Keep dynamic rendering
  - Add SWR caching with appropriate dedupingInterval
  - Consider stale-while-revalidate strategy


### /app/(app)/menu/page.tsx

- **Reason:** Fetches real-time data from API or database
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Keep dynamic rendering
  - Add SWR caching with appropriate dedupingInterval
  - Consider stale-while-revalidate strategy


### /app/(app)/of-connect/cookies/page.tsx

- **Reason:** Fetches real-time data from API or database
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Keep dynamic rendering
  - Add SWR caching with appropriate dedupingInterval
  - Consider stale-while-revalidate strategy


### /app/(app)/onboarding/dashboard/page.tsx

- **Reason:** Fetches real-time data from API or database
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Keep dynamic rendering
  - Add SWR caching with appropriate dedupingInterval
  - Consider stale-while-revalidate strategy


### /app/(app)/onboarding/optimize/page.tsx

- **Reason:** Fetches real-time data from API or database
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Keep dynamic rendering
  - Add SWR caching with appropriate dedupingInterval
  - Consider stale-while-revalidate strategy


### /app/(app)/onboarding/wizard/page.tsx

- **Reason:** Fetches real-time data from API or database
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Keep dynamic rendering
  - Add SWR caching with appropriate dedupingInterval
  - Consider stale-while-revalidate strategy


### /app/(app)/repost/page.tsx

- **Reason:** Fetches real-time data from API or database
- **Has force-dynamic:** ✅
- **Recommendations:**
  - Keep dynamic rendering
  - Add SWR caching with appropriate dedupingInterval
  - Consider stale-while-revalidate strategy


### /app/(app)/schedule/page.tsx

- **Reason:** Fetches real-time data from API or database
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Keep dynamic rendering
  - Add SWR caching with appropriate dedupingInterval
  - Consider stale-while-revalidate strategy


### /app/(app)/skip-onboarding/page.tsx

- **Reason:** Fetches real-time data from API or database
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Keep dynamic rendering
  - Add SWR caching with appropriate dedupingInterval
  - Consider stale-while-revalidate strategy


### /app/(app)/social/tiktok/upload/page.tsx

- **Reason:** Fetches real-time data from API or database
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Keep dynamic rendering
  - Add SWR caching with appropriate dedupingInterval
  - Consider stale-while-revalidate strategy


## 🟡 User-Specific Pages (Selective Dynamic)

These pages need user authentication but could benefit from partial caching:


### /app/(app)/marketing/page.tsx

- **Reason:** Requires user authentication or user-specific data
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Use dynamic rendering for this page only
  - Cache user-independent parts with React Server Components
  - Add revalidate: 60 for semi-static content


### /app/(app)/messages/page.tsx

- **Reason:** Requires user authentication or user-specific data
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Use dynamic rendering for this page only
  - Cache user-independent parts with React Server Components
  - Add revalidate: 60 for semi-static content


### /app/(app)/of-analytics/page.tsx

- **Reason:** Requires user authentication or user-specific data
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Use dynamic rendering for this page only
  - Cache user-independent parts with React Server Components
  - Add revalidate: 60 for semi-static content


### /app/(app)/of-messages/page.tsx

- **Reason:** Requires user authentication or user-specific data
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Use dynamic rendering for this page only
  - Cache user-independent parts with React Server Components
  - Add revalidate: 60 for semi-static content


### /app/(app)/onboarding/huntaze/page.tsx

- **Reason:** Requires user authentication or user-specific data
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Use dynamic rendering for this page only
  - Cache user-independent parts with React Server Components
  - Add revalidate: 60 for semi-static content


### /app/(app)/onlyfans-assisted/page.tsx

- **Reason:** Requires user authentication or user-specific data
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Use dynamic rendering for this page only
  - Cache user-independent parts with React Server Components
  - Add revalidate: 60 for semi-static content


### /app/(app)/revenue/page.tsx

- **Reason:** Requires user authentication or user-specific data
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Use dynamic rendering for this page only
  - Cache user-independent parts with React Server Components
  - Add revalidate: 60 for semi-static content


## 🟢 Static Pages (Can Be Static)

These pages can be statically generated for better performance:


### /app/(app)/account/page.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/analytics/churn/page.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/analytics/forecast/page.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/analytics/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/analytics/payouts/page.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/analytics/pricing/page.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/analytics/upsells/page.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/automations/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/billing/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/billing/page.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/campaigns/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/campaigns/new/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/campaigns/new/page.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/chatbot/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/chatting/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/chatting/page.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/complete-onboarding/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/configure/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/connect-of/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/connect-of/page.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/design-system/layout.tsx

- **Reason:** Static content page (documentation, design system, etc.)
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation
  - Add revalidate: 3600 for periodic updates


### /app/(app)/design-system/page.tsx

- **Reason:** Static content page (documentation, design system, etc.)
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation
  - Add revalidate: 3600 for periodic updates


### /app/(app)/flows/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/flows/page.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/game-days/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/game-days/page.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/integrations/page.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/manage-business/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/manage-business/page.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/marketing/calendar/page.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/marketing/campaigns/new/page.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/marketing/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/marketing/social/page.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/menu/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/of-analytics/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/of-connect/cookies/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/of-connect/page.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/of-messages/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/offers/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/offers/page.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/onboarding/dashboard/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/onboarding/huntaze/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/onboarding/optimize/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/onboarding/setup/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/onboarding/setup/page.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/onboarding/wizard/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/onboarding-v2/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/onboarding-v2/page.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/onlyfans/fans/[id]/page.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/onlyfans/fans/page.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/onlyfans/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/onlyfans/messages/mass/page.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/onlyfans/ppv/page.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/onlyfans/settings/welcome/page.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/onlyfans-assisted/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/performance/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/performance/page.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/profile/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/profile/page.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/repost/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/settings/page.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/skip-onboarding/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/smart-onboarding/analytics/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/smart-onboarding/analytics/page.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ❌
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/social/tiktok/upload/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/social-marketing/layout.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


### /app/(app)/social-marketing/page.tsx

- **Reason:** No dynamic data detected
- **Has force-dynamic:** ✅ (REMOVE!)
- **Recommendations:**
  - Remove force-dynamic
  - Enable static generation


## Next Steps

1. Remove `force-dynamic` from the main layout (app/(app)/layout.tsx)
2. Add `export const dynamic = 'force-dynamic'` only to real-time data pages
3. Add `export const revalidate = 60` to user-specific pages for ISR
4. Enable static generation for static pages
5. Test build process to ensure no database connection errors
