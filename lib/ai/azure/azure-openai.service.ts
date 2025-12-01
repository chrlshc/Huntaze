/**
 * Azure OpenAI Service
 * Main service for interacting with Azure OpenAI Service
 */

import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
import { DefaultAzureCredential } from '@azure/identity';
import { AZURE_OPENAI_CONFIG, type AzureDeployment } from './azure-openai.config';
import type {
  GenerationOptions,
  GenerationResponse,
  ChatMessage,
  MultimodalPart,
  StreamChunk,
  AzureOpenAIErrorCode,
} from './azure-openai.types';
import { AzureOpenAIError } from './azure-openai.types';

export class AzureOpenAIService {
  private client: OpenAIClient;
  private currentDeployment: string;
  private endpoint: string;

  constructor(deployment?: AzureDeployment) {
    this.endpoint = AZURE_OPENAI_CONFIG.endpoint;
    
    // Initialize client with Managed Identity or API Key
    if (AZURE_OPENAI_CONFIG.useManagedIdentity) {
      // Production: Use Managed Identity for passwordless authentication
      this.client = new OpenAIClient(
        this.endpoint,
        new DefaultAzureCredential()
      );
    } else {
      // Development: Use API Key
      if (!AZURE_OPENAI_CONFIG.apiKey) {
        throw new Error('AZURE_OPENAI_API_KEY is required when not using Managed Identity');
      }
      this.client = new OpenAIClient(
        this.endpoint,
        new AzureKeyCredential(AZURE_OPENAI_CONFIG.apiKey)
      );
    }

    this.currentDeployment = deployment || AZURE_OPENAI_CONFIG.deployments.premium;
  }

  /**
   * Generate text from a prompt
   */
  async generateText(
    prompt: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResponse> {
    return this.chat([{ role: 'user', content: prompt }], options);
  }

  /**
   * Chat with conversational messages
   */
  async chat(
    messages: ChatMessage[],
    options: GenerationOptions = {}
  ): Promise<GenerationResponse> {
    try {
      const result = await this.client.getChatCompletions(
        this.currentDeployment,
        messages.map(msg => ({
          role: msg.role,
          content: this.formatContent(msg.content),
        })),
        {
          temperature: options.temperature,
          maxTokens: options.maxTokens,
          topP: options.topP,
          frequencyPenalty: options.frequencyPenalty,
          presencePenalty: options.presencePenalty,
          stop: options.stop,
          responseFormat: options.responseFormat,
          user: options.user,
        }
      );

      return this.parseResponse(result);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generate text with streaming
   */
  async *generateTextStream(
    prompt: string,
    options: GenerationOptions = {}
  ): AsyncGenerator<StreamChunk> {
    yield* this.chatStream([{ role: 'user', content: prompt }], options);
  }

  /**
   * Chat with streaming responses
   */
  async *chatStream(
    messages: ChatMessage[],
    options: GenerationOptions = {}
  ): AsyncGenerator<StreamChunk> {
    try {
      const stream = await this.client.streamChatCompletions(
        this.currentDeployment,
        messages.map(msg => ({
          role: msg.role,
          content: this.formatContent(msg.content),
        })),
        {
          temperature: options.temperature,
          maxTokens: options.maxTokens,
          topP: options.topP,
          frequencyPenalty: options.frequencyPenalty,
          presencePenalty: options.presencePenalty,
          stop: options.stop,
          responseFormat: options.responseFormat,
          user: options.user,
        }
      );

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        const finishReason = chunk.choices[0]?.finishReason;
        
        if (content) {
          yield { content, finishReason: finishReason || undefined };
        }
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generate from multimodal input (text + images)
   */
  async generateFromMultimodal(
    parts: MultimodalPart[],
    options: GenerationOptions = {}
  ): Promise<GenerationResponse> {
    // Switch to vision deployment for multimodal
    const originalDeployment = this.currentDeployment;
    this.currentDeployment = AZURE_OPENAI_CONFIG.deployments.vision;

    try {
      const result = await this.chat(
        [{ role: 'user', content: parts }],
        options
      );
      return result;
    } finally {
      this.currentDeployment = originalDeployment;
    }
  }

  /**
   * Count tokens in content
   */
  async countTokens(content: string | MultimodalPart[]): Promise<number> {
    // Simplified token counting - in production, use tiktoken or Azure's API
    const text = typeof content === 'string' 
      ? content 
      : content.filter(p => p.type === 'text').map(p => p.text).join(' ');
    
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Set the current deployment
   */
  setDeployment(deployment: AzureDeployment): void {
    this.currentDeployment = deployment;
  }

  /**
   * Get available deployments
   */
  getAvailableDeployments(): string[] {
    return Object.values(AZURE_OPENAI_CONFIG.deployments);
  }

  /**
   * Get current deployment
   */
  getCurrentDeployment(): string {
    return this.currentDeployment;
  }

  /**
   * Format content for Azure OpenAI API
   */
  private formatContent(content: string | MultimodalPart[]): any {
    if (typeof content === 'string') {
      return content;
    }

    return content.map(part => {
      if (part.type === 'text') {
        return { type: 'text', text: part.text };
      } else {
        return {
          type: 'image_url',
          image_url: {
            url: part.image_url!.url,
            detail: part.image_url!.detail || 'auto',
          },
        };
      }
    });
  }

  /**
   * Parse Azure OpenAI response
   */
  private parseResponse(result: any): GenerationResponse {
    const choice = result.choices[0];
    
    return {
      text: choice.message?.content || '',
      usage: {
        promptTokens: result.usage?.promptTokens || 0,
        completionTokens: result.usage?.completionTokens || 0,
        totalTokens: result.usage?.totalTokens || 0,
      },
      finishReason: choice.finishReason || 'stop',
      model: result.model || this.currentDeployment,
    };
  }

  /**
   * Handle and classify errors
   */
  private handleError(error: any): AzureOpenAIError {
    const message = error.message || 'Unknown error';
    const statusCode = error.statusCode || error.status;

    // Classify error type
    if (statusCode === 429) {
      return new AzureOpenAIError(
        'Rate limit exceeded',
        'rate_limit_exceeded' as AzureOpenAIErrorCode,
        429,
        true
      );
    }

    if (statusCode === 403 && message.includes('quota')) {
      return new AzureOpenAIError(
        'Quota exceeded',
        'quota_exceeded' as AzureOpenAIErrorCode,
        403,
        false
      );
    }

    if (statusCode === 400 && message.includes('content_filter')) {
      return new AzureOpenAIError(
        'Content filtered',
        'content_filter' as AzureOpenAIErrorCode,
        400,
        false
      );
    }

    if (statusCode === 401 || statusCode === 403) {
      return new AzureOpenAIError(
        'Authentication error',
        'authentication_error' as AzureOpenAIErrorCode,
        statusCode,
        false
      );
    }

    if (statusCode === 404) {
      return new AzureOpenAIError(
        'Deployment not found',
        'deployment_not_found' as AzureOpenAIErrorCode,
        404,
        false
      );
    }

    if (error.name === 'AbortError' || message.includes('timeout')) {
      return new AzureOpenAIError(
        'Request timeout',
        'timeout' as AzureOpenAIErrorCode,
        408,
        true
      );
    }

    // Unknown error
    return new AzureOpenAIError(
      message,
      'unknown' as AzureOpenAIErrorCode,
      statusCode,
      true
    );
  }
}
