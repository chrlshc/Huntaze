/**
 * Property-Based Tests for CSRF Middleware
 * 
 * Tests universal properties that should hold for all CSRF middleware behavior
 * using fast-check for property-based testing.
 * 
 * Feature: production-critical-fixes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import * as fc from 'fast-check';
import { withCsrf, setCsrfTokenCookie, generateCsrfToken } from '@/lib/middleware/csrf';
import type { RouteHandler } from '@/lib/middleware/types';

describe('CSRF Middleware Property Tests', () => {
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    // Restore original NODE_ENV
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });

  /**
   * Property 4: CSRF GET Request Bypass
   * 
   * For any GET request, the CSRF middleware should skip validation
   * and call the wrapped handler directly.
   * 
   * Validates: Requirements 4.1
   * 
   * Feature: production-critical-fixes, Property 4: CSRF GET Request Bypass
   */
  describe('Property 4: CSRF GET Request Bypass', () => {
    it('should skip CSRF validation for any GET request', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random URL paths
          fc.webPath(),
          // Generate random query parameters
          fc.dictionary(fc.string(), fc.string()),
          async (path, queryParams) => {
            // Create a mock handler that should be called
            const handlerCalled = { value: false };
            const mockHandler: RouteHandler = async (req: NextRequest) => {
              handlerCalled.value = true;
              return NextResponse.json({ success: true, method: req.method });
            };

            // Wrap handler with CSRF middleware
            const wrappedHandler = withCsrf(mockHandler);

            // Build URL with query params
            const url = new URL(`http://localhost:3000${path.startsWith('/') ? path : '/' + path}`);
            Object.entries(queryParams).forEach(([key, value]) => {
              url.searchParams.set(key, value);
            });

            // Create GET request WITHOUT any CSRF tokens
            const req = new NextRequest(url.toString(), {
              method: 'GET',
            });

            // Execute
            const response = await wrappedHandler(req);

            // Verify: Handler should have been called
            expect(handlerCalled.value).toBe(true);

            // Verify: Should return success response from handler
            expect(response.status).toBe(200);
            const body = await response.json();
            expect(body.success).toBe(true);
            expect(body.method).toBe('GET');
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design
      );
    });

    it('should call handler for GET requests even with invalid CSRF tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webPath(),
          // Generate random invalid tokens
          fc.string(),
          fc.string(),
          async (path, invalidHeaderToken, invalidCookieToken) => {
            const handlerCalled = { value: false };
            const mockHandler: RouteHandler = async (req: NextRequest) => {
              handlerCalled.value = true;
              return NextResponse.json({ success: true });
            };

            const wrappedHandler = withCsrf(mockHandler);
            const url = `http://localhost:3000${path.startsWith('/') ? path : '/' + path}`;

            // Create GET request with mismatched/invalid CSRF tokens
            const req = new NextRequest(url, {
              method: 'GET',
              headers: {
                'x-csrf-token': invalidHeaderToken,
              },
            });

            // Manually set cookie (NextRequest doesn't have a direct way)
            // We'll test this by ensuring GET bypasses validation entirely

            // Execute
            const response = await wrappedHandler(req);

            // Verify: Handler should have been called despite invalid tokens
            expect(handlerCalled.value).toBe(true);
            expect(response.status).toBe(200);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should call handler for GET requests with no CSRF tokens at all', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webPath(),
          async (path) => {
            const handlerCalled = { value: false };
            const mockHandler: RouteHandler = async (req: NextRequest) => {
              handlerCalled.value = true;
              return NextResponse.json({ success: true });
            };

            const wrappedHandler = withCsrf(mockHandler);
            const url = `http://localhost:3000${path.startsWith('/') ? path : '/' + path}`;

            // Create GET request with NO CSRF tokens
            const req = new NextRequest(url, {
              method: 'GET',
            });

            // Execute
            const response = await wrappedHandler(req);

            // Verify: Handler should have been called
            expect(handlerCalled.value).toBe(true);
            expect(response.status).toBe(200);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: CSRF Token Validation
   * 
   * For any non-GET request with mismatched CSRF tokens, the middleware
   * should return a 403 status code.
   * 
   * Validates: Requirements 4.4
   * 
   * Feature: production-critical-fixes, Property 5: CSRF Token Validation
   */
  describe('Property 5: CSRF Token Validation', () => {
    it('should return 403 for any non-GET request with mismatched tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webPath(),
          // Generate non-GET methods
          fc.constantFrom('POST', 'PUT', 'DELETE', 'PATCH'),
          // Generate two different tokens
          fc.string({ minLength: 10, maxLength: 50 }),
          fc.string({ minLength: 10, maxLength: 50 }),
          async (path, method, headerToken, cookieToken) => {
            // Ensure tokens are different
            fc.pre(headerToken !== cookieToken);
            
            // Set NODE_ENV to production to enable CSRF validation
            process.env.NODE_ENV = 'production';

            const handlerCalled = { value: false };
            const mockHandler: RouteHandler = async (req: NextRequest) => {
              handlerCalled.value = true;
              return NextResponse.json({ success: true });
            };

            const wrappedHandler = withCsrf(mockHandler);
            const url = `http://localhost:3000${path.startsWith('/') ? path : '/' + path}`;

            // Create request with mismatched tokens
            const req = new NextRequest(url, {
              method,
              headers: {
                'x-csrf-token': headerToken,
                'Cookie': `csrf-token=${cookieToken}`,
              },
            });

            // Execute
            const response = await wrappedHandler(req);

            // Verify: Should return 403
            expect(response.status).toBe(403);

            // Verify: Handler should NOT have been called
            expect(handlerCalled.value).toBe(false);

            // Verify: Response should contain error message
            const body = await response.json();
            expect(body).toHaveProperty('error');
            expect(body.error).toContain('CSRF token');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 403 for any non-GET request with missing header token', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webPath(),
          fc.constantFrom('POST', 'PUT', 'DELETE', 'PATCH'),
          fc.string({ minLength: 10, maxLength: 50 }),
          async (path, method, cookieToken) => {
            const handlerCalled = { value: false };
            const mockHandler: RouteHandler = async (req: NextRequest) => {
              handlerCalled.value = true;
              return NextResponse.json({ success: true });
            };

            const wrappedHandler = withCsrf(mockHandler);
            const url = `http://localhost:3000${path.startsWith('/') ? path : '/' + path}`;

            // Create request with only cookie token (no header)
            const req = new NextRequest(url, {
              method,
              headers: {
                'Cookie': `csrf-token=${cookieToken}`,
              },
            });

            // Execute
            const response = await wrappedHandler(req);

            // Verify: Should return 403
            expect(response.status).toBe(403);
            expect(handlerCalled.value).toBe(false);

            const body = await response.json();
            expect(body.error).toBe('Invalid CSRF token');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 403 for any non-GET request with missing cookie token', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webPath(),
          fc.constantFrom('POST', 'PUT', 'DELETE', 'PATCH'),
          fc.string({ minLength: 10, maxLength: 50 }),
          async (path, method, headerToken) => {
            const handlerCalled = { value: false };
            const mockHandler: RouteHandler = async (req: NextRequest) => {
              handlerCalled.value = true;
              return NextResponse.json({ success: true });
            };

            const wrappedHandler = withCsrf(mockHandler);
            const url = `http://localhost:3000${path.startsWith('/') ? path : '/' + path}`;

            // Create request with only header token (no cookie)
            const req = new NextRequest(url, {
              method,
              headers: {
                'x-csrf-token': headerToken,
              },
            });

            // Execute
            const response = await wrappedHandler(req);

            // Verify: Should return 403
            expect(response.status).toBe(403);
            expect(handlerCalled.value).toBe(false);

            const body = await response.json();
            expect(body.error).toBe('Invalid CSRF token');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 403 for any non-GET request with no tokens at all', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webPath(),
          fc.constantFrom('POST', 'PUT', 'DELETE', 'PATCH'),
          async (path, method) => {
            // Set NODE_ENV to production to enable CSRF validation
            process.env.NODE_ENV = 'production';
            
            const handlerCalled = { value: false };
            const mockHandler: RouteHandler = async (req: NextRequest) => {
              handlerCalled.value = true;
              return NextResponse.json({ success: true });
            };

            const wrappedHandler = withCsrf(mockHandler);
            const url = `http://localhost:3000${path.startsWith('/') ? path : '/' + path}`;

            // Create request with NO tokens
            const req = new NextRequest(url, {
              method,
            });

            // Execute
            const response = await wrappedHandler(req);

            // Verify: Should return 403
            expect(response.status).toBe(403);
            expect(handlerCalled.value).toBe(false);

            const body = await response.json();
            expect(body.error).toContain('CSRF token');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should call handler for any non-GET request with matching tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webPath(),
          fc.constantFrom('POST', 'PUT', 'DELETE', 'PATCH'),
          // Generate safe tokens (alphanumeric only to avoid cookie parsing issues)
          fc.string({ minLength: 20, maxLength: 64 }).map(s => 
            s.replace(/[^a-zA-Z0-9]/g, 'a') || 'a'.repeat(20)
          ),
          async (path, method, token) => {
            const handlerCalled = { value: false };
            const mockHandler: RouteHandler = async (req: NextRequest) => {
              handlerCalled.value = true;
              return NextResponse.json({ success: true, method: req.method });
            };

            const wrappedHandler = withCsrf(mockHandler);
            const url = `http://localhost:3000${path.startsWith('/') ? path : '/' + path}`;

            // Create request with matching tokens
            const req = new NextRequest(url, {
              method,
              headers: {
                'x-csrf-token': token,
                'Cookie': `csrf-token=${token}`,
              },
            });

            // Execute
            const response = await wrappedHandler(req);

            // Verify: Handler should have been called
            expect(handlerCalled.value).toBe(true);

            // Verify: Should return success response from handler
            expect(response.status).toBe(200);
            const body = await response.json();
            expect(body.success).toBe(true);
            expect(body.method).toBe(method);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 9: CSRF Cookie Domain
   * 
   * For any production environment, CSRF cookies should be set with domain
   * `.huntaze.com` to work across subdomains.
   * 
   * Validates: Requirements 8.1
   * 
   * Feature: production-critical-fixes, Property 9: CSRF Cookie Domain
   */
  describe('Property 9: CSRF Cookie Domain', () => {
    it('should set domain to .huntaze.com for any production environment', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random tokens
          fc.string({ minLength: 32, maxLength: 64 }),
          async (token) => {
            // Set NODE_ENV to production
            process.env.NODE_ENV = 'production';

            // Create a response
            const response = NextResponse.json({ token });

            // Set CSRF cookie
            const updatedResponse = setCsrfTokenCookie(response, token);

            // Get the Set-Cookie header
            const setCookieHeader = updatedResponse.headers.get('set-cookie');
            expect(setCookieHeader).toBeTruthy();

            // Verify domain is set to .huntaze.com
            expect(setCookieHeader).toContain('Domain=.huntaze.com');

            // Verify other security settings for production
            expect(setCookieHeader).toContain('HttpOnly');
            expect(setCookieHeader).toContain('Secure');
            expect(setCookieHeader.toLowerCase()).toContain('samesite=lax');
            expect(setCookieHeader).toContain('Max-Age=3600'); // 1 hour
            expect(setCookieHeader).toContain('Path=/');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not set domain for any development environment', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random tokens
          fc.string({ minLength: 32, maxLength: 64 }),
          async (token) => {
            // Set NODE_ENV to development
            process.env.NODE_ENV = 'development';

            // Create a response
            const response = NextResponse.json({ token });

            // Set CSRF cookie
            const updatedResponse = setCsrfTokenCookie(response, token);

            // Get the Set-Cookie header
            const setCookieHeader = updatedResponse.headers.get('set-cookie');
            expect(setCookieHeader).toBeTruthy();

            // Verify domain is NOT set (should not contain Domain= at all)
            expect(setCookieHeader).not.toContain('Domain=');

            // Verify HttpOnly is still set
            expect(setCookieHeader).toContain('HttpOnly');

            // Verify Secure is NOT set in development
            expect(setCookieHeader).not.toContain('Secure');

            // Verify other settings
            expect(setCookieHeader.toLowerCase()).toContain('samesite=lax');
            expect(setCookieHeader).toContain('Max-Age=3600');
            expect(setCookieHeader).toContain('Path=/');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not set domain for any test environment', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 32, maxLength: 64 }),
          async (token) => {
            // Set NODE_ENV to test
            process.env.NODE_ENV = 'test';

            // Create a response
            const response = NextResponse.json({ token });

            // Set CSRF cookie
            const updatedResponse = setCsrfTokenCookie(response, token);

            // Get the Set-Cookie header
            const setCookieHeader = updatedResponse.headers.get('set-cookie');
            expect(setCookieHeader).toBeTruthy();

            // Verify domain is NOT set
            expect(setCookieHeader).not.toContain('Domain=');

            // Verify Secure is NOT set in test
            expect(setCookieHeader).not.toContain('Secure');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate token if not provided', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(undefined),
          async () => {
            process.env.NODE_ENV = 'production';

            // Create a response
            const response = NextResponse.json({ success: true });

            // Set CSRF cookie without providing a token
            const updatedResponse = setCsrfTokenCookie(response);

            // Get the Set-Cookie header
            const setCookieHeader = updatedResponse.headers.get('set-cookie');
            expect(setCookieHeader).toBeTruthy();

            // Verify a token was generated and set
            expect(setCookieHeader).toContain('csrf-token=');

            // Verify domain is set for production
            expect(setCookieHeader).toContain('Domain=.huntaze.com');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should set consistent cookie attributes across all tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 32, maxLength: 64 }), { minLength: 2, maxLength: 10 }),
          async (tokens) => {
            process.env.NODE_ENV = 'production';

            const setCookieHeaders: string[] = [];

            // Set cookies for all tokens
            for (const token of tokens) {
              const response = NextResponse.json({ token });
              const updatedResponse = setCsrfTokenCookie(response, token);
              const header = updatedResponse.headers.get('set-cookie');
              if (header) {
                setCookieHeaders.push(header);
              }
            }

            // Verify all headers have the same attributes (except the token value)
            for (const header of setCookieHeaders) {
              expect(header).toContain('Domain=.huntaze.com');
              expect(header).toContain('HttpOnly');
              expect(header).toContain('Secure');
              expect(header.toLowerCase()).toContain('samesite=lax');
              expect(header).toContain('Max-Age=3600');
              expect(header).toContain('Path=/');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
