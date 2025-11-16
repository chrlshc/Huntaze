# Requirements Document

## Introduction

This feature addresses the broken post-authentication flow in staging where users successfully authenticate but are not properly redirected to the smart onboarding process. Currently, authentication works correctly (domain marketing + auth), but after login, users are redirected to the dashboard instead of the onboarding flow, preventing proper app configuration. Additionally, the onboarding page expects a token parameter that is not provided by the authentication flow.

## Glossary

- **Auth System**: The NextAuth-based authentication system handling user login and registration
- **Smart Onboarding**: The Shopify-style onboarding wizard that collects user preferences and configures the app
- **Onboarding Status**: A database flag indicating whether a user has completed the onboarding process
- **Post-Auth Redirect**: The navigation logic that determines where users go after successful authentication
- **Session Token**: The NextAuth session that authenticates the user across the application

## Requirements

### Requirement 1: Post-Authentication Routing

**User Story:** As a new user, I want to be automatically directed to the onboarding flow after registration, so that I can configure my account properly

#### Acceptance Criteria

1. WHEN a user completes registration, THE Auth System SHALL redirect the user to the onboarding page
2. WHEN a user completes login AND has not completed onboarding, THE Auth System SHALL redirect the user to the onboarding page
3. WHEN a user completes login AND has completed onboarding, THE Auth System SHALL redirect the user to the dashboard
4. WHERE the user's onboarding status is unknown, THE Auth System SHALL redirect the user to the onboarding page

### Requirement 2: Onboarding Status Tracking

**User Story:** As the system, I want to track which users have completed onboarding, so that I can route them appropriately on subsequent logins

#### Acceptance Criteria

1. THE Auth System SHALL store an onboarding completion flag in the user database record
2. WHEN a user completes the onboarding flow, THE Smart Onboarding SHALL update the user's onboarding status to completed
3. THE Auth System SHALL include the onboarding status in the user session data
4. WHEN retrieving user session data, THE Auth System SHALL provide the current onboarding status within 200 milliseconds

### Requirement 3: Onboarding Access Control

**User Story:** As an authenticated user, I want to access the onboarding flow without additional token requirements, so that the transition from authentication is seamless

#### Acceptance Criteria

1. WHEN an authenticated user accesses the onboarding page, THE Smart Onboarding SHALL verify authentication using the NextAuth session
2. THE Smart Onboarding SHALL NOT require a separate token parameter for authenticated users
3. IF a user is not authenticated, THEN THE Smart Onboarding SHALL redirect to the authentication page
4. WHILE the user is authenticated, THE Smart Onboarding SHALL display the onboarding wizard within 500 milliseconds

### Requirement 4: Onboarding Completion Flow

**User Story:** As a user completing onboarding, I want my preferences saved and my account marked as configured, so that I don't see the onboarding flow again

#### Acceptance Criteria

1. WHEN a user completes all onboarding steps, THE Smart Onboarding SHALL save the user's answers to the database
2. WHEN a user completes all onboarding steps, THE Smart Onboarding SHALL update the user's onboarding status to completed
3. WHEN a user skips onboarding, THE Smart Onboarding SHALL update the user's onboarding status to completed
4. WHEN onboarding is marked complete, THE Smart Onboarding SHALL redirect the user to the dashboard within 1 second

### Requirement 5: Backward Compatibility

**User Story:** As an existing user who has already completed onboarding, I want to continue accessing the dashboard directly, so that my workflow is not disrupted

#### Acceptance Criteria

1. WHEN an existing user with completed onboarding logs in, THE Auth System SHALL redirect directly to the dashboard
2. THE Auth System SHALL NOT force existing users through onboarding again
3. WHERE the onboarding status field does not exist for a user, THE Auth System SHALL treat the user as having completed onboarding
4. THE Auth System SHALL migrate existing user records to include the onboarding status field with a default value of completed
