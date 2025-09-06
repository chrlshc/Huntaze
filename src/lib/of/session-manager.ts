// OnlyFans Session Manager
// Handles encrypted cookie storage and session management

import crypto from 'crypto';
import type { OfSession } from '@/lib/types/onlyfans';

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

// Mock sessions storage (replace with database)
const sessions = new Map<string, OfSession>();

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
      console.error('Failed to decrypt cookies:', error);
      throw new Error('Invalid encrypted data');
    }
  }

  // Save OF session from browser cookies
  async saveSession(userId: string, cookies: string | BrowserCookie[]): Promise<OfSession> {
    // Convert browser cookies to string format if needed
    const cookieString = Array.isArray(cookies) 
      ? JSON.stringify(cookies)
      : cookies;
    
    const encryptedCookies = this.encryptCookies(cookieString);
    
    const session: OfSession = {
      id: `of_session_${Date.now()}`,
      userId,
      encryptedCookies,
      isActive: true,
      requiresAction: false,
      lastSyncAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    sessions.set(userId, session);
    
    return session;
  }
  
  // Get browser cookies for Playwright
  async getBrowserCookies(userId: string): Promise<BrowserCookie[] | null> {
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
            sameSite: 'None'
          });
        }
      }
      
      return cookies;
    }
  }

  // Get session for user
  async getSession(userId: string): Promise<OfSession | null> {
    return sessions.get(userId) || null;
  }

  // Get decrypted cookies
  async getDecryptedCookies(userId: string): Promise<string | null> {
    const session = await this.getSession(userId);
    if (!session) return null;
    
    try {
      return this.decryptCookies(session.encryptedCookies);
    } catch (error) {
      console.error('Failed to decrypt session cookies:', error);
      return null;
    }
  }

  // Update session status
  async updateSessionStatus(
    userId: string, 
    updates: Partial<Pick<OfSession, 'isActive' | 'requiresAction' | 'lastSyncAt'>>
  ): Promise<void> {
    const session = sessions.get(userId);
    if (!session) return;

    Object.assign(session, updates, { updatedAt: new Date() });
  }
  
  // Save browser session with additional context
  async saveBrowserSession(userId: string, cookies: BrowserCookie[], options?: {
    requiresAction?: boolean;
    actionType?: 'captcha' | '2fa' | 'verification';
    isActive?: boolean;
  }): Promise<OfSession> {
    const session = await this.saveSession(userId, cookies);
    
    if (options) {
      await this.updateSessionStatus(userId, {
        requiresAction: options.requiresAction,
        isActive: options.isActive ?? true
      });
    }
    
    return session;
  }
  
  // Check if user needs manual intervention
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

  // Delete session
  async deleteSession(userId: string): Promise<void> {
    sessions.delete(userId);
  }

  // Check if session needs refresh (older than 24h)
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

// Mock OF authentication flow
export async function authenticateWithOf(
  username: string,
  password: string,
  twoFactorCode?: string
): Promise<{ success: boolean; cookies?: string; requires2FA?: boolean; error?: string }> {
  // TODO: Implement actual OF authentication
  // This would use puppeteer or similar to handle login flow
  
  console.log('Mock OF authentication for:', username);
  
  // Simulate authentication
  if (username === 'test' && password === 'test') {
    if (!twoFactorCode) {
      return { success: false, requires2FA: true };
    }
    
    if (twoFactorCode === '123456') {
      // Mock cookie data
      const mockCookies = JSON.stringify([
        { name: 'sess', value: 'mock_session_token', domain: '.onlyfans.com' },
        { name: 'auth_id', value: 'mock_auth_id', domain: '.onlyfans.com' }
      ]);
      
      return { success: true, cookies: mockCookies };
    }
    
    return { success: false, error: 'Invalid 2FA code' };
  }
  
  return { success: false, error: 'Invalid credentials' };
}