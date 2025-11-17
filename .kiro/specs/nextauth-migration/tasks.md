# Implementation Plan

- [x] 1. Create authentication utilities and components
  - Create ProtectedRoute wrapper component that checks NextAuth session
  - Create requireAuth utility for API route protection
  - Create useAuthSession hook as wrapper around NextAuth useSession
  - _Requirements: 3.5, 4.2, 5.5_

- [x] 2. Update root layout with SessionProvider
  - Move SessionProvider from individual pages to root layout
  - Remove duplicate SessionProvider from /auth/auth-client.tsx
  - Remove duplicate SessionProvider from /onboarding/onboarding-client.tsx
  - Test that session is available globally across all pages
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. Migrate dashboard pages to NextAuth
- [x] 3.1 Migrate /dashboard page
  - Wrap dashboard page with ProtectedRoute component
  - Replace useAuth with useAuthSession hook
  - Remove localStorage token checks
  - Test navigation from /onboarding to /dashboard maintains session
  - _Requirements: 3.1, 1.2_

- [x] 3.2 Migrate /analytics pages
  - Wrap /analytics/advanced page with ProtectedRoute
  - Update analytics API calls to use NextAuth session
  - Remove legacy auth checks
  - Test analytics page doesn't disconnect user
  - _Requirements: 3.2, 1.1_

- [x] 3.3 Migrate OnlyFans pages
  - Wrap OnlyFans-related pages with ProtectedRoute
  - Update to use useAuthSession hook
  - Test OnlyFans pages maintain session
  - _Requirements: 3.3, 1.1_

- [x] 3.4 Migrate remaining protected pages
  - Identify all remaining protected routes
  - Wrap each with ProtectedRoute component
  - Replace useAuth with useAuthSession
  - Test all pages maintain session during navigation
  - _Requirements: 3.4, 1.1_

- [x] 4. Migrate API routes to NextAuth
- [x] 4.1 Update analytics API routes
  - Replace Bearer token validation with requireAuth utility
  - Extract user data from NextAuth session
  - Return 401 for unauthenticated requests
  - Test API routes with authenticated requests
  - _Requirements: 4.1, 4.2, 4.4_

- [x] 4.2 Update OnlyFans API routes
  - Apply requireAuth utility to all OnlyFans endpoints
  - Remove localStorage token validation
  - Test API functionality with NextAuth sessions
  - _Requirements: 4.1, 4.2, 4.4_

- [x] 4.3 Update remaining API routes
  - Apply requireAuth to all protected API endpoints
  - Maintain OAuth callback compatibility
  - Test all API routes return 401 when unauthenticated
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [ ] 5. Remove legacy authentication system
- [x] 5.1 Deprecate AuthProvider
  - Add deprecation warnings to AuthProvider
  - Make AuthProvider a no-op wrapper
  - Add console warnings for legacy useAuth usage
  - _Requirements: 2.1, 2.4_

- [x] 5.2 Remove legacy API endpoints
  - Delete /api/auth/verify endpoint
  - Remove Bearer token validation logic
  - Update API documentation
  - _Requirements: 2.2, 4.3_

- [x] 5.3 Clean up localStorage usage
  - Remove all localStorage.getItem('auth_token') calls
  - Remove localStorage.setItem('auth_token') calls
  - Add cleanup on NextAuth login to clear legacy tokens
  - _Requirements: 2.3, 6.5_

- [x] 5.4 Remove AuthProvider from codebase
  - Delete components/auth/AuthProvider.tsx
  - Remove AuthProvider from root layout
  - Delete legacy useAuth hook
  - Update imports across codebase
  - _Requirements: 2.1, 2.4, 2.5_

- [x] 6. Implement session management features
- [x] 6.1 Add session persistence
  - Configure NextAuth session maxAge based on "Remember Me"
  - Set 30-day expiration for remembered sessions
  - Set 24-hour expiration for non-remembered sessions
  - Test session persistence across browser restarts
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 6.2 Add session expiration handling
  - Implement session expiration detection in ProtectedRoute
  - Show expiration message when redirecting to /auth
  - Add session refresh mechanism for active users
  - Test expiration handling and user feedback
  - _Requirements: 5.4, 5.5, 7.2_

- [x] 6.3 Implement error handling
  - Add error messages for invalid credentials
  - Add error messages for network failures
  - Add error messages for session expiration
  - Add error logging for debugging
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 7. Update authentication pages
- [x] 7.1 Update /auth page
  - Ensure login redirects based on onboarding status
  - Add "Remember Me" checkbox functionality
  - Implement error message display
  - Test login flow with both new and existing users
  - _Requirements: 1.1, 5.2, 5.3, 7.1_

- [x] 7.2 Add logout functionality
  - Implement logout button in navigation/header
  - Call NextAuth signOut() function
  - Redirect to /auth after logout
  - Clear any cached data on logout
  - _Requirements: 1.4, 7.4_

- [x] 8. Testing and validation
- [x] 8.1 Write integration tests
  - Test login flow redirects correctly
  - Test protected routes redirect when unauthenticated
  - Test API routes return 401 for unauthenticated requests
  - Test session persistence across navigation
  - Test logout clears session and redirects
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 8.2 Perform manual testing
  - Test registration and onboarding flow
  - Test login with existing account
  - Test navigation across all protected pages
  - Test "Remember Me" functionality
  - Test logout from different pages
  - Test session expiration
  - Test browser refresh maintains session
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 9. Documentation and deployment
- [x] 9.1 Update documentation
  - Document new authentication flow
  - Update API documentation for session-based auth
  - Create migration guide for developers
  - Document troubleshooting steps
  - _Requirements: All_

- [x] 9.2 Deploy to staging
  - Deploy changes to staging environment
  - Run automated test suite
  - Perform manual testing on staging
  - Monitor logs for errors
  - _Requirements: All_

- [x] 9.3 Deploy to production
  - Deploy during low-traffic period
  - Monitor authentication metrics
  - Watch for 401 errors
  - Provide user support for any issues
  - _Requirements: All_
