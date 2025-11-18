# Integrations Security Implementation

This document describes the comprehensive security measures implemented for the integrations management system.

## Overview

The integrations system implements multiple layers of security to protect user credentials, prevent attacks, and maintain audit trails for compliance.

## Security Features

### 1. CSRF Protection (Requirement 11.3)

**Implementation**: `lib/services/integrations/csrf-protection.ts`

The system uses cryptographically secure state parameters to prevent Cross-Site Request Forgery (CSRF) attacks during OAuth flows.

#### State Parameter Format

```
userId:timestamp:randomToken:signature
```

- **userId**: User ID for attribution (integer)
- **timestamp**: Unix timestamp in milliseconds
- **randomToken**: 64-character hex string (32 bytes of entropy)
- **signature**: HMAC-SHA256 signature of the state components

#### Validation Checks

1. **Format validation**: Ensures state has exactly 4 components
2. **User ID validation**: Verifies user ID is a positive integer
3. **Timestamp validation**: Checks timestamp is valid and not expired (1 hour max)
4. **Clock skew protection**: Rejects states from the future (allows 1 minute skew)
5. **Token length validation**: Ensures random token meets minimum length (32 characters)
6. **Signature validation**: Verifies HMAC signature to detect tampering

#### Usage Example

```typescript
import { csrfProtection } from '@/lib/services/integrations/csrf-protection';

// Generate state
const state = csrfProtection.generateState(userId, 'instagram');

// Validate state
const result = csrfProtection.validateState(state, 'instagram');
if (!result.valid) {
  throw new Error(result.error);
}
```

### 2. Rate Limiting (Requirement 11.2)

**Implementation**: `lib/api/middleware/rate-limit.ts`

Rate limiting is applied to all OAuth endpoints to prevent abuse and brute force attacks.

#### Rate Limits

| Endpoint | Limit | Window | Reason |
|----------|-------|--------|--------|
| `/api/integrations/connect/:provider` | 10 req/min | Per user | Prevent OAuth spam |
| `/api/integrations/callback/:provider` | No limit | N/A | Callback from provider |
| `/api/integrations/disconnect/:provider/:accountId` | 20 req/min | Per user | Prevent disconnect spam |
| `/api/integrations/refresh/:provider/:accountId` | 30 req/min | Per user | Allow token refresh |
| `/api/integrations/status` | 100 req/min | Per user | Standard rate limit |

#### Implementation

```typescript
import { withRateLimit } from '@/lib/api/middleware/rate-limit';

export const POST = withRateLimit(
  handler,
  { limit: 10, windowMs: 60000 } // 10 requests per minute
);
```

#### Features

- **Sliding window algorithm**: More accurate than fixed windows
- **Per-user tracking**: Uses user ID for authenticated requests
- **Per-IP tracking**: Uses IP address for unauthenticated requests
- **Fail-open strategy**: Allows requests if Redis is unavailable
- **Standard headers**: Returns `X-RateLimit-*` and `Retry-After` headers

### 3. Request Validation and Sanitization (Requirement 11.4)

**Implementation**: `lib/api/middleware/validation.ts`

All user inputs are validated and sanitized to prevent injection attacks and ensure data integrity.

#### Sanitization

- **XSS prevention**: Removes `<`, `>`, and event handlers
- **Protocol filtering**: Removes `javascript:` protocol
- **Deep sanitization**: Recursively sanitizes nested objects and arrays
- **Type coercion**: Converts strings to appropriate types

#### Validation

Built-in validators for common types:
- `validators.string()`: String validation with length and pattern checks
- `validators.number()`: Number validation with min/max checks
- `validators.boolean()`: Boolean validation
- `validators.enum()`: Enum validation
- `validators.array()`: Array validation with item validators
- `validators.email()`: Email format validation
- `validators.url()`: URL format validation
- `validators.date()`: Date validation
- `validators.object()`: Nested object validation

#### Usage Example

```typescript
import { withValidation, validators } from '@/lib/api/middleware/validation';

const schema = {
  redirectUrl: validators.url({ required: true }),
  provider: validators.enum(['instagram', 'tiktok', 'reddit', 'onlyfans'], { required: true }),
};

export const POST = withValidation(schema, async (req, body) => {
  // body is validated and sanitized
  return Response.json({ data: body });
});
```

### 4. Audit Logging (Requirement 11.5)

**Implementation**: `lib/services/integrations/audit-logger.ts`

Comprehensive audit logging tracks all integration operations for security monitoring and compliance.

#### Logged Events

**OAuth Operations**:
- `oauth_initiated`: OAuth flow started
- `oauth_completed`: OAuth flow completed successfully
- `oauth_failed`: OAuth flow failed
- `oauth_cancelled`: User cancelled OAuth

**Token Operations**:
- `token_refreshed`: Token refreshed successfully
- `token_refresh_failed`: Token refresh failed
- `token_expired`: Token expired

**Connection Operations**:
- `integration_connected`: Integration connected
- `integration_disconnected`: Integration disconnected
- `integration_reconnected`: Integration reconnected

**Security Events**:
- `csrf_validation_failed`: CSRF validation failed
- `invalid_state_detected`: Invalid state parameter detected
- `rate_limit_exceeded`: Rate limit exceeded
- `unauthorized_access`: Unauthorized access attempt

**Error Events**:
- `api_error`: API error occurred
- `database_error`: Database error occurred
- `network_error`: Network error occurred

#### Audit Log Entry

```typescript
interface AuditLogEntry {
  eventType: AuditEventType;
  userId: number;
  provider?: Provider;
  accountId?: string;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}
```

#### PII Protection

The audit logger automatically sanitizes sensitive information:
- Access tokens → `[REDACTED]`
- Refresh tokens → `[REDACTED]`
- Passwords → `[REDACTED]`
- API keys → `[REDACTED]`
- Session tokens → `[REDACTED]`

#### Usage Example

```typescript
import { auditLogger } from '@/lib/services/integrations/audit-logger';

// Log OAuth initiation
await auditLogger.logOAuthInitiated(
  userId,
  'instagram',
  ipAddress,
  userAgent,
  correlationId
);

// Log OAuth completion
await auditLogger.logOAuthCompleted(
  userId,
  'instagram',
  accountId,
  ipAddress,
  userAgent,
  correlationId
);
```

### 5. Token Encryption (Requirement 11.1)

**Implementation**: `lib/services/integrations/encryption.ts`

All OAuth tokens are encrypted at rest using AES-256-GCM encryption.

#### Features

- **AES-256-GCM**: Industry-standard authenticated encryption
- **Unique IVs**: Each token encrypted with unique initialization vector
- **Key derivation**: Uses PBKDF2 for key derivation from secret
- **Authenticated encryption**: Detects tampering with authentication tags

#### Environment Variables

```bash
# Required for token encryption
TOKEN_ENCRYPTION_KEY=your-secret-key-here

# Or fallback to NextAuth secret
NEXTAUTH_SECRET=your-nextauth-secret
```

### 6. HTTPS Enforcement (Requirement 11.2)

All OAuth flows require HTTPS to prevent man-in-the-middle attacks.

#### Implementation

- **Redirect URI validation**: Ensures redirect URIs use HTTPS
- **Secure cookies**: Session cookies use `Secure` flag
- **HSTS headers**: HTTP Strict Transport Security enabled

### 7. Credential Deletion (Requirement 11.5)

When a user disconnects an integration, all credentials are permanently deleted.

#### Implementation

```typescript
// Delete from database (cascade deletes all related data)
await prisma.oAuthAccount.delete({
  where: { id: account.id },
});
```

#### What Gets Deleted

- Access token (encrypted)
- Refresh token (encrypted)
- Token metadata
- Platform-specific metadata
- All database records

## Security Best Practices

### For Developers

1. **Never log tokens**: Use audit logger which automatically redacts sensitive data
2. **Validate all inputs**: Use validation middleware for all API endpoints
3. **Use rate limiting**: Apply appropriate rate limits to all endpoints
4. **Check authorization**: Verify user owns the integration before operations
5. **Use CSRF protection**: Always validate state parameters in OAuth callbacks

### For Deployment

1. **Set strong secrets**: Use cryptographically secure random strings
2. **Enable HTTPS**: Never run OAuth flows over HTTP
3. **Configure Redis**: Use Redis for distributed rate limiting
4. **Monitor audit logs**: Set up alerts for security events
5. **Rotate secrets**: Regularly rotate encryption keys and secrets

### Environment Variables

```bash
# Required
NEXTAUTH_SECRET=<strong-random-secret>
TOKEN_ENCRYPTION_KEY=<strong-random-secret>
OAUTH_STATE_SECRET=<strong-random-secret>

# Optional
AUDIT_LOG_ENDPOINT=<external-logging-service>
AUDIT_LOG_API_KEY=<api-key>
REDIS_URL=<redis-connection-string>
```

## Security Testing

### Manual Testing

1. **CSRF Protection**:
   - Try to replay old state parameters
   - Try to modify state parameters
   - Try to use expired state parameters

2. **Rate Limiting**:
   - Make rapid requests to OAuth endpoints
   - Verify rate limit headers are returned
   - Verify 429 responses after limit exceeded

3. **Input Validation**:
   - Send malformed JSON
   - Send XSS payloads in strings
   - Send invalid provider names

4. **Authorization**:
   - Try to disconnect another user's integration
   - Try to refresh another user's token

### Automated Testing

See `tests/integration/api/integrations-security.integration.test.ts` for comprehensive security tests.

## Compliance

### GDPR

- **Right to erasure**: Disconnect endpoint deletes all user data
- **Data minimization**: Only stores necessary OAuth credentials
- **Audit trail**: Complete audit log for compliance reporting

### SOC 2

- **Access controls**: Authentication required for all operations
- **Audit logging**: Comprehensive audit trail with correlation IDs
- **Encryption**: All tokens encrypted at rest
- **Monitoring**: Security events logged for monitoring

## Incident Response

### CSRF Attack Detected

1. Check audit logs for `csrf_validation_failed` events
2. Identify affected users and IP addresses
3. Review state parameter patterns
4. Consider rotating `OAUTH_STATE_SECRET`

### Rate Limit Abuse

1. Check audit logs for `rate_limit_exceeded` events
2. Identify abusive IP addresses or user accounts
3. Consider blocking IP addresses at firewall level
4. Review rate limit thresholds

### Token Compromise

1. Immediately disconnect affected integrations
2. Rotate `TOKEN_ENCRYPTION_KEY`
3. Force users to reconnect integrations
4. Review audit logs for unauthorized access

## References

- [OWASP OAuth Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html)
- [RFC 6749: OAuth 2.0](https://tools.ietf.org/html/rfc6749)
- [RFC 6750: OAuth 2.0 Bearer Token Usage](https://tools.ietf.org/html/rfc6750)
- [NIST SP 800-63B: Digital Identity Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
