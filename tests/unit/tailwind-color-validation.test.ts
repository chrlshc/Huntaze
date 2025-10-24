import { describe, it, expect } from 'vitest';
import tailwindConfig from '../../tailwind.config.js';
import resolveConfig from 'tailwindcss/resolveConfig';

describe('Tailwind Color Validation', () => {
  let fullConfig: any;

  beforeAll(() => {
    fullConfig = resolveConfig(tailwindConfig);
  });

  describe('Color Format Validation', () => {
    const validateHexColor = (color: string): boolean => {
      return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
    };

    const validateColorObject = (colorObj: any, colorName: string) => {
      Object.entries(colorObj).forEach(([variant, color]) => {
        if (typeof color === 'string') {
          expect(validateHexColor(color), 
            `${colorName}.${variant} should be a valid hex color, got: ${color}`
          ).toBe(true);
        }
      });
    };

    it('should have valid hex colors for success palette', () => {
      const successColors = fullConfig.theme.colors.success;
      validateColorObject(successColors, 'success');
    });

    it('should have valid hex colors for content palette', () => {
      const contentColors = fullConfig.theme.colors.content;
      validateColorObject(contentColors, 'content');
    });

    it('should have valid hex colors for surface palette', () => {
      const surfaceColors = fullConfig.theme.colors.surface;
      validateColorObject(surfaceColors, 'surface');
    });

    it('should have valid hex colors for border palette', () => {
      const borderColors = fullConfig.theme.colors.border;
      validateColorObject(borderColors, 'border');
    });

    it('should have valid hex colors for warning palette', () => {
      const warningColors = fullConfig.theme.colors.warning;
      validateColorObject(warningColors, 'warning');
    });

    it('should have valid hex colors for error palette', () => {
      const errorColors = fullConfig.theme.colors.error;
      validateColorObject(errorColors, 'error');
    });

    it('should have valid hex colors for info palette', () => {
      const infoColors = fullConfig.theme.colors.info;
      validateColorObject(infoColors, 'info');
    });

    it('should have valid hex colors for price palette', () => {
      const priceColors = fullConfig.theme.colors.price;
      validateColorObject(priceColors, 'price');
    });

    it('should have valid hex colors for status palette', () => {
      const statusColors = fullConfig.theme.colors.status;
      validateColorObject(statusColors, 'status');
    });
  });

  describe('Color Accessibility', () => {
    // Helper function to convert hex to RGB
    const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    // Helper function to calculate relative luminance
    const getLuminance = (r: number, g: number, b: number): number => {
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    // Helper function to calculate contrast ratio
    const getContrastRatio = (color1: string, color2: string): number => {
      const rgb1 = hexToRgb(color1);
      const rgb2 = hexToRgb(color2);
      
      if (!rgb1 || !rgb2) return 0;
      
      const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
      const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
      
      const brightest = Math.max(lum1, lum2);
      const darkest = Math.min(lum1, lum2);
      
      return (brightest + 0.05) / (darkest + 0.05);
    };

    it('should have sufficient contrast for content colors on white background', () => {
      const contentColors = fullConfig.theme.colors.content;
      const whiteBackground = '#ffffff';
      
      // Primary content should have high contrast (AA Large: 3:1, AA Normal: 4.5:1)
      const primaryContrast = getContrastRatio(contentColors.primary, whiteBackground);
      expect(primaryContrast).toBeGreaterThanOrEqual(4.5);
      
      // Secondary content should have reasonable contrast
      const secondaryContrast = getContrastRatio(contentColors.secondary, whiteBackground);
      expect(secondaryContrast).toBeGreaterThanOrEqual(3);
      
      // Tertiary content should have minimum contrast
      const tertiaryContrast = getContrastRatio(contentColors.tertiary, whiteBackground);
      expect(tertiaryContrast).toBeGreaterThanOrEqual(2.5);
    });

    it('should have sufficient contrast for success colors', () => {
      const successColors = fullConfig.theme.colors.success;
      const whiteBackground = '#ffffff';
      
      // Success 600 should have good contrast on white
      const successContrast = getContrastRatio(successColors['600'], whiteBackground);
      expect(successContrast).toBeGreaterThanOrEqual(3);
    });

    it('should have sufficient contrast for error colors', () => {
      const errorColors = fullConfig.theme.colors.error;
      const whiteBackground = '#ffffff';
      
      // Error 600 should have good contrast on white
      const errorContrast = getContrastRatio(errorColors['600'], whiteBackground);
      expect(errorContrast).toBeGreaterThanOrEqual(3);
    });

    it('should have sufficient contrast for warning colors', () => {
      const warningColors = fullConfig.theme.colors.warning;
      const whiteBackground = '#ffffff';
      
      // Warning 600 should have good contrast on white
      const warningContrast = getContrastRatio(warningColors['600'], whiteBackground);
      expect(warningContrast).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Color Consistency', () => {
    it('should have consistent color naming patterns', () => {
      const colors = fullConfig.theme.colors;
      
      // Check that semantic colors follow the same pattern
      const semanticColors = ['success', 'warning', 'error', 'info'];
      
      semanticColors.forEach(colorName => {
        const colorPalette = colors[colorName];
        expect(colorPalette).toBeDefined();
        
        // Should have at least 50 and 500 variants
        expect(colorPalette['50']).toBeDefined();
        expect(colorPalette['500']).toBeDefined();
      });
    });

    it('should have consistent surface color relationships', () => {
      const surfaceColors = fullConfig.theme.colors.surface;
      
      // All surface colors should be light colors (high luminance)
      Object.entries(surfaceColors).forEach(([variant, color]) => {
        if (typeof color === 'string') {
          const rgb = hexToRgb(color);
          if (rgb) {
            const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
            expect(luminance).toBeGreaterThan(0.8); // Should be light
          }
        }
      });
    });

    it('should have proper border color hierarchy', () => {
      const borderColors = fullConfig.theme.colors.border;
      const neutralColors = fullConfig.theme.colors.neutral;
      
      // Border colors should be from the neutral palette
      expect(borderColors.DEFAULT).toBe(neutralColors['200']);
    });
  });

  describe('Color Completeness', () => {
    it('should have all required content color variants', () => {
      const contentColors = fullConfig.theme.colors.content;
      
      expect(contentColors.primary).toBeDefined();
      expect(contentColors.secondary).toBeDefined();
      expect(contentColors.tertiary).toBeDefined();
    });

    it('should have all required surface color variants', () => {
      const surfaceColors = fullConfig.theme.colors.surface;
      
      expect(surfaceColors.DEFAULT).toBeDefined();
      expect(surfaceColors.light).toBeDefined();
      expect(surfaceColors.elevated).toBeDefined();
      expect(surfaceColors['elevated-light']).toBeDefined();
      expect(surfaceColors.hover).toBeDefined();
      expect(surfaceColors['hover-light']).toBeDefined();
    });

    it('should have all required border color variants', () => {
      const borderColors = fullConfig.theme.colors.border;
      
      expect(borderColors.DEFAULT).toBeDefined();
      expect(borderColors.light).toBeDefined();
    });

    it('should have all required e-commerce colors', () => {
      const priceColors = fullConfig.theme.colors.price;
      const statusColors = fullConfig.theme.colors.status;
      
      // Price colors
      expect(priceColors.regular).toBeDefined();
      expect(priceColors.sale).toBeDefined();
      expect(priceColors.compare).toBeDefined();
      
      // Status colors
      expect(statusColors.pending).toBeDefined();
      expect(statusColors.confirmed).toBeDefined();
      expect(statusColors.processing).toBeDefined();
      expect(statusColors.shipped).toBeDefined();
      expect(statusColors.delivered).toBeDefined();
      expect(statusColors.cancelled).toBeDefined();
    });
  });

  describe('Color Regression Tests', () => {
    it('should maintain existing success color values', () => {
      const successColors = fullConfig.theme.colors.success;
      
      // These values should not change to maintain design consistency
      expect(successColors['50']).toBe('#f0fdf4');
      expect(successColors['500']).toBe('#22c55e');
      expect(successColors['600']).toBe('#16a34a');
    });

    it('should maintain new content color values', () => {
      const contentColors = fullConfig.theme.colors.content;
      
      // These are the new values that should be preserved
      expect(contentColors.primary).toBe('#171717');
      expect(contentColors.secondary).toBe('#737373');
    });

    it('should maintain new surface color values', () => {
      const surfaceColors = fullConfig.theme.colors.surface;
      
      // These are the new values that should be preserved
      expect(surfaceColors.elevated).toBe('#ffffff');
      expect(surfaceColors['elevated-light']).toBe('#fafafa');
      expect(surfaceColors.hover).toBe('#f5f5f5');
      expect(surfaceColors['hover-light']).toBe('#f9fafb');
    });

    it('should maintain new border color values', () => {
      const borderColors = fullConfig.theme.colors.border;
      
      // These are the new values that should be preserved
      expect(borderColors.DEFAULT).toBe('#e5e5e5');
      expect(borderColors.light).toBe('#f0f0f0');
    });
  });
});