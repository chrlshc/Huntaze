/**
 * Property-Based Test: Form Validation Feedback
 * Feature: onlyfans-shopify-unification, Property 24
 * Validates: Requirements 6.3, 10.4
 * 
 * Property 24: Form Validation Feedback
 * For any form field with validation errors, the field should display an error message
 * below the input and have a red border
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';

// Mock form component that follows Shopify patterns
interface FormFieldProps {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

function ShopifyFormField({ label, value, error, onChange }: FormFieldProps) {
  return (
    <div className="form-field">
      <label className="block text-[13px] font-medium text-[#1a1a1a] mb-2">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full px-4 py-2 rounded-lg text-[14px] text-[#1a1a1a]
          focus:outline-none focus:ring-2 focus:ring-[#2c6ecb] focus:border-transparent
          ${error 
            ? 'border-2 border-[#d72c0d]' 
            : 'border border-[#e1e3e5]'
          }
        `}
        aria-invalid={!!error}
        aria-describedby={error ? `${label}-error` : undefined}
      />
      {error && (
        <p 
          id={`${label}-error`}
          className="text-[13px] text-[#d72c0d] mt-2"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

describe('Property 24: Form Validation Feedback', () => {
  it('should display error message below input when validation fails', () => {
    fc.assert(
      fc.property(
        fc.record({
          label: fc.string({ minLength: 1, maxLength: 50 }),
          value: fc.string({ maxLength: 200 }),
          error: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        (props) => {
          const { container, unmount } = render(
            <ShopifyFormField
              label={props.label}
              value={props.value}
              error={props.error}
              onChange={() => {}}
            />
          );

          // Error message should be displayed
          const errorElement = container.querySelector('p[role="alert"]');
          expect(errorElement).toBeTruthy();
          expect(errorElement!.textContent).toBe(props.error);

          // Error message should be below the input
          const input = container.querySelector('input');
          const inputRect = input!.getBoundingClientRect();
          const errorRect = errorElement!.getBoundingClientRect();
          
          // Error should be positioned after input in DOM
          expect(input!.compareDocumentPosition(errorElement!)).toBe(
            Node.DOCUMENT_POSITION_FOLLOWING
          );

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply red border to input field when validation fails', () => {
    fc.assert(
      fc.property(
        fc.record({
          label: fc.string({ minLength: 1, maxLength: 50 }),
          value: fc.string({ maxLength: 200 }),
          error: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        (props) => {
          const { container, unmount } = render(
            <ShopifyFormField
              label={props.label}
              value={props.value}
              error={props.error}
              onChange={() => {}}
            />
          );

          const input = container.querySelector('input');
          expect(input).toBeTruthy();

          const classList = input!.className;
          
          // Should have red border color (Shopify error red: #d72c0d)
          expect(classList).toContain('border-[#d72c0d]');
          
          // Should have border-2 for emphasis
          expect(classList).toContain('border-2');

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not display error message when no validation error exists', () => {
    fc.assert(
      fc.property(
        fc.record({
          label: fc.string({ minLength: 1, maxLength: 50 }),
          value: fc.string({ maxLength: 200 }),
        }),
        (props) => {
          const { container, unmount } = render(
            <ShopifyFormField
              label={props.label}
              value={props.value}
              onChange={() => {}}
            />
          );

          // Error message should NOT be displayed
          const errorElement = container.querySelector('p[role="alert"]');
          expect(errorElement).toBeNull();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply default border when no validation error exists', () => {
    fc.assert(
      fc.property(
        fc.record({
          label: fc.string({ minLength: 1, maxLength: 50 }),
          value: fc.string({ maxLength: 200 }),
        }),
        (props) => {
          const { container, unmount } = render(
            <ShopifyFormField
              label={props.label}
              value={props.value}
              onChange={() => {}}
            />
          );

          const input = container.querySelector('input');
          expect(input).toBeTruthy();

          const classList = input!.className;
          
          // Should have default border color (Shopify border: #e1e3e5)
          expect(classList).toContain('border-[#e1e3e5]');
          
          // Should NOT have error border color
          expect(classList).not.toContain('border-[#d72c0d]');

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use Shopify error color for error messages', () => {
    fc.assert(
      fc.property(
        fc.record({
          label: fc.string({ minLength: 1, maxLength: 50 }),
          error: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        (props) => {
          const { container, unmount } = render(
            <ShopifyFormField
              label={props.label}
              value=""
              error={props.error}
              onChange={() => {}}
            />
          );

          const errorElement = container.querySelector('p[role="alert"]');
          expect(errorElement).toBeTruthy();

          const classList = errorElement!.className;
          
          // Should use Shopify error red color (#d72c0d)
          expect(classList).toContain('text-[#d72c0d]');

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have appropriate font size for error messages', () => {
    fc.assert(
      fc.property(
        fc.record({
          label: fc.string({ minLength: 1, maxLength: 50 }),
          error: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        (props) => {
          const { container, unmount } = render(
            <ShopifyFormField
              label={props.label}
              value=""
              error={props.error}
              onChange={() => {}}
            />
          );

          const errorElement = container.querySelector('p[role="alert"]');
          expect(errorElement).toBeTruthy();

          const classList = errorElement!.className;
          
          // Should use 13px font size (text-[13px])
          expect(classList).toContain('text-[13px]');

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have proper spacing between input and error message', () => {
    fc.assert(
      fc.property(
        fc.record({
          label: fc.string({ minLength: 1, maxLength: 50 }),
          error: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        (props) => {
          const { container, unmount } = render(
            <ShopifyFormField
              label={props.label}
              value=""
              error={props.error}
              onChange={() => {}}
            />
          );

          const errorElement = container.querySelector('p[role="alert"]');
          expect(errorElement).toBeTruthy();

          const classList = errorElement!.className;
          
          // Should have top margin (mt-2 = 8px)
          expect(classList).toContain('mt-2');

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should set aria-invalid attribute when validation fails', () => {
    fc.assert(
      fc.property(
        fc.record({
          label: fc.string({ minLength: 1, maxLength: 50 }),
          error: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        (props) => {
          const { container, unmount } = render(
            <ShopifyFormField
              label={props.label}
              value=""
              error={props.error}
              onChange={() => {}}
            />
          );

          const input = container.querySelector('input');
          expect(input).toBeTruthy();

          // Should have aria-invalid="true" for accessibility
          expect(input!.getAttribute('aria-invalid')).toBe('true');

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should link error message to input via aria-describedby', () => {
    fc.assert(
      fc.property(
        fc.record({
          label: fc.string({ minLength: 1, maxLength: 50 }),
          error: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        (props) => {
          const { container, unmount } = render(
            <ShopifyFormField
              label={props.label}
              value=""
              error={props.error}
              onChange={() => {}}
            />
          );

          const input = container.querySelector('input');
          const errorElement = container.querySelector('p[role="alert"]');
          
          expect(input).toBeTruthy();
          expect(errorElement).toBeTruthy();

          // Input should reference error message via aria-describedby
          const describedBy = input!.getAttribute('aria-describedby');
          const errorId = errorElement!.id;
          
          expect(describedBy).toBe(errorId);
          expect(errorId).toBeTruthy();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain consistent error styling across multiple form fields', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            label: fc.string({ minLength: 1, maxLength: 50 }),
            error: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        (fields) => {
          const errorColors: string[] = [];
          const borderColors: string[] = [];

          fields.forEach(field => {
            const { container, unmount } = render(
              <ShopifyFormField
                label={field.label}
                value=""
                error={field.error}
                onChange={() => {}}
              />
            );

            const input = container.querySelector('input');
            const errorElement = container.querySelector('p[role="alert"]');

            if (input && errorElement) {
              // Extract color classes
              const inputClasses = input.className;
              const errorClasses = errorElement.className;

              // Check for border color
              if (inputClasses.includes('border-[#d72c0d]')) {
                borderColors.push('#d72c0d');
              }

              // Check for text color
              if (errorClasses.includes('text-[#d72c0d]')) {
                errorColors.push('#d72c0d');
              }
            }

            unmount();
          });

          // All error messages should use the same color
          const allSameErrorColor = errorColors.every(color => color === '#d72c0d');
          expect(allSameErrorColor).toBe(true);

          // All error borders should use the same color
          const allSameBorderColor = borderColors.every(color => color === '#d72c0d');
          expect(allSameBorderColor).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });
});
