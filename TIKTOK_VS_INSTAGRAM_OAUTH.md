# TikTok vs Instagram OAuth - Key Differences

Comparison of OAuth implementations for TikTok and Instagram integrations.

## OAuth Provider

| Platform | OAuth Provider | API Version |
|----------|---------------|-------------|
| TikTok | TikTok OAuth 2.0 | v2 |
| Instagram | Facebook OAuth 2.0 | Graph API v18.0 |

**Why different?**
- TikTok has its own OAuth system
- Instagram Business accounts use Facebook OAuth because they're linked to Facebook Pages

## Token Lifecycle

### TikTok

```
Authorization Code
    ↓
Access Token (24 hours)
    ↓
Refresh Token (365 days)
    ↓
New Access Token + Rotated Refresh Token
```

**Key Points:**
- Access token expires in 24 hours
- Refresh token expires in 365 days
- Refresh token may rotate (get new one)
- Must handle token rotation

### Instagram

```
Authorization Code
    ↓
Short-Lived Token (~2 hours)
    ↓
Long-Lived Token (60 days)
    ↓
Refreshed Long-Lived Token (60 days)
```

**Key Points:**
- Short-lived token expires in ~2 hours
- Long-lived token expires in 60 days
- No refresh token (uses token refresh)
- Can refresh once per day
- Each refresh extends for another 60 days

## Token Storage

### TikTok

```typescript
{
  provider: 'tiktok',
  access_token_encrypted: '...',
  refresh_token_encrypted: '...', // Required
  expires_at: '2024-11-01T00:00:00Z', // 24 hours
}
```

### Instagram

```typescript
{
  provider: 'instagram',
  access_token_encrypted: '...',
  refresh_token_encrypted: null, // Not used
  expires_at: '2024-12-30T00:00:00Z', // 60 days
}
```

## Account Requirements

### TikTok

- ✅ Any TikTok account
- ✅ Personal or Business
- ✅ No additional setup required

### Instagram

- ❌ Personal accounts NOT supported
- ✅ Business or Creator account ONLY
- ✅ Must be linked to Facebook Page
- ✅ Must have admin access to Page

## Permissions/Scopes

### TikTok

```typescript
const scopes = [
  'user.info.basic',    // Basic profile info
  'video.upload',       // Upload videos
  'video.list',         // List videos
];
```

### Instagram

```typescript
const permissions = [
  'instagram_basic',              // Basic profile info
  'instagram_content_publish',    // Publish content
  'instagram_manage_insights',    // View insights
  'instagram_manage_comments',    // Manage comments
  'pages_show_list',              // List Pages
  'pages_read_engagement',        // Read engagement
];
```

## OAuth Flow

### TikTok

```
1. Redirect to TikTok OAuth
   https://www.tiktok.com/v2/auth/authorize

2. User authorizes

3. Callback with code
   /api/auth/tiktok/callback?code=...&state=...

4. Exchange code for tokens
   POST https://open.tiktokapis.com/v2/oauth/token/

5. Store access_token + refresh_token
```

### Instagram

```
1. Redirect to Facebook OAuth
   https://www.facebook.com/v18.0/dialog/oauth

2. User authorizes

3. Callback with code
   /api/auth/instagram/callback?code=...&state=...

4. Exchange code for short-lived token
   GET https://graph.facebook.com/v18.0/oauth/access_token

5. Convert to long-lived token
   GET https://graph.facebook.com/v18.0/oauth/access_token
   (with grant_type=fb_exchange_token)

6. Get Pages with Instagram accounts
   GET https://graph.facebook.com/v18.0/me/accounts

7. Validate Business account exists

8. Store access_token (no refresh_token)
```

## Token Refresh

### TikTok

```typescript
// Refresh when access token expires (24h)
const refreshed = await tiktokOAuth.refreshAccessToken(refreshToken);

// IMPORTANT: May get new refresh token
if (refreshed.refresh_token) {
  // Update both tokens
  await updateTokens({
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token, // New one!
    expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
  });
}
```

### Instagram

```typescript
// Refresh before expiry (60 days)
// Can refresh once per day
const refreshed = await instagramOAuth.refreshLongLivedToken(currentToken);

// No refresh token, just new access token
await updateTokens({
  accessToken: refreshed.access_token,
  expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
});
```

## Metadata Stored

### TikTok

```typescript
{
  open_id: string;        // TikTok user ID
  union_id: string;       // Cross-app user ID
  display_name: string;   // Display name
  avatar_url: string;     // Avatar URL
  follower_count: number; // Followers
  video_count: number;    // Videos
}
```

### Instagram

```typescript
{
  page_id: string;                // Facebook Page ID
  page_name: string;              // Page name
  ig_business_id: string;         // Instagram Business ID
  ig_username: string;            // Instagram username
  ig_name: string;                // Display name
  ig_profile_picture_url: string; // Profile picture
  ig_followers_count: number;     // Followers
  ig_follows_count: number;       // Following
  ig_media_count: number;         // Media count
}
```

## Error Handling

### TikTok

```typescript
// Common errors
- access_token_invalid
- scope_not_authorized
- rate_limit_exceeded
- spam_risk_too_many_pending_share
```

### Instagram

```typescript
// Common errors
- access_denied
- invalid_state
- no_business_account (custom)
- invalid_scope
- server_error
```

## API Endpoints

### TikTok

```
Auth:    https://www.tiktok.com/v2/auth/authorize
Token:   https://open.tiktokapis.com/v2/oauth/token/
User:    https://open.tiktokapis.com/v2/user/info/
Upload:  https://open.tiktokapis.com/v2/post/publish/inbox/video/init/
```

### Instagram

```
Auth:    https://www.facebook.com/v18.0/dialog/oauth
Token:   https://graph.facebook.com/v18.0/oauth/access_token
User:    https://graph.facebook.com/v18.0/me
Pages:   https://graph.facebook.com/v18.0/me/accounts
Media:   https://graph.facebook.com/v18.0/{ig-user-id}/media
```

## Refresh Strategy

### TikTok

```typescript
// Refresh every 23 hours (before 24h expiry)
const REFRESH_BEFORE_EXPIRY = 60; // minutes

if (expiresAt < now + REFRESH_BEFORE_EXPIRY) {
  await refreshToken();
}
```

### Instagram

```typescript
// Refresh every 30 days (before 60d expiry)
const REFRESH_BEFORE_EXPIRY = 30 * 24 * 60; // minutes

if (expiresAt < now + REFRESH_BEFORE_EXPIRY) {
  await refreshToken();
}
```

## Rate Limits

### TikTok

- 6 requests per minute per access_token (upload)
- 5 pending shares per 24 hours
- Rate limit headers in response

### Instagram

- Varies by endpoint
- Page-level rate limits
- User-level rate limits
- Rate limit info in error response

## Code Comparison

### Service Initialization

**TikTok:**
```typescript
export class TikTokOAuthService {
  private clientKey: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientKey = process.env.TIKTOK_CLIENT_KEY || '';
    this.clientSecret = process.env.TIKTOK_CLIENT_SECRET || '';
    this.redirectUri = process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI || '';
  }
}
```

**Instagram:**
```typescript
export class InstagramOAuthService {
  private appId: string;
  private appSecret: string;
  private redirectUri: string;

  constructor() {
    this.appId = process.env.FACEBOOK_APP_ID || '';
    this.appSecret = process.env.FACEBOOK_APP_SECRET || '';
    this.redirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI || '';
  }
}
```

### Token Exchange

**TikTok:**
```typescript
const body = new URLSearchParams({
  client_key: this.clientKey,
  client_secret: this.clientSecret,
  code,
  grant_type: 'authorization_code',
  redirect_uri: this.redirectUri,
});

const response = await fetch(TIKTOK_TOKEN_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: body.toString(),
});
```

**Instagram:**
```typescript
const params = new URLSearchParams({
  client_id: this.appId,
  client_secret: this.appSecret,
  redirect_uri: this.redirectUri,
  code,
});

const response = await fetch(
  `${FACEBOOK_TOKEN_URL}?${params.toString()}`,
  { method: 'GET' }
);
```

## Summary

| Feature | TikTok | Instagram |
|---------|--------|-----------|
| OAuth Provider | TikTok | Facebook |
| Account Type | Any | Business/Creator only |
| Access Token Lifetime | 24 hours | 60 days |
| Refresh Token | Yes (365d) | No (token refresh) |
| Token Rotation | Yes | No |
| Page Requirement | No | Yes |
| Setup Complexity | Low | Medium |
| Refresh Frequency | Daily | Monthly |

## Recommendations

### When to Refresh

**TikTok:**
- Refresh every 23 hours
- Check for token rotation
- Handle rotation in refresh logic

**Instagram:**
- Refresh every 30 days
- No rotation to handle
- Simpler refresh logic

### Error Handling

**TikTok:**
- Focus on rate limits
- Handle quota errors
- Monitor pending shares

**Instagram:**
- Validate Business account
- Handle Page permissions
- Check Page-level limits

### User Experience

**TikTok:**
- Simple: any account works
- Quick setup
- No additional requirements

**Instagram:**
- Complex: Business account required
- Longer setup (convert account, link Page)
- Clear requirements documentation needed

## Migration Notes

If migrating from TikTok to Instagram patterns:

1. ✅ Keep same database schema
2. ✅ Use same tokenManager service
3. ✅ Use same encryption service
4. ⚠️ Handle different token lifetimes
5. ⚠️ No refresh token for Instagram
6. ⚠️ Add Business account validation
7. ⚠️ Add Page mapping logic
8. ⚠️ Update refresh scheduler timing

## Testing Differences

### TikTok Testing

- Test with any TikTok account
- Test token rotation
- Test rate limits
- Test quota enforcement

### Instagram Testing

- Test with Business account only
- Test Page mapping
- Test Business account validation
- Test long-lived token conversion
- Test without refresh token

---

Both implementations follow OAuth 2.0 best practices but have significant differences due to platform requirements. Instagram's requirement for Business accounts and Facebook Page linking adds complexity but provides richer metadata and longer token lifetimes.
