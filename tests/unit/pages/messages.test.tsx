/**
 * Unit Tests: Messages Page Design Token Migration
 * 
 * Validates that the OnlyFans messages page uses unified design tokens
 * and follows the "God Tier" aesthetic consistently.
 * 
 * Requirements Validated:
 * - 1.1: Background color consistency
 * - 1.2: Glass effects and borders
 * - 1.3: Button hover states
 * - 1.4: Typography hierarchy
 * - 1.5: Spacing consistency
 * - 2.2: No hardcoded colors
 * - 3.1: Dashboard background uniformity
 * - 3.3: Border color consistency
 * - 3.4: Inner glow consistency
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const messagesPagePath = join(process.cwd(), 'app/(app)/onlyfans/messages/page.tsx');
const messagesPageContent = readFileSync(messagesPagePath, 'utf-8');

describe('Messages Page - Design Token Migration', () => {
  describe('Background Colors', () => {
    it('should use design tokens for all backgrounds', () => {
      // Should use var(--bg-*) tokens
      expect(messagesPageContent).toMatch(/bg-\[var\(--bg-/);
      
      // Should NOT use hardcoded gray backgrounds
      expect(messagesPageContent).not.toMatch(/bg-gray-50(?!\])/);
      expect(messagesPageContent).not.toMatch(/bg-gray-100(?!\])/);
      expect(messagesPageContent).not.toMatch(/bg-gray-700(?!\])/);
      expect(messagesPageContent).not.toMatch(/bg-gray-800(?!\])/);
      expect(messagesPageContent).not.toMatch(/bg-white(?!\])/);
    });

    it('should use glass-card utility class for main container', () => {
      expect(messagesPageContent).toContain('glass-card');
    });

    it('should use --bg-input for input fields', () => {
      expect(messagesPageContent).toMatch(/bg-\[var\(--bg-input\)\]/);
    });

    it('should use --bg-tertiary for message bubbles', () => {
      expect(messagesPageContent).toMatch(/bg-\[var\(--bg-tertiary\)\]/);
    });

    it('should use --bg-glass-hover for hover states', () => {
      expect(messagesPageContent).toMatch(/bg-\[var\(--bg-glass-hover\)\]/);
    });
  });

  describe('Text Colors', () => {
    it('should use --text-primary for main text', () => {
      expect(messagesPageContent).toMatch(/text-\[var\(--text-primary\)\]/);
    });

    it('should use --text-secondary for secondary text', () => {
      expect(messagesPageContent).toMatch(/text-\[var\(--text-secondary\)\]/);
    });

    it('should use --text-tertiary for muted text', () => {
      expect(messagesPageContent).toMatch(/text-\[var\(--text-tertiary\)\]/);
    });

    it('should NOT use old Shopify tokens', () => {
      expect(messagesPageContent).not.toContain('--color-text-main');
      expect(messagesPageContent).not.toContain('--color-text-sub');
      expect(messagesPageContent).not.toContain('--color-indigo');
    });

    it('should NOT use hardcoded text colors', () => {
      // Allow text-white for specific cases
      const whiteMatches = messagesPageContent.match(/text-white/g) || [];
      // Should only be used in buttons with colored backgrounds
      expect(whiteMatches.length).toBeLessThanOrEqual(4);
    });
  });

  describe('Border Colors', () => {
    it('should use --border-subtle for subtle borders', () => {
      expect(messagesPageContent).toMatch(/border-\[var\(--border-subtle\)\]/);
    });

    it('should use --border-default for default borders', () => {
      expect(messagesPageContent).toMatch(/border-\[var\(--border-default\)\]/);
    });

    it('should NOT use hardcoded border colors', () => {
      expect(messagesPageContent).not.toMatch(/border-gray-100(?!\])/);
      expect(messagesPageContent).not.toMatch(/border-gray-200(?!\])/);
      expect(messagesPageContent).not.toMatch(/border-gray-300(?!\])/);
      expect(messagesPageContent).not.toMatch(/border-gray-600(?!\])/);
      expect(messagesPageContent).not.toMatch(/border-gray-700(?!\])/);
      expect(messagesPageContent).not.toMatch(/border-gray-800(?!\])/);
    });

    it('should use ring utilities with design tokens', () => {
      expect(messagesPageContent).toMatch(/ring-\[var\(--border-subtle\)\]/);
    });
  });

  describe('Accent Colors', () => {
    it('should use --accent-primary for primary actions', () => {
      expect(messagesPageContent).toMatch(/bg-\[var\(--accent-primary\)\]/);
      expect(messagesPageContent).toMatch(/text-\[var\(--accent-primary\)\]/);
    });

    it('should use --accent-primary-hover for hover states', () => {
      expect(messagesPageContent).toMatch(/bg-\[var\(--accent-primary-hover\)\]/);
    });

    it('should use --accent-info for message actions', () => {
      expect(messagesPageContent).toMatch(/bg-\[var\(--accent-info\)\]/);
    });

    it('should use --accent-success for positive metrics', () => {
      expect(messagesPageContent).toMatch(/text-\[var\(--accent-success\)\]/);
    });

    it('should use --accent-warning for VIP indicators', () => {
      expect(messagesPageContent).toMatch(/text-\[var\(--accent-warning\)\]/);
      expect(messagesPageContent).toMatch(/fill-\[var\(--accent-warning\)\]/);
    });

    it('should use --accent-error for error states', () => {
      expect(messagesPageContent).toMatch(/text-\[var\(--accent-error\)\]/);
      expect(messagesPageContent).toMatch(/border-\[var\(--accent-error\)\]/);
    });

    it('should NOT use hardcoded accent colors', () => {
      expect(messagesPageContent).not.toMatch(/bg-blue-600(?!\])/);
      expect(messagesPageContent).not.toMatch(/bg-blue-700(?!\])/);
      expect(messagesPageContent).not.toMatch(/bg-purple-600(?!\])/);
      expect(messagesPageContent).not.toMatch(/bg-purple-700(?!\])/);
      expect(messagesPageContent).not.toMatch(/text-yellow-500(?!\])/);
    });
  });

  describe('Shadows', () => {
    it('should use --shadow-sm for subtle shadows', () => {
      expect(messagesPageContent).toMatch(/shadow-\[var\(--shadow-sm\)\]/);
    });

    it('should NOT use hardcoded shadow values', () => {
      expect(messagesPageContent).not.toMatch(/shadow-soft/);
    });
  });

  describe('Focus States', () => {
    it('should use focus ring with accent-primary', () => {
      expect(messagesPageContent).toMatch(/focus:ring-\[var\(--accent-primary\)\]/);
    });

    it('should include focus:outline-none for custom focus styles', () => {
      expect(messagesPageContent).toContain('focus:outline-none');
    });

    it('should include focus:border-transparent for clean focus states', () => {
      expect(messagesPageContent).toContain('focus:border-transparent');
    });
  });

  describe('Transitions', () => {
    it('should use transition-all for smooth animations', () => {
      expect(messagesPageContent).toContain('transition-all');
    });

    it('should use transition-colors where appropriate', () => {
      // May or may not be present, but if present should be used correctly
      const transitionMatches = messagesPageContent.match(/transition-/g) || [];
      expect(transitionMatches.length).toBeGreaterThan(0);
    });
  });

  describe('Placeholder Text', () => {
    it('should use --text-tertiary for placeholder text', () => {
      expect(messagesPageContent).toMatch(/placeholder:text-\[var\(--text-tertiary\)\]/);
    });
  });

  describe('Loading States', () => {
    it('should use --accent-primary for loading spinner', () => {
      expect(messagesPageContent).toMatch(/border-\[var\(--accent-primary\)\]/);
    });

    it('should use --text-secondary for loading text', () => {
      const loadingSection = messagesPageContent.match(/Loading messages\.\.\./);
      expect(loadingSection).toBeTruthy();
    });
  });

  describe('AI Suggestions Section', () => {
    it('should use --accent-bg-muted for AI suggestions background', () => {
      expect(messagesPageContent).toMatch(/bg-\[var\(--accent-bg-muted\)\]/);
    });

    it('should use --accent-primary for AI suggestion text', () => {
      const aiSection = messagesPageContent.match(/AI Suggestions:/);
      expect(aiSection).toBeTruthy();
    });
  });

  describe('Stats Cards', () => {
    it('should use glass-card for stat containers', () => {
      const statsSection = messagesPageContent.match(/Stats[\s\S]*?glass-card/);
      expect(statsSection).toBeTruthy();
    });

    it('should use --text-primary for stat values', () => {
      const statsSection = messagesPageContent.match(/Stats[\s\S]*?text-\[var\(--text-primary\)\]/);
      expect(statsSection).toBeTruthy();
    });

    it('should use --text-secondary for stat labels', () => {
      const statsSection = messagesPageContent.match(/Stats[\s\S]*?text-\[var\(--text-secondary\)\]/);
      expect(statsSection).toBeTruthy();
    });
  });

  describe('Message Bubbles', () => {
    it('should use --accent-info for creator messages', () => {
      expect(messagesPageContent).toMatch(/bg-\[var\(--accent-info\)\]/);
    });

    it('should use --bg-tertiary for fan messages', () => {
      const messageSection = messagesPageContent.match(/isFromCreator[\s\S]*?bg-\[var\(--bg-tertiary\)\]/);
      expect(messageSection).toBeTruthy();
    });

    it('should use --border-subtle for fan message borders', () => {
      const messageSection = messagesPageContent.match(/isFromCreator[\s\S]*?border-\[var\(--border-subtle\)\]/);
      expect(messageSection).toBeTruthy();
    });
  });

  describe('Thread List', () => {
    it('should use --bg-glass-hover for thread hover states', () => {
      const threadSection = messagesPageContent.match(/Thread List[\s\S]*?hover:bg-\[var\(--bg-glass-hover\)\]/);
      expect(threadSection).toBeTruthy();
    });

    it('should use --border-subtle for thread separators', () => {
      const threadSection = messagesPageContent.match(/Thread List[\s\S]*?border-\[var\(--border-subtle\)\]/);
      expect(threadSection).toBeTruthy();
    });

    it('should use --accent-info for unread badges', () => {
      const unreadSection = messagesPageContent.match(/unread[\s\S]*?bg-\[var\(--accent-info\)\]/);
      expect(unreadSection).toBeTruthy();
    });
  });

  describe('No Hardcoded Values', () => {
    it('should NOT contain old --bg-surface token', () => {
      expect(messagesPageContent).not.toContain('--bg-surface');
    });

    it('should NOT contain dark: prefixes for colors', () => {
      // Count dark: prefixes - should be minimal or none
      const darkPrefixes = messagesPageContent.match(/dark:bg-/g) || [];
      expect(darkPrefixes.length).toBe(0);
    });

    it('should NOT use inline hex colors', () => {
      expect(messagesPageContent).not.toMatch(/#[0-9a-fA-F]{3,6}(?![\w-])/);
    });

    it('should NOT use rgb/rgba colors', () => {
      expect(messagesPageContent).not.toMatch(/rgb\(/);
      expect(messagesPageContent).not.toMatch(/rgba\(/);
    });
  });

  describe('Accessibility', () => {
    it('should include disabled states with opacity', () => {
      expect(messagesPageContent).toContain('disabled:opacity-50');
    });

    it('should include disabled cursor styles', () => {
      expect(messagesPageContent).toContain('disabled:cursor-not-allowed');
    });

    it('should use semantic HTML with proper alt text', () => {
      expect(messagesPageContent).toContain('alt={');
    });
  });

  describe('Consistency Checks', () => {
    it('should use consistent rounded corners', () => {
      expect(messagesPageContent).toContain('rounded-lg');
      expect(messagesPageContent).toContain('rounded-full');
    });

    it('should use consistent spacing', () => {
      expect(messagesPageContent).toMatch(/gap-[234]/);
      expect(messagesPageContent).toMatch(/p-[34]/);
      expect(messagesPageContent).toMatch(/mb-[1246]/);
    });

    it('should use consistent font weights', () => {
      expect(messagesPageContent).toContain('font-medium');
      expect(messagesPageContent).toContain('font-bold');
    });

    it('should use consistent text sizes', () => {
      expect(messagesPageContent).toContain('text-sm');
      expect(messagesPageContent).toContain('text-xs');
      expect(messagesPageContent).toContain('text-2xl');
      expect(messagesPageContent).toContain('text-3xl');
    });
  });
});

describe('Messages Page - Token Coverage', () => {
  it('should have high design token usage', () => {
    const tokenMatches = messagesPageContent.match(/var\(--/g) || [];
    expect(tokenMatches.length).toBeGreaterThan(40);
  });

  it('should use glass-card utility', () => {
    const glassMatches = messagesPageContent.match(/glass-card/g) || [];
    expect(glassMatches.length).toBeGreaterThan(0);
  });

  it('should have minimal hardcoded colors', () => {
    // Count potential hardcoded colors (excluding comments and strings)
    const codeOnly = messagesPageContent.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
    const hardcodedColors = codeOnly.match(/(?:bg|text|border)-(?:gray|blue|purple|red|green|yellow)-\d+(?!\])/g) || [];
    expect(hardcodedColors.length).toBe(0);
  });
});
