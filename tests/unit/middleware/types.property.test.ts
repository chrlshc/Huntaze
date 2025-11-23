/**
 * Property-Based Tests for Middleware Type Safety
 * 
 * Tests universal properties that should hold for all middleware type compositions
 * using fast-check for property-based testing.
 * 
 * Feature: production-critical-fixes
 */

import { describe, it, expect } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import * as fc from 'fast-check';
import type { RouteHandler, MiddlewareWrapper } from '@/lib/middleware/types';
import { composeMiddleware, isNextResponse, isRouteHandler } from '@/lib/middleware/types';
import { withAuth } from '@/lib/middleware/auth';
import { withCsrf } from '@/lib/middleware/csrf';
import { withRateLimit } from '@/lib/middleware/rate-limit';

describe('Middleware Type Safety Property Tests', () => {
  /**
   * Property 1: Middleware Type Safety
   * 
   * For any middleware function, when it wraps a RouteHandler, the wrapped
   * function should also be a valid RouteHandler that accepts NextRequest
   * and returns Promise<NextResponse>.
   * 
   * Validates: Requirements 1.1, 1.2, 2.2
   * 
   * Feature: production-critical-fixes, Property 1: Middleware Type Safety
   */
  describe('Property 1: Middleware Type Safety', () => {
    it('should maintain RouteHandler type signature when wrapping with any middleware', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random URL paths
          fc.webPath(),
          // Generate random HTTP methods
          fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
          async (path, method) => {
            // Create a base handler that is a valid RouteHandler
            const baseHandler: RouteHandler = async (req: NextRequest) => {
              return NextResponse.json({ 
                success: true, 
                method: req.method,
                path: req.nextUrl.pathname 
              });
            };

            // Verify base handler is a RouteHandler
            expect(isRouteHandler(baseHandler)).toBe(true);

            // Test withCsrf middleware
            const csrfWrapped = withCsrf(baseHandler);
            expect(isRouteHandler(csrfWrapped)).toBe(true);

            // Test withRateLimit middleware
            const rateLimitWrapped = withRateLimit(baseHandler, {
              maxRequests: 100,
              windowMs: 60000,
            });
            expect(isRouteHandler(rateLimitWrapped)).toBe(true);

            // Verify wrapped handlers can be called with NextRequest
            const url = `http://localhost:3000${path.startsWith('/') ? path : '/' + path}`;
            const req = new NextRequest(url, { method });

            // Call CSRF wrapped handler (GET should bypass)
            if (method === 'GET') {
              const csrfResponse = await csrfWrapped(req);
              expect(isNextResponse(csrfResponse)).toBe(true);
              expect(csrfResponse).toBeInstanceOf(NextResponse);
            }

            // Call rate limit wrapped handler
            const rateLimitResponse = await rateLimitWrapped(req);
            expect(isNextResponse(rateLimitResponse)).toBe(true);
            expect(rateLimitResponse).toBeInstanceOf(NextResponse);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain type safety when composing multiple middlewares', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webPath(),
          async (path) => {
            // Create a base handler
            const baseHandler: RouteHandler = async (req: NextRequest) => {
              return NextResponse.json({ success: true });
            };

            // Compose multiple middlewares
            const composed = composeMiddleware([
              withCsrf,
              (handler: RouteHandler) => withRateLimit(handler, {
                maxRequests: 100,
                windowMs: 60000,
              }),
            ]);

            // Apply composition
            const wrappedHandler = composed(baseHandler);

            // Verify result is still a RouteHandler
            expect(isRouteHandler(wrappedHandler)).toBe(true);

            // Verify it can be called with NextRequest
            const url = `http://localhost:3000${path.startsWith('/') ? path : '/' + path}`;
            const req = new NextRequest(url, { method: 'GET' });

            const response = await wrappedHandler(req);
            expect(isNextResponse(response)).toBe(true);
            expect(response).toBeInstanceOf(NextResponse);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept NextRequest and return Promise<NextResponse> for any wrapped handler', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webPath(),
          fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
          fc.record({
            // Only use status codes that are valid for JSON responses
            // Exclude 204, 205, 304 which cannot have body
            statusCode: fc.constantFrom(200, 201, 202, 203, 400, 401, 403, 404, 500, 502, 503),
            message: fc.string(),
          }),
          async (path, method, responseData) => {
            // Create handler that returns custom response
            const baseHandler: RouteHandler = async (req: NextRequest) => {
              return NextResponse.json(
                { message: responseData.message },
                { status: responseData.statusCode }
              );
            };

            // Wrap with CSRF middleware
            const wrappedHandler = withCsrf(baseHandler);

            // Create request
            const url = `http://localhost:3000${path.startsWith('/') ? path : '/' + path}`;
            const req = new NextRequest(url, { method });

            // For GET requests, CSRF should pass through
            if (method === 'GET') {
              const response = await wrappedHandler(req);

              // Verify response type
              expect(response).toBeInstanceOf(NextResponse);
              expect(isNextResponse(response)).toBe(true);

              // Verify response properties
              expect(response.status).toBe(responseData.statusCode);
              const body = await response.json();
              expect(body.message).toBe(responseData.message);
            } else {
              // For non-GET without CSRF token, should return 403
              const response = await wrappedHandler(req);
              expect(response).toBeInstanceOf(NextResponse);
              expect(isNextResponse(response)).toBe(true);
              expect(response.status).toBe(403);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve type safety through multiple layers of middleware wrapping', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webPath(),
          fc.integer({ min: 1, max: 5 }),
          async (path, layers) => {
            // Create base handler
            let handler: RouteHandler = async (req: NextRequest) => {
              return NextResponse.json({ success: true, layers: 0 });
            };

            // Verify initial handler is valid
            expect(isRouteHandler(handler)).toBe(true);

            // Wrap with multiple layers of the same middleware
            for (let i = 0; i < layers; i++) {
              handler = withCsrf(handler);
              
              // After each wrap, verify it's still a valid RouteHandler
              expect(isRouteHandler(handler)).toBe(true);
            }

            // Verify final handler can be called
            const url = `http://localhost:3000${path.startsWith('/') ? path : '/' + path}`;
            const req = new NextRequest(url, { method: 'GET' });

            const response = await handler(req);
            expect(isNextResponse(response)).toBe(true);
            expect(response).toBeInstanceOf(NextResponse);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain type compatibility with Next.js App Router route exports', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webPath(),
          async (path) => {
            // Simulate how routes are exported in Next.js App Router
            const baseHandler: RouteHandler = async (req: NextRequest) => {
              return NextResponse.json({ success: true });
            };

            // Wrap with middleware (as would be done in route.ts files)
            const GET = withCsrf(baseHandler);
            const POST = withCsrf(baseHandler);

            // Verify exports are valid RouteHandlers
            expect(isRouteHandler(GET)).toBe(true);
            expect(isRouteHandler(POST)).toBe(true);

            // Verify they can be called
            const url = `http://localhost:3000${path.startsWith('/') ? path : '/' + path}`;
            
            const getReq = new NextRequest(url, { method: 'GET' });
            const getResponse = await GET(getReq);
            expect(isNextResponse(getResponse)).toBe(true);

            const postReq = new NextRequest(url, { method: 'POST' });
            const postResponse = await POST(postReq);
            expect(isNextResponse(postResponse)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle middleware composition in any order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webPath(),
          fc.shuffledSubarray([
            'csrf',
            'rateLimit',
          ] as const, { minLength: 2, maxLength: 2 }),
          async (path, middlewareOrder) => {
            // Create base handler
            const baseHandler: RouteHandler = async (req: NextRequest) => {
              return NextResponse.json({ success: true });
            };

            // Build middleware array based on random order
            const middlewares: MiddlewareWrapper[] = middlewareOrder.map(name => {
              switch (name) {
                case 'csrf':
                  return withCsrf;
                case 'rateLimit':
                  return (handler: RouteHandler) => withRateLimit(handler, {
                    maxRequests: 100,
                    windowMs: 60000,
                  });
              }
            });

            // Compose middlewares
            const composed = composeMiddleware(middlewares);
            const wrappedHandler = composed(baseHandler);

            // Verify result is a valid RouteHandler
            expect(isRouteHandler(wrappedHandler)).toBe(true);

            // Verify it can be called
            const url = `http://localhost:3000${path.startsWith('/') ? path : '/' + path}`;
            const req = new NextRequest(url, { method: 'GET' });

            const response = await wrappedHandler(req);
            expect(isNextResponse(response)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve request and response types through middleware chain', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webPath(),
          fc.record({
            responseData: fc.string(),
          }),
          async (path, data) => {
            // Create handler that uses request and returns specific response
            const baseHandler: RouteHandler = async (req: NextRequest) => {
              // Access request properties
              const method = req.method;
              const pathname = req.nextUrl.pathname;
              
              // Return response with data
              return NextResponse.json({
                method,
                pathname,
                responseData: data.responseData,
              });
            };

            // Wrap with middleware
            const wrappedHandler = withCsrf(baseHandler);

            // Create request (GET method doesn't allow body)
            const url = `http://localhost:3000${path.startsWith('/') ? path : '/' + path}`;
            const req = new NextRequest(url, { 
              method: 'GET',
            });

            // Call handler
            const response = await wrappedHandler(req);

            // Verify response type and data
            expect(isNextResponse(response)).toBe(true);
            const body = await response.json();
            expect(body).toHaveProperty('method');
            expect(body).toHaveProperty('pathname');
            expect(body).toHaveProperty('responseData');
            expect(body.responseData).toBe(data.responseData);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Type Guard Functions', () => {
    it('should correctly identify NextResponse instances', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            // Use JSON-serializable data only
            data: fc.oneof(
              fc.string(),
              fc.integer(),
              fc.boolean(),
              fc.constant(null),
              fc.array(fc.string()),
              fc.record({ message: fc.string(), value: fc.integer() }),
            ),
            // Only use status codes that are valid for JSON responses
            // Exclude 204, 205, 304 which cannot have body
            status: fc.constantFrom(200, 201, 202, 203, 400, 401, 403, 404, 500, 502, 503),
          }),
          async ({ data, status }) => {
            const response = NextResponse.json(data, { status });
            expect(isNextResponse(response)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly reject non-NextResponse values', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.constant(null),
            fc.constant(undefined),
            fc.object(),
            fc.array(fc.anything()),
          ),
          async (value) => {
            expect(isNextResponse(value)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly identify RouteHandler functions', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(undefined),
          async () => {
            const handler: RouteHandler = async (req: NextRequest) => {
              return NextResponse.json({ success: true });
            };
            expect(isRouteHandler(handler)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly reject non-function values as RouteHandlers', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.constant(null),
            fc.constant(undefined),
            fc.object(),
            fc.array(fc.anything()),
          ),
          async (value) => {
            expect(isRouteHandler(value)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
