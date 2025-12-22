/**
 * Azure Monitor Service
 * Content & Trends AI Engine - Phase 6
 * 
 * Integration with Azure Monitor for telemetry collection,
 * custom metrics, and distributed tracing.
 */

import {
  AzureMonitorConfig,
  MetricValue,
  CustomEvent,
  Trace,
  TraceSeverity,
} from './types';

// ============================================================================
// Azure Monitor Service Implementation
// ============================================================================

export class AzureMonitorService {
  private config: AzureMonitorConfig;
  private metricsBuffer: MetricValue[] = [];
  private eventsBuffer: CustomEvent[] = [];
  private tracesBuffer: Trace[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly BUFFER_SIZE = 500;
  private readonly FLUSH_INTERVAL_MS = 15000;

  constructor(config: AzureMonitorConfig) {
    this.config = config;
    this.startFlushInterval();
  }

  /**
   * Track a custom metric
   */
  trackMetric(metric: MetricValue): void {
    this.metricsBuffer.push(metric);
    if (this.metricsBuffer.length >= this.BUFFER_SIZE) {
      this.flushMetrics();
    }
  }

  /**
   * Track a custom event
   */
  trackEvent(
    name: string,
    properties: Record<string, string> = {},
    measurements: Record<string, number> = {}
  ): void {
    this.eventsBuffer.push({
      name,
      properties,
      measurements,
      timestamp: new Date(),
    });

    if (this.eventsBuffer.length >= this.BUFFER_SIZE) {
      this.flushEvents();
    }
  }

  /**
   * Track a trace message
   */
  trackTrace(
    message: string,
    severityLevel: TraceSeverity = 'information',
    properties: Record<string, string> = {}
  ): void {
    this.tracesBuffer.push({
      message,
      severityLevel,
      properties,
      timestamp: new Date(),
    });

    if (this.tracesBuffer.length >= this.BUFFER_SIZE) {
      this.flushTraces();
    }
  }

  /**
   * Track an exception
   */
  trackException(
    error: Error,
    properties: Record<string, string> = {}
  ): void {
    this.trackTrace(
      `Exception: ${error.message}\n${error.stack || ''}`,
      'error',
      {
        ...properties,
        errorName: error.name,
        errorMessage: error.message,
      }
    );
  }

  /**
   * Track a dependency call (external service)
   */
  trackDependency(
    name: string,
    target: string,
    duration: number,
    success: boolean,
    resultCode: string,
    properties: Record<string, string> = {}
  ): void {
    this.trackEvent('Dependency', {
      ...properties,
      dependencyName: name,
      target,
      resultCode,
      success: String(success),
    }, {
      duration,
    });
  }

  /**
   * Track a request
   */
  trackRequest(
    name: string,
    url: string,
    duration: number,
    responseCode: number,
    success: boolean,
    properties: Record<string, string> = {}
  ): void {
    this.trackEvent('Request', {
      ...properties,
      requestName: name,
      url,
      responseCode: String(responseCode),
      success: String(success),
    }, {
      duration,
    });
  }

  /**
   * Flush all buffered telemetry
   */
  async flush(): Promise<void> {
    await Promise.all([
      this.flushMetrics(),
      this.flushEvents(),
      this.flushTraces(),
    ]);
  }

  /**
   * Stop the service
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

  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    const metrics = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      await this.sendToAzureMonitor('metrics', metrics);
    } catch (error) {
      console.error('Failed to flush metrics to Azure Monitor:', error);
      // Re-add metrics to buffer for retry
      this.metricsBuffer.unshift(...metrics.slice(0, this.BUFFER_SIZE - this.metricsBuffer.length));
    }
  }

  private async flushEvents(): Promise<void> {
    if (this.eventsBuffer.length === 0) return;

    const events = [...this.eventsBuffer];
    this.eventsBuffer = [];

    try {
      await this.sendToAzureMonitor('events', events);
    } catch (error) {
      console.error('Failed to flush events to Azure Monitor:', error);
    }
  }

  private async flushTraces(): Promise<void> {
    if (this.tracesBuffer.length === 0) return;

    const traces = [...this.tracesBuffer];
    this.tracesBuffer = [];

    try {
      await this.sendToAzureMonitor('traces', traces);
    } catch (error) {
      console.error('Failed to flush traces to Azure Monitor:', error);
    }
  }

  private async sendToAzureMonitor(
    type: 'metrics' | 'events' | 'traces',
    data: unknown[]
  ): Promise<void> {
    // Azure Monitor Data Collector API
    const url = `https://${this.config.workspaceId}.ods.opinsights.azure.com/api/logs?api-version=2016-04-01`;
    const logType = `ContentTrends_${type.charAt(0).toUpperCase() + type.slice(1)}`;

    const body = JSON.stringify(data);
    const contentLength = Buffer.byteLength(body, 'utf8');
    const date = new Date().toUTCString();

    const stringToSign = `POST\n${contentLength}\napplication/json\nx-ms-date:${date}\n/api/logs`;
    const signature = await this.computeSignature(stringToSign);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Log-Type': logType,
        'x-ms-date': date,
        Authorization: `SharedKey ${this.config.workspaceId}:${signature}`,
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`Azure Monitor API error: ${response.statusText}`);
    }
  }

  private async computeSignature(stringToSign: string): Promise<string> {
    // Extract shared key from connection string
    const sharedKey = this.extractSharedKey();
    
    const encoder = new TextEncoder();
    const keyData = Uint8Array.from(atob(sharedKey), c => c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(stringToSign));
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  }

  private extractSharedKey(): string {
    // Parse connection string to extract shared key
    const parts = this.config.connectionString.split(';');
    for (const part of parts) {
      if (part.startsWith('SharedAccessKey=')) {
        return part.substring('SharedAccessKey='.length);
      }
    }
    throw new Error('SharedAccessKey not found in connection string');
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createAzureMonitorService(config?: Partial<AzureMonitorConfig>): AzureMonitorService {
  const defaultConfig: AzureMonitorConfig = {
    workspaceId: process.env.AZURE_MONITOR_WORKSPACE_ID || '',
    instrumentationKey: process.env.AZURE_MONITOR_INSTRUMENTATION_KEY || '',
    connectionString: process.env.AZURE_MONITOR_CONNECTION_STRING || '',
    resourceId: process.env.AZURE_MONITOR_RESOURCE_ID || '',
    enableLiveMetrics: true,
    samplingPercentage: 100,
  };

  return new AzureMonitorService({ ...defaultConfig, ...config });
}
