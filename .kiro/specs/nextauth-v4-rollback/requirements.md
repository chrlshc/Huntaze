# Requirements Document

## Introduction

The staging build is failing with 28 errors due to an incomplete Auth.js v5 migration. The codebase has Auth.js v5 installed (`next-auth@5.0.0-beta.30`) but 28 files are still using NextAuth v4 APIs (`getServerSession`, `authOptions`). This spec defines requirements for a complete rollback to NextAuth v4 to restore build functionality.

## Glossary

- **NextAuth v4**: The stable authentication library version that was previously working
- **Auth.js v5**: The beta version of NextAuth with breaking API changes
- **authOptions**: NextAuth v4 configuration object exported from route handler
- **getServerSession**: NextAuth v4 function for retrieving session server-side
- **auth()**: Auth.js v5 function that replaces getServerSession
- **handlers**: Auth.js v5 export that replaces NextAuth() route handler
- **Build System**: AWS Amplify CI/CD pipeline that compiles the application
- **Staging Environment**: Pre-production deployment environment at staging.huntaze.com

## Requirements

### Requirement 1: Restore NextAuth v4 Package

**User Story:** As a developer, I want to downgrade from Auth.js v5 to NextAuth v4, so that the authentication system uses stable, compatible APIs.

#### Acceptance Criteria

1. WHEN the package.json is updated, THE Build System SHALL install next-auth version 4.24.11 or compatible v4 version
2. WHEN dependencies are installed, THE Build System SHALL remove all Auth.js v5 beta packages
3. WHEN the package-lock.json is regenerated, THE Build System SHALL lock to NextAuth v4 versions

### Requirement 2: Restore NextAuth v4 Route Handler

**User Story:** As a developer, I want to restore the NextAuth v4 route handler configuration, so that the authentication API endpoints export authOptions and handle requests correctly.

#### Acceptance Criteria

1. WHEN the route handler is updated, THE Authentication System SHALL export authOptions configuration object
2. WHEN the route handler is updated, THE Authentication System SHALL use NextAuth() function to create route handlers
3. WHEN the route handler is updated, THE Authentication System SHALL export GET and POST handlers compatible with Next.js 16
4. WHEN the route handler is updated, THE Authentication System SHALL maintain all existing providers (Google, Credentials)
5. WHEN the route handler is updated, THE Authentication System SHALL maintain all existing callbacks (jwt, session)

### Requirement 3: Restore Session Management Utilities

**User Story:** As a developer, I want to restore NextAuth v4 session utilities, so that all API routes can retrieve user sessions using getServerSession.

#### Acceptance Criteria

1. WHEN lib/auth/session.ts is updated, THE Session Module SHALL import getServerSession from next-auth
2. WHEN lib/auth/session.ts is updated, THE Session Module SHALL import authOptions from the route handler
3. WHEN getSession() is called, THE Session Module SHALL use getServerSession(authOptions) to retrieve session
4. WHEN session utilities are used, THE Session Module SHALL maintain backward compatibility with existing code
5. WHEN session utilities are used, THE Session Module SHALL maintain all existing helper functions

### Requirement 4: Remove Auth.js v5 Configuration

**User Story:** As a developer, I want to remove Auth.js v5 configuration files, so that there are no conflicting authentication configurations.

#### Acceptance Criteria

1. WHEN auth.ts exists in project root, THE Build System SHALL remove or rename the file
2. WHEN v5 configuration is removed, THE Build System SHALL not import from @/auth module
3. WHEN v5 configuration is removed, THE Build System SHALL have no references to auth() function from @/auth
4. WHEN v5 configuration is removed, THE Build System SHALL have no references to handlers from @/auth

### Requirement 5: Verify Build Success

**User Story:** As a developer, I want to verify the build succeeds after rollback, so that the application can be deployed to staging.

#### Acceptance Criteria

1. WHEN npm run build is executed, THE Build System SHALL complete without errors
2. WHEN the build completes, THE Build System SHALL report 0 TypeScript errors
3. WHEN the build completes, THE Build System SHALL generate production-ready output
4. WHEN the build completes, THE Build System SHALL include all authentication routes
5. WHEN the build is deployed, THE Staging Environment SHALL serve the application successfully

### Requirement 6: Verify Authentication Functionality

**User Story:** As a user, I want authentication to work after rollback, so that I can sign in and access protected features.

#### Acceptance Criteria

1. WHEN a user visits /auth, THE Authentication System SHALL display the sign-in page
2. WHEN a user signs in with credentials, THE Authentication System SHALL authenticate successfully
3. WHEN a user signs in with Google OAuth, THE Authentication System SHALL redirect to Google and complete authentication
4. WHEN an authenticated user accesses protected routes, THE Authentication System SHALL allow access
5. WHEN an unauthenticated user accesses protected routes, THE Authentication System SHALL redirect to sign-in

### Requirement 7: Maintain Error Handling

**User Story:** As a developer, I want to maintain comprehensive error handling, so that authentication errors are logged and handled gracefully.

#### Acceptance Criteria

1. WHEN authentication errors occur, THE Authentication System SHALL log structured error messages
2. WHEN authentication errors occur, THE Authentication System SHALL return appropriate HTTP status codes
3. WHEN authentication errors occur, THE Authentication System SHALL provide user-friendly error messages
4. WHEN authentication errors occur, THE Authentication System SHALL include correlation IDs for tracing
5. WHEN authentication errors occur, THE Authentication System SHALL not expose sensitive information

### Requirement 8: Preserve Security Features

**User Story:** As a security engineer, I want to preserve all security features during rollback, so that the application remains secure.

#### Acceptance Criteria

1. WHEN the rollback is complete, THE Authentication System SHALL maintain NEXTAUTH_SECRET configuration
2. WHEN the rollback is complete, THE Authentication System SHALL maintain NEXTAUTH_URL configuration
3. WHEN the rollback is complete, THE Authentication System SHALL maintain secure session cookies
4. WHEN the rollback is complete, THE Authentication System SHALL maintain CSRF protection
5. WHEN the rollback is complete, THE Authentication System SHALL maintain rate limiting integration
