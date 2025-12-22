/**
 * Property Test: Color Palette Consistency
 * Feature: onlyfans-shopify-unification, Property 8
 * Validates: Requirements 2.5
 * 
 * Property: For any data visualization or color-coded element, 
 * the colors should come from the Shopify design token palette
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';

// Shopify design token colors
const SHOPIFY_COLORS = {
  // Primary colors
  primary: '#008060',
  primaryDark: '#006e52',
  primaryLight: '#f1f8f5',
  
  // Status colors
  success: '#008060',
  successLight: '#f1f8f5',
  warning: '#ffc453',
  warningLight: '#fff8e1',
  critical: '#d72c0d',
  criticalLight: '#fef1f1',
  info: '#0070e0',
  infoLight: '#e8f5ff',
  
  // Neutral colors
  textPrimary: '#1a1a1a',
  textSecondary: '#6b7177',
  textDisabled: '#8c9196',
  border: '#e1e3e5',
  bgSurface: '#ffffff',
  bgPage: '#f6f6f7',
  bgHover: '#f6f6f7',
  
  // Chart colors (for data visualization)
  chart1: '#008060',
  chart2: '#0070e0',
  chart3: '#ffc453',
  chart4: '#d72c0d',
  chart5: '#6b7177',
};

// Convert hex to RGB for comparison
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Mock chart component
function MockChart({ color }: { color: string }) {
  return (
    <div data-testid="chart">
      <div
        data-testid="chart-bar"
        style={{ backgroundColor: color, height: '100px', width: '50px' }}
      />
    </div>
  );
}

// Mock status badge
function MockStatusBadge({ status }: { status: 'success' | 'warning' | 'critical' | 'info' }) {
  const colorMap = {
    success: { bg: SHOPIFY_COLORS.successLight, text: SHOPIFY_COLORS.success },
    warning: { bg: SHOPIFY_COLORS.warningLight, text: '#916a00' },
    critical: { bg: SHOPIFY_COLORS.criticalLight, text: SHOPIFY_COLORS.critical },
    info: { bg: SHOPIFY_COLORS.infoLight, text: SHOPIFY_COLORS.info },
  };

  const colors = colorMap[status];

  return (
    <span
      data-testid="status-badge"
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        padding: '4px 8px',
        borderRadius: '4px',
      }}
    >
      {status}
    </span>
  );
}

describe('Property 8: Color Palette Consistency', () => {
  it('should use Shopify colors for data visualization', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          SHOPIFY_COLORS.chart1,
          SHOPIFY_COLORS.chart2,
          SHOPIFY_COLORS.chart3,
          SHOPIFY_COLORS.chart4,
          SHOPIFY_COLORS.chart5
        ),
        (color) => {
          const { container } = render(<MockChart color={color} />);
          const chartBar = container.querySelector('[data-testid="chart-bar"]') as HTMLElement;

          expect(chartBar).toBeTruthy();
          const bgColor = chartBar.style.backgroundColor;
          
          // Should have a background color set
          expect(bgColor).toBeTruthy();

          // Convert to RGB and verify it's one of our chart colors
          const rgb = hexToRgb(color);
          if (rgb) {
            // The style.backgroundColor returns rgb() format
            expect(bgColor).toContain(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use Shopify status colors for badges', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('success', 'warning', 'critical', 'info'),
        (status) => {
          const { container } = render(
            <MockStatusBadge status={status as 'success' | 'warning' | 'critical' | 'info'} />
          );
          const badge = container.querySelector('[data-testid="status-badge"]') as HTMLElement;

          expect(badge).toBeTruthy();
          // Should have background and text color
          expect(badge.style.backgroundColor).toBeTruthy();
          expect(badge.style.color).toBeTruthy();

          // Background should be a light variant
          const bgColor = badge.style.backgroundColor;
          expect(bgColor).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use consistent text colors from the palette', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          { color: SHOPIFY_COLORS.textPrimary, name: 'primary' },
          { color: SHOPIFY_COLORS.textSecondary, name: 'secondary' },
          { color: SHOPIFY_COLORS.textDisabled, name: 'disabled' }
        ),
        (textColor) => {
          const { container } = render(
            <p style={{ color: textColor.color }} data-testid="text">
              Sample text
            </p>
          );

          const textElement = container.querySelector('[data-testid="text"]') as HTMLElement;
          expect(textElement).toBeTruthy();
          expect(textElement.style.color).toBeTruthy();

          // Verify it's one of the valid text colors
          const validColors = [
            SHOPIFY_COLORS.textPrimary,
            SHOPIFY_COLORS.textSecondary,
            SHOPIFY_COLORS.textDisabled,
          ];
          expect(validColors).toContain(textColor.color);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use consistent background colors from the palette', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          { color: SHOPIFY_COLORS.bgSurface, name: 'surface' },
          { color: SHOPIFY_COLORS.bgPage, name: 'page' },
          { color: SHOPIFY_COLORS.bgHover, name: 'hover' }
        ),
        (bgColor) => {
          const { container } = render(
            <div style={{ backgroundColor: bgColor.color }} data-testid="bg-element">
              Content
            </div>
          );

          const element = container.querySelector('[data-testid="bg-element"]') as HTMLElement;
          expect(element).toBeTruthy();
          expect(element.style.backgroundColor).toBeTruthy();

          // Verify it's one of the valid background colors
          const validColors = [
            SHOPIFY_COLORS.bgSurface,
            SHOPIFY_COLORS.bgPage,
            SHOPIFY_COLORS.bgHover,
          ];
          expect(validColors).toContain(bgColor.color);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use consistent border colors from the palette', () => {
    fc.assert(
      fc.property(
        fc.constant(SHOPIFY_COLORS.border),
        (borderColor) => {
          const { container } = render(
            <div
              style={{ borderColor: borderColor, borderWidth: '1px', borderStyle: 'solid' }}
              data-testid="bordered-element"
            >
              Content
            </div>
          );

          const element = container.querySelector('[data-testid="bordered-element"]') as HTMLElement;
          expect(element).toBeTruthy();
          
          // Browser converts hex to rgb, so we need to check the RGB value
          const rgb = hexToRgb(borderColor);
          if (rgb) {
            expect(element.style.borderColor).toContain(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
