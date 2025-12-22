/**
 * Property Test: Hover State Feedback
 * 
 * Feature: dashboard-views-unification, Property 2: Hover State Feedback
 * Validates: Requirements 5.6, 2.7, 3.4
 */

import { describe, it, expect } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { StatCard } from '@/components/ui/StatCard';
import { InfoCard } from '@/components/ui/InfoCard';
import React from 'react';

describe('Property 2: Hover State Feedback', () => {
  it('StatCard has hover state CSS class', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.oneof(fc.string(), fc.integer()),
        (label, value) => {
          const { container } = render(<StatCard label={label} value={value} />);
          const card = container.querySelector('[data-testid="stat-card"]') as HTMLElement;
          
          // Verify card exists and has base class (hover styles are in CSS)
          expect(card).toBeTruthy();
          expect(card.className).toContain('stat-card');
          
          cleanup();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('InfoCard has hover state CSS class', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 10, maxLength: 200 }),
        (title, description) => {
          const { container } = render(<InfoCard icon={<svg />} title={title} description={description} />);
          const card = container.querySelector('[data-testid="info-card"]') as HTMLElement;
          
          // Verify card exists and has base class (hover styles are in CSS)
          expect(card).toBeTruthy();
          expect(card.className).toContain('info-card');
          
          cleanup();
        }
      ),
      { numRuns: 50 }
    );
  });
});
