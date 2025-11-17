# API Client Documentation

## Overview

The API Client provides a robust, production-ready HTTP client for making API requests with automatic retry, caching, error handling, and request deduplication.

## Features

- ✅ **Automatic Retry** - Exponential backoff for transient failures
- ✅ **Request Caching** - In-memory cache for GET requests
- ✅ **Request Deduplication** - Prevents duplicate in-flight requests
- ✅ **Error Handling** - Structured error responses with correlation IDs
- ✅ **Timeout Support** - Configurable request timeouts
- ✅ **TypeScript Support** - Full type safety
- ✅ **React Hooks** - Easy integration with React components
- ✅ **Performance Logging** - Request duration tracking

## Installation

The API client is already integrated into the project. Import it from:

```typescript
import { apiClient } from '@/lib/api/client/api-client';
import { useApi, useGet, usePost } from '@/hooks/useApiClient';
```

## Basic Usage

### Direct API Client

```typescript
import { apiClient } from '@/lib/api/client/api-client';

// GET request
const response = await apiClient.get('/api/users');
console.log(response.data);

// POST request
const newUser = await apiClient.post('/api/users', {
  name: 'John Doe',
  email: 'john@example.com',
});

// PUT request
const updated = await apiClient.put('/api/users/123', {
  name: 'Jane Doe',
});

// DELETE request
await apiClient.delete('/api/users/123');
```

### React Hooks

```typescript
import { useGet, usePost, useMutation } from '@/hooks/useApiClient';

function UserList() {
  // GET request with automatic loading state
  const { data, loading, error } = useGet('/api/users', {
    immediate: true, // Execute on mount
    cache: true,     // Enable caching
    cacheTTL: 60000, // Cache for 1 minute
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.items.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

function CreateUser() {
  const { mutate, loading, error } = useMutation('POST', '/api/users', {
    onSuccess: (data) => {
      console.log('User created:', data);
    },
    onError: (error) => {
      console.error('Failed to create user:', error);
    },
  });

  const handleSubmit = async (formData) => {
    await mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create User'}
      </button>
      {error && <div className="error">{error.message}</div>}
    </form>
  );
}
```

## Advanced Configuration

### Retry Configuration

```typescript
import { apiClient } from '@/lib/api/client/api-client';

const response = await apiClient.get('/api/data', {
  retry: {
    maxRetries: 5,           // Maximum retry attempts
    initialDelay: 200,       // Initial delay in ms
    maxDelay: 10000,         // Maximum delay in ms
    backoffFactor: 2,        // Exponential backoff factor
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  },
});
```

### Caching

```typescript
// Enable caching for GET requests
const response = await apiClient.get('/api/users', {
  cache: true,
  cacheTTL: 300000, // Cache for 5 minutes
});

// Clear cache manually
import { clearCache, clearCacheEntry } from '@/lib/api/client/api-client';

clearCache(); // Clear all cache
clearCacheEntry('/api/users'); // Clear specific entry
```

### Timeout

```typescript
const response = await apiClient.get('/api/slow-endpoint', {
  timeout: 60000, // 60 seconds
});
```

### Correlation ID Tracking

```typescript
const correlationId = crypto.randomUUID();

const response = await apiClient.post('/api/users', data, {
  correlationId,
});

console.log('Request ID:', response.correlationId);
```

### Custom Headers

```typescript
const response = await apiClient.get('/api/protected', {
  headers: {
    'Authorization': 'Bearer token',
    'X-Custom-Header': 'value',
  },
});
```

## Error Handling

### Structured Errors

All errors follow a consistent structure:

```typescript
interface ApiErrorResponse {
  code: ErrorCode;
  message: string;
  details?: any;
  correlationId: string;
  timestamp: string;
}
```

### Error Codes

```typescript
import { ErrorCodes } from '@/lib/api/utils/errors';

try {
  await apiClient.get('/api/data');
} catch (error) {
  if (error.code === ErrorCodes.UNAUTHORIZED) {
    // Handle unauthorized
  } else if (error.code === ErrorCodes.RATE_LIMIT_EXCEEDED) {
    // Handle rate limit
  } else {
    // Handle other errors
  }
}
```

### Retry Logic

The client automatically retries on:
- Network errors (ECONNREFUSED, ETIMEDOUT, etc.)
- HTTP 408, 429, 500, 502, 503, 504
- Prisma connection timeouts (P2024, P2034)

Non-retryable errors:
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 422 Unprocessable Entity

## Performance Optimization

### Request Deduplication

Multiple identical GET requests made simultaneously will be deduplicated:

```typescript
// Only one actual HTTP request is made
const [response1, response2, response3] = await Promise.all([
  apiClient.get('/api/users'),
  apiClient.get('/api/users'),
  apiClient.get('/api/users'),
]);
```

### Caching Strategy

```typescript
// First request - hits the server
const response1 = await apiClient.get('/api/users', { cache: true });

// Second request - returns cached data
const response2 = await apiClient.get('/api/users', { cache: true });

// After TTL expires - hits the server again
setTimeout(async () => {
  const response3 = await apiClient.get('/api/users', { cache: true });
}, 60000);
```

### Abort Requests

```typescript
const controller = new AbortController();

const promise = apiClient.get('/api/data', {
  signal: controller.signal,
});

// Cancel the request
controller.abort();
```

## Testing

### Mock API Client

```typescript
import { vi } from 'vitest';
import { apiClient } from '@/lib/api/client/api-client';

// Mock the API client
vi.mock('@/lib/api/client/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// In your test
it('should fetch users', async () => {
  const mockUsers = [{ id: 1, name: 'John' }];
  
  (apiClient.get as any).mockResolvedValue({
    success: true,
    data: mockUsers,
    correlationId: 'test-id',
    timestamp: new Date().toISOString(),
  });

  const response = await apiClient.get('/api/users');
  expect(response.data).toEqual(mockUsers);
});
```

### Test Retry Logic

```typescript
it('should retry on network error', async () => {
  const mockFn = vi.fn()
    .mockRejectedValueOnce(new Error('ECONNREFUSED'))
    .mockRejectedValueOnce(new Error('ECONNREFUSED'))
    .mockResolvedValueOnce({ success: true, data: 'success' });

  const result = await retryWithBackoff(mockFn, {
    maxRetries: 3,
    initialDelay: 10,
  });

  expect(mockFn).toHaveBeenCalledTimes(3);
  expect(result).toEqual({ success: true, data: 'success' });
});
```

## Best Practices

### 1. Use TypeScript Types

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

const response = await apiClient.get<User[]>('/api/users');
// response.data is typed as User[]
```

### 2. Handle Errors Gracefully

```typescript
try {
  const response = await apiClient.post('/api/users', data);
  // Handle success
} catch (error) {
  if (error.code === ErrorCodes.VALIDATION_ERROR) {
    // Show validation errors to user
  } else if (error.code === ErrorCodes.RATE_LIMIT_EXCEEDED) {
    // Show rate limit message
  } else {
    // Show generic error
  }
}
```

### 3. Use Correlation IDs

```typescript
const correlationId = crypto.randomUUID();

try {
  await apiClient.post('/api/users', data, { correlationId });
} catch (error) {
  console.error('Request failed:', {
    correlationId: error.correlationId,
    message: error.message,
  });
}
```

### 4. Configure Caching Appropriately

```typescript
// Cache static data
const countries = await apiClient.get('/api/countries', {
  cache: true,
  cacheTTL: 3600000, // 1 hour
});

// Don't cache dynamic data
const notifications = await apiClient.get('/api/notifications', {
  cache: false,
});
```

### 5. Use React Hooks for Components

```typescript
// ✅ Good - uses hook
function UserProfile({ userId }) {
  const { data, loading, error } = useGet(`/api/users/${userId}`, {
    immediate: true,
  });

  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  return <Profile user={data} />;
}

// ❌ Bad - manual state management
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get(`/api/users/${userId}`)
      .then(res => setUser(res.data))
      .finally(() => setLoading(false));
  }, [userId]);

  // ...
}
```

## Troubleshooting

### Request Timeout

```typescript
// Increase timeout for slow endpoints
const response = await apiClient.get('/api/slow-endpoint', {
  timeout: 120000, // 2 minutes
});
```

### Cache Issues

```typescript
// Clear cache if data is stale
import { clearCacheEntry } from '@/lib/api/client/api-client';

clearCacheEntry('/api/users');
```

### Retry Not Working

Check if error is retryable:

```typescript
import { isRetryableError } from '@/lib/api/utils/errors';

if (isRetryableError(error)) {
  // Error will be retried
} else {
  // Error is not retryable
}
```

## Migration Guide

### From fetch to API Client

```typescript
// Before
const response = await fetch('/api/users');
const data = await response.json();

// After
const response = await apiClient.get('/api/users');
const data = response.data;
```

### From axios to API Client

```typescript
// Before
const response = await axios.get('/api/users');
const data = response.data;

// After
const response = await apiClient.get('/api/users');
const data = response.data;
```

## Related Documentation

- [Error Handling Guide](../utils/errors.ts)
- [Response Types](../types/responses.ts)
- [API Middleware](../middleware/README.md)
- [Testing Guide](../../../tests/integration/api/README.md)

## Support

For issues or questions:
1. Check the [troubleshooting section](#troubleshooting)
2. Review the [examples](#basic-usage)
3. Check application logs for correlation IDs
4. Open an issue on GitHub
