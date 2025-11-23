/**
 * Property-Based Tests for Rate Limit Middleware
 * 
 * Tests universal properties that should hold for all rate limit middleware behavior
 * using fast-check for property-based testing.
 * 
 * Feature: production-critical-fixes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import * as fc from 'fast-check';
import { withRateLimit, extractClientIp, resetRateLimit, closeRedisConnection } from '@/lib/middleware/rate-limit';
import type { RouteHandler } from '@/lib/middleware/types';

// Mock Redis
const mockRedisInstance = {
  status: 'ready',
  incr: vi.fn(),
  expire: vi.fn(),
  ttl: vi.fn(),
  del: vi.fn(),
  quit: vi.fn(),
  connect: vi.fn(),
};

vi.mock('ioredis', () => {
  return {
    Redis: vi.fn(function() {
      return mockRedisInstance;
    }),
  };
});

import { Redis } from 'ioredis';

describe('Rate Limit Middleware Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedisInstance.status = 'ready';
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await closeRedisConnection();
  });

  /**
   * Property 6: Rate Limit IP Extraction
   * 
   * For any request with x-forwarded-for header containing multiple IPs,
   * the rate limit middleware should use the first IP in the comma-separated list.
   * 
   * Validates: Requirements 5.2
   * 
   * Feature: production-critical-fixes, Property 6: Rate Limit IP Extraction
   */
  describe('Property 6: Rate Limit IP Extraction', () => {
    it('should extract first IP from any x-forwarded-for header with multiple IPs', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate array of IP addresses (2-5 IPs)
          fc.array(fc.ipV4(), { minLength: 2, maxLength: 5 }),
          async (ips) => {
            // Create x-forwarded-for header with comma-separated IPs
            const forwardedFor = ips.join(', ');
            const expectedIp = ips[0];

            // Create request with x-forwarded-for header
            const req = new NextRequest('http://localhost:3000/api/test', {
              headers: {
                'x-forwarded-for': forwardedFor,
              },
            });

            // Extract IP
            const extractedIp = extractClientIp(req);

            // Verify: Should extract the first IP
            expect(extractedIp).toBe(expectedIp);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle single IP in x-forwarded-for header', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.ipV4(),
          async (ip) => {
            const req = new NextRequest('http://localhost:3000/api/test', {
              headers: {
                'x-forwarded-for': ip,
              },
            });

            const extractedIp = extractClientIp(req);

            // Verify: Should extract the single IP
            expect(extractedIp).toBe(ip);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should trim whitespace from extracted IP', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.ipV4(), { minLength: 2, maxLength: 5 }),
          // Generate random whitespace
          fc.integer({ min: 0, max: 5 }),
          async (ips, whitespaceCount) => {
            // Add random whitespace around IPs
            const whitespace = ' '.repeat(whitespaceCount);
            const forwardedFor = ips.map(ip => `${whitespace}${ip}${whitespace}`).join(',');
            const expectedIp = ips[0];

            const req = new NextRequest('http://localhost:3000/api/test', {
              headers: {
                'x-forwarded-for': forwardedFor,
              },
            });

            const extractedIp = extractClientIp(req);

            // Verify: Should extract and trim the first IP
            expect(extractedIp).toBe(expectedIp);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should fallback to x-real-ip when x-forwarded-for is missing', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.ipV4(),
          async (ip) => {
            const req = new NextRequest('http://localhost:3000/api/test', {
              headers: {
                'x-real-ip': ip,
              },
            });

            const extractedIp = extractClientIp(req);

            // Verify: Should use x-real-ip as fallback
            expect(extractedIp).toBe(ip);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return "unknown" when no IP headers are present', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webPath(),
          async (path) => {
            const req = new NextRequest(`http://localhost:3000${path.startsWith('/') ? path : '/' + path}`);

            const extractedIp = extractClientIp(req);

            // Verify: Should return "unknown"
            expect(extractedIp).toBe('unknown');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: Rate Limit Enforcement
   * 
   * For any IP exceeding the configured rate limit, the middleware should
   * return a 429 status code with appropriate headers.
   * 
   * Validates: Requirements 5.4, 5.5
   * 
   * Feature: production-critical-fixes, Property 7: Rate Limit Enforcement
   */
  describe('Property 7: Rate Limit Enforcement', () => {
    it('should return 429 for any IP exceeding rate limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.ipV4(),
          fc.webPath(),
          fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
          fc.integer({ min: 1, max: 10 }), // maxRequests
          fc.integer({ min: 1000, max: 60000 }), // windowMs
          async (ip, path, method, maxRequests, windowMs) => {
            // Setup: Mock Redis to return count exceeding limit
            const exceedingCount = maxRequests + 1;
            vi.mocked(mockRedisInstance.incr).mockResolvedValue(exceedingCount);
            vi.mocked(mockRedisInstance.ttl).mockResolvedValue(30); // 30 seconds remaining

            const handlerCalled = { value: false };
            const mockHandler: RouteHandler = async (req: NextRequest) => {
              handlerCalled.value = true;
              return NextResponse.json({ success: true });
            };

            // Wrap handler with rate limit middleware
            const wrappedHandler = withRateLimit(mockHandler, {
              maxRequests,
              windowMs,
            });

            const url = `http://localhost:3000${path.startsWith('/') ? path : '/' + path}`;
            const req = new NextRequest(url, {
              method,
              headers: {
                'x-forwarded-for': ip,
              },
            });

            // Execute
            const response = await wrappedHandler(req);

            // Verify: Should return 429
            expect(response.status).toBe(429);

            // Verify: Handler should NOT have been called
            expect(handlerCalled.value).toBe(false);

            // Verify: Response should contain error message
            const body = await response.json();
            expect(body).toHaveProperty('error');
            expect(body.error).toBe('Too many requests');

            // Verify: Rate limit headers should be present
            expect(response.headers.get('X-RateLimit-Limit')).toBe(maxRequests.toString());
            expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
            expect(response.headers.get('Retry-After')).toBeTruthy();
            expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include correct rate limit headers for any request within limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.ipV4(),
          fc.webPath(),
          fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
          fc.integer({ min: 5, max: 100 }), // maxRequests
          fc.integer({ min: 1000, max: 60000 }), // windowMs
          fc.integer({ min: 1, max: 4 }), // current count (within limit)
          async (ip, path, method, maxRequests, windowMs, currentCount) => {
            // Ensure we're within limit
            if (currentCount >= maxRequests) {
              return;
            }

            // Setup: Mock Redis to return count within limit
            vi.mocked(mockRedisInstance.incr).mockResolvedValue(currentCount);
            vi.mocked(mockRedisInstance.ttl).mockResolvedValue(30);

            const mockHandler: RouteHandler = async (req: NextRequest) => {
              return NextResponse.json({ success: true });
            };

            const wrappedHandler = withRateLimit(mockHandler, {
              maxRequests,
              windowMs,
            });

            const url = `http://localhost:3000${path.startsWith('/') ? path : '/' + path}`;
            const req = new NextRequest(url, {
              method,
              headers: {
                'x-forwarded-for': ip,
              },
            });

            // Execute
            const response = await wrappedHandler(req);

            // Verify: Should return success (not 429)
            expect(response.status).toBe(200);

            // Verify: Rate limit headers should be present
            expect(response.headers.get('X-RateLimit-Limit')).toBe(maxRequests.toString());
            
            const remaining = response.headers.get('X-RateLimit-Remaining');
            expect(remaining).toBeTruthy();
            expect(parseInt(remaining!)).toBeGreaterThanOrEqual(0);
            expect(parseInt(remaining!)).toBeLessThanOrEqual(maxRequests);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should set expiry on first request for any IP', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.ipV4(),
          fc.webPath(),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1000, max: 60000 }),
          async (ip, path, maxRequests, windowMs) => {
            // Reset mocks for this iteration
            vi.clearAllMocks();
            
            // Setup: Mock Redis to return count = 1 (first request)
            vi.mocked(mockRedisInstance.incr).mockResolvedValue(1);
            vi.mocked(mockRedisInstance.ttl).mockResolvedValue(Math.floor(windowMs / 1000));

            const mockHandler: RouteHandler = async (req: NextRequest) => {
              return NextResponse.json({ success: true });
            };

            const wrappedHandler = withRateLimit(mockHandler, {
              maxRequests,
              windowMs,
            });

            const url = `http://localhost:3000${path.startsWith('/') ? path : '/' + path}`;
            const req = new NextRequest(url, {
              headers: {
                'x-forwarded-for': ip,
              },
            });

            // Execute
            await wrappedHandler(req);

            // Verify: expire should have been called with correct TTL
            expect(mockRedisInstance.expire).toHaveBeenCalled();
            const expireCalls = vi.mocked(mockRedisInstance.expire).mock.calls;
            const lastExpireCall = expireCalls[expireCalls.length - 1];
            expect(lastExpireCall[1]).toBe(Math.floor(windowMs / 1000));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use correct Redis key format for any IP and path', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.ipV4(),
          fc.webPath(),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1000, max: 60000 }),
          async (ip, path, maxRequests, windowMs) => {
            // Reset mocks for this iteration
            vi.clearAllMocks();
            
            // Setup
            vi.mocked(mockRedisInstance.incr).mockResolvedValue(1);
            vi.mocked(mockRedisInstance.ttl).mockResolvedValue(30);

            const mockHandler: RouteHandler = async (req: NextRequest) => {
              return NextResponse.json({ success: true });
            };

            const wrappedHandler = withRateLimit(mockHandler, {
              maxRequests,
              windowMs,
            });

            const normalizedPath = path.startsWith('/') ? path : '/' + path;
            const url = `http://localhost:3000${normalizedPath}`;
            const req = new NextRequest(url, {
              headers: {
                'x-forwarded-for': ip,
              },
            });

            // Execute
            await wrappedHandler(req);

            // Verify: incr should have been called with correct key format
            expect(mockRedisInstance.incr).toHaveBeenCalled();
            const incrCalls = vi.mocked(mockRedisInstance.incr).mock.calls;
            const lastIncrCall = incrCalls[incrCalls.length - 1];
            const key = lastIncrCall[0];
            
            // Key should contain IP and start with rate-limit prefix
            expect(key).toContain(ip);
            expect(key).toMatch(/^rate-limit:/);
            
            // Key should contain a path (Next.js may normalize it)
            // The key format is: rate-limit:IP:PATH
            const keyParts = key.split(':');
            expect(keyParts.length).toBeGreaterThanOrEqual(3);
            expect(keyParts[0]).toBe('rate-limit');
            expect(keyParts[1]).toBe(ip);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: Rate Limit Fail Open
   * 
   * For any request when Redis is unavailable, the rate limit middleware
   * should allow the request to proceed (fail open).
   * 
   * Validates: Requirements 5.6
   * 
   * Feature: production-critical-fixes, Property 8: Rate Limit Fail Open
   */
  describe('Property 8: Rate Limit Fail Open', () => {
    it('should allow any request when Redis incr fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.ipV4(),
          fc.webPath(),
          fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1000, max: 60000 }),
          async (ip, path, method, maxRequests, windowMs) => {
            // Reset mocks
            vi.clearAllMocks();
            
            // Setup: Mock Redis to throw error
            vi.mocked(mockRedisInstance.incr).mockRejectedValue(new Error('Redis connection failed'));

            const handlerCalled = { value: false };
            const mockHandler: RouteHandler = async (req: NextRequest) => {
              handlerCalled.value = true;
              return NextResponse.json({ success: true });
            };

            const wrappedHandler = withRateLimit(mockHandler, {
              maxRequests,
              windowMs,
            });

            const url = `http://localhost:3000${path.startsWith('/') ? path : '/' + path}`;
            const req = new NextRequest(url, {
              method,
              headers: {
                'x-forwarded-for': ip,
              },
            });

            // Execute
            const response = await wrappedHandler(req);

            // Verify: Handler should have been called (fail open)
            expect(handlerCalled.value).toBe(true);

            // Verify: Should return success (not 429)
            expect(response.status).toBe(200);

            // Verify: Response should be from handler
            const body = await response.json();
            expect(body).toEqual({ success: true });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow any request when Redis connection fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.ipV4(),
          fc.webPath(),
          fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1000, max: 60000 }),
          async (ip, path, method, maxRequests, windowMs) => {
            // Reset mocks
            vi.clearAllMocks();
            
            // Setup: Mock Redis connection to fail
            mockRedisInstance.status = 'disconnected';
            vi.mocked(mockRedisInstance.connect).mockRejectedValue(new Error('Connection refused'));
            vi.mocked(mockRedisInstance.incr).mockRejectedValue(new Error('Not connected'));

            const handlerCalled = { value: false };
            const mockHandler: RouteHandler = async (req: NextRequest) => {
              handlerCalled.value = true;
              return NextResponse.json({ success: true });
            };

            const wrappedHandler = withRateLimit(mockHandler, {
              maxRequests,
              windowMs,
            });

            const url = `http://localhost:3000${path.startsWith('/') ? path : '/' + path}`;
            const req = new NextRequest(url, {
              method,
              headers: {
                'x-forwarded-for': ip,
              },
            });

            // Execute
            const response = await wrappedHandler(req);

            // Verify: Handler should have been called (fail open)
            expect(handlerCalled.value).toBe(true);

            // Verify: Should return success (not 429)
            expect(response.status).toBe(200);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow any request when Redis expire fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.ipV4(),
          fc.webPath(),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1000, max: 60000 }),
          async (ip, path, maxRequests, windowMs) => {
            // Reset mocks
            vi.clearAllMocks();
            
            // Setup: Mock Redis incr succeeds but expire fails
            vi.mocked(mockRedisInstance.incr).mockResolvedValue(1);
            vi.mocked(mockRedisInstance.expire).mockRejectedValue(new Error('Expire failed'));

            const handlerCalled = { value: false };
            const mockHandler: RouteHandler = async (req: NextRequest) => {
              handlerCalled.value = true;
              return NextResponse.json({ success: true });
            };

            const wrappedHandler = withRateLimit(mockHandler, {
              maxRequests,
              windowMs,
            });

            const url = `http://localhost:3000${path.startsWith('/') ? path : '/' + path}`;
            const req = new NextRequest(url, {
              headers: {
                'x-forwarded-for': ip,
              },
            });

            // Execute
            const response = await wrappedHandler(req);

            // Verify: Handler should have been called (fail open)
            expect(handlerCalled.value).toBe(true);

            // Verify: Should return success (not 429)
            expect(response.status).toBe(200);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow any request when Redis ttl fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.ipV4(),
          fc.webPath(),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1000, max: 60000 }),
          async (ip, path, maxRequests, windowMs) => {
            // Reset mocks
            vi.clearAllMocks();
            
            // Setup: Mock Redis operations succeed but ttl fails
            vi.mocked(mockRedisInstance.incr).mockResolvedValue(1);
            vi.mocked(mockRedisInstance.expire).mockResolvedValue(1);
            vi.mocked(mockRedisInstance.ttl).mockRejectedValue(new Error('TTL failed'));

            const handlerCalled = { value: false };
            const mockHandler: RouteHandler = async (req: NextRequest) => {
              handlerCalled.value = true;
              return NextResponse.json({ success: true });
            };

            const wrappedHandler = withRateLimit(mockHandler, {
              maxRequests,
              windowMs,
            });

            const url = `http://localhost:3000${path.startsWith('/') ? path : '/' + path}`;
            const req = new NextRequest(url, {
              headers: {
                'x-forwarded-for': ip,
              },
            });

            // Execute
            const response = await wrappedHandler(req);

            // Verify: Handler should have been called (fail open)
            expect(handlerCalled.value).toBe(true);

            // Verify: Should return success (not 429)
            expect(response.status).toBe(200);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
