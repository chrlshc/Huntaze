# NextAuth v4 Testing Guide

**Quick Start Guide for Developers**

---

## 🚀 Quick Start

### Run All Tests

```bash
npm test tests/integration/auth/nextauth-v4.test.ts
```

### Run Specific Test Suite

```bash
# Session tests
npm test -- --grep "GET /api/auth/session"

# Sign in tests
npm test -- --grep "POST /api/auth/signin/credentials"

# Security tests
npm test -- --grep "Security"

# Performance tests
npm test -- --grep "Performance"
```

---

## 📁 Files Overview

| File | Purpose | Lines |
|------|---------|-------|
| `nextauth-v4.test.ts` | Main test suite | 800+ |
| `nextauth-v4-api-tests.md` | Complete documentation | 50 pages |
| `fixtures.ts` | Test data and utilities | Updated |
| `NEXTAUTH_V4_TESTING_GUIDE.md` | This guide | - |

---

## 🧪 Test Suites

### 1. Session Management (12 tests)

Tests session retrieval, validation, and expiration.

```bash
npm test -- --grep "GET /api/auth/session"
```

**Key Tests:**
- Valid session returns user data
- Null session for unauthenticated
- Session expiration handling
- Performance < 200ms

---

### 2. Credentials Sign In (18 tests)

Tests email/password authentication.

```bash
npm test -- --grep "POST /api/auth/signin/credentials"
```

**Key Tests:**
- Valid credentials sign in
- Invalid credentials rejected
- Email validation
- Password validation
- Performance < 1000ms

---

### 3. Sign Out (3 tests)

Tests sign out functionality.

```bash
npm test -- --grep "POST /api/auth/signout"
```

**Key Tests:**
- Signs out authenticated user
- Clears all cookies
- Handles missing session

---

### 4. CSRF Protection (2 tests)

Tests CSRF token generation and validation.

```bash
npm test -- --grep "CSRF"
```

---

### 5. Provider Configuration (2 tests)

Tests provider listing.

```bash
npm test -- --grep "providers"
```

---

### 6. Error Handling (3 tests)

Tests error responses.

```bash
npm test -- --grep "Error Handling"
```

---

### 7. Rate Limiting (2 tests)

Tests rate limit enforcement.

```bash
npm test -- --grep "Rate Limiting"
```

---

### 8. Concurrent Access (2 tests)

Tests concurrent request handling.

```bash
npm test -- --grep "Concurrent"
```

---

### 9. Timeout Handling (1 test)

Tests timeout configuration.

```bash
npm test -- --grep "Timeout"
```

---

## 🔧 Using Fixtures

### Create Test User

```typescript
import { createTestUser, generateValidCredentials } from './fixtures';

const credentials = generateValidCredentials();
const user = await createTestUser(credentials);
```

### Create Test Session

```typescript
import { createTestSession } from './fixtures';

const sessionToken = await createTestSession(user.id);
```

### Generate Credentials

```typescript
import { generateValidCredentials, generateInvalidCredentials } from './fixtures';

// Valid credentials
const valid = generateValidCredentials();
// { email: 'test-xxx@example.com', password: 'SecurePass...', ... }

// Invalid credentials
const invalid = generateInvalidCredentials();
// { email: 'invalid-email', password: 'short' }
```

### Cleanup Test Data

```typescript
import { cleanupTestData } from './fixtures';

afterEach(async () => {
  await cleanupTestData();
});
```

---

## 📊 Response Schemas

### Session Response

```typescript
interface SessionResponse {
  user?: {
    id: string;
    email: string;
    name?: string;
    role?: string;
    creatorId?: string;
  };
  expires?: string; // ISO 8601
}
```

### Error Response

```typescript
interface ErrorResponse {
  success: false;
  error: {
    type: AuthErrorType;
    message: string;
    userMessage: string;
    correlationId: string;
    statusCode: number;
    retryable: boolean;
    timestamp: string;
  };
  correlationId: string;
  duration: number;
}
```

---

## 🔒 Security Tests

### User Enumeration Prevention

```typescript
it('should not expose user existence', async () => {
  // Non-existent user
  const response1 = await signIn({ email: 'nonexistent@example.com', password: 'pass' });
  
  // Existing user, wrong password
  const response2 = await signIn({ email: 'existing@example.com', password: 'wrong' });
  
  // Both should return same error
  expect(response1.status).toBe(response2.status);
});
```

### CSRF Protection

```typescript
it('should validate CSRF token', async () => {
  const { csrfToken } = await fetch('/api/auth/csrf').then(r => r.json());
  
  const response = await signIn({
    email: 'user@example.com',
    password: 'SecurePass123!',
    csrfToken,
  });
  
  expect(response.status).toBe(200);
});
```

### Cookie Security

```typescript
it('should set secure cookies', async () => {
  const response = await signIn();
  const cookies = response.headers.get('set-cookie');
  
  expect(cookies).toContain('HttpOnly');
  expect(cookies).toContain('SameSite=Lax');
});
```

---

## ⚡ Performance Tests

### Session Retrieval

```typescript
it('should respond within 200ms', async () => {
  const startTime = Date.now();
  const response = await fetch('/api/auth/session');
  const duration = Date.now() - startTime;
  
  expect(duration).toBeLessThan(200);
});
```

### Concurrent Requests

```typescript
it('should handle 50 concurrent requests', async () => {
  const requests = Array.from({ length: 50 }, () =>
    fetch('/api/auth/session')
  );
  
  const responses = await Promise.all(requests);
  
  responses.forEach(r => expect(r.status).toBe(200));
});
```

---

## 🐛 Troubleshooting

### Database Connection Error

```bash
# Check database is running
docker ps | grep postgres

# Start database
docker-compose up -d postgres
```

### Session Token Not Set

```typescript
// Check correct cookie name
const cookies = response.headers.get('set-cookie');
expect(cookies).toContain('next-auth.session-token');
```

### Rate Limiting Tests Failing

```bash
# Clear rate limit cache
redis-cli FLUSHDB
```

### Test Timeout

```typescript
// Increase test timeout
it('should handle timeout', async () => {
  // ...
}, 15000); // 15 second timeout
```

---

## 📚 Additional Resources

- **Complete Documentation:** `nextauth-v4-api-tests.md`
- **Test Suite:** `nextauth-v4.test.ts`
- **Fixtures:** `fixtures.ts`
- **Summary:** `NEXTAUTH_V4_TESTS_COMPLETE.md`

---

## ✅ Checklist

Before running tests:

- [ ] Database is running
- [ ] Environment variables configured
- [ ] Dependencies installed (`npm install`)
- [ ] Test database setup (`npm run test:db:setup`)

---

## 🎯 Common Commands

```bash
# Run all tests
npm test tests/integration/auth/nextauth-v4.test.ts

# Run with coverage
npm test -- --coverage tests/integration/auth/nextauth-v4.test.ts

# Run in watch mode
npm test -- --watch tests/integration/auth/nextauth-v4.test.ts

# Run specific test
npm test -- --grep "should sign in with valid credentials"

# Debug mode
DEBUG=nextauth:* npm test tests/integration/auth/nextauth-v4.test.ts
```

---

**Last Updated:** November 14, 2025  
**Version:** 1.0.0  
**Status:** ✅ Complete
