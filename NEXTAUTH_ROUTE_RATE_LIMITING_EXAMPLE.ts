/**
 * NextAuth Route - Rate Limiting Integration Example
 * 
 * This file shows how to integrate rate limiting into the NextAuth route
 * to protect against brute force attacks and DDoS.
 * 
 * @see app/api/auth/[...nextauth]/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter } from '@/lib/services/rate-limiter';

// ============================================================================
// Rate Limiting Configuration
// ============================================================================

/**
 * Rate limit configuration for authentication endpoints
 */
const AUTH_RATE_LIMITS = {
  // IP-based limits (prevent brute force from single IP)
  ip: {
    signin: {
      maxRequests: 5,
      windowMs: 60 * 1000, // 1 minute
    },
    callback: {
      maxRequests: 10,
      windowMs: 60 * 1000, // 1 minute
    },
  },
  
  // Email-based limits (prevent account enumeration)
  email: {
    signin: {
      maxRequests: 10,
      windowMs: 60 * 60 * 1000, // 1 hour
    },
  },
};

// ============================================================================
// Rate Limiting Helper Functions
// ============================================================================

/**
 * Get client IP from request
 */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') || // Cloudflare
    'unknown'
  );
}

/**
 * Extract email from request body (for email-based rate limiting)
 */
async function extractEmail(request: NextRequest): Promise<string | null> {
  try {
    // Clone request to read body without consuming it
    const clonedRequest = request.clone();
    const body = await clonedRequest.json();
    
    // Check for email in various formats
    return body?.email || body?.credentials?.email || null;
  } catch {
    return null;
  }
}

/**
 * Check rate limit for authentication request
 */
async function checkAuthRateLimit(
  request: NextRequest,
  correlationId: string
): Promise<{ allowed: boolean; retryAfter?: number; reason?: string }> {
  const clientIp = getClientIp(request);
  const pathname = request.nextUrl.pathname;
  
  // Determine endpoint type
  const isSignIn = pathname.includes('/signin') || pathname.includes('/callback/credentials');
  const isCallback = pathname.includes('/callback');
  
  console.log(`[Auth] [${correlationId}] Rate limit check:`, {
    clientIp,
    pathname,
    isSignIn,
    isCallback,
  });

  // Check IP-based rate limit
  const ipLimit = isSignIn 
    ? AUTH_RATE_LIMITS.ip.signin 
    : AUTH_RATE_LIMITS.ip.callback;
  
  const ipRateLimitResult = await rateLimiter.checkLimit({
    identifier: clientIp,
    endpoint: pathname,
    method: request.method,
    maxRequests: ipLimit.maxRequests,
    windowMs: ipLimit.windowMs,
  });

  if (!ipRateLimitResult.allowed) {
    console.warn(`[Auth] [${correlationId}] IP rate limit exceeded:`, {
      clientIp,
      remaining: ipRateLimitResult.remaining,
      resetAt: ipRateLimitResult.resetAt,
    });
    
    return {
      allowed: false,
      retryAfter: ipRateLimitResult.retryAfter,
      reason: 'IP rate limit exceeded',
    };
  }

  // Check email-based rate limit for sign-in attempts
  if (isSignIn && request.method === 'POST') {
    const email = await extractEmail(request);
    
    if (email) {
      const emailLimit = AUTH_RATE_LIMITS.email.signin;
      
      const emailRateLimitResult = await rateLimiter.checkLimit({
        identifier: `email:${email.toLowerCase()}`,
        endpoint: pathname,
        method: request.method,
        maxRequests: emailLimit.maxRequests,
        windowMs: emailLimit.windowMs,
      });

      if (!emailRateLimitResult.allowed) {
        console.warn(`[Auth] [${correlationId}] Email rate limit exceeded:`, {
          email: email.substring(0, 3) + '***',
          remaining: emailRateLimitResult.remaining,
          resetAt: emailRateLimitResult.resetAt,
        });
        
        return {
          allowed: false,
          retryAfter: emailRateLimitResult.retryAfter,
          reason: 'Email rate limit exceeded',
        };
      }
    }
  }

  console.log(`[Auth] [${correlationId}] Rate limit check passed`);
  
  return { allowed: true };
}

// ============================================================================
// Enhanced POST Handler with Rate Limiting
// ============================================================================

/**
 * POST handler with rate limiting
 * 
 * This is an example of how to integrate rate limiting into the existing
 * POST handler in app/api/auth/[...nextauth]/route.ts
 */
export async function POST_WITH_RATE_LIMITING(request: NextRequest) {
  const correlationId = generateCorrelationId();
  const startTime = Date.now();

  try {
    // 1. Check rate limit BEFORE processing request
    const rateLimitResult = await checkAuthRateLimit(request, correlationId);
    
    if (!rateLimitResult.allowed) {
      const duration = Date.now() - startTime;
      
      console.warn(`[Auth] [${correlationId}] Request blocked by rate limiter:`, {
        reason: rateLimitResult.reason,
        retryAfter: rateLimitResult.retryAfter,
        duration,
      });
      
      // Return 429 Too Many Requests
      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'RATE_LIMIT_EXCEEDED',
            message: rateLimitResult.reason || 'Too many requests',
            userMessage: 'Too many authentication attempts. Please try again later.',
            correlationId,
            statusCode: 429,
            retryable: false,
            timestamp: new Date().toISOString(),
          },
          correlationId,
          duration,
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + (rateLimitResult.retryAfter || 60) * 1000).toISOString(),
          },
        }
      );
    }

    // 2. Log request (without sensitive data)
    logAuthRequest('POST', request.nextUrl.pathname, correlationId, {
      searchParams: Object.fromEntries(request.nextUrl.searchParams),
      contentType: request.headers.get('content-type'),
      clientIp: getClientIp(request),
    });

    // 3. Execute with timeout (existing logic)
    const response = await withTimeout(
      handler(request as any, {} as any),
      REQUEST_TIMEOUT_MS,
      correlationId
    ) as Response;

    const duration = Date.now() - startTime;

    // 4. Log success
    console.log(`[Auth] [${correlationId}] POST request successful`, {
      correlationId,
      duration,
      status: response.status,
    });

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log error with duration
    logAuthError(error as Error, correlationId, { duration });

    return handleAuthError(error as Error, correlationId);
  }
}

// ============================================================================
// Enhanced GET Handler with Rate Limiting
// ============================================================================

/**
 * GET handler with rate limiting
 * 
 * This is an example of how to integrate rate limiting into the existing
 * GET handler in app/api/auth/[...nextauth]/route.ts
 */
export async function GET_WITH_RATE_LIMITING(request: NextRequest) {
  const correlationId = generateCorrelationId();
  const startTime = Date.now();

  try {
    // 1. Check rate limit (more lenient for GET requests)
    const clientIp = getClientIp(request);
    
    const rateLimitResult = await rateLimiter.checkLimit({
      identifier: clientIp,
      endpoint: request.nextUrl.pathname,
      method: 'GET',
      maxRequests: 30, // More lenient for session checks
      windowMs: 60 * 1000, // 1 minute
    });

    if (!rateLimitResult.allowed) {
      const duration = Date.now() - startTime;
      
      console.warn(`[Auth] [${correlationId}] GET request blocked by rate limiter:`, {
        clientIp,
        retryAfter: rateLimitResult.retryAfter,
        duration,
      });
      
      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests',
            userMessage: 'Too many requests. Please try again later.',
            correlationId,
            statusCode: 429,
            retryable: false,
            timestamp: new Date().toISOString(),
          },
          correlationId,
          duration,
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
          },
        }
      );
    }

    // 2. Log request
    logAuthRequest('GET', request.nextUrl.pathname, correlationId, {
      searchParams: Object.fromEntries(request.nextUrl.searchParams),
      clientIp,
    });

    // 3. Execute with timeout (existing logic)
    const response = await withTimeout(
      handler(request as any, {} as any),
      REQUEST_TIMEOUT_MS,
      correlationId
    ) as Response;

    const duration = Date.now() - startTime;

    // 4. Log success
    console.log(`[Auth] [${correlationId}] GET request successful`, {
      correlationId,
      duration,
      status: response.status,
    });

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log error with duration
    logAuthError(error as Error, correlationId, { duration });

    return handleAuthError(error as Error, correlationId);
  }
}

// ============================================================================
// Usage Instructions
// ============================================================================

/**
 * To integrate rate limiting into app/api/auth/[...nextauth]/route.ts:
 * 
 * 1. Import rate limiter:
 *    ```typescript
 *    import { rateLimiter } from '@/lib/services/rate-limiter';
 *    ```
 * 
 * 2. Add rate limit check at the beginning of POST handler:
 *    ```typescript
 *    export async function POST(request: NextRequest) {
 *      const correlationId = generateCorrelationId();
 *      const startTime = Date.now();
 * 
 *      try {
 *        // Add this rate limit check
 *        const rateLimitResult = await checkAuthRateLimit(request, correlationId);
 *        
 *        if (!rateLimitResult.allowed) {
 *          return NextResponse.json(
 *            { error: 'Rate limit exceeded' },
 *            { status: 429 }
 *          );
 *        }
 * 
 *        // Continue with existing logic...
 *      } catch (error) {
 *        // Error handling...
 *      }
 *    }
 *    ```
 * 
 * 3. Add rate limit check to GET handler (optional, more lenient):
 *    ```typescript
 *    export async function GET(request: NextRequest) {
 *      // Similar to POST but with higher limits
 *    }
 *    ```
 * 
 * 4. Monitor rate limit metrics:
 *    ```typescript
 *    // Check rate limit stats
 *    const stats = await rateLimiter.getStats();
 *    console.log('Rate limit stats:', stats);
 *    ```
 */

// ============================================================================
// Testing
// ============================================================================

/**
 * Test rate limiting:
 * 
 * 1. Test IP-based rate limiting:
 *    ```bash
 *    # Make 6 requests quickly (should block 6th)
 *    for i in {1..6}; do
 *      curl -X POST http://localhost:3000/api/auth/callback/credentials \
 *        -H "Content-Type: application/json" \
 *        -d '{"email":"test@example.com","password":"password123"}'
 *    done
 *    ```
 * 
 * 2. Test email-based rate limiting:
 *    ```bash
 *    # Make 11 requests with same email (should block 11th)
 *    for i in {1..11}; do
 *      curl -X POST http://localhost:3000/api/auth/callback/credentials \
 *        -H "Content-Type: application/json" \
 *        -d '{"email":"test@example.com","password":"password123"}'
 *      sleep 6 # Wait 6 seconds between requests to avoid IP limit
 *    done
 *    ```
 * 
 * 3. Verify Retry-After header:
 *    ```bash
 *    curl -i -X POST http://localhost:3000/api/auth/callback/credentials \
 *      -H "Content-Type: application/json" \
 *      -d '{"email":"test@example.com","password":"password123"}'
 *    # Should see: Retry-After: 60
 *    ```
 */

// ============================================================================
// Monitoring
// ============================================================================

/**
 * Monitor rate limiting effectiveness:
 * 
 * 1. Track blocked requests:
 *    ```typescript
 *    metrics.increment('auth.rate_limit.blocked', {
 *      reason: 'ip_limit',
 *      endpoint: '/api/auth/callback/credentials',
 *    });
 *    ```
 * 
 * 2. Track successful authentications:
 *    ```typescript
 *    metrics.increment('auth.signin.success', {
 *      provider: 'credentials',
 *    });
 *    ```
 * 
 * 3. Alert on high rate limit hits:
 *    ```typescript
 *    if (rateLimitHits > 100) {
 *      alertService.send({
 *        severity: 'warning',
 *        message: 'High rate limit hits detected',
 *        metadata: { hits: rateLimitHits },
 *      });
 *    }
 *    ```
 */

// Placeholder functions (these exist in the actual route file)
function generateCorrelationId(): string {
  return `auth-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function logAuthRequest(method: string, path: string, correlationId: string, metadata?: any) {
  console.log(`[Auth] [${correlationId}] ${method} ${path}`, metadata);
}

function logAuthError(error: Error, correlationId: string, metadata?: any) {
  console.error(`[Auth] [${correlationId}] Error:`, error.message, metadata);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, correlationId: string): Promise<T> {
  return promise; // Simplified for example
}

function handleAuthError(error: Error, correlationId: string): NextResponse {
  return NextResponse.json({ error: error.message }, { status: 500 });
}

const handler = {} as any; // Placeholder
const REQUEST_TIMEOUT_MS = 10000;
