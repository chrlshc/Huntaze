# Requirements Document - Social Platform Integrations

## Introduction

This document specifies the requirements for completing social platform integrations (TikTok, Instagram, Reddit, Twitter/X) to enable content publishing, analytics tracking, and CRM synchronization with PostgreSQL.

## Glossary

- **OAuth Flow**: The authorization process where users grant the application access to their social media accounts
- **Access Token**: Short-lived credential (24h for TikTok) used to make API calls
- **Refresh Token**: Long-lived credential (365d for TikTok) used to obtain new access tokens
- **Webhook**: HTTP callback that delivers real-time event notifications from platforms
- **Idempotence**: Property ensuring duplicate requests produce the same result
- **CRM Sync**: Process of synchronizing platform data with PostgreSQL database
- **Content Posting API**: TikTok's API for uploading and publishing videos
- **Graph API**: Facebook/Meta's API for Instagram Business/Creator accounts
- **Platform Connection**: Database record linking a user to their social media account

## Requirements

### Requirement 1: TikTok OAuth Integration

**User Story:** As a content creator, I want to connect my TikTok account securely, so that I can publish content and track analytics through Huntaze.

#### Acceptance Criteria

1. WHEN a user clicks "Connect TikTok", THE System SHALL redirect to TikTok's authorization URL with client_key, redirect_uri, scope (user.info.basic, video.upload), and state parameter
2. WHEN TikTok redirects back with authorization code, THE System SHALL exchange the code for access_token and refresh_token via POST to https://open.tiktokapis.com/v2/oauth/token/
3. THE System SHALL store access_token (expires in 24 hours) and refresh_token (expires in 365 days) securely in encrypted format
4. WHEN access_token expires, THE System SHALL automatically refresh using refresh_token with grant_type=refresh_token
5. IF TikTok returns a new refresh_token during refresh, THE System SHALL replace the old refresh_token with the new one

### Requirement 2: TikTok Content Upload

**User Story:** As a content creator, I want to upload videos to TikTok through Huntaze, so that I can manage my content from one place.

#### Acceptance Criteria

1. THE System SHALL support two upload modes: FILE_UPLOAD (chunked upload) and PULL_FROM_URL (TikTok pulls from URL)
2. WHEN initiating upload, THE System SHALL POST to /v2/post/publish/inbox/video/init/ with scope video.upload
3. THE System SHALL respect rate limit of 6 requests per minute per access_token
4. THE System SHALL enforce TikTok's limit of maximum 5 pending shares per 24 hours
5. WHEN upload fails with error codes (access_token_invalid, scope_not_authorized, url_ownership_unverified, rate_limit_exceeded, spam_risk_too_many_pending_share), THE System SHALL display appropriate error messages to user
6. THE System SHALL track upload status and notify user when video is published to Inbox

### Requirement 3: TikTok Webhook Processing

**User Story:** As a system administrator, I want webhooks to be processed reliably, so that no events are lost or duplicated.

#### Acceptance Criteria

1. WHEN receiving a webhook, THE System SHALL respond with HTTP 200 immediately
2. THE System SHALL process webhook payload asynchronously in a background queue
3. THE System SHALL deduplicate events using external_id as unique key
4. THE System SHALL validate webhook signature if TIKTOK_WEBHOOK_SECRET is configured
5. THE System SHALL handle at-least-once delivery with idempotent processing
6. THE System SHALL log all webhook events with correlation IDs for observability

### Requirement 4: TikTok CRM Synchronization

**User Story:** As a content creator, I want my TikTok data synchronized with my CRM, so that I can track all my social media activity in one place.

#### Acceptance Criteria

1. THE System SHALL create oauth_accounts record with provider='tiktok', open_id, scope, encrypted tokens, and expiry
2. THE System SHALL create tiktok_posts record for each upload with publish_id, status, source, and error_code
3. THE System SHALL upsert records using natural keys (open_id, publish_id, external_id) for idempotence
4. THE System SHALL link TikTok accounts to users in the users table
5. THE System SHALL run background workers to refresh tokens and update post statuses

### Requirement 5: Instagram OAuth Integration

**User Story:** As a content creator, I want to connect my Instagram Business account, so that I can publish content and track insights through Huntaze.

#### Acceptance Criteria

1. WHEN a user clicks "Connect Instagram", THE System SHALL redirect to Facebook OAuth with required permissions (instagram_basic, instagram_content_publish, instagram_manage_insights, instagram_manage_comments, pages_show_list)
2. WHEN Facebook redirects back with authorization code, THE System SHALL exchange code for access_token
3. THE System SHALL validate that user has Instagram Business or Creator account linked to Facebook Page
4. THE System SHALL store Page ID and Instagram Business Account ID mapping
5. THE System SHALL handle permission errors with actionable error messages

### Requirement 6: Instagram Content Publishing

**User Story:** As a content creator, I want to publish photos and videos to Instagram, so that I can manage my Instagram content from Huntaze.

#### Acceptance Criteria

1. THE System SHALL create media container via Graph API
2. THE System SHALL poll container status until "finished"
3. WHEN container is finished, THE System SHALL publish the media
4. THE System SHALL handle errors (invalid_media, permission_denied, rate_limit) with appropriate messages
5. THE System SHALL track publication status in database

### Requirement 7: Instagram Webhook Processing

**User Story:** As a system administrator, I want to receive real-time Instagram events, so that the system stays synchronized with Instagram data.

#### Acceptance Criteria

1. THE System SHALL implement webhook verification handshake for Meta/Graph API
2. WHEN receiving webhook, THE System SHALL respond HTTP 200 immediately
3. THE System SHALL process events asynchronously with idempotent handling
4. THE System SHALL handle webhook retry with exponential backoff
5. THE System SHALL deduplicate events using ig_id as unique key

### Requirement 8: Instagram CRM Synchronization

**User Story:** As a content creator, I want my Instagram data synchronized with my CRM, so that I can analyze my Instagram performance.

#### Acceptance Criteria

1. THE System SHALL create instagram_accounts record with ig_business_id, page_id, username, and access_level
2. THE System SHALL sync media (photos, videos, reels) with ig_media table
3. THE System SHALL sync comments with ig_comments table
4. THE System SHALL pull insights periodically and store in JSON format
5. THE System SHALL upsert records using ig_id as unique key for idempotence

### Requirement 9: Security and Token Management

**User Story:** As a security-conscious user, I want my social media credentials stored securely, so that my accounts are protected.

#### Acceptance Criteria

1. THE System SHALL encrypt all access_tokens and refresh_tokens before storing in database
2. THE System SHALL use HTTPS for all OAuth redirects and API calls
3. THE System SHALL validate state parameter to prevent CSRF attacks
4. THE System SHALL implement rate limiting on all API endpoints
5. THE System SHALL log all authentication and authorization events for audit

### Requirement 10: Error Handling and User Experience

**User Story:** As a content creator, I want clear error messages when something goes wrong, so that I know how to fix the issue.

#### Acceptance Criteria

1. WHEN OAuth fails, THE System SHALL display specific error (denied, invalid_scope, server_error) with actionable guidance
2. WHEN upload fails due to quota, THE System SHALL display remaining quota and reset time
3. WHEN token expires, THE System SHALL automatically refresh and retry the operation
4. WHEN platform is unavailable, THE System SHALL queue operations for retry with exponential backoff
5. THE System SHALL provide loading states and progress indicators for all async operations

### Requirement 11: Testing and Quality Assurance

**User Story:** As a developer, I want comprehensive tests, so that integrations work reliably in production.

#### Acceptance Criteria

1. THE System SHALL have unit tests for OAuth flow (happy path, errors, token refresh)
2. THE System SHALL have integration tests with mocked platform APIs
3. THE System SHALL have E2E tests covering full user journey (connect → upload → webhook)
4. THE System SHALL test idempotence of webhook processing with duplicate events
5. THE System SHALL test error scenarios (invalid tokens, rate limits, permission errors)

### Requirement 12: Observability and Monitoring

**User Story:** As a system administrator, I want to monitor integration health, so that I can detect and fix issues quickly.

#### Acceptance Criteria

1. THE System SHALL emit structured logs with correlation IDs (open_id, publish_id, external_id)
2. THE System SHALL track metrics (error rates, latencies, retry counts, quota usage)
3. THE System SHALL create dashboards for upload success rates and webhook processing
4. THE System SHALL alert on high error rates or webhook delivery failures
5. THE System SHALL provide debug endpoints for troubleshooting (with authentication)
