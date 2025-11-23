/**
 * Authentication Middleware for Next.js 16.0.3 App Router
 * 
 * This middleware provides authentication and authorization checks for API routes.
 * It integrates with NextAuth v5 for session management and supports admin role verification.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 * 
 * @module lib/middleware/auth
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../auth/config';
import { query } from '../db';
import type { RouteHandler } from './types';
import { createLogger } from '../utils/logger';

const logger = createLogger('auth-middleware');

/**
 * Options for auth middleware configuration
 */
export interface AuthOptions {
  /**
   * Whether to require admin role for this route
   * @default false
   */
  requireAdmin?: boolean;
}

/**
 * Extended NextRequest with user information attached
 */
export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    name?: string | null;
    role?: string;
  };
}

/**
 * Authentication middleware wrapper
 * 
 * Wraps a route handler with authentication checks. Verifies that the user
 * has a valid session using NextAuth v5. Optionally verifies admin role.
 * 
 * Flow:
 * 1. Get session using NextAuth's auth() function
 * 2. Return 401 if no session exists
 * 3. If requireAdmin is true, query database for user role
 * 4. Return 403 if user is not an admin
 * 5. Attach user information to request object
 * 6. Call the wrapped handler
 * 
 * @param handler - The route handler to wrap
 * @param options - Configuration options for auth middleware
 * @returns Wrapped route handler with authentication
 * 
 * @example
 * ```typescript
 * // Protect a route with authentication
 * export const GET = withAuth(async (req) => {
 *   const user = (req as AuthenticatedRequest).user;
 *   return NextResponse.json({ userId: user?.id });
 * });
 * 
 * // Protect a route with admin-only access
 * export const POST = withAuth(async (req) => {
 *   return NextResponse.json({ message: 'Admin only' });
 * }, { requireAdmin: true });
 * ```
 */
export function withAuth(
  handler: RouteHandler,
  options?: AuthOptions
): RouteHandler {
  return async (req: NextRequest) => {
    const startTime = Date.now();
    
    try {
      // 1. Get session using NextAuth v5 (Requirement 3.1)
      const session = await auth();
      
      // 2. Check if user is authenticated (Requirement 3.2)
      if (!session || !session.user || !session.user.id || !session.user.email) {
        logger.warn('Authentication failed: No session', {
          path: req.nextUrl.pathname,
          method: req.method,
          duration: Date.now() - startTime,
        });
        
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // 3. Check admin role if required (Requirements 3.3, 3.4)
      if (options?.requireAdmin) {
        try {
          const result = await query(
            'SELECT role FROM users WHERE id = $1',
            [parseInt(session.user.id)]
          );

          if (result.rows.length === 0) {
            logger.warn('Authentication failed: User not found in database', {
              userId: session.user.id,
              path: req.nextUrl.pathname,
              duration: Date.now() - startTime,
            });
            
            return NextResponse.json(
              { error: 'Unauthorized' },
              { status: 401 }
            );
          }

          const user = result.rows[0];
          
          // Check if user has admin role
          if (user.role !== 'admin') {
            logger.warn('Authorization failed: User is not an admin', {
              userId: session.user.id,
              role: user.role,
              path: req.nextUrl.pathname,
              duration: Date.now() - startTime,
            });
            
            return NextResponse.json(
              { error: 'Forbidden' },
              { status: 403 }
            );
          }

          // Attach user with role to request (Requirement 3.5)
          (req as AuthenticatedRequest).user = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            role: user.role,
          };

          logger.info('Admin authentication successful', {
            userId: session.user.id,
            path: req.nextUrl.pathname,
            duration: Date.now() - startTime,
          });
        } catch (dbError) {
          logger.error('Database error during admin check', dbError as Error, {
            userId: session.user.id,
            path: req.nextUrl.pathname,
            duration: Date.now() - startTime,
          });
          
          return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
          );
        }
      } else {
        // Attach user without role check (Requirement 3.5)
        (req as AuthenticatedRequest).user = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        };

        logger.info('Authentication successful', {
          userId: session.user.id,
          path: req.nextUrl.pathname,
          duration: Date.now() - startTime,
        });
      }

      // 4. Call the wrapped handler
      return handler(req);
    } catch (error) {
      logger.error('Auth middleware error', error as Error, {
        path: req.nextUrl.pathname,
        method: req.method,
        duration: Date.now() - startTime,
      });
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Type guard to check if a request has been authenticated
 * 
 * @param req - Request to check
 * @returns True if request has user attached
 */
export function isAuthenticatedRequest(
  req: NextRequest
): req is AuthenticatedRequest {
  return 'user' in req && req.user !== undefined;
}
