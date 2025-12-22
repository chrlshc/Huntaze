/**
 * Property Test: Component Visual Consistency
 * 
 * Feature: dashboard-views-unification, Property 1: Component Visual Consistency
 * Validates: Requirements 4.5, 5.1, 5.2, 5.3, 5.4
 */

import { describe, it, expect } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { StatCard } from '@/components/ui/StatCard';
import { InfoCard } from '@/components/ui/InfoCard';
import { TagChip } from '@/components/ui/TagChip';
import { DashboardEmptyState } from '@/components/ui/DashboardEmptyState';
import React from 'react';

describe('Property 1: Component Visual Consistency', () => {
  it('all card components apply consistent base CSS classes', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.oneof(fc.string(), fc.integer()),
        (label, value) => {
          const { container: statContainer } = render(<StatCard label={label} value={value} />);
          const { container: infoContainer } = render(<InfoCard icon={<svg />} title={label} description={String(value)} />);
          
          const statCard = statContainer.querySelector('[data-testid="stat-card"]');
          const infoCard = infoContainer.querySelector('[data-testid="info-card"]');
          
          // Both should have their respective base classes
          expect(statCard?.className).toContain('stat-card');
          expect(infoCard?.className).toContain('info-card');
          
          cleanup();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('all components use consistent CSS class naming convention', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        (label) => {
          const { container: chipContainer } = render(<TagChip label={label} variant="vip" />);
          const chipElement = chipContainer.querySelector('[data-testid="tag-chip"]');
          
          // Should follow BEM naming convention
          expect(chipElement?.className).toMatch(/tag-chip/);
          expect(chipElement?.className).toMatch(/tag-chip--/);
          
          cleanup();
        }
      ),
      { numRuns: 50 }
    );
  });
});
