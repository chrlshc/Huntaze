/**
 * Property-Based Tests for Layout Container Constraints
 * 
 * Tests universal properties that should hold for layout containers
 * using fast-check for property-based testing.
 * 
 * Feature: linear-ui-performance-refactor
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import React from 'react';
import { CenteredContainer } from '@/components/layout/CenteredContainer';

describe('Layout Container Property Tests', () => {
  /**
   * Property 14: Content container max-width
   * 
   * For any main content container, the max-width should be either 1200px or 1280px
   * 
   * Validates: Requirements 4.1
   * 
   * Feature: linear-ui-performance-refactor, Property 14: Content container max-width
   */
  describe('Property 14: Content container max-width', () => {
    it('should enforce max-width of 75rem (1200px) for sm variant', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (iterations) => {
            const { container } = render(
              <CenteredContainer maxWidth="sm">
                <div>Test Content</div>
              </CenteredContainer>
            );

            const element = container.querySelector('[data-testid="centered-container"]');
            expect(element).toBeTruthy();
            
            const classes = element?.className || '';
            expect(classes).toContain('max-w-[75rem]');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should enforce max-width of 80rem (1280px) for lg variant', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (iterations) => {
            const { container } = render(
              <CenteredContainer maxWidth="lg">
                <div>Test Content</div>
              </CenteredContainer>
            );

            const element = container.querySelector('[data-testid="centered-container"]');
            expect(element).toBeTruthy();
            
            const classes = element?.className || '';
            expect(classes).toContain('max-w-[80rem]');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should default to lg variant (80rem) when maxWidth not specified', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (iterations) => {
            const { container } = render(
              <CenteredContainer>
                <div>Test Content</div>
              </CenteredContainer>
            );

            const element = container.querySelector('[data-testid="centered-container"]');
            expect(element).toBeTruthy();
            
            const classes = element?.className || '';
            expect(classes).toContain('max-w-[80rem]');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should only accept sm or lg as valid maxWidth values', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('sm' as const, 'lg' as const),
          (maxWidth) => {
            const { container } = render(
              <CenteredContainer maxWidth={maxWidth}>
                <div>Test Content</div>
              </CenteredContainer>
            );

            const element = container.querySelector('[data-testid="centered-container"]');
            const classes = element?.className || '';
            
            // Should have one of the two valid max-width values
            const hasValidMaxWidth = 
              classes.includes('max-w-[75rem]') || 
              classes.includes('max-w-[80rem]');
            
            expect(hasValidMaxWidth).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 15: Content container centering
   * 
   * For any main content container, it should have automatic left and right margins
   * (margin-left: auto and margin-right: auto) to achieve horizontal centering
   * 
   * Validates: Requirements 4.2
   * 
   * Feature: linear-ui-performance-refactor, Property 15: Content container centering
   */
  describe('Property 15: Content container centering', () => {
    it('should apply mx-auto class for horizontal centering', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('sm' as const, 'lg' as const),
          (maxWidth) => {
            const { container } = render(
              <CenteredContainer maxWidth={maxWidth}>
                <div>Test Content</div>
              </CenteredContainer>
            );

            const element = container.querySelector('[data-testid="centered-container"]');
            const classes = element?.className || '';
            
            expect(classes).toContain('mx-auto');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should center container regardless of content size', () => {
      fc.assert(
        fc.property(
          fc.array(fc.lorem({ maxCount: 50 }), { minLength: 1, maxLength: 10 }),
          (contentArray) => {
            const { container } = render(
              <CenteredContainer>
                {contentArray.map((text, i) => (
                  <div key={i}>{text}</div>
                ))}
              </CenteredContainer>
            );

            const element = container.querySelector('[data-testid="centered-container"]');
            const classes = element?.className || '';
            
            // Should always have centering regardless of content
            expect(classes).toContain('mx-auto');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain centering with custom className', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (customClass) => {
            const { container } = render(
              <CenteredContainer className={customClass}>
                <div>Test Content</div>
              </CenteredContainer>
            );

            const element = container.querySelector('[data-testid="centered-container"]');
            const classes = element?.className || '';
            
            // Should maintain centering even with custom classes
            expect(classes).toContain('mx-auto');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 16: Content container padding
   * 
   * For any main content container, the internal padding should be 24px
   * 
   * Validates: Requirements 4.3
   * 
   * Feature: linear-ui-performance-refactor, Property 16: Content container padding
   */
  describe('Property 16: Content container padding', () => {
    it('should apply 24px padding by default', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (iterations) => {
            const { container } = render(
              <CenteredContainer>
                <div>Test Content</div>
              </CenteredContainer>
            );

            const element = container.querySelector('[data-testid="centered-container"]');
            const classes = element?.className || '';
            
            expect(classes).toContain('p-[24px]');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow custom padding in multiples of 4px', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 24 }).map(n => n * 4),
          (padding) => {
            const { container } = render(
              <CenteredContainer padding={padding}>
                <div>Test Content</div>
              </CenteredContainer>
            );

            const element = container.querySelector('[data-testid="centered-container"]');
            const classes = element?.className || '';
            
            expect(classes).toContain(`p-[${padding}px]`);
            
            // Verify it's a multiple of 4
            expect(padding % 4).toBe(0);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain padding with different maxWidth variants', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('sm' as const, 'lg' as const),
          fc.integer({ min: 1, max: 24 }).map(n => n * 4),
          (maxWidth, padding) => {
            const { container } = render(
              <CenteredContainer maxWidth={maxWidth} padding={padding}>
                <div>Test Content</div>
              </CenteredContainer>
            );

            const element = container.querySelector('[data-testid="centered-container"]');
            const classes = element?.className || '';
            
            // Should have both max-width and padding
            expect(classes).toContain(`p-[${padding}px]`);
            expect(
              classes.includes('max-w-[75rem]') || classes.includes('max-w-[80rem]')
            ).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 17: Content encapsulation
   * 
   * For any dashboard or form content, it should be a descendant of the
   * centered content container in the DOM tree
   * 
   * Validates: Requirements 4.5
   * 
   * Feature: linear-ui-performance-refactor, Property 17: Content encapsulation
   */
  describe('Property 17: Content encapsulation', () => {
    it('should encapsulate all children within the container', () => {
      fc.assert(
        fc.property(
          fc.array(fc.lorem({ maxCount: 20 }), { minLength: 1, maxLength: 5 }),
          (contentArray) => {
            const { container } = render(
              <CenteredContainer>
                {contentArray.map((text, i) => (
                  <div key={i} data-testid={`child-${i}`}>{text}</div>
                ))}
              </CenteredContainer>
            );

            const containerElement = container.querySelector('[data-testid="centered-container"]');
            expect(containerElement).toBeTruthy();
            
            // Verify all children are descendants of the container
            contentArray.forEach((_, i) => {
              const child = container.querySelector(`[data-testid="child-${i}"]`);
              expect(child).toBeTruthy();
              expect(containerElement?.contains(child as Node)).toBe(true);
            });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain DOM hierarchy with nested components', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          (depth) => {
            // Create nested structure
            let content: React.ReactNode = <div data-testid="deepest">Deepest</div>;
            for (let i = 0; i < depth; i++) {
              content = <div data-testid={`level-${i}`}>{content}</div>;
            }

            const { container } = render(
              <CenteredContainer>
                {content}
              </CenteredContainer>
            );

            const containerElement = container.querySelector('[data-testid="centered-container"]');
            const deepestElement = container.querySelector('[data-testid="deepest"]');
            
            expect(containerElement).toBeTruthy();
            expect(deepestElement).toBeTruthy();
            
            // Verify deepest element is a descendant of container
            expect(containerElement?.contains(deepestElement as Node)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should encapsulate form elements correctly', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
            { minLength: 1, maxLength: 5 }
          ),
          (labels) => {
            const { container } = render(
              <CenteredContainer>
                <form data-testid="test-form">
                  {labels.map((label, i) => (
                    <div key={i}>
                      <label htmlFor={`input-${i}`}>{label}</label>
                      <input id={`input-${i}`} type="text" data-testid={`input-${i}`} />
                    </div>
                  ))}
                </form>
              </CenteredContainer>
            );

            const containerElement = container.querySelector('[data-testid="centered-container"]');
            const formElement = container.querySelector('[data-testid="test-form"]');
            
            expect(containerElement).toBeTruthy();
            expect(formElement).toBeTruthy();
            
            // Verify form is a descendant of container
            expect(containerElement?.contains(formElement as Node)).toBe(true);
            
            // Verify all inputs are descendants of container
            labels.forEach((_, i) => {
              const input = container.querySelector(`[data-testid="input-${i}"]`);
              expect(input).toBeTruthy();
              expect(containerElement?.contains(input as Node)).toBe(true);
            });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should encapsulate dashboard content correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 50 }),
            widgets: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 6 })
          }),
          (dashboard) => {
            const { container } = render(
              <CenteredContainer>
                <div data-testid="dashboard">
                  <h1>{dashboard.title}</h1>
                  <div data-testid="widgets">
                    {dashboard.widgets.map((widget, i) => (
                      <div key={i} data-testid={`widget-${i}`}>{widget}</div>
                    ))}
                  </div>
                </div>
              </CenteredContainer>
            );

            const containerElement = container.querySelector('[data-testid="centered-container"]');
            const dashboardElement = container.querySelector('[data-testid="dashboard"]');
            const widgetsElement = container.querySelector('[data-testid="widgets"]');
            
            expect(containerElement).toBeTruthy();
            expect(dashboardElement).toBeTruthy();
            expect(widgetsElement).toBeTruthy();
            
            // Verify dashboard and all widgets are descendants of container
            expect(containerElement?.contains(dashboardElement as Node)).toBe(true);
            expect(containerElement?.contains(widgetsElement as Node)).toBe(true);
            
            dashboard.widgets.forEach((_, i) => {
              const widget = container.querySelector(`[data-testid="widget-${i}"]`);
              expect(containerElement?.contains(widget as Node)).toBe(true);
            });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Combined Properties Test
   * 
   * Verifies that all layout properties work together correctly
   */
  describe('Combined Layout Properties', () => {
    it('should satisfy all layout properties simultaneously', () => {
      fc.assert(
        fc.property(
          fc.record({
            maxWidth: fc.constantFrom('sm' as const, 'lg' as const),
            padding: fc.integer({ min: 1, max: 24 }).map(n => n * 4),
            content: fc.array(fc.lorem({ maxCount: 30 }), { minLength: 1, maxLength: 5 })
          }),
          (config) => {
            const { container } = render(
              <CenteredContainer maxWidth={config.maxWidth} padding={config.padding}>
                {config.content.map((text, i) => (
                  <div key={i} data-testid={`content-${i}`}>{text}</div>
                ))}
              </CenteredContainer>
            );

            const element = container.querySelector('[data-testid="centered-container"]');
            const classes = element?.className || '';
            
            // Property 14: Max-width constraint
            const hasValidMaxWidth = 
              classes.includes('max-w-[75rem]') || 
              classes.includes('max-w-[80rem]');
            expect(hasValidMaxWidth).toBe(true);
            
            // Property 15: Horizontal centering
            expect(classes).toContain('mx-auto');
            
            // Property 16: Padding
            expect(classes).toContain(`p-[${config.padding}px]`);
            expect(config.padding % 4).toBe(0);
            
            // Property 17: Content encapsulation
            config.content.forEach((_, i) => {
              const child = container.querySelector(`[data-testid="content-${i}"]`);
              expect(element?.contains(child as Node)).toBe(true);
            });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
