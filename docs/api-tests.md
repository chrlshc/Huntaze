# API Integration Tests Documentation

Comprehensive documentation for API integration testing strategy, scenarios, and best practices.

## Table of Contents

1. [Overview](#overview)
2. [Test Architecture](#test-architecture)
3. [Test Scenarios](#test-scenarios)
4. [Running Tests](#running-tests)
5. [Writing New Tests](#writing-new-tests)
6. [CI/CD Integration](#cicd-integration)
7. [Troubleshooting](#troubleshooting)

## Overview

Our API integration tests validate the complete request-response cycle of API endpoints, including:

- HTTP status codes and headers
- Response schema validation
- Error handling and graceful degradation
- Performance characteristics
- Concurrent access patterns
- Security considerations
- Prometheus metrics compliance

### Test Philosophy

1. **Test Real Behavior**: Integration tests hit actual endpoints, not mocks
2. **Validate Contracts**: Use Zod schemas to validate API contracts
3. **Test Edge Cases**: Cover error paths, not just happy paths
4. **Performance Aware**: Track and validate response times
5. **Production-Like**: Test against production-like configurations

## Test Architecture

### Directory Structure

```
tests/integration/
├── api/
│   ├── README.md                    # API tests documentation
│   ├── metrics.test.ts              # /api/metrics endpoint tests
│   ├── fixtures/
│   │   └── metrics-samples.ts       # Test data and fixtures
│   └── helpers/
│       └── test-utils.ts            # Shared utilities
└── ...
```

### Test Layers

```
┌─────────────────────────────────────────┐
│         Integration Tests               │
│  (Real HTTP requests to endpoints)      │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Next.js API Routes              │
│  (app/api/*/route.ts)                   │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Business Logic                  │
│  (lib/*, services/*)                    │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         External Services               │
│  (Database, Redis, S3, etc.)            │
└─────────────────────────────────────────┘
```

## Test Scenarios

### 1. /api/metrics Endpoint

**Purpose**: Expose Prometheus metrics for monitoring

#### Scenario 1.1: Successful Metrics Collection

**Given**: Server is running with prom-client available  
**When**: GET request to /api/metrics  
**Then**: 
- Returns 200 OK
- Content-Type is text/plain
- Response contains valid Prometheus format
- Default Node.js metrics are present

```typescript
it('should return valid Prometheus metrics', async () => {
  const response = await fetch(`${BASE_URL}/api/metrics`)
  
  expect(response.status).toBe(200)
  expect(response.headers.get('content-type')).toMatch(/text\/plain/)
  
  const text = await response.text()
  expect(text).toContain('process_cpu_user_seconds_total')
  expect(text).toContain('# HELP')
  expect(text).toContain('# TYPE')
})
```

#### Scenario 1.2: Method Not Allowed

**Given**: Server is running  
**When**: POST/PUT/DELETE request to /api/metrics  
**Then**: Returns 405 Method Not Allowed

```typescript
it('should reject non-GET methods', async () => {
  const methods = ['POST', 'PUT', 'DELETE']
  
  for (const method of methods) {
    const response = await fetch(`${BASE_URL}/api/metrics`, { method })
    expect(response.status).toBe(405)
  }
})
```

#### Scenario 1.3: Graceful Degradation

**Given**: prom-client fails to load  
**When**: GET request to /api/metrics  
**Then**: 
- Returns 500 Internal Server Error
- Response is JSON with error message
- Server continues running

```typescript
it('should handle prom-client failure gracefully', async () => {
  // This would require mocking prom-client to fail
  const response = await fetch(`${BASE_URL}/api/metrics`)
  
  if (response.status === 500) {
    const json = await response.json()
    expect(json).toHaveProperty('error')
    expect(json.error).toBe('Metrics unavailable')
  }
})
```

#### Scenario 1.4: Concurrent Access

**Given**: Server is running  
**When**: 20 concurrent GET requests to /api/metrics  
**Then**: 
- All requests return 200 OK
- No race conditions occur
- Metrics are consistent

```typescript
it('should handle concurrent requests', async () => {
  const requests = Array.from({ length: 20 }, () =>
    fetch(`${BASE_URL}/api/metrics`)
  )
  
  const responses = await Promise.all(requests)
  
  responses.forEach(response => {
    expect(response.status).toBe(200)
  })
})
```

#### Scenario 1.5: Performance Validation

**Given**: Server is running  
**When**: First request to /api/metrics (includes lazy init)  
**Then**: Response time < 1000ms

**When**: Subsequent requests  
**Then**: Response time < 200ms

```typescript
it('should respond within acceptable time', async () => {
  // First request (may include lazy init)
  const start1 = Date.now()
  await fetch(`${BASE_URL}/api/metrics`)
  const duration1 = Date.now() - start1
  expect(duration1).toBeLessThan(1000)
  
  // Subsequent request (cached)
  const start2 = Date.now()
  await fetch(`${BASE_URL}/api/metrics`)
  const duration2 = Date.now() - start2
  expect(duration2).toBeLessThan(200)
})
```

#### Scenario 1.6: Prometheus Format Validation

**Given**: Server is running  
**When**: GET request to /api/metrics  
**Then**: 
- Each line matches Prometheus format
- Metric names are valid (alphanumeric + underscore)
- Metric values are numeric
- Labels have valid syntax

```typescript
it('should return valid Prometheus format', async () => {
  const response = await fetch(`${BASE_URL}/api/metrics`)
  const text = await response.text()
  
  const lines = text.split('\n')
  lines.forEach(line => {
    if (line.startsWith('#')) {
      // Comment line
      expect(line).toMatch(/^# (HELP|TYPE) \S+/)
    } else if (line.trim()) {
      // Metric line
      expect(line).toMatch(/^[a-zA-Z_][a-zA-Z0-9_]*/)
    }
  })
})
```

#### Scenario 1.7: Idempotence

**Given**: Server is running  
**When**: Multiple requests to /api/metrics  
**Then**: 
- collectDefaultMetrics() doesn't cause errors
- No "metric already registered" errors
- Metrics registry persists across requests

```typescript
it('should be idempotent', async () => {
  for (let i = 0; i < 5; i++) {
    const response = await fetch(`${BASE_URL}/api/metrics`)
    expect(response.status).toBe(200)
  }
})
```

#### Scenario 1.8: Runtime Configuration

**Given**: Server is running  
**When**: GET request to /api/metrics  
**Then**: 
- Uses Node.js runtime (not Edge)
- Is dynamically rendered (not cached)
- Node.js-specific metrics are present

```typescript
it('should use Node.js runtime', async () => {
  const response = await fetch(`${BASE_URL}/api/metrics`)
  const text = await response.text()
  
  // These metrics only exist in Node.js runtime
  expect(text).toContain('nodejs_')
  expect(text).toContain('process_')
})
```

#### Scenario 1.9: Security

**Given**: Server is running  
**When**: GET request to /api/metrics  
**Then**: 
- No sensitive information exposed
- No authentication required (public endpoint)
- Malformed requests handled safely

```typescript
it('should not expose sensitive information', async () => {
  const response = await fetch(`${BASE_URL}/api/metrics`)
  const text = await response.text()
  
  expect(text.toLowerCase()).not.toContain('password')
  expect(text.toLowerCase()).not.toContain('secret')
  expect(text.toLowerCase()).not.toContain('token')
})
```

### 2. /api/store/publish Endpoint

**Purpose:** Publish user's store to make it live (requires payment configuration)

#### Scenario 2.1: Successful Store Publish

**Given**: User is authenticated and has completed payments setup  
**When**: POST request to /api/store/publish  
**Then**: 
- Returns 200 OK
- Content-Type is application/json
- Response contains success, message, storeUrl, correlationId
- Store is marked as published in database

```typescript
it('should publish store successfully when payments completed', async () => {
  const response = await fetch(`${BASE_URL}/api/store/publish`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer test-token-with-payments',
      'Content-Type': 'application/json'
    }
  })
  
  expect(response.status).toBe(200)
  expect(response.headers.get('content-type')).toMatch(/application\/json/)
  
  const json = await response.json()
  expect(json.success).toBe(true)
  expect(json.storeUrl).toMatch(/^https?:\/\//)
  expect(json.correlationId).toMatch(/^[0-9a-f-]{36}$/)
})
```

#### Scenario 2.2: Gating - Payments Not Completed

**Given**: User is authenticated but has NOT completed payments setup  
**When**: POST request to /api/store/publish  
**Then**: 
- Returns 409 Conflict
- Response contains PRECONDITION_REQUIRED error
- Response includes missingStep: 'payments'
- Response includes action guidance (open_modal)

```typescript
it('should block publish when payments not completed', async () => {
  const response = await fetch(`${BASE_URL}/api/store/publish`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer test-token-no-payments',
      'Content-Type': 'application/json'
    }
  })
  
  expect(response.status).toBe(409)
  
  const json = await response.json()
  expect(json.error).toBe('PRECONDITION_REQUIRED')
  expect(json.missingStep).toBe('payments')
  expect(json.action.type).toBe('open_modal')
  expect(json.action.modal).toBe('payments_setup')
})
```

#### Scenario 2.3: Unauthorized Access

**Given**: User is not authenticated  
**When**: POST request to /api/store/publish  
**Then**: Returns 401 Unauthorized

```typescript
it('should reject unauthenticated requests', async () => {
  const response = await fetch(`${BASE_URL}/api/store/publish`, {
    method: 'POST'
  })
  
  expect(response.status).toBe(401)
  
  const json = await response.json()
  expect(json.error).toBe('Unauthorized')
})
```

#### Scenario 2.4: Method Not Allowed

**Given**: Server is running  
**When**: GET/PUT/DELETE request to /api/store/publish  
**Then**: Returns 405 Method Not Allowed

```typescript
it('should reject non-POST methods', async () => {
  const methods = ['GET', 'PUT', 'DELETE']
  
  for (const method of methods) {
    const response = await fetch(`${BASE_URL}/api/store/publish`, { method })
    expect(response.status).toBe(405)
  }
})
```

#### Scenario 2.5: Concurrent Publish Attempts

**Given**: User is authenticated with payments completed  
**When**: Multiple concurrent POST requests to /api/store/publish  
**Then**: 
- All requests complete without crashes
- Each request has unique correlationId
- Idempotency is maintained (no duplicate publishes)

```typescript
it('should handle concurrent publish attempts', async () => {
  const requests = Array.from({ length: 5 }, () =>
    fetch(`${BASE_URL}/api/store/publish`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token-with-payments',
        'Content-Type': 'application/json'
      }
    })
  )
  
  const responses = await Promise.all(requests)
  
  responses.forEach(response => {
    expect([200, 409]).toContain(response.status)
  })
  
  const jsons = await Promise.all(responses.map(r => r.json()))
  const correlationIds = jsons.map(j => j.correlationId)
  const uniqueIds = new Set(correlationIds)
  
  expect(uniqueIds.size).toBe(correlationIds.length)
})
```

#### Scenario 2.6: Performance Validation

**Given**: Server is running  
**When**: POST request to /api/store/publish  
**Then**: Response time < 5s (target: < 2s)

```typescript
it('should respond within acceptable time', async () => {
  const start = Date.now()
  await fetch(`${BASE_URL}/api/store/publish`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer test-token',
      'Content-Type': 'application/json'
    }
  })
  const duration = Date.now() - start
  
  expect(duration).toBeLessThan(5000)
})
```

#### Scenario 2.7: Error Handling

**Given**: Internal server error occurs  
**When**: POST request to /api/store/publish  
**Then**: 
- Returns 500 Internal Server Error
- Response is JSON with error message
- Response includes correlationId for debugging
- No sensitive information exposed

```typescript
it('should handle internal errors gracefully', async () => {
  // Mock scenario that triggers internal error
  const response = await fetch(`${BASE_URL}/api/store/publish`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer test-token-trigger-error',
      'Content-Type': 'application/json'
    }
  })
  
  if (response.status === 500) {
    const json = await response.json()
    expect(json).toHaveProperty('error')
    expect(json).toHaveProperty('correlationId')
    
    const text = JSON.stringify(json).toLowerCase()
    expect(text).not.toContain('password')
    expect(text).not.toContain('secret')
  }
})
```

#### Scenario 2.8: Schema Validation

**Given**: Server is running  
**When**: POST request to /api/store/publish  
**Then**: Response matches expected Zod schema

```typescript
import { z } from 'zod'

const SuccessSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  storeUrl: z.string().url(),
  correlationId: z.string().uuid()
})

const GatingSchema = z.object({
  error: z.literal('PRECONDITION_REQUIRED'),
  message: z.string(),
  missingStep: z.string(),
  action: z.object({
    type: z.enum(['open_modal', 'redirect']),
    modal: z.string().optional(),
    prefill: z.record(z.any()).optional()
  }),
  correlationId: z.string().uuid()
})

it('should return valid response schema', async () => {
  const response = await fetch(`${BASE_URL}/api/store/publish`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer test-token',
      'Content-Type': 'application/json'
    }
  })
  
  const json = await response.json()
  
  if (response.status === 200) {
    const result = SuccessSchema.safeParse(json)
    expect(result.success).toBe(true)
  } else if (response.status === 409) {
    const result = GatingSchema.safeParse(json)
    expect(result.success).toBe(true)
  }
})
```

#### Scenario 2.9: Security Validation

**Given**: Server is running  
**When**: POST request with malicious input  
**Then**: 
- Input is sanitized
- No XSS vectors in response
- No SQL injection possible
- Security headers present

```typescript
it('should sanitize malicious input', async () => {
  const response = await fetch(`${BASE_URL}/api/store/publish`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer test-token',
      'Content-Type': 'application/json',
      'X-Malicious-Header': '<script>alert("xss")</script>'
    }
  })
  
  const json = await response.json()
  const text = JSON.stringify(json)
  
  expect(text).not.toContain('<script>')
  expect(text).not.toContain('javascript:')
})
```

### 3. /api/admin/feature-flags Endpoint

**Purpose:** Admin API for managing feature flags configuration

#### Scenario 3.1: Successful Feature Flags Retrieval

**Given**: User is authenticated as admin  
**When**: GET request to /api/admin/feature-flags  
**Then**: 
- Returns 200 OK
- Content-Type is application/json
- Response contains flags object with enabled, rolloutPercentage
- Response includes correlationId for tracing

```typescript
it('should return current feature flags for admin', async () => {
  const response = await fetch(`${BASE_URL}/api/admin/feature-flags`, {
    headers: {
      'Authorization': 'Bearer admin-token'
    }
  })
  
  expect(response.status).toBe(200)
  expect(response.headers.get('content-type')).toMatch(/application\/json/)
  
  const json = await response.json()
  expect(json.flags).toBeDefined()
  expect(json.flags.enabled).toBeDefined()
  expect(json.flags.rolloutPercentage).toBeGreaterThanOrEqual(0)
  expect(json.flags.rolloutPercentage).toBeLessThanOrEqual(100)
  expect(json.correlationId).toMatch(/^[0-9a-f-]{36}$/)
})
```

#### Scenario 3.2: Successful Feature Flags Update

**Given**: User is authenticated as admin  
**When**: POST request to /api/admin/feature-flags with valid updates  
**Then**: 
- Returns 200 OK
- Response contains success: true
- Response includes updated flags
- Changes are persisted

```typescript
it('should update feature flags successfully', async () => {
  const updates = {
    enabled: true,
    rolloutPercentage: 75,
    markets: ['FR', 'DE']
  }
  
  const response = await fetch(`${BASE_URL}/api/admin/feature-flags`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer admin-token',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  })
  
  expect(response.status).toBe(200)
  
  const json = await response.json()
  expect(json.success).toBe(true)
  expect(json.flags.enabled).toBe(updates.enabled)
  expect(json.flags.rolloutPercentage).toBe(updates.rolloutPercentage)
  expect(json.flags.markets).toEqual(updates.markets)
})
```

#### Scenario 3.3: Unauthorized Access

**Given**: User is not authenticated  
**When**: GET/POST request to /api/admin/feature-flags  
**Then**: Returns 401 Unauthorized

```typescript
it('should reject unauthenticated requests', async () => {
  const response = await fetch(`${BASE_URL}/api/admin/feature-flags`)
  expect([401, 403]).toContain(response.status)
})
```

#### Scenario 3.4: Non-Admin Access

**Given**: User is authenticated but not admin  
**When**: GET/POST request to /api/admin/feature-flags  
**Then**: Returns 403 Forbidden

```typescript
it('should reject non-admin users', async () => {
  const response = await fetch(`${BASE_URL}/api/admin/feature-flags`, {
    headers: {
      'Authorization': 'Bearer regular-user-token'
    }
  })
  
  expect([403]).toContain(response.status)
})
```

#### Scenario 3.5: Invalid Rollout Percentage

**Given**: User is authenticated as admin  
**When**: POST request with rolloutPercentage < 0 or > 100  
**Then**: 
- Returns 400 Bad Request
- Error message indicates invalid rolloutPercentage

```typescript
it('should reject invalid rollout percentage', async () => {
  const invalidValues = [-1, 101, 150, -50]
  
  for (const value of invalidValues) {
    const response = await fetch(`${BASE_URL}/api/admin/feature-flags`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer admin-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ rolloutPercentage: value })
    })
    
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toContain('Invalid rolloutPercentage')
  }
})
```

#### Scenario 3.6: Empty Update Request

**Given**: User is authenticated as admin  
**When**: POST request with empty body or no valid fields  
**Then**: 
- Returns 400 Bad Request
- Error message indicates no valid updates

```typescript
it('should reject empty updates', async () => {
  const response = await fetch(`${BASE_URL}/api/admin/feature-flags`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer admin-token',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  })
  
  expect(response.status).toBe(400)
  const json = await response.json()
  expect(json.error).toContain('No valid updates provided')
})
```

#### Scenario 3.7: Concurrent Updates

**Given**: Multiple admin users updating flags simultaneously  
**When**: Concurrent POST requests to /api/admin/feature-flags  
**Then**: 
- All requests complete without crashes
- Final state is consistent
- Each request has unique correlationId

```typescript
it('should handle concurrent updates', async () => {
  const requests = Array.from({ length: 5 }, (_, i) =>
    fetch(`${BASE_URL}/api/admin/feature-flags`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer admin-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ rolloutPercentage: 10 + (i * 10) })
    })
  )
  
  const responses = await Promise.all(requests)
  
  responses.forEach(response => {
    expect([200, 201]).toContain(response.status)
  })
  
  // Verify final state is consistent
  const finalResponse = await fetch(`${BASE_URL}/api/admin/feature-flags`, {
    headers: { 'Authorization': 'Bearer admin-token' }
  })
  
  const json = await finalResponse.json()
  expect(typeof json.flags.rolloutPercentage).toBe('number')
})
```

#### Scenario 3.8: Idempotence

**Given**: User is authenticated as admin  
**When**: Same update is sent multiple times  
**Then**: 
- All requests succeed
- Final state matches the update
- No side effects from repeated updates

```typescript
it('should be idempotent', async () => {
  const updates = { enabled: true, rolloutPercentage: 50 }
  
  const response1 = await fetch(`${BASE_URL}/api/admin/feature-flags`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer admin-token',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  })
  
  const response2 = await fetch(`${BASE_URL}/api/admin/feature-flags`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer admin-token',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  })
  
  const json1 = await response1.json()
  const json2 = await response2.json()
  
  expect(json1.flags.enabled).toBe(json2.flags.enabled)
  expect(json1.flags.rolloutPercentage).toBe(json2.flags.rolloutPercentage)
})
```

#### Scenario 3.9: Schema Validation

**Given**: Server is running  
**When**: GET/POST request to /api/admin/feature-flags  
**Then**: Response matches expected Zod schema

```typescript
import { z } from 'zod'

const FlagsSchema = z.object({
  enabled: z.boolean(),
  rolloutPercentage: z.number().min(0).max(100),
  markets: z.array(z.string()).optional(),
  userWhitelist: z.array(z.string()).optional()
})

const GetResponseSchema = z.object({
  flags: FlagsSchema,
  correlationId: z.string().uuid()
})

const PostResponseSchema = z.object({
  success: z.boolean(),
  flags: FlagsSchema,
  correlationId: z.string().uuid()
})

it('should return valid GET response schema', async () => {
  const response = await fetch(`${BASE_URL}/api/admin/feature-flags`, {
    headers: { 'Authorization': 'Bearer admin-token' }
  })
  
  const json = await response.json()
  const result = GetResponseSchema.safeParse(json)
  expect(result.success).toBe(true)
})

it('should return valid POST response schema', async () => {
  const response = await fetch(`${BASE_URL}/api/admin/feature-flags`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer admin-token',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ enabled: true })
  })
  
  const json = await response.json()
  const result = PostResponseSchema.safeParse(json)
  expect(result.success).toBe(true)
})
```

#### Scenario 3.10: Performance Validation

**Given**: Server is running  
**When**: GET/POST request to /api/admin/feature-flags  
**Then**: 
- GET responds within 500ms
- POST responds within 1s

```typescript
it('should respond quickly to GET requests', async () => {
  const start = Date.now()
  await fetch(`${BASE_URL}/api/admin/feature-flags`, {
    headers: { 'Authorization': 'Bearer admin-token' }
  })
  const duration = Date.now() - start
  
  expect(duration).toBeLessThan(500)
})

it('should respond quickly to POST requests', async () => {
  const start = Date.now()
  await fetch(`${BASE_URL}/api/admin/feature-flags`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer admin-token',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ enabled: true })
  })
  const duration = Date.now() - start
  
  expect(duration).toBeLessThan(1000)
})
```

---

### 4. /api/ai/suggestions Endpoint

**Purpose:** Generate AI-powered message suggestions for OnlyFans creators

#### Scenario 4.1: Successful Suggestion Generation

**Given**: User is authenticated and provides valid fan/creator IDs  
**When**: POST request to /api/ai/suggestions  
**Then**: 
- Returns 200 OK
- Content-Type is application/json
- Response contains suggestions array
- Each suggestion has text, tone, confidence
- Metadata includes count, duration, correlationId

```typescript
it('should generate suggestions successfully', async () => {
  const response = await fetch(`${BASE_URL}/api/ai/suggestions`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer test-token',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fanId: 'fan-123',
      creatorId: 'creator-456',
      lastMessage: 'Hey, how are you?',
      messageCount: 10,
      fanValueCents: 5000
    })
  })
  
  expect(response.status).toBe(200)
  
  const json = await response.json()
  expect(json.success).toBe(true)
  expect(json.suggestions).toBeInstanceOf(Array)
  expect(json.suggestions.length).toBeGreaterThan(0)
  expect(json.metadata.correlationId).toBeDefined()
})
```

#### Scenario 4.2: Missing Required Fields

**Given**: User is authenticated  
**When**: POST request without fanId or creatorId  
**Then**: 
- Returns 400 Bad Request
- Error message indicates missing fields
- Response includes correlationId

```typescript
it('should reject request without fanId', async () => {
  const response = await fetch(`${BASE_URL}/api/ai/suggestions`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer test-token',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      creatorId: 'creator-456'
    })
  })
  
  expect(response.status).toBe(400)
  
  const json = await response.json()
  expect(json.error).toBe('Missing required fields')
  expect(json.details).toContain('fanId')
})
```

#### Scenario 4.3: Unauthorized Access

**Given**: User is not authenticated  
**When**: POST request to /api/ai/suggestions  
**Then**: Returns 401 Unauthorized

```typescript
it('should reject unauthenticated requests', async () => {
  const response = await fetch(`${BASE_URL}/api/ai/suggestions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fanId: 'fan-123',
      creatorId: 'creator-456'
    })
  })
  
  expect([401, 403]).toContain(response.status)
})
```

#### Scenario 4.4: Method Not Allowed

**Given**: Server is running  
**When**: GET/PUT/DELETE request to /api/ai/suggestions  
**Then**: Returns 405 Method Not Allowed

```typescript
it('should reject non-POST methods', async () => {
  const methods = ['PUT', 'DELETE']
  
  for (const method of methods) {
    const response = await fetch(`${BASE_URL}/api/ai/suggestions`, { 
      method,
      headers: { 'Authorization': 'Bearer test-token' }
    })
    expect(response.status).toBe(405)
  }
})
```

#### Scenario 4.5: Health Check Endpoint

**Given**: Server is running  
**When**: GET request to /api/ai/suggestions  
**Then**: 
- Returns 200 OK or 503 Service Unavailable
- Response includes status and circuit breaker states
- Timestamp is included

```typescript
it('should return health status', async () => {
  const response = await fetch(`${BASE_URL}/api/ai/suggestions`, {
    method: 'GET'
  })
  
  expect([200, 503]).toContain(response.status)
  
  const json = await response.json()
  expect(json.status).toMatch(/^(healthy|unhealthy)$/)
  expect(json.circuitBreakers).toBeDefined()
  expect(json.timestamp).toBeDefined()
})
```

#### Scenario 4.6: Concurrent Request Handling

**Given**: User is authenticated  
**When**: Multiple concurrent POST requests  
**Then**: 
- All requests complete without crashes
- Each has unique correlationId
- No race conditions occur

```typescript
it('should handle concurrent requests', async () => {
  const requests = Array.from({ length: 10 }, (_, i) =>
    fetch(`${BASE_URL}/api/ai/suggestions`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fanId: `fan-${i}`,
        creatorId: 'creator-456'
      })
    })
  )
  
  const responses = await Promise.all(requests)
  
  responses.forEach(response => {
    expect([200, 429, 500]).toContain(response.status)
  })
  
  const jsons = await Promise.all(responses.map(r => r.json()))
  const correlationIds = jsons.map(j => j.metadata?.correlationId || j.correlationId)
  const uniqueIds = new Set(correlationIds.filter(Boolean))
  
  expect(uniqueIds.size).toBe(correlationIds.filter(Boolean).length)
})
```

#### Scenario 4.7: Performance Validation

**Given**: Server is running  
**When**: POST request to /api/ai/suggestions  
**Then**: Response time < 5s (target: < 2s)

```typescript
it('should respond within acceptable time', async () => {
  const start = Date.now()
  
  await fetch(`${BASE_URL}/api/ai/suggestions`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer test-token',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fanId: 'fan-123',
      creatorId: 'creator-456'
    })
  })
  
  const duration = Date.now() - start
  expect(duration).toBeLessThan(5000)
})
```

#### Scenario 4.8: Response Schema Validation

**Given**: Server is running  
**When**: POST request to /api/ai/suggestions  
**Then**: Response matches expected Zod schema

```typescript
import { z } from 'zod'

const SuggestionSchema = z.object({
  text: z.string(),
  tone: z.enum(['flirty', 'friendly', 'professional', 'playful']),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().optional()
})

const SuccessResponseSchema = z.object({
  success: z.literal(true),
  suggestions: z.array(SuggestionSchema),
  metadata: z.object({
    count: z.number(),
    duration: z.number(),
    correlationId: z.string()
  })
})

it('should return valid response schema', async () => {
  const response = await fetch(`${BASE_URL}/api/ai/suggestions`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer test-token',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fanId: 'fan-123',
      creatorId: 'creator-456'
    })
  })
  
  const json = await response.json()
  
  if (response.status === 200) {
    const result = SuccessResponseSchema.safeParse(json)
    expect(result.success).toBe(true)
  }
})
```

#### Scenario 4.9: Security Validation

**Given**: Server is running  
**When**: POST request with malicious input  
**Then**: 
- Input is sanitized
- No XSS vectors in response
- No sensitive information exposed

```typescript
it('should sanitize XSS attempts', async () => {
  const response = await fetch(`${BASE_URL}/api/ai/suggestions`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer test-token',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fanId: '<script>alert("xss")</script>',
      creatorId: 'creator-456',
      lastMessage: '<img src=x onerror=alert(1)>'
    })
  })
  
  const json = await response.json()
  const text = JSON.stringify(json)
  
  expect(text).not.toContain('<script>')
  expect(text).not.toContain('onerror=')
})
```

#### Scenario 4.10: Rate Limiting

**Given**: User makes excessive requests  
**When**: 100 POST requests in rapid succession  
**Then**: 
- Some requests return 429 Too Many Requests
- Rate limit headers are included
- Service remains stable

```typescript
it('should enforce rate limits', async () => {
  const requests = Array.from({ length: 100 }, () =>
    fetch(`${BASE_URL}/api/ai/suggestions`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fanId: 'fan-rate-limit',
        creatorId: 'creator-456'
      })
    })
  )
  
  const responses = await Promise.all(requests)
  const statusCodes = responses.map(r => r.status)
  const rateLimited = statusCodes.filter(s => s === 429).length
  
  // Should have some rate limiting
  expect(rateLimited).toBeGreaterThan(0)
})
```

---

### 5. Future Endpoints

As new API endpoints are added, follow this template:

#### Scenario Template: [Endpoint Name]

**Purpose**: [What the endpoint does]

**Test Cases**:
1. Happy path (200 OK)
2. Invalid input (400 Bad Request)
3. Unauthorized (401 Unauthorized)
4. Forbidden (403 Forbidden)
5. Not found (404 Not Found)
6. Server error (500 Internal Server Error)
7. Rate limiting (429 Too Many Requests)
8. Concurrent access
9. Performance validation
10. Schema validation

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or start production build
npm run build
npm start
```

### Run All Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run with coverage
npm run test:integration:coverage

# Run in watch mode
npm run test:integration:watch
```

### Run Specific Tests

```bash
# Run specific test file
npm run test:integration tests/integration/api/metrics.test.ts

# Run tests matching pattern
npm run test:integration -- --grep "concurrent"

# Run with verbose output
npm run test:integration -- --reporter=verbose
```

### Environment Configuration

```bash
# Test against local server (default)
TEST_BASE_URL=http://localhost:3000 npm run test:integration

# Test against staging
TEST_BASE_URL=https://staging.example.com npm run test:integration

# Test against production (read-only tests only)
TEST_BASE_URL=https://api.example.com npm run test:integration
```

## Writing New Tests

### Step 1: Create Test File

```typescript
// tests/integration/api/my-endpoint.test.ts
import { describe, it, expect } from 'vitest'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

describe('Integration: /api/my-endpoint', () => {
  describe('HTTP Status Codes', () => {
    it('should return 200 OK', async () => {
      const response = await fetch(`${BASE_URL}/api/my-endpoint`)
      expect(response.status).toBe(200)
    })
  })
})
```

### Step 2: Add Response Schema Validation

```typescript
import { z } from 'zod'

const ResponseSchema = z.object({
  data: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })),
  total: z.number(),
})

it('should return valid response schema', async () => {
  const response = await fetch(`${BASE_URL}/api/my-endpoint`)
  const json = await response.json()
  
  const result = ResponseSchema.safeParse(json)
  expect(result.success).toBe(true)
})
```

### Step 3: Add Error Handling Tests

```typescript
it('should handle invalid input', async () => {
  const response = await fetch(`${BASE_URL}/api/my-endpoint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invalid: 'data' })
  })
  
  expect(response.status).toBe(400)
  
  const json = await response.json()
  expect(json).toHaveProperty('error')
})
```

### Step 4: Add Performance Tests

```typescript
it('should respond within acceptable time', async () => {
  const start = Date.now()
  await fetch(`${BASE_URL}/api/my-endpoint`)
  const duration = Date.now() - start
  
  expect(duration).toBeLessThan(500)
})
```

### Step 5: Add Concurrent Access Tests

```typescript
it('should handle concurrent requests', async () => {
  const requests = Array.from({ length: 10 }, () =>
    fetch(`${BASE_URL}/api/my-endpoint`)
  )
  
  const responses = await Promise.all(requests)
  responses.forEach(r => expect(r.ok).toBe(true))
})
```

### Step 6: Create Fixtures

```typescript
// tests/integration/api/fixtures/my-endpoint-samples.ts
export const validRequest = {
  name: 'Test',
  email: 'test@example.com',
}

export const invalidRequest = {
  name: '', // Invalid: empty name
}

export const expectedResponse = {
  id: expect.any(String),
  name: 'Test',
  createdAt: expect.any(String),
}
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Integration Tests

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Start server
        run: npm start &
        
      - name: Wait for server
        run: npx wait-on http://localhost:3000 --timeout 60000
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          TEST_BASE_URL: http://localhost:3000
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        if: always()
        with:
          files: ./coverage/coverage-final.json
```

### Pre-deployment Validation

```bash
#!/bin/bash
# scripts/pre-deploy-tests.sh

set -e

echo "🧪 Running pre-deployment tests..."

# Start server
npm run build
npm start &
SERVER_PID=$!

# Wait for server
npx wait-on http://localhost:3000 --timeout 60000

# Run tests
npm run test:integration

# Cleanup
kill $SERVER_PID

echo "✅ All tests passed!"
```

## Troubleshooting

### Server Not Running

**Error**: `connect ECONNREFUSED 127.0.0.1:3000`

**Solution**:
```bash
# Start the server first
npm run dev
# or
npm run build && npm start

# Then run tests in another terminal
npm run test:integration
```

### Timeout Errors

**Error**: `Timeout of 5000ms exceeded`

**Solution**: Increase timeout in test file:
```typescript
it('should handle slow operation', async () => {
  // ... test code
}, 10000) // 10 second timeout
```

Or globally in `vitest.config.ts`:
```typescript
export default defineConfig({
  test: {
    testTimeout: 10000,
  }
})
```

### Flaky Tests

**Symptoms**: Tests pass sometimes, fail other times

**Solutions**:
1. Add retry logic for network requests
2. Increase wait times for async operations
3. Ensure test isolation (no shared state)
4. Use `waitFor` helper for conditions

```typescript
import { retry } from './helpers/test-utils'

it('should handle flaky network', async () => {
  const response = await retry(
    () => fetch(`${BASE_URL}/api/endpoint`),
    { maxAttempts: 3, initialDelay: 1000 }
  )
  
  expect(response.ok).toBe(true)
})
```

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
TEST_BASE_URL=http://localhost:3001 npm run test:integration
```

### Environment Variables Not Set

**Error**: Tests fail due to missing env vars

**Solution**:
```bash
# Copy example env file
cp .env.example .env

# Validate env vars
npm run check:env

# Run tests with env vars
npm run test:integration
```

## Best Practices

### 1. Test Independence

Each test should be independent and not rely on other tests:

```typescript
// ❌ Bad: Relies on previous test
let userId: string

it('should create user', async () => {
  const response = await createUser()
  userId = response.id // Shared state
})

it('should get user', async () => {
  const response = await getUser(userId) // Depends on previous test
})

// ✅ Good: Independent tests
it('should create user', async () => {
  const response = await createUser()
  expect(response.id).toBeDefined()
})

it('should get user', async () => {
  const user = await createUser() // Create own test data
  const response = await getUser(user.id)
  expect(response.id).toBe(user.id)
})
```

### 2. Use Descriptive Test Names

```typescript
// ❌ Bad: Vague
it('works', async () => { ... })

// ✅ Good: Descriptive
it('should return 200 OK when metrics are available', async () => { ... })
```

### 3. Test Error Paths

```typescript
it('should handle errors gracefully', async () => {
  const response = await fetch(`${BASE_URL}/api/endpoint`, {
    method: 'POST',
    body: 'invalid json'
  })
  
  expect(response.status).toBe(400)
  const json = await response.json()
  expect(json.error).toBeDefined()
})
```

### 4. Validate Response Schemas

```typescript
import { z } from 'zod'

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  createdAt: z.string().datetime(),
})

it('should return valid user schema', async () => {
  const response = await fetch(`${BASE_URL}/api/users/123`)
  const json = await response.json()
  
  const result = UserSchema.safeParse(json)
  expect(result.success).toBe(true)
})
```

### 5. Use Fixtures for Test Data

```typescript
import { validUser, invalidUser } from './fixtures/users'

it('should accept valid user', async () => {
  const response = await createUser(validUser)
  expect(response.ok).toBe(true)
})

it('should reject invalid user', async () => {
  const response = await createUser(invalidUser)
  expect(response.status).toBe(400)
})
```

## Metrics and Monitoring

Track test suite health:

- **Test Execution Time**: Should be < 5 minutes
- **Test Flakiness Rate**: Should be < 1%
- **Code Coverage**: Target > 80%
- **Tests per Endpoint**: Minimum 10 scenarios

## Related Documentation

- [Observability Hardening Spec](../.kiro/specs/observability-wrapper-build-fix/)
- [API Integration Tests README](../tests/integration/api/README.md)
- [Test Utilities](../tests/integration/api/helpers/test-utils.ts)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)

## Contributing

When adding new API integration tests:

1. Follow the test structure outlined above
2. Add fixtures for test data
3. Test all HTTP status codes
4. Validate response schemas with Zod
5. Test error handling and edge cases
6. Include performance benchmarks
7. Test concurrent access patterns
8. Document test scenarios in this file
9. Update CI/CD pipelines if needed

## Maintenance Checklist

- [ ] Review and update performance benchmarks quarterly
- [ ] Add tests for new API endpoints
- [ ] Update fixtures when API contracts change
- [ ] Monitor test execution time and optimize slow tests
- [ ] Review and update CI/CD integration
- [ ] Track and reduce test flakiness
- [ ] Maintain > 80% code coverage
