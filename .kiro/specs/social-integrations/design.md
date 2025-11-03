# Design Document - Social Platform Integrations

## Overview

This document describes the technical design for completing TikTok and Instagram integrations, including OAuth flows, content publishing, webhook processing, and CRM synchronization with PostgreSQL.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Application                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Frontend (React)                                     │   │
│  │  - Connect buttons                                    │   │
│  │  - Upload forms                                       │   │
│  │  - Status displays                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Routes                                           │   │
│  │  - /api/auth/[platform]                              │   │
│  │  - /api/auth/[platform]/callback                     │   │
│  │  - /api/[platform]/upload                            │   │
│  │  - /api/webhooks/[platform]                          │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Services                                             │   │
│  │  - TikTokService                                      │   │
│  │  - InstagramService                                   │   │
│  │  - TokenManager                                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL (AWS RDS)                      │
│  - oauth_accounts                                            │
│  - tiktok_posts                                              │
│  - instagram_accounts                                        │
│  - ig_media                                                  │
│  - ig_comments                                               │
│  - webhook_events                                            │
└─────────────────────────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                    Background Workers                        │
│  - Token refresh scheduler                                   │
│  - Webhook processor queue                                   │
│  - Status updater                                            │
└─────────────────────────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                External Platform APIs                        │
│  - TikTok OAuth & Content Posting API                       │
│  - Instagram Graph API                                       │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. OAuth Flow Components

#### TikTokOAuthService

```typescript
interface TikTokOAuthService {
  /**
   * Generate authorization URL with state for CSRF protection
   */
  getAuthorizationUrl(userId: number, scopes: string[]): Promise<{
    url: string;
    state: string;
  }>;

  /**
   * Exchange authorization code for tokens
   */
  exchangeCodeForTokens(code: string, state: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    open_id: string;
    scope: string;
  }>;

  /**
   * Refresh access token using refresh token
   */
  refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token?: string; // May rotate
    expires_in: number;
  }>;

  /**
   * Revoke access (disconnect)
   */
  revokeAccess(accessToken: string): Promise<void>;
}
```

#### InstagramOAuthService

```typescript
interface InstagramOAuthService {
  /**
   * Generate Facebook OAuth URL for Instagram permissions
   */
  getAuthorizationUrl(userId: number, permissions: string[]): Promise<{
    url: string;
    state: string;
  }>;

  /**
   * Exchange code for long-lived token and get IG account info
   */
  exchangeCodeForTokens(code: string, state: string): Promise<{
    access_token: string;
    user_id: string;
    pages: Array<{
      id: string;
      name: string;
      instagram_business_account?: {
        id: string;
        username: string;
      };
    }>;
  }>;

  /**
   * Exchange short-lived token for long-lived token (60 days)
   */
  getLongLivedToken(shortLivedToken: string): Promise<{
    access_token: string;
    expires_in: number;
  }>;

  /**
   * Refresh long-lived token before expiry
   */
  refreshLongLivedToken(token: string): Promise<{
    access_token: string;
    expires_in: number;
  }>;
}
```

### 2. Content Publishing Components

#### TikTokUploadService

```typescript
interface TikTokUploadService {
  /**
   * Initialize upload and get upload URL
   */
  initUpload(params: {
    accessToken: string;
    source: 'FILE_UPLOAD' | 'PULL_FROM_URL';
    videoUrl?: string;
    postInfo: {
      title: string;
      privacy_level: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY';
      disable_duet?: boolean;
      disable_comment?: boolean;
      disable_stitch?: boolean;
    };
  }): Promise<{
    publish_id: string;
    upload_url?: string; // For FILE_UPLOAD
  }>;

  /**
   * Upload video chunks (for FILE_UPLOAD mode)
   */
  uploadChunk(params: {
    uploadUrl: string;
    chunk: Buffer;
    chunkIndex: number;
    totalChunks: number;
  }): Promise<void>;

  /**
   * Check upload/publish status
   */
  getStatus(publishId: string, accessToken: string): Promise<{
    status: 'PROCESSING_UPLOAD' | 'SEND_TO_USER_INBOX' | 'PUBLISH_COMPLETE' | 'FAILED';
    fail_reason?: string;
  }>;
}
```

#### InstagramPublishService

```typescript
interface InstagramPublishService {
  /**
   * Create media container
   */
  createContainer(params: {
    igUserId: string;
    accessToken: string;
    mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL';
    mediaUrl: string;
    caption?: string;
    location_id?: string;
  }): Promise<{
    id: string; // Container ID
  }>;

  /**
   * Check container status
   */
  getContainerStatus(containerId: string, accessToken: string): Promise<{
    status_code: 'EXPIRED' | 'ERROR' | 'FINISHED' | 'IN_PROGRESS' | 'PUBLISHED';
  }>;

  /**
   * Publish container
   */
  publishContainer(params: {
    igUserId: string;
    containerId: string;
    accessToken: string;
  }): Promise<{
    id: string; // Media ID
  }>;
}
```

### 3. Webhook Processing Components

#### WebhookProcessor

```typescript
interface WebhookProcessor {
  /**
   * Process webhook event idempotently
   */
  processEvent(event: {
    provider: 'tiktok' | 'instagram';
    eventType: string;
    externalId: string;
    payload: any;
    signature?: string;
  }): Promise<{
    processed: boolean;
    duplicate: boolean;
  }>;

  /**
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string, secret: string): boolean;

  /**
   * Queue event for async processing
   */
  queueEvent(event: WebhookEvent): Promise<void>;
}
```

### 4. Database Repositories

#### OAuthAccountsRepository

```typescript
interface OAuthAccountsRepository {
  create(account: {
    userId: number;
    provider: string;
    openId: string;
    scope: string;
    accessToken: string; // Will be encrypted
    refreshToken: string; // Will be encrypted
    expiresAt: Date;
  }): Promise<OAuthAccount>;

  findByUserAndProvider(userId: number, provider: string): Promise<OAuthAccount | null>;

  updateTokens(id: number, tokens: {
    accessToken: string;
    refreshToken?: string;
    expiresAt: Date;
  }): Promise<void>;

  findExpiringSoon(minutes: number): Promise<OAuthAccount[]>;
}
```

## Data Models

### Database Schema

```sql
-- OAuth accounts for all platforms
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'tiktok', 'instagram', 'reddit', 'twitter'
  open_id VARCHAR(255) NOT NULL, -- Platform-specific user ID
  scope TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  expires_at TIMESTAMP NOT NULL,
  metadata JSONB, -- Platform-specific data
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider, open_id)
);

CREATE INDEX idx_oauth_accounts_expires ON oauth_accounts(expires_at) WHERE expires_at > NOW();

-- TikTok posts
CREATE TABLE IF NOT EXISTS tiktok_posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  oauth_account_id INTEGER NOT NULL REFERENCES oauth_accounts(id) ON DELETE CASCADE,
  publish_id VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'PROCESSING_UPLOAD', 'SEND_TO_USER_INBOX', 'PUBLISH_COMPLETE', 'FAILED'
  source VARCHAR(50) NOT NULL, -- 'FILE_UPLOAD', 'PULL_FROM_URL'
  title TEXT,
  error_code VARCHAR(100),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tiktok_posts_user ON tiktok_posts(user_id);
CREATE INDEX idx_tiktok_posts_status ON tiktok_posts(status) WHERE status IN ('PROCESSING_UPLOAD', 'SEND_TO_USER_INBOX');

-- Instagram accounts
CREATE TABLE IF NOT EXISTS instagram_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  oauth_account_id INTEGER NOT NULL REFERENCES oauth_accounts(id) ON DELETE CASCADE,
  ig_business_id VARCHAR(255) UNIQUE NOT NULL,
  page_id VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL,
  access_level VARCHAR(50), -- 'BASIC', 'CONTENT_PUBLISH', 'MANAGE_INSIGHTS', etc.
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, ig_business_id)
);

-- Instagram media
CREATE TABLE IF NOT EXISTS ig_media (
  id SERIAL PRIMARY KEY,
  instagram_account_id INTEGER NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  ig_id VARCHAR(255) UNIQUE NOT NULL,
  media_type VARCHAR(50) NOT NULL, -- 'IMAGE', 'VIDEO', 'CAROUSEL_ALBUM'
  caption TEXT,
  permalink VARCHAR(500),
  timestamp TIMESTAMP,
  metrics_json JSONB, -- likes, comments, shares, etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ig_media_account ON ig_media(instagram_account_id);
CREATE INDEX idx_ig_media_timestamp ON ig_media(timestamp DESC);

-- Instagram comments
CREATE TABLE IF NOT EXISTS ig_comments (
  id SERIAL PRIMARY KEY,
  ig_media_id INTEGER NOT NULL REFERENCES ig_media(id) ON DELETE CASCADE,
  ig_id VARCHAR(255) UNIQUE NOT NULL,
  from_user VARCHAR(255),
  text TEXT,
  hidden BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ig_comments_media ON ig_comments(ig_media_id);

-- Webhook events (shared across platforms)
CREATE TABLE IF NOT EXISTS webhook_events (
  id BIGSERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  external_id VARCHAR(255) UNIQUE NOT NULL, -- Platform-specific event ID
  payload_json JSONB NOT NULL,
  processed_at TIMESTAMP,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhook_events_provider ON webhook_events(provider, event_type);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed_at) WHERE processed_at IS NULL;
```

## Error Handling

### Error Categories

1. **OAuth Errors**
   - `access_denied`: User denied authorization
   - `invalid_scope`: Requested scope not available
   - `server_error`: Platform OAuth server error

2. **Upload Errors**
   - `access_token_invalid`: Token expired or revoked
   - `scope_not_authorized`: Missing required scope
   - `rate_limit_exceeded`: Too many requests
   - `spam_risk_too_many_pending_share`: Exceeded pending share limit
   - `url_ownership_unverified`: URL not verified for PULL_FROM_URL

3. **Webhook Errors**
   - `invalid_signature`: Signature verification failed
   - `duplicate_event`: Event already processed
   - `processing_failed`: Error during event processing

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    retryable: boolean;
    userMessage: string; // User-friendly message
  };
}
```

## Testing Strategy

### Unit Tests
- OAuth URL generation
- Token encryption/decryption
- Signature verification
- Error handling logic

### Integration Tests
- OAuth flow with mocked platform APIs
- Upload flow with mocked responses
- Webhook processing with test payloads
- Database operations (upserts, queries)

### E2E Tests
- Complete user journey: connect → upload → receive webhook
- Token refresh flow
- Error scenarios (expired token, rate limit)
- Idempotence verification

## Security Considerations

1. **Token Storage**: All tokens encrypted using AES-256-GCM
2. **CSRF Protection**: State parameter validated on OAuth callback
3. **Webhook Verification**: Signature validation for all webhooks
4. **Rate Limiting**: Per-user and per-IP rate limits on all endpoints
5. **Audit Logging**: All auth events logged with user ID and timestamp

## Performance Considerations

1. **Token Refresh**: Background job runs every 30 minutes to refresh expiring tokens
2. **Webhook Processing**: Async queue with 10 concurrent workers
3. **Database Indexes**: Optimized for common queries (user lookups, status checks)
4. **Caching**: Redis cache for frequently accessed data (user profiles, quotas)
5. **Connection Pooling**: PostgreSQL pool with max 20 connections

## Monitoring and Observability

### Metrics
- `oauth_flow_success_rate`: Success rate of OAuth flows by provider
- `upload_success_rate`: Success rate of uploads by provider
- `webhook_processing_latency`: P50, P95, P99 latencies
- `token_refresh_failures`: Count of failed token refreshes
- `rate_limit_hits`: Count of rate limit errors by endpoint

### Logs
- Structured JSON logs with correlation IDs
- Log levels: DEBUG, INFO, WARN, ERROR
- Sensitive data (tokens) redacted from logs

### Alerts
- High error rate (>5% over 5 minutes)
- Webhook processing backlog (>100 events)
- Token refresh failures (>10 in 1 hour)
- Database connection pool exhaustion
