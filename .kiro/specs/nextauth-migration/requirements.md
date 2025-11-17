# Requirements Document

## Introduction

This specification defines the requirements for migrating the entire Huntaze application from the legacy localStorage-based authentication system to NextAuth v5. Currently, the app has two authentication systems running in parallel: the new NextAuth system (used by /auth and /onboarding pages) and the legacy AuthProvider system (used by dashboard, analytics, and other protected pages). This creates a fragmented user experience where users get disconnected when navigating between different sections of the app.

## Glossary

- **NextAuth System**: The new authentication system using NextAuth v5 with server-side sessions stored in the database
- **Legacy System**: The old authentication system using localStorage tokens and the AuthProvider context
- **Protected Route**: A page that requires user authentication to access
- **Session**: User authentication state managed by NextAuth
- **AuthProvider**: The legacy React context component that manages localStorage-based authentication
- **SessionProvider**: The NextAuth React context component that provides session data to client components

## Requirements

### Requirement 1: Unified Authentication System

**User Story:** As a user, I want to stay logged in when navigating between all pages of the app, so that I have a seamless experience.

#### Acceptance Criteria

1. WHEN a user logs in via the /auth page, THE Huntaze_App SHALL maintain their session across all protected routes including dashboard, analytics, and platform-specific pages
2. WHEN a user navigates from /onboarding to /dashboard, THE Huntaze_App SHALL preserve their authentication state without requiring re-login
3. WHEN a user accesses any protected route, THE Huntaze_App SHALL use NextAuth session validation exclusively
4. WHEN a user logs out from any page, THE Huntaze_App SHALL clear their NextAuth session and redirect them to the login page

### Requirement 2: Legacy System Removal

**User Story:** As a developer, I want to remove the legacy authentication system, so that the codebase is maintainable and consistent.

#### Acceptance Criteria

1. THE Huntaze_App SHALL remove all localStorage token management code from the AuthProvider component
2. THE Huntaze_App SHALL remove the legacy /api/auth/verify endpoint that validates localStorage tokens
3. THE Huntaze_App SHALL remove all references to localStorage.getItem('auth_token') from client components
4. THE Huntaze_App SHALL deprecate the useAuth hook in favor of NextAuth's useSession hook
5. THE Huntaze_App SHALL remove the legacy login and register methods from AuthProvider

### Requirement 3: Protected Routes Migration

**User Story:** As a user, I want all dashboard and analytics pages to work with my NextAuth session, so that I don't get logged out unexpectedly.

#### Acceptance Criteria

1. WHEN a user accesses /dashboard, THE Huntaze_App SHALL verify their NextAuth session and display the dashboard content
2. WHEN a user accesses /analytics/advanced, THE Huntaze_App SHALL verify their NextAuth session and display analytics data
3. WHEN a user accesses any OnlyFans-related page, THE Huntaze_App SHALL verify their NextAuth session before rendering content
4. WHEN an unauthenticated user attempts to access a protected route, THE Huntaze_App SHALL redirect them to /auth
5. THE Huntaze_App SHALL wrap all protected page components with SessionProvider to enable useSession hook access

### Requirement 4: API Route Protection

**User Story:** As a developer, I want all API routes to validate NextAuth sessions, so that the backend is secure and consistent.

#### Acceptance Criteria

1. WHEN an API route receives a request, THE Huntaze_App SHALL validate the NextAuth session using getServerSession
2. WHEN an API route detects an invalid or missing session, THE Huntaze_App SHALL return a 401 Unauthorized response
3. THE Huntaze_App SHALL remove all Bearer token validation logic from API routes
4. THE Huntaze_App SHALL update all API routes to extract user information from the NextAuth session object
5. THE Huntaze_App SHALL maintain backward compatibility for OAuth callback routes (Instagram, TikTok, Reddit)

### Requirement 5: Session Management

**User Story:** As a user, I want my session to persist across browser refreshes, so that I don't have to log in repeatedly.

#### Acceptance Criteria

1. WHEN a user closes and reopens their browser, THE Huntaze_App SHALL restore their NextAuth session if it hasn't expired
2. THE Huntaze_App SHALL set session expiration to 30 days for users who select "Remember Me"
3. THE Huntaze_App SHALL set session expiration to 24 hours for users who don't select "Remember Me"
4. WHEN a session expires, THE Huntaze_App SHALL redirect the user to /auth with a message indicating session expiration
5. THE Huntaze_App SHALL provide a session refresh mechanism to extend active sessions

### Requirement 6: Backward Compatibility

**User Story:** As a user with an existing account, I want to continue using my account after the migration, so that I don't lose access to my data.

#### Acceptance Criteria

1. THE Huntaze_App SHALL support login for all existing user accounts without requiring password resets
2. WHEN an existing user logs in for the first time after migration, THE Huntaze_App SHALL create a NextAuth session using their existing credentials
3. THE Huntaze_App SHALL maintain all existing user data including email, password hashes, and onboarding status
4. THE Huntaze_App SHALL not require database schema changes beyond what was implemented in the auth-onboarding-flow spec
5. THE Huntaze_App SHALL clear any legacy localStorage tokens upon successful NextAuth login

### Requirement 7: Error Handling and User Feedback

**User Story:** As a user, I want clear error messages when authentication fails, so that I understand what went wrong.

#### Acceptance Criteria

1. WHEN authentication fails due to invalid credentials, THE Huntaze_App SHALL display "Invalid email or password"
2. WHEN a session expires during active use, THE Huntaze_App SHALL display "Your session has expired. Please log in again."
3. WHEN a network error prevents authentication, THE Huntaze_App SHALL display "Connection error. Please try again."
4. WHEN an API request fails due to missing authentication, THE Huntaze_App SHALL redirect to /auth with an appropriate error message
5. THE Huntaze_App SHALL log authentication errors to the console for debugging purposes

### Requirement 8: Testing and Validation

**User Story:** As a developer, I want comprehensive tests for the authentication system, so that I can verify it works correctly.

#### Acceptance Criteria

1. THE Huntaze_App SHALL include integration tests that verify login flow redirects to /onboarding or /dashboard based on onboarding status
2. THE Huntaze_App SHALL include tests that verify protected routes redirect unauthenticated users to /auth
3. THE Huntaze_App SHALL include tests that verify API routes return 401 for unauthenticated requests
4. THE Huntaze_App SHALL include tests that verify session persistence across page navigation
5. THE Huntaze_App SHALL include tests that verify logout clears the session and redirects appropriately
