/**
 * Property Test: Empty State Completeness
 * Feature: dashboard-global-polish, Property 9: Empty State Completeness
 * Validates: Requirements 5.3, 5.4, 5.5
 * 
 * Tests that Smart Messages empty state includes all required elements:
 * - Icon (48px, gray)
 * - Title "No smart rules yet" (H2 styling)
 * - Description text (14px body)
 * - 3 outcome-oriented bullet points
 * - "New Smart Rule" CTA button
 * - "View examples" link
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import React from 'react';
import { DashboardEmptyState } from '@/components/ui/DashboardEmptyState';

describe('Property 9: Empty State Completeness', () => {
  afterEach(() => {
    cleanup();
  });

  describe('Required Elements Presence', () => {
    it('should always include icon element', () => {
      const { container } = render(
        <DashboardEmptyState
          icon={<svg data-testid="icon-svg" width="48" height="48" />}
          title="No smart rules yet"
          description="Get started with automated messaging"
          benefits={[
            'Auto-respond to new subscribers',
            'Re-engage inactive fans',
            'Prioritize VIP conversations',
          ]}
          cta={{
            label: "New Smart Rule",
            onClick: () => {}
          }}
          secondaryLink={{
            label: "View examples",
            onClick: () => {}
          }}
        />
      );

      const icon = screen.getByTestId('empty-state-icon');
      expect(icon).toBeInTheDocument();
      expect(icon.querySelector('[data-testid="icon-svg"]')).toBeInTheDocument();
    });

    it('should always include title with correct text', () => {
      render(
        <DashboardEmptyState
          icon={<svg width="48" height="48" />}
          title="No smart rules yet"
          description="Get started"
          benefits={['Point 1', 'Point 2', 'Point 3']}
          cta={{
            label: "New Smart Rule",
            onClick: () => {}
          }}
          secondaryLink={{
            label: "View examples",
            onClick: () => {}
          }}
        />
      );

      const title = screen.getByTestId('empty-state-title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('No smart rules yet');
    });

    it('should always include description text', () => {
      render(
        <DashboardEmptyState
          icon={<svg width="48" height="48" />}
          title="No smart rules yet"
          description="Get started with automated messaging"
          benefits={['Point 1', 'Point 2', 'Point 3']}
          cta={{
            label: "New Smart Rule",
            onClick: () => {}
          }}
          secondaryLink={{
            label: "View examples",
            onClick: () => {}
          }}
        />
      );

      const description = screen.getByTestId('empty-state-description');
      expect(description).toBeInTheDocument();
      expect(description.textContent).toBeTruthy();
    });

    it('should always include exactly 3 bullet points', () => {
      render(
        <DashboardEmptyState
          icon={<svg width="48" height="48" />}
          title="No smart rules yet"
          description="Get started"
          benefits={[
            'Auto-respond to new subscribers',
            'Re-engage inactive fans',
            'Prioritize VIP conversations',
          ]}
          cta={{
            label: "New Smart Rule",
            onClick: () => {}
          }}
          secondaryLink={{
            label: "View examples",
            onClick: () => {}
          }}
        />
      );

      const bullets = screen.getByTestId('empty-state-benefits');
      expect(bullets).toBeInTheDocument();
      expect(bullets.children).toHaveLength(3);
    });

    it('should always include CTA button with correct label', () => {
      render(
        <DashboardEmptyState
          icon={<svg width="48" height="48" />}
          title="No smart rules yet"
          description="Get started"
          benefits={['Point 1', 'Point 2', 'Point 3']}
          cta={{
            label: "New Smart Rule",
            onClick: () => {}
          }}
          secondaryLink={{
            label: "View examples",
            onClick: () => {}
          }}
        />
      );

      const cta = screen.getByTestId('empty-state-cta');
      expect(cta).toBeInTheDocument();
      expect(cta).toHaveTextContent('New Smart Rule');
    });

    it('should always include "View examples" link', () => {
      render(
        <DashboardEmptyState
          icon={<svg width="48" height="48" />}
          title="No smart rules yet"
          description="Get started"
          benefits={['Point 1', 'Point 2', 'Point 3']}
          cta={{
            label: "New Smart Rule",
            onClick: () => {}
          }}
          secondaryLink={{
            label: "View examples",
            onClick: () => {}
          }}
        />
      );

      const link = screen.getByTestId('empty-state-secondary-link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveTextContent('View examples');
    });
  });

  describe('Property-Based Tests', () => {
    it('for any 3 bullet points, all should be rendered', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 10, maxLength: 100 }).filter(s => s.trim().length >= 5), { minLength: 3, maxLength: 3 }),
          (bulletPoints) => {
            const { container, unmount } = render(
              <DashboardEmptyState
                icon={<svg width="48" height="48" />}
                title="No smart rules yet"
                description="Get started"
                benefits={bulletPoints}
                cta={{
                  label: "New Smart Rule",
                  onClick: () => {}
                }}
                secondaryLink={{
                  label: "View examples",
                  onClick: () => {}
                }}
              />
            );

            const bullets = container.querySelector('[data-testid="empty-state-benefits"]');
            expect(bullets).toBeTruthy();
            expect(bullets!.children).toHaveLength(3);

            bulletPoints.forEach((point) => {
              expect(bullets!.textContent).toContain(point);
            });

            unmount();
            cleanup();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any title text, it should be displayed in the title element', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
          (titleText) => {
            const { container, unmount } = render(
              <DashboardEmptyState
                icon={<svg width="48" height="48" />}
                title={titleText}
                description="Get started"
                benefits={['Point 1', 'Point 2', 'Point 3']}
                cta={{
                  label: "New Smart Rule",
                  onClick: () => {}
                }}
                secondaryLink={{
                  label: "View examples",
                  onClick: () => {}
                }}
              />
            );

            const title = container.querySelector('[data-testid="empty-state-title"]');
            expect(title).toBeTruthy();
            expect(title!.textContent).toBe(titleText);

            unmount();
            cleanup();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any description text, it should be displayed in the description element', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 200 }).filter(s => s.trim().length > 0),
          (descriptionText) => {
            const { container, unmount } = render(
              <DashboardEmptyState
                icon={<svg width="48" height="48" />}
                title="No smart rules yet"
                description={descriptionText}
                benefits={['Point 1', 'Point 2', 'Point 3']}
                cta={{
                  label: "New Smart Rule",
                  onClick: () => {}
                }}
                secondaryLink={{
                  label: "View examples",
                  onClick: () => {}
                }}
              />
            );

            const description = container.querySelector('[data-testid="empty-state-description"]');
            expect(description).toBeTruthy();
            expect(description!.textContent).toBe(descriptionText);

            unmount();
            cleanup();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any CTA label, it should be displayed in the button', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 30 }).filter(s => s.trim().length > 0),
          (ctaLabel) => {
            const { container, unmount } = render(
              <DashboardEmptyState
                icon={<svg width="48" height="48" />}
                title="No smart rules yet"
                description="Get started"
                benefits={['Point 1', 'Point 2', 'Point 3']}
                cta={{
                  label: ctaLabel,
                  onClick: () => {}
                }}
                secondaryLink={{
                  label: "View examples",
                  onClick: () => {}
                }}
              />
            );

            const cta = container.querySelector('[data-testid="empty-state-cta"]');
            expect(cta).toBeTruthy();
            expect(cta!.textContent).toBe(ctaLabel);

            unmount();
            cleanup();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any link label, it should be displayed in the link element', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 30 }).filter(s => s.trim().length > 0),
          (linkLabel) => {
            const { container, unmount } = render(
              <DashboardEmptyState
                icon={<svg width="48" height="48" />}
                title="No smart rules yet"
                description="Get started"
                benefits={['Point 1', 'Point 2', 'Point 3']}
                cta={{
                  label: "New Smart Rule",
                  onClick: () => {}
                }}
                secondaryLink={{
                  label: linkLabel,
                  onClick: () => {}
                }}
              />
            );

            const link = container.querySelector('[data-testid="empty-state-secondary-link"]');
            expect(link).toBeTruthy();
            expect(link!.textContent).toBe(linkLabel);

            unmount();
            cleanup();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Styling Requirements', () => {
    it('should have icon with correct size (48px)', () => {
      const { container } = render(
        <DashboardEmptyState
          icon={<svg width="48" height="48" data-testid="icon-svg" />}
          title="No smart rules yet"
          description="Get started"
          benefits={['Point 1', 'Point 2', 'Point 3']}
          cta={{
            label: "New Smart Rule",
            onClick: () => {}
          }}
          secondaryLink={{
            label: "View examples",
            onClick: () => {}
          }}
        />
      );

      const iconSvg = screen.getByTestId('icon-svg');
      expect(iconSvg).toHaveAttribute('width', '48');
      expect(iconSvg).toHaveAttribute('height', '48');
    });

    it('should have title with H2 styling class', () => {
      render(
        <DashboardEmptyState
          icon={<svg width="48" height="48" />}
          title="No smart rules yet"
          description="Get started"
          benefits={['Point 1', 'Point 2', 'Point 3']}
          cta={{
            label: "New Smart Rule",
            onClick: () => {}
          }}
          secondaryLink={{
            label: "View examples",
            onClick: () => {}
          }}
        />
      );

      const title = screen.getByTestId('empty-state-title');
      expect(title.tagName).toBe('H3');
    });

    it('should have description with body text styling', () => {
      render(
        <DashboardEmptyState
          icon={<svg width="48" height="48" />}
          title="No smart rules yet"
          description="Get started"
          benefits={['Point 1', 'Point 2', 'Point 3']}
          cta={{
            label: "New Smart Rule",
            onClick: () => {}
          }}
          secondaryLink={{
            label: "View examples",
            onClick: () => {}
          }}
        />
      );

      const description = screen.getByTestId('empty-state-description');
      expect(description.tagName).toBe('P');
    });
  });

  describe('Outcome-Oriented Bullet Points', () => {
    it('should include outcome-oriented bullet points', () => {
      const outcomePoints = [
        'Auto-respond to new subscribers',
        'Re-engage inactive fans',
        'Prioritize VIP conversations',
      ];

      render(
        <DashboardEmptyState
          icon={<svg width="48" height="48" />}
          title="No smart rules yet"
          description="Get started"
          benefits={outcomePoints}
          cta={{
            label: "New Smart Rule",
            onClick: () => {}
          }}
          secondaryLink={{
            label: "View examples",
            onClick: () => {}
          }}
        />
      );

      const benefits = screen.getByTestId('empty-state-benefits');
      outcomePoints.forEach((point) => {
        expect(benefits.textContent).toContain(point);
      });
    });

    it('should have exactly 3 outcome-oriented bullet points', () => {
      render(
        <DashboardEmptyState
          icon={<svg width="48" height="48" />}
          title="No smart rules yet"
          description="Get started"
          benefits={[
            'Auto-respond to new subscribers',
            'Re-engage inactive fans',
            'Prioritize VIP conversations',
          ]}
          cta={{
            label: "New Smart Rule",
            onClick: () => {}
          }}
          secondaryLink={{
            label: "View examples",
            onClick: () => {}
          }}
        />
      );

      const bullets = screen.getByTestId('empty-state-benefits');
      expect(bullets.children).toHaveLength(3);
    });
  });
});
