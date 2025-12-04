/**
 * AI Router Health Validator
 * 
 * Validates the health and accessibility of the AI Router deployed on AWS ECS.
 * 
 * @requirements 1.1, 1.2, 5.2
 */

import type { HealthCheckResult, AIRouterHealthValidator } from './types';

const HEALTH_CHECK_TIMEOUT_MS = 1000;
const ACCESSIBILITY_TIMEOUT_MS = 5000;

export class RouterHealthValidator implements AIRouterHealthValidator {
  private routerUrl: string;

  constructor(routerUrl?: string) {
    this.routerUrl = routerUrl || process.env.AI_ROUTER_URL || 'http://localhost:8000';
  }

  getRouterUrl(): string {
    return this.routerUrl;
  }

  /**
   * Check the health of the AI Router
   * Should respond within 1 second with status "healthy"
   */
  async checkHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);
      
      const response = await fetch(`${this.routerUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      const responseTimeMs = Date.now() - startTime;
      
      if (!response.ok) {
        return {
          healthy: false,
          responseTimeMs,
          region: 'unknown',
          service: 'ai-router',
          timestamp: new Date(),
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
      
      const data = await response.json();
      
      return {
        healthy: data.status === 'healthy' || data.healthy === true,
        responseTimeMs,
        region: data.region || data.deployment?.region || 'unknown',
        service: data.service || 'ai-router',
        timestamp: new Date(),
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          healthy: false,
          responseTimeMs,
          region: 'unknown',
          service: 'ai-router',
          timestamp: new Date(),
          error: `Health check timed out after ${HEALTH_CHECK_TIMEOUT_MS}ms`,
        };
      }
      
      return {
        healthy: false,
        responseTimeMs,
        region: 'unknown',
        service: 'ai-router',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if the AI Router endpoint is accessible
   * Uses a longer timeout (5 seconds) for accessibility check
   */
  async checkEndpointAccessibility(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), ACCESSIBILITY_TIMEOUT_MS);
      
      const response = await fetch(`${this.routerUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Create a health validator instance with default configuration
 */
export function createHealthValidator(routerUrl?: string): AIRouterHealthValidator {
  return new RouterHealthValidator(routerUrl);
}

/**
 * Quick health check utility function
 */
export async function quickHealthCheck(routerUrl?: string): Promise<boolean> {
  const validator = createHealthValidator(routerUrl);
  const result = await validator.checkHealth();
  return result.healthy && result.responseTimeMs < HEALTH_CHECK_TIMEOUT_MS;
}
