# Implementation Plan

- [x] 1. Create middleware types and base infrastructure
  - Create `lib/middleware/types.ts` with RouteHandler type
  - Ensure compatibility with Next.js 16.0.3 App Router
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [x] 2. Implement corrected auth middleware
  - Create/update `lib/middleware/auth.ts` with proper types
  - Implement session checking with NextAuth v5
  - Implement admin role verification
  - Add user attachment to request
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2.1 Write property test for auth middleware
  - **Property 2: Auth Middleware Rejection**
  - **Validates: Requirements 3.2**

- [x] 2.2 Write property test for admin access control
  - **Property 3: Admin Access Control**
  - **Validates: Requirements 3.4**

- [x] 3. Implement corrected CSRF middleware
  - Create/update `lib/middleware/csrf.ts` with proper types
  - Implement GET request bypass
  - Implement token validation logic
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 3.1 Write property test for CSRF GET bypass
  - **Property 4: CSRF GET Request Bypass**
  - **Validates: Requirements 4.1**

- [x] 3.2 Write property test for CSRF token validation
  - **Property 5: CSRF Token Validation**
  - **Validates: Requirements 4.4**

- [x] 4. Implement corrected rate limit middleware
  - Create/update `lib/middleware/rate-limit.ts` with proper types
  - Implement IP extraction from x-forwarded-for
  - Implement Redis-based rate limiting
  - Implement fail-open error handling
  - Add rate limit headers to responses
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 4.1 Write property test for IP extraction
  - **Property 6: Rate Limit IP Extraction**
  - **Validates: Requirements 5.2**

- [x] 4.2 Write property test for rate limit enforcement
  - **Property 7: Rate Limit Enforcement**
  - **Validates: Requirements 5.4, 5.5**

- [x] 4.3 Write property test for fail-open behavior
  - **Property 8: Rate Limit Fail Open**
  - **Validates: Requirements 5.6**

- [x] 5. Update Next.js configuration for version 16
  - Update `next.config.ts` with correct Next.js 16 API
  - Configure output: 'standalone' for Amplify Compute
  - Configure Turbopack for development
  - Configure security headers
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 5.1 Write property test for security headers
  - **Property 10: Security Headers Presence**
  - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

- [x] 6. Update CSRF token route
  - Update `app/api/csrf/token/route.ts`
  - Implement correct cookie domain logic
  - Configure cookie security settings
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 6.1 Write property test for CSRF cookie domain
  - **Property 9: CSRF Cookie Domain**
  - **Validates: Requirements 8.1**

- [x] 7. Update API routes to use corrected middlewares
  - Update `app/api/auth/login/route.ts`
  - Update other API routes using middlewares
  - Ensure proper middleware composition
  - Remove double exports
  - _Requirements: 1.5, 2.3_

- [x] 7.1 Write property test for middleware type safety
  - **Property 1: Middleware Type Safety**
  - **Validates: Requirements 1.1, 1.2, 2.2**

- [x] 8. Verify Amplify configuration
  - Review `amplify.yml` configuration
  - Verify compute type is set to container
  - Verify VPC configuration
  - Verify build commands
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Local testing and validation
  - Run TypeScript compiler to check for type errors
  - Run unit tests
  - Run integration tests
  - Test API routes manually
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 11. Final checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Integrate middlewares into API routes
  - Update existing API routes to use the new middleware system
  - Apply withAuth to protected routes
  - Apply withCsrf to state-changing routes
  - Apply withRateLimit to public endpoints
  - _Requirements: 1.5, 3.1, 4.1, 5.1_

- [-] 13. Commit and push changes
  - Stage all changes
  - Create commit with descriptive message
  - Push to remote repository
  - _Requirements: All_
