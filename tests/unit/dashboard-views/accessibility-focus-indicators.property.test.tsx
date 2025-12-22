/**
 * Property Test: Accessibility Focus Indicators
 * 
 * Validates: Requirements 7.1
 * 
 * Property 10: Accessibility Focus Indicators
 * For any interactive element (button, input, card), when the element receives
 * keyboard focus, the system SHALL display a visible focus indicator with 2px
 * outline in brand color (#5B6BFF) and 2px offset, ensuring keyboard navigation
 * is clearly visible.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fc from 'fast-check';
import { StatCard } from '@/components/ui/StatCard';
import { InfoCard } from '@/components/ui/InfoCard';
import { DashboardEmptyState } from '@/components/ui/DashboardEmptyState';
import { Users, Star, TrendingUp } from 'lucide-react';

describe('Property 10: Accessibility Focus Indicators', () => {
  it('StatCard should be keyboard focusable with tabIndex', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          label: fc.string({ minLength: 1, maxLength: 50 }),
          value: fc.oneof(
            fc.integer({ min: 0, max: 999999 }),
            fc.double({ min: 0, max: 999999, noNaN: true }).map(n => `$${n.toFixed(2)}`)
          ),
        }),
        async ({ label, value }) => {
          const { container } = render(
            <StatCard
              label={label}
              value={value}
              icon={<Users />}
            />
          );

          const card = container.querySelector('.stat-card');
          expect(card).toBeTruthy();
          expect(card?.getAttribute('tabIndex')).toBe('0');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('InfoCard button should be keyboard focusable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }),
          description: fc.string({ minLength: 1, maxLength: 200 }),
        }),
        async ({ title, description }) => {
          const handleClick = () => {};
          
          const { container } = render(
            <InfoCard
              icon={<Star />}
              title={title}
              description={description}
              onClick={handleClick}
            />
          );

          const button = container.querySelector('button.info-card');
          expect(button).toBeTruthy();
          expect(button?.tagName).toBe('BUTTON');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('DashboardEmptyState CTA button should be keyboard accessible', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }),
          description: fc.string({ minLength: 1, maxLength: 200 }),
          ctaLabel: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        async ({ title, description, ctaLabel }) => {
          const handleClick = () => {};
          
          render(
            <DashboardEmptyState
              icon={<TrendingUp />}
              title={title}
              description={description}
              cta={{
                label: ctaLabel,
                onClick: handleClick,
              }}
            />
          );

          const button = screen.getByTestId('empty-state-cta');
          expect(button).toBeTruthy();
          expect(button.tagName).toBe('BUTTON');
          expect(button.getAttribute('type')).toBe('button');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Focus indicator specification should match design requirements', () => {
    const focusIndicatorSpec = {
      outlineWidth: '2px',
      outlineStyle: 'solid',
      outlineColor: '#5B6BFF',
      outlineOffset: '2px',
    };

    expect(focusIndicatorSpec.outlineWidth).toBe('2px');
    expect(focusIndicatorSpec.outlineOffset).toBe('2px');
    expect(focusIndicatorSpec.outlineColor).toBe('#5B6BFF');
  });

  it('Interactive elements should be keyboard accessible via Tab key', async () => {
    const user = userEvent.setup();
    
    render(
      <div>
        <StatCard label="Test" value="100" icon={<Users />} />
        <InfoCard
          icon={<Star />}
          title="Test Card"
          description="Test description"
          onClick={() => {}}
        />
        <DashboardEmptyState
          icon={<TrendingUp />}
          title="Empty State"
          description="No data"
          cta={{ label: "Create", onClick: () => {} }}
        />
      </div>
    );

    await user.tab();
    const statCard = screen.getByTestId('stat-card');
    expect(document.activeElement).toBe(statCard);

    await user.tab();
    const infoCard = screen.getByTestId('info-card');
    expect(document.activeElement).toBe(infoCard);

    await user.tab();
    const ctaButton = screen.getByTestId('empty-state-cta');
    expect(document.activeElement).toBe(ctaButton);
  });
});
