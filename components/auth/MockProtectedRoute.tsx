'use client';

import { ReactNode } from 'react';

interface MockProtectedRouteProps {
  children: ReactNode;
  requireOnboarding?: boolean;
  redirectTo?: string;
}

/**
 * MockProtectedRoute Component
 * 
 * Simulates authenticated access for local development.
 * Bypasses authentication checks and session expiration.
 * 
 * @param children - Content to render
 */
export function MockProtectedRoute({
  children,
}: MockProtectedRouteProps) {
  // Always render children without authentication checks
  return <>{children}</>;
}
