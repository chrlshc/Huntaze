# API Client - Usage Examples

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [React Components](#react-components)
3. [Error Handling](#error-handling)
4. [Retry Strategies](#retry-strategies)
5. [Caching](#caching)
6. [Authentication](#authentication)
7. [Testing](#testing)

## Basic Usage

### Simple GET Request

```typescript
import { apiClient } from '@/lib/api';

async function fetchUsers() {
  try {
    const response = await apiClient.get('/api/users');
    console.log('Users:', response.data);
  } catch (error) {
    console.error('Failed to fetch users:', error.message);
  }
}
```

### POST Request with Data

```typescript
import { apiClient } from '@/lib/api';

async function createUser(userData) {
  try {
    const response = await apiClient.post('/api/users', userData);
    console.log('Created user:', response.data);
    return response.data;
  } catch (error) {
    if (error.code === 'VALIDATION_ERROR') {
      console.error('Validation failed:', error.details);
    }
    throw error;
  }
}
```

### PUT Request

```typescript
import { apiClient } from '@/lib/api';

async function updateUser(userId, updates) {
  const response = await apiClient.put(`/api/users/${userId}`, updates);
  return response.data;
}
```

### DELETE Request

```typescript
import { apiClient } from '@/lib/api';

async function deleteUser(userId) {
  await apiClient.delete(`/api/users/${userId}`);
  console.log('User deleted successfully');
}
```

## React Components

### Fetch Data on Mount

```typescript
import { useGet } from '@/hooks/useApiClient';

function UserList() {
  const { data, loading, error } = useGet('/api/users', {
    immediate: true,
    cache: true,
    cacheTTL: 60000, // 1 minute
  });

  if (loading) {
    return <div className="spinner">Loading...</div>;
  }

  if (error) {
    return <div className="error">Error: {error.message}</div>;
  }

  return (
    <ul>
      {data?.items.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### Form Submission

```typescript
import { useMutation } from '@/hooks/useApiClient';
import { useState } from 'react';

function CreateUserForm() {
  const [formData, setFormData] = useState({ name: '', email: '' });
  
  const { mutate, loading, error } = useMutation('POST', '/api/users', {
    onSuccess: (data) => {
      console.log('User created:', data);
      setFormData({ name: '', email: '' });
    },
    onError: (error) => {
      console.error('Failed to create user:', error);
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Name"
      />
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create User'}
      </button>
      {error && <div className="error">{error.message}</div>}
    </form>
  );
}
```

### Manual Trigger

```typescript
import { usePost } from '@/hooks/useApiClient';

function SearchUsers() {
  const { data, loading, execute } = usePost('/api/users/search');

  const handleSearch = async (query) => {
    await execute({ body: JSON.stringify({ query }) });
  };

  return (
    <div>
      <input
        type="text"
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search users..."
      />
      {loading && <div>Searching...</div>}
      {data && (
        <ul>
          {data.items.map(user => (
            <li key={user.id}>{user.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## Error Handling

### Structured Error Handling

```typescript
import { apiClient, ErrorCodes } from '@/lib/api';

async function fetchProtectedData() {
  try {
    const response = await apiClient.get('/api/protected');
    return response.data;
  } catch (error) {
    switch (error.code) {
      case ErrorCodes.UNAUTHORIZED:
        // Redirect to login
        window.location.href = '/auth';
        break;
      
      case ErrorCodes.FORBIDDEN:
        // Show permission denied message
        alert('You do not have permission to access this resource');
        break;
      
      case ErrorCodes.NOT_FOUND:
        // Show 404 page
        console.error('Resource not found');
        break;
      
      case ErrorCodes.RATE_LIMIT_EXCEEDED:
        // Show rate limit message
        alert('Too many requests. Please try again later.');
        break;
      
      case ErrorCodes.VALIDATION_ERROR:
        // Show validation errors
        console.error('Validation errors:', error.details);
        break;
      
      default:
        // Show generic error
        console.error('An error occurred:', error.message);
    }
    
    // Log correlation ID for debugging
    console.error('Correlation ID:', error.correlationId);
  }
}
```

### Error Boundary

```typescript
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ApiErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('API Error:', {
      error: error.message,
      correlationId: (error as any).correlationId,
      stack: error.stack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Retry Strategies

### Custom Retry Configuration

```typescript
import { apiClient } from '@/lib/api';

async function fetchWithRetry() {
  const response = await apiClient.get('/api/unreliable-endpoint', {
    retry: {
      maxRetries: 5,
      initialDelay: 500,
      maxDelay: 10000,
      backoffFactor: 2,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    },
  });
  
  return response.data;
}
```

### Conditional Retry

```typescript
import { retryWithBackoff, isRetryableError } from '@/lib/api';

async function fetchWithConditionalRetry() {
  return await retryWithBackoff(
    async () => {
      const response = await fetch('/api/data');
      
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        (error as any).statusCode = response.status;
        throw error;
      }
      
      return response.json();
    },
    {
      maxRetries: 3,
      initialDelay: 100,
    }
  );
}
```

### Retry with Exponential Backoff

```typescript
import { retryWithBackoff } from '@/lib/api';

async function reliableFetch() {
  return await retryWithBackoff(
    async () => {
      const response = await fetch('/api/data');
      if (!response.ok) throw new Error('Request failed');
      return response.json();
    },
    {
      maxRetries: 3,
      initialDelay: 100,    // 100ms
      maxDelay: 5000,       // 5s max
      backoffFactor: 2,     // 100ms, 200ms, 400ms, 800ms...
    }
  );
}
```

## Caching

### Enable Caching

```typescript
import { apiClient } from '@/lib/api';

// Cache for 5 minutes
const response = await apiClient.get('/api/countries', {
  cache: true,
  cacheTTL: 300000,
});
```

### Clear Cache

```typescript
import { clearApiCache, clearCacheEntry } from '@/lib/api';

// Clear all cache
clearApiCache();

// Clear specific entry
clearCacheEntry('/api/users');
```

### Cache Invalidation on Mutation

```typescript
import { apiClient, clearCacheEntry } from '@/lib/api';

async function updateUser(userId, updates) {
  // Update user
  await apiClient.put(`/api/users/${userId}`, updates);
  
  // Invalidate cache
  clearCacheEntry('/api/users');
  clearCacheEntry(`/api/users/${userId}`);
}
```

### Conditional Caching

```typescript
import { apiClient } from '@/lib/api';

async function fetchData(useCache = true) {
  return await apiClient.get('/api/data', {
    cache: useCache,
    cacheTTL: useCache ? 60000 : 0,
  });
}
```

## Authentication

### Authenticated Requests

```typescript
import { apiClient } from '@/lib/api';

// Session cookie is automatically included
const response = await apiClient.get('/api/protected');
```

### Custom Headers

```typescript
import { apiClient } from '@/lib/api';

const response = await apiClient.get('/api/data', {
  headers: {
    'X-Custom-Header': 'value',
  },
});
```

### Handle Unauthorized

```typescript
import { apiClient, ErrorCodes } from '@/lib/api';
import { signOut } from 'next-auth/react';

async function fetchProtectedData() {
  try {
    return await apiClient.get('/api/protected');
  } catch (error) {
    if (error.code === ErrorCodes.UNAUTHORIZED) {
      // Session expired, sign out
      await signOut({ callbackUrl: '/auth' });
    }
    throw error;
  }
}
```

## Testing

### Mock API Client

```typescript
import { vi } from 'vitest';
import { apiClient } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('UserService', () => {
  it('should fetch users', async () => {
    const mockUsers = [{ id: 1, name: 'John' }];
    
    (apiClient.get as any).mockResolvedValue({
      success: true,
      data: mockUsers,
      correlationId: 'test-id',
      timestamp: new Date().toISOString(),
    });

    const users = await fetchUsers();
    
    expect(apiClient.get).toHaveBeenCalledWith('/api/users');
    expect(users).toEqual(mockUsers);
  });
});
```

### Test Error Handling

```typescript
import { vi } from 'vitest';
import { apiClient, ErrorCodes, createApiError } from '@/lib/api';

it('should handle errors', async () => {
  const error = createApiError(
    ErrorCodes.NOT_FOUND,
    'User not found',
    404
  );
  
  (apiClient.get as any).mockRejectedValue(error);

  await expect(fetchUser('123')).rejects.toThrow('User not found');
});
```

### Test Retry Logic

```typescript
import { retryWithBackoff } from '@/lib/api';

it('should retry on failure', async () => {
  const mockFn = vi.fn()
    .mockRejectedValueOnce(new Error('ECONNREFUSED'))
    .mockRejectedValueOnce(new Error('ECONNREFUSED'))
    .mockResolvedValueOnce({ success: true });

  const result = await retryWithBackoff(mockFn, {
    maxRetries: 3,
    initialDelay: 10,
  });

  expect(mockFn).toHaveBeenCalledTimes(3);
  expect(result).toEqual({ success: true });
});
```

## Advanced Patterns

### Parallel Requests

```typescript
import { apiClient } from '@/lib/api';

async function fetchDashboardData() {
  const [users, posts, comments] = await Promise.all([
    apiClient.get('/api/users'),
    apiClient.get('/api/posts'),
    apiClient.get('/api/comments'),
  ]);

  return {
    users: users.data,
    posts: posts.data,
    comments: comments.data,
  };
}
```

### Sequential Requests

```typescript
import { apiClient } from '@/lib/api';

async function createUserWithProfile(userData, profileData) {
  // Create user first
  const userResponse = await apiClient.post('/api/users', userData);
  const userId = userResponse.data.id;

  // Then create profile
  const profileResponse = await apiClient.post(
    `/api/users/${userId}/profile`,
    profileData
  );

  return {
    user: userResponse.data,
    profile: profileResponse.data,
  };
}
```

### Pagination

```typescript
import { apiClient } from '@/lib/api';

async function fetchAllUsers() {
  let page = 1;
  let allUsers = [];
  let hasMore = true;

  while (hasMore) {
    const response = await apiClient.get(`/api/users?page=${page}&perPage=100`);
    
    allUsers = [...allUsers, ...response.data.items];
    hasMore = response.data.pagination.hasNext;
    page++;
  }

  return allUsers;
}
```

### Debounced Search

```typescript
import { usePost } from '@/hooks/useApiClient';
import { useMemo } from 'react';
import debounce from 'lodash/debounce';

function SearchComponent() {
  const { data, loading, execute } = usePost('/api/search');

  const debouncedSearch = useMemo(
    () => debounce((query) => {
      execute({ body: JSON.stringify({ query }) });
    }, 300),
    [execute]
  );

  return (
    <input
      type="text"
      onChange={(e) => debouncedSearch(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

## Best Practices

1. **Always handle errors** - Use try-catch or error callbacks
2. **Use TypeScript types** - Define interfaces for your data
3. **Enable caching for static data** - Reduce server load
4. **Use correlation IDs** - Track requests across systems
5. **Configure appropriate timeouts** - Prevent hanging requests
6. **Test error scenarios** - Mock failures in tests
7. **Use React hooks in components** - Simplify state management
8. **Clear cache on mutations** - Keep data fresh
9. **Log errors with context** - Include correlation IDs
10. **Handle rate limits gracefully** - Show user-friendly messages
