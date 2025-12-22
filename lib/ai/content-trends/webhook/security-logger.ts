/**
 * Security Event Logger
 * Content & Trends AI Engine - Phase 4
 * 
 * Logs security events for monitoring, auditing, and alerting
 */

import {
  SecurityEvent,
  SecurityEventType,
  SecurityEventLogger,
} from './types';

// ============================================================================
// Security Logger Configuration
// ============================================================================

export interface SecurityLoggerConfig {
  /** Maximum events to keep in memory */
  maxEvents?: number;
  /** Enable console logging */
  consoleLogging?: boolean;
  /** Log level for console output */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  /** Custom log handler */
  customHandler?: (event: SecurityEvent) => void;
  /** Enable structured logging (JSON format) */
  structuredLogging?: boolean;
}

const DEFAULT_CONFIG: Required<Omit<SecurityLoggerConfig, 'customHandler'>> = {
  maxEvents: 1000,
  consoleLogging: true,
  logLevel: 'info',
  structuredLogging: false,
};

// ============================================================================
// Security Logger Implementation
// ============================================================================

export class WebhookSecurityLogger implements SecurityEventLogger {
  private readonly config: Required<Omit<SecurityLoggerConfig, 'customHandler'>>;
  private readonly customHandler?: (event: SecurityEvent) => void;
  private events: SecurityEvent[] = [];

  constructor(config: SecurityLoggerConfig = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
    this.customHandler = config.customHandler;
  }

  /**
   * Log a security event
   */
  log(event: SecurityEvent): void {
    // Add to in-memory store
    this.events.push(event);

    // Trim if exceeds max
    if (this.events.length > this.config.maxEvents) {
      this.events = this.events.slice(-this.config.maxEvents);
    }

    // Console logging
    if (this.config.consoleLogging) {
      this.logToConsole(event);
    }

    // Custom handler
    if (this.customHandler) {
      try {
        this.customHandler(event);
      } catch (error) {
        console.error('Security logger custom handler error:', error);
      }
    }
  }

  /**
   * Get recent events
   */
  getRecentEvents(count: number): SecurityEvent[] {
    return this.events.slice(-count);
  }

  /**
   * Get events by type since a given date
   */
  getEventsByType(type: SecurityEventType, since: Date): SecurityEvent[] {
    return this.events.filter(
      event => event.type === type && event.timestamp >= since
    );
  }

  /**
   * Get events by severity
   */
  getEventsBySeverity(
    severity: SecurityEvent['severity'],
    since?: Date
  ): SecurityEvent[] {
    return this.events.filter(event => {
      if (event.severity !== severity) return false;
      if (since && event.timestamp < since) return false;
      return true;
    });
  }

  /**
   * Get event statistics
   */
  getStatistics(since?: Date): SecurityEventStatistics {
    const relevantEvents = since 
      ? this.events.filter(e => e.timestamp >= since)
      : this.events;

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    for (const event of relevantEvents) {
      byType[event.type] = (byType[event.type] ?? 0) + 1;
      bySeverity[event.severity] = (bySeverity[event.severity] ?? 0) + 1;
    }

    return {
      totalEvents: relevantEvents.length,
      byType: byType as Record<SecurityEventType, number>,
      bySeverity: bySeverity as Record<SecurityEvent['severity'], number>,
      oldestEvent: relevantEvents[0]?.timestamp,
      newestEvent: relevantEvents[relevantEvents.length - 1]?.timestamp,
    };
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = [];
  }

  // ==========================================================================
  // Convenience Methods for Common Events
  // ==========================================================================

  logSignatureValid(eventId: string, clientId?: string): void {
    this.log({
      type: 'SIGNATURE_VALID',
      timestamp: new Date(),
      eventId,
      clientId,
      details: {},
      severity: 'info',
    });
  }

  logSignatureInvalid(
    eventId: string,
    clientId?: string,
    reason?: string
  ): void {
    this.log({
      type: 'SIGNATURE_INVALID',
      timestamp: new Date(),
      eventId,
      clientId,
      details: { reason },
      severity: 'warning',
    });
  }

  logTimestampExpired(
    eventId: string,
    ageSeconds: number,
    maxAgeSeconds: number
  ): void {
    this.log({
      type: 'TIMESTAMP_EXPIRED',
      timestamp: new Date(),
      eventId,
      details: { ageSeconds, maxAgeSeconds },
      severity: 'warning',
    });
  }

  logRateLimitExceeded(
    clientId: string,
    requestCount: number,
    limit: number
  ): void {
    this.log({
      type: 'RATE_LIMIT_EXCEEDED',
      timestamp: new Date(),
      clientId,
      details: { requestCount, limit },
      severity: 'warning',
    });
  }

  logDuplicateEvent(eventId: string, actorRunId: string): void {
    this.log({
      type: 'DUPLICATE_EVENT',
      timestamp: new Date(),
      eventId,
      actorRunId,
      details: {},
      severity: 'info',
    });
  }

  logPayloadInvalid(
    eventId: string,
    errors: Array<{ field: string; message: string }>
  ): void {
    this.log({
      type: 'PAYLOAD_INVALID',
      timestamp: new Date(),
      eventId,
      details: { errors },
      severity: 'warning',
    });
  }

  logProcessingSuccess(
    eventId: string,
    actorRunId: string,
    jobId: string,
    processingTimeMs: number
  ): void {
    this.log({
      type: 'PROCESSING_SUCCESS',
      timestamp: new Date(),
      eventId,
      actorRunId,
      details: { jobId, processingTimeMs },
      severity: 'info',
    });
  }

  logProcessingFailure(
    eventId: string,
    actorRunId: string,
    error: string,
    retryable: boolean
  ): void {
    this.log({
      type: 'PROCESSING_FAILURE',
      timestamp: new Date(),
      eventId,
      actorRunId,
      details: { error, retryable },
      severity: 'error',
    });
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private logToConsole(event: SecurityEvent): void {
    const shouldLog = this.shouldLogLevel(event.severity);
    if (!shouldLog) return;

    if (this.config.structuredLogging) {
      console.log(JSON.stringify({
        level: event.severity,
        type: event.type,
        timestamp: event.timestamp.toISOString(),
        eventId: event.eventId,
        clientId: event.clientId,
        actorRunId: event.actorRunId,
        ...event.details,
      }));
    } else {
      const prefix = this.getLogPrefix(event.severity);
      const message = this.formatEventMessage(event);
      console.log(`${prefix} [Webhook Security] ${message}`);
    }
  }

  private shouldLogLevel(severity: SecurityEvent['severity']): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevel = levels.indexOf(this.config.logLevel);
    const eventLevel = levels.indexOf(severity === 'critical' ? 'error' : severity);
    return eventLevel >= configLevel;
  }

  private getLogPrefix(severity: SecurityEvent['severity']): string {
    switch (severity) {
      case 'debug': return '🔍';
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'critical': return '🚨';
      default: return '📝';
    }
  }

  private formatEventMessage(event: SecurityEvent): string {
    const parts = [event.type];
    
    if (event.eventId) parts.push(`eventId=${event.eventId}`);
    if (event.clientId) parts.push(`clientId=${event.clientId}`);
    if (event.actorRunId) parts.push(`actorRunId=${event.actorRunId}`);
    
    const detailsStr = Object.entries(event.details)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(' ');
    
    if (detailsStr) parts.push(detailsStr);
    
    return parts.join(' | ');
  }
}

// ============================================================================
// Types
// ============================================================================

export interface SecurityEventStatistics {
  totalEvents: number;
  byType: Record<SecurityEventType, number>;
  bySeverity: Record<SecurityEvent['severity'], number>;
  oldestEvent?: Date;
  newestEvent?: Date;
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a security logger instance
 */
export function createSecurityLogger(config?: SecurityLoggerConfig): WebhookSecurityLogger {
  return new WebhookSecurityLogger(config);
}

// ============================================================================
// Singleton Instance
// ============================================================================

let defaultLogger: WebhookSecurityLogger | null = null;

/**
 * Get the default security logger instance
 */
export function getSecurityLogger(): WebhookSecurityLogger {
  if (!defaultLogger) {
    defaultLogger = new WebhookSecurityLogger();
  }
  return defaultLogger;
}

/**
 * Set the default security logger instance
 */
export function setSecurityLogger(logger: WebhookSecurityLogger): void {
  defaultLogger = logger;
}
