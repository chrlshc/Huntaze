/**
 * OnlyFans Session Manager
 * Handles encrypted cookie storage and session management
 * 
 * Uses database (users table) for persistent storage instead of in-memory Map
 */

import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import type { OfSession } from '@/lib/types/onlyfans';
import { getDecryptedCookies as awsGetDecrypted } from './aws-session-store';

// Browser cookie format from Playwright
export interface BrowserCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

export class SessionManager {
  private key: Buffer;

  constructor() {
    // In production, use a secure key from environment
    const keyString = process.env.OF_SESSION_KEY || 'development-key-32-characters!!!';
    this.key = Buffer.from(keyString.padEnd(KEY_LENGTH, '0').slice(0, KEY_LENGTH));
  }

  // Encrypt cookies
  encryptCookies(cookies: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);

    let encrypted = cipher.update(cookies, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    // Combine iv + tag + encrypted data
    return iv.toString('hex') + tag.toString('hex') + encrypted;
  }

  // Decrypt cookies
  decryptCookies(encryptedData: string): string {
    try {
      const iv = Buffer.from(encryptedData.slice(0, IV_LENGTH * 2), 'hex');
      const tag = Buffer.from(encryptedData.slice(IV_LENGTH * 2, (IV_LENGTH + TAG_LENGTH) * 2), 'hex');
      const encrypted = encryptedData.slice((IV_LENGTH + TAG_LENGTH) * 2);

      const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('[SessionManager] Failed to decrypt cookies:', error);
      throw new Error('Invalid encrypted data');
    }
  }

  /**
   * Save OF session from browser cookies to database
   */
  async saveSession(userId: string, cookies: string | BrowserCookie[]): Promise<OfSession> {
    const userIdNum = parseInt(userId, 10);
    if (!Number.isFinite(userIdNum)) {
      throw new Error('Invalid user ID');
    }

    // Convert browser cookies to string format if needed
    const cookieString = Array.isArray(cookies)
      ? JSON.stringify(cookies)
      : cookies;

    const encryptedCookies = this.encryptCookies(cookieString);

    // Update user record with OF cookies
    await prisma.users.update({
      where: { id: userIdNum },
      data: {
        of_cookies: encryptedCookies,
        of_linked_at: new Date(),
      },
    });

    const session: OfSession = {
      id: `of_session_${userIdNum}`,
      userId,
      encryptedCookies,
      isActive: true,
      requiresAction: false,
      lastSyncAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return session;
  }

  /**
   * Get browser cookies for Playwright
   */
  async getBrowserCookies(userId: string): Promise<BrowserCookie[] | null> {
    // Optional AWS backend
    if (process.env.OF_SESSIONS_BACKEND === 'aws') {
      try {
        const json = await awsGetDecrypted(userId);
        if (!json) return [];
        return JSON.parse(json) as BrowserCookie[];
      } catch {
        return [];
      }
    }

    const cookieString = await this.getDecryptedCookies(userId);
    if (!cookieString) return null;

    try {
      // Try to parse as JSON array first (browser format)
      return JSON.parse(cookieString) as BrowserCookie[];
    } catch {
      // Fallback to parsing cookie string
      const cookies: BrowserCookie[] = [];
      const parts = cookieString.split('; ');

      for (const part of parts) {
        const [name, value] = part.split('=');
        if (name && value) {
          cookies.push({
            name: name.trim(),
            value: value.trim(),
            domain: '.onlyfans.com',
            path: '/',
            secure: true,
            httpOnly: true,
            sameSite: 'None',
          });
        }
      }

      return cookies;
    }
  }

  /**
   * Get session for user from database
   */
  async getSession(userId: string): Promise<OfSession | null> {
    const userIdNum = parseInt(userId, 10);
    if (!Number.isFinite(userIdNum)) {
      return null;
    }

    try {
      const user = await prisma.users.findUnique({
        where: { id: userIdNum },
        select: {
          id: true,
          of_cookies: true,
          of_linked_at: true,
          of_session_token: true,
          of_auth_id: true,
        },
      });

      if (!user || !user.of_cookies) {
        return null;
      }

      return {
        id: `of_session_${user.id}`,
        userId,
        encryptedCookies: user.of_cookies,
        isActive: !!user.of_session_token,
        requiresAction: false,
        lastSyncAt: user.of_linked_at || new Date(),
        createdAt: user.of_linked_at || new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('[SessionManager] Error fetching session:', error);
      return null;
    }
  }

  /**
   * Get decrypted cookies
   */
  async getDecryptedCookies(userId: string): Promise<string | null> {
    const session = await this.getSession(userId);
    if (!session) return null;

    try {
      return this.decryptCookies(session.encryptedCookies);
    } catch (error) {
      console.error('[SessionManager] Failed to decrypt session cookies:', error);
      return null;
    }
  }

  /**
   * Update session status in database
   */
  async updateSessionStatus(
    userId: string,
    updates: Partial<Pick<OfSession, 'isActive' | 'requiresAction' | 'lastSyncAt'>>
  ): Promise<void> {
    const userIdNum = parseInt(userId, 10);
    if (!Number.isFinite(userIdNum)) {
      return;
    }

    try {
      const updateData: any = {};

      if (updates.lastSyncAt) {
        updateData.of_linked_at = updates.lastSyncAt;
      }

      if (updates.isActive === false) {
        updateData.of_session_token = null;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.users.update({
          where: { id: userIdNum },
          data: updateData,
        });
      }
    } catch (error) {
      console.error('[SessionManager] Error updating session status:', error);
    }
  }

  /**
   * Save browser session with additional context
   */
  async saveBrowserSession(userId: string, cookies: BrowserCookie[], options?: {
    requiresAction?: boolean;
    actionType?: 'captcha' | '2fa' | 'verification';
    isActive?: boolean;
  }): Promise<OfSession> {
    const session = await this.saveSession(userId, cookies);

    if (options) {
      await this.updateSessionStatus(userId, {
        requiresAction: options.requiresAction,
        isActive: options.isActive ?? true,
      });
    }

    return session;
  }

  /**
   * Check if user needs manual intervention
   */
  async needsManualAction(userId: string): Promise<{
    required: boolean;
    type?: 'captcha' | '2fa' | 'verification' | 'login';
  }> {
    const session = await this.getSession(userId);

    if (!session) {
      return { required: true, type: 'login' };
    }

    if (session.requiresAction) {
      return { required: true, type: 'verification' };
    }

    if (!session.isActive || this.isSessionStale(session)) {
      return { required: true, type: 'login' };
    }

    return { required: false };
  }

  /**
   * Delete session from database
   */
  async deleteSession(userId: string): Promise<void> {
    const userIdNum = parseInt(userId, 10);
    if (!Number.isFinite(userIdNum)) {
      return;
    }

    try {
      await prisma.users.update({
        where: { id: userIdNum },
        data: {
          of_cookies: null,
          of_session_token: null,
          of_auth_id: null,
          of_user_agent: null,
          of_linked_at: null,
        },
      });
    } catch (error) {
      console.error('[SessionManager] Error deleting session:', error);
    }
  }

  /**
   * Check if session needs refresh (older than 24h)
   */
  isSessionStale(session: OfSession): boolean {
    const age = Date.now() - session.lastSyncAt.getTime();
    return age > 24 * 60 * 60 * 1000; // 24 hours
  }
}

// Export singleton
export const sessionManager = new SessionManager();

// Helper functions
export async function getOfSession(userId: string): Promise<OfSession | null> {
  return sessionManager.getSession(userId);
}

export async function saveOfSession(userId: string, cookies: string | BrowserCookie[]): Promise<OfSession> {
  return sessionManager.saveSession(userId, cookies);
}

/**
 * Authenticate with OnlyFans
 * NOTE: Real implementation requires browser automation (Playwright/Puppeteer)
 * This is a placeholder that returns appropriate error states
 */
export async function authenticateWithOf(
  username: string,
  password: string,
  twoFactorCode?: string
): Promise<{ success: boolean; cookies?: string; requires2FA?: boolean; error?: string }> {
  // Real implementation would use browser automation
  // For now, return an error indicating manual connection is required
  console.warn('[SessionManager] authenticateWithOf called - requires browser automation');

  return {
    success: false,
    error: 'Automatic authentication not available. Please use the browser extension or bookmarklet to connect your OnlyFans account.',
  };
}
