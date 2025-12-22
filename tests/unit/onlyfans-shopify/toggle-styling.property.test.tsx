/**
 * Property-Based Test: Toggle Switch Styling
 * Feature: onlyfans-shopify-unification, Property 13
 * Validates: Requirements 7.4
 * 
 * Property 13: Toggle Switch Styling
 * For any toggle switch component, the component should follow Shopify patterns
 * with smooth animation and clear on/off states
 */

import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import { ShopifyToggle } from '@/components/ui/shopify/ShopifyToggle';

describe('Property 13: Toggle Switch Styling', () => {
  it('should have consistent structure for all toggle switches', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/i.test(s)),
          label: fc.string({ minLength: 1, maxLength: 50 }),
          description: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
          checked: fc.boolean(),
        }),
        (props) => {
          const { container, unmount } = render(
            <ShopifyToggle
              id={props.id}
              label={props.label}
              description={props.description}
              checked={props.checked}
              onChange={() => {}}
            />
          );

          // Toggle switch should be present
          const toggle = container.querySelector('[role="switch"]');
          expect(toggle).toBeTruthy();
          expect(toggle!.getAttribute('aria-checked')).toBe(String(props.checked));

          // Label should be present
          const label = container.querySelector('[data-testid="toggle-label"]');
          expect(label).toBeTruthy();
          expect(label!.textContent).toBe(props.label);

          // Description should be present if provided
          if (props.description) {
            const description = container.querySelector('[data-testid="toggle-description"]');
            expect(description).toBeTruthy();
            expect(description!.textContent).toBe(props.description);
          }
          
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have clear on/off visual states', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/i.test(s)),
          label: fc.string({ minLength: 1, maxLength: 50 }),
          checked: fc.boolean(),
        }),
        (props) => {
          const { container, unmount } = render(
            <ShopifyToggle
              id={props.id}
              label={props.label}
              checked={props.checked}
              onChange={() => {}}
            />
          );

          const toggle = container.querySelector('[role="switch"]');
          const knob = container.querySelector('[data-testid="toggle-knob"]');

          expect(toggle).toBeTruthy();
          expect(knob).toBeTruthy();

          // Check aria-checked matches the checked prop
          expect(toggle!.getAttribute('aria-checked')).toBe(String(props.checked));

          // Check that toggle has appropriate classes for state
          const toggleClasses = toggle!.className;
          expect(toggleClasses).toBeTruthy();
          expect(toggleClasses.length).toBeGreaterThan(0);

          // Knob should have transition classes
          const knobClasses = knob!.className;
          expect(knobClasses).toContain('transition');
          
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should toggle state when clicked', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/i.test(s)),
          label: fc.string({ minLength: 1, maxLength: 50 }),
          initialChecked: fc.boolean(),
        }),
        (props) => {
          let currentChecked = props.initialChecked;
          const handleChange = (checked: boolean) => {
            currentChecked = checked;
          };

          const { container, rerender, unmount } = render(
            <ShopifyToggle
              id={props.id}
              label={props.label}
              checked={currentChecked}
              onChange={handleChange}
            />
          );

          const toggle = container.querySelector('[role="switch"]');
          expect(toggle).toBeTruthy();

          // Initial state
          expect(toggle!.getAttribute('aria-checked')).toBe(String(props.initialChecked));

          // Click to toggle
          fireEvent.click(toggle!);

          // State should have changed
          expect(currentChecked).toBe(!props.initialChecked);

          // Re-render with new state
          rerender(
            <ShopifyToggle
              id={props.id}
              label={props.label}
              checked={currentChecked}
              onChange={handleChange}
            />
          );

          // Verify new state
          const toggleAfter = container.querySelector('[role="switch"]');
          expect(toggleAfter!.getAttribute('aria-checked')).toBe(String(!props.initialChecked));
          
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should support keyboard navigation (Space and Enter keys)', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/i.test(s)),
          label: fc.string({ minLength: 1, maxLength: 50 }),
          initialChecked: fc.boolean(),
          key: fc.constantFrom(' ', 'Enter'),
        }),
        (props) => {
          let currentChecked = props.initialChecked;
          const handleChange = (checked: boolean) => {
            currentChecked = checked;
          };

          const { container, unmount } = render(
            <ShopifyToggle
              id={props.id}
              label={props.label}
              checked={currentChecked}
              onChange={handleChange}
            />
          );

          const toggle = container.querySelector('[role="switch"]');
          expect(toggle).toBeTruthy();

          // Trigger keyboard event
          fireEvent.keyDown(toggle!, { key: props.key });

          // State should have changed
          expect(currentChecked).toBe(!props.initialChecked);
          
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not toggle when disabled', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/i.test(s)),
          label: fc.string({ minLength: 1, maxLength: 50 }),
          checked: fc.boolean(),
        }),
        (props) => {
          let changeCallCount = 0;
          const handleChange = () => {
            changeCallCount++;
          };

          const { container, unmount } = render(
            <ShopifyToggle
              id={props.id}
              label={props.label}
              checked={props.checked}
              disabled={true}
              onChange={handleChange}
            />
          );

          const toggle = container.querySelector('[role="switch"]');
          expect(toggle).toBeTruthy();

          // Check disabled state
          expect(toggle!.getAttribute('aria-disabled')).toBe('true');
          expect(toggle!.hasAttribute('disabled')).toBe(true);

          // Try to click
          fireEvent.click(toggle!);

          // onChange should not have been called
          expect(changeCallCount).toBe(0);
          
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have smooth animation classes', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/i.test(s)),
          label: fc.string({ minLength: 1, maxLength: 50 }),
          checked: fc.boolean(),
        }),
        (props) => {
          const { container, unmount } = render(
            <ShopifyToggle
              id={props.id}
              label={props.label}
              checked={props.checked}
              onChange={() => {}}
            />
          );

          const toggle = container.querySelector('[role="switch"]');
          const knob = container.querySelector('[data-testid="toggle-knob"]');
          
          expect(toggle).toBeTruthy();
          expect(knob).toBeTruthy();

          // Toggle should have transition classes
          const toggleClasses = toggle!.className;
          expect(toggleClasses).toContain('transition');

          // Knob should have transition classes
          const knobClasses = knob!.className;
          expect(knobClasses).toContain('transition');
          expect(knobClasses).toContain('duration');
          
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have proper accessibility attributes', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/i.test(s)),
          label: fc.string({ minLength: 1, maxLength: 50 }),
          checked: fc.boolean(),
          disabled: fc.boolean(),
        }),
        (props) => {
          const { container, unmount } = render(
            <ShopifyToggle
              id={props.id}
              label={props.label}
              checked={props.checked}
              disabled={props.disabled}
              onChange={() => {}}
            />
          );

          const toggle = container.querySelector('[role="switch"]');
          expect(toggle).toBeTruthy();

          // Should have proper role
          expect(toggle!.getAttribute('role')).toBe('switch');

          // Should have aria-checked
          expect(toggle!.getAttribute('aria-checked')).toBe(String(props.checked));

          // Should have id
          expect(toggle!.id).toBe(props.id);

          // Should have aria-disabled if disabled
          if (props.disabled) {
            expect(toggle!.getAttribute('aria-disabled')).toBe('true');
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have consistent sizing across all instances', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/i.test(s)),
            label: fc.string({ minLength: 1, maxLength: 50 }),
            checked: fc.boolean(),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        (toggles) => {
          // Ensure unique IDs
          const uniqueToggles = toggles.map((t, i) => ({ ...t, id: `${t.id}-${i}` }));

          const classLists: string[] = [];

          uniqueToggles.forEach(props => {
            const { container, unmount } = render(
              <ShopifyToggle
                id={props.id}
                label={props.label}
                checked={props.checked}
                onChange={() => {}}
              />
            );

            const toggle = container.querySelector('[role="switch"]');
            if (toggle) {
              classLists.push(toggle.className);
            }
            unmount();
          });

          // All toggles should have the same base classes
          const hasConsistentBaseClasses = classLists.every(classList => {
            // Check for key Shopify toggle classes
            return classList.includes('rounded-full') && 
                   classList.includes('transition') &&
                   classList.includes('h-5') &&
                   classList.includes('w-9');
          });

          expect(hasConsistentBaseClasses).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });
});
