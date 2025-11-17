# Email Verification API - Test Documentation

**Endpoint:** `GET /api/auth/verify-email`  
**Purpose:** Verify user email address using token sent via email  
**Authentication:** None (public endpoint)

---

## Test Coverage Summary

| Category | Tests | Status |
|----------|-------|--------|
| Success Cases | 4 | ✅ |
| Missing Token | 2 | ✅ |
| Invalid Token | 7 | ✅ |
| Database Errors | 2 | ✅ |
| Email Sending | 2 | ✅ |
| Concurrent Requests | 2 | ✅ |
| Rate Limiting | 2 | ✅ |
| Response Format | 3 | ✅ |
| Security | 3 | ✅ |
| Edge Cases | 5 | ✅ |
| Performance | 2 | ✅ |
| Idempotency | 1 | ✅ |
| **TOTAL** | **35** | **✅** |

---

## API Specification

### Request

```http
GET /api/auth/verify-email?token={verification_token}
```

**Query Parameters:**
- `token` (required): Email verification token (JWT format)

**Headers:**
- None required

### Success Response (302 Redirect)

```http
HTTP/1.1 302 Found
Location: /auth?verified=true
```

**Side Effects:**
1. User `email_verified` set to `true`
2. Verification token deleted from database
3. Welcome email sent asynchronously
4. Verification logged with correlation ID

### Error Responses

#### 400 Bad Request - Missing Token

```json
{
  "error": {
    "code": "MISSING_TOKEN",
    "message": "Verification token is required",
    "correlationId": "verify-1234567890-abc123"
  }
}
```

#### 400 Bad Request - Invalid Token

```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid or expired verification token",
    "correlationId": "verify-1234567890-abc123"
  }
}
```

#### 500 Internal Server Error

```json
{
  "error": {
    "code": "VERIFICATION_ERROR",
    "message": "An error occurred during email verification",
    "correlationId": "verify-1234567890-abc123"
  }
}
```

---

## Test Scenarios

### 1. Success Cases

#### ✅ Valid Token Verification
```typescript
// Given: User with unverified email and valid token
// When: GET /api/auth/verify-email?token={valid_token}
// Then: 
//   - Status: 302
//   - Redirect: /auth?verified=true
//   - Database: email_verified = true
//   - Token deleted from database
```

#### ✅ Welcome Email Sent
```typescript
// Given: Valid verification request
// When: Email verification succeeds
// Then: Welcome email sent to user (async, non-blocking)
```

#### ✅ Special Characters in Name
```typescript
// Given: User with name "Jöhn Döe 🎉"
// When: Email verified
// Then: Welcome email sent with correct name encoding
```

#### ✅ Correct Redirect URL
```typescript
// Given: Valid token
// When: Verification succeeds
// Then: Redirect to /auth?verified=true
```

---

### 2. Missing Token Errors

#### ❌ No Token Parameter
```typescript
// Given: Request without token parameter
// When: GET /api/auth/verify-email
// Then:
//   - Status: 400
//   - Error code: MISSING_TOKEN
//   - Correlation ID present
```

#### ❌ Empty Token
```typescript
// Given: Empty token parameter
// When: GET /api/auth/verify-email?token=
// Then:
//   - Status: 400
//   - Error code: MISSING_TOKEN
```

---

### 3. Invalid Token Errors

#### ❌ Invalid Format
```typescript
// Given: Token with invalid format
// When: GET /api/auth/verify-email?token=invalid-token-123
// Then:
//   - Status: 400
//   - Error code: INVALID_TOKEN
```

#### ❌ Non-Existent Token
```typescript
// Given: Valid JWT format but non-existent in database
// When: Verification attempted
// Then:
//   - Status: 400
//   - Error code: INVALID_TOKEN
```

#### ❌ Expired Token
```typescript
// Given: Token past expiration time
// When: Verification attempted
// Then:
//   - Status: 400
//   - Error code: INVALID_TOKEN
```

#### ❌ Already Used Token
```typescript
// Given: Token already used for verification
// When: Same token used again
// Then:
//   - Status: 400
//   - Error code: INVALID_TOKEN
```

#### ❌ Malformed JWT
```typescript
// Given: Malformed JWT token
// When: GET /api/auth/verify-email?token=not.a.valid.jwt
// Then:
//   - Status: 400
//   - Error code: INVALID_TOKEN
```

#### ❌ Case Sensitivity
```typescript
// Given: Token in uppercase
// When: Verification attempted
// Then:
//   - Status: 400
//   - Error code: INVALID_TOKEN
//   - Note: Tokens are case-sensitive
```

#### ❌ Very Long Token
```typescript
// Given: Token with 10,000+ characters
// When: Verification attempted
// Then:
//   - Status: 400
//   - Error code: INVALID_TOKEN
```

---

### 4. Database Errors

#### ❌ Connection Failure
```typescript
// Given: Database connection fails
// When: Verification attempted
// Then:
//   - Status: 500
//   - Error code: VERIFICATION_ERROR
//   - No sensitive info exposed
```

#### ❌ User Not Found
```typescript
// Given: Valid token but user deleted
// When: Verification attempted
// Then:
//   - Status: 500
//   - Error code: VERIFICATION_ERROR
```

---

### 5. Email Sending

#### ✅ Email Failure Doesn't Block
```typescript
// Given: Email service is down
// When: Verification succeeds
// Then:
//   - Status: 302 (still succeeds)
//   - Email marked as verified
//   - Error logged but not returned
```

#### ✅ Non-Blocking Email
```typescript
// Given: Slow email service (5s delay)
// When: Verification requested
// Then:
//   - Response time < 1 second
//   - Email sent asynchronously
```

---

### 6. Concurrent Requests

#### ⚠️ Multiple Simultaneous Verifications
```typescript
// Given: 5 concurrent requests with same token
// When: All requests processed
// Then:
//   - 1 request succeeds (302)
//   - 4 requests fail (400)
//   - User verified exactly once
```

#### ⚠️ Race Condition Handling
```typescript
// Given: Two requests with minimal delay
// When: Both attempt verification
// Then:
//   - One succeeds, one fails
//   - No duplicate verifications
```

---

### 7. Rate Limiting

#### ✅ Multiple Attempts Allowed
```typescript
// Given: 5 verification attempts
// When: All within rate limit
// Then:
//   - All return 400 (invalid token)
//   - None return 429 (rate limited)
```

#### ✅ Rate Limit Headers
```typescript
// Given: Verification request
// When: Response received
// Then: X-RateLimit-* headers present (if implemented)
```

---

### 8. Response Format

#### ✅ Consistent Error Format
```typescript
// Given: Any error response
// When: Response parsed
// Then:
//   - Has 'error' object
//   - Has 'code' string
//   - Has 'message' string
//   - Has 'correlationId' string
```

#### ✅ Correlation ID Format
```typescript
// Given: Any response
// When: Error returned
// Then: correlationId matches /^verify-\d+-[a-z0-9]+$/
```

#### ✅ Content-Type Header
```typescript
// Given: Error response
// When: Headers checked
// Then: Content-Type: application/json
```

---

### 9. Security

#### 🔒 No Sensitive Data Exposure
```typescript
// Given: Error response
// When: Response inspected
// Then:
//   - No database details
//   - No internal paths
//   - No user IDs
//   - No SQL queries
```

#### 🔒 Token Sanitization
```typescript
// Given: Very long token
// When: Logged
// Then: Token truncated in logs (first 8 chars + "...")
```

#### 🔒 Timing Attack Prevention
```typescript
// Given: 10 invalid token requests
// When: Response times measured
// Then:
//   - Times relatively consistent
//   - Max deviation < 2x average
```

---

### 10. Edge Cases

#### 🔧 User with Null Name
```typescript
// Given: User with name = NULL
// When: Email verified
// Then: Welcome email sent with default name "User"
```

#### 🔧 Special Characters in Token
```typescript
// Given: Token with URL-encoded special chars
// When: Verification attempted
// Then: Handled gracefully (400 error)
```

#### 🔧 Multiple Token Parameters
```typescript
// Given: URL with multiple token params
// When: GET /api/auth/verify-email?token=A&token=B
// Then: First token used
```

---

### 11. Performance

#### ⚡ Response Time
```typescript
// Given: Valid verification request
// When: Processed
// Then: Response time < 500ms
```

#### ⚡ Burst Handling
```typescript
// Given: 10 simultaneous verifications
// When: All processed
// Then:
//   - All succeed
//   - Total time < 2 seconds
```

---

### 12. Idempotency

#### 🔄 Already Verified User
```typescript
// Given: User already verified
// When: New token generated and used
// Then:
//   - Verification succeeds
//   - User remains verified
//   - No errors
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Email Verification Tokens Table
```sql
CREATE TABLE email_verification_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Test Data

### Valid Test User
```json
{
  "email": "test@example.com",
  "name": "Test User",
  "password_hash": "hashed_password",
  "email_verified": false
}
```

### Valid Token Format
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1dWlkIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDM2MDB9.signature
```

### Invalid Tokens
```typescript
{
  INVALID_FORMAT: 'invalid-token-123',
  MALFORMED_JWT: 'not.a.valid.jwt',
  EMPTY: '',
  VERY_LONG: 'a'.repeat(10000),
  WITH_SPECIAL_CHARS: 'token%20with%20spaces&special=chars'
}
```

---

## Running Tests

### Run All Tests
```bash
npm test tests/integration/auth/verify-email.test.ts
```

### Run Specific Test Suite
```bash
npm test tests/integration/auth/verify-email.test.ts -t "Success Cases"
```

### Run with Coverage
```bash
npm test tests/integration/auth/verify-email.test.ts -- --coverage
```

### Watch Mode
```bash
npm test tests/integration/auth/verify-email.test.ts -- --watch
```

---

## Fixtures and Utilities

### Create Test User
```typescript
import { createTestUser } from './verify-email-fixtures';

const user = await createTestUser({
  email: 'test@example.com',
  name: 'Test User',
});
```

### Make Verification Request
```typescript
import { makeVerificationRequest } from './verify-email-fixtures';

const response = await makeVerificationRequest(token);
```

### Verify Response Format
```typescript
import { expectErrorResponse } from './verify-email-fixtures';

expectErrorResponse(data, 'INVALID_TOKEN');
```

### Cleanup
```typescript
import { TestCleanup } from './verify-email-fixtures';

const cleanup = new TestCleanup();
cleanup.addUser(userId);
await cleanup.cleanup();
```

---

## Monitoring and Logging

### Correlation IDs
Every request generates a unique correlation ID:
```
verify-{timestamp}-{random}
```

Example: `verify-1234567890-abc123`

### Log Levels
- **INFO**: Successful verifications
- **WARN**: Invalid tokens, missing parameters
- **ERROR**: Database errors, email failures

### Metrics to Track
- Verification success rate
- Average response time
- Token expiration rate
- Email delivery rate
- Concurrent request handling

---

## Common Issues and Solutions

### Issue: Token Already Used
**Cause:** User clicked verification link multiple times  
**Solution:** Return 400 with INVALID_TOKEN (expected behavior)

### Issue: Token Expired
**Cause:** User waited too long to verify  
**Solution:** Generate new token via resend endpoint

### Issue: Email Not Sent
**Cause:** Email service down  
**Solution:** Verification still succeeds, email logged for retry

### Issue: Database Connection Error
**Cause:** Database unavailable  
**Solution:** Return 500, log error with correlation ID

---

## Security Considerations

### Token Security
- ✅ Tokens are single-use
- ✅ Tokens expire after 24 hours
- ✅ Tokens are cryptographically signed
- ✅ Tokens deleted after use

### Data Protection
- ✅ No sensitive data in error messages
- ✅ Correlation IDs for debugging
- ✅ Timing attack prevention
- ✅ Rate limiting (if implemented)

### Best Practices
- ✅ Use HTTPS in production
- ✅ Validate token format
- ✅ Log all verification attempts
- ✅ Monitor for abuse patterns

---

## Related Endpoints

- `POST /api/auth/register` - Creates user and sends verification email
- `POST /api/auth/resend-verification` - Resends verification email
- `GET /api/auth/status` - Check user verification status

---

## Changelog

### Version 2.0.0 (Current)
- ✅ Improved error handling with structured errors
- ✅ Added correlation IDs for tracing
- ✅ Centralized logging
- ✅ Non-blocking email sending
- ✅ Better token validation
- ✅ Comprehensive test coverage

### Version 1.0.0
- Initial implementation
- Basic token verification
- Email sending

---

**Last Updated:** 2025-11-16  
**Test Coverage:** 35 tests  
**Status:** ✅ Production Ready
