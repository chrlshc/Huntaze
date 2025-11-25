/**
 * Property-Based Tests for Pricing Tier CTA Buttons
 * 
 * Tests universal properties that should hold for pricing tier CTA buttons
 * using fast-check for property-based testing.
 * 
 * Feature: site-restructure-multipage
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import React from 'react';
import { PricingCard, PricingTier } from '@/components/pricing/PricingCard';

describe('Pricing Tier CTA Property Tests', () => {
  /**
   * Property 9: Pricing tier CTA buttons
   * 
   * For any pricing tier displayed, it should include a call-to-action button
   * with appropriate text based on product state (beta vs. production).
   * 
   * Validates: Requirements 4.3, 4.4
   * 
   * Feature: site-restructure-multipage, Property 9: Pricing tier CTA buttons
   */
  describe('Property 9: Pricing tier CTA buttons', () => {
    // Generator for pricing tier data
    const pricingTierArbitrary = fc.record({
      id: fc.string({ minLength: 3, maxLength: 20 }),
      name: fc.constantFrom('Starter', 'Professional', 'Enterprise', 'Basic', 'Premium'),
      price: fc.oneof(
        fc.integer({ min: 0, max: 999 }),
        fc.constant('custom' as const)
      ),
      period: fc.constantFrom('month' as const, 'year' as const),
      description: fc.string({ minLength: 10, maxLength: 100 }),
      features: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
      cta: fc.record({
        text: fc.constantFrom('Get Started', 'Sign Up', 'Contact Sales', 'Try Free'),
        href: fc.constantFrom('/auth/login', '/contact', '/signup')
      }),
      highlighted: fc.boolean(),
      isBeta: fc.boolean()
    });

    it('should always render a CTA button for any pricing tier', () => {
      fc.assert(
        fc.property(
          pricingTierArbitrary,
          (tier) => {
            const { container } = render(<PricingCard tier={tier} />);

            // Should have exactly one CTA link/button
            const ctaLink = container.querySelector('a[href]');
            expect(ctaLink).toBeTruthy();
            
            // CTA should have href attribute
            expect(ctaLink?.getAttribute('href')).toBeTruthy();
            
            // CTA should have text content
            expect(ctaLink?.textContent).toBeTruthy();
            expect(ctaLink?.textContent?.trim().length).toBeGreaterThan(0);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display "Request Access" CTA text when isBeta is true', () => {
      fc.assert(
        fc.property(
          pricingTierArbitrary.map(tier => ({ ...tier, isBeta: true })),
          (tier) => {
            const { container } = render(<PricingCard tier={tier} />);

            const ctaLink = container.querySelector('a[href]');
            expect(ctaLink).toBeTruthy();
            
            // When in beta, CTA should say "Request Access"
            expect(ctaLink?.textContent).toBe('Request Access');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display configured CTA text when isBeta is false', () => {
      fc.assert(
        fc.property(
          pricingTierArbitrary.map(tier => ({ ...tier, isBeta: false })),
          (tier) => {
            const { container } = render(<PricingCard tier={tier} />);

            const ctaLink = container.querySelector('a[href]');
            expect(ctaLink).toBeTruthy();
            
            // When not in beta, CTA should use configured text
            expect(ctaLink?.textContent).toBe(tier.cta.text);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always link to the configured href', () => {
      fc.assert(
        fc.property(
          pricingTierArbitrary,
          (tier) => {
            const { container } = render(<PricingCard tier={tier} />);

            const ctaLink = container.querySelector('a[href]');
            expect(ctaLink).toBeTruthy();
            
            // CTA should link to configured href
            expect(ctaLink?.getAttribute('href')).toBe(tier.cta.href);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have appropriate styling classes for CTA button', () => {
      fc.assert(
        fc.property(
          pricingTierArbitrary,
          (tier) => {
            const { container } = render(<PricingCard tier={tier} />);

            const ctaLink = container.querySelector('a[href]');
            expect(ctaLink).toBeTruthy();
            
            const classes = ctaLink?.className || '';
            
            // Should have button-like styling
            expect(classes).toContain('rounded-lg');
            expect(classes).toContain('px-6');
            expect(classes).toContain('py-3');
            expect(classes).toContain('text-center');
            expect(classes).toContain('font-semibold');
            
            // Should have hover state
            expect(classes).toMatch(/hover:/);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display "Free during beta" message when isBeta is true and price is not custom', () => {
      fc.assert(
        fc.property(
          pricingTierArbitrary
            .filter(tier => tier.price !== 'custom')
            .map(tier => ({ ...tier, isBeta: true })),
          (tier) => {
            const { container } = render(<PricingCard tier={tier} />);

            // Should show €0 price
            expect(container.textContent).toContain('€0');
            
            // Should show beta message
            expect(container.textContent).toMatch(/free during beta/i);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display actual price when isBeta is false and price is numeric', () => {
      fc.assert(
        fc.property(
          pricingTierArbitrary
            .filter(tier => typeof tier.price === 'number')
            .map(tier => ({ ...tier, isBeta: false })),
          (tier) => {
            const { container } = render(<PricingCard tier={tier} />);

            // Should show actual price
            expect(container.textContent).toContain(`€${tier.price}`);
            
            // Should NOT show beta message
            expect(container.textContent).not.toMatch(/free during beta/i);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display "Custom" for custom pricing tiers', () => {
      fc.assert(
        fc.property(
          pricingTierArbitrary.map(tier => ({ ...tier, price: 'custom' as const })),
          (tier) => {
            const { container } = render(<PricingCard tier={tier} />);

            // Should show "Custom" text
            expect(container.textContent).toContain('Custom');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render all features in a list', () => {
      fc.assert(
        fc.property(
          pricingTierArbitrary,
          (tier) => {
            const { container } = render(<PricingCard tier={tier} />);

            // Should have a list of features
            const featureItems = container.querySelectorAll('li');
            expect(featureItems.length).toBe(tier.features.length);
            
            // Each feature should be displayed
            tier.features.forEach(feature => {
              expect(container.textContent).toContain(feature);
            });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show "Recommended" badge only when highlighted is true', () => {
      fc.assert(
        fc.property(
          pricingTierArbitrary,
          (tier) => {
            const { container } = render(<PricingCard tier={tier} />);

            const hasRecommendedBadge = container.textContent?.includes('Recommended');
            
            // Badge should only appear when highlighted
            expect(hasRecommendedBadge).toBe(tier.highlighted === true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should apply highlighted styling when highlighted is true', () => {
      fc.assert(
        fc.property(
          pricingTierArbitrary.map(tier => ({ ...tier, highlighted: true })),
          (tier) => {
            const { container } = render(<PricingCard tier={tier} />);

            const card = container.querySelector('div');
            expect(card).toBeTruthy();
            
            const classes = card?.className || '';
            
            // Should have highlighted border color
            expect(classes).toContain('border-purple-500');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have consistent CTA behavior across beta and production states', () => {
      fc.assert(
        fc.property(
          pricingTierArbitrary,
          fc.boolean(),
          (baseTier, isBeta) => {
            const tier = { ...baseTier, isBeta };
            const { container } = render(<PricingCard tier={tier} />);

            const ctaLink = container.querySelector('a[href]');
            expect(ctaLink).toBeTruthy();
            
            // CTA should always be clickable
            expect(ctaLink?.getAttribute('href')).toBeTruthy();
            
            // CTA should always have text
            expect(ctaLink?.textContent?.trim().length).toBeGreaterThan(0);
            
            // CTA text should be appropriate for state
            const expectedText = isBeta ? 'Request Access' : tier.cta.text;
            expect(ctaLink?.textContent).toBe(expectedText);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Combined Properties Test
   * 
   * Verifies that all pricing tier properties work together correctly
   */
  describe('Combined Pricing Tier Properties', () => {
    it('should satisfy all pricing tier properties simultaneously', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 3, maxLength: 20 }),
            name: fc.constantFrom('Starter', 'Professional', 'Enterprise'),
            price: fc.oneof(fc.integer({ min: 10, max: 500 }), fc.constant('custom' as const)),
            period: fc.constantFrom('month' as const, 'year' as const),
            description: fc.string({ minLength: 20, maxLength: 100 }),
            features: fc.array(fc.string({ minLength: 10, maxLength: 50 }), { minLength: 3, maxLength: 8 }),
            cta: fc.record({
              text: fc.constantFrom('Get Started', 'Contact Sales'),
              href: fc.constantFrom('/auth/login', '/contact')
            }),
            highlighted: fc.boolean(),
            isBeta: fc.boolean()
          }),
          (tier) => {
            const { container } = render(<PricingCard tier={tier} />);

            // Should render card
            const card = container.querySelector('div');
            expect(card).toBeTruthy();
            
            // Should have tier name
            expect(container.textContent).toContain(tier.name);
            
            // Should have description
            expect(container.textContent).toContain(tier.description);
            
            // Should have CTA
            const ctaLink = container.querySelector('a[href]');
            expect(ctaLink).toBeTruthy();
            expect(ctaLink?.getAttribute('href')).toBe(tier.cta.href);
            
            // CTA text should match beta state
            const expectedCtaText = tier.isBeta ? 'Request Access' : tier.cta.text;
            expect(ctaLink?.textContent).toBe(expectedCtaText);
            
            // Should have all features
            const featureItems = container.querySelectorAll('li');
            expect(featureItems.length).toBe(tier.features.length);
            
            // Should show recommended badge only if highlighted
            const hasRecommendedBadge = container.textContent?.includes('Recommended');
            expect(hasRecommendedBadge).toBe(tier.highlighted === true);
            
            // Price display should match beta state and price type
            if (tier.price === 'custom') {
              expect(container.textContent).toContain('Custom');
            } else if (tier.isBeta) {
              expect(container.textContent).toContain('€0');
              expect(container.textContent).toMatch(/free during beta/i);
            } else {
              expect(container.textContent).toContain(`€${tier.price}`);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
