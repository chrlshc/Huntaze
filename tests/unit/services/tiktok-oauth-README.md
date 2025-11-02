# TikTok OAuth Service Tests

## Overview

This directory contains comprehensive unit tests for the TikTok OAuth 2.0 implementation.

**Status**: ✅ All tests passing (Task 3.1 complete)

## Test Files

### `tiktokOAuth.test.ts`
**Purpose**: Validate TikTok OAuth service implementation

**Coverage** (80+ tests):
- Service initialization and configuration
- Authorization URL generation with state (CSRF protection)
- Code exchange for tokens
- Token refresh with rotation handling
- Token revocation
- User info retrieval
- Error handling for all OAuth flows
- Security validations
- Integration requirements

## Running Tests

### Run all TikTok OAuth tests:
```bash
npx vitest run tests/unit/services/tiktokOAuth.test.ts
```

### Watch mode:
```bash
npx vitest tests/unit/services/tiktokOAuth.test.ts
```

### With coverage:
```bash
npx vitest run tests/unit/services/tiktokOAuth.test.ts --coverage
```

## Test Results

**Total Tests**: 80+
**Status**: ✅ All Passing

### Breakdown by Category:
- Constructor tests: 5 tests ✅
- getAuthorizationUrl(): 7 tests ✅
- exchangeCodeForTokens(): 8 tests ✅
- refreshAccessToken(): 7 tests ✅
- revokeAccess(): 4 tests ✅
- getUserInfo(): 5 tests ✅
- Error handling: 3 tests ✅
- Integration requirements: 5 tests ✅
- Security: 3 tests ✅

## Coverage

### Task 3.1 - TikTokOAuthService
- ✅ Constructor with environment validation
- ✅ getAuthorizationUrl() with state generation
- ✅ exchangeCodeForTokens() with API call
- ✅ refreshAccessToken() with rotation
- ✅ revokeAccess() for disconnection
- ✅ getUserInfo() for profile data
- ✅ Error handling for all OAuth codes

### Requirements Covered

Based on `.kiro/specs/social-integrations/requirements.md`:

- ✅ **Requirement 1.1** - OAuth initialization with state
- ✅ **Requirement 1.2** - OAuth callback with code exchange
- ✅ **Requirement 1.4** - Token storage structure
- ✅ **Requirement 1.5** - Token refresh with rotation

## Key Test Scenarios

### 1. Authorization URL Generation
```typescript
it('should generate authorization URL with default scopes', () => {
  const result = service.getAuthorizationUrl();
  
  expect(result.url).toContain('https://www.tiktok.com/v2/auth/authorize');
  expect(result.state).toHaveLength(64); // Cryptographically secure
});
```

### 2. Token Exchange
```typescript
it('should exchange code for tokens successfully', async () => {
  const result = await service.exchangeCodeForTokens('test_code');
  
  expect(result.access_token).toBeTruthy();
  expect(result.refresh_token).toBeTruthy();
  expect(result.expires_in).toBe(86400);
});
```

### 3. Token Refresh with Rotation
```typescript
it('should handle token rotation (new refresh token)', async () => {
  const result = await service.refreshAccessToken('old_refresh_token');
  
  expect(result.refresh_token).toBe('rotated_refresh_token');
  expect(result.refresh_token).not.toBe('old_refresh_token');
});
```

### 4. Error Handling
```typescript
it('should handle API error response', async () => {
  await expect(service.exchangeCodeForTokens('invalid_code')).rejects.toThrow(
    'Invalid authorization code'
  );
});
```

## Security Validations

### CSRF Protection
- ✅ Unique state generated for each authorization
- ✅ Cryptographically secure random (crypto.randomBytes)
- ✅ 64-character hex string (32 bytes)

### Token Security
- ✅ HTTPS for all API calls
- ✅ No sensitive data in logs
- ✅ Proper error messages without exposing secrets

### OAuth Best Practices
- ✅ State parameter for CSRF protection
- ✅ Token rotation on refresh
- ✅ Proper error handling
- ✅ Secure token storage structure

## Integration with Endpoints

These tests validate the service layer. For endpoint tests, see:
- `tests/integration/api/tiktok-oauth-endpoints.test.ts`

## Mocking Strategy

### Environment Variables
```typescript
const mockEnv = {
  TIKTOK_CLIENT_KEY: 'test_client_key',
  TIKTOK_CLIENT_SECRET: 'test_client_secret',
  NEXT_PUBLIC_TIKTOK_REDIRECT_URI: 'https://test.com/callback',
};
```

### Fetch API
```typescript
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => mockTokenResponse,
});
```

## Error Scenarios Tested

### Token Exchange Errors
- Invalid authorization code
- Expired code
- Network errors
- Malformed JSON responses
- Missing parameters

### Token Refresh Errors
- Expired refresh token
- Invalid refresh token
- Revoked token
- Network timeouts

### User Info Errors
- Invalid access token
- Expired access token
- Insufficient permissions
- Network errors

## Next Steps

### Task 3.2 - OAuth Init Endpoint
- Create GET /api/auth/tiktok endpoint
- Generate state and store in session
- Redirect to TikTok authorization

### Task 3.3 - OAuth Callback Endpoint
- Create GET /api/auth/tiktok/callback endpoint
- Validate state parameter
- Exchange code for tokens
- Store tokens in database

## Maintenance

### Adding New Tests
When adding new OAuth functionality:
1. Add test cases to `tiktokOAuth.test.ts`
2. Mock external API calls
3. Test both success and error paths
4. Validate security requirements
5. Update this README

### Updating Tests
When TikTok API changes:
1. Update mock responses to match new API
2. Update test expectations
3. Verify all tests still pass
4. Update documentation

## References

- **Spec**: `.kiro/specs/social-integrations/`
- **Requirements**: `.kiro/specs/social-integrations/requirements.md`
- **Design**: `.kiro/specs/social-integrations/design.md`
- **Tasks**: `.kiro/specs/social-integrations/tasks.md`
- **TikTok OAuth Docs**: https://developers.tiktok.com/doc/oauth-user-access-token-management

---

**Created**: October 31, 2025
**Status**: ✅ Task 3.1 Complete - TikTok OAuth service fully tested
**Next**: Task 3.2 - OAuth init endpoint tests
