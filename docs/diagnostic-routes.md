# Diagnostic Routes Documentation

This document describes the diagnostic routes created for isolation testing and debugging of the NextAuth staging 500 error.

## Overview

Three diagnostic routes have been created to help isolate and diagnose issues:

1. `/api/ping` - Ultra-simple route with no dependencies
2. `/api/health-check` - Health check route excluded from middleware
3. `/api/test-env` - Environment diagnostic route (updated with structured logging)

## Routes

### 1. `/api/ping`

**Purpose**: Validate that API routes work independently of NextAuth and middleware.

**Features**:
- No external dependencies
- Minimal code path
- Returns basic runtime information
- Includes correlation ID for tracing

**Request**:
```bash
curl https://staging.huntaze.com/api/ping
```

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "runtime": "lambda",
  "nodeVersion": "v18.17.0",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Headers**:
- `X-Correlation-ID`: Unique identifier for request tracing

---

### 2. `/api/health-check`

**Purpose**: Isolate if problems come from middleware by bypassing rate limiting.

**Features**:
- Excluded from middleware matcher
- Checks environment variable status
- Returns configuration health
- Includes correlation ID for tracing

**Request**:
```bash
curl https://staging.huntaze.com/api/health-check
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "correlationId": "550e8400-e29b-41d4-a716-446655440001",
  "env": {
    "hasNextAuthSecret": true,
    "hasNextAuthUrl": true,
    "hasDatabaseUrl": true,
    "nodeEnv": "production",
    "amplifyEnv": "staging"
  }
}
```

**Headers**:
- `X-Correlation-ID`: Unique identifier for request tracing

---

### 3. `/api/test-env`

**Purpose**: Test environment configuration with middleware enabled.

**Features**:
- Goes through middleware (rate limiting)
- Detailed environment variable checks
- Performance metrics (duration)
- Structured logging with correlation IDs

**Request**:
```bash
curl https://staging.huntaze.com/api/test-env
```

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "correlationId": "550e8400-e29b-41d4-a716-446655440002",
  "env": {
    "nodeEnv": "production",
    "hasNextAuthSecret": true,
    "nextAuthSecretLength": 64,
    "hasNextAuthUrl": true,
    "nextAuthUrl": "https://staging.huntaze.com",
    "hasDatabaseUrl": true
  },
  "duration": 15
}
```

**Headers**:
- `X-Correlation-ID`: Unique identifier for request tracing
- `Cache-Control`: no-store, no-cache, must-revalidate

---

## Structured Logging

All diagnostic routes use the centralized logger utility (`lib/utils/logger.ts`) which provides:

### Log Format

```json
{
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "ping-api",
  "level": "info",
  "message": "Ping route accessed",
  "metadata": {
    "runtime": "lambda",
    "nodeVersion": "v18.17.0"
  }
}
```

### Log Levels

- `info`: Normal operation logs
- `warn`: Warning conditions (e.g., missing env vars)
- `error`: Error conditions with stack traces

### Correlation IDs

Every request generates a unique correlation ID that:
- Is included in the response JSON
- Is returned in the `X-Correlation-ID` header
- Is logged with every log entry
- Can be used to trace requests across CloudWatch logs

---

## Testing

### Local Testing

Run the test script locally:

```bash
# Start the dev server first
npm run dev

# In another terminal, run the tests
./scripts/test-diagnostic-routes.sh
```

### Staging Testing

Test on staging environment:

```bash
./scripts/test-diagnostic-routes.sh staging
```

### Manual Testing

Test individual routes:

```bash
# Test ping
curl -i https://staging.huntaze.com/api/ping

# Test health check
curl -i https://staging.huntaze.com/api/health-check

# Test environment
curl -i https://staging.huntaze.com/api/test-env
```

---

## CloudWatch Log Queries

### Find logs by correlation ID

```
fields @timestamp, @message
| filter @message like /550e8400-e29b-41d4-a716-446655440000/
| sort @timestamp desc
```

### Find all diagnostic route logs

```
fields @timestamp, @message
| filter @message like /ping-api|health-check-api|test-env-api/
| sort @timestamp desc
| limit 100
```

### Find errors in diagnostic routes

```
fields @timestamp, @message
| filter @message like /ping-api|health-check-api|test-env-api/
| filter @message like /error/i
| sort @timestamp desc
```

---

## Middleware Bypass

The middleware has been updated to bypass rate limiting for diagnostic and auth routes:

```typescript
// Skip rate limiting for diagnostic routes and auth routes
if (pathname.startsWith('/api/ping') || 
    pathname.startsWith('/api/health-check') || 
    pathname.startsWith('/api/auth/')) {
  logger.info('Bypassing rate limit for diagnostic/auth route', {
    pathname,
    reason: pathname.startsWith('/api/auth/') ? 'auth-route' : 'diagnostic-route',
  });
  return NextResponse.next();
}
```

This ensures:
- `/api/ping` is never rate limited
- `/api/health-check` is never rate limited
- `/api/auth/*` routes are never rate limited
- All bypasses are logged for debugging

---

## Troubleshooting

### Route returns 500

1. Check CloudWatch logs for the correlation ID
2. Look for error stack traces
3. Verify environment variables are set

### No correlation ID in response

1. Check if the route is being intercepted by middleware
2. Verify the logger is imported correctly
3. Check CloudWatch logs for initialization errors

### Middleware not bypassing routes

1. Verify the middleware matcher configuration
2. Check middleware logs for bypass messages
3. Ensure pathname matching is correct

---

## Next Steps

After verifying these diagnostic routes work on staging:

1. ✅ Confirm `/api/ping` returns 200
2. ✅ Confirm `/api/health-check` returns 200
3. ✅ Confirm `/api/test-env` returns 200
4. ✅ Verify correlation IDs in CloudWatch logs
5. Move to Phase 2: NextAuth configuration fixes
