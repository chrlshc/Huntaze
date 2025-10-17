import { Browser, BrowserContext, Page, devices, chromium } from 'playwright';
import { FingerprintGenerator } from 'fingerprint-generator';
import { FingerprintInjector } from 'fingerprint-injector';
import { createHash } from 'crypto';

interface BrowserProfile {
  userAgent: string;
  viewport: { width: number; height: number };
  locale: string;
  timezone: string;
  webgl: any;
  canvas: any;
  audio: any;
  fonts: string[];
  plugins: any[];
  deviceMemory: number;
  hardwareConcurrency: number;
  screenResolution: { width: number; height: number };
  colorDepth: number;
  pixelRatio: number;
}

interface ProxyConfig {
  server: string;
  username?: string;
  password?: string;
  type: 'residential' | 'datacenter' | 'mobile';
  location: string;
}

export class AntiDetectionSystem {
  private fingerprintGenerator: FingerprintGenerator;
  private profileCache: Map<string, BrowserProfile> = new Map();
  private proxyRotation: ProxyConfig[] = [];
  private currentProxyIndex: number = 0;

  constructor() {
    // Initialize fingerprint generator with realistic constraints
    this.fingerprintGenerator = new FingerprintGenerator({
      devices: ['desktop'],
      browsers: ['chrome', 'edge', 'firefox'],
      operatingSystems: ['windows', 'macos'],
      locales: ['en-US', 'en-GB', 'en-CA'],
    });

    this.loadProxyList();
  }

  /**
   * Create a stealth browser instance with advanced anti-detection
   */
  async createStealthBrowser(
    userId: string,
    options: {
      headless?: boolean;
      persistProfile?: boolean;
      proxyType?: 'residential' | 'datacenter';
    } = {}
  ): Promise<{ browser: Browser; context: BrowserContext }> {
    // Get or generate browser profile
    const profile = await this.getOrCreateProfile(userId);
    
    // Select proxy
    const proxy = this.selectProxy(options.proxyType);

    // Launch browser with stealth settings
    const browser = await chromium.launch({
      headless: options.headless ?? false,
      args: this.getStealthBrowserArgs(),
      proxy: proxy ? {
        server: proxy.server,
        username: proxy.username,
        password: proxy.password,
      } : undefined,
    });

    // Create context with fingerprint
    const context = await this.createStealthContext(browser, profile, userId, options);

    // Apply advanced evasion techniques
    await this.applyEvasionTechniques(context);

    return { browser, context };
  }

  /**
   * Get or create persistent browser profile
   */
  private async getOrCreateProfile(userId: string): Promise<BrowserProfile> {
    // Check cache
    if (this.profileCache.has(userId)) {
      return this.profileCache.get(userId)!;
    }

    // Generate new fingerprint
    const fingerprint: any = this.fingerprintGenerator.getFingerprint({
      devices: ['desktop'],
      browsers: [{
        name: 'chrome',
        minVersion: 115,
        maxVersion: 120,
      }],
      operatingSystems: ['windows'],
      screen: {
        minWidth: 1366,
        minHeight: 768,
        maxWidth: 1920,
        maxHeight: 1080,
      }
    });

    // Create profile from fingerprint
    const profile: BrowserProfile = {
      userAgent: fingerprint.navigator.userAgent,
      viewport: {
        width: fingerprint.screen.width,
        height: fingerprint.screen.height - 100, // Account for browser chrome
      },
      locale: fingerprint.navigator.language,
      timezone: this.getRandomTimezone(),
      webgl: this.generateWebGLFingerprint(),
      canvas: this.generateCanvasFingerprint(),
      audio: this.generateAudioFingerprint(),
      fonts: this.getRealisticFonts(),
      plugins: this.getRealisticPlugins(),
      deviceMemory: fingerprint.navigator.deviceMemory || 8,
      hardwareConcurrency: fingerprint.navigator.hardwareConcurrency || 4,
      screenResolution: {
        width: fingerprint.screen.width,
        height: fingerprint.screen.height,
      },
      colorDepth: fingerprint.screen.colorDepth || 24,
      pixelRatio: fingerprint.screen.pixelRatio || 1,
    };

    // Cache profile
    this.profileCache.set(userId, profile);

    return profile;
  }

  /**
   * Create stealth browser context
   */
  private async createStealthContext(
    browser: Browser,
    profile: BrowserProfile,
    userId: string,
    options: { persistProfile?: boolean }
  ): Promise<BrowserContext> {
    const context = await browser.newContext({
      userAgent: profile.userAgent,
      viewport: profile.viewport,
      locale: profile.locale,
      timezoneId: profile.timezone,
      deviceScaleFactor: profile.pixelRatio,
      isMobile: false,
      hasTouch: false,
      colorScheme: 'light',
      reducedMotion: 'no-preference',
      forcedColors: 'none',
      permissions: ['geolocation', 'notifications'],
      geolocation: this.getRealisticGeolocation(),
      extraHTTPHeaders: {
        'Accept-Language': `${profile.locale},en;q=0.9`,
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Sec-Ch-Ua': this.generateSecChUaHeader(profile.userAgent),
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': this.getPlatformFromUA(profile.userAgent),
      },
      // Persist session
      storageState: options.persistProfile 
        ? await this.loadStorageState(userId)
        : undefined,
    });

    return context;
  }

  /**
   * Apply advanced evasion techniques
   */
  private async applyEvasionTechniques(context: BrowserContext): Promise<void> {
    // Override navigator properties
    await context.addInitScript(() => {
      // Remove webdriver indicators
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      delete (navigator as any).__proto__.webdriver;

      // Mock plugins realistically
      Object.defineProperty(navigator, 'plugins', {
        get: () => {
          const PluginArray = (window as any).PluginArray;
          const plugins = new PluginArray();

          const pdfPlugin: any = {
            name: 'Chrome PDF Plugin',
            description: 'Portable Document Format',
            filename: 'internal-pdf-viewer',
            length: 1,
          };
          pdfPlugin[0] = {
            type: 'application/pdf',
            suffixes: 'pdf',
            description: 'Portable Document Format',
            enabledPlugin: pdfPlugin,
          };
          pdfPlugin.item = (i: number) => (i === 0 ? pdfPlugin[0] : null);
          pdfPlugin.namedItem = (name: string) => (name === 'application/pdf' ? pdfPlugin[0] : null);

          Object.setPrototypeOf(plugins, PluginArray.prototype);
          (plugins as any)[0] = pdfPlugin;
          (plugins as any)[pdfPlugin.name] = pdfPlugin;

          return plugins;
        },
      });

      // Mock languages properly
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });

      // Mock hardware concurrency
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => 4 + Math.floor(Math.random() * 4), // 4-8 cores
      });

      // Mock device memory
      Object.defineProperty(navigator, 'deviceMemory', {
        get: () => 8,
      });

      // Mock connection
      Object.defineProperty(navigator, 'connection', {
        get: () => ({
          effectiveType: '4g',
          rtt: 50,
          downlink: 10.0,
          saveData: false,
        }),
      });

      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters: any) => {
        if (parameters.name === 'notifications') {
          return Promise.resolve({ state: 'prompt' } as any);
        }
        return originalQuery.apply(navigator.permissions, [parameters]);
      };

      // Mock WebGL vendor/renderer
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) { // UNMASKED_VENDOR_WEBGL
          return 'Intel Inc.';
        }
        if (parameter === 37446) { // UNMASKED_RENDERER_WEBGL
          return 'Intel Iris OpenGL Engine';
        }
        return getParameter.apply(this, [parameter]);
      };

      // Mock canvas fingerprinting
      const toDataURL = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function(...args) {
        // Add slight noise to canvas
        const context = this.getContext('2d');
        if (context) {
          const imageData = context.getImageData(0, 0, this.width, this.height);
          for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] += Math.random() * 2 - 1;     // R
            imageData.data[i+1] += Math.random() * 2 - 1;   // G
            imageData.data[i+2] += Math.random() * 2 - 1;   // B
          }
          context.putImageData(imageData, 0, 0);
        }
        return toDataURL.apply(this, args);
      };

      // Mock audio fingerprinting
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      const audioContext = AudioContext.prototype;
      const createAnalyser = audioContext.createAnalyser;
      audioContext.createAnalyser = function() {
        const analyser = createAnalyser.apply(this, []);
        const getFloatFrequencyData = analyser.getFloatFrequencyData;
        analyser.getFloatFrequencyData = function(array: Float32Array) {
          getFloatFrequencyData.apply(this, [array]);
          for (let i = 0; i < array.length; i++) {
            array[i] += Math.random() * 0.001;
          }
        };
        return analyser;
      };

      // Mock battery API
      if ('getBattery' in navigator) {
        (navigator as any).getBattery = () => Promise.resolve({
          charging: true,
          chargingTime: 0,
          dischargingTime: Infinity,
          level: 0.99,
        });
      }

      // Mock media devices
      if ('mediaDevices' in navigator) {
        navigator.mediaDevices.enumerateDevices = () => Promise.resolve([
          {
            deviceId: 'default',
            kind: 'audioinput',
            label: 'Default Audio Device',
            groupId: 'default',
          } as any,
          {
            deviceId: 'communications',
            kind: 'audiooutput',
            label: 'Communications Device',
            groupId: 'communications',
          } as any,
        ]);
      }

      // Hide automation indicators
      delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Array;
      delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Promise;
      delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
    });

    // Inject realistic mouse movements
    await this.injectMouseMovements(context);

    // Inject realistic scrolling behavior
    await this.injectScrollingBehavior(context);

    // Add realistic timing variations
    await this.injectTimingVariations(context);
  }

  /**
   * Get stealth browser arguments
   */
  private getStealthBrowserArgs(): string[] {
    return [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--flag-switches-begin',
      '--disable-site-isolation-trials',
      '--flag-switches-end',
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--window-position=0,0',
      '--ignore-certificate-errors',
      '--ignore-certificate-errors-spki-list',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--hide-scrollbars',
      '--mute-audio',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection',
      '--password-store=basic',
      '--use-mock-keychain',
      '--force-webrtc-ip-handling-policy=default_public_interface_only',
      '--metrics-recording-only',
      '--disable-hang-monitor',
      '--disable-prompt-on-repost',
      '--disable-sync',
      '--disable-web-resources',
      '--safebrowsing-disable-auto-update',
      '--disable-client-side-phishing-detection',
      '--disable-component-update',
      '--disable-default-apps',
      '--disable-domain-reliability',
      '--disable-features=AudioServiceOutOfProcess',
      '--disable-features=site-per-process',
      '--disable-print-preview',
      '--disable-features=WebRtcHideLocalIpsWithMdns',
      '--disable-speech-api',
      '--disable-features=UserAgentClientHint',
      '--disable-file-system',
      '--disable-web-security',
      '--allow-running-insecure-content',
      '--disable-features=CrossSiteDocumentBlockingAlways,CrossSiteDocumentBlockingIfIsolating',
      '--disable-features=ImprovedCookieControls,LaxSameSiteCookiesEnabledByDefault,SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure',
    ];
  }

  /**
   * Inject realistic mouse movements
   */
  private async injectMouseMovements(context: BrowserContext): Promise<void> {
    context.on('page', async (page) => {
      // Random mouse movements on page load
      page.on('load', async () => {
        const viewport = page.viewportSize();
        if (!viewport) return;

        // Simulate natural mouse movement
        for (let i = 0; i < 3; i++) {
          const x = Math.random() * viewport.width;
          const y = Math.random() * viewport.height;
          
          await page.mouse.move(x, y, {
            steps: 10 + Math.floor(Math.random() * 20),
          });
          
          await this.randomDelay(100, 300);
        }
      });
    });
  }

  /**
   * Inject realistic scrolling behavior
   */
  private async injectScrollingBehavior(context: BrowserContext): Promise<void> {
    context.on('page', async (page) => {
      page.on('load', async () => {
        // Random scroll after page load
        await this.randomDelay(1000, 2000);
        
        await page.evaluate(() => {
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          const scrollTo = Math.random() * Math.min(maxScroll, 500);
          
          window.scrollTo({
            top: scrollTo,
            behavior: 'smooth',
          });
        });
      });
    });
  }

  /**
   * Inject timing variations
   */
  private async injectTimingVariations(context: BrowserContext): Promise<void> {
    await context.addInitScript(() => {
      // Override setTimeout/setInterval to add random delays
      const originalSetTimeout = window.setTimeout;
      window.setTimeout = ((callback: TimerHandler, delay: number = 0, ...args: any[]) => {
        const variation = delay * 0.1 * (Math.random() - 0.5); // ±5% variation
        return (originalSetTimeout as unknown as (...innerArgs: any[]) => any).call(
          window,
          callback,
          delay + variation,
          ...args
        );
      }) as unknown as typeof window.setTimeout;

      const originalSetInterval = window.setInterval;
      window.setInterval = ((callback: TimerHandler, delay: number = 0, ...args: any[]) => {
        const variation = delay * 0.1 * (Math.random() - 0.5); // ±5% variation
        return (originalSetInterval as unknown as (...innerArgs: any[]) => any).call(
          window,
          callback,
          delay + variation,
          ...args
        );
      }) as unknown as typeof window.setInterval;
    });
  }

  /**
   * Generate WebGL fingerprint
   */
  private generateWebGLFingerprint(): any {
    const vendors = [
      'Intel Inc.',
      'NVIDIA Corporation',
      'ATI Technologies Inc.',
      'Apple Inc.',
    ];
    
    const renderers = [
      'Intel Iris OpenGL Engine',
      'NVIDIA GeForce GTX 1060/PCIe/SSE2',
      'AMD Radeon Pro 5500M OpenGL Engine',
      'Apple M1',
    ];

    return {
      vendor: vendors[Math.floor(Math.random() * vendors.length)],
      renderer: renderers[Math.floor(Math.random() * renderers.length)],
    };
  }

  /**
   * Generate canvas fingerprint
   */
  private generateCanvasFingerprint(): string {
    // Generate consistent but unique canvas fingerprint
    const data = `canvas_${Date.now()}_${Math.random()}`;
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate audio fingerprint
   */
  private generateAudioFingerprint(): number {
    // Generate realistic audio fingerprint value
    return 35.73833402246237 + (Math.random() * 0.0001);
  }

  /**
   * Get realistic fonts list
   */
  private getRealisticFonts(): string[] {
    const windowsFonts = [
      'Arial', 'Arial Black', 'Comic Sans MS', 'Courier New',
      'Georgia', 'Impact', 'Lucida Console', 'Lucida Sans Unicode',
      'Microsoft Sans Serif', 'Palatino Linotype', 'Tahoma',
      'Times New Roman', 'Trebuchet MS', 'Verdana',
    ];

    const macFonts = [
      'American Typewriter', 'Andale Mono', 'Apple Chancery',
      'Apple Color Emoji', 'Apple Symbols', 'Arial', 'Arial Black',
      'Avenir', 'Baskerville', 'Big Caslon', 'Brush Script MT',
      'Chalkboard', 'Comic Sans MS', 'Courier', 'Courier New',
      'Futura', 'Geneva', 'Georgia', 'Gill Sans', 'Helvetica',
      'Helvetica Neue', 'Impact', 'Lucida Grande', 'Monaco',
      'Palatino', 'Phosphate', 'Times New Roman', 'Trebuchet MS',
    ];

    // Return fonts based on platform
    return Math.random() > 0.5 ? windowsFonts : macFonts;
  }

  /**
   * Get realistic plugins
   */
  private getRealisticPlugins(): any[] {
    return [
      {
        name: 'Chrome PDF Plugin',
        filename: 'internal-pdf-viewer',
        description: 'Portable Document Format',
      },
      {
        name: 'Chrome PDF Viewer',
        filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
        description: '',
      },
      {
        name: 'Native Client',
        filename: 'internal-nacl-plugin',
        description: '',
      },
    ];
  }

  /**
   * Generate Sec-CH-UA header
   */
  private generateSecChUaHeader(userAgent: string): string {
    const match = userAgent.match(/Chrome\/(\d+)/);
    if (!match) return '';
    
    const version = match[1];
    return `"Chromium";v="${version}", "Google Chrome";v="${version}", "Not=A?Brand";v="99"`;
  }

  /**
   * Get platform from user agent
   */
  private getPlatformFromUA(userAgent: string): string {
    if (userAgent.includes('Windows')) return '"Windows"';
    if (userAgent.includes('Mac')) return '"macOS"';
    if (userAgent.includes('Linux')) return '"Linux"';
    return '"Unknown"';
  }

  /**
   * Get realistic geolocation
   */
  private getRealisticGeolocation(): { latitude: number; longitude: number } {
    const locations = [
      { latitude: 40.7128, longitude: -74.0060 }, // New York
      { latitude: 34.0522, longitude: -118.2437 }, // Los Angeles
      { latitude: 41.8781, longitude: -87.6298 }, // Chicago
      { latitude: 29.7604, longitude: -95.3698 }, // Houston
      { latitude: 33.7490, longitude: -84.3880 }, // Atlanta
    ];
    
    return locations[Math.floor(Math.random() * locations.length)];
  }

  /**
   * Get random timezone
   */
  private getRandomTimezone(): string {
    const timezones = [
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Phoenix',
    ];
    
    return timezones[Math.floor(Math.random() * timezones.length)];
  }

  /**
   * Load proxy list
   */
  private loadProxyList(): void {
    // In production, load from secure storage or proxy provider API
    this.proxyRotation = [
      {
        server: 'http://residential1.proxy.com:8080',
        username: 'user',
        password: 'pass',
        type: 'residential',
        location: 'US',
      },
      // Add more proxies...
    ];
  }

  /**
   * Select proxy based on requirements
   */
  private selectProxy(type?: 'residential' | 'datacenter'): ProxyConfig | null {
    if (this.proxyRotation.length === 0) return null;
    
    const filteredProxies = type 
      ? this.proxyRotation.filter(p => p.type === type)
      : this.proxyRotation;
    
    if (filteredProxies.length === 0) return null;
    
    // Round-robin selection
    const proxy = filteredProxies[this.currentProxyIndex % filteredProxies.length];
    this.currentProxyIndex++;
    
    return proxy;
  }

  /**
   * Random delay helper
   */
  private async randomDelay(min: number, max: number): Promise<void> {
    const delay = min + Math.random() * (max - min);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Load storage state for persistent sessions
   */
  private async loadStorageState(userId: string): Promise<any> {
    // In production, load from secure storage
    // This would include cookies, localStorage, sessionStorage
    return null;
  }

  /**
   * Test anti-detection effectiveness
   */
  async testAntiDetection(page: Page): Promise<{
    passed: boolean;
    results: Record<string, boolean>;
  }> {
    const results: Record<string, boolean> = {};

    // Test webdriver detection
    results.webdriver = await page.evaluate(() => {
      return navigator.webdriver === undefined;
    });

    // Test Chrome detection
    results.chrome = await page.evaluate(() => {
      return !!(window as any).chrome;
    });

    // Test plugins
    results.plugins = await page.evaluate(() => {
      return navigator.plugins.length > 0;
    });

    // Test languages
    results.languages = await page.evaluate(() => {
      return navigator.languages.length > 0;
    });

    // Test WebGL
    results.webgl = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      if (!gl) return false;
      
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      return !!debugInfo;
    });

    // Test permissions
    results.permissions = await page.evaluate(async () => {
      try {
        await navigator.permissions.query({ name: 'notifications' as any });
        return true;
      } catch {
        return false;
      }
    });

    // Check automation controlled
    results.automationControlled = await page.evaluate(() => {
      return !(window as any).document.__proto__.hasFocus;
    });

    const passed = Object.values(results).every(result => result);

    return { passed, results };
  }
}

// Usage:
// const antiDetection = new AntiDetectionSystem();
// const { browser, context } = await antiDetection.createStealthBrowser(userId, {
//   headless: false,
//   persistProfile: true,
//   proxyType: 'residential'
// });
// const page = await context.newPage();
// await page.goto('https://onlyfans.com');

// Test effectiveness:
// const { passed, results } = await antiDetection.testAntiDetection(page);
// console.log('Anti-detection test:', passed ? 'PASSED' : 'FAILED', results);
