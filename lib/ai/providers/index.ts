import type OpenAI from 'openai';
import { getAzureOpenAI, getDefaultAzureDeployment } from '../azure-openai';

export interface AIResponse {
  content: string;
  model: string;
  cost: number;
  confidence: number;
  cached: boolean;
  patternId?: string;
}

export interface GenerateOptions {
  fanId?: string;
  fanTier?: 'whale' | 'vip' | 'regular' | 'new';
  message: string;
  conversationHistory?: any[];
  tone?: 'flirty' | 'sweet' | 'dominant' | 'playful' | 'professional';
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  useCase?: 'chat' | 'content' | 'analysis' | 'strategy';
}

export class AIProvider {
  private openai: OpenAI | null = null;
  private readonly useAzure: boolean;
  private readonly defaultModel: string;
  private modelCosts = {
    'gpt-4o': { input: 0.005, output: 0.015 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    'cached': { input: 0, output: 0 }
  };

  constructor() {
    // Do NOT initialize Azure client at import time to avoid 502s when unconfigured.
    this.useAzure = true;
    this.defaultModel = process.env.AZURE_OPENAI_CHAT_DEPLOYMENT || getDefaultAzureDeployment();
  }

  async generateResponse(options: GenerateOptions): Promise<AIResponse> {
    const {
      message,
      conversationHistory = [],
      tone = 'professional',
      maxTokens = 150,
      temperature = 0.7,
      systemPrompt,
      useCase = 'chat'
    } = options;

    try {
      const model = this.selectModel(options.fanTier || 'regular', useCase);
      const messages = this.buildMessages(
        systemPrompt || this.getSystemPrompt(useCase, tone),
        conversationHistory,
        message
      );

      const openai = await this.getClient();
      const completion = await openai.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        presence_penalty: 0.6,
        frequency_penalty: 0.3
      });

      const response = completion.choices[0]?.message?.content || '';
      const usage = completion.usage;
      
      // Calculate cost
      const cost = this.calculateCost(model, usage);

      return {
        content: response,
        model,
        cost,
        confidence: 0.9,
        cached: false
      };
    } catch (error) {
      console.error('AI generation error:', error);
      throw error;
    }
  }

  private async getClient(): Promise<OpenAI> {
    if (this.openai) return this.openai;
    // Lazy initialize. If Azure is not configured, surface a controlled error
    // which callers can catch and handle as "unconfigured" without crashing routes.
    try {
      const client = await getAzureOpenAI();
      this.openai = client as unknown as OpenAI;
      return this.openai;
    } catch (err: any) {
      const reason = err?.message || 'Azure OpenAI not configured';
      throw new Error(`AI client unavailable: ${reason}`);
    }
  }

  async generateMultipleSuggestions(
    options: GenerateOptions,
    count = 3
  ): Promise<AIResponse[]> {
    const promises = Array(count).fill(null).map(() => 
      this.generateResponse({
        ...options,
        temperature: 0.9 // Higher temperature for variety
      })
    );

    const responses = await Promise.all(promises);
    return this.filterSimilarResponses(responses);
  }

  private selectModel(fanTier: string, useCase: string): string {
    // For Azure, use deployment names
    if (this.useAzure) {
      return this.defaultModel;
    }

    // For OpenAI, select based on use case and tier
    if (useCase === 'analysis' || useCase === 'strategy') {
      return 'gpt-4-turbo';
    }

    switch (fanTier) {
      case 'whale':
        return 'gpt-4-turbo';
      case 'vip':
        return 'gpt-4';
      default:
        return 'gpt-3.5-turbo';
    }
  }

  private getSystemPrompt(useCase: string, tone: string): string {
    const prompts = {
      chat: `You are Huntaze AI, a helpful and engaging assistant for content creators. 
             Your tone should be ${tone}. Be concise and helpful.`,
      content: `You are a creative content strategist helping creators optimize their content. 
                Focus on engagement, creativity, and platform best practices.`,
      analysis: `You are a data analyst providing insights and recommendations based on metrics. 
                 Be precise, data-driven, and actionable in your analysis.`,
      strategy: `You are a growth strategist helping creators scale their business. 
                 Provide strategic insights, growth tactics, and revenue optimization advice.`
    };

    return prompts[useCase as keyof typeof prompts] || prompts.chat;
  }

  private buildMessages(
    systemPrompt: string,
    history: any[],
    currentMessage: string
  ): any[] {
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add recent conversation history (last 5 messages)
    const recentHistory = history.slice(-5);
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });

    // Add current message
    messages.push({
      role: 'user',
      content: currentMessage
    });

    return messages;
  }

  private calculateCost(model: string, usage: any): number {
    if (!usage) return 0;

    const costs = this.modelCosts[model as keyof typeof this.modelCosts] || this.modelCosts['gpt-3.5-turbo'];
    
    const inputCost = (usage.prompt_tokens / 1000) * costs.input;
    const outputCost = (usage.completion_tokens / 1000) * costs.output;

    return Number((inputCost + outputCost).toFixed(4));
  }

  private filterSimilarResponses(responses: AIResponse[]): AIResponse[] {
    const unique: AIResponse[] = [];
    const seen = new Set<string>();

    for (const response of responses) {
      const key = response.content.toLowerCase().substring(0, 50);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(response);
      }
    }

    return unique;
  }

  // Health check method
  async healthCheck(): Promise<{ status: string; provider: string; model?: string }> {
    try {
      // Try a lightweight client initialization instead of a generation to avoid costs.
      await this.getClient();
      return {
        status: 'healthy',
        provider: process.env.AZURE_OPENAI_ENDPOINT ? 'Azure OpenAI' : 'OpenAI',
        model: this.defaultModel,
      };
    } catch (error) {
      // If Azure is not configured, report unconfigured rather than unhealthy.
      const msg = (error as any)?.message || '';
      const unconfigured = msg.includes('not configured') || msg.includes('Missing configuration');
      return {
        status: unconfigured ? 'unconfigured' : 'unhealthy',
        provider: process.env.AZURE_OPENAI_ENDPOINT ? 'Azure OpenAI' : 'unknown',
        model: undefined,
      };
    }
  }
}

// Export singleton instance
export const aiProvider = new AIProvider();
