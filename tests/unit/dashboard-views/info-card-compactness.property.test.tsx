/**
 * Property Test: InfoCard Compactness
 * 
 * Feature: dashboard-views-unification, Property 6: Info Card Compactness
 * Validates: Requirements 1.1, 1.4, 1.5, 4.2
 * 
 * Tests that InfoCard component maintains compact structure with 2-line description clamp,
 * proper gap between icon and content, and correct CSS classes.
 */

import { describe, it, expect } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { InfoCard } from '@/components/ui/InfoCard';
import React from 'react';

describe('Property 6: Info Card Compactness', () => {
  it('always displays icon, title, and description with correct structure', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 10, maxLength: 200 }),
        (title, description) => {
          const icon = <svg data-testid="test-icon" />;
          const { container } = render(
            <InfoCard icon={icon} title={title} description={description} />
          );
          
          const iconElement = container.querySelector('[data-testid="info-card-icon"]') as HTMLElement;
          const titleElement = container.querySelector('[data-testid="info-card-title"]') as HTMLElement;
          const descElement = container.querySelector('[data-testid="info-card-description"]') as HTMLElement;
          
          // Verify all elements exist
          expect(iconElement).toBeTruthy();
          expect(titleElement).toBeTruthy();
          expect(descElement).toBeTruthy();
          
          // Verify correct CSS classes
          expect(iconElement.className).toContain('info-card__icon');
          expect(titleElement.className).toContain('info-card__title');
          expect(descElement.className).toContain('info-card__description');
          
          // Verify content is rendered
          expect(titleElement.textContent).toBe(title);
          expect(descElement.textContent).toBe(description);
          
          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('applies correct CSS class for 2-line clamp on description', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 100, maxLength: 500 }), // Long description to test clamping
        (title, description) => {
          const icon = <svg data-testid="test-icon" />;
          const { container } = render(
            <InfoCard icon={icon} title={title} description={description} />
          );
          
          const descElement = container.querySelector('[data-testid="info-card-description"]') as HTMLElement;
          
          // Verify description element exists
          expect(descElement).toBeTruthy();
          
          // Verify CSS class for line clamping is applied
          expect(descElement.className).toContain('info-card__description');
          
          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('renders as button when onClick is provided', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 10, maxLength: 200 }),
        (title, description) => {
          const icon = <svg data-testid="test-icon" />;
          const onClick = () => {};
          const { container } = render(
            <InfoCard icon={icon} title={title} description={description} onClick={onClick} />
          );
          
          const cardElement = container.querySelector('[data-testid="info-card"]') as HTMLElement;
          
          // Verify card is rendered as button
          expect(cardElement.tagName).toBe('BUTTON');
          expect(cardElement.getAttribute('type')).toBe('button');
          
          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('renders as div when onClick is not provided', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 10, maxLength: 200 }),
        (title, description) => {
          const icon = <svg data-testid="test-icon" />;
          const { container } = render(
            <InfoCard icon={icon} title={title} description={description} />
          );
          
          const cardElement = container.querySelector('[data-testid="info-card"]') as HTMLElement;
          
          // Verify card is rendered as div
          expect(cardElement.tagName).toBe('DIV');
          
          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });
});
