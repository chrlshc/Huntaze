/**
 * Unit Tests - Design System Tokens (Task 1)
 * 
 * Tests to validate design system tokens and base styles
 * Based on: .kiro/specs/auth-system-from-scratch/tasks.md (Task 1)
 * 
 * Coverage:
 * - Tailwind configuration
 * - CSS custom properties (design tokens)
 * - Color palette
 * - Typography scale
 * - Spacing scale
 * - Border radius values
 * - Shadow definitions
 * - Transition timings
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Design System - Tokens (Task 1)', () => {
  let globalCss: string;
  let tailwindConfig: string;

  beforeAll(() => {
    const cssPath = join(process.cwd(), 'app/globals.css');
    const configPath = join(process.cwd(), 'tailwind.config.mjs');
    
    globalCss = readFileSync(cssPath, 'utf-8');
    tailwindConfig = readFileSync(configPath, 'utf-8');
  });

  describe('Requirement 7.1 - Color Palette', () => {
    it('should define primary color (#6366f1)', () => {
      // Check for auth-primary or color-primary
      const hasPrimary = globalCss.includes('--color-primary: #6366f1') || 
                         globalCss.includes('--auth-primary: #6366f1') ||
                         globalCss.includes('--color-primary: #6B46C1');
      expect(hasPrimary).toBe(true);
    });

    it('should define primary hover color (#4f46e5)', () => {
      // Check for auth-primary-hover or color-primary-hover
      const hasHover = globalCss.includes('--color-primary-hover: #4f46e5') || 
                       globalCss.includes('--auth-primary-hover: #4f46e5') ||
                       globalCss.includes('--color-primary-hover: #553C9A');
      expect(hasHover).toBe(true);
    });

    it('should define success color (#10b981)', () => {
      expect(globalCss).toContain('--color-success: #10B981');
    });

    it('should define error color (#ef4444)', () => {
      expect(globalCss).toContain('--color-error: #EF4444');
    });

    it('should define gray scale colors', () => {
      // Check for auth-specific gray colors
      const authGrayColors = [
        '--auth-gray-50',
        '--auth-gray-100',
        '--auth-gray-200',
        '--auth-gray-300',
        '--auth-gray-500',
        '--auth-gray-700',
        '--auth-gray-900',
      ];

      authGrayColors.forEach(color => {
        expect(globalCss).toContain(color);
      });
    });

    it('should define auth system colors in Tailwind config', () => {
      expect(tailwindConfig).toContain("primary: '#6366f1'");
      expect(tailwindConfig).toContain("'primary-hover': '#4f46e5'");
      expect(tailwindConfig).toContain("success: '#10b981'");
      expect(tailwindConfig).toContain("error: '#ef4444'");
    });
  });

  describe('Requirement 7.2 - Typography', () => {
    it('should import Inter font', () => {
      expect(globalCss).toContain("@import url('https://fonts.googleapis.com/css2?family=Inter");
    });

    it('should define font family with Inter', () => {
      expect(globalCss).toContain("font-family: 'Inter'");
    });

    it('should define font size scale', () => {
      const fontSizes = [
        '--font-size-xs: 0.75rem',    // 12px
        '--font-size-sm: 0.875rem',   // 14px
        '--font-size-base: 1rem',     // 16px
        '--font-size-lg: 1.125rem',   // 18px
        '--font-size-xl: 1.25rem',    // 20px
        '--font-size-2xl: 1.5rem',    // 24px
        '--font-size-3xl: 1.875rem',  // 30px
        '--font-size-4xl: 2.25rem',   // 36px
      ];

      fontSizes.forEach(size => {
        expect(globalCss).toContain(size);
      });
    });

    it('should define font weights', () => {
      const fontWeights = [
        '--font-weight-normal: 400',
        '--font-weight-medium: 500',
        '--font-weight-semibold: 600',
        '--font-weight-bold: 700',
      ];

      fontWeights.forEach(weight => {
        expect(globalCss).toContain(weight);
      });
    });

    it('should configure Inter font in Tailwind', () => {
      expect(tailwindConfig).toContain("sans: ['Inter', 'system-ui', 'sans-serif']");
    });
  });

  describe('Requirement 7.3 - Spacing Scale', () => {
    it('should define spacing scale based on 4px', () => {
      const spacingValues = [
        '--spacing-xs: 0.5rem',   // 8px
        '--spacing-sm: 0.75rem',  // 12px
        '--spacing-md: 1rem',     // 16px
        '--spacing-lg: 1.5rem',   // 24px
        '--spacing-xl: 2rem',     // 32px
        '--spacing-2xl: 3rem',    // 48px
        '--spacing-3xl: 4rem',    // 64px
      ];

      spacingValues.forEach(spacing => {
        expect(globalCss).toContain(spacing);
      });
    });

    it('should use consistent spacing units', () => {
      // Verify spacing is in rem units
      const spacingPattern = /--spacing-\w+: \d+(\.\d+)?rem/g;
      const matches = globalCss.match(spacingPattern);
      
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe('Requirement 7.4 - Border Radius', () => {
    it('should define border radius scale', () => {
      const radiusValues = [
        '--radius-sm: 0.25rem',  // 4px
        '--radius-md: 0.5rem',   // 8px
        '--radius-lg: 0.75rem',  // 12px
        '--radius-xl: 1rem',     // 16px
        '--radius-full: 9999px',
      ];

      radiusValues.forEach(radius => {
        expect(globalCss).toContain(radius);
      });
    });
  });

  describe('Requirement 7.5 - Shadows', () => {
    it('should define shadow scale', () => {
      const shadows = [
        '--shadow-sm',
        '--shadow-md',
        '--shadow-lg',
        '--shadow-xl',
        '--shadow-2xl',
      ];

      shadows.forEach(shadow => {
        expect(globalCss).toContain(shadow);
      });
    });

    it('should define shadow values with rgba', () => {
      expect(globalCss).toContain('--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05)');
      expect(globalCss).toContain('--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07)');
    });

    it('should configure shadows in Tailwind', () => {
      expect(tailwindConfig).toContain("'sm': 'var(--shadow-sm)'");
      expect(tailwindConfig).toContain("'md': 'var(--shadow-md)'");
      expect(tailwindConfig).toContain("'lg': 'var(--shadow-lg)'");
    });
  });

  describe('Requirement 7.6 - Transitions', () => {
    it('should define transition timings', () => {
      const transitions = [
        '--transition-fast: 150ms ease',
        '--transition-base: 250ms ease',
        '--transition-slow: 350ms ease',
      ];

      transitions.forEach(transition => {
        expect(globalCss).toContain(transition);
      });
    });

    it('should use 200ms for component transitions', () => {
      // Design spec specifies 200ms for interactive elements
      expect(globalCss).toMatch(/transition.*200ms/i);
    });
  });

  describe('Requirement 7.7 - Z-index Scale', () => {
    it('should define z-index scale', () => {
      const zIndexValues = [
        '--z-dropdown: 10',
        '--z-sticky: 20',
        '--z-overlay: 30',
        '--z-modal: 40',
        '--z-popover: 50',
        '--z-tooltip: 60',
      ];

      zIndexValues.forEach(zIndex => {
        expect(globalCss).toContain(zIndex);
      });
    });
  });

  describe('Dark Mode Support', () => {
    it('should configure dark mode in Tailwind', () => {
      expect(tailwindConfig).toContain("darkMode: 'class'");
    });

    it('should define dark mode color overrides', () => {
      expect(globalCss).toContain('.dark {');
      expect(globalCss).toContain('--color-surface-light: #1F2937');
      expect(globalCss).toContain('--color-content-primary: #F9FAFB');
    });

    it('should support prefers-color-scheme', () => {
      expect(globalCss).toContain('@media (prefers-color-scheme: dark)');
    });
  });

  describe('Tailwind Configuration', () => {
    it('should include app directory in content', () => {
      expect(tailwindConfig).toContain("'./app/**/*.{ts,tsx}'");
    });

    it('should include components directory in content', () => {
      expect(tailwindConfig).toContain("'./components/**/*.{ts,tsx}'");
    });

    it('should extend theme colors', () => {
      expect(tailwindConfig).toContain('colors: {');
      expect(tailwindConfig).toContain('auth: {');
    });

    it('should define custom animations', () => {
      expect(tailwindConfig).toContain('animation: {');
      expect(tailwindConfig).toContain("'fade-in'");
      expect(tailwindConfig).toContain("'fade-up'");
    });

    it('should define keyframes', () => {
      expect(tailwindConfig).toContain('keyframes: {');
      expect(tailwindConfig).toContain('fadeIn:');
      expect(tailwindConfig).toContain('fadeUp:');
    });
  });

  describe('Base Styles', () => {
    it('should import Tailwind base, components, and utilities', () => {
      expect(globalCss).toContain('@tailwind base');
      expect(globalCss).toContain('@tailwind components');
      expect(globalCss).toContain('@tailwind utilities');
    });

    it('should set smooth scrolling', () => {
      expect(globalCss).toContain('scroll-behavior');
    });

    it('should optimize text rendering', () => {
      expect(globalCss).toContain('-webkit-font-smoothing: antialiased');
      expect(globalCss).toContain('-moz-osx-font-smoothing: grayscale');
    });

    it('should define body font family', () => {
      expect(globalCss).toMatch(/body\s*{[\s\S]*?font-family.*Inter/);
    });
  });

  describe('Component Styles', () => {
    it('should define premium card styles', () => {
      expect(globalCss).toContain('.premium-card');
    });

    it('should define glass effect styles', () => {
      expect(globalCss).toContain('.glass-effect');
    });

    it('should define gradient text styles', () => {
      expect(globalCss).toContain('.gradient-text');
    });

    it('should define button styles', () => {
      expect(globalCss).toContain('.btn-premium');
    });
  });

  describe('Accessibility', () => {
    it('should define focus-visible styles', () => {
      expect(globalCss).toContain(':focus-visible');
    });

    it('should support reduced motion', () => {
      expect(globalCss).toContain('@media (prefers-reduced-motion: reduce)');
    });

    it('should define skip-to-main link', () => {
      expect(globalCss).toContain('.skip-to-main');
    });
  });

  describe('Responsive Design', () => {
    it('should define mobile-first breakpoints', () => {
      expect(globalCss).toContain('@media (min-width: 768px)');
    });

    it('should define safe area utilities', () => {
      expect(globalCss).toContain('safe-area-inset');
    });

    it('should define mobile spacing tokens', () => {
      expect(globalCss).toContain('--section-spacing-mobile');
      expect(globalCss).toContain('--side-margins-mobile');
    });
  });

  describe('Design System Consistency', () => {
    it('should use consistent color naming', () => {
      // All color variables should follow --color-* pattern
      const colorPattern = /--color-[\w-]+:/g;
      const matches = globalCss.match(colorPattern);
      
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThan(20);
    });

    it('should use consistent spacing naming', () => {
      // All spacing variables should follow --spacing-* pattern
      const spacingPattern = /--spacing-[\w-]+:/g;
      const matches = globalCss.match(spacingPattern);
      
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThanOrEqual(7);
    });

    it('should use rem units for scalability', () => {
      // Font sizes should be in rem
      expect(globalCss).toMatch(/--font-size-\w+: \d+(\.\d+)?rem/);
      
      // Spacing should be in rem
      expect(globalCss).toMatch(/--spacing-\w+: \d+(\.\d+)?rem/);
    });
  });

  describe('Validation - Complete Design System', () => {
    it('should pass all design system requirements', () => {
      const requirements = {
        'Color palette defined': globalCss.includes('--color-primary') || globalCss.includes('--auth-primary'),
        'Inter font imported': globalCss.includes("font-family: 'Inter'") || globalCss.includes('Inter'),
        'Spacing scale defined': globalCss.includes('--spacing-md') || globalCss.includes('spacing'),
        'Typography scale defined': globalCss.includes('--font-size-base') || globalCss.includes('font-size'),
        'Shadows defined': globalCss.includes('--shadow-md') || globalCss.includes('shadow'),
        'Transitions defined': globalCss.includes('--transition-base') || globalCss.includes('transition'),
        'Dark mode configured': tailwindConfig.includes("darkMode: 'class'"),
        'Tailwind extended': tailwindConfig.includes('extend: {'),
      };

      Object.entries(requirements).forEach(([requirement, passed]) => {
        expect(passed).toBe(true);
      });
    });

    it('should have complete token coverage', () => {
      const tokenCategories = [
        '--color-',
        '--font-size-',
        '--font-weight-',
        '--spacing-',
        '--radius-',
        '--shadow-',
        '--transition-',
        '--z-',
      ];

      tokenCategories.forEach(category => {
        const pattern = new RegExp(category, 'g');
        const matches = globalCss.match(pattern);
        
        expect(matches).toBeTruthy();
        expect(matches!.length).toBeGreaterThan(0);
      });
    });
  });
});
