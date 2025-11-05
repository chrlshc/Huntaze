/**
 * Error Budget Gate System
 * Prevents deployments when SLO error budget is exhausted
 */

export interface ErrorBudgetConfig {
  sloTarget: number;          // SLO target (e.g., 99.9% = 0.999)
  windowDuration: number;     // Time window in seconds (e.g., 30 days)
  freezeThreshold: number;    // Freeze deployments when budget < threshold (e.g., 0.1 = 10%)
  warningThreshold: number;   // Warning when budget < threshold (e.g., 0.25 = 25%)
  criticalThreshold: number;  // Critical fixes only when budget < threshold (e.g., 0.05 = 5%)
  recoveryThreshold: number;  // Auto-unfreeze when budget > threshold (e.g., 0.15 = 15%)
}

export interface ErrorBudgetStatus {
  serviceName: string;
  sloTarget: number;
  currentAvailability: number;
  errorBudget: number;        // Remaining error budget (0-1)
  errorBudgetConsumed: number; // Consumed error budget (0-1)
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'FROZEN';
  deploymentAllowed: boolean;
  criticalFixesOnly: boolean;
  timeWindow: {
    start: number;
    end: number;
    duration: number;
  };
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    errorRate: number;
  };
  lastUpdated: number;
}

export interface DeploymentGateResult {
  allowed: boolean;
  reason: string;
  errorBudgetStatus: ErrorBudgetStatus;
  recommendations: string[];
}

class ErrorBudgetGate {
  private configs = new Map<string, ErrorBudgetConfig>();
  private budgetStatus = new Map<string, ErrorBudgetStatus>();
  private updateInterval: NodeJS.Timeout | null = null;

  registerService(serviceName: string, config: ErrorBudgetConfig): void {
    this.configs.set(serviceName, config);
    console.log(`📊 Error budget gate registered for service: ${serviceName}`);
  }

  async checkDeploymentGate(serviceName: string, deploymentType: 'normal' | 'critical' = 'normal'): Promise<DeploymentGateResult> {
    const config = this.configs.get(serviceName);
    if (!config) {
      return {
        allowed: true,
        reason: 'No error budget configuration found',
        errorBudgetStatus: this.createEmptyStatus(serviceName),
        recommendations: ['Configure error budget monitoring for this service']
      };
    }

    // Update error budget status
    const status = await this.updateErrorBudgetStatus(serviceName, config);
    
    // Determine if deployment is allowed
    const result = this.evaluateDeploymentGate(status, deploymentType);
    
    console.log(`🚪 Deployment gate check for ${serviceName}: ${result.allowed ? 'ALLOWED' : 'BLOCKED'} - ${result.reason}`);
    
    return result;
  }

  private async updateErrorBudgetStatus(serviceName: string, config: ErrorBudgetConfig): Promise<ErrorBudgetStatus> {
    const windowEnd = Date.now();
    const windowStart = windowEnd - (config.windowDuration * 1000);
    
    // Collect metrics for the time window
    const metrics = await this.collectServiceMetrics(serviceName, windowStart, windowEnd);
    
    // Calculate availability and error budget
    const currentAvailability = metrics.totalRequests > 0 
      ? metrics.successfulRequests / metrics.totalRequests 
      : 1.0;
    
    const errorRate = 1 - currentAvailability;
    const allowedErrorRate = 1 - config.sloTarget;
    
    // Calculate error budget consumption
    const errorBudgetConsumed = allowedErrorRate > 0 
      ? Math.min(1, errorRate / allowedErrorRate)
      : (errorRate > 0 ? 1 : 0);
    
    const errorBudget = Math.max(0, 1 - errorBudgetConsumed);
    
    // Determine status
    let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'FROZEN';
    let deploymentAllowed = true;
    let criticalFixesOnly = false;
    
    if (errorBudget < config.freezeThreshold) {
      status = 'FROZEN';
      deploymentAllowed = false;
      criticalFixesOnly = true;
    } else if (errorBudget < config.criticalThreshold) {
      status = 'CRITICAL';
      deploymentAllowed = false;
      criticalFixesOnly = true;
    } else if (errorBudget < config.warningThreshold) {
      status = 'WARNING';
      deploymentAllowed = true;
      criticalFixesOnly = false;
    } else {
      status = 'HEALTHY';
      deploymentAllowed = true;
      criticalFixesOnly = false;
    }
    
    const budgetStatus: ErrorBudgetStatus = {
      serviceName,
      sloTarget: config.sloTarget,
      currentAvailability,
      errorBudget,
      errorBudgetConsumed,
      status,
      deploymentAllowed,
      criticalFixesOnly,
      timeWindow: {
        start: windowStart,
        end: windowEnd,
        duration: config.windowDuration
      },
      metrics: {
        ...metrics,
        errorRate
      },
      lastUpdated: Date.now()
    };
    
    this.budgetStatus.set(serviceName, budgetStatus);
    return budgetStatus;
  }

  private evaluateDeploymentGate(status: ErrorBudgetStatus, deploymentType: 'normal' | 'critical'): DeploymentGateResult {
    const recommendations: string[] = [];
    
    // Check if deployment is allowed
    if (!status.deploymentAllowed && deploymentType === 'normal') {
      recommendations.push('Wait for error budget to recover above threshold');
      recommendations.push('Focus on fixing existing issues to improve availability');
      recommendations.push('Consider deploying critical fixes only');
      
      return {
        allowed: false,
        reason: `Error budget exhausted (${(status.errorBudget * 100).toFixed(1)}% remaining, threshold: ${this.getThresholdForStatus(status.status) * 100}%)`,
        errorBudgetStatus: status,
        recommendations
      };
    }
    
    if (status.criticalFixesOnly && deploymentType === 'normal') {
      recommendations.push('Only critical fixes should be deployed');
      recommendations.push('Postpone feature deployments until error budget recovers');
      
      return {
        allowed: false,
        reason: `Critical fixes only mode (${(status.errorBudget * 100).toFixed(1)}% error budget remaining)`,
        errorBudgetStatus: status,
        recommendations
      };
    }
    
    // Generate recommendations based on status
    switch (status.status) {
      case 'WARNING':
        recommendations.push('Monitor deployment closely');
        recommendations.push('Consider smaller, lower-risk deployments');
        recommendations.push('Have rollback plan ready');
        break;
      case 'CRITICAL':
        if (deploymentType === 'critical') {
          recommendations.push('Deploy critical fix with extra caution');
          recommendations.push('Monitor error budget impact closely');
          recommendations.push('Be ready for immediate rollback');
        }
        break;
      case 'HEALTHY':
        recommendations.push('Error budget is healthy for normal deployments');
        break;
    }
    
    return {
      allowed: true,
      reason: deploymentType === 'critical' 
        ? 'Critical fix deployment approved'
        : `Deployment allowed (${(status.errorBudget * 100).toFixed(1)}% error budget remaining)`,
      errorBudgetStatus: status,
      recommendations
    };
  }

  private async collectServiceMetrics(serviceName: string, startTime: number, endTime: number): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
  }> {
    // In a real implementation, this would query Prometheus or other metrics system
    // For simulation, generate realistic metrics
    
    const durationHours = (endTime - startTime) / (1000 * 60 * 60);
    const baseRequestsPerHour = 1000 + Math.random() * 9000; // 1K-10K requests/hour
    
    const totalRequests = Math.floor(baseRequestsPerHour * durationHours);
    const errorRate = Math.random() * 0.02; // 0-2% error rate
    const failedRequests = Math.floor(totalRequests * errorRate);
    const successfulRequests = totalRequests - failedRequests;
    
    return {
      totalRequests,
      successfulRequests,
      failedRequests
    };
  }

  private getThresholdForStatus(status: string): number {
    // Return the threshold that triggered this status
    switch (status) {
      case 'FROZEN': return 0.1;   // 10%
      case 'CRITICAL': return 0.05; // 5%
      case 'WARNING': return 0.25;  // 25%
      default: return 1.0;
    }
  }

  private createEmptyStatus(serviceName: string): ErrorBudgetStatus {
    return {
      serviceName,
      sloTarget: 0.999,
      currentAvailability: 1.0,
      errorBudget: 1.0,
      errorBudgetConsumed: 0,
      status: 'HEALTHY',
      deploymentAllowed: true,
      criticalFixesOnly: false,
      timeWindow: {
        start: Date.now() - 86400000, // 24 hours ago
        end: Date.now(),
        duration: 86400
      },
      metrics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        errorRate: 0
      },
      lastUpdated: Date.now()
    };
  }

  // Auto-recovery check
  async checkAutoRecovery(serviceName: string): Promise<boolean> {
    const config = this.configs.get(serviceName);
    const status = this.budgetStatus.get(serviceName);
    
    if (!config || !status) return false;
    
    if (status.status === 'FROZEN' && status.errorBudget >= config.recoveryThreshold) {
      console.log(`🔓 Auto-unfreezing deployments for ${serviceName} (error budget recovered to ${(status.errorBudget * 100).toFixed(1)}%)`);
      
      // Update status to allow deployments
      status.status = status.errorBudget >= config.warningThreshold ? 'HEALTHY' : 'WARNING';
      status.deploymentAllowed = true;
      status.criticalFixesOnly = false;
      
      return true;
    }
    
    return false;
  }

  // Start continuous monitoring
  startContinuousMonitoring(): void {
    if (this.updateInterval) return;
    
    this.updateInterval = setInterval(async () => {
      for (const [serviceName, config] of this.configs) {
        try {
          await this.updateErrorBudgetStatus(serviceName, config);
          await this.checkAutoRecovery(serviceName);
        } catch (error) {
          console.error(`Error updating budget status for ${serviceName}:`, error);
        }
      }
    }, 60000); // Update every minute
    
    console.log('📊 Error budget continuous monitoring started');
  }

  stopContinuousMonitoring(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('📊 Error budget continuous monitoring stopped');
    }
  }

  // Public API methods
  getErrorBudgetStatus(serviceName: string): ErrorBudgetStatus | undefined {
    return this.budgetStatus.get(serviceName);
  }

  getAllErrorBudgetStatuses(): ErrorBudgetStatus[] {
    return Array.from(this.budgetStatus.values());
  }

  async forceUnfreeze(serviceName: string, reason: string): Promise<void> {
    const status = this.budgetStatus.get(serviceName);
    if (status) {
      status.status = 'WARNING';
      status.deploymentAllowed = true;
      status.criticalFixesOnly = false;
      console.log(`🔓 Force unfroze deployments for ${serviceName}: ${reason}`);
    }
  }

  async forceFreeze(serviceName: string, reason: string): Promise<void> {
    const status = this.budgetStatus.get(serviceName);
    if (status) {
      status.status = 'FROZEN';
      status.deploymentAllowed = false;
      status.criticalFixesOnly = true;
      console.log(`🔒 Force froze deployments for ${serviceName}: ${reason}`);
    }
  }

  // Calculate projected error budget impact
  calculateProjectedImpact(serviceName: string, estimatedErrorRate: number, deploymentDuration: number): {
    projectedBudgetConsumption: number;
    projectedBudgetRemaining: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  } {
    const status = this.budgetStatus.get(serviceName);
    if (!status) {
      return {
        projectedBudgetConsumption: 0,
        projectedBudgetRemaining: 1,
        riskLevel: 'LOW'
      };
    }

    const config = this.configs.get(serviceName)!;
    const allowedErrorRate = 1 - config.sloTarget;
    
    // Calculate additional budget consumption from deployment
    const additionalConsumption = deploymentDuration > 0 
      ? (estimatedErrorRate * deploymentDuration) / (allowedErrorRate * config.windowDuration)
      : 0;
    
    const projectedBudgetConsumption = status.errorBudgetConsumed + additionalConsumption;
    const projectedBudgetRemaining = Math.max(0, 1 - projectedBudgetConsumption);
    
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    if (projectedBudgetRemaining < config.freezeThreshold) {
      riskLevel = 'HIGH';
    } else if (projectedBudgetRemaining < config.warningThreshold) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'LOW';
    }
    
    return {
      projectedBudgetConsumption,
      projectedBudgetRemaining,
      riskLevel
    };
  }
}

// Global instance
export const errorBudgetGate = new ErrorBudgetGate();

// Default configuration
export const defaultErrorBudgetConfig: ErrorBudgetConfig = {
  sloTarget: 0.999,           // 99.9% availability
  windowDuration: 2592000,    // 30 days
  freezeThreshold: 0.1,       // 10%
  warningThreshold: 0.25,     // 25%
  criticalThreshold: 0.05,    // 5%
  recoveryThreshold: 0.15     // 15%
};

// Setup default services
export const setupDefaultErrorBudgetGates = () => {
  // API Gateway
  errorBudgetGate.registerService('api-gateway', {
    ...defaultErrorBudgetConfig,
    sloTarget: 0.999,  // 99.9%
    freezeThreshold: 0.05  // More strict for critical service
  });

  // User Service
  errorBudgetGate.registerService('user-service', {
    ...defaultErrorBudgetConfig,
    sloTarget: 0.995,  // 99.5%
    freezeThreshold: 0.1
  });

  // Analytics Service
  errorBudgetGate.registerService('analytics-service', {
    ...defaultErrorBudgetConfig,
    sloTarget: 0.99,   // 99%
    freezeThreshold: 0.15  // Less strict for non-critical service
  });

  console.log('📊 Default error budget gates configured');
};