/**
 * Property Test: Border Consistency
 * 
 * Feature: dashboard-views-unification, Property 8: Border Consistency
 * Validates: Requirements 1.5, 2.2, 3.1, 4.1, 5.1
 */

import { describe, it, expect } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { StatCard } from '@/components/ui/StatCard';
import { InfoCard } from '@/components/ui/InfoCard';
import { DashboardEmptyState } from '@/components/ui/DashboardEmptyState';
import React from 'react';

describe('Property 8: Border Consistency', () => {
  it('all card components have consistent CSS classes for borders', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.oneof(fc.string(), fc.integer()),
        (label, value) => {
          const { container: statContainer } = render(<StatCard label={label} value={value} />);
          const { container: infoContainer } = render(<InfoCard icon={<svg />} title={label} description={String(value)} />);
          const { container: emptyContainer } = render(
            <DashboardEmptyState
              icon={<svg />}
              title={label}
              description={String(value)}
              cta={{ label: 'Test', onClick: () => {} }}
            />
          );
          
          const statCard = statContainer.querySelector('[data-testid="stat-card"]');
          const infoCard = infoContainer.querySelector('[data-testid="info-card"]');
          const emptyState = emptyContainer.querySelector('[data-testid="dashboard-empty-state"]');
          
          // All should have their base classes which include border styling
          expect(statCard?.className).toContain('stat-card');
          expect(infoCard?.className).toContain('info-card');
          expect(emptyState?.className).toContain('dashboard-empty-state');
          
          cleanup();
        }
      ),
      { numRuns: 50 }
    );
  });
});
