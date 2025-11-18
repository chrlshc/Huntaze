# GET /api/integrations/status

Get all connected integrations for the authenticated user with their current status.

## Authentication

**Required**: Yes - Uses NextAuth session-based authentication

## Rate Limiting

- **Limit**: 60 requests per minute per user
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Request

### HTTP Method
```
GET /api/integrations/status
```

### Headers
```
Cookie: next-auth.session-token=<session-token>
```

### Query Parameters
None

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "integrations": [
      {
        "id": 1,
        "provider": "instagram",
        "accountId": "123456789",
        "accountName": "@creator_account",
        "status": "connected",
        "expiresAt": "2025-12-31T23:59:59.000Z",
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-15T12:00:00.000Z"
      },
      {
        "id": 2,
        "provider": "tiktok",
        "accountId": "987654321",
        "accountName": "@tiktok_creator",
        "status": "expired",
        "expiresAt": "2025-01-01T00:00:00.000Z",
        "createdAt": "2024-12-01T00:00:00.000Z",
        "updatedAt": "2024-12-15T12:00:00.000Z"
      }
    ]
  },
  "duration": 45
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` for successful responses |
| `data.integrations` | array | Array of integration objects |
| `data.integrations[].id` | number | Unique integration ID |
| `data.integrations[].provider` | string | Platform name (`instagram`, `tiktok`, `reddit`, `onlyfans`) |
| `data.integrations[].accountId` | string | Platform-specific account ID |
| `data.integrations[].accountName` | string | Display name for the account |
| `data.integrations[].status` | string | Connection status (`connected` or `expired`) |
| `data.integrations[].expiresAt` | string\|null | ISO 8601 timestamp when token expires, or `null` if no expiry |
| `data.integrations[].createdAt` | string | ISO 8601 timestamp when integration was created |
| `data.integrations[].updatedAt` | string | ISO 8601 timestamp when integration was last updated |
| `duration` | number | Request processing time in milliseconds |

### Status Values

- **`connected`**: Integration is active and token is valid
- **`expired`**: Integration token has expired and needs to be refreshed

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "INVALID_USER_ID",
    "message": "Invalid user ID"
  },
  "duration": 5
}
```

#### 429 Too Many Requests
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later."
  }
}
```

**Headers**:
- `Retry-After`: Number of seconds to wait before retrying

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to fetch integrations"
  },
  "duration": 1250
}
```

**Headers**:
- `Retry-After`: `60` (seconds)

## Response Headers

All responses include:

| Header | Description | Example |
|--------|-------------|---------|
| `X-Correlation-Id` | Unique request identifier for tracking | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| `X-Duration-Ms` | Request processing time in milliseconds | `45` |
| `Cache-Control` | Cache directives | `private, no-cache, no-store, must-revalidate` |

Error responses also include:
| Header | Description | Example |
|--------|-------------|---------|
| `Retry-After` | Seconds to wait before retrying | `60` |

## Examples

### cURL

```bash
# Get integrations status
curl -X GET https://app.huntaze.com/api/integrations/status \
  -H "Cookie: next-auth.session-token=your-session-token"
```

### JavaScript (fetch)

```javascript
// Get integrations status
const response = await fetch('/api/integrations/status', {
  credentials: 'include', // Important for cookies
});

const data = await response.json();

if (data.success) {
  console.log('Integrations:', data.data.integrations);
  
  // Check for expired integrations
  const expired = data.data.integrations.filter(i => i.status === 'expired');
  if (expired.length > 0) {
    console.log('Expired integrations:', expired);
  }
} else {
  console.error('Error:', data.error);
}
```

### TypeScript

```typescript
interface Integration {
  id: number;
  provider: string;
  accountId: string;
  accountName: string;
  status: 'connected' | 'expired';
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface IntegrationsStatusResponse {
  success: true;
  data: {
    integrations: Integration[];
  };
  duration: number;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
  duration?: number;
}

type ApiResponse = IntegrationsStatusResponse | ErrorResponse;

// Get integrations status
const response = await fetch('/api/integrations/status', {
  credentials: 'include',
});

const data: ApiResponse = await response.json();

if (data.success) {
  // TypeScript knows data.data.integrations exists
  data.data.integrations.forEach(integration => {
    console.log(`${integration.provider}: ${integration.status}`);
  });
}
```

### React Hook

```typescript
import { useState, useEffect } from 'react';

interface Integration {
  id: number;
  provider: string;
  accountId: string;
  accountName: string;
  status: 'connected' | 'expired';
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useIntegrationsStatus() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchIntegrations() {
      try {
        const response = await fetch('/api/integrations/status', {
          credentials: 'include',
        });

        const data = await response.json();

        if (data.success) {
          setIntegrations(data.data.integrations);
        } else {
          setError(data.error.message);
        }
      } catch (err) {
        setError('Failed to fetch integrations');
      } finally {
        setLoading(false);
      }
    }

    fetchIntegrations();
  }, []);

  return { integrations, loading, error };
}

// Usage in component
function IntegrationsPage() {
  const { integrations, loading, error } = useIntegrationsStatus();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Connected Integrations</h1>
      {integrations.map(integration => (
        <div key={integration.id}>
          <h2>{integration.provider}</h2>
          <p>Account: {integration.accountName}</p>
          <p>Status: {integration.status}</p>
          {integration.status === 'expired' && (
            <button>Reconnect</button>
          )}
        </div>
      ))}
    </div>
  );
}
```

## Error Handling

### Retry Strategy

The endpoint implements automatic retry logic for transient errors:

- **Max Retries**: 3 attempts
- **Backoff**: Exponential (100ms, 200ms, 400ms)
- **Retryable Errors**: Connection refused, timeout, network unreachable

### Client-Side Retry

For 500 errors, clients should implement exponential backoff:

```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (response.ok) {
        return response;
      }
      
      if (response.status === 500 && attempt < maxRetries) {
        const retryAfter = response.headers.get('retry-after');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      return response;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

// Usage
const response = await fetchWithRetry('/api/integrations/status', {
  credentials: 'include',
});
```

## Performance

- **Target Response Time**: < 200ms for typical requests
- **Max Response Time**: < 2000ms
- **Concurrent Requests**: Supports high concurrency with connection pooling

## Security

### Authentication
- Requires valid NextAuth session
- Session validated on every request
- No token exposure in response

### Authorization
- Users can only access their own integrations
- Integration IDs are scoped to user

### Data Protection
- Sensitive token data (accessToken, refreshToken) is never exposed
- Only metadata and status information is returned

## Monitoring

### Logging

All requests are logged with:
- Correlation ID for request tracking
- User ID
- Request duration
- Integration count
- Expired integration count

### Metrics

Track these metrics:
- Request count
- Response time (p50, p95, p99)
- Error rate
- Retry count
- Expired integration count

## Related Endpoints

- [POST /api/integrations/connect/:provider](./integrations-connect.md) - Connect new integration
- [DELETE /api/integrations/disconnect/:provider/:accountId](./integrations-disconnect.md) - Disconnect integration
- [POST /api/integrations/refresh/:provider/:accountId](./integrations-refresh.md) - Refresh expired token

## Changelog

### Version 1.0 (2025-01-16)
- Initial implementation
- Added retry logic with exponential backoff
- Added correlation ID tracking
- Added comprehensive logging
- Added TypeScript types

---

**Requirements**: 1.1, 1.2, 3.1, 3.2  
**Spec**: [Integrations Management](.kiro/specs/integrations-management/requirements.md)  
**Last Updated**: 2025-01-16
