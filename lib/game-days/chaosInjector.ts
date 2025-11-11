/**
 * Chaos Injector
 * Controlled failure injection for Game Day scenarios
 */

export enum FailureType {
  SERVICE_TERMINATION = 'SERVICE_TERMINATION',
  NETWORK_LATENCY = 'NETWORK_LATENCY',
  NETWORK_PARTITION = 'NETWORK_PARTITION',
  RESOURCE_EXHAUSTION = 'RESOURCE_EXHAUSTION',
  DATABASE_FAILURE = 'DATABASE_FAILURE',
  CACHE_FAILURE = 'CACHE_FAILURE',
  DISK_FAILURE = 'DISK_FAILURE',
  MEMORY_LEAK = 'MEMORY_LEAK',
  CPU_SPIKE = 'CPU_SPIKE',
  CONFIGURATION_CORRUPTION = 'CONFIGURATION_CORRUPTION'
}

export interface FailureInjection {
  id: string;
  type: FailureType;
  target: string;
  parameters: Record<string, any>;
  startTime: number;
  duration: number; // milliseconds
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'STOPPED';
  impact: FailureImpact;
}

export interface FailureImpact {
  affectedServices: string[];
  expectedBehavior: string;
  recoveryProcedure: string;
  blastRadius: 'MINIMAL' | 'LIMITED' | 'MODERATE' | 'EXTENSIVE';
}

export interface ChaosConfig {
  enabled: boolean;
  safetyMode: boolean;
  maxConcurrentFailures: number;
  allowedEnvironments: string[];
  blastRadiusLimits: {
    minimal: number;
    limited: number;
    moderate: number;
    extensive: number;
  };
}

class ChaosInjector {
  private activeFailures = new Map<string, FailureInjection>();
  private config: ChaosConfig;
  private failureHistory: FailureInjection[] = [];

  constructor(config: ChaosConfig) {
    this.config = config;
  }

  async injectFailure(
    type: FailureType,
    target: string,
    duration: number,
    parameters: Record<string, any> = {}
  ): Promise<string> {
    // Safety checks
    this.validateFailureInjection(type, target, parameters);

    const failureId = this.generateFailureId();
    const failure: FailureInjection = {
      id: failureId,
      type,
      target,
      parameters,
      startTime: Date.now(),
      duration,
      status: 'ACTIVE',
      impact: this.calculateImpact(type, target, parameters)
    };

    try {
      // Execute failure injection
      await this.executeFailureInjection(failure);
      
      // Track active failure
      this.activeFailures.set(failureId, failure);
      
      // Schedule automatic recovery
      setTimeout(() => {
        this.stopFailure(failureId).catch(console.error);
      }, duration);

      console.log(`🔥 Chaos injection started: ${type} on ${target} for ${duration}ms`);
      
      return failureId;
    } catch (error) {
      failure.status = 'FAILED';
      this.failureHistory.push(failure);
      throw new Error(`Failed to inject ${type}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async stopFailure(failureId: string): Promise<void> {
    const failure = this.activeFailures.get(failureId);
    if (!failure) {
      throw new Error(`Failure ${failureId} not found or already stopped`);
    }

    try {
      // Execute recovery procedure
      await this.executeRecoveryProcedure(failure);
      
      // Update status
      failure.status = 'COMPLETED';
      
      // Move to history
      this.activeFailures.delete(failureId);
      this.failureHistory.push(failure);

      console.log(`✅ Chaos injection stopped: ${failure.type} on ${failure.target}`);
    } catch (error) {
      failure.status = 'FAILED';
      console.error(`❌ Failed to stop chaos injection ${failureId}:`, error);
      throw error;
    }
  }

  async stopAllFailures(): Promise<void> {
    const activeFailureIds = Array.from(this.activeFailures.keys());
    
    console.log(`🛑 Stopping all active chaos injections (${activeFailureIds.length})`);
    
    const stopPromises = activeFailureIds.map(id => 
      this.stopFailure(id).catch(error => 
        console.error(`Failed to stop failure ${id}:`, error)
      )
    );

    await Promise.all(stopPromises);
  }

  private async executeFailureInjection(failure: FailureInjection): Promise<void> {
    switch (failure.type) {
      case FailureType.SERVICE_TERMINATION:
        await this.injectServiceTermination(failure);
        break;
      case FailureType.NETWORK_LATENCY:
        await this.injectNetworkLatency(failure);
        break;
      case FailureType.NETWORK_PARTITION:
        await this.injectNetworkPartition(failure);
        break;
      case FailureType.RESOURCE_EXHAUSTION:
        await this.injectResourceExhaustion(failure);
        break;
      case FailureType.DATABASE_FAILURE:
        await this.injectDatabaseFailure(failure);
        break;
      case FailureType.CACHE_FAILURE:
        await this.injectCacheFailure(failure);
        break;
      case FailureType.MEMORY_LEAK:
        await this.injectMemoryLeak(failure);
        break;
      case FailureType.CPU_SPIKE:
        await this.injectCpuSpike(failure);
        break;
      case FailureType.CONFIGURATION_CORRUPTION:
        await this.injectConfigurationCorruption(failure);
        break;
      default:
        throw new Error(`Unsupported failure type: ${failure.type}`);
    }
  }

  private async executeRecoveryProcedure(failure: FailureInjection): Promise<void> {
    switch (failure.type) {
      case FailureType.SERVICE_TERMINATION:
        await this.recoverServiceTermination(failure);
        break;
      case FailureType.NETWORK_LATENCY:
        await this.recoverNetworkLatency(failure);
        break;
      case FailureType.NETWORK_PARTITION:
        await this.recoverNetworkPartition(failure);
        break;
      case FailureType.RESOURCE_EXHAUSTION:
        await this.recoverResourceExhaustion(failure);
        break;
      case FailureType.DATABASE_FAILURE:
        await this.recoverDatabaseFailure(failure);
        break;
      case FailureType.CACHE_FAILURE:
        await this.recoverCacheFailure(failure);
        break;
      case FailureType.MEMORY_LEAK:
        await this.recoverMemoryLeak(failure);
        break;
      case FailureType.CPU_SPIKE:
        await this.recoverCpuSpike(failure);
        break;
      case FailureType.CONFIGURATION_CORRUPTION:
        await this.recoverConfigurationCorruption(failure);
        break;
    }
  }

  // Failure injection implementations
  private async injectServiceTermination(failure: FailureInjection): Promise<void> {
    // Simulate service termination
    console.log(`🔥 Terminating service: ${failure.target}`);
    
    // In production, this would:
    // - Stop specific service processes
    // - Update load balancer to remove unhealthy instances
    // - Trigger circuit breakers
    
    // Simulate by triggering circuit breaker
    const { circuitBreakerManager } = await import('@/lib/recovery/circuitBreaker');
    const breaker = circuitBreakerManager.getOrCreate(failure.target);
    breaker.forceOpen();
  }

  private async injectNetworkLatency(failure: FailureInjection): Promise<void> {
    const latency = failure.parameters.latency || 1000; // ms
    console.log(`🔥 Injecting ${latency}ms network latency to ${failure.target}`);
    
    // In production, this would use tools like:
    // - tc (traffic control) on Linux
    // - Toxiproxy for service-to-service latency
    // - AWS Fault Injection Simulator
    
    // Simulate by adding artificial delays to requests
    // This would integrate with the application's HTTP client
  }

  private async injectNetworkPartition(failure: FailureInjection): Promise<void> {
    console.log(`🔥 Creating network partition: ${failure.target}`);
    
    // In production, this would:
    // - Block network traffic between specific services
    // - Use iptables rules or security groups
    // - Simulate split-brain scenarios
  }

  private async injectResourceExhaustion(failure: FailureInjection): Promise<void> {
    const resource = failure.parameters.resource || 'memory';
    const percentage = failure.parameters.percentage || 90;
    
    console.log(`🔥 Exhausting ${resource} to ${percentage}% on ${failure.target}`);
    
    // In production, this would:
    // - Consume CPU cycles with busy loops
    // - Allocate large amounts of memory
    // - Fill disk space with temporary files
    // - Exhaust file descriptors
  }

  private async injectDatabaseFailure(failure: FailureInjection): Promise<void> {
    console.log(`🔥 Injecting database failure: ${failure.target}`);
    
    // Simulate database connection issues
    const { circuitBreakerManager } = await import('@/lib/recovery/circuitBreaker');
    const dbBreaker = circuitBreakerManager.getOrCreate('database');
    dbBreaker.forceOpen();
    
    // In production, this would:
    // - Terminate database connections
    // - Introduce query timeouts
    // - Corrupt specific tables (in test environments)
    // - Simulate replication lag
  }

  private async injectCacheFailure(failure: FailureInjection): Promise<void> {
    console.log(`🔥 Injecting cache failure: ${failure.target}`);
    
    // Simulate cache unavailability
    const { circuitBreakerManager } = await import('@/lib/recovery/circuitBreaker');
    const cacheBreaker = circuitBreakerManager.getOrCreate('cache');
    cacheBreaker.forceOpen();
    
    // In production, this would:
    // - Stop cache service processes
    // - Flush cache contents
    // - Introduce cache miss scenarios
  }

  private async injectMemoryLeak(failure: FailureInjection): Promise<void> {
    const leakRate = failure.parameters.leakRate || 1024 * 1024; // 1MB/sec
    console.log(`🔥 Injecting memory leak: ${leakRate} bytes/sec on ${failure.target}`);
    
    // Simulate memory leak by gradually consuming memory
    // In production, this would be more sophisticated
  }

  private async injectCpuSpike(failure: FailureInjection): Promise<void> {
    const cpuPercent = failure.parameters.cpuPercent || 90;
    console.log(`🔥 Injecting CPU spike: ${cpuPercent}% on ${failure.target}`);
    
    // Simulate CPU spike
    // In production, this would create CPU-intensive processes
  }

  private async injectConfigurationCorruption(failure: FailureInjection): Promise<void> {
    console.log(`🔥 Corrupting configuration: ${failure.target}`);
    
    // In production, this would:
    // - Modify configuration files
    // - Introduce invalid environment variables
    // - Corrupt service discovery entries
  }

  // Recovery implementations
  private async recoverServiceTermination(failure: FailureInjection): Promise<void> {
    console.log(`✅ Recovering service: ${failure.target}`);
    
    const { circuitBreakerManager } = await import('@/lib/recovery/circuitBreaker');
    const breaker = circuitBreakerManager.getOrCreate(failure.target);
    breaker.forceClose();
  }

  private async recoverNetworkLatency(failure: FailureInjection): Promise<void> {
    console.log(`✅ Removing network latency from ${failure.target}`);
    // Remove traffic control rules
  }

  private async recoverNetworkPartition(failure: FailureInjection): Promise<void> {
    console.log(`✅ Healing network partition: ${failure.target}`);
    // Remove network blocks
  }

  private async recoverResourceExhaustion(failure: FailureInjection): Promise<void> {
    console.log(`✅ Releasing exhausted resources on ${failure.target}`);
    // Stop resource consumption processes
  }

  private async recoverDatabaseFailure(failure: FailureInjection): Promise<void> {
    console.log(`✅ Recovering database: ${failure.target}`);
    
    const { circuitBreakerManager } = await import('@/lib/recovery/circuitBreaker');
    const dbBreaker = circuitBreakerManager.getOrCreate('database');
    dbBreaker.forceClose();
  }

  private async recoverCacheFailure(failure: FailureInjection): Promise<void> {
    console.log(`✅ Recovering cache: ${failure.target}`);
    
    const { circuitBreakerManager } = await import('@/lib/recovery/circuitBreaker');
    const cacheBreaker = circuitBreakerManager.getOrCreate('cache');
    cacheBreaker.forceClose();
  }

  private async recoverMemoryLeak(failure: FailureInjection): Promise<void> {
    console.log(`✅ Stopping memory leak on ${failure.target}`);
    // Stop memory allocation processes
  }

  private async recoverCpuSpike(failure: FailureInjection): Promise<void> {
    console.log(`✅ Stopping CPU spike on ${failure.target}`);
    // Stop CPU-intensive processes
  }

  private async recoverConfigurationCorruption(failure: FailureInjection): Promise<void> {
    console.log(`✅ Restoring configuration: ${failure.target}`);
    // Restore original configuration
  }

  private validateFailureInjection(
    type: FailureType,
    target: string,
    parameters: Record<string, any>
  ): void {
    if (!this.config.enabled) {
      throw new Error('Chaos injection is disabled');
    }

    if (this.config.safetyMode && type === FailureType.SERVICE_TERMINATION) {
      throw new Error('Service termination not allowed in safety mode');
    }

    if (this.activeFailures.size >= this.config.maxConcurrentFailures) {
      throw new Error(`Maximum concurrent failures reached (${this.config.maxConcurrentFailures})`);
    }

    const environment = process.env.NODE_ENV || 'development';
    if (!this.config.allowedEnvironments.includes(environment)) {
      throw new Error(`Chaos injection not allowed in ${environment} environment`);
    }
  }

  private calculateImpact(
    type: FailureType,
    target: string,
    parameters: Record<string, any>
  ): FailureImpact {
    // Simplified impact calculation
    const impact: FailureImpact = {
      affectedServices: [target],
      expectedBehavior: this.getExpectedBehavior(type),
      recoveryProcedure: this.getRecoveryProcedure(type),
      blastRadius: this.getBlastRadius(type)
    };

    return impact;
  }

  private getExpectedBehavior(type: FailureType): string {
    const behaviors: Record<FailureType, string> = {
      [FailureType.SERVICE_TERMINATION]: 'Service becomes unavailable, circuit breakers should open',
      [FailureType.NETWORK_LATENCY]: 'Increased response times, potential timeouts',
      [FailureType.NETWORK_PARTITION]: 'Service isolation, split-brain scenarios',
      [FailureType.RESOURCE_EXHAUSTION]: 'Performance degradation, potential OOM kills',
      [FailureType.DATABASE_FAILURE]: 'Database queries fail, read replicas may be used',
      [FailureType.CACHE_FAILURE]: 'Cache misses, fallback to database',
      [FailureType.DISK_FAILURE]: 'Disk I/O failures, storage unavailable',
      [FailureType.MEMORY_LEAK]: 'Gradual memory increase, eventual OOM',
      [FailureType.CPU_SPIKE]: 'High CPU usage, request queuing',
      [FailureType.CONFIGURATION_CORRUPTION]: 'Service misconfiguration, startup failures'
    };

    return behaviors[type] || 'Unknown behavior';
  }

  private getRecoveryProcedure(type: FailureType): string {
    const procedures: Record<FailureType, string> = {
      [FailureType.SERVICE_TERMINATION]: 'Restart service, verify health checks',
      [FailureType.NETWORK_LATENCY]: 'Remove traffic control rules',
      [FailureType.NETWORK_PARTITION]: 'Restore network connectivity',
      [FailureType.RESOURCE_EXHAUSTION]: 'Kill resource-consuming processes',
      [FailureType.DATABASE_FAILURE]: 'Restart database connections',
      [FailureType.CACHE_FAILURE]: 'Restart cache service',
      [FailureType.DISK_FAILURE]: 'Check disk health, restore from backup',
      [FailureType.MEMORY_LEAK]: 'Stop leak process, restart if needed',
      [FailureType.CPU_SPIKE]: 'Kill CPU-intensive processes',
      [FailureType.CONFIGURATION_CORRUPTION]: 'Restore original configuration'
    };

    return procedures[type] || 'Manual recovery required';
  }

  private getBlastRadius(type: FailureType): 'MINIMAL' | 'LIMITED' | 'MODERATE' | 'EXTENSIVE' {
    const radii: Record<FailureType, 'MINIMAL' | 'LIMITED' | 'MODERATE' | 'EXTENSIVE'> = {
      [FailureType.SERVICE_TERMINATION]: 'MODERATE',
      [FailureType.NETWORK_LATENCY]: 'LIMITED',
      [FailureType.NETWORK_PARTITION]: 'EXTENSIVE',
      [FailureType.RESOURCE_EXHAUSTION]: 'MODERATE',
      [FailureType.DATABASE_FAILURE]: 'EXTENSIVE',
      [FailureType.CACHE_FAILURE]: 'LIMITED',
      [FailureType.DISK_FAILURE]: 'EXTENSIVE',
      [FailureType.MEMORY_LEAK]: 'MINIMAL',
      [FailureType.CPU_SPIKE]: 'LIMITED',
      [FailureType.CONFIGURATION_CORRUPTION]: 'MODERATE'
    };

    return radii[type] || 'MODERATE';
  }

  private generateFailureId(): string {
    return `chaos-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  // Public API methods
  getActiveFailures(): FailureInjection[] {
    return Array.from(this.activeFailures.values());
  }

  getFailureHistory(): FailureInjection[] {
    return [...this.failureHistory];
  }

  getFailure(failureId: string): FailureInjection | undefined {
    return this.activeFailures.get(failureId) || 
           this.failureHistory.find(f => f.id === failureId);
  }

  updateConfig(newConfig: Partial<ChaosConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): ChaosConfig {
    return { ...this.config };
  }
}

// Global instance with default configuration
export const chaosInjector = new ChaosInjector({
  enabled: true,
  safetyMode: true,
  maxConcurrentFailures: 3,
  allowedEnvironments: ['development', 'staging', 'test'],
  blastRadiusLimits: {
    minimal: 1,
    limited: 2,
    moderate: 5,
    extensive: 10
  }
});

// Convenience functions
export const injectFailure = (type: FailureType, target: string, duration: number, params?: any) =>
  chaosInjector.injectFailure(type, target, duration, params);

export const stopFailure = (failureId: string) =>
  chaosInjector.stopFailure(failureId);

export const stopAllFailures = () =>
  chaosInjector.stopAllFailures();

export const getActiveFailures = () =>
  chaosInjector.getActiveFailures();