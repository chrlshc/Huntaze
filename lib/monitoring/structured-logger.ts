interface LogContext {
  service?: string;
  environment?: string;
  [key: string]: unknown;
}

class StructuredLogger {
  private baseContext: LogContext;

  constructor(baseContext: LogContext = {}) {
    this.baseContext = {
      service: 'huntaze-api',
      environment: process.env.NODE_ENV,
      ...baseContext,
    };
  }

  info(event: string, data: Record<string, unknown> = {}) {
    this.log('info', event, data);
  }

  warn(event: string, data: Record<string, unknown> = {}) {
    this.log('warn', event, data);
  }

  error(event: string, data: Record<string, unknown> = {}) {
    this.log('error', event, data);
  }

  private log(level: 'info' | 'warn' | 'error', event: string, data: Record<string, unknown>) {
    const payload = {
      level,
      event,
      timestamp: new Date().toISOString(),
      ...this.baseContext,
      ...sanitizeLogPayload(data),
    };

    const serialized = JSON.stringify(payload);
    if (level === 'error') console.error(serialized);
    else if (level === 'warn') console.warn(serialized);
    else console.log(serialized);
  }
}

function sanitizeLogPayload(data: Record<string, unknown>) {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' && /token|password|secret|apiKey/i.test(key)) {
      sanitized[key] = 'REDACTED';
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export const structuredLogger = new StructuredLogger();
