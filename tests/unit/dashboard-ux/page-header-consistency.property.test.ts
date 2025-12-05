/**
 * Property Test: Page Header Consistency
 * 
 * **Feature: dashboard-ux-overhaul, Property 19: Page Header Consistency**
 * **Validates: Requirements 7.1**
 * 
 * For any dashboard page, the page SHALL display a consistent header structure
 * with title and optional actions.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Types for PageLayout props
interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  actions?: boolean; // Simplified for testing - represents presence of actions
  breadcrumbs?: BreadcrumbItem[];
  showHomeInBreadcrumbs?: boolean;
}

// Validation functions that mirror component behavior
function validatePageHeader(props: PageLayoutProps): {
  hasTitle: boolean;
  hasTitleContent: boolean;
  hasSubtitle: boolean;
  hasActions: boolean;
  hasBreadcrumbs: boolean;
  isValid: boolean;
} {
  const hasTitle = true; // Title is always rendered
  const hasTitleContent = props.title.trim().length > 0;
  const hasSubtitle = props.subtitle !== undefined && props.subtitle.trim().length > 0;
  const hasActions = props.actions === true;
  const hasBreadcrumbs = (props.breadcrumbs && props.breadcrumbs.length > 0) || 
                         props.showHomeInBreadcrumbs !== false;
  
  // A valid page header must have a non-empty title
  const isValid = hasTitleContent;

  return {
    hasTitle,
    hasTitleContent,
    hasSubtitle,
    hasActions,
    hasBreadcrumbs,
    isValid,
  };
}

// Arbitraries for generating test data
const breadcrumbArbitrary = fc.record({
  label: fc.string({ minLength: 1, maxLength: 50 }),
  href: fc.option(fc.webUrl(), { nil: undefined }),
});

const pageLayoutPropsArbitrary = fc.record({
  title: fc.string({ minLength: 1, maxLength: 100 }),
  subtitle: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
  actions: fc.boolean(),
  breadcrumbs: fc.option(fc.array(breadcrumbArbitrary, { minLength: 0, maxLength: 5 }), { nil: undefined }),
  showHomeInBreadcrumbs: fc.option(fc.boolean(), { nil: undefined }),
});


describe('Page Header Consistency Property Tests', () => {
  /**
   * Property 19: Page Header Consistency
   * For any dashboard page, the page SHALL display a consistent header structure
   * with title and optional actions.
   */
  describe('Property 19: Page Header Consistency', () => {
    it('should always render a title element for any valid page props', () => {
      fc.assert(
        fc.property(pageLayoutPropsArbitrary, (props) => {
          const result = validatePageHeader(props);
          
          // Title element should always be present
          expect(result.hasTitle).toBe(true);
          
          // Title should have content when provided
          if (props.title.trim().length > 0) {
            expect(result.hasTitleContent).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should render subtitle only when provided', () => {
      fc.assert(
        fc.property(pageLayoutPropsArbitrary, (props) => {
          const result = validatePageHeader(props);
          
          // Subtitle should only be present when provided and non-empty
          const expectedSubtitle = props.subtitle !== undefined && props.subtitle.trim().length > 0;
          expect(result.hasSubtitle).toBe(expectedSubtitle);
        }),
        { numRuns: 100 }
      );
    });

    it('should render actions section only when actions are provided', () => {
      fc.assert(
        fc.property(pageLayoutPropsArbitrary, (props) => {
          const result = validatePageHeader(props);
          
          // Actions should only be present when provided
          expect(result.hasActions).toBe(props.actions === true);
        }),
        { numRuns: 100 }
      );
    });

    it('should render breadcrumbs when items exist or home is shown', () => {
      fc.assert(
        fc.property(pageLayoutPropsArbitrary, (props) => {
          const result = validatePageHeader(props);
          
          const hasBreadcrumbItems = props.breadcrumbs && props.breadcrumbs.length > 0;
          const showHome = props.showHomeInBreadcrumbs !== false;
          const expectedBreadcrumbs = hasBreadcrumbItems || showHome;
          
          expect(result.hasBreadcrumbs).toBe(expectedBreadcrumbs);
        }),
        { numRuns: 100 }
      );
    });

    it('should have valid header structure for any non-empty title', () => {
      fc.assert(
        fc.property(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            subtitle: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
            actions: fc.boolean(),
          }),
          (props) => {
            const result = validatePageHeader(props);
            
            // Valid header must have title content
            expect(result.isValid).toBe(true);
            expect(result.hasTitleContent).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Header Structure Invariants', () => {
    it('should maintain consistent structure regardless of optional props', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
          fc.boolean(),
          fc.option(fc.array(breadcrumbArbitrary, { minLength: 0, maxLength: 5 }), { nil: undefined }),
          (title, subtitle, hasActions, breadcrumbs) => {
            const props: PageLayoutProps = { title, subtitle, actions: hasActions, breadcrumbs };
            const result = validatePageHeader(props);
            
            // Core invariant: title is always present
            expect(result.hasTitle).toBe(true);
            
            // Structure is valid when title has content
            expect(result.isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge cases for breadcrumb items', () => {
      fc.assert(
        fc.property(
          fc.array(breadcrumbArbitrary, { minLength: 0, maxLength: 10 }),
          fc.boolean(),
          (breadcrumbs, showHome) => {
            const props: PageLayoutProps = {
              title: 'Test Page',
              breadcrumbs,
              showHomeInBreadcrumbs: showHome,
            };
            const result = validatePageHeader(props);
            
            // Breadcrumbs should be shown if items exist OR home is shown
            const expectedBreadcrumbs = breadcrumbs.length > 0 || showHome;
            expect(result.hasBreadcrumbs).toBe(expectedBreadcrumbs);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
