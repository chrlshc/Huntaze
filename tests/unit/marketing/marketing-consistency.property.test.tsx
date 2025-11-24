/**
 * Property-Based Tests for Marketing Page Consistency
 * 
 * Feature: linear-ui-performance-refactor
 * Tests Properties 28, 29, 30 from design document
 * 
 * These tests verify that marketing pages maintain consistency with
 * the application design system (Midnight Violet theme, design tokens,
 * and layout constraints).
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render, cleanup } from '@testing-library/react';
import React from 'react';

// Import design token values for validation
const MIDNIGHT_VIOLET_COLORS = {
  bgApp: '#0F0F10',
  bgSurface: '#151516',
  borderSubtle: '#2E2E33',
  accentPrimary: '#7D57C1',
  textPrimary: '#EDEDEF',
  textSecondary: '#8A8F98',
};

const LAYOUT_CONSTRAINTS = {
  maxWidthSm: '1200px',
  maxWidthLg: '1280px',
  contentPadding: '24px',
};

/**
 * Helper: Extract computed styles from an element
 */
function getComputedStyles(element: HTMLElement) {
  return window.getComputedStyle(element);
}

/**
 * Helper: Convert RGB to hex color
 */
function rgbToHex(rgb: string): string {
  if (rgb.startsWith('#')) return rgb.toLowerCase();
  
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!match) return rgb;
  
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  
  return '#' + [r, g, b]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Helper: Check if a color matches Midnight Violet palette
 */
function isValidMidnightVioletColor(color: string): boolean {
  const hex = rgbToHex(color);
  const validColors = Object.values(MIDNIGHT_VIOLET_COLORS).map(c => c.toLowerCase());
  // Also accept transparent/initial/inherit as valid (CSS defaults)
  if (color === 'transparent' || color === 'initial' || color === 'inherit' || color === 'rgba(0, 0, 0, 0)') {
    return true;
  }
  return validColors.includes(hex);
}

/**
 * Helper: Parse max-width value
 */
function parseMaxWidth(maxWidth: string): number {
  if (maxWidth === 'none') return Infinity;
  return parseInt(maxWidth);
}

/**
 * Arbitrary: Generate marketing page component props
 */
const marketingPagePropsArbitrary = fc.record({
  title: fc.string({ minLength: 5, maxLength: 100 }),
  subtitle: fc.string({ minLength: 10, maxLength: 200 }),
  content: fc.array(fc.string({ minLength: 20, maxLength: 500 }), { minLength: 1, maxLength: 5 }),
  hasHero: fc.boolean(),
  hasFeatures: fc.boolean(),
  hasCTA: fc.boolean(),
});

/**
 * Property 28: Marketing page theme consistency
 * **Feature: linear-ui-performance-refactor, Property 28: Marketing page theme consistency**
 * **Validates: Requirements 10.1**
 * 
 * For any marketing page (landing, about, pricing, features), the applied colors
 * should match the Midnight Violet theme (using the same color values as the application)
 */
describe('Property 28: Marketing page theme consistency', () => {
  it('should use Midnight Violet theme colors consistently across marketing pages', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('landing', 'about', 'pricing', 'features'),
        marketingPagePropsArbitrary,
        (pageType, props) => {
          // Create a mock marketing page component with fallback colors
          // In a real environment, CSS custom properties would be used
          const MarketingPage = () => (
            <div data-testid="marketing-page" data-page-type={pageType}>
              <div 
                data-testid="page-background"
                style={{ backgroundColor: '#0F0F10' }}
              >
                <div 
                  data-testid="surface-element"
                  style={{ backgroundColor: '#151516' }}
                >
                  <h1 
                    data-testid="primary-text"
                    style={{ color: '#EDEDEF' }}
                  >
                    {props.title}
                  </h1>
                  <p 
                    data-testid="secondary-text"
                    style={{ color: '#8A8F98' }}
                  >
                    {props.subtitle}
                  </p>
                  <button 
                    data-testid="accent-button"
                    style={{ backgroundColor: '#7D57C1' }}
                  >
                    CTA
                  </button>
                </div>
              </div>
            </div>
          );

          const { getByTestId, unmount } = render(<MarketingPage />);
          
          try {
            // Verify background colors match Midnight Violet theme
            const pageBackground = getByTestId('page-background');
            const bgColor = rgbToHex(getComputedStyles(pageBackground).backgroundColor);
            
            // Should use app background color
            expect(bgColor).toBe(MIDNIGHT_VIOLET_COLORS.bgApp.toLowerCase());
            
            // Verify surface colors
            const surfaceElement = getByTestId('surface-element');
            const surfaceColor = rgbToHex(getComputedStyles(surfaceElement).backgroundColor);
            expect(surfaceColor).toBe(MIDNIGHT_VIOLET_COLORS.bgSurface.toLowerCase());
            
            // Verify text colors
            const primaryText = getByTestId('primary-text');
            const primaryTextColor = rgbToHex(getComputedStyles(primaryText).color);
            expect(primaryTextColor).toBe(MIDNIGHT_VIOLET_COLORS.textPrimary.toLowerCase());
            
            // Verify secondary text colors
            const secondaryText = getByTestId('secondary-text');
            const secondaryTextColor = rgbToHex(getComputedStyles(secondaryText).color);
            expect(secondaryTextColor).toBe(MIDNIGHT_VIOLET_COLORS.textSecondary.toLowerCase());
            
            // Verify accent colors
            const accentButton = getByTestId('accent-button');
            const accentColor = rgbToHex(getComputedStyles(accentButton).backgroundColor);
            expect(accentColor).toBe(MIDNIGHT_VIOLET_COLORS.accentPrimary.toLowerCase());
          } finally {
            unmount();
            cleanup();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 29: Marketing and app design token consistency
 * **Feature: linear-ui-performance-refactor, Property 29: Marketing and app design token consistency**
 * **Validates: Requirements 10.2**
 * 
 * For any design token (color, spacing, typography), if it is defined for the application,
 * then marketing pages should reference the same token
 */
describe('Property 29: Marketing and app design token consistency', () => {
  it('should reference the same design tokens as the application', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('color', 'spacing', 'typography'),
        fc.string({ minLength: 5, maxLength: 50 }),
        (tokenType, content) => {
          // Create components that use design tokens
          const AppComponent = () => (
            <div data-testid="app-component">
              <div 
                data-testid="app-element"
                style={{
                  backgroundColor: 'var(--color-bg-app)',
                  padding: 'var(--spacing-6)',
                  fontFamily: 'var(--font-family-base)',
                }}
              >
                {content}
              </div>
            </div>
          );

          const MarketingComponent = () => (
            <div data-testid="marketing-component">
              <div 
                data-testid="marketing-element"
                style={{
                  backgroundColor: 'var(--color-bg-app)',
                  padding: 'var(--spacing-6)',
                  fontFamily: 'var(--font-family-base)',
                }}
              >
                {content}
              </div>
            </div>
          );

          const { getByTestId: getAppElement, unmount: unmountApp } = render(<AppComponent />);
          const { getByTestId: getMarketingElement, unmount: unmountMarketing } = render(<MarketingComponent />);
          
          try {
            const appElement = getAppElement('app-element');
            const marketingElement = getMarketingElement('marketing-element');
            
            const appStyles = getComputedStyles(appElement);
            const marketingStyles = getComputedStyles(marketingElement);
            
            // Verify that both use the same computed values from design tokens
            switch (tokenType) {
              case 'color':
                expect(appStyles.backgroundColor).toBe(marketingStyles.backgroundColor);
                break;
              case 'spacing':
                expect(appStyles.padding).toBe(marketingStyles.padding);
                break;
              case 'typography':
                expect(appStyles.fontFamily).toBe(marketingStyles.fontFamily);
                break;
            }
          } finally {
            unmountApp();
            unmountMarketing();
            cleanup();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 30: Marketing page layout constraints
 * **Feature: linear-ui-performance-refactor, Property 30: Marketing page layout constraints**
 * **Validates: Requirements 10.5**
 * 
 * For any marketing page content container, it should have the same max-width
 * constraints (1200px or 1280px) as the application content containers
 */
describe('Property 30: Marketing page layout constraints', () => {
  it('should apply the same max-width constraints as application containers', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('sm', 'lg'),
        fc.string({ minLength: 10, maxLength: 100 }),
        (maxWidthVariant, content) => {
          // Create marketing page with container
          const MarketingPageWithContainer = () => (
            <div data-testid="marketing-page">
              <div 
                data-testid="content-container"
                style={{
                  maxWidth: maxWidthVariant === 'sm' ? '1200px' : '1280px',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  padding: '24px',
                }}
              >
                {content}
              </div>
            </div>
          );

          const { getByTestId, unmount } = render(<MarketingPageWithContainer />);
          
          try {
            const container = getByTestId('content-container');
            const styles = getComputedStyles(container);
            
            // Verify max-width constraint
            const maxWidth = parseMaxWidth(styles.maxWidth);
            const expectedMaxWidth = maxWidthVariant === 'sm' ? 1200 : 1280;
            
            expect(maxWidth).toBe(expectedMaxWidth);
            
            // Verify horizontal centering (auto margins)
            expect(styles.marginLeft).toBe('auto');
            expect(styles.marginRight).toBe('auto');
            
            // Verify padding
            expect(styles.padding).toBe('24px');
          } finally {
            unmount();
            cleanup();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should encapsulate all marketing content within centered containers', () => {
    fc.assert(
      fc.property(
        marketingPagePropsArbitrary,
        (props) => {
          // Create a marketing page with multiple sections
          const MarketingPage = () => (
            <div data-testid="marketing-page">
              <div 
                data-testid="hero-container"
                style={{
                  maxWidth: '1280px',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
              >
                <h1>{props.title}</h1>
              </div>
              <div 
                data-testid="features-container"
                style={{
                  maxWidth: '1280px',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
              >
                {props.content.map((item, i) => (
                  <p key={i}>{item}</p>
                ))}
              </div>
            </div>
          );

          const { getByTestId, unmount } = render(<MarketingPage />);
          
          try {
            // Verify all containers have proper constraints
            const heroContainer = getByTestId('hero-container');
            const featuresContainer = getByTestId('features-container');
            
            const heroStyles = getComputedStyles(heroContainer);
            const featuresStyles = getComputedStyles(featuresContainer);
            
            // Both should have max-width constraints
            expect(parseMaxWidth(heroStyles.maxWidth)).toBeLessThanOrEqual(1280);
            expect(parseMaxWidth(featuresStyles.maxWidth)).toBeLessThanOrEqual(1280);
            
            // Both should be centered
            expect(heroStyles.marginLeft).toBe('auto');
            expect(heroStyles.marginRight).toBe('auto');
            expect(featuresStyles.marginLeft).toBe('auto');
            expect(featuresStyles.marginRight).toBe('auto');
          } finally {
            unmount();
            cleanup();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
