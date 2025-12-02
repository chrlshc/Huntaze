/**
 * Azure Tracing Service - Property-Based Tests
 * 
 * Feature: huntaze-ai-azure-migration, Phase 7
 * Task 33.1: Write property test for correlation IDs
 * **Property 40: Correlation ID in logs**
 * **Validates: Requirements 11.4**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  AzureTracingService,
  generateTraceId,
  generateSpanId,
  generateCorrelationId,
  parseTraceparent,
  createTraceparent,
  parseTracestate,
  createTracestate,
  type TraceContext,
  type LogLevel,
} from '../../../lib/ai/azure/azure-tracing.service';

// ============================================================================
// Arbitraries (Generators)
// ============================================================================

const operationNameArb = fc.stringMatching(/^[a-z][a-z0-9-]{2,30}$/);

const logLevelArb = fc.constantFrom<LogLevel>('debug', 'info', 'warn', 'error');

const logMessageArb = fc.string({ minLength: 1, maxLength: 500 });

const attributeKeyArb = fc.stringMatching(/^[a-z][a-z0-9_.]{0,30}$/);

const attributeValueArb = fc.oneof(
  fc.string({ minLength: 0, maxLength: 100 }),
  fc.integer({ min: -1000000, max: 1000000 }),
  fc.boolean()
);

const attributesArb = fc.dictionary(attributeKeyArb, attributeValueArb, { minKeys: 0, maxKeys: 10 });

const validTraceIdArb = fc.stringMatching(/^[0-9a-f]{32}$/).filter(
  id => id !== '00000000000000000000000000000000'
);

const validSpanIdArb = fc.stringMatching(/^[0-9a-f]{16}$/).filter(
  id => id !== '0000000000000000'
);

const sampledArb = fc.boolean();

const traceparentArb = fc.tuple(validTraceIdArb, validSpanIdArb, sampledArb).map(
  ([traceId, spanId, sampled]) => createTraceparent(traceId, spanId, sampled)
);

const tracestateArb = fc.dictionary(
  fc.stringMatching(/^[a-z][a-z0-9_-]{0,20}$/),
  fc.stringMatching(/^[a-zA-Z0-9_-]{1,50}$/),
  { minKeys: 0, maxKeys: 5 }
).map(dict => {
  const map = new Map<string, string>();
  for (const [key, value] of Object.entries(dict)) {
    map.set(key, value);
  }
  return map;
});

// ============================================================================
// Property Tests
// ============================================================================

describe('Azure Tracing Service - Property-Based Tests', () => {
  let service: AzureTracingService;

  beforeEach(() => {
    AzureTracingService.resetInstance();
    service = new AzureTracingService({ enabled: true, serviceName: 'test-service' });
  });

  afterEach(() => {
    service.clearLogBuffer();
  });

  /**
   * **Feature: huntaze-ai-azure-migration, Property 40: Correlation ID in logs**
   * **Validates: Requirements 11.4**
   * 
   * Property: For any log entry in Application Insights, it should contain
   * a correlation ID for request tracking.
   */
  describe('Property 40: Correlation ID in logs', () => {
    it('should include correlation ID in every log entry', () => {
      fc.assert(
        fc.property(
          logLevelArb,
          logMessageArb,
          attributesArb,
          (level, message, attributes) => {
            service.clearLogBuffer();

            // Log without context - should generate correlation ID
            const entry = service.log(level, message, undefined, attributes as Record<string, string | number | boolean>);

            // Verify correlation ID is present and valid
            expect(entry.correlationId).toBeDefined();
            expect(entry.correlationId).toMatch(/^corr_\d+_[0-9a-f]{8}$/);
            expect(entry.message).toBe(message);
            expect(entry.level).toBe(level);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve correlation ID from trace context in all logs', () => {
      fc.assert(
        fc.property(
          operationNameArb,
          fc.array(fc.tuple(logLevelArb, logMessageArb), { minLength: 1, maxLength: 20 }),
          (operationName, logEntries) => {
            service.clearLogBuffer();

            // Start a span to get a trace context
            const context = service.startSpan({ operationName });

            // Log multiple messages with the same context
            for (const [level, message] of logEntries) {
              service.log(level, message, context);
            }

            // All log entries should have the same correlation ID
            const buffer = service.getLogBuffer();
            for (const entry of buffer) {
              expect(entry.correlationId).toBe(context.correlationId);
              expect(entry.traceId).toBe(context.traceId);
              expect(entry.spanId).toBe(context.spanId);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should include trace context in logs when available', () => {
      fc.assert(
        fc.property(
          operationNameArb,
          logMessageArb,
          attributesArb,
          (operationName, message, attributes) => {
            service.clearLogBuffer();

            const context = service.startSpan({ operationName });
            const entry = service.info(message, context, attributes as Record<string, string | number | boolean>);

            // Verify full trace context is present
            expect(entry.correlationId).toBe(context.correlationId);
            expect(entry.traceId).toBe(context.traceId);
            expect(entry.spanId).toBe(context.spanId);
            expect(entry.serviceName).toBe('test-service');
            expect(entry.operationName).toBe(operationName);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use custom correlation ID when provided', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-z0-9-]{8,50}$/),
          logMessageArb,
          (customCorrelationId, message) => {
            service.clearLogBuffer();

            const entry = service.info(message, { correlationId: customCorrelationId });

            expect(entry.correlationId).toBe(customCorrelationId);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property: Trace ID generation should produce valid W3C trace IDs
   */
  describe('Trace ID Generation Properties', () => {
    it('should generate valid W3C trace IDs', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (count) => {
            const ids = new Set<string>();
            
            for (let i = 0; i < count; i++) {
              const traceId = generateTraceId();
              
              // Validate format (32 hex characters)
              expect(traceId).toMatch(/^[0-9a-f]{32}$/);
              
              // Should not be all zeros
              expect(traceId).not.toBe('00000000000000000000000000000000');
              
              ids.add(traceId);
            }

            // All IDs should be unique
            expect(ids.size).toBe(count);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should generate valid W3C span IDs', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (count) => {
            const ids = new Set<string>();
            
            for (let i = 0; i < count; i++) {
              const spanId = generateSpanId();
              
              // Validate format (16 hex characters)
              expect(spanId).toMatch(/^[0-9a-f]{16}$/);
              
              // Should not be all zeros
              expect(spanId).not.toBe('0000000000000000');
              
              ids.add(spanId);
            }

            // All IDs should be unique
            expect(ids.size).toBe(count);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should generate valid correlation IDs', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (count) => {
            const ids = new Set<string>();
            
            for (let i = 0; i < count; i++) {
              const correlationId = generateCorrelationId();
              
              // Validate format
              expect(correlationId).toMatch(/^corr_\d+_[0-9a-f]{8}$/);
              
              ids.add(correlationId);
            }

            // All IDs should be unique
            expect(ids.size).toBe(count);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property: Traceparent round-trip should preserve data
   */
  describe('Traceparent Round-Trip Properties', () => {
    it('should round-trip traceparent header correctly', () => {
      fc.assert(
        fc.property(
          validTraceIdArb,
          validSpanIdArb,
          sampledArb,
          (traceId, spanId, sampled) => {
            // Create traceparent
            const header = createTraceparent(traceId, spanId, sampled);
            
            // Parse it back
            const parsed = parseTraceparent(header);
            
            expect(parsed).not.toBeNull();
            expect(parsed!.traceId).toBe(traceId);
            expect(parsed!.spanId).toBe(spanId);
            expect(parsed!.sampled).toBe(sampled);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should round-trip tracestate header correctly', () => {
      fc.assert(
        fc.property(
          tracestateArb,
          (state) => {
            // Create tracestate
            const header = createTracestate(state);
            
            // Parse it back
            const parsed = parseTracestate(header);
            
            // All original entries should be present
            for (const [key, value] of state.entries()) {
              expect(parsed.get(key)).toBe(value);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property: Span hierarchy should be maintained
   */
  describe('Span Hierarchy Properties', () => {
    it('should maintain trace ID across span hierarchy', () => {
      fc.assert(
        fc.property(
          fc.array(operationNameArb, { minLength: 1, maxLength: 10 }),
          (operationNames) => {
            let parentContext: TraceContext | undefined;
            const contexts: TraceContext[] = [];

            for (const operationName of operationNames) {
              const context = parentContext
                ? service.createChildSpan(parentContext, operationName)
                : service.startSpan({ operationName });
              
              contexts.push(context);
              parentContext = context;
            }

            // All spans should share the same trace ID
            const traceId = contexts[0].traceId;
            for (const context of contexts) {
              expect(context.traceId).toBe(traceId);
            }

            // All spans should share the same correlation ID
            const correlationId = contexts[0].correlationId;
            for (const context of contexts) {
              expect(context.correlationId).toBe(correlationId);
            }

            // Each span should have unique span ID
            const spanIds = new Set(contexts.map(c => c.spanId));
            expect(spanIds.size).toBe(contexts.length);

            // Parent-child relationships should be correct
            for (let i = 1; i < contexts.length; i++) {
              expect(contexts[i].parentSpanId).toBe(contexts[i - 1].spanId);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property: HTTP header injection and extraction should be consistent
   */
  describe('HTTP Header Propagation Properties', () => {
    it('should round-trip trace context through HTTP headers', () => {
      fc.assert(
        fc.property(
          operationNameArb,
          attributesArb,
          (operationName, attributes) => {
            // Create a span
            const originalContext = service.startSpan({
              operationName,
              attributes: attributes as Record<string, string | number | boolean>,
            });

            // Inject into headers
            const headers = service.injectToHeaders(originalContext);

            // Extract from headers
            const extractedContext = service.extractFromHeaders(headers);

            expect(extractedContext).not.toBeNull();
            expect(extractedContext!.traceId).toBe(originalContext.traceId);
            expect(extractedContext!.spanId).toBe(originalContext.spanId);
            expect(extractedContext!.correlationId).toBe(originalContext.correlationId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve existing headers when injecting', () => {
      fc.assert(
        fc.property(
          operationNameArb,
          fc.dictionary(
            fc.stringMatching(/^[a-z][a-z0-9-]{2,20}$/),
            fc.string({ minLength: 1, maxLength: 50 }),
            { minKeys: 1, maxKeys: 5 }
          ),
          (operationName, existingHeaders) => {
            const context = service.startSpan({ operationName });
            
            const headers = service.injectToHeaders(context, existingHeaders);

            // Original headers should be preserved
            for (const [key, value] of Object.entries(existingHeaders)) {
              expect(headers[key]).toBe(value);
            }

            // Trace headers should be added
            expect(headers['traceparent']).toBeDefined();
            expect(headers['tracestate']).toBeDefined();
            expect(headers['x-correlation-id']).toBeDefined();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property: Span events should be recorded in order
   */
  describe('Span Event Properties', () => {
    it('should record events in chronological order', () => {
      fc.assert(
        fc.property(
          operationNameArb,
          fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 20 }),
          (operationName, eventNames) => {
            const context = service.startSpan({ operationName });

            for (const eventName of eventNames) {
              service.addEvent(context, eventName);
            }

            // Events should be in order
            expect(context.events).toHaveLength(eventNames.length);
            for (let i = 0; i < eventNames.length; i++) {
              expect(context.events[i].name).toBe(eventNames[i]);
            }

            // Timestamps should be non-decreasing
            for (let i = 1; i < context.events.length; i++) {
              expect(context.events[i].timestamp.getTime())
                .toBeGreaterThanOrEqual(context.events[i - 1].timestamp.getTime());
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property: Span duration should be non-negative
   */
  describe('Span Duration Properties', () => {
    it('should calculate non-negative duration for any span', () => {
      fc.assert(
        fc.property(
          operationNameArb,
          fc.constantFrom<'ok' | 'error'>('ok', 'error'),
          (operationName, status) => {
            const context = service.startSpan({ operationName });
            const completed = service.endSpan(context, status);

            expect(completed.durationMs).toBeGreaterThanOrEqual(0);
            expect(completed.endTime).toBeInstanceOf(Date);
            expect(completed.endTime!.getTime()).toBeGreaterThanOrEqual(completed.startTime.getTime());
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
