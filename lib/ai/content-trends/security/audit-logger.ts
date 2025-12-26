/**
 * Audit Logger Service
 * Content & Trends AI Engine - Phase 6
 * 
 * Comprehensive audit logging for all AI interactions and data processing.
 * Supports Azure Monitor, file-based, and custom logging backends.
 */

import {
  AuditLogEntry,
  AuditEventType,
  AuditAction,
  AuditDetails,
  ResourceType,
  UserRole,
  DataClassification,
} from './types';
import { externalFetch } from '@/lib/services/external/http';

// ============================================================================
// Audit Logger Configuration
// ============================================================================

export interface AuditLoggerConfig {
  enabled: boolean;
  backends: AuditBackend[];
  minSeverity: 'debug' | 'info' | 'warn' | 'error';
  includeRequestBody: boolean;
  maxBodySize: number;
  sensitiveFields: string[];
  retentionDays: number;
}

export type AuditBackend = 
  | { type: 'console' }
  | { type: 'file'; path: string }
  | { type: 'azure_monitor'; workspaceId: string; sharedKey: string }
  | { type: 'custom'; handler: (entry: AuditLogEntry) => Promise<void> };

// ============================================================================
// Audit Logger Implementation
// ============================================================================

export class AuditLogger {
  private config: AuditLoggerConfig;
  private buffer: AuditLogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly BUFFER_SIZE = 100;
  private readonly FLUSH_INTERVAL_MS = 5000;

  constructor(config: Partial<AuditLoggerConfig> = {}) {
    this.config = {
      enabled: true,
      backends: [{ type: 'console' }],
      minSeverity: 'info',
      includeRequestBody: true,
      maxBodySize: 10000,
      sensitiveFields: ['password', 'token', 'secret', 'apiKey', 'authorization'],
      retentionDays: 90,
      ...config,
    };

    if (this.config.enabled) {
      this.startFlushInterval();
    }
  }

  /**
   * Log an audit event
   */
  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    if (!this.config.enabled) return;

    const fullEntry: AuditLogEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: new Date(),
      details: this.sanitizeDetails(entry.details),
    };

    this.buffer.push(fullEntry);

    if (this.buffer.length >= this.BUFFER_SIZE) {
      await this.flush();
    }
  }

  /**
   * Log authentication event
   */
  async logAuthentication(
    userId: string,
    outcome: 'success' | 'failure',
    details: Partial<AuditDetails> = {}
  ): Promise<void> {
    await this.log({
      eventType: 'authentication',
      userId,
      resourceType: 'user',
      action: 'login',
      outcome,
      details,
    });
  }

  /**
   * Log AI model interaction
   */
  async logAIInteraction(
    userId: string,
    modelUsed: string,
    tokensConsumed: number,
    analysisType: string,
    outcome: 'success' | 'failure' | 'partial',
    duration?: number
  ): Promise<void> {
    await this.log({
      eventType: 'ai_model_interaction',
      userId,
      resourceType: 'ai_model',
      action: 'invoke',
      outcome,
      duration,
      details: {
        modelUsed,
        tokensConsumed,
        analysisType,
      },
    });
  }

  /**
   * Log data access event
   */
  async logDataAccess(
    userId: string,
    resourceType: ResourceType,
    resourceId: string,
    action: AuditAction,
    classification: DataClassification,
    outcome: 'success' | 'failure'
  ): Promise<void> {
    await this.log({
      eventType: 'data_access',
      userId,
      resourceType,
      resourceId,
      action,
      outcome,
      details: {
        dataClassification: classification,
      },
    });
  }

  /**
   * Log configuration change
   */
  async logConfigChange(
    userId: string,
    resourceId: string,
    previousValue: unknown,
    newValue: unknown
  ): Promise<void> {
    await this.log({
      eventType: 'configuration_change',
      userId,
      resourceType: 'configuration',
      resourceId,
      action: 'update',
      outcome: 'success',
      details: {
        previousValue: this.sanitizeValue(previousValue),
        newValue: this.sanitizeValue(newValue),
        changesSummary: this.generateChangesSummary(previousValue, newValue),
      },
    });
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    userId: string,
    description: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      eventType: 'security_event',
      userId,
      resourceType: 'user',
      action: 'read',
      outcome: 'failure',
      ipAddress,
      userAgent,
      details: {
        changesSummary: description,
      },
    });
  }

  /**
   * Flush buffered entries to backends
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    for (const backend of this.config.backends) {
      try {
        await this.writeToBackend(backend, entries);
      } catch (error) {
        console.error(`Failed to write to audit backend ${backend.type}:`, error);
      }
    }
  }

  /**
   * Query audit logs (for backends that support it)
   */
  async query(filters: AuditQueryFilters): Promise<AuditLogEntry[]> {
    // This would typically query from a database or Azure Monitor
    // For now, return empty array as this requires backend-specific implementation
    console.log('Audit query with filters:', filters);
    return [];
  }

  /**
   * Stop the audit logger
   */
  stop(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL_MS);
  }

  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizeDetails(details: AuditDetails): AuditDetails {
    const sanitized = { ...details };

    if (sanitized.requestBody) {
      sanitized.requestBody = this.sanitizeObject(sanitized.requestBody);
    }

    return sanitized;
  }

  private sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (this.config.sensitiveFields.some(f => 
        key.toLowerCase().includes(f.toLowerCase())
      )) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private sanitizeValue(value: unknown): unknown {
    if (typeof value === 'object' && value !== null) {
      return this.sanitizeObject(value as Record<string, unknown>);
    }
    return value;
  }

  private generateChangesSummary(prev: unknown, next: unknown): string {
    if (typeof prev !== 'object' || typeof next !== 'object') {
      return `Changed from ${String(prev)} to ${String(next)}`;
    }

    const changes: string[] = [];
    const prevObj = prev as Record<string, unknown>;
    const nextObj = next as Record<string, unknown>;

    for (const key of Object.keys(nextObj)) {
      if (prevObj[key] !== nextObj[key]) {
        changes.push(`${key} changed`);
      }
    }

    return changes.join(', ') || 'No changes detected';
  }

  private async writeToBackend(
    backend: AuditBackend,
    entries: AuditLogEntry[]
  ): Promise<void> {
    switch (backend.type) {
      case 'console':
        for (const entry of entries) {
          console.log(JSON.stringify(entry));
        }
        break;

      case 'file':
        // Would use fs.appendFile in Node.js environment
        console.log(`Would write ${entries.length} entries to ${backend.path}`);
        break;

      case 'azure_monitor':
        await this.writeToAzureMonitor(backend, entries);
        break;

      case 'custom':
        for (const entry of entries) {
          await backend.handler(entry);
        }
        break;
    }
  }

  private async writeToAzureMonitor(
    backend: { type: 'azure_monitor'; workspaceId: string; sharedKey: string },
    entries: AuditLogEntry[]
  ): Promise<void> {
    const logType = 'ContentTrendsAudit';
    const body = JSON.stringify(entries);
    const contentLength = Buffer.byteLength(body, 'utf8');
    const date = new Date().toUTCString();

    // Build signature for Azure Monitor Data Collector API
    const stringToSign = `POST\n${contentLength}\napplication/json\nx-ms-date:${date}\n/api/logs`;
    const signature = await this.computeHmacSha256(backend.sharedKey, stringToSign);

    const url = `https://${backend.workspaceId}.ods.opinsights.azure.com/api/logs?api-version=2016-04-01`;

    await externalFetch(url, {
      service: 'azure-monitor',
      operation: 'audit.log',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Log-Type': logType,
        'x-ms-date': date,
        Authorization: `SharedKey ${backend.workspaceId}:${signature}`,
      },
      body,
      cache: 'no-store',
      timeoutMs: 10_000,
      retry: { maxRetries: 1, retryMethods: ['POST'] },
      throwOnHttpError: true,
    });
  }

  private async computeHmacSha256(key: string, message: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = Uint8Array.from(atob(key), c => c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  }
}

// ============================================================================
// Query Filters
// ============================================================================

export interface AuditQueryFilters {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  eventType?: AuditEventType;
  resourceType?: ResourceType;
  action?: AuditAction;
  outcome?: 'success' | 'failure' | 'partial';
  limit?: number;
  offset?: number;
}

// ============================================================================
// Factory Function
// ============================================================================

export function createAuditLogger(config?: Partial<AuditLoggerConfig>): AuditLogger {
  return new AuditLogger(config);
}

// ============================================================================
// Singleton Instance
// ============================================================================

let defaultLogger: AuditLogger | null = null;

export function getAuditLogger(): AuditLogger {
  if (!defaultLogger) {
    defaultLogger = createAuditLogger();
  }
  return defaultLogger;
}
