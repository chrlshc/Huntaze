/**
 * Messaging Authentication Integration
 * 
 * Integrates Huntaze authentication with the messaging adapter.
 * Handles token management, refresh, and session timeout.
 * 
 * @requirements 10.2
 */

'use client';

import { huntazeMessagingAdapter } from '@/lib/api/adapters/huntaze-messaging.adapter';

// ============================================
// Authentication Types
// ============================================

export interface AuthSession {
  token: string;
  expiresAt: number;
  userId: string;
  refreshToken?: string;
}

// ============================================
// Token Management
// ============================================

const TOKEN_STORAGE_KEY = 'huntaze_auth_token';
const REFRESH_TOKEN_STORAGE_KEY = 'huntaze_refresh_token';
const SESSION_STORAGE_KEY = 'huntaze_session';

/**
 * Initialize messaging authentication
 * Sets up the adapter with the current auth token
 */
export function initializeMessagingAuth(): void {
  const session = getStoredSession();
  
  if (session && !isSessionExpired(session)) {
    huntazeMessagingAdapter.setAuthToken(session.token);
  } else {
    clearStoredSession();
  }
}

/**
 * Set authentication session
 * Stores the session and configures the adapter
 */
export function setAuthSession(session: AuthSession): void {
  // Store session
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    localStorage.setItem(TOKEN_STORAGE_KEY, session.token);
    
    if (session.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, session.refreshToken);
    }
  }

  // Configure adapter
  huntazeMessagingAdapter.setAuthToken(session.token);

  // Schedule token refresh
  scheduleTokenRefresh(session);
}

/**
 * Get stored session
 */
export function getStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const sessionData = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionData) return null;

    return JSON.parse(sessionData);
  } catch (error) {
    console.error('[MessagingAuth] Failed to parse stored session:', error);
    return null;
  }
}

/**
 * Clear stored session
 */
export function clearStoredSession(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(SESSION_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

/**
 * Check if session is expired
 */
export function isSessionExpired(session: AuthSession): boolean {
  return Date.now() >= session.expiresAt;
}

/**
 * Check if session is about to expire (within 5 minutes)
 */
export function isSessionExpiringSoon(session: AuthSession): boolean {
  const fiveMinutes = 5 * 60 * 1000;
  return Date.now() >= session.expiresAt - fiveMinutes;
}

// ============================================
// Token Refresh
// ============================================

let refreshTimeoutId: NodeJS.Timeout | null = null;

/**
 * Schedule automatic token refresh
 */
function scheduleTokenRefresh(session: AuthSession): void {
  // Clear existing timeout
  if (refreshTimeoutId) {
    clearTimeout(refreshTimeoutId);
  }

  // Calculate time until refresh (5 minutes before expiry)
  const fiveMinutes = 5 * 60 * 1000;
  const timeUntilRefresh = session.expiresAt - Date.now() - fiveMinutes;

  if (timeUntilRefresh > 0) {
    refreshTimeoutId = setTimeout(() => {
      refreshAuthToken();
    }, timeUntilRefresh);
  }
}

/**
 * Refresh authentication token
 */
export async function refreshAuthToken(): Promise<boolean> {
  const session = getStoredSession();
  
  if (!session || !session.refreshToken) {
    console.warn('[MessagingAuth] No refresh token available');
    return false;
  }

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: session.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    
    const newSession: AuthSession = {
      token: data.token,
      expiresAt: data.expiresAt,
      userId: session.userId,
      refreshToken: data.refreshToken || session.refreshToken,
    };

    setAuthSession(newSession);
    
    console.log('[MessagingAuth] Token refreshed successfully');
    return true;
  } catch (error) {
    console.error('[MessagingAuth] Token refresh failed:', error);
    
    // Clear session on refresh failure
    clearStoredSession();
    
    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login?reason=session_expired';
    }
    
    return false;
  }
}

// ============================================
// Session Monitoring
// ============================================

/**
 * Start monitoring session expiration
 */
export function startSessionMonitoring(): void {
  // Check session every minute
  const checkInterval = 60 * 1000;

  setInterval(() => {
    const session = getStoredSession();
    
    if (!session) return;

    if (isSessionExpired(session)) {
      console.warn('[MessagingAuth] Session expired');
      handleSessionTimeout();
    } else if (isSessionExpiringSoon(session)) {
      console.log('[MessagingAuth] Session expiring soon, refreshing...');
      refreshAuthToken();
    }
  }, checkInterval);
}

/**
 * Handle session timeout
 */
function handleSessionTimeout(): void {
  clearStoredSession();
  
  if (typeof window !== 'undefined') {
    // Show timeout message
    const event = new CustomEvent('auth:session-timeout');
    window.dispatchEvent(event);
    
    // Redirect to login after a short delay
    setTimeout(() => {
      window.location.href = '/auth/login?reason=session_timeout';
    }, 2000);
  }
}

// ============================================
// Initialization
// ============================================

// Auto-initialize on import (client-side only)
if (typeof window !== 'undefined') {
  initializeMessagingAuth();
  startSessionMonitoring();
}
