/**
 * Tests for middleware types
 * 
 * Verifies that middleware types are compatible with Next.js 16.0.3 App Router
 */

import { describe, it, expect } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import type {
  RouteHandler,
  MiddlewareWrapper,
  AsyncMiddleware,
  MiddlewareResult,
} from '@/lib/middleware/types';
import {
  composeMiddleware,
  isNextResponse,
  isRouteHandler,
} from '@/lib/middleware/types';

describe('Middleware Types', () => {
  describe('RouteHandler', () => {
    it('should accept NextRequest and return Promise<NextResponse>', async () => {
      const handler: RouteHandler = async (req: NextRequest) => {
        return NextResponse.json({ message: 'test' });
      };

      const req = new NextRequest('http://localhost:3000/api/test');
      const response = await handler(req);

      expect(response).toBeInstanceOf(NextResponse);
    });
  });

  describe('MiddlewareWrapper', () => {
    it('should wrap a handler and maintain type safety', async () => {
      const wrapper: MiddlewareWrapper = (handler) => {
        return async (req) => {
          // Add custom logic
          return handler(req);
        };
      };

      const handler: RouteHandler = async (req) => {
        return NextResponse.json({ success: true });
      };

      const wrappedHandler = wrapper(handler);
      const req = new NextRequest('http://localhost:3000/api/test');
      const response = await wrappedHandler(req);

      expect(response).toBeInstanceOf(NextResponse);
    });

    it('should allow middleware to intercept and return early', async () => {
      const authMiddleware: MiddlewareWrapper = (handler) => {
        return async (req) => {
          const authHeader = req.headers.get('authorization');
          if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          }
          return handler(req);
        };
      };

      const handler: RouteHandler = async (req) => {
        return NextResponse.json({ success: true });
      };

      const wrappedHandler = authMiddleware(handler);
      const req = new NextRequest('http://localhost:3000/api/test');
      const response = await wrappedHandler(req);

      expect(response.status).toBe(401);
    });
  });

  describe('AsyncMiddleware', () => {
    it('should return null to allow request to proceed', async () => {
      const middleware: AsyncMiddleware = async (req) => {
        // Check passes
        return null;
      };

      const req = new NextRequest('http://localhost:3000/api/test');
      const result = await middleware(req);

      expect(result).toBeNull();
    });

    it('should return NextResponse to block request', async () => {
      const middleware: AsyncMiddleware = async (req) => {
        return NextResponse.json({ error: 'Blocked' }, { status: 403 });
      };

      const req = new NextRequest('http://localhost:3000/api/test');
      const result = await middleware(req);

      expect(result).toBeInstanceOf(NextResponse);
      expect(result?.status).toBe(403);
    });
  });

  describe('composeMiddleware', () => {
    it('should compose multiple middlewares in order', async () => {
      const calls: string[] = [];

      const middleware1: MiddlewareWrapper = (handler) => {
        return async (req) => {
          calls.push('middleware1');
          return handler(req);
        };
      };

      const middleware2: MiddlewareWrapper = (handler) => {
        return async (req) => {
          calls.push('middleware2');
          return handler(req);
        };
      };

      const middleware3: MiddlewareWrapper = (handler) => {
        return async (req) => {
          calls.push('middleware3');
          return handler(req);
        };
      };

      const handler: RouteHandler = async (req) => {
        calls.push('handler');
        return NextResponse.json({ success: true });
      };

      const composed = composeMiddleware([middleware1, middleware2, middleware3]);
      const wrappedHandler = composed(handler);

      const req = new NextRequest('http://localhost:3000/api/test');
      await wrappedHandler(req);

      expect(calls).toEqual(['middleware1', 'middleware2', 'middleware3', 'handler']);
    });

    it('should allow middleware to short-circuit the chain', async () => {
      const calls: string[] = [];

      const middleware1: MiddlewareWrapper = (handler) => {
        return async (req) => {
          calls.push('middleware1');
          return handler(req);
        };
      };

      const middleware2: MiddlewareWrapper = (handler) => {
        return async (req) => {
          calls.push('middleware2');
          // Short-circuit here
          return NextResponse.json({ error: 'Blocked' }, { status: 403 });
        };
      };

      const middleware3: MiddlewareWrapper = (handler) => {
        return async (req) => {
          calls.push('middleware3');
          return handler(req);
        };
      };

      const handler: RouteHandler = async (req) => {
        calls.push('handler');
        return NextResponse.json({ success: true });
      };

      const composed = composeMiddleware([middleware1, middleware2, middleware3]);
      const wrappedHandler = composed(handler);

      const req = new NextRequest('http://localhost:3000/api/test');
      const response = await wrappedHandler(req);

      expect(calls).toEqual(['middleware1', 'middleware2']);
      expect(response.status).toBe(403);
    });
  });

  describe('Type Guards', () => {
    describe('isNextResponse', () => {
      it('should return true for NextResponse instances', () => {
        const response = NextResponse.json({ test: true });
        expect(isNextResponse(response)).toBe(true);
      });

      it('should return false for non-NextResponse values', () => {
        expect(isNextResponse(null)).toBe(false);
        expect(isNextResponse(undefined)).toBe(false);
        expect(isNextResponse({})).toBe(false);
        expect(isNextResponse('string')).toBe(false);
        expect(isNextResponse(123)).toBe(false);
      });
    });

    describe('isRouteHandler', () => {
      it('should return true for functions', () => {
        const handler = async (req: NextRequest) => NextResponse.json({});
        expect(isRouteHandler(handler)).toBe(true);
      });

      it('should return false for non-function values', () => {
        expect(isRouteHandler(null)).toBe(false);
        expect(isRouteHandler(undefined)).toBe(false);
        expect(isRouteHandler({})).toBe(false);
        expect(isRouteHandler('string')).toBe(false);
        expect(isRouteHandler(123)).toBe(false);
      });
    });
  });

  describe('Next.js 16.0.3 Compatibility', () => {
    it('should work with Next.js 16 NextRequest', async () => {
      const handler: RouteHandler = async (req: NextRequest) => {
        // Access Next.js 16 specific properties
        const url = req.nextUrl;
        const method = req.method;
        const headers = req.headers;

        return NextResponse.json({
          url: url.toString(),
          method,
          hasHeaders: headers.has('user-agent'),
        });
      };

      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'user-agent': 'test',
        },
      });

      const response = await handler(req);
      const data = await response.json();

      expect(data.method).toBe('POST');
      expect(data.hasHeaders).toBe(true);
    });

    it('should work with Next.js 16 NextResponse', async () => {
      const handler: RouteHandler = async (req: NextRequest) => {
        const response = NextResponse.json({ success: true });
        
        // Set headers (Next.js 16 API)
        response.headers.set('X-Custom-Header', 'test');
        response.cookies.set('test-cookie', 'value');

        return response;
      };

      const req = new NextRequest('http://localhost:3000/api/test');
      const response = await handler(req);

      expect(response.headers.get('X-Custom-Header')).toBe('test');
      expect(response.cookies.get('test-cookie')?.value).toBe('value');
    });
  });
});
