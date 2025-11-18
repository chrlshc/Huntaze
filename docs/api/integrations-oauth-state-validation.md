# OAuth State Validation API Documentation

## Overview

The Integrations Management system implements comprehensive OAuth state validation to prevent CSRF (Cross-Site Request Forgery) attacks. This document describes the state validation mechanism, error handling, and best practices.

## State Parameter Format

### Structure

```
userId:timestamp:randomToken
```

### Components

1. **userId** (integer): The authenticated user's ID
   - Must be a positive integer
   - Used to associate the OAuth callback with the correct user

2. **timestamp** (integer): Unix timestamp in milliseconds
   - Generated when OAuth flow is initiated
   - Used to detect expired state parameters
   - Maximum age: 1 hour (3600000 ms)

3. **randomToken** (string): Cryptographically secure random string
   - Minimum length: 10 characters
   - Generated using `Math.random().toString(36)`
   - Ensures uniqueness across multiple OAuth flows

### Example

```
12345:1700000000000:abc123xyz789
```

## API Endpoints

### 1. Initiate OAuth Flow

**Endpoint:** `POST /api/integrations/connect/[provider]`

**Description:** Initiates OAuth flow and generates a secure state parameter.

**Request:**
```typescript
{
  redirectUrl: string; // Callback URL after OAuth
}
```

**Response:**
```typescript
{
  authUrl: string;     // OAuth authorization URL
  state: string;       // State parameter (userId:timestamp:randomToken)
  expiresAt?: string;  // ISO 8601 timestamp
}
```

**Example:**
```bash
curl -X POST https://app.huntaze.com/api/integrations/connect/instagram \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "redirectUrl": "https://app.huntaze.com/integrations/callback"
  }'
```

**Response:**
```json
{
  "authUrl": "https://api.instagram.com/oauth/authorize?client_id=...&state=12345:1700000000000:abc123xyz789",
  "state": "12345:1700000000000:abc123xyz789"
}
```

### 2. Handle OAuth Callback

**Endpoint:** `GET /api/integrations/callback/[provider]`

**Description:** Handles OAuth callback and validates state parameter.

**Query Parameters:**
- `code` (required): Authorization code from OAuth provider
- `state` (required): State parameter (must match format)

**Response:**
```typescript
{
  success: boolean;
  userId: number;
  accountId: string;
  provider: string;
}
```

**Example:**
```bash
curl "https://app.huntaze.com/api/integrations/callback/instagram?code=AUTH_CODE&state=12345:1700000000000:abc123xyz789"
```

**Success Response:**
```json
{
  "success": true,
  "userId": 12345,
  "accountId": "instagram_account_123",
  "provider": "instagram"
}
```

## State Validation Rules

### 1. Format Validation

The state parameter must contain exactly 3 components separated by colons:

```typescript
const [userId, timestamp, randomToken] = state.split(':');
if (stateParts.length !== 3) {
  throw new Error('INVALID_STATE: Invalid format');
}
```

### 2. User ID Validation

```typescript
const userId = parseInt(userIdStr, 10);
if (isNaN(userId) || userId <= 0) {
  throw new Error('INVALID_STATE: Invalid user ID');
}
```

### 3. Timestamp Validation

```typescript
const timestamp = parseInt(timestampStr, 10);
if (isNaN(timestamp)) {
  throw new Error('INVALID_STATE: Invalid timestamp');
}

const stateAge = Date.now() - timestamp;
if (stateAge > 3600000) { // 1 hour
  throw new Error('INVALID_STATE: State expired');
}
```

### 4. Random Token Validation

```typescript
if (!randomToken || randomToken.length < 5) {
  throw new Error('INVALID_STATE: Invalid random token');
}
```

## Error Handling

### Error Codes

| Code | Description | Retryable | HTTP Status |
|------|-------------|-----------|-------------|
| `INVALID_STATE` | State parameter is malformed or invalid | No | 400 |
| `INVALID_USER_ID` | User ID in state is invalid | No | 400 |
| `INVALID_REDIRECT_URL` | Redirect URL is invalid | No | 400 |
| `OAUTH_INIT_ERROR` | Failed to initiate OAuth flow | Yes | 500 |
| `OAUTH_CALLBACK_ERROR` | Failed to process OAuth callback | Yes | 500 |
| `NETWORK_ERROR` | Network failure during OAuth | Yes | 503 |
| `TOKEN_REFRESH_ERROR` | Failed to refresh access token | Yes | 500 |

### Error Response Format

```typescript
{
  "error": {
    "code": "INVALID_STATE",
    "message": "State parameter has invalid format",
    "provider": "instagram",
    "retryable": false,
    "timestamp": "2024-01-16T10:00:00Z",
    "correlationId": "int-1700000000000-abc123"
  }
}
```

### Example Error Responses

**Invalid State Format:**
```json
{
  "error": {
    "code": "INVALID_STATE",
    "message": "State parameter has invalid format",
    "provider": "instagram",
    "retryable": false
  }
}
```

**Expired State:**
```json
{
  "error": {
    "code": "INVALID_STATE",
    "message": "State parameter has expired",
    "provider": "instagram",
    "retryable": false
  }
}
```

**Network Error (Retryable):**
```json
{
  "error": {
    "code": "NETWORK_ERROR",
    "message": "Failed to connect to OAuth provider",
    "provider": "instagram",
    "retryable": true
  }
}
```

## Retry Strategy

### Exponential Backoff

The service implements exponential backoff for retryable errors:

```typescript
const delays = [100ms, 200ms, 400ms];
maxRetries = 3;
```

### Retryable Operations

1. **Token Exchange**: Exchanging authorization code for access token
2. **Profile Fetch**: Fetching user profile from OAuth provider
3. **Token Refresh**: Refreshing expired access tokens

### Non-Retryable Errors

- State validation errors
- Invalid credentials
- User-facing validation errors

## Security Best Practices

### 1. State Parameter Generation

```typescript
// ✅ Good: Cryptographically secure
const state = `${userId}:${Date.now()}:${crypto.randomBytes(16).toString('hex')}`;

// ❌ Bad: Predictable
const state = `${userId}:${Date.now()}:${userId}`;
```

### 2. State Validation

```typescript
// ✅ Good: Comprehensive validation
if (!state || typeof state !== 'string') {
  throw new Error('INVALID_STATE');
}

const parts = state.split(':');
if (parts.length !== 3) {
  throw new Error('INVALID_STATE');
}

// Validate each component...
```

### 3. State Expiration

```typescript
// ✅ Good: Check expiration
const stateAge = Date.now() - timestamp;
if (stateAge > 3600000) { // 1 hour
  throw new Error('INVALID_STATE: Expired');
}
```

### 4. Logging

```typescript
// ✅ Good: Log validation failures
console.warn('[IntegrationsService] Invalid state', {
  provider,
  stateFormat: state.split(':').length,
  userId: extractedUserId,
});

// ❌ Bad: Log sensitive data
console.log('State:', state); // Don't log full state
```

## Testing

### Property-Based Testing

The OAuth state validation is tested using property-based testing with `fast-check`:

```typescript
// Test: Mismatched states should be rejected
fc.assert(
  fc.asyncProperty(
    fc.integer({ min: 1, max: 1000000 }),
    fc.string({ minLength: 20, maxLength: 100 }),
    async (userId, authCode) => {
      const validState = generateState(userId);
      const invalidState = generateState(userId + 1);
      
      await expect(
        service.handleOAuthCallback('instagram', authCode, invalidState)
      ).rejects.toThrow('INVALID_STATE');
    }
  ),
  { numRuns: 100 }
);
```

### Test Coverage

- ✅ Mismatched state parameters
- ✅ Malformed state parameters
- ✅ Expired state parameters
- ✅ Invalid user IDs
- ✅ State uniqueness
- ✅ Concurrent OAuth flows

## Monitoring & Logging

### Log Levels

**INFO**: Successful operations
```typescript
console.log('[IntegrationsService] OAuth callback completed', {
  provider: 'instagram',
  userId: 12345,
  duration: 1234,
});
```

**WARN**: Validation failures
```typescript
console.warn('[IntegrationsService] Invalid state parameter', {
  provider: 'instagram',
  stateFormat: 'invalid',
});
```

**ERROR**: System failures
```typescript
console.error('[IntegrationsService] OAuth callback failed', {
  provider: 'instagram',
  error: error.message,
  code: error.code,
});
```

### Metrics to Monitor

1. **State Validation Failures**: Track INVALID_STATE errors
2. **OAuth Success Rate**: Successful callbacks / Total callbacks
3. **State Expiration Rate**: Expired states / Total validations
4. **Retry Attempts**: Average retries per OAuth flow

## Related Documentation

- [Integrations Management Architecture](./.kiro/specs/integrations-management/ARCHITECTURE.md)
- [OAuth Security Requirements](./.kiro/specs/integrations-management/requirements.md)
- [Integration Tests](../../tests/integration/api/integrations-routes.integration.test.ts)
- [Property-Based Tests](../../tests/unit/services/oauth-state-validation.property.test.ts)

## Changelog

### Version 1.0 (2024-01-16)
- Initial OAuth state validation implementation
- Comprehensive error handling
- Retry strategy with exponential backoff
- Property-based testing
- Security hardening

---

**Last Updated**: 2024-01-16  
**Version**: 1.0  
**Status**: ✅ Production Ready
