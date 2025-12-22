/**
 * Property Test: EmptyState Completeness
 * 
 * Feature: dashboard-views-unification, Property 4: Empty State Completeness
 * Validates: Requirements 1.2, 5.5
 */

import { describe, it, expect } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { DashboardEmptyState } from '@/components/ui/DashboardEmptyState';
import React from 'react';

describe('Property 4: Empty State Completeness', () => {
  it('always displays all required elements', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 10, maxLength: 200 }),
        fc.string({ minLength: 5, maxLength: 30 }),
        (title, description, ctaLabel) => {
          const icon = <svg data-testid="test-icon" />;
          const { container } = render(
            <DashboardEmptyState
              icon={icon}
              title={title}
              description={description}
              cta={{ label: ctaLabel, onClick: () => {} }}
            />
          );
          
          expect(container.querySelector('[data-testid="empty-state-icon"]')).toBeTruthy();
          expect(container.querySelector('[data-testid="empty-state-title"]')).toBeTruthy();
          expect(container.querySelector('[data-testid="empty-state-description"]')).toBeTruthy();
          expect(container.querySelector('[data-testid="empty-state-cta"]')).toBeTruthy();
          
          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('displays benefits list when provided', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 10, maxLength: 200 }),
        fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
        fc.string({ minLength: 5, maxLength: 30 }),
        (title, description, benefits, ctaLabel) => {
          const icon = <svg data-testid="test-icon" />;
          const { container } = render(
            <DashboardEmptyState
              icon={icon}
              title={title}
              description={description}
              benefits={benefits}
              cta={{ label: ctaLabel, onClick: () => {} }}
            />
          );
          
          const benefitsList = container.querySelector('[data-testid="empty-state-benefits"]');
          expect(benefitsList).toBeTruthy();
          expect(benefitsList?.children.length).toBe(benefits.length);
          
          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });
});
