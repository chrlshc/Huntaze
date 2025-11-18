# fix: Add oauth_accounts table and standardize Instagram API

## Critical Fix

Fixed Instagram publish API error: `relation "oauth_accounts" does not exist`

## Changes

### Database Schema (Prisma)
- ✅ Added `OAuthAccount` model for social media integrations
- ✅ Support for Instagram, TikTok, Reddit, OnlyFans
- ✅ Token management with auto-refresh capability
- ✅ Flexible metadata storage (JSONB)
- ✅ Optimized indexes for performance

### Migration
- ✅ Created migration: `20241117_add_oauth_accounts`
- ✅ Table creation with constraints
- ✅ Unique index on provider + account ID
- ✅ Foreign key to users table with CASCADE delete

### Instagram API Standardization
- ✅ Standardized response format (`successResponse`)
- ✅ Structured error handling (`createApiError`)
- ✅ Zod validation schema
- ✅ Auth & rate-limit middleware
- ✅ Structured logging
- ✅ Support for IMAGE, VIDEO, CAROUSEL

## Files Modified

1. `prisma/schema.prisma` - Added OAuthAccount model
2. `prisma/migrations/20241117_add_oauth_accounts/migration.sql` - Migration
3. `app/api/instagram/publish/route.ts` - Complete refactor

## Testing

```bash
# Generate Prisma client
npx prisma generate

# Run migration
npx prisma migrate deploy

# Test API
curl -X POST "http://localhost:3000/api/instagram/publish" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"mediaType":"IMAGE","mediaUrl":"https://example.com/image.jpg"}'
```

## Impact

### Before
- Instagram API: ❌ Database error
- Response format: Non-standard
- Error handling: Basic
- Validation: Manual

### After
- Instagram API: ✅ Functional
- Response format: ✅ Standardized (100%)
- Error handling: ✅ Structured with error codes
- Validation: ✅ Zod schema

## Breaking Changes

None. This is a fix that adds missing functionality.

## Migration Required

Yes - Database migration required:
```bash
npx prisma migrate deploy
```

## Related

- Part of API standardization effort
- Fixes critical Instagram publishing blocker
- Enables multi-provider OAuth support

---

**Type:** fix  
**Scope:** api, database  
**Priority:** Critical  
**Date:** November 17, 2024
