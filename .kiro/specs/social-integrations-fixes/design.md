# Design Document - Social Integrations Fixes

## Overview

This document describes the technical design for fixing identified issues in the existing social platform integrations. The fixes focus on consistency, security, error handling, and proper user authentication integration.

## Architecture

### Current Issues Identified

1. **Inconsistent OAuth Patterns**: Different platforms use different approaches
2. **Missing User Authentication**: Hardcoded user IDs and missing session validation
3. **Inconsistent Error Handling**: Different error formats across platforms
4. **Token Management Issues**: Direct database access instead of using tokenManager
5. **Missing State Validation**: CSRF protection not implemented consistently
6. **Environment Configuration**: Missing validation and inconsistent setup

### Proposed Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Standardized OAuth Flow                   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  1. User Authentication Check                        │   │
│  │     - Extract user from JWT                          │   │
│  │     - Validate session                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ↓                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  2. OAuth Service (Platform-specific)                │   │
│  │     - TikTokOAuthService                             │   │
│  │     - InstagramOAuthService                          │   │
│  │     - RedditOAuthService                             │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ↓                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  3. Standardized Token Management                    │   │
│  │     - tokenManager.storeTokens()                     │   │
│  │     - tokenManager.getValidToken()                   │   │
│  │     - Automatic refresh handling                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ↓                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  4. Consistent Error Handling                        │   │
│  │     - Standardized error format                      │   │
│  │     - User-friendly messages                         │   │
│  │     - Proper logging                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. User Authentication Utility

```typescript
interface AuthenticatedUser {
  id: number;
  email: string;
  name?: string;
}

interface AuthUtility {
  /**
   * Extract user from JWT token in request
   */
  getUserFromRequest(request: NextRequest): Promise<AuthenticatedUser | null>;
  
  /**
   * Require authentication, throw if not authenticated
   */
  requireAuth(request: NextRequest): Promise<AuthenticatedUser>;
}
```

### 2. Standardized OAuth Error Handling

```typescript
interface OAuthError {
  code: string;
  message: string;
  userMessage: string;
  suggestion?: string;
  retryable: boolean;
}

interface OAuthErrorHandler {
  /**
   * Create standardized error response
   */
  createErrorResponse(error: OAuthError): NextResponse;
  
  /**
   * Handle OAuth callback errors
   */
  handleCallbackError(
    error: string,
    description?: string,
    baseUrl?: string
  ): NextResponse;
  
  /**
   * Log error with context
   */
  logError(error: Error, context: Record<string, any>): void;
}
```

### 3. Enhanced OAuth Services

```typescript
interface EnhancedOAuthService {
  /**
   * Validate credentials and configuration
   */
  validateConfiguration(): Promise<ValidationResult>;
  
  /**
   * Generate authorization URL with proper state
   */
  getAuthorizationUrl(userId: number): Promise<{
    url: string;
    state: string;
  }>;
  
  /**
   * Exchange code for tokens with validation
   */
  exchangeCodeForTokens(
    code: string,
    state: string,
    storedState: string
  ): Promise<TokenResult>;
  
  /**
   * Refresh tokens if supported
   */
  refreshTokens?(refreshToken: string): Promise<RefreshResult>;
  
  /**
   * Revoke access (disconnect)
   */
  revokeAccess(accessToken: string): Promise<void>;
}
```

### 4. Standardized API Endpoints

```typescript
// OAuth Init Pattern
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await requireAuth(request);
    
    // 2. Generate OAuth URL with state
    const { url, state } = await oauthService.getAuthorizationUrl(user.id);
    
    // 3. Store state securely
    const response = NextResponse.redirect(url);
    response.cookies.set('oauth_state', state, SECURE_COOKIE_OPTIONS);
    
    return response;
  } catch (error) {
    return handleOAuthError(error, request);
  }
}

// OAuth Callback Pattern
export async function GET(request: NextRequest) {
  try {
    // 1. Extract parameters
    const { code, state, error } = extractCallbackParams(request);
    
    // 2. Handle OAuth errors
    if (error) {
      return handleCallbackError(error, request);
    }
    
    // 3. Validate state (CSRF protection)
    const storedState = request.cookies.get('oauth_state')?.value;
    validateState(state, storedState);
    
    // 4. Exchange code for tokens
    const tokens = await oauthService.exchangeCodeForTokens(code, state, storedState);
    
    // 5. Get user from session
    const user = await getUserFromRequest(request);
    
    // 6. Store tokens
    await tokenManager.storeTokens({
      userId: user.id,
      provider: 'platform',
      openId: tokens.openId,
      tokens: tokens,
    });
    
    // 7. Redirect to success
    return redirectToSuccess(request, tokens.username);
  } catch (error) {
    return handleOAuthError(error, request);
  }
}
```

## Data Models

### Enhanced OAuth Account Schema

```sql
-- Add missing indexes and constraints
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_oauth_accounts_user_provider 
ON oauth_accounts(user_id, provider);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_oauth_accounts_expires_at 
ON oauth_accounts(expires_at) WHERE expires_at > NOW();

-- Add proper foreign key constraint
ALTER TABLE oauth_accounts 
ADD CONSTRAINT fk_oauth_accounts_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add check constraint for provider values
ALTER TABLE oauth_accounts 
ADD CONSTRAINT chk_oauth_accounts_provider 
CHECK (provider IN ('tiktok', 'instagram', 'reddit', 'twitter', 'onlyfans'));
```

### OAuth State Management

```sql
-- Table for managing OAuth state (CSRF protection)
CREATE TABLE IF NOT EXISTS oauth_states (
  id SERIAL PRIMARY KEY,
  state VARCHAR(64) UNIQUE NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_oauth_states_state ON oauth_states(state);
CREATE INDEX idx_oauth_states_expires ON oauth_states(expires_at);

-- Cleanup expired states
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
  DELETE FROM oauth_states WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

## Error Handling Strategy

### Error Categories

1. **Configuration Errors** (500)
   - Missing credentials
   - Invalid configuration
   - Service unavailable

2. **User Errors** (400)
   - Access denied
   - Invalid request
   - Missing parameters

3. **Security Errors** (403)
   - Invalid state
   - CSRF attack detected
   - Unauthorized access

4. **Platform Errors** (502)
   - OAuth provider error
   - API rate limit
   - Service temporarily unavailable

### Error Response Format

```typescript
interface StandardErrorResponse {
  error: {
    code: string;
    message: string;
    userMessage: string;
    suggestion?: string;
    retryable: boolean;
    timestamp: string;
    requestId: string;
  };
}
```

## Security Enhancements

### 1. CSRF Protection

```typescript
// Generate cryptographically secure state
const state = crypto.randomBytes(32).toString('hex');

// Store with expiry
const stateData = {
  state,
  userId: user.id,
  provider: 'platform',
  expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
};

// Validate on callback
if (!storedState || storedState !== receivedState) {
  throw new OAuthError('invalid_state', 'CSRF validation failed');
}
```

### 2. Secure Cookie Configuration

```typescript
const SECURE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 600, // 10 minutes
  path: '/',
};
```

### 3. Rate Limiting

```typescript
// Implement rate limiting on OAuth endpoints
const OAUTH_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: 'Too many OAuth attempts, please try again later',
};
```

## Token Management Improvements

### 1. Automatic Refresh Scheduler

```typescript
interface TokenRefreshScheduler {
  /**
   * Schedule token refresh for accounts expiring soon
   */
  scheduleRefresh(): Promise<void>;
  
  /**
   * Refresh tokens for a specific account
   */
  refreshAccount(accountId: number): Promise<boolean>;
  
  /**
   * Clean up expired tokens
   */
  cleanupExpiredTokens(): Promise<number>;
}
```

### 2. Token Validation

```typescript
interface TokenValidator {
  /**
   * Validate token is not expired
   */
  isTokenValid(expiresAt: Date, bufferMinutes?: number): boolean;
  
  /**
   * Check if token needs refresh
   */
  needsRefresh(expiresAt: Date, bufferMinutes?: number): boolean;
  
  /**
   * Validate token format and structure
   */
  validateTokenFormat(token: string, provider: string): boolean;
}
```

## Testing Strategy

### 1. Unit Tests

- OAuth service methods
- Token management functions
- Error handling utilities
- Validation functions

### 2. Integration Tests

- Complete OAuth flows
- Token refresh scenarios
- Error handling paths
- Database operations

### 3. Security Tests

- CSRF protection
- State validation
- Token encryption
- Rate limiting

### 4. End-to-End Tests

- User authentication flow
- Platform connection flow
- Disconnect functionality
- Error recovery

## Monitoring and Observability

### 1. Metrics

```typescript
interface OAuthMetrics {
  // Success rates by platform
  oauth_success_rate: Gauge;
  oauth_failure_rate: Gauge;
  
  // Token operations
  token_refresh_success: Counter;
  token_refresh_failure: Counter;
  
  // Error tracking
  oauth_errors_by_type: Counter;
  oauth_errors_by_platform: Counter;
}
```

### 2. Logging

```typescript
interface OAuthLogger {
  logOAuthAttempt(userId: number, provider: string, success: boolean): void;
  logTokenRefresh(accountId: number, success: boolean): void;
  logError(error: Error, context: Record<string, any>): void;
  logSecurityEvent(event: string, context: Record<string, any>): void;
}
```

### 3. Health Checks

```typescript
interface OAuthHealthCheck {
  /**
   * Check OAuth service health
   */
  checkOAuthServices(): Promise<HealthStatus>;
  
  /**
   * Validate credentials configuration
   */
  validateCredentials(): Promise<ValidationStatus>;
  
  /**
   * Check database connectivity
   */
  checkDatabase(): Promise<DatabaseStatus>;
}
```

## Migration Strategy

### Phase 1: Core Fixes
1. Fix TikTok OAuth flow
2. Implement user authentication
3. Standardize error handling

### Phase 2: Enhancements
1. Add disconnect functionality
2. Implement token refresh scheduler
3. Add comprehensive testing

### Phase 3: Security & Monitoring
1. Enhance security measures
2. Add monitoring and alerting
3. Performance optimization

## Deployment Considerations

1. **Database Migrations**: Run schema updates during maintenance window
2. **Environment Variables**: Update all environments with new configuration
3. **Backward Compatibility**: Ensure existing tokens continue to work
4. **Rollback Plan**: Ability to revert changes if issues occur
5. **Testing**: Comprehensive testing in staging before production deployment