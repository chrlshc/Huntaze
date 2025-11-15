# Rate Limiting Load Tests

This directory contains k6 load tests for validating rate limiting and circuit breaker behavior under load.

## Tests

### 1. Rate Limiter Validation (`rate-limiter-validation.js`)

Tests that rate limiters correctly throttle requests under various load conditions.

**What it tests:**
- IP-based rate limiting
- User-based rate limiting
- Endpoint-specific rate limits
- Rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)
- 429 responses with Retry-After headers

**Load profile:**
- Warm up: 50 users for 30s
- Normal load: 100 users for 1m
- Increased load: 200 users for 2m
- Scale down: 100 users for 1m
- Cool down: 30s

**Success criteria:**
- Rate limits are enforced (429 responses)
- No rate limit bypasses
- 95% of requests complete under 1s
- Unexpected error rate < 1%
- Proper rate limit headers present

**Run:**
```bash
k6 run tests/load/rate-limiting/rate-limiter-validation.js
```

### 2. Circuit Breaker (`circuit-breaker.js`)

Tests circuit breaker behavior under failure conditions and recovery.

**What it tests:**
- Circuit breaker trip conditions
- Circuit breaker state transitions (closed → open → half-open → closed)
- Fail-open behavior when Redis is unavailable
- Recovery after failures
- Failure threshold detection

**Scenarios:**
1. **Gradual Failure** (0-2m30s): Ramp up load to trigger circuit breaker
2. **Recovery** (2m30s-4m30s): Test recovery and half-open state
3. **Fail-Open** (5m-6m): Test behavior when Redis fails

**Success criteria:**
- Circuit breaker trips at least once
- Fallback responses are used
- 95% of requests complete under 2s
- System recovers gracefully

**Run:**
```bash
k6 run tests/load/rate-limiting/circuit-breaker.js
```

## Configuration

### Environment Variables

- `BASE_URL`: Base URL of the application (default: `http://localhost:3000`)

Example:
```bash
BASE_URL=https://staging.huntaze.com k6 run tests/load/rate-limiting/rate-limiter-validation.js
```

### Custom Metrics

Both tests export custom metrics:

**Rate Limiter Validation:**
- `rate_limit_hits`: Number of times rate limit was hit (429 responses)
- `rate_limit_bypass`: Number of requests that bypassed rate limits (should be 0)
- `successful_requests`: Number of successful requests (200 responses)
- `errors`: Error rate
- `response_time`: Response time trend

**Circuit Breaker:**
- `circuit_breaker_open`: Gauge indicating if circuit breaker is open
- `circuit_breaker_trips`: Number of times circuit breaker tripped
- `failed_requests`: Number of failed requests
- `successful_requests`: Number of successful requests
- `fallback_responses`: Number of fallback responses
- `errors`: Error rate
- `response_time`: Response time trend

## Interpreting Results

### Rate Limiter Validation

**Good results:**
```
✓ IP rate limit enforced
✓ User rate limit enforced
✓ Rate limited requests return 429
✓ Retry-After header present
✓ X-RateLimit-* headers present
✓ http_req_duration..............: avg=250ms p(95)=450ms
✓ rate_limit_hits................: 1234
✓ rate_limit_bypass..............: 0
```

**Bad results:**
```
✗ rate_limit_bypass..............: 45  ← Rate limits being bypassed!
✗ http_req_duration..............: p(95)=1500ms  ← Too slow
✗ Rate limited requests return 429: 85%  ← Some rate limited requests not returning 429
```

### Circuit Breaker

**Good results:**
```
✓ Circuit breaker trips at least once
✓ Circuit breaker protects system
✓ Request succeeds after recovery
✓ circuit_breaker_trips..........: 3
✓ fallback_responses.............: 156
✓ successful_requests............: 2341
```

**Bad results:**
```
✗ circuit_breaker_trips..........: 0  ← Circuit breaker never tripped
✗ errors.........................: 45%  ← Too many errors
✗ Circuit breaker response is 503: 0%  ← Not protecting system
```

## Running in CI/CD

These tests are designed to run in CI/CD pipelines:

```yaml
# .github/workflows/load-tests.yml
- name: Run Rate Limiting Load Tests
  run: |
    k6 run --out json=results.json tests/load/rate-limiting/rate-limiter-validation.js
    k6 run --out json=results.json tests/load/rate-limiting/circuit-breaker.js
```

## Troubleshooting

### Rate limits not being enforced

1. Check that Redis is running and accessible
2. Verify rate limit configuration in `lib/config/rate-limits.ts`
3. Check middleware is properly configured in `middleware.ts`

### Circuit breaker not tripping

1. Verify failure threshold configuration
2. Check that Redis failures are being detected
3. Ensure circuit breaker is enabled in configuration

### High error rates

1. Check application logs for errors
2. Verify database connections
3. Check external API availability
4. Review rate limit thresholds (may be too aggressive)

## Local Development

To run these tests locally:

1. Start the application:
```bash
npm run build
npm run start
```

2. Run the tests:
```bash
k6 run tests/load/rate-limiting/rate-limiter-validation.js
k6 run tests/load/rate-limiting/circuit-breaker.js
```

3. View results in the console or export to JSON:
```bash
k6 run --out json=results.json tests/load/rate-limiting/rate-limiter-validation.js
```

## Integration with Monitoring

These tests can be integrated with Grafana for real-time monitoring:

```bash
k6 run --out influxdb=http://localhost:8086/k6 tests/load/rate-limiting/rate-limiter-validation.js
```

Then view results in Grafana dashboards.

## Next Steps

After running these tests:

1. Review metrics and identify bottlenecks
2. Adjust rate limit thresholds if needed
3. Tune circuit breaker parameters
4. Document baseline performance
5. Set up automated alerts for regressions
