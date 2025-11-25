/**
 * Property-Based Tests for MarketingFooter Social Links
 * 
 * Tests that social media links are conditionally displayed based on configuration
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

describe('MarketingFooter Social Links Property Tests', () => {
  /**
   * Property 11: Conditional social links
   * 
   * For any footer render, if social media links are configured in the data,
   * they should be displayed in the footer.
   * 
   * Validates: Requirements 5.3
   * 
   * Feature: site-restructure-multipage, Property 11: Conditional social links
   */
  describe('Property 11: Conditional social links', () => {
    it('should display social links when configured', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(<MarketingFooter />);

            if (navigationConfig.social && navigationConfig.social.length > 0) {
              // Should have social links
              const socialLinks = container.querySelectorAll('a[aria-label*="Visit our"]');
              expect(socialLinks.length).toBe(navigationConfig.social.length);
            }

            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render correct number of social links', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(<MarketingFooter />);

            const socialLinks = container.querySelectorAll('a[aria-label*="Visit our"]');
            const expectedCount = navigationConfig.social?.length || 0;

            expect(socialLinks.length).toBe(expectedCount);

            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include all configured social platforms', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(<MarketingFooter />);

            if (navigationConfig.social && navigationConfig.social.length > 0) {
              navigationConfig.social.forEach((social) => {
                const link = container.querySelector(`a[href="${social.url}"]`);
                expect(link).toBeTruthy();
              });
            }

            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have proper aria-labels for social links', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(<MarketingFooter />);

            if (navigationConfig.social && navigationConfig.social.length > 0) {
              navigationConfig.social.forEach((social) => {
                const link = container.querySelector(`a[href="${social.url}"]`);
                const ariaLabel = link?.getAttribute('aria-label');
                
                expect(ariaLabel).toBeTruthy();
                expect(ariaLabel).toContain(social.platform);
              });
            }

            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should open social links in new tab', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(<MarketingFooter />);

            const socialLinks = container.querySelectorAll('a[aria-label*="Visit our"]');
            
            socialLinks.forEach((link) => {
              expect(link.getAttribute('target')).toBe('_blank');
              expect(link.getAttribute('rel')).toContain('noopener');
              expect(link.getAttribute('rel')).toContain('noreferrer');
            });

            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render social icons with proper accessibility', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(<MarketingFooter />);

            const socialLinks = container.querySelectorAll('a[aria-label*="Visit our"]');
            
            socialLinks.forEach((link) => {
              // Should have icon (svg)
              const icon = link.querySelector('svg');
              expect(icon).toBeTruthy();
              
              // Icon should be hidden from screen readers
              expect(icon?.getAttribute('aria-hidden')).toBe('true');
            });

            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain social links position in footer', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(<MarketingFooter />);

            if (navigationConfig.social && navigationConfig.social.length > 0) {
              // Social links should be in bottom section
              const bottomSection = container.querySelector('footer > div > div:last-child');
              const socialLinks = bottomSection?.querySelectorAll('a[aria-label*="Visit our"]');
              
              expect(socialLinks?.length).toBe(navigationConfig.social.length);
            }

            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have consistent styling for social links', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(<MarketingFooter />);

            const socialLinks = container.querySelectorAll('a[aria-label*="Visit our"]');
            
            socialLinks.forEach((link) => {
              const classes = link.className;
              
              // Should have transition and color classes
              expect(classes).toContain('transition-colors');
              expect(classes).toContain('text-muted-foreground');
            });

            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render social links consistently across renders', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }),
          (renderCount) => {
            const socialCounts: number[] = [];

            for (let i = 0; i < renderCount; i++) {
              const { container, unmount } = render(<MarketingFooter />);

              const socialLinks = container.querySelectorAll('a[aria-label*="Visit our"]');
              socialCounts.push(socialLinks.length);

              unmount();
            }

            // All renders should have same number of social links
            const firstCount = socialCounts[0];
            expect(socialCounts.every(count => count === firstCount)).toBe(true);
            expect(firstCount).toBe(navigationConfig.social?.length || 0);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty social config gracefully', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(<MarketingFooter />);

            // If no social links configured, should not render social section
            if (!navigationConfig.social || navigationConfig.social.length === 0) {
              const socialLinks = container.querySelectorAll('a[aria-label*="Visit our"]');
              expect(socialLinks.length).toBe(0);
            }

            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Social Links Integration
   * 
   * Verifies social links work correctly with footer structure
   */
  describe('Social Links Integration', () => {
    it('should not break footer layout when social links present', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(<MarketingFooter />);

            // Footer should still have all main sections
            const sections = container.querySelectorAll('h3');
            expect(sections.length).toBe(navigationConfig.footer.length);

            // Copyright should still be present
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

    it('should maintain footer structure with or without social links', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(<MarketingFooter />);

            // Footer should always have these elements
            const footer = container.querySelector('footer');
            const grid = container.querySelector('.grid');
            const copyright = Array.from(container.querySelectorAll('p')).find(
              p => p.textContent?.includes('©')
            );

            expect(footer).toBeTruthy();
            expect(grid).toBeTruthy();
            expect(copyright).toBeTruthy();

            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render social links in flex container', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(<MarketingFooter />);

            if (navigationConfig.social && navigationConfig.social.length > 0) {
              // Social links should be in a flex container
              const socialContainer = container.querySelector('div.flex.items-center.gap-4');
              expect(socialContainer).toBeTruthy();
              
              const socialLinks = socialContainer?.querySelectorAll('a[aria-label*="Visit our"]');
              expect(socialLinks?.length).toBe(navigationConfig.social.length);
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
