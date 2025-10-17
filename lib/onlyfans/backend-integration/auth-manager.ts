import { Browser, Page, chromium } from 'playwright';
import { createHash, randomBytes, createCipheriv } from 'crypto';
import { Redis } from 'ioredis';
import { OnlyFansApiClient } from './api-client';

interface OnlyFansSession {
  userId: string;
  cookies: any[];
  userAgent: string;
  viewport: { width: number; height: number };
  fingerprint: string;
  expiresAt: Date;
  lastUsed: Date;
}

export class OnlyFansAuthManager {
  private redis: Redis;
  private encryptionKey: Buffer;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
    this.encryptionKey = Buffer.from(process.env.SESSION_ENCRYPTION_KEY!, 'hex');
  }

  /**
   * Authenticate a user on OnlyFans using headless browser
   * Handles 2FA, captcha, and device verification
   */
  async authenticate(
    email: string,
    password: string,
    get2FACode?: () => Promise<string>
  ): Promise<OnlyFansSession> {
    const browser = await chromium.launch({
      headless: false, // Start visible for initial auth
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--flag-switches-begin --disable-site-isolation-trials --flag-switches-end'
      ]
    });

    try {
      const userAgent = this.generateRealisticUserAgent();
      const viewport = { width: 1920, height: 1080 };
      const locale = 'en-US';
      const timezoneId = 'America/New_York';

      // Create persistent context with stealth settings
      const context = await browser.newContext({
        userAgent,
        viewport,
        deviceScaleFactor: 1,
        hasTouch: false,
        isMobile: false,
        locale,
        timezoneId,
        permissions: ['notifications'],
        // Anti-detection measures
        extraHTTPHeaders: {
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        }
      });

      // Inject stealth scripts
      await context.addInitScript(() => {
        // Override webdriver detection
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined
        });

        // Mock plugins
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5]
        });

        // Mock languages
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en']
        });

        // Override chrome detection
        (window as any).chrome = {
          runtime: {},
          loadTimes: () => {},
          csi: () => {}
        };

        // Mock permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters: any) => {
          return parameters.name === 'notifications' 
            ? Promise.resolve({ state: 'denied' } as any)
            : originalQuery(parameters);
        };
      });

      const page = await context.newPage();
      
      // Navigate to OnlyFans login
      await page.goto('https://onlyfans.com', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Handle Cloudflare challenge if present
      await this.bypassCloudflare(page);

      // Click login button
      await page.click('a[href="/login"]', { timeout: 10000 });
      await page.waitForURL('**/login**', { timeout: 10000 });

      // Fill login form
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      
      // Add random delays to simulate human behavior
      await this.humanDelay();

      // Submit login
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle' }),
        page.click('button[type="submit"]')
      ]);

      // Check for 2FA
      if (await this.requires2FA(page)) {
        if (!get2FACode) {
          throw new Error('2FA required but no code provider given');
        }
        
        const code = await get2FACode();
        await this.handle2FA(page, code);
      }

      // Check for device verification
      if (await this.requiresDeviceVerification(page)) {
        await this.handleDeviceVerification(page);
      }

      // Verify successful login
      await page.waitForURL('https://onlyfans.com/**', { timeout: 30000 });
      
      // Extract session data
      const cookies = await context.cookies();
      const session: OnlyFansSession = {
        userId: email, // Will be updated with actual user ID
        cookies,
        userAgent,
        viewport,
        fingerprint: this.generateFingerprint({
          userAgent,
          viewport,
          locale,
          timezoneId
        }),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        lastUsed: new Date()
      };

      // Store encrypted session
      await this.storeSession(session);

      // Close browser but keep session
      await browser.close();

      return session;

    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  /**
   * Bypass Cloudflare protection using Playwright
   */
  private async bypassCloudflare(page: Page): Promise<void> {
    // Wait for Cloudflare challenge
    const hasCloudflare = await page.locator('text=/Checking your browser/i').count() > 0;
    
    if (hasCloudflare) {
      console.log('Cloudflare challenge detected, waiting...');
      
      // Wait for challenge to complete (up to 20 seconds)
      await page.waitForFunction(
        () => !document.querySelector('[id*="challenge"]'),
        { timeout: 20000 }
      );
      
      // Additional wait for redirect
      await page.waitForLoadState('networkidle');
    }
  }

  /**
   * Check if 2FA is required
   */
  private async requires2FA(page: Page): Promise<boolean> {
    return await page.locator('input[name="code"]').count() > 0;
  }

  /**
   * Handle 2FA verification with multiple methods
   */
  private async handle2FA(page: Page, code: string): Promise<void> {
    // Check if it's SMS code or authenticator app
    const isSMSCode = await page.locator('text=/SMS/i').count() > 0;
    const isAuthApp = await page.locator('text=/authenticator/i').count() > 0;
    
    // Different input selectors for different 2FA types
    const codeInputSelector = isSMSCode 
      ? 'input[name="code"], input[placeholder*="code"], input[type="tel"]'
      : 'input[name="code"], input[placeholder*="code"], input[type="number"]';
    
    // Wait for input to be visible
    await page.waitForSelector(codeInputSelector, { timeout: 10000 });
    
    // Clear any existing value
    await page.click(codeInputSelector, { clickCount: 3 });
    await page.keyboard.press('Backspace');
    
    // Type code with human-like delays
    for (const digit of code) {
      await page.type(codeInputSelector, digit);
      await this.humanDelay(50, 150);
    }
    
    await this.humanDelay();
    
    // Find and click submit button
    const submitButton = await page.locator('button[type="submit"], button:has-text("Verify"), button:has-text("Submit"), button:has-text("Continue")').first();
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }),
      submitButton.click()
    ]);
    
    // Check if code was incorrect
    const errorMessage = await page.locator('text=/incorrect|invalid|wrong/i').count();
    if (errorMessage > 0) {
      throw new Error('Invalid 2FA code');
    }
  }

  /**
   * Check if device verification is required
   */
  private async requiresDeviceVerification(page: Page): Promise<boolean> {
    return await page.locator('text=/verify.*device/i').count() > 0;
  }

  /**
   * Handle device verification (email link)
   */
  private async handleDeviceVerification(page: Page): Promise<void> {
    console.log('Device verification required. Check email for verification link.');
    
    // Wait for user to click verification link (up to 5 minutes)
    await page.waitForURL('https://onlyfans.com/**', {
      timeout: 300000 // 5 minutes
    });
  }

  /**
   * Generate realistic user agent
   */
  private generateRealisticUserAgent(): string {
    const agents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
    ];
    
    return agents[Math.floor(Math.random() * agents.length)];
  }

  /**
   * Generate device fingerprint
   */
  private generateFingerprint(details: {
    userAgent: string;
    viewport: { width: number; height: number };
    locale: string;
    timezoneId: string;
  }): string {
    const data = JSON.stringify({
      userAgent: details.userAgent,
      viewport: details.viewport,
      locale: details.locale,
      timezone: details.timezoneId
    });
    
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Add human-like delays
   */
  private async humanDelay(min: number = 500, max: number = 2500): Promise<void> {
    const delay = min + Math.random() * (max - min);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Store encrypted session in Redis/DynamoDB
   */
  private async storeSession(session: OnlyFansSession): Promise<void> {
    const encrypted = await this.encryptSession(session);
    const key = `of:session:${session.userId}`;
    
    await this.redis.set(
      key,
      encrypted,
      'EX',
      30 * 24 * 60 * 60 // 30 days
    );
  }

  /**
   * Encrypt session data
   */
  private async encryptSession(session: OnlyFansSession): Promise<string> {
    // Implementation of AES-256-GCM encryption
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    
    const data = JSON.stringify(session);
    const encrypted = Buffer.concat([
      cipher.update(data, 'utf8'),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  }

  /**
   * Create API client with stored session
   */
  async createApiClient(userId: string): Promise<OnlyFansApiClient> {
    const session = await this.getStoredSession(userId);
    if (!session) {
      throw new Error('No stored session found');
    }

    return new OnlyFansApiClient(session);
  }

  private async getStoredSession(userId: string): Promise<OnlyFansSession | null> {
    const key = `of:session:${userId}`;
    const encrypted = await this.redis.get(key);
    
    if (!encrypted) return null;
    
    return await this.decryptSession(encrypted);
  }

  private async decryptSession(encrypted: string): Promise<OnlyFansSession> {
    // Decrypt implementation
    // ...
    throw new Error('Implementation needed');
  }
}

// Usage:
// const authManager = new OnlyFansAuthManager();
// const session = await authManager.authenticate(email, password, async () => {
//   // Get 2FA code from user
//   return await prompt('Enter 2FA code:');
// });
