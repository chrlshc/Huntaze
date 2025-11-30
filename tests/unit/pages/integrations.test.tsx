/**
 * Unit Tests: Integrations Page
 * 
 * Tests design token usage and consistency for the integrations page
 * Validates Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3
 * 
 * @see .kiro/specs/design-system-unification/design.md
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const INTEGRATIONS_CSS_PATH = path.join(process.cwd(), 'app/(app)/integrations/integrations.css');
const INTEGRATION_CARD_PATH = path.join(process.cwd(), 'components/integrations/IntegrationCard.tsx');
const INTEGRATION_ICON_PATH = path.join(process.cwd(), 'components/integrations/IntegrationIcon.tsx');

describe('Integrations Page - Design Token Usage', () => {
  const integrationsCSS = fs.readFileSync(INTEGRATIONS_CSS_PATH, 'utf-8');
  const integrationCardTSX = fs.readFileSync(INTEGRATION_CARD_PATH, 'utf-8');
  const integrationIconTSX = fs.readFileSync(INTEGRATION_ICON_PATH, 'utf-8');

  describe('Background Colors (Requirement 1.1, 3.1)', () => {
    it('should use --bg-primary for main container background', () => {
      expect(integrationsCSS).toContain('background: var(--bg-primary)');
    });

    it('should use --bg-glass for card backgrounds', () => {
      expect(integrationsCSS).toContain('background: var(--bg-glass)');
    });

    it('should use --bg-glass-hover for card hover states', () => {
      expect(integrationsCSS).toContain('background: var(--bg-glass-hover)');
    });

    it('should use --bg-secondary for button backgrounds', () => {
      expect(integrationCardTSX).toContain("background: 'var(--bg-secondary)'");
    });

    it('should use --bg-tertiary for button hover states', () => {
      expect(integrationCardTSX).toContain("background = 'var(--bg-tertiary)'");
    });

    it('should not contain hardcoded background colors in CSS', () => {
      const hardcodedBgPattern = /background:\s*#[0-9a-fA-F]{3,8}(?!\))/g;
      const matches = integrationsCSS.match(hardcodedBgPattern) || [];
      // Filter out comments
      const nonCommentMatches = matches.filter(match => {
        const index = integrationsCSS.indexOf(match);
        const lineStart = integrationsCSS.lastIndexOf('\n', index);
        const line = integrationsCSS.substring(lineStart, index);
        return !line.includes('/*') && !line.includes('//');
      });
      expect(nonCommentMatches.length).toBe(0);
    });
  });

  describe('Text Colors (Requirement 1.4, 2.2)', () => {
    it('should use --text-primary for main headings', () => {
      expect(integrationsCSS).toContain('color: var(--text-primary)');
    });

    it('should use --text-secondary for subtitles and descriptions', () => {
      expect(integrationsCSS).toContain('color: var(--text-secondary)');
    });

    it('should use text color tokens in components', () => {
      expect(integrationCardTSX).toContain("color: 'var(--text-primary)'");
      expect(integrationCardTSX).toContain("color: 'var(--text-secondary)'");
    });

    it('should not contain hardcoded text colors in CSS', () => {
      const hardcodedColorPattern = /color:\s*#[0-9a-fA-F]{3,8}(?!\))/g;
      const matches = integrationsCSS.match(hardcodedColorPattern) || [];
      const nonCommentMatches = matches.filter(match => {
        const index = integrationsCSS.indexOf(match);
        const lineStart = integrationsCSS.lastIndexOf('\n', index);
        const line = integrationsCSS.substring(lineStart, index);
        return !line.includes('/*') && !line.includes('//');
      });
      expect(nonCommentMatches.length).toBe(0);
    });
  });

  describe('Border Colors (Requirement 3.3)', () => {
    it('should use --border-subtle for card borders', () => {
      expect(integrationsCSS).toContain('border: 1px solid var(--border-subtle)');
    });

    it('should use --border-default for hover states', () => {
      expect(integrationsCSS).toContain('border-color: var(--border-default)');
    });

    it('should use border tokens in components', () => {
      expect(integrationCardTSX).toContain("border: '1px solid var(--border-default)'");
      expect(integrationIconTSX).toContain("border: '1px solid var(--border-subtle)'");
    });

    it('should not contain hardcoded border colors', () => {
      const hardcodedBorderPattern = /border(?:-color)?:\s*(?:1px\s+solid\s+)?#[0-9a-fA-F]{3,8}/g;
      const matches = integrationsCSS.match(hardcodedBorderPattern) || [];
      expect(matches.length).toBe(0);
    });
  });

  describe('Spacing System (Requirement 1.5, 2.1)', () => {
    it('should use --space-* tokens for padding', () => {
      expect(integrationsCSS).toContain('padding: var(--space-8) var(--space-4)');
      expect(integrationsCSS).toContain('padding: var(--space-2) var(--space-4)');
      expect(integrationsCSS).toContain('padding: var(--card-padding)');
    });

    it('should use --space-* tokens for margins', () => {
      expect(integrationsCSS).toContain('margin-bottom: var(--space-6)');
      expect(integrationsCSS).toContain('margin-bottom: var(--space-2)');
      expect(integrationsCSS).toContain('margin-top: var(--space-12)');
    });

    it('should use --space-* tokens for gaps', () => {
      expect(integrationsCSS).toContain('gap: var(--space-6)');
      expect(integrationsCSS).toContain('gap: var(--space-4)');
    });

    it('should not use arbitrary spacing values', () => {
      // Check for hardcoded pixel values in padding/margin/gap
      const arbitrarySpacingPattern = /(?:padding|margin|gap):\s*\d+px/g;
      const matches = integrationsCSS.match(arbitrarySpacingPattern) || [];
      expect(matches.length).toBe(0);
    });
  });

  describe('Typography (Requirement 1.4, 2.4)', () => {
    it('should use --font-display for headings', () => {
      expect(integrationsCSS).toContain('font-family: var(--font-display)');
    });

    it('should use --font-sans for body text', () => {
      expect(integrationsCSS).toContain('font-family: var(--font-sans)');
    });

    it('should use --text-* tokens for font sizes', () => {
      expect(integrationsCSS).toContain('font-size: var(--text-3xl)');
      expect(integrationsCSS).toContain('font-size: var(--text-base)');
      expect(integrationsCSS).toContain('font-size: var(--text-sm)');
      expect(integrationsCSS).toContain('font-size: var(--text-xl)');
    });

    it('should use --font-weight-* tokens for font weights', () => {
      expect(integrationsCSS).toContain('font-weight: var(--font-weight-bold)');
      expect(integrationsCSS).toContain('font-weight: var(--font-weight-semibold)');
      expect(integrationsCSS).toContain('font-weight: var(--font-weight-medium)');
    });

    it('should use --leading-* tokens for line heights', () => {
      expect(integrationsCSS).toContain('line-height: var(--leading-tight)');
      expect(integrationsCSS).toContain('line-height: var(--leading-normal)');
    });
  });

  describe('Glass Effects (Requirement 3.2)', () => {
    it('should use backdrop-filter with --blur-xl', () => {
      expect(integrationsCSS).toContain('backdrop-filter: blur(var(--blur-xl))');
    });

    it('should use --shadow-inner-glow for glass cards', () => {
      expect(integrationsCSS).toContain('box-shadow: var(--shadow-inner-glow)');
    });

    it('should use --shadow-md for hover elevation', () => {
      expect(integrationsCSS).toContain('box-shadow: var(--shadow-md)');
    });
  });

  describe('Border Radius (Requirement 2.1)', () => {
    it('should use --card-radius for cards', () => {
      expect(integrationsCSS).toContain('border-radius: var(--card-radius)');
    });

    it('should use --button-radius for buttons', () => {
      expect(integrationCardTSX).toContain("borderRadius: 'var(--button-radius)'");
    });

    it('should use --radius-* tokens consistently', () => {
      expect(integrationsCSS).toContain('border-radius: var(--radius-sm)');
      expect(integrationIconTSX).toContain("borderRadius: 'var(--radius-xl)'");
    });
  });

  describe('Transitions and Animations (Requirement 1.3, 6.2)', () => {
    it('should use --transition-base for standard transitions', () => {
      expect(integrationsCSS).toContain('transition: all var(--transition-base)');
    });

    it('should use --transition-fast for quick transitions', () => {
      expect(integrationsCSS).toContain('transition: background var(--transition-fast)');
    });

    it('should not use hardcoded transition durations', () => {
      const hardcodedTransitionPattern = /transition:\s*[^;]*\d+m?s/g;
      const matches = integrationsCSS.match(hardcodedTransitionPattern) || [];
      // Filter out the shimmer animation which is intentionally hardcoded
      const nonAnimationMatches = matches.filter(match => !match.includes('shimmer'));
      expect(nonAnimationMatches.length).toBe(0);
    });
  });

  describe('Accent Colors (Requirement 3.5)', () => {
    it('should use --accent-primary for primary actions', () => {
      expect(integrationCardTSX).toContain("background: 'var(--accent-primary)'");
    });

    it('should use --accent-primary-hover for hover states', () => {
      expect(integrationCardTSX).toContain("background = 'var(--accent-primary-hover)'");
    });

    it('should use --accent-error for error states', () => {
      expect(integrationsCSS).toContain('color: var(--accent-error)');
      expect(integrationCardTSX).toContain("background: 'var(--accent-error)'");
    });

    it('should use --accent-warning for warning states', () => {
      expect(integrationCardTSX).toContain("background: 'var(--accent-warning)'");
    });
  });

  describe('Responsive Design (Requirement 7.1)', () => {
    it('should use standard breakpoints for responsive grid', () => {
      expect(integrationsCSS).toContain('@media (min-width: 768px)');
      expect(integrationsCSS).toContain('@media (min-width: 1024px)');
    });

    it('should have mobile-first grid layout', () => {
      expect(integrationsCSS).toContain('grid-template-columns: repeat(1, 1fr)');
    });

    it('should scale to 2 columns on tablet', () => {
      const tabletSection = integrationsCSS.match(/@media \(min-width: 768px\)[^}]*\{[^}]*\}/s);
      expect(tabletSection).toBeTruthy();
      expect(tabletSection![0]).toContain('grid-template-columns: repeat(2, 1fr)');
    });

    it('should scale to 3 columns on desktop', () => {
      const desktopSection = integrationsCSS.match(/@media \(min-width: 1024px\)[^}]*\{[^}]*\}/s);
      expect(desktopSection).toBeTruthy();
      expect(desktopSection![0]).toContain('grid-template-columns: repeat(3, 1fr)');
    });
  });

  describe('Accessibility (Requirement 7.4)', () => {
    it('should support reduced motion preferences', () => {
      expect(integrationsCSS).toContain('@media (prefers-reduced-motion: reduce)');
    });

    it('should disable animations for reduced motion', () => {
      const reducedMotionSection = integrationsCSS.match(/@media \(prefers-reduced-motion: reduce\)[^}]*\{[^}]*\}/gs);
      expect(reducedMotionSection).toBeTruthy();
      expect(reducedMotionSection![0]).toContain('animation: none');
    });

    it('should have proper button cursor states', () => {
      // Buttons use native cursor behavior, disabled state is handled by Tailwind
      expect(integrationCardTSX).toContain('disabled:cursor-not-allowed');
    });

    it('should have disabled state styling', () => {
      expect(integrationCardTSX).toContain('disabled:opacity-50');
    });
  });

  describe('No Hardcoded Values (Requirement 1.2)', () => {
    it('should not contain hardcoded color values in CSS', () => {
      // Allow rgba for specific effects like error backgrounds
      const lines = integrationsCSS.split('\n');
      const hardcodedColors = lines.filter(line => {
        // Skip comments
        if (line.trim().startsWith('/*') || line.trim().startsWith('*') || line.trim().startsWith('//')) {
          return false;
        }
        // Skip rgba with var() inside
        if (line.includes('rgba') && line.includes('var(')) {
          return false;
        }
        // Check for hardcoded hex colors
        return /#[0-9a-fA-F]{3,8}/.test(line) && !line.includes('var(');
      });
      
      expect(hardcodedColors.length).toBe(0);
    });

    it('should not contain hardcoded spacing values', () => {
      const lines = integrationsCSS.split('\n');
      const hardcodedSpacing = lines.filter(line => {
        if (line.trim().startsWith('/*') || line.trim().startsWith('*')) {
          return false;
        }
        // Check for hardcoded pixel values in spacing properties
        return /(?:padding|margin|gap):\s*\d+px/.test(line) && !line.includes('var(');
      });
      
      expect(hardcodedSpacing.length).toBe(0);
    });
  });

  describe('Component Structure', () => {
    it('should have proper CSS class organization', () => {
      expect(integrationsCSS).toContain('.integrations-container');
      expect(integrationsCSS).toContain('.integrations-header');
      expect(integrationsCSS).toContain('.integrations-title');
      expect(integrationsCSS).toContain('.integrations-subtitle');
      expect(integrationsCSS).toContain('.integrations-grid');
      expect(integrationsCSS).toContain('.integration-card');
    });

    it('should have loading state styles', () => {
      expect(integrationsCSS).toContain('.integrations-loading');
      expect(integrationsCSS).toContain('.integrations-loading-spinner');
    });

    it('should have error state styles', () => {
      expect(integrationsCSS).toContain('.integrations-error');
      expect(integrationsCSS).toContain('.integrations-error-icon');
      expect(integrationsCSS).toContain('.integrations-error-retry');
    });

    it('should have skeleton loading styles', () => {
      expect(integrationsCSS).toContain('.skeleton');
      expect(integrationsCSS).toContain('.skeleton-text');
    });
  });

  describe('Performance Optimizations', () => {
    it('should use GPU-accelerated animations', () => {
      expect(integrationsCSS).toContain('transform: translateZ(0)');
      expect(integrationsCSS).toContain('will-change: transform');
    });

    it('should use transform for hover effects', () => {
      expect(integrationsCSS).toContain('transform: translateY(-2px)');
    });
  });
});
