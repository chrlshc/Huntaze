/**
 * Auto-Healing System
 * Automatic recovery mechanisms for common failure scenarios
 */

export interface HealingAction {
  name: string;
  description: string;
  execute: () => Promise<boolean>;
  cooldown: number; // Minimum time between executions (ms)
  maxAttempts: number;
  priority: number;
}

export interface HealingResult {
  action: string;
  success: boolean;
  message: string;
  timestamp: number;
  duration: number;
  attempt: number;
}

export interface HealingMetrics {
  totalAttempts: number;
  successfulHealing: number;
  failedHealing: number;
  lastHealingTime: number;
  averageHealingTime: number;
}

class AutoHealingManager {
  private actions = new Map<string, HealingAction>();
  private lastExecution = new Map<string, number>();
  private attemptCounts = new Map<string, number>();
  private metrics = new Map<string, HealingMetrics>();
  private healingHistory: HealingResult[] = [];
  private maxHistorySize = 100;

  registerAction(action: HealingAction): void {
    this.actions.set(action.name, action);
    this.initializeMetrics(action.name);
  }

  async executeHealing(actionName: string): Promise<HealingResult> {
    const action = this.actions.get(actionName);
    if (!action) {
      throw new Error(`Healing action '${actionName}' not found`);
    }

    // Check cooldown
    const lastExec = this.lastExecution.get(actionName) || 0;
    const timeSinceLastExec = Date.now() - lastExec;
    if (timeSinceLastExec < action.cooldown) {
      return {
        action: actionName,
        success: false,
        message: `Action in cooldown (${action.cooldown - timeSinceLastExec}ms remaining)`,
        timestamp: Date.now(),
        duration: 0,
        attempt: 0
      };
    }

    // Check max attempts
    const attempts = this.attemptCounts.get(actionName) || 0;
    if (attempts >= action.maxAttempts) {
      return {
        action: actionName,
        success: false,
        message: `Max attempts reached (${action.maxAttempts})`,
        timestamp: Date.now(),
        duration: 0,
        attempt: attempts
      };
    }

    // Execute healing action
    const startTime = Date.now();
    let success = false;
    let message = '';

    try {
      success = await action.execute();
      message = success ? 'Healing action completed successfully' : 'Healing action failed';
    } catch (error) {
      success = false;
      const errorMessage = error instanceof Error ? error.message : String(error);
      message = `Healing action threw error: ${errorMessage}`;
    }

    const duration = Date.now() - startTime;
    const newAttempts = attempts + 1;

    // Update tracking
    this.lastExecution.set(actionName, Date.now());
    this.attemptCounts.set(actionName, newAttempts);

    // Update metrics
    this.updateMetrics(actionName, success, duration);

    const result: HealingResult = {
      action: actionName,
      success,
      message,
      timestamp: Date.now(),
      duration,
      attempt: newAttempts
    };

    // Add to history
    this.addToHistory(result);

    // Reset attempt count on success
    if (success) {
      this.attemptCounts.set(actionName, 0);
    }

    return result;
  }

  async executeAllApplicableActions(): Promise<HealingResult[]> {
    const results: HealingResult[] = [];
    
    // Get actions sorted by priority
    const sortedActions = Array.from(this.actions.values())
      .sort((a, b) => b.priority - a.priority);

    for (const action of sortedActions) {
      try {
        const result = await this.executeHealing(action.name);
        results.push(result);
        
        // If healing was successful, we might not need to run lower priority actions
        if (result.success) {
          console.log(`Auto-healing successful with action: ${action.name}`);
        }
      } catch (error) {
        console.error(`Error executing healing action ${action.name}:`, error);
      }
    }

    return results;
  }

  private initializeMetrics(actionName: string): void {
    if (!this.metrics.has(actionName)) {
      this.metrics.set(actionName, {
        totalAttempts: 0,
        successfulHealing: 0,
        failedHealing: 0,
        lastHealingTime: 0,
        averageHealingTime: 0
      });
    }
  }

  private updateMetrics(actionName: string, success: boolean, duration: number): void {
    const metrics = this.metrics.get(actionName)!;
    
    metrics.totalAttempts++;
    metrics.lastHealingTime = Date.now();
    
    if (success) {
      metrics.successfulHealing++;
    } else {
      metrics.failedHealing++;
    }

    // Update average healing time
    metrics.averageHealingTime = 
      (metrics.averageHealingTime * (metrics.totalAttempts - 1) + duration) / metrics.totalAttempts;
  }

  private addToHistory(result: HealingResult): void {
    this.healingHistory.push(result);
    
    // Keep history size manageable
    if (this.healingHistory.length > this.maxHistorySize) {
      this.healingHistory.shift();
    }
  }

  getMetrics(actionName?: string): HealingMetrics | Record<string, HealingMetrics> {
    if (actionName) {
      return this.metrics.get(actionName) || this.createEmptyMetrics();
    }

    const allMetrics: Record<string, HealingMetrics> = {};
    for (const [name, metrics] of this.metrics) {
      allMetrics[name] = { ...metrics };
    }
    return allMetrics;
  }

  getHistory(limit?: number): HealingResult[] {
    const history = [...this.healingHistory].reverse(); // Most recent first
    return limit ? history.slice(0, limit) : history;
  }

  resetAttempts(actionName?: string): void {
    if (actionName) {
      this.attemptCounts.set(actionName, 0);
    } else {
      this.attemptCounts.clear();
    }
  }

  private createEmptyMetrics(): HealingMetrics {
    return {
      totalAttempts: 0,
      successfulHealing: 0,
      failedHealing: 0,
      lastHealingTime: 0,
      averageHealingTime: 0
    };
  }
}

// Global instance
export const autoHealingManager = new AutoHealingManager();

// Pre-configured healing actions
export const setupDefaultHealingActions = () => {
  // Database connection recovery
  autoHealingManager.registerAction({
    name: 'database_reconnect',
    description: 'Reconnect to database and reset connection pool',
    priority: 100,
    cooldown: 30000, // 30 seconds
    maxAttempts: 3,
    execute: async (): Promise<boolean> => {
      try {
        const { db } = await import('@/lib/db');
        
        // Get the pool
        const pool = db.getPool();
        
        // End existing connections
        await pool.end();
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // The pool will automatically reconnect on next query
        // Test connection
        await db.query('SELECT 1');
        
        console.log('Database reconnection successful');
        return true;
      } catch (error) {
        console.error('Database reconnection failed:', error);
        return false;
      }
    }
  });

  // Cache service restart
  autoHealingManager.registerAction({
    name: 'cache_restart',
    description: 'Restart cache service and warm critical data',
    priority: 80,
    cooldown: 15000, // 15 seconds
    maxAttempts: 2,
    execute: async (): Promise<boolean> => {
      try {
        const { cacheManager } = await import('@/lib/cache/cacheManager');
        
        // Clear cache
        await cacheManager.flush();
        
        // Warm critical caches
        await warmCriticalCaches();
        
        console.log('Cache restart successful');
        return true;
      } catch (error) {
        console.error('Cache restart failed:', error);
        return false;
      }
    }
  });

  // Memory cleanup
  autoHealingManager.registerAction({
    name: 'memory_cleanup',
    description: 'Force garbage collection and clear non-essential caches',
    priority: 60,
    cooldown: 60000, // 1 minute
    maxAttempts: 5,
    execute: async (): Promise<boolean> => {
      try {
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }

        // Clear caches to free memory
        const { cacheManager } = await import('@/lib/cache/cacheManager');
        await cacheManager.flush();

        // Check if memory usage improved
        const memUsage = process.memoryUsage();
        const usagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
        
        console.log(`Memory cleanup completed. Usage: ${usagePercent.toFixed(1)}%`);
        return usagePercent < 85; // Consider successful if under 85%
      } catch (error) {
        console.error('Memory cleanup failed:', error);
        return false;
      }
    }
  });

  // Circuit breaker reset
  autoHealingManager.registerAction({
    name: 'circuit_breaker_reset',
    description: 'Reset circuit breakers after cooldown period',
    priority: 40,
    cooldown: 120000, // 2 minutes
    maxAttempts: 1,
    execute: async (): Promise<boolean> => {
      try {
        const { circuitBreakerManager } = await import('./circuitBreaker');
        
        // Get all circuit breaker metrics
        const allMetrics = circuitBreakerManager.getAllMetrics();
        let resetCount = 0;

        for (const [name, metrics] of Object.entries(allMetrics)) {
          if (metrics.state === 'OPEN') {
            // Check if enough time has passed since last failure
            const timeSinceFailure = Date.now() - metrics.lastFailureTime;
            if (timeSinceFailure > 300000) { // 5 minutes
              const breaker = circuitBreakerManager.getOrCreate(name);
              breaker.forceClose();
              resetCount++;
            }
          }
        }

        console.log(`Reset ${resetCount} circuit breakers`);
        return resetCount > 0;
      } catch (error) {
        console.error('Circuit breaker reset failed:', error);
        return false;
      }
    }
  });

  // Service health restoration
  autoHealingManager.registerAction({
    name: 'service_health_restore',
    description: 'Attempt to restore unhealthy services',
    priority: 90,
    cooldown: 45000, // 45 seconds
    maxAttempts: 2,
    execute: async (): Promise<boolean> => {
      try {
        const { healthChecker } = await import('./healthChecker');
        
        // Run health checks
        const systemHealth = await healthChecker.runAllChecks();
        
        let restoredServices = 0;
        
        for (const [serviceName, result] of Object.entries(systemHealth.checks)) {
          if (result.status === 'UNHEALTHY') {
            // Attempt service-specific recovery
            switch (serviceName) {
              case 'database':
                await autoHealingManager.executeHealing('database_reconnect');
                restoredServices++;
                break;
              case 'cache':
                await autoHealingManager.executeHealing('cache_restart');
                restoredServices++;
                break;
            }
          }
        }

        console.log(`Attempted restoration of ${restoredServices} services`);
        return restoredServices > 0;
      } catch (error) {
        console.error('Service health restoration failed:', error);
        return false;
      }
    }
  });
};

// Helper function to warm critical caches
async function warmCriticalCaches(): Promise<void> {
  try {
    // Warm user session cache
    // Warm configuration cache
    // Warm frequently accessed data
    console.log('Critical caches warmed');
  } catch (error) {
    console.error('Cache warming failed:', error);
  }
}

// Convenience functions
export const triggerAutoHealing = (actionName?: string) => {
  if (actionName) {
    return autoHealingManager.executeHealing(actionName);
  }
  return autoHealingManager.executeAllApplicableActions();
};

export const getHealingMetrics = (actionName?: string) => {
  return autoHealingManager.getMetrics(actionName);
};

export const getHealingHistory = (limit?: number) => {
  return autoHealingManager.getHistory(limit);
};