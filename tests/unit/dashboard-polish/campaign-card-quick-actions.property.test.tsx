/**
 * Property Test: Campaign Card Quick Actions
 * Feature: dashboard-global-polish, Property 19: Campaign Card Quick Actions
 * Validates: Requirements 11.2, 11.5
 * 
 * Tests that hovering over any PPV campaign card reveals quick action buttons
 * (Duplicate, Edit, View Stats) in an overlay without obscuring important information.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import * as fc from 'fast-check';
import { ContentGrid, ContentItem } from '@/components/ppv/ContentGrid';

describe('Property 19: Campaign Card Quick Actions', () => {
  /**
   * Property: For any campaign card with quick action handlers, hovering reveals overlay with action buttons
   */
  it('hovering reveals quick action overlay', () => {
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
            onSend: vi.fn(),
            onEdit: vi.fn(),
            onDuplicate: vi.fn(),
            onViewStats: vi.fn(),
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

          // Initially, overlay should not be visible
          let overlay = card.querySelector('[data-testid="quick-actions-overlay"]');
          expect(overlay).toBeNull();

          // Hover over card
          await user.hover(card);

          // Overlay should now be visible
          overlay = card.querySelector('[data-testid="quick-actions-overlay"]');
          expect(overlay).toBeTruthy();

          // All quick action buttons should be present
          const duplicateBtn = card.querySelector('[data-testid="quick-action-duplicate"]');
          const editBtn = card.querySelector('[data-testid="quick-action-edit"]');
          const statsBtn = card.querySelector('[data-testid="quick-action-stats"]');

          expect(duplicateBtn).toBeTruthy();
          expect(editBtn).toBeTruthy();
          expect(statsBtn).toBeTruthy();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Quick action buttons should trigger their respective handlers
   */
  it('quick action buttons trigger correct handlers', () => {
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
            onSend: vi.fn(),
            onEdit: vi.fn(),
            onDuplicate: vi.fn(),
            onViewStats: vi.fn(),
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

          // Hover to reveal overlay
          await user.hover(card);

          // Click Duplicate button
          const duplicateBtn = screen.getByTestId('quick-action-duplicate');
          await user.click(duplicateBtn);
          expect(mockHandlers.onDuplicate).toHaveBeenCalledWith(item.id);

          // Click Edit button
          const editBtn = screen.getByTestId('quick-action-edit');
          await user.click(editBtn);
          expect(mockHandlers.onEdit).toHaveBeenCalledWith(item.id);

          // Click View Stats button
          const statsBtn = screen.getByTestId('quick-action-stats');
          await user.click(statsBtn);
          expect(mockHandlers.onViewStats).toHaveBeenCalledWith(item.id);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Quick action overlay should not obscure important campaign information
   */
  it('overlay does not obscure title and stats', () => {
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
            onSend: vi.fn(),
            onEdit: vi.fn(),
            onDuplicate: vi.fn(),
            onViewStats: vi.fn(),
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

          // Hover to reveal overlay
          await user.hover(card);

          // Title should still be visible (not covered by overlay)
          const title = card.querySelector('h4');
          expect(title).toBeTruthy();
          expect(title?.textContent).toBe(item.title);

          // Stats should still be visible
          const stats = card.querySelector('[data-testid="content-stats"]');
          expect(stats).toBeTruthy();

          // Overlay should only cover the thumbnail area
          const overlay = screen.getByTestId('quick-actions-overlay');
          const thumbnailContainer = screen.getByTestId('thumbnail-container');
          
          // Overlay should be positioned within thumbnail container
          expect(overlay.parentElement).toBe(thumbnailContainer);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: When handlers are not provided, overlay should not show
   */
  it('overlay only shows when handlers are provided', () => {
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
            onSend: vi.fn(),
            onEdit: vi.fn(),
            // No onDuplicate or onViewStats
          };

          const { unmount } = render(
            <ContentGrid
              items={[item]}
              onSend={mockHandlers.onSend}
              onEdit={mockHandlers.onEdit}
            />
          );

          const card = screen.getByTestId('content-card');

          // Hover over card
          await user.hover(card);

          // Overlay should not appear when no quick action handlers are provided
          const overlay = card.querySelector('[data-testid="quick-actions-overlay"]');
          expect(overlay).toBeNull();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
