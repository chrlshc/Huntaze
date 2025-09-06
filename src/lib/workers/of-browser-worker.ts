// OnlyFans Browser Worker
// Uses Playwright to automate OnlyFans actions

import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { sessionManager, type BrowserCookie } from '@/lib/of/session-manager';
import type { OfMessage } from '@/lib/types/onlyfans';

export interface BrowserAction {
  type: 'login' | 'send_message' | 'fetch_inbox' | 'fetch_conversation';
  payload: any;
}

export interface ProxyConfig {
  server: string;
  username?: string;
  password?: string;
}

class OfBrowserWorker {
  private browser?: Browser;
  private context?: BrowserContext;
  private page?: Page;
  private userId?: string;
  private proxy?: ProxyConfig;
  
  // OnlyFans selectors (to be verified with Playwright Codegen)
  private selectors = {
    // Login
    usernameInput: 'input[name="email"], input[name="username"]',
    passwordInput: 'input[type="password"]',
    loginButton: 'button[type="submit"]',
    twoFactorInput: 'input[name="code"], input[placeholder*="code"]',
    
    // Messages
    messageInput: 'textarea[placeholder*="message"], div[contenteditable="true"]',
    sendButton: 'button[aria-label*="Send"], button[type="submit"]',
    conversationList: '[data-testid="conversations-list"], .conversations-list',
    messagesList: '[data-testid="messages-list"], .messages-container',
    
    // Navigation
    messagesTab: 'a[href="/my/chats"], nav a[href*="chats"]'
  };

  constructor(userId: string, proxy?: ProxyConfig) {
    this.userId = userId;
    this.proxy = proxy;
  }

  // Initialize browser with proxy if configured
  async init(): Promise<void> {
    console.log(`Initializing browser for user ${this.userId}`);
    
    const launchOptions: any = {
      headless: process.env.NODE_ENV === 'production',
      args: ['--disable-blink-features=AutomationControlled']
    };

    // Configure proxy
    if (this.proxy) {
      launchOptions.proxy = {
        server: this.proxy.server,
        username: this.proxy.username,
        password: this.proxy.password
      };
    }

    this.browser = await chromium.launch(launchOptions);
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'en-US',
      timezoneId: 'America/New_York'
    });

    this.page = await this.context.newPage();
    
    // Load existing cookies if available
    await this.loadSession();
  }

  // Load session cookies from session manager
  private async loadSession(): Promise<boolean> {
    if (!this.userId || !this.context) return false;
    
    try {
      const cookies = await sessionManager.getBrowserCookies(this.userId);
      if (cookies && cookies.length > 0) {
        await this.context.addCookies(cookies);
        console.log(`Loaded ${cookies.length} cookies for user ${this.userId}`);
        return true;
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
    
    return false;
  }

  // Save current cookies to session manager
  private async saveSession(): Promise<void> {
    if (!this.userId || !this.context) return;
    
    try {
      const cookies = await this.context.cookies();
      const ofCookies = cookies.filter(c => 
        c.domain.includes('onlyfans.com')
      ) as BrowserCookie[];
      
      if (ofCookies.length > 0) {
        await sessionManager.saveBrowserSession(this.userId, ofCookies);
        console.log(`Saved ${ofCookies.length} cookies for user ${this.userId}`);
      }
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  // Navigate to OnlyFans
  private async navigateToOf(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    
    await this.page.goto('https://onlyfans.com', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Wait a bit to appear more human-like
    await this.humanDelay();
  }

  // Login to OnlyFans
  async login(username: string, password: string): Promise<{
    success: boolean;
    requires2FA?: boolean;
    error?: string;
  }> {
    if (!this.page) throw new Error('Browser not initialized');
    
    try {
      // Navigate to login page
      await this.page.goto('https://onlyfans.com/login', {
        waitUntil: 'networkidle'
      });

      // Fill username
      await this.page.fill(this.selectors.usernameInput, username);
      await this.humanDelay();
      
      // Fill password
      await this.page.fill(this.selectors.passwordInput, password);
      await this.humanDelay();
      
      // Click login
      await this.page.click(this.selectors.loginButton);
      
      // Wait for navigation or 2FA
      const response = await Promise.race([
        this.page.waitForSelector(this.selectors.twoFactorInput, { timeout: 10000 })
          .then(() => ({ requires2FA: true })),
        this.page.waitForNavigation({ timeout: 10000 })
          .then(() => ({ success: true }))
      ]);
      
      if ('requires2FA' in response) {
        return { success: false, requires2FA: true };
      }
      
      // Save session
      await this.saveSession();
      
      return { success: true };
      
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  // Handle 2FA
  async submit2FA(code: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (!this.page) throw new Error('Browser not initialized');
    
    try {
      // Fill 2FA code
      await this.page.fill(this.selectors.twoFactorInput, code);
      await this.humanDelay();
      
      // Submit
      await this.page.keyboard.press('Enter');
      
      // Wait for navigation
      await this.page.waitForNavigation({ timeout: 10000 });
      
      // Save session
      await this.saveSession();
      
      return { success: true };
      
    } catch (error) {
      console.error('2FA error:', error);
      return { success: false, error: '2FA verification failed' };
    }
  }

  // Send a DM
  async sendMessage(conversationId: string, content: {
    text: string;
    media?: string[];
  }): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    if (!this.page || !this.userId) throw new Error('Browser not initialized');
    
    try {
      // Check if we need to re-authenticate
      const needsAction = await sessionManager.needsManualAction(this.userId);
      if (needsAction.required) {
        return { 
          success: false, 
          error: `Authentication required: ${needsAction.type}` 
        };
      }
      
      // Navigate to messages
      await this.page.goto(`https://onlyfans.com/my/chats/${conversationId}`, {
        waitUntil: 'networkidle'
      });
      
      // Wait for message input
      await this.page.waitForSelector(this.selectors.messageInput, {
        timeout: 10000
      });
      
      // Natural typing delay
      await this.humanDelay();
      
      // Type message with human-like speed
      await this.page.type(this.selectors.messageInput, content.text, {
        delay: this.getTypingDelay()
      });
      
      // Small pause before sending
      await this.humanDelay(500, 1000);
      
      // Send message
      await this.page.click(this.selectors.sendButton);
      
      // Wait for message to be sent
      await this.page.waitForResponse(response => 
        response.url().includes('/api/') && 
        response.status() === 200,
        { timeout: 5000 }
      );
      
      return { 
        success: true, 
        messageId: `msg_${Date.now()}` 
      };
      
    } catch (error) {
      console.error('Send message error:', error);
      
      // Check if session is still valid
      const isLoggedIn = await this.checkLoginStatus();
      if (!isLoggedIn) {
        await sessionManager.updateSessionStatus(this.userId, {
          isActive: false,
          requiresAction: true
        });
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send message' 
      };
    }
  }

  // Fetch inbox conversations
  async fetchInbox(): Promise<{
    success: boolean;
    conversations?: any[];
    error?: string;
  }> {
    if (!this.page) throw new Error('Browser not initialized');
    
    try {
      // Navigate to messages
      await this.page.goto('https://onlyfans.com/my/chats', {
        waitUntil: 'networkidle'
      });
      
      // Wait for conversations to load
      await this.page.waitForSelector(this.selectors.conversationList, {
        timeout: 10000
      });
      
      // Extract conversation data
      const conversations = await this.page.evaluate((selector) => {
        const items = document.querySelectorAll(`${selector} > div`);
        return Array.from(items).map(item => {
          // This would need to be adapted based on actual DOM structure
          return {
            id: item.getAttribute('data-id'),
            username: item.querySelector('.username')?.textContent,
            lastMessage: item.querySelector('.last-message')?.textContent,
            unread: item.classList.contains('unread')
          };
        });
      }, this.selectors.conversationList);
      
      return { success: true, conversations };
      
    } catch (error) {
      console.error('Fetch inbox error:', error);
      return { 
        success: false, 
        error: 'Failed to fetch inbox' 
      };
    }
  }

  // Check if still logged in
  private async checkLoginStatus(): Promise<boolean> {
    if (!this.page) return false;
    
    try {
      const url = this.page.url();
      return !url.includes('/login') && url.includes('onlyfans.com');
    } catch {
      return false;
    }
  }

  // Human-like delay
  private async humanDelay(min: number = 1000, max: number = 3000): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min) + min);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // Get typing delay for human-like typing
  private getTypingDelay(): number {
    return Math.floor(Math.random() * 80 + 40); // 40-120ms per character
  }

  // Cleanup
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Worker pool for managing multiple browser instances
class BrowserWorkerPool {
  private workers = new Map<string, OfBrowserWorker>();
  private maxWorkers = 5;

  async getWorker(userId: string, proxy?: ProxyConfig): Promise<OfBrowserWorker> {
    let worker = this.workers.get(userId);
    
    if (!worker) {
      // Check pool size
      if (this.workers.size >= this.maxWorkers) {
        // Remove oldest worker
        const oldestKey = this.workers.keys().next().value as string;
        const oldestWorker = this.workers.get(oldestKey);
        await oldestWorker?.close();
        this.workers.delete(oldestKey);
      }
      
      worker = new OfBrowserWorker(userId, proxy);
      await worker.init();
      this.workers.set(userId, worker);
    }
    
    return worker;
  }

  async closeAll(): Promise<void> {
    for (const worker of this.workers.values()) {
      await worker.close();
    }
    this.workers.clear();
  }
}

// Export singleton pool
export const browserWorkerPool = new BrowserWorkerPool();

// Helper function for sending messages
export async function sendOfMessage(
  userId: string,
  conversationId: string,
  content: { text: string; media?: string[] },
  proxy?: ProxyConfig
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const worker = await browserWorkerPool.getWorker(userId, proxy);
  return worker.sendMessage(conversationId, content);
}
