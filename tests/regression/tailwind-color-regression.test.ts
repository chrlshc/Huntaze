import { describe, it, expect } from 'vitest';
import tailwindConfig from '../../tailwind.config.js';
import resolveConfig from 'tailwindcss/resolveConfig';

describe('Tailwind Color Regression Tests', () => {
  let fullConfig: any;

  beforeAll(() => {
    fullConfig = resolveConfig(tailwindConfig);
  });

  describe('Existing Color Preservation', () => {
    it('should preserve existing primary color palette', () => {
      const primaryColors = fullConfig.theme.colors.primary;
      
      // These values should never change to maintain design consistency
      expect(primaryColors['50']).toBe('#f0fdf4');
      expect(primaryColors['100']).toBe('#dcfce7');
      expect(primaryColors['200']).toBe('#bbf7d0');
      expect(primaryColors['300']).toBe('#86efac');
      expect(primaryColors['400']).toBe('#4ade80');
      expect(primaryColors['500']).toBe('#22c55e');
      expect(primaryColors['600']).toBe('#16a34a');
      expect(primaryColors['700']).toBe('#15803d');
      expect(primaryColors['800']).toBe('#166534');
      expect(primaryColors['900']).toBe('#14532d');
      expect(primaryColors['950']).toBe('#052e16');
    });

    it('should preserve existing neutral color palette', () => {
      const neutralColors = fullConfig.theme.colors.neutral;
      
      expect(neutralColors['50']).toBe('#fafafa');
      expect(neutralColors['100']).toBe('#f5f5f5');
      expect(neutralColors['200']).toBe('#e5e5e5');
      expect(neutralColors['300']).toBe('#d4d4d4');
      expect(neutralColors['400']).toBe('#a3a3a3');
      expect(neutralColors['500']).toBe('#737373');
      expect(neutralColors['600']).toBe('#525252');
      expect(neutralColors['700']).toBe('#404040');
      expect(neutralColors['800']).toBe('#262626');
      expect(neutralColors['900']).toBe('#171717');
      expect(neutralColors['950']).toBe('#0a0a0a');
    });
  });

  describe('New Color Additions Validation', () => {
    it('should have added success-100 color correctly', () => {
      const successColors = fullConfig.theme.colors.success;
      
      // This is a new addition that should be present
      expect(successColors['100']).toBe('#dcfce7');
      
      // Existing colors should remain unchanged
      expect(successColors['50']).toBe('#f0fdf4');
      expect(successColors['500']).toBe('#22c55e');
      expect(successColors['600']).toBe('#16a34a');
    });

    it('should have added content colors correctly', () => {
      const contentColors = fullConfig.theme.colors.content;
      
      expect(contentColors).toBeDefined();
      expect(contentColors.primary).toBe('#171717');
      expect(contentColors.secondary).toBe('#737373');
      expect(contentColors.tertiary).toBe('#a3a3a3');
    });

    it('should have added surface colors correctly', () => {
      const surfaceColors = fullConfig.theme.colors.surface;
      
      expect(surfaceColors).toBeDefined();
      expect(surfaceColors.DEFAULT).toBe('#ffffff');
      expect(surfaceColors.light).toBe('#f9fafb');
      expect(surfaceColors.elevated).toBe('#ffffff');
      expect(surfaceColors['elevated-light']).toBe('#fafafa');
      expect(surfaceColors.hover).toBe('#f5f5f5');
      expect(surfaceColors['hover-light']).toBe('#f9fafb');
    });

    it('should have added border colors correctly', () => {
      const borderColors = fullConfig.theme.colors.border;
      
      expect(borderColors).toBeDefined();
      expect(borderColors.DEFAULT).toBe('#e5e5e5');
      expect(borderColors.light).toBe('#f0f0f0');
    });
  });

  describe('Color Relationship Consistency', () => {
    it('should maintain proper content color hierarchy', () => {
      const contentColors = fullConfig.theme.colors.content;
      const neutralColors = fullConfig.theme.colors.neutral;
      
      // Content colors should map to neutral colors
      expect(contentColors.primary).toBe(neutralColors['900']); // #171717
      expect(contentColors.secondary).toBe(neutralColors['500']); // #737373
      expect(contentColors.tertiary).toBe(neutralColors['400']); // #a3a3a3
    });

    it('should maintain proper surface color relationships', () => {
      const surfaceColors = fullConfig.theme.colors.surface;
      const neutralColors = fullConfig.theme.colors.neutral;
      
      // Surface colors should be light variants
      expect(surfaceColors.DEFAULT).toBe('#ffffff');
      expect(surfaceColors['elevated-light']).toBe(neutralColors['50']); // #fafafa
      expect(surfaceColors.hover).toBe(neutralColors['100']); // #f5f5f5
    });

    it('should maintain proper border color relationships', () => {
      const borderColors = fullConfig.theme.colors.border;
      const neutralColors = fullConfig.theme.colors.neutral;
      
      // Border colors should map to neutral colors
      expect(borderColors.DEFAULT).toBe(neutralColors['200']); // #e5e5e5
    });
  });

  describe('Semantic Color Consistency', () => {
    it('should maintain warning color consistency', () => {
      const warningColors = fullConfig.theme.colors.warning;
      
      expect(warningColors['50']).toBe('#fffbeb');
      expect(warningColors['500']).toBe('#f59e0b');
      expect(warningColors['600']).toBe('#d97706');
    });

    it('should maintain error color consistency', () => {
      const errorColors = fullConfig.theme.colors.error;
      
      expect(errorColors['50']).toBe('#fef2f2');
      expect(errorColors['500']).toBe('#ef4444');
      expect(errorColors['600']).toBe('#dc2626');
    });

    it('should maintain info color consistency', () => {
      const infoColors = fullConfig.theme.colors.info;
      
      expect(infoColors['50']).toBe('#eff6ff');
      expect(infoColors['500']).toBe('#3b82f6');
      expect(infoColors['600']).toBe('#2563eb');
    });
  });

  describe('E-commerce Color Consistency', () => {
    it('should maintain price color consistency', () => {
      const priceColors = fullConfig.theme.colors.price;
      const neutralColors = fullConfig.theme.colors.neutral;
      const errorColors = fullConfig.theme.colors.error;
      
      expect(priceColors.regular).toBe(neutralColors['800']); // #262626
      expect(priceColors.sale).toBe(errorColors['600']); // #dc2626
      expect(priceColors.compare).toBe(neutralColors['500']); // #737373
    });

    it('should maintain status color consistency', () => {
      const statusColors = fullConfig.theme.colors.status;
      
      expect(statusColors.pending).toBe('#f59e0b'); // warning-500
      expect(statusColors.confirmed).toBe('#3b82f6'); // info-500
      expect(statusColors.processing).toBe('#8b5cf6'); // purple-500
      expect(statusColors.shipped).toBe('#06b6d4'); // cyan-500
      expect(statusColors.delivered).toBe('#22c55e'); // success-500
      expect(statusColors.cancelled).toBe('#ef4444'); // error-500
    });
  });

  describe('Color Format Regression', () => {
    const validateHexColor = (color: string): boolean => {
      return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
    };

    it('should maintain valid hex format for all colors', () => {
      const colors = fullConfig.theme.colors;
      
      const checkColorObject = (colorObj: any, path: string = '') => {
        Object.entries(colorObj).forEach(([key, value]) => {
          const currentPath = path ? `${path}.${key}` : key;
          
          if (typeof value === 'string') {
            expect(validateHexColor(value), 
              `Color ${currentPath} should be valid hex: ${value}`
            ).toBe(true);
          } else if (typeof value === 'object' && value !== null) {
            checkColorObject(value, currentPath);
          }
        });
      };
      
      // Check specific color palettes that were modified
      checkColorObject(colors.success, 'success');
      checkColorObject(colors.content, 'content');
      checkColorObject(colors.surface, 'surface');
      checkColorObject(colors.border, 'border');
    });
  });

  describe('Breaking Change Detection', () => {
    it('should not have removed any existing color variants', () => {
      const colors = fullConfig.theme.colors;
      
      // Check that all expected color palettes exist
      expect(colors.primary).toBeDefined();
      expect(colors.neutral).toBeDefined();
      expect(colors.success).toBeDefined();
      expect(colors.warning).toBeDefined();
      expect(colors.error).toBeDefined();
      expect(colors.info).toBeDefined();
      
      // Check that new palettes were added
      expect(colors.content).toBeDefined();
      expect(colors.surface).toBeDefined();
      expect(colors.border).toBeDefined();
      expect(colors.price).toBeDefined();
      expect(colors.status).toBeDefined();
    });

    it('should not have changed existing color values', () => {
      const colors = fullConfig.theme.colors;
      
      // Critical colors that should never change
      const criticalColors = {
        'primary.500': '#22c55e',
        'primary.600': '#16a34a',
        'neutral.900': '#171717',
        'neutral.500': '#737373',
        'success.500': '#22c55e',
        'success.600': '#16a34a',
      };
      
      Object.entries(criticalColors).forEach(([path, expectedValue]) => {
        const [palette, variant] = path.split('.');
        const actualValue = colors[palette][variant];
        
        expect(actualValue).toBe(expectedValue, 
          `Critical color ${path} should not change from ${expectedValue}, got ${actualValue}`
        );
      });
    });
  });

  describe('Design System Consistency', () => {
    it('should maintain consistent color naming patterns', () => {
      const colors = fullConfig.theme.colors;
      
      // All semantic colors should follow the same pattern
      const semanticColors = ['success', 'warning', 'error', 'info'];
      
      semanticColors.forEach(colorName => {
        const colorPalette = colors[colorName];
        expect(colorPalette).toBeDefined();
        expect(colorPalette['50']).toBeDefined();
        expect(colorPalette['500']).toBeDefined();
        expect(colorPalette['600']).toBeDefined();
      });
    });

    it('should maintain consistent content color structure', () => {
      const contentColors = fullConfig.theme.colors.content;
      
      expect(contentColors.primary).toBeDefined();
      expect(contentColors.secondary).toBeDefined();
      expect(contentColors.tertiary).toBeDefined();
      
      // Should not have unexpected variants
      const expectedKeys = ['primary', 'secondary', 'tertiary'];
      const actualKeys = Object.keys(contentColors);
      
      expectedKeys.forEach(key => {
        expect(actualKeys).toContain(key);
      });
    });

    it('should maintain consistent surface color structure', () => {
      const surfaceColors = fullConfig.theme.colors.surface;
      
      const expectedKeys = ['DEFAULT', 'light', 'elevated', 'elevated-light', 'hover', 'hover-light'];
      const actualKeys = Object.keys(surfaceColors);
      
      expectedKeys.forEach(key => {
        expect(actualKeys).toContain(key);
      });
    });
  });
});