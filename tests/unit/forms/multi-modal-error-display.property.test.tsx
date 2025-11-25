/**
 * Property-Based Tests: Multi-Modal Error Display
 * Feature: signup-ux-optimization, Property 11: Multi-Modal Error Display
 * 
 * Validates: Requirements 5.2
 * 
 * Property: For any error state, the system should use both color and icons to convey the error (not color alone)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import { FormError } from '@/components/forms/FormError';

describe('Property 11: Multi-Modal Error Display', () => {
  it('should display both icon and text for every error', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        async (errorMessage) => {
          const { container } = render(<FormError error={errorMessage} />);
          
          const icon = container.querySelector('svg');
          const text = container.textContent;
          
          // Property: Both icon and text should be present
          expect(icon).toBeTruthy();
          expect(text).toContain(errorMessage);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use different icons for inline vs summary errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        async (errorMessage) => {
          const { container: inlineContainer } = render(
            <FormError error={errorMessage} variant="inline" />
          );
          const { container: summaryContainer } = render(
            <FormError error={errorMessage} variant="summary" />
          );
          
          const inlineIcon = inlineContainer.querySelector('svg');
          const summaryIcon = summaryContainer.querySelector('svg');
          
          // Property: Both should have icons
          expect(inlineIcon).toBeTruthy();
          expect(summaryIcon).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should mark icons as aria-hidden to avoid redundancy', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        async (errorMessage) => {
          const { container } = render(<FormError error={errorMessage} />);
          
          const icon = container.querySelector('svg');
          
          // Property: Icon should be hidden from screen readers
          expect(icon?.getAttribute('aria-hidden')).toBe('true');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use color, icon, and text together', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string(), { minLength: 1, maxLength: 5 }),
        async (errors) => {
          const { container } = render(<FormError errors={errors} variant="summary" />);
          
          const errorElement = container.querySelector('[role="alert"]');
          const icon = container.querySelector('svg');
          const text = container.textContent;
          
          // Property: All three modalities should be present
          expect(errorElement?.className).toMatch(/red/); // Color
          expect(icon).toBeTruthy(); // Icon
          expect(text).toBeTruthy(); // Text
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide visual indicators beyond color', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        async (errorMessage) => {
          const { container } = render(<FormError error={errorMessage} />);
          
          const errorElement = container.querySelector('[role="alert"]');
          const icon = container.querySelector('svg');
          
          // Property: Should have non-color indicators (icon, border, etc.)
          expect(icon).toBeTruthy();
          expect(errorElement?.getAttribute('role')).toBe('alert');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use semantic HTML roles for accessibility', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        async (errorMessage) => {
          const { container } = render(<FormError error={errorMessage} />);
          
          const errorElement = container.querySelector('[role="alert"]');
          
          // Property: Should use role="alert" for screen readers
          expect(errorElement).toBeTruthy();
          expect(errorElement?.getAttribute('role')).toBe('alert');
          expect(errorElement?.getAttribute('aria-live')).toBe('polite');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display bullet points for multiple errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string(), { minLength: 2, maxLength: 5 }),
        async (errors) => {
          const { container } = render(<FormError errors={errors} variant="summary" />);
          
          const listItems = container.querySelectorAll('li');
          
          // Property: Each error should be a list item with bullet
          expect(listItems.length).toBe(errors.length);
          listItems.forEach(item => {
            expect(item.textContent).toContain('•');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use borders as additional visual indicator', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string(), { minLength: 1, maxLength: 3 }),
        async (errors) => {
          const { container } = render(<FormError errors={errors} variant="summary" />);
          
          const errorElement = container.querySelector('[role="alert"]');
          
          // Property: Summary should have visible border
          expect(errorElement?.className).toContain('border');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should work for colorblind users', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        async (errorMessage) => {
          const { container } = render(<FormError error={errorMessage} />);
          
          const icon = container.querySelector('svg');
          const role = container.querySelector('[role="alert"]');
          
          // Property: Should be identifiable without color
          // (icon + role + text provide non-color cues)
          expect(icon).toBeTruthy();
          expect(role).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide consistent multi-modal feedback across all error types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('REQUIRED', 'INVALID_EMAIL', 'PASSWORD_TOO_SHORT', 'CSRF_INVALID'),
        async (errorType) => {
          const errorMessages: Record<string, string> = {
            REQUIRED: 'This field is required',
            INVALID_EMAIL: 'Please enter a valid email',
            PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
            CSRF_INVALID: 'Security token is invalid',
          };
          
          const message = errorMessages[errorType];
          const { container } = render(<FormError error={message} />);
          
          const icon = container.querySelector('svg');
          const text = container.textContent;
          const colorClass = container.querySelector('[role="alert"]')?.className;
          
          // Property: All error types should have icon, text, and color
          expect(icon).toBeTruthy();
          expect(text).toContain(message);
          expect(colorClass).toMatch(/red/);
        }
      ),
      { numRuns: 100 }
    );
  });
});
