# API Optimization Quick Reference

## 🚀 Quick Start Guide

### 1. Error Handling (30 seconds)

```typescript
// ✅ Use structured errors
try {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(5000),
  });
  
  if (!response.ok) {
    throw { code: `HTTP_${response.status}`, retryable: response.status >= 500 };
  }
} catch (error) {
  if (error.name === 'AbortError') {
    return { error: 'TIMEOUT', retryable: true };
  }
}
```

### 2. Retry with Backoff (1 minute)

```typescript
import { retryWithBackoff } from '@/lib/utils/retry';

const data = await retryWithBackoff(
  () => fetch(url).then(r => r.json()),
  { maxRetries: 3, initialDelay: 1000 }
);
```

### 3. TypeScript Types (1 minute)

```typescript
import { ApiResponse } from '@/types/api';

const response: ApiResponse<User> = await typedFetch<User>('/api/users/123');

if (response.success) {
  console.log(response.data); // Type-safe!
}
```

### 4. Authentication (2 minutes)

```typescript
import { authenticatedFetch } from '@/lib/api/authenticated-fetch';

// Automatically handles token refresh on 401
const response = await authenticatedFetch('/api/protected');
```

### 5. Request Deduplication (1 minute)

```typescript
import { requestDeduplicator } from '@/lib/utils/request-deduplication';

const data = await requestDeduplicator.deduplicate(
  'user-123',
  () => fetchUser('123')
);
```

### 6. SWR Data Fetching (2 minutes)

```typescript
import { useApi } from '@/hooks/useApi';

function UserProfile({ userId }: { userId: string }) {
  const { data, error, isLoading } = useApi<User>(`/api/users/${userId}`);
  
  if (isLoading) return <Skeleton />;
  if (error) return <Error message={error.message} />;
  
  return <div>{data.name}</div>;
}
```

### 7. Debounced Search (2 minutes)

```typescript
import { debounce } from '@/lib/utils/debounce';

const searchApi = debounce(async (query: string) => {
  const results = await fetch(`/api/search?q=${query}`);
  setResults(await results.json());
}, 300);
```

### 8. Structured Logging (1 minute)

```typescript
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('my-service');

logger.info('Operation started', { userId: '123' });
logger.error('Operation failed', error, { context: 'additional-info' });
```

---

## 📋 Common Patterns

### Pattern 1: Fetch with Timeout & Retry

```typescript
const fetchWithRetry = async (url: string) => {
  return retryWithBackoff(
    async () => {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(5000),
      });
      
      if (!response.ok) {
        const error: any = new Error(response.statusText);
        error.status = response.status;
        throw error;
      }
      
      return response.json();
    },
    { maxRetries: 3 }
  );
};
```

### Pattern 2: Authenticated API Call

```typescript
const fetchProtectedData = async () => {
  const token = await tokenManager.getToken();
  
  if (!token) {
    throw new Error('Not authenticated');
  }
  
  return authenticatedFetch('/api/protected', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
};
```

### Pattern 3: Optimistic Updates

```typescript
const { mutate } = useApi<User>('/api/users/123');

const updateUser = async (updates: Partial<User>) => {
  // Optimistic update
  mutate({ ...data, ...updates }, false);
  
  try {
    // Actual API call
    await fetch('/api/users/123', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    
    // Revalidate
    mutate();
  } catch (error) {
    // Rollback on error
    mutate();
  }
};
```

---

## 🔍 Debugging Checklist

### When API Calls Fail

1. **Check Network Tab**
   - Status code?
   - Response body?
   - Request headers?

2. **Check Correlation ID**
   ```typescript
   const correlationId = response.headers.get('X-Correlation-Id');
   console.log('Correlation ID:', correlationId);
   ```

3. **Check Logs**
   ```bash
   # Search logs by correlation ID
   grep "correlation-id-here" logs/*.log
   ```

4. **Check Token**
   ```typescript
   const token = await tokenManager.getToken();
   console.log('Token expired?', tokenManager.isTokenExpired(token));
   ```

5. **Check Retry Logic**
   ```typescript
   retryWithBackoff(
     () => fetch(url),
     { maxRetries: 3 },
     (attempt, error) => {
       console.log(`Retry ${attempt}:`, error);
     }
   );
   ```

---

## ⚡ Performance Tips

### DO ✅

- Use `AbortSignal.timeout()` for all fetch calls
- Implement retry with exponential backoff
- Use SWR for data fetching (automatic caching)
- Debounce search/filter inputs (300ms)
- Deduplicate identical requests
- Add correlation IDs for tracing
- Log errors with context

### DON'T ❌

- Make API calls in loops (use batch endpoints)
- Retry non-retryable errors (4xx)
- Store tokens in localStorage (use httpOnly cookies)
- Ignore timeout errors
- Skip error logging
- Use `Promise.resolve()` for async timers in tests

---

## 🧪 Testing Patterns

### Test Async Operations

```typescript
it('should handle async operations', async () => {
  vi.useFakeTimers();
  
  service.start();
  
  // ✅ Wait for all timers
  await vi.runAllTimersAsync();
  await vi.waitFor(() => expect(callback).toHaveBeenCalled(), {
    timeout: 1000
  });
  
  vi.useRealTimers();
});
```

### Mock API Responses

```typescript
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: async () => ({ data: 'test' }),
});
```

### Test Error Scenarios

```typescript
global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

const result = await fetchData();

expect(result.success).toBe(false);
expect(result.error.retryable).toBe(true);
```

---

## 📚 Quick Links

- [Full Guide](./API_INTEGRATION_OPTIMIZATION.md)
- [Ping Service](../../../lib/services/ping.service.README.md)
- [CSRF Token API](../../../app/api/csrf/token/README.md)
- [Integrations API](../../../lib/services/integrations/API_OPTIMIZATION_GUIDE.md)

---

## 🆘 Common Issues

### Issue: "Token expired"
**Solution**: Token manager automatically refreshes. Check `tokenManager.refreshToken()`.

### Issue: "Request timeout"
**Solution**: Increase timeout or check network. Default is 5s.

### Issue: "Too many retries"
**Solution**: Check if error is retryable. Only retry 5xx and network errors.

### Issue: "Duplicate requests"
**Solution**: Use `requestDeduplicator.deduplicate()`.

### Issue: "Test timers not working"
**Solution**: Use `vi.runAllTimersAsync()` + `vi.waitFor()`.

---

**Last Updated**: 2024-11-23  
**Version**: 1.0.0
