/**
 * Property Test: TagChip Color Mapping
 * 
 * Feature: dashboard-views-unification, Property 3: Tag Chip Color Mapping
 * Validates: Requirements 2.5, 2.6, 4.3
 * 
 * Tests that TagChip component applies the correct CSS class for each variant,
 * ensuring consistent status visualization across all dashboard views.
 */

import { describe, it, expect } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { TagChip, TagVariant } from '@/components/ui/TagChip';
import React from 'react';

describe('Property 3: Tag Chip Color Mapping', () => {
  it('always applies correct CSS class for each variant', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.constantFrom<TagVariant>(
          'vip',
          'active',
          'at-risk',
          'churned',
          'churn-low',
          'churn-high',
          'nouveau'
        ),
        (label, variant) => {
          const { container } = render(
            <TagChip label={label} variant={variant} />
          );
          
          const chipElement = container.querySelector('[data-testid="tag-chip"]') as HTMLElement;
          
          // Verify chip element exists
          expect(chipElement).toBeTruthy();
          
          // Verify base CSS class is applied
          expect(chipElement.className).toContain('tag-chip');
          
          // Verify variant-specific CSS class is applied
          expect(chipElement.className).toContain(`tag-chip--${variant}`);
          
          // Verify data-variant attribute is set
          expect(chipElement.getAttribute('data-variant')).toBe(variant);
          
          // Verify label is rendered
          expect(chipElement.textContent).toBe(label);
          
          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('VIP variant applies correct CSS class', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        (label) => {
          const { container } = render(
            <TagChip label={label} variant="vip" />
          );
          
          const chipElement = container.querySelector('[data-testid="tag-chip"]') as HTMLElement;
          expect(chipElement.className).toContain('tag-chip--vip');
          
          cleanup();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Active variant applies correct CSS class', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        (label) => {
          const { container } = render(
            <TagChip label={label} variant="active" />
          );
          
          const chipElement = container.querySelector('[data-testid="tag-chip"]') as HTMLElement;
          expect(chipElement.className).toContain('tag-chip--active');
          
          cleanup();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Churn-Low variant applies correct CSS class', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        (label) => {
          const { container } = render(
            <TagChip label={label} variant="churn-low" />
          );
          
          const chipElement = container.querySelector('[data-testid="tag-chip"]') as HTMLElement;
          expect(chipElement.className).toContain('tag-chip--churn-low');
          
          cleanup();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Churn-High variant applies correct CSS class', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        (label) => {
          const { container } = render(
            <TagChip label={label} variant="churn-high" />
          );
          
          const chipElement = container.querySelector('[data-testid="tag-chip"]') as HTMLElement;
          expect(chipElement.className).toContain('tag-chip--churn-high');
          
          cleanup();
        }
      ),
      { numRuns: 50 }
    );
  });
});
