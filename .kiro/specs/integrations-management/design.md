# Design Document: Integrations Management System

## Overview

The Integrations Management System provides a centralized interface for users to connect, manage, and monitor their social media and content platform accounts. The system follows a Shopify-style app management pattern with visual cards, clear status indicators, and streamlined OAuth flows.

### Key Design Principles

1. **Visual Clarity**: Each integration is represented by a card with clear status indicators
2. **Progressive Disclosure**: Show essential information first, details on demand
3. **Error Recovery**: Provide clear paths to fix connection issues
4. **Security First**: Handle credentials securely throughout the flow
5. **Real Data Only**: Never display mock data for connected integrations

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Integrations │  │  Analytics   │  │   Content    │     │
│  │     Page     │  │     Pages    │  │    Pages     │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                       │
│                    │ useIntegrations│                       │
│                    │      Hook      │                       │
│                    └───────┬────────┘                       │
└────────────────────────────┼──────────────────────────────┘
                             │
┌────────────────────────────▼──────────────────────────────┐
│                      API Layer                             │
│  ┌──────────────────────────────────────────────────┐    │
│  │         /api/integrations/*                       │    │
│  │  - GET /status                                    │    │
│  │  - POST /connect/:provider                        │    │
│  │  - DELETE /disconnect/:provider/:accountId        │    │
│  │  - POST /refresh/:provider/:accountId             │    │
│  └──────────────────┬───────────────────────────────┘    │
│                     │                                      │
│  ┌──────────────────▼───────────────────────────────┐    │
│  │      IntegrationsService                          │    │
│  │  - getConnectedIntegrations()                     │    │
│  │  - initiateOAuthFlow()                            │    │
│  │  - handleOAuthCallback()                          │    │
│  │  - refreshToken()                                 │    │
│  │  - disconnectIntegration()                        │    │
│  └──────────────────┬───────────────────────────────┘    │
└─────────────────────┼────────────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────────────┐
│                  Data Layer                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Prisma ORM                                │   │
│  │  - OAuthAccount model                             │   │
│  │  - User model                                     │   │
│  └──────────────────┬───────────────────────────────┘   │
│                     │                                     │
│  ┌──────────────────▼───────────────────────────────┐   │
│  │         PostgreSQL Database                       │   │
│  │  - oauth_accounts table                           │   │
│  │  - users table                                    │   │
│  └───────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
IntegrationsPage
├── IntegrationsHeader
├── IntegrationsGrid
│   ├── IntegrationCard (OnlyFans)
│   │   ├── IntegrationIcon
│   │   ├── IntegrationStatus
│   │   └── IntegrationActions
│   ├── IntegrationCard (Instagram)
│   ├── IntegrationCard (TikTok)
│   └── IntegrationCard (Reddit)
└── EmptyState (if no integrations)
```

## Components and Interfaces

### Frontend Components

#### 1. IntegrationsPage Component

Main page component that orchestrates the integrations management interface.

```typescript
// app/(app)/integrations/page.tsx
interface IntegrationsPageProps {
  // No props - uses session for user context
}

export default function IntegrationsPage(): JSX.Element
```

**Responsibilities**:
- Fetch user's connected integrations on mount
- Display integration cards in a grid layout
- Handle loading and error states
- Provide search/filter functionality

#### 2. IntegrationCard Component

Visual card representing a single integration.

```typescript
// components/integrations/IntegrationCard.tsx
interface IntegrationCardProps {
  provider: 'instagram' | 'tiktok' | 'reddit' | 'onlyfans';
  isConnected: boolean;
  account?: {
    providerAccountId: string;
    metadata?: Record<string, any>;
    expiresAt?: Date;
    createdAt: Date;
  };
  onConnect: () => void;
  onDisconnect: () => void;
  onReconnect: () => void;
}

export function IntegrationCard(props: IntegrationCardProps): JSX.Element
```

**States**:
- `disconnected`: Not connected, shows "Add app" button
- `connected`: Active connection, shows account info
- `expired`: Token expired, shows "Reconnect" button
- `error`: Connection error, shows error message
- `loading`: Action in progress

#### 3. useIntegrations Hook

Custom hook for managing integrations state.

```typescript
// hooks/useIntegrations.ts
interface Integration {
  provider: string;
  providerAccountId: string;
  isConnected: boolean;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface UseIntegrationsReturn {
  integrations: Integration[];
  loading: boolean;
  error: string | null;
  connect: (provider: string) => Promise<void>;
  disconnect: (provider: string, accountId: string) => Promise<void>;
  reconnect: (provider: string, accountId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useIntegrations(): UseIntegrationsReturn
```

### Backend Services

#### 1. IntegrationsService

Core service for managing integrations.

```typescript
// lib/services/integrations.service.ts
export class IntegrationsService {
  /**
   * Get all integrations for a user
   */
  async getConnectedIntegrations(userId: number): Promise<Integration[]>
  
  /**
   * Initiate OAuth flow for a provider
   */
  async initiateOAuthFlow(
    provider: string,
    userId: number,
    redirectUrl: string
  ): Promise<{ authUrl: string; state: string }>
  
  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(
    provider: string,
    code: string,
    state: string
  ): Promise<OAuthAccount>
  
  /**
   * Refresh an expired token
   */
  async refreshToken(
    provider: string,
    accountId: string
  ): Promise<OAuthAccount>
  
  /**
   * Disconnect an integration
   */
  async disconnectIntegration(
    userId: number,
    provider: string,
    accountId: string
  ): Promise<void>
  
  /**
   * Check if token is expired
   */
  isTokenExpired(expiresAt: Date | null): boolean
  
  /**
   * Get platform-specific OAuth config
   */
  private getOAuthConfig(provider: string): OAuthConfig
}
```

#### 2. Platform-Specific Adapters

Each platform has its own adapter for OAuth and API calls.

```typescript
// lib/integrations/adapters/instagram.adapter.ts
export class InstagramAdapter {
  async getAuthUrl(redirectUri: string, state: string): Promise<string>
  async exchangeCodeForToken(code: string): Promise<TokenResponse>
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse>
  async getUserProfile(accessToken: string): Promise<InstagramProfile>
  async revokeAccess(accessToken: string): Promise<void>
}

// Similar adapters for TikTok, Reddit, OnlyFans
```

### API Routes

#### 1. GET /api/integrations/status

Get all integrations for the current user.

**Response**:
```typescript
{
  integrations: [
    {
      provider: 'instagram',
      providerAccountId: '123456',
      isConnected: true,
      expiresAt: '2024-12-31T23:59:59Z',
      metadata: { ig_business_id: '789' },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z'
    }
  ]
}
```

#### 2. POST /api/integrations/connect/:provider

Initiate OAuth flow for a provider.

**Request**:
```typescript
{
  redirectUrl: string; // Where to redirect after OAuth
}
```

**Response**:
```typescript
{
  authUrl: string; // URL to redirect user to
  state: string;   // CSRF protection token
}
```

#### 3. GET /api/integrations/callback/:provider

Handle OAuth callback.

**Query Parameters**:
- `code`: Authorization code from provider
- `state`: CSRF protection token

**Response**: Redirects to integrations page with success/error message

#### 4. DELETE /api/integrations/disconnect/:provider/:accountId

Disconnect an integration.

**Response**:
```typescript
{
  success: boolean;
  message: string;
}
```

#### 5. POST /api/integrations/refresh/:provider/:accountId

Manually refresh a token.

**Response**:
```typescript
{
  success: boolean;
  expiresAt: string;
}
```

## Data Models

### OAuthAccount (Existing)

```prisma
model OAuthAccount {
  id                 Int       @id @default(autoincrement())
  userId             Int       @map("user_id")
  provider           String    @db.VarChar(50)
  providerAccountId  String    @map("provider_account_id") @db.VarChar(255)
  accessToken        String?   @map("access_token") @db.Text
  refreshToken       String?   @map("refresh_token") @db.Text
  expiresAt          DateTime? @map("expires_at") @db.Timestamp(6)
  tokenType          String?   @map("token_type") @db.VarChar(50)
  scope              String?   @db.Text
  metadata           Json?
  createdAt          DateTime  @default(now()) @map("created_at")
  updatedAt          DateTime  @default(now()) @updatedAt @map("updated_at")
  
  user               User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId, provider])
  @@map("oauth_accounts")
}
```

### Platform Metadata Structures

#### Instagram Metadata
```typescript
{
  ig_business_id: string;
  username: string;
  profile_picture_url?: string;
  followers_count?: number;
}
```

#### OnlyFans Metadata
```typescript
{
  account_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
}
```

#### TikTok Metadata
```typescript
{
  open_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
}
```

#### Reddit Metadata
```typescript
{
  username: string;
  icon_img?: string;
  karma?: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Integration uniqueness
*For any* user and provider combination, there should be at most one active integration per providerAccountId
**Validates: Requirements 1.2, 12.4**

### Property 2: Token refresh preserves connection
*For any* integration with a valid refresh token, refreshing the access token should maintain the connection without requiring user re-authentication
**Validates: Requirements 8.1, 8.2**

### Property 3: Disconnection cleanup
*For any* integration, when disconnected, all associated credentials (access token, refresh token) should be removed from the database
**Validates: Requirements 11.5**

### Property 4: OAuth state validation
*For any* OAuth callback, the state parameter must match the one generated during initiation to prevent CSRF attacks
**Validates: Requirements 11.3**

### Property 5: Expired token detection
*For any* integration, if the current time is past expiresAt, the system should mark it as expired and prompt for reconnection
**Validates: Requirements 8.1, 3.3**

### Property 6: Real data display
*For any* connected integration, the system should fetch and display real data from the platform API, never mock data
**Validates: Requirements 6.1, 6.3**

### Property 7: Multi-account support
*For any* user and provider, the system should allow multiple accounts to be connected simultaneously, distinguished by providerAccountId
**Validates: Requirements 12.1, 12.2, 12.4**

### Property 8: Metadata persistence
*For any* integration, platform-specific metadata stored during connection should be retrievable and correctly parsed
**Validates: Requirements 9.1, 9.2, 9.4**

## Error Handling

### OAuth Errors

| Error Type | User Message | Action |
|------------|-------------|--------|
| User cancelled | "Connection cancelled. You can try again anytime." | Return to integrations page |
| Invalid credentials | "Unable to connect. Please check your credentials." | Show reconnect button |
| Network error | "Connection failed. Please check your internet." | Show retry button |
| Rate limit | "Too many attempts. Please try again in 5 minutes." | Disable button temporarily |

### API Errors

| Error Type | Handling Strategy |
|------------|-------------------|
| 401 Unauthorized | Attempt token refresh, then prompt reconnection |
| 403 Forbidden | Show permission error, suggest checking platform settings |
| 429 Rate Limited | Implement exponential backoff, show retry time |
| 500 Server Error | Log error, show generic message to user |
| Network timeout | Retry with exponential backoff (3 attempts) |

### Token Refresh Errors

```typescript
async function handleTokenRefresh(integration: Integration): Promise<void> {
  try {
    const newToken = await refreshToken(integration);
    await updateIntegration(integration.id, { accessToken: newToken });
  } catch (error) {
    if (error.code === 'INVALID_REFRESH_TOKEN') {
      // Mark as requiring reconnection
      await markAsExpired(integration.id);
      notifyUser('Please reconnect your account');
    } else {
      // Temporary error, retry later
      scheduleRetry(integration.id);
    }
  }
}
```

## Testing Strategy

### Unit Tests

1. **IntegrationsService Tests**
   - Test OAuth URL generation
   - Test token refresh logic
   - Test expiry detection
   - Test metadata parsing

2. **Adapter Tests**
   - Test each platform's OAuth flow
   - Test API call formatting
   - Test error handling

3. **Component Tests**
   - Test IntegrationCard states
   - Test button interactions
   - Test error display

### Property-Based Tests

Property-based tests will use **fast-check** library for TypeScript. Each test should run a minimum of 100 iterations.

1. **Property 1 Test: Integration uniqueness**
   - Generate random users and integrations
   - Verify no duplicate (provider, providerAccountId) pairs per user
   - **Feature: integrations-management, Property 1: Integration uniqueness**

2. **Property 2 Test: Token refresh preserves connection**
   - Generate random integrations with refresh tokens
   - Refresh tokens and verify connection remains active
   - **Feature: integrations-management, Property 2: Token refresh preserves connection**

3. **Property 3 Test: Disconnection cleanup**
   - Generate random connected integrations
   - Disconnect and verify all credentials removed
   - **Feature: integrations-management, Property 3: Disconnection cleanup**

4. **Property 4 Test: OAuth state validation**
   - Generate random OAuth states
   - Verify callbacks with mismatched states are rejected
   - **Feature: integrations-management, Property 4: OAuth state validation**

5. **Property 5 Test: Expired token detection**
   - Generate integrations with various expiry times
   - Verify expired tokens are correctly identified
   - **Feature: integrations-management, Property 5: Expired token detection**

6. **Property 6 Test: Real data display**
   - Generate connected integrations
   - Verify no mock data patterns in responses
   - **Feature: integrations-management, Property 6: Real data display**

7. **Property 7 Test: Multi-account support**
   - Generate users with multiple accounts per platform
   - Verify all accounts are stored and retrievable
   - **Feature: integrations-management, Property 7: Multi-account support**

8. **Property 8 Test: Metadata persistence**
   - Generate random metadata for each platform
   - Store and retrieve, verify structure preserved
   - **Feature: integrations-management, Property 8: Metadata persistence**

### Integration Tests

1. **OAuth Flow Tests**
   - Test complete OAuth flow for each platform
   - Test error scenarios (cancelled, invalid code)
   - Test state parameter validation

2. **API Endpoint Tests**
   - Test /api/integrations/status
   - Test /api/integrations/connect/:provider
   - Test /api/integrations/disconnect/:provider/:accountId
   - Test authentication requirements

3. **Database Tests**
   - Test OAuthAccount CRUD operations
   - Test cascade deletion
   - Test unique constraints

### E2E Tests

1. **User Journey: Connect Instagram**
   - Navigate to integrations page
   - Click "Add app" on Instagram card
   - Complete OAuth flow
   - Verify card shows "Connected" status

2. **User Journey: Disconnect Integration**
   - Start with connected integration
   - Click disconnect button
   - Confirm disconnection
   - Verify card shows "Add app" button

3. **User Journey: Reconnect Expired Integration**
   - Start with expired integration
   - Click "Reconnect" button
   - Complete OAuth flow
   - Verify connection restored

## Security Considerations

### Token Storage

- Access tokens encrypted at rest using AES-256
- Refresh tokens encrypted separately
- Encryption keys stored in environment variables
- Never log tokens in application logs

### OAuth Security

- Use PKCE (Proof Key for Code Exchange) where supported
- Generate cryptographically secure state parameters
- Validate state parameter on callback
- Use short-lived authorization codes
- Implement HTTPS-only redirects

### API Security

- Require authentication for all integration endpoints
- Validate user owns the integration before operations
- Rate limit OAuth initiation attempts
- Sanitize error messages to prevent information leakage

### Data Access

- Use Prisma's built-in SQL injection protection
- Implement row-level security checks
- Audit log all integration operations
- Implement GDPR-compliant data deletion

## Performance Considerations

### Caching Strategy

```typescript
// Cache integration status for 5 minutes
const CACHE_TTL = 5 * 60 * 1000;

interface CacheEntry {
  data: Integration[];
  timestamp: number;
}

const cache = new Map<number, CacheEntry>();

async function getCachedIntegrations(userId: number): Promise<Integration[]> {
  const cached = cache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const fresh = await fetchIntegrations(userId);
  cache.set(userId, { data: fresh, timestamp: Date.now() });
  return fresh;
}
```

### Database Optimization

- Use indexes on (userId, provider) for fast lookups
- Implement connection pooling
- Use prepared statements for repeated queries
- Batch token refresh operations

### API Rate Limiting

- Implement per-user rate limits
- Use exponential backoff for retries
- Cache platform API responses
- Implement request queuing for high-traffic periods

## Deployment Considerations

### Environment Variables

```bash
# OAuth Credentials
INSTAGRAM_CLIENT_ID=
INSTAGRAM_CLIENT_SECRET=
INSTAGRAM_REDIRECT_URI=

TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
TIKTOK_REDIRECT_URI=

REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_REDIRECT_URI=

# Encryption
TOKEN_ENCRYPTION_KEY=

# Feature Flags
ENABLE_INSTAGRAM_INTEGRATION=true
ENABLE_TIKTOK_INTEGRATION=true
ENABLE_REDDIT_INTEGRATION=true
ENABLE_ONLYFANS_INTEGRATION=true
```

### Database Migrations

Existing schema is sufficient. No migrations needed.

### Monitoring

- Track OAuth success/failure rates
- Monitor token refresh failures
- Alert on high error rates
- Track integration connection counts

## Future Enhancements

1. **Webhook Support**: Receive real-time updates from platforms
2. **Bulk Operations**: Connect/disconnect multiple accounts at once
3. **Integration Health Dashboard**: Show API status and quota usage
4. **Auto-reconnect**: Automatically refresh tokens before expiry
5. **Integration Marketplace**: Browse and add new integrations
6. **Custom Integrations**: Allow users to add custom OAuth apps
