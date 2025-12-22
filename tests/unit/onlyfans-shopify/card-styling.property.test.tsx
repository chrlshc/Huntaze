/**
 * **Feature: onlyfans-shopify-unification, Property 3: Card Background and Shadow Consistency**
 * 
 * *For any* ShopifyCard component instance, the component should have white background (#FFFFFF) 
 * and the defined shadow token (--shopify-shadow-card)
 * 
 * **Validates: Requirements 1.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import { ShopifyCard } from '@/components/ui/shopify/ShopifyCard';
import React from 'react';

// Arbitrary generators for card props
const cardPropsArbitrary = fc.record({
  padding: fc.constantFrom('none', 'sm', 'md', 'lg', 'xl'),
  bordered: fc.boolean(),
  shadow: fc.boolean(),
  hasHeader: fc.boolean(),
  hasFooter: fc.boolean(),
  isInteractive: fc.boolean(),
  content: fc.string({ minLength: 1, maxLength: 100 }),
});

describe('Property 3: Card Background and Shadow Consistency', () => {
  it('should always have white background color', () => {
    fc.assert(
      fc.property(cardPropsArbitrary, (props) => {
        const { container } = render(
          <ShopifyCard
            padding={props.padding}
            bordered={props.bordered}
            shadow={props.shadow}
            header={props.hasHeader ? <div>Header</div> : undefined}
            footer={props.hasFooter ? <div>Footer</div> : undefined}
            onClick={props.isInteractive ? () => {} : undefined}
            data-testid="test-card"
          >
            {props.content}
          </ShopifyCard>
        );

        const card = container.querySelector('[data-testid="test-card"]');
        expect(card).toBeTruthy();

        if (card) {
          const styles = window.getComputedStyle(card);
          // Should have white background
          expect(card.classList.contains('bg-white')).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should have shadow when shadow prop is true', () => {
    fc.assert(
      fc.property(
        fc.record({
          ...cardPropsArbitrary.value,
          shadow: fc.constant(true),
        }),
        (props) => {
          const { container } = render(
            <ShopifyCard
              padding={props.padding}
              shadow={props.shadow}
              data-testid="test-card"
            >
              {props.content}
            </ShopifyCard>
          );

          const card = container.querySelector('[data-testid="test-card"]');
          expect(card).toBeTruthy();

          if (card) {
            // Should have shadow class
            const hasShadow = card.className.includes('shadow-');
            expect(hasShadow).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not have shadow when shadow prop is false', () => {
    fc.assert(
      fc.property(
        fc.record({
          ...cardPropsArbitrary.value,
          shadow: fc.constant(false),
        }),
        (props) => {
          const { container } = render(
            <ShopifyCard
              padding={props.padding}
              shadow={props.shadow}
              data-testid="test-card"
            >
              {props.content}
            </ShopifyCard>
          );

          const card = container.querySelector('[data-testid="test-card"]');
          expect(card).toBeTruthy();

          if (card) {
            // Should not have shadow class
            const hasShadow = card.className.includes('shadow-');
            expect(hasShadow).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have border when bordered prop is true', () => {
    fc.assert(
      fc.property(
        fc.record({
          ...cardPropsArbitrary.value,
          bordered: fc.constant(true),
        }),
        (props) => {
          const { container } = render(
            <ShopifyCard
              padding={props.padding}
              bordered={props.bordered}
              data-testid="test-card"
            >
              {props.content}
            </ShopifyCard>
          );

          const card = container.querySelector('[data-testid="test-card"]');
          expect(card).toBeTruthy();

          if (card) {
            // Should have border class
            expect(card.classList.contains('border')).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have rounded corners', () => {
    fc.assert(
      fc.property(cardPropsArbitrary, (props) => {
        const { container } = render(
          <ShopifyCard
            padding={props.padding}
            data-testid="test-card"
          >
            {props.content}
          </ShopifyCard>
        );

        const card = container.querySelector('[data-testid="test-card"]');
        expect(card).toBeTruthy();

        if (card) {
          // Should have rounded-lg class (8px border-radius)
          expect(card.classList.contains('rounded-lg')).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should render header section when provided', () => {
    fc.assert(
      fc.property(
        fc.record({
          ...cardPropsArbitrary.value,
          hasHeader: fc.constant(true),
          headerContent: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        }),
        (props) => {
          const { container } = render(
            <ShopifyCard
              header={<div data-testid="card-header">{props.headerContent}</div>}
              data-testid="test-card"
            >
              {props.content}
            </ShopifyCard>
          );

          // Header section should be rendered
          const header = container.querySelector('[data-testid="card-header"]');
          expect(header).toBeTruthy();
          expect(header?.textContent).toBe(props.headerContent);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should render footer section when provided', () => {
    fc.assert(
      fc.property(
        fc.record({
          ...cardPropsArbitrary.value,
          hasFooter: fc.constant(true),
          footerContent: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        }),
        (props) => {
          const { container } = render(
            <ShopifyCard
              footer={<div data-testid="card-footer">{props.footerContent}</div>}
              data-testid="test-card"
            >
              {props.content}
            </ShopifyCard>
          );

          // Footer section should be rendered
          const footer = container.querySelector('[data-testid="card-footer"]');
          expect(footer).toBeTruthy();
          expect(footer?.textContent).toBe(props.footerContent);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should be interactive when onClick is provided', () => {
    fc.assert(
      fc.property(
        fc.record({
          ...cardPropsArbitrary.value,
          isInteractive: fc.constant(true),
        }),
        (props) => {
          const { container } = render(
            <ShopifyCard
              onClick={() => {}}
              data-testid="test-card"
            >
              {props.content}
            </ShopifyCard>
          );

          const card = container.querySelector('[data-testid="test-card"]');
          expect(card).toBeTruthy();

          if (card) {
            // Should have cursor-pointer class
            expect(card.classList.contains('cursor-pointer')).toBe(true);
            // Should have role="button"
            expect(card.getAttribute('role')).toBe('button');
            // Should be keyboard accessible
            expect(card.getAttribute('tabIndex')).toBe('0');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply correct padding based on padding prop', () => {
    const paddingMap = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-5',
      xl: 'p-6',
    };

    fc.assert(
      fc.property(
        fc.constantFrom('none', 'sm', 'md', 'lg', 'xl'),
        (padding) => {
          const { container } = render(
            <ShopifyCard
              padding={padding as any}
              data-testid="test-card"
            >
              Content
            </ShopifyCard>
          );

          const card = container.querySelector('[data-testid="test-card"]');
          expect(card).toBeTruthy();

          if (card && padding !== 'none') {
            const contentDiv = card.querySelector('div');
            expect(contentDiv).toBeTruthy();
            
            if (contentDiv) {
              const expectedClass = paddingMap[padding];
              expect(contentDiv.classList.contains(expectedClass)).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain consistent styling across all card instances', () => {
    fc.assert(
      fc.property(
        fc.array(cardPropsArbitrary, { minLength: 2, maxLength: 5 }),
        (cardsProps) => {
          const cards = cardsProps.map((props, idx) => (
            <ShopifyCard
              key={idx}
              padding={props.padding}
              bordered={props.bordered}
              shadow={props.shadow}
              data-testid={`test-card-${idx}`}
            >
              {props.content}
            </ShopifyCard>
          ));

          const { container } = render(<div>{cards}</div>);

          // All cards should have white background
          cardsProps.forEach((_, idx) => {
            const card = container.querySelector(`[data-testid="test-card-${idx}"]`);
            expect(card).toBeTruthy();
            
            if (card) {
              expect(card.classList.contains('bg-white')).toBe(true);
              expect(card.classList.contains('rounded-lg')).toBe(true);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have hover state for interactive cards', () => {
    fc.assert(
      fc.property(
        fc.record({
          ...cardPropsArbitrary.value,
          isInteractive: fc.constant(true),
        }),
        (props) => {
          const { container } = render(
            <ShopifyCard
              onClick={() => {}}
              data-testid="test-card"
            >
              {props.content}
            </ShopifyCard>
          );

          const card = container.querySelector('[data-testid="test-card"]');
          expect(card).toBeTruthy();

          if (card) {
            // Should have transition class
            expect(card.classList.contains('transition-shadow')).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
