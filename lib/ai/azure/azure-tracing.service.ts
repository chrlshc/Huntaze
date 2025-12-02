/**
 * Azure Distributed Tracing Service
 * Implements correlation ID generation and propagation across services
 * 
 * Feature: huntaze-ai-azure-migration, Phase 7
 * Task 33: Implement distributed tracing
 * Validates: Requirements 11.3, 11.4
 */

import { AZURE_OPENAI_CONFIG } from './azure-openai.config';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  correlationId: string;
  operationName: string;
  serviceName: string;
  startTime: Date;
  endTime?: Date;
  durationMs?: number;
  status: TraceStatus;
  attributes: Record<string, string | number | boolean>;
  events: TraceEvent[];
  links: TraceLink[];
}

export type TraceStatus = 'unset' | 'ok' | 'error';

export interface TraceEvent {
  name: string;
  timestamp: Date;
  attributes?: Record<string, string | number | boolean>;
}

export interface TraceLink {
  traceId: string;
  spanId: string;
  attributes?: Record<string, string | number | boolean>;
}

export interface SpanOptions {
  operationName: string;
  parentContext?: TraceContext;
  attributes?: Record<string, string | number | boolean>;
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  correlationId: string;
  traceId?: string;
  spanId?: string;
  serviceName: string;
  operationName?: string;
  attributes: Record<string, string | number | boolean>;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface TracingConfig {
  enabled: boolean;
  serviceName: string;
  sampleRate: number;
  exporterEndpoint?: string;
  instrumentationKey?: string;
}

// ============================================================================
// Trace ID Generation
// ============================================================================

/**
 * Generate a W3C Trace Context compliant trace ID (32 hex characters)
 */
export function generateTraceId(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < 16; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate a W3C Trace Context compliant span ID (16 hex characters)
 */
export function generateSpanId(): string {
  const bytes = new Uint8Array(8);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < 8; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate a correlation ID for request tracking
 */
export function generateCorrelationId(): string {
  return `corr_${Date.now()}_${generateSpanId().substring(0, 8)}`;
}

// ============================================================================
// Trace Context Propagation
// ============================================================================

/**
 * Parse W3C traceparent header
 * Format: version-traceId-spanId-flags
 * Example: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
 */
export function parseTraceparent(header: string): { traceId: string; spanId: string; sampled: boolean } | null {
  const parts = header.split('-');
  if (parts.length !== 4) return null;

  const [version, traceId, spanId, flags] = parts;
  
  // Validate version (currently only 00 is supported)
  if (version !== '00') return null;
  
  // Validate trace ID (32 hex characters, not all zeros)
  if (!/^[0-9a-f]{32}$/.test(traceId) || traceId === '00000000000000000000000000000000') {
    return null;
  }
  
  // Validate span ID (16 hex characters, not all zeros)
  if (!/^[0-9a-f]{16}$/.test(spanId) || spanId === '0000000000000000') {
    return null;
  }
  
  // Parse flags
  const sampled = (parseInt(flags, 16) & 0x01) === 0x01;

  return { traceId, spanId, sampled };
}

/**
 * Create W3C traceparent header
 */
export function createTraceparent(traceId: string, spanId: string, sampled: boolean = true): string {
  const flags = sampled ? '01' : '00';
  return `00-${traceId}-${spanId}-${flags}`;
}

/**
 * Parse W3C tracestate header
 * Format: key1=value1,key2=value2
 */
export function parseTracestate(header: string): Map<string, string> {
  const state = new Map<string, string>();
  
  if (!header) return state;
  
  const pairs = header.split(',');
  for (const pair of pairs) {
    const [key, value] = pair.trim().split('=');
    if (key && value) {
      state.set(key.trim(), value.trim());
    }
  }
  
  return state;
}

/**
 * Create W3C tracestate header
 */
export function createTracestate(state: Map<string, string>): string {
  return Array.from(state.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join(',');
}

// ============================================================================
// Azure Tracing Service
// ============================================================================

export class AzureTracingService {
  private config: TracingConfig;
  private activeSpans: Map<string, TraceContext> = new Map();
  private logBuffer: LogEntry[] = [];
  private static instance: AzureTracingService | null = null;

  constructor(config?: Partial<TracingConfig>) {
    this.config = {
      enabled: config?.enabled ?? process.env.AZURE_TRACING_ENABLED === 'true',
      serviceName: config?.serviceName ?? 'huntaze-ai',
      sampleRate: config?.sampleRate ?? 1.0,
      exporterEndpoint: config?.exporterEndpoint ?? process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
      instrumentationKey: config?.instrumentationKey ?? process.env.APPLICATIONINSIGHTS_INSTRUMENTATION_KEY,
    };
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AzureTracingService {
    if (!AzureTracingService.instance) {
      AzureTracingService.instance = new AzureTracingService();
    }
    return AzureTracingService.instance;
  }

  /**
   * Reset singleton (for testing)
   */
  static resetInstance(): void {
    AzureTracingService.instance = null;
  }

  /**
   * Start a new trace span
   * **Feature: huntaze-ai-azure-migration, Property 40: Correlation ID in logs**
   * **Validates: Requirements 11.3, 11.4**
   */
  startSpan(options: SpanOptions): TraceContext {
    const traceId = options.parentContext?.traceId ?? generateTraceId();
    const spanId = generateSpanId();
    const correlationId = options.parentContext?.correlationId ?? generateCorrelationId();

    const context: TraceContext = {
      traceId,
      spanId,
      parentSpanId: options.parentContext?.spanId,
      correlationId,
      operationName: options.operationName,
      serviceName: this.config.serviceName,
      startTime: new Date(),
      status: 'unset',
      attributes: {
        ...options.attributes,
        'service.name': this.config.serviceName,
        'operation.name': options.operationName,
      },
      events: [],
      links: [],
    };

    this.activeSpans.set(spanId, context);
    return context;
  }

  /**
   * End a trace span
   */
  endSpan(context: TraceContext, status: TraceStatus = 'ok'): TraceContext {
    const endTime = new Date();
    const durationMs = endTime.getTime() - context.startTime.getTime();

    const completedContext: TraceContext = {
      ...context,
      endTime,
      durationMs,
      status,
    };

    this.activeSpans.delete(context.spanId);

    // Log span completion
    this.log('info', `Span completed: ${context.operationName}`, completedContext, {
      duration_ms: durationMs,
      status,
    });

    return completedContext;
  }

  /**
   * Add an event to a span
   */
  addEvent(context: TraceContext, name: string, attributes?: Record<string, string | number | boolean>): void {
    context.events.push({
      name,
      timestamp: new Date(),
      attributes,
    });
  }

  /**
   * Add a link to another trace
   */
  addLink(context: TraceContext, linkedTraceId: string, linkedSpanId: string, attributes?: Record<string, string | number | boolean>): void {
    context.links.push({
      traceId: linkedTraceId,
      spanId: linkedSpanId,
      attributes,
    });
  }

  /**
   * Set span attributes
   */
  setAttributes(context: TraceContext, attributes: Record<string, string | number | boolean>): void {
    Object.assign(context.attributes, attributes);
  }

  /**
   * Log with correlation ID
   * **Feature: huntaze-ai-azure-migration, Property 40: Correlation ID in logs**
   * **Validates: Requirements 11.4**
   */
  log(
    level: LogLevel,
    message: string,
    context?: TraceContext | { correlationId: string },
    attributes?: Record<string, string | number | boolean>
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      correlationId: context?.correlationId ?? generateCorrelationId(),
      traceId: (context as TraceContext)?.traceId,
      spanId: (context as TraceContext)?.spanId,
      serviceName: this.config.serviceName,
      operationName: (context as TraceContext)?.operationName,
      attributes: {
        ...attributes,
      },
    };

    this.logBuffer.push(entry);

    // In production, this would send to Application Insights
    if (process.env.NODE_ENV !== 'test') {
      this.emitLog(entry);
    }

    return entry;
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: TraceContext | { correlationId: string }, attributes?: Record<string, string | number | boolean>): LogEntry {
    return this.log('debug', message, context, attributes);
  }

  /**
   * Log info message
   */
  info(message: string, context?: TraceContext | { correlationId: string }, attributes?: Record<string, string | number | boolean>): LogEntry {
    return this.log('info', message, context, attributes);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: TraceContext | { correlationId: string }, attributes?: Record<string, string | number | boolean>): LogEntry {
    return this.log('warn', message, context, attributes);
  }

  /**
   * Log error message
   */
  error(message: string, context?: TraceContext | { correlationId: string }, attributes?: Record<string, string | number | boolean>): LogEntry {
    return this.log('error', message, context, attributes);
  }

  /**
   * Create a child span
   */
  createChildSpan(parentContext: TraceContext, operationName: string, attributes?: Record<string, string | number | boolean>): TraceContext {
    return this.startSpan({
      operationName,
      parentContext,
      attributes,
    });
  }

  /**
   * Extract trace context from HTTP headers
   */
  extractFromHeaders(headers: Record<string, string | undefined>): TraceContext | null {
    const traceparent = headers['traceparent'] || headers['Traceparent'];
    if (!traceparent) return null;

    const parsed = parseTraceparent(traceparent);
    if (!parsed) return null;

    // Extract correlation ID from tracestate or generate new one
    const tracestate = headers['tracestate'] || headers['Tracestate'];
    const state = tracestate ? parseTracestate(tracestate) : new Map();
    const correlationId = state.get('correlation-id') ?? generateCorrelationId();

    return {
      traceId: parsed.traceId,
      spanId: parsed.spanId,
      correlationId,
      operationName: 'incoming-request',
      serviceName: this.config.serviceName,
      startTime: new Date(),
      status: 'unset',
      attributes: {},
      events: [],
      links: [],
    };
  }

  /**
   * Inject trace context into HTTP headers
   */
  injectToHeaders(context: TraceContext, headers: Record<string, string> = {}): Record<string, string> {
    headers['traceparent'] = createTraceparent(context.traceId, context.spanId, true);
    
    const state = new Map<string, string>();
    state.set('correlation-id', context.correlationId);
    headers['tracestate'] = createTracestate(state);
    
    // Also add correlation ID as a separate header for easier access
    headers['x-correlation-id'] = context.correlationId;
    
    return headers;
  }

  /**
   * Get active span count (for testing)
   */
  getActiveSpanCount(): number {
    return this.activeSpans.size;
  }

  /**
   * Get log buffer (for testing)
   */
  getLogBuffer(): LogEntry[] {
    return [...this.logBuffer];
  }

  /**
   * Clear log buffer (for testing)
   */
  clearLogBuffer(): void {
    this.logBuffer = [];
  }

  /**
   * Emit log to Application Insights
   */
  private emitLog(entry: LogEntry): void {
    if (!this.config.enabled) return;

    // Format log for console output
    const logMessage = `[${entry.level.toUpperCase()}] [${entry.correlationId}] ${entry.message}`;
    
    switch (entry.level) {
      case 'debug':
        console.debug(logMessage, entry.attributes);
        break;
      case 'info':
        console.info(logMessage, entry.attributes);
        break;
      case 'warn':
        console.warn(logMessage, entry.attributes);
        break;
      case 'error':
        console.error(logMessage, entry.attributes);
        break;
    }
  }

  /**
   * Flush all logs
   */
  async flush(): Promise<void> {
    // In production, this would batch send to Application Insights
    this.logBuffer = [];
  }
}

// Export singleton instance
export const azureTracingService = AzureTracingService.getInstance();
