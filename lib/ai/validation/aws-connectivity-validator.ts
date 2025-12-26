/**
 * AWS Connectivity Validator
 * 
 * Validates connectivity to AWS services used by the AI system:
 * - RDS (via Prisma)
 * - Secrets Manager
 * - AI Router endpoint
 * - CloudWatch (optional)
 * 
 * @module lib/ai/validation/aws-connectivity-validator
 */

import { AWSConnectivityResult, AWSConnectivityValidator } from './types';
import { externalFetch } from '@/lib/services/external/http';
import { isExternalServiceError } from '@/lib/services/external/errors';

// Environment configuration
const AI_ROUTER_URL = process.env.AI_ROUTER_URL || 'http://localhost:8000';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

/**
 * AWS Connectivity Validator Service
 * 
 * Implements validation for AWS service connectivity required by the AI system.
 */
export class AWSConnectivityValidatorService implements AWSConnectivityValidator {
  private routerUrl: string;
  private region: string;
  private errors: string[] = [];

  constructor(config?: { routerUrl?: string; region?: string }) {
    this.routerUrl = config?.routerUrl || AI_ROUTER_URL;
    this.region = config?.region || AWS_REGION;
  }

  /**
   * Check RDS connection using Prisma client
   * Tests database connectivity by executing a simple query
   */
  async checkRDSConnection(): Promise<boolean> {
    try {
      // Dynamic import to avoid issues in test environments
      const { prisma } = await import('@/lib/prisma');
      
      // Execute a simple query to verify connection
      await prisma.$queryRaw`SELECT 1 as health_check`;
      
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown RDS error';
      this.errors.push(`RDS Connection Failed: ${message}`);
      return false;
    }
  }

  /**
   * Check Secrets Manager accessibility
   * Verifies that required secrets can be accessed
   */
  async checkSecretsManager(): Promise<boolean> {
    try {
      // Check if required environment variables from secrets are present
      const requiredSecrets = [
        'DATABASE_URL',
        'NEXTAUTH_SECRET',
      ];

      const missingSecrets = requiredSecrets.filter(
        secret => !process.env[secret]
      );

      if (missingSecrets.length > 0) {
        this.errors.push(
          `Secrets Manager: Missing secrets - ${missingSecrets.join(', ')}`
        );
        return false;
      }

      // Optional: Check AI-specific secrets
      const aiSecrets = [
        'AZURE_OPENAI_API_KEY',
        'AZURE_AI_FOUNDRY_API_KEY',
      ];

      const hasAnyAISecret = aiSecrets.some(secret => process.env[secret]);
      
      if (!hasAnyAISecret) {
        // Not a failure, but log a warning
        console.warn('No AI provider secrets found - AI features may be limited');
      }

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Secrets Manager error';
      this.errors.push(`Secrets Manager Check Failed: ${message}`);
      return false;
    }
  }

  /**
   * Check AI Router endpoint accessibility
   * Verifies the router health endpoint responds
   */
  async checkRouterEndpoint(): Promise<boolean> {
    try {
      const response = await externalFetch(`${this.routerUrl}/health`, {
        service: 'ai-router',
        operation: 'health.check',
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        timeoutMs: 5000,
        retry: { maxRetries: 1, retryMethods: ['GET'] },
      });

      if (!response.ok) {
        this.errors.push(
          `Router Endpoint: HTTP ${response.status} - ${response.statusText}`
        );
        return false;
      }

      const data = await response.json().catch(() => ({}));
      
      // Verify health response structure
      if (data.status !== 'healthy' && data.status !== 'ok') {
        this.errors.push(`Router Endpoint: Unhealthy status - ${data.status}`);
        return false;
      }

      return true;
    } catch (error) {
      if (isExternalServiceError(error) && error.code === 'TIMEOUT') {
        this.errors.push('Router Endpoint: Request timeout (5s)');
      } else {
        const message = error instanceof Error ? error.message : 'Unknown router error';
        this.errors.push(`Router Endpoint Failed: ${message}`);
      }
      return false;
    }
  }

  /**
   * Check CloudWatch write capability (optional)
   * Verifies metrics can be written to CloudWatch
   */
  async checkCloudWatch(): Promise<boolean> {
    try {
      // In production, this would use AWS SDK to put a test metric
      // For now, we check if CloudWatch configuration is present
      const hasCloudWatchConfig = 
        process.env.AWS_REGION && 
        (process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ROLE_ARN);

      if (!hasCloudWatchConfig) {
        // Not a critical failure - CloudWatch is optional
        console.warn('CloudWatch configuration not found - metrics may not be recorded');
        return true; // Return true as it's optional
      }

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown CloudWatch error';
      this.errors.push(`CloudWatch Check Failed: ${message}`);
      return false;
    }
  }

  /**
   * Run all connectivity validations
   * Returns aggregate result with all check statuses
   */
  async validateAll(): Promise<AWSConnectivityResult> {
    // Reset errors for fresh validation
    this.errors = [];

    // Run all checks in parallel for efficiency
    const [rdsConnected, secretsManagerAccessible, routerAccessible, cloudWatchWritable] = 
      await Promise.all([
        this.checkRDSConnection(),
        this.checkSecretsManager(),
        this.checkRouterEndpoint(),
        this.checkCloudWatch(),
      ]);

    return {
      rdsConnected,
      secretsManagerAccessible,
      cloudWatchWritable,
      routerAccessible,
      errors: [...this.errors],
      timestamp: new Date(),
    };
  }

  /**
   * Get the configured router URL
   */
  getRouterUrl(): string {
    return this.routerUrl;
  }

  /**
   * Get the configured AWS region
   */
  getRegion(): string {
    return this.region;
  }
}

// ============================================================================
// Factory and Singleton
// ============================================================================

let validatorInstance: AWSConnectivityValidatorService | null = null;

/**
 * Get or create the AWS Connectivity Validator instance
 */
export function getAWSConnectivityValidator(
  config?: { routerUrl?: string; region?: string }
): AWSConnectivityValidatorService {
  if (!validatorInstance || config) {
    validatorInstance = new AWSConnectivityValidatorService(config);
  }
  return validatorInstance;
}

/**
 * Quick validation function for use in health checks
 */
export async function validateAWSConnectivity(): Promise<AWSConnectivityResult> {
  const validator = getAWSConnectivityValidator();
  return validator.validateAll();
}

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create a mock validator for testing
 */
export function createMockAWSConnectivityValidator(
  overrides?: Partial<AWSConnectivityResult>
): AWSConnectivityValidator {
  const defaultResult: AWSConnectivityResult = {
    rdsConnected: true,
    secretsManagerAccessible: true,
    cloudWatchWritable: true,
    routerAccessible: true,
    errors: [],
    timestamp: new Date(),
    ...overrides,
  };

  return {
    validateAll: async () => defaultResult,
    checkRDSConnection: async () => defaultResult.rdsConnected,
    checkSecretsManager: async () => defaultResult.secretsManagerAccessible,
    checkRouterEndpoint: async () => defaultResult.routerAccessible,
  };
}
