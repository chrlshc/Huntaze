/**
 * Admin Authentication Utilities
 * 
 * Provides functions to check if a user has admin privileges
 */

import { prisma } from '@/lib/prisma';
import { getServerSession } from './session';

/**
 * User roles
 */
export const UserRole = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

/**
 * Check if the current session user is an admin
 * 
 * @returns true if user is admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getServerSession();
  
  if (!session?.user?.id) {
    return false;
  }

  try {
    const user = await prisma.users.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { role: true },
    });

    return user?.role === UserRole.ADMIN;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Check if a specific user ID is an admin
 * 
 * @param userId - The user ID to check
 * @returns true if user is admin, false otherwise
 */
export async function isUserAdmin(userId: number): Promise<boolean> {
  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    return user?.role === UserRole.ADMIN;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Require admin access - throws error if not admin
 * Use this in API routes that require admin access
 * 
 * @throws Error if user is not authenticated or not an admin
 */
export async function requireAdmin(): Promise<void> {
  const session = await getServerSession();
  
  if (!session?.user?.id) {
    throw new Error('Authentication required');
  }

  const adminStatus = await isAdmin();
  
  if (!adminStatus) {
    throw new Error('Admin access required');
  }
}

/**
 * Get user role from session
 * 
 * @returns User role or null if not authenticated
 */
export async function getUserRole(): Promise<UserRole | null> {
  const session = await getServerSession();
  
  if (!session?.user?.id) {
    return null;
  }

  try {
    const user = await prisma.users.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { role: true },
    });

    return (user?.role as UserRole) || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}
