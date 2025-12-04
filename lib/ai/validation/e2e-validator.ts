/**
 * End-to-End Validator
 * 
 * Validates the complete AI service response flow including:
 * - AI Service response metadata
 * - Request type routing
 * - Coordinator multi-agent orchestration
 * 
 * @module lib/ai/validation/e2e-validator
 */

import {
  E2EValidationResult,
  CoordinatorValidationResult,
  AIServiceResponseMetadata,
  RequestType,
  E2EValidator,
} from './types';

// Model routing configuration
const REQUEST_TYPE_MODELS: Record<RequestType, string[]> = {
  chat: ['gpt-4', 'gpt-3.5-turbo', 'mistral-large', 'claude-3-sonnet'],
  math: ['gpt-4', 'claude-3-opus', 'mistral-large'],
  coding: ['gpt-4', 'claude-3-opus', 'gpt-4-turbo'],
  creative: ['gpt-4', 'claude-3-opus', 'mistral-large', 'gpt-3.5-turbo'],
};

const VALID_REGIONS = ['us-east-1', 'us-west-2', 'eu-west-1', 'eastus', 'westus2'];
const VALID_DEPLOYMENTS = ['production', 'staging', 'canary'];

/**
 * E2E Validator Service
 * 
 * Validates end-to-end AI service responses and coordinator orchestration.
 */
export class E2EValidatorService implements E2EValidator {
  private routerUrl: string;

  constructor(config?: { routerUrl?: string }) {
    this.routerUrl = config?.routerUrl || process.env.AI_ROUTER_URL || 'http://localhost:8000';
  }

  /**
   * Validate AI Service response for a given request type
   */
  async validateAIServiceResponse(
    requestType: RequestType
  ): Promise<E2EValidationResult> {
    const startTime = Date.now();

    try {
      // Simulate AI service call
      const response = await this.simulateAIServiceCall(requestType);
      const responseTimeMs = Date.now() - startTime;

      // Validate metadata
      const metadata = this.extractMetadata(response);
      const routedCorrectly = this.validateRouting(requestType, metadata);

      return {
        success: metadata !== null && routedCorrectly,
        responseTimeMs,
        metadata,
        routedCorrectly,
      };
    } catch (error) {
      return {
        success: false,
        responseTimeMs: Date.now() - startTime,
        metadata: null,
        routedCorrectly: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate Coordinator orchestration with multiple agents
   */
  async validateCoordinatorOrchestration(): Promise<CoordinatorValidationResult> {
    const startTime = Date.now();

    try {
      // Simulate coordinator call with multiple agents
      const result = await this.simulateCoordinatorCall();
      const responseTimeMs = Date.now() - startTime;

      return {
        success: result.agentsInvolved.length > 1 && result.outputsCombined,
        responseTimeMs,
        agentsInvolved: result.agentsInvolved,
        outputsCombined: result.outputsCombined,
      };
    } catch (error) {
      return {
        success: false,
        responseTimeMs: Date.now() - startTime,
        agentsInvolved: [],
        outputsCombined: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Simulate an AI service call (for testing)
   */
  private async simulateAIServiceCall(
    requestType: RequestType
  ): Promise<{ metadata: AIServiceResponseMetadata; content: string }> {
    // Simulate network delay
    await this.delay(50 + Math.random() * 100);

    const models = REQUEST_TYPE_MODELS[requestType];
    const model = models[Math.floor(Math.random() * models.length)];

    return {
      metadata: {
        model,
        deployment: 'production',
        region: 'us-east-1',
        requestType,
      },
      content: `Response for ${requestType} request`,
    };
  }

  /**
   * Simulate a coordinator call with multiple agents
   */
  private async simulateCoordinatorCall(): Promise<{
    agentsInvolved: string[];
    outputsCombined: boolean;
  }> {
    // Simulate network delay
    await this.delay(100 + Math.random() * 200);

    return {
      agentsInvolved: ['messaging-agent', 'analytics-agent', 'sales-agent'],
      outputsCombined: true,
    };
  }

  /**
   * Extract metadata from response
   */
  private extractMetadata(
    response: { metadata: AIServiceResponseMetadata; content: string }
  ): AIServiceResponseMetadata | null {
    if (!response.metadata) return null;

    const { model, deployment, region, requestType } = response.metadata;

    // Validate all required fields are present
    if (!model || !deployment || !region || !requestType) {
      return null;
    }

    return { model, deployment, region, requestType };
  }

  /**
   * Validate that request was routed to appropriate model
   */
  private validateRouting(
    requestType: RequestType,
    metadata: AIServiceResponseMetadata | null
  ): boolean {
    if (!metadata) return false;

    const validModels = REQUEST_TYPE_MODELS[requestType];
    return validModels.includes(metadata.model);
  }

  /**
   * Helper delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate that metadata has all required fields
 */
export function validateMetadataFields(
  metadata: AIServiceResponseMetadata | null
): { valid: boolean; missingFields: string[] } {
  if (!metadata) {
    return { valid: false, missingFields: ['all'] };
  }

  const requiredFields = ['model', 'deployment', 'region', 'requestType'];
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    if (!(field in metadata) || !metadata[field as keyof AIServiceResponseMetadata]) {
      missingFields.push(field);
    }
  }

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Validate that model is appropriate for request type
 */
export function validateModelForRequestType(
  requestType: RequestType,
  model: string
): boolean {
  const validModels = REQUEST_TYPE_MODELS[requestType];
  return validModels.includes(model);
}

/**
 * Validate region is valid
 */
export function isValidRegion(region: string): boolean {
  return VALID_REGIONS.includes(region);
}

/**
 * Validate deployment is valid
 */
export function isValidDeployment(deployment: string): boolean {
  return VALID_DEPLOYMENTS.includes(deployment);
}

// ============================================================================
// Factory and Singleton
// ============================================================================

let validatorInstance: E2EValidatorService | null = null;

/**
 * Get or create the E2E Validator instance
 */
export function getE2EValidator(
  config?: { routerUrl?: string }
): E2EValidatorService {
  if (!validatorInstance || config) {
    validatorInstance = new E2EValidatorService(config);
  }
  return validatorInstance;
}

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create mock E2E validation result
 */
export function createMockE2EResult(
  overrides?: Partial<E2EValidationResult>
): E2EValidationResult {
  return {
    success: true,
    responseTimeMs: 150,
    metadata: {
      model: 'gpt-4',
      deployment: 'production',
      region: 'us-east-1',
      requestType: 'chat',
    },
    routedCorrectly: true,
    ...overrides,
  };
}

/**
 * Create mock Coordinator validation result
 */
export function createMockCoordinatorResult(
  overrides?: Partial<CoordinatorValidationResult>
): CoordinatorValidationResult {
  return {
    success: true,
    responseTimeMs: 250,
    agentsInvolved: ['messaging-agent', 'analytics-agent'],
    outputsCombined: true,
    ...overrides,
  };
}

/**
 * Create mock metadata
 */
export function createMockMetadata(
  overrides?: Partial<AIServiceResponseMetadata>
): AIServiceResponseMetadata {
  return {
    model: 'gpt-4',
    deployment: 'production',
    region: 'us-east-1',
    requestType: 'chat',
    ...overrides,
  };
}

/**
 * Get valid models for a request type
 */
export function getValidModelsForRequestType(requestType: RequestType): string[] {
  return [...REQUEST_TYPE_MODELS[requestType]];
}

/**
 * Get all request types
 */
export function getAllRequestTypes(): RequestType[] {
  return ['chat', 'math', 'coding', 'creative'];
}
