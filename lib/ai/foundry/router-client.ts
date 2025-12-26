/**
 * RouterClient - TypeScript client for the Python AI Router
 * 
 * Connects TypeScript agents to the Azure AI Foundry router service.
 * Supports AWS deployment endpoints (ECS, Lambda, API Gateway).
 * Includes support for Azure services: Phi-4 Multimodal and Azure Speech Batch.
 * 
 * Requirements: 4.1, 4.2, 4.4, 4.5, 8.1, 8.2, 8.3, 8.4, 10.1, 10.2, 10.3
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

import { externalFetch, type ExternalRequestOptions } from '@/lib/services/external/http';
import { isExternalServiceError } from '@/lib/services/external/errors';

export interface RouterClientConfig {
  /** Base URL of the AI Router service (AWS ECS, Lambda, or API Gateway) */
  baseUrl: string;
  /** Request timeout in milliseconds (default: 60000) */
  timeout?: number;
}

export type TaskModality = 'text' | 'visual' | 'audio' | 'multimodal';
export type TaskType = 'math' | 'coding' | 'creative' | 'chat' | 'visual' | 'audio' | 'multimodal';

export interface RouterRequest {
  /** The prompt to send to the model */
  prompt: string;
  /** Client tier for model selection: 'standard' or 'vip' */
  client_tier: 'standard' | 'vip';
  /** Optional type hint to override classifier */
  type_hint?: TaskType;
  /** Optional language hint to override detection: 'fr', 'en', 'other' */
  language_hint?: 'fr' | 'en' | 'other';
  /** Content modality: text, visual, audio, or multimodal */
  modality?: TaskModality;
  /** Image URLs for visual/multimodal analysis */
  image_urls?: string[];
  /** Audio URL for transcription/multimodal analysis */
  audio_url?: string;
  /** Video URL for multimodal analysis */
  video_url?: string;
}

export interface MultimodalRequest {
  /** Analysis prompt/instructions */
  prompt: string;
  /** List of image URLs to analyze */
  image_urls?: string[];
  /** Video URL (will extract keyframes) */
  video_url?: string;
  /** Pre-transcribed audio text */
  audio_transcript?: string;
  /** Analysis type: ocr, facial, editing, timeline, viral, general */
  analysis_type: 'ocr' | 'facial' | 'editing' | 'timeline' | 'viral' | 'general';
  /** Client tier */
  client_tier: 'standard' | 'vip';
}

export interface AudioTranscriptionRequest {
  /** URL to audio file */
  audio_url: string;
  /** Audio language code (default: en-US) */
  language?: string;
  /** Enable speaker diarization */
  enable_diarization?: boolean;
  /** Include word-level timestamps */
  enable_word_timestamps?: boolean;
  /** Client tier */
  client_tier: 'standard' | 'vip';
}

export interface AudioTranscriptionResponse {
  /** Job ID for tracking */
  job_id: string;
  /** Status: pending, processing, completed, failed */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  /** Full transcript text */
  transcript?: string;
  /** Transcript segments with timestamps */
  segments?: Array<{
    text: string;
    start_time: number;
    end_time: number;
    speaker?: string;
  }>;
  /** Identified speakers */
  speakers?: Array<{
    id: string;
    name?: string;
  }>;
  /** Audio duration in seconds */
  duration_seconds?: number;
  /** Cost in USD */
  cost_usd?: number;
}

export interface RouterRouting {
  type: string;
  complexity: string;
  language: string;
  client_tier: string;
  modality?: string;
}

export interface RouterUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface RouterResponse {
  /** Model name used (e.g., "Llama-3.3-70B", "Phi-4-Multimodal") */
  model: string;
  /** Deployment name (e.g., "llama33-70b-us", "phi-4-multimodal-endpoint") */
  deployment: string;
  /** Azure region (e.g., "eastus2") */
  region: string;
  /** Routing decision details */
  routing: RouterRouting;
  /** Model generated text output */
  output: string;
  /** Token usage statistics (optional) */
  usage?: RouterUsage;
  /** Content modality used */
  modality?: string;
  /** Azure service used (e.g., 'phi-4-multimodal', 'speech-batch') */
  azure_service?: string;
}

export interface MultimodalResponse {
  /** Model used */
  model: string;
  /** Analysis results */
  analysis: {
    /** OCR extracted text */
    ocr_text?: string;
    /** Detected facial expressions */
    facial_expressions?: Array<{
      emotion: string;
      confidence: number;
      timestamp?: number;
    }>;
    /** Editing dynamics analysis */
    editing_dynamics?: {
      cuts_per_minute: number;
      pacing: 'slow' | 'medium' | 'fast';
      transitions: string[];
    };
    /** Timeline analysis for shorts */
    timeline?: Array<{
      timestamp: number;
      description: string;
      hook_score?: number;
    }>;
    /** Dense caption */
    dense_caption?: string;
    /** Viral potential score */
    viral_score?: number;
  };
  /** Token usage */
  usage?: RouterUsage;
}

export interface HealthCheckResponse {
  status: string;
  region: string;
  services?: {
    text_models: boolean;
    phi4_multimodal: boolean;
    azure_speech: boolean;
  };
}

// ============================================================================
// Error Handling
// ============================================================================

export enum RouterErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVICE_ERROR = 'SERVICE_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
}

export class RouterError extends Error {
  constructor(
    message: string,
    public readonly code: RouterErrorCode,
    public readonly statusCode?: number,
    public readonly endpoint?: string
  ) {
    super(message);
    this.name = 'RouterError';
    // Maintain proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RouterError);
    }
  }
}

// ============================================================================
// RouterClient Implementation
// ============================================================================

const DEFAULT_TIMEOUT = 60000; // 60 seconds

export class RouterClient {
  private readonly baseUrl: string;
  private readonly timeout: number;

  /**
   * Create a new RouterClient instance
   * @param baseUrl - Optional base URL, defaults to AI_ROUTER_URL env variable
   */
  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.AI_ROUTER_URL || '';
    this.timeout = DEFAULT_TIMEOUT;

    if (!this.baseUrl) {
      console.warn(
        '[RouterClient] No AI_ROUTER_URL configured. Set AI_ROUTER_URL environment variable.'
      );
    }
  }

  /**
   * Route a request to the AI Router
   * @param request - The routing request with prompt and tier
   * @returns Router response with model output and metadata
   * @throws RouterError on failure
   */
  async route(request: RouterRequest): Promise<RouterResponse> {
    // Validate request
    this.validateRequest(request);

    const endpoint = `${this.baseUrl}/route`;

    try {
      const response = await this.request(
        endpoint,
        {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        },
        this.timeout,
        'route',
        { maxRetries: 0, retryMethods: [] }
      );

      // Handle HTTP errors
      if (!response.ok) {
        await this.handleHttpError(response, endpoint);
      }

      // Parse response
      const data = await response.json();
      return this.parseResponse(data);
    } catch (error) {
      throw this.handleFetchError(error, endpoint);
    }
  }

  /**
   * Route a request with streaming response
   * @param request - The routing request
   * @yields Text chunks as they arrive
   * @throws RouterError on failure
   */
  async *routeStream(request: RouterRequest): AsyncGenerator<string> {
    // Validate request
    this.validateRequest(request);

    const streamEndpoint = `${this.baseUrl}/route/stream`;
    const fallbackEndpoint = `${this.baseUrl}/route`;

    try {
      // Try streaming endpoint first
      let response = await this.request(
        streamEndpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          body: JSON.stringify(request),
        },
        this.timeout,
        'route.stream',
        { maxRetries: 0, retryMethods: [] }
      );

      // Fallback to standard endpoint if streaming not available
      if (response.status === 404) {
        response = await this.request(
          fallbackEndpoint,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
          },
          this.timeout,
          'route',
          { maxRetries: 0, retryMethods: [] }
        );

        if (!response.ok) {
          await this.handleHttpError(response, fallbackEndpoint);
        }

        const data = await response.json();
        const parsed = this.parseResponse(data);
        yield parsed.output;
        return;
      }

      if (!response.ok) {
        await this.handleHttpError(response, streamEndpoint);
      }

      // Stream the response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new RouterError(
          'Response body is not readable',
          RouterErrorCode.PARSE_ERROR,
          undefined,
          streamEndpoint
        );
      }

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield decoder.decode(value, { stream: true });
      }
    } catch (error) {
      throw this.handleFetchError(error, streamEndpoint);
    }
  }

  /**
   * Check the health of the AI Router service
   * @returns Health status and region
   * @throws RouterError on failure
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    const endpoint = `${this.baseUrl}/health`;

    try {
      const response = await this.request(
        endpoint,
        { method: 'GET' },
        5_000,
        'health',
        { maxRetries: 1, retryMethods: ['GET'] }
      );

      if (!response.ok) {
        throw new RouterError(
          `Health check failed with status ${response.status}`,
          RouterErrorCode.SERVICE_ERROR,
          response.status,
          endpoint
        );
      }

      return await response.json();
    } catch (error) {
      throw this.handleFetchError(error, endpoint);
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Validate the router request
   */
  private validateRequest(request: RouterRequest): void {
    if (!request.prompt || typeof request.prompt !== 'string' || request.prompt.trim() === '') {
      throw new RouterError(
        'Request must contain a non-empty prompt string',
        RouterErrorCode.VALIDATION_ERROR
      );
    }

    if (!request.client_tier || !['standard', 'vip'].includes(request.client_tier)) {
      throw new RouterError(
        'Request must contain client_tier as "standard" or "vip"',
        RouterErrorCode.VALIDATION_ERROR
      );
    }

    const validTypes = ['math', 'coding', 'creative', 'chat', 'visual', 'audio', 'multimodal'];
    if (request.type_hint !== undefined && !validTypes.includes(request.type_hint)) {
      throw new RouterError(
        'type_hint must be one of: math, coding, creative, chat, visual, audio, multimodal',
        RouterErrorCode.VALIDATION_ERROR
      );
    }

    if (
      request.language_hint !== undefined &&
      !['fr', 'en', 'other'].includes(request.language_hint)
    ) {
      throw new RouterError(
        'language_hint must be one of: fr, en, other',
        RouterErrorCode.VALIDATION_ERROR
      );
    }

    const validModalities = ['text', 'visual', 'audio', 'multimodal'];
    if (request.modality !== undefined && !validModalities.includes(request.modality)) {
      throw new RouterError(
        'modality must be one of: text, visual, audio, multimodal',
        RouterErrorCode.VALIDATION_ERROR
      );
    }
  }

  /**
   * Handle HTTP error responses
   */
  private async handleHttpError(response: Response, endpoint: string): Promise<never> {
    let detail = '';
    try {
      const errorBody = await response.json();
      detail = errorBody.detail || errorBody.message || JSON.stringify(errorBody);
    } catch {
      detail = await response.text();
    }

    if (response.status === 400) {
      throw new RouterError(
        `Invalid request: ${detail}`,
        RouterErrorCode.VALIDATION_ERROR,
        400,
        endpoint
      );
    }

    if (response.status >= 500) {
      throw new RouterError(
        `Router service error, please retry: ${detail}`,
        RouterErrorCode.SERVICE_ERROR,
        response.status,
        endpoint
      );
    }

    throw new RouterError(
      `HTTP ${response.status}: ${detail}`,
      RouterErrorCode.SERVICE_ERROR,
      response.status,
      endpoint
    );
  }

  /**
   * Handle fetch errors (network, timeout, etc.)
   */
  private handleFetchError(error: unknown, endpoint: string): RouterError {
    if (error instanceof RouterError) {
      return error;
    }

    if (isExternalServiceError(error)) {
      if (error.code === 'TIMEOUT') {
        return new RouterError(
          `Request timed out after ${this.timeout / 1000}s`,
          RouterErrorCode.TIMEOUT_ERROR,
          error.status,
          endpoint
        );
      }

      if (error.code === 'NETWORK_ERROR') {
        return new RouterError(
          `Cannot reach router at ${endpoint}: ${error.message}`,
          RouterErrorCode.CONNECTION_ERROR,
          error.status,
          endpoint
        );
      }

      return new RouterError(
        error.message,
        RouterErrorCode.SERVICE_ERROR,
        error.status,
        endpoint
      );
    }

    if (error instanceof Error) {
      // Timeout error
      if (error.name === 'AbortError') {
        return new RouterError(
          `Request timed out after ${this.timeout / 1000}s`,
          RouterErrorCode.TIMEOUT_ERROR,
          undefined,
          endpoint
        );
      }

      // Connection error
      if (
        error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ENOTFOUND')
      ) {
        return new RouterError(
          `Cannot reach router at ${endpoint}: ${error.message}`,
          RouterErrorCode.CONNECTION_ERROR,
          undefined,
          endpoint
        );
      }

      return new RouterError(
        error.message,
        RouterErrorCode.SERVICE_ERROR,
        undefined,
        endpoint
      );
    }

    return new RouterError(
      'Unknown error occurred',
      RouterErrorCode.SERVICE_ERROR,
      undefined,
      endpoint
    );
  }

  /**
   * Shared external request helper
   */
  private async request(
    endpoint: string,
    options: RequestInit,
    timeoutMs: number,
    operation: string,
    retry?: ExternalRequestOptions['retry']
  ): Promise<Response> {
    return externalFetch(endpoint, {
      ...options,
      service: 'ai-router',
      operation,
      cache: 'no-store',
      timeoutMs,
      retry: retry ?? { maxRetries: 0, retryMethods: [] },
      throwOnHttpError: false,
    });
  }

  /**
   * Parse and validate the router response
   */
  private parseResponse(data: unknown): RouterResponse {
    if (!data || typeof data !== 'object') {
      throw new RouterError(
        'Invalid response format: expected object',
        RouterErrorCode.PARSE_ERROR
      );
    }

    const response = data as Record<string, unknown>;

    // Validate required fields
    if (typeof response.model !== 'string') {
      throw new RouterError(
        'Invalid response: missing or invalid model field',
        RouterErrorCode.PARSE_ERROR
      );
    }

    if (typeof response.output !== 'string') {
      throw new RouterError(
        'Invalid response: missing or invalid output field',
        RouterErrorCode.PARSE_ERROR
      );
    }

    return {
      model: response.model as string,
      deployment: (response.deployment as string) || 'unknown',
      region: (response.region as string) || 'unknown',
      routing: (response.routing as RouterRouting) || {
        type: 'unknown',
        complexity: 'unknown',
        language: 'unknown',
        client_tier: 'unknown',
      },
      output: response.output as string,
      usage: response.usage as RouterUsage | undefined,
      modality: response.modality as string | undefined,
      azure_service: response.azure_service as string | undefined,
    };
  }

  /**
   * Send a multimodal analysis request to Phi-4 Multimodal
   * @param request - The multimodal analysis request
   * @returns Multimodal analysis response
   * @throws RouterError on failure
   */
  async analyzeMultimodal(request: MultimodalRequest): Promise<MultimodalResponse> {
    const endpoint = `${this.baseUrl}/multimodal/analyze`;

    try {
      const response = await this.request(
        endpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        },
        this.timeout,
        'multimodal.analyze',
        { maxRetries: 0, retryMethods: [] }
      );

      if (!response.ok) {
        await this.handleHttpError(response, endpoint);
      }

      const data = await response.json();
      return data as MultimodalResponse;
    } catch (error) {
      throw this.handleFetchError(error, endpoint);
    }
  }

  /**
   * Submit an audio transcription job to Azure Speech Batch
   * @param request - The audio transcription request
   * @returns Transcription job response
   * @throws RouterError on failure
   */
  async submitAudioTranscription(request: AudioTranscriptionRequest): Promise<AudioTranscriptionResponse> {
    const endpoint = `${this.baseUrl}/audio/transcribe`;

    try {
      const response = await this.request(
        endpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audio_url: request.audio_url,
            language: request.language || 'en-US',
            enable_diarization: request.enable_diarization ?? true,
            enable_word_timestamps: request.enable_word_timestamps ?? true,
            client_tier: request.client_tier,
          }),
        },
        this.timeout,
        'audio.transcribe',
        { maxRetries: 0, retryMethods: [] }
      );

      if (!response.ok) {
        await this.handleHttpError(response, endpoint);
      }

      const data = await response.json();
      return data as AudioTranscriptionResponse;
    } catch (error) {
      throw this.handleFetchError(error, endpoint);
    }
  }

  /**
   * Get the status of an audio transcription job
   * @param jobId - The transcription job ID
   * @returns Transcription job status and results
   * @throws RouterError on failure
   */
  async getTranscriptionStatus(jobId: string): Promise<AudioTranscriptionResponse> {
    const endpoint = `${this.baseUrl}/audio/transcribe/${jobId}`;

    try {
      const response = await this.request(
        endpoint,
        { method: 'GET' },
        30_000,
        'audio.transcribe.status',
        { maxRetries: 1, retryMethods: ['GET'] }
      );

      if (!response.ok) {
        await this.handleHttpError(response, endpoint);
      }

      const data = await response.json();
      return data as AudioTranscriptionResponse;
    } catch (error) {
      throw this.handleFetchError(error, endpoint);
    }
  }

  /**
   * Route a content trends analysis request
   * Automatically selects the appropriate model based on task type and modality
   * @param request - Content trends analysis request
   * @returns Router response with analysis results
   */
  async routeContentTrends(request: {
    task_type: string;
    modality: TaskModality;
    prompt: string;
    image_urls?: string[];
    audio_url?: string;
    video_url?: string;
    client_tier: 'standard' | 'vip';
  }): Promise<RouterResponse> {
    // Determine the appropriate endpoint based on modality
    if (request.modality === 'audio' || request.task_type === 'audio_transcription') {
      // For audio, submit transcription job and return job info
      const transcriptionResponse = await this.submitAudioTranscription({
        audio_url: request.audio_url!,
        client_tier: request.client_tier,
      });
      
      return {
        model: 'Azure-Speech-Batch',
        deployment: 'huntaze-speech',
        region: 'eastus2',
        routing: {
          type: 'audio',
          complexity: 'simple',
          language: 'en',
          client_tier: request.client_tier,
          modality: 'audio',
        },
        output: JSON.stringify(transcriptionResponse),
        azure_service: 'speech-batch',
      };
    }

    if (request.modality === 'visual' || request.modality === 'multimodal') {
      // For visual/multimodal, use Phi-4 Multimodal
      const multimodalResponse = await this.analyzeMultimodal({
        prompt: request.prompt,
        image_urls: request.image_urls,
        video_url: request.video_url,
        analysis_type: this.mapTaskTypeToAnalysisType(request.task_type),
        client_tier: request.client_tier,
      });

      return {
        model: multimodalResponse.model,
        deployment: 'phi-4-multimodal-endpoint',
        region: 'eastus2',
        routing: {
          type: request.task_type,
          complexity: 'moderate',
          language: 'en',
          client_tier: request.client_tier,
          modality: request.modality,
        },
        output: JSON.stringify(multimodalResponse.analysis),
        usage: multimodalResponse.usage,
        azure_service: 'phi-4-multimodal',
      };
    }

    // For text tasks, use standard routing
    return this.route({
      prompt: request.prompt,
      client_tier: request.client_tier,
      type_hint: request.task_type as TaskType,
      modality: request.modality,
    });
  }

  /**
   * Map content trends task type to multimodal analysis type
   */
  private mapTaskTypeToAnalysisType(taskType: string): 'ocr' | 'facial' | 'editing' | 'timeline' | 'viral' | 'general' {
    const mapping: Record<string, 'ocr' | 'facial' | 'editing' | 'timeline' | 'viral' | 'general'> = {
      'ocr': 'ocr',
      'visual_analysis': 'general',
      'facial_analysis': 'facial',
      'editing_dynamics': 'editing',
      'timeline_analysis': 'timeline',
      'viral_analysis': 'viral',
      'hook_analysis': 'timeline',
    };
    return mapping[taskType] || 'general';
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

let routerClientInstance: RouterClient | null = null;

/**
 * Get the singleton RouterClient instance
 */
export function getRouterClient(): RouterClient {
  if (!routerClientInstance) {
    routerClientInstance = new RouterClient();
  }
  return routerClientInstance;
}

/**
 * Create a new RouterClient with custom configuration
 */
export function createRouterClient(baseUrl: string): RouterClient {
  return new RouterClient(baseUrl);
}
