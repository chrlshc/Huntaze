/**
 * Authentication middleware for API routes
 * Provides session validation and user context injection
 */

import { auth } from '@/lib/auth/config';
import { NextRequest } from 'next/server';
import { ApiError, ErrorCodes, HttpStatusCodes } from '../utils/errors';
import { errorResponse } from '../utils/response';
import crypto from 'crypto';

/**
 * Extended NextRequest with authenticated user context
 */
export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    email: string;
    name?: string | null;
    onboardingCompleted: boolean;
  };
}

/**
 * Type for authenticated route handlers
 */
export type AuthenticatedHandler = (
  req: AuthenticatedRequest,
  context?: any
) => Promise<Response>;

/**
 * Middleware that validates NextAuth session and adds user context to request
 * 
 * @param handler - The route handler to wrap with authentication
 * @returns Wrapped handler that validates authentication
 * 
 * @example
 * ```typescript
 * export const GET = withAuth(async (req) => {
 *   const userId = req.user.id;
 *   // ... handle authenticated request
 * });
 * ```
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (req: NextRequest, context?: any): Promise<Response> => {
    try {
      let userId: string;
      let userEmail: string;
      let userName: string | null = null;
      let onboardingCompleted = false;

      // In test environment, check for Authorization header
      if (process.env.NODE_ENV === 'test') {
        const authHeader = req.headers.get('authorization');
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          
          if (token.startsWith('test-user-')) {
            const userIdStr = token.substring(10);
            const parsedUserId = parseInt(userIdStr);
            
            if (isNaN(parsedUserId) || parsedUserId <= 0) {
              const correlationId = crypto.randomUUID();
              return Response.json(
                errorResponse(
                  ErrorCodes.UNAUTHORIZED,
                  'Invalid authentication token'
                ),
                { 
                  status: HttpStatusCodes.UNAUTHORIZED,
                  headers: {
                    'X-Correlation-Id': correlationId,
                  },
                }
              );
            }
            
            userId = parsedUserId.toString();
            userEmail = `test-user-${userId}@example.com`;
            userName = `Test User ${userId}`;
            onboardingCompleted = true;
          } else {
            const correlationId = crypto.randomUUID();
            return Response.json(
              errorResponse(
                ErrorCodes.UNAUTHORIZED,
                'Invalid authentication token format'
              ),
              { 
                status: HttpStatusCodes.UNAUTHORIZED,
                headers: {
                  'X-Correlation-Id': correlationId,
                },
              }
            );
          }
        } else {
          const correlationId = crypto.randomUUID();
          return Response.json(
            errorResponse(
              ErrorCodes.UNAUTHORIZED,
              'Authentication required. Please sign in to access this resource.'
            ),
            { 
              status: HttpStatusCodes.UNAUTHORIZED,
              headers: {
                'X-Correlation-Id': correlationId,
              },
            }
          );
        }
      } else {
        // Production: Get session from NextAuth
        const session = await auth();

        // Check if session exists and has user
        if (!session?.user?.id) {
          const correlationId = crypto.randomUUID();
          return Response.json(
            errorResponse(
              ErrorCodes.UNAUTHORIZED,
              'Authentication required. Please sign in to access this resource.'
            ),
            { 
              status: HttpStatusCodes.UNAUTHORIZED,
              headers: {
                'X-Correlation-Id': correlationId,
              },
            }
          );
        }

        // Validate session has required fields
        if (!session.user.email) {
          const correlationId = crypto.randomUUID();
          return Response.json(
            errorResponse(
              ErrorCodes.UNAUTHORIZED,
              'Invalid session. Please sign in again.'
            ),
            { 
              status: HttpStatusCodes.UNAUTHORIZED,
              headers: {
                'X-Correlation-Id': correlationId,
              },
            }
          );
        }

        userId = session.user.id;
        userEmail = session.user.email;
        userName = session.user.name;
        onboardingCompleted = session.user.onboardingCompleted ?? false;
      }

      // Attach user context to request
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = {
        id: userId,
        email: userEmail,
        name: userName,
        onboardingCompleted,
      };

      // Call the wrapped handler with authenticated request
      return await handler(authenticatedReq, context);
    } catch (error) {
      // Handle unexpected errors during authentication
      if (error instanceof ApiError) {
        return Response.json(
          errorResponse(error.code, error.message, error.details),
          { status: error.statusCode }
        );
      }

      console.error('[Auth Middleware Error]', error);
      return Response.json(
        errorResponse(
          ErrorCodes.INTERNAL_ERROR,
          'An error occurred during authentication'
        ),
        { status: HttpStatusCodes.INTERNAL_SERVER_ERROR }
      );
    }
  };
}

/**
 * Middleware that validates authentication AND onboarding completion
 * Use this for routes that require the user to have completed onboarding
 * 
 * @param handler - The route handler to wrap with authentication and onboarding check
 * @returns Wrapped handler that validates authentication and onboarding
 * 
 * @example
 * ```typescript
 * export const GET = withOnboarding(async (req) => {
 *   // User is authenticated AND has completed onboarding
 *   const userId = req.user.id;
 *   // ... handle request
 * });
 * ```
 */
export function withOnboarding(handler: AuthenticatedHandler) {
  return withAuth(async (req: AuthenticatedRequest, context?: any): Promise<Response> => {
    try {
      // Check if user has completed onboarding
      if (!req.user.onboardingCompleted) {
        return Response.json(
          errorResponse(
            ErrorCodes.ONBOARDING_REQUIRED,
            'Please complete onboarding before accessing this resource.',
            {
              redirectTo: '/onboarding',
            }
          ),
          { status: HttpStatusCodes.FORBIDDEN }
        );
      }

      // User is authenticated and has completed onboarding
      return await handler(req, context);
    } catch (error) {
      // Handle unexpected errors
      if (error instanceof ApiError) {
        return Response.json(
          errorResponse(error.code, error.message, error.details),
          { status: error.statusCode }
        );
      }

      console.error('[Onboarding Middleware Error]', error);
      return Response.json(
        errorResponse(
          ErrorCodes.INTERNAL_ERROR,
          'An error occurred during onboarding validation'
        ),
        { status: HttpStatusCodes.INTERNAL_SERVER_ERROR }
      );
    }
  });
}

/**
 * Optional authentication middleware - adds user context if authenticated, but doesn't require it
 * Use this for routes that have different behavior for authenticated vs anonymous users
 * 
 * @param handler - The route handler to wrap
 * @returns Wrapped handler with optional user context
 * 
 * @example
 * ```typescript
 * export const GET = withOptionalAuth(async (req) => {
 *   if (req.user) {
 *     // User is authenticated
 *   } else {
 *     // Anonymous user
 *   }
 * });
 * ```
 */
export function withOptionalAuth(handler: AuthenticatedHandler) {
  return async (req: NextRequest, context?: any): Promise<Response> => {
    try {
      const session = await auth();

      if (session?.user?.id && session.user.email) {
        // Add user context if authenticated
        const authenticatedReq = req as AuthenticatedRequest;
        authenticatedReq.user = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          onboardingCompleted: session.user.onboardingCompleted ?? false,
        };
      }

      return await handler(req as AuthenticatedRequest, context);
    } catch (error) {
      console.error('[Optional Auth Middleware Error]', error);
      // Continue without authentication on error
      return await handler(req as AuthenticatedRequest, context);
    }
  };
}
