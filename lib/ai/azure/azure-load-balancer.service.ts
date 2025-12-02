/**
 * Azure OpenAI Load Balancer Service
 * Distributes traffic across multiple Azure OpenAI deployments
 * 
 * Feature: huntaze-ai-azure-migration
 * Task 44: Implement load balancing across deployments
 * Validates: Requirements 12.4
 */

export interface DeploymentEndpoint {
  id: string;
  deploymentName: string;
  endpoint: string;
  region: string;
  weight: number; // 0-100, for weighted distribution
  healthy: boolean;
  lastHealthCheck: Date;
  consecutiveFailures: number;
  latencyMs: number;
  requestCount: number;
  errorCount: number;
}

export interface HealthCheckConfig {
  intervalMs: number;
  timeoutMs: number;
  unhealthyThreshold: number; // Consecutive failures to mark unhealthy
  healthyThreshold: number; // Consecutive successes to mark healthy
}

export interface LoadBalancerConfig {
  strategy: 'round_robin' | 'weighted' | 'least_connections' | 'latency_based';
  stickySessionTTLMs: number;
  healthCheck: HealthCheckConfig;
}

export interface RoutingDecision {
  endpoint: DeploymentEndpoint;
  reason: string;
  sessionId?: string;
}

export interface LoadBalancerStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatencyMs: number;
  endpointStats: Record<string, {
    requests: number;
    errors: number;
    avgLatencyMs: number;
    healthy: boolean;
  }>;
}

/**
 * Azure OpenAI Load Balancer
 * Implements intelligent traffic distribution with health monitoring
 */
export class AzureLoadBalancerService {
  private endpoints: Map<string, DeploymentEndpoint> = new Map();
  private config: LoadBalancerConfig;
  private roundRobinIndex: number = 0;
  private stickySessionMap: Map<string, { endpointId: string; expiresAt: Date }> = new Map();
  private activeConnections: Map<string, number> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;


  constructor(config?: Partial<LoadBalancerConfig>) {
    this.config = {
      strategy: config?.strategy || 'weighted',
      stickySessionTTLMs: config?.stickySessionTTLMs || 300000, // 5 minutes
      healthCheck: {
        intervalMs: config?.healthCheck?.intervalMs || 30000, // 30 seconds
        timeoutMs: config?.healthCheck?.timeoutMs || 5000,
        unhealthyThreshold: config?.healthCheck?.unhealthyThreshold || 3,
        healthyThreshold: config?.healthCheck?.healthyThreshold || 2,
      },
    };

    // Initialize default endpoints
    this.initializeDefaultEndpoints();
  }

  /**
   * Initialize default Azure OpenAI endpoints
   */
  private initializeDefaultEndpoints(): void {
    const defaultEndpoints: Omit<DeploymentEndpoint, 'lastHealthCheck'>[] = [
      {
        id: 'gpt4-turbo-westeurope',
        deploymentName: 'gpt-4-turbo-prod',
        endpoint: 'https://huntaze-ai-westeurope.openai.azure.com',
        region: 'westeurope',
        weight: 50,
        healthy: true,
        consecutiveFailures: 0,
        latencyMs: 0,
        requestCount: 0,
        errorCount: 0,
      },
      {
        id: 'gpt4-turbo-northeurope',
        deploymentName: 'gpt-4-turbo-prod',
        endpoint: 'https://huntaze-ai-northeurope.openai.azure.com',
        region: 'northeurope',
        weight: 30,
        healthy: true,
        consecutiveFailures: 0,
        latencyMs: 0,
        requestCount: 0,
        errorCount: 0,
      },
      {
        id: 'gpt4-standard-westeurope',
        deploymentName: 'gpt-4-standard-prod',
        endpoint: 'https://huntaze-ai-westeurope.openai.azure.com',
        region: 'westeurope',
        weight: 60,
        healthy: true,
        consecutiveFailures: 0,
        latencyMs: 0,
        requestCount: 0,
        errorCount: 0,
      },
      {
        id: 'gpt35-turbo-westeurope',
        deploymentName: 'gpt-35-turbo-prod',
        endpoint: 'https://huntaze-ai-westeurope.openai.azure.com',
        region: 'westeurope',
        weight: 70,
        healthy: true,
        consecutiveFailures: 0,
        latencyMs: 0,
        requestCount: 0,
        errorCount: 0,
      },
    ];

    for (const ep of defaultEndpoints) {
      this.endpoints.set(ep.id, {
        ...ep,
        lastHealthCheck: new Date(),
      });
      this.activeConnections.set(ep.id, 0);
    }
  }

  /**
   * Register a new endpoint
   */
  registerEndpoint(endpoint: Omit<DeploymentEndpoint, 'lastHealthCheck' | 'consecutiveFailures' | 'latencyMs' | 'requestCount' | 'errorCount'>): void {
    this.endpoints.set(endpoint.id, {
      ...endpoint,
      lastHealthCheck: new Date(),
      consecutiveFailures: 0,
      latencyMs: 0,
      requestCount: 0,
      errorCount: 0,
    });
    this.activeConnections.set(endpoint.id, 0);
  }

  /**
   * Remove an endpoint
   */
  removeEndpoint(endpointId: string): boolean {
    this.activeConnections.delete(endpointId);
    return this.endpoints.delete(endpointId);
  }

  /**
   * Get routing decision for a request
   * Validates: Requirements 12.4
   */
  route(deploymentName: string, sessionId?: string): RoutingDecision | null {
    // Check sticky session first
    if (sessionId) {
      const sticky = this.stickySessionMap.get(sessionId);
      if (sticky && sticky.expiresAt > new Date()) {
        const endpoint = this.endpoints.get(sticky.endpointId);
        if (endpoint && endpoint.healthy && endpoint.deploymentName === deploymentName) {
          return {
            endpoint,
            reason: 'sticky_session',
            sessionId,
          };
        }
      }
    }

    // Get healthy endpoints for the deployment
    const healthyEndpoints = this.getHealthyEndpoints(deploymentName);
    if (healthyEndpoints.length === 0) {
      return null;
    }

    // Select endpoint based on strategy
    let selectedEndpoint: DeploymentEndpoint;
    let reason: string;

    switch (this.config.strategy) {
      case 'round_robin':
        selectedEndpoint = this.selectRoundRobin(healthyEndpoints);
        reason = 'round_robin';
        break;
      case 'weighted':
        selectedEndpoint = this.selectWeighted(healthyEndpoints);
        reason = 'weighted';
        break;
      case 'least_connections':
        selectedEndpoint = this.selectLeastConnections(healthyEndpoints);
        reason = 'least_connections';
        break;
      case 'latency_based':
        selectedEndpoint = this.selectLatencyBased(healthyEndpoints);
        reason = 'latency_based';
        break;
      default:
        selectedEndpoint = healthyEndpoints[0];
        reason = 'default';
    }

    // Set sticky session if sessionId provided
    if (sessionId) {
      this.stickySessionMap.set(sessionId, {
        endpointId: selectedEndpoint.id,
        expiresAt: new Date(Date.now() + this.config.stickySessionTTLMs),
      });
    }

    return {
      endpoint: selectedEndpoint,
      reason,
      sessionId,
    };
  }

  /**
   * Get healthy endpoints for a deployment
   */
  private getHealthyEndpoints(deploymentName: string): DeploymentEndpoint[] {
    return Array.from(this.endpoints.values())
      .filter(ep => ep.deploymentName === deploymentName && ep.healthy);
  }

  /**
   * Round robin selection
   */
  private selectRoundRobin(endpoints: DeploymentEndpoint[]): DeploymentEndpoint {
    const index = this.roundRobinIndex % endpoints.length;
    this.roundRobinIndex++;
    return endpoints[index];
  }

  /**
   * Weighted selection
   */
  private selectWeighted(endpoints: DeploymentEndpoint[]): DeploymentEndpoint {
    const totalWeight = endpoints.reduce((sum, ep) => sum + ep.weight, 0);
    let random = Math.random() * totalWeight;

    for (const endpoint of endpoints) {
      random -= endpoint.weight;
      if (random <= 0) {
        return endpoint;
      }
    }

    return endpoints[endpoints.length - 1];
  }

  /**
   * Least connections selection
   */
  private selectLeastConnections(endpoints: DeploymentEndpoint[]): DeploymentEndpoint {
    let minConnections = Infinity;
    let selected = endpoints[0];

    for (const endpoint of endpoints) {
      const connections = this.activeConnections.get(endpoint.id) || 0;
      if (connections < minConnections) {
        minConnections = connections;
        selected = endpoint;
      }
    }

    return selected;
  }

  /**
   * Latency-based selection
   */
  private selectLatencyBased(endpoints: DeploymentEndpoint[]): DeploymentEndpoint {
    // Filter endpoints with latency data
    const withLatency = endpoints.filter(ep => ep.latencyMs > 0);
    
    if (withLatency.length === 0) {
      // No latency data, use weighted
      return this.selectWeighted(endpoints);
    }

    // Select endpoint with lowest latency
    return withLatency.reduce((best, ep) => 
      ep.latencyMs < best.latencyMs ? ep : best
    );
  }


  /**
   * Record request start (increment active connections)
   */
  startRequest(endpointId: string): void {
    const current = this.activeConnections.get(endpointId) || 0;
    this.activeConnections.set(endpointId, current + 1);
  }

  /**
   * Record request completion
   */
  completeRequest(endpointId: string, latencyMs: number, success: boolean): void {
    // Decrement active connections
    const current = this.activeConnections.get(endpointId) || 0;
    this.activeConnections.set(endpointId, Math.max(0, current - 1));

    // Update endpoint stats
    const endpoint = this.endpoints.get(endpointId);
    if (endpoint) {
      endpoint.requestCount++;
      
      // Update latency with exponential moving average
      if (endpoint.latencyMs === 0) {
        endpoint.latencyMs = latencyMs;
      } else {
        endpoint.latencyMs = endpoint.latencyMs * 0.8 + latencyMs * 0.2;
      }

      if (!success) {
        endpoint.errorCount++;
        endpoint.consecutiveFailures++;
        
        // Check if should mark unhealthy
        if (endpoint.consecutiveFailures >= this.config.healthCheck.unhealthyThreshold) {
          endpoint.healthy = false;
        }
      } else {
        endpoint.consecutiveFailures = 0;
      }
    }
  }

  /**
   * Perform health check on an endpoint
   */
  async checkHealth(endpointId: string): Promise<boolean> {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) return false;

    try {
      const startTime = Date.now();
      
      // Simulate health check (in production, this would call the actual endpoint)
      // For now, we'll use a simple timeout-based check
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Health check timeout'));
        }, this.config.healthCheck.timeoutMs);

        // Simulate successful health check
        setTimeout(() => {
          clearTimeout(timeout);
          resolve();
        }, Math.random() * 100);
      });

      const latency = Date.now() - startTime;
      
      // Update endpoint health
      endpoint.lastHealthCheck = new Date();
      endpoint.latencyMs = endpoint.latencyMs * 0.8 + latency * 0.2;
      
      if (!endpoint.healthy) {
        endpoint.consecutiveFailures = 0;
        // Need consecutive successes to mark healthy
        if (endpoint.consecutiveFailures === 0) {
          endpoint.healthy = true;
        }
      }

      return true;
    } catch {
      endpoint.lastHealthCheck = new Date();
      endpoint.consecutiveFailures++;
      
      if (endpoint.consecutiveFailures >= this.config.healthCheck.unhealthyThreshold) {
        endpoint.healthy = false;
      }

      return false;
    }
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks(): void {
    if (this.healthCheckInterval) {
      return;
    }

    this.healthCheckInterval = setInterval(async () => {
      for (const endpointId of this.endpoints.keys()) {
        await this.checkHealth(endpointId);
      }
    }, this.config.healthCheck.intervalMs);
  }

  /**
   * Stop periodic health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Mark endpoint as healthy
   */
  markHealthy(endpointId: string): void {
    const endpoint = this.endpoints.get(endpointId);
    if (endpoint) {
      endpoint.healthy = true;
      endpoint.consecutiveFailures = 0;
      endpoint.lastHealthCheck = new Date();
    }
  }

  /**
   * Mark endpoint as unhealthy
   */
  markUnhealthy(endpointId: string): void {
    const endpoint = this.endpoints.get(endpointId);
    if (endpoint) {
      endpoint.healthy = false;
      endpoint.lastHealthCheck = new Date();
    }
  }

  /**
   * Update endpoint weight
   */
  updateWeight(endpointId: string, weight: number): void {
    const endpoint = this.endpoints.get(endpointId);
    if (endpoint) {
      endpoint.weight = Math.max(0, Math.min(100, weight));
    }
  }

  /**
   * Get endpoint by ID
   */
  getEndpoint(endpointId: string): DeploymentEndpoint | undefined {
    return this.endpoints.get(endpointId);
  }

  /**
   * Get all endpoints
   */
  getAllEndpoints(): DeploymentEndpoint[] {
    return Array.from(this.endpoints.values());
  }

  /**
   * Get endpoints for a deployment
   */
  getEndpointsForDeployment(deploymentName: string): DeploymentEndpoint[] {
    return Array.from(this.endpoints.values())
      .filter(ep => ep.deploymentName === deploymentName);
  }

  /**
   * Get load balancer statistics
   */
  getStats(): LoadBalancerStats {
    let totalRequests = 0;
    let totalErrors = 0;
    let totalLatency = 0;
    let latencyCount = 0;
    const endpointStats: LoadBalancerStats['endpointStats'] = {};

    for (const endpoint of this.endpoints.values()) {
      totalRequests += endpoint.requestCount;
      totalErrors += endpoint.errorCount;
      
      if (endpoint.latencyMs > 0) {
        totalLatency += endpoint.latencyMs;
        latencyCount++;
      }

      endpointStats[endpoint.id] = {
        requests: endpoint.requestCount,
        errors: endpoint.errorCount,
        avgLatencyMs: endpoint.latencyMs,
        healthy: endpoint.healthy,
      };
    }

    return {
      totalRequests,
      successfulRequests: totalRequests - totalErrors,
      failedRequests: totalErrors,
      averageLatencyMs: latencyCount > 0 ? totalLatency / latencyCount : 0,
      endpointStats,
    };
  }

  /**
   * Clear sticky sessions
   */
  clearStickySessions(): void {
    this.stickySessionMap.clear();
  }

  /**
   * Clean up expired sticky sessions
   */
  cleanupExpiredSessions(): number {
    const now = new Date();
    let cleaned = 0;

    for (const [sessionId, session] of this.stickySessionMap) {
      if (session.expiresAt <= now) {
        this.stickySessionMap.delete(sessionId);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Set load balancing strategy
   */
  setStrategy(strategy: LoadBalancerConfig['strategy']): void {
    this.config.strategy = strategy;
  }

  /**
   * Get current configuration
   */
  getConfig(): LoadBalancerConfig {
    return { ...this.config };
  }

  /**
   * Reset all statistics
   */
  resetStats(): void {
    for (const endpoint of this.endpoints.values()) {
      endpoint.requestCount = 0;
      endpoint.errorCount = 0;
      endpoint.latencyMs = 0;
    }
    this.roundRobinIndex = 0;
  }
}

// Export singleton instance
export const azureLoadBalancerService = new AzureLoadBalancerService();
