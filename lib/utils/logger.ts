/**
 * Centralized logging utility with correlation ID support
 * for structured logging across the application
 */

export interface LogContext {
  correlationId: string;
  timestamp: string;
  service: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  metadata?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

/**
 * Generate a unique correlation ID for request tracing
 * Edge Runtime compatible (uses crypto.randomUUID if available, fallback otherwise)
 */
export function generateCorrelationId(): string {
  // Try to use crypto.randomUUID (Node.js and modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for Edge Runtime or older environments
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Create a logger instance for a specific service
 */
export function createLogger(service: string) {
  return {
    info: (message: string, meta?: Record<string, any>) => {
      const log: LogContext = {
        correlationId: generateCorrelationId(),
        timestamp: new Date().toISOString(),
        service,
        level: 'info',
        message,
        metadata: meta,
      };
      console.log(JSON.stringify(log));
      return log.correlationId;
    },
    
    warn: (message: string, meta?: Record<string, any>) => {
      const log: LogContext = {
        correlationId: generateCorrelationId(),
        timestamp: new Date().toISOString(),
        service,
        level: 'warn',
        message,
        metadata: meta,
      };
      console.warn(JSON.stringify(log));
      return log.correlationId;
    },
    
    error: (message: string, error: Error, meta?: Record<string, any>) => {
      const log: LogContext = {
        correlationId: generateCorrelationId(),
        timestamp: new Date().toISOString(),
        service,
        level: 'error',
        message,
        metadata: meta,
        error: {
          message: error.message,
          stack: error.stack,
          code: (error as any).code,
        },
      };
      console.error(JSON.stringify(log));
      return log.correlationId;
    },
  };
}

/**
 * Default logger instance for backward compatibility
 * @deprecated Use createLogger(serviceName) instead
 */
export const logger = createLogger('default');
