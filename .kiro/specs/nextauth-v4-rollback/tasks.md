# Implementation Plan

- [x] 1. Downgrade to NextAuth v4 package
  - Update package.json to use next-auth@^4.24.11
  - Remove node_modules and package-lock.json
  - Install dependencies with npm install
  - Verify correct version is installed
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Restore NextAuth v4 route handler
  - [x] 2.1 Create NextAuth v4 route handler with authOptions export
    - Import NextAuth and AuthOptions from next-auth
    - Import providers (GoogleProvider, CredentialsProvider)
    - Define and export authOptions configuration object
    - Create handler using NextAuth(authOptions)
    - Export GET and POST handlers
    - Add runtime and dynamic exports
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [x] 2.2 Preserve all authentication configuration
    - Maintain Google OAuth provider configuration
    - Maintain Credentials provider with bcrypt validation
    - Maintain JWT callback for token enrichment
    - Maintain session callback for session enrichment
    - Maintain pages configuration (signIn, error)
    - Maintain session strategy and maxAge
    - _Requirements: 2.4, 2.5_
  
  - [x] 2.3 Preserve error handling and logging
    - Maintain correlation ID generation
    - Maintain structured error logging
    - Maintain error type definitions
    - Maintain timeout handling
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 3. Update session management utilities
  - [x] 3.1 Update imports to use NextAuth v4 APIs
    - Import getServerSession from next-auth
    - Import authOptions from route handler
    - Remove imports from @/auth module
    - _Requirements: 3.1, 3.2_
  
  - [x] 3.2 Update getSession() implementation
    - Use getServerSession(authOptions) instead of auth()
    - Maintain error handling with try-catch
    - Maintain return type as ExtendedSession | null
    - _Requirements: 3.3, 3.4, 3.5_
  
  - [x] 3.3 Update getSessionFromRequest() implementation
    - Use getServerSession(authOptions) instead of auth()
    - Maintain error handling and logging
    - Maintain request parameter for API routes
    - _Requirements: 3.3, 3.4, 3.5_
  
  - [x] 3.4 Verify all helper functions work
    - Test getCurrentUser()
    - Test getCurrentUserId()
    - Test requireAuth()
    - Test requireRole()
    - Test isAuthenticated()
    - Test validateOwnership()
    - _Requirements: 3.4, 3.5_

- [x] 4. Remove Auth.js v5 configuration
  - [x] 4.1 Backup and remove auth.ts file
    - Rename auth.ts to auth.ts.v5-backup
    - Verify no imports from @/auth remain
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 4.2 Verify no v5 API references remain
    - Search codebase for auth() function calls
    - Search codebase for handlers imports
    - Search codebase for @/auth imports
    - _Requirements: 4.2, 4.3, 4.4_

- [x] 5. Verify build success
  - [x] 5.1 Run local build verification
    - Execute npm run build
    - Verify 0 TypeScript errors
    - Verify 0 build errors
    - Verify production output generated
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [x] 5.2 Run type checking
    - Execute npx tsc --noEmit
    - Verify 0 type errors
    - _Requirements: 5.2_
  
  - [x] 5.3 Verify import patterns
    - Search for authOptions imports (should find 28+ files)
    - Search for getServerSession imports (should find multiple files)
    - Verify no @/auth imports remain
    - _Requirements: 5.1, 5.2_

- [x] 6. Test authentication functionality
  - [x] 6.1 Test sign-in page
    - Start dev server
    - Navigate to /auth
    - Verify sign-in form displays
    - _Requirements: 6.1_
  
  - [x] 6.2 Test credential authentication
    - Submit valid credentials
    - Verify successful authentication
    - Verify session created
    - Verify redirect to dashboard
    - _Requirements: 6.2_
  
  - [x] 6.3 Test OAuth authentication
    - Click Google sign-in button
    - Verify redirect to Google
    - Complete OAuth flow
    - Verify successful authentication
    - _Requirements: 6.3_
  
  - [x] 6.4 Test protected routes
    - Access protected route while authenticated
    - Verify access granted
    - Sign out and access protected route
    - Verify redirect to sign-in
    - _Requirements: 6.4, 6.5_

- [x] 7. Verify security features
  - [x] 7.1 Verify environment variables
    - Check NEXTAUTH_SECRET is set
    - Check NEXTAUTH_URL is correct
    - Check OAuth credentials are configured
    - _Requirements: 8.1, 8.2_
  
  - [x] 7.2 Verify session security
    - Inspect session cookie settings
    - Verify httpOnly flag is set
    - Verify secure flag is set (production)
    - Verify sameSite is configured
    - _Requirements: 8.3, 8.4_
  
  - [x] 7.3 Verify error handling
    - Test invalid credentials
    - Verify appropriate error message
    - Verify no sensitive data leaked
    - Verify correlation ID in logs
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [-] 8. Deploy and verify staging
  - [-] 8.1 Commit changes
    - Stage all modified files
    - Create commit with descriptive message
    - Push to repository
    - _Requirements: 5.5_
  
  - [ ] 8.2 Monitor Amplify build
    - Watch build logs in AWS Amplify Console
    - Verify build completes successfully
    - Verify 0 errors in build output
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ] 8.3 Test staging authentication
    - Navigate to staging.huntaze.com/auth
    - Test credential sign-in
    - Test Google OAuth sign-in
    - Verify protected routes work
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
