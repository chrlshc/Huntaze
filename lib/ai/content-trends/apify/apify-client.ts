/**
 * Apify Client Wrapper
 * Content & Trends AI Engine - Phase 4
 * 
 * Wrapper around Apify API for actor management, runs, and data retrieval
 */

import {
  ActorConfig,
  ActorInput,
  ActorRun,
  ActorRunStatus,
  ScrapedData,
  ScheduleConfig,
  WebhookEventType,
  ScrapingHealthReport,
  ScrapingMetrics,
  SocialPlatform,
  IApifyActorManager,
} from './types';
import { getPrimaryActor } from './actor-configs';

// ============================================================================
// Configuration
// ============================================================================

export interface ApifyClientConfig {
  apiToken: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

const DEFAULT_CONFIG: Partial<ApifyClientConfig> = {
  baseUrl: 'https://api.apify.com/v2',
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
};

export class ApifyClientError extends Error {
  name = 'ApifyClientError';

  constructor(
    message: string,
    public status?: number,
    public responseBody?: string
  ) {
    super(message);
  }
}

// ============================================================================
// Apify Client Implementation
// ============================================================================

export class ApifyClient implements IApifyActorManager {
  private config: Required<ApifyClientConfig>;
  private runCache: Map<string, ActorRun> = new Map();
  private healthCache: Map<SocialPlatform, { data: ScrapingHealthReport; timestamp: number }> = new Map();
  private readonly HEALTH_CACHE_TTL = 60000; // 1 minute

  constructor(config: ApifyClientConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    } as Required<ApifyClientConfig>;
  }

  // ==========================================================================
  // Actor Lifecycle
  // ==========================================================================

  /**
   * Get actor configuration for a platform
   */
  getActorConfig(platform: SocialPlatform): ActorConfig {
    const config = getPrimaryActor(platform);
    if (!config) {
      throw new Error(`No actor configuration found for platform: ${platform}`);
    }
    return config;
  }

  /**
   * Run an actor with the specified input
   */
  async runActor(actorId: string, input: ActorInput): Promise<ActorRun> {
    const url = `${this.config.baseUrl}/acts/${actorId}/runs`;
    
    const response = await this.makeRequest<ApifyRunResponse>(url, {
      method: 'POST',
      body: JSON.stringify({
        ...input,
        maxItems: input.maxResults,
      }),
    });

    const run = this.mapRunResponse(response);
    this.runCache.set(run.id, run);
    return run;
  }

  /**
   * Get the status of an actor run
   */
  async getRunStatus(runId: string): Promise<ActorRun> {
    // Check cache first for completed runs
    const cached = this.runCache.get(runId);
    if (cached && this.isTerminalStatus(cached.status)) {
      return cached;
    }

    const url = `${this.config.baseUrl}/actor-runs/${runId}`;
    const response = await this.makeRequest<ApifyRunResponse>(url);
    
    const run = this.mapRunResponse(response);
    this.runCache.set(runId, run);
    return run;
  }

  /**
   * Abort a running actor
   */
  async abortRun(runId: string): Promise<void> {
    const url = `${this.config.baseUrl}/actor-runs/${runId}/abort`;
    await this.makeRequest(url, { method: 'POST' });
    
    // Update cache
    const cached = this.runCache.get(runId);
    if (cached) {
      cached.status = 'ABORTED';
      cached.finishedAt = new Date();
    }
  }

  /**
   * Wait for a run to complete
   */
  async waitForRun(runId: string, options?: { pollInterval?: number; timeout?: number }): Promise<ActorRun> {
    const pollInterval = options?.pollInterval ?? 5000;
    const timeout = options?.timeout ?? 3600000; // 1 hour default
    const startTime = Date.now();

    while (true) {
      const run = await this.getRunStatus(runId);
      
      if (this.isTerminalStatus(run.status)) {
        return run;
      }

      if (Date.now() - startTime > timeout) {
        throw new Error(`Run ${runId} timed out after ${timeout}ms`);
      }

      await this.sleep(pollInterval);
    }
  }

  // ==========================================================================
  // Results Retrieval
  // ==========================================================================

  /**
   * Get items from a dataset
   */
  async getDatasetItems<T extends ScrapedData>(datasetId: string): Promise<T[]> {
    const url = `${this.config.baseUrl}/datasets/${datasetId}/items`;
    const response = await this.makeRequest<T[]>(url);
    return response;
  }

  /**
   * Get paginated items from a dataset
   */
  async getDatasetItemsPaginated<T extends ScrapedData>(
    datasetId: string,
    options?: { offset?: number; limit?: number }
  ): Promise<{ items: T[]; total: number; offset: number; limit: number }> {
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 100;
    
    const url = `${this.config.baseUrl}/datasets/${datasetId}/items?offset=${offset}&limit=${limit}`;
    const response = await this.makeRequest<T[]>(url);
    
    return {
      items: response,
      total: response.length, // Note: Apify returns total in headers
      offset,
      limit,
    };
  }

  /**
   * Get a value from a key-value store
   */
  async getKeyValueStoreValue(storeId: string, key: string): Promise<unknown> {
    const url = `${this.config.baseUrl}/key-value-stores/${storeId}/records/${key}`;
    return this.makeRequest(url);
  }

  /**
   * Get all keys from a key-value store
   */
  async getKeyValueStoreKeys(storeId: string): Promise<string[]> {
    const url = `${this.config.baseUrl}/key-value-stores/${storeId}/keys`;
    const response = await this.makeRequest<{ items: { key: string }[] }>(url);
    return response.items.map(item => item.key);
  }

  // ==========================================================================
  // Scheduling
  // ==========================================================================

  /**
   * Create a schedule for an actor
   */
  async createSchedule(config: ScheduleConfig): Promise<string> {
    const url = `${this.config.baseUrl}/schedules`;
    
    const response = await this.makeRequest<{ data: { id: string } }>(url, {
      method: 'POST',
      body: JSON.stringify({
        name: config.name,
        cronExpression: config.cronExpression,
        timezone: config.timezone,
        isEnabled: config.isEnabled,
        actions: [{
          type: 'RUN_ACTOR',
          actorId: config.actorId,
          runInput: config.actorInput,
        }],
      }),
    });

    return response.data.id;
  }

  /**
   * Update an existing schedule
   */
  async updateSchedule(scheduleId: string, config: Partial<ScheduleConfig>): Promise<void> {
    const url = `${this.config.baseUrl}/schedules/${scheduleId}`;
    
    const updatePayload: Record<string, unknown> = {};
    if (config.name) updatePayload.name = config.name;
    if (config.cronExpression) updatePayload.cronExpression = config.cronExpression;
    if (config.timezone) updatePayload.timezone = config.timezone;
    if (config.isEnabled !== undefined) updatePayload.isEnabled = config.isEnabled;

    await this.makeRequest(url, {
      method: 'PUT',
      body: JSON.stringify(updatePayload),
    });
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    const url = `${this.config.baseUrl}/schedules/${scheduleId}`;
    await this.makeRequest(url, { method: 'DELETE' });
  }

  /**
   * Get all schedules
   */
  async getSchedules(): Promise<ScheduleConfig[]> {
    const url = `${this.config.baseUrl}/schedules`;
    const response = await this.makeRequest<{ data: { items: ApifyScheduleResponse[] } }>(url);
    return response.data.items.map(this.mapScheduleResponse);
  }

  // ==========================================================================
  // Webhooks
  // ==========================================================================

  /**
   * Configure a webhook for an actor
   */
  async configureWebhook(
    actorId: string,
    webhookUrl: string,
    events: WebhookEventType[]
  ): Promise<string> {
    const url = `${this.config.baseUrl}/webhooks`;
    
    const response = await this.makeRequest<{ data: { id: string } }>(url, {
      method: 'POST',
      body: JSON.stringify({
        eventTypes: events,
        condition: {
          actorId,
        },
        requestUrl: webhookUrl,
        payloadTemplate: '{"userId": {{userId}}, "createdAt": {{createdAt}}, "eventType": {{eventType}}, "eventData": {{eventData}}, "resource": {{resource}}}',
      }),
    });

    return response.data.id;
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    const url = `${this.config.baseUrl}/webhooks/${webhookId}`;
    await this.makeRequest(url, { method: 'DELETE' });
  }

  /**
   * Get all webhooks
   */
  async getWebhooks(): Promise<{ id: string; eventTypes: WebhookEventType[]; requestUrl: string }[]> {
    const url = `${this.config.baseUrl}/webhooks`;
    const response = await this.makeRequest<{ data: { items: ApifyWebhookResponse[] } }>(url);
    return response.data.items.map(w => ({
      id: w.id,
      eventTypes: w.eventTypes as WebhookEventType[],
      requestUrl: w.requestUrl,
    }));
  }

  // ==========================================================================
  // Health Monitoring
  // ==========================================================================

  /**
   * Get health report for a platform
   */
  async getHealthReport(platform: SocialPlatform): Promise<ScrapingHealthReport> {
    // Check cache
    const cached = this.healthCache.get(platform);
    if (cached && Date.now() - cached.timestamp < this.HEALTH_CACHE_TTL) {
      return cached.data;
    }

    const actorConfig = this.getActorConfig(platform);
    const runs = await this.getRecentRuns(actorConfig.actorId, 10);
    
    const successfulRuns = runs.filter(r => r.status === 'SUCCEEDED');
    const failedRuns = runs.filter(r => r.status === 'FAILED' || r.status === 'TIMED-OUT');
    
    const report: ScrapingHealthReport = {
      platform,
      status: this.calculateHealthStatus(successfulRuns.length, runs.length),
      lastSuccessfulRun: successfulRuns[0]?.finishedAt,
      successRate: runs.length > 0 ? successfulRuns.length / runs.length : 0,
      averageLatencyMs: this.calculateAverageLatency(successfulRuns),
      errorRate: runs.length > 0 ? failedRuns.length / runs.length : 0,
      activeJobs: runs.filter(r => r.status === 'RUNNING').length,
      queuedJobs: runs.filter(r => r.status === 'READY').length,
      issues: this.extractHealthIssues(failedRuns),
    };

    this.healthCache.set(platform, { data: report, timestamp: Date.now() });
    return report;
  }

  /**
   * Get metrics for a platform
   */
  async getMetrics(
    platform: SocialPlatform,
    timeRange: { from: Date; to: Date }
  ): Promise<ScrapingMetrics> {
    const actorConfig = this.getActorConfig(platform);
    const runs = await this.getRunsInTimeRange(actorConfig.actorId, timeRange);
    
    const successfulRuns = runs.filter(r => r.status === 'SUCCEEDED');
    const totalItems = successfulRuns.reduce((sum, r) => sum + (r.stats?.inputBodyLen ?? 0), 0);
    const totalComputeUnits = successfulRuns.reduce((sum, r) => sum + (r.stats?.computeUnits ?? 0), 0);
    
    const errorTypes: Record<string, number> = {};
    runs.filter(r => r.status === 'FAILED').forEach(_run => {
      const errorType = 'unknown'; // Would need to parse error messages
      errorTypes[errorType] = (errorTypes[errorType] ?? 0) + 1;
    });

    return {
      totalItems,
      successRate: runs.length > 0 ? successfulRuns.length / runs.length : 0,
      averageLatencyMs: this.calculateAverageLatency(successfulRuns),
      errorTypes,
      dataQualityScore: 0.85, // Would need actual quality analysis
      costPerItem: totalItems > 0 ? totalComputeUnits / totalItems : 0,
      computeUnitsUsed: totalComputeUnits,
    };
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  private async makeRequest<T>(url: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.apiToken}`,
      'Content-Type': 'application/json',
    };

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        let response: Response;
        try {
          response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
              ...headers,
              ...(options?.headers as Record<string, string>),
            },
          });
        } finally {
          clearTimeout(timeoutId);
        }

        if (!response.ok) {
          const errorBody = await response.text();
          throw new ApifyClientError(
            `Apify API error: ${response.status} - ${errorBody}`,
            response.status,
            errorBody
          );
        }

        // Handle empty responses
        const text = await response.text();
        if (!text) return {} as T;
        
        return JSON.parse(text) as T;
      } catch (error) {
        lastError = error as Error;

        // Don't retry on timeouts if we're on last attempt
        if (lastError.name === 'AbortError' && attempt >= this.config.maxRetries - 1) {
          throw new ApifyClientError(`Apify API timeout after ${this.config.timeout}ms`);
        }
        
        // Don't retry on 4xx errors
        if (lastError instanceof ApifyClientError && lastError.status && lastError.status >= 400 && lastError.status < 500) {
          throw lastError;
        }
        
        if (attempt < this.config.maxRetries - 1) {
          await this.sleep(this.config.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError ?? new Error('Request failed after retries');
  }

  private async getRecentRuns(actorId: string, limit: number): Promise<ActorRun[]> {
    const url = `${this.config.baseUrl}/acts/${actorId}/runs?limit=${limit}&desc=true`;
    const response = await this.makeRequest<{ data: { items: ApifyRunResponse[] } }>(url);
    return response.data.items.map(this.mapRunResponse);
  }

  private async getRunsInTimeRange(
    actorId: string,
    timeRange: { from: Date; to: Date }
  ): Promise<ActorRun[]> {
    const url = `${this.config.baseUrl}/acts/${actorId}/runs?limit=100&desc=true`;
    const response = await this.makeRequest<{ data: { items: ApifyRunResponse[] } }>(url);
    
    return response.data.items
      .map(this.mapRunResponse)
      .filter(run => {
        const startedAt = run.startedAt?.getTime() ?? 0;
        return startedAt >= timeRange.from.getTime() && startedAt <= timeRange.to.getTime();
      });
  }

  private mapRunResponse(response: ApifyRunResponse): ActorRun {
    return {
      id: response.id,
      actorId: response.actId,
      status: response.status as ActorRunStatus,
      startedAt: response.startedAt ? new Date(response.startedAt) : undefined,
      finishedAt: response.finishedAt ? new Date(response.finishedAt) : undefined,
      buildId: response.buildId,
      defaultKeyValueStoreId: response.defaultKeyValueStoreId,
      defaultDatasetId: response.defaultDatasetId,
      defaultRequestQueueId: response.defaultRequestQueueId,
      stats: response.stats ? {
        inputBodyLen: response.stats.inputBodyLen,
        restartCount: response.stats.restartCount,
        resurrectCount: response.stats.resurrectCount,
        memAvgBytes: response.stats.memAvgBytes,
        memMaxBytes: response.stats.memMaxBytes,
        memCurrentBytes: response.stats.memCurrentBytes,
        cpuAvgUsage: response.stats.cpuAvgUsage,
        cpuMaxUsage: response.stats.cpuMaxUsage,
        cpuCurrentUsage: response.stats.cpuCurrentUsage,
        netRxBytes: response.stats.netRxBytes,
        netTxBytes: response.stats.netTxBytes,
        durationMillis: response.stats.durationMillis,
        runTimeSecs: response.stats.runTimeSecs,
        computeUnits: response.stats.computeUnits,
      } : undefined,
    };
  }

  private mapScheduleResponse(response: ApifyScheduleResponse): ScheduleConfig {
    const actorInput = response.actions?.[0]?.runInput ?? {};
    return {
      id: response.id,
      name: response.name,
      cronExpression: response.cronExpression,
      timezone: response.timezone,
      isEnabled: response.isEnabled,
      actorId: response.actions?.[0]?.actorId ?? '',
      actorInput: {
        ...actorInput,
        maxResults: (actorInput as Record<string, unknown>).maxResults as number ?? 50,
      },
    };
  }

  private isTerminalStatus(status: ActorRunStatus): boolean {
    return ['SUCCEEDED', 'FAILED', 'TIMED-OUT', 'ABORTED'].includes(status);
  }

  private calculateHealthStatus(
    successCount: number,
    totalCount: number
  ): 'healthy' | 'degraded' | 'unhealthy' {
    if (totalCount === 0) return 'healthy';
    const rate = successCount / totalCount;
    if (rate >= 0.9) return 'healthy';
    if (rate >= 0.7) return 'degraded';
    return 'unhealthy';
  }

  private calculateAverageLatency(runs: ActorRun[]): number {
    if (runs.length === 0) return 0;
    const totalLatency = runs.reduce((sum, r) => sum + (r.stats?.durationMillis ?? 0), 0);
    return totalLatency / runs.length;
  }

  private extractHealthIssues(failedRuns: ActorRun[]): ScrapingHealthReport['issues'] {
    // In a real implementation, we would parse error messages
    return failedRuns.slice(0, 5).map(run => ({
      type: 'unknown' as const,
      message: `Run ${run.id} failed`,
      occurredAt: run.finishedAt ?? new Date(),
      resolved: false,
    }));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// API Response Types
// ============================================================================

interface ApifyRunResponse {
  id: string;
  actId: string;
  status: string;
  startedAt?: string;
  finishedAt?: string;
  buildId: string;
  defaultKeyValueStoreId: string;
  defaultDatasetId: string;
  defaultRequestQueueId: string;
  stats?: {
    inputBodyLen: number;
    restartCount: number;
    resurrectCount: number;
    memAvgBytes: number;
    memMaxBytes: number;
    memCurrentBytes: number;
    cpuAvgUsage: number;
    cpuMaxUsage: number;
    cpuCurrentUsage: number;
    netRxBytes: number;
    netTxBytes: number;
    durationMillis: number;
    runTimeSecs: number;
    computeUnits: number;
  };
}

interface ApifyScheduleResponse {
  id: string;
  name: string;
  cronExpression: string;
  timezone: string;
  isEnabled: boolean;
  actions?: {
    type: string;
    actorId: string;
    runInput: Record<string, unknown>;
  }[];
}

interface ApifyWebhookResponse {
  id: string;
  eventTypes: string[];
  requestUrl: string;
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create an Apify client instance
 */
export function createApifyClient(config?: Partial<ApifyClientConfig>): ApifyClient {
  const apiToken = config?.apiToken ?? process.env.APIFY_API_TOKEN;
  
  if (!apiToken) {
    throw new Error('Apify API token is required. Set APIFY_API_TOKEN environment variable or pass it in config.');
  }

  return new ApifyClient({
    ...config,
    apiToken,
  });
}
