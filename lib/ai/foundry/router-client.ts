/**
 * RouterClient - TypeScript client for the Python AI Router
 * 
 * Connects TypeScript agents to the Azure AI Foundry router service.
 * Supports AWS deployment endpoints (ECS, Lambda, API Gateway).
 * 
 * Requirements: 4.1, 4.2, 4.4, 4.5, 8.1, 8.2, 8.3, 8.4, 10.1, 10.2, 10.3
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface RouterClientConfig {
  /** Base URL of the AI Router service (AWS ECS, Lambda, or API Gateway) */
  baseUrl: string;
  /** Request timeout in milliseconds (default: 60000) */
  timeout?: number;
}

export interface RouterRequest {
  /** The prompt to send to the model */
  prompt: string;
  /** Client tier for model selection: 'standard' or 'vip' */
  client_tier: 'standard' | 'vip';
  /** Optional type hint to override classifier: 'math', 'coding', 'creative', 'chat' */
  type_hint?: 'math' | 'coding' | 'creative' | 'chat';
  /** Optional language hint to override detection: 'fr', 'en', 'other' */
  language_hint?: 'fr' | 'en' | 'other';
}

export interface RouterRouting {
  type: string;
  complexity: string;
  language: string;
  client_tier: string;
}

export interface RouterUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface RouterResponse {
  /** Model name used (e.g., "Llama-3.3-70B") */
  model: string;
  /** Deployment name (e.g., "llama33-70b-us") */
  deployment: string;
  /** Azure region (e.g., "eastus2") */
  region: string;
  /** Routing decision details */
  routing: RouterRouting;
  /** Model generated text output */
  output: string;
  /** Token usage statistics (optional) */
  usage?: RouterUsage;
}

export interface HealthCheckResponse {
  status: string;
  region: string;
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        await this.handleHttpError(response, endpoint);
      }

      // Parse response
      const data = await response.json();
      return this.parseResponse(data);
    } catch (error) {
      clearTimeout(timeoutId);
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      // Try streaming endpoint first
      let response = await fetch(streamEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      // Fallback to standard endpoint if streaming not available
      if (response.status === 404) {
        response = await fetch(fallbackEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          await this.handleHttpError(response, fallbackEndpoint);
        }

        const data = await response.json();
        const parsed = this.parseResponse(data);
        yield parsed.output;
        return;
      }

      clearTimeout(timeoutId);

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
      clearTimeout(timeoutId);
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout for health check

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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
      clearTimeout(timeoutId);
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

    if (
      request.type_hint !== undefined &&
      (request.type_hint === '' || !['math', 'coding', 'creative', 'chat'].includes(request.type_hint))
    ) {
      throw new RouterError(
        'type_hint must be one of: math, coding, creative, chat',
        RouterErrorCode.VALIDATION_ERROR
      );
    }

    if (
      request.language_hint !== undefined &&
      (request.language_hint === '' || !['fr', 'en', 'other'].includes(request.language_hint))
    ) {
      throw new RouterError(
        'language_hint must be one of: fr, en, other',
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
    };
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
