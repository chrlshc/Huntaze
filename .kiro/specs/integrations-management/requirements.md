# Requirements: Integrations Management System

## Introduction

A comprehensive integrations management system that allows users to visually configure and manage their connected apps (OnlyFans, Instagram, TikTok, Reddit, etc.) similar to Shopify's app management interface. This system will replace mock data displays with real integration connections throughout the application.

## Current State Analysis

### Existing Infrastructure

**Database Schema (Prisma)**:
- ✅ `OAuthAccount` model exists with fields: userId, provider, providerAccountId, accessToken, refreshToken, expiresAt, tokenType, scope, metadata
- ✅ Supports providers: 'instagram', 'tiktok', 'reddit', 'onlyfans'
- ✅ Has proper indexes and cascade deletion
- ✅ User model has relation to OAuthAccount

**Existing Pages**:
- ⚠️ `/onboarding/setup/page-old.tsx` - Has platform connection UI but incomplete implementation
- ⚠️ Various pages reference platform connections but use mock data
- ❌ No dedicated `/integrations` or `/platforms/connect` page exists

**Existing Hooks**:
- ✅ `useOnlyFansDashboard.ts` - Fetches OnlyFans dashboard data via API
- ✅ `useInstagramAccount.ts` - Manages Instagram account state
- ❌ No generic `useIntegrations` hook

**Existing APIs**:
- ⚠️ `/api/platforms/status` - Referenced in code but may not exist
- ✅ `/api/onlyfans/dashboard` - Fetches OnlyFans data
- ✅ Various platform-specific endpoints exist
- ❌ No centralized `/api/integrations` endpoints

**Missing Components**:
- ❌ No centralized integrations management page
- ❌ No OAuth flow implementation for most platforms
- ❌ No connection/disconnection UI components
- ❌ No real-time status monitoring
- ❌ Platform data is mocked or incomplete in many places

## Glossary

- **Integration**: A connected third-party service (OnlyFans, Instagram, etc.)
- **OAuth Account**: Database record storing connection credentials in the `oauth_accounts` table
- **Integration Card**: Visual component displaying integration status and actions
- **Connection Flow**: OAuth process to connect an integration
- **Platform Provider**: The external service identifier (e.g., 'instagram', 'onlyfans')
- **Access Token**: Credential used to authenticate API requests to external platforms
- **Refresh Token**: Credential used to obtain new access tokens when they expire
- **Token Expiry**: DateTime when an access token becomes invalid
- **Connection Status**: State of an integration (connected, disconnected, error, expired)

## Requirements

### Requirement 1: Integrations Dashboard

**User Story:** As a user, I want to see all available integrations in one place, so that I can manage my connected apps easily.

#### Acceptance Criteria

1. WHEN a user visits /integrations, THE system SHALL display all available integrations
2. WHEN displaying integrations, THE system SHALL show connection status for each
3. WHEN an integration is connected, THE system SHALL display "Connected" badge
4. WHEN an integration is not connected, THE system SHALL display "Add app" button
5. THE system SHALL use English language for all UI elements

### Requirement 2: Add Integration Flow

**User Story:** As a user, I want to add new integrations with a clear visual flow, so that I can connect my accounts easily.

#### Acceptance Criteria

1. WHEN a user clicks "Add app", THE system SHALL initiate OAuth flow
2. WHEN OAuth succeeds, THE system SHALL store credentials in oauth_accounts table
3. WHEN OAuth fails, THE system SHALL display error message
4. WHEN integration is added, THE system SHALL redirect to integrations page
5. THE system SHALL display success notification after connection

### Requirement 3: Integration Status Display

**User Story:** As a user, I want to see detailed status of my integrations, so that I know which accounts are active.

#### Acceptance Criteria

1. WHEN displaying connected integration, THE system SHALL show account name
2. WHEN displaying connected integration, THE system SHALL show connection date
3. WHEN token expires, THE system SHALL display "Reconnect" button
4. WHEN integration has errors, THE system SHALL display error status
5. THE system SHALL allow disconnecting integrations

### Requirement 4: OnlyFans Integration

**User Story:** As a creator, I want to connect my OnlyFans account, so that I can manage it through Huntaze.

#### Acceptance Criteria

1. WHEN connecting OnlyFans, THE system SHALL use cookie-based authentication
2. WHEN OnlyFans is connected, THE system SHALL fetch account stats
3. WHEN OnlyFans connection fails, THE system SHALL provide clear error message
4. THE system SHALL store OnlyFans credentials securely
5. THE system SHALL validate OnlyFans connection on page load

### Requirement 5: Social Media Integrations

**User Story:** As a creator, I want to connect Instagram, TikTok, and Reddit, so that I can cross-post content.

#### Acceptance Criteria

1. WHEN connecting Instagram, THE system SHALL use OAuth 2.0 flow
2. WHEN connecting TikTok, THE system SHALL use OAuth 2.0 flow
3. WHEN connecting Reddit, THE system SHALL use OAuth 2.0 flow
4. THE system SHALL store access tokens in oauth_accounts table
5. THE system SHALL handle token refresh automatically

### Requirement 6: Real Data Display

**User Story:** As a user, I want to see real data from my connected accounts, so that I can make informed decisions.

#### Acceptance Criteria

1. WHEN integration is connected, THE system SHALL fetch real data from API
2. WHEN no integration is connected, THE system SHALL display empty state
3. THE system SHALL NOT display mock data for connected integrations
4. WHEN API call fails, THE system SHALL display error state
5. THE system SHALL cache data for performance

### Requirement 7: Analytics Integration

**User Story:** As a user, I want analytics to show real data from my connected accounts, so that I can track performance.

#### Acceptance Criteria

1. WHEN viewing analytics, THE system SHALL check for connected integrations
2. WHEN no integrations connected, THE system SHALL display "Connect your accounts" message
3. WHEN integrations connected, THE system SHALL fetch and display real analytics
4. THE system SHALL aggregate data from multiple integrations
5. THE system SHALL update analytics data periodically

### Requirement 8: Token Management

**User Story:** As a system, I want to manage OAuth tokens automatically, so that integrations remain functional.

#### Acceptance Criteria

1. WHEN an access token expires, THE system SHALL attempt to refresh it using the refresh token
2. WHEN token refresh succeeds, THE system SHALL update the oauth_accounts table
3. WHEN token refresh fails, THE system SHALL mark the integration as requiring reconnection
4. THE system SHALL check token expiry before making API calls
5. THE system SHALL handle token refresh transparently to the user

### Requirement 9: Integration Metadata

**User Story:** As a developer, I want to store platform-specific data, so that I can support unique features per platform.

#### Acceptance Criteria

1. WHEN storing Instagram connection, THE system SHALL save ig_business_id in metadata
2. WHEN storing OnlyFans connection, THE system SHALL save account details in metadata
3. THE system SHALL use JSON format for metadata storage
4. WHEN retrieving integration, THE system SHALL parse metadata correctly
5. THE system SHALL validate metadata structure per platform

### Requirement 10: Error Handling

**User Story:** As a user, I want clear error messages when integrations fail, so that I can fix issues.

#### Acceptance Criteria

1. WHEN OAuth fails, THE system SHALL display user-friendly error message
2. WHEN API call fails, THE system SHALL log error details for debugging
3. WHEN token is invalid, THE system SHALL prompt user to reconnect
4. WHEN rate limit is hit, THE system SHALL display retry information
5. THE system SHALL not expose sensitive error details to users

### Requirement 11: Security

**User Story:** As a user, I want my credentials stored securely, so that my accounts are protected.

#### Acceptance Criteria

1. THE system SHALL encrypt access tokens at rest
2. THE system SHALL use HTTPS for all OAuth flows
3. THE system SHALL validate OAuth state parameter to prevent CSRF
4. THE system SHALL not log access tokens or refresh tokens
5. WHEN user disconnects integration, THE system SHALL delete all stored credentials

### Requirement 12: Multi-Account Support

**User Story:** As a user, I want to connect multiple accounts from the same platform, so that I can manage multiple profiles.

#### Acceptance Criteria

1. THE system SHALL allow multiple Instagram accounts per user
2. THE system SHALL allow multiple OnlyFans accounts per user
3. WHEN displaying integrations, THE system SHALL show all connected accounts
4. THE system SHALL use providerAccountId to distinguish between accounts
5. THE system SHALL allow switching between accounts in the UI
