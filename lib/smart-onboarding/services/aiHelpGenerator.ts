import { 
  AIHelpGenerator,
  HelpContent,
  HelpContext,
  HelpLevel
} from '../interfaces/services';
import { logger } from '../../utils/logger';

/**
 * Configuration for Azure OpenAI API
 */
interface AzureOpenAIConfig {
  apiKey: string;
  endpoint: string;
  deploymentName: string;
  apiVersion: string;
}

/**
 * Azure OpenAI API Response
 */
interface AzureOpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

/**
 * Cache entry for API responses
 */
interface CacheEntry {
  content: string;
  timestamp: number;
  confidence?: number;
}

export class AIHelpGeneratorImpl implements AIHelpGenerator {
  private config: AzureOpenAIConfig;
  private retryConfig: RetryConfig;
  private cache: Map<string, CacheEntry>;
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes
  private requestQueue: Map<string, Promise<any>>;

  constructor() {
    // Validate required environment variables
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    
    if (!apiKey || !endpoint) {
      logger.error('Missing required Azure OpenAI configuration', {
        hasApiKey: !!apiKey,
        hasEndpoint: !!endpoint
      });
      throw new Error('Azure OpenAI configuration is incomplete. Check AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT environment variables.');
    }

    this.config = {
      apiKey,
      endpoint,
      deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4',
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview'
    };

    this.retryConfig = {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2
    };

    this.cache = new Map();
    this.requestQueue = new Map();

    logger.info('AIHelpGenerator initialized', {
      endpoint: this.config.endpoint,
      deployment: this.config.deploymentName,
      apiVersion: this.config.apiVersion
    });
  }

  /**
   * Generate contextual help content using AI
   * 
   * @param context - The help context including current step and user action
   * @param userState - User's current state and preferences
   * @returns Promise<HelpContent> - Generated help content
   * 
   * @throws Error if API call fails after retries
   */
  async generateHelp(context: HelpContext, userState: any): Promise<HelpContent> {
    const startTime = Date.now();
    
    try {
      logger.debug('Generating AI help', {
        step: context.currentStep,
        action: context.userAction,
        difficulty: context.difficulty
      });

      const prompt = this.buildHelpPrompt(context, userState);
      const cacheKey = this.getCacheKey('help', prompt);
      
      // Check cache first
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        logger.debug('Returning cached help content', { cacheKey });
        return this.buildHelpContent(cached.content, context, userState, cached.confidence, true);
      }

      // Deduplicate concurrent requests
      const response = await this.deduplicateRequest(cacheKey, () => 
        this.callAzureOpenAIWithRetry(prompt)
      );
      
      // Cache the response
      this.setCache(cacheKey, response.content, response.confidence);
      
      const helpContent = this.buildHelpContent(response.content, context, userState, response.confidence);

      const duration = Date.now() - startTime;
      logger.info('Generated AI help content', {
        helpId: helpContent.id,
        stepId: context.currentStep,
        // Log derived level information for observability (not part of HelpContent type)
        level: this.determineHelpLevel(context, userState),
        cached: false,
        durationMs: duration
      });

      return helpContent;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to generate AI help', {
        error: error instanceof Error ? error.message : 'Unknown error',
        step: context.currentStep,
        durationMs: duration
      });
      
      // Return fallback help content instead of throwing
      return this.getFallbackHelpContent(context, userState);
    }
  }

  /**
   * Build help content object from AI response
   */
  private buildHelpContent(
    content: string,
    context: HelpContext,
    userState: any,
    confidence?: number,
    fromCache: boolean = false
  ): HelpContent {
    const helpLevel = this.determineHelpLevel(context, userState);
    const difficulty = this.mapDifficulty(context.difficulty);
    const estimatedTime = this.estimateReadingTime(helpLevel, content);

    return {
      id: `ai_help_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'tooltip',
      title: this.buildTitle(context),
      content,
      media: [],
      relatedTopics: context.topic ? [context.topic] : [],
      difficulty,
      estimatedTime,
      helpfulness: confidence ?? 0.8,
      tags: ['help', 'ai', `level:${helpLevel}`],
      lastUpdated: new Date()
    };
  }

  /**
   * Get fallback help content when AI fails
   */
  private getFallbackHelpContent(context: HelpContext, userState: any): HelpContent {
    const helpLevel = this.determineHelpLevel(context, userState);
    const difficulty = this.mapDifficulty(context.difficulty);
    const content = 'Need help with this step? Our support team is here to assist you. Click the help icon for more information.';

    return {
      id: `fallback_help_${Date.now()}`,
      type: 'tooltip',
      title: this.buildTitle(context),
      content,
      media: [],
      relatedTopics: context.topic ? [context.topic] : [],
      difficulty,
      estimatedTime: this.estimateReadingTime(helpLevel, content),
      helpfulness: 0.5,
      tags: ['help', 'fallback', `level:${helpLevel}`],
      lastUpdated: new Date()
    };
  }

  /**
   * Simplify text for beginners
   * 
   * @param text - Original text to simplify
   * @returns Promise<string> - Simplified text or original on error
   */
  async simplifyText(text: string): Promise<string> {
    const startTime = Date.now();
    
    try {
      const prompt = `
        Simplify the following text to make it easier to understand for beginners. 
        Use simple words, shorter sentences, and clear explanations:
        
        "${text}"
        
        Simplified version:
      `;

      const cacheKey = this.getCacheKey('simplify', text);
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        logger.debug('Returning cached simplified text');
        return cached.content;
      }

      const response = await this.callAzureOpenAIWithRetry(prompt);
      this.setCache(cacheKey, response.content);
      
      const duration = Date.now() - startTime;
      logger.debug('Text simplified successfully', { durationMs: duration });
      
      return response.content;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to simplify text', {
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: duration
      });
      return text; // Return original text as fallback
    }
  }

  /**
   * Enhance text with technical details for advanced users
   * 
   * @param text - Original text to enhance
   * @returns Promise<string> - Enhanced text or original on error
   */
  async enhanceText(text: string): Promise<string> {
    const startTime = Date.now();
    
    try {
      const prompt = `
        Enhance the following text with more technical details and comprehensive explanations 
        for advanced users. Add relevant technical context and best practices:
        
        "${text}"
        
        Enhanced version:
      `;

      const cacheKey = this.getCacheKey('enhance', text);
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        logger.debug('Returning cached enhanced text');
        return cached.content;
      }

      const response = await this.callAzureOpenAIWithRetry(prompt);
      this.setCache(cacheKey, response.content);
      
      const duration = Date.now() - startTime;
      logger.debug('Text enhanced successfully', { durationMs: duration });
      
      return response.content;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to enhance text', {
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: duration
      });
      return text; // Return original text as fallback
    }
  }

  /**
   * Simplify language and vocabulary
   * 
   * @param text - Original text to simplify
   * @returns Promise<string> - Simplified text or original on error
   */
  async simplifyLanguage(text: string): Promise<string> {
    const startTime = Date.now();
    
    try {
      const prompt = `
        Rewrite the following text using simpler language and vocabulary. 
        Replace complex words with simpler alternatives while maintaining the meaning:
        
        "${text}"
        
        Simplified language version:
      `;

      const cacheKey = this.getCacheKey('simplify_lang', text);
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        logger.debug('Returning cached simplified language');
        return cached.content;
      }

      const response = await this.callAzureOpenAIWithRetry(prompt);
      this.setCache(cacheKey, response.content);
      
      const duration = Date.now() - startTime;
      logger.debug('Language simplified successfully', { durationMs: duration });
      
      return response.content;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to simplify language', {
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: duration
      });
      return text; // Return original text as fallback
    }
  }

  /**
   * Generate practical examples for onboarding context
   * 
   * @param context - Context including step, topic, and user level
   * @param count - Number of examples to generate (default: 3)
   * @returns Promise<any[]> - Array of examples or defaults on error
   */
  async generateExamples(context: any, count: number = 3): Promise<any[]> {
    const startTime = Date.now();
    
    try {
      const prompt = `
        Generate ${count} practical examples for the following context:
        Step: ${context.stepId || 'Unknown'}
        Topic: ${context.topic || 'General onboarding'}
        User Level: ${context.userLevel || 'Intermediate'}
        
        Each example should be:
        1. Practical and actionable
        2. Relevant to the current step
        3. Easy to understand
        
        Format as JSON array with objects containing 'title', 'description', and 'steps' fields.
      `;

      const cacheKey = this.getCacheKey('examples', JSON.stringify({ context, count }));
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        logger.debug('Returning cached examples');
        try {
          return JSON.parse(cached.content);
        } catch {
          // Cache corrupted, continue to generate new
        }
      }

      const response = await this.callAzureOpenAIWithRetry(prompt);
      
      try {
        const examples = JSON.parse(response.content);
        this.setCache(cacheKey, response.content);
        
        const duration = Date.now() - startTime;
        logger.debug('Examples generated successfully', { 
          count: examples.length, 
          durationMs: duration 
        });
        
        return examples;
      } catch (parseError) {
        logger.warn('Failed to parse AI examples response, returning default examples', {
          error: parseError instanceof Error ? parseError.message : 'Parse error'
        });
        return this.getDefaultExamples(count);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to generate examples', {
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: duration
      });
      return this.getDefaultExamples(count);
    }
  }

  /**
   * Generate visual aid suggestions
   * 
   * @param context - Context including step and topic
   * @returns Promise<any[]> - Array of visual aids or defaults on error
   */
  async generateVisualAids(context: any): Promise<any[]> {
    const startTime = Date.now();
    
    try {
      const prompt = `
        Suggest visual aids for the following onboarding context:
        Step: ${context.stepId || 'Unknown'}
        Topic: ${context.topic || 'General onboarding'}
        
        Suggest appropriate visual aids such as:
        - Screenshots with annotations
        - Diagrams or flowcharts
        - Highlighted UI elements
        - Video demonstrations
        
        Format as JSON array with objects containing 'type', 'description', and 'purpose' fields.
      `;

      const cacheKey = this.getCacheKey('visual_aids', JSON.stringify(context));
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        logger.debug('Returning cached visual aids');
        try {
          return JSON.parse(cached.content);
        } catch {
          // Cache corrupted, continue to generate new
        }
      }

      const response = await this.callAzureOpenAIWithRetry(prompt);
      
      try {
        const aids = JSON.parse(response.content);
        this.setCache(cacheKey, response.content);
        
        const duration = Date.now() - startTime;
        logger.debug('Visual aids generated successfully', { 
          count: aids.length, 
          durationMs: duration 
        });
        
        return aids;
      } catch (parseError) {
        logger.warn('Failed to parse AI visual aids response, returning default aids', {
          error: parseError instanceof Error ? parseError.message : 'Parse error'
        });
        return this.getDefaultVisualAids();
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to generate visual aids', {
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: duration
      });
      return this.getDefaultVisualAids();
    }
  }

  /**
   * Generate interactive element suggestions
   * 
   * @param context - Context including step and topic
   * @returns Promise<any[]> - Array of interactive elements or defaults on error
   */
  async generateInteractiveElements(context: any): Promise<any[]> {
    const startTime = Date.now();
    
    try {
      const prompt = `
        Suggest interactive elements for the following onboarding context:
        Step: ${context.stepId || 'Unknown'}
        Topic: ${context.topic || 'General onboarding'}
        
        Suggest interactive elements such as:
        - Guided tours with clickable hotspots
        - Interactive tutorials
        - Practice exercises
        - Quizzes or knowledge checks
        
        Format as JSON array with objects containing 'type', 'description', 'interaction', and 'outcome' fields.
      `;

      const cacheKey = this.getCacheKey('interactive', JSON.stringify(context));
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        logger.debug('Returning cached interactive elements');
        try {
          return JSON.parse(cached.content);
        } catch {
          // Cache corrupted, continue to generate new
        }
      }

      const response = await this.callAzureOpenAIWithRetry(prompt);
      
      try {
        const elements = JSON.parse(response.content);
        this.setCache(cacheKey, response.content);
        
        const duration = Date.now() - startTime;
        logger.debug('Interactive elements generated successfully', { 
          count: elements.length, 
          durationMs: duration 
        });
        
        return elements;
      } catch (parseError) {
        logger.warn('Failed to parse AI interactive elements response, returning default elements', {
          error: parseError instanceof Error ? parseError.message : 'Parse error'
        });
        return this.getDefaultInteractiveElements();
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to generate interactive elements', {
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: duration
      });
      return this.getDefaultInteractiveElements();
    }
  }

  private buildHelpPrompt(context: HelpContext, userState: any): string {
    return `
      Generate contextual help content for a user onboarding system with the following context:
      
      Current Step: ${context.currentStep}
      User Action: ${context.userAction || 'Unknown'}
      Difficulty Level: ${context.difficulty || 'Medium'}
      User Technical Level: ${userState.technicalProficiency || 'Intermediate'}
      User Learning Style: ${userState.learningStyle || 'Mixed'}
      
      The help should be:
      1. Contextually relevant to the current step
      2. Appropriate for the user's technical level
      3. Clear and actionable
      4. Encouraging and supportive
      5. Concise but comprehensive
      
      Generate help content that includes:
      - A clear explanation of what the user needs to do
      - Step-by-step instructions if needed
      - Tips for success
      - What to expect next
      
      Keep the tone friendly and supportive. Avoid technical jargon unless the user is advanced.
    `;
  }

  private determineHelpLevel(context: HelpContext, userState: any): HelpLevel {
    if (context.difficulty === 'high' || userState.technicalProficiency === 'beginner') {
      return 'detailed';
    } else if (context.difficulty === 'low' || userState.technicalProficiency === 'advanced') {
      return 'brief';
    } else {
      return 'standard';
    }
  }

  /**
   * Call Azure OpenAI API with retry logic
   * 
   * @param prompt - The prompt to send to the API
   * @returns Promise with content and confidence score
   */
  private async callAzureOpenAIWithRetry(prompt: string): Promise<{ content: string; confidence?: number }> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.calculateBackoffDelay(attempt);
          logger.debug(`Retrying Azure OpenAI call (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}) after ${delay}ms`);
          await this.sleep(delay);
        }

        return await this.callAzureOpenAI(prompt);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on authentication errors (401, 403)
        if (this.isNonRetryableError(error)) {
          logger.error('Non-retryable error, aborting', { error: lastError.message });
          throw lastError;
        }

        logger.warn(`Azure OpenAI call failed (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1})`, {
          error: lastError.message,
          willRetry: attempt < this.retryConfig.maxRetries
        });
      }
    }

    throw lastError || new Error('Azure OpenAI call failed after retries');
  }

  /**
   * Make the actual API call to Azure OpenAI
   */
  private async callAzureOpenAI(prompt: string): Promise<{ content: string; confidence?: number }> {
    const startTime = Date.now();
    const url = `${this.config.endpoint}/openai/deployments/${this.config.deploymentName}/chat/completions?api-version=${this.config.apiVersion}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config.apiKey,
          'User-Agent': 'Huntaze-SmartOnboarding/1.0'
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant specialized in creating user onboarding help content. Provide clear, actionable, and supportive guidance.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
          top_p: 0.9,
          frequency_penalty: 0.0,
          presence_penalty: 0.0
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const duration = Date.now() - startTime;

      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'Unable to read error body');
        logger.error('Azure OpenAI API error', {
          status: response.status,
          statusText: response.statusText,
          body: errorBody,
          durationMs: duration
        });
        
        throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data: AzureOpenAIResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from Azure OpenAI');
      }

      logger.debug('Azure OpenAI API call successful', {
        durationMs: duration,
        tokensUsed: data.usage?.total_tokens,
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens
      });

      return {
        content: data.choices[0].message.content.trim(),
        confidence: 0.8 // Default confidence score
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error instanceof Error && error.name === 'AbortError') {
        logger.error('Azure OpenAI API call timed out', { durationMs: duration });
        throw new Error('Azure OpenAI API call timed out after 30 seconds');
      }

      logger.error('Azure OpenAI API call failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: duration
      });
      
      throw error;
    }
  }

  /**
   * Check if error is non-retryable (auth errors, etc.)
   */
  private isNonRetryableError(error: any): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return message.includes('401') || 
             message.includes('403') || 
             message.includes('unauthorized') ||
             message.includes('forbidden');
    }
    return false;
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(attempt: number): number {
    const delay = Math.min(
      this.retryConfig.initialDelayMs * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
      this.retryConfig.maxDelayMs
    );
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cache management: Get from cache
   */
  private getFromCache(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  /**
   * Cache management: Set cache
   */
  private setCache(key: string, content: string, confidence?: number): void {
    this.cache.set(key, {
      content,
      confidence,
      timestamp: Date.now()
    });

    // Cleanup old cache entries (simple LRU)
    if (this.cache.size > 100) {
      const iter = this.cache.keys().next();
      if (!iter.done && iter.value) {
        this.cache.delete(iter.value as string);
      }
    }
  }

  /**
   * Generate cache key from operation and prompt
   */
  private getCacheKey(operation: string, prompt: string): string {
    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `${operation}_${hash}`;
  }

  private mapDifficulty(d?: HelpContext['difficulty']): HelpContent['difficulty'] {
    switch (d) {
      case 'low':
        return 'beginner';
      case 'high':
        return 'advanced';
      default:
        return 'intermediate';
    }
  }

  private estimateReadingTime(level: HelpLevel, text: string): number {
    // Rough estimate in minutes based on level and text length
    const base = Math.max(1, Math.ceil(text.length / 600));
    if (level === 'brief') return Math.max(1, base);
    if (level === 'detailed') return base + 2;
    return base + 1;
  }

  private buildTitle(context: HelpContext): string {
    if (context.userAction) return `Help: ${context.userAction}`;
    if (context.topic) return `Help on ${context.topic}`;
    return `Help for step ${context.currentStep}`;
  }

  /**
   * Deduplicate concurrent requests with same cache key
   */
  private async deduplicateRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // Check if request is already in flight
    const existingRequest = this.requestQueue.get(key);
    if (existingRequest) {
      logger.debug('Deduplicating concurrent request', { key });
      return existingRequest;
    }

    // Start new request
    const promise = fn().finally(() => {
      this.requestQueue.delete(key);
    });

    this.requestQueue.set(key, promise);
    return promise;
  }

  private getDefaultExamples(count: number): any[] {
    const examples = [
      {
        title: 'Connect Your First Platform',
        description: 'Learn how to connect your social media account',
        steps: ['Click on Connect Platform', 'Choose your platform', 'Authorize the connection']
      },
      {
        title: 'Create Your First Post',
        description: 'Create and schedule your first social media post',
        steps: ['Go to Content Creator', 'Add your content', 'Schedule or publish']
      },
      {
        title: 'Set Up Analytics',
        description: 'Configure analytics to track your performance',
        steps: ['Navigate to Analytics', 'Connect your accounts', 'Review your dashboard']
      }
    ];

    return examples.slice(0, count);
  }

  private getDefaultVisualAids(): any[] {
    return [
      {
        type: 'screenshot',
        description: 'Annotated screenshot showing the key interface elements',
        purpose: 'Help users identify where to click'
      },
      {
        type: 'highlight',
        description: 'Highlighted UI elements with pulsing animation',
        purpose: 'Draw attention to important buttons or areas'
      },
      {
        type: 'arrow',
        description: 'Directional arrows pointing to next actions',
        purpose: 'Guide user attention to the correct sequence'
      }
    ];
  }

  private getDefaultInteractiveElements(): any[] {
    return [
      {
        type: 'guided_tour',
        description: 'Interactive tour with clickable hotspots',
        interaction: 'Click to advance through key features',
        outcome: 'User learns interface layout and key functions'
      },
      {
        type: 'practice_exercise',
        description: 'Hands-on exercise in a safe environment',
        interaction: 'Complete real tasks with guidance',
        outcome: 'User gains confidence through practice'
      },
      {
        type: 'knowledge_check',
        description: 'Quick quiz to verify understanding',
        interaction: 'Answer questions about key concepts',
        outcome: 'Reinforces learning and identifies gaps'
      }
    ];
  }

  /**
   * Clear the cache (useful for testing or memory management)
   */
  public clearCache(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.info('Cache cleared', { entriesRemoved: size });
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; ttl: number } {
    return {
      size: this.cache.size,
      ttl: this.cacheTTL
    };
  }

  /**
   * Health check for the service
   */
  public async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    try {
      // Validate configuration
      if (!this.config.apiKey || !this.config.endpoint) {
        return {
          healthy: false,
          message: 'Missing Azure OpenAI configuration'
        };
      }

      // Test API connectivity with a simple prompt
      const testPrompt = 'Say "OK" if you can read this.';
      await this.callAzureOpenAI(testPrompt);

      return {
        healthy: true,
        message: 'Azure OpenAI service is operational'
      };
    } catch (error) {
      logger.error('Health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Health check failed'
      };
    }
  }
}

/**
 * Export singleton instance
 */
export const aiHelpGenerator = new AIHelpGeneratorImpl();
