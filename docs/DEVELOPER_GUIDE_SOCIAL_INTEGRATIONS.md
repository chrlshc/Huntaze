# Developer Guide - Social Media Integrations

## 🏗️ Architecture Overview

The social media integrations follow a consistent pattern across all platforms (TikTok, Instagram, Reddit):

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│  - Connect pages                                             │
│  - Publish forms                                             │
│  - Dashboard widgets                                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                    API Routes (Next.js)                      │
│  - /api/auth/[platform]                                      │
│  - /api/auth/[platform]/callback                             │
│  - /api/[platform]/publish                                   │
│  - /api/webhooks/[platform]                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                    Services Layer                            │
│  - [Platform]OAuthService                                    │
│  - [Platform]PublishService                                  │
│  - TokenEncryptionService                                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                            │
│  - OAuthAccountsRepository                                   │
│  - [Platform]PostsRepository                                 │
│  - PostgreSQL (AWS RDS)                                      │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 OAuth Implementation

### Common OAuth Flow

All platforms follow OAuth 2.0 with slight variations:

1. **Authorization Request**
   - Generate state for CSRF protection
   - Build authorization URL with scopes
   - Redirect user to platform

2. **Callback Handling**
   - Validate state parameter
   - Exchange code for tokens
   - Encrypt and store tokens
   - Redirect to success page

3. **Token Management**
   - Tokens encrypted with AES-256-GCM
   - Auto-refresh before expiry
   - Rotation handling (TikTok)

### Platform-Specific Details

#### TikTok OAuth

```typescript
// Authorization URL
const { url, state } = tiktokOAuth.getAuthorizationUrl();
// https://www.tiktok.com/v2/auth/authorize?client_key=...

// Token Exchange
const tokens = await tiktokOAuth.exchangeCodeForTokens(code);
// Returns: access_token (24h), refresh_token (365d)

// Token Refresh
const newTokens = await tiktokOAuth.refreshAccessToken(refreshToken);
// May return new refresh_token (rotation)
```

**Key Points:**
- Access tokens expire in 24 hours
- Refresh tokens expire in 365 days
- Refresh tokens may rotate
- Scopes: `user.info.basic`, `video.upload`

**References:**
- [TikTok Login Kit](https://developers.tiktok.com/doc/login-kit-web/)
- [TikTok OAuth](https://developers.tiktok.com/doc/oauth-user-access-token-management/)

#### Instagram OAuth

```typescript
// Authorization URL (Facebook OAuth)
const { url, state } = instagramOAuth.getAuthorizationUrl();
// https://www.facebook.com/v18.0/dialog/oauth?client_id=...

// Token Exchange
const tokens = await instagramOAuth.exchangeCodeForTokens(code);
// Returns: short-lived token (2h)

// Convert to Long-Lived Token
const longLived = await instagramOAuth.getLongLivedToken(shortToken);
// Returns: long-lived token (60 days)

// Refresh Long-Lived Token
const refreshed = await instagramOAuth.refreshLongLivedToken(token);
// Returns: new long-lived token (60 days)
```

**Key Points:**
- Uses Facebook OAuth
- Requires Business/Creator account
- Account must be linked to Facebook Page
- Short-lived tokens (2h) → Long-lived tokens (60 days)
- Long-lived tokens don't rotate
- Scopes: `instagram_basic`, `instagram_content_publish`, `instagram_manage_insights`, `pages_show_list`

**References:**
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api/)
- [Instagram Publishing](https://developers.facebook.com/docs/instagram-api/guides/content-publishing)

#### Reddit OAuth

```typescript
// Authorization URL
const { url, state } = redditOAuth.getAuthorizationUrl();
// https://www.reddit.com/api/v1/authorize?client_id=...

// Token Exchange (Basic Auth required)
const tokens = await redditOAuth.exchangeCodeForTokens(code);
// Returns: access_token (1h), refresh_token (permanent)

// Token Refresh
const newTokens = await redditOAuth.refreshAccessToken(refreshToken);
// Returns: new access_token, same refresh_token
```

**Key Points:**
- Uses Basic Auth (client_id:client_secret)
- Access tokens expire in 1 hour
- Refresh tokens never expire
- Refresh tokens don't rotate
- Scopes: `identity`, `submit`, `edit`, `read`, `mysubreddits`
- User-Agent required for all API calls

**References:**
- [Reddit OAuth2](https://github.com/reddit-archive/reddit/wiki/OAuth2)
- [Reddit API](https://www.reddit.com/dev/api/)

## 📤 Publishing Implementation

### TikTok Publishing

```typescript
// Initialize Upload
const { publish_id, upload_url } = await tiktokUpload.initUpload({
  accessToken,
  source: 'PULL_FROM_URL', // or 'FILE_UPLOAD'
  videoUrl: 'https://example.com/video.mp4',
  postInfo: {
    title: 'My Video',
    privacy_level: 'PUBLIC_TO_EVERYONE',
  },
});

// Check Status
const status = await tiktokUpload.getStatus(publish_id, accessToken);
// PROCESSING_UPLOAD → SEND_TO_USER_INBOX → PUBLISH_COMPLETE
```

**Rate Limits:**
- 6 requests/minute per access_token
- Max 5 pending shares per 24 hours

**References:**
- [Content Posting API](https://developers.tiktok.com/doc/content-posting-api-get-started/)

### Instagram Publishing

```typescript
// Create Container
const { id: containerId } = await instagramPublish.createContainer({
  igUserId,
  accessToken,
  mediaType: 'IMAGE',
  mediaUrl: 'https://example.com/image.jpg',
  caption: 'My post',
});

// Poll Status
const { status_code } = await instagramPublish.getContainerStatus(
  containerId,
  accessToken
);
// IN_PROGRESS → FINISHED

// Publish
const { id: mediaId } = await instagramPublish.publishContainer({
  igUserId,
  containerId,
  accessToken,
});
```

**Container Workflow:**
1. Create container (returns container_id)
2. Poll status until FINISHED
3. Publish container (returns media_id)

**References:**
- [Content Publishing](https://developers.facebook.com/docs/instagram-api/guides/content-publishing)

### Reddit Publishing

```typescript
// Submit Link Post
const result = await redditPublish.submitLink(
  'programming',
  'Check out my project',
  'https://github.com/user/project',
  accessToken
);
// Returns: { id, name, url, permalink }

// Submit Text Post
const result = await redditPublish.submitText(
  'programming',
  'My thoughts on...',
  'Here is my detailed post...',
  accessToken
);
```

**Post Types:**
- `link`: Share a URL
- `self`: Text post (Markdown supported)

**References:**
- [Submit API](https://www.reddit.com/dev/api#POST_api_submit)

## 🗄️ Database Schema

### oauth_accounts

Stores OAuth credentials for all platforms:

```sql
CREATE TABLE oauth_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  provider VARCHAR(50) NOT NULL, -- 'tiktok', 'instagram', 'reddit'
  open_id VARCHAR(255) NOT NULL,
  scope TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  expires_at TIMESTAMP NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider, open_id)
);
```

### Platform-Specific Tables

- `tiktok_posts`: Track TikTok uploads
- `instagram_accounts`: Instagram Business accounts
- `ig_media`: Instagram posts
- `reddit_posts`: Reddit submissions

## 🔒 Security

### Token Encryption

All tokens are encrypted using AES-256-GCM:

```typescript
import { tokenEncryption } from '@/lib/services/tokenEncryption';

// Encrypt
const encrypted = tokenEncryption.encryptAccessToken(token);
// Format: iv:authTag:ciphertext (base64)

// Decrypt
const decrypted = tokenEncryption.decryptAccessToken(encrypted);
```

**Key Management:**
- 256-bit encryption key
- Stored in `TOKEN_ENCRYPTION_KEY` environment variable
- Key should be generated once and backed up securely
- Rotate keys periodically

### CSRF Protection

All OAuth flows use state parameter:

```typescript
// Generate state
const state = crypto.randomBytes(32).toString('hex');

// Store in cookie
cookies().set('oauth_state', state, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge: 600, // 10 minutes
});

// Validate on callback
const storedState = cookies().get('oauth_state')?.value;
if (storedState !== receivedState) {
  throw new Error('Invalid state');
}
```

## 🔄 Background Workers

### Token Refresh Scheduler

Runs every 30 minutes to refresh expiring tokens:

```typescript
import { runTokenRefresh } from '@/lib/workers/tokenRefreshScheduler';

// Find tokens expiring in next hour
const accounts = await oauthAccountsRepository.findExpiringSoon(60);

// Refresh each token
for (const account of accounts) {
  await refreshToken(account);
}
```

### Reddit Sync Worker

Syncs post metrics (karma, comments):

```typescript
import { syncUserPosts } from '@/lib/workers/redditSyncWorker';

const result = await syncUserPosts(userId, 50);
// Updates score and num_comments for recent posts
```

## 📊 Error Handling

### Rate Limiting

All platforms implement rate limiting:

```typescript
try {
  await platform.publish(...);
} catch (error) {
  if (error.message.includes('rate_limit') || error.message.includes('429')) {
    // Exponential backoff
    await sleep(Math.pow(2, retryCount) * 1000);
    return retry();
  }
  throw error;
}
```

### Error Codes

Common error codes across platforms:

- `access_token_invalid`: Token expired or revoked
- `scope_not_authorized`: Missing required scope
- `rate_limit_exceeded`: Too many requests
- `permission_denied`: Insufficient permissions
- `invalid_media`: Media format/size issue

## 🧪 Testing

### Unit Tests

```bash
# Test OAuth services
npm test -- tests/unit/services/tiktokOAuth.test.ts
npm test -- tests/unit/services/instagramOAuth.test.ts
npm test -- tests/unit/services/redditOAuth.test.ts

# Test repositories
npm test -- tests/unit/db/repositories/
```

### Integration Tests

```bash
# Test API endpoints
npm test -- tests/integration/api/

# Test database operations
npm test -- tests/integration/db/
```

## 📚 Additional Resources

### TikTok
- [Developer Portal](https://developers.tiktok.com/)
- [Content Posting API](https://developers.tiktok.com/doc/content-posting-api-get-started/)
- [Login Kit](https://developers.tiktok.com/doc/login-kit-web/)

### Instagram
- [Graph API](https://developers.facebook.com/docs/instagram-api/)
- [Content Publishing](https://developers.facebook.com/docs/instagram-api/guides/content-publishing)
- [Webhooks](https://developers.facebook.com/docs/instagram-api/guides/webhooks/)

### Reddit
- [API Documentation](https://www.reddit.com/dev/api/)
- [OAuth2 Wiki](https://github.com/reddit-archive/reddit/wiki/OAuth2)
- [Data API Terms](https://www.redditinc.com/policies/data-api-terms)

## ⚠️ Important Notes

### Reddit Commercial Use

Reddit's Data API has specific terms for commercial use. Review the [Data API Terms](https://www.redditinc.com/policies/data-api-terms) and ensure compliance. Commercial usage may require a separate agreement.

### Instagram Business Accounts

Only Business and Creator accounts can publish via API. Personal accounts must be converted first.

### TikTok Content Posting API

Ensure your app has Content Posting API enabled in the TikTok Developer Portal.

---

**Last Updated**: October 31, 2024
**Version**: 1.0
