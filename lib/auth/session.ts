/**
 * Session Management Utilities
 * 
 * Server-side session helpers with comprehensive error handling
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import type { ExtendedSession, ExtendedUser } from './types';
import { AuthError } from './types';
import { logAuthError } from './errors';
import type { NextRequest } from 'next/server';

// ============================================================================
// Session Retrieval
// ============================================================================

/**
 * Get current session with error handling
 * 
 * @returns Session or null if not authenticated
 */
export async function getSession(): Promise<ExtendedSession | null> {
  try {
    const session = await getServerSession(authOptions);
    return session as ExtendedSession | null;
  } catch (error) {
    logAuthError(AuthError.JWT_ERROR, {
      error: error instanceof Error ? error.message : String(error),
      function: 'getSession',
    });
    return null;
  }
}

/**
 * Get session from request (for API routes)
 * 
 * @param request - Next.js request object
 * @returns Session or null
 */
export async function getSessionFromRequest(
  request: NextRequest
): Promise<ExtendedSession | null> {
  try {
    const session = await getServerSession(authOptions);
    return session as ExtendedSession | null;
  } catch (error) {
    logAuthError(AuthError.JWT_ERROR, {
      error: error instanceof Error ? error.message : String(error),
      function: 'getSessionFromRequest',
      path: request.nextUrl.pathname,
    });
    return null;
  }
}

/**
 * Get current user from session
 * 
 * @returns User or null if not authenticated
 */
export async function getCurrentUser(): Promise<ExtendedUser | null> {
  try {
    const session = await getSession();
    return session?.user || null;
  } catch (error) {
    logAuthError(AuthError.JWT_ERROR, {
      error: error instanceof Error ? error.message : String(error),
      function: 'getCurrentUser',
    });
    return null;
  }
}

/**
 * Get current user ID
 * 
 * @returns User ID or null
 */
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id || null;
}

// ============================================================================
// Session Validation
// ============================================================================

/**
 * Require authentication - throws if not authenticated
 * 
 * @throws Error if not authenticated
 * @returns Session
 */
export async function requireAuth(): Promise<ExtendedSession> {
  const session = await getSession();
  
  if (!session || !session.user) {
    logAuthError(AuthError.SESSION_REQUIRED, {
      function: 'requireAuth',
    });
    throw new Error('Authentication required');
  }

  return session;
}

/**
 * Require specific role - throws if not authorized
 * 
 * @param allowedRoles - Array of allowed roles
 * @throws Error if not authorized
 * @returns Session
 */
export async function requireRole(
  allowedRoles: string[]
): Promise<ExtendedSession> {
  const session = await requireAuth();
  
  if (!session.user.role || !allowedRoles.includes(session.user.role)) {
    logAuthError(AuthError.ACCESS_DENIED, {
      function: 'requireRole',
      userId: session.user.id,
      userRole: session.user.role,
      allowedRoles,
    });
    throw new Error('Insufficient permissions');
  }

  return session;
}

/**
 * Check if user is authenticated
 * 
 * @returns true if authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session?.user;
}

/**
 * Check if user has specific role
 * 
 * @param role - Role to check
 * @returns true if user has role
 */
export async function hasRole(role: string): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === role;
}

// ============================================================================
// Ownership Validation
// ============================================================================

/**
 * Validate that user owns the resource
 * 
 * @param session - User session
 * @param resourceOwnerId - ID of resource owner
 * @returns true if user owns resource
 */
export function validateOwnership(
  session: ExtendedSession | null,
  resourceOwnerId: string
): boolean {
  if (!session?.user?.id) {
    return false;
  }

  // User owns resource if IDs match
  if (session.user.id === resourceOwnerId) {
    return true;
  }

  // Creator owns resource if creator IDs match
  if (session.user.creatorId && session.user.creatorId === resourceOwnerId) {
    return true;
  }

  return false;
}

/**
 * Require resource ownership - throws if not owner
 * 
 * @param resourceOwnerId - ID of resource owner
 * @throws Error if not owner
 */
export async function requireOwnership(resourceOwnerId: string): Promise<void> {
  const session = await requireAuth();
  
  if (!validateOwnership(session, resourceOwnerId)) {
    logAuthError(AuthError.ACCESS_DENIED, {
      function: 'requireOwnership',
      userId: session.user.id,
      resourceOwnerId,
    });
    throw new Error('You do not own this resource');
  }
}

// ============================================================================
// Session Helpers
// ============================================================================

/**
 * Check if session has error
 * 
 * @param session - Session to check
 * @returns Error or null
 */
export function getSessionError(
  session: ExtendedSession | null
): AuthError | null {
  return session?.error || null;
}

/**
 * Check if session is valid (no errors)
 * 
 * @param session - Session to check
 * @returns true if valid
 */
export function isSessionValid(session: ExtendedSession | null): boolean {
  return !!session && !session.error && !!session.user;
}

/**
 * Get user display name
 * 
 * @param user - User object
 * @returns Display name
 */
export function getUserDisplayName(user: ExtendedUser | null): string {
  if (!user) return 'Guest';
  return user.name || user.email || 'User';
}

/**
 * Check if user email is verified
 * 
 * @param user - User object
 * @returns true if verified
 */
export function isEmailVerified(user: ExtendedUser | null): boolean {
  return !!user?.emailVerified;
}
