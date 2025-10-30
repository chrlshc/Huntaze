/**
 * Advanced AI Router Features for Production
 * 
 * Implements production-grade features:
 * - Circuit breaker pattern
 * - Rate-limit aware backoff with jitter
 * - SSE streaming with usage tracking
 * - Structured outputs (JSON Schema)
 * - Idempotency support
 * - OpenTelemetry tracing
 */

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  windowSize: number;
}

export interface CircuitBreakerMetrics {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime?: number;
  totalRequests: number;
  rejectedRequests: number;
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private successes = 0;
  private lastFailureTime?: number;
  private nextAttemptTime?: number;
  private totalRequests = 0;
  private rejectedRequests = 0;

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    if (this.state === 'OPEN') {
      if (Date.now() < (this.nextAttemptTime || 0)) {
        this.rejectedRequests++;
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
      this.successes = 0;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    if (this.state === 'HALF_OPEN') {
      this.successes++;
      if (this.successes >= this.config.successThreshold) {
        this.state = 'CLOSED';
        this.successes = 0;
      }
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.config.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.config.timeout;
    }
  }

  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      totalRequests: this.totalRequests,
      rejectedRequests: this.rejectedRequests,
    };
  }

  reset(): void {
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = undefined;
    this.nextAttemptTime = undefined;
  }
}

export function computeRateLimitSleep(headers: Headers): number {
  const resetRequests = Number(headers.get('x-ratelimit-reset-requests') ?? 0);
  const resetTokens = Number(headers.get('x-ratelimit-reset-tokens') ?? 0);
  const baseDelaySeconds = Math.min(resetRequests, resetTokens) || 0.5;
  const baseDelayMs = baseDelaySeconds * 1000;
  const jitter = Math.floor(Math.random() * 250);
  return Math.min(baseDelayMs + jitter, 10_000);
}

export interface RateLimitInfo {
  limitRequests?: number;
  limitTokens?: number;
  remainingRequests?: number;
  remainingTokens?: number;
  resetRequests?: number;
  resetTokens?: number;
}

export function parseRateLimitHeaders(headers: Headers): RateLimitInfo {
  return {
    limitRequests: Number(headers.get('x-ratelimit-limit-requests')) || undefined,
    limitTokens: Number(headers.get('x-ratelimit-limit-tokens')) || undefined,
    remainingRequests: Number(headers.get('x-ratelimit-remaining-requests')) || undefined,
    remainingTokens: Number(headers.get('x-ratelimit-remaining-tokens')) || undefined,
    resetRequests: Number(headers.get('x-ratelimit-reset-requests')) || undefined,
    resetTokens: Number(headers.get('x-ratelimit-reset-tokens')) || undefined,
  };
}

export interface SSEEvent {
  type: 'event' | 'error';
  data: string;
  event?: string;
  id?: string;
}

export interface StreamingUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cachedTokens?: number;
}

export async function* parseSSEStream(
  stream: ReadableStream<Uint8Array> | null
): AsyncGenerator<SSEEvent> {
  if (!stream) return;

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          yield { type: 'event', data: line.slice(6) };
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function* streamCompletion(
  url: string,
  body: Record<string, unknown>,
  options: RequestInit = {}
): AsyncGenerator<
  | { type: 'content'; content: string; delta: any }
  | { type: 'usage'; usage: StreamingUsage }
  | { type: 'error'; error: string }
> {
  const controller = new AbortController();

  try {
    const response = await fetch(url, {
      ...options,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      body: JSON.stringify({ ...body, stream: true, stream_options: { include_usage: true } }),
      signal: controller.signal,
    });

    if (!response.ok) {
      yield { type: 'error', error: `HTTP ${response.status}` };
      return;
    }

    for await (const event of parseSSEStream(response.body)) {
      if (event.data === '[DONE]') break;

      try {
        const chunk = JSON.parse(event.data);

        if (chunk.choices?.[0]?.delta?.content) {
          yield {
            type: 'content',
            content: chunk.choices[0].delta.content,
            delta: chunk.choices[0].delta,
          };
        }

        if (chunk.usage) {
          yield {
            type: 'usage',
            usage: {
              promptTokens: chunk.usage.prompt_tokens,
              completionTokens: chunk.usage.completion_tokens,
              totalTokens: chunk.usage.total_tokens,
              cachedTokens: chunk.usage.prompt_tokens_details?.cached_tokens,
            },
          };
        }
      } catch {
        // Skip parse errors
      }
    }
  } catch (error) {
    yield { type: 'error', error: String(error) };
  } finally {
    controller.abort();
  }
}

export function generateIdempotencyKey(prefix = 'huntaze'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${prefix}-${timestamp}-${random}`;
}

export interface StructuredOutputConfig {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
}

export function buildStructuredOutputFormat(config: StructuredOutputConfig) {
  return {
    type: 'json_schema',
    json_schema: {
      name: config.name,
      strict: config.strict ?? true,
      schema: config.schema,
    },
  };
}

export interface AISpanAttributes {
  'ai.model': string;
  'ai.operation': string;
  'ai.request.tokens': number;
  'ai.response.tokens': number;
  'ai.cached.tokens'?: number;
  'ai.retry.count': number;
  'ai.circuit.state': CircuitState;
  'ai.latency.ms': number;
  'ai.cache.hit': boolean;
}

export function createAISpanAttributes(params: {
  model: string;
  operation: string;
  requestTokens: number;
  responseTokens: number;
  cachedTokens?: number;
  retryCount: number;
  circuitState: CircuitState;
  latencyMs: number;
  cacheHit: boolean;
}): AISpanAttributes {
  return {
    'ai.model': params.model,
    'ai.operation': params.operation,
    'ai.request.tokens': params.requestTokens,
    'ai.response.tokens': params.responseTokens,
    'ai.cached.tokens': params.cachedTokens,
    'ai.retry.count': params.retryCount,
    'ai.circuit.state': params.circuitState,
    'ai.latency.ms': params.latencyMs,
    'ai.cache.hit': params.cacheHit,
  };
}

export function calculateCacheHitRate(cachedTokens: number, totalInputTokens: number): number {
  if (totalInputTokens === 0) return 0;
  return cachedTokens / totalInputTokens;
}

export const defaultAICircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 30_000,
  windowSize: 60_000,
});
