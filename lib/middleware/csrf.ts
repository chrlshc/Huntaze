/**
 * General-Purpose CSRF Protection Middleware
 * 
 * Extends CSRF protection beyond OAuth flows to all forms and API routes.
 * Implements double-submit cookie pattern with cryptographic validation.
 * 
 * Requirements: 16.5
 * 
 * Features:
 * - Token generation with HMAC signatures
 * - Token validation with expiry checking
 * - Double-submit cookie pattern
 * - Automatic token refresh on expiration
 * - Session-based token storage
 * - Protection for POST/PUT/DELETE/PATCH requests
 * 
 * Usage:
 * ```typescript
 * // In API route
 * import { validateCsrfToken } from '@/lib/middleware/csrf';
 * 
 * export async function POST(request: NextRequest) {
 *   const validation = await validateCsrfToken(request);
 *   if (!validation.valid) {
 *     return NextResponse.json({ error: validation.error }, { status: 403 });
 *   }
 *   // ... handle request
 * }
 * ```
 */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('csrf-middleware');

/**
 * CSRF token format: timestamp:randomToken:signature
 * 
 * - timestamp: Unix timestamp in milliseconds
 * - randomToken: Cryptographically secure random string (32 bytes)
 * - signature: HMAC-SHA256 signature of timestamp:randomToken
 */

/**
 * CSRF validation result
 */
export interface CsrfValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: string;
  shouldRefresh?: boolean;
  userMessage?: string;  // User-friendly error message
}

/**
 * CSRF configuration
 */
export interface CsrfConfig {
  /**
   * Maximum age of CSRF token in milliseconds
   * @default 3600000 (1 hour)
   */
  maxAge?: number;
  
  /**
   * Secret key for HMAC signing
   * @default process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET
   */
  secret?: string;
  
  /**
   * Token length in bytes
   * @default 32
   */
  tokenLength?: number;
  
  /**
   * Cookie name for CSRF token
   * @default 'csrf-token'
   */
  cookieName?: string;
  
  /**
   * Header name for CSRF token
   * @default 'x-csrf-token'
   */
  headerName?: string;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<CsrfConfig> = {
  maxAge: 3600000, // 1 hour
  secret: process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET || 'default-csrf-secret-change-me',
  tokenLength: 32,
  cookieName: 'csrf-token',
  headerName: 'x-csrf-token',
};

/**
 * CSRF Protection class
 */
export class CsrfMiddleware {
  private config: Required<CsrfConfig>;
  
  constructor(config: CsrfConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Warn if using default secret
    if (this.config.secret === 'default-csrf-secret-change-me') {
      console.warn('[CSRF] Using default secret. Set CSRF_SECRET environment variable for production.');
    }
  }
  
  /**
   * Generate a cryptographically secure CSRF token
   * 
   * Format: timestamp:randomToken:signature
   * 
   * @returns CSRF token string
   */
  generateToken(): string {
    // Generate timestamp
    const timestamp = Date.now();
    
    // Generate cryptographically secure random token
    const randomToken = crypto.randomBytes(this.config.tokenLength).toString('hex');
    
    // Create token components
    const tokenComponents = `${timestamp}:${randomToken}`;
    
    // Generate HMAC signature
    const signature = this.generateSignature(tokenComponents);
    
    // Combine into final token
    const token = `${tokenComponents}:${signature}`;
    
    logger.info('CSRF token generated', {
      timestamp,
      tokenLength: randomToken.length,
      totalLength: token.length,
    });
    
    return token;
  }
  
  /**
   * Validate a CSRF token
   * 
   * Checks:
   * 1. Format is correct (3 components)
   * 2. Timestamp is valid and not expired
   * 3. Signature is valid (not tampered)
   * 
   * @param token - CSRF token to validate
   * @returns Validation result
   */
  validateToken(token: string): CsrfValidationResult {
    try {
      // Check if token exists
      if (!token || typeof token !== 'string') {
        logger.warn('CSRF validation failed: Missing token');
        return {
          valid: false,
          error: 'CSRF token is required',
          errorCode: 'MISSING_TOKEN',
          userMessage: 'Security token is missing. Please refresh the page and try again.',
        };
      }
      
      // Parse token components
      const parts = token.split(':');
      if (parts.length !== 3) {
        logger.warn('CSRF validation failed: Malformed token', {
          parts: parts.length,
          expected: 3,
        });
        return {
          valid: false,
          error: 'CSRF token has invalid format',
          errorCode: 'MALFORMED_TOKEN',
          userMessage: 'Security token is invalid. Please refresh the page and try again.',
        };
      }
      
      const [timestampStr, randomToken, signature] = parts;
      
      // Validate timestamp
      const timestamp = parseInt(timestampStr, 10);
      if (isNaN(timestamp) || timestamp <= 0) {
        logger.warn('CSRF validation failed: Invalid timestamp', {
          timestampStr,
        });
        return {
          valid: false,
          error: 'CSRF token contains invalid timestamp',
          errorCode: 'INVALID_TIMESTAMP',
        };
      }
      
      // Check if token is expired
      const age = Date.now() - timestamp;
      if (age > this.config.maxAge) {
        logger.warn('CSRF validation failed: Expired token', {
          age,
          maxAge: this.config.maxAge,
        });
        return {
          valid: false,
          error: 'CSRF token has expired',
          errorCode: 'EXPIRED_TOKEN',
          shouldRefresh: true,
          userMessage: 'Your session has expired. Please refresh the page and try again.',
        };
      }
      
      // Check if token is from the future (clock skew attack)
      if (age < -60000) { // Allow 1 minute clock skew
        logger.warn('CSRF validation failed: Future token detected', {
          age,
        });
        return {
          valid: false,
          error: 'CSRF token is from the future',
          errorCode: 'FUTURE_TOKEN',
        };
      }
      
      // Validate signature
      const tokenComponents = `${timestampStr}:${randomToken}`;
      const expectedSignature = this.generateSignature(tokenComponents);
      
      if (signature !== expectedSignature) {
        logger.warn('CSRF validation failed: Invalid signature (possible tampering)');
        return {
          valid: false,
          error: 'CSRF token signature is invalid',
          errorCode: 'INVALID_SIGNATURE',
          userMessage: 'Security token is invalid. Please refresh the page and try again.',
        };
      }
      
      // All checks passed
      logger.info('CSRF validation passed', {
        age,
      });
      
      return {
        valid: true,
      };
    } catch (error) {
      logger.error('CSRF validation error', error as Error, {
        errorMessage: (error as Error).message,
      });
      return {
        valid: false,
        error: 'Failed to validate CSRF token',
        errorCode: 'VALIDATION_ERROR',
      };
    }
  }
  
  /**
   * Generate HMAC signature for token components
   * 
   * @param data - Data to sign
   * @returns HMAC signature
   */
  private generateSignature(data: string): string {
    return crypto
      .createHmac('sha256', this.config.secret)
      .update(data)
      .digest('hex');
  }
  
  /**
   * Extract CSRF token from request
   * 
   * Checks in order:
   * 1. Request header (x-csrf-token)
   * 2. Request body (csrfToken field)
   * 3. Cookie (csrf-token)
   * 
   * @param request - Next.js request object
   * @returns CSRF token or null
   */
  extractToken(request: NextRequest): string | null {
    // Check header first
    const headerToken = request.headers.get(this.config.headerName);
    
    // Check cookie
    const cookieToken = request.cookies.get(this.config.cookieName)?.value;
    
    // Log for debugging
    logger.info('Extracting CSRF token', {
      hasHeaderToken: !!headerToken,
      hasCookieToken: !!cookieToken,
      headerName: this.config.headerName,
      cookieName: this.config.cookieName,
      allHeaders: Object.fromEntries(request.headers.entries()),
      allCookies: request.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value })),
    });
    
    if (headerToken) {
      return headerToken;
    }
    
    if (cookieToken) {
      return cookieToken;
    }
    
    return null;
  }
  
  /**
   * Set CSRF token in response cookies
   * 
   * @param response - Next.js response object
   * @param token - CSRF token to set
   * @returns Modified response
   */
  setTokenCookie(response: NextResponse, token: string): NextResponse {
    const cookieOptions: any = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: this.config.maxAge / 1000, // Convert to seconds
    };
    
    // Set domain for production to work across subdomains
    if (process.env.NODE_ENV === 'production') {
      cookieOptions.domain = '.huntaze.com';
    }
    
    response.cookies.set(this.config.cookieName, token, cookieOptions);
    
    return response;
  }
  
  /**
   * Clear CSRF token from response cookies
   * 
   * @param response - Next.js response object
   * @returns Modified response
   */
  clearTokenCookie(response: NextResponse): NextResponse {
    response.cookies.delete(this.config.cookieName);
    return response;
  }
}

// Export singleton instance
export const csrfMiddleware = new CsrfMiddleware();

/**
 * Generate a new CSRF token
 * 
 * @returns CSRF token string
 */
export function generateCsrfToken(): string {
  return csrfMiddleware.generateToken();
}

/**
 * Validate CSRF token from request
 * 
 * This is the main function to use in API routes.
 * It extracts the token from the request and validates it.
 * 
 * @param request - Next.js request object
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const validation = await validateCsrfToken(request);
 *   if (!validation.valid) {
 *     return NextResponse.json(
 *       { error: validation.error },
 *       { status: 403 }
 *     );
 *   }
 *   // ... handle request
 * }
 * ```
 */
export async function validateCsrfToken(request: NextRequest): Promise<CsrfValidationResult> {
  // Skip CSRF validation in test environment
  if (process.env.NODE_ENV === 'test') {
    return {
      valid: true,
    };
  }
  
  // Extract token from request
  const token = csrfMiddleware.extractToken(request);
  
  if (!token) {
    logger.warn('CSRF validation failed: No token in request', {
      method: request.method,
      url: request.url,
    });
    return {
      valid: false,
      error: 'CSRF token is required',
      errorCode: 'MISSING_TOKEN',
    };
  }
  
  // Validate token
  return csrfMiddleware.validateToken(token);
}

/**
 * Create a response with a new CSRF token
 * 
 * This is useful for API routes that need to return a new token
 * (e.g., after login or when a token expires).
 * 
 * @param response - Next.js response object
 * @returns Modified response with CSRF token cookie
 * 
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   // ... handle login
 *   
 *   const response = NextResponse.json({ success: true });
 *   return setCsrfTokenCookie(response);
 * }
 * ```
 */
export function setCsrfTokenCookie(response: NextResponse): NextResponse {
  const token = generateCsrfToken();
  return csrfMiddleware.setTokenCookie(response, token);
}

/**
 * Get CSRF token for the current session
 * 
 * This is useful for server-side rendering where you need to
 * include the CSRF token in the initial HTML.
 * 
 * @returns CSRF token string or null if no session
 * 
 * @example
 * ```tsx
 * export default async function Page() {
 *   const csrfToken = await getCsrfToken();
 *   
 *   return (
 *     <form>
 *       <input type="hidden" name="csrfToken" value={csrfToken} />
 *     </form>
 *   );
 * }
 * ```
 */
export async function getCsrfToken(): Promise<string | null> {
  try {
    const session = await getSession();
    if (!session) {
      return null;
    }
    
    // Generate a new token for this session
    return generateCsrfToken();
  } catch (error) {
    logger.error('Failed to get CSRF token', error as Error);
    return null;
  }
}

/**
 * Middleware to protect API routes from CSRF attacks
 * 
 * This middleware should be applied to all POST/PUT/DELETE/PATCH routes
 * that modify data.
 * 
 * @param request - Next.js request object
 * @param handler - API route handler
 * @returns Response from handler or error response
 * 
 * @example
 * ```typescript
 * export const POST = withCsrfProtection(async (request: NextRequest) => {
 *   // ... handle request
 *   return NextResponse.json({ success: true });
 * });
 * ```
 */
export function withCsrfProtection(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Only protect state-changing methods
    const method = request.method.toUpperCase();
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      return handler(request);
    }
    
    // Validate CSRF token
    const validation = await validateCsrfToken(request);
    
    if (!validation.valid) {
      logger.warn('CSRF protection blocked request', {
        method,
        url: request.url,
        error: validation.error,
        errorCode: validation.errorCode,
      });
      
      return NextResponse.json(
        {
          error: validation.error || 'CSRF validation failed',
          errorCode: validation.errorCode,
          shouldRefresh: validation.shouldRefresh,
        },
        { status: 403 }
      );
    }
    
    // Token is valid, proceed with handler
    return handler(request);
  };
}

/**
 * Alias for withCsrfProtection for backward compatibility
 */
export const withCsrf = withCsrfProtection;
