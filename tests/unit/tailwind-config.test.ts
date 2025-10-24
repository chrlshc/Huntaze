import { describe, it, expect, beforeAll } from 'vitest';
import tailwindConfig from '../../tailwind.config.js';
import resolveConfig from 'tailwindcss/resolveConfig';

describe('Tailwind Configuration', () => {
  let fullConfig: any;

  beforeAll(() => {
    fullConfig = resolveConfig(tailwindConfig);
  });

  describe('Color Palette', () => {
    describe('Success Colors', () => {
      it('should have all required success color variants', () => {
        const successColors = fullConfig.theme.colors.success;
        
        expect(successColors).toBeDefined();
        expect(successColors['50']).toBe('#f0fdf4');
        expect(successColors['100']).toBe('#dcfce7');
        expect(successColors['500']).toBe('#22c55e');
        expect(successColors['600']).toBe('#16a34a');
        expect(successColors['800']).toBe('#166534');
      });

      it('should maintain proper color contrast ratios', () => {
        const successColors = fullConfig.theme.colors.success;
        
        // Light variants should be lighter than dark variants
        expect(successColors['50']).toBeTruthy();
        expect(successColors['100']).toBeTruthy();
        expect(successColors['500']).toBeTruthy();
        expect(successColors['600']).toBeTruthy();
        expect(successColors['800']).toBeTruthy();
      });
    });

    describe('Content Colors', () => {
      it('should define content color variants for text', () => {
        const contentColors = fullConfig.theme.colors.content;
        
        expect(contentColors).toBeDefined();
        expect(contentColors.primary).toBe('#171717');
        expect(contentColors.secondary).toBe('#737373');
        expect(contentColors.tertiary).toBe('#a3a3a3');
      });

      it('should have proper hierarchy in content colors', () => {
        const contentColors = fullConfig.theme.colors.content;
        
        // Primary should be darkest, tertiary should be lightest
        expect(contentColors.primary).toBe('#171717'); // Darkest
        expect(contentColors.secondary).toBe('#737373'); // Medium
        expect(contentColors.tertiary).toBe('#a3a3a3'); // Lightest
      });
    });

    describe('Surface Colors', () => {
      it('should define surface color variants for backgrounds', () => {
        const surfaceColors = fullConfig.theme.colors.surface;
        
        expect(surfaceColors).toBeDefined();
        expect(surfaceColors.DEFAULT).toBe('#ffffff');
        expect(surfaceColors.light).toBe('#f9fafb');
        expect(surfaceColors.elevated).toBe('#ffffff');
        expect(surfaceColors['elevated-light']).toBe('#fafafa');
        expect(surfaceColors.hover).toBe('#f5f5f5');
        expect(surfaceColors['hover-light']).toBe('#f9fafb');
      });

      it('should have consistent surface color progression', () => {
        const surfaceColors = fullConfig.theme.colors.surface;
        
        // All surface colors should be light/white variants
        expect(surfaceColors.DEFAULT).toMatch(/^#f|^#ffffff/);
        expect(surfaceColors.light).toMatch(/^#f/);
        expect(surfaceColors.elevated).toMatch(/^#ffffff/);
        expect(surfaceColors['elevated-light']).toMatch(/^#f/);
        expect(surfaceColors.hover).toMatch(/^#f/);
        expect(surfaceColors['hover-light']).toMatch(/^#f/);
      });
    });

    describe('Border Colors', () => {
      it('should define border color variants', () => {
        const borderColors = fullConfig.theme.colors.border;
        
        expect(borderColors).toBeDefined();
        expect(borderColors.DEFAULT).toBe('#e5e5e5');
        expect(borderColors.light).toBe('#f0f0f0');
      });

      it('should have proper border color hierarchy', () => {
        const borderColors = fullConfig.theme.colors.border;
        
        // Light should be lighter than default
        expect(borderColors.DEFAULT).toBe('#e5e5e5');
        expect(borderColors.light).toBe('#f0f0f0');
      });
    });

    describe('Semantic Colors', () => {
      it('should have warning colors', () => {
        const warningColors = fullConfig.theme.colors.warning;
        
        expect(warningColors).toBeDefined();
        expect(warningColors['50']).toBe('#fffbeb');
        expect(warningColors['500']).toBe('#f59e0b');
        expect(warningColors['600']).toBe('#d97706');
      });

      it('should have error colors', () => {
        const errorColors = fullConfig.theme.colors.error;
        
        expect(errorColors).toBeDefined();
        expect(errorColors['50']).toBe('#fef2f2');
        expect(errorColors['500']).toBe('#ef4444');
        expect(errorColors['600']).toBe('#dc2626');
      });

      it('should have info colors', () => {
        const infoColors = fullConfig.theme.colors.info;
        
        expect(infoColors).toBeDefined();
        expect(infoColors['50']).toBe('#eff6ff');
        expect(infoColors['500']).toBe('#3b82f6');
        expect(infoColors['600']).toBe('#2563eb');
      });
    });

    describe('E-commerce Colors', () => {
      it('should define price colors', () => {
        const priceColors = fullConfig.theme.colors.price;
        
        expect(priceColors).toBeDefined();
        expect(priceColors.regular).toBe('#262626');
        expect(priceColors.sale).toBe('#dc2626');
        expect(priceColors.compare).toBe('#737373');
      });

      it('should define status colors for orders', () => {
        const statusColors = fullConfig.theme.colors.status;
        
        expect(statusColors).toBeDefined();
        expect(statusColors.pending).toBe('#f59e0b');
        expect(statusColors.confirmed).toBe('#3b82f6');
        expect(statusColors.processing).toBe('#8b5cf6');
        expect(statusColors.shipped).toBe('#06b6d4');
        expect(statusColors.delivered).toBe('#22c55e');
        expect(statusColors.cancelled).toBe('#ef4444');
      });
    });
  });

  describe('Typography', () => {
    it('should have proper font size scale', () => {
      const fontSize = fullConfig.theme.fontSize;
      
      expect(fontSize.xs).toEqual(['0.75rem', { lineHeight: '1rem' }]);
      expect(fontSize.sm).toEqual(['0.875rem', { lineHeight: '1.25rem' }]);
      expect(fontSize.base).toEqual(['1rem', { lineHeight: '1.5rem' }]);
      expect(fontSize.lg).toEqual(['1.125rem', { lineHeight: '1.75rem' }]);
      expect(fontSize.xl).toEqual(['1.25rem', { lineHeight: '1.75rem' }]);
    });
  });

  describe('Spacing', () => {
    it('should have custom spacing values', () => {
      const spacing = fullConfig.theme.spacing;
      
      expect(spacing['18']).toBe('4.5rem');
      expect(spacing['88']).toBe('22rem');
      expect(spacing['128']).toBe('32rem');
    });
  });

  describe('Border Radius', () => {
    it('should have proper border radius scale', () => {
      const borderRadius = fullConfig.theme.borderRadius;
      
      expect(borderRadius.sm).toBe('0.25rem');
      expect(borderRadius.DEFAULT).toBe('0.375rem');
      expect(borderRadius.md).toBe('0.5rem');
      expect(borderRadius.lg).toBe('0.75rem');
      expect(borderRadius.xl).toBe('1rem');
      expect(borderRadius['2xl']).toBe('1.5rem');
    });
  });

  describe('Box Shadows', () => {
    it('should have custom shadow variants', () => {
      const boxShadow = fullConfig.theme.boxShadow;
      
      expect(boxShadow.card).toBeDefined();
      expect(boxShadow.button).toBeDefined();
      expect(boxShadow.input).toBeDefined();
    });
  });

  describe('Animations', () => {
    it('should have custom animations', () => {
      const animation = fullConfig.theme.animation;
      
      expect(animation['fade-in']).toBe('fadeIn 0.2s ease-in-out');
      expect(animation['slide-up']).toBe('slideUp 0.3s ease-out');
      expect(animation['slide-down']).toBe('slideDown 0.3s ease-out');
      expect(animation['scale-in']).toBe('scaleIn 0.2s ease-out');
      expect(animation['spin-slow']).toBe('spin 2s linear infinite');
    });

    it('should have corresponding keyframes', () => {
      const keyframes = fullConfig.theme.keyframes;
      
      expect(keyframes.fadeIn).toBeDefined();
      expect(keyframes.slideUp).toBeDefined();
      expect(keyframes.slideDown).toBeDefined();
      expect(keyframes.scaleIn).toBeDefined();
    });
  });

  describe('Grid Templates', () => {
    it('should have custom grid templates', () => {
      const gridTemplateColumns = fullConfig.theme.gridTemplateColumns;
      
      expect(gridTemplateColumns['auto-fit-xs']).toBe('repeat(auto-fit, minmax(200px, 1fr))');
      expect(gridTemplateColumns['product-grid']).toBe('repeat(auto-fill, minmax(280px, 1fr))');
      expect(gridTemplateColumns['admin-layout']).toBe('240px 1fr');
      expect(gridTemplateColumns['admin-layout-collapsed']).toBe('60px 1fr');
    });
  });

  describe('Breakpoints', () => {
    it('should have custom breakpoints', () => {
      const screens = fullConfig.theme.screens;
      
      expect(screens.xs).toBe('475px');
      expect(screens.sm).toBe('640px');
      expect(screens.md).toBe('768px');
      expect(screens.lg).toBe('1024px');
      expect(screens.xl).toBe('1280px');
      expect(screens['2xl']).toBe('1536px');
    });
  });

  describe('Configuration Integrity', () => {
    it('should have all required plugins', () => {
      expect(tailwindConfig.plugins).toBeDefined();
      expect(tailwindConfig.plugins.length).toBeGreaterThan(0);
    });

    it('should have proper content paths', () => {
      const contentPaths = tailwindConfig.content;
      
      expect(contentPaths).toContain('./pages/**/*.{js,ts,jsx,tsx,mdx}');
      expect(contentPaths).toContain('./components/**/*.{js,ts,jsx,tsx,mdx}');
      expect(contentPaths).toContain('./app/**/*.{js,ts,jsx,tsx,mdx}');
    });

    it('should have dark mode configured', () => {
      expect(tailwindConfig.darkMode).toBe('class');
    });
  });
});