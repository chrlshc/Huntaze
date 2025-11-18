# Integrations Management System

Core infrastructure for managing OAuth integrations across multiple platforms (Instagram, TikTok, Reddit, OnlyFans).

## Overview

This system provides a unified interface for:
- Initiating OAuth flows
- Handling OAuth callbacks
- Storing encrypted tokens
- Refreshing expired tokens
- Disconnecting integrations
- Managing multi-account support

## Architecture

```
IntegrationsService
├── Platform Adapters
│   ├── InstagramAdapter (wraps instagramOAuth-optimized)
│   ├── TikTokAdapter (wraps tiktokOAuth-optimized)
│   ├── RedditAdapter (wraps redditOAuth-optimized)
│   └── OnlyFansAdapter (cookie-based auth)
├── Token Encryption (AES-256-GCM)
└── Database Layer (Prisma OAuthAccount model)
```

## Usage

### Initialize the Service

```typescript
import { integrationsService } from '@/lib/services/integrations';
```

### Get Connected Integrations

```typescript
const integrations = await integrationsService.getConnectedIntegrations(userId);
```

### Initiate OAuth Flow

```typescript
const { authUrl, state } = await integrationsService.initiateOAuthFlow(
  'instagram',
  userId,
  'https://app.com/integrations/callback'
);

// Redirect user to authUrl
```

### Handle OAuth Callback

```typescript
const { userId, accountId } = await integrationsService.handleOAuthCallback(
  'instagram',
  code,
  state
);
```

### Refresh Token

```typescript
await integrationsService.refreshToken('instagram', accountId);
```

### Disconnect Integration

```typescript
await integrationsService.disconnectIntegration(userId, 'instagram', accountId);
```

### Get Access Token

```typescript
const accessToken = await integrationsService.getAccessToken(
  userId,
  'instagram',
  accountId
);
```

## Token Encryption

All tokens are encrypted at rest using AES-256-GCM encryption.

### Environment Variables

Required:
- `TOKEN_ENCRYPTION_KEY` or `DATA_ENCRYPTION_KEY` - 32-byte encryption key (base64 encoded)

### Encryption Utilities

```typescript
import { encryptToken, decryptToken, isEncrypted } from '@/lib/services/integrations';

// Encrypt a token
const encrypted = encryptToken('my-access-token');

// Decrypt a token
const decrypted = decryptToken(encrypted);

// Check if encrypted
const isEnc = isEncrypted(token);
```

## Platform Adapters

Each platform has a dedicated adapter that implements a consistent interface:

### Interface

```typescript
interface PlatformAdapter {
  getAuthUrl(redirectUri: string, state: string): Promise<OAuthResult>;
  exchangeCodeForToken(code: string): Promise<TokenResponse>;
  refreshAccessToken(refreshToken: string): Promise<TokenResponse>;
  getUserProfile(accessToken: string): Promise<AccountInfo>;
  revokeAccess(accessToken: string): Promise<void>;
}
```

### Instagram

- Uses Facebook OAuth
- Requires Instagram Business account
- Long-lived tokens (60 days)
- Token refresh supported

### TikTok

- Uses TikTok OAuth 2.0
- Supports PKCE
- Refresh tokens provided
- Token refresh supported

### Reddit

- Uses Reddit OAuth 2.0
- Permanent tokens available
- Refresh tokens provided
- Token refresh supported

### OnlyFans

- Cookie-based authentication (not OAuth)
- Custom flow through `/of/connect`
- No refresh mechanism
- User must reconnect when cookie expires

## Database Schema

```prisma
model OAuthAccount {
  id                 Int       @id @default(autoincrement())
  userId             Int
  provider           String    // 'instagram', 'tiktok', 'reddit', 'onlyfans'
  providerAccountId  String
  accessToken        String?   // Encrypted
  refreshToken       String?   // Encrypted
  expiresAt          DateTime?
  tokenType          String?
  scope              String?
  metadata           Json?     // Provider-specific data
  createdAt          DateTime
  updatedAt          DateTime
  
  @@unique([provider, providerAccountId])
  @@index([userId, provider])
}
```

## Error Handling

All errors are wrapped in `IntegrationsServiceError`:

```typescript
interface IntegrationsServiceError extends Error {
  code: string;
  provider?: Provider;
  retryable: boolean;
}
```

### Error Codes

- `INVALID_PROVIDER` - Unsupported provider
- `DATABASE_ERROR` - Database operation failed
- `OAUTH_INIT_ERROR` - Failed to initiate OAuth
- `OAUTH_CALLBACK_ERROR` - Failed to handle callback
- `TOKEN_REFRESH_ERROR` - Failed to refresh token
- `DISCONNECT_ERROR` - Failed to disconnect
- `ACCOUNT_NOT_FOUND` - Integration not found
- `NO_REFRESH_TOKEN` - No refresh token available
- `TOKEN_EXPIRED` - Token expired, reconnection required

## Security

### Token Storage

- All tokens encrypted with AES-256-GCM
- Encryption key stored in environment variables
- IV and auth tag stored with encrypted data
- Tokens never logged

### OAuth Security

- State parameter validation
- CSRF protection
- HTTPS-only redirects
- Secure token exchange

### Database Security

- Cascade deletion on user deletion
- Unique constraints on provider + account ID
- Indexed for performance

## Testing

Run tests:

```bash
npm test tests/unit/services/integrations.service.test.ts
```

## Requirements Satisfied

- **11.1**: Tokens encrypted at rest using AES-256-GCM
- **11.2**: HTTPS enforced for all OAuth flows
- **11.4**: Tokens never logged, secure storage

## Future Enhancements

- Webhook support for real-time updates
- Token auto-refresh before expiry
- Circuit breaker for platform APIs
- Rate limiting per platform
- Audit logging for all operations
