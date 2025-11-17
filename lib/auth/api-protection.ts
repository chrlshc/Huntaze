/**
 * API Route Protection Utilities
 * 
 * Centralized utilities for protecting API routes with NextAuth session validation
 */

import { auth } from '@/lib/auth/config';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('api-protection');

/**
 * Authenticated request with user data
 */
export interface AuthenticatedRequest {
  user: {
    id: string;
    email: string;
    name?: string | null;
    onboardingCompleted: boolean;
  };
}

/**
 * Require authentication for API routes
 * 
 * Validates NextAuth session and returns user data or 401 response.
 * Use this utility in API route handlers to protect endpoints.
 * 
 * @param request - Next.js Request object (optional, for logging)
 * @returns AuthenticatedRequest with user data, or Response with 401 status
 * 
 * @example
 * ```typescript
 * export async function GET(request: Request) {
 *   const authResult = await requireAuth(request);
 *   if (authResult instanceof Response) return authResult;
 *   
 *   const { user } = authResult;
 *   // Use user.id, user.email, etc.
 * }
 * ```
 */
export async function requireAuth(
  request?: Request
): Promise<AuthenticatedRequest | Response> {
  const startTime = Date.now();
  
  try {
    // Get session using NextAuth
    const session = await auth();

    // Check if session exists and has user
    if (!session || !session.user) {
      const duration = Date.now() - startTime;
      logger.warn('API request without valid session', {
        path: request?.url,
        method: request?.method,
        hasSession: !!session,
        hasUser: !!session?.user,
        duration,
      });

      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Authentication required. Please log in.',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const duration = Date.now() - startTime;
    logger.info('API request authenticated', {
      userId: session.user.id,
      email: session.user.email,
      path: request?.url,
      duration,
    });

    // Return authenticated request with user data
    return {
      user: {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.name,
        onboardingCompleted: session.user.onboardingCompleted,
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('API authentication error', error as Error, {
      path: request?.url,
      method: request?.method,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      duration,
    });

    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'Authentication check failed. Please try again.',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

/**
 * Require authentication and onboarding completion for API routes
 * 
 * Similar to requireAuth but also checks if user has completed onboarding.
 * Returns 403 if user is authenticated but hasn't completed onboarding.
 * 
 * @param request - Next.js Request object (optional, for logging)
 * @returns AuthenticatedRequest with user data, or Response with 401/403 status
 * 
 * @example
 * ```typescript
 * export async function GET(request: Request) {
 *   const authResult = await requireAuthWithOnboarding(request);
 *   if (authResult instanceof Response) return authResult;
 *   
 *   const { user } = authResult;
 *   // User is authenticated and has completed onboarding
 * }
 * ```
 */
export async function requireAuthWithOnboarding(
  request?: Request
): Promise<AuthenticatedRequest | Response> {
  // First check authentication
  const authResult = await requireAuth(request);
  
  // If authentication failed, return the error response
  if (authResult instanceof Response) {
    return authResult;
  }

  // Check if onboarding is completed
  if (!authResult.user.onboardingCompleted) {
    logger.warn('API request from user without completed onboarding', {
      userId: authResult.user.id,
      email: authResult.user.email,
      path: request?.url,
    });

    return new Response(
      JSON.stringify({
        error: 'Forbidden',
        message: 'Onboarding must be completed to access this resource',
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  return authResult;
}

/**
 * Get optional authentication for API routes
 * 
 * Returns user data if authenticated, or null if not authenticated.
 * Does not return error responses - useful for endpoints that work
 * differently for authenticated vs unauthenticated users.
 * 
 * @param request - Next.js Request object (optional, for logging)
 * @returns AuthenticatedRequest with user data, or null if not authenticated
 * 
 * @example
 * ```typescript
 * export async function GET(request: Request) {
 *   const auth = await getOptionalAuth(request);
 *   
 *   if (auth) {
 *     // User is authenticated, return personalized data
 *     return Response.json({ data: getPersonalizedData(auth.user.id) });
 *   } else {
 *     // User is not authenticated, return public data
 *     return Response.json({ data: getPublicData() });
 *   }
 * }
 * ```
 */
export async function getOptionalAuth(
  request?: Request
): Promise<AuthenticatedRequest | null> {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return null;
    }

    logger.info('Optional API authentication successful', {
      userId: session.user.id,
      email: session.user.email,
      path: request?.url,
    });

    return {
      user: {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.name,
        onboardingCompleted: session.user.onboardingCompleted,
      },
    };
  } catch (error) {
    logger.error('Optional API authentication error', error as Error, {
      path: request?.url,
    });
    return null;
  }
}
