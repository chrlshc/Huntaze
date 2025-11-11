# Implementation Plan

- [x] 1. Remove withMonitoring wrapper from API routes
  - Remove `withMonitoring` imports and wrapper calls from all API route files
  - Convert wrapped handlers to direct exports
  - _Requirements: 1.1, 1.2, 3.1, 3.2_

- [x] 1.1 Update analytics API routes
  - Remove withMonitoring from `app/api/analytics/ai/summary/run/route.ts`
  - Remove withMonitoring from `app/api/analytics/ai/summary/route.ts`
  - Export handlers directly (GET, POST, etc.)
  - _Requirements: 1.1, 3.1_

- [x] 1.2 Update cron job API routes
  - Remove withMonitoring from `app/api/cron/tiktok-insights/route.ts`
  - Remove withMonitoring from `app/api/cron/instagram-insights/route.ts`
  - Remove withMonitoring from `app/api/cron/tiktok-status/route.ts`
  - Remove withMonitoring from `app/api/cron/twitter-insights/route.ts`
  - Remove withMonitoring from `app/api/cron/insights-scheduler/route.ts`
  - _Requirements: 1.1, 3.1_

- [x] 1.3 Update onboarding API routes
  - Remove withMonitoring from `app/api/onboarding/mock-ingest/route.ts`
  - Remove withMonitoring from `app/api/onboarding/route.ts`
  - Remove withMonitoring from `app/api/onboarding/connect-platform/route.ts`
  - Remove withMonitoring from `app/api/onboarding/save-ai-config/route.ts`
  - Remove withMonitoring from `app/api/onboarding/save-playbook-draft/route.ts`
  - Remove withMonitoring from `app/api/onboarding/complete/route.ts`
  - Remove withMonitoring from `app/api/onboarding/save-ab-tests/route.ts`
  - _Requirements: 1.1, 3.1_

- [x] 1.4 Update messaging and CIN API routes
  - Remove withMonitoring from `app/api/messages/bulk/route.ts`
  - Remove withMonitoring from `app/api/cin/status/route.ts`
  - Remove withMonitoring from `app/api/cin/chat/route.ts`
  - _Requirements: 1.1, 3.1_

- [x] 1.5 Update agent and admin API routes
  - Remove withMonitoring from `app/api/agents/[...path]/route.ts`
  - Remove withMonitoring from `app/api/admin/outbox/dispatch/route.ts`
  - _Requirements: 1.1, 3.1_

- [x] 1.6 Update AI team API routes
  - Remove withMonitoring from `app/api/ai-team/plan/[id]/route.ts`
  - Remove withMonitoring from `app/api/ai-team/schedule/plan/route.ts`
  - Remove withMonitoring from `app/api/ai-team/schedule/plan/azure/route.ts`
  - _Requirements: 1.1, 3.1_

- [x] 1.7 Update CRM API routes
  - Remove withMonitoring from `app/api/crm/fans/route.ts` (GET, POST)
  - Remove withMonitoring from `app/api/crm/fans/[id]/route.ts` (GET, PUT, DELETE)
  - Remove withMonitoring from `app/api/crm/conversations/route.ts`
  - Remove withMonitoring from `app/api/crm/conversations/[id]/messages/route.ts` (GET, POST)
  - _Requirements: 1.1, 3.1_

- [x] 1.8 Update billing and webhook API routes
  - Remove withMonitoring from `app/api/billing/connect/checkout/route.ts`
  - Remove withMonitoring from `app/api/billing/checkout/route.ts`
  - Remove withMonitoring from `app/api/billing/calculate-commission/route.ts`
  - Remove withMonitoring from `app/api/webhooks/stripe/route.ts`
  - Remove withMonitoring from `app/api/subscriptions/webhook/route.ts`
  - _Requirements: 1.1, 3.1_

- [x] 2. Implement lazy Prometheus initialization in critical paths
  - Replace top-level prom-client imports with dynamic imports inside handler functions
  - Initialize metrics at runtime on first request
  - _Requirements: 1.2, 3.3, 4.1, 4.2_

- [x] 2.1 Update AI smoke test route
  - Remove top-level prom usage from `app/api/ai/azure/smoke/route.ts`
  - Add lazy import pattern if metrics needed
  - _Requirements: 1.2, 4.1_

- [x] 2.2 Update insights scheduler worker
  - Add lazy prom import to `src/lib/insights/schedulerWorker.ts`
  - Initialize metrics within `processInsightsSchedule` function
  - _Requirements: 1.2, 4.1, 4.2_

- [x] 2.3 Update analytics summarizer
  - Add lazy prom import to `src/lib/analytics/summarizer.ts`
  - Initialize metrics within `runAiInsightsSummarizer` function
  - _Requirements: 1.2, 4.1, 4.2_

- [x] 2.4 Update debug routes
  - Add lazy prom import to `app/api/debug/twitter-track/route.ts` (POST, DELETE handlers)
  - Remove unused prom import from `app/api/debug/tiktok-events/route.ts`
  - _Requirements: 1.2, 4.1_

- [x] 2.5 Update message reply route
  - Add lazy prom import to `app/api/messages/reply/route.ts` (POST handler)
  - Initialize metrics at runtime
  - _Requirements: 1.2, 4.1, 4.2_

- [x] 2.6 Update metrics endpoint
  - Add lazy imports for `registry`, `ensureDefaultMetrics`, `contentType` in `app/api/metrics/route.ts`
  - Initialize Prometheus components inside GET handler
  - Implement error handling for import failures
  - _Requirements: 1.2, 2.3, 4.1, 4.3_

- [x] 2.7 Update metrics library
  - Remove top-level prom import from `lib/metrics.ts`
  - Make mirror-to-Prometheus function use lazy, non-blocking dynamic import
  - _Requirements: 1.2, 4.1, 4.3_

- [x] 3. Verify build completion
  - Run build process to confirm all changes resolve build-time errors
  - Validate that page data collection completes successfully
  - _Requirements: 1.1, 1.3, 1.4, 5.1, 5.3_

- [x] 3.1 Run standard build
  - Execute `npm run build`
  - Verify no "(intermediate value)… is not a function" errors
  - Confirm "Collecting page data" phase completes
  - _Requirements: 1.1, 5.1_

- [x] 3.2 Run low-memory build
  - Execute `npm run build:lowdisk`
  - Verify build completes within memory constraints
  - Confirm bundle finalization succeeds
  - _Requirements: 1.4, 5.1_

- [x] 3.3 Verify route compilation
  - Check that all API routes are included in production bundle
  - Confirm no routes were excluded due to build errors
  - _Requirements: 1.3, 5.1, 5.4_

- [x] 4. Validate runtime monitoring functionality
  - Test that metrics collection works at runtime
  - Verify graceful degradation if monitoring fails
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 4.3_

- [x] 4.1 Test API route functionality
  - Make test requests to updated routes
  - Verify responses are correct and unchanged
  - Confirm error handling works properly
  - _Requirements: 2.4, 3.4_

- [x] 4.2 Test metrics collection
  - Make requests to various API routes
  - Query `/api/metrics` endpoint
  - Verify metrics appear in Prometheus format
  - Confirm metric labels are correct
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 4.3 Test lazy initialization
  - Measure first request latency (includes lazy init overhead)
  - Measure subsequent request latency
  - Verify overhead is acceptable (<50ms)
  - _Requirements: 2.1, 4.2_

- [x] 4.4 Test error handling
  - Simulate prom-client import failure
  - Verify routes continue functioning
  - Confirm errors are logged but don't crash handlers
  - _Requirements: 2.4, 4.3_

- [x] 5. Code pattern verification
  - Search codebase to ensure no problematic patterns remain
  - Verify all routes use correct lazy initialization pattern
  - _Requirements: 5.2, 5.3, 4.1_

- [x] 5.1 Search for withMonitoring usage
  - Run `grep -r "withMonitoring" app/api/`
  - Verify zero results (all removed)
  - _Requirements: 5.2_

- [x] 5.2 Search for top-level prom imports
  - Run `grep -r "import.*prom-client" app/api/ | grep -v "await import"`
  - Verify zero results (all converted to lazy imports)
  - _Requirements: 5.2, 4.1_

- [x] 5.3 Verify lazy import pattern
  - Run `grep -r "await import('prom-client')" app/api/`
  - Confirm all monitoring uses dynamic imports
  - _Requirements: 4.1, 4.2_

- [x] 6. Documentation and deployment preparation
  - Document the changes and patterns for future reference
  - Prepare deployment checklist
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 6.1 Document migration patterns
  - Create examples of before/after code patterns
  - Document lazy initialization best practices
  - Include error handling guidelines
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 6.2 Create deployment checklist
  - List verification steps for staging deployment
  - Include monitoring validation steps
  - Document rollback procedure
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 6.3 Update development guidelines
  - Add guidelines for new API routes
  - Document when to use lazy monitoring
  - Include build-time vs runtime considerations
  - _Requirements: 4.1, 4.2, 4.4_

- [x] 7. Apply hardening recommendations
  - Implement additional safeguards to prevent future build-time monitoring issues
  - Add ESLint rules to catch problematic patterns at development time
  - _Requirements: 4.1, 4.4, 5.2_

- [x] 7.1 Add ESLint restricted imports rule
  - Update `.eslintrc.json` to add `no-restricted-imports` rule
  - Ban top-level imports of `prom-client` with helpful error message
  - Ban imports of deprecated `@/lib/monitoring` wrapper
  - _Requirements: 4.4, 5.2_

- [x] 7.2 Update validation script
  - Modify `scripts/validate-observability-hardening.sh` to check for ESLint rules in `.eslintrc.json`
  - Verify `no-restricted-imports` rule includes both `prom-client` and `@/lib/monitoring`
  - Remove check for separate `.eslintrc.hardening.json` file
  - _Requirements: 5.2, 5.3_
