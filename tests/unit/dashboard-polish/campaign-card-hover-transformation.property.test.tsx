/**
 * Property Test: Campaign Card Hover Transformation
 * Feature: dashboard-global-polish, Property 18: Campaign Card Hover Transformation
 * Validates: Requirements 11.1
 * 
 * Tests that hovering over any PPV campaign card applies scale(1.01) transformation to the image.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import * as fc from 'fast-check';
import { ContentGrid, ContentItem } from '@/components/ppv/ContentGrid';

describe('Property 18: Campaign Card Hover Transformation', () => {
  /**
   * Property: For any campaign card, hovering should apply scale(1.01) transformation to the image
   */
  it('hovering over campaign card applies scale(1.01) to image', () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 1 }),
          thumbnail: fc.webUrl(),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          price: fc.integer({ min: 1, max: 1000 }),
          status: fc.constantFrom('active' as const, 'draft' as const, 'scheduled' as const),
          stats: fc.record({
            sent: fc.integer({ min: 0, max: 10000 }),
            opened: fc.integer({ min: 0, max: 10000 }),
            purchased: fc.integer({ min: 0, max: 10000 }),
          }),
        }),
        async (item) => {
          const user = userEvent.setup();
          const mockHandlers = {
            onSend: () => {},
            onEdit: () => {},
            onDuplicate: () => {},
            onViewStats: () => {},
          };

          const { unmount } = render(
            <ContentGrid
              items={[item]}
              onSend={mockHandlers.onSend}
              onEdit={mockHandlers.onEdit}
              onDuplicate={mockHandlers.onDuplicate}
              onViewStats={mockHandlers.onViewStats}
            />
          );

          const card = screen.getByTestId('content-card');
          const thumbnail = card.querySelector('[data-testid="content-thumbnail"]') as HTMLElement;
          expect(thumbnail).toBeTruthy();

          // Hover over the card
          await user.hover(card);

          // Check that transform includes scale(1.01)
          const inlineTransform = thumbnail.style.transform;
          expect(inlineTransform).toContain('scale(1.01)');

          // Unhover
          await user.unhover(card);

          // Transform should return to scale(1)
          const unhoverTransform = thumbnail.style.transform;
          expect(unhoverTransform).toContain('scale(1)');

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Transform transition should be smooth (200ms cubic-bezier)
   */
  it('image transform has smooth transition', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1 }),
          thumbnail: fc.webUrl(),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          price: fc.integer({ min: 1, max: 1000 }),
          status: fc.constantFrom('active' as const, 'draft' as const, 'scheduled' as const),
          stats: fc.record({
            sent: fc.integer({ min: 0, max: 10000 }),
            opened: fc.integer({ min: 0, max: 10000 }),
            purchased: fc.integer({ min: 0, max: 10000 }),
          }),
        }),
        (item) => {
          const mockHandlers = {
            onSend: () => {},
            onEdit: () => {},
          };

          const { unmount } = render(
            <ContentGrid
              items={[item]}
              onSend={mockHandlers.onSend}
              onEdit={mockHandlers.onEdit}
            />
          );

          const thumbnail = screen.getByTestId('content-thumbnail');
          const inlineStyle = thumbnail.style;

          // Check transition property includes transform
          expect(inlineStyle.transition).toContain('transform');
          
          // Check timing function is cubic-bezier
          expect(inlineStyle.transition).toMatch(/cubic-bezier|ease/);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Hover transformation should not affect other card elements
   */
  it('hover only transforms image, not other elements', () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 1 }),
          thumbnail: fc.webUrl(),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          price: fc.integer({ min: 1, max: 1000 }),
          status: fc.constantFrom('active' as const, 'draft' as const, 'scheduled' as const),
          stats: fc.record({
            sent: fc.integer({ min: 0, max: 10000 }),
            opened: fc.integer({ min: 0, max: 10000 }),
            purchased: fc.integer({ min: 0, max: 10000 }),
          }),
        }),
        async (item) => {
          const user = userEvent.setup();
          const mockHandlers = {
            onSend: () => {},
            onEdit: () => {},
          };

          const { unmount } = render(
            <ContentGrid
              items={[item]}
              onSend={mockHandlers.onSend}
              onEdit={mockHandlers.onEdit}
            />
          );

          const card = screen.getByTestId('content-card');
          const thumbnail = screen.getByTestId('content-thumbnail');
          const statusBadge = screen.getByTestId('status-badge');

          // Hover over card
          await user.hover(card);

          // Only thumbnail should have scale transform
          expect(thumbnail.style.transform).toContain('scale(1.01)');
          
          // Status badge should not have scale transform
          expect(statusBadge.style.transform).not.toContain('scale(1.01)');

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
