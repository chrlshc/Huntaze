/**
 * Azure OpenAI Type Definitions
 */

export interface GenerationOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  responseFormat?: { type: 'text' | 'json_object' };
  user?: string;
}

export interface GenerationResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
  model: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | MultimodalPart[];
}

export interface MultimodalPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
    detail?: 'low' | 'high' | 'auto';
  };
}

export interface StreamChunk {
  content: string;
  finishReason?: string;
}

export enum AzureOpenAIErrorCode {
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  QUOTA_EXCEEDED = 'quota_exceeded',
  CONTENT_FILTER = 'content_filter',
  INVALID_REQUEST = 'invalid_request',
  AUTHENTICATION_ERROR = 'authentication_error',
  DEPLOYMENT_NOT_FOUND = 'deployment_not_found',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown',
}

export class AzureOpenAIError extends Error {
  constructor(
    message: string,
    public code: AzureOpenAIErrorCode,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AzureOpenAIError';
  }
}
