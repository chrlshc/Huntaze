/**
 * **Feature: onlyfans-shopify-unification, Property 2: Layout Structure Consistency**
 * 
 * *For any* OnlyFans page, the page should use the ShopifyPageLayout component with consistent 
 * header structure and content padding
 * 
 * **Validates: Requirements 1.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import { ShopifyPageLayout } from '@/components/layout/ShopifyPageLayout';
import React from 'react';

// Arbitrary generators for layout props
const layoutPropsArbitrary = fc.record({
  title: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  subtitle: fc.option(fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)),
  hasActions: fc.boolean(),
  content: fc.string({ minLength: 1, maxLength: 100 }),
});

describe('Property 2: Layout Structure Consistency', () => {
  it('should have consistent header structure', () => {
    fc.assert(
      fc.property(layoutPropsArbitrary, (props) => {
        const { container } = render(
          <ShopifyPageLayout
            title={props.title}
            subtitle={props.subtitle || undefined}
          >
            <div>{props.content}</div>
          </ShopifyPageLayout>
        );

        // Should have header element
        const header = container.querySelector('.shopify-page-layout__header');
        expect(header).toBeTruthy();
        
        // Should have title
        const title = container.querySelector('.shopify-page-layout__title');
        expect(title).toBeTruthy();
        expect(title?.textContent).toBe(props.title);
      }),
      { numRuns: 100 }
    );
  });

  it('should render subtitle when provided', () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          subtitle: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        }),
        (props) => {
          const { container } = render(
            <ShopifyPageLayout
              title={props.title}
              subtitle={props.subtitle}
            >
              <div>Content</div>
            </ShopifyPageLayout>
          );

          const subtitle = container.querySelector('.shopify-page-layout__subtitle');
          expect(subtitle).toBeTruthy();
          expect(subtitle?.textContent).toBe(props.subtitle);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have consistent background color', () => {
    fc.assert(
      fc.property(layoutPropsArbitrary, (props) => {
        const { container } = render(
          <ShopifyPageLayout title={props.title}>
            <div>{props.content}</div>
          </ShopifyPageLayout>
        );

        const layout = container.querySelector('.shopify-page-layout');
        expect(layout).toBeTruthy();
        
        if (layout) {
          const styles = (layout as HTMLElement).style;
          // Should have light gray background
          expect(styles.backgroundColor).toContain('#f6f6f7');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should have consistent padding', () => {
    fc.assert(
      fc.property(layoutPropsArbitrary, (props) => {
        const { container } = render(
          <ShopifyPageLayout title={props.title}>
            <div>{props.content}</div>
          </ShopifyPageLayout>
        );

        const layout = container.querySelector('.shopify-page-layout');
        expect(layout).toBeTruthy();
        
        if (layout) {
          const styles = (layout as HTMLElement).style;
          // Should have 24px padding
          expect(styles.padding).toBe('24px');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should have centered content container', () => {
    fc.assert(
      fc.property(layoutPropsArbitrary, (props) => {
        const { container } = render(
          <ShopifyPageLayout title={props.title}>
            <div>{props.content}</div>
          </ShopifyPageLayout>
        );

        const contentContainer = container.querySelector('.shopify-page-layout__container');
        expect(contentContainer).toBeTruthy();
        
        if (contentContainer) {
          const computedStyles = window.getComputedStyle(contentContainer);
          // Should be centered - accept both "0 auto" and "0px auto"
          expect(computedStyles.marginLeft).toBe('auto');
          expect(computedStyles.marginRight).toBe('auto');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should have max-width constraint', () => {
    fc.assert(
      fc.property(layoutPropsArbitrary, (props) => {
        const { container } = render(
          <ShopifyPageLayout title={props.title}>
            <div>{props.content}</div>
          </ShopifyPageLayout>
        );

        const contentContainer = container.querySelector('.shopify-page-layout__container');
        expect(contentContainer).toBeTruthy();
        
        if (contentContainer) {
          const styles = (contentContainer as HTMLElement).style;
          // Should have max-width
          expect(styles.maxWidth).toBeTruthy();
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should render actions when provided', () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          actionLabel: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
        }),
        (props) => {
          const { container } = render(
            <ShopifyPageLayout
              title={props.title}
              actions={<button>{props.actionLabel}</button>}
            >
              <div>Content</div>
            </ShopifyPageLayout>
          );

          const actions = container.querySelector('.shopify-page-layout__actions');
          expect(actions).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have consistent spacing between sections', () => {
    fc.assert(
      fc.property(layoutPropsArbitrary, (props) => {
        const { container } = render(
          <ShopifyPageLayout title={props.title}>
            <div>{props.content}</div>
          </ShopifyPageLayout>
        );

        const header = container.querySelector('.shopify-page-layout__header');
        expect(header).toBeTruthy();
        
        if (header) {
          const styles = (header as HTMLElement).style;
          // Should have 24px margin bottom
          expect(styles.marginBottom).toBe('24px');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should render content area', () => {
    fc.assert(
      fc.property(layoutPropsArbitrary, (props) => {
        const { container } = render(
          <ShopifyPageLayout title={props.title}>
            <div data-testid="test-content">{props.content}</div>
          </ShopifyPageLayout>
        );

        const content = container.querySelector('.shopify-page-layout__content');
        expect(content).toBeTruthy();
        
        // Content should be rendered
        const testContent = container.querySelector('[data-testid="test-content"]');
        expect(testContent).toBeTruthy();
      }),
      { numRuns: 100 }
    );
  });
});
