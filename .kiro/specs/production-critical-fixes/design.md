# Design Document

## Overview

This design document outlines the solution for fixing critical production issues in the Huntaze application. The fixes address type incompatibilities with Next.js 16 App Router, middleware corrections, security headers configuration, and Amplify Compute optimization.

## Architecture

### Current Architecture (Confirmed)

```
┌─────────────────────────────────────────────────────────┐
│                      UTILISATEUR                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         CLOUDFRONT (géré par Amplify)                    │
│         + Lambda@Edge (headers + images)                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         AWS AMPLIFY COMPUTE (ECS Fargate)                │
│  ┌──────────────────────────────────────────────┐      │
│  │  Next.js 16.0.3 (App Router)                  │      │
│  │  - Middlewares: Auth, CSRF, Rate Limit        │      │
│  │  - API Routes                                  │      │
│  │  - SSR + RSC                                   │      │
│  └──────────────────────────────────────────────┘      │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬────────────┐
        ▼            ▼            ▼            ▼
   ┌────────┐  ┌─────────┐  ┌──────────┐  ┌────────┐
   │ Neon   │  │ Gemini  │  │ElastiCache│  │  S3    │
   │ (PG)   │  │   AI    │  │  (Redis)  │  │ Assets │
   └────────┘  └─────────┘  └──────────┘  └────────┘
```

### Middleware Flow

```
Request → CloudFront → Amplify Compute
                           │
                           ▼
                    Next.js Middleware
                           │
                           ▼
                    Rate Limit Check (Redis)
                           │
                           ▼
                    CSRF Validation
                           │
                           ▼
                    Auth Check (NextAuth)
                           │
                           ▼
                    Route Handler
                           │
                           ▼
                    Response
```

## Components and Interfaces

### 1. Middleware Types (`lib/middleware/types.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';

/**
 * Type for Next.js App Router route handlers
 * Compatible with Next.js 16.0.3
 */
export type RouteHandler = (req: NextRequest) => Promise<NextResponse>;

/**
 * Middleware wrapper type
 * Takes a handler and returns a wrapped handler
 */
export type MiddlewareWrapper = (handler: RouteHandler) => RouteHandler;
```

### 2. Auth Middleware (`lib/middleware/auth.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import type { RouteHandler } from './types';

interface AuthOptions {
  requireAdmin?: boolean;
}

export function withAuth(
  handler: RouteHandler,
  options?: AuthOptions
): RouteHandler {
  return async (req: NextRequest) => {
    // 1. Get session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Check admin if required
    if (options?.requireAdmin) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
      });

      if (user?.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
    }

    // 3. Attach user to request
    (req as any).user = session.user;

    // 4. Call handler
    return handler(req);
  };
}
```

### 3. CSRF Middleware (`lib/middleware/csrf.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import type { RouteHandler } from './types';

export function withCsrf(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest) => {
    // Skip for GET requests
    if (req.method === 'GET') {
      return handler(req);
    }

    // Get tokens
    const headerToken = req.headers.get('x-csrf-token');
    const cookieToken = req.cookies.get('csrf-token')?.value;

    // Validate
    if (!headerToken || !cookieToken || headerToken !== cookieToken) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    return handler(req);
  };
}
```

### 4. Rate Limit Middleware (`lib/middleware/rate-limit.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { Redis } from 'ioredis';
import type { RouteHandler } from './types';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

export function withRateLimit(
  handler: RouteHandler,
  options: RateLimitOptions
): RouteHandler {
  return async (req: NextRequest) => {
    // Get real IP from CloudFront
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor 
      ? forwardedFor.split(',')[0].trim()
      : req.headers.get('x-real-ip') || 'unknown';
    
    const key = `rate-limit:${ip}:${req.nextUrl.pathname}`;
    
    try {
      // Increment counter
      const count = await redis.incr(key);
      
      // Set expiry on first request
      if (count === 1) {
        await redis.expire(key, Math.floor(options.windowMs / 1000));
      }
      
      // Check limit
      if (count > options.maxRequests) {
        return NextResponse.json(
          { 
            error: 'Too many requests',
            retryAfter: await redis.ttl(key)
          },
          { 
            status: 429,
            headers: {
              'Retry-After': (await redis.ttl(key)).toString(),
              'X-RateLimit-Limit': options.maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
            }
          }
        );
      }

      // Add rate limit headers
      const response = await handler(req);
      response.headers.set('X-RateLimit-Limit', options.maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', (options.maxRequests - count).toString());
      
      return response;
      
    } catch (error) {
      console.error('Rate limit error:', error);
      // Fail open - allow request if Redis is down
      return handler(req);
    }
  };
}
```

### 5. Next.js Config (`next.config.ts`)

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Core
  reactStrictMode: true,
  compress: true,
  
  // Output for Amplify Compute
  output: 'standalone',

  // Turbopack for dev (Next.js 16)
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
        ],
      },
    ];
  },

  // Images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.huntaze.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    unoptimized: true, // Amplify handles optimization
  },

  // Webpack config
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
```

### 6. CSRF Token Route (`app/api/csrf/token/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export async function GET(req: NextRequest) {
  // Generate CSRF token
  const token = randomBytes(32).toString('hex');
  
  const response = NextResponse.json({ token });
  
  // Set cookie with correct domain
  const domain = process.env.NODE_ENV === 'production'
    ? '.huntaze.com'
    : undefined;
  
  response.cookies.set('csrf-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain,
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
  
  return response;
}
```

## Data Models

No new data models are required. The fixes work with existing models:
- User (with role field)
- Session (NextAuth)
- Redis keys for rate limiting

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Middleware Type Safety

*For any* middleware function, when it wraps a RouteHandler, the wrapped function should also be a valid RouteHandler that accepts NextRequest and returns Promise<NextResponse>

**Validates: Requirements 1.1, 1.2, 2.2**

### Property 2: Auth Middleware Rejection

*For any* unauthenticated request to a protected route, the auth middleware should return a 401 status code without calling the wrapped handler

**Validates: Requirements 3.2**

### Property 3: Admin Access Control

*For any* non-admin user attempting to access an admin route, the auth middleware should return a 403 status code

**Validates: Requirements 3.4**

### Property 4: CSRF GET Request Bypass

*For any* GET request, the CSRF middleware should skip validation and call the wrapped handler directly

**Validates: Requirements 4.1**

### Property 5: CSRF Token Validation

*For any* non-GET request with mismatched CSRF tokens, the middleware should return a 403 status code

**Validates: Requirements 4.4**

### Property 6: Rate Limit IP Extraction

*For any* request with x-forwarded-for header containing multiple IPs, the rate limit middleware should use the first IP in the comma-separated list

**Validates: Requirements 5.2**

### Property 7: Rate Limit Enforcement

*For any* IP exceeding the configured rate limit, the middleware should return a 429 status code with appropriate headers

**Validates: Requirements 5.4, 5.5**

### Property 8: Rate Limit Fail Open

*For any* request when Redis is unavailable, the rate limit middleware should allow the request to proceed

**Validates: Requirements 5.6**

### Property 9: CSRF Cookie Domain

*For any* production environment, CSRF cookies should be set with domain `.huntaze.com` to work across subdomains

**Validates: Requirements 8.1**

### Property 10: Security Headers Presence

*For any* response, the configured security headers should be present in the response headers

**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

## Error Handling

### Middleware Errors

- Auth failures return 401/403 with JSON error message
- CSRF failures return 403 with JSON error message
- Rate limit failures return 429 with retry information
- Redis errors in rate limiting fail open (allow request)

### Configuration Errors

- Missing environment variables should be caught at build time
- Invalid Next.js config should fail the build
- Type errors should be caught by TypeScript compiler

## Testing Strategy

### Unit Tests

- Test each middleware in isolation
- Test type safety with TypeScript compiler
- Test error handling paths
- Test edge cases (empty headers, malformed data)

### Integration Tests

- Test middleware composition
- Test full request flow through multiple middlewares
- Test with real Redis instance
- Test CSRF token generation and validation
- Test rate limiting across multiple requests

### Property-Based Tests

Using `fast-check` library (already in dependencies):

- Generate random requests and verify middleware behavior
- Test rate limiting with random IP addresses
- Test CSRF validation with random tokens
- Verify type safety properties hold for all inputs

Each property-based test should run minimum 100 iterations and be tagged with:
`**Feature: production-critical-fixes, Property {number}: {property_text}**`
