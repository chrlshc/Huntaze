# Instagram Publish API

## Overview

The Instagram Publish API allows authenticated users to publish photos, videos, and carousels to their connected Instagram Business accounts.

## Endpoint

```
POST /api/instagram/publish
```

## Authentication

Requires NextAuth session authentication. User must have a connected Instagram Business account.

## Rate Limiting

- **Limit**: 10 requests per minute per user
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- **Response**: 429 Too Many Requests when exceeded

## Request

### Headers

```
Content-Type: application/json
Cookie: next-auth.session-token=<session-token>
```

### Body Schema

```typescript
{
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL',
  mediaUrl?: string,           // Required for IMAGE/VIDEO
  caption?: string,            // Max 2200 characters
  locationId?: string,         // Instagram location ID
  coverUrl?: string,           // Required for VIDEO
  children?: Array<{           // Required for CAROUSEL (2-10 items)
    mediaType: 'IMAGE' | 'VIDEO',
    mediaUrl: string
  }>
}
```

### Validation Rules

- **mediaType**: Must be `IMAGE`, `VIDEO`, or `CAROUSEL`
- **mediaUrl**: Required for `IMAGE` and `VIDEO` types, must be valid URL
- **caption**: Optional, max 2200 characters
- **locationId**: Optional Instagram location ID
- **coverUrl**: Optional for `VIDEO` type, must be valid URL
- **children**: Required for `CAROUSEL` type
  - Must have 2-10 items
  - Each item must have `mediaType` and `mediaUrl`

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "postId": "17841234567890123",
    "platform": "instagram",
    "type": "IMAGE",
    "url": "https://scontent.cdninstagram.com/...",
    "permalink": "https://www.instagram.com/p/ABC123/",
    "timestamp": "2025-11-17T10:00:00+0000",
    "caption": "Check out this amazing photo! #instagram",
    "status": "published",
    "metadata": {
      "userId": "123",
      "accountId": "456",
      "igBusinessId": "17841234567890123"
    }
  },
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed: mediaUrl: Invalid media URL",
    "statusCode": 400,
    "retryable": false
  },
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

## Error Codes

| Code | Status | Description | Retryable |
|------|--------|-------------|-----------|
| `VALIDATION_ERROR` | 400 | Invalid request data | No |
| `UNAUTHORIZED` | 401 | Invalid or expired token | No |
| `FORBIDDEN` | 403 | Permission denied | No |
| `NOT_FOUND` | 404 | Account not connected | No |
| `TIMEOUT_ERROR` | 408 | Processing timeout | Yes |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests | Yes |
| `INTERNAL_ERROR` | 500 | Server error | Yes |
| `NETWORK_ERROR` | 503 | Network error | Yes |

## Examples

### Publish Image

```bash
curl -X POST https://app.huntaze.com/api/instagram/publish \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<token>" \
  -d '{
    "mediaType": "IMAGE",
    "mediaUrl": "https://example.com/photo.jpg",
    "caption": "Beautiful sunset 🌅 #nature #photography"
  }'
```

### Publish Video

```bash
curl -X POST https://app.huntaze.com/api/instagram/publish \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<token>" \
  -d '{
    "mediaType": "VIDEO",
    "mediaUrl": "https://example.com/video.mp4",
    "coverUrl": "https://example.com/thumbnail.jpg",
    "caption": "Check out this video! 🎥"
  }'
```

### Publish Carousel

```bash
curl -X POST https://app.huntaze.com/api/instagram/publish \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<token>" \
  -d '{
    "mediaType": "CAROUSEL",
    "caption": "Swipe to see more! ➡️",
    "children": [
      {
        "mediaType": "IMAGE",
        "mediaUrl": "https://example.com/photo1.jpg"
      },
      {
        "mediaType": "IMAGE",
        "mediaUrl": "https://example.com/photo2.jpg"
      },
      {
        "mediaType": "VIDEO",
        "mediaUrl": "https://example.com/video.mp4"
      }
    ]
  }'
```

### JavaScript/TypeScript

```typescript
async function publishToInstagram(data: {
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL';
  mediaUrl?: string;
  caption?: string;
  children?: Array<{ mediaType: string; mediaUrl: string }>;
}) {
  const response = await fetch('/api/instagram/publish', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important for cookies
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  return await response.json();
}

// Usage
try {
  const result = await publishToInstagram({
    mediaType: 'IMAGE',
    mediaUrl: 'https://example.com/photo.jpg',
    caption: 'Hello Instagram! 👋',
  });
  
  console.log('Published:', result.data.permalink);
} catch (error) {
  console.error('Failed to publish:', error.message);
}
```

## Retry Logic

The API implements automatic retry with exponential backoff for transient errors:

- **Max Retries**: 3 attempts
- **Initial Delay**: 1 second
- **Max Delay**: 10 seconds
- **Backoff Factor**: 2x

Retryable errors include:
- Network timeouts
- Connection errors
- Instagram rate limits
- Temporary service unavailability

## Media Requirements

### Images
- **Format**: JPG, PNG
- **Max Size**: 8 MB
- **Aspect Ratio**: 4:5 to 1.91:1
- **Min Resolution**: 320px width

### Videos
- **Format**: MP4, MOV
- **Max Size**: 100 MB
- **Max Duration**: 60 seconds
- **Aspect Ratio**: 4:5 to 1.91:1
- **Min Resolution**: 720px width
- **Cover Image**: Required (JPG/PNG)

### Carousels
- **Items**: 2-10 media items
- **Mix**: Can combine images and videos
- **Order**: Items appear in array order

## Instagram API Limits

- **Posts per day**: 25 posts per Instagram Business account
- **API calls**: 200 calls per hour per user
- **Media processing**: Up to 5 minutes for videos

## Troubleshooting

### "Instagram account not connected"

**Solution**: Connect Instagram Business account at `/platforms/connect/instagram`

### "Invalid media URL or format"

**Causes**:
- URL not publicly accessible
- Unsupported file format
- File size too large
- Invalid aspect ratio

**Solution**: Verify media meets requirements and URL is accessible

### "Permission denied"

**Causes**:
- Instagram token expired
- Insufficient permissions
- Account not Business account

**Solution**: Reconnect Instagram account with proper permissions

### "Rate limit exceeded"

**Causes**:
- Too many API requests
- Instagram daily post limit reached

**Solution**: Wait and retry, or upgrade Instagram account

### "Media processing timed out"

**Causes**:
- Video file too large
- Slow network connection
- Instagram processing issues

**Solution**: Use smaller video file or retry later

## Best Practices

1. **Validate media before upload**: Check file size, format, and dimensions client-side
2. **Handle errors gracefully**: Show user-friendly messages and retry options
3. **Respect rate limits**: Implement client-side throttling
4. **Use correlation IDs**: Include in error reports for debugging
5. **Monitor publish status**: Check for failed publishes and retry
6. **Cache account status**: Avoid repeated account checks
7. **Optimize media**: Compress images/videos before upload

## Related Endpoints

- `GET /api/instagram/account` - Get Instagram account status
- `POST /api/instagram/disconnect` - Disconnect Instagram account
- `GET /api/platforms/connect/instagram` - Connect Instagram account

## Support

For issues or questions:
- Check [Instagram API documentation](https://developers.facebook.com/docs/instagram-api)
- Review [troubleshooting guide](#troubleshooting)
- Contact support with correlation ID from error response

---

**Last Updated**: November 17, 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready
