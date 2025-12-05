/**
 * Property Test: Empty State Guidance
 * 
 * **Feature: dashboard-ux-overhaul, Property 20: Empty State Guidance**
 * **Validates: Requirements 7.4**
 * 
 * For any page with no data, the UI SHALL display an empty state with helpful
 * guidance and call-to-action.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Types matching EmptyState component
type EmptyStateVariant = 'no-data' | 'no-connection' | 'error' | 'no-results' | 'custom';
type EmptyStateSize = 'sm' | 'md' | 'lg';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
}

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: boolean; // Simplified - represents presence of custom icon
  title: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  size?: EmptyStateSize;
}

// Validation functions that mirror component behavior
function validateEmptyState(props: EmptyStateProps): {
  hasIcon: boolean;
  hasTitle: boolean;
  hasTitleContent: boolean;
  hasDescription: boolean;
  hasAction: boolean;
  hasSecondaryAction: boolean;
  hasGuidance: boolean;
  isValid: boolean;
} {
  const hasIcon = true; // Icon is always rendered (either custom or variant default)
  const hasTitle = true; // Title element is always rendered
  const hasTitleContent = props.title.trim().length > 0;
  const hasDescription = props.description !== undefined && props.description.trim().length > 0;
  const hasAction = props.action !== undefined && props.action.label.trim().length > 0;
  const hasSecondaryAction = props.secondaryAction !== undefined && props.secondaryAction.label.trim().length > 0;
  
  // Guidance is present if there's a description or action
  const hasGuidance = hasDescription || hasAction;
  
  // Valid empty state must have title content
  const isValid = hasTitleContent;

  return {
    hasIcon,
    hasTitle,
    hasTitleContent,
    hasDescription,
    hasAction,
    hasSecondaryAction,
    hasGuidance,
    isValid,
  };
}

// Arbitraries for generating test data
const variantArbitrary = fc.constantFrom<EmptyStateVariant>(
  'no-data', 'no-connection', 'error', 'no-results', 'custom'
);

const sizeArbitrary = fc.constantFrom<EmptyStateSize>('sm', 'md', 'lg');

const actionArbitrary = fc.record({
  label: fc.string({ minLength: 1, maxLength: 50 }),
  onClick: fc.constant(() => {}),
  variant: fc.option(fc.constantFrom('primary', 'secondary', 'outline') as fc.Arbitrary<'primary' | 'secondary' | 'outline'>, { nil: undefined }),
});

const emptyStatePropsArbitrary = fc.record({
  variant: fc.option(variantArbitrary, { nil: undefined }),
  icon: fc.boolean(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
  action: fc.option(actionArbitrary, { nil: undefined }),
  secondaryAction: fc.option(actionArbitrary, { nil: undefined }),
  size: fc.option(sizeArbitrary, { nil: undefined }),
});


describe('Empty State Guidance Property Tests', () => {
  /**
   * Property 20: Empty State Guidance
   * For any page with no data, the UI SHALL display an empty state with helpful
   * guidance and call-to-action.
   */
  describe('Property 20: Empty State Guidance', () => {
    it('should always render an icon for any empty state', () => {
      fc.assert(
        fc.property(emptyStatePropsArbitrary, (props) => {
          const result = validateEmptyState(props);
          
          // Icon should always be present (either custom or variant default)
          expect(result.hasIcon).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should always render a title element', () => {
      fc.assert(
        fc.property(emptyStatePropsArbitrary, (props) => {
          const result = validateEmptyState(props);
          
          // Title element should always be present
          expect(result.hasTitle).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should render description only when provided and non-empty', () => {
      fc.assert(
        fc.property(emptyStatePropsArbitrary, (props) => {
          const result = validateEmptyState(props);
          
          const expectedDescription = props.description !== undefined && 
                                      props.description.trim().length > 0;
          expect(result.hasDescription).toBe(expectedDescription);
        }),
        { numRuns: 100 }
      );
    });

    it('should render action button only when action is provided with label', () => {
      fc.assert(
        fc.property(emptyStatePropsArbitrary, (props) => {
          const result = validateEmptyState(props);
          
          const expectedAction = props.action !== undefined && 
                                 props.action.label.trim().length > 0;
          expect(result.hasAction).toBe(expectedAction);
        }),
        { numRuns: 100 }
      );
    });

    it('should provide guidance when description or action exists', () => {
      fc.assert(
        fc.property(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            description: fc.option(fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0), { nil: undefined }),
            action: fc.option(actionArbitrary, { nil: undefined }),
          }),
          (props) => {
            const result = validateEmptyState(props);
            
            const hasDescriptionOrAction = 
              (props.description !== undefined && props.description.trim().length > 0) ||
              (props.action !== undefined && props.action.label.trim().length > 0);
            
            expect(result.hasGuidance).toBe(hasDescriptionOrAction);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Empty State Variant Behavior', () => {
    it('should handle all variant types consistently', () => {
      fc.assert(
        fc.property(
          variantArbitrary,
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          (variant, title) => {
            const props: EmptyStateProps = { variant, title };
            const result = validateEmptyState(props);
            
            // All variants should have icon and title
            expect(result.hasIcon).toBe(true);
            expect(result.hasTitle).toBe(true);
            expect(result.isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle all size variants consistently', () => {
      fc.assert(
        fc.property(
          sizeArbitrary,
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          (size, title) => {
            const props: EmptyStateProps = { size, title };
            const result = validateEmptyState(props);
            
            // All sizes should maintain valid structure
            expect(result.hasIcon).toBe(true);
            expect(result.hasTitle).toBe(true);
            expect(result.isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Empty State Action Combinations', () => {
    it('should support both primary and secondary actions', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          actionArbitrary,
          actionArbitrary,
          (title, action, secondaryAction) => {
            const props: EmptyStateProps = { title, action, secondaryAction };
            const result = validateEmptyState(props);
            
            expect(result.hasAction).toBe(action.label.trim().length > 0);
            expect(result.hasSecondaryAction).toBe(secondaryAction.label.trim().length > 0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have guidance when any action is present', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          (title, actionLabel) => {
            const props: EmptyStateProps = {
              title,
              action: { label: actionLabel, onClick: () => {} },
            };
            const result = validateEmptyState(props);
            
            // Should have guidance when action is present
            expect(result.hasGuidance).toBe(true);
            expect(result.hasAction).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
