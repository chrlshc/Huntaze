# Integrations Management Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend Layer (Next Tasks)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Integrations │  │  Analytics   │  │   Content    │          │
│  │     Page     │  │     Pages    │  │    Pages     │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│         └──────────────────┼──────────────────┘                   │
│                            │                                      │
│                    ┌───────▼────────┐                            │
│                    │ useIntegrations│                            │
│                    │      Hook      │                            │
│                    └───────┬────────┘                            │
└────────────────────────────┼─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                      API Layer (Next Tasks)                       │
│  ┌──────────────────────────────────────────────────────┐       │
│  │         /api/integrations/*                           │       │
│  │  - GET /status                                        │       │
│  │  - POST /connect/:provider                            │       │
│  │  - DELETE /disconnect/:provider/:accountId            │       │
│  │  - POST /refresh/:provider/:accountId                 │       │
│  └──────────────────┬───────────────────────────────────┘       │
└─────────────────────┼───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│              ✅ IntegrationsService (COMPLETED)                  │
│  ┌──────────────────────────────────────────────────────┐       │
│  │  Core Methods:                                        │       │
│  │  • getConnectedIntegrations(userId)                   │       │
│  │  • initiateOAuthFlow(provider, userId, redirectUrl)   │       │
│  │  • handleOAuthCallback(provider, code, state)         │       │
│  │  • refreshToken(provider, accountId)                  │       │
│  │  • disconnectIntegration(userId, provider, accountId) │       │
│  │  • getAccessToken(userId, provider, accountId)        │       │
│  └──────────────────┬───────────────────────────────────┘       │
│                     │                                             │
│  ┌──────────────────▼───────────────────────────────────┐       │
│  │  ✅ Token Encryption (AES-256-GCM)                    │       │
│  │  • encryptToken() / decryptToken()                    │       │
│  │  • isEncrypted() / safeEncrypt() / safeDecrypt()      │       │
│  └──────────────────┬───────────────────────────────────┘       │
│                     │                                             │
│  ┌──────────────────▼───────────────────────────────────┐       │
│  │  ✅ Platform Adapters                                 │       │
│  │  ┌────────────────────────────────────────────────┐  │       │
│  │  │ InstagramAdapter                               │  │       │
│  │  │ → instagramOAuth-optimized                     │  │       │
│  │  │ → Facebook OAuth → Long-lived tokens           │  │       │
│  │  └────────────────────────────────────────────────┘  │       │
│  │  ┌────────────────────────────────────────────────┐  │       │
│  │  │ TikTokAdapter                                  │  │       │
│  │  │ → tiktokOAuth-optimized                        │  │       │
│  │  │ → TikTok OAuth 2.0 → Refresh tokens            │  │       │
│  │  └────────────────────────────────────────────────┘  │       │
│  │  ┌────────────────────────────────────────────────┐  │       │
│  │  │ RedditAdapter                                  │  │       │
│  │  │ → redditOAuth-optimized                        │  │       │
│  │  │ → Reddit OAuth 2.0 → Permanent tokens          │  │       │
│  │  └────────────────────────────────────────────────┘  │       │
│  │  ┌────────────────────────────────────────────────┐  │       │
│  │  │ OnlyFansAdapter                                │  │       │
│  │  │ → Custom cookie-based auth                     │  │       │
│  │  │ → Session cookies → No refresh                 │  │       │
│  │  └────────────────────────────────────────────────┘  │       │
│  └───────────────────────────────────────────────────────┘       │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                  Data Layer                                       │
│  ┌──────────────────────────────────────────────────────┐       │
│  │         Prisma ORM                                    │       │
│  │  - OAuthAccount model                                 │       │
│  │  - User model                                         │       │
│  └──────────────────┬───────────────────────────────────┘       │
│                     │                                             │
│  ┌──────────────────▼───────────────────────────────────┐       │
│  │         PostgreSQL Database                           │       │
│  │  - oauth_accounts table                               │       │
│  │    • Encrypted access tokens                          │       │
│  │    • Encrypted refresh tokens                         │       │
│  │    • Token expiry timestamps                          │       │
│  │    • Provider-specific metadata (JSON)                │       │
│  │  - users table                                        │       │
│  └───────────────────────────────────────────────────────┘       │
└───────────────────────────────────────────────────────────────────┘
```

## Component Details

### ✅ IntegrationsService (Completed)

**Location**: `lib/services/integrations/integrations.service.ts`

**Responsibilities**:
- Orchestrate OAuth flows across platforms
- Manage token lifecycle (store, refresh, revoke)
- Encrypt/decrypt tokens for storage
- Validate state parameters
- Handle multi-account support

**Key Methods**:
```typescript
class IntegrationsService {
  getConnectedIntegrations(userId: number): Promise<Integration[]>
  initiateOAuthFlow(provider, userId, redirectUrl): Promise<OAuthResult>
  handleOAuthCallback(provider, code, state): Promise<{userId, accountId}>
  refreshToken(provider, accountId): Promise<void>
  disconnectIntegration(userId, provider, accountId): Promise<void>
  getAccessToken(userId, provider, accountId): Promise<string>
  isTokenExpired(expiresAt: Date | null): boolean
}
```

### ✅ Token Encryption (Completed)

**Location**: `lib/services/integrations/encryption.ts`

**Algorithm**: AES-256-GCM
**Format**: `iv:authTag:encrypted` (hex-encoded)

**Functions**:
```typescript
encryptToken(token: string): string
decryptToken(encryptedToken: string): string
isEncrypted(token: string): boolean
safeEncrypt(token: string): string
safeDecrypt(token: string): string
```

**Security Features**:
- 16-byte random IV per encryption
- 16-byte authentication tag (GCM mode)
- 32-byte encryption key from environment
- No token logging
- Automatic validation

### ✅ Platform Adapters (Completed)

**Location**: `lib/services/integrations/adapters/`

Each adapter implements:
```typescript
interface PlatformAdapter {
  getAuthUrl(redirectUri, state): Promise<OAuthResult>
  exchangeCodeForToken(code): Promise<TokenResponse>
  refreshAccessToken(refreshToken): Promise<TokenResponse>
  getUserProfile(accessToken): Promise<AccountInfo>
  revokeAccess(accessToken): Promise<void>
}
```

#### Instagram Adapter
- **OAuth Provider**: Facebook
- **Token Type**: Long-lived (60 days)
- **Refresh**: Supported (token refresh, not refresh token)
- **Account Type**: Instagram Business
- **Metadata**: `ig_business_id`, `followers_count`, etc.

#### TikTok Adapter
- **OAuth Provider**: TikTok
- **Token Type**: Short-lived with refresh token
- **Refresh**: Supported (refresh token)
- **Account Type**: TikTok Creator
- **Metadata**: `open_id`, `union_id`

#### Reddit Adapter
- **OAuth Provider**: Reddit
- **Token Type**: Permanent (with refresh)
- **Refresh**: Supported (refresh token)
- **Account Type**: Reddit User
- **Metadata**: `karma`, `created_utc`

#### OnlyFans Adapter
- **OAuth Provider**: N/A (Cookie-based)
- **Token Type**: Session cookie
- **Refresh**: Not supported (reconnect required)
- **Account Type**: OnlyFans Creator
- **Metadata**: `account_id`, `username`

## Data Flow

### OAuth Connection Flow

```
1. User clicks "Connect Instagram"
   ↓
2. Frontend calls initiateOAuthFlow()
   ↓
3. IntegrationsService generates state with userId
   ↓
4. InstagramAdapter creates OAuth URL
   ↓
5. User redirected to Instagram
   ↓
6. User authorizes app
   ↓
7. Instagram redirects to callback with code
   ↓
8. Frontend calls handleOAuthCallback()
   ↓
9. IntegrationsService validates state
   ↓
10. InstagramAdapter exchanges code for tokens
   ↓
11. InstagramAdapter fetches user profile
   ↓
12. IntegrationsService encrypts tokens
   ↓
13. Tokens stored in database (oauth_accounts)
   ↓
14. Success response returned
```

### Token Refresh Flow

```
1. API needs access token
   ↓
2. Calls getAccessToken()
   ↓
3. IntegrationsService checks expiry
   ↓
4. If expired and refresh token exists:
   ├─→ Decrypt refresh token
   ├─→ Call adapter.refreshAccessToken()
   ├─→ Encrypt new tokens
   ├─→ Update database
   └─→ Return new access token
   ↓
5. If not expired:
   └─→ Decrypt and return access token
```

### Disconnection Flow

```
1. User clicks "Disconnect"
   ↓
2. Frontend calls disconnectIntegration()
   ↓
3. IntegrationsService validates ownership
   ↓
4. Decrypt access token
   ↓
5. Call adapter.revokeAccess() (best effort)
   ↓
6. Delete from database
   ↓
7. Success response
```

## Security Architecture

### Token Storage Security

```
┌─────────────────────────────────────────────┐
│ Application Memory                          │
│ ┌─────────────────────────────────────────┐ │
│ │ Plain Text Token (temporary)            │ │
│ │ "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" │ │
│ └─────────────────┬───────────────────────┘ │
│                   │ encryptToken()           │
│                   ↓                          │
│ ┌─────────────────────────────────────────┐ │
│ │ Encrypted Token                         │ │
│ │ "a1b2c3:d4e5f6:789abc..."               │ │
│ │  ↑     ↑       ↑                        │ │
│ │  IV    AuthTag Encrypted                │ │
│ └─────────────────┬───────────────────────┘ │
└───────────────────┼─────────────────────────┘
                    │ Store in DB
                    ↓
┌─────────────────────────────────────────────┐
│ PostgreSQL Database                         │
│ ┌─────────────────────────────────────────┐ │
│ │ oauth_accounts.access_token             │ │
│ │ "a1b2c3:d4e5f6:789abc..." (encrypted)   │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Encryption Key Management

```
Environment Variables
├── TOKEN_ENCRYPTION_KEY (preferred)
└── DATA_ENCRYPTION_KEY (fallback)
    ↓
    If base64 (44 chars, ends with =)
    ├─→ Decode from base64
    └─→ Use as 32-byte key
    
    Otherwise
    └─→ SHA-256 hash to get 32 bytes
```

## File Structure

```
lib/services/integrations/
├── integrations.service.ts    # Main service class
├── encryption.ts              # Token encryption utilities
├── types.ts                   # TypeScript definitions
├── index.ts                   # Public exports
├── README.md                  # Documentation
└── adapters/
    ├── index.ts               # Adapter exports
    ├── instagram.adapter.ts   # Instagram OAuth wrapper
    ├── tiktok.adapter.ts      # TikTok OAuth wrapper
    ├── reddit.adapter.ts      # Reddit OAuth wrapper
    └── onlyfans.adapter.ts    # OnlyFans cookie auth

tests/unit/services/
└── integrations.service.test.ts  # Unit tests (8 tests)

.kiro/specs/integrations-management/
├── requirements.md            # Feature requirements
├── design.md                  # Design document
├── tasks.md                   # Implementation tasks
├── TASK_1_COMPLETION.md       # Task 1 summary
└── ARCHITECTURE.md            # This file
```

## Next Steps

### Task 2: API Routes
- `GET /api/integrations/status`
- `POST /api/integrations/connect/:provider`
- `GET /api/integrations/callback/:provider`
- `DELETE /api/integrations/disconnect/:provider/:accountId`
- `POST /api/integrations/refresh/:provider/:accountId`

### Task 3: Frontend Components
- `IntegrationsPage` component
- `IntegrationCard` component
- `IntegrationIcon` component
- `IntegrationStatus` component

### Task 4: React Hook
- `useIntegrations` hook with:
  - `connect()`, `disconnect()`, `reconnect()`, `refresh()`
  - Loading and error state management
  - Real-time status updates

### Task 5: Token Refresh Mechanism
- Automatic token refresh logic
- Retry with exponential backoff
- Token expiry detection
- Graceful failure handling

## Testing Strategy

### Unit Tests ✅
- Token encryption/decryption
- Round-trip encryption
- Error handling
- Service initialization

### Integration Tests (Next)
- OAuth flow end-to-end
- Token refresh flow
- Disconnection flow
- Multi-account support

### Property-Based Tests (Optional)
- Token encryption round-trip
- OAuth state validation
- Disconnection cleanup
- Metadata persistence

## Performance Considerations

### Caching
- Integration status cached (5 min TTL)
- Token validation cached
- Adapter instances singleton

### Database
- Indexed on (userId, provider)
- Unique constraint on (provider, providerAccountId)
- Cascade deletion on user deletion

### API Rate Limiting
- Circuit breaker in existing OAuth services
- Exponential backoff on retries
- Request queuing for high traffic

## Monitoring & Observability

### Logging
- OAuth flow initiation
- Token refresh attempts
- Disconnection events
- Error tracking with correlation IDs

### Metrics (Future)
- OAuth success/failure rates
- Token refresh success rates
- Integration connection counts
- Error rates by provider

### Alerts (Future)
- High OAuth failure rate
- Token refresh failures
- Database connection issues
- Encryption key missing
