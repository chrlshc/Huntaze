/**
 * Property-Based Tests for MarketingFooter Consistency
 * 
 * Tests that the footer maintains consistent styling across all pages
 * using fast-check for property-based testing.
 * 
 * Feature: site-restructure-multipage
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import React from 'react';
import { MarketingFooter } from '@/components/layout/MarketingFooter';
import { navigationConfig } from '@/config/navigation';

describe('MarketingFooter Consistency Property Tests', () => {
  /**
   * Property 12: Footer styling consistency
   * 
   * For any two marketing pages, the footer component should have identical
   * styling and structure.
   * 
   * Validates: Requirements 5.5
   * 
   * Feature: site-restructure-multipage, Property 12: Footer styling consistency
   */
  describe('Property 12: Footer styling consistency', () => {
    it('should render footer element consistently', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(<MarketingFooter />);

            // Should render a footer element
            const footer = container.querySelector('footer');
            expect(footer).toBeTruthy();
            expect(footer?.tagName).toBe('FOOTER');

            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have consistent structure across renders', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }),
          (renderCount) => {
            const structures: string[] = [];

            for (let i = 0; i < renderCount; i++) {
              const { container, unmount } = render(<MarketingFooter />);

              const footer = container.querySelector('footer');
              const sections = container.querySelectorAll('footer > div > div > div');
              const copyright = container.querySelector('footer p');
              const socialLinks = container.querySelectorAll('footer a[aria-label*="Visit"]');

              const structure = `footer:${!!footer},sections:${sections.length},copyright:${!!copyright},social:${socialLinks.length}`;
              structures.push(structure);

              unmount();
            }

            // All structures should be identical
            const firstStructure = structures[0];
            expect(structures.every(s => s === firstStructure)).toBe(true);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render all footer sections from config', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(<MarketingFooter />);

            // Should have all sections from config
            navigationConfig.footer.forEach((section) => {
              const headings = Array.from(container.querySelectorAll('h3'));
              const hasSection = headings.some(h => h.textContent === section.title);
              expect(hasSection).toBe(true);
            });

            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have consistent styling classes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(<MarketingFooter />);

            const footer = container.querySelector('footer');
            const classes = footer?.className || '';

            // Should have border and background
            expect(classes).toContain('border-t');
            expect(classes).toContain('bg-background');

            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain styling with custom className', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 30 }).filter(s => !s.includes(' ')),
          (customClass) => {
            const { container, unmount } = render(<MarketingFooter className={customClass} />);

            const footer = container.querySelector('footer');
            const classes = footer?.className || '';

            // Should have both default and custom classes
            expect(classes).toContain('border-t');
            expect(classes).toContain('bg-background');
            expect(classes).toContain(customClass);

            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have copyright notice', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(<MarketingFooter />);

            // Should have copyright text
            const copyright = Array.from(container.querySelectorAll('p')).find(
              p => p.textContent?.includes('©') && p.textContent?.includes('Huntaze')
            );
            expect(copyright).toBeTruthy();

            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display current year in copyright', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(<MarketingFooter />);

            const currentYear = new Date().getFullYear().toString();
            const copyright = Array.from(container.querySelectorAll('p')).find(
              p => p.textContent?.includes('©')
            );

            expect(copyright?.textContent).toContain(currentYear);

            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have consistent grid layout', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(<MarketingFooter />);

            // Should have grid layout
            const grid = container.querySelector('.grid');
            expect(grid).toBeTruthy();

            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render all links from config', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(<MarketingFooter />);

            // Count total links in config
            const totalLinks = navigationConfig.footer.reduce(
              (sum, section) => sum + section.links.length,
              0
            );

            // Should have at least that many links (excluding social)
            const footerLinks = container.querySelectorAll('footer a:not([aria-label*="Visit"])');
            expect(footerLinks.length).toBeGreaterThanOrEqual(totalLinks);

            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain structure with or without custom className', () => {
      fc.assert(
        fc.property(
          fc.option(fc.string({ minLength: 5, maxLength: 30 }).filter(s => !s.includes(' ')), { nil: undefined }),
          (customClass) => {
            const { container, unmount } = render(<MarketingFooter className={customClass} />);

            // Should always have footer
            const footer = container.querySelector('footer');
            expect(footer).toBeTruthy();

            // Should always have sections
            const sections = container.querySelectorAll('h3');
            expect(sections.length).toBe(navigationConfig.footer.length);

            // Should always have copyright
            const copyright = Array.from(container.querySelectorAll('p')).find(
              p => p.textContent?.includes('©')
            );
            expect(copyright).toBeTruthy();

            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Footer Content Consistency
   * 
   * Verifies that footer content matches configuration
   */
  describe('Footer Content Consistency', () => {
    it('should have divider between sections and bottom', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(<MarketingFooter />);

            // Should have divider
            const dividers = container.querySelectorAll('.border-t');
            expect(dividers.length).toBeGreaterThan(1); // Footer border + divider

            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have consistent link styling', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(<MarketingFooter />);

            const links = container.querySelectorAll('footer a');
            
            // All links should have transition classes
            links.forEach((link) => {
              const classes = link.className;
              expect(classes).toContain('transition-colors');
            });

            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render external links with proper attributes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(<MarketingFooter />);

            // Find external links from config
            const externalLinks = navigationConfig.footer
              .flatMap(section => section.links)
              .filter(link => link.external);

            if (externalLinks.length > 0) {
              externalLinks.forEach((configLink) => {
                const link = container.querySelector(`a[href="${configLink.href}"]`);
                if (link) {
                  expect(link.getAttribute('target')).toBe('_blank');
                  expect(link.getAttribute('rel')).toContain('noopener');
                }
              });
            }

            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
