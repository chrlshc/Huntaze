/**
 * Property Test: AI Service Response Metadata
 * 
 * **Feature: aws-ai-system-validation, Property 8: AI Service Response Metadata**
 * **Validates: Requirements 8.1, 8.2, 8.3**
 * 
 * Tests that:
 * 1. All responses include model metadata
 * 2. Request types route to appropriate models
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  E2EValidatorService,
  validateMetadataFields,
  validateModelForRequestType,
  isValidRegion,
  isValidDeployment,
  createMockMetadata,
  getValidModelsForRequestType,
  getAllRequestTypes,
} from '@/lib/ai/validation/e2e-validator';
import { AIServiceResponseMetadata, RequestType } from '@/lib/ai/validation/types';

// Arbitraries for generating test data
const requestTypeArb: fc.Arbitrary<RequestType> = fc.constantFrom(
  'chat',
  'math',
  'coding',
  'creative'
);

const modelArb = fc.constantFrom(
  'gpt-4',
  'gpt-4-turbo',
  'gpt-3.5-turbo',
  'mistral-large',
  'mistral-small',
  'claude-3-opus',
  'claude-3-sonnet',
  'claude-3-haiku'
);

const regionArb = fc.constantFrom(
  'us-east-1',
  'us-west-2',
  'eu-west-1',
  'eastus',
  'westus2'
);

const deploymentArb = fc.constantFrom('production', 'staging', 'canary');

const metadataArb: fc.Arbitrary<AIServiceResponseMetadata> = fc.record({
  model: modelArb,
  deployment: deploymentArb,
  region: regionArb,
  requestType: requestTypeArb,
});

describe('Property 8: AI Service Response Metadata', () => {
  describe('Requirement 8.1: All responses include model metadata', () => {
    it('should validate that complete metadata has all required fields', () => {
      fc.assert(
        fc.property(metadataArb, (metadata) => {
          const validation = validateMetadataFields(metadata);

          // Property: complete metadata should always be valid
          expect(validation.valid).toBe(true);
          expect(validation.missingFields).toHaveLength(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should detect missing fields in incomplete metadata', () => {
      fc.assert(
        fc.property(
          fc.record({
            model: fc.option(modelArb, { nil: undefined }),
            deployment: fc.option(deploymentArb, { nil: undefined }),
            region: fc.option(regionArb, { nil: undefined }),
            requestType: fc.option(requestTypeArb, { nil: undefined }),
          }),
          (partialMetadata) => {
            // Count how many fields are missing
            const missingCount = [
              partialMetadata.model,
              partialMetadata.deployment,
              partialMetadata.region,
              partialMetadata.requestType,
            ].filter(v => v === undefined).length;

            if (missingCount === 0) {
              // All fields present - should be valid
              const validation = validateMetadataFields(
                partialMetadata as AIServiceResponseMetadata
              );
              expect(validation.valid).toBe(true);
            } else {
              // Some fields missing - should be invalid
              const validation = validateMetadataFields(
                partialMetadata as AIServiceResponseMetadata
              );
              expect(validation.valid).toBe(false);
              expect(validation.missingFields.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return all missing when metadata is null', () => {
      const validation = validateMetadataFields(null);

      expect(validation.valid).toBe(false);
      expect(validation.missingFields).toContain('all');
    });
  });

  describe('Requirement 8.2: Request types route to appropriate models', () => {
    it('should validate correct model routing for each request type', () => {
      fc.assert(
        fc.property(requestTypeArb, (requestType) => {
          const validModels = getValidModelsForRequestType(requestType);

          // Property: each request type should have at least one valid model
          expect(validModels.length).toBeGreaterThan(0);

          // Property: all valid models should pass validation
          for (const model of validModels) {
            expect(validateModelForRequestType(requestType, model)).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid models for request types', () => {
      fc.assert(
        fc.property(
          requestTypeArb,
          fc.string({ minLength: 1, maxLength: 20 }),
          (requestType, randomModel) => {
            const validModels = getValidModelsForRequestType(requestType);

            // If random model is not in valid list, it should be rejected
            if (!validModels.includes(randomModel)) {
              expect(validateModelForRequestType(requestType, randomModel)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should ensure chat requests can use general-purpose models', () => {
      const chatModels = getValidModelsForRequestType('chat');

      // Property: chat should support common models
      expect(chatModels).toContain('gpt-4');
      expect(chatModels).toContain('gpt-3.5-turbo');
    });

    it('should ensure math requests use capable models', () => {
      const mathModels = getValidModelsForRequestType('math');

      // Property: math should use high-capability models
      expect(mathModels).toContain('gpt-4');
      expect(mathModels).toContain('claude-3-opus');
    });

    it('should ensure coding requests use code-capable models', () => {
      const codingModels = getValidModelsForRequestType('coding');

      // Property: coding should use code-capable models
      expect(codingModels).toContain('gpt-4');
      expect(codingModels).toContain('claude-3-opus');
    });
  });

  describe('Requirement 8.3: Valid regions and deployments', () => {
    it('should validate all standard regions', () => {
      fc.assert(
        fc.property(regionArb, (region) => {
          // Property: all generated regions should be valid
          expect(isValidRegion(region)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid regions', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          (randomRegion) => {
            const validRegions = ['us-east-1', 'us-west-2', 'eu-west-1', 'eastus', 'westus2'];

            if (!validRegions.includes(randomRegion)) {
              expect(isValidRegion(randomRegion)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate all standard deployments', () => {
      fc.assert(
        fc.property(deploymentArb, (deployment) => {
          // Property: all generated deployments should be valid
          expect(isValidDeployment(deployment)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid deployments', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          (randomDeployment) => {
            const validDeployments = ['production', 'staging', 'canary'];

            if (!validDeployments.includes(randomDeployment)) {
              expect(isValidDeployment(randomDeployment)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('E2E Validator integration', () => {
    it('should return valid results for all request types', async () => {
      const requestTypes = getAllRequestTypes();

      for (const requestType of requestTypes) {
        const validator = new E2EValidatorService();
        const result = await validator.validateAIServiceResponse(requestType);

        // Property: all request types should produce valid results
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('responseTimeMs');
        expect(result).toHaveProperty('metadata');
        expect(result).toHaveProperty('routedCorrectly');

        if (result.success) {
          expect(result.metadata).not.toBeNull();
          expect(result.routedCorrectly).toBe(true);
        }
      }
    });

    it('should route requests to appropriate models', async () => {
      await fc.assert(
        fc.asyncProperty(requestTypeArb, async (requestType) => {
          const validator = new E2EValidatorService();
          const result = await validator.validateAIServiceResponse(requestType);

          if (result.success && result.metadata) {
            // Property: successful requests should be routed correctly
            const validModels = getValidModelsForRequestType(requestType);
            expect(validModels).toContain(result.metadata.model);
            expect(result.metadata.requestType).toBe(requestType);
          }
        }),
        { numRuns: 20 } // Fewer runs due to async nature
      );
    });
  });
});
