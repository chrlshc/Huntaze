/**
 * AI Router Health Validator
 * 
 * Validates the health and accessibility of the AI Router deployed on AWS ECS.
 * 
 * @requirements 1.1, 1.2, 5.2
 */

import type { HealthCheckResult, AIRouterHealthValidator } from './types';
import { externalFetch } from '@/lib/services/external/http';
import { isExternalServiceError } from '@/lib/services/external/errors';

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
      const response = await externalFetch(`${this.routerUrl}/health`, {
        service: 'ai-router',
        operation: 'health.check',
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        timeoutMs: HEALTH_CHECK_TIMEOUT_MS,
        retry: { maxRetries: 1, retryMethods: ['GET'] },
      });
      
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
      
      const data = await response.json().catch(() => ({}));
      
      return {
        healthy: data.status === 'healthy' || data.healthy === true,
        responseTimeMs,
        region: data.region || data.deployment?.region || 'unknown',
        service: data.service || 'ai-router',
        timestamp: new Date(),
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      
      if (isExternalServiceError(error) && error.code === 'TIMEOUT') {
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
      const response = await externalFetch(`${this.routerUrl}/health`, {
        service: 'ai-router',
        operation: 'health.accessibility',
        method: 'GET',
        timeoutMs: ACCESSIBILITY_TIMEOUT_MS,
        retry: { maxRetries: 0, retryMethods: ['GET'] },
      });

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
