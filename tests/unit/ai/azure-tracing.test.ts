/**
 * Azure Tracing Service - Unit Tests
 * 
 * Feature: huntaze-ai-azure-migration, Phase 7
 * Task 33: Implement distributed tracing
 * Validates: Requirements 11.3, 11.4
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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
} from '../../../lib/ai/azure/azure-tracing.service';

describe('Trace ID Generation', () => {
  it('should generate valid trace IDs (32 hex characters)', () => {
    const traceId = generateTraceId();
    expect(traceId).toMatch(/^[0-9a-f]{32}$/);
  });

  it('should generate unique trace IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateTraceId());
    }
    expect(ids.size).toBe(100);
  });

  it('should generate valid span IDs (16 hex characters)', () => {
    const spanId = generateSpanId();
    expect(spanId).toMatch(/^[0-9a-f]{16}$/);
  });

  it('should generate unique span IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateSpanId());
    }
    expect(ids.size).toBe(100);
  });

  it('should generate valid correlation IDs', () => {
    const correlationId = generateCorrelationId();
    expect(correlationId).toMatch(/^corr_\d+_[0-9a-f]{8}$/);
  });
});

describe('W3C Trace Context Parsing', () => {
  describe('parseTraceparent', () => {
    it('should parse valid traceparent header', () => {
      const header = '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01';
      const result = parseTraceparent(header);

      expect(result).not.toBeNull();
      expect(result!.traceId).toBe('0af7651916cd43dd8448eb211c80319c');
      expect(result!.spanId).toBe('b7ad6b7169203331');
      expect(result!.sampled).toBe(true);
    });

    it('should parse unsampled traceparent', () => {
      const header = '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-00';
      const result = parseTraceparent(header);

      expect(result).not.toBeNull();
      expect(result!.sampled).toBe(false);
    });

    it('should reject invalid version', () => {
      const header = '01-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01';
      const result = parseTraceparent(header);
      expect(result).toBeNull();
    });

    it('should reject all-zero trace ID', () => {
      const header = '00-00000000000000000000000000000000-b7ad6b7169203331-01';
      const result = parseTraceparent(header);
      expect(result).toBeNull();
    });

    it('should reject all-zero span ID', () => {
      const header = '00-0af7651916cd43dd8448eb211c80319c-0000000000000000-01';
      const result = parseTraceparent(header);
      expect(result).toBeNull();
    });

    it('should reject malformed header', () => {
      expect(parseTraceparent('invalid')).toBeNull();
      expect(parseTraceparent('00-abc-def-01')).toBeNull();
      expect(parseTraceparent('')).toBeNull();
    });
  });

  describe('createTraceparent', () => {
    it('should create valid traceparent header', () => {
      const traceId = '0af7651916cd43dd8448eb211c80319c';
      const spanId = 'b7ad6b7169203331';
      
      const header = createTraceparent(traceId, spanId, true);
      expect(header).toBe('00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01');
    });

    it('should create unsampled traceparent', () => {
      const traceId = '0af7651916cd43dd8448eb211c80319c';
      const spanId = 'b7ad6b7169203331';
      
      const header = createTraceparent(traceId, spanId, false);
      expect(header).toBe('00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-00');
    });
  });

  describe('parseTracestate', () => {
    it('should parse valid tracestate header', () => {
      const header = 'key1=value1,key2=value2';
      const state = parseTracestate(header);

      expect(state.get('key1')).toBe('value1');
      expect(state.get('key2')).toBe('value2');
    });

    it('should handle empty tracestate', () => {
      const state = parseTracestate('');
      expect(state.size).toBe(0);
    });

    it('should handle whitespace', () => {
      const header = ' key1=value1 , key2=value2 ';
      const state = parseTracestate(header);

      expect(state.get('key1')).toBe('value1');
      expect(state.get('key2')).toBe('value2');
    });
  });

  describe('createTracestate', () => {
    it('should create valid tracestate header', () => {
      const state = new Map<string, string>();
      state.set('key1', 'value1');
      state.set('key2', 'value2');

      const header = createTracestate(state);
      expect(header).toContain('key1=value1');
      expect(header).toContain('key2=value2');
    });

    it('should handle empty state', () => {
      const state = new Map<string, string>();
      const header = createTracestate(state);
      expect(header).toBe('');
    });
  });
});

describe('AzureTracingService', () => {
  let service: AzureTracingService;

  beforeEach(() => {
    AzureTracingService.resetInstance();
    service = new AzureTracingService({ enabled: true, serviceName: 'test-service' });
  });

  afterEach(() => {
    service.clearLogBuffer();
  });

  describe('Span Management', () => {
    it('should start a new span with correct properties', () => {
      const context = service.startSpan({
        operationName: 'test-operation',
        attributes: { custom: 'value' },
      });

      expect(context.traceId).toMatch(/^[0-9a-f]{32}$/);
      expect(context.spanId).toMatch(/^[0-9a-f]{16}$/);
      expect(context.correlationId).toMatch(/^corr_/);
      expect(context.operationName).toBe('test-operation');
      expect(context.serviceName).toBe('test-service');
      expect(context.status).toBe('unset');
      expect(context.startTime).toBeInstanceOf(Date);
      expect(context.attributes.custom).toBe('value');
    });

    it('should create child span with parent context', () => {
      const parentContext = service.startSpan({ operationName: 'parent' });
      const childContext = service.createChildSpan(parentContext, 'child');

      expect(childContext.traceId).toBe(parentContext.traceId);
      expect(childContext.parentSpanId).toBe(parentContext.spanId);
      expect(childContext.correlationId).toBe(parentContext.correlationId);
      expect(childContext.spanId).not.toBe(parentContext.spanId);
    });

    it('should end span with correct duration', async () => {
      const context = service.startSpan({ operationName: 'test' });
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const completed = service.endSpan(context, 'ok');

      expect(completed.status).toBe('ok');
      expect(completed.endTime).toBeInstanceOf(Date);
      expect(completed.durationMs).toBeGreaterThanOrEqual(10);
    });

    it('should track active spans', () => {
      expect(service.getActiveSpanCount()).toBe(0);

      const span1 = service.startSpan({ operationName: 'span1' });
      expect(service.getActiveSpanCount()).toBe(1);

      const span2 = service.startSpan({ operationName: 'span2' });
      expect(service.getActiveSpanCount()).toBe(2);

      service.endSpan(span1);
      expect(service.getActiveSpanCount()).toBe(1);

      service.endSpan(span2);
      expect(service.getActiveSpanCount()).toBe(0);
    });
  });

  describe('Span Events and Links', () => {
    it('should add events to span', () => {
      const context = service.startSpan({ operationName: 'test' });
      
      service.addEvent(context, 'event1', { key: 'value' });
      service.addEvent(context, 'event2');

      expect(context.events).toHaveLength(2);
      expect(context.events[0].name).toBe('event1');
      expect(context.events[0].attributes?.key).toBe('value');
      expect(context.events[1].name).toBe('event2');
    });

    it('should add links to span', () => {
      const context = service.startSpan({ operationName: 'test' });
      
      service.addLink(context, 'linked-trace-id', 'linked-span-id', { reason: 'test' });

      expect(context.links).toHaveLength(1);
      expect(context.links[0].traceId).toBe('linked-trace-id');
      expect(context.links[0].spanId).toBe('linked-span-id');
      expect(context.links[0].attributes?.reason).toBe('test');
    });

    it('should set attributes on span', () => {
      const context = service.startSpan({ operationName: 'test' });
      
      service.setAttributes(context, { key1: 'value1', key2: 123 });

      expect(context.attributes.key1).toBe('value1');
      expect(context.attributes.key2).toBe(123);
    });
  });

  describe('Logging with Correlation ID', () => {
    it('should log with correlation ID from context', () => {
      const context = service.startSpan({ operationName: 'test' });
      
      const entry = service.info('Test message', context, { extra: 'data' });

      expect(entry.correlationId).toBe(context.correlationId);
      expect(entry.traceId).toBe(context.traceId);
      expect(entry.spanId).toBe(context.spanId);
      expect(entry.message).toBe('Test message');
      expect(entry.level).toBe('info');
      expect(entry.attributes.extra).toBe('data');
    });

    it('should log with provided correlation ID', () => {
      const entry = service.info('Test message', { correlationId: 'custom-corr-id' });

      expect(entry.correlationId).toBe('custom-corr-id');
    });

    it('should generate correlation ID if not provided', () => {
      const entry = service.info('Test message');

      expect(entry.correlationId).toMatch(/^corr_/);
    });

    it('should support all log levels', () => {
      const context = service.startSpan({ operationName: 'test' });

      const debugEntry = service.debug('Debug message', context);
      const infoEntry = service.info('Info message', context);
      const warnEntry = service.warn('Warn message', context);
      const errorEntry = service.error('Error message', context);

      expect(debugEntry.level).toBe('debug');
      expect(infoEntry.level).toBe('info');
      expect(warnEntry.level).toBe('warn');
      expect(errorEntry.level).toBe('error');
    });

    it('should buffer logs', () => {
      service.info('Message 1');
      service.info('Message 2');
      service.info('Message 3');

      const buffer = service.getLogBuffer();
      expect(buffer).toHaveLength(3);
    });
  });

  describe('HTTP Header Propagation', () => {
    it('should extract trace context from headers', () => {
      const headers = {
        'traceparent': '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
        'tracestate': 'correlation-id=custom-corr-123',
      };

      const context = service.extractFromHeaders(headers);

      expect(context).not.toBeNull();
      expect(context!.traceId).toBe('0af7651916cd43dd8448eb211c80319c');
      expect(context!.spanId).toBe('b7ad6b7169203331');
      expect(context!.correlationId).toBe('custom-corr-123');
    });

    it('should return null for missing traceparent', () => {
      const context = service.extractFromHeaders({});
      expect(context).toBeNull();
    });

    it('should inject trace context into headers', () => {
      const context = service.startSpan({ operationName: 'test' });
      
      const headers = service.injectToHeaders(context);

      expect(headers['traceparent']).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
      expect(headers['tracestate']).toContain('correlation-id=');
      expect(headers['x-correlation-id']).toBe(context.correlationId);
    });

    it('should preserve existing headers when injecting', () => {
      const context = service.startSpan({ operationName: 'test' });
      const existingHeaders = { 'content-type': 'application/json' };
      
      const headers = service.injectToHeaders(context, existingHeaders);

      expect(headers['content-type']).toBe('application/json');
      expect(headers['traceparent']).toBeDefined();
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = AzureTracingService.getInstance();
      const instance2 = AzureTracingService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should reset instance', () => {
      const instance1 = AzureTracingService.getInstance();
      AzureTracingService.resetInstance();
      const instance2 = AzureTracingService.getInstance();

      expect(instance1).not.toBe(instance2);
    });
  });
});
