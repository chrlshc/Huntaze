/**
 * Structured Logging Utility
 * Provides consistent logging across the application with context and metadata
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogContext {
  userId?: string;
  platform?: string;
  action?: string;
  correlationId?: string;
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

class Logger {
  private serviceName: string;

  constructor(serviceName: string = 'huntaze') {
    this.serviceName = serviceName;
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        service: this.serviceName,
      },
    };

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      };
    }

    // Redact sensitive data
    if (entry.context) {
      entry.context = this.redactSensitiveData(entry.context);
    }

    // Output based on environment
    if (process.env.NODE_ENV === 'production') {
      // In production, output JSON for log aggregation
      console.log(JSON.stringify(entry));
    } else {
      // In development, output human-readable format
      const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
      const errorStr = entry.error ? `\n  Error: ${entry.error.message}\n  ${entry.error.stack}` : '';
      
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(`[${entry.timestamp}] DEBUG: ${message}${contextStr}${errorStr}`);
          break;
        case LogLevel.INFO:
          console.info(`[${entry.timestamp}] INFO: ${message}${contextStr}${errorStr}`);
          break;
        case LogLevel.WARN:
          console.warn(`[${entry.timestamp}] WARN: ${message}${contextStr}${errorStr}`);
          break;
        case LogLevel.ERROR:
          console.error(`[${entry.timestamp}] ERROR: ${message}${contextStr}${errorStr}`);
          break;
      }
    }
  }

  private redactSensitiveData(context: LogContext): LogContext {
    const redacted = { ...context };
    const sensitiveKeys = ['access_token', 'refresh_token', 'password', 'secret', 'apiKey', 'api_key'];

    for (const key of Object.keys(redacted)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        redacted[key] = '[REDACTED]';
      }
    }

    return redacted;
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.WARN, message, context, error);
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  // OAuth-specific logging
  oauthEvent(event: string, platform: string, context?: LogContext): void {
    this.info(`OAuth: ${event}`, {
      ...context,
      platform,
      action: 'oauth',
    });
  }

  // API call logging
  apiCall(method: string, url: string, statusCode: number, latency: number, context?: LogContext): void {
    this.info(`API Call: ${method} ${url}`, {
      ...context,
      method,
      url,
      statusCode,
      latency,
      action: 'api_call',
    });
  }

  // Webhook logging
  webhookEvent(platform: string, eventType: string, context?: LogContext): void {
    this.info(`Webhook: ${platform} - ${eventType}`, {
      ...context,
      platform,
      eventType,
      action: 'webhook',
    });
  }

  // Worker logging
  workerEvent(workerName: string, event: string, context?: LogContext): void {
    this.info(`Worker: ${workerName} - ${event}`, {
      ...context,
      workerName,
      action: 'worker',
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export factory for creating loggers with specific service names
export function createLogger(serviceName: string): Logger {
  return new Logger(serviceName);
}
