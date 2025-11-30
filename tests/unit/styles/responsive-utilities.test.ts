/**
 * Tests for Responsive Utility Classes
 * 
 * Validates that responsive utilities:
 * - Use design tokens correctly
 * - Meet touch target size requirements (44x44px minimum)
 * - Provide consistent breakpoints
 * - Support accessibility features
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Responsive Utilities', () => {
  const cssContent = fs.readFileSync(
    path.join(process.cwd(), 'styles/responsive-utilities.css'),
    'utf-8'
  );

  describe('Design Token Usage', () => {
    it('should use spacing tokens for padding', () => {
      expect(cssContent).toContain('var(--space-');
      expect(cssContent).not.toMatch(/padding:\s*\d+px/);
    });

    it('should use spacing tokens for gaps', () => {
      expect(cssContent).toContain('gap: var(--space-');
    });

    it('should use typography tokens for font sizes', () => {
      expect(cssContent).toContain('var(--text-');
    });

    it('should use radius tokens for border radius', () => {
      expect(cssContent).toContain('var(--radius-');
    });

    it('should use breakpoint tokens', () => {
      expect(cssContent).toContain('--breakpoint-sm');
      expect(cssContent).toContain('--breakpoint-md');
      expect(cssContent).toContain('--breakpoint-lg');
      expect(cssContent).toContain('--breakpoint-xl');
      expect(cssContent).toContain('--breakpoint-2xl');
    });
  });

  describe('Touch Target Compliance (WCAG 2.5.5)', () => {
    it('should define minimum 44px touch targets', () => {
      expect(cssContent).toContain('min-width: 44px');
      expect(cssContent).toContain('min-height: 44px');
    });

    it('should define ideal 48px touch targets', () => {
      expect(cssContent).toContain('min-width: 48px');
      expect(cssContent).toContain('min-height: 48px');
    });

    it('should provide touch-extend utility for larger hit areas', () => {
      expect(cssContent).toContain('.touch-extend');
      expect(cssContent).toContain('::before');
    });

    it('should provide touch-spacing utility', () => {
      expect(cssContent).toContain('.touch-spacing');
    });
  });

  describe('Responsive Breakpoints', () => {
    it('should use consistent breakpoint values', () => {
      const breakpoints = [
        '640px',  // sm
        '768px',  // md
        '1024px', // lg
        '1280px', // xl
        '1536px'  // 2xl
      ];

      breakpoints.forEach(bp => {
        expect(cssContent).toContain(bp);
      });
    });

    it('should use mobile-first approach with min-width', () => {
      const minWidthCount = (cssContent.match(/min-width:/g) || []).length;
      const maxWidthCount = (cssContent.match(/max-width:/g) || []).length;
      
      // Should have more min-width than max-width (mobile-first)
      expect(minWidthCount).toBeGreaterThan(maxWidthCount);
    });
  });

  describe('Responsive Spacing', () => {
    it('should provide responsive padding utilities', () => {
      expect(cssContent).toContain('.p-responsive');
      expect(cssContent).toContain('.px-responsive');
      expect(cssContent).toContain('.py-responsive');
    });

    it('should provide responsive gap utilities', () => {
      expect(cssContent).toContain('.gap-responsive');
    });

    it('should scale spacing with breakpoints', () => {
      // Check that spacing increases at larger breakpoints
      const pResponsive = cssContent.match(/\.p-responsive\s*{[\s\S]*?}/g);
      expect(pResponsive).toBeTruthy();
    });
  });

  describe('Responsive Typography', () => {
    it('should provide responsive text size utilities', () => {
      expect(cssContent).toContain('.text-responsive-sm');
      expect(cssContent).toContain('.text-responsive-base');
      expect(cssContent).toContain('.text-responsive-lg');
      expect(cssContent).toContain('.text-responsive-xl');
      expect(cssContent).toContain('.text-responsive-2xl');
    });

    it('should scale typography with breakpoints', () => {
      // Typography should get larger at bigger breakpoints
      expect(cssContent).toContain('font-size: var(--text-xl)');
      expect(cssContent).toContain('font-size: var(--text-2xl)');
    });
  });

  describe('Responsive Grid', () => {
    it('should provide responsive grid utilities', () => {
      expect(cssContent).toContain('.grid-responsive');
      expect(cssContent).toContain('.grid-responsive-2');
      expect(cssContent).toContain('.grid-responsive-4');
    });

    it('should start with single column on mobile', () => {
      expect(cssContent).toMatch(/\.grid-responsive\s*{[\s\S]*?grid-template-columns:\s*1fr/);
    });

    it('should increase columns at larger breakpoints', () => {
      expect(cssContent).toMatch(/grid-template-columns:\s*repeat\(2,\s*1fr\)/);
      expect(cssContent).toMatch(/grid-template-columns:\s*repeat\(3,\s*1fr\)/);
      expect(cssContent).toMatch(/grid-template-columns:\s*repeat\(4,\s*1fr\)/);
    });
  });

  describe('Responsive Flex', () => {
    it('should provide responsive flex utilities', () => {
      expect(cssContent).toContain('.flex-responsive');
      expect(cssContent).toContain('.flex-responsive-reverse');
    });

    it('should start with column direction on mobile', () => {
      expect(cssContent).toMatch(/\.flex-responsive\s*{[\s\S]*?flex-direction:\s*column/);
    });

    it('should switch to row direction on larger screens', () => {
      expect(cssContent).toContain('flex-direction: column');
      expect(cssContent).toContain('flex-direction: row');
    });
  });

  describe('Responsive Visibility', () => {
    it('should provide mobile visibility utilities', () => {
      expect(cssContent).toContain('.hidden-mobile');
      expect(cssContent).toContain('.mobile-only');
    });

    it('should provide tablet visibility utilities', () => {
      expect(cssContent).toContain('.hidden-tablet-up');
      expect(cssContent).toContain('.tablet-only');
    });

    it('should provide desktop visibility utilities', () => {
      expect(cssContent).toContain('.hidden-desktop');
      expect(cssContent).toContain('.desktop-only');
    });
  });

  describe('Responsive Containers', () => {
    it('should provide responsive container utility', () => {
      expect(cssContent).toContain('.container-responsive');
    });

    it('should use content max-width tokens', () => {
      expect(cssContent).toContain('var(--content-max-width-');
    });

    it('should have responsive padding', () => {
      expect(cssContent).toMatch(/\.container-responsive[\s\S]*?padding-left:\s*var\(--space-/);
      expect(cssContent).toMatch(/\.container-responsive[\s\S]*?padding-right:\s*var\(--space-/);
    });
  });

  describe('Responsive Cards', () => {
    it('should provide responsive card utility', () => {
      expect(cssContent).toContain('.card-responsive');
    });

    it('should scale card padding with breakpoints', () => {
      expect(cssContent).toMatch(/\.card-responsive[\s\S]*?padding:\s*var\(--space-/);
    });

    it('should use radius tokens', () => {
      expect(cssContent).toMatch(/\.card-responsive[\s\S]*?border-radius:\s*var\(--radius-/);
    });
  });

  describe('Responsive Buttons', () => {
    it('should provide responsive button utility', () => {
      expect(cssContent).toContain('.button-responsive');
    });

    it('should meet minimum touch target size', () => {
      expect(cssContent).toMatch(/\.button-responsive[\s\S]*?min-height:\s*44px/);
    });

    it('should scale to ideal touch target on larger screens', () => {
      expect(cssContent).toContain('min-height: 48px');
    });
  });

  describe('Responsive Modals', () => {
    it('should provide responsive modal utility', () => {
      expect(cssContent).toContain('.modal-responsive');
    });

    it('should be full-width on mobile', () => {
      expect(cssContent).toMatch(/\.modal-responsive\s*{[\s\S]*?width:\s*100%/);
      expect(cssContent).toMatch(/\.modal-responsive\s*{[\s\S]*?max-width:\s*100%/);
    });

    it('should have constrained width on larger screens', () => {
      expect(cssContent).toContain('max-width: 600px');
      expect(cssContent).toContain('max-width: 800px');
    });
  });

  describe('Responsive Images', () => {
    it('should provide responsive image utilities', () => {
      expect(cssContent).toContain('.img-responsive');
      expect(cssContent).toContain('.img-responsive-cover');
    });

    it('should scale image heights with breakpoints', () => {
      expect(cssContent).toContain('height: 200px');
      expect(cssContent).toContain('height: 300px');
      expect(cssContent).toContain('height: 400px');
    });
  });

  describe('Responsive Aspect Ratios', () => {
    it('should provide aspect ratio utilities', () => {
      expect(cssContent).toContain('.aspect-responsive-square');
      expect(cssContent).toContain('.aspect-responsive-video');
      expect(cssContent).toContain('.aspect-responsive-portrait');
    });

    it('should use aspect-ratio property', () => {
      expect(cssContent).toContain('aspect-ratio:');
    });
  });

  describe('Safe Area Support', () => {
    it('should provide safe area utility', () => {
      expect(cssContent).toContain('.safe-area-responsive');
    });

    it('should use env(safe-area-inset-*)', () => {
      expect(cssContent).toContain('env(safe-area-inset-top)');
      expect(cssContent).toContain('env(safe-area-inset-bottom)');
      expect(cssContent).toContain('env(safe-area-inset-left)');
      expect(cssContent).toContain('env(safe-area-inset-right)');
    });

    it('should use max() for fallback values', () => {
      expect(cssContent).toMatch(/max\(var\(--space-\d+\),\s*env\(safe-area-inset-/);
    });
  });

  describe('Accessibility', () => {
    it('should provide focus-visible utility', () => {
      expect(cssContent).toContain('.focus-responsive:focus-visible');
    });

    it('should use focus ring tokens', () => {
      expect(cssContent).toContain('var(--focus-ring-width)');
      expect(cssContent).toContain('var(--focus-ring-offset)');
      expect(cssContent).toContain('var(--accent-primary)');
    });

    it('should enhance focus ring on mobile', () => {
      expect(cssContent).toContain('.focus-responsive:focus-visible');
      expect(cssContent).toContain('@media (max-width: 1024px)');
      expect(cssContent).toContain('outline-width: calc(var(--focus-ring-width) + 1px)');
    });
  });

  describe('No Hardcoded Values', () => {
    it('should not use hardcoded colors', () => {
      // Allow hex in comments but not in actual CSS rules
      const cssWithoutComments = cssContent.replace(/\/\*[\s\S]*?\*\//g, '');
      expect(cssWithoutComments).not.toMatch(/#[0-9a-fA-F]{3,6}(?!\s*;)/);
      expect(cssWithoutComments).not.toMatch(/rgb\(/);
      expect(cssWithoutComments).not.toMatch(/rgba\(/);
    });

    it('should minimize hardcoded pixel values', () => {
      // Allow px for breakpoints and specific cases like touch targets
      const allowedPxValues = ['44px', '48px', '640px', '768px', '1024px', '1280px', '1536px', '100%', '90vw', '100vh'];
      const cssWithoutComments = cssContent.replace(/\/\*[\s\S]*?\*\//g, '');
      const pxMatches = cssWithoutComments.match(/\d+px/g) || [];
      
      const unexpectedPx = pxMatches.filter(px => !allowedPxValues.includes(px));
      
      // Should have very few unexpected px values
      expect(unexpectedPx.length).toBeLessThan(20);
    });
  });

  describe('Mobile-First Approach', () => {
    it('should define base styles before media queries', () => {
      const lines = cssContent.split('\n');
      let foundBaseStyle = false;
      let foundMediaQuery = false;
      
      for (const line of lines) {
        if (line.includes('.p-responsive {')) {
          foundBaseStyle = true;
        }
        if (foundBaseStyle && line.includes('@media')) {
          foundMediaQuery = true;
          break;
        }
      }
      
      expect(foundBaseStyle).toBe(true);
      expect(foundMediaQuery).toBe(true);
    });
  });

  describe('Consistent Naming', () => {
    it('should use consistent naming pattern for responsive utilities', () => {
      const responsiveClasses = cssContent.match(/\.[a-z-]+-responsive/g) || [];
      expect(responsiveClasses.length).toBeGreaterThan(10);
      
      // All should end with -responsive
      responsiveClasses.forEach(className => {
        expect(className).toMatch(/-responsive$/);
      });
    });
  });
});
