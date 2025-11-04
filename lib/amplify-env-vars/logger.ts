/**
 * Logger utility for AWS Amplify Environment Variables Management
 */

import { ILogger } from './interfaces';

export class Logger implements ILogger {
  private logLevel: 'debug' | 'info' | 'warn' | 'error';

  constructor(logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info') {
    this.logLevel = logLevel;
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog('info')) {
      this.log('INFO', message, meta);
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog('warn')) {
      this.log('WARN', message, meta);
    }
  }

  error(message: string, error?: Error, meta?: any): void {
    if (this.shouldLog('error')) {
      const errorMeta = error ? {
        ...meta,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      } : meta;
      
      this.log('ERROR', message, errorMeta);
    }
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog('debug')) {
      this.log('DEBUG', message, meta);
    }
  }

  audit(action: string, appId: string, branchName: string, meta?: any): void {
    const auditMeta = {
      action,
      appId,
      branchName,
      timestamp: new Date().toISOString(),
      ...meta
    };
    
    this.log('AUDIT', `Action: ${action}`, auditMeta);
  }

  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex >= currentLevelIndex;
  }

  private log(level: string, message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(meta && { meta })
    };

    // In a real implementation, you might want to use a proper logging library
    // For now, we'll use console with structured output
    if (level === 'ERROR') {
      console.error(JSON.stringify(logEntry, null, 2));
    } else if (level === 'WARN') {
      console.warn(JSON.stringify(logEntry, null, 2));
    } else {
      console.log(JSON.stringify(logEntry, null, 2));
    }
  }
}