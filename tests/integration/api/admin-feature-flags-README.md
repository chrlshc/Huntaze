# Admin Feature Flags API - Integration Tests

Comprehensive integration tests for the `/api/admin/feature-flags` endpoint.

## Overview

The feature flags API allows administrators to control the rollout of the new Shopify-style onboarding system through:
- Global enable/disable toggle
- Gradual rollout percentage (0-100%)
- Market-specific targeting
- User whitelist for early access

## Test Coverage

### Authentication & Authorization ✅
- Unauthenticated requests (401)
- Invalid tokens (401)
- Malformed Authorization headers (401)
- Non-admin users (403)
- Valid admin authentication (200)

### GET Endpoint ✅
- Successful flag retrieval
- Response schema validation
- Correlation ID tracking
- Performance benchmarks (<500ms)

### POST Endpoint ✅
- Valid updates (enabled, rolloutPercentage, markets, userWhitelist)
- Invalid rolloutPercentage (<0 or >100)
- Empty update requests
- Invalid JSON
- Multiple field updates
- Ignored invalid fields

### Data Validation ✅
- Rollout percentage bounds (0-100)
- Array types for markets and userWhitelist
- Boolean type for enabled flag
- Schema compliance with Zod

### Concurrency ✅
- Multiple simultaneous updates
- Data consistency under load
- No race conditions
- Unique correlation IDs

### Idempotence ✅
- Repeated identical updates
- Consistent final state
- No unintended side effects

### Error Handling ✅
- Structured error responses
- Correlation IDs in errors
- No sensitive data exposure
- Graceful degradation

### Security ✅
- XSS prevention
- Input sanitization
- No password/token leakage
- Malicious header handling

### Performance ✅
- GET requests <500ms
- POST requests <1s
- Concurrent load handling

## Running Tests

### Prerequisites

```bash
# Set up environment variables
export TEST_BASE_URL=http://localhost:3000
export TEST_ADMIN_TOKEN=your-admin-token-here
export TEST_AUTH_TOKEN=your-regular-user-token-here

# Start the development server
npm run dev
```

### Run All Feature Flags Tests

```bash
# Run all tests for this endpoint
npm run test:integration tests/integration/api/admin-feature-flags.test.ts

# Run with coverage
npm run test:integration -- --coverage tests/integration/api/admin-feature-flags.test.ts

# Run in watch mode
npm run test:integration -- --watch tests/integration/api/admin-feature-flags.test.ts
```

### Run Specific Test Suites

```bash
# Authentication tests only
npm run test:integration -- --grep "Authentication"

# Validation tests only
npm run test:integration -- --grep "Request Validation"

# Concurrency tests only
npm run test:integration -- --grep "Concurrent"

# Performance tests only
npm run test:integration -- --grep "Performance"
```

## Test Scenarios

### 1. Happy Path - Get Flags

```typescript
// GET /api/admin/feature-flags
// Expected: 200 OK with current flags
const response = await fetch('/api/admin/feature-flags', {
  headers: { 'Authorization': 'Bearer admin-token' }
})

expect(response.status).toBe(200)
const json = await response.json()
expect(json.flags.enabled).toBeDefined()
expect(json.flags.rolloutPercentage).toBeGreaterThanOrEqual(0)
```

### 2. Happy Path - Update Flags

```typescript
// POST /api/admin/feature-flags
// Expected: 200 OK with updated flags
const response = await fetch('/api/admin/feature-flags', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer admin-token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    enabled: true,
    rolloutPercentage: 50,
    markets: ['FR', 'DE']
  })
})

expect(response.status).toBe(200)
const json = await response.json()
expect(json.success).toBe(true)
expect(json.flags.rolloutPercentage).toBe(50)
```

### 3. Error Path - Invalid Percentage

```typescript
// POST with invalid rolloutPercentage
// Expected: 400 Bad Request
const response = await fetch('/api/admin/feature-flags', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer admin-token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ rolloutPercentage: 150 })
})

expect(response.status).toBe(400)
const json = await response.json()
expect(json.error).toContain('Invalid rolloutPercentage')
```

### 4. Error Path - Unauthorized

```typescript
// Request without authentication
// Expected: 401 Unauthorized
const response = await fetch('/api/admin/feature-flags')
expect([401, 403]).toContain(response.status)
```

### 5. Concurrent Updates

```typescript
// Multiple simultaneous updates
const requests = Array.from({ length: 5 }, (_, i) =>
  fetch('/api/admin/feature-flags', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer admin-token',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ rolloutPercentage: 10 + (i * 10) })
  })
)

const responses = await Promise.all(requests)
responses.forEach(r => expect(r.ok).toBe(true))
```

## Fixtures

Test data is available in `tests/integration/api/fixtures/feature-flags-samples.ts`:

```typescript
import {
  validFeatureFlags,
  disabledFeatureFlags,
  partialRolloutFlags,
  fullRolloutFlags,
  whitelistOnlyFlags,
  validUpdateRequests,
  invalidUpdateRequests,
  concurrentUpdateScenarios
} from './fixtures/feature-flags-samples'
```

### Example Usage

```typescript
import { validUpdateRequests } from './fixtures/feature-flags-samples'

for (const update of validUpdateRequests) {
  const response = await fetch('/api/admin/feature-flags', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer admin-token',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(update)
  })
  
  expect(response.ok).toBe(true)
}
```

## Response Schemas

### GET Response

```typescript
{
  flags: {
    enabled: boolean,
    rolloutPercentage: number, // 0-100
    markets?: string[],
    userWhitelist?: string[]
  },
  correlationId: string // UUID
}
```

### POST Success Response

```typescript
{
  success: true,
  flags: {
    enabled: boolean,
    rolloutPercentage: number, // 0-100
    markets?: string[],
    userWhitelist?: string[]
  },
  correlationId: string // UUID
}
```

### Error Response

```typescript
{
  error: string,
  details?: string,
  message?: string,
  correlationId?: string // UUID
}
```

## Common Issues

### Issue: Tests fail with 401 Unauthorized

**Cause**: Missing or invalid authentication token

**Solution**:
```bash
# Set valid admin token
export TEST_ADMIN_TOKEN=your-valid-admin-token

# Or skip auth tests
npm run test:integration -- --grep -v "Authentication"
```

### Issue: Tests timeout

**Cause**: Server not running or slow response

**Solution**:
```bash
# Ensure server is running
npm run dev

# Increase timeout in vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 10000 // 10 seconds
  }
})
```

### Issue: Concurrent tests fail intermittently

**Cause**: Race conditions or shared state

**Solution**:
- Tests use unique update values to avoid conflicts
- Each test should be independent
- Consider adding delays between concurrent batches

### Issue: Schema validation fails

**Cause**: API response doesn't match expected schema

**Solution**:
```typescript
// Debug the actual response
const json = await response.json()
console.log('Actual response:', JSON.stringify(json, null, 2))

// Check Zod error details
const result = schema.safeParse(json)
if (!result.success) {
  console.error('Schema errors:', result.error.errors)
}
```

## Performance Benchmarks

| Operation | Target | Maximum | Notes |
|-----------|--------|---------|-------|
| GET flags | <200ms | <500ms | First request may be slower |
| POST update | <500ms | <1s | Includes persistence |
| Concurrent (5x) | <1s | <2s | All requests complete |

## Security Considerations

### What We Test

✅ Authentication required  
✅ Admin authorization required  
✅ Input validation (rolloutPercentage bounds)  
✅ XSS prevention  
✅ No sensitive data in errors  
✅ Malicious input sanitization  

### What We Don't Test (Assumed Secure)

- Token generation/validation (handled by auth system)
- CSRF protection (handled by middleware)
- Rate limiting (handled by middleware)
- SQL injection (using parameterized queries)

## Integration with Other Systems

### Feature Flag Consumption

The flags set via this API are consumed by:
- `lib/feature-flags.ts` - `shouldShowOnboarding(userId, market)`
- Onboarding gating middleware
- Client-side feature checks

### Related Tests

- `tests/unit/onboarding/gating-logic.test.ts` - Feature flag logic
- `tests/integration/api/onboarding.test.ts` - Onboarding with flags
- `tests/unit/onboarding/middleware/onboarding-gating.test.ts` - Middleware

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run Feature Flags Tests
  run: |
    npm run test:integration tests/integration/api/admin-feature-flags.test.ts
  env:
    TEST_BASE_URL: http://localhost:3000
    TEST_ADMIN_TOKEN: ${{ secrets.TEST_ADMIN_TOKEN }}
```

### Pre-deployment Validation

```bash
#!/bin/bash
# Validate feature flags API before deployment

echo "Testing feature flags API..."

# Run tests
npm run test:integration tests/integration/api/admin-feature-flags.test.ts

# Verify current flags
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3000/api/admin/feature-flags

echo "✅ Feature flags API validated"
```

## Maintenance

### Regular Tasks

- [ ] Review and update performance benchmarks quarterly
- [ ] Add tests for new flag types when added
- [ ] Update fixtures when flag schema changes
- [ ] Monitor test execution time
- [ ] Review security test coverage

### When to Update Tests

1. **New flag fields added**: Update schemas and fixtures
2. **Validation rules change**: Update validation tests
3. **Auth system changes**: Update auth tests
4. **Performance requirements change**: Update benchmarks

## Related Documentation

- [Feature Flags API Documentation](../../../docs/api/admin-feature-flags.md)
- [Feature Flags Client Examples](../../../docs/api/admin-feature-flags-client.md)
- [Onboarding System Spec](../../../.kiro/specs/huntaze-onboarding-production-ready/)
- [API Testing Guide](../../../docs/api-tests.md)

## Contributing

When adding new tests:

1. Follow existing test structure
2. Use fixtures for test data
3. Test all HTTP status codes
4. Validate schemas with Zod
5. Include performance benchmarks
6. Document new scenarios in this README
7. Update fixtures if needed

## Support

For questions or issues:
1. Check this README for common issues
2. Review test output for detailed errors
3. Check correlation IDs in API responses
4. Contact Platform team
