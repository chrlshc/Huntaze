# Test Environment API

**Endpoint**: `GET /api/test-env`  
**Authentication**: None (Public)  
**Rate Limiting**: None

---

## Overview

Simple diagnostic endpoint to verify API routes are working and environment variables are accessible. Useful for debugging deployment issues and validating configuration.

---

## Request

### HTTP Method
```
GET /api/test-env
```

### Headers
None required

### Query Parameters
None

---

## Response

### Success Response (200 OK)

```typescript
{
  status: 'ok',
  timestamp: string,        // ISO 8601 timestamp
  correlationId: string,    // Request correlation ID
  env: {
    nodeEnv: string,                    // 'development' | 'production' | 'test'
    hasNextAuthSecret: boolean,         // true if NEXTAUTH_SECRET is set
    nextAuthSecretLength: number,       // Length of NEXTAUTH_SECRET
    hasNextAuthUrl: boolean,            // true if NEXTAUTH_URL is set
    nextAuthUrl: string | undefined,    // Value of NEXTAUTH_URL
    hasDatabaseUrl: boolean             // true if DATABASE_URL is set
  },
  duration: number          // Request duration in ms
}
```

### Error Response (500 Internal Server Error)

```typescript
{
  status: 'error',
  timestamp: string,
  correlationId: string,
  error: string,
  duration: number
}
```

---

## Examples

### cURL

```bash
# Basic request
curl https://your-domain.com/api/test-env

# With verbose output
curl -v https://your-domain.com/api/test-env

# Check correlation ID
curl -i https://your-domain.com/api/test-env | grep X-Correlation-Id
```

### JavaScript/TypeScript

```typescript
// Fetch API
const response = await fetch('/api/test-env');
const data = await response.json();

console.log('Environment status:', data.env);
console.log('Correlation ID:', data.correlationId);

// Check if environment is properly configured
if (!data.env.hasNextAuthSecret) {
  console.error('NEXTAUTH_SECRET is missing!');
}
```

### Response Example

```json
{
  "status": "ok",
  "timestamp": "2025-11-14T10:30:45.123Z",
  "correlationId": "test-env-1736159823400-abc123",
  "env": {
    "nodeEnv": "production",
    "hasNextAuthSecret": true,
    "nextAuthSecretLength": 64,
    "hasNextAuthUrl": true,
    "nextAuthUrl": "https://your-domain.com",
    "hasDatabaseUrl": true
  },
  "duration": 5
}
```

---

## Use Cases

### 1. Deployment Verification

After deploying to staging/production, verify the environment is configured:

```bash
#!/bin/bash
# check-deployment.sh

RESPONSE=$(curl -s https://staging.your-domain.com/api/test-env)
STATUS=$(echo $RESPONSE | jq -r '.status')

if [ "$STATUS" = "ok" ]; then
  echo "✅ Deployment successful"
  
  # Check critical env vars
  HAS_SECRET=$(echo $RESPONSE | jq -r '.env.hasNextAuthSecret')
  HAS_URL=$(echo $RESPONSE | jq -r '.env.hasNextAuthUrl')
  HAS_DB=$(echo $RESPONSE | jq -r '.env.hasDatabaseUrl')
  
  if [ "$HAS_SECRET" = "true" ] && [ "$HAS_URL" = "true" ] && [ "$HAS_DB" = "true" ]; then
    echo "✅ All critical environment variables are set"
  else
    echo "❌ Missing critical environment variables"
    exit 1
  fi
else
  echo "❌ Deployment failed"
  exit 1
fi
```

### 2. Health Check Integration

```typescript
// lib/monitoring/health-check.ts

export async function checkEnvironment(): Promise<boolean> {
  try {
    const response = await fetch('/api/test-env');
    const data = await response.json();
    
    if (data.status !== 'ok') return false;
    
    // Verify critical env vars
    return (
      data.env.hasNextAuthSecret &&
      data.env.hasNextAuthUrl &&
      data.env.hasDatabaseUrl
    );
  } catch (error) {
    console.error('Environment check failed:', error);
    return false;
  }
}
```

### 3. Debugging Configuration Issues

```typescript
// Debug helper
async function debugEnvironment() {
  const response = await fetch('/api/test-env');
  const data = await response.json();
  
  console.log('=== Environment Debug ===');
  console.log('Status:', data.status);
  console.log('Node Environment:', data.env.nodeEnv);
  console.log('Correlation ID:', data.correlationId);
  console.log('Duration:', data.duration, 'ms');
  
  console.log('\n=== Configuration ===');
  console.log('NEXTAUTH_SECRET:', data.env.hasNextAuthSecret ? '✅ Set' : '❌ Missing');
  console.log('NEXTAUTH_URL:', data.env.nextAuthUrl || '❌ Missing');
  console.log('DATABASE_URL:', data.env.hasDatabaseUrl ? '✅ Set' : '❌ Missing');
  
  if (data.env.hasNextAuthSecret) {
    console.log('Secret length:', data.env.nextAuthSecretLength, 'characters');
  }
}
```

---

## Response Headers

| Header | Value | Description |
|--------|-------|-------------|
| `Content-Type` | `application/json` | Response format |
| `Cache-Control` | `no-store, no-cache, must-revalidate` | Prevent caching |
| `X-Correlation-Id` | `test-env-{timestamp}-{random}` | Request correlation ID |

---

## Error Handling

### Common Errors

**500 Internal Server Error**
- Server-side error occurred
- Check logs with correlation ID
- Verify server configuration

### Error Response Example

```json
{
  "status": "error",
  "timestamp": "2025-11-14T10:30:45.123Z",
  "correlationId": "test-env-1736159823400-abc123",
  "error": "Failed to read environment variables",
  "duration": 3
}
```

---

## Logging

All requests are logged with correlation IDs for tracing:

```
[2025-11-14T10:30:45.123Z] [TestEnv] [test-env-1736159823400-abc123] Test environment request received {
  url: 'https://your-domain.com/api/test-env',
  method: 'GET'
}

[2025-11-14T10:30:45.128Z] [TestEnv] [test-env-1736159823400-abc123] Test environment request successful {
  duration: 5,
  missingVars: 0
}
```

---

## Security Considerations

### ⚠️ Important

This endpoint exposes environment configuration information. While it doesn't expose sensitive values directly, it reveals:
- Whether critical environment variables are set
- The NEXTAUTH_URL value
- The length of secrets

**Recommendations:**
1. **Production**: Consider removing or protecting this endpoint
2. **Staging**: Safe to use for debugging
3. **Development**: Useful for local testing

### Protecting in Production

```typescript
// middleware.ts or route.ts
export async function GET(request: NextRequest) {
  // Only allow in non-production environments
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 404 }
    );
  }
  
  // ... rest of handler
}
```

---

## Performance

- **Average Response Time**: < 10ms
- **No Database Queries**: Pure environment check
- **No External API Calls**: Local only
- **No Caching**: Always fresh data

---

## Troubleshooting

### Issue: Returns 404

**Cause**: Route not deployed or Next.js not recognizing the route

**Solution**:
```bash
# Rebuild the application
npm run build

# Verify route exists
ls -la app/api/test-env/route.ts
```

### Issue: Missing Environment Variables

**Cause**: Environment variables not set in deployment

**Solution**:
```bash
# Check Amplify environment variables
aws amplify get-app --app-id YOUR_APP_ID

# Or check locally
echo $NEXTAUTH_SECRET
echo $NEXTAUTH_URL
echo $DATABASE_URL
```

### Issue: Correlation ID Not in Logs

**Cause**: Logging not configured properly

**Solution**: Check that console.log outputs are being captured by your logging service (CloudWatch, etc.)

---

## Related Endpoints

- `GET /api/health` - Full health check with database
- `GET /api/validation/health` - Validation system health

---

## Changelog

### Version 1.0.0 (2025-11-14)
- Initial implementation
- Basic environment variable checking
- Correlation ID support
- Structured logging
- TypeScript types
- Comprehensive documentation

---

**Status**: ✅ Production Ready  
**Last Updated**: 2025-11-14  
**Maintainer**: Kiro AI
