# Requirements Document - Social Integrations Fixes

## Introduction

This document specifies the requirements for fixing identified issues in the existing social platform integrations (TikTok, Instagram, Reddit, OnlyFans). The goal is to resolve inconsistencies, improve error handling, enhance security, and ensure all integrations work reliably in production.

## Glossary

- **OAuth Flow**: The authorization process where users grant the application access to their social media accounts
- **Token Refresh**: Process of obtaining new access tokens using refresh tokens before expiry
- **State Parameter**: CSRF protection mechanism in OAuth flows
- **Credential Validation**: Process of verifying OAuth credentials are properly configured
- **Error Handling**: Consistent error response format across all integrations
- **User Session**: Authenticated user context for API requests
- **Database Migration**: SQL scripts to update database schema
- **Environment Configuration**: Proper setup of environment variables for all platforms

## Requirements

### Requirement 1: OAuth Flow Consistency

**User Story:** As a developer, I want all OAuth flows to follow the same patterns and error handling, so that the codebase is maintainable and users have a consistent experience.

#### Acceptance Criteria

1. THE System SHALL use the same OAuth service pattern for all platforms (TikTok, Instagram, Reddit)
2. THE System SHALL implement consistent state parameter validation for CSRF protection across all platforms
3. THE System SHALL use the same error response format for all OAuth endpoints
4. THE System SHALL implement consistent redirect URL handling for success and error cases
5. THE System SHALL use the tokenManager service consistently across all platforms instead of direct database access

### Requirement 2: TikTok OAuth Fixes

**User Story:** As a user, I want TikTok OAuth to work reliably with proper error handling, so that I can successfully connect my TikTok account.

#### Acceptance Criteria

1. THE System SHALL fix the TikTok OAuth init endpoint to use the TikTokOAuthService instead of direct URL construction
2. THE System SHALL implement proper state parameter generation and validation in TikTok OAuth flow
3. THE System SHALL fix the TikTok callback to use tokenManager.storeTokens() instead of cookies
4. THE System SHALL implement proper user ID extraction from authenticated session
5. THE System SHALL use consistent error handling with proper redirect URLs

### Requirement 3: Instagram OAuth Improvements

**User Story:** As a user, I want Instagram OAuth to handle edge cases properly, so that connection failures are clearly communicated and recoverable.

#### Acceptance Criteria

1. THE System SHALL remove unused imports (oauthAccountsRepository) from Instagram callback
2. THE System SHALL implement proper user ID extraction from authenticated session instead of hardcoded value
3. THE System SHALL improve error messages for Instagram Business account validation
4. THE System SHALL implement proper token refresh scheduling for Instagram long-lived tokens
5. THE System SHALL add validation for required Instagram permissions

### Requirement 4: User Authentication Integration

**User Story:** As a developer, I want all OAuth flows to properly integrate with the user authentication system, so that tokens are associated with the correct user accounts.

#### Acceptance Criteria

1. THE System SHALL implement getUserFromRequest() utility to extract user ID from JWT tokens
2. THE System SHALL require authentication for all OAuth init endpoints
3. THE System SHALL associate OAuth tokens with the authenticated user ID
4. THE System SHALL implement proper session validation in all OAuth callbacks
5. THE System SHALL handle unauthenticated requests with proper error responses

### Requirement 5: Database Schema Consistency

**User Story:** As a developer, I want the database schema to be consistent and properly indexed, so that OAuth operations are performant and reliable.

#### Acceptance Criteria

1. THE System SHALL ensure oauth_accounts table has proper unique constraints
2. THE System SHALL add missing indexes for performance optimization
3. THE System SHALL implement proper foreign key constraints
4. THE System SHALL ensure consistent column naming across all OAuth-related tables
5. THE System SHALL add proper database migration scripts for schema updates

### Requirement 6: Environment Configuration Validation

**User Story:** As a developer, I want environment variables to be properly validated at startup, so that configuration issues are caught early.

#### Acceptance Criteria

1. THE System SHALL validate all required OAuth credentials at application startup
2. THE System SHALL provide clear error messages for missing or invalid credentials
3. THE System SHALL implement environment-specific configuration (development, staging, production)
4. THE System SHALL validate redirect URIs match the configured environment
5. THE System SHALL implement graceful degradation when optional credentials are missing

### Requirement 7: Error Handling Standardization

**User Story:** As a user, I want consistent and helpful error messages across all social platform connections, so that I can understand and resolve issues.

#### Acceptance Criteria

1. THE System SHALL implement standardized error response format across all OAuth endpoints
2. THE System SHALL provide user-friendly error messages with actionable guidance
3. THE System SHALL log detailed error information for debugging while showing safe messages to users
4. THE System SHALL implement proper error categorization (user errors vs system errors)
5. THE System SHALL provide recovery suggestions for common error scenarios

### Requirement 8: Token Management Improvements

**User Story:** As a system administrator, I want token management to be robust and secure, so that user credentials are protected and automatically refreshed.

#### Acceptance Criteria

1. THE System SHALL implement automatic token refresh for all platforms that support it
2. THE System SHALL handle token rotation properly (when refresh tokens change)
3. THE System SHALL implement proper token expiry handling with buffer time
4. THE System SHALL encrypt all tokens using consistent encryption methods
5. THE System SHALL implement token cleanup for expired/invalid tokens

### Requirement 9: Disconnect Functionality

**User Story:** As a user, I want to be able to disconnect my social media accounts, so that I can revoke access when needed.

#### Acceptance Criteria

1. THE System SHALL implement disconnect endpoints for all platforms
2. THE System SHALL revoke tokens with the platform APIs when disconnecting
3. THE System SHALL clean up all associated data when disconnecting
4. THE System SHALL provide confirmation UI for disconnect actions
5. THE System SHALL handle disconnect errors gracefully

### Requirement 10: Testing and Validation

**User Story:** As a developer, I want comprehensive tests for all OAuth flows, so that changes don't break existing functionality.

#### Acceptance Criteria

1. THE System SHALL include unit tests for all OAuth service methods
2. THE System SHALL include integration tests for complete OAuth flows
3. THE System SHALL include tests for error scenarios and edge cases
4. THE System SHALL include tests for token refresh functionality
5. THE System SHALL include tests for credential validation

### Requirement 11: Monitoring and Observability

**User Story:** As a system administrator, I want to monitor OAuth flow success rates and errors, so that I can detect and resolve issues quickly.

#### Acceptance Criteria

1. THE System SHALL log all OAuth flow attempts with success/failure status
2. THE System SHALL track OAuth success rates by platform
3. THE System SHALL alert on high OAuth failure rates
4. THE System SHALL provide debugging endpoints for OAuth troubleshooting
5. THE System SHALL implement health checks for OAuth credential validity

### Requirement 12: Security Enhancements

**User Story:** As a security-conscious user, I want OAuth flows to follow security best practices, so that my accounts are protected from attacks.

#### Acceptance Criteria

1. THE System SHALL implement proper CSRF protection with state parameters
2. THE System SHALL validate redirect URIs to prevent open redirect attacks
3. THE System SHALL implement rate limiting on OAuth endpoints
4. THE System SHALL use secure cookie settings for OAuth state
5. THE System SHALL implement proper session management for OAuth flows