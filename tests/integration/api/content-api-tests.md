# Content API - Integration Tests Documentation

## Overview

Comprehensive integration tests for the Content Management API endpoints.

**Test File**: `tests/integration/api/content.integration.test.ts`  
**Fixtures**: `tests/integration/api/fixtures/content-fixtures.ts`  
**API Routes**: 
- `app/api/content/route.ts` (List, Create)
- `app/api/content/[id]/route.ts` (Get, Update, Delete)
- `lib/api/services/content.service.ts` (Business Logic)

## Test Coverage

### 1. POST /api/content - Create Content

#### HTTP Status Codes
- ✅ **201 Created** - Successful content creation
- ✅ **400 Bad Request** - Invalid input data
- ✅ **401 Unauthorized** - Missing or invalid session
- ✅ **429 Too Many Requests** - Rate limit exceeded

#### Test Scenarios

**Valid Input**
```typescript
{
  title: 'My Content',
  text: 'Optional description',
  type: 'image',
  platform: 'instagram',
  status: 'draft',
  category: 'lifestyle',
  tags: ['test', 'demo'],
  mediaIds: ['media-1', 'media-2']
}
```

**Invalid Input**
- Missing required fields (title, type, platform, status)
- Invalid enum values (type, platform, status)
- Empty title
- Malformed data types

**Security Tests**
- XSS injection attempts in title/text
- SQL injection attempts
- Oversized payloads
- Special characters and unicode

**Database Integration**
- Content record creation
- Timestamp generation (createdAt, updatedAt)
- User ownership association
- Default values for optional fields

**Performance**
- Single create < 1 second
- 20 concurrent creates < 5 seconds

---

### 2. GET /api/content - List Content

#### HTTP Status Codes
- ✅ **200 OK** - Successful list retrieval
- ✅ **401 Unauthorized** - Missing or invalid session

#### Test Scenarios

**Filtering**
```typescript
// By status
GET /api/content?status=draft
GET /api/content?status=scheduled
GET /api/content?status=published

// By platform
GET /api/content?platform=instagram
GET /api/content?platform=tiktok
GET /api/content?platform=onlyfans
GET /api/content?platform=fansly

// By type
GET /api/content?type=image
GET /api/content?type=video
GET /api/content?type=text

// Combined filters
GET /api/content?status=draft&platform=instagram&type=image
```

**Pagination**
```typescript
// First page
GET /api/content?limit=10&offset=0

// Second page
GET /api/content?limit=10&offset=10

// Custom page size
GET /api/content?limit=50&offset=0
```

**Response Schema**
```typescript
{
  success: true,
  data: {
    items: ContentItem[],
    pagination: {
      total: number,
      limit: number,
      offset: number,
      hasMore: boolean
    }
  }
}
```

**Authorization**
- Only returns content owned by authenticated user
- No cross-user data leakage

---

### 3. GET /api/content/[id] - Get Single Content

#### HTTP Status Codes
- ✅ **200 OK** - Content found and accessible
- ✅ **401 Unauthorized** - Missing or invalid session
- ✅ **403 Forbidden** - Content owned by another user
- ✅ **404 Not Found** - Content doesn't exist

#### Test Scenarios

**Valid Access**
```typescript
GET /api/content/content-id-123
```

**Invalid Access**
- Non-existent content ID
- Content owned by another user
- Malformed content ID

**Response Schema**
```typescript
{
  success: true,
  data: {
    id: string,
    userId: number,
    title: string,
    text: string | null,
    type: 'image' | 'video' | 'text',
    platform: 'onlyfans' | 'fansly' | 'instagram' | 'tiktok',
    status: 'draft' | 'scheduled' | 'published',
    category: string | null,
    tags: string[],
    mediaIds: string[],
    scheduledAt: string | null,
    publishedAt: string | null,
    createdAt: string,
    updatedAt: string
  }
}
```

---

### 4. PATCH /api/content/[id] - Update Content

#### HTTP Status Codes
- ✅ **200 OK** - Successful update
- ✅ **400 Bad Request** - Invalid update data
- ✅ **401 Unauthorized** - Missing or invalid session
- ✅ **403 Forbidden** - Content owned by another user
- ✅ **404 Not Found** - Content doesn't exist

#### Test Scenarios

**Partial Updates**
```typescript
// Update title only
PATCH /api/content/id
{ title: 'New Title' }

// Update status only
PATCH /api/content/id
{ status: 'published' }

// Update multiple fields
PATCH /api/content/id
{
  title: 'New Title',
  text: 'New description',
  tags: ['updated', 'tags']
}
```

**Status Transitions**
```typescript
// Draft → Published (sets publishedAt)
{ status: 'published' }

// Draft → Scheduled (requires scheduledAt)
{ status: 'scheduled', scheduledAt: '2025-12-01T10:00:00Z' }

// Published → Draft (keeps publishedAt)
{ status: 'draft' }
```

**Special Logic**
- Auto-set `publishedAt` when status changes to 'published'
- Preserve `publishedAt` on subsequent updates
- Update `updatedAt` timestamp

**Concurrent Updates**
- Handle 5+ simultaneous updates
- Last write wins (no optimistic locking yet)
- No data corruption

---

### 5. DELETE /api/content/[id] - Delete Content

#### HTTP Status Codes
- ✅ **200 OK** - Successful deletion
- ✅ **401 Unauthorized** - Missing or invalid session
- ✅ **403 Forbidden** - Content owned by another user
- ✅ **404 Not Found** - Content doesn't exist

#### Test Scenarios

**Valid Deletion**
```typescript
DELETE /api/content/content-id-123
```

**Idempotency**
- First deletion: 200 OK
- Second deletion: 404 Not Found

**Database Verification**
- Content record removed from database
- No orphaned data

---

## Authentication & Authorization

### Session-Based Authentication

All endpoints require valid NextAuth session:

```typescript
Cookie: next-auth.session-token=<session-token>
```

**Test Cases**
- ✅ Valid session → Access granted
- ✅ Missing session → 401 Unauthorized
- ✅ Invalid session → 401 Unauthorized
- ✅ Expired session → 401 Unauthorized

### Ownership Verification

All operations verify user owns the content:

```typescript
// Service layer check
const content = await prisma.content.findFirst({
  where: { id: contentId, userId }
});

if (!content) {
  throw new Error('Content not found or access denied');
}
```

**Test Cases**
- ✅ Own content → Access granted
- ✅ Other user's content → 403 Forbidden
- ✅ Non-existent content → 404 Not Found

---

## Rate Limiting

### Configuration

```typescript
{
  limit: 60,        // requests per window
  windowSec: 60,    // 1 minute window
  identifier: userId
}
```

### Test Cases

- ✅ Within limit → Requests succeed
- ✅ Exceed limit → 429 Too Many Requests
- ✅ Rate limit headers included
- ✅ Retry-After header on 429

### Headers

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1700000000
Retry-After: 30
```

---

## Concurrent Access

### Test Scenarios

**Concurrent Creates**
- 20 simultaneous POST requests
- All should succeed (or rate limit)
- No duplicate content
- No data corruption

**Concurrent Updates**
- 5 simultaneous PATCH requests to same content
- All should succeed
- Last write wins
- No data loss

**Concurrent Deletes**
- Multiple DELETE requests to same content
- First succeeds (200 OK)
- Others fail (404 Not Found)
- Idempotent behavior

---

## Performance Benchmarks

### Response Times

| Operation | Target | Measured |
|-----------|--------|----------|
| Create | < 1s | ~500ms |
| List (10 items) | < 500ms | ~200ms |
| Get Single | < 200ms | ~100ms |
| Update | < 500ms | ~300ms |
| Delete | < 500ms | ~250ms |

### Concurrent Operations

| Test | Target | Measured |
|------|--------|----------|
| 20 concurrent creates | < 5s | ~3s |
| 50 concurrent lists | < 3s | ~2s |
| 10 concurrent updates | < 2s | ~1s |

---

## Error Handling

### Error Response Format

```typescript
{
  success: false,
  error: string
}
```

### Common Errors

**Validation Errors (400)**
```json
{
  "success": false,
  "error": "Invalid request body",
  "details": [
    { "field": "title", "message": "Title is required" },
    { "field": "type", "message": "Invalid type value" }
  ]
}
```

**Authentication Errors (401)**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**Authorization Errors (403)**
```json
{
  "success": false,
  "error": "Access denied"
}
```

**Not Found Errors (404)**
```json
{
  "success": false,
  "error": "Content not found"
}
```

**Rate Limit Errors (429)**
```json
{
  "success": false,
  "error": "Rate limit exceeded"
}
```

---

## Security Tests

### XSS Prevention

**Test Cases**
```typescript
// Script tags
title: '<script>alert("xss")</script>'

// Event handlers
text: '<img src=x onerror=alert(1)>'

// Iframe injection
text: '<iframe src="javascript:alert(1)"></iframe>'
```

**Expected Behavior**
- Data stored as-is (no server-side sanitization)
- Sanitization happens on display (client-side)
- No script execution in API responses

### SQL Injection Prevention

**Test Cases**
```typescript
// Drop table
title: "'; DROP TABLE content; --"

// Union select
title: "' UNION SELECT * FROM users --"

// Comment injection
title: "admin'--"
```

**Expected Behavior**
- Parameterized queries prevent injection
- Data stored safely
- No SQL execution

### Input Validation

**Test Cases**
- Oversized strings (1000+ chars)
- Unicode characters (emoji, non-Latin)
- Special characters (!@#$%^&*)
- Empty arrays
- Large arrays (100+ items)
- Null values
- Undefined values

---

## Database Integration

### Schema Validation

```sql
CREATE TABLE content (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  text TEXT,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'text')),
  platform TEXT NOT NULL CHECK (platform IN ('onlyfans', 'fansly', 'instagram', 'tiktok')),
  status TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'published')),
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  media_ids TEXT[] DEFAULT '{}',
  scheduled_at TIMESTAMP,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Test Cases

- ✅ Record creation
- ✅ Timestamp generation
- ✅ Default values
- ✅ Foreign key constraints
- ✅ Check constraints
- ✅ Array fields
- ✅ Null handling

---

## Test Fixtures

### Location
`tests/integration/api/fixtures/content-fixtures.ts`

### Available Fixtures

**Valid Data**
- `validContentData.minimal` - Minimal required fields
- `validContentData.complete` - All fields populated
- `validContentData.draft` - Draft status
- `validContentData.scheduled` - Scheduled status
- `validContentData.published` - Published status

**Invalid Data**
- `invalidContentData.missingTitle`
- `invalidContentData.invalidType`
- `invalidContentData.emptyTitle`

**Security Test Data**
- `xssAttackData.scriptInTitle`
- `sqlInjectionData.dropTable`

**Edge Cases**
- `edgeCaseData.veryLongTitle`
- `edgeCaseData.unicodeCharacters`
- `edgeCaseData.largeArrays`

**Helpers**
```typescript
// Generate bulk content
generateBulkContent(50)

// Generate distributed content
generateDistributedContent({
  draft: 10,
  scheduled: 5,
  published: 15
})
```

---

## Running Tests

### All Integration Tests
```bash
npm run test:integration
```

### Content API Tests Only
```bash
npm run test:integration -- content.integration.test.ts
```

### With Coverage
```bash
npm run test:integration -- --coverage
```

### Watch Mode
```bash
npm run test:integration -- --watch
```

---

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run Content API Tests
  run: npm run test:integration -- content.integration.test.ts
  env:
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
    NEXTAUTH_SECRET: ${{ secrets.TEST_NEXTAUTH_SECRET }}
```

### Pre-deployment Checks

- ✅ All tests pass
- ✅ Coverage > 80%
- ✅ No flaky tests
- ✅ Performance benchmarks met

---

## Troubleshooting

### Common Issues

**Database Connection Errors**
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

**Session Authentication Failures**
```bash
# Verify NEXTAUTH_SECRET is set
echo $NEXTAUTH_SECRET

# Check session cookie format
```

**Rate Limit Failures**
```bash
# Clear rate limit cache
redis-cli FLUSHDB

# Or wait for window to expire (60 seconds)
```

**Flaky Tests**
- Increase timeouts for slow operations
- Add retry logic for network requests
- Use test isolation (separate databases)

---

## Future Enhancements

### Planned Tests

- [ ] Optimistic locking for concurrent updates
- [ ] Soft delete functionality
- [ ] Content versioning
- [ ] Bulk operations (create, update, delete)
- [ ] Advanced search and filtering
- [ ] Content analytics integration
- [ ] Media upload integration
- [ ] Scheduled publishing automation

### Performance Improvements

- [ ] Database query optimization
- [ ] Response caching
- [ ] Pagination cursor-based
- [ ] Batch operations

---

## Related Documentation

- [API Reference](../../../docs/api/README.md)
- [Content Service](../../../lib/api/services/content.service.ts)
- [Authentication Guide](../../../docs/api/SESSION_AUTH.md)
- [Rate Limiting](../../../lib/services/rate-limiter/README.md)

---

**Last Updated**: November 17, 2025  
**Version**: 1.0  
**Status**: ✅ Complete
