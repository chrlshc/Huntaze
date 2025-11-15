# TikTok OAuth Service - API Documentation

## Overview

The TikTok OAuth Service provides a robust, production-ready implementation of TikTok's OAuth 2.0 flow with:

- ✅ **Automatic retry** with exponential backoff (3 attempts)
- ✅ **Request timeout** handling (10 seconds)
- ✅ **Comprehensive error handling** with correlation IDs
- ✅ **TypeScript strict typing** for all responses
- ✅ **Detailed logging** for debugging
- ✅ **Credential validation** with caching (5min TTL)

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [API Methods](#api-methods)
- [Error Handling](#error-handling)
- [TypeScript Types](#typescript-types)
- [Examples](#examples)
- [Best Practices](#best-practices)

---

## Installation

```typescript
import { tiktokOAuth, TikTokOAuthService } from '@/lib/services/tiktokOAuth';
```

---

## Configuration

### Environment Variables

Required environment variables:

```bash
# TikTok OAuth Credentials
TIKTOK_CLIENT_KEY=your_client_key
TIKTOK_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_TIKTOK_REDIRECT_URI=https://yourdomain.com/api/auth/tiktok/callback
```

### Obtaining Credentials

1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Create an app
3. Get your Client Key and Client Secret
4. Configure redirect URI in TikTok app settings

---

## API Methods

### 1. getAuthorizationUrl()

Generate authorization URL for OAuth flow.

**Signature:**
```typescript
async getAuthorizationUrl(scopes?: string[]): Promise<TikTokAuthUrl>
```

**Parameters:**
- `scopes` (optional): Array of OAuth scopes
  - Default: `['user.info.basic', 'video.upload', 'video.list']`
  - Available scopes: See [TikTok Scopes Documentation](https://developers.tiktok.com/doc/oauth-user-access-token-management)

**Returns:**
```typescript
{
  url: string;      // Authorization URL to redirect user to
  state: string;    // CSRF protection token (64 chars hex)
}
```

**Throws:**
- `TikTokAPIError` if credentials are invalid

**Example:**
```typescript
// Generate authorization URL
const { url, state } = await tiktokOAuth.getAuthorizationUrl();

// Store state in session for CSRF validation
req.session.tiktokState = state;

// Redirect user to TikTok
res.redirect(url);
```

**With Custom Scopes:**
```typescript
const { url, state } = await tiktokOAuth.getAuthorizationUrl([
  'user.info.basic',
  'video.publish',
  'video.list',
]);
```

---

### 2. exchangeCodeForTokens()

Exchange authorization code for access and refresh tokens.

**Signature:**
```typescript
async exchangeCodeForTokens(code: string): Promise<TikTokTokens>
```

**Parameters:**
- `code`: Authorization code from TikTok callback

**Returns:**
```typescript
{
  access_token: string;           // Access token (24h expiry)
  refresh_token: string;          // Refresh token (365d expiry)
  expires_in: number;             // Seconds until access token expires
  refresh_expires_in: number;     // Seconds until refresh token expires
  open_id: string;                // User's TikTok open ID
  scope: string;                  // Granted scopes (comma-separated)
  token_type: string;             // "Bearer"
}
```

**Throws:**
- `TikTokAPIError` with code:
  - `INVALID_CREDENTIALS`: Invalid client credentials
  - `INVALID_TOKEN`: Invalid or expired authorization code
  - `NETWORK_ERROR`: Network failure (retryable)
  - `TIMEOUT_ERROR`: Request timeout (retryable)
  - `API_ERROR`: TikTok API error (retryable)

**Example:**
```typescript
// In callback handler
const { code, state } = req.query;

// Validate state (CSRF protection)
if (state !== req.session.tiktokState) {
  throw new Error('Invalid state');
}

// Exchange code for tokens
const tokens = await tiktokOAuth.exchangeCodeForTokens(code);

// Store tokens securely
await db.tokens.create({
  userId: req.user.id,
  platform: 'tiktok',
  accessToken: tokens.access_token,
  refreshToken: tokens.refresh_token,
  expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
  openId: tokens.open_id,
  scopes: tokens.scope.split(','),
});
```

---

### 3. refreshAccessToken()

Refresh expired access token using refresh token.

**Signature:**
```typescript
async refreshAccessToken(refreshToken: string): Promise<TikTokRefreshResponse>
```

**Parameters:**
- `refreshToken`: Current refresh token

**Returns:**
```typescript
{
  access_token: string;           // New access token
  refresh_token?: string;         // New refresh token (if rotated)
  expires_in: number;             // Seconds until access token expires
  refresh_expires_in?: number;    // Seconds until refresh token expires
  token_type: string;             // "Bearer"
}
```

**Important:** TikTok may rotate the refresh token. Always use the new `refresh_token` if provided.

**Throws:**
- `TikTokAPIError` with code:
  - `INVALID_TOKEN`: Invalid or expired refresh token
  - `NETWORK_ERROR`: Network failure (retryable)
  - `TIMEOUT_ERROR`: Request timeout (retryable)

**Example:**
```typescript
// Check if access token is expired
const token = await db.tokens.findOne({ userId, platform: 'tiktok' });

if (token.expiresAt < new Date()) {
  // Refresh access token
  const newTokens = await tiktokOAuth.refreshAccessToken(token.refreshToken);
  
  // Update stored tokens
  await db.tokens.update({
    accessToken: newTokens.access_token,
    // Use new refresh token if rotated
    refreshToken: newTokens.refresh_token || token.refreshToken,
    expiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
  });
}
```

**Automatic Refresh Pattern:**
```typescript
async function getTikTokAccessToken(userId: string): Promise<string> {
  const token = await db.tokens.findOne({ userId, platform: 'tiktok' });
  
  // Refresh if expired or expiring soon (5 min buffer)
  if (token.expiresAt < new Date(Date.now() + 5 * 60 * 1000)) {
    const newTokens = await tiktokOAuth.refreshAccessToken(token.refreshToken);
    
    await db.tokens.update({
      accessToken: newTokens.access_token,
      refreshToken: newTokens.refresh_token || token.refreshToken,
      expiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
    });
    
    return newTokens.access_token;
  }
  
  return token.accessToken;
}
```

---

### 4. getUserInfo()

Get user information using access token.

**Signature:**
```typescript
async getUserInfo(accessToken: string): Promise<TikTokUserInfo>
```

**Parameters:**
- `accessToken`: Valid access token

**Returns:**
```typescript
{
  open_id: string;        // User's TikTok open ID
  union_id: string;       // User's union ID (across apps)
  avatar_url: string;     // User's avatar URL
  display_name: string;   // User's display name
}
```

**Throws:**
- `TikTokAPIError` with code:
  - `INVALID_TOKEN`: Invalid or expired access token
  - `NETWORK_ERROR`: Network failure (retryable)

**Example:**
```typescript
const accessToken = await getTikTokAccessToken(userId);
const userInfo = await tiktokOAuth.getUserInfo(accessToken);

console.log(`Connected: ${userInfo.display_name}`);
console.log(`Avatar: ${userInfo.avatar_url}`);
```

---

### 5. revokeAccess()

Revoke access token (disconnect user).

**Signature:**
```typescript
async revokeAccess(accessToken: string): Promise<void>
```

**Parameters:**
- `accessToken`: Access token to revoke

**Returns:** `void`

**Note:** This is a best-effort operation. Does not throw on failure.

**Example:**
```typescript
// User disconnects TikTok
const token = await db.tokens.findOne({ userId, platform: 'tiktok' });

// Revoke access on TikTok
await tiktokOAuth.revokeAccess(token.accessToken);

// Delete stored tokens
await db.tokens.delete({ userId, platform: 'tiktok' });
```

---

## Error Handling

### Error Types

```typescript
enum TikTokErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',        // Network failure
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',        // Request timeout
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS', // Invalid client credentials
  INVALID_TOKEN = 'INVALID_TOKEN',        // Invalid or expired token
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',        // Token expired
  RATE_LIMIT = 'RATE_LIMIT',              // Rate limit exceeded
  API_ERROR = 'API_ERROR',                // TikTok API error
  VALIDATION_ERROR = 'VALIDATION_ERROR',  // Validation error
}
```

### Error Interface

```typescript
interface TikTokAPIError extends Error {
  code: TikTokErrorCode;      // Error code
  statusCode?: number;        // HTTP status code
  correlationId: string;      // Correlation ID for tracing
  retryable: boolean;         // Whether error is retryable
  logId?: string;             // TikTok log ID
}
```

### Error Handling Example

```typescript
try {
  const tokens = await tiktokOAuth.exchangeCodeForTokens(code);
  // Success
} catch (error) {
  const tiktokError = error as TikTokAPIError;
  
  console.error('TikTok OAuth error:', {
    code: tiktokError.code,
    message: tiktokError.message,
    correlationId: tiktokError.correlationId,
    retryable: tiktokError.retryable,
  });
  
  // Handle specific errors
  switch (tiktokError.code) {
    case TikTokErrorCode.INVALID_TOKEN:
      return res.status(400).json({ error: 'Invalid authorization code' });
    
    case TikTokErrorCode.INVALID_CREDENTIALS:
      return res.status(500).json({ error: 'Server configuration error' });
    
    case TikTokErrorCode.RATE_LIMIT:
      return res.status(429).json({ error: 'Too many requests' });
    
    case TikTokErrorCode.NETWORK_ERROR:
    case TikTokErrorCode.TIMEOUT_ERROR:
    case TikTokErrorCode.API_ERROR:
      // Retryable errors
      if (tiktokError.retryable) {
        return res.status(503).json({ error: 'Service temporarily unavailable' });
      }
      break;
  }
  
  return res.status(500).json({ error: 'Internal server error' });
}
```

### Retry Strategy

The service automatically retries failed requests with exponential backoff:

- **Max attempts:** 3
- **Initial delay:** 100ms
- **Max delay:** 2000ms
- **Backoff factor:** 2x

**Retry sequence:**
1. First attempt: immediate
2. Second attempt: 100ms delay
3. Third attempt: 200ms delay

**Retryable errors:**
- Network errors
- Timeout errors
- Rate limit errors (429)
- Server errors (5xx)

**Non-retryable errors:**
- Invalid credentials
- Invalid tokens
- Validation errors

---

## TypeScript Types

### Request Types

```typescript
// Authorization URL request
interface GetAuthUrlOptions {
  scopes?: string[];
}

// Token exchange request
interface ExchangeCodeRequest {
  code: string;
}

// Token refresh request
interface RefreshTokenRequest {
  refreshToken: string;
}
```

### Response Types

```typescript
// Authorization URL response
interface TikTokAuthUrl {
  url: string;
  state: string;
}

// Token response
interface TikTokTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  open_id: string;
  scope: string;
  token_type: string;
}

// Refresh response
interface TikTokRefreshResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  refresh_expires_in?: number;
  token_type: string;
}

// User info response
interface TikTokUserInfo {
  open_id: string;
  union_id: string;
  avatar_url: string;
  display_name: string;
}
```

---

## Examples

### Complete OAuth Flow

```typescript
// 1. Initiate OAuth flow
app.get('/auth/tiktok', async (req, res) => {
  try {
    const { url, state } = await tiktokOAuth.getAuthorizationUrl();
    
    // Store state in session
    req.session.tiktokState = state;
    
    // Redirect to TikTok
    res.redirect(url);
  } catch (error) {
    console.error('Failed to generate auth URL:', error);
    res.status(500).json({ error: 'Failed to initiate OAuth' });
  }
});

// 2. Handle callback
app.get('/auth/tiktok/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    // Validate state (CSRF protection)
    if (state !== req.session.tiktokState) {
      return res.status(400).json({ error: 'Invalid state' });
    }
    
    // Exchange code for tokens
    const tokens = await tiktokOAuth.exchangeCodeForTokens(code as string);
    
    // Get user info
    const userInfo = await tiktokOAuth.getUserInfo(tokens.access_token);
    
    // Store tokens
    await db.tokens.create({
      userId: req.user.id,
      platform: 'tiktok',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      openId: userInfo.open_id,
      displayName: userInfo.display_name,
      avatarUrl: userInfo.avatar_url,
    });
    
    // Redirect to success page
    res.redirect('/dashboard?connected=tiktok');
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect('/dashboard?error=tiktok_auth_failed');
  }
});

// 3. Use access token
app.post('/api/tiktok/upload', async (req, res) => {
  try {
    // Get valid access token (auto-refresh if needed)
    const accessToken = await getTikTokAccessToken(req.user.id);
    
    // Use token for API call
    const response = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// 4. Disconnect
app.post('/api/tiktok/disconnect', async (req, res) => {
  try {
    const token = await db.tokens.findOne({
      userId: req.user.id,
      platform: 'tiktok',
    });
    
    // Revoke access on TikTok
    await tiktokOAuth.revokeAccess(token.accessToken);
    
    // Delete stored tokens
    await db.tokens.delete({ userId: req.user.id, platform: 'tiktok' });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({ error: 'Disconnect failed' });
  }
});
```

---

## Best Practices

### 1. Token Storage

✅ **DO:**
- Store tokens encrypted in database
- Use secure session storage for state
- Set appropriate token expiry times
- Implement token rotation

❌ **DON'T:**
- Store tokens in localStorage
- Log tokens in console
- Share tokens between users
- Store tokens in cookies without encryption

### 2. Error Handling

✅ **DO:**
- Handle all error types
- Log correlation IDs for debugging
- Implement retry logic for retryable errors
- Show user-friendly error messages

❌ **DON'T:**
- Expose internal errors to users
- Ignore error codes
- Retry non-retryable errors
- Skip error logging

### 3. Security

✅ **DO:**
- Validate state parameter (CSRF protection)
- Use HTTPS for all requests
- Rotate refresh tokens
- Implement rate limiting

❌ **DON'T:**
- Skip state validation
- Use HTTP in production
- Reuse old refresh tokens
- Allow unlimited requests

### 4. Performance

✅ **DO:**
- Cache credentials validation (5min TTL)
- Refresh tokens before expiry (5min buffer)
- Use connection pooling
- Implement request deduplication

❌ **DON'T:**
- Validate credentials on every request
- Wait for token expiry
- Create new connections for each request
- Make duplicate requests

---

## Logging

All methods include comprehensive logging:

```typescript
// Example log output
[TikTokOAuth] exchangeCodeForTokens - Starting {
  codeLength: 64,
  correlationId: 'tiktok-1699876543210-a1b2c3d4',
  timestamp: '2024-11-14T10:30:00.000Z'
}

[TikTokOAuth] exchangeCodeForTokens - Response received {
  status: 200,
  duration: '245ms',
  attempt: 1,
  correlationId: 'tiktok-1699876543210-a1b2c3d4',
  logId: 'tiktok-log-xyz'
}

[TikTokOAuth] exchangeCodeForTokens - Success {
  openId: 'user_123',
  expiresIn: '86400s',
  scopes: 'user.info.basic,video.upload',
  correlationId: 'tiktok-1699876543210-a1b2c3d4'
}
```

---

## Support

- **TikTok Developer Docs:** https://developers.tiktok.com/
- **OAuth Documentation:** https://developers.tiktok.com/doc/oauth-user-access-token-management
- **API Reference:** https://developers.tiktok.com/doc/content-posting-api-reference

---

## Changelog

### v2.0.0 (2024-11-14)
- ✨ Added automatic retry with exponential backoff
- ✨ Added request timeout handling (10s)
- ✨ Added comprehensive error types
- ✨ Added correlation IDs for tracing
- ✨ Added detailed logging
- ✨ Improved TypeScript types
- 🐛 Fixed credential validation timing
- 📝 Added complete API documentation

### v1.0.0 (2024-11-01)
- 🎉 Initial release
- ✅ OAuth 2.0 flow implementation
- ✅ Token refresh with rotation
- ✅ Credential validation
