/**
 * Admission Controller
 * Edge-level request filtering based on system resources and load
 */

export enum AdmissionDecision {
  ADMIT = 'ADMIT',
  REJECT = 'REJECT',
  THROTTLE = 'THROTTLE'
}

export enum PriorityClass {
  CRITICAL = 'CRITICAL',
  IMPORTANT = 'IMPORTANT',
  BEST_EFFORT = 'BEST_EFFORT'
}

export interface AdmissionConfig {
  enabled: boolean;
  triggers: {
    cpu: {
      warning: number;
      shedBestEffort: number;
      shedImportant: number;
      emergency: number;
    };
    memory: {
      warning: number;
      shedBestEffort: number;
      shedImportant: number;
      emergency: number;
    };
    latency: {
      p95Warning: number;
      p95Shed: number;
      p99Shed: number;
      p99Emergency: number;
    };
    queue: {
      maxDepth: number;
      warningDepth: number;
    };
  };
  priorityBudgets: {
    [PriorityClass.CRITICAL]: number;
    [PriorityClass.IMPORTANT]: number;
    [PriorityClass.BEST_EFFORT]: number;
  };
}

export interface SystemMetrics {
  cpu: number;
  memory: number;
  latencyP95: number;
  latencyP99: number;
  queueDepth: number;
  activeConnections: number;
  requestRate: number;
  timestamp: number;
}

export interface AdmissionResult {
  decision: AdmissionDecision;
  reason: string;
  priorityClass: PriorityClass;
  retryAfter?: number;
  metrics: SystemMetrics;
  shedLevel: number; // 0-4 (none to emergency)
}

class AdmissionController {
  private config: AdmissionConfig;
  private currentMetrics: SystemMetrics;
  private requestCounts = new Map<PriorityClass, number>();
  private windowStart = Date.now();
  private windowDuration = 60000; // 1 minute window

  constructor(config: AdmissionConfig) {
    this.config = config;
    this.currentMetrics = this.getEmptyMetrics();
    this.resetRequestCounts();
  }

  async checkAdmission(
    request: {
      path: string;
      method: string;
      headers: Record<string, string>;
      priority?: PriorityClass;
    }
  ): Promise<AdmissionResult> {
    // Update system metrics
    await this.updateSystemMetrics();

    // Determine request priority
    const priorityClass = request.priority || this.classifyRequest(request);

    // Check if admission control is enabled
    if (!this.config.enabled) {
      return {
        decision: AdmissionDecision.ADMIT,
        reason: 'Admission control disabled',
        priorityClass,
        metrics: this.currentMetrics,
        shedLevel: 0
      };
    }

    // Determine current shed level
    const shedLevel = this.calculateShedLevel();

    // Check if we should shed this priority class
    const shouldShed = this.shouldShedPriority(priorityClass, shedLevel);

    if (shouldShed) {
      const retryAfter = this.calculateRetryAfter(shedLevel);
      return {
        decision: AdmissionDecision.REJECT,
        reason: `Load shedding active (level ${shedLevel}) for ${priorityClass} requests`,
        priorityClass,
        retryAfter,
        metrics: this.currentMetrics,
        shedLevel
      };
    }

    // Check priority budget
    const budgetExceeded = this.checkPriorityBudget(priorityClass);
    if (budgetExceeded) {
      return {
        decision: AdmissionDecision.THROTTLE,
        reason: `Priority budget exceeded for ${priorityClass}`,
        priorityClass,
        retryAfter: 1000, // 1 second
        metrics: this.currentMetrics,
        shedLevel
      };
    }

    // Admit the request
    this.recordAdmission(priorityClass);
    
    return {
      decision: AdmissionDecision.ADMIT,
      reason: 'Request admitted',
      priorityClass,
      metrics: this.currentMetrics,
      shedLevel
    };
  }

  private async updateSystemMetrics(): Promise<void> {
    // In a real implementation, this would collect actual system metrics
    // For now, we'll simulate realistic metrics
    
    const cpuUsage = await this.getCPUUsage();
    const memoryUsage = await this.getMemoryUsage();
    const latencyMetrics = await this.getLatencyMetrics();
    const queueMetrics = await this.getQueueMetrics();

    this.currentMetrics = {
      cpu: cpuUsage,
      memory: memoryUsage,
      latencyP95: latencyMetrics.p95,
      latencyP99: latencyMetrics.p99,
      queueDepth: queueMetrics.depth,
      activeConnections: queueMetrics.connections,
      requestRate: this.calculateRequestRate(),
      timestamp: Date.now()
    };
  }

  private calculateShedLevel(): number {
    const { cpu, memory, latencyP95, latencyP99, queueDepth } = this.currentMetrics;
    const { triggers } = this.config;

    // Emergency level (4)
    if (cpu >= triggers.cpu.emergency || 
        memory >= triggers.memory.emergency || 
        latencyP99 >= triggers.latency.p99Emergency) {
      return 4;
    }

    // Shed important level (3)
    if (cpu >= triggers.cpu.shedImportant || 
        memory >= triggers.memory.shedImportant || 
        latencyP99 >= triggers.latency.p99Shed) {
      return 3;
    }

    // Shed best-effort level (2)
    if (cpu >= triggers.cpu.shedBestEffort || 
        memory >= triggers.memory.shedBestEffort || 
        latencyP95 >= triggers.latency.p95Shed) {
      return 2;
    }

    // Warning level (1)
    if (cpu >= triggers.cpu.warning || 
        memory >= triggers.memory.warning || 
        latencyP95 >= triggers.latency.p95Warning ||
        queueDepth >= triggers.queue.warningDepth) {
      return 1;
    }

    // Normal level (0)
    return 0;
  }

  private shouldShedPriority(priority: PriorityClass, shedLevel: number): boolean {
    switch (shedLevel) {
      case 4: // Emergency - shed important and best-effort
        return priority === PriorityClass.IMPORTANT || priority === PriorityClass.BEST_EFFORT;
      case 3: // Shed important and best-effort
        return priority === PriorityClass.IMPORTANT || priority === PriorityClass.BEST_EFFORT;
      case 2: // Shed best-effort only
        return priority === PriorityClass.BEST_EFFORT;
      case 1: // Warning - no shedding yet
      case 0: // Normal
      default:
        return false;
    }
  }

  private calculateRetryAfter(shedLevel: number): number {
    // Exponential backoff based on shed level
    const baseDelay = 1000; // 1 second
    return baseDelay * Math.pow(2, shedLevel - 1);
  }

  private checkPriorityBudget(priority: PriorityClass): boolean {
    const currentWindow = Date.now();
    
    // Reset window if needed
    if (currentWindow - this.windowStart > this.windowDuration) {
      this.resetRequestCounts();
      this.windowStart = currentWindow;
    }

    const currentCount = this.requestCounts.get(priority) || 0;
    const budget = this.config.priorityBudgets[priority];
    
    return currentCount >= budget;
  }

  private recordAdmission(priority: PriorityClass): void {
    const currentCount = this.requestCounts.get(priority) || 0;
    this.requestCounts.set(priority, currentCount + 1);
  }

  private resetRequestCounts(): void {
    this.requestCounts.set(PriorityClass.CRITICAL, 0);
    this.requestCounts.set(PriorityClass.IMPORTANT, 0);
    this.requestCounts.set(PriorityClass.BEST_EFFORT, 0);
  }

  private classifyRequest(request: { path: string; method: string }): PriorityClass {
    const { path, method } = request;

    // Critical endpoints
    if (path.startsWith('/api/auth/') || 
        path.startsWith('/api/payments/') ||
        path.startsWith('/api/health/')) {
      return PriorityClass.CRITICAL;
    }

    // Important endpoints
    if (path.startsWith('/api/users/') ||
        path.startsWith('/api/content/') ||
        path.startsWith('/api/crm/') ||
        method === 'POST' || method === 'PUT' || method === 'DELETE') {
      return PriorityClass.IMPORTANT;
    }

    // Best-effort endpoints (analytics, reports, etc.)
    return PriorityClass.BEST_EFFORT;
  }

  private calculateRequestRate(): number {
    const totalRequests = Array.from(this.requestCounts.values())
      .reduce((sum, count) => sum + count, 0);
    
    const windowSeconds = this.windowDuration / 1000;
    return totalRequests / windowSeconds;
  }

  // System metrics collection methods (simulated)
  private async getCPUUsage(): Promise<number> {
    // In production, use actual CPU monitoring
    return Math.random() * 100;
  }

  private async getMemoryUsage(): Promise<number> {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
    return (heapUsedMB / heapTotalMB) * 100;
  }

  private async getLatencyMetrics(): Promise<{ p95: number; p99: number }> {
    // In production, collect from monitoring system
    return {
      p95: 200 + Math.random() * 800, // 200-1000ms
      p99: 500 + Math.random() * 1500 // 500-2000ms
    };
  }

  private async getQueueMetrics(): Promise<{ depth: number; connections: number }> {
    // In production, collect from load balancer/server
    return {
      depth: Math.floor(Math.random() * 100),
      connections: Math.floor(Math.random() * 1000) + 100
    };
  }

  private getEmptyMetrics(): SystemMetrics {
    return {
      cpu: 0,
      memory: 0,
      latencyP95: 0,
      latencyP99: 0,
      queueDepth: 0,
      activeConnections: 0,
      requestRate: 0,
      timestamp: Date.now()
    };
  }

  // Public API methods
  updateConfig(newConfig: Partial<AdmissionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getCurrentMetrics(): SystemMetrics {
    return { ...this.currentMetrics };
  }

  getRequestCounts(): Map<PriorityClass, number> {
    return new Map(this.requestCounts);
  }

  getShedLevel(): number {
    return this.calculateShedLevel();
  }

  getStatus(): {
    enabled: boolean;
    shedLevel: number;
    metrics: SystemMetrics;
    requestCounts: Record<PriorityClass, number>;
  } {
    return {
      enabled: this.config.enabled,
      shedLevel: this.calculateShedLevel(),
      metrics: this.getCurrentMetrics(),
      requestCounts: {
        [PriorityClass.CRITICAL]: this.requestCounts.get(PriorityClass.CRITICAL) || 0,
        [PriorityClass.IMPORTANT]: this.requestCounts.get(PriorityClass.IMPORTANT) || 0,
        [PriorityClass.BEST_EFFORT]: this.requestCounts.get(PriorityClass.BEST_EFFORT) || 0
      }
    };
  }
}

// Global instance
export const admissionController = new AdmissionController({
  enabled: true,
  triggers: {
    cpu: {
      warning: 70,
      shedBestEffort: 80,
      shedImportant: 90,
      emergency: 95
    },
    memory: {
      warning: 75,
      shedBestEffort: 85,
      shedImportant: 92,
      emergency: 97
    },
    latency: {
      p95Warning: 500,
      p95Shed: 1000,
      p99Shed: 2000,
      p99Emergency: 5000
    },
    queue: {
      maxDepth: 1000,
      warningDepth: 500
    }
  },
  priorityBudgets: {
    [PriorityClass.CRITICAL]: 1000,   // 1000 requests per minute
    [PriorityClass.IMPORTANT]: 500,   // 500 requests per minute
    [PriorityClass.BEST_EFFORT]: 100  // 100 requests per minute
  }
});

// Convenience functions
export const checkRequestAdmission = (request: {
  path: string;
  method: string;
  headers: Record<string, string>;
  priority?: PriorityClass;
}) => admissionController.checkAdmission(request);

export const getAdmissionStatus = () => admissionController.getStatus();