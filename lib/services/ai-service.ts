import { z } from 'zod';

// AI Provider types
export type AIProvider = 'openai' | 'claude' | 'gemini';

// Request/Response schemas
export const AIRequestSchema = z.object({
  prompt: z.string().min(1),
  context: z.object({
    userId: z.string(),
    contentType: z.enum(['message', 'caption', 'idea', 'pricing', 'timing']).optional(),
    metadata: z.record(z.any()).optional(),
  }),
  options: z.object({
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().min(1).max(4000).default(1000),
    model: z.string().optional(),
  }).default({}),
});

export const AIResponseSchema = z.object({
  content: z.string(),
  usage: z.object({
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number(),
  }),
  model: z.string(),
  provider: z.enum(['openai', 'claude', 'gemini']),
  finishReason: z.enum(['stop', 'length', 'content_filter']),
  metadata: z.record(z.any()).optional(),
});

export type AIRequest = z.infer<typeof AIRequestSchema>;
export type AIResponse = z.infer<typeof AIResponseSchema>;

// Rate limiting and caching
interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
}

interface CacheConfig {
  enabled: boolean;
  ttlSeconds: number;
  maxSize: number;
}

// AI Provider interface
export interface AIProviderInterface {
  name: AIProvider;
  generateText(request: AIRequest): Promise<AIResponse>;
  isAvailable(): Promise<boolean>;
  getRateLimit(): RateLimitConfig;
}

// OpenAI Provider
class OpenAIProvider implements AIProviderInterface {
  name: AIProvider = 'openai';
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string, baseURL = 'https://api.openai.com/v1') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  async generateText(request: AIRequest): Promise<AIResponse> {
    const { prompt, context, options } = request;
    
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(context.contentType),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        user: context.userId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const choice = data.choices[0];

    return {
      content: choice.message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      model: data.model,
      provider: 'openai',
      finishReason: choice.finish_reason === 'stop' ? 'stop' : 
                   choice.finish_reason === 'length' ? 'length' : 'content_filter',
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  getRateLimit(): RateLimitConfig {
    return {
      requestsPerMinute: 60,
      requestsPerHour: 3000,
      requestsPerDay: 10000,
    };
  }

  private getSystemPrompt(contentType?: string): string {
    const basePrompt = `You are an AI assistant for Huntaze, a platform for content creators. You help creators optimize their content, messaging, and monetization strategies.`;
    
    switch (contentType) {
      case 'message':
        return `${basePrompt} You specialize in creating personalized, engaging messages for fans that drive engagement and sales. Be friendly, authentic, and persuasive.`;
      case 'caption':
        return `${basePrompt} You create compelling captions for social media posts that maximize engagement. Include relevant emojis and hashtags when appropriate.`;
      case 'idea':
        return `${basePrompt} You generate creative content ideas based on trends, performance data, and audience preferences. Be innovative and data-driven.`;
      case 'pricing':
        return `${basePrompt} You provide pricing optimization recommendations based on market data, audience behavior, and performance metrics. Be analytical and strategic.`;
      case 'timing':
        return `${basePrompt} You analyze optimal timing for content publication and message sending based on audience activity patterns. Be precise and data-focused.`;
      default:
        return basePrompt;
    }
  }
}

// Claude Provider
class ClaudeProvider implements AIProviderInterface {
  name: AIProvider = 'claude';
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string, baseURL = 'https://api.anthropic.com/v1') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  async generateText(request: AIRequest): Promise<AIResponse> {
    const { prompt, context, options } = request;
    
    const response = await fetch(`${this.baseURL}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: options.model || 'claude-3-haiku-20240307',
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        system: this.getSystemPrompt(context.contentType),
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Claude API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    return {
      content: data.content[0].text,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
      model: data.model,
      provider: 'claude',
      finishReason: data.stop_reason === 'end_turn' ? 'stop' : 
                   data.stop_reason === 'max_tokens' ? 'length' : 'content_filter',
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }],
        }),
      });
      return response.ok || response.status === 400; // 400 is expected for minimal request
    } catch {
      return false;
    }
  }

  getRateLimit(): RateLimitConfig {
    return {
      requestsPerMinute: 50,
      requestsPerHour: 1000,
      requestsPerDay: 5000,
    };
  }

  private getSystemPrompt(contentType?: string): string {
    const basePrompt = `You are Claude, an AI assistant integrated into Huntaze, a platform for content creators. You help creators optimize their content strategy, fan engagement, and revenue generation.`;
    
    switch (contentType) {
      case 'message':
        return `${basePrompt} Focus on creating authentic, personalized messages that build genuine connections with fans while encouraging engagement and purchases.`;
      case 'caption':
        return `${basePrompt} Create engaging, platform-appropriate captions that drive interaction and showcase the creator's personality.`;
      case 'idea':
        return `${basePrompt} Generate innovative content ideas that align with current trends and the creator's brand while maximizing monetization potential.`;
      case 'pricing':
        return `${basePrompt} Provide strategic pricing recommendations based on market analysis, audience psychology, and revenue optimization principles.`;
      case 'timing':
        return `${basePrompt} Analyze audience behavior patterns to recommend optimal timing for maximum engagement and conversion.`;
      default:
        return basePrompt;
    }
  }
}

// Rate limiter
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  async checkLimit(key: string, limit: RateLimitConfig): Promise<boolean> {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Clean old requests
    const validRequests = requests.filter(timestamp => {
      const age = now - timestamp;
      return age < 24 * 60 * 60 * 1000; // Keep requests from last 24 hours
    });

    // Check limits
    const lastMinute = validRequests.filter(t => now - t < 60 * 1000).length;
    const lastHour = validRequests.filter(t => now - t < 60 * 60 * 1000).length;
    const lastDay = validRequests.length;

    if (lastMinute >= limit.requestsPerMinute ||
        lastHour >= limit.requestsPerHour ||
        lastDay >= limit.requestsPerDay) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  getWaitTime(key: string, limit: RateLimitConfig): number {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Find the oldest request that would need to expire
    const minuteRequests = requests.filter(t => now - t < 60 * 1000);
    const hourRequests = requests.filter(t => now - t < 60 * 60 * 1000);
    
    if (minuteRequests.length >= limit.requestsPerMinute) {
      return 60 * 1000 - (now - minuteRequests[0]);
    }
    
    if (hourRequests.length >= limit.requestsPerHour) {
      return 60 * 60 * 1000 - (now - hourRequests[0]);
    }
    
    return 0;
  }
}

// Response cache
class ResponseCache {
  private cache: Map<string, { response: AIResponse; timestamp: number }> = new Map();
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  private generateKey(request: AIRequest): string {
    return Buffer.from(JSON.stringify({
      prompt: request.prompt,
      contentType: request.context.contentType,
      temperature: request.options.temperature,
    })).toString('base64');
  }

  get(request: AIRequest): AIResponse | null {
    if (!this.config.enabled) return null;

    const key = this.generateKey(request);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > this.config.ttlSeconds * 1000) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.response;
  }

  set(request: AIRequest, response: AIResponse): void {
    if (!this.config.enabled) return;

    const key = this.generateKey(request);
    
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Main AI Service
export class AIService {
  private providers: Map<AIProvider, AIProviderInterface> = new Map();
  private rateLimiter = new RateLimiter();
  private cache: ResponseCache;
  private defaultProvider: AIProvider = 'openai';

  constructor(config: {
    openaiApiKey?: string;
    claudeApiKey?: string;
    defaultProvider?: AIProvider;
    cache?: CacheConfig;
  }) {
    // Initialize providers
    if (config.openaiApiKey) {
      this.providers.set('openai', new OpenAIProvider(config.openaiApiKey));
    }
    
    if (config.claudeApiKey) {
      this.providers.set('claude', new ClaudeProvider(config.claudeApiKey));
    }

    this.defaultProvider = config.defaultProvider || 'openai';
    
    // Initialize cache
    this.cache = new ResponseCache(config.cache || {
      enabled: true,
      ttlSeconds: 300, // 5 minutes
      maxSize: 1000,
    });
  }

  async generateText(
    request: AIRequest, 
    preferredProvider?: AIProvider
  ): Promise<AIResponse> {
    // Validate request
    const validatedRequest = AIRequestSchema.parse(request);
    
    // Check cache first
    const cached = this.cache.get(validatedRequest);
    if (cached) {
      return cached;
    }

    // Select provider
    const provider = await this.selectProvider(preferredProvider);
    if (!provider) {
      throw new Error('No AI providers available');
    }

    // Check rate limits
    const rateLimitKey = `${provider.name}:${validatedRequest.context.userId}`;
    const canProceed = await this.rateLimiter.checkLimit(rateLimitKey, provider.getRateLimit());
    
    if (!canProceed) {
      const waitTime = this.rateLimiter.getWaitTime(rateLimitKey, provider.getRateLimit());
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    try {
      // Generate response
      const response = await provider.generateText(validatedRequest);
      
      // Cache response
      this.cache.set(validatedRequest, response);
      
      return response;
    } catch (error) {
      // Try fallback provider if available
      const fallbackProvider = await this.selectFallbackProvider(provider.name);
      if (fallbackProvider) {
        console.warn(`Primary provider ${provider.name} failed, trying fallback ${fallbackProvider.name}`);
        const response = await fallbackProvider.generateText(validatedRequest);
        this.cache.set(validatedRequest, response);
        return response;
      }
      
      throw error;
    }
  }

  private async selectProvider(preferred?: AIProvider): Promise<AIProviderInterface | null> {
    // Try preferred provider first
    if (preferred && this.providers.has(preferred)) {
      const provider = this.providers.get(preferred)!;
      if (await provider.isAvailable()) {
        return provider;
      }
    }

    // Try default provider
    if (this.providers.has(this.defaultProvider)) {
      const provider = this.providers.get(this.defaultProvider)!;
      if (await provider.isAvailable()) {
        return provider;
      }
    }

    // Try any available provider
    for (const [_, provider] of this.providers) {
      if (await provider.isAvailable()) {
        return provider;
      }
    }

    return null;
  }

  private async selectFallbackProvider(exclude: AIProvider): Promise<AIProviderInterface | null> {
    for (const [name, provider] of this.providers) {
      if (name !== exclude && await provider.isAvailable()) {
        return provider;
      }
    }
    return null;
  }

  async getAvailableProviders(): Promise<AIProvider[]> {
    const available: AIProvider[] = [];
    
    for (const [name, provider] of this.providers) {
      if (await provider.isAvailable()) {
        available.push(name);
      }
    }
    
    return available;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getProviderStatus(): Record<AIProvider, boolean> {
    const status: Record<AIProvider, boolean> = {
      openai: false,
      claude: false,
      gemini: false,
    };

    for (const [name] of this.providers) {
      status[name] = true;
    }

    return status;
  }
}

// Singleton instance
let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService({
      openaiApiKey: process.env.OPENAI_API_KEY,
      claudeApiKey: process.env.ANTHROPIC_API_KEY,
      defaultProvider: (process.env.DEFAULT_AI_PROVIDER as AIProvider) || 'openai',
      cache: {
        enabled: process.env.NODE_ENV === 'production',
        ttlSeconds: 300,
        maxSize: 1000,
      },
    });
  }
  
  return aiServiceInstance;
}