# Configuration Tests

## Overview

This directory contains tests for environment variable validation and configuration management.

**Status**: ✅ All tests passing (35/35 unit + 28/28 integration)

## Test Files

### 1. `env-validation.test.ts`
**Purpose**: Validate core environment variables

**Coverage** (existing):
- JWT_SECRET validation
- Database URL validation
- Email configuration
- AWS region configuration

### 2. `oauth-env-validation.test.ts` ⭐ NEW
**Purpose**: Validate OAuth credentials for social media platforms

**Coverage** (35 tests):
- TikTok OAuth configuration (7 tests)
  - TIKTOK_CLIENT_KEY validation
  - TIKTOK_CLIENT_SECRET validation
  - NEXT_PUBLIC_TIKTOK_REDIRECT_URI validation
  - Client key format validation
  - Missing credentials detection
  
- Instagram/Facebook OAuth configuration (8 tests)
  - FACEBOOK_APP_ID validation
  - FACEBOOK_APP_SECRET validation
  - NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI validation
  - App ID format validation (numeric)
  - Missing credentials detection
  
- Reddit OAuth configuration (5 tests)
  - REDDIT_CLIENT_ID validation
  - REDDIT_CLIENT_SECRET validation
  - NEXT_PUBLIC_REDDIT_REDIRECT_URI validation
  - Missing credentials detection
  
- Environment-specific configuration (3 tests)
  - Development vs production redirect URIs
  - HTTP vs HTTPS validation
  
- Redirect URI consistency (2 tests)
  - Callback path structure
  - Domain consistency
  
- Security validation (3 tests)
  - Client-side vs server-side variables
  - Empty string detection
  - Minimum length validation
  
- Complete configuration validation (5 tests)
  - All variables present checks
  - Incomplete configuration detection
  
- .env.example consistency (2 tests)
  - Placeholder values
  - Example redirect URIs

## Integration Tests

### `tests/integration/config/oauth-env-integration.test.ts` ⭐ NEW
**Purpose**: Integration tests for OAuth environment validation functions

**Coverage** (28 tests):
- `ensureTikTokOAuthEnv()` function (7 tests)
- `ensureInstagramOAuthEnv()` function (6 tests)
- `ensureRedditOAuthEnv()` function (6 tests)
- `ensureAllSocialOAuthEnv()` function (6 tests)
- Error message quality (3 tests)

## Running Tests

### Run all config tests:
```bash
npm test -- tests/unit/config/ tests/integration/config/ --run
```

### Run OAuth validation tests only:
```bash
npm test -- tests/unit/config/oauth-env-validation.test.ts --run
npm test -- tests/integration/config/oauth-env-integration.test.ts --run
```

### Watch mode:
```bash
npm test -- tests/unit/config/
```

## Test Results

**Total Tests**: 63
**Status**: ✅ All Passing

### Breakdown:
- `oauth-env-validation.test.ts`: 35 tests ✅
- `oauth-env-integration.test.ts`: 28 tests ✅

## Environment Variables Tested

### TikTok OAuth
```bash
TIKTOK_CLIENT_KEY=your-tiktok-client-key
TIKTOK_CLIENT_SECRET=your-tiktok-client-secret
NEXT_PUBLIC_TIKTOK_REDIRECT_URI=http://localhost:3000/api/auth/tiktok/callback
```

### Instagram/Facebook OAuth
```bash
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/auth/instagram/callback
```

### Reddit OAuth
```bash
REDDIT_CLIENT_ID=your-reddit-client-id
REDDIT_CLIENT_SECRET=your-reddit-client-secret
NEXT_PUBLIC_REDDIT_REDIRECT_URI=http://localhost:3000/api/auth/reddit/callback
```

## Validation Functions

### `ensureTikTokOAuthEnv()`
Validates TikTok OAuth credentials are present.
- Throws in production if missing
- Warns in development if missing

### `ensureInstagramOAuthEnv()`
Validates Instagram/Facebook OAuth credentials are present.
- Throws in production if missing
- Warns in development if missing

### `ensureRedditOAuthEnv()`
Validates Reddit OAuth credentials are present.
- Throws in production if missing
- Warns in development if missing

### `ensureAllSocialOAuthEnv()`
Validates all social media OAuth credentials.
- Aggregates errors from all platforms
- Throws in production with combined error message
- Warns in development

## Usage Example

```typescript
import {
  ensureTikTokOAuthEnv,
  ensureInstagramOAuthEnv,
  ensureRedditOAuthEnv,
  ensureAllSocialOAuthEnv,
} from '@/lib/env';

// Validate specific platform
try {
  ensureTikTokOAuthEnv();
  console.log('TikTok OAuth configured');
} catch (error) {
  console.error('TikTok OAuth not configured:', error.message);
}

// Validate all platforms
try {
  ensureAllSocialOAuthEnv();
  console.log('All social OAuth configured');
} catch (error) {
  console.error('Social OAuth configuration errors:', error.message);
}
```

## Security Best Practices

### ✅ DO:
- Use `NEXT_PUBLIC_` prefix for client-side variables (redirect URIs)
- Keep secrets server-side only (client keys, secrets)
- Use HTTPS redirect URIs in production
- Validate minimum secret length (10+ characters)
- Use placeholder values in `.env.example`

### ❌ DON'T:
- Expose secrets with `NEXT_PUBLIC_` prefix
- Use HTTP redirect URIs in production
- Commit real credentials to git
- Use empty strings for secrets
- Use short secrets (< 10 characters)

## Redirect URI Patterns

All redirect URIs follow this pattern:
```
{protocol}://{domain}/api/auth/{platform}/callback
```

Examples:
- Development: `http://localhost:3000/api/auth/tiktok/callback`
- Production: `https://huntaze.com/api/auth/tiktok/callback`

## Error Messages

### Production Errors
```
Missing TikTok OAuth env vars: TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET
Missing Instagram OAuth env vars: FACEBOOK_APP_ID
Social OAuth configuration errors:
Missing TikTok OAuth env vars: TIKTOK_CLIENT_KEY
Missing Instagram OAuth env vars: FACEBOOK_APP_ID
```

### Development Warnings
```
Missing TikTok OAuth env vars (dev): TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET
Missing Instagram OAuth env vars (dev): FACEBOOK_APP_ID
```

## Validation Rules

### TikTok Client Key
- Format: Starts with `aw` followed by alphanumeric characters
- Example: `awabcdefghijklmnop`

### Facebook App ID
- Format: Numeric only
- Example: `123456789012345`

### Redirect URIs
- Must start with `http://` or `https://`
- Must end with `/api/auth/{platform}/callback`
- Must include domain
- Should use HTTPS in production

## Test Coverage

### Unit Tests Coverage:
- ✅ Variable presence validation
- ✅ Format validation
- ✅ Missing credentials detection
- ✅ Environment-specific behavior
- ✅ Security validation
- ✅ Consistency checks

### Integration Tests Coverage:
- ✅ Function behavior in production
- ✅ Function behavior in development
- ✅ Error throwing
- ✅ Warning logging
- ✅ Error message quality
- ✅ Multiple platform validation

## Maintenance

### Adding New Platform:
1. Add environment variables to `.env` and `.env.example`
2. Create validation function in `lib/env.ts`
3. Add unit tests in `oauth-env-validation.test.ts`
4. Add integration tests in `oauth-env-integration.test.ts`
5. Update this README

### Updating Validation Rules:
1. Update validation function in `lib/env.ts`
2. Update corresponding tests
3. Run tests to ensure no regressions
4. Update documentation

## References

- **Environment Variables**: `.env`, `.env.example`
- **Validation Functions**: `lib/env.ts`
- **Unit Tests**: `tests/unit/config/oauth-env-validation.test.ts`
- **Integration Tests**: `tests/integration/config/oauth-env-integration.test.ts`

---

**Created**: October 31, 2025
**Status**: ✅ All tests passing (63/63)
**Coverage**: 100% of OAuth environment variables

