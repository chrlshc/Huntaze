/**
 * Azure Dual-Write Service
 * 
 * Implements dual-write capability during migration from OpenAI/Anthropic to Azure.
 * Writes to both old and new systems simultaneously with consistency verification.
 * 
 * @module azure-dual-write
 */

export interface DualWriteConfig {
  enabled: boolean;
  primaryProvider: 'azure' | 'openai' | 'anthropic';
  secondaryProvider: 'azure' | 'openai' | 'anthropic';
  consistencyCheckEnabled: boolean;
  conflictResolution: 'primary-wins' | 'secondary-wins' | 'latest-wins';
  maxRetries: number;
  retryDelayMs: number;
}

export interface WriteOperation {
  id: string;
  type: 'memory' | 'embedding' | 'preference' | 'interaction';
  data: Record<string, unknown>;
  timestamp: Date;
  correlationId: string;
}

export interface WriteResult {
  operationId: string;
  primarySuccess: boolean;
  secondarySuccess: boolean;
  primaryLatencyMs: number;
  secondaryLatencyMs: number;
  consistencyVerified: boolean;
  conflicts: ConflictRecord[];
}

export interface ConflictRecord {
  field: string;
  primaryValue: unknown;
  secondaryValue: unknown;
  resolution: 'primary' | 'secondary' | 'merged';
  resolvedValue: unknown;
}

export interface ReconciliationResult {
  totalRecords: number;
  matchingRecords: number;
  mismatchedRecords: number;
  missingInPrimary: number;
  missingInSecondary: number;
  reconciled: boolean;
  details: ReconciliationDetail[];
}

export interface ReconciliationDetail {
  recordId: string;
  status: 'match' | 'mismatch' | 'missing-primary' | 'missing-secondary';
  primaryData?: Record<string, unknown>;
  secondaryData?: Record<string, unknown>;
}

export interface DualWriteMetrics {
  totalWrites: number;
  successfulWrites: number;
  failedWrites: number;
  consistencyRate: number;
  averagePrimaryLatencyMs: number;
  averageSecondaryLatencyMs: number;
  conflictCount: number;
}

export class AzureDualWriteService {
  private config: DualWriteConfig;
  private metrics: DualWriteMetrics;
  private writeHistory: Map<string, WriteResult>;


  constructor(config: Partial<DualWriteConfig> = {}) {
    this.config = {
      enabled: true,
      primaryProvider: 'azure',
      secondaryProvider: 'openai',
      consistencyCheckEnabled: true,
      conflictResolution: 'primary-wins',
      maxRetries: 3,
      retryDelayMs: 1000,
      ...config
    };

    this.metrics = {
      totalWrites: 0,
      successfulWrites: 0,
      failedWrites: 0,
      consistencyRate: 100,
      averagePrimaryLatencyMs: 0,
      averageSecondaryLatencyMs: 0,
      conflictCount: 0
    };

    this.writeHistory = new Map();
  }

  /**
   * Execute dual-write operation to both providers
   */
  async write(operation: WriteOperation): Promise<WriteResult> {
    if (!this.config.enabled) {
      // Single write to primary only
      const result = await this.writeToPrimary(operation);
      return {
        operationId: operation.id,
        primarySuccess: result.success,
        secondarySuccess: false,
        primaryLatencyMs: result.latencyMs,
        secondaryLatencyMs: 0,
        consistencyVerified: true,
        conflicts: []
      };
    }

    this.metrics.totalWrites++;

    // Execute writes in parallel
    const [primaryResult, secondaryResult] = await Promise.all([
      this.writeToPrimary(operation),
      this.writeToSecondary(operation)
    ]);

    // Verify consistency if enabled
    let consistencyVerified = true;
    let conflicts: ConflictRecord[] = [];

    if (this.config.consistencyCheckEnabled && primaryResult.success && secondaryResult.success) {
      const consistencyCheck = await this.verifyConsistency(operation.id);
      consistencyVerified = consistencyCheck.consistent;
      conflicts = consistencyCheck.conflicts;
    }

    // Update metrics
    this.updateMetrics(primaryResult, secondaryResult, consistencyVerified, conflicts.length);

    const result: WriteResult = {
      operationId: operation.id,
      primarySuccess: primaryResult.success,
      secondarySuccess: secondaryResult.success,
      primaryLatencyMs: primaryResult.latencyMs,
      secondaryLatencyMs: secondaryResult.latencyMs,
      consistencyVerified,
      conflicts
    };

    this.writeHistory.set(operation.id, result);
    return result;
  }

  /**
   * Write to primary provider with retries
   */
  private async writeToPrimary(operation: WriteOperation): Promise<{ success: boolean; latencyMs: number }> {
    const startTime = Date.now();
    let success = false;
    let attempts = 0;

    while (attempts < this.config.maxRetries && !success) {
      try {
        await this.executeWrite(this.config.primaryProvider, operation);
        success = true;
      } catch {
        attempts++;
        if (attempts < this.config.maxRetries) {
          await this.delay(this.config.retryDelayMs * attempts);
        }
      }
    }

    return {
      success,
      latencyMs: Date.now() - startTime
    };
  }

  /**
   * Write to secondary provider with retries
   */
  private async writeToSecondary(operation: WriteOperation): Promise<{ success: boolean; latencyMs: number }> {
    const startTime = Date.now();
    let success = false;
    let attempts = 0;

    while (attempts < this.config.maxRetries && !success) {
      try {
        await this.executeWrite(this.config.secondaryProvider, operation);
        success = true;
      } catch {
        attempts++;
        if (attempts < this.config.maxRetries) {
          await this.delay(this.config.retryDelayMs * attempts);
        }
      }
    }

    return {
      success,
      latencyMs: Date.now() - startTime
    };
  }


  /**
   * Execute write to specific provider (mock implementation)
   */
  private async executeWrite(provider: string, operation: WriteOperation): Promise<void> {
    // Simulate write operation
    await this.delay(Math.random() * 50 + 10);
    
    // Simulate occasional failures (5% failure rate)
    if (Math.random() < 0.05) {
      throw new Error(`Write failed to ${provider}`);
    }
  }

  /**
   * Verify consistency between primary and secondary
   */
  async verifyConsistency(operationId: string): Promise<{ consistent: boolean; conflicts: ConflictRecord[] }> {
    // Simulate consistency check
    const conflicts: ConflictRecord[] = [];
    
    // In real implementation, would compare data from both providers
    // For now, simulate occasional inconsistencies (2% rate)
    if (Math.random() < 0.02) {
      conflicts.push({
        field: 'timestamp',
        primaryValue: new Date().toISOString(),
        secondaryValue: new Date(Date.now() - 1000).toISOString(),
        resolution: 'primary',
        resolvedValue: new Date().toISOString()
      });
    }

    return {
      consistent: conflicts.length === 0,
      conflicts
    };
  }

  /**
   * Reconcile data between providers
   */
  async reconcile(startDate: Date, endDate: Date): Promise<ReconciliationResult> {
    // Simulate fetching records from both providers
    const primaryRecords = await this.fetchRecords(this.config.primaryProvider, startDate, endDate);
    const secondaryRecords = await this.fetchRecords(this.config.secondaryProvider, startDate, endDate);

    const details: ReconciliationDetail[] = [];
    const allIds = new Set([...primaryRecords.keys(), ...secondaryRecords.keys()]);

    let matchingRecords = 0;
    let mismatchedRecords = 0;
    let missingInPrimary = 0;
    let missingInSecondary = 0;

    for (const id of allIds) {
      const primaryData = primaryRecords.get(id);
      const secondaryData = secondaryRecords.get(id);

      if (!primaryData && secondaryData) {
        missingInPrimary++;
        details.push({ recordId: id, status: 'missing-primary', secondaryData });
      } else if (primaryData && !secondaryData) {
        missingInSecondary++;
        details.push({ recordId: id, status: 'missing-secondary', primaryData });
      } else if (primaryData && secondaryData) {
        const isMatch = this.compareRecords(primaryData, secondaryData);
        if (isMatch) {
          matchingRecords++;
          details.push({ recordId: id, status: 'match', primaryData, secondaryData });
        } else {
          mismatchedRecords++;
          details.push({ recordId: id, status: 'mismatch', primaryData, secondaryData });
        }
      }
    }

    return {
      totalRecords: allIds.size,
      matchingRecords,
      mismatchedRecords,
      missingInPrimary,
      missingInSecondary,
      reconciled: mismatchedRecords === 0 && missingInPrimary === 0 && missingInSecondary === 0,
      details
    };
  }

  /**
   * Fetch records from provider (mock implementation)
   */
  private async fetchRecords(
    _provider: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<Map<string, Record<string, unknown>>> {
    // Simulate fetching records
    const records = new Map<string, Record<string, unknown>>();
    
    // Generate mock records
    for (let i = 0; i < 100; i++) {
      records.set(`record-${i}`, {
        id: `record-${i}`,
        data: `data-${i}`,
        timestamp: new Date().toISOString()
      });
    }

    return records;
  }

  /**
   * Compare two records for equality
   */
  private compareRecords(
    primary: Record<string, unknown>,
    secondary: Record<string, unknown>
  ): boolean {
    // Simple comparison - in real implementation would be more sophisticated
    return JSON.stringify(primary) === JSON.stringify(secondary);
  }


  /**
   * Resolve conflict based on configured strategy
   */
  resolveConflict(
    primaryValue: unknown,
    secondaryValue: unknown,
    primaryTimestamp: Date,
    secondaryTimestamp: Date
  ): { resolution: 'primary' | 'secondary'; value: unknown } {
    switch (this.config.conflictResolution) {
      case 'primary-wins':
        return { resolution: 'primary', value: primaryValue };
      
      case 'secondary-wins':
        return { resolution: 'secondary', value: secondaryValue };
      
      case 'latest-wins':
        if (primaryTimestamp >= secondaryTimestamp) {
          return { resolution: 'primary', value: primaryValue };
        }
        return { resolution: 'secondary', value: secondaryValue };
      
      default:
        return { resolution: 'primary', value: primaryValue };
    }
  }

  /**
   * Update metrics after write operation
   */
  private updateMetrics(
    primaryResult: { success: boolean; latencyMs: number },
    secondaryResult: { success: boolean; latencyMs: number },
    consistencyVerified: boolean,
    conflictCount: number
  ): void {
    if (primaryResult.success && secondaryResult.success) {
      this.metrics.successfulWrites++;
    } else {
      this.metrics.failedWrites++;
    }

    // Update average latencies
    const totalWrites = this.metrics.totalWrites;
    this.metrics.averagePrimaryLatencyMs = 
      (this.metrics.averagePrimaryLatencyMs * (totalWrites - 1) + primaryResult.latencyMs) / totalWrites;
    this.metrics.averageSecondaryLatencyMs = 
      (this.metrics.averageSecondaryLatencyMs * (totalWrites - 1) + secondaryResult.latencyMs) / totalWrites;

    // Update consistency rate
    if (!consistencyVerified) {
      this.metrics.consistencyRate = 
        (this.metrics.consistencyRate * (totalWrites - 1) + 0) / totalWrites;
    } else {
      this.metrics.consistencyRate = 
        (this.metrics.consistencyRate * (totalWrites - 1) + 100) / totalWrites;
    }

    this.metrics.conflictCount += conflictCount;
  }

  /**
   * Get current metrics
   */
  getMetrics(): DualWriteMetrics {
    return { ...this.metrics };
  }

  /**
   * Get write history for an operation
   */
  getWriteResult(operationId: string): WriteResult | undefined {
    return this.writeHistory.get(operationId);
  }

  /**
   * Enable or disable dual-write
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Check if dual-write is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get current configuration
   */
  getConfig(): DualWriteConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<DualWriteConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalWrites: 0,
      successfulWrites: 0,
      failedWrites: 0,
      consistencyRate: 100,
      averagePrimaryLatencyMs: 0,
      averageSecondaryLatencyMs: 0,
      conflictCount: 0
    };
  }

  /**
   * Clear write history
   */
  clearHistory(): void {
    this.writeHistory.clear();
  }

  /**
   * Helper to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const azureDualWriteService = new AzureDualWriteService();
