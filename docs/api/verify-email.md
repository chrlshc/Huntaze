# Email Verification API

**Endpoint**: `/api/auth/verify-email`  
**Methods**: `GET`, `POST`  
**Authentication**: None (public endpoint)  
**Rate Limiting**: 10 requests per minute per IP

---

## Overview

Verifies user email address using a verification token sent via email. Supports both redirect-based (GET) and programmatic (POST) verification flows.

---

## GET /api/auth/verify-email

Verifies email and redirects to auth page with status.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | string | Yes | 64-character hex verification token |

### Response

**Success**: Redirects to `/auth?verified=true`  
**Already Verified**: Redirects to `/auth?verified=already`  
**Error**: Redirects to `/auth?verified=false&error={error_code}`

### Error Codes

| Code | Description |
|------|-------------|
| `missing_token` | Token parameter not provided |
| `invalid_token` | Token format is invalid |
| `expired_token` | Token is expired or doesn't exist |
| `server_error` | Internal server error |

### Example

```bash
# Verify email
curl "https://api.huntaze.com/api/auth/verify-email?token=abc123..."

# Response: 307 Redirect
# Location: /auth?verified=true
```

---

## POST /api/auth/verify-email

Verifies email and returns JSON response.

### Request Body

```typescript
{
  token: string; // 64-character hex verification token
}
```

### Response

#### Success (200 OK)

```typescript
{
  success: true;
  message: string;
  userId: number;
  email: string;
  correlationId: string;
}
```

#### Already Verified (200 OK)

```typescript
{
  success: true;
  message: "Email already verified";
  userId: number;
  email: string;
  correlationId: string;
}
```

#### Error (400/500)

```typescript
{
  error: {
    code: VerificationErrorCode;
    message: string;
    correlationId: string;
    userMessage: string;
  }
}
```

### Error Codes

| Code | Status | Description | User Message |
|------|--------|-------------|--------------|
| `MISSING_TOKEN` | 400 | Token not provided | Please provide a verification token |
| `INVALID_TOKEN` | 400 | Invalid token format | The verification link is invalid |
| `EXPIRED_TOKEN` | 400 | Token expired or doesn't exist | This verification link has expired. Please request a new one. |
| `ALREADY_VERIFIED` | 200 | Email already verified | Email already verified |
| `VERIFICATION_ERROR` | 500 | Internal server error | Something went wrong. Please try again or contact support. |

### Examples

#### Successful Verification

```bash
curl -X POST https://api.huntaze.com/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token":"abc123..."}'
```

**Response**:
```json
{
  "success": true,
  "message": "Email verified successfully",
  "userId": 123,
  "email": "user@example.com",
  "correlationId": "verify-1234567890-abc123"
}
```

#### Invalid Token

```bash
curl -X POST https://api.huntaze.com/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token":"invalid"}'
```

**Response**:
```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid token format",
    "correlationId": "verify-1234567890-abc123",
    "userMessage": "The verification link is invalid"
  }
}
```

#### Expired Token

```bash
curl -X POST https://api.huntaze.com/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token":"abc123..."}'
```

**Response**:
```json
{
  "error": {
    "code": "EXPIRED_TOKEN",
    "message": "Invalid or expired verification token",
    "correlationId": "verify-1234567890-abc123",
    "userMessage": "This verification link has expired. Please request a new one."
  }
}
```

---

## Features

### Security

- ✅ Token format validation (64 hex characters)
- ✅ Token expiration check (24 hours)
- ✅ Atomic database operations (BEGIN/COMMIT/ROLLBACK)
- ✅ No user info exposure on invalid tokens
- ✅ Idempotent operations (safe to retry)
- ✅ Rate limiting protection

### Performance

- ✅ Non-blocking welcome email (fire-and-forget)
- ✅ Single database query for verification
- ✅ Atomic token deletion
- ✅ < 500ms response time (p95)

### Observability

- ✅ Correlation IDs for request tracing
- ✅ Structured logging (info, warn, error)
- ✅ Performance metrics (duration tracking)
- ✅ Error stack traces in logs

---

## Implementation Details

### Token Lifecycle

1. **Creation**: Token generated during registration
   - 64-character hex string (32 random bytes)
   - Stored in `email_verification_tokens` table
   - Expires after 24 hours

2. **Verification**: Token validated and consumed
   - Format validation (64 hex chars)
   - Expiration check
   - User lookup
   - Atomic update (verify + delete token)

3. **Deletion**: Token removed after verification
   - Prevents reuse
   - Cleanup on expiration

### Database Operations

```sql
-- Verify token
SELECT user_id, email, expires_at 
FROM email_verification_tokens 
WHERE token = $1;

-- Atomic verification
BEGIN;
UPDATE users SET email_verified = true WHERE id = $1;
DELETE FROM email_verification_tokens WHERE user_id = $1;
COMMIT;
```

### Welcome Email

- Sent asynchronously (non-blocking)
- Failure doesn't affect verification
- Logged for monitoring
- Uses AWS SES

---

## Error Handling

### Client Errors (4xx)

- **400 Bad Request**: Invalid or missing token
- **429 Too Many Requests**: Rate limit exceeded

### Server Errors (5xx)

- **500 Internal Server Error**: Database or system error

All errors include:
- Error code for programmatic handling
- Technical message for logs
- User-friendly message for display
- Correlation ID for tracing

---

## Rate Limiting

- **Limit**: 10 requests per minute per IP
- **Window**: Sliding window
- **Response**: 429 Too Many Requests
- **Headers**: 
  - `X-RateLimit-Limit`: 10
  - `X-RateLimit-Remaining`: N
  - `X-RateLimit-Reset`: timestamp

---

## Monitoring

### Metrics

- Request count
- Success rate
- Error rate by type
- Response time (p50, p95, p99)
- Token expiration rate

### Logs

```json
{
  "level": "info",
  "message": "Email verified successfully",
  "userId": 123,
  "email": "user@example.com",
  "duration": 245,
  "correlationId": "verify-1234567890-abc123",
  "timestamp": "2025-11-14T10:30:45.123Z"
}
```

### Alerts

- Error rate > 5%
- Response time > 1s (p95)
- Welcome email failure rate > 10%

---

## Testing

### Unit Tests

```typescript
import { verifyEmailToken } from '@/lib/auth/tokens';

describe('verifyEmailToken', () => {
  it('should verify valid token', async () => {
    const result = await verifyEmailToken(validToken);
    expect(result).toBeDefined();
    expect(result.userId).toBe(123);
  });

  it('should reject expired token', async () => {
    const result = await verifyEmailToken(expiredToken);
    expect(result).toBeNull();
  });
});
```

### Integration Tests

```typescript
describe('POST /api/auth/verify-email', () => {
  it('should verify email with valid token', async () => {
    const response = await fetch('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token: validToken }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
```

### E2E Tests

```typescript
test('email verification flow', async ({ page }) => {
  // Register user
  await page.goto('/auth/register');
  await page.fill('[name="email"]', 'test@example.com');
  await page.click('button[type="submit"]');

  // Get verification email
  const email = await getLastEmail('test@example.com');
  const token = extractToken(email.body);

  // Verify email
  await page.goto(`/api/auth/verify-email?token=${token}`);
  await expect(page).toHaveURL('/auth?verified=true');
});
```

---

## Best Practices

### Client Implementation

```typescript
// React hook for email verification
export function useEmailVerification() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const verify = async (token: string) => {
    setStatus('loading');
    setError(null);

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        return data;
      } else {
        setStatus('error');
        setError(data.error.userMessage);
        throw new Error(data.error.message);
      }
    } catch (err) {
      setStatus('error');
      setError('Failed to verify email');
      throw err;
    }
  };

  return { verify, status, error };
}
```

### Error Display

```typescript
// Show user-friendly error messages
function VerificationError({ error }: { error: VerificationErrorResponse }) {
  const messages = {
    MISSING_TOKEN: 'Verification link is incomplete',
    INVALID_TOKEN: 'Verification link is invalid',
    EXPIRED_TOKEN: 'Verification link has expired',
    VERIFICATION_ERROR: 'Something went wrong',
  };

  return (
    <div className="error">
      <p>{messages[error.error.code] || error.error.userMessage}</p>
      <button onClick={resendVerification}>Resend verification email</button>
    </div>
  );
}
```

---

## Troubleshooting

### Token Not Found

**Symptom**: `EXPIRED_TOKEN` error for valid token

**Causes**:
- Token expired (> 24 hours old)
- Token already used
- Database cleanup removed token

**Solution**: Request new verification email

### Email Not Verified

**Symptom**: User verified but `email_verified` still false

**Causes**:
- Database transaction failed
- Race condition (multiple verifications)

**Solution**: Check logs for correlation ID, retry verification

### Welcome Email Not Sent

**Symptom**: Email verified but no welcome email

**Causes**:
- SES service down
- Invalid email address
- Email bounced

**Solution**: Check CloudWatch logs, resend manually if needed

---

## Related Endpoints

- `POST /api/auth/register` - Create account and send verification email
- `POST /api/auth/resend-verification` - Resend verification email
- `GET /api/auth/me` - Get current user (includes `email_verified` status)

---

**Version**: 1.0.0  
**Last Updated**: 2025-11-14  
**Maintainer**: Huntaze Platform Team
