/**
 * TikTok OAuth Service - Centralized Logger
 * 
 * Provides structured logging with correlation IDs and log levels
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogMeta {
  correlationId?: string;
  userId?: string;
  endpoint?: string;
  duration?: number;
  [key: string]: string | number | boolean | string[] | null | undefined;
}

export class TikTokLogger {
  private level: LogLevel;
  private prefix: string;

  constructor(level: LogLevel = LogLevel.INFO, prefix: string = 'TikTok') {
    this.level = level;
    this.prefix = prefix;
  }

  /**
   * Generate correlation ID for request tracing
   */
  generateCorrelationId(): string {
    return `tt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Debug level logging
   */
  debug(message: string, meta?: LogMeta): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(this.formatMessage('DEBUG', message), this.formatMeta(meta));
    }
  }

  /**
   * Info level logging
   */
  info(message: string, meta?: LogMeta): void {
    if (this.level <= LogLevel.INFO) {
      console.log(this.formatMessage('INFO', message), this.formatMeta(meta));
    }
  }

  /**
   * Warning level logging
   */
  warn(message: string, meta?: LogMeta): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', message), this.formatMeta(meta));
    }
  }

  /**
   * Error level logging
   */
  error(message: string, error: Error, meta?: LogMeta): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(this.formatMessage('ERROR', message), {
        error: error.message,
        stack: error.stack,
        ...this.formatMeta(meta),
      });
    }
  }

  /**
   * Format log message with timestamp and prefix
   */
  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${this.prefix}] [${level}] ${message}`;
  }

  /**
   * Format metadata for logging
   */
  private formatMeta(meta?: LogMeta): LogMeta | undefined {
    if (!meta) return undefined;

    return {
      ...meta,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Set log level dynamically
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.level;
  }
}

// Export singleton instance
export const tiktokLogger = new TikTokLogger(
  process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO
);
