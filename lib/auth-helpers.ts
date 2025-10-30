import { auth } from '@/auth';

/**
 * Get current session (can return null)
 * 
 * Use this in Server Components, Server Actions, and API Routes when you need
 * to check if a user is authenticated but want to handle the null case yourself.
 * 
 * @example
 * ```typescript
 * const session = await getSession();
 * if (!session) {
 *   redirect('/auth/login');
 * }
 * ```
 * 
 * @returns The current session or null if not authenticated
 */
export async function getSession() {
  return await auth();
}

/**
 * Require authentication (throws if not authenticated)
 * 
 * Use this when you need to ensure the user is authenticated and want to
 * throw an error if they're not. This is useful in Server Actions or API
 * routes where you want to fail fast.
 * 
 * @example
 * ```typescript
 * const session = await requireAuth();
 * // session is guaranteed to exist here
 * ```
 * 
 * @throws {Error} Throws "Unauthorized" if not authenticated
 * @returns The current session (guaranteed to exist)
 */
export async function requireAuth() {
  const session = await auth();
  
  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }
  
  return session;
}

/**
 * Get current user (can return null)
 * 
 * Convenience method to get the user object directly without needing to
 * access session.user. Returns null if not authenticated.
 * 
 * @example
 * ```typescript
 * const user = await getCurrentUser();
 * if (!user) {
 *   return { error: 'Not authenticated' };
 * }
 * ```
 * 
 * @returns The current user or null if not authenticated
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Require current user (throws if not authenticated)
 * 
 * Convenience method to get the user object directly with authentication
 * enforcement. Throws an error if not authenticated.
 * 
 * @example
 * ```typescript
 * const user = await requireUser();
 * // user is guaranteed to exist here
 * console.log(user.email);
 * ```
 * 
 * @throws {Error} Throws "Unauthorized" if not authenticated
 * @returns The current user (guaranteed to exist)
 */
export async function requireUser() {
  const session = await requireAuth();
  return session.user;
}
