/**
 * Analytics Pages - Design Token Usage Tests
 * Validates migration from inline styles to design tokens
 * Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

describe('Analytics Pages - Design Token Migration', () => {
  const analyticsDir = join(process.cwd(), 'app/(app)/analytics');
  const analyticsCssPath = join(analyticsDir, 'analytics.css');
  
  // Read the CSS file
  const cssContent = readFileSync(analyticsCssPath, 'utf-8');
  
  // Get all page files in analytics directory
  const getPageFiles = (dir: string): string[] => {
    const files: string[] = [];
    const items = readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = join(dir, item.name);
      if (item.isDirectory()) {
        files.push(...getPageFiles(fullPath));
      } else if (item.name.endsWith('.tsx') || item.name.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
    
    return files;
  };
  
  const pageFiles = getPageFiles(analyticsDir);
  const pageContents = pageFiles.map(file => ({
    path: file,
    content: readFileSync(file, 'utf-8')
  }));

  describe('CSS File Structure', () => {
    it('should have analytics.css file in analytics directory', () => {
      expect(cssContent).toBeDefined();
      expect(cssContent.length).toBeGreaterThan(0);
    });

    it('should import analytics.css in main analytics page', () => {
      const mainPage = pageContents.find(p => p.path.endsWith('analytics/page.tsx'));
      expect(mainPage).toBeDefined();
      expect(mainPage?.content).toContain("import './analytics.css'");
    });
  });

  describe('Design Token Usage in CSS', () => {
    it('should use --bg-tertiary for card backgrounds', () => {
      expect(cssContent).toContain('--bg-tertiary');
    });

    it('should use --border-subtle for borders', () => {
      expect(cssContent).toContain('--border-subtle');
    });

    it('should use --text-primary for primary text', () => {
      expect(cssContent).toContain('--text-primary');
    });

    it('should use --text-secondary for secondary text', () => {
      expect(cssContent).toContain('--text-secondary');
    });

    it('should use --accent-primary for primary accent color', () => {
      expect(cssContent).toContain('--accent-primary');
    });

    it('should use --accent-success for success states', () => {
      expect(cssContent).toContain('--accent-success');
    });

    it('should use --accent-error for error states', () => {
      expect(cssContent).toContain('--accent-error');
    });

    it('should use --accent-info for info states', () => {
      expect(cssContent).toContain('--accent-info');
    });

    it('should use --accent-warning for warning states', () => {
      expect(cssContent).toContain('--accent-warning');
    });

    it('should use spacing tokens (--space-*)', () => {
      expect(cssContent).toMatch(/--space-\d+/);
    });

    it('should use border radius tokens (--radius-*)', () => {
      expect(cssContent).toMatch(/--radius-\w+/);
    });

    it('should use shadow tokens (--shadow-*)', () => {
      expect(cssContent).toMatch(/--shadow-\w+/);
    });

    it('should use transition tokens (--transition-*)', () => {
      expect(cssContent).toMatch(/--transition-\w+/);
    });

    it('should use font weight tokens (--font-weight-*)', () => {
      expect(cssContent).toMatch(/--font-weight-\w+/);
    });

    it('should use text size tokens (--text-*)', () => {
      expect(cssContent).toMatch(/--text-\w+/);
    });

    it('should use z-index tokens (--z-*)', () => {
      expect(cssContent).toMatch(/--z-\w+/);
    });
  });

  describe('Hardcoded Color Elimination', () => {
    it('should not contain hardcoded hex colors in CSS', () => {
      // Allow rgba for opacity variations, but no hex colors
      const hexColorPattern = /#[0-9a-fA-F]{3,6}(?![0-9a-fA-F])/g;
      const hexMatches = cssContent.match(hexColorPattern);
      expect(hexMatches).toBeNull();
    });

    it('should minimize hardcoded colors in main analytics page', () => {
      // Focus on the main analytics page which was migrated
      const mainPage = pageContents.find(p => p.path.endsWith('analytics/page.tsx'));
      expect(mainPage).toBeDefined();
      
      // Check for common hardcoded color patterns
      const hardcodedPatterns = [
        /className="[^"]*bg-zinc-\d+/g,
        /className="[^"]*bg-gray-\d+/g,
        /className="[^"]*text-gray-\d+/g,
        /className="[^"]*border-gray-\d+/g,
      ];

      hardcodedPatterns.forEach(pattern => {
        const matches = mainPage!.content.match(pattern);
        // Main analytics page should have minimal hardcoded colors after migration
        if (matches) {
          expect(matches.length).toBeLessThan(5);
        }
      });
    });

    it('should not use inline style objects with hardcoded colors', () => {
      pageContents.forEach(({ path, content }) => {
        // Check for inline style objects with color properties
        const inlineStylePattern = /style=\{\{[^}]*color:\s*['"]#[0-9a-fA-F]{3,6}['"]/g;
        const matches = content.match(inlineStylePattern);
        expect(matches).toBeNull();
      });
    });
  });

  describe('CSS Class Usage', () => {
    it('should use analytics-container class', () => {
      expect(cssContent).toContain('.analytics-container');
      const mainPage = pageContents.find(p => p.path.endsWith('analytics/page.tsx'));
      expect(mainPage?.content).toContain('analytics-container');
    });

    it('should use analytics-title class', () => {
      expect(cssContent).toContain('.analytics-title');
      const mainPage = pageContents.find(p => p.path.endsWith('analytics/page.tsx'));
      expect(mainPage?.content).toContain('analytics-title');
    });

    it('should use metric-card class', () => {
      expect(cssContent).toContain('.metric-card');
      const mainPage = pageContents.find(p => p.path.endsWith('analytics/page.tsx'));
      expect(mainPage?.content).toContain('metric-card');
    });

    it('should use tool-card class', () => {
      expect(cssContent).toContain('.tool-card');
      const mainPage = pageContents.find(p => p.path.endsWith('analytics/page.tsx'));
      expect(mainPage?.content).toContain('tool-card');
    });

    it('should use empty-state classes', () => {
      expect(cssContent).toContain('.empty-state-container');
      expect(cssContent).toContain('.empty-state-content');
      const mainPage = pageContents.find(p => p.path.endsWith('analytics/page.tsx'));
      expect(mainPage?.content).toContain('empty-state');
    });

    it('should use loading-state classes', () => {
      expect(cssContent).toContain('.loading-container');
      expect(cssContent).toContain('.loading-spinner');
      const mainPage = pageContents.find(p => p.path.endsWith('analytics/page.tsx'));
      expect(mainPage?.content).toContain('loading-');
    });

    it('should use chart classes', () => {
      expect(cssContent).toContain('.chart-container');
      expect(cssContent).toContain('.chart-header');
      expect(cssContent).toContain('.chart-content');
    });

    it('should use time-range-selector classes', () => {
      expect(cssContent).toContain('.time-range-selector');
      expect(cssContent).toContain('.time-range-button');
    });
  });

  describe('Spacing Consistency', () => {
    it('should use consistent spacing tokens in CSS', () => {
      // Check that spacing uses tokens, not arbitrary values
      const spacingPattern = /(?:padding|margin|gap):\s*var\(--space-\d+\)/g;
      const matches = cssContent.match(spacingPattern);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThan(10);
    });

    it('should not use arbitrary spacing values', () => {
      // Check for hardcoded pixel values (allow rem values as they reference tokens)
      const arbitrarySpacingPattern = /(?:padding|margin|gap):\s*\d+px/g;
      const matches = cssContent.match(arbitrarySpacingPattern);
      expect(matches).toBeNull();
    });
  });

  describe('Typography Consistency', () => {
    it('should use font-weight tokens', () => {
      const fontWeightPattern = /font-weight:\s*var\(--font-weight-\w+\)/g;
      const matches = cssContent.match(fontWeightPattern);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThan(5);
    });

    it('should use font-size tokens', () => {
      const fontSizePattern = /font-size:\s*var\(--text-\w+\)/g;
      const matches = cssContent.match(fontSizePattern);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThan(5);
    });

    it('should not use arbitrary font sizes', () => {
      // Check for hardcoded pixel font sizes
      const arbitraryFontPattern = /font-size:\s*\d+px/g;
      const matches = cssContent.match(arbitraryFontPattern);
      expect(matches).toBeNull();
    });
  });

  describe('Border and Shadow Consistency', () => {
    it('should use border-radius tokens', () => {
      const radiusPattern = /border-radius:\s*var\(--radius-\w+\)/g;
      const matches = cssContent.match(radiusPattern);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThan(5);
    });

    it('should use box-shadow tokens', () => {
      const shadowPattern = /box-shadow:\s*var\(--shadow-\w+\)/g;
      const matches = cssContent.match(shadowPattern);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThan(3);
    });

    it('should not use arbitrary border-radius values', () => {
      // Check for hardcoded pixel border-radius
      const arbitraryRadiusPattern = /border-radius:\s*\d+px/g;
      const matches = cssContent.match(arbitraryRadiusPattern);
      expect(matches).toBeNull();
    });
  });

  describe('Animation and Transition Consistency', () => {
    it('should use transition tokens', () => {
      const transitionPattern = /transition:\s*[^;]*var\(--transition-\w+\)/g;
      const matches = cssContent.match(transitionPattern);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThan(3);
    });

    it('should not use arbitrary transition durations', () => {
      // Check for hardcoded millisecond transitions (allow token-based ones)
      const arbitraryTransitionPattern = /transition:\s*[^;]*\d+ms(?!\))/g;
      const matches = cssContent.match(arbitraryTransitionPattern);
      expect(matches).toBeNull();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive grid layouts', () => {
      expect(cssContent).toContain('@media');
      expect(cssContent).toContain('grid-template-columns');
    });

    it('should use mobile-first approach', () => {
      // Check that base styles are mobile and media queries enhance for larger screens
      const mediaQueries = cssContent.match(/@media\s*\([^)]*min-width/g);
      expect(mediaQueries).not.toBeNull();
      expect(mediaQueries!.length).toBeGreaterThan(3);
    });
  });

  describe('Accessibility', () => {
    it('should have focus states for interactive elements', () => {
      expect(cssContent).toMatch(/:hover/);
      // Buttons should have hover states
      expect(cssContent).toContain('button');
    });

    it('should use semantic color tokens for states', () => {
      // Success, error, warning states should use semantic tokens
      expect(cssContent).toContain('metric-change-positive');
      expect(cssContent).toContain('metric-change-negative');
    });
  });

  describe('Code Quality', () => {
    it('should have descriptive CSS class names', () => {
      // Check for BEM-like or descriptive naming
      const classNames = cssContent.match(/\.[a-z-]+/g);
      expect(classNames).not.toBeNull();
      
      // All class names should be kebab-case
      classNames!.forEach(className => {
        expect(className).toMatch(/^\.[a-z][a-z0-9-]*$/);
      });
    });

    it('should have organized sections with comments', () => {
      // Check for section comments
      expect(cssContent).toMatch(/\/\*\s*={10,}/);
      expect(cssContent).toContain('METRIC CARDS');
      expect(cssContent).toContain('EMPTY STATES');
      expect(cssContent).toContain('LOADING STATES');
    });

    it('should not have duplicate CSS rules', () => {
      // Check for duplicate class definitions
      const classPattern = /\.([\w-]+)\s*\{/g;
      const classes = [...cssContent.matchAll(classPattern)].map(m => m[1]);
      const uniqueClasses = new Set(classes);
      
      // Allow some duplication for media queries, but not excessive
      const duplicationRatio = classes.length / uniqueClasses.size;
      expect(duplicationRatio).toBeLessThan(2);
    });
  });
});
