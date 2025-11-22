# API Best Practices Guide

## Quick Reference for Huntaze API Development

### 1. Error Handling Pattern

```typescript
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  const correlationId = `operation-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const startTime = Date.now();

  try {
    // 1. Validate CSRF (for mutations)
    const csrfValidation = await validateCsrfToken(request);
    if (!csrfValidation.valid) {
      return NextResponse.json({
        success: false,
        error: csrfValidation.error,
        code: 'CSRF_ERROR',
        correlationId,
      }, { status: 403 });
    }

    // 2. Parse and validate request
    const body = await request.json();
    
    // 3. Business logic with retry
    const result = await retryWithBackoff(
      async () => await prisma.operation(),
      correlationId
    );

    // 4. Return success
    return NextResponse.json({
      success: true,
      data: result,
      duration: Date.now() - startTime,
    }, {
      status: 200,
      headers: { 'X-Correlation-Id': correlationId }
    });

  } catch (error: any) {
    logger.error('Operation failed', error, { correlationId });
    return NextResponse.json({
      success: false,
      error: 'Operation failed',
      code: 'INTERNAL_ERROR',
      correlationId,
      retryable: isRetryableError(error),
    }, { status: 500 });
  }
}
```

### 2. Retry Strategy

```typescript
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 100,
  maxDelay: 2000,
  backoffFactor: 2,
};

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  correlationId: string,
  attempt = 1
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (!isRetryableError(error) || attempt >= RETRY_CONFIG.maxRetries) {
      throw error;
    }
    const delay = Math.min(
      RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt - 1),
      RETRY_CONFIG.maxDelay
    );
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(fn, correlationId, attempt + 1);
  }
}
```

### 3. TypeScript Types

```typescript
// Always define request/response types
interface ApiRequestBody {
  field: string;
}

interface ApiSuccessResponse {
  success: true;
  data: ResultData;
  duration: number;
}

interface ApiErrorResponse {
  success: false;
  error: string;
  code: string;
  correlationId: string;
  retryable?: boolean;
}

type ApiResponse = ApiSuccessResponse | ApiErrorResponse;

// Use explicit return types
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  // ...
}
```

### 4. Authentication & Authorization

```typescript
// For protected routes
import { withAuth } from '@/lib/api/middleware/auth';

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const userId = req.user.id; // Guaranteed to exist
  // ...
});

// For public routes with optional auth
const session = await getSession();
if (session?.user?.id) {
  // Authenticated user
}
```

### 5. Caching Pattern

```typescript
import { cacheService } from '@/lib/services/cache.service';

// Check cache first
const cacheKey = `resource:${id}`;
const cached = cacheService.get<ResourceData>(cacheKey);
if (cached) {
  return NextResponse.json({ success: true, data: cached });
}

// Fetch from database
const data = await prisma.resource.findUnique({ where: { id } });

// Cache for 60 seconds
cacheService.set(cacheKey, data, 60);

return NextResponse.json({ success: true, data });
```

### 6. Logging Best Practices

```typescript
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('api-endpoint');

// Info logs
logger.info('Operation started', {
  correlationId,
  userId,
  operation: 'create',
});

// Error logs (with error object)
logger.error('Operation failed', error, {
  correlationId,
  userId,
  duration: Date.now() - startTime,
});

// Warning logs
logger.warn('Validation failed', {
  correlationId,
  field: 'email',
  reason: 'invalid format',
});
```

### 7. Response Headers

```typescript
// Always include these headers
return NextResponse.json(data, {
  status: 200,
  headers: {
    'X-Correlation-Id': correlationId,
    'X-Duration-Ms': duration.toString(),
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    // For errors with retry
    'Retry-After': '60', // seconds
  },
});
```

### 8. OPTIONS Handler

```typescript
export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Allow': 'GET, POST, OPTIONS',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
    },
  });
}
```

### 9. Validation Pattern

```typescript
// Input validation
if (!body.email || typeof body.email !== 'string') {
  return NextResponse.json({
    success: false,
    error: 'Email is required',
    code: 'MISSING_EMAIL',
    correlationId,
  }, { status: 400 });
}

// Format validation
if (!isValidEmail(body.email)) {
  return NextResponse.json({
    success: false,
    error: 'Invalid email format',
    code: 'INVALID_EMAIL',
    correlationId,
  }, { status: 400 });
}
```

### 10. Database Operations

```typescript
// Always use retry for database operations
const user = await retryWithBackoff(
  async () => {
    return await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, name: true },
    });
  },
  correlationId
);

// Handle unique constraint violations
try {
  await prisma.user.create({ data: userData });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return NextResponse.json({
      success: false,
      error: 'User already exists',
      code: 'USER_EXISTS',
      correlationId,
    }, { status: 409 });
  }
  throw error;
}
```

## Common Error Codes

| Code | Status | Description | Retryable |
|------|--------|-------------|-----------|
| `MISSING_FIELD` | 400 | Required field missing | No |
| `INVALID_FORMAT` | 400 | Invalid field format | No |
| `CSRF_ERROR` | 403 | CSRF validation failed | No |
| `UNAUTHORIZED` | 401 | Authentication required | No |
| `NOT_FOUND` | 404 | Resource not found | No |
| `CONFLICT` | 409 | Resource already exists | No |
| `DATABASE_ERROR` | 503 | Database unavailable | Yes |
| `TIMEOUT_ERROR` | 504 | Request timeout | Yes |
| `INTERNAL_ERROR` | 500 | Unexpected error | Yes |

## Performance Targets

- **Response Time (p95):** < 500ms
- **Response Time (p99):** < 1000ms
- **Cache Hit Rate:** > 80%
- **Error Rate:** < 0.1%
- **Timeout Rate:** < 0.01%

## Security Checklist

- [ ] CSRF protection for mutations
- [ ] Input validation (type, format, length)
- [ ] SQL injection protection (use Prisma)
- [ ] XSS protection (no HTML in responses)
- [ ] Rate limiting configured
- [ ] Passwords hashed (bcrypt, 12 rounds)
- [ ] Sensitive data not logged
- [ ] Secure headers set
- [ ] CORS headers configured

## Testing Checklist

- [ ] Success case (200/201)
- [ ] Validation errors (400)
- [ ] Authentication errors (401)
- [ ] CSRF errors (403)
- [ ] Not found (404)
- [ ] Conflict (409)
- [ ] Server errors (500/503/504)
- [ ] Concurrent access
- [ ] Cache behavior
- [ ] Retry logic

## Documentation Checklist

- [ ] JSDoc comments on all functions
- [ ] Request/Response types defined
- [ ] README.md with examples
- [ ] Error codes documented
- [ ] Integration tests written
- [ ] API endpoint listed in api-tests.md

---

**Last Updated:** November 20, 2025  
**Maintainer:** Huntaze Engineering Team
