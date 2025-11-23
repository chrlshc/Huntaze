/**
 * Visual QA: Dark Mode Contrast Ratios
 * 
 * This test verifies that all color combinations in the dark mode design system
 * meet WCAG AA accessibility standards for contrast ratios.
 * 
 * WCAG AA Requirements:
 * - Normal text (< 18pt): 4.5:1 minimum
 * - Large text (>= 18pt or bold >= 14pt): 3:1 minimum
 * - UI components and graphical objects: 3:1 minimum
 */

import { describe, it, expect } from 'vitest';

// Color values from design system (app/globals.css)
const COLORS = {
  background: '#0F0F10',      // hsl(240 5% 6%)
  surface: '#1E1E20',         // hsl(240 4% 12%)
  primary: '#5E6AD2',         // hsl(234 56% 60%) - Magic Blue
  foreground: '#EDEDED',      // Primary text
  muted: '#8A8F98',           // Muted text
  mutedForeground: '#6B7280', // Muted foreground
  border: 'rgba(255, 255, 255, 0.08)', // WhiteAlpha border
  divider: 'rgba(255, 255, 255, 0.04)', // WhiteAlpha divider
};

/**
 * Calculate relative luminance according to WCAG formula
 * https://www.w3.org/TR/WCAG20-TECHS/G17.html
 */
function getLuminance(hex: string): number {
  // Handle rgba colors by extracting RGB
  if (hex.startsWith('rgba')) {
    const match = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return 0;
    const [, r, g, b] = match.map(Number);
    return calculateLuminance(r, g, b);
  }

  // Handle hex colors
  const rgb = parseInt(hex.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;

  return calculateLuminance(r, g, b);
}

function calculateLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/TR/WCAG20-TECHS/G17.html
 */
function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

describe('Visual QA: Dark Mode Contrast Ratios', () => {
  describe('Text Contrast - Normal Text (WCAG AA: 4.5:1)', () => {
    it('should have sufficient contrast for primary text on background', () => {
      const ratio = getContrastRatio(COLORS.foreground, COLORS.background);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(ratio).toBeGreaterThan(10); // Should be very high for readability
    });

    it('should have sufficient contrast for primary text on surface', () => {
      const ratio = getContrastRatio(COLORS.foreground, COLORS.surface);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(ratio).toBeGreaterThan(9); // Should be very high for readability
    });

    it('should have sufficient contrast for muted text on background', () => {
      const ratio = getContrastRatio(COLORS.muted, COLORS.background);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('should have sufficient contrast for muted text on surface', () => {
      const ratio = getContrastRatio(COLORS.muted, COLORS.surface);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('UI Component Contrast (WCAG AA: 3:1)', () => {
    it('should have sufficient contrast for primary button on background', () => {
      const ratio = getContrastRatio(COLORS.primary, COLORS.background);
      expect(ratio).toBeGreaterThanOrEqual(3.0);
    });

    it('should have sufficient contrast for primary button on surface', () => {
      const ratio = getContrastRatio(COLORS.primary, COLORS.surface);
      expect(ratio).toBeGreaterThanOrEqual(3.0);
    });

    it('should have sufficient contrast for white text on primary button', () => {
      const ratio = getContrastRatio('#FFFFFF', COLORS.primary);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('Border Visibility', () => {
    it('should have visible borders (WhiteAlpha) on background', () => {
      // Borders should be subtle but visible
      // With 8% opacity white on dark background, this should be perceptible
      const ratio = getContrastRatio(COLORS.border, COLORS.background);
      // Borders don't need to meet WCAG contrast, but should be visible
      expect(ratio).toBeGreaterThan(1.0);
    });

    it('should have visible dividers (WhiteAlpha) on surface', () => {
      const ratio = getContrastRatio(COLORS.divider, COLORS.surface);
      // Dividers are more subtle than borders
      expect(ratio).toBeGreaterThan(1.0);
    });
  });

  describe('Color System Consistency', () => {
    it('should have background darker than surface', () => {
      const bgLum = getLuminance(COLORS.background);
      const surfaceLum = getLuminance(COLORS.surface);
      expect(bgLum).toBeLessThan(surfaceLum);
    });

    it('should have foreground much lighter than background', () => {
      const fgLum = getLuminance(COLORS.foreground);
      const bgLum = getLuminance(COLORS.background);
      expect(fgLum).toBeGreaterThan(bgLum * 10);
    });

    it('should have muted text lighter than background but darker than foreground', () => {
      const mutedLum = getLuminance(COLORS.muted);
      const bgLum = getLuminance(COLORS.background);
      const fgLum = getLuminance(COLORS.foreground);
      
      expect(mutedLum).toBeGreaterThan(bgLum);
      expect(mutedLum).toBeLessThan(fgLum);
    });
  });

  describe('Accessibility Compliance Summary', () => {
    it('should meet WCAG AA standards for all critical text combinations', () => {
      const criticalCombinations = [
        { name: 'Primary text on background', fg: COLORS.foreground, bg: COLORS.background, min: 4.5 },
        { name: 'Primary text on surface', fg: COLORS.foreground, bg: COLORS.surface, min: 4.5 },
        { name: 'Muted text on background', fg: COLORS.muted, bg: COLORS.background, min: 4.5 },
        { name: 'Muted text on surface', fg: COLORS.muted, bg: COLORS.surface, min: 4.5 },
        { name: 'White on primary button', fg: '#FFFFFF', bg: COLORS.primary, min: 4.5 },
        { name: 'Primary button on background', fg: COLORS.primary, bg: COLORS.background, min: 3.0 },
      ];

      const results = criticalCombinations.map(({ name, fg, bg, min }) => {
        const ratio = getContrastRatio(fg, bg);
        return {
          name,
          ratio: ratio.toFixed(2),
          passes: ratio >= min,
          required: min,
        };
      });

      // All should pass
      const failures = results.filter(r => !r.passes);
      expect(failures).toHaveLength(0);

      // Log results for documentation
      console.log('\n=== Dark Mode Contrast Ratios ===');
      results.forEach(r => {
        console.log(`${r.name}: ${r.ratio}:1 (required: ${r.required}:1) ${r.passes ? '✓' : '✗'}`);
      });
    });
  });
});
