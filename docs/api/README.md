# Huntaze API Documentation

## Overview

This directory contains comprehensive API documentation for all Huntaze endpoints.

## API Categories

### Authentication & Onboarding

- **[Onboarding Complete API](./onboarding-complete.md)** - Mark user onboarding as complete
  - `POST /api/onboard/complete`
  - Requires authentication
  - Updates onboarding status and saves user preferences

### User Management

- **Registration** - Create new user account
  - `POST /api/auth/register`
  - See [AUTH_SETUP.md](../AUTH_SETUP.md#post-apiauthregister)

- **Login** - Authenticate existing user
  - `POST /api/auth/[...nextauth]`
  - See [AUTH_SETUP.md](../AUTH_SETUP.md#post-apiauthlogin)

- **Current User** - Get authenticated user details
  - `GET /api/auth/me`
  - See [AUTH_SETUP.md](../AUTH_SETUP.md#get-apiauthme)

### CRM & Fan Management

- **[CRM API Reference](../API_REFERENCE.md)** - Complete CRM API documentation
  - Fan management endpoints
  - Conversation tracking
  - Analytics and reporting
  - Webhook integrations

## Quick Reference

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/[...nextauth]` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |
| POST | `/api/onboard/complete` | Complete onboarding | Yes |

### Response Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

## Authentication

All protected endpoints require authentication via NextAuth v5 session cookies.

**📖 See [Session-Based Authentication Guide](./SESSION_AUTH.md) for complete documentation.**

### Quick Start

Session cookies are automatically managed by NextAuth. No manual token handling required.

```typescript
// Client-side requests automatically include session cookie
const response = await fetch('/api/analytics', {
  credentials: 'include', // Important!
});
```

### Session Cookie

```
Cookie: next-auth.session-token=<session-token>
```

### Getting a Session

1. Register or login via `/api/auth/register` or `/api/auth/[...nextauth]`
2. Session cookie is automatically set
3. Include `credentials: 'include'` in fetch requests

### Example Authenticated Request

```bash
curl -X POST https://app.huntaze.com/api/onboard/complete \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=your-session-token" \
  -d '{"answers": {"platforms": ["instagram"]}}'
```

### Migration from Legacy System

The application has migrated from localStorage tokens to NextAuth sessions.

**📖 See [NextAuth Migration Guide](../NEXTAUTH_MIGRATION_GUIDE.md) for migration details.**

## Rate Limiting

Rate limits vary by endpoint:

- **Authentication endpoints**: 10 requests per minute per IP
- **Onboarding endpoints**: No limit (single-use)
- **CRM endpoints**: 60 requests per minute per user

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common Errors

#### Unauthorized (401)

```json
{
  "error": "Unauthorized"
}
```

**Cause**: Missing or invalid session cookie

**Solution**: Login again to get a fresh session

#### Rate Limit Exceeded (429)

```json
{
  "error": "Rate limit exceeded"
}
```

**Cause**: Too many requests in a short time

**Solution**: Wait before retrying

#### Internal Server Error (500)

```json
{
  "error": "Internal server error"
}
```

**Cause**: Server-side error

**Solution**: Check application logs, retry with exponential backoff

## Data Formats

### Timestamps

All timestamps use ISO 8601 format with UTC timezone:

```json
{
  "created_at": "2025-11-16T10:00:00Z"
}
```

### Monetary Values

All monetary values are in cents (USD):

```json
{
  "amount_cents": 25000  // $250.00
}
```

### IDs

All IDs are strings or integers:

```json
{
  "id": "123",
  "user_id": 456
}
```

## Pagination

Endpoints that return lists support pagination:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

### Query Parameters

- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 20, max: 100)

## Versioning

The API uses URL versioning:

- Current version: v1 (implicit, no version in URL)
- Future versions: `/api/v2/...`

Breaking changes will be introduced in new versions. The current version will be supported for at least 6 months after a new version is released.

## SDKs and Libraries

### JavaScript/TypeScript

```typescript
// Using fetch API
const response = await fetch('/api/onboard/complete', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Important for cookies
  body: JSON.stringify({ answers }),
});

const data = await response.json();
```

### cURL

```bash
curl -X POST https://app.huntaze.com/api/onboard/complete \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=token" \
  -d '{"answers": {"platforms": ["instagram"]}}'
```

## Testing

### Development Environment

```
Base URL: http://localhost:3000/api
```

### Staging Environment

```
Base URL: https://staging.huntaze.com/api
```

### Production Environment

```
Base URL: https://app.huntaze.com/api
```

## Support

For API support:

1. Check the relevant endpoint documentation
2. Review [troubleshooting guides](../BUILD_TROUBLESHOOTING.md)
3. Check application logs
4. Open an issue on GitHub

## Related Documentation

### Authentication
- **[Session-Based Authentication](./SESSION_AUTH.md)** - Complete session auth guide
- **[NextAuth Migration Guide](../NEXTAUTH_MIGRATION_GUIDE.md)** - Migration from legacy system
- **[NextAuth Troubleshooting](../NEXTAUTH_TROUBLESHOOTING.md)** - Common issues and solutions
- [Authentication Flow](../AUTH_FLOW.md) - Complete authentication flow
- [Authentication Setup](../AUTH_SETUP.md) - Auth system setup

### Deployment & Operations
- [Deployment Guide](../DEPLOYMENT_GUIDE.md) - Production deployment
- [Database Migrations](../../migrations/README.md) - Schema changes

## Changelog

### Version 1.0 (November 16, 2025)
- Initial API documentation structure
- Authentication endpoints documented
- Onboarding complete endpoint documented
- CRM API reference linked

---

**Last Updated**: November 16, 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready
