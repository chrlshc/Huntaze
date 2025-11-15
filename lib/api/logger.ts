/**
 * Centralized Logger
 * 
 * Structured logging with correlation IDs and log levels
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  level: LogLevel;
  context: string;
  message: string;
  correlationId?: string;
  timestamp: string;
  meta?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export class Logger {
  private context: string;
  private correlationId?: string;
  private minLevel: LogLevel;

  constructor(context: string, correlationId?: string) {
    this.context = context;
    this.correlationId = correlationId;
    this.minLevel = this.getMinLevel();
  }

  /**
   * Set correlation ID for all subsequent logs
   */
  setCorrelationId(correlationId: string): void {
    this.correlationId = correlationId;
  }

  /**
   * Log debug message
   */
  debug(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, meta);
  }

  /**
   * Log info message
   */
  info(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, meta);
  }

  /**
   * Log warning message
   */
  warn(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, meta);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, meta?: Record<string, any>): void {
    const errorMeta = error
      ? {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        }
      : {};

    this.log(LogLevel.ERROR, message, { ...meta, ...errorMeta });
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, meta?: Record<string, any>): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      context: this.context,
      message,
      correlationId: this.correlationId,
      timestamp: new Date().toISOString(),
      ...meta,
    };

    // Format for console
    const formatted = this.format(entry);

    // Output based on level
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.log(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
        console.error(formatted);
        break;
    }

    // Send to external logging service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(entry);
    }
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentIndex = levels.indexOf(level);
    const minIndex = levels.indexOf(this.minLevel);
    return currentIndex >= minIndex;
  }

  /**
   * Get minimum log level from environment
   */
  private getMinLevel(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    
    switch (envLevel) {
      case 'DEBUG':
        return LogLevel.DEBUG;
      case 'INFO':
        return LogLevel.INFO;
      case 'WARN':
        return LogLevel.WARN;
      case 'ERROR':
        return LogLevel.ERROR;
      default:
        return process.env.NODE_ENV === 'production'
          ? LogLevel.INFO
          : LogLevel.DEBUG;
    }
  }

  /**
   * Format log entry for console
   */
  private format(entry: LogEntry): string {
    // Development: Pretty print
    if (process.env.NODE_ENV !== 'production') {
      const parts = [
        `[${entry.level}]`,
        `[${entry.context}]`,
        entry.correlationId ? `[${entry.correlationId}]` : '',
        entry.message,
      ].filter(Boolean);

      const metaStr = entry.meta
        ? '\n' + JSON.stringify(entry.meta, null, 2)
        : '';

      return parts.join(' ') + metaStr;
    }

    // Production: JSON
    return JSON.stringify(entry);
  }

  /**
   * Send log to external service (Sentry, DataDog, etc.)
   */
  private sendToExternalService(entry: LogEntry): void {
    // TODO: Implement integration with logging service
    // Examples:
    // - Sentry.captureMessage(entry.message, { level: entry.level, extra: entry.meta })
    // - DataDog.log(entry)
    // - CloudWatch.putLogEvents([entry])
  }

  /**
   * Create child logger with additional context
   */
  child(additionalContext: string): Logger {
    return new Logger(
      `${this.context}:${additionalContext}`,
      this.correlationId
    );
  }
}

/**
 * Create logger instance
 */
export function createLogger(context: string, correlationId?: string): Logger {
  return new Logger(context, correlationId);
}

/**
 * Global logger for quick access
 */
export const logger = new Logger('App');
