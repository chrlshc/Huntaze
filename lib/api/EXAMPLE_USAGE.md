# API Response Utilities - Example Usage

## Real-World Examples

### Example 1: User Management API

```typescript
// app/api/users/route.ts
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware/auth';
import { ok, badRequest, internalServerError } from '@/lib/api';
import { getCached, invalidateCacheKey } from '@/lib/api';
import { query } from '@/lib/db';
import { z } from 'zod';

// Validation schema
const CreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  role: z.enum(['user', 'admin']),
});

/**
 * GET /api/users - List users with pagination
 */
export const GET = withAuth(async (req) => {
  const startTime = Date.now();
  const correlationId = req.headers.get('X-Correlation-ID') || crypto.randomUUID();
  
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const search = url.searchParams.get('search') || '';
    
    // Validate pagination parameters
    if (limit < 1 || limit > 100) {
      return badRequest('Limit must be between 1 and 100', {
        field: 'limit',
        value: limit,
      }, { correlationId, startTime });
    }
    
    // Use caching for better performance
    const cacheKey = `users:list:${limit}:${offset}:${search}`;
    const result = await getCached(
      cacheKey,
      async () => {
        const countResult = await query(
          'SELECT COUNT(*) as total FROM users WHERE name ILIKE $1',
          [`%${search}%`]
        );
        
        const usersResult = await query(
          'SELECT id, name, email, role, created_at FROM users WHERE name ILIKE $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
          [`%${search}%`, limit, offset]
        );
        
        return {
          users: usersResult.rows,
          total: parseInt(countResult.rows[0].total),
        };
      },
      { ttl: 60, namespace: 'users' } // Cache for 1 minute
    );
    
    return Response.json(
      paginatedResponse(
        result.users,
        result.total,
        limit,
        offset,
        '/api/users',
        { correlationId, startTime }
      )
    );
  } catch (error) {
    console.error('[Users API] Error fetching users:', error);
    return internalServerError('Failed to fetch users', {
      correlationId,
      startTime,
    });
  }
});

/**
 * POST /api/users - Create new user
 */
export const POST = withAuth(async (req) => {
  const startTime = Date.now();
  const correlationId = req.headers.get('X-Correlation-ID') || crypto.randomUUID();
  
  try {
    // Parse and validate request body
    const body = await req.json();
    const validation = CreateUserSchema.safeParse(body);
    
    if (!validation.success) {
      return badRequest('Validation failed', {
        errors: validation.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      }, { correlationId, startTime });
    }
    
    const { name, email, role } = validation.data;
    
    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return conflict('User with this email already exists', {
        field: 'email',
        value: email,
      }, { correlationId, startTime });
    }
    
    // Create user
    const result = await query(
      'INSERT INTO users (name, email, role) VALUES ($1, $2, $3) RETURNING id, name, email, role, created_at',
      [name, email, role]
    );
    
    const user = result.rows[0];
    
    // Invalidate users list cache
    await invalidateCacheKey('users:list:*');
    
    // Return 201 Created
    return created(user, {
      correlationId,
      startTime,
      headers: {
        'Location': `/api/users/${user.id}`,
      },
    });
  } catch (error) {
    console.error('[Users API] Error creating user:', error);
    return internalServerError('Failed to create user', {
      correlationId,
      startTime,
    });
  }
});
```

### Example 2: Analytics API with Caching

```typescript
// app/api/analytics/performance/route.ts
import { NextRequest } from 'next/server';
import { withOnboarding } from '@/lib/api/middleware/auth';
import { ok, badRequest } from '@/lib/api';
import { getCached } from '@/lib/api';
import { z } from 'zod';

const MetricsSchema = z.object({
  metrics: z.record(z.object({
    avg: z.number(),
    min: z.number(),
    max: z.number(),
    count: z.number(),
  })),
  timestamp: z.string().datetime().optional(),
});

/**
 * POST /api/analytics/performance
 * Receives and processes performance metrics
 */
export const POST = withOnboarding(async (req) => {
  const startTime = Date.now();
  const correlationId = req.headers.get('X-Correlation-ID') || crypto.randomUUID();
  
  try {
    const body = await req.json();
    const validation = MetricsSchema.safeParse(body);
    
    if (!validation.success) {
      return badRequest('Invalid metrics format', {
        errors: validation.error.errors,
      }, { correlationId, startTime });
    }
    
    const { metrics, timestamp } = validation.data;
    
    // Process metrics asynchronously
    await publishModuleEvent({
      source: 'analytics',
      type: 'PerformanceMetrics',
      payload: {
        metrics,
        timestamp: timestamp ?? new Date().toISOString(),
        userId: req.user.id,
        correlationId,
      },
    });
    
    return ok({
      received: true,
      metricsCount: Object.keys(metrics).length,
    }, {
      correlationId,
      startTime,
      cache: {
        public: false,
        maxAge: 0, // Don't cache POST responses
      },
    });
  } catch (error) {
    console.error('[Analytics API] Error processing metrics:', error);
    return internalServerError('Failed to process metrics', {
      correlationId,
      startTime,
    });
  }
});

/**
 * GET /api/analytics/performance
 * Retrieves aggregated performance metrics
 */
export const GET = withOnboarding(async (req) => {
  const startTime = Date.now();
  const correlationId = req.headers.get('X-Correlation-ID') || crypto.randomUUID();
  
  try {
    const url = new URL(req.url);
    const period = url.searchParams.get('period') || '24h';
    
    // Cache metrics for 5 minutes
    const metrics = await getCached(
      `analytics:performance:${req.user.id}:${period}`,
      async () => {
        return await fetchPerformanceMetrics(req.user.id, period);
      },
      { ttl: 300, namespace: 'analytics' }
    );
    
    return ok(metrics, {
      correlationId,
      startTime,
      cache: {
        public: false,
        maxAge: 300, // Cache for 5 minutes
        staleWhileRevalidate: 600, // Serve stale for 10 minutes while revalidating
      },
    });
  } catch (error) {
    console.error('[Analytics API] Error fetching metrics:', error);
    return internalServerError('Failed to fetch metrics', {
      correlationId,
      startTime,
    });
  }
});
```

### Example 3: File Upload API

```typescript
// app/api/uploads/route.ts
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware/auth';
import { accepted, badRequest, unprocessableEntity } from '@/lib/api';
import { uploadToS3 } from '@/lib/services/s3Service';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * POST /api/uploads
 * Handles file uploads with validation
 */
export const POST = withAuth(async (req) => {
  const startTime = Date.now();
  const correlationId = req.headers.get('X-Correlation-ID') || crypto.randomUUID();
  
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return badRequest('No file provided', {
        field: 'file',
      }, { correlationId, startTime });
    }
    
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return unprocessableEntity('Invalid file type', {
        field: 'file',
        type: file.type,
        allowed: ALLOWED_TYPES,
      }, { correlationId, startTime });
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return unprocessableEntity('File too large', {
        field: 'file',
        size: file.size,
        maxSize: MAX_FILE_SIZE,
      }, { correlationId, startTime });
    }
    
    // Upload to S3 (async)
    const uploadId = crypto.randomUUID();
    uploadToS3(file, uploadId, req.user.id).catch(error => {
      console.error('[Upload API] S3 upload failed:', error);
    });
    
    // Return 202 Accepted (processing asynchronously)
    return accepted({
      uploadId,
      status: 'processing',
      statusUrl: `/api/uploads/${uploadId}/status`,
    }, {
      correlationId,
      startTime,
      headers: {
        'Location': `/api/uploads/${uploadId}`,
      },
    });
  } catch (error) {
    console.error('[Upload API] Error processing upload:', error);
    return internalServerError('Failed to process upload', {
      correlationId,
      startTime,
    });
  }
});
```

### Example 4: Rate-Limited API

```typescript
// app/api/onlyfans/messaging/send/route.ts
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware/auth';
import { accepted, tooManyRequests, badRequest } from '@/lib/api';
import { checkRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const SendMessageSchema = z.object({
  recipientId: z.string().min(1),
  content: z.string().min(1).max(5000),
  mediaUrls: z.array(z.string().url()).optional(),
});

/**
 * POST /api/onlyfans/messaging/send
 * Sends a message with rate limiting
 */
export const POST = withAuth(async (req) => {
  const startTime = Date.now();
  const correlationId = req.headers.get('X-Correlation-ID') || crypto.randomUUID();
  
  try {
    // Check rate limit (60 requests per minute)
    const rateLimit = await checkRateLimit({
      id: `onlyfans-send:${req.user.id}`,
      limit: 60,
      windowSec: 60,
    });
    
    if (!rateLimit.allowed) {
      return tooManyRequests(60, {
        correlationId,
        startTime,
        headers: {
          'X-RateLimit-Limit': '60',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(Date.now() + 60000).toISOString(),
        },
      });
    }
    
    // Validate request body
    const body = await req.json();
    const validation = SendMessageSchema.safeParse(body);
    
    if (!validation.success) {
      return badRequest('Validation failed', {
        errors: validation.error.errors,
      }, { correlationId, startTime });
    }
    
    const { recipientId, content, mediaUrls } = validation.data;
    
    // Queue message for sending
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await queueMessage({
      messageId,
      userId: req.user.id,
      recipientId,
      content,
      mediaUrls,
    });
    
    // Return 202 Accepted
    return accepted({
      messageId,
      status: 'queued',
      estimatedSendTime: new Date(Date.now() + 6000).toISOString(),
    }, {
      correlationId,
      startTime,
      headers: {
        'X-RateLimit-Limit': '60',
        'X-RateLimit-Remaining': rateLimit.info.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimit.info.reset * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error('[Messaging API] Error sending message:', error);
    return internalServerError('Failed to send message', {
      correlationId,
      startTime,
    });
  }
});
```

### Example 5: Public API with Optional Auth

```typescript
// app/api/content/public/route.ts
import { NextRequest } from 'next/server';
import { withOptionalAuth } from '@/lib/api/middleware/auth';
import { ok } from '@/lib/api';
import { getCached } from '@/lib/api';

/**
 * GET /api/content/public
 * Public endpoint with optional authentication for personalization
 */
export const GET = withOptionalAuth(async (req) => {
  const startTime = Date.now();
  const correlationId = req.headers.get('X-Correlation-ID') || crypto.randomUUID();
  
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category') || 'all';
    
    // Fetch content based on authentication status
    const content = await getCached(
      `content:public:${category}:${req.user?.id || 'anonymous'}`,
      async () => {
        if (req.user) {
          // Personalized content for authenticated users
          return await fetchPersonalizedContent(req.user.id, category);
        } else {
          // Generic content for anonymous users
          return await fetchPublicContent(category);
        }
      },
      { ttl: 300, namespace: 'content' }
    );
    
    return ok(content, {
      correlationId,
      startTime,
      cache: {
        public: !req.user, // Only cache publicly if not authenticated
        maxAge: req.user ? 60 : 300, // Shorter cache for authenticated users
        staleWhileRevalidate: 600,
      },
    });
  } catch (error) {
    console.error('[Content API] Error fetching content:', error);
    return internalServerError('Failed to fetch content', {
      correlationId,
      startTime,
    });
  }
});
```

## Testing Examples

### Unit Tests

```typescript
// tests/unit/api/response.test.ts
import { describe, it, expect } from 'vitest';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  ok,
  badRequest,
  notFound,
} from '@/lib/api';

describe('Response Utilities', () => {
  describe('successResponse', () => {
    it('should create success response with data', () => {
      const data = { id: '123', name: 'Test' };
      const response = successResponse(data);
      
      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.meta.requestId).toBeDefined();
      expect(response.meta.timestamp).toBeDefined();
    });
    
    it('should include correlation ID when provided', () => {
      const response = successResponse({ id: '123' }, {
        correlationId: 'test-123',
      });
      
      expect(response.meta.requestId).toBe('test-123');
    });
    
    it('should calculate duration when startTime provided', () => {
      const startTime = Date.now() - 100;
      const response = successResponse({ id: '123' }, { startTime });
      
      expect(response.meta.duration).toBeGreaterThanOrEqual(100);
    });
  });
  
  describe('errorResponse', () => {
    it('should create error response', () => {
      const response = errorResponse('VALIDATION_ERROR', 'Invalid input');
      
      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('VALIDATION_ERROR');
      expect(response.error?.message).toBe('Invalid input');
      expect(response.error?.retryable).toBe(false);
    });
    
    it('should mark retryable errors correctly', () => {
      const response = errorResponse('RATE_LIMIT_ERROR', 'Too many requests');
      
      expect(response.error?.retryable).toBe(true);
      expect(response.error?.retryAfter).toBe(60);
    });
  });
  
  describe('paginatedResponse', () => {
    it('should create paginated response', () => {
      const items = [{ id: '1' }, { id: '2' }];
      const response = paginatedResponse(items, 100, 20, 0);
      
      expect(response.success).toBe(true);
      expect(response.data).toEqual(items);
      expect(response.pagination.total).toBe(100);
      expect(response.pagination.page).toBe(1);
      expect(response.pagination.totalPages).toBe(5);
      expect(response.pagination.hasMore).toBe(true);
    });
    
    it('should generate navigation links when baseUrl provided', () => {
      const items = [{ id: '1' }];
      const response = paginatedResponse(items, 100, 20, 20, '/api/users');
      
      expect(response.pagination.nextPage).toBe('/api/users?limit=20&offset=40');
      expect(response.pagination.prevPage).toBe('/api/users?limit=20&offset=0');
    });
  });
  
  describe('convenience methods', () => {
    it('should create 200 OK response', async () => {
      const response = ok({ id: '123' });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
    
    it('should create 400 Bad Request response', async () => {
      const response = badRequest('Invalid input');
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('BAD_REQUEST');
    });
    
    it('should create 404 Not Found response', async () => {
      const response = notFound('User');
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.error.message).toContain('User not found');
    });
  });
});
```

### Integration Tests

```typescript
// tests/integration/api/users.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Users API Integration', () => {
  const baseUrl = process.env.TEST_API_URL || 'http://localhost:3000';
  let authToken: string;
  
  beforeAll(async () => {
    // Get auth token
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });
    
    const data = await response.json();
    authToken = data.token;
  });
  
  it('should return paginated users list', async () => {
    const response = await fetch(`${baseUrl}/api/users?limit=10&offset=0`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeInstanceOf(Array);
    expect(data.pagination).toBeDefined();
    expect(data.pagination.total).toBeGreaterThan(0);
    expect(data.meta.requestId).toBeDefined();
    expect(data.meta.duration).toBeGreaterThan(0);
  });
  
  it('should return 400 for invalid pagination', async () => {
    const response = await fetch(`${baseUrl}/api/users?limit=1000`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('BAD_REQUEST');
    expect(data.error.details).toBeDefined();
  });
  
  it('should create user and return 201', async () => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'New User',
        email: `test-${Date.now()}@example.com`,
        role: 'user',
      }),
    });
    
    const data = await response.json();
    
    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.id).toBeDefined();
    expect(response.headers.get('Location')).toContain('/api/users/');
  });
});
```

## Performance Considerations

### 1. Use Caching Effectively

```typescript
// Cache expensive operations
const data = await getCached(
  `expensive:operation:${userId}`,
  async () => await expensiveOperation(userId),
  { ttl: 300 } // 5 minutes
);
```

### 2. Stream Large Responses

```typescript
// For large datasets, consider streaming
export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of fetchDataInChunks()) {
        controller.enqueue(JSON.stringify(chunk) + '\n');
      }
      controller.close();
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
    },
  });
}
```

### 3. Optimize Database Queries

```typescript
// Use indexes and limit results
const result = await query(
  'SELECT id, name FROM users WHERE active = true ORDER BY created_at DESC LIMIT $1 OFFSET $2',
  [limit, offset]
);
```

## Security Best Practices

### 1. Sanitize Error Messages

```typescript
// ❌ Don't expose internal details
return internalServerError(error.message);

// ✅ Use generic messages
return internalServerError('An error occurred');
```

### 2. Validate All Inputs

```typescript
// Always validate with Zod or similar
const validation = schema.safeParse(body);
if (!validation.success) {
  return badRequest('Validation failed', {
    errors: validation.error.errors,
  });
}
```

### 3. Rate Limit Sensitive Endpoints

```typescript
// Protect against abuse
const rateLimit = await checkRateLimit({
  id: `api:${endpoint}:${userId}`,
  limit: 100,
  windowSec: 60,
});

if (!rateLimit.allowed) {
  return tooManyRequests(60);
}
```

---

**Last Updated**: November 17, 2025  
**Version**: 1.0
