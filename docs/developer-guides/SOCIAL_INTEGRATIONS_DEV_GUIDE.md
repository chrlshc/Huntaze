# Social Integrations Developer Guide

## Architecture Overview

The social integrations system provides OAuth-based connections to TikTok and Instagram, enabling content publishing and analytics sync. The system is built with a modular architecture supporting multiple platforms.

## System Components

### Core Services
- **OAuth Services**: Handle platform authentication flows
- **Upload Services**: Manage content publishing to platforms
- **Webhook Processors**: Handle platform callbacks and events
- **Token Management**: Secure token storage and refresh
- **Repository Layer**: Database abstraction for platform data

### Database Schema

#### OAuth Accounts Table
```sql
CREATE TABLE oauth_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    provider VARCHAR(50) NOT NULL, -- 'tiktok', 'instagram'
    provider_account_id VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL, -- Encrypted
    refresh_token TEXT, -- Encrypted
    expires_at TIMESTAMP,
    scope TEXT,
    token_type VARCHAR(50) DEFAULT 'Bearer',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, provider, provider_account_id)
);
```

#### TikTok Posts Table
```sql
CREATE TABLE tiktok_posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    oauth_account_id INTEGER NOT NULL REFERENCES oauth_accounts(id),
    publish_id VARCHAR(255) NOT NULL UNIQUE,
    video_id VARCHAR(255),
    status VARCHAR(50) NOT NULL, -- 'processing', 'published', 'failed'
    title TEXT,
    privacy_level VARCHAR(50),
    disable_duet BOOLEAN DEFAULT FALSE,
    disable_comment BOOLEAN DEFAULT FALSE,
    disable_stitch BOOLEAN DEFAULT FALSE,
    brand_content_toggle BOOLEAN DEFAULT FALSE,
    brand_organic_toggle BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Instagram Tables
```sql
CREATE TABLE instagram_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    oauth_account_id INTEGER NOT NULL REFERENCES oauth_accounts(id),
    ig_business_id VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(255),
    name VARCHAR(255),
    profile_picture_url TEXT,
    followers_count INTEGER DEFAULT 0,
    media_count INTEGER DEFAULT 0,
    account_type VARCHAR(50), -- 'BUSINESS', 'CREATOR'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ig_media (
    id SERIAL PRIMARY KEY,
    instagram_account_id INTEGER NOT NULL REFERENCES instagram_accounts(id),
    ig_id VARCHAR(255) NOT NULL UNIQUE,
    media_type VARCHAR(50), -- 'IMAGE', 'VIDEO', 'CAROUSEL_ALBUM'
    media_url TEXT,
    permalink TEXT,
    caption TEXT,
    timestamp TIMESTAMP,
    like_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    metrics_json JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## OAuth Flow Architecture

### TikTok OAuth Flow

1. **Authorization Request**
   ```typescript
   // Generate OAuth URL
   const authUrl = tiktokOAuth.getAuthorizationUrl(userId);
   // Redirect user to TikTok
   ```

2. **Token Exchange**
   ```typescript
   // Handle callback with authorization code
   const tokens = await tiktokOAuth.exchangeCodeForTokens(code);
   // Store encrypted tokens
   await oauthAccountsRepo.create({
     userId,
     provider: 'tiktok',
     accessToken: encrypt(tokens.access_token),
     refreshToken: encrypt(tokens.refresh_token),
     expiresAt: new Date(Date.now() + tokens.expires_in * 1000)
   });
   ```

3. **Token Refresh**
   ```typescript
   // Automatic refresh before expiration
   const newTokens = await tiktokOAuth.refreshAccessToken(refreshToken);
   await oauthAccountsRepo.updateTokens(accountId, newTokens);
   ```

### Instagram OAuth Flow

1. **Facebook OAuth** (Instagram uses Facebook OAuth)
   ```typescript
   // Request Facebook permissions for Instagram
   const scopes = [
     'pages_show_list',
     'pages_read_engagement', 
     'instagram_basic',
     'instagram_content_publish'
   ];
   ```

2. **Page Selection**
   ```typescript
   // Get user's Facebook Pages
   const pages = await facebookAPI.getPages(accessToken);
   // Get Instagram accounts for each page
   const igAccounts = await Promise.all(
     pages.map(page => facebookAPI.getInstagramAccount(page.id))
   );
   ```

## Content Publishing

### TikTok Video Upload

```typescript
class TikTokUploadService {
  async uploadVideo(params: TikTokUploadParams): Promise<string> {
    // 1. Initialize upload
    const initResponse = await this.initializeUpload(params);
    
    // 2. Upload video file
    await this.uploadVideoFile(initResponse.upload_url, params.videoFile);
    
    // 3. Publish video
    const publishResponse = await this.publishVideo({
      source_info: initResponse.source_info,
      post_info: {
        title: params.title,
        privacy_level: params.privacy_level,
        disable_duet: params.disable_duet,
        disable_comment: params.disable_comment,
        disable_stitch: params.disable_stitch
      }
    });
    
    return publishResponse.publish_id;
  }
}
```

### Instagram Content Publishing

```typescript
class InstagramPublishService {
  async publishMedia(params: InstagramPublishParams): Promise<string> {
    // 1. Create media container
    const container = await this.createMediaContainer({
      image_url: params.media_url,
      caption: params.caption,
      location_id: params.location_id
    });
    
    // 2. Publish container
    const result = await this.publishMediaContainer(container.id);
    
    return result.id;
  }
}
```

## Webhook Processing

### TikTok Webhooks

```typescript
class TikTokWebhookProcessor {
  async processWebhook(event: TikTokWebhookEvent): Promise<void> {
    switch (event.type) {
      case 'video.publish':
        await this.handleVideoPublish(event);
        break;
      case 'video.delete':
        await this.handleVideoDelete(event);
        break;
    }
  }
  
  private async handleVideoPublish(event: VideoPublishEvent): Promise<void> {
    await tiktokPostsRepo.updateStatus(
      event.publish_id,
      'published',
      { video_id: event.video_id }
    );
  }
}
```

### Instagram Webhooks

```typescript
class InstagramWebhookProcessor {
  async processWebhook(event: InstagramWebhookEvent): Promise<void> {
    for (const entry of event.entry) {
      for (const change of entry.changes) {
        switch (change.field) {
          case 'media':
            await this.handleMediaChange(change);
            break;
          case 'comments':
            await this.handleCommentChange(change);
            break;
        }
      }
    }
  }
}
```

## Error Handling

### Error Types

```typescript
export class SocialIntegrationError extends Error {
  constructor(
    message: string,
    public provider: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'SocialIntegrationError';
  }
}

export class TokenExpiredError extends SocialIntegrationError {
  constructor(provider: string) {
    super(`${provider} token has expired`, provider, 'TOKEN_EXPIRED', 401);
  }
}

export class RateLimitError extends SocialIntegrationError {
  constructor(provider: string, retryAfter?: number) {
    super(`${provider} rate limit exceeded`, provider, 'RATE_LIMITED', 429);
    this.retryAfter = retryAfter;
  }
}
```

### Error Code Reference

| Code | Description | Action |
|------|-------------|---------|
| `TOKEN_EXPIRED` | Access token has expired | Refresh token or re-authenticate |
| `TOKEN_INVALID` | Token is invalid or revoked | Re-authenticate user |
| `RATE_LIMITED` | API rate limit exceeded | Retry with exponential backoff |
| `UPLOAD_FAILED` | File upload failed | Retry upload or check file format |
| `PUBLISH_FAILED` | Content publishing failed | Check content guidelines |
| `WEBHOOK_INVALID` | Webhook signature invalid | Verify webhook configuration |

## Security Considerations

### Token Encryption

All OAuth tokens are encrypted at rest using AES-256-GCM:

```typescript
class TokenEncryption {
  encrypt(token: string): string {
    const cipher = crypto.createCipher('aes-256-gcm', this.encryptionKey);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }
  
  decrypt(encryptedToken: string): string {
    const decipher = crypto.createDecipher('aes-256-gcm', this.encryptionKey);
    let decrypted = decipher.update(encryptedToken, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
```

### Webhook Verification

```typescript
class WebhookVerifier {
  verifyTikTokSignature(payload: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.tiktokWebhookSecret)
      .update(payload)
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
  
  verifyInstagramSignature(payload: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha1', this.instagramWebhookSecret)
      .update(payload)
      .digest('hex');
    return signature === `sha1=${expectedSignature}`;
  }
}
```

## API Endpoints Reference

### TikTok Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/auth/tiktok` | Initiate TikTok OAuth |
| `GET` | `/api/auth/tiktok/callback` | Handle OAuth callback |
| `POST` | `/api/tiktok/upload` | Upload video to TikTok |
| `GET` | `/api/tiktok/status/{publishId}` | Get upload status |
| `POST` | `/api/webhooks/tiktok` | TikTok webhook endpoint |

### Instagram Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/auth/instagram` | Initiate Instagram OAuth |
| `GET` | `/api/auth/instagram/callback` | Handle OAuth callback |
| `POST` | `/api/instagram/publish` | Publish to Instagram |
| `POST` | `/api/webhooks/instagram` | Instagram webhook endpoint |

## Monitoring and Observability

### Metrics Collected

- OAuth success/failure rates by provider
- Upload success/failure rates
- Webhook processing latencies
- Token refresh success rates
- API call latencies by endpoint

### Logging Structure

```typescript
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  service: string;
  correlationId: string;
  userId?: string;
  provider?: string;
  action: string;
  duration?: number;
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}
```

### Health Check Endpoints

- `/api/health/tiktok` - TikTok API connectivity
- `/api/health/instagram` - Instagram API connectivity
- `/api/health/database` - Database connectivity
- `/api/health/redis` - Redis connectivity

## Development Setup

### Environment Variables

```bash
# TikTok Configuration
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
TIKTOK_WEBHOOK_SECRET=your_webhook_secret

# Instagram/Facebook Configuration  
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
INSTAGRAM_WEBHOOK_SECRET=your_webhook_secret

# Encryption
TOKEN_ENCRYPTION_KEY=your_32_byte_encryption_key

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# Redis
REDIS_URL=redis://localhost:6379
```

### Testing

Run the test suite:
```bash
# Unit tests
npm run test:unit

# Integration tests  
npm run test:integration

# E2E tests
npm run test:e2e
```

### Local Development

1. Set up ngrok for webhook testing:
   ```bash
   ngrok http 3000
   ```

2. Update webhook URLs in platform developer consoles

3. Run the development server:
   ```bash
   npm run dev
   ```

## Deployment Considerations

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Redis instance configured
- [ ] Webhook endpoints registered with platforms
- [ ] SSL certificates installed
- [ ] Monitoring dashboards configured
- [ ] Error alerting set up

### Scaling Considerations

- Use Redis for session storage and caching
- Implement queue system for webhook processing
- Consider CDN for media file uploads
- Monitor database connection pool usage
- Implement circuit breakers for external API calls