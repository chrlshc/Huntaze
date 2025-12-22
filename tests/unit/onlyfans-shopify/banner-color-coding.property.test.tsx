/**
 * **Feature: onlyfans-shopify-unification, Property 12: Banner Color Coding**
 * 
 * *For any* ShopifyBanner component, the background color and icon should match the status prop 
 * (success=green, info=blue, warning=yellow, critical=red)
 * 
 * **Validates: Requirements 7.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import { ShopifyBanner } from '@/components/ui/shopify/ShopifyBanner';
import React from 'react';

// Status types
const BANNER_STATUSES = ['info', 'warning', 'success', 'critical'] as const;
type BannerStatus = typeof BANNER_STATUSES[number];

// Color mappings for each status
const STATUS_COLOR_MAP: Record<BannerStatus, { bg: string; border: string; iconColor: string }> = {
  info: {
    bg: 'bg-[#eef6ff]',
    border: 'border-[#b4d5fe]',
    iconColor: 'text-[#2c6ecb]',
  },
  warning: {
    bg: 'bg-[#fff8e6]',
    border: 'border-[#ffd79d]',
    iconColor: 'text-[#b98900]',
  },
  success: {
    bg: 'bg-[#e6f7f2]',
    border: 'border-[#95d5c3]',
    iconColor: 'text-[#008060]',
  },
  critical: {
    bg: 'bg-[#fff4f4]',
    border: 'border-[#fdb5b5]',
    iconColor: 'text-[#d72c0d]',
  },
};

// Arbitrary generators for banner props
const bannerPropsArbitrary = fc.record({
  status: fc.constantFrom(...BANNER_STATUSES),
  title: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  description: fc.option(fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)),
  hasDismiss: fc.boolean(),
});

describe('Property 12: Banner Color Coding', () => {
  it('should have correct background color for each status', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...BANNER_STATUSES),
        (status) => {
          const { container } = render(
            <ShopifyBanner
              status={status}
              title="Test Banner"
            />
          );

          const banner = container.querySelector('[data-testid="shopify-banner"]');
          expect(banner).toBeTruthy();

          if (banner) {
            const expectedBg = STATUS_COLOR_MAP[status].bg;
            expect(banner.classList.contains(expectedBg)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have correct border color for each status', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...BANNER_STATUSES),
        (status) => {
          const { container } = render(
            <ShopifyBanner
              status={status}
              title="Test Banner"
            />
          );

          const banner = container.querySelector('[data-testid="shopify-banner"]');
          expect(banner).toBeTruthy();

          if (banner) {
            const expectedBorder = STATUS_COLOR_MAP[status].border;
            expect(banner.classList.contains(expectedBorder)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have correct icon color for each status', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...BANNER_STATUSES),
        (status) => {
          const { container } = render(
            <ShopifyBanner
              status={status}
              title="Test Banner"
              data-testid="test-banner"
            />
          );

          const icon = container.querySelector('[data-testid="banner-icon"]');
          expect(icon).toBeTruthy();

          if (icon) {
            const expectedIconColor = STATUS_COLOR_MAP[status].iconColor;
            expect(icon.classList.contains(expectedIconColor)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display correct icon for each status', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...BANNER_STATUSES),
        (status) => {
          const { container } = render(
            <ShopifyBanner
              status={status}
              title="Test Banner"
              data-testid="test-banner"
            />
          );

          const icon = container.querySelector('[data-testid="banner-icon"]');
          expect(icon).toBeTruthy();
          
          // Icon should be an SVG
          expect(icon?.tagName.toLowerCase()).toBe('svg');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should render title for all statuses', () => {
    fc.assert(
      fc.property(bannerPropsArbitrary, (props) => {
        const { container } = render(
          <ShopifyBanner
            status={props.status}
            title={props.title}
          />
        );

        const title = container.querySelector('[data-testid="banner-title"]');
        expect(title).toBeTruthy();
        expect(title?.textContent).toBe(props.title);
      }),
      { numRuns: 100 }
    );
  });

  it('should render description when provided', () => {
    fc.assert(
      fc.property(
        fc.record({
          status: fc.constantFrom(...BANNER_STATUSES),
          title: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          description: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        }),
        (props) => {
          const { container } = render(
            <ShopifyBanner
              status={props.status}
              title={props.title}
              description={props.description}
            />
          );

          const description = container.querySelector('[data-testid="banner-description"]');
          expect(description).toBeTruthy();
          expect(description?.textContent).toBe(props.description);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should render dismiss button when onDismiss is provided', () => {
    fc.assert(
      fc.property(
        fc.record({
          status: fc.constantFrom(...BANNER_STATUSES),
          title: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        }),
        (props) => {
          const { container } = render(
            <ShopifyBanner
              status={props.status}
              title={props.title}
              onDismiss={() => {}}
            />
          );

          const dismissButton = container.querySelector('[data-testid="banner-dismiss"]');
          expect(dismissButton).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not render dismiss button when onDismiss is not provided', () => {
    fc.assert(
      fc.property(bannerPropsArbitrary, (props) => {
        const { container } = render(
          <ShopifyBanner
            status={props.status}
            title={props.title}
            data-testid="test-banner"
          />
        );

        const dismissButton = container.querySelector('[data-testid="banner-dismiss"]');
        expect(dismissButton).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it('should have role="alert" for accessibility', () => {
    fc.assert(
      fc.property(bannerPropsArbitrary, (props) => {
        const { container } = render(
          <ShopifyBanner
            status={props.status}
            title={props.title}
          />
        );

        const banner = container.querySelector('[data-testid="shopify-banner"]');
        expect(banner).toBeTruthy();
        
        if (banner) {
          expect(banner.getAttribute('role')).toBe('alert');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should have data-status attribute matching status prop', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...BANNER_STATUSES),
        (status) => {
          const { container } = render(
            <ShopifyBanner
              status={status}
              title="Test Banner"
            />
          );

          const banner = container.querySelector('[data-testid="shopify-banner"]');
          expect(banner).toBeTruthy();
          
          if (banner) {
            expect(banner.getAttribute('data-status')).toBe(status);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain consistent color coding across multiple banners', () => {
    fc.assert(
      fc.property(
        fc.array(bannerPropsArbitrary, { minLength: 2, maxLength: 4 }),
        (bannersProps) => {
          const banners = bannersProps.map((props, idx) => (
            <ShopifyBanner
              key={idx}
              status={props.status}
              title={props.title}
            />
          ));

          const { container } = render(<div>{banners}</div>);

          // Get all banners
          const allBanners = container.querySelectorAll('[data-testid="shopify-banner"]');
          expect(allBanners.length).toBe(bannersProps.length);

          // Each banner should have correct colors for its status
          bannersProps.forEach((props, idx) => {
            const banner = allBanners[idx];
            expect(banner).toBeTruthy();
            
            if (banner) {
              const expectedColors = STATUS_COLOR_MAP[props.status];
              expect(banner.classList.contains(expectedColors.bg)).toBe(true);
              expect(banner.classList.contains(expectedColors.border)).toBe(true);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have consistent styling structure for all statuses', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...BANNER_STATUSES),
        (status) => {
          const { container } = render(
            <ShopifyBanner
              status={status}
              title="Test Banner"
            />
          );

          const banner = container.querySelector('[data-testid="shopify-banner"]');
          expect(banner).toBeTruthy();
          
          if (banner) {
            // Should have border
            expect(banner.classList.contains('border')).toBe(true);
            // Should have rounded corners
            expect(banner.classList.contains('rounded-lg')).toBe(true);
            // Should have padding
            expect(banner.classList.contains('p-4')).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
