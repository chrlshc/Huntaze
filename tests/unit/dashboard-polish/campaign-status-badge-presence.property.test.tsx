/**
 * Property Test: Campaign Status Badge Presence
 * Feature: dashboard-global-polish, Property 20: Campaign Status Badge Presence
 * Validates: Requirements 11.3
 * 
 * Tests that any PPV campaign card displays a status badge (Active, Draft, Scheduled)
 * in the top-left corner with appropriate styling.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { ContentGrid, ContentItem } from '@/components/ppv/ContentGrid';

describe('Property 20: Campaign Status Badge Presence', () => {
  /**
   * Property: For any campaign card, a status badge should be displayed in the top-left corner
   */
  it('every campaign card displays a status badge', () => {
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

          const card = screen.getByTestId('content-card');
          const statusBadge = card.querySelector('[data-testid="status-badge"]');
          expect(statusBadge).toBeTruthy();

          // Badge should display the correct status
          const statusText = statusBadge?.textContent?.toLowerCase();
          expect(statusText).toContain(item.status);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Status badge should be positioned in top-left corner
   */
  it('status badge is positioned in top-left corner', () => {
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

          const statusBadge = screen.getByTestId('status-badge') as HTMLElement;
          const inlineStyle = statusBadge.style;

          // Badge should be absolutely positioned
          expect(inlineStyle.position).toBe('absolute');

          // Top and left should be 8px
          expect(inlineStyle.top).toBe('8px');
          expect(inlineStyle.left).toBe('8px');

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Status badge should have appropriate color coding for each status
   */
  it('status badge has correct color for status type', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('active' as const, 'draft' as const, 'scheduled' as const),
        (status) => {
          const item: ContentItem = {
            id: `test-${status}-${Math.random()}`,
            thumbnail: 'https://example.com/image.jpg',
            title: `Test Campaign ${status}`,
            price: 25,
            status: status,
            stats: { sent: 100, opened: 50, purchased: 10 },
          };

          const mockHandlers = {
            onSend: () => {},
            onEdit: () => {},
          };

          const { container, unmount } = render(
            <ContentGrid
              items={[item]}
              onSend={mockHandlers.onSend}
              onEdit={mockHandlers.onEdit}
            />
          );

          const card = container.querySelector('[data-testid="content-card"]');
          expect(card).toBeTruthy();
          
          const statusBadge = card?.querySelector('[data-testid="status-badge"]') as HTMLElement;
          expect(statusBadge).toBeTruthy();
          
          const inlineStyle = statusBadge.style;

          // Check color coding based on status
          const expectedColors = {
            active: 'rgb(16, 185, 129)',    // green
            draft: 'rgb(107, 114, 128)',     // gray
            scheduled: 'rgb(59, 130, 246)', // blue
          };

          expect(inlineStyle.color).toBe(expectedColors[status]);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Status badge should have uppercase text with letter-spacing
   */
  it('status badge has uppercase text with letter-spacing', () => {
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

          const statusBadge = screen.getByTestId('status-badge') as HTMLElement;
          const inlineStyle = statusBadge.style;

          // Should have uppercase text transform
          expect(inlineStyle.textTransform).toBe('uppercase');

          // Should have letter-spacing
          expect(inlineStyle.letterSpacing).toBe('0.05em');

          // Font size should be 11px (label style)
          expect(inlineStyle.fontSize).toBe('11px');

          // Font weight should be 600 (semi-bold)
          expect(inlineStyle.fontWeight).toBe('600');

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Status badge should be visible on the thumbnail
   */
  it('status badge is positioned within thumbnail container', () => {
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

          const statusBadge = screen.getByTestId('status-badge');
          const thumbnailContainer = screen.getByTestId('thumbnail-container');

          // Status badge should be a child of thumbnail container
          expect(thumbnailContainer.contains(statusBadge)).toBe(true);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Card should have data-status attribute matching the status
   */
  it('card has data-status attribute', () => {
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

          const card = screen.getByTestId('content-card');
          expect(card.getAttribute('data-status')).toBe(item.status);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
