# Implementation Plan

This implementation plan breaks down the production-readiness work into discrete, actionable coding tasks. Each task builds incrementally and references specific requirements from the requirements document.

## Phase 1: Testing Infrastructure (Week 1)

- [x] 1. Set up unit testing framework
- [x] 1.1 Configure Jest with TypeScript support and coverage thresholds
  - Install jest, @types/jest, ts-jest dependencies
  - Create jest.config.js with 80% coverage thresholds
  - Add test scripts to package.json
  - _Requirements: 1.1, 1.5_

- [x] 1.2 Write unit tests for progress calculation logic
  - Test calculateProgress function with various step combinations
  - Test weight-based progress calculation
  - Test market-specific progress calculation
  - _Requirements: 1.1_

- [x] 1.3 Write unit tests for gating logic
  - Test requireStep middleware with completed steps
  - Test requireStep middleware with incomplete steps
  - Test fail-open vs fail-closed behavior
  - _Requirements: 1.1_

- [x] 1.4 Write unit tests for step transition validation
  - Test valid transitions (todo → done, todo → skipped)
  - Test invalid transitions
  - Test required vs optional step transitions
  - _Requirements: 1.1_

- [x] 1.5 Write unit tests for repository layer
  - Test OnboardingStepDefinitionsRepository methods
  - Test UserOnboardingRepository methods
  - Test OnboardingEventsRepository methods
  - Mock database connections
  - _Requirements: 1.1_

- [x] 1.6 Write unit tests for middleware
  - Test onboarding-gating middleware with various scenarios
  - Test error handling and logging
  - Test correlation ID propagation
  - _Requirements: 1.1_

- [x] 2. Set up integration testing framework
- [x] 2.1 Configure test database and migrations
  - Create test database configuration
  - Write script to run migrations on test DB
  - Write script to seed test data
  - Add cleanup script to reset test DB
  - _Requirements: 1.2_

- [x] 2.2 Write integration tests for GET /api/onboarding
  - Test successful retrieval with authenticated user
  - Test market filtering
  - Test role filtering
  - Test cache behavior
  - Test error scenarios
  - _Requirements: 1.3_

- [x] 2.3 Write integration tests for PATCH /api/onboarding/steps/:id
  - Test successful step status update
  - Test optimistic locking conflicts
  - Test invalid status transitions
  - Test cache invalidation
  - _Requirements: 1.3_

- [x] 2.4 Write integration tests for POST /api/onboarding/snooze
  - Test successful snooze
  - Test snooze limit enforcement
  - Test snooze expiration
  - _Requirements: 1.3_

- [x] 2.5 Write integration tests for gating middleware
  - Test 409 response when step incomplete
  - Test successful access when step complete
  - Test gating on /api/store/publish
  - Test gating on /api/checkout/* routes
  - _Requirements: 1.3_

- [x] 2.6 Write integration tests for user flows
  - Test skip flow (skip → progress update)
  - Test done flow (complete → progress update)
  - Test snooze flow (snooze → hide nudge)
  - _Requirements: 1.3_

- [x] 3. Set up E2E testing framework
- [x] 3.1 Configure Playwright for E2E tests
  - Install @playwright/test
  - Create playwright.config.ts
  - Configure browsers (chromium, webkit for mobile)
  - Add E2E test scripts to package.json
  - _Requirements: 1.4_

- [x] 3.2 Write E2E test for new user onboarding flow
  - Test new account creation
  - Test dashboard loads with onboarding guide
  - Test guide displays correct steps
  - Test progress indicator shows 0%
  - _Requirements: 1.4_

- [x] 3.3 Write E2E test for step completion flow
  - Test clicking "Faire" button
  - Test step status updates to "done"
  - Test progress percentage increases
  - Test UI reflects new status
  - _Requirements: 1.4_

- [x] 3.4 Write E2E test for skip flow
  - Test clicking "Passer" on optional step
  - Test step status updates to "skipped"
  - Test progress updates correctly
  - _Requirements: 1.4_

- [x] 3.5 Write E2E test for gating modal flow
  - Test attempting to publish without payments
  - Test 409 modal appears
  - Test modal shows correct missing step
  - Test completing step dismisses modal
  - _Requirements: 1.4_

- [x] 3.6 Write E2E test for mobile responsiveness
  - Test guide displays correctly on mobile viewport
  - Test touch interactions work
  - Test modal is mobile-friendly
  - _Requirements: 1.4_

- [x] 4. Integrate tests into CI pipeline
- [x] 4.1 Add test commands to CI configuration
  - Configure GitHub Actions or CI tool
  - Add unit test step with coverage check
  - Add integration test step
  - Add E2E test step
  - Configure to fail build on test failure
  - _Requirements: 1.5_

## Phase 2: Feature Flags & Kill Switch (Week 1-2)

- [x] 5. Implement feature flag system
- [x] 5.1 Create feature flag configuration module
  - Create lib/feature-flags.ts with OnboardingFlags interface
  - Implement getFlags function to read from Redis/env
  - Implement consistent hashing for rollout percentage
  - Add market filtering logic
  - Add user whitelist logic
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 5.2 Integrate feature flags into onboarding middleware
  - Check feature flag before showing onboarding UI
  - Check feature flag before applying gating
  - Return gracefully when feature disabled
  - _Requirements: 2.1_

- [x] 5.3 Add feature flag admin API endpoint
  - Create POST /api/admin/feature-flags endpoint
  - Implement authentication check
  - Allow updating rollout percentage
  - Allow updating markets list
  - Allow updating user whitelist
  - _Requirements: 2.5_

- [x] 5.4 Add feature flag environment variables
  - Add ONBOARDING_ENABLED to .env.example
  - Add ONBOARDING_ROLLOUT_PERCENTAGE to .env.example
  - Add ONBOARDING_MARKETS to .env.example
  - Document configuration in README
  - _Requirements: 2.1_

- [x] 6. Implement kill switch system
- [x] 6.1 Create kill switch module
  - Create lib/onboarding-kill-switch.ts
  - Implement checkKillSwitch function using Redis
  - Implement activateKillSwitch function
  - Implement deactivateKillSwitch function
  - Add Redis pub/sub for instant propagation
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 6.2 Integrate kill switch into middleware
  - Check kill switch before gating logic
  - Disable gating when kill switch active
  - Log kill switch checks
  - _Requirements: 3.2_

- [x] 6.3 Integrate kill switch into UI components
  - Check kill switch in SetupGuide component
  - Hide onboarding UI when kill switch active
  - Show fallback content if needed
  - _Requirements: 3.3_

- [x] 6.4 Create kill switch admin API endpoint
  - Create POST /api/admin/kill-switch endpoint
  - Implement authentication check
  - Allow activating/deactivating kill switch
  - Log all kill switch operations
  - _Requirements: 3.5_

## Phase 3: Security Hardening (Week 2)

- [x] 7. Implement rate limiting
- [x] 7.1 Create rate limiting middleware
  - Create lib/middleware/rate-limit.ts
  - Implement Redis-based sliding window rate limiter
  - Support per-user and per-IP rate limiting
  - Return 429 with Retry-After header
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 7.2 Apply rate limiting to onboarding endpoints
  - Apply to PATCH /api/onboarding/steps/:id (20/min)
  - Apply to POST /api/onboarding/snooze (3/day)
  - Configure different limits per endpoint
  - _Requirements: 4.1, 4.2_

- [x] 7.3 Add rate limit monitoring
  - Log rate limit hits
  - Track rate limit metrics
  - Alert on excessive rate limiting
  - _Requirements: 4.3_

- [x] 8. Implement CSRF protection
- [x] 8.1 Create CSRF middleware
  - Create lib/middleware/csrf.ts
  - Implement double-submit token pattern
  - Generate CSRF token on session creation
  - Validate token on POST/PATCH/DELETE requests
  - _Requirements: 5.1, 5.2_

- [x] 8.2 Configure secure cookies
  - Set SameSite=Lax for session cookies
  - Set Secure flag in production
  - Set HttpOnly flag for auth cookies
  - _Requirements: 5.3, 5.4, 5.5_

- [x] 8.3 Apply CSRF protection to onboarding endpoints
  - Apply to PATCH /api/onboarding/steps/:id
  - Apply to POST /api/onboarding/snooze
  - Return 403 on CSRF validation failure
  - _Requirements: 5.2_

- [x] 9. Configure security headers
- [x] 9.1 Add security headers to next.config.js
  - Add Content-Security-Policy header
  - Add Strict-Transport-Security header
  - Add X-Frame-Options header
  - Add X-Content-Type-Options header
  - Add Referrer-Policy header
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 10. Implement role-based access control
- [x] 10.1 Create permission middleware
  - Create lib/middleware/check-permissions.ts
  - Implement requireOwner function
  - Implement role validation logic
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 10.2 Apply role checks to sensitive endpoints
  - Apply to payment step endpoints
  - Apply to owner-only step modifications
  - Return 403 for unauthorized access
  - _Requirements: 7.1, 7.2_

- [x] 10.3 Implement audit logging
  - Create audit log table/collection
  - Log all access to sensitive resources
  - Include user ID, action, resource, timestamp, IP
  - _Requirements: 7.4, 7.5_

## Phase 4: Observability (Week 2)

- [x] 11. Define and implement SLOs
- [x] 11.1 Create SLO configuration
  - Define SLOs in config file (YAML or JSON)
  - Document p95 latency targets (< 300ms)
  - Document error rate targets (< 0.5%)
  - Document availability targets (> 99.9%)
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 11.2 Implement SLO tracking
  - Track latency percentiles for each endpoint
  - Track error rates by status code
  - Track uptime/availability
  - Calculate SLO compliance hourly
  - _Requirements: 8.5_

- [x] 12. Create observability dashboard
- [x] 12.1 Set up metrics collection
  - Implement Prometheus-compatible metrics
  - Track HTTP status codes (2xx/4xx/5xx)
  - Track latency percentiles (p50/p95/p99)
  - Track 409 response rates
  - Track cache hit rates
  - Track active users count
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 12.2 Create Grafana dashboard
  - Create dashboard JSON configuration
  - Add overview panel (progress, users, completion)
  - Add performance panel (latency, throughput)
  - Add errors panel (4xx/5xx rates)
  - Add gating panel (409 rates by step)
  - Add infrastructure panel (cache, DB)
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 13. Configure alerting system
- [x] 13.1 Create alert rules
  - Create critical alert for 5xx rate > 1% (5min)
  - Create warning alert for p95 latency > 500ms (10min)
  - Create warning alert for 409 rate > 10% (10min)
  - Create warning alert for analytics drops > 5% (15min)
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 13.2 Configure alert destinations
  - Configure PagerDuty for critical alerts
  - Configure Slack for warning alerts
  - Include correlation IDs in alerts
  - Include relevant context in alerts
  - _Requirements: 10.5_

- [x] 14. Implement distributed tracing
- [x] 14.1 Create correlation ID middleware
  - Create lib/tracing.ts
  - Generate or propagate correlation ID
  - Add correlation ID to request context
  - Return correlation ID in response headers
  - _Requirements: 11.1, 11.5_

- [x] 14.2 Integrate correlation ID into logging
  - Add correlation ID to all log entries
  - Create logger child with correlation ID
  - _Requirements: 11.2_

- [x] 14.3 Integrate correlation ID into database queries
  - Add correlation ID to query comments
  - Log correlation ID with slow queries
  - _Requirements: 11.3_

- [x] 14.4 Integrate correlation ID into external API calls
  - Pass correlation ID in headers
  - Log correlation ID with API calls
  - _Requirements: 11.4_

## Phase 5: Backup & Recovery (Week 3)

- [x] 15. Implement backup strategy
- [x] 15.1 Create pre-migration backup script
  - Create scripts/backup-database.sh
  - Implement pg_dump with timestamp
  - Compress backup with gzip
  - Store in backups/ directory
  - _Requirements: 12.1_

- [x] 15.2 Configure continuous backups
  - Set up daily snapshots at 2 AM UTC
  - Configure point-in-time recovery
  - Set 30-day retention policy
  - _Requirements: 12.2, 12.3_

- [x] 15.3 Implement backup verification
  - Create scripts/verify-backup.sh
  - Test backup restoration weekly
  - Verify data integrity
  - Log verification results
  - _Requirements: 12.4_

- [x] 16. Create rollback procedure
- [x] 16.1 Write rollback SQL script
  - Create lib/db/migrations/rollback-onboarding.sql
  - Drop tables in reverse order
  - Drop functions
  - Make script idempotent
  - _Requirements: 13.1_

- [x] 16.2 Document rollback procedure
  - Create docs/ROLLBACK_PROCEDURE.md
  - Document step-by-step rollback process
  - Include database restore steps
  - Include application redeployment steps
  - Include verification steps
  - _Requirements: 13.2, 13.3_

- [x] 16.3 Test rollback on staging
  - Execute rollback procedure on staging
  - Verify system returns to previous state
  - Measure rollback time (target < 15min)
  - Document any issues
  - _Requirements: 13.4, 13.5_

- [x] 17. Implement migration dry-run
- [x] 17.1 Create anonymization script
  - Create scripts/anonymize-pii.sh
  - Anonymize user emails
  - Anonymize user names
  - Preserve data structure
  - _Requirements: 14.1_

- [x] 17.2 Create dry-run script
  - Create scripts/dry-run-migration.sh
  - Copy production data to staging
  - Run anonymization
  - Execute migration
  - Verify table creation
  - Verify data integrity
  - Seed test data
  - Run integration tests
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

## Phase 6: Versioning & Concurrency (Week 3)

- [x] 18. Implement step version migration
- [x] 18.1 Create version migration function
  - Create lib/db/migrations/migrate-step-version.ts
  - Implement migrateStepVersion function
  - Create new version in step_definitions table
  - Copy completed user progress to new version
  - Reset in-progress steps to todo
  - Recalculate user progress
  - Mark old version inactive
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 18.2 Add version migration API endpoint
  - Create POST /api/admin/onboarding/migrate-version
  - Implement authentication check
  - Call migrateStepVersion function
  - Return migration results
  - _Requirements: 15.1_

- [x] 18.3 Write tests for version migration
  - Test successful migration
  - Test completed progress preservation
  - Test in-progress reset
  - Test progress recalculation
  - Test transaction rollback on error
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 19. Implement optimistic locking
- [x] 19.1 Add row_version column to user_onboarding table
  - Create migration to add row_version column
  - Set default value to 1
  - Update existing rows
  - _Requirements: 16.3_

- [x] 19.2 Update step update logic with version check
  - Modify updateStepStatus to check row_version
  - Increment row_version on successful update
  - Return 409 on version mismatch
  - Include current state in 409 response
  - _Requirements: 16.1, 16.2, 16.4, 16.5_

- [x] 19.3 Update API endpoint to handle version conflicts
  - Modify PATCH /api/onboarding/steps/:id
  - Accept row_version in request body
  - Return 409 with current state on conflict
  - _Requirements: 16.2, 16.5_

- [x] 19.4 Write concurrency tests
  - Test 10 concurrent PATCH requests
  - Verify only 1 succeeds
  - Verify 9 return 409
  - Test retry logic
  - _Requirements: 16.1, 16.2_

## Phase 7: GDPR Compliance (Week 3)

- [x] 20. Create GDPR documentation
- [x] 20.1 Write data processing registry
  - Create docs/GDPR_REGISTRY.md
  - Document processing purpose
  - Document legal basis
  - Document data categories
  - Document retention periods
  - Document recipients
  - Document transfers
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [x] 20.2 Conduct DPIA if needed
  - Assess if DPIA is required
  - Document risks if applicable
  - Document mitigation measures
  - Get DPO validation if needed
  - _Requirements: 17.1_

- [x] 21. Implement data retention policy
- [x] 21.1 Create data cleanup script
  - Create scripts/cleanup-old-onboarding-data.ts
  - Delete events older than 365 days
  - Delete data for deleted users
  - Log deletion operations
  - _Requirements: 18.1, 18.2, 18.4_

- [x] 21.2 Configure cron job for cleanup
  - Set up daily cron at 2 AM UTC
  - Monitor execution time (< 30min)
  - Alert on failures
  - _Requirements: 18.3, 18.5_

- [x] 22. Implement data subject rights endpoints
- [x] 22.1 Create data export endpoint
  - Create POST /api/admin/dsr/export
  - Implement authentication check
  - Export user_onboarding data as JSON
  - Export onboarding_events data as JSON
  - _Requirements: 19.1, 19.2_

- [x] 22.2 Create data deletion endpoint
  - Create POST /api/admin/dsr/delete
  - Implement authentication check
  - Delete onboarding_events records
  - Delete user_onboarding records
  - Use transaction for atomicity
  - _Requirements: 19.3, 19.4_

- [x] 22.3 Document DSR procedures
  - Create docs/DSR_PROCEDURES.md
  - Document export process
  - Document deletion process
  - Document 30-day SLA
  - _Requirements: 19.5_

- [x] 23. Implement cookie consent
- [x] 23.1 Create cookie consent component
  - Create components/CookieConsent.tsx
  - Display banner on first visit
  - Store consent in localStorage
  - Provide accept/reject buttons
  - _Requirements: 20.1, 20.2, 20.3_

- [x] 23.2 Integrate consent with analytics
  - Check consent before tracking analytics
  - Disable analytics if consent rejected
  - Provide mechanism to withdraw consent
  - _Requirements: 20.3, 20.4, 20.5_

## Phase 8: Final Validation & Documentation

- [x] 24. Run full test suite
- [x] 24.1 Execute all unit tests with coverage report
  - Verify 80% line coverage achieved
  - Verify 80% branch coverage achieved
  - Fix any failing tests
  - _Requirements: 1.1, 1.2_

- [x] 24.2 Execute all integration tests
  - Verify all API endpoints tested
  - Verify all flows tested
  - Fix any failing tests
  - _Requirements: 1.3_

- [x] 24.3 Execute all E2E tests
  - Run on chromium and webkit
  - Verify all user flows work
  - Fix any failing tests
  - _Requirements: 1.4_

- [x] 25. Validate security measures
- [x] 25.1 Test rate limiting
  - Verify limits enforced correctly
  - Verify 429 responses
  - Verify Retry-After headers
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 25.2 Test CSRF protection
  - Verify tokens validated
  - Verify 403 on invalid tokens
  - Verify cookies configured correctly
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 25.3 Test security headers
  - Verify all headers present
  - Verify header values correct
  - Test with security scanner
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 25.4 Test role-based access control
  - Verify staff cannot access owner-only resources
  - Verify 403 responses
  - Verify audit logs created
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 26. Validate observability
- [x] 26.1 Verify metrics collection
  - Check all metrics being collected
  - Verify metric labels correct
  - Verify metrics in Prometheus
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 26.2 Verify dashboard displays correctly
  - Check all panels render
  - Verify data accuracy
  - Test time range selection
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 26.3 Test alerting
  - Trigger test alerts
  - Verify alerts sent to correct destinations
  - Verify alert content includes context
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 26.4 Verify distributed tracing
  - Check correlation IDs in logs
  - Check correlation IDs in responses
  - Trace request through system
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 27. Validate backup and recovery
- [x] 27.1 Test backup creation
  - Run backup script
  - Verify backup file created
  - Verify backup compressed
  - _Requirements: 12.1, 12.2_

- [x] 27.2 Test backup restoration
  - Restore from backup
  - Verify data integrity
  - Measure restoration time
  - _Requirements: 12.4, 12.5_

- [x] 27.3 Test rollback procedure
  - Execute full rollback on staging
  - Verify system restored
  - Verify rollback time < 15min
  - _Requirements: 13.4, 13.5_

- [x] 28. Create production deployment checklist
- [x] 28.1 Document pre-deployment steps
  - Create docs/PRODUCTION_DEPLOYMENT.md
  - List all environment variables
  - List all configuration changes
  - List all database migrations
  - _Requirements: All_

- [x] 28.2 Document rollout plan
  - Document 0% → 5% → 25% → 50% → 100% rollout
  - Document monitoring at each stage
  - Document rollback triggers
  - _Requirements: 2.1, 3.1_

- [x] 28.3 Create production runbook
  - Document common issues and solutions
  - Document emergency procedures
  - Document kill switch activation
  - Document rollback procedure
  - _Requirements: 3.1, 13.1, 13.2, 13.3_
