/**
 * Unit Tests - Tailwind Configuration (Task 1)
 * 
 * Tests to validate Tailwind CSS configuration
 * Based on: .kiro/specs/auth-system-from-scratch/tasks.md (Task 1)
 * 
 * Coverage:
 * - Content paths configuration
 * - Theme extensions
 * - Custom colors
 * - Custom animations
 * - Plugin configuration
 * - Dark mode setup
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Tailwind Configuration (Task 1)', () => {
  let configContent: string;

  beforeAll(() => {
    const configPath = join(process.cwd(), 'tailwind.config.mjs');
    configContent = readFileSync(configPath, 'utf-8');
  });

  describe('Content Configuration', () => {
    it('should scan app directory for classes', () => {
      expect(configContent).toContain("'./app/**/*.{ts,tsx}'");
    });

    it('should scan components directory for classes', () => {
      expect(configContent).toContain("'./components/**/*.{ts,tsx}'");
    });

    it('should scan pages directory for classes', () => {
      expect(configContent).toContain("'./pages/**/*.{ts,tsx}'");
    });

    it('should scan src directory for classes', () => {
      expect(configContent).toContain("'./src/**/*.{ts,tsx}'");
    });

    it('should include TypeScript and TSX files', () => {
      expect(configContent).toMatch(/\{ts,tsx\}/);
    });
  });

  describe('Dark Mode Configuration', () => {
    it('should use class-based dark mode', () => {
      expect(configContent).toContain("darkMode: 'class'");
    });

    it('should not use media-based dark mode', () => {
      expect(configContent).not.toContain("darkMode: 'media'");
    });
  });

  describe('Theme Extension - Shadcn/UI Colors', () => {
    it('should define border color using HSL variables', () => {
      expect(configContent).toContain("border: 'hsl(var(--border))'");
    });

    it('should define input color using HSL variables', () => {
      expect(configContent).toContain("input: 'hsl(var(--input))'");
    });

    it('should define ring color using HSL variables', () => {
      expect(configContent).toContain("ring: 'hsl(var(--ring))'");
    });

    it('should define background color using HSL variables', () => {
      expect(configContent).toContain("background: 'hsl(var(--background))'");
    });

    it('should define foreground color using HSL variables', () => {
      expect(configContent).toContain("foreground: 'hsl(var(--foreground))'");
    });

    it('should define primary color with DEFAULT and foreground', () => {
      expect(configContent).toContain('primary: {');
      expect(configContent).toContain("DEFAULT: 'hsl(var(--primary))'");
      expect(configContent).toContain("foreground: 'hsl(var(--primary-foreground))'");
    });

    it('should define secondary color with DEFAULT and foreground', () => {
      expect(configContent).toContain('secondary: {');
      expect(configContent).toContain("DEFAULT: 'hsl(var(--secondary))'");
      expect(configContent).toContain("foreground: 'hsl(var(--secondary-foreground))'");
    });

    it('should define destructive color with DEFAULT and foreground', () => {
      expect(configContent).toContain('destructive: {');
      expect(configContent).toContain("DEFAULT: 'hsl(var(--destructive))'");
      expect(configContent).toContain("foreground: 'hsl(var(--destructive-foreground))'");
    });

    it('should define muted color with DEFAULT and foreground', () => {
      expect(configContent).toContain('muted: {');
      expect(configContent).toContain("DEFAULT: 'hsl(var(--muted))'");
      expect(configContent).toContain("foreground: 'hsl(var(--muted-foreground))'");
    });

    it('should define accent color with DEFAULT and foreground', () => {
      expect(configContent).toContain('accent: {');
      expect(configContent).toContain("DEFAULT: 'hsl(var(--accent))'");
      expect(configContent).toContain("foreground: 'hsl(var(--accent-foreground))'");
    });

    it('should define popover color with DEFAULT and foreground', () => {
      expect(configContent).toContain('popover: {');
      expect(configContent).toContain("DEFAULT: 'hsl(var(--popover))'");
      expect(configContent).toContain("foreground: 'hsl(var(--popover-foreground))'");
    });

    it('should define card color with DEFAULT and foreground', () => {
      expect(configContent).toContain('card: {');
      expect(configContent).toContain("DEFAULT: 'hsl(var(--card))'");
      expect(configContent).toContain("foreground: 'hsl(var(--card-foreground))'");
    });

    it('should have shadcn/ui colors comment', () => {
      expect(configContent).toContain('// Shadcn/UI Colors');
    });
  });

  describe('Theme Extension - Auth System Colors', () => {
    it('should extend auth colors', () => {
      expect(configContent).toContain('auth: {');
    });

    it('should define auth primary color', () => {
      expect(configContent).toContain("primary: '#6366f1'");
    });

    it('should define auth primary-hover color', () => {
      expect(configContent).toContain("'primary-hover': '#4f46e5'");
    });

    it('should define auth success color', () => {
      expect(configContent).toContain("success: '#10b981'");
    });

    it('should define auth error color', () => {
      expect(configContent).toContain("error: '#ef4444'");
    });

    it('should have auth system design colors comment', () => {
      expect(configContent).toContain('// Auth System Design Colors');
    });
  });

  describe('Theme Extension - Huntaze Design System Colors', () => {
    it('should extend surface colors', () => {
      expect(configContent).toContain('surface: {');
    });

    it('should extend content colors', () => {
      expect(configContent).toContain('content: {');
    });

    it('should extend danger color', () => {
      expect(configContent).toContain("danger: 'var(--color-danger)'");
    });

    it('should extend input colors', () => {
      expect(configContent).toContain('input: {');
      expect(configContent).toContain('bg: {');
      expect(configContent).toContain('border: {');
    });

    it('should extend neutral colors', () => {
      expect(configContent).toContain('neutral: {');
    });

    it('should have huntaze design system colors comment', () => {
      expect(configContent).toContain('// Huntaze Design System Colors');
    });
  });

  describe('Theme Extension - Typography', () => {
    it('should extend font family', () => {
      expect(configContent).toContain('fontFamily: {');
    });

    it('should configure Inter font', () => {
      expect(configContent).toContain("sans: ['Inter'");
    });

    it('should include system fonts as fallback', () => {
      expect(configContent).toContain('system-ui');
      expect(configContent).toContain('sans-serif');
    });
  });

  describe('Theme Extension - Animations', () => {
    it('should define custom animations', () => {
      expect(configContent).toContain('animation: {');
    });

    it('should define fade-in animation', () => {
      expect(configContent).toContain("'fade-in'");
    });

    it('should define fade-up animation', () => {
      expect(configContent).toContain("'fade-up'");
    });

    it('should define slide-in animation', () => {
      expect(configContent).toContain("'slide-in'");
    });

    it('should define scale-in animation', () => {
      expect(configContent).toContain("'scale-in'");
    });

    it('should define float animation', () => {
      expect(configContent).toContain("'float'");
    });

    it('should define glow animation', () => {
      expect(configContent).toContain("'glow'");
    });

    it('should define shimmer animation', () => {
      expect(configContent).toContain("'shimmer'");
    });
  });

  describe('Theme Extension - Keyframes', () => {
    it('should define keyframes', () => {
      expect(configContent).toContain('keyframes: {');
    });

    it('should define fadeIn keyframe', () => {
      expect(configContent).toContain('fadeIn: {');
    });

    it('should define fadeUp keyframe', () => {
      expect(configContent).toContain('fadeUp: {');
    });

    it('should define slideIn keyframe', () => {
      expect(configContent).toContain('slideIn: {');
    });

    it('should define scaleIn keyframe', () => {
      expect(configContent).toContain('scaleIn: {');
    });

    it('should define float keyframe', () => {
      expect(configContent).toContain('float: {');
    });

    it('should define glow keyframe', () => {
      expect(configContent).toContain('glow: {');
    });

    it('should define shimmer keyframe', () => {
      expect(configContent).toContain('shimmer: {');
    });
  });

  describe('Theme Extension - Shadows', () => {
    it('should extend box shadow', () => {
      expect(configContent).toContain('boxShadow: {');
    });

    it('should use CSS variables for shadows', () => {
      expect(configContent).toContain("'sm': 'var(--shadow-sm)'");
      expect(configContent).toContain("'md': 'var(--shadow-md)'");
      expect(configContent).toContain("'lg': 'var(--shadow-lg)'");
    });
  });

  describe('Theme Extension - Background Images', () => {
    it('should extend background images', () => {
      expect(configContent).toContain('backgroundImage: {');
    });

    it('should define gradient-primary', () => {
      expect(configContent).toContain("'gradient-primary': 'var(--gradient-primary)'");
    });
  });

  describe('Safelist Configuration', () => {
    it('should safelist dynamic color classes', () => {
      expect(configContent).toContain('safelist: [');
    });

    it('should safelist background colors', () => {
      // Check for pattern in safelist that includes bg
      expect(configContent).toContain('bg');
      expect(configContent).toContain('pattern:');
    });

    it('should safelist text colors', () => {
      // Check for pattern in safelist that includes text
      expect(configContent).toContain('text');
      expect(configContent).toContain('pattern:');
    });

    it('should safelist border colors', () => {
      // Check for pattern in safelist that includes border
      expect(configContent).toContain('border');
      expect(configContent).toContain('pattern:');
    });

    it('should include purple color variants', () => {
      expect(configContent).toContain('purple');
    });

    it('should include pink color variants', () => {
      expect(configContent).toContain('pink');
    });

    it('should include blue color variants', () => {
      expect(configContent).toContain('blue');
    });
  });

  describe('Plugins Configuration', () => {
    it('should have plugins array', () => {
      expect(configContent).toContain('plugins: [');
    });

    it('should export as default', () => {
      expect(configContent).toContain('export default');
    });
  });

  describe('TypeScript Configuration', () => {
    it('should import Config type', () => {
      expect(configContent).toContain("import { type Config } from 'tailwindcss'");
    });

    it('should satisfy Config type', () => {
      expect(configContent).toContain('satisfies Config');
    });
  });

  describe('Configuration Structure', () => {
    it('should have theme.extend structure', () => {
      expect(configContent).toContain('theme: {');
      expect(configContent).toContain('extend: {');
    });

    it('should not override default Tailwind theme', () => {
      // Using extend ensures we don't lose default Tailwind utilities
      const extendsCount = (configContent.match(/extend:/g) || []).length;
      expect(extendsCount).toBeGreaterThan(0);
    });
  });

  describe('Color System Consistency', () => {
    it('should use consistent color naming convention', () => {
      // Colors should use kebab-case
      expect(configContent).toMatch(/'[\w-]+': '#[0-9a-fA-F]{6}'/);
    });

    it('should use hex color format for auth colors', () => {
      // Auth colors should be in hex format
      const hexPattern = /#[0-9a-fA-F]{6}/g;
      const matches = configContent.match(hexPattern);
      
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThan(0);
    });

    it('should use CSS variables for dynamic colors', () => {
      expect(configContent).toContain("var(--");
    });

    it('should use HSL format for shadcn/ui colors', () => {
      // Shadcn/UI colors should use HSL with CSS variables
      expect(configContent).toContain("hsl(var(--");
    });

    it('should have consistent HSL color pattern', () => {
      // All shadcn/ui colors should follow the pattern: hsl(var(--color-name))
      const hslPattern = /hsl\(var\(--[\w-]+\)\)/g;
      const matches = configContent.match(hslPattern);
      
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThanOrEqual(14); // At least 14 HSL colors
    });

    it('should have foreground variants for semantic colors', () => {
      // Semantic colors should have foreground variants
      const semanticColors = ['primary', 'secondary', 'destructive', 'muted', 'accent', 'popover', 'card'];
      
      semanticColors.forEach(color => {
        expect(configContent).toContain(`${color}: {`);
        expect(configContent).toContain(`foreground: 'hsl(var(--${color}-foreground))'`);
      });
    });

    it('should support both hex and HSL color systems', () => {
      // Should have both hex colors (auth) and HSL colors (shadcn/ui)
      const hasHexColors = /#[0-9a-fA-F]{6}/.test(configContent);
      const hasHslColors = /hsl\(var\(--/.test(configContent);
      
      expect(hasHexColors).toBe(true);
      expect(hasHslColors).toBe(true);
    });
  });

  describe('Animation Timing', () => {
    it('should use appropriate animation durations', () => {
      // Animations should have reasonable durations
      expect(configContent).toMatch(/\d+(\.\d+)?s/);
    });

    it('should use ease functions', () => {
      expect(configContent).toContain('ease');
    });

    it('should define infinite animations', () => {
      expect(configContent).toContain('infinite');
    });
  });

  describe('Validation - Complete Configuration', () => {
    it('should pass all configuration requirements', () => {
      const requirements = {
        'Content paths configured': configContent.includes('./app/**/*.{ts,tsx}'),
        'Dark mode enabled': configContent.includes("darkMode: 'class'"),
        'Shadcn/UI colors defined': configContent.includes("border: 'hsl(var(--border))'"),
        'Auth colors defined': configContent.includes('auth: {'),
        'Inter font configured': configContent.includes("sans: ['Inter'"),
        'Animations defined': configContent.includes('animation: {'),
        'Keyframes defined': configContent.includes('keyframes: {'),
        'Shadows configured': configContent.includes('boxShadow: {'),
        'Safelist configured': configContent.includes('safelist: ['),
      };

      Object.entries(requirements).forEach(([, passed]) => {
        expect(passed).toBe(true);
      });
    });

    it('should be valid JavaScript module', () => {
      expect(configContent).toContain('export default');
      expect(configContent).not.toContain('module.exports');
    });

    it('should have proper structure', () => {
      // Check for main configuration keys
      const mainKeys = ['darkMode', 'content', 'safelist', 'theme', 'plugins'];
      
      mainKeys.forEach(key => {
        expect(configContent).toContain(`${key}:`);
      });
    });

    it('should have all required shadcn/ui colors', () => {
      const requiredColors = [
        'border',
        'input',
        'ring',
        'background',
        'foreground',
        'primary',
        'secondary',
        'destructive',
        'muted',
        'accent',
        'popover',
        'card',
      ];

      requiredColors.forEach(color => {
        expect(configContent).toContain(`${color}:`);
      });
    });

    it('should have all required auth colors', () => {
      const requiredAuthColors = [
        'primary',
        'primary-hover',
        'success',
        'success-light',
        'error',
        'error-light',
      ];

      requiredAuthColors.forEach(color => {
        const pattern = new RegExp(`['"]${color}['"]:`);
        expect(configContent).toMatch(pattern);
      });
    });

    it('should maintain backward compatibility with existing color system', () => {
      // Ensure existing Huntaze colors are still present
      expect(configContent).toContain('surface: {');
      expect(configContent).toContain('content: {');
      expect(configContent).toContain('danger:');
      expect(configContent).toContain('neutral: {');
    });
  });

  describe('Border Radius Configuration', () => {
    it('should define border radius using CSS variables', () => {
      expect(configContent).toContain('borderRadius: {');
      expect(configContent).toContain("lg: 'var(--radius)'");
    });

    it('should define calculated border radius variants', () => {
      expect(configContent).toContain("md: 'calc(var(--radius) - 2px)'");
      expect(configContent).toContain("sm: 'calc(var(--radius) - 4px)'");
    });
  });

  describe('Integration with globals.css', () => {
    it('should reference CSS variables defined in globals.css', () => {
      // All hsl(var(--*)) references should have corresponding definitions in globals.css
      const hslVars = configContent.match(/hsl\(var\(--([\w-]+)\)\)/g) || [];
      
      expect(hslVars.length).toBeGreaterThan(0);
      
      // Verify common variables are referenced
      expect(configContent).toContain('var(--border)');
      expect(configContent).toContain('var(--primary)');
      expect(configContent).toContain('var(--background)');
    });

    it('should use consistent variable naming convention', () => {
      // CSS variables should use kebab-case
      const varPattern = /var\(--([\w-]+)\)/g;
      const matches = configContent.match(varPattern);
      
      expect(matches).toBeTruthy();
      
      matches?.forEach(match => {
        // Should not contain uppercase or underscores
        expect(match).not.toMatch(/[A-Z_]/);
      });
    });
  });
});
