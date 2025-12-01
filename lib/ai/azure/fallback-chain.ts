/**
 * Fallback Chain with Circuit Breakers for Azure OpenAI
 * 
 * Feature: huntaze-ai-azure-migration
 * Task 7: Implement fallback chain with circuit breakers
 * Validates: Requirements 1.4, 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { CircuitBreaker, CircuitState } from './circuit-breaker';
import { AzureOpenAIService } from './azure-openai.service';
import type { AzureDeployment } from './azure-openai.config';
import type { GenerationOptions, GenerationResponse, ChatMessage } from './azure-openai.types';

export interface FallbackConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export interface FallbackChainConfig {
  primary: AzureDeployment;
  secondary?: AzureDeployment;
  dr?: AzureDeployment;
  fallbackConfig: FallbackConfig;
}

export class FallbackChain {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private services: Map<string, AzureOpenAIService> = new Map();

  constructor(private config: FallbackChainConfig) {
    // Initialize circuit breakers for each deployment
    this.initCircuitBreaker(config.primary);
    if (config.secondary) {
      this.initCircuitBreaker(config.secondary);
    }
    if (config.dr) {
      this.initCircuitBreaker(config.dr);
    }
  }

  /**
   * Initialize circuit breaker for a deployment
   */
  private initCircuitBreaker(deployment: AzureDeployment): void {
    if (!this.circuitBreakers.has(deployment)) {
      this.circuitBreakers.set(
        deployment,
        new CircuitBreaker(deployment, {
          failureThreshold: 5,
          failureRate: 0.5,
          successThreshold: 2,
          timeout: 60000,
          windowSize: 10,
        })
      );
    }
  }

  /**
   * Get or create service for deployment
   */
  private getService(deployment: AzureDeployment): AzureOpenAIService {
    if (!this.services.has(deployment)) {
      this.services.set(deployment, new AzureOpenAIService(deployment));
    }
    return this.services.get(deployment)!;
  }

  /**
   * Execute with fallback chain
   */
  async executeWithFallback<T>(
    operation: (service: AzureOpenAIService) => Promise<T>
  ): Promise<{ result: T; deployment: string; attempts: number }> {
    const deployments = this.getDeploymentChain();
    let lastError: Error | undefined;
    let attempts = 0;

    for (const deployment of deployments) {
      const circuitBreaker = this.circuitBreakers.get(deployment);
      if (!circuitBreaker) continue;

      // Skip if circuit is open and timeout hasn't passed
      if (circuitBreaker.getState() === CircuitState.OPEN) {
        console.log(`Skipping ${deployment} - circuit breaker is OPEN`);
        continue;
      }

      // Try with exponential backoff
      const result = await this.executeWithRetry(
        deployment,
        operation,
        this.config.fallbackConfig
      );

      if (result.success) {
        return {
          result: result.data!,
          deployment,
          attempts: attempts + result.attempts,
        };
      }

      lastError = result.error;
      attempts += result.attempts;
    }

    throw lastError || new Error('All fallback deployments failed');
  }

  /**
   * Execute with retry and exponential backoff
   */
  private async executeWithRetry<T>(
    deployment: AzureDeployment,
    operation: (service: AzureOpenAIService) => Promise<T>,
    config: FallbackConfig
  ): Promise<{ success: boolean; data?: T; error?: Error; attempts: number }> {
    const service = this.getService(deployment);
    const circuitBreaker = this.circuitBreakers.get(deployment)!;
    let attempts = 0;
    let delay = config.initialDelay;

    for (let i = 0; i <= config.maxRetries; i++) {
      attempts++;

      try {
        const result = await circuitBreaker.execute(() => operation(service));
        return { success: true, data: result, attempts };
      } catch (error) {
        console.log(`Attempt ${i + 1} failed for ${deployment}:`, error);

        // Don't retry if circuit is now open
        if (circuitBreaker.getState() === CircuitState.OPEN) {
          return {
            success: false,
            error: error as Error,
            attempts,
          };
        }

        // Don't retry on last attempt
        if (i === config.maxRetries) {
          return {
            success: false,
            error: error as Error,
            attempts,
          };
        }

        // Wait before retry with exponential backoff
        await this.sleep(delay);
        delay = Math.min(delay * config.backoffFactor, config.maxDelay);
      }
    }

    return {
      success: false,
      error: new Error('Max retries exceeded'),
      attempts,
    };
  }

  /**
   * Get deployment chain (primary → secondary → DR)
   */
  private getDeploymentChain(): AzureDeployment[] {
    const chain: AzureDeployment[] = [this.config.primary];
    
    if (this.config.secondary) {
      chain.push(this.config.secondary);
    }
    
    if (this.config.dr) {
      chain.push(this.config.dr);
    }
    
    return chain;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Chat with fallback
   */
  async chat(
    messages: ChatMessage[],
    options: GenerationOptions = {}
  ): Promise<GenerationResponse & { deployment: string; attempts: number }> {
    const result = await this.executeWithFallback(
      (service) => service.chat(messages, options)
    );

    return {
      ...result.result,
      deployment: result.deployment,
      attempts: result.attempts,
    };
  }

  /**
   * Generate text with fallback
   */
  async generateText(
    prompt: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResponse & { deployment: string; attempts: number }> {
    const result = await this.executeWithFallback(
      (service) => service.generateText(prompt, options)
    );

    return {
      ...result.result,
      deployment: result.deployment,
      attempts: result.attempts,
    };
  }

  /**
   * Get circuit breaker metrics for all deployments
   */
  getMetrics(): Record<string, any> {
    const metrics: Record<string, any> = {};
    
    this.circuitBreakers.forEach((breaker, deployment) => {
      metrics[deployment] = breaker.getMetrics();
    });
    
    return metrics;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.circuitBreakers.forEach(breaker => breaker.reset());
  }
}
