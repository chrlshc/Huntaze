/**
 * Property Test: AI Model Routing Consistency
 * 
 * Feature: content-trends-ai-engine, Property 1
 * 
 * For any analysis task with determined complexity level, the system should
 * route simple tasks to DeepSeek V3, complex reasoning tasks to DeepSeek R1,
 * and visual tasks to Llama Vision.
 * 
 * Requirements: 2.1, 2.2
 * @see .kiro/specs/content-trends-ai-engine/design.md
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  ContentTrendsAIRouter,
  TaskComplexity,
  TaskModality,
  type AnalysisTask,
  type TaskType,
  determineComplexity,
  selectModel,
} from '../../../lib/ai/content-trends';

// ============================================================================
// Arbitraries (Test Data Generators)
// ============================================================================

const taskTypeArb = fc.constantFrom<TaskType>(
  'classification',
  'formatting',
  'summarization',
  'extraction',
  'viral_analysis',
  'strategy_generation',
  'script_generation',
  'visual_analysis',
  'ocr',
  'hook_analysis',
  'emotional_analysis',
  'trend_prediction'
);

const taskModalityArb = fc.constantFrom<TaskModality>(
  TaskModality.TEXT,
  TaskModality.VISUAL,
  TaskModality.MULTIMODAL
);

const priorityArb = fc.constantFrom<'low' | 'medium' | 'high' | 'urgent'>(
  'low', 'medium', 'high', 'urgent'
);


const textContentArb = fc.record({
  text: fc.string({ minLength: 10, maxLength: 5000 }),
});

const visualContentArb = fc.record({
  imageUrls: fc.array(fc.webUrl(), { minLength: 1, maxLength: 5 }),
});

const analysisTaskArb = (modality: TaskModality): fc.Arbitrary<AnalysisTask> => {
  const contentArb = modality === TaskModality.VISUAL || modality === TaskModality.MULTIMODAL
    ? visualContentArb
    : textContentArb;

  return fc.record({
    id: fc.uuid(),
    type: taskTypeArb,
    modality: fc.constant(modality),
    content: contentArb,
    priority: priorityArb,
  }) as fc.Arbitrary<AnalysisTask>;
};

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: content-trends-ai-engine, Property 1: AI Model Routing Consistency', () => {
  const router = new ContentTrendsAIRouter();

  describe('Visual tasks always route to Llama Vision', () => {
    it('should route VISUAL modality tasks to llama-vision', () => {
      fc.assert(
        fc.property(analysisTaskArb(TaskModality.VISUAL), (task) => {
          const decision = router.routeTask(task);
          expect(decision.model).toBe('llama-vision');
        }),
        { numRuns: 100 }
      );
    });

    it('should route MULTIMODAL tasks to llama-vision', () => {
      fc.assert(
        fc.property(analysisTaskArb(TaskModality.MULTIMODAL), (task) => {
          const decision = router.routeTask(task);
          expect(decision.model).toBe('llama-vision');
        }),
        { numRuns: 100 }
      );
    });
  });


  describe('Complex reasoning tasks route to DeepSeek R1', () => {
    const complexTaskTypes: TaskType[] = [
      'viral_analysis',
      'strategy_generation',
      'hook_analysis',
      'emotional_analysis',
      'trend_prediction',
    ];

    it('should route complex task types to deepseek-r1', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...complexTaskTypes),
          fc.uuid(),
          fc.string({ minLength: 10, maxLength: 1000 }),
          priorityArb,
          (taskType, id, text, priority) => {
            const task: AnalysisTask = {
              id,
              type: taskType,
              modality: TaskModality.TEXT,
              content: { text },
              priority,
            };
            const decision = router.routeTask(task);
            expect(decision.model).toBe('deepseek-r1');
            expect(decision.complexity).toBe(TaskComplexity.COMPLEX);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Simple tasks route to DeepSeek V3', () => {
    const simpleTaskTypes: TaskType[] = [
      'classification',
      'formatting',
      'extraction',
    ];

    it('should route simple task types to deepseek-v3', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...simpleTaskTypes),
          fc.uuid(),
          fc.string({ minLength: 10, maxLength: 1000 }),
          priorityArb,
          (taskType, id, text, priority) => {
            const task: AnalysisTask = {
              id,
              type: taskType,
              modality: TaskModality.TEXT,
              content: { text },
              priority,
            };
            const decision = router.routeTask(task);
            expect(decision.model).toBe('deepseek-v3');
            expect(decision.complexity).toBe(TaskComplexity.SIMPLE);
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  describe('Routing decision includes valid metadata', () => {
    it('should always include endpoint configuration', () => {
      fc.assert(
        fc.property(analysisTaskArb(TaskModality.TEXT), (task) => {
          const decision = router.routeTask(task);
          expect(decision.endpoint).toBeDefined();
          expect(decision.endpoint.modelId).toBeDefined();
          expect(decision.endpoint.deploymentName).toBeDefined();
        }),
        { numRuns: 100 }
      );
    });

    it('should always include cost estimation', () => {
      fc.assert(
        fc.property(analysisTaskArb(TaskModality.TEXT), (task) => {
          const decision = router.routeTask(task);
          expect(decision.estimatedCost).toBeDefined();
          expect(decision.estimatedCost.inputTokens).toBeGreaterThan(0);
          expect(decision.estimatedCost.outputTokens).toBeGreaterThan(0);
          expect(decision.estimatedCost.totalCost).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should always include routing reason', () => {
      fc.assert(
        fc.property(analysisTaskArb(TaskModality.TEXT), (task) => {
          const decision = router.routeTask(task);
          expect(decision.reason).toBeDefined();
          expect(decision.reason.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('DeepSeek R1 uses correct temperature', () => {
    it('should use temperature 0.6 for R1 reasoning tasks', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<TaskType>('viral_analysis', 'hook_analysis', 'emotional_analysis'),
          fc.uuid(),
          fc.string({ minLength: 10, maxLength: 1000 }),
          (taskType, id, text) => {
            const task: AnalysisTask = {
              id,
              type: taskType,
              modality: TaskModality.TEXT,
              content: { text },
              priority: 'medium',
            };
            const decision = router.routeTask(task);
            // Requirement 2.4: Temperature 0.6 for R1
            expect(decision.parameters.temperature).toBe(0.6);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Complexity override is respected', () => {
    it('should use complexity override when provided', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<TaskComplexity>(
            TaskComplexity.SIMPLE,
            TaskComplexity.MODERATE,
            TaskComplexity.COMPLEX
          ),
          fc.uuid(),
          fc.string({ minLength: 10, maxLength: 1000 }),
          (complexityOverride, id, text) => {
            const task: AnalysisTask = {
              id,
              type: 'classification', // Normally simple
              modality: TaskModality.TEXT,
              content: { text },
              priority: 'medium',
              complexityOverride,
            };
            const complexity = determineComplexity(task);
            expect(complexity).toBe(complexityOverride);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
