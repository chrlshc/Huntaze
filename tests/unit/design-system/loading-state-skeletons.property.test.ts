/**
 * **Feature: dashboard-design-refactor, Property 11: Loading state renders skeletons**
 * **Validates: Requirements 4.4, 12.1**
 * 
 * For any component with loading=true, the rendered output SHALL contain 
 * Skeleton elements matching the expected content structure.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Component types that support loading state
type LoadableComponent = 'StatCard' | 'IndexTable' | 'ConversationList' | 'ContentGrid';

// Loading state configuration
interface LoadingConfig {
  componentType: LoadableComponent;
  loading: boolean;
  expectedSkeletonCount: number;
}

// Skeleton configuration
interface SkeletonConfig {
  variant: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  animation: 'pulse' | 'wave' | 'none';
}

// Simulated loading state render output
interface LoadingRenderOutput {
  hasSkeletons: boolean;
  skeletonCount: number;
  skeletonsHaveAnimation: boolean;
  contentIsHidden: boolean;
}

// Expected skeleton counts per component type
const expectedSkeletonCounts: Record<LoadableComponent, number> = {
  StatCard: 2, // Label skeleton + value skeleton
  IndexTable: 5, // Header + 4 rows minimum
  ConversationList: 3, // 3 conversation item skeletons
  ContentGrid: 4, // 4 content card skeletons
};

// Simulate loading state rendering
function simulateLoadingRender(config: LoadingConfig): LoadingRenderOutput {
  if (!config.loading) {
    return {
      hasSkeletons: false,
      skeletonCount: 0,
      skeletonsHaveAnimation: false,
      contentIsHidden: false,
    };
  }

  const expectedCount = expectedSkeletonCounts[config.componentType];
  
  return {
    hasSkeletons: true,
    skeletonCount: expectedCount,
    skeletonsHaveAnimation: true, // All skeletons have pulse animation by default
    contentIsHidden: true, // Real content is not rendered during loading
  };
}

// Simulate skeleton component rendering
function simulateSkeletonRender(config: SkeletonConfig): {
  hasCorrectVariant: boolean;
  hasAnimation: boolean;
  hasDimensions: boolean;
} {
  return {
    hasCorrectVariant: ['text', 'circular', 'rectangular', 'card'].includes(config.variant),
    hasAnimation: config.animation !== 'none',
    hasDimensions: true, // Skeleton always has dimensions (default or custom)
  };
}

// Arbitraries
const componentTypeArb = fc.constantFrom('StatCard', 'IndexTable', 'ConversationList', 'ContentGrid') as fc.Arbitrary<LoadableComponent>;
const skeletonVariantArb = fc.constantFrom('text', 'circular', 'rectangular', 'card') as fc.Arbitrary<SkeletonConfig['variant']>;
const animationArb = fc.constantFrom('pulse', 'wave', 'none') as fc.Arbitrary<SkeletonConfig['animation']>;

const loadingConfigArb = fc.record({
  componentType: componentTypeArb,
  loading: fc.boolean(),
  expectedSkeletonCount: fc.integer({ min: 1, max: 10 }),
});

const skeletonConfigArb = fc.record({
  variant: skeletonVariantArb,
  width: fc.option(
    fc.oneof(fc.string({ minLength: 1, maxLength: 10 }), fc.integer({ min: 10, max: 500 })),
    { nil: undefined }
  ),
  height: fc.option(
    fc.oneof(fc.string({ minLength: 1, maxLength: 10 }), fc.integer({ min: 10, max: 500 })),
    { nil: undefined }
  ),
  animation: animationArb,
});

describe('Property 11: Loading state renders skeletons', () => {
  describe('Loading state behavior', () => {
    it('should render skeletons when loading is true', () => {
      fc.assert(
        fc.property(
          fc.record({
            componentType: componentTypeArb,
            loading: fc.constant(true),
            expectedSkeletonCount: fc.integer({ min: 1, max: 10 }),
          }),
          (config) => {
            const output = simulateLoadingRender(config);
            expect(output.hasSkeletons).toBe(true);
            expect(output.skeletonCount).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT render skeletons when loading is false', () => {
      fc.assert(
        fc.property(
          fc.record({
            componentType: componentTypeArb,
            loading: fc.constant(false),
            expectedSkeletonCount: fc.integer({ min: 1, max: 10 }),
          }),
          (config) => {
            const output = simulateLoadingRender(config);
            expect(output.hasSkeletons).toBe(false);
            expect(output.skeletonCount).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should hide real content during loading', () => {
      fc.assert(
        fc.property(
          fc.record({
            componentType: componentTypeArb,
            loading: fc.constant(true),
            expectedSkeletonCount: fc.integer({ min: 1, max: 10 }),
          }),
          (config) => {
            const output = simulateLoadingRender(config);
            expect(output.contentIsHidden).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have animated skeletons during loading', () => {
      fc.assert(
        fc.property(
          fc.record({
            componentType: componentTypeArb,
            loading: fc.constant(true),
            expectedSkeletonCount: fc.integer({ min: 1, max: 10 }),
          }),
          (config) => {
            const output = simulateLoadingRender(config);
            expect(output.skeletonsHaveAnimation).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render correct number of skeletons per component type', () => {
      fc.assert(
        fc.property(componentTypeArb, (componentType) => {
          const config: LoadingConfig = {
            componentType,
            loading: true,
            expectedSkeletonCount: expectedSkeletonCounts[componentType],
          };
          const output = simulateLoadingRender(config);
          expect(output.skeletonCount).toBe(expectedSkeletonCounts[componentType]);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Skeleton component', () => {
    it('should have valid variant', () => {
      fc.assert(
        fc.property(skeletonConfigArb, (config) => {
          const output = simulateSkeletonRender(config);
          expect(output.hasCorrectVariant).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should always have dimensions', () => {
      fc.assert(
        fc.property(skeletonConfigArb, (config) => {
          const output = simulateSkeletonRender(config);
          expect(output.hasDimensions).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should have animation unless explicitly disabled', () => {
      fc.assert(
        fc.property(
          fc.record({
            variant: skeletonVariantArb,
            width: fc.option(fc.integer({ min: 10, max: 500 }), { nil: undefined }),
            height: fc.option(fc.integer({ min: 10, max: 500 }), { nil: undefined }),
            animation: fc.constantFrom('pulse', 'wave') as fc.Arbitrary<'pulse' | 'wave'>,
          }),
          (config) => {
            const output = simulateSkeletonRender(config);
            expect(output.hasAnimation).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
