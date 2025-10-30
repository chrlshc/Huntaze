# Implementation Plan

- [x] 1. Create modern auth helpers module
  - Create `lib/auth-helpers.ts` with `getSession()`, `requireAuth()`, `getCurrentUser()`, and `requireUser()` functions
  - Export all helper functions with proper TypeScript types
  - Add JSDoc comments explaining when to use each helper
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2. Remove obsolete authentication files
  - [x] 2.1 Remove `lib/auth.ts` containing obsolete `getServerSession()` stub
    - Delete the file
    - _Requirements: 1.1_
  
  - [x] 2.2 Remove `lib/server-auth.ts` containing NextAuth v4 patterns
    - Delete the file
    - _Requirements: 1.2_
  
  - [x] 2.3 Remove `lib/middleware/api-auth.ts` containing obsolete `getToken()` usage
    - Delete the file
    - _Requirements: 1.3_
  
  - [x] 2.4 Remove `lib/middleware/auth-middleware.ts` containing obsolete middleware patterns
    - Delete the file
    - _Requirements: 1.4_
  
  - [x] 2.5 Remove `src/lib/platform-auth.ts` containing NextAuth v4 configuration
    - Delete the file
    - _Requirements: 1.5_

- [x] 3. Scan and update obsolete imports
  - [x] 3.1 Search for imports from `next-auth/next` in the codebase
    - Use grep to find all occurrences
    - Document files that need updates
    - _Requirements: 5.1_
  
  - [x] 3.2 Search for imports from `next-auth/jwt` in the codebase
    - Use grep to find all occurrences
    - Document files that need updates
    - _Requirements: 5.2_
  
  - [x] 3.3 Replace `getServerSession` imports with `auth` from `@/auth`
    - Update all identified files
    - Replace function calls accordingly
    - _Requirements: 5.3, 2.1_
  
  - [x] 3.4 Replace `getToken` imports with `auth` from `@/auth`
    - Update all identified files
    - Replace function calls accordingly
    - _Requirements: 5.4, 2.1_
  
  - [x] 3.5 Verify no NextAuth v4 API references remain
    - Run final grep search
    - Confirm clean migration
    - _Requirements: 5.5_

- [x] 4. Create migration documentation
  - [x] 4.1 Create `docs/auth-migration-guide.md` with overview and benefits
    - Document what changed and why
    - Explain Auth.js v5 benefits
    - _Requirements: 6.1_
  
  - [x] 4.2 Document breaking changes and API mapping
    - List removed files and replacements
    - Provide old vs new API comparison table
    - _Requirements: 6.2_
  
  - [x] 4.3 Add migration steps with code examples
    - Step-by-step migration guide
    - Before/after code examples
    - _Requirements: 6.3_
  
  - [x] 4.4 Document when to use Auth.js v5 vs custom JWT system
    - Explain use cases for each system
    - Provide decision tree
    - _Requirements: 6.4, 4.3_
  
  - [x] 4.5 Add troubleshooting section
    - List common issues
    - Provide solutions
    - List all removed files
    - _Requirements: 6.5_

- [x] 5. Write unit tests for auth helpers
  - [x] 5.1 Create `tests/unit/lib/auth-helpers.test.ts`
    - Test `getSession()` returns session when authenticated
    - Test `getSession()` returns null when not authenticated
    - Test `requireAuth()` returns session when authenticated
    - Test `requireAuth()` throws when not authenticated
    - Test `getCurrentUser()` returns user when authenticated
    - Test `getCurrentUser()` returns null when not authenticated
    - Test `requireUser()` returns user when authenticated
    - Test `requireUser()` throws when not authenticated
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 6. Write migration validation tests
  - [x] 6.1 Create `tests/unit/auth-migration-validation.test.ts`
    - Verify `lib/auth.ts` is removed
    - Verify `lib/server-auth.ts` is removed
    - Verify `lib/middleware/api-auth.ts` is removed
    - Verify `lib/middleware/auth-middleware.ts` is removed
    - Verify `src/lib/platform-auth.ts` is removed
    - Verify no imports from `next-auth/next` exist
    - Verify no imports from `next-auth/jwt` exist
    - Verify no usage of `getServerSession` exists
    - Verify no usage of `getToken` exists
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 7. Write integration tests for auth flows
  - [x] 7.1 Create `tests/integration/auth-flow.test.ts`
    - Test login flow with credentials provider
    - Test session persistence after login
    - Test logout flow
    - Test protected route access with valid session
    - Test protected route redirect without session
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 8. Write regression tests for compatibility
  - [x] 8.1 Create `tests/regression/auth-compatibility.test.ts`
    - Verify existing auth flows still work after migration
    - Verify custom JWT system (`auth-service.ts`) still works
    - Verify no breaking changes to authentication API
    - Verify session data structure unchanged
    - Verify middleware protection still works
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
