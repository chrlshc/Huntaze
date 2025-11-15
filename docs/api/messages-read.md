# Messages Read API

**Endpoint**: `PATCH /api/messages/[threadId]/read`  
**Authentication**: Required  
**Rate Limit**: 100 requests/minute per user

---

## Overview

Marks a message as read for the authenticated user. This endpoint supports optimistic updates and includes comprehensive error handling.

---

## Request

### Method
```
PATCH /api/messages/[threadId]/read
```

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `threadId` | string (UUID v4) | Yes | The unique identifier of the message to mark as read |

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | Bearer token or session cookie |
| `Content-Type` | No | `application/json` (optional) |

### Example Request

```bash
curl -X PATCH \
  'https://api.huntaze.com/api/messages/550e8400-e29b-41d4-a716-446655440000/read' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json'
```

---

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-123",
    "conversationId": "conv-456",
    "fanId": "fan-789",
    "direction": "in",
    "text": "Hey! How are you?",
    "read": true,
    "createdAt": "2025-11-14T10:30:00.000Z",
    "priceCents": 0,
    "attachments": []
  },
  "correlationId": "msg-read-1736159823400-abc123",
  "timestamp": "2025-11-14T10:30:45.123Z"
}
```

### Response Headers

| Header | Description |
|--------|-------------|
| `X-Correlation-Id` | Unique request identifier for tracing |
| `X-Response-Time` | Request processing time in milliseconds |

---

## Error Responses

### 400 Bad Request - Invalid Thread ID

```json
{
  "success": false,
  "error": "Invalid thread ID format",
  "code": "INVALID_THREAD_ID",
  "correlationId": "msg-read-1736159823400-abc123",
  "timestamp": "2025-11-14T10:30:45.123Z",
  "statusCode": 400
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "error": "Authentication required",
  "code": "UNAUTHORIZED",
  "correlationId": "msg-read-1736159823400-abc123",
  "timestamp": "2025-11-14T10:30:45.123Z",
  "statusCode": 401
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "Message not found or access denied",
  "code": "MESSAGE_NOT_FOUND",
  "correlationId": "msg-read-1736159823400-abc123",
  "timestamp": "2025-11-14T10:30:45.123Z",
  "statusCode": 404
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Failed to update message",
  "code": "DATABASE_ERROR",
  "correlationId": "msg-read-1736159823400-abc123",
  "timestamp": "2025-11-14T10:30:45.123Z",
  "statusCode": 500
}
```

---

## Error Codes

| Code | Status | Description | Retryable |
|------|--------|-------------|-----------|
| `MISSING_THREAD_ID` | 400 | Thread ID parameter is missing | No |
| `INVALID_THREAD_ID` | 400 | Thread ID format is invalid (must be UUID v4) | No |
| `UNAUTHORIZED` | 401 | User is not authenticated | No |
| `MESSAGE_NOT_FOUND` | 404 | Message doesn't exist or user doesn't have access | No |
| `DATABASE_ERROR` | 500 | Database operation failed | Yes |
| `INTERNAL_ERROR` | 500 | Unexpected server error | Yes |

---

## Usage Examples

### JavaScript/TypeScript

```typescript
async function markMessageAsRead(threadId: string): Promise<void> {
  const response = await fetch(`/api/messages/${threadId}/read`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to mark message as read');
  }

  const data = await response.json();
  console.log('Message marked as read:', data.message);
}
```

### React Hook (Optimized)

```typescript
import { useMarkMessageRead } from '@/hooks/messages/useMarkMessageRead';

function MessageComponent({ threadId }: { threadId: string }) {
  const { markAsRead, isMarking, error } = useMarkMessageRead();

  const handleMarkRead = async () => {
    const result = await markAsRead({ threadId });
    
    if (result.success) {
      toast.success('Message marked as read');
    } else {
      toast.error(result.error || 'Failed to mark as read');
    }
  };

  return (
    <button 
      onClick={handleMarkRead}
      disabled={isMarking}
    >
      {isMarking ? 'Marking...' : 'Mark as Read'}
    </button>
  );
}
```

### cURL

```bash
# Mark message as read
curl -X PATCH \
  'https://api.huntaze.com/api/messages/550e8400-e29b-41d4-a716-446655440000/read' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json'
```

---

## Performance

### Benchmarks

| Metric | Target | Typical |
|--------|--------|---------|
| Response Time (p50) | < 50ms | ~30ms |
| Response Time (p95) | < 100ms | ~60ms |
| Response Time (p99) | < 200ms | ~120ms |
| Success Rate | > 99.9% | 99.95% |

### Optimization Features

- ✅ **Optimistic Updates**: Client-side cache updated immediately
- ✅ **Debouncing**: Prevents duplicate requests (500ms)
- ✅ **In-flight Tracking**: Blocks concurrent requests for same message
- ✅ **SWR Integration**: Automatic cache revalidation
- ✅ **Correlation IDs**: Full request tracing
- ✅ **Response Time Headers**: Performance monitoring

---

## Rate Limiting

- **Limit**: 100 requests per minute per user
- **Headers**: 
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

### Rate Limit Exceeded (429)

```json
{
  "success": false,
  "error": "Too many requests. Please wait a moment and try again.",
  "code": "RATE_LIMIT_ERROR",
  "correlationId": "msg-read-1736159823400-abc123",
  "timestamp": "2025-11-14T10:30:45.123Z",
  "statusCode": 429,
  "retryAfter": 30
}
```

---

## Security

### Authentication

- **Required**: Yes
- **Methods**: Bearer token, Session cookie
- **Validation**: User must own the message

### Authorization

- Users can only mark their own messages as read
- Cross-user access is automatically denied (returns 404)

### Input Validation

- Thread ID must be valid UUID v4 format
- Regex: `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`

---

## Monitoring

### Logs

All requests are logged with:
- Correlation ID
- User ID
- Thread ID
- Response time
- Success/failure status

### Metrics

Track these metrics in your monitoring system:
- Request count
- Success rate
- Error rate by code
- Response time percentiles (p50, p95, p99)
- Rate limit hits

### Alerts

Set up alerts for:
- Error rate > 1%
- Response time p95 > 200ms
- Rate limit hits > 10/minute

---

## Best Practices

### Client-Side

1. **Use the provided hook**: `useMarkMessageRead()` handles all optimizations
2. **Handle errors gracefully**: Show user-friendly messages
3. **Implement optimistic updates**: Update UI immediately
4. **Debounce user actions**: Prevent accidental double-clicks
5. **Track correlation IDs**: Include in error reports

### Server-Side

1. **Monitor correlation IDs**: Track requests across services
2. **Set up alerts**: Monitor error rates and response times
3. **Review logs regularly**: Check for patterns in failures
4. **Implement retry logic**: For transient errors (500, 503)
5. **Cache validation results**: Reduce database load

---

## Troubleshooting

### Common Issues

#### "Invalid thread ID format"
- **Cause**: Thread ID is not a valid UUID v4
- **Solution**: Ensure you're passing a valid UUID v4 string

#### "Message not found or access denied"
- **Cause**: Message doesn't exist or user doesn't have access
- **Solution**: Verify the thread ID and user permissions

#### "Failed to update message"
- **Cause**: Database error or service unavailable
- **Solution**: Retry the request after a short delay

### Debug Mode

Enable debug logging:
```typescript
// In your environment
DEBUG=messages:* npm run dev
```

Check correlation ID in response headers:
```typescript
const correlationId = response.headers.get('X-Correlation-Id');
console.log('Request ID:', correlationId);
```

---

## Related Endpoints

- `GET /api/messages` - List all messages
- `GET /api/messages/[threadId]` - Get message details
- `POST /api/messages` - Send a new message
- `DELETE /api/messages/[threadId]` - Delete a message

---

## Changelog

### v1.0.0 (2025-11-14)
- Initial release
- Optimized with correlation IDs
- Added comprehensive error handling
- Implemented rate limiting
- Added performance monitoring

---

**Last Updated**: November 14, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
