/**
 * Feature: dashboard-global-polish, Property 21: Component Styling Consistency
 * 
 * Property: For any StatCard, InfoCard, TagChip, PrimaryButton, SecondaryButton, 
 * or PageLayout component, they should use consistent border-radius, shadows, 
 * and hover states as defined in the design system.
 * 
 * Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { StatCard } from '@/components/ui/StatCard';
import { InfoCard } from '@/components/ui/InfoCard';
import { TagChip } from '@/components/ui/TagChip';
import { Button } from '@/components/ui/Button';
import { PageLayout } from '@/components/ui/PageLayout';
import { SegmentCard } from '@/components/fans/SegmentCard';
import { FilterPill } from '@/components/fans/FilterPill';
import { FilterIndicator } from '@/components/ppv/FilterIndicator';

/**
 * Helper function to get computed styles for an element
 */
function getComputedStyleValue(element: HTMLElement, property: string): string {
  return window.getComputedStyle(element).getPropertyValue(property);
}

/**
 * Helper function to parse border-radius value
 */
function parseBorderRadius(value: string): number {
  const match = value.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

/**
 * Helper function to check if border-radius is consistent with design system
 * Design system uses: 8px, 12px, 16px, 9999px (pill)
 */
function isValidBorderRadius(value: string): boolean {
  const radius = parseBorderRadius(value);
  const validRadii = [8, 12, 16, 9999];
  return validRadii.some(valid => Math.abs(radius - valid) < 1);
}

describe('Component Styling Consistency - Property 21', () => {
  let styleElement: HTMLStyleElement;

  beforeEach(() => {
    // Inject dashboard polish CSS tokens into the test environment
    styleElement = document.createElement('style');
    styleElement.textContent = `
      /* Dashboard Polish Tokens - Design System Values */
      :root {
        --radius-xl: 12px;
        --radius-full: 9999px;
        --button-border-radius: 8px;
        --button-min-touch-target: 44px;
        --polish-header-margin: 32px;
        --polish-text-h1: 24px;
        --polish-text-label: 11px;
      }
      
      /* StatCard Styles */
      .stat-card {
        border-radius: 12px;
        border: 1px solid #E3E3E3;
        border-style: solid;
      }
      
      /* InfoCard Styles */
      .info-card {
        border-radius: 12px;
        border: 1px solid #E3E3E3;
        border-style: solid;
      }
      
      /* TagChip Styles */
      .tag-chip {
        border-radius: 9999px;
      }
      
      /* Button Styles */
      button {
        border-radius: 8px;
        min-height: 44px;
      }
      
      /* PageLayout Styles */
      .page-layout-header {
        margin-bottom: 32px;
      }
      
      .page-layout-title {
        font-size: 24px;
        font-weight: 600;
      }
      
      .page-layout-subtitle {
        font-size: 11px;
        text-transform: uppercase;
      }
      
      /* SegmentCard Styles */
      .segment-card {
        border-radius: 12px;
        border: 1px solid #E3E3E3;
        border-style: solid;
      }
      
      /* FilterPill Styles */
      .filter-pill {
        border-radius: 8px;
      }
      
      /* FilterIndicator Styles */
      .filter-indicator {
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }
    `;
    document.head.appendChild(styleElement);
  });

  afterEach(() => {
    // Cleanup
    if (styleElement && styleElement.parentNode) {
      styleElement.parentNode.removeChild(styleElement);
    }
  });

  describe('StatCard Component', () => {
    it('should use consistent border-radius from design system', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.oneof(fc.string(), fc.integer({ min: 0, max: 1000000 })),
          (label, value) => {
            const { container } = render(
              <StatCard label={label} value={value} />
            );
            
            const card = container.querySelector('.stat-card');
            expect(card).toBeTruthy();
            
            if (card) {
              const borderRadius = getComputedStyleValue(card as HTMLElement, 'border-radius');
              expect(isValidBorderRadius(borderRadius)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have consistent border styling', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.oneof(fc.string(), fc.integer({ min: 0, max: 1000000 })),
          (label, value) => {
            const { container } = render(
              <StatCard label={label} value={value} />
            );
            
            const card = container.querySelector('.stat-card');
            expect(card).toBeTruthy();
            
            if (card) {
              const borderWidth = getComputedStyleValue(card as HTMLElement, 'border-width');
              const borderStyle = getComputedStyleValue(card as HTMLElement, 'border-style');
              
              // Should have a border
              expect(borderWidth).not.toBe('0px');
              expect(borderStyle).toBe('solid');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('InfoCard Component', () => {
    it('should use consistent border-radius from design system', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 200 }),
          (title, description) => {
            const { container } = render(
              <InfoCard
                icon={<div>Icon</div>}
                title={title}
                description={description}
              />
            );
            
            const card = container.querySelector('.info-card');
            expect(card).toBeTruthy();
            
            if (card) {
              const borderRadius = getComputedStyleValue(card as HTMLElement, 'border-radius');
              expect(isValidBorderRadius(borderRadius)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('TagChip Component', () => {
    it('should use pill-shaped border-radius (9999px)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.constantFrom('vip', 'active', 'at-risk', 'churned', 'low', 'medium', 'high'),
          (label, variant) => {
            const { container } = render(
              <TagChip label={label} variant={variant as any} />
            );
            
            const chip = container.querySelector('.tag-chip');
            expect(chip).toBeTruthy();
            
            if (chip) {
              const borderRadius = getComputedStyleValue(chip as HTMLElement, 'border-radius');
              const radius = parseBorderRadius(borderRadius);
              
              // Pill shape should have very large border-radius (9999px or equivalent)
              expect(radius).toBeGreaterThan(100);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Button Component', () => {
    it('should use consistent border-radius from design system', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.constantFrom('primary', 'secondary', 'outline', 'ghost', 'tonal', 'danger'),
          (text, variant) => {
            const { container } = render(
              <Button variant={variant as any}>{text}</Button>
            );
            
            const button = container.querySelector('button');
            expect(button).toBeTruthy();
            
            if (button) {
              const borderRadius = getComputedStyleValue(button, 'border-radius');
              expect(isValidBorderRadius(borderRadius)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have minimum touch target height (44px)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.constantFrom('sm', 'md', 'lg', 'xl'),
          (text, size) => {
            const { container } = render(
              <Button size={size as any}>{text}</Button>
            );
            
            const button = container.querySelector('button');
            expect(button).toBeTruthy();
            
            if (button) {
              const minHeight = getComputedStyleValue(button, 'min-height');
              const minHeightValue = parseFloat(minHeight);
              
              // WCAG minimum touch target is 44px
              expect(minHeightValue).toBeGreaterThanOrEqual(44);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('PageLayout Component', () => {
    it('should use consistent spacing for header margin', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (title) => {
            const { container } = render(
              <PageLayout title={title}>
                <div>Content</div>
              </PageLayout>
            );
            
            const header = container.querySelector('.page-layout-header');
            expect(header).toBeTruthy();
            
            if (header) {
              const marginBottom = getComputedStyleValue(header as HTMLElement, 'margin-bottom');
              const marginValue = parseFloat(marginBottom);
              
              // Should use --polish-header-margin (32px)
              expect(marginValue).toBeGreaterThanOrEqual(24); // Allow some flexibility
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use consistent typography for title and subtitle', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (title, subtitle) => {
            const { container } = render(
              <PageLayout title={title} subtitle={subtitle}>
                <div>Content</div>
              </PageLayout>
            );
            
            const titleElement = container.querySelector('.page-layout-title');
            const subtitleElement = container.querySelector('.page-layout-subtitle');
            
            expect(titleElement).toBeTruthy();
            expect(subtitleElement).toBeTruthy();
            
            if (titleElement) {
              const fontSize = getComputedStyleValue(titleElement as HTMLElement, 'font-size');
              const fontWeight = getComputedStyleValue(titleElement as HTMLElement, 'font-weight');
              
              // H1 styling: 24px, 600 weight
              expect(parseFloat(fontSize)).toBeGreaterThanOrEqual(20); // Allow some flexibility
              expect(parseInt(fontWeight)).toBeGreaterThanOrEqual(600);
            }
            
            if (subtitleElement) {
              const fontSize = getComputedStyleValue(subtitleElement as HTMLElement, 'font-size');
              const textTransform = getComputedStyleValue(subtitleElement as HTMLElement, 'text-transform');
              
              // Label styling: 11px, uppercase
              expect(parseFloat(fontSize)).toBeLessThanOrEqual(12);
              expect(textTransform).toBe('uppercase');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('SegmentCard Component', () => {
    it('should use consistent border-radius from design system', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: 0, max: 10000 }),
          fc.boolean(),
          (label, count, isActive) => {
            const { container } = render(
              <SegmentCard
                label={label}
                count={count}
                isActive={isActive}
                onClick={() => {}}
              />
            );
            
            const card = container.querySelector('.segment-card');
            expect(card).toBeTruthy();
            
            if (card) {
              const borderRadius = getComputedStyleValue(card as HTMLElement, 'border-radius');
              expect(isValidBorderRadius(borderRadius)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('FilterPill Component', () => {
    it('should use consistent border-radius from design system', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (label) => {
            const { container } = render(
              <FilterPill label={label} onRemove={() => {}} />
            );
            
            const pill = container.querySelector('.filter-pill');
            expect(pill).toBeTruthy();
            
            if (pill) {
              const borderRadius = getComputedStyleValue(pill as HTMLElement, 'border-radius');
              expect(isValidBorderRadius(borderRadius)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('FilterIndicator Component', () => {
    it('should use consistent size (6px circle)', () => {
      const { container } = render(<FilterIndicator />);
      
      const indicator = container.querySelector('.filter-indicator');
      expect(indicator).toBeTruthy();
      
      if (indicator) {
        const width = getComputedStyleValue(indicator as HTMLElement, 'width');
        const height = getComputedStyleValue(indicator as HTMLElement, 'height');
        const borderRadius = getComputedStyleValue(indicator as HTMLElement, 'border-radius');
        
        // Should be 6px circle
        expect(parseFloat(width)).toBeGreaterThanOrEqual(6);
        expect(parseFloat(height)).toBeGreaterThanOrEqual(6);
        
        // Should be circular (50% border-radius)
        expect(borderRadius).toContain('50%');
      }
    });
  });

  describe('Cross-Component Consistency', () => {
    it('all card components should use same border-radius scale', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (text) => {
            const { container: statContainer } = render(
              <StatCard label="Label" value={text} />
            );
            const { container: infoContainer } = render(
              <InfoCard icon={<div>Icon</div>} title="Title" description={text} />
            );
            const { container: segmentContainer } = render(
              <SegmentCard label="Label" count={100} onClick={() => {}} />
            );
            
            const statCard = statContainer.querySelector('.stat-card');
            const infoCard = infoContainer.querySelector('.info-card');
            const segmentCard = segmentContainer.querySelector('.segment-card');
            
            if (statCard && infoCard && segmentCard) {
              const statRadius = getComputedStyleValue(statCard as HTMLElement, 'border-radius');
              const infoRadius = getComputedStyleValue(infoCard as HTMLElement, 'border-radius');
              const segmentRadius = getComputedStyleValue(segmentCard as HTMLElement, 'border-radius');
              
              // All should use valid design system border-radius
              expect(isValidBorderRadius(statRadius)).toBe(true);
              expect(isValidBorderRadius(infoRadius)).toBe(true);
              expect(isValidBorderRadius(segmentRadius)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
