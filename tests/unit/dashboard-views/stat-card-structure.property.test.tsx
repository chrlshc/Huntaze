/**
 * Property Test: StatCard Structure
 * 
 * Feature: dashboard-views-unification, Property 5: Stat Card Structure
 * Validates: Requirements 2.1, 2.2, 3.1, 4.1
 * 
 * Tests that StatCard component has correct structure with label, value, optional icon,
 * and optional delta with appropriate CSS classes applied.
 */

import { describe, it, expect } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { StatCard } from '@/components/ui/StatCard';
import React from 'react';

describe('Property 5: Stat Card Structure', () => {
  it('always displays label and value with correct CSS classes', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.oneof(fc.string(), fc.integer()),
        (label, value) => {
          const { container } = render(
            <StatCard label={label} value={value} />
          );
          
          const labelElement = container.querySelector('[data-testid="stat-card-label"]') as HTMLElement;
          const valueElement = container.querySelector('[data-testid="stat-card-value"]') as HTMLElement;
          
          // Verify elements exist
          expect(labelElement).toBeTruthy();
          expect(valueElement).toBeTruthy();
          
          // Verify correct CSS classes are applied
          expect(labelElement.className).toContain('stat-card__label');
          expect(valueElement.className).toContain('stat-card__value');
          
          // Verify content is rendered
          expect(labelElement.textContent).toBe(label);
          expect(valueElement.textContent).toBe(String(value));
          
          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('displays icon container with correct CSS class when icon is provided', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.oneof(fc.string(), fc.integer()),
        (label, value) => {
          const icon = <svg data-testid="test-icon" />;
          const { container } = render(
            <StatCard label={label} value={value} icon={icon} />
          );
          
          const iconContainer = container.querySelector('[data-testid="stat-card-icon"]') as HTMLElement;
          
          // Verify icon container exists
          expect(iconContainer).toBeTruthy();
          
          // Verify correct CSS class is applied
          expect(iconContainer.className).toContain('stat-card__icon');
          
          // Verify icon is rendered inside
          const iconElement = iconContainer.querySelector('[data-testid="test-icon"]');
          expect(iconElement).toBeTruthy();
          
          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('displays positive delta with correct CSS class', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.oneof(fc.string(), fc.integer()),
        fc.string({ minLength: 1, maxLength: 10 }),
        (label, value, deltaValue) => {
          const { container } = render(
            <StatCard
              label={label}
              value={value}
              delta={{ value: deltaValue, trend: 'up' }}
            />
          );
          
          const deltaElement = container.querySelector('[data-testid="stat-card-delta"]') as HTMLElement;
          
          // Verify delta element exists
          expect(deltaElement).toBeTruthy();
          
          // Verify correct CSS classes are applied
          expect(deltaElement.className).toContain('stat-card__delta');
          expect(deltaElement.className).toContain('stat-card__delta--up');
          
          // Verify delta value is rendered
          expect(deltaElement.textContent).toContain(String(deltaValue));
          
          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('displays negative delta with correct CSS class', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.oneof(fc.string(), fc.integer()),
        fc.string({ minLength: 1, maxLength: 10 }),
        (label, value, deltaValue) => {
          const { container } = render(
            <StatCard
              label={label}
              value={value}
              delta={{ value: deltaValue, trend: 'down' }}
            />
          );
          
          const deltaElement = container.querySelector('[data-testid="stat-card-delta"]') as HTMLElement;
          
          // Verify delta element exists
          expect(deltaElement).toBeTruthy();
          
          // Verify correct CSS classes are applied
          expect(deltaElement.className).toContain('stat-card__delta');
          expect(deltaElement.className).toContain('stat-card__delta--down');
          
          // Verify delta value is rendered
          expect(deltaElement.textContent).toContain(String(deltaValue));
          
          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('applies variant CSS class when variant is specified', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.oneof(fc.string(), fc.integer()),
        fc.constantFrom('default', 'success', 'warning', 'error'),
        (label, value, variant) => {
          const { container } = render(
            <StatCard label={label} value={value} variant={variant as any} />
          );
          
          const cardElement = container.querySelector('[data-testid="stat-card"]') as HTMLElement;
          
          // Verify card element exists
          expect(cardElement).toBeTruthy();
          
          // Verify correct variant CSS class is applied
          expect(cardElement.className).toContain(`stat-card--${variant}`);
          
          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });
});
