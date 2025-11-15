# API Utilities - Quick Start Guide

Standardized API client, error handling, and logging for all Huntaze services.

## 📦 Installation

All utilities are already installed. Just import and use:

```typescript
import { BaseAPIClient, APIErrorHandler, Logger } from '@/lib/api';
```

## 🚀 Quick Start

### 1. Create a Service Client

```typescript
// lib/services/analytics/api-client.ts
import { BaseAPIClient } from '@/lib/api';
import type { AnalyticsOverview, TrendsData } from '@/lib/types/analytics';

export class AnalyticsAPIClient extends BaseAPIClient {
  constructor() {
    super('/api/analytics', 'AnalyticsAPI');
  }

  async getOverview(userId: string, timeRange: string): Promise<AnalyticsOverview> {
    return this.get('/overview', { userId, timeRange });
  }

  async getTrends(userId: string, timeRange: string): Promise<TrendsData> {
    return this.get('/trends', { userId, timeRange });
  }
}

export const analyticsAPI = new AnalyticsAPIClient();
```

### 2. Use in Components

```typescript
// components/analytics/AnalyticsDashboard.tsx
import { analyticsAPI } from '@/lib/services/analytics/api-client';
import { APIErrorHandler } from '@/lib/api';

export function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const overview = await analyticsAPI.getOverview('user_123', '30d');
        setData(overview);
      } catch (err) {
        const apiError = APIErrorHandler.handle(err);
        setError(apiError.userMessage);
      }
    }
    fetchData();
  }, []);

  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>Loading...</div>;

  return <div>{/* Render data */}</div>;
}
```

### 3. Use with SWR (Recommended)

```typescript
// hooks/analytics/useAnalyticsOverview.ts
import useSWR from 'swr';
import { analyticsAPI } from '@/lib/services/analytics/api-client';
import type { AnalyticsOverview, APIError } from '@/lib/api';

export function useAnalyticsOverview(userId: string, timeRange: string) {
  const { data, error, isLoading, mutate } = useSWR<AnalyticsOverview, APIError>(
    `analytics:overview:${userId}:${timeRange}`,
    () => analyticsAPI.getOverview(userId, timeRange),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      refreshInterval: 5 * 60 * 1000, // 5 minutes
    }
  );

  return {
    overview: data,
    isLoading,
    error,
    refresh: mutate,
  };
}
```

## 📚 Features

### ✅ Automatic Retry Logic

```typescript
// Automatically retries failed requests with exponential backoff
const data = await analyticsAPI.getOverview('user_123', '30d');
// - Attempt 1: Immediate
// - Attempt 2: Wait 100ms
// - Attempt 3: Wait 200ms
// - Throws error after 3 attempts
```

### ✅ Timeout Protection

```typescript
// All requests timeout after 10 seconds by default
const data = await analyticsAPI.getOverview('user_123', '30d');

// Custom timeout
const data = await analyticsAPI.get('/overview', 
  { userId: 'user_123' },
  { timeout: 5000 } // 5 seconds
);
```

### ✅ Error Handling

```typescript
try {
  const data = await analyticsAPI.getOverview('user_123', '30d');
} catch (error) {
  const apiError = APIErrorHandler.handle(error);
  
  // User-friendly message
  console.log(apiError.userMessage);
  // "Connection issue. Please check your internet and try again."
  
  // Technical message
  console.log(apiError.message);
  // "fetch failed: ECONNREFUSED"
  
  // Check if retryable
  if (apiError.retryable) {
    // Retry logic
  }
  
  // Correlation ID for debugging
  console.log(apiError.correlationId);
  // "api-1699876543210-k3j5h8m2p"
}
```

### ✅ Structured Logging

```typescript
import { Logger } from '@/lib/api';

const logger = new Logger('MyService');

logger.info('Processing started', { userId: '123', action: 'export' });
// [INFO] [MyService] Processing started
// { userId: '123', action: 'export' }

logger.error('Processing failed', error, { userId: '123' });
// [ERROR] [MyService] Processing failed
// { userId: '123', error: { name: 'Error', message: '...', stack: '...' } }
```

### ✅ Correlation IDs

```typescript
// Automatically generated for each request
const data = await analyticsAPI.getOverview('user_123', '30d');
// X-Correlation-ID: api-1699876543210-k3j5h8m2p

// Custom correlation ID
const data = await analyticsAPI.get('/overview',
  { userId: 'user_123' },
  { correlationId: 'my-custom-id' }
);
```

## 🎯 Error Types

```typescript
enum APIErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',           // Connection issues (retryable)
  API_ERROR = 'API_ERROR',                   // Server errors (retryable)
  VALIDATION_ERROR = 'VALIDATION_ERROR',     // Invalid input (not retryable)
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR', // Not logged in (not retryable)
  PERMISSION_ERROR = 'PERMISSION_ERROR',     // No access (not retryable)
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',       // Resource not found (not retryable)
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',     // Too many requests (retryable)
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',           // Request timeout (retryable)
}
```

## 📝 API Route Example

```typescript
// app/api/analytics/overview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Logger, APIErrorHandler } from '@/lib/api';

export async function GET(request: NextRequest) {
  const logger = new Logger('AnalyticsOverviewAPI');
  const correlationId = request.headers.get('X-Correlation-ID') || `req-${Date.now()}`;
  logger.setCorrelationId(correlationId);

  try {
    logger.info('Request started', {
      url: request.url,
      method: request.method,
    });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const timeRange = searchParams.get('timeRange') || '30d';

    if (!userId) {
      const error = APIErrorHandler.validationError(
        'userId is required',
        { field: 'userId' },
        correlationId
      );
      logger.warn('Validation failed', { error: error.message });
      return NextResponse.json(error, { status: 400 });
    }

    // Fetch data
    const data = await fetchAnalyticsOverview(userId, timeRange);

    logger.info('Request completed', {
      userId,
      timeRange,
      dataPoints: data.length,
    });

    return NextResponse.json(data);
  } catch (error) {
    logger.error('Request failed', error as Error);
    
    const apiError = APIErrorHandler.handle(error, correlationId);
    return NextResponse.json(apiError, {
      status: apiError.statusCode || 500,
    });
  }
}
```

## 🔧 Configuration

### Environment Variables

```bash
# Logging
LOG_LEVEL=INFO  # DEBUG | INFO | WARN | ERROR

# Timeouts (optional, defaults shown)
API_TIMEOUT_MS=10000
API_RETRY_MAX_ATTEMPTS=3
API_RETRY_INITIAL_DELAY=100
API_RETRY_MAX_DELAY=2000
```

### Custom Configuration

```typescript
// lib/services/my-service/api-client.ts
import { BaseAPIClient } from '@/lib/api';

export class MyServiceAPIClient extends BaseAPIClient {
  constructor() {
    super('/api/my-service', 'MyServiceAPI');
  }

  // Override request for custom behavior
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    // Add custom headers
    options.headers = {
      ...options.headers,
      'X-Custom-Header': 'value',
    };

    // Call parent request
    return super.request<T>(endpoint, options);
  }
}
```

## 📊 Monitoring

### Log Levels

```typescript
// Development: DEBUG level (all logs)
// Production: INFO level (info, warn, error)

logger.debug('Detailed debug info');  // Only in development
logger.info('Normal operation');      // Always logged
logger.warn('Warning condition');     // Always logged
logger.error('Error occurred', err);  // Always logged
```

### Correlation IDs

All requests automatically get a correlation ID that can be used to trace requests across services:

```
Client Request → API Route → Service → Database
    ↓              ↓           ↓          ↓
api-123-abc → api-123-abc → api-123-abc → api-123-abc
```

Search logs by correlation ID to see the full request flow.

## 🧪 Testing

### Unit Tests

```typescript
import { BaseAPIClient, APIErrorHandler } from '@/lib/api';

describe('MyServiceAPIClient', () => {
  it('fetches data successfully', async () => {
    const client = new MyServiceAPIClient();
    const data = await client.getData('123');
    expect(data).toBeDefined();
  });

  it('handles errors gracefully', async () => {
    const client = new MyServiceAPIClient();
    
    try {
      await client.getData('invalid');
    } catch (error) {
      const apiError = APIErrorHandler.handle(error);
      expect(apiError.type).toBe('VALIDATION_ERROR');
      expect(apiError.retryable).toBe(false);
    }
  });
});
```

### Integration Tests

```typescript
import { analyticsAPI } from '@/lib/services/analytics/api-client';

describe('Analytics API Integration', () => {
  it('fetches overview data', async () => {
    const data = await analyticsAPI.getOverview('user_123', '30d');
    
    expect(data).toHaveProperty('totalViews');
    expect(data).toHaveProperty('totalEngagement');
    expect(data.totalViews).toBeGreaterThan(0);
  });

  it('retries on network errors', async () => {
    // Mock network failure
    global.fetch = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const data = await analyticsAPI.getOverview('user_123', '30d');
    
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(data).toBeDefined();
  });
});
```

## 🎓 Best Practices

### 1. Always Use Type Safety

```typescript
// ✅ Good
interface UserData {
  id: string;
  name: string;
}

const data = await client.get<UserData>('/user/123');
console.log(data.name); // TypeScript knows this exists

// ❌ Bad
const data = await client.get('/user/123');
console.log(data.name); // No type safety
```

### 2. Handle Errors Properly

```typescript
// ✅ Good
try {
  const data = await client.getData();
  return data;
} catch (error) {
  const apiError = APIErrorHandler.handle(error);
  toast.error(apiError.userMessage);
  logger.error('Failed to fetch data', error as Error);
  throw apiError;
}

// ❌ Bad
try {
  const data = await client.getData();
  return data;
} catch (error) {
  console.log('Error:', error); // Not user-friendly
  throw error; // Not normalized
}
```

### 3. Use SWR for Data Fetching

```typescript
// ✅ Good - Automatic caching, revalidation, deduplication
const { data, error } = useSWR('key', () => client.getData());

// ❌ Bad - Manual state management, no caching
const [data, setData] = useState(null);
useEffect(() => {
  client.getData().then(setData);
}, []);
```

### 4. Add Correlation IDs

```typescript
// ✅ Good - Traceable across services
const correlationId = generateId();
await client.get('/data', {}, { correlationId });

// ❌ Bad - Can't trace request flow
await client.get('/data');
```

### 5. Log Important Events

```typescript
// ✅ Good - Structured logging
logger.info('User action completed', {
  userId: '123',
  action: 'export',
  duration: 234,
});

// ❌ Bad - Unstructured logging
console.log('User 123 exported data in 234ms');
```

## 📖 Examples

See these files for complete examples:

- ✅ `lib/services/revenue/` - Gold standard implementation
- ✅ `lib/services/messages/` - Good structure
- ✅ `lib/services/marketing/` - Good structure
- ✅ `hooks/revenue/` - SWR integration examples

## 🚀 Migration Guide

### Migrating Existing Services

1. **Create API Client**
   ```typescript
   // lib/services/my-service/api-client.ts
   import { BaseAPIClient } from '@/lib/api';
   
   export class MyServiceAPIClient extends BaseAPIClient {
     constructor() {
       super('/api/my-service', 'MyServiceAPI');
     }
     
     async getData(id: string) {
       return this.get(`/data/${id}`);
     }
   }
   
   export const myServiceAPI = new MyServiceAPIClient();
   ```

2. **Update Service Layer**
   ```typescript
   // lib/services/my-service/service.ts
   import { myServiceAPI } from './api-client';
   
   export class MyService {
     async getData(id: string) {
       return myServiceAPI.getData(id);
     }
   }
   ```

3. **Create Hook**
   ```typescript
   // hooks/my-service/useMyData.ts
   import useSWR from 'swr';
   import { myServiceAPI } from '@/lib/services/my-service/api-client';
   
   export function useMyData(id: string) {
     return useSWR(`my-data:${id}`, () => myServiceAPI.getData(id));
   }
   ```

4. **Update Components**
   ```typescript
   // components/MyComponent.tsx
   import { useMyData } from '@/hooks/my-service/useMyData';
   
   export function MyComponent({ id }: { id: string }) {
     const { data, error, isLoading } = useMyData(id);
     
     if (isLoading) return <Loading />;
     if (error) return <Error message={error.userMessage} />;
     
     return <div>{data.name}</div>;
   }
   ```

## 🆘 Troubleshooting

### Request Timeout

```typescript
// Increase timeout for slow endpoints
const data = await client.get('/slow-endpoint', {}, {
  timeout: 30000, // 30 seconds
});
```

### Disable Retry

```typescript
// Disable retry for specific requests
const data = await client.post('/action', data, {
  retryable: false,
});
```

### Debug Logging

```bash
# Enable debug logging
LOG_LEVEL=DEBUG npm run dev
```

### Correlation ID Not Found

```typescript
// Manually set correlation ID
const correlationId = request.headers.get('X-Request-ID');
const data = await client.get('/data', {}, { correlationId });
```

## 📞 Support

For questions or issues:
1. Check existing implementations in `lib/services/revenue/`
2. Review this README
3. Check the main optimization report: `API_INTEGRATION_OPTIMIZATION_REPORT.md`

---

**Last Updated:** 2025-11-13  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
