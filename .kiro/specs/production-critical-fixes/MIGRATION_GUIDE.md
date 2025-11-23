# Migration Guide: CSRF Token API Simplification

## Overview

This guide helps developers migrate from the old complex CSRF Token API to the new simplified version.

## Breaking Changes

### 1. Response Format Changed

**Old Response**:
```json
{
  "success": true,
  "data": {
    "token": "...",
    "expiresIn": 3600000
  },
  "meta": {
    "timestamp": "...",
    "requestId": "...",
    "duration": 45
  }
}
```

**New Response**:
```json
{
  "token": "..."
}
```

**Migration**:
```typescript
// Old code
const response = await fetch('/api/csrf/token');
const { data } = await response.json();
const token = data.token;

// New code
const response = await fetch('/api/csrf/token');
const { token } = await response.json();
```

### 2. No Authentication Required

**Old Behavior**: Required authenticated session
**New Behavior**: No authentication required

**Migration**: Remove authentication checks before calling the endpoint

```typescript
// Old code - NOT NEEDED ANYMORE
const session = await getSession();
if (!session) {
  // Handle no session
}
const response = await fetch('/api/csrf/token');

// New code - SIMPLIFIED
const response = await fetch('/api/csrf/token');
```

### 3. No Correlation IDs

**Old Behavior**: Returned correlation IDs for tracing
**New Behavior**: No correlation IDs

**Migration**: If you need request tracing, implement it at a higher level (e.g., in a global fetch wrapper)

```typescript
// Old code
const response = await fetch('/api/csrf/token');
const { meta } = await response.json();
console.log('Request ID:', meta.requestId);

// New code - implement your own tracing if needed
const requestId = crypto.randomUUID();
const response = await fetch('/api/csrf/token', {
  headers: { 'X-Request-ID': requestId }
});
console.log('Request ID:', requestId);
```

## Non-Breaking Changes

### 1. Cookie Configuration

The cookie configuration has been improved but remains backward compatible:

- ✅ Same cookie name: `csrf-token`
- ✅ Same expiration: 24 hours
- ✅ Same security flags: HttpOnly, Secure (production), SameSite=Lax
- ✅ Improved domain handling: `.huntaze.com` in production

**No migration needed** - existing code will continue to work.

### 2. Token Format

Tokens remain 64-character hexadecimal strings:

- ✅ Same length: 64 characters
- ✅ Same format: Hexadecimal
- ✅ Same randomness: crypto.randomBytes(32)

**No migration needed** - existing validation code will continue to work.

## Migration Checklist

### Frontend Code

- [ ] Update response parsing to use `{ token }` instead of `{ data: { token } }`
- [ ] Remove authentication checks before calling `/api/csrf/token`
- [ ] Remove correlation ID handling (if used)
- [ ] Test token generation in development
- [ ] Test token generation in production

### Backend Code

- [ ] Verify CSRF middleware still works with new tokens
- [ ] Update any server-side code that calls this endpoint
- [ ] Remove any code that expects the old response format
- [ ] Test CSRF validation with new tokens

### Testing

- [ ] Run unit tests: `npm test csrf`
- [ ] Run integration tests
- [ ] Test in development environment
- [ ] Test in staging environment
- [ ] Test in production environment

## Example Migration

### Before (Old Code)

```typescript
// Frontend - Fetch CSRF token
async function getCsrfToken(): Promise<string> {
  // Check authentication first
  const session = await getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }

  // Fetch token with retry logic
  let retries = 3;
  while (retries > 0) {
    try {
      const response = await fetch('/api/csrf/token');
      const { success, data, meta } = await response.json();
      
      if (!success) {
        throw new Error('Failed to get CSRF token');
      }
      
      console.log('Request ID:', meta.requestId);
      console.log('Duration:', meta.duration);
      
      return data.token;
    } catch (error) {
      retries--;
      if (retries === 0) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw new Error('Failed after retries');
}

// Use token
const token = await getCsrfToken();
await fetch('/api/some-endpoint', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': token,
  },
  body: JSON.stringify({ data: 'example' }),
});
```

### After (New Code)

```typescript
// Frontend - Fetch CSRF token
async function getCsrfToken(): Promise<string> {
  const response = await fetch('/api/csrf/token');
  
  if (!response.ok) {
    throw new Error('Failed to get CSRF token');
  }
  
  const { token } = await response.json();
  return token;
}

// Use token (same as before)
const token = await getCsrfToken();
await fetch('/api/some-endpoint', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': token,
  },
  body: JSON.stringify({ data: 'example' }),
});
```

**Benefits**:
- ✅ 70% less code
- ✅ No authentication dependency
- ✅ Simpler error handling
- ✅ Faster execution (no retries)

## Rollback Plan

If issues arise, you can rollback by:

1. Revert the commit that changed `app/api/csrf/token/route.ts`
2. Restore the old response format
3. Re-enable authentication checks

**Rollback Command**:
```bash
git revert <commit-hash>
git push origin main
```

## Support

If you encounter issues during migration:

1. Check the [CSRF Token API Documentation](../../app/api/csrf/token/README.md)
2. Review the [CSRF Middleware](../../lib/middleware/csrf.ts)
3. Run the tests: `npm test csrf`
4. Check CloudWatch logs for errors
5. Contact the platform team

## Timeline

- **2024-11-22**: New API deployed to staging
- **2024-11-23**: Migration period begins (both formats supported)
- **2024-11-30**: Old format deprecated
- **2024-12-07**: Old format removed

## FAQ

### Q: Why was the API simplified?

**A**: The old API had unnecessary complexity (authentication, retries, correlation IDs) that wasn't required for CSRF token generation. The new API is simpler, faster, and easier to maintain.

### Q: Will my existing code break?

**A**: Only if you're parsing the old response format. Update your code to use `{ token }` instead of `{ data: { token } }`.

### Q: Do I need to update my CSRF middleware?

**A**: No, the CSRF middleware (`lib/middleware/csrf.ts`) remains unchanged and works with the new tokens.

### Q: What about rate limiting?

**A**: The global rate limiting middleware still applies. No changes needed.

### Q: Can I still use correlation IDs?

**A**: Implement your own correlation ID system at a higher level if needed. The CSRF token endpoint no longer provides them.

### Q: Is the new API more secure?

**A**: Yes, it's equally secure but simpler. Less code = less attack surface.

## Conclusion

The migration is straightforward and should take less than 30 minutes for most codebases. The new API is simpler, faster, and easier to maintain while providing the same security guarantees.

**Status**: ✅ READY FOR MIGRATION
