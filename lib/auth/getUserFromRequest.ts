/**
 * User Authentication Utility
 * 
 * Provides utilities for extracting and validating user authentication
 * from Next.js API requests using JWT tokens
 */

import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  id: number;
  email: string;
  name?: string;
  role?: string;
}

export interface AuthError extends Error {
  code: string;
  statusCode: number;
}

/**
 * Create authentication error
 */
function createAuthError(code: string, message: string, statusCode: number = 401): AuthError {
  const error = new Error(message) as AuthError;
  error.code = code;
  error.statusCode = statusCode;
  return error;
}

/**
 * Extract JWT token from request
 * Supports both Authorization header and cookie-based auth
 */
function extractToken(request: NextRequest): string | null {
  // Try Authorization header first (Bearer token)
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try cookie-based auth (for browser requests)
  const tokenCookie = request.cookies.get('auth_token');
  if (tokenCookie) {
    return tokenCookie.value;
  }

  // Try session cookie (alternative name)
  const sessionCookie = request.cookies.get('session_token');
  if (sessionCookie) {
    return sessionCookie.value;
  }

  return null;
}

/**
 * Verify and decode JWT token
 */
function verifyToken(token: string): any {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    throw createAuthError(
      'jwt_secret_missing',
      'JWT secret not configured',
      500
    );
  }

  try {
    return jwt.verify(token, jwtSecret);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw createAuthError(
        'token_expired',
        'Authentication token has expired',
        401
      );
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      throw createAuthError(
        'token_invalid',
        'Invalid authentication token',
        401
      );
    }

    throw createAuthError(
      'token_verification_failed',
      'Token verification failed',
      401
    );
  }
}

/**
 * Extract user from JWT token payload
 */
function extractUserFromPayload(payload: any): AuthenticatedUser {
  // Handle different JWT payload formats
  const userId = payload.id || payload.userId || payload.sub;
  const email = payload.email;
  const name = payload.name || payload.displayName;
  const role = payload.role;

  if (!userId) {
    throw createAuthError(
      'invalid_token_payload',
      'Token payload missing user ID',
      401
    );
  }

  if (!email) {
    throw createAuthError(
      'invalid_token_payload',
      'Token payload missing email',
      401
    );
  }

  return {
    id: typeof userId === 'string' ? parseInt(userId, 10) : userId,
    email,
    name,
    role,
  };
}

/**
 * Extract authenticated user from request
 * Returns null if not authenticated (for optional auth)
 * 
 * @param request - Next.js request object
 * @returns User object or null if not authenticated
 */
export async function getUserFromRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Extract token from request
    const token = extractToken(request);
    if (!token) {
      return null;
    }

    // Verify and decode token
    const payload = verifyToken(token);

    // Extract user from payload
    const user = extractUserFromPayload(payload);

    return user;
  } catch (error) {
    // Log authentication errors for debugging
    console.warn('Authentication failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      code: error instanceof Error && 'code' in error ? (error as AuthError).code : 'unknown',
      url: request.url,
      userAgent: request.headers.get('user-agent'),
    });

    return null;
  }
}

/**
 * Require authentication - throws error if not authenticated
 * Use this for endpoints that require authentication
 * 
 * @param request - Next.js request object
 * @returns User object (guaranteed to be authenticated)
 * @throws AuthError if not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<AuthenticatedUser> {
  const user = await getUserFromRequest(request);
  
  if (!user) {
    throw createAuthError(
      'authentication_required',
      'Authentication required for this endpoint',
      401
    );
  }

  return user;
}

/**
 * Check if user has specific role
 * 
 * @param user - Authenticated user
 * @param requiredRole - Required role
 * @returns True if user has required role
 */
export function hasRole(user: AuthenticatedUser, requiredRole: string): boolean {
  return user.role === requiredRole || user.role === 'admin';
}

/**
 * Require specific role - throws error if user doesn't have role
 * 
 * @param request - Next.js request object
 * @param requiredRole - Required role
 * @returns User object with required role
 * @throws AuthError if not authenticated or insufficient role
 */
export async function requireRole(request: NextRequest, requiredRole: string): Promise<AuthenticatedUser> {
  const user = await requireAuth(request);
  
  if (!hasRole(user, requiredRole)) {
    throw createAuthError(
      'insufficient_permissions',
      `Role '${requiredRole}' required for this endpoint`,
      403
    );
  }

  return user;
}

/**
 * Create authentication middleware wrapper
 * Use this to wrap API route handlers that require authentication
 * 
 * @param handler - API route handler
 * @returns Wrapped handler with authentication
 */
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      const user = await requireAuth(request);
      return await handler(request, user, ...args);
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        const authError = error as AuthError;
        return new Response(
          JSON.stringify({
            error: {
              code: authError.code,
              message: authError.message,
              timestamp: new Date().toISOString(),
            },
          }),
          {
            status: authError.statusCode,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Unexpected error
      console.error('Unexpected authentication error:', error);
      return new Response(
        JSON.stringify({
          error: {
            code: 'internal_error',
            message: 'Internal server error',
            timestamp: new Date().toISOString(),
          },
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  };
}

/**
 * Create role-based middleware wrapper
 * 
 * @param requiredRole - Required role
 * @param handler - API route handler
 * @returns Wrapped handler with role-based authentication
 */
export function withRole<T extends any[]>(
  requiredRole: string,
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      const user = await requireRole(request, requiredRole);
      return await handler(request, user, ...args);
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        const authError = error as AuthError;
        return new Response(
          JSON.stringify({
            error: {
              code: authError.code,
              message: authError.message,
              timestamp: new Date().toISOString(),
            },
          }),
          {
            status: authError.statusCode,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Unexpected error
      console.error('Unexpected role-based authentication error:', error);
      return new Response(
        JSON.stringify({
          error: {
            code: 'internal_error',
            message: 'Internal server error',
            timestamp: new Date().toISOString(),
          },
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  };
}

// Types are already exported above