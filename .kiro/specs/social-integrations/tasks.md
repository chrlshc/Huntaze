# Implementation Plan - Social Platform Integrations

## TikTok Integration (Priority 1)

- [x] 1. Database Schema and Migrations
  - Create migration file for oauth_accounts, tiktok_posts, webhook_events tables
  - Add indexes for performance (expires_at, user_id, status)
  - Test migration on development database
  - _Requirements: 1.3, 4.1, 4.2_

- [x] 2. Token Encryption Service
  - [x] 2.1 Implement TokenEncryptionService with AES-256-GCM
    - Create encrypt() and decrypt() methods
    - Use environment variable for encryption key
    - Handle encryption errors gracefully
    - _Requirements: 9.1_
  
  - [x] 2.2 Create TokenManager for token lifecycle
    - Implement storeTokens() with encryption
    - Implement getValidToken() with auto-refresh
    - Implement refreshToken() with rotation handling
    - _Requirements: 1.4, 1.5_

- [x] 3. TikTok OAuth Flow
  - [x] 3.1 Create TikTokOAuthService
    - Implement getAuthorizationUrl() with state generation
    - Implement exchangeCodeForTokens() with API call
    - Implement refreshAccessToken() with rotation
    - Handle all OAuth error codes
    - _Requirements: 1.1, 1.2, 1.4, 1.5_
  
  - [x] 3.2 Create OAuth init endpoint (GET /api/auth/tiktok)
    - Generate state and store in session/cookie
    - Build authorization URL with scopes
    - Redirect to TikTok OAuth
    - _Requirements: 1.1_
  
  - [x] 3.3 Create OAuth callback endpoint (GET /api/auth/tiktok/callback)
    - Validate state parameter (CSRF protection)
    - Exchange code for tokens
    - Store tokens in oauth_accounts table
    - Redirect to success page
    - Handle errors with user-friendly messages
    - _Requirements: 1.2, 1.3, 9.3_

- [x] 4. TikTok Upload Service
  - [x] 4.1 Create TikTokUploadService
    - Implement initUpload() for both FILE_UPLOAD and PULL_FROM_URL
    - Implement uploadChunk() for chunked uploads
    - Implement getStatus() for status polling
    - Handle rate limiting (6 req/min)
    - Handle quota limits (5 pending/24h)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [x] 4.2 Create upload endpoint (POST /api/tiktok/upload)
    - Validate user authentication
    - Get valid access token (auto-refresh if needed)
    - Initialize upload with TikTok API
    - Store tiktok_posts record
    - Return upload URL or publish_id
    - _Requirements: 2.1, 2.6, 4.2_
  
  - [x] 4.3 Create status endpoint (GET /api/tiktok/status/:publishId)
    - Query TikTok API for status
    - Update tiktok_posts record
    - Return status to client
    - _Requirements: 2.6_

- [x] 5. TikTok Webhook Handler
  - [x] 5.1 Create WebhookProcessor service
    - Implement verifySignature() for TikTok webhooks
    - Implement processEvent() with idempotence
    - Implement queueEvent() for async processing
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 5.2 Create webhook endpoint (POST /api/webhooks/tiktok)
    - Verify signature if secret configured
    - Respond HTTP 200 immediately
    - Queue event for processing
    - Store in webhook_events table with external_id
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6_
  
  - [x] 5.3 Create webhook worker
    - Process queued events asynchronously
    - Update tiktok_posts status based on events
    - Handle duplicate events (check external_id)
    - Retry failed events with exponential backoff
    - _Requirements: 3.2, 3.3, 3.5_

- [x] 6. TikTok CRM Sync
  - [x] 6.1 Create OAuthAccountsRepository
    - Implement create() with token encryption
    - Implement findByUserAndProvider()
    - Implement updateTokens()
    - Implement findExpiringSoon() for refresh scheduler
    - _Requirements: 4.1, 4.3_
  
  - [x] 6.2 Create TikTokPostsRepository
    - Implement create() with upsert on publish_id
    - Implement updateStatus()
    - Implement findByUser()
    - Implement findPendingPosts()
    - _Requirements: 4.2, 4.3_
  
  - [x] 6.3 Create token refresh scheduler
    - Query oauth_accounts expiring in next hour
    - Refresh tokens using TikTokOAuthService
    - Update oauth_accounts with new tokens
    - Handle refresh failures (notify user)
    - _Requirements: 1.4, 1.5, 4.5_

- [x] 7. TikTok UI Components
  - [x] 7.1 Create TikTok connect page (/platforms/connect/tiktok)
    - Display "Connect TikTok" button
    - Show loading state during OAuth
    - Display connection status
    - Show error messages if OAuth fails
    - _Requirements: 1.1, 10.1_
  
  - [x] 7.2 Create TikTok upload form
    - File upload with progress bar
    - URL input for PULL_FROM_URL mode
    - Caption and privacy settings
    - Display quota usage (X/5 pending)
    - Show upload status and errors
    - _Requirements: 2.1, 2.4, 2.5, 10.2_
  
  - [x] 7.3 Create TikTok dashboard widget
    - Display connected account info
    - Show recent uploads with status
    - Display analytics (views, likes, shares)
    - "Disconnect" button
    - _Requirements: 4.4_

- [x]* 8. TikTok Tests
  - [ ]* 8.1 Unit tests for TikTokOAuthService
    - Test getAuthorizationUrl() generates correct URL
    - Test exchangeCodeForTokens() with mock API
    - Test refreshAccessToken() with rotation
    - Test error handling for all OAuth errors
    - _Requirements: 11.1_
  
  - [ ]* 8.2 Integration tests for upload flow
    - Test initUpload() with FILE_UPLOAD mode
    - Test initUpload() with PULL_FROM_URL mode
    - Test rate limiting behavior
    - Test quota enforcement
    - _Requirements: 11.2_
  
  - [ ]* 8.3 E2E tests for complete flow
    - Test OAuth flow (mock TikTok redirect)
    - Test upload → webhook → status update
    - Test token refresh before expiry
    - Test idempotence of webhook processing
    - _Requirements: 11.3, 11.4_

## Instagram Integration (Priority 2)

- [x] 9. Instagram OAuth Flow
  - [x] 9.1 Create InstagramOAuthService
    - Implement getAuthorizationUrl() for Facebook OAuth
    - Implement exchangeCodeForTokens() with Page/IG mapping
    - Implement getLongLivedToken() (60 days)
    - Implement refreshLongLivedToken()
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [x] 9.2 Create OAuth endpoints
    - GET /api/auth/instagram (init)
    - GET /api/auth/instagram/callback
    - Validate Instagram Business/Creator account
    - Store Page ID and IG Business ID mapping
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 10. Instagram Publishing
  - [x] 10.1 Create InstagramPublishService
    - Implement createContainer() for media
    - Implement getContainerStatus() for polling
    - Implement publishContainer() when ready
    - Handle all error codes
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [x] 10.2 Create publish endpoint (POST /api/instagram/publish)
    - Validate authentication and permissions
    - Create media container
    - Poll status until finished
    - Publish container
    - Store in ig_media table
    - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [x] 11. Instagram Webhooks
  - [x] 11.1 Create webhook endpoint (POST /api/webhooks/instagram)
    - Implement verification handshake
    - Verify signature
    - Respond HTTP 200 immediately
    - Queue events for processing
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x] 11.2 Create webhook worker
    - Process media updates
    - Process comment events
    - Update ig_media and ig_comments tables
    - Handle duplicates with ig_id
    - _Requirements: 7.3, 7.4, 7.5_

- [x] 12. Instagram CRM Sync
  - [x] 12.1 Create InstagramAccountsRepository
    - Implement create() with ig_business_id
    - Implement findByUser()
    - Implement updateAccessLevel()
    - _Requirements: 8.1, 8.5_
  
  - [x] 12.2 Create IgMediaRepository
    - Implement upsert() with ig_id as unique key
    - Implement findByAccount()
    - Implement updateMetrics()
    - _Requirements: 8.2, 8.5_
  
  - [x] 12.3 Create insights sync worker
    - Pull media insights periodically
    - Store metrics in ig_media.metrics_json
    - Pull account insights (followers, reach)
    - _Requirements: 8.4_

- [x] 13. Instagram UI Components
  - [x] 13.1 Create Instagram connect page
    - Display "Connect Instagram" button
    - Show permission requirements
    - Display connected Page and IG account
    - Show error if not Business/Creator account
    - _Requirements: 5.1, 5.5, 10.1_
  
  - [x] 13.2 Create Instagram publish form
    - Image/video upload
    - Caption editor
    - Location picker
    - Preview before publish
    - Show publish status
    - _Requirements: 6.1, 6.4, 10.3_

- [ ]* 14. Instagram Tests
  - [ ]* 14.1 Unit tests for InstagramOAuthService
    - Test OAuth URL generation
    - Test token exchange with Page mapping
    - Test long-lived token conversion
    - Test permission error handling
    - _Requirements: 11.1_
  
  - [ ]* 14.2 Integration tests for publishing
    - Test container creation
    - Test status polling
    - Test publish flow
    - Test error scenarios
    - _Requirements: 11.2_
  
  - [ ]* 14.3 E2E tests
    - Test OAuth → publish → webhook flow
    - Test insights sync
    - Test comment sync
    - _Requirements: 11.3_

## Cross-Platform Infrastructure (Priority 3)

- [ ] 15. Monitoring and Observability
  - [x] 15.1 Add structured logging
    - Log all OAuth events with correlation IDs
    - Log all API calls with latencies
    - Log all webhook events
    - Redact sensitive data (tokens)
    - _Requirements: 12.1_
  
  - [x] 15.2 Add metrics collection
    - Track OAuth success rates by provider
    - Track upload success rates
    - Track webhook processing latencies
    - Track token refresh failures
    - _Requirements: 12.2_
  
  - [x] 15.3 Create monitoring dashboards
    - OAuth flow funnel
    - Upload success rates over time
    - Webhook processing queue depth
    - Error rates by endpoint
    - _Requirements: 12.3_
  
  - [x]* 15.4 Set up alerts
    - Alert on high error rates (>5%)
    - Alert on webhook backlog (>100 events)
    - Alert on token refresh failures
    - Alert on database connection issues
    - _Requirements: 12.4_

- [ ] 16. Documentation
  - [ ] 16.1 Create user documentation
    - How to connect TikTok account
    - How to upload videos to TikTok
    - How to connect Instagram account
    - How to publish to Instagram
    - Troubleshooting common errors
    - _Requirements: 10.1, 10.2_
  
  - [ ] 16.2 Create developer documentation
    - OAuth flow architecture
    - Webhook processing design
    - Database schema reference
    - API endpoint reference
    - Error code reference
    - _Requirements: 12.5_

## Notes

- Tasks marked with `*` are optional testing tasks
- All tasks should be implemented with proper error handling
- All database operations should be idempotent
- All API calls should have retry logic with exponential backoff
- All sensitive data (tokens) must be encrypted at rest
