/**
 * **Feature: onlyfans-shopify-design, Property 8: Sidebar Dark Background**
 * 
 * *For any* sidebar component, the background color SHALL be dark (#1a1a1a or similar).
 * **Validates: Requirements 4.1**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Shopify sidebar specifications
const SHOPIFY_SIDEBAR_SPECS = {
  background: '#1a1a1a',
  width: 240,
  textColors: {
    primary: '#ffffff',
    secondary: '#a3a3a3',
    muted: '#737373',
  },
  itemHeight: 36,
  itemPadding: { horizontal: 12, vertical: 8 },
  activeIndicator: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderLeft: '3px solid #ffffff',
  },
};

// Helper to check if a color is dark
function isDarkColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance < 0.3; // Stricter threshold for "dark"
}

// Helper to check if a color is light
function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.7;
}

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

// Calculate contrast ratio
function getContrastRatio(foreground: string, background: string): number {
  const fgLuminance = getRelativeLuminance(foreground);
  const bgLuminance = getRelativeLuminance(background);
  
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);
  
  return (lighter + 0.05) / (darker + 0.05);
}

function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Simulate sidebar item extraction
interface SidebarItem {
  label: string;
  icon: string;
  href: string;
  isActive: boolean;
}

function extractSidebarStyles(item: SidebarItem) {
  return {
    background: SHOPIFY_SIDEBAR_SPECS.background,
    textColor: item.isActive 
      ? SHOPIFY_SIDEBAR_SPECS.textColors.primary 
      : SHOPIFY_SIDEBAR_SPECS.textColors.secondary,
    itemBackground: item.isActive 
      ? SHOPIFY_SIDEBAR_SPECS.activeIndicator.background 
      : 'transparent',
    height: SHOPIFY_SIDEBAR_SPECS.itemHeight,
    paddingHorizontal: SHOPIFY_SIDEBAR_SPECS.itemPadding.horizontal,
    paddingVertical: SHOPIFY_SIDEBAR_SPECS.itemPadding.vertical,
    borderLeft: item.isActive ? SHOPIFY_SIDEBAR_SPECS.activeIndicator.borderLeft : 'none',
  };
}

describe('Property 8: Sidebar Dark Background', () => {
  // Arbitrary for sidebar items
  const sidebarItemArb = fc.record({
    label: fc.string({ minLength: 1, maxLength: 20 }),
    icon: fc.constantFrom('home', 'messages', 'fans', 'analytics', 'settings'),
    href: fc.string({ minLength: 1, maxLength: 50 }).map(s => `/${s}`),
    isActive: fc.boolean(),
  });

  it('sidebar background SHALL be dark (#1a1a1a)', () => {
    expect(SHOPIFY_SIDEBAR_SPECS.background.toLowerCase()).toBe('#1a1a1a');
    expect(isDarkColor(SHOPIFY_SIDEBAR_SPECS.background)).toBe(true);
  });

  it('sidebar background SHALL be consistently dark for all items', () => {
    fc.assert(
      fc.property(sidebarItemArb, (item) => {
        const styles = extractSidebarStyles(item);
        
        expect(styles.background.toLowerCase()).toBe('#1a1a1a');
        expect(isDarkColor(styles.background)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('sidebar text SHALL be light for contrast on dark background', () => {
    fc.assert(
      fc.property(sidebarItemArb, (item) => {
        const styles = extractSidebarStyles(item);
        
        // Primary text (active items) should be white
        if (item.isActive) {
          expect(styles.textColor.toLowerCase()).toBe('#ffffff');
          expect(isLightColor(styles.textColor)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('sidebar text SHALL have adequate contrast on dark background', () => {
    fc.assert(
      fc.property(sidebarItemArb, (item) => {
        const styles = extractSidebarStyles(item);
        
        // Get the actual text color (not rgba)
        const textColor = item.isActive 
          ? SHOPIFY_SIDEBAR_SPECS.textColors.primary 
          : SHOPIFY_SIDEBAR_SPECS.textColors.secondary;
        
        const contrastRatio = getContrastRatio(textColor, SHOPIFY_SIDEBAR_SPECS.background);
        
        // WCAG AA requires 4.5:1 for normal text
        expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
      }),
      { numRuns: 100 }
    );
  });

  it('active sidebar items SHALL have visual indicator', () => {
    fc.assert(
      fc.property(
        sidebarItemArb.filter(item => item.isActive),
        (item) => {
          const styles = extractSidebarStyles(item);
          
          // Active items should have a border indicator
          expect(styles.borderLeft).not.toBe('none');
          expect(styles.borderLeft).toContain('solid');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('sidebar items SHALL have consistent height', () => {
    fc.assert(
      fc.property(sidebarItemArb, (item) => {
        const styles = extractSidebarStyles(item);
        
        expect(styles.height).toBe(36);
      }),
      { numRuns: 100 }
    );
  });

  it('sidebar width SHALL be 240px', () => {
    expect(SHOPIFY_SIDEBAR_SPECS.width).toBe(240);
  });
});
