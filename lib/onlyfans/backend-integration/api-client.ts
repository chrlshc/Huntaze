import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse
} from 'axios';
import { createHash } from 'crypto';
import { CookieJar } from 'tough-cookie';

interface OnlyFansApiConfig {
  cookies: any[];
  userAgent: string;
  userId?: string;
}

interface SignatureHeaders {
  'sign': string;
  'time': string;
  'user-id': string;
}

export class OnlyFansApiClient {
  private axios: AxiosInstance;
  private cookieJar: CookieJar;
  private userId: string = '';
  private dynamicRules: any = null;
  
  // OnlyFans API endpoints (reverse engineered)
  private readonly BASE_URL = 'https://onlyfans.com';
  private readonly API_BASE = `${this.BASE_URL}/api2/v2`;
  
  private readonly ENDPOINTS = {
    // Auth & User
    me: '/users/me',
    user: (id: string) => `/users/${id}`,
    
    // Messages
    chats: '/chats',
    messages: (chatId: string) => `/chats/${chatId}/messages`,
    sendMessage: '/messages',
    
    // Fans
    subscribers: '/subscriptions/subscribers',
    subscribersCount: '/subscriptions/subscribers/count',
    
    // Content
    posts: '/users/:userId/posts',
    vault: '/vault/media',
    stories: '/stories',
    
    // Transactions
    transactions: '/payments/transactions',
    earnings: '/earnings/chart',
    
    // Notifications
    notifications: '/users/notifications',
    
    // Analytics
    statistics: '/statistics',
  };

  constructor(config: OnlyFansApiConfig) {
    this.cookieJar = new CookieJar();
    
    // Add cookies to jar
    config.cookies.forEach(cookie => {
      this.cookieJar.setCookieSync(
        `${cookie.name}=${cookie.value}; Domain=${cookie.domain}; Path=${cookie.path}`,
        this.BASE_URL
      );
    });

    // Create axios instance with cookie support
    this.axios = axios.create({
      baseURL: this.API_BASE,
      timeout: 30000,
      headers: {
        'User-Agent': config.userAgent,
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://onlyfans.com/',
        'Origin': 'https://onlyfans.com',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    // Add request interceptor for dynamic headers
    this.axios.interceptors.request.use(
      async (config) => await this.addDynamicHeaders(config),
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.axios.interceptors.response.use(
      (response) => this.handleResponseCookies(response),
      async (error) => this.handleApiError(error)
    );

    // Sync cookies on outgoing requests
    this.axios.interceptors.request.use(
      async (config) => this.applyRequestCookies(config),
      (error) => Promise.reject(error)
    );

    if (config.userId) {
      this.userId = config.userId;
    }
  }

  /**
   * Initialize client (get user info and dynamic rules)
   */
  async initialize(): Promise<void> {
    // Get current user info
    const meResponse = await this.axios.get(this.ENDPOINTS.me);
    this.userId = meResponse.data.id;
    
    // Fetch dynamic rules for signature generation
    await this.fetchDynamicRules();
  }

  /**
   * Get all conversations
   */
  async getChats(limit = 100, offset = 0) {
    const response = await this.axios.get(this.ENDPOINTS.chats, {
      params: { limit, offset, order: 'recent' }
    });
    
    return response.data;
  }

  /**
   * Get messages in a conversation
   */
  async getMessages(chatId: string, limit = 30, offset = 0) {
    const response = await this.axios.get(
      this.ENDPOINTS.messages(chatId),
      { params: { limit, offset } }
    );
    
    return response.data;
  }

  /**
   * Send a message
   */
  async sendMessage(recipientId: string, text: string, price?: number) {
    const payload = {
      recipientId,
      text,
      lockedText: false,
      isCouplePeopleMedia: false,
      ...(price && { price })
    };

    const response = await this.axios.post(
      this.ENDPOINTS.sendMessage,
      payload
    );
    
    return response.data;
  }

  /**
   * Create a new post on OnlyFans
   */
  async createPost(content: {
    text: string;
    price?: number;
    media?: string[];
    isScheduled?: boolean;
    scheduledFor?: string;
  }) {
    if (!this.userId) {
      await this.initialize();
    }

    const endpoint = this.ENDPOINTS.posts.replace(':userId', this.userId);
    const payload: Record<string, any> = {
      text: content.text,
      publishType: content.isScheduled ? 'scheduled' : 'immediate',
      price: content.price || 0,
      isLocked: Boolean(content.price && content.price > 0),
      preview: false,
      sections: [],
    };

    if (Array.isArray(content.media) && content.media.length > 0) {
      payload.attachments = content.media.map((mediaId) => ({ mediaId }));
    }

    if (content.isScheduled && content.scheduledFor) {
      payload.publishDate = content.scheduledFor;
    }

    const response = await this.axios.post(endpoint, payload);
    return response.data;
  }

  /**
   * Get subscribers (fans)
   */
  async getSubscribers(limit = 100, offset = 0) {
    const response = await this.axios.get(this.ENDPOINTS.subscribers, {
      params: {
        limit,
        offset,
        type: 'active',
        sort: 'desc',
        field: 'expire_date'
      }
    });
    
    return response.data;
  }

  /**
   * Get subscriber count
   */
  async getSubscribersCount() {
    const response = await this.axios.get(this.ENDPOINTS.subscribersCount);
    return response.data;
  }

  /**
   * Get earnings data
   */
  async getEarnings(period = 'month') {
    const response = await this.axios.get(this.ENDPOINTS.earnings, {
      params: { period }
    });
    
    return response.data;
  }

  /**
   * Get vault media
   */
  async getVaultMedia(limit = 50, offset = 0) {
    const response = await this.axios.get(this.ENDPOINTS.vault, {
      params: { limit, offset, type: 'photo,video' }
    });
    
    return response.data;
  }

  /**
   * Add dynamic headers (including signature)
   */
  private async addDynamicHeaders(
    config: InternalAxiosRequestConfig
  ): Promise<InternalAxiosRequestConfig> {
    // Add auth cookie header
    const authCookie = await this.getAuthCookie();
    if (authCookie) {
      const headers = config.headers ?? (config.headers = {} as any);
      (headers as any)['Cookie'] = `auth_id=${authCookie}`;
    }

    // Add signature headers for protected endpoints
    if (this.requiresSignature(config.url!)) {
      const signatureHeaders = await this.generateSignature(
        config.url!,
        config.method!.toUpperCase()
      );
      
      const headers = config.headers ?? (config.headers = {} as any);
      Object.assign(headers as any, signatureHeaders);
    }

    return config;
  }

  private async applyRequestCookies(
    config: InternalAxiosRequestConfig
  ): Promise<InternalAxiosRequestConfig> {
    const cookieHeader = await this.cookieJar.getCookieString(config.baseURL || this.BASE_URL);
    if (cookieHeader) {
      const headers = config.headers ?? (config.headers = {} as any);
      (headers as any)['Cookie'] = cookieHeader;
    }
    return config;
  }

  private handleResponseCookies(response: AxiosResponse): AxiosResponse {
    const setCookie = response.headers?.['set-cookie'];
    if (Array.isArray(setCookie)) {
      for (const cookie of setCookie) {
        try {
          this.cookieJar.setCookieSync(cookie, this.BASE_URL);
        } catch (error) {
          console.warn('Failed to set cookie', error);
        }
      }
    }
    return response;
  }

  /**
   * Check if endpoint requires signature
   */
  private requiresSignature(url: string): boolean {
    const protectedEndpoints = [
      '/messages',
      '/subscriptions',
      '/payments',
      '/posts'
    ];
    
    return protectedEndpoints.some(endpoint => url.includes(endpoint));
  }

  /**
   * Generate OnlyFans signature headers
   */
  private async generateSignature(
    path: string,
    method: string
  ): Promise<SignatureHeaders> {
    const time = Math.floor(Date.now() / 1000).toString();
    
    // OnlyFans uses a dynamic signature algorithm
    // This is simplified - real implementation needs dynamic rules
    const message = [method, path, time, this.userId].join('\n');
    
    // In production, use dynamic rules or external service
    const sign = await this.calculateDynamicSign(message);
    
    return {
      'sign': sign,
      'time': time,
      'user-id': this.userId
    };
  }

  /**
   * Calculate dynamic signature (simplified)
   */
  private async calculateDynamicSign(message: string): Promise<string> {
    // In production, this would:
    // 1. Use dynamic rules fetched from OnlyFans
    // 2. Or call external service like ofscripts.tech
    // 3. Or execute the obfuscated JS from OnlyFans
    
    // Placeholder implementation
    const hash = createHash('sha1');
    hash.update(message);
    return hash.digest('hex');
  }

  /**
   * Fetch dynamic rules from OnlyFans
   */
  private async fetchDynamicRules(): Promise<void> {
    try {
      // OnlyFans serves dynamic rules via a script tag
      // This would need to be parsed and executed
      const response = await this.axios.get(this.BASE_URL);
      
      // Extract rules from response (simplified)
      // In reality, this involves parsing obfuscated JS
      this.dynamicRules = {};
    } catch (error) {
      console.error('Failed to fetch dynamic rules:', error);
    }
  }

  /**
   * Get auth cookie value
   */
  private async getAuthCookie(): Promise<string | null> {
    const cookies = await this.cookieJar.getCookies(this.BASE_URL);
    const authCookie = cookies.find(c => c.key === 'auth_id');
    return authCookie?.value || null;
  }

  /**
   * Handle API errors
   */
  private async handleApiError(error: any) {
    if (error.response?.status === 401) {
      throw new Error('Session expired. Re-authentication required.');
    }
    
    if (error.response?.status === 429) {
      // Rate limited - implement retry logic
      const retryAfter = error.response.headers['retry-after'] || 60;
      throw new Error(`Rate limited. Retry after ${retryAfter} seconds.`);
    }
    
    if (error.response?.status === 400 && 
        error.response?.data?.error?.message?.includes('sign')) {
      throw new Error('Invalid signature. Dynamic rules may have changed.');
    }
    
    throw error;
  }

  /**
   * Batch operations for efficiency
   */
  async batchGetMessages(chatIds: string[], messagesPerChat = 20) {
    const promises = chatIds.map(chatId => 
      this.getMessages(chatId, messagesPerChat)
        .catch(error => ({ chatId, error: error.message }))
    );
    
    return await Promise.all(promises);
  }

  /**
   * Get all data for dashboard
   */
  async getDashboardData() {
    const [chats, subscribers, earnings, notifications] = await Promise.all([
      this.getChats(50),
      this.getSubscribers(50),
      this.getEarnings(),
      this.axios.get(this.ENDPOINTS.notifications)
    ]);
    
    return {
      chats: chats.list,
      totalChats: chats.hasMore ? '50+' : chats.list.length,
      subscribers: subscribers.list,
      totalSubscribers: subscribers.counters?.total || 0,
      earnings: earnings.chart,
      notifications: notifications.data.list,
      unreadNotifications: notifications.data.counters?.new || 0
    };
  }
}

// Usage:
// const client = new OnlyFansApiClient({
//   cookies: session.cookies,
//   userAgent: session.userAgent,
//   userId: session.userId
// });
// await client.initialize();
// const chats = await client.getChats();
