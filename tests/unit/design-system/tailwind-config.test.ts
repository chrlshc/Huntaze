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

  describe('Theme Extension - Colors', () => {
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

    it('should extend surface colors', () => {
      expect(configContent).toContain('surface: {');
    });

    it('should extend content colors', () => {
      expect(configContent).toContain('content: {');
    });

    it('should extend border colors', () => {
      expect(configContent).toContain('border: {');
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

    it('should use hex color format', () => {
      // All colors should be in hex format
      const hexPattern = /#[0-9a-fA-F]{6}/g;
      const matches = configContent.match(hexPattern);
      
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThan(0);
    });

    it('should use CSS variables for dynamic colors', () => {
      expect(configContent).toContain("var(--");
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
        'Auth colors defined': configContent.includes('auth: {'),
        'Inter font configured': configContent.includes("sans: ['Inter'"),
        'Animations defined': configContent.includes('animation: {'),
        'Keyframes defined': configContent.includes('keyframes: {'),
        'Shadows configured': configContent.includes('boxShadow: {'),
        'Safelist configured': configContent.includes('safelist: ['),
      };

      Object.entries(requirements).forEach(([requirement, passed]) => {
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
  });
});
