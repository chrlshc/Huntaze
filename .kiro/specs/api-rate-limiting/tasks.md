# Implementation Plan

## Overview

This implementation plan breaks down the API Rate Limiting feature into discrete, actionable coding tasks. Each task builds incrementally on previous work, ensuring the system remains functional throughout development. The plan follows implementation-first development, with optional testing tasks marked with *.

---

## Task List

- [x] 1. Set up rate limiter core infrastructure
  - Create base directory structure and core interfaces
  - Implement Redis connection wrapper with circuit breaker pattern
  - Create configuration loader with validation
  - _Requirements: 1.4, 7.1, 7.2, 8.1, 8.4_

- [x] 1.1 Create rate limiter directory structure and types
  - Create `lib/services/rate-limiter/` directory
  - Define TypeScript interfaces for `Identity`, `RateLimitResult`, `RateLimitPolicy`, `RateLimitConfig`
  - Create `lib/services/rate-limiter/types.ts` with all core types
  - _Requirements: 1.1, 2.1_

- [x] 1.2 Implement circuit breaker for Redis resilience
  - Create `lib/services/rate-limiter/circuit-breaker.ts`
  - Implement state machine (closed/open/half-open)
  - Add failure tracking and automatic recovery
  - Add metrics emission for circuit breaker state
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 1.3 Create configuration management system
  - Enhance `src/lib/rateLimits.ts` to `lib/config/rate-limits.ts`
  - Add `RateLimitPolicy` definitions for all endpoint patterns
  - Implement tier-based overrides (free/premium/enterprise)
  - Add configuration validation on load
  - Support environment variable overrides
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 1.4 Write unit tests for configuration and circuit breaker
  - Test configuration validation logic
  - Test tier override resolution
  - Test circuit breaker state transitions
  - Test circuit breaker failure threshold and recovery
  - _Requirements: 9.1_

- [x] 2. Implement rate limiting algorithms
  - Implement sliding window algorithm using Redis sorted sets
  - Implement token bucket algorithm with refill logic
  - Create algorithm factory for selecting appropriate algorithm
  - _Requirements: 1.1, 1.2, 1.3, 10.5_

- [x] 2.1 Implement sliding window rate limiter
  - Create `lib/services/rate-limiter/sliding-window.ts`
  - Implement Redis sorted set operations (ZADD, ZREMRANGEBYSCORE, ZCARD)
  - Calculate remaining requests and reset time
  - Use Redis pipelining for atomic operations
  - Add Lua script for atomic rate limit check
  - _Requirements: 1.1, 1.2, 1.3, 10.3, 10.5_

- [x] 2.2 Implement token bucket rate limiter
  - Create `lib/services/rate-limiter/token-bucket.ts`
  - Implement token refill calculation based on elapsed time
  - Handle burst allowance configuration
  - Store bucket state in Redis with TTL
  - _Requirements: 1.1, 1.2, 1.3, 2.1_

- [x] 2.3 Create rate limiter service with algorithm selection
  - Create `lib/services/rate-limiter/index.ts`
  - Implement `RateLimiter` class with `check()` method
  - Add algorithm factory to select sliding-window vs token-bucket
  - Integrate circuit breaker for Redis operations
  - Implement graceful fallback when Redis unavailable
  - _Requirements: 1.1, 1.2, 1.4, 7.1, 7.5_

- [x] 2.4 Write unit tests for rate limiting algorithms
  - Test sliding window request counting and expiration
  - Test token bucket refill and consumption
  - Test burst handling in token bucket
  - Test concurrent request handling
  - _Requirements: 9.1_

- [x] 3. Implement identity extraction and policy resolution
  - Extract user identity from requests (IP, user session, API key)
  - Resolve rate limit policy based on endpoint and identity
  - Implement IP whitelisting
  - _Requirements: 2.4, 2.5, 4.1, 4.3_

- [x] 3.1 Create identity extraction module
  - Create `lib/services/rate-limiter/identity.ts`
  - Implement `extractIdentity()` function to get IP, user ID, or API key
  - Extract IP from X-Forwarded-For, X-Real-IP headers
  - Get user session from Next.js auth
  - Detect API key from X-API-Key header
  - Determine user tier (free/premium/enterprise)
  - _Requirements: 2.4, 4.1_

- [x] 3.2 Implement policy resolution logic
  - Create `lib/services/rate-limiter/policy.ts`
  - Implement `getRateLimitPolicy()` to match endpoint patterns
  - Support exact match and prefix match for endpoints
  - Apply tier-based overrides to base policy
  - Handle IP whitelist bypass
  - Fall back to default policy when no match
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.3_

- [x] 3.3 Write unit tests for identity and policy resolution
  - Test IP extraction from various headers
  - Test user session extraction
  - Test API key detection
  - Test policy pattern matching (exact and prefix)
  - Test tier override application
  - Test IP whitelist bypass
  - _Requirements: 9.1_

- [x] 4. Enhance middleware with rate limiting
  - Integrate rate limiter into existing Next.js middleware
  - Add rate limit checks before route handlers
  - Return 429 responses with appropriate headers
  - Add rate limit headers to all responses
  - _Requirements: 1.1, 1.2, 1.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 4.1 Create rate limit headers utility
  - Create `lib/services/rate-limiter/headers.ts`
  - Implement `buildRateLimitHeaders()` for 429 responses
  - Implement `addRateLimitHeaders()` for successful responses
  - Include X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
  - Include Retry-After header when rate limited
  - Include X-RateLimit-Policy header describing the policy
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 4.2 Enhance middleware.ts with comprehensive rate limiting
  - Import rate limiter service and utilities
  - Extract identity from request using `extractIdentity()`
  - Get rate limit policy using `getRateLimitPolicy()`
  - Check rate limit using `rateLimiter.check()`
  - Return 429 response with headers if rate limited
  - Add rate limit headers to successful responses
  - Expand matcher to cover all API routes
  - _Requirements: 1.1, 1.2, 1.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 4.3 Write integration tests for middleware rate limiting
  - Test rate limit enforcement on API routes
  - Test 429 response with correct headers
  - Test rate limit headers on successful responses
  - Test identity extraction (IP, user, API key)
  - Test policy resolution for different endpoints
  - _Requirements: 9.2_

- [x] 5. Implement authentication-specific rate limiting
  - Add strict rate limits for login and registration endpoints
  - Track failed login attempts per IP and username
  - Implement exponential backoff for repeated failures
  - Add alerting for credential stuffing patterns
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5.1 Create authentication rate limiter module
  - Create `lib/services/rate-limiter/auth-limiter.ts`
  - Implement `trackFailedLogin()` to record failed attempts
  - Implement `checkLoginRateLimit()` with per-IP and per-username tracking
  - Store failed attempts in Redis with 15-minute TTL
  - Implement exponential backoff (1min, 5min, 15min, 1hour)
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 5.2 Integrate auth rate limiter into login endpoint
  - Update `/api/auth/login` route handler
  - Check rate limit before authentication attempt
  - Track failed login attempts on authentication failure
  - Reset counter on successful login
  - Return 429 with appropriate Retry-After on rate limit
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 5.3 Add credential stuffing detection
  - Implement `detectCredentialStuffing()` in auth-limiter
  - Track multiple IPs attempting same username
  - Emit alert when threshold exceeded (5+ IPs in 5 minutes)
  - Log suspicious activity with IP list and username
  - _Requirements: 3.5_

- [x] 5.4 Write integration tests for authentication rate limiting
  - Test failed login rate limiting per IP
  - Test failed login rate limiting per username
  - Test exponential backoff behavior
  - Test successful login counter reset
  - Test credential stuffing detection
  - _Requirements: 9.2_

- [x] 6. Implement IP-based rate limiting for unauthenticated requests
  - Add stricter limits for unauthenticated traffic
  - Implement IP whitelisting for trusted sources
  - Add progressive penalties for repeat offenders
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6.1 Create IP rate limiter with progressive penalties
  - Create `lib/services/rate-limiter/ip-limiter.ts`
  - Implement stricter limits for unauthenticated requests (20/min vs 100/min)
  - Track IP violation history in Redis
  - Implement progressive blocking (1min, 10min, 1hour)
  - Store IP blocks with expiration
  - _Requirements: 4.1, 4.2, 4.5_

- [x] 6.2 Implement IP whitelist functionality
  - Load IP whitelist from environment variable `RATE_LIMIT_WHITELIST_IPS`
  - Check whitelist before applying rate limits
  - Support CIDR notation for IP ranges
  - Log whitelisted IP access for audit
  - _Requirements: 4.3_

- [x] 6.3 Write integration tests for IP-based rate limiting
  - Test unauthenticated request rate limiting
  - Test IP whitelist bypass
  - Test progressive penalty escalation
  - Test IP block expiration
  - _Requirements: 9.2_

- [x] 7. Add monitoring, logging, and alerting
  - Emit metrics for rate limit events
  - Log rate limit violations with context
  - Create alerts for high rate limit hit rates
  - Add dashboard metrics
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 7.1 Implement metrics collection
  - Create `lib/services/rate-limiter/metrics.ts`
  - Track total requests, allowed requests, blocked requests
  - Calculate rate limit hit rate per endpoint
  - Track rate limiter latency (p50, p95, p99)
  - Track Redis health (availability, latency, errors)
  - Emit metrics to monitoring system (CloudWatch/Datadog)
  - _Requirements: 6.1, 6.5_

- [x] 7.2 Add comprehensive logging
  - Log rate limit violations with identity, endpoint, IP, user agent
  - Log circuit breaker state changes
  - Log configuration load and validation
  - Use structured logging (JSON format)
  - Include correlation IDs for request tracing
  - _Requirements: 6.2_

- [x] 7.3 Create alerting rules
  - Alert when rate limit hit rate > 10% (critical)
  - Alert when rate limit hit rate > 5% (warning)
  - Alert when circuit breaker opens (critical)
  - Alert when Redis latency > 100ms (warning)
  - Alert on credential stuffing detection
  - _Requirements: 6.3_

- [x] 7.4 Create monitoring dashboard
  - Display total vs rate limited requests chart
  - Show top rate-limited endpoints table
  - Show top rate-limited users/IPs table
  - Display rate limit hit rate over time
  - Show Redis health indicator
  - Show circuit breaker state indicator
  - _Requirements: 6.4_

- [x] 8. Performance optimization
  - Implement Redis pipelining for batch operations
  - Add local caching with 1-second TTL
  - Optimize Lua scripts for atomic operations
  - Benchmark and validate performance requirements
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 8.1 Implement Redis pipelining
  - Update sliding window limiter to use Redis multi/exec
  - Batch multiple window checks (per-minute, per-hour, per-day)
  - Reduce Redis round trips from 3+ to 1
  - _Requirements: 10.3_

- [x] 8.2 Add local caching layer
  - Create in-memory cache for rate limit results
  - Cache results for 1 second to reduce Redis load
  - Implement cache invalidation on rate limit updates
  - Add cache hit/miss metrics
  - _Requirements: 10.4_

- [x] 8.3 Optimize with Lua scripts
  - Create `rate_limit_check.lua` for atomic operations
  - Combine ZREMRANGEBYSCORE, ZCARD, ZADD into single script
  - Load Lua script into Redis on startup
  - Use script SHA for execution
  - _Requirements: 10.5_

- [x] 8.4 Benchmark and validate performance
  - Run load tests with 10,000 requests/second
  - Measure p95 latency overhead (<10ms target)
  - Test with 1000+ concurrent users
  - Validate Redis connection pooling
  - Profile and optimize hot paths
  - _Requirements: 9.3, 10.1, 10.2_

- [x] 9. Add configuration management and environment variables
  - Add environment variables for rate limit configuration
  - Support JSON configuration file for complex rules
  - Implement hot reload for configuration changes
  - Add configuration validation and defaults
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 9.1 Add environment variable support
  - Add `RATE_LIMIT_ENABLED` flag
  - Add `RATE_LIMIT_DEFAULT_PER_MINUTE` and `RATE_LIMIT_DEFAULT_PER_HOUR`
  - Add `RATE_LIMIT_WHITELIST_IPS` comma-separated list
  - Add `RATE_LIMIT_ALERT_THRESHOLD` percentage
  - Update `.env.example` with rate limit variables
  - _Requirements: 8.1_

- [x] 9.2 Support JSON configuration file
  - Create `config/rate-limits.json` schema
  - Load configuration from file if present
  - Merge file config with environment variables (env takes precedence)
  - Validate JSON schema on load
  - _Requirements: 8.2_

- [x] 9.3 Implement configuration hot reload
  - Watch configuration file for changes
  - Reload configuration without restart
  - Validate new configuration before applying
  - Log configuration changes
  - _Requirements: 8.3_

- [x] 9.4 Write configuration tests
  - Test environment variable parsing
  - Test JSON file loading
  - Test configuration merging
  - Test validation error handling
  - Test hot reload functionality
  - _Requirements: 9.1_

- [x] 10. End-to-end testing and validation
  - Write E2E tests for critical user flows with rate limiting
  - Test cross-browser compatibility
  - Validate rate limit headers in responses
  - Test graceful degradation scenarios
  - _Requirements: 9.4, 9.5_

- [x] 10.1 Write E2E tests for rate limiting
  - Test authentication rate limiting (login, register)
  - Test upload rate limiting
  - Test API endpoint rate limiting
  - Test rate limit headers in responses
  - Test 429 response handling
  - Test Retry-After behavior
  - _Requirements: 9.4_

- [x] 10.2 Write chaos tests for failure scenarios
  - Test Redis connection loss during requests
  - Test Redis timeout handling
  - Test circuit breaker behavior
  - Test graceful degradation (fail-open)
  - Test automatic reconnection
  - _Requirements: 9.5_

- [x] 10.3 Validate performance under load
  - Run load test with k6 or Artillery
  - Test 1000+ concurrent users
  - Test burst traffic patterns
  - Measure and validate <10ms p95 latency
  - Test Redis failover scenarios
  - _Requirements: 9.3, 10.1, 10.2_

- [x] 11. Documentation and deployment
  - Update API documentation with rate limit information
  - Create runbook for rate limit monitoring and troubleshooting
  - Document configuration options
  - Create deployment guide
  - _Requirements: All_

- [x] 11.1 Update API documentation
  - Document rate limit headers in API responses
  - Document rate limit policies per endpoint
  - Document 429 error response format
  - Add rate limiting section to API docs
  - Include code examples for handling rate limits
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 11.2 Create operational runbook
  - Document how to monitor rate limiting
  - Document how to adjust rate limits
  - Document troubleshooting steps for common issues
  - Document Redis failover procedures
  - Document how to whitelist IPs
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 11.3 Create deployment guide
  - Document infrastructure setup (Redis/Upstash)
  - Document environment variable configuration
  - Document rollout strategy (phased by endpoint)
  - Document rollback procedures
  - Document monitoring setup
  - _Requirements: 8.1, 8.2, 8.3_

---

## Implementation Notes

### Dependencies
- Existing Redis infrastructure (`lib/cache/redis.ts`)
- Existing middleware (`middleware.ts`)
- Upstash Redis client (`@upstash/redis`)
- Upstash Rate Limit client (`@upstash/ratelimit`)

### Testing Strategy
- Unit tests for algorithms and configuration
- Integration tests for Redis operations and middleware
- E2E tests for critical flows
- Load tests for performance validation
- Chaos tests for failure scenarios

### Rollout Strategy
1. Deploy infrastructure (Redis, monitoring)
2. Enable for debug endpoints (already exists)
3. Enable for authentication endpoints
4. Enable for upload endpoints
5. Enable for all API endpoints
6. Monitor and tune based on metrics

### Performance Targets
- <10ms p95 latency overhead
- 10,000+ requests/second throughput
- <5% rate limit hit rate under normal load
- Graceful degradation when Redis unavailable

### Success Criteria
- All API endpoints protected
- DDoS protection validated
- Brute force protection validated
- Performance targets met
- Monitoring and alerting operational
- Documentation complete
