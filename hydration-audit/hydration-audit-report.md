# Hydration Audit Report

Generated on: 2025-11-04T20:05:37.325Z

## Summary

- **Total Files Scanned**: 1072
- **Total Issues Found**: 1365
- **High Severity**: 1239
- **Medium Severity**: 87
- **Low Severity**: 39

## Recommendations

### Fix High Severity Hydration Issues (HIGH Priority)

Found 1239 high severity issues that are likely causing React error #130

**Action**: Review and fix client-only API usage and time-sensitive rendering

### Widespread Client-Only API Usage (HIGH Priority)

Multiple files are using client-only APIs without proper guards

**Action**: Implement HydrationSafeWrapper or move code to useEffect

### Time-Sensitive Rendering (MEDIUM Priority)

Components are using time-sensitive data that differs between server and client

**Action**: Use consistent timestamps or format dates properly

### Implement Hydration Error Boundary (LOW Priority)

Wrap components with HydrationErrorBoundary for better error handling

**Action**: Add HydrationProvider to your app root

## Issues by Category

### timeSensitive (1025 issues)

- **app/api/ai/agents/route.ts:68** - new Date()
  - Severity: high
  - Suggestion: Use consistent timestamps between server and client

- **app/api/ai/agents/route.ts:102** - new Date()
  - Severity: high
  - Suggestion: Use consistent timestamps between server and client

- **app/api/ai/azure/smoke/route.ts:16** - Date.now()
  - Severity: high
  - Suggestion: Use consistent timestamps between server and client

- **app/api/ai/azure/smoke/route.ts:20** - Date.now()
  - Severity: high
  - Suggestion: Use consistent timestamps between server and client

- **app/api/ai/azure/smoke/route.ts:39** - Date.now()
  - Severity: high
  - Suggestion: Use consistent timestamps between server and client

- **app/api/ai-team/events/stream/route.ts:17** - setInterval(
  - Severity: high
  - Suggestion: Use consistent timestamps between server and client

- **app/api/analytics/ai/summary/run/route.ts:40** - Date.now()
  - Severity: high
  - Suggestion: Use consistent timestamps between server and client

- **app/api/analytics/alerts-count/route.ts:18** - Date.now()
  - Severity: high
  - Suggestion: Use consistent timestamps between server and client

- **app/api/analytics/audience/route.ts:39** - new Date()
  - Severity: high
  - Suggestion: Use consistent timestamps between server and client

- **app/api/analytics/audience/route.ts:40** - new Date()
  - Severity: high
  - Suggestion: Use consistent timestamps between server and client

... and 1015 more issues

### dynamicContent (38 issues)

- **app/api/ai-team/schedule/plan/azure/route.ts:25** - crypto.randomUUID()
  - Severity: low
  - Suggestion: Generate stable IDs or use useId hook

- **app/api/ai-team/schedule/plan/azure/route.ts:28** - crypto.randomUUID()
  - Severity: low
  - Suggestion: Generate stable IDs or use useId hook

- **app/api/auth/login/route.ts:35** - Math.floor(Math.random()
  - Severity: low
  - Suggestion: Generate stable IDs or use useId hook

- **app/api/auth/register/route.ts:37** - Math.floor(Math.random()
  - Severity: low
  - Suggestion: Generate stable IDs or use useId hook

- **app/api/billing/calculate-commission/route.ts:41** - crypto.randomUUID()
  - Severity: low
  - Suggestion: Generate stable IDs or use useId hook

- **app/api/billing/checkout/route.ts:12** - crypto.randomUUID()
  - Severity: low
  - Suggestion: Generate stable IDs or use useId hook

- **app/api/billing/connect/checkout/route.ts:54** - crypto.randomUUID()
  - Severity: low
  - Suggestion: Generate stable IDs or use useId hook

- **app/api/cin/chat/route.ts:18** - crypto.randomUUID()
  - Severity: low
  - Suggestion: Generate stable IDs or use useId hook

- **app/api/cin/status/route.ts:21** - Math.floor(Math.random()
  - Severity: low
  - Suggestion: Generate stable IDs or use useId hook

- **app/api/cin/status/route.ts:22** - Math.floor(Math.random()
  - Severity: low
  - Suggestion: Generate stable IDs or use useId hook

... and 28 more issues

### conditionalRendering (84 issues)

- **app/api/auth/instagram/route.ts:36** - process.env.NODE_ENV
  - Severity: medium
  - Suggestion: Use HydrationSafeWrapper or useEffect

- **app/api/auth/login/route.ts:57** - process.env.NODE_ENV
  - Severity: medium
  - Suggestion: Use HydrationSafeWrapper or useEffect

- **app/api/auth/login/route.ts:116** - process.env.NODE_ENV
  - Severity: medium
  - Suggestion: Use HydrationSafeWrapper or useEffect

- **app/api/auth/reddit/route.ts:42** - process.env.NODE_ENV
  - Severity: medium
  - Suggestion: Use HydrationSafeWrapper or useEffect

- **app/api/auth/register/route.ts:60** - process.env.NODE_ENV
  - Severity: medium
  - Suggestion: Use HydrationSafeWrapper or useEffect

- **app/api/auth/register/route.ts:133** - process.env.NODE_ENV
  - Severity: medium
  - Suggestion: Use HydrationSafeWrapper or useEffect

- **app/api/auth/signin/route.ts:77** - process.env.NODE_ENV
  - Severity: medium
  - Suggestion: Use HydrationSafeWrapper or useEffect

- **app/api/auth/signup/route.ts:41** - process.env.NODE_ENV
  - Severity: medium
  - Suggestion: Use HydrationSafeWrapper or useEffect

- **app/api/auth/signup/route.ts:50** - process.env.NODE_ENV
  - Severity: medium
  - Suggestion: Use HydrationSafeWrapper or useEffect

- **app/api/debug/email/route.ts:65** - process.env.NODE_ENV
  - Severity: medium
  - Suggestion: Use HydrationSafeWrapper or useEffect

... and 74 more issues

### clientOnlyAPIs (163 issues)

- **app/api/chatbot/chat/route.ts:67** - history.
  - Severity: high
  - Suggestion: Use useEffect hook or check if window is defined

- **app/api/events/route.ts:23** - addEventListener(
  - Severity: high
  - Suggestion: Use useEffect hook or check if window is defined

- **app/api/messages/unread-count/route.ts:64** - addEventListener(
  - Severity: high
  - Suggestion: Use useEffect hook or check if window is defined

- **app/api/onlyfans/dashboard/stream/route.ts:73** - addEventListener(
  - Severity: high
  - Suggestion: Use useEffect hook or check if window is defined

- **app/billing/packs/page.tsx:12** - window.
  - Severity: high
  - Suggestion: Use useEffect hook or check if window is defined

- **app/billing/packs/page.tsx:12** - location.
  - Severity: high
  - Suggestion: Use useEffect hook or check if window is defined

- **app/debug-tiktok/page.tsx:27** - window.
  - Severity: high
  - Suggestion: Use useEffect hook or check if window is defined

- **app/debug-tiktok/page.tsx:27** - location.
  - Severity: high
  - Suggestion: Use useEffect hook or check if window is defined

- **app/global-error.tsx:28** - window.
  - Severity: high
  - Suggestion: Use useEffect hook or check if window is defined

- **app/global-error.tsx:28** - location.
  - Severity: high
  - Suggestion: Use useEffect hook or check if window is defined

... and 153 more issues

### inlineTimeInJSX (7 issues)

- **app/api/debug/email/route.ts:36** - <p><small>Sent at: ${new Date().toISOString()}</small></p>
  - Severity: high
  - Suggestion: Use consistent timestamp or format on both server and client

- **app/preview/[token]/page.tsx:54** - if (expiresAt < new Date()) {
  - Severity: high
  - Suggestion: Use consistent timestamp or format on both server and client

- **components/LandingFooter.tsx:5** - <p>© {new Date().getFullYear()} Huntaze. All rights reserved.</p>
  - Severity: high
  - Suggestion: Use consistent timestamp or format on both server and client

- **lib/auth/tokens.ts:38** - if (new Date(expires_at) < new Date()) {
  - Severity: high
  - Suggestion: Use consistent timestamp or format on both server and client

- **lib/db/repositories/contentItemsRepository.ts:128** - async findScheduledDue(beforeDate: Date = new Date()): Promise<ContentItem[]> {
  - Severity: high
  - Suggestion: Use consistent timestamp or format on both server and client

- **lib/services/csvImporter.ts:174** - } else if (date < new Date()) {
  - Severity: high
  - Suggestion: Use consistent timestamp or format on both server and client

- **lib/smart-onboarding/services/returningUserOptimizer.ts:318** - if (new Date(session.expiresAt) < new Date()) {
  - Severity: high
  - Suggestion: Use consistent timestamp or format on both server and client

### serverComponentClientCode (44 issues)

- **app/layout-backup.tsx:60** - const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  - Severity: high
  - Suggestion: Move to client component or use useEffect

- **app/layout-backup.tsx:62** - document.documentElement.classList.add(resolved);
  - Severity: high
  - Suggestion: Move to client component or use useEffect

- **app/layout-backup.tsx:69** - window.scrollTo(0, 0);
  - Severity: high
  - Suggestion: Move to client component or use useEffect

- **app/layout-backup.tsx:70** - document.documentElement.scrollTop = 0;
  - Severity: high
  - Suggestion: Move to client component or use useEffect

- **app/layout-backup.tsx:71** - document.body.scrollTop = 0;
  - Severity: high
  - Suggestion: Move to client component or use useEffect

- **app/layout-backup.tsx:75** - window.addEventListener('load', () => {
  - Severity: high
  - Suggestion: Move to client component or use useEffect

- **lib/analytics/enterprise-events.ts:114** - if (typeof window !== 'undefined' && window.gtag) {
  - Severity: high
  - Suggestion: Move to client component or use useEffect

- **lib/analytics/enterprise-events.ts:115** - window.gtag('event', eventName, {
  - Severity: high
  - Suggestion: Move to client component or use useEffect

- **lib/analytics/enterprise-events.ts:124** - if (typeof window !== 'undefined' && window.analytics) {
  - Severity: high
  - Suggestion: Move to client component or use useEffect

- **lib/analytics/enterprise-events.ts:125** - window.analytics.track(eventName, {
  - Severity: high
  - Suggestion: Move to client component or use useEffect

... and 34 more issues

### conditionalClientRendering (3 issues)

- **app/platforms/connect/page.tsx:11** - const DEFAULT_APP_ORIGIN = (typeof window !== 'undefined' && window.location?.origin) || process.env.NEXT_PUBLIC_APP_URL || 'https://app.huntaze.com';
  - Severity: medium
  - Suggestion: Use useEffect or HydrationSafeWrapper

- **components/hydration/HydrationErrorBoundary.tsx:71** - url: typeof window !== 'undefined' ? window.location.href : '',
  - Severity: medium
  - Suggestion: Use useEffect or HydrationSafeWrapper

- **lib/analytics/onboardingTracker.ts:24** - userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
  - Severity: medium
  - Suggestion: Use useEffect or HydrationSafeWrapper

### cssInJS (1 issues)

- **lib/services/aiAdapter.ts:204** - emotion
  - Severity: low
  - Suggestion: Ensure consistent styling between server and client

## Most Problematic Files

### lib/monitoring/threeJsMonitor.ts (42 issues)

- Line 66: window. (high)
- Line 73: window. (high)
- Line 80: window. (high)
- Line 87: window. (high)
- Line 105: window. (high)
- Line 157: window. (high)
- Line 185: window. (high)
- Line 99: document. (high)
- Line 113: document. (high)
- Line 72: navigator. (high)
- Line 86: navigator. (high)
- Line 104: navigator. (high)
- Line 156: navigator. (high)
- Line 184: navigator. (high)
- Line 73: location. (high)
- Line 87: location. (high)
- Line 105: location. (high)
- Line 157: location. (high)
- Line 185: location. (high)
- Line 66: addEventListener( (high)
- Line 80: addEventListener( (high)
- Line 99: addEventListener( (high)
- Line 113: addEventListener( (high)
- Line 71: Date.now() (high)
- Line 85: Date.now() (high)
- Line 103: Date.now() (high)
- Line 155: Date.now() (high)
- Line 183: Date.now() (high)
- Line 141: performance.now() (high)
- Line 320: typeof window !== 'undefined' (medium)
- Line 237: process.env.NODE_ENV (medium)
- Line 122: if ('PerformanceObserver' in window) (medium)
- Line 320: if (typeof window !== 'undefined') (medium)
- Line 66: window.addEventListener('error', (event) => { (high)
- Line 73: url: window.location.href, (high)
- Line 80: window.addEventListener('unhandledrejection', (event) => { (high)
- Line 87: url: window.location.href, (high)
- Line 99: document.addEventListener('webglcontextlost', (event) => { (high)
- Line 105: url: window.location.href, (high)
- Line 113: document.addEventListener('webglcontextrestored', () => { (high)
- Line 157: url: window.location.href, (high)
- Line 185: url: window.location.href, (high)

### hooks/useThreeJsMonitoring.ts (42 issues)

- Line 44: window. (high)
- Line 81: window. (high)
- Line 126: window. (high)
- Line 136: window. (high)
- Line 137: window. (high)
- Line 140: window. (high)
- Line 141: window. (high)
- Line 163: document. (high)
- Line 164: document. (high)
- Line 167: document. (high)
- Line 168: document. (high)
- Line 43: navigator. (high)
- Line 80: navigator. (high)
- Line 44: location. (high)
- Line 81: location. (high)
- Line 136: addEventListener( (high)
- Line 137: addEventListener( (high)
- Line 163: addEventListener( (high)
- Line 164: addEventListener( (high)
- Line 140: removeEventListener( (high)
- Line 141: removeEventListener( (high)
- Line 167: removeEventListener( (high)
- Line 168: removeEventListener( (high)
- Line 42: Date.now() (high)
- Line 79: Date.now() (high)
- Line 98: performance.now() (high)
- Line 109: performance.now() (high)
- Line 223: performance.now() (high)
- Line 231: performance.now() (high)
- Line 236: performance.now() (high)
- Line 241: performance.now() (high)
- Line 44: url: window.location.href, (high)
- Line 81: url: window.location.href, (high)
- Line 126: logError(event.error, { source: 'window.error' }); (high)
- Line 136: window.addEventListener('error', handleError); (high)
- Line 137: window.addEventListener('unhandledrejection', handleUnhandledRejection); (high)
- Line 140: window.removeEventListener('error', handleError); (high)
- Line 141: window.removeEventListener('unhandledrejection', handleUnhandledRejection); (high)
- Line 163: document.addEventListener('webglcontextlost', handleContextLost); (high)
- Line 164: document.addEventListener('webglcontextrestored', handleContextRestored); (high)
- Line 167: document.removeEventListener('webglcontextlost', handleContextLost); (high)
- Line 168: document.removeEventListener('webglcontextrestored', handleContextRestored); (high)

### lib/smart-onboarding/testing/userPersonaSimulator.ts (39 issues)

- Line 53: Date.now() (high)
- Line 91: Date.now() (high)
- Line 109: Date.now() (high)
- Line 122: Date.now() (high)
- Line 131: Date.now() (high)
- Line 138: Date.now() (high)
- Line 291: Date.now() (high)
- Line 404: Date.now() (high)
- Line 116: Math.random() (high)
- Line 132: Math.random() (high)
- Line 135: Math.random() (high)
- Line 161: Math.random() (high)
- Line 177: Math.random() (high)
- Line 220: Math.random() (high)
- Line 227: Math.random() (high)
- Line 228: Math.random() (high)
- Line 234: Math.random() (high)
- Line 266: Math.random() (high)
- Line 270: Math.random() (high)
- Line 273: Math.random() (high)
- Line 274: Math.random() (high)
- Line 281: Math.random() (high)
- Line 282: Math.random() (high)
- Line 304: Math.random() (high)
- Line 309: Math.random() (high)
- Line 318: Math.random() (high)
- Line 319: Math.random() (high)
- Line 320: Math.random() (high)
- Line 330: Math.random() (high)
- Line 334: Math.random() (high)
- Line 357: Math.random() (high)
- Line 387: Math.random() (high)
- Line 140: setTimeout( (high)
- Line 132: Math.floor(Math.random() (low)
- Line 227: Math.floor(Math.random() (low)
- Line 228: Math.floor(Math.random() (low)
- Line 234: Math.floor(Math.random() (low)
- Line 270: Math.floor(Math.random() (low)
- Line 320: Math.floor(Math.random() (low)

### lib/smart-onboarding/testing/loadTestRunner.ts (37 issues)

- Line 393: new Date() (high)
- Line 33: Date.now() (high)
- Line 44: Date.now() (high)
- Line 49: Date.now() (high)
- Line 60: Date.now() (high)
- Line 100: Date.now() (high)
- Line 108: Date.now() (high)
- Line 111: Date.now() (high)
- Line 117: Date.now() (high)
- Line 127: Date.now() (high)
- Line 132: Date.now() (high)
- Line 172: Date.now() (high)
- Line 180: Date.now() (high)
- Line 195: Date.now() (high)
- Line 206: Date.now() (high)
- Line 244: Date.now() (high)
- Line 252: Date.now() (high)
- Line 258: Date.now() (high)
- Line 275: Date.now() (high)
- Line 306: Math.random() (high)
- Line 312: Math.random() (high)
- Line 316: Math.random() (high)
- Line 324: Math.random() (high)
- Line 333: Math.random() (high)
- Line 342: Math.random() (high)
- Line 349: Math.random() (high)
- Line 354: Math.random() (high)
- Line 361: Math.random() (high)
- Line 377: Math.random() (high)
- Line 382: Math.random() (high)
- Line 56: setTimeout( (high)
- Line 307: setTimeout( (high)
- Line 313: setTimeout( (high)
- Line 326: setTimeout( (high)
- Line 335: setTimeout( (high)
- Line 341: setTimeout( (high)
- Line 351: setTimeout( (high)

### lib/smart-onboarding/services/mlModelManager.ts (29 issues)

- Line 81: new Date() (high)
- Line 248: new Date() (high)
- Line 344: new Date() (high)
- Line 345: new Date() (high)
- Line 233: Date.now() (high)
- Line 240: Date.now() (high)
- Line 351: Date.now() (high)
- Line 357: Date.now() (high)
- Line 214: Math.random() (high)
- Line 246: Math.random() (high)
- Line 258: Math.random() (high)
- Line 277: Math.random() (high)
- Line 279: Math.random() (high)
- Line 287: Math.random() (high)
- Line 288: Math.random() (high)
- Line 289: Math.random() (high)
- Line 295: Math.random() (high)
- Line 296: Math.random() (high)
- Line 297: Math.random() (high)
- Line 304: Math.random() (high)
- Line 305: Math.random() (high)
- Line 306: Math.random() (high)
- Line 258: setTimeout( (high)
- Line 327: setTimeout( (high)
- Line 356: setInterval( (high)
- Line 277: Math.floor(Math.random() (low)
- Line 296: Math.floor(Math.random() (low)
- Line 304: Math.floor(Math.random() (low)
- Line 306: Math.floor(Math.random() (low)

### lib/smart-onboarding/services/modelDeploymentService.ts (27 issues)

- Line 70: new Date() (high)
- Line 103: new Date() (high)
- Line 158: new Date() (high)
- Line 165: new Date() (high)
- Line 218: new Date() (high)
- Line 371: new Date() (high)
- Line 427: new Date() (high)
- Line 62: Date.now() (high)
- Line 328: Date.now() (high)
- Line 331: Date.now() (high)
- Line 348: Date.now() (high)
- Line 350: Date.now() (high)
- Line 365: Math.random() (high)
- Line 366: Math.random() (high)
- Line 367: Math.random() (high)
- Line 368: Math.random() (high)
- Line 369: Math.random() (high)
- Line 370: Math.random() (high)
- Line 441: Math.random() (high)
- Line 197: setTimeout( (high)
- Line 227: setTimeout( (high)
- Line 287: setTimeout( (high)
- Line 307: setTimeout( (high)
- Line 332: setTimeout( (high)
- Line 351: setTimeout( (high)
- Line 440: setTimeout( (high)
- Line 420: setInterval( (high)

### lib/smart-onboarding/services/interventionEffectivenessTracker.ts (25 issues)

- Line 33: new Date() (high)
- Line 73: new Date() (high)
- Line 108: new Date() (high)
- Line 126: new Date() (high)
- Line 153: new Date() (high)
- Line 202: new Date() (high)
- Line 287: new Date() (high)
- Line 301: new Date() (high)
- Line 520: new Date() (high)
- Line 541: new Date() (high)
- Line 562: new Date() (high)
- Line 582: new Date() (high)
- Line 590: new Date() (high)
- Line 595: new Date() (high)
- Line 70: Date.now() (high)
- Line 107: Date.now() (high)
- Line 115: Date.now() (high)
- Line 152: Date.now() (high)
- Line 267: Date.now() (high)
- Line 512: Date.now() (high)
- Line 533: Date.now() (high)
- Line 554: Date.now() (high)
- Line 574: Date.now() (high)
- Line 589: Date.now() (high)
- Line 630: setInterval( (high)

### lib/smart-onboarding/services/successPredictionService.ts (24 issues)

- Line 58: new Date() (high)
- Line 104: new Date() (high)
- Line 162: new Date() (high)
- Line 202: new Date() (high)
- Line 212: new Date() (high)
- Line 272: new Date() (high)
- Line 273: new Date() (high)
- Line 286: new Date() (high)
- Line 296: new Date() (high)
- Line 342: new Date() (high)
- Line 684: new Date() (high)
- Line 724: new Date() (high)
- Line 744: new Date() (high)
- Line 49: Date.now() (high)
- Line 92: Date.now() (high)
- Line 160: Date.now() (high)
- Line 334: Date.now() (high)
- Line 719: Date.now() (high)
- Line 739: Math.random() (high)
- Line 740: Math.random() (high)
- Line 741: Math.random() (high)
- Line 742: Math.random() (high)
- Line 743: Math.random() (high)
- Line 301: setInterval( (high)

### lib/smart-onboarding/performance/horizontalScaler.ts (23 issues)

- Line 431: new Date() (high)
- Line 432: new Date() (high)
- Line 506: new Date() (high)
- Line 549: new Date() (high)
- Line 566: new Date() (high)
- Line 589: new Date() (high)
- Line 669: new Date() (high)
- Line 224: Date.now() (high)
- Line 367: Date.now() (high)
- Line 392: Date.now() (high)
- Line 420: Date.now() (high)
- Line 470: Date.now() (high)
- Line 472: Date.now() (high)
- Line 593: Date.now() (high)
- Line 596: Date.now() (high)
- Line 247: Math.random() (high)
- Line 420: Math.random() (high)
- Line 525: Math.random() (high)
- Line 440: setTimeout( (high)
- Line 453: setTimeout( (high)
- Line 473: setTimeout( (high)
- Line 490: setInterval( (high)
- Line 634: setInterval( (high)

### lib/validation/validators/instagramValidator.ts (23 issues)

- Line 41: new Date() (high)
- Line 164: new Date() (high)
- Line 215: new Date() (high)
- Line 258: new Date() (high)
- Line 386: new Date() (high)
- Line 457: new Date() (high)
- Line 522: new Date() (high)
- Line 577: new Date() (high)
- Line 34: Date.now() (high)
- Line 120: Date.now() (high)
- Line 251: Date.now() (high)
- Line 305: Date.now() (high)
- Line 379: Date.now() (high)
- Line 442: Date.now() (high)
- Line 450: Date.now() (high)
- Line 507: Date.now() (high)
- Line 515: Date.now() (high)
- Line 562: Date.now() (high)
- Line 570: Date.now() (high)
- Line 605: Date.now() (high)
- Line 637: Date.now() (high)
- Line 332: setTimeout( (high)
- Line 111: process.env.NODE_ENV (medium)

