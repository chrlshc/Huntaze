# Implementation Plan

- [x] 1. Database schema updates
  - Add `onboarding_completed` column to users table with default value false
  - Backfill existing users with `onboarding_completed = true` for backward compatibility
  - Create index on `onboarding_completed` for query performance
  - _Requirements: 1.3, 2.1, 5.3, 5.4_

- [x] 2. Extend NextAuth type definitions
  - Update `lib/types/auth.ts` to extend NextAuth Session interface with `onboardingCompleted` field
  - Update User interface to include `onboardingCompleted` field
  - Update JWT interface to include `onboardingCompleted` field
  - _Requirements: 2.3_

- [x] 3. Update NextAuth configuration
  - [x] 3.1 Modify authorize callback to fetch `onboarding_completed` from database
    - Update database query in authorize callback to include `onboarding_completed` field
    - Return `onboardingCompleted` in user object
    - _Requirements: 2.1, 2.4_

  - [x] 3.2 Update JWT callback to include onboarding status
    - Add `onboardingCompleted` to JWT token when user signs in
    - Implement refresh logic on 'update' trigger to sync onboarding status
    - _Requirements: 2.3, 2.4_

  - [x] 3.3 Update session callback to include onboarding status
    - Add `onboardingCompleted` to session.user from JWT token
    - _Requirements: 2.3, 2.4_

- [x] 4. Update registration service
  - Modify `lib/services/auth/register.ts` to set `onboarding_completed = false` when creating new users
  - Ensure database INSERT includes the new field
  - _Requirements: 1.1, 2.1_

- [x] 5. Implement onboarding completion API
  - Create `/api/onboard/complete/route.ts` endpoint
  - Verify user authentication using NextAuth session
  - Update `onboarding_completed = true` in database
  - Optionally save onboarding answers to database
  - Return success response
  - _Requirements: 2.2, 4.2, 4.3_

- [x] 6. Update auth page routing logic
  - [x] 6.1 Modify login flow to check onboarding status
    - Import `getSession` from next-auth/react
    - After successful login, fetch session to get `onboardingCompleted` status
    - Redirect to `/onboarding` if `onboardingCompleted` is false
    - Redirect to `/dashboard` if `onboardingCompleted` is true
    - _Requirements: 1.2, 1.3, 5.1_

  - [x] 6.2 Modify registration flow to redirect to onboarding
    - After successful registration and auto-login, redirect to `/onboarding`
    - _Requirements: 1.1_

- [x] 7. Update onboarding page
  - [x] 7.1 Remove token-based authentication
    - Remove token parameter check from useEffect
    - Remove localStorage token logic
    - Remove redirect to `/join` for missing token
    - _Requirements: 3.2_

  - [x] 7.2 Implement NextAuth session-based authentication
    - Import `useSession` from next-auth/react
    - Check authentication status using NextAuth session
    - Redirect to `/auth` if user is not authenticated
    - Redirect to `/dashboard` if user has already completed onboarding
    - Show loading state while checking authentication
    - _Requirements: 3.1, 3.3, 3.4, 5.2_

  - [x] 7.3 Update onboarding completion handlers
    - Modify `handleComplete` to call `/api/onboard/complete` with answers
    - Modify `handleSkip` to call `/api/onboard/complete` with skipped flag
    - Redirect to `/dashboard` after successful completion
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 8. Create database migration script
  - Create SQL migration file with ALTER TABLE and UPDATE statements
  - Include rollback instructions
  - Document migration steps for staging and production
  - _Requirements: 5.4_

- [x] 9. Write integration tests
  - Test registration flow redirects to onboarding
  - Test login flow with incomplete onboarding redirects to onboarding
  - Test login flow with completed onboarding redirects to dashboard
  - Test onboarding completion updates database and redirects to dashboard
  - Test onboarding skip updates database and redirects to dashboard
  - _Requirements: 1.1, 1.2, 1.3, 4.4_

- [x] 10. Update documentation
  - Document new authentication flow in README
  - Document onboarding completion API endpoint
  - Update deployment guide with migration steps
  - _Requirements: All_
