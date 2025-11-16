# Implementation Plan - NextAuth Staging 500 Error Fix

- [x] 1. Create diagnostic routes for isolation testing
  - Create ultra-simple `/api/ping` route with no dependencies
  - Create `/api/health-check` route excluded from middleware matcher
  - Add structured logging to both routes with correlation IDs
  - Deploy and verify both routes return 200 on staging
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 5.1, 5.2_

- [ ] 2. Implement structured logging system
  - [x] 2.1 Create centralized logger utility with correlation ID generation
    - Write `lib/utils/logger.ts` with `createLogger()` function
    - Implement `LogContext` interface with timestamp, service, level, metadata
    - Add `generateCorrelationId()` function for request tracing
    - Export logger factory for use across the application
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 2.2 Add logging to existing test-env route
    - Update `/api/test-env/route.ts` to use new logger
    - Add correlation ID to response headers
    - Log request start, completion, and errors with structured format
    - Include performance metrics (duration) in logs
    - _Requirements: 1.4, 5.1, 5.2, 5.3, 5.4_

- [x] 3. Update middleware with fail-safe error handling
  - [x] 3.1 Add bypass logic for diagnostic and auth routes
    - Exclude `/api/ping`, `/api/health-check`, `/api/auth/*` from rate limiting
    - Log when routes are bypassed for debugging
    - Update middleware matcher configuration if needed
    - _Requirements: 2.2, 2.4_

  - [x] 3.2 Implement fail-open error handling for rate limiter
    - Wrap rate limiting logic in try-catch block
    - Log errors but allow request to continue (fail open)
    - Add structured logging for middleware errors
    - Ensure no request is blocked due to rate limiter errors
    - _Requirements: 1.3, 2.4, 5.3_

  - [x] 3.3 Add lazy loading for rate limiter modules
    - Convert rate limiter imports to dynamic imports
    - Handle import failures gracefully
    - Cache loaded modules for performance
    - _Requirements: 3.5_

- [x] 4. Optimize NextAuth configuration for serverless
  - [x] 4.1 Remove all synchronous external dependencies
    - Remove imports of `@/lib/db`, `bcryptjs`, `ioredis` from config
    - Ensure only NextAuth core modules are imported
    - Verify no database connections during initialization
    - Keep JWT-only session strategy
    - _Requirements: 3.1, 3.2, 3.4, 4.1, 4.2_

  - [x] 4.2 Implement test credentials authorization
    - Update `authorize()` function to accept any valid email/password
    - Return test user object without database validation
    - Add logging for authorization attempts
    - Ensure function completes in < 100ms
    - _Requirements: 4.1, 4.3, 4.4_

  - [x] 4.3 Add structured logging to NextAuth handlers
    - Log initialization, authorization attempts, session creation
    - Include correlation IDs in all NextAuth logs
    - Log performance metrics for auth operations
    - Disable debug mode in production to reduce noise
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 5. Update Next.js configuration for better debugging
  - [x] 5.1 Preserve console logs in staging environment
    - Modify `compiler.removeConsole` to only apply in production
    - Add environment check for `AMPLIFY_ENV === 'production'`
    - Ensure staging logs are visible in CloudWatch
    - _Requirements: 1.1, 5.1_

  - [x] 5.2 Add explicit runtime configuration for NextAuth
    - Add `serverComponentsExternalPackages: ['next-auth']` to experimental config
    - Verify webpack configuration doesn't interfere with NextAuth
    - Document any Next.js 16 specific configurations
    - _Requirements: 3.2, 3.3_

- [x] 6. Deploy and test Phase 1 (Isolation)
  - [x] 6.1 Deploy diagnostic routes to staging
    - Commit changes for `/api/ping` and `/api/health-check`
    - Push to staging branch
    - Wait for Amplify build to complete
    - _Requirements: 6.1, 6.2_

  - [x] 6.2 Verify diagnostic routes work
    - Test `curl https://staging.huntaze.com/api/ping`
    - Test `curl https://staging.huntaze.com/api/health-check`
    - Verify both return 200 status
    - Check CloudWatch logs for structured log entries
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 6.3 Test test-env route with middleware
    - Test `curl https://staging.huntaze.com/api/test-env`
    - Verify returns 200 or specific error (not generic 500)
    - Check logs for middleware bypass confirmation
    - Verify correlation IDs in response headers
    - _Requirements: 1.4, 2.4, 5.2_

- [x] 7. Deploy and test Phase 2 (NextAuth)
  - [x] 7.1 Deploy NextAuth configuration changes
    - Commit simplified NextAuth config
    - Commit middleware fail-safe changes
    - Push to staging and wait for build
    - _Requirements: 3.1, 3.2, 4.1, 4.2_

  - [x] 7.2 Test NextAuth signin endpoint
    - Test `curl -I https://staging.huntaze.com/api/auth/signin`
    - Verify returns 200 status (not 500)
    - Check CloudWatch logs for NextAuth initialization logs
    - Verify no database connection errors
    - _Requirements: 4.2, 4.3, 6.1_

  - [x] 7.3 Test full authentication flow
    - Navigate to `https://staging.huntaze.com/auth`
    - Enter test credentials (any email/password)
    - Verify successful login and session creation
    - Verify redirect to dashboard works
    - Check logs for complete auth flow
    - _Requirements: 4.3, 4.4, 6.3, 6.4_

- [ ] 8. Validate solution stability
  - [ ] 8.1 Run load test with 100 consecutive requests
    - Use script to make 100 requests to `/api/auth/signin`
    - Verify all return 200 status
    - Calculate error rate (should be 0%)
    - Check for any timeouts or connection errors
    - _Requirements: 6.5_

  - [ ] 8.2 Run sustained load test
    - Make 1000 requests over 5 minutes to various endpoints
    - Monitor error rate (target < 0.1%)
    - Monitor p95 latency (target < 500ms)
    - Verify rate limiting works correctly
    - _Requirements: 6.5_

  - [ ] 8.3 Verify CloudWatch logging and monitoring
    - Query CloudWatch logs for correlation IDs
    - Verify structured logs are parseable
    - Check that all error logs include stack traces
    - Verify performance metrics are logged
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 9. Document solution and create runbook
  - [ ] 9.1 Create diagnostic runbook
    - Document how to check CloudWatch logs
    - Document correlation ID tracing process
    - List common error patterns and solutions
    - Include curl commands for testing
    - _Requirements: 1.1, 1.4, 5.2_

  - [ ] 9.2 Document progressive enhancement path
    - Document how to add database validation back
    - Document how to add bcrypt password hashing
    - Document how to add OAuth providers
    - Include testing checklist for each phase
    - _Requirements: 4.1, 4.2_

  - [ ] 9.3 Create monitoring dashboard
    - Set up CloudWatch dashboard for auth metrics
    - Add widgets for error rate, latency, success rate
    - Configure alarms for critical thresholds
    - Document how to interpret metrics
    - _Requirements: 5.1, 5.2, 5.3_
