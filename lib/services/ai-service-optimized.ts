/**
 * Optimized AI Service with Intelligent Routing
 * 
 * Features:
 * - Automatic model selection (mini vs full)
 * - Prompt caching for 90% cost reduction
 * - Streaming support for better UX
 * - Fallback handling
 * - Usage tracking
 */

import { routeAIRequest, buildCachedPrompt, type TaskType, type RouteRequest } from './ai-router';

export interface AIRequest {
  taskType: TaskType;
  prompt: string;
  context?: Record<string, any>;
  options?: {
    stream?: boolean;
    maxTokens?: number;
    temperature?: number;
    forceModel?: 'gpt-4o' | 'gpt-4o-mini';
  };
}

export interface AIResponse {
  content: string;
  model: string;
  tokensUsed: {
    input: number;
    output: number;
    cached: number;
  };
  latencyMs: number;
  cost: number;
}

// Static system instructions (cached)
const HUNTAZE_SYSTEM_PROMPT = `Tu es l'assistant IA de Huntaze, plateforme SaaS pour créateurs OnlyFans.

Ton rôle est de:
- Aider les créateurs à optimiser leur contenu et engagement
- Fournir des insights basés sur les données analytics
- Générer du contenu marketing personnalisé
- Modérer et classifier le contenu selon les guidelines
- Assister dans la planification stratégique

Guidelines:
- Toujours respecter la confidentialité des créateurs
- Fournir des réponses concises et actionnables
- Utiliser un ton professionnel mais accessible
- Citer les métriques quand disponibles
- Suggérer des actions concrètes

Compliance:
- Respecter les règles OnlyFans et légales
- Signaler tout contenu problématique
- Protéger les données personnelles`;

/**
 * Main AI service with intelligent routing
 */
export class OptimizedAIService {
  private usageStats = {
    miniRequests: 0,
    fullRequests: 0,
    totalTokens: 0,
    cachedTokens: 0,
    totalCost: 0,
  };

  /**
   * Process AI request with automatic model selection
   */
  async processRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    // Determine optimal model
    const routingDecision = this.selectModel(request);
    const model = request.options?.forceModel || routingDecision.model;

    // Build optimized prompt with caching
    const { system, user } = buildCachedPrompt({
      systemInstructions: HUNTAZE_SYSTEM_PROMPT,
      userData: JSON.stringify(request.context || {}),
      userQuery: request.prompt,
    });

    // Make API call (placeholder - integrate with actual AI service)
    const response = await this.callAI({
      model,
      system,
      user,
      stream: request.options?.stream || false,
      maxTokens: request.options?.maxTokens || 1000,
      temperature: request.options?.temperature || 0.7,
    });

    // Update stats
    this.updateStats(model, response.tokensUsed);

    return {
      ...response,
      latencyMs: Date.now() - startTime,
    };
  }

  /**
   * Select optimal model based on task characteristics
   */
  private selectModel(request: AIRequest): ReturnType<typeof routeAIRequest> {
    // Estimate complexity
    const complexityScore = this.estimateComplexity(request);

    // Determine if critical
    const isCritical = ['compliance', 'legal'].includes(request.taskType);

    // Determine output length
    const outputLength = request.options?.maxTokens
      ? request.options.maxTokens > 500
        ? 'long'
        : request.options.maxTokens > 100
        ? 'medium'
        : 'short'
      : 'medium';

    const routeRequest: RouteRequest = {
      taskType: request.taskType,
      complexityScore,
      isCritical,
      outputLength,
      requiresReasoning: ['strategy', 'advanced_analytics', 'code'].includes(request.taskType),
    };

    return routeAIRequest(routeRequest);
  }

  /**
   * Estimate complexity from request
   */
  private estimateComplexity(request: AIRequest): number {
    let score = 0;

    // Prompt length
    if (request.prompt.length > 1000) score += 3;
    else if (request.prompt.length > 500) score += 2;
    else if (request.prompt.length > 200) score += 1;

    // Context complexity
    if (request.context && Object.keys(request.context).length > 5) score += 2;

    // Task type base complexity
    const complexTasks: TaskType[] = ['strategy', 'advanced_analytics', 'code', 'compliance'];
    if (complexTasks.includes(request.taskType)) score += 3;

    return Math.min(score, 10);
  }

  /**
   * Call AI API with fallback handling
   */
  private async callAI(params: {
    model: string;
    system: string;
    user: string;
    stream: boolean;
    maxTokens: number;
    temperature: number;
  }): Promise<AIResponse> {
    try {
      // Primary call
      return await this.makeAPICall(params);
    } catch (error) {
      // Fallback to mini if full model fails
      if (params.model === 'gpt-4o') {
        console.warn('GPT-4o failed, falling back to gpt-4o-mini', error);
        return await this.makeAPICall({ ...params, model: 'gpt-4o-mini' });
      }
      throw error;
    }
  }

  /**
   * Make actual API call (integrate with your AI provider)
   */
  private async makeAPICall(params: {
    model: string;
    system: string;
    user: string;
    stream: boolean;
    maxTokens: number;
    temperature: number;
  }): Promise<AIResponse> {
    // TODO: Integrate with actual AI service (Azure OpenAI, OpenAI, etc.)
    // This is a placeholder implementation

    const inputTokens = Math.ceil((params.system.length + params.user.length) / 4);
    const outputTokens = Math.ceil(params.maxTokens * 0.7); // Estimate
    const cachedTokens = Math.ceil(params.system.length / 4); // System prompt cached

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      content: `[AI Response for ${params.model}]`,
      model: params.model,
      tokensUsed: {
        input: inputTokens,
        output: outputTokens,
        cached: cachedTokens,
      },
      latencyMs: 0,
      cost: this.calculateCost(params.model, inputTokens, outputTokens, cachedTokens),
    };
  }

  /**
   * Calculate request cost
   */
  private calculateCost(
    model: string,
    inputTokens: number,
    outputTokens: number,
    cachedTokens: number
  ): number {
    const prices = {
      'gpt-4o': { input: 2.5, output: 10.0, cached: 0.25 },
      'gpt-4o-mini': { input: 0.15, output: 0.6, cached: 0.015 },
    };

    const price = prices[model as keyof typeof prices] || prices['gpt-4o-mini'];

    const inputCost = ((inputTokens - cachedTokens) * price.input) / 1_000_000;
    const cachedCost = (cachedTokens * price.cached) / 1_000_000;
    const outputCost = (outputTokens * price.output) / 1_000_000;

    return inputCost + cachedCost + outputCost;
  }

  /**
   * Update usage statistics
   */
  private updateStats(model: string, tokensUsed: AIResponse['tokensUsed']): void {
    if (model === 'gpt-4o-mini') {
      this.usageStats.miniRequests++;
    } else {
      this.usageStats.fullRequests++;
    }

    this.usageStats.totalTokens += tokensUsed.input + tokensUsed.output;
    this.usageStats.cachedTokens += tokensUsed.cached;
  }

  /**
   * Get usage statistics
   */
  getStats() {
    const totalRequests = this.usageStats.miniRequests + this.usageStats.fullRequests;
    const miniPercentage = totalRequests > 0 
      ? (this.usageStats.miniRequests / totalRequests) * 100 
      : 0;

    return {
      ...this.usageStats,
      totalRequests,
      miniPercentage: Math.round(miniPercentage * 10) / 10,
      cacheHitRate:
        this.usageStats.totalTokens > 0
          ? Math.round((this.usageStats.cachedTokens / this.usageStats.totalTokens) * 1000) / 10
          : 0,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.usageStats = {
      miniRequests: 0,
      fullRequests: 0,
      totalTokens: 0,
      cachedTokens: 0,
      totalCost: 0,
    };
  }
}

// Export singleton instance
export const aiService = new OptimizedAIService();
