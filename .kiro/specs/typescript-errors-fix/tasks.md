# Implementation Plan

## Current Status
- **Total TypeScript Errors**: 133 (down from 438)
- **Errors Fixed**: 305 (70% reduction)
- **Previous Sessions**: 8-13 completed
- **Main Error Categories**:
  - TS2551 (39): Property doesn't exist, did you mean...
  - TS2353 (25): Object literal properties don't exist on type
  - TS2561 (14): Object is possibly 'null'
  - TS2552 (10): Cannot find name, did you mean...
  - TS2352 (10): Conversion of type may be a mistake
  - TS2345 (8): Argument of type is not assignable
  - TS2339 (6): Property doesn't exist on type
  - TS2322 (6): Type not assignable

## Tasks

- [ ] 0. Clean up @ts-nocheck directives (33 files)
  - Remove @ts-nocheck from files and fix underlying type errors
  - This reveals hidden errors and improves type safety
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 0.1 Clean up @ts-nocheck in service files (11 files)
  - Remove @ts-nocheck from lib/api/services/analytics.service.ts and fix errors
  - Remove @ts-nocheck from lib/api/services/onlyfans.service.ts and fix errors
  - Remove @ts-nocheck from lib/api/services/content.service.ts and fix errors
  - Remove @ts-nocheck from lib/api/services/marketing.service.ts and fix errors
  - Remove @ts-nocheck from lib/services/integrations/integrations.service.ts and fix errors
  - Remove @ts-nocheck from lib/services/integrations/audit-logger.ts and fix errors
  - Remove @ts-nocheck from lib/services/onlyfans-rate-limiter.service.ts and fix errors
  - Remove @ts-nocheck from lib/services/rate-limiter/sliding-window.ts and fix errors
  - Remove @ts-nocheck from lib/services/onlyfans-ai-assistant-enhanced.ts and fix errors
  - Remove @ts-nocheck from lib/services/tiktokOAuth.ts and fix errors
  - Remove @ts-nocheck from lib/services/alertService.ts and fix errors
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 0.2 Clean up @ts-nocheck in smart-onboarding services (5 files)
  - Remove @ts-nocheck from lib/smart-onboarding/services/mlPipelineFacade.ts and fix errors
  - Remove @ts-nocheck from lib/smart-onboarding/services/dataPrivacyService.ts and fix errors
  - Remove @ts-nocheck from lib/smart-onboarding/services/interventionEngine.ts and fix errors
  - Remove @ts-nocheck from lib/smart-onboarding/utils/retryStrategy.ts and fix errors
  - Remove @ts-nocheck from lib/smart-onboarding/testing/comprehensiveTestFramework.ts and fix errors
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 0.3 Clean up @ts-nocheck in OF memory services (3 files)
  - Remove @ts-nocheck from lib/of-memory/services/user-memory-service.ts and fix errors
  - Remove @ts-nocheck from lib/of-memory/services/preference-learning-engine.ts and fix errors
  - Remove @ts-nocheck from lib/of-memory/services/personality-calibrator.ts and fix errors
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 0.4 Clean up @ts-nocheck in API routes (2 files)
  - Remove @ts-nocheck from app/api/instagram/publish/route.ts and fix errors
  - Remove @ts-nocheck from app/api/marketing/campaigns/route.ts and fix errors
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 0.5 Clean up @ts-nocheck in components (4 files)
  - Remove @ts-nocheck from components/ui/alert.example.tsx and fix errors
  - Remove @ts-nocheck from components/ui/modal.example.tsx and fix errors
  - Remove @ts-nocheck from components/lazy/index.tsx and fix errors
  - Remove @ts-nocheck from components/performance/DynamicComponents.tsx and fix errors
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 0.6 Clean up @ts-nocheck in other files (8 files)
  - Remove @ts-nocheck from lib/api/middleware/auth.ts and fix errors
  - Remove @ts-nocheck from lib/observability/bootstrap.ts and fix errors
  - Remove @ts-nocheck from lib/security/validation-orchestrator.ts and fix errors
  - Remove @ts-nocheck from lib/workers/dataProcessingWorker.ts and fix errors
  - Remove @ts-nocheck from src/lib/prom.ts and fix errors
  - Remove @ts-nocheck from src/components/mobile/lazy-components.tsx and fix errors
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 0.7 Verify no @ts-nocheck remains
  - Run grep to confirm all @ts-nocheck directives are removed
  - Document any files that still need @ts-nocheck with justification
  - _Requirements: 10.4, 10.5_

- [ ] 1. Fix critical type definition errors
  - Fix AICostResponse type to include success/error response variants
  - Fix PerformanceData type to include webVitals and bottlenecks properties
  - Add missing exports to lib/auth/index.ts
  - _Requirements: 1.4, 2.2, 4.1_

- [ ] 1.1 Fix AICostResponse type definition
  - Update app/api/admin/ai-costs/types.ts to support both success and error responses
  - Create union type for API responses with success/error variants
  - Update all usages in app/api/admin/ai-costs/route.ts (12 occurrences)
  - _Requirements: 1.4, 4.1, 4.2_

- [ ] 1.2 Fix PerformanceData type definition
  - Add webVitals property to PerformanceData interface
  - Add bottlenecks property to PerformanceData interface
  - Update app/api/performance/summary/route.ts to match new type
  - _Requirements: 1.4, 4.1_

- [ ] 1.3 Fix auth module exports
  - Add missing exports to lib/auth/index.ts (validateSignInCredentials, sanitizeEmail, getErrorMessage, getRecoveryAction, AuthError)
  - Verify all auth imports resolve correctly
  - _Requirements: 2.1, 2.2, 2.4_

- [ ] 2. Fix analytics pages component props
  - Fix MonthProgressProps to match component usage
  - Fix GoalAchievementProps to match component usage
  - Fix RevenueForecastChartProps to match component usage
  - Fix PayoutSummaryProps to match component usage
  - Fix PayoutTimelineProps to match component usage
  - Fix UpsellAutomationSettingsProps to match component usage
  - _Requirements: 1.1, 1.2, 7.2_

- [ ] 2.1 Fix forecast page component props
  - Update MonthProgressProps in components to accept forecast property or fix page to pass title
  - Fix RevenueForecastResponse type to include months property
  - Update RevenueForecastChartProps to accept forecast instead of data
  - Fix app/(app)/analytics/forecast/page.tsx (4 errors)
  - _Requirements: 1.1, 1.2, 7.2_

- [ ] 2.2 Fix payouts page component props
  - Update PayoutSummaryProps to accept correct structure
  - Add missing props to PayoutTimelineProps (taxRate, onExport, onUpdateTaxRate)
  - Fix app/(app)/analytics/payouts/page.tsx (2 errors)
  - _Requirements: 1.1, 1.2, 7.2_

- [ ] 2.3 Fix upsells page component props
  - Remove fanId from SendUpsellRequest type or add it to interface
  - Fix UpsellAutomationSettingsProps to match component expectations
  - Fix app/(app)/analytics/upsells/page.tsx (2 errors)
  - _Requirements: 1.1, 1.2, 7.2_

- [ ] 3. Fix function argument count mismatches
  - Fix createLogger calls to use correct number of arguments
  - Fix z.record() calls to include key type parameter
  - Fix getDashboardSnapshot calls to include required parameters
  - Fix Stripe API calls to match correct signatures
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 3.1 Fix createLogger argument mismatches
  - Fix app/api/ai/chat/route.ts line 33 (2 arguments instead of 1)
  - Review all createLogger usages for consistency
  - _Requirements: 6.1, 6.2_

- [ ] 3.2 Fix Zod validation argument mismatches
  - Fix z.record() calls to include z.string() as first parameter
  - Fix z.enum() calls in app/api/instagram/publish/route.ts
  - _Requirements: 6.1, 6.2_

- [ ] 3.3 Fix API function argument mismatches
  - Fix getDashboardSnapshot calls to include required parameters (2 occurrences)
  - Fix sendMessage calls to use correct number of arguments (2 occurrences)
  - Fix getPayouts calls to include required parameters (4 occurrences)
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 4. Fix null safety and optional chaining issues
  - Add null checks for data.data access in CSRF token client
  - Add optional chaining for req.user access
  - Add null checks for API response data
  - _Requirements: 5.1, 5.2, 5.4_

- [x] 4.1 Fix CSRF token client null safety
  - Add optional chaining or null checks for data.data access (3 occurrences in app/api/csrf/token/client.ts)
  - _Requirements: 5.1, 5.2_

- [x] 4.2 Fix request user property access
  - Add proper typing for req.user or use session-based approach
  - Fix app/api/content/[id]/route.ts line 64
  - _Requirements: 5.1, 5.2_

- [x] 4.3 Fix API response data validation
  - Add validation for webVitals property access (6 occurrences in app/api/performance/summary/route.ts)
  - Add validation for bottlenecks property access (1 occurrence)
  - _Requirements: 5.4, 5.5_

- [x] 5. Fix type incompatibilities and assertions
  - Fix Response vs NextResponse type mismatches
  - Fix string vs number type mismatches
  - Fix object structure mismatches
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 5.1 Fix Response type mismatches
  - Convert Response to NextResponse in app/api/csrf/token/route.ts (2 occurrences)
  - Ensure all API routes return NextResponse consistently
  - _Requirements: 4.1, 4.2, 8.1_

- [x] 5.2 Fix string/number type mismatches
  - Fix userId type in cached-example routes (2 occurrences)
  - Fix Instagram publish route type mismatches (1 occurrence)
  - Parse string IDs to numbers where needed
  - _Requirements: 4.1, 4.2_

- [x] 5.3 Fix Prisma type mismatches
  - Fix user_stats create input to include id property
  - Fix object structure for stats aggregation (2 occurrences in app/api/home/stats/route.ts)
  - Remove duplicate properties in object literals
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 6. Fix JSX and component errors
  - Remove duplicate JSX attributes
  - Fix component prop types
  - Fix hydration-related props
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 6.1 Fix duplicate JSX attributes
  - Remove duplicate attributes in app/global-error.tsx (1 occurrence)
  - Remove duplicate attributes in components/animations/MobileOptimizations.tsx (1 occurrence)
  - _Requirements: 7.1_

- [ ] 6.2 Fix hydration component props
  - Remove hydrationId prop from SSRDataProviderProps or add it to interface
  - Fix app/(marketing)/status/page.tsx
  - _Requirements: 7.2, 8.3_

- [ ] 6.3 Fix auth component state
  - Add isAuthenticated property to AuthState interface
  - Fix components/auth/AuthProvider.tsx
  - _Requirements: 1.4, 1.5_

- [ ] 7. Fix module import errors
  - Fix or comment out missing module imports
  - Verify all module paths are correct
  - Add missing type declarations
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 7.1 Fix missing module imports
  - Fix @/auth import in app/(marketing)/page-old-generic.tsx
  - Fix provider variable scope in app/api/integrations/callback/[provider]/route.ts
  - _Requirements: 2.1, 2.2, 2.4_

- [ ] 7.2 Fix Prisma include type errors
  - Remove or fix 'profile' include in cached-example routes (2 occurrences)
  - Verify Prisma schema matches usage
  - _Requirements: 2.2, 4.1_

- [ ] 8. Fix Instagram publish route errors
  - Fix Zod enum definition
  - Add missing error codes (TIMEOUT_ERROR, NETWORK_ERROR)
  - Fix NextResponse.json signature usage
  - Fix logError function calls
  - _Requirements: 3.1, 4.1, 6.1, 8.1_

- [ ] 8.1 Fix Instagram error codes
  - Add TIMEOUT_ERROR to error codes enum
  - Add NETWORK_ERROR to error codes enum
  - Fix app/api/instagram/publish/route.ts (2 occurrences)
  - _Requirements: 1.4, 4.1_

- [ ] 8.2 Fix Instagram API call signatures
  - Fix NextResponse.json calls to not pass UUID as ResponseOptions
  - Fix logError calls to use correct number of arguments (4 occurrences)
  - _Requirements: 6.1, 6.2, 8.1_

- [ ] 9. Fix miscellaneous API route errors
  - Fix auth register route return type
  - Fix test-redis route logger calls
  - Fix worker route error object properties
  - _Requirements: 3.1, 4.1, 4.3_

- [ ] 9.1 Fix auth register return type
  - Ensure return type matches NextResponse<RegisterResponse>
  - Fix app/api/auth/register/route.ts line 663
  - _Requirements: 4.1, 4.3, 8.1_

- [ ] 9.2 Fix logger method calls
  - Add debug method to logger interface or use info instead
  - Fix app/api/test-redis/route.ts (5 occurrences)
  - _Requirements: 3.1, 4.1_

- [ ] 9.3 Fix error object properties
  - Remove custom properties from Error objects or extend Error class
  - Fix app/api/workers/alert-checker/route.ts (1 occurrence)
  - Fix app/api/workers/data-processing/route.ts (2 occurrences)
  - Fix app/api/test-redis/route.ts (1 occurrence)
  - _Requirements: 1.4, 4.1_

- [ ] 10. Fix CSRF token type indexing
  - Fix type indexing for token property in generic type
  - Fix app/api/csrf/token/types.ts line 184
  - _Requirements: 4.1, 4.4, 4.5_

- [x] 11. Checkpoint - Validate all fixes
  - Run `npx tsc --noEmit` to verify error count reduction
  - Run `npm run build` to ensure build succeeds
  - Document any remaining errors that require architectural changes
  - Ensure all tests pass, ask the user if questions arise
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

