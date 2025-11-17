# 🎯 Onboarding API Documentation

**Version:** 1.0.0  
**Base URL:** `/api/auth`  
**Authentication:** Required (Session-based)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Endpoints](#endpoints)
3. [Data Models](#data-models)
4. [Error Handling](#error-handling)
5. [Examples](#examples)
6. [Best Practices](#best-practices)

---

## Overview

The Onboarding API manages user onboarding status, allowing you to:
- Check if a user has completed onboarding
- Mark onboarding as completed
- Reset onboarding status (admin only)
- Get onboarding statistics (admin only)

### Features
- ✅ Session-based authentication
- ✅ Retry logic with exponential backoff
- ✅ Structured error handling
- ✅ Correlation IDs for tracing
- ✅ Rate limiting protection
- ✅ Comprehensive logging

---

## Endpoints

### GET /api/auth/onboarding-status

Check if the authenticated user has completed onboarding.

**Authentication:** Required  
**Rate Limit:** 100 requests/minute

#### Request

```http
GET /api/auth/onboarding-status HTTP/1.1
Host: api.example.com
Cookie: next-auth.session-token=...
```

#### Response (200 OK)

```json
{
  "onboarding_completed": true,
  "correlationId": "auth-1736159823400-abc123"
}
```

#### Response (401 Unauthorized)

```json
{
  "error": "Unauthorized. Please log in.",
  "correlationId": "auth-1736159823400-abc123"
}
```

#### Response Headers

```http
X-Correlation-Id: auth-1736159823400-abc123
Cache-Control: private, no-cache, no-store, must-revalidate
```

---

### POST /api/auth/complete-onboarding

Mark the authenticated user's onboarding as completed.

**Authentication:** Required  
**Rate Limit:** 10 requests/minute

#### Request

```http
POST /api/auth/complete-onboarding HTTP/1.1
Host: api.example.com
Cookie: next-auth.session-token=...
Content-Type: application/json
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Onboarding completed successfully",
  "correlationId": "auth-1736159823400-abc123"
}
```

#### Response (401 Unauthorized)

```json
{
  "error": "Unauthorized. Please log in.",
  "correlationId": "auth-1736159823400-abc123"
}
```

#### Response (404 Not Found)

```json
{
  "error": "User not found",
  "type": "USER_NOT_FOUND",
  "correlationId": "auth-1736159823400-abc123",
  "retryable": false
}
```

#### Response (500 Internal Server Error)

```json
{
  "error": "Failed to complete onboarding. Please try again.",
  "correlationId": "auth-1736159823400-abc123",
  "retryable": true
}
```

#### Response Headers

```http
X-Correlation-Id: auth-1736159823400-abc123
Cache-Control: no-store, no-cache, must-revalidate
Retry-After: 5
```

---

## Data Models

### OnboardingStatus

```typescript
interface OnboardingStatus {
  onboarding_completed: boolean;
  correlationId: string;
}
```

### OnboardingCompleteResponse

```typescript
interface OnboardingCompleteResponse {
  success: boolean;
  message: string;
  correlationId: string;
}
```

### ErrorResponse

```typescript
interface ErrorResponse {
  error: string;
  type?: string;
  correlationId: string;
  retryable?: boolean;
}
```

---

## Error Handling

### Error Types

| Type | Description | Status Code | Retryable |
|------|-------------|-------------|-----------|
| `USER_NOT_FOUND` | User does not exist | 404 | No |
| `DATABASE_ERROR` | Database operation failed | 500 | Yes |
| `TIMEOUT_ERROR` | Request timed out | 504 | Yes |
| `INTERNAL_ERROR` | Unexpected error | 500 | Yes |

### Retry Strategy

For retryable errors:
1. Wait for `Retry-After` header value (seconds)
2. Use exponential backoff: 1s, 2s, 4s, 8s
3. Maximum 3 retry attempts
4. Log correlation ID for debugging

### Error Response Format

```json
{
  "error": "User-friendly error message",
  "type": "ERROR_TYPE",
  "correlationId": "auth-1736159823400-abc123",
  "retryable": true
}
```

---

## Examples

### Example 1: Check Onboarding Status

```typescript
async function checkOnboardingStatus() {
  try {
    const response = await fetch('/api/auth/onboarding-status', {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to check onboarding status');
    }
    
    const data = await response.json();
    console.log('Onboarding completed:', data.onboarding_completed);
    
    return data.onboarding_completed;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}
```

### Example 2: Complete Onboarding

```typescript
async function completeOnboarding() {
  try {
    const response = await fetch('/api/auth/complete-onboarding', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    const data = await response.json();
    console.log('Success:', data.message);
    
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}
```

### Example 3: Complete Onboarding Flow

```typescript
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { useRouter } from 'next/navigation';

function OnboardingFlow() {
  const router = useRouter();
  const { completed, loading, error, completeOnboarding } = useOnboardingStatus();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return <ErrorMessage error={error} />;
  }
  
  if (completed) {
    router.push('/dashboard');
    return null;
  }
  
  const handleComplete = async () => {
    const success = await completeOnboarding();
    if (success) {
      router.push('/dashboard');
    } else {
      alert('Failed to complete onboarding. Please try again.');
    }
  };
  
  return (
    <div>
      <h1>Welcome! Let's get you started</h1>
      <OnboardingSteps />
      <button onClick={handleComplete}>
        Complete Onboarding
      </button>
    </div>
  );
}
```

### Example 4: Retry with Exponential Backoff

```typescript
async function completeOnboardingWithRetry(maxRetries = 3) {
  let delay = 1000; // Start with 1 second
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('/api/auth/complete-onboarding', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      const error = await response.json();
      
      // Don't retry if not retryable
      if (!error.retryable) {
        throw new Error(error.error);
      }
      
      // Last attempt, throw error
      if (attempt === maxRetries) {
        throw new Error(error.error);
      }
      
      // Wait before retry
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Exponential backoff
      delay *= 2;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
}
```

---

## Best Practices

### 1. Always Check Authentication

```typescript
// ✅ Good
const session = await getServerSession();
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// ❌ Bad
// Assuming user is authenticated without checking
```

### 2. Use Correlation IDs for Debugging

```typescript
// ✅ Good
console.error('Error:', error, {
  correlationId: error.correlationId,
  userId: session.user.id,
});

// ❌ Bad
console.error('Error:', error);
```

### 3. Handle Errors Gracefully

```typescript
// ✅ Good
try {
  await completeOnboarding();
} catch (error) {
  if (error.retryable) {
    // Retry logic
  } else {
    // Show user-friendly error
    showError(error.userMessage);
  }
}

// ❌ Bad
await completeOnboarding(); // No error handling
```

### 4. Cache Onboarding Status

```typescript
// ✅ Good - Use SWR for caching
const { completed } = useOnboardingStatus();

// ❌ Bad - Fetch on every render
useEffect(() => {
  fetch('/api/auth/onboarding-status');
}, []); // Missing dependencies
```

### 5. Implement Retry Logic

```typescript
// ✅ Good
const response = await fetchWithRetry('/api/auth/complete-onboarding', {
  maxRetries: 3,
  backoff: 'exponential',
});

// ❌ Bad
const response = await fetch('/api/auth/complete-onboarding');
// No retry on failure
```

### 6. Use TypeScript Types

```typescript
// ✅ Good
import type { OnboardingStatus } from '@/lib/services/auth/types';

const status: OnboardingStatus = await response.json();

// ❌ Bad
const status = await response.json(); // No type safety
```

### 7. Log Important Events

```typescript
// ✅ Good
authLogger.info('Onboarding completed', {
  correlationId,
  userId,
  duration,
});

// ❌ Bad
console.log('Done'); // Not enough context
```

---

## Rate Limiting

### Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| GET /onboarding-status | 100 requests | 1 minute |
| POST /complete-onboarding | 10 requests | 1 minute |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1736159883
```

### Rate Limit Exceeded (429)

```json
{
  "error": "Too many requests. Please try again later.",
  "type": "RATE_LIMIT_ERROR",
  "correlationId": "auth-1736159823400-abc123",
  "retryable": false
}
```

---

## Security

### Authentication
- Session-based authentication required
- Cookies must be included in requests
- HTTPS required in production

### Authorization
- Users can only access their own onboarding status
- Admin endpoints require admin role

### CORS
- Same-origin policy enforced
- Credentials required for cross-origin requests

### Headers
- `X-Correlation-Id`: Request tracing
- `Cache-Control`: Prevent caching of sensitive data
- `WWW-Authenticate`: Authentication scheme

---

## Monitoring

### Metrics to Track
- Onboarding completion rate
- Time to complete onboarding
- Error rate by type
- API response times

### Logging
- All requests logged with correlation IDs
- Errors logged with stack traces
- Performance metrics tracked

### Alerts
- High error rate (> 5%)
- Slow response times (> 1s)
- Database connection failures

---

## Support

### Debugging
1. Check correlation ID in response
2. Search logs for correlation ID
3. Review error type and message
4. Check retry attempts

### Common Issues

**Issue:** 401 Unauthorized  
**Solution:** Ensure user is logged in and session is valid

**Issue:** 404 User Not Found  
**Solution:** Verify user exists in database

**Issue:** 500 Internal Server Error  
**Solution:** Check database connection and logs

---

**Last Updated:** 2024-11-16  
**Version:** 1.0.0  
**Status:** ✅ Production Ready

