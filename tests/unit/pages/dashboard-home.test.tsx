/**
 * Dashboard Home Page - Design Token Usage Tests
 * 
 * Validates: Requirements 1.1, 1.2, 2.1, 2.2
 * Feature: design-system-unification, Task 7
 * 
 * Tests that dashboard home page components use design tokens
 * instead of hardcoded values for colors, spacing, and typography.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Dashboard Home - Design Token Usage', () => {
  const homeDir = join(process.cwd(), 'app/(app)/home');
  
  describe('home.css', () => {
    const cssContent = readFileSync(join(homeDir, 'home.css'), 'utf-8');
    
    it('should use design tokens for accent colors', () => {
      expect(cssContent).toContain('var(--accent-info)');
      expect(cssContent).toContain('var(--accent-success)');
      expect(cssContent).toContain('var(--accent-primary)');
      expect(cssContent).toContain('var(--accent-warning)');
      expect(cssContent).toContain('var(--accent-error)');
    });
    
    it('should use design tokens for backgrounds', () => {
      expect(cssContent).toContain('var(--bg-card)');
      expect(cssContent).toContain('var(--bg-surface)');
      expect(cssContent).toContain('var(--bg-hover)');
    });
    
    it('should use design tokens for borders', () => {
      expect(cssContent).toContain('var(--border-default)');
      expect(cssContent).toContain('var(--border-emphasis)');
    });
    
    it('should use design tokens for text colors', () => {
      expect(cssContent).toContain('var(--text-primary)');
      expect(cssContent).toContain('var(--text-secondary)');
      expect(cssContent).toContain('var(--text-muted)');
    });
    
    it('should use design tokens for spacing', () => {
      expect(cssContent).toContain('var(--space-');
    });
    
    it('should use design tokens for typography', () => {
      expect(cssContent).toContain('var(--text-');
      expect(cssContent).toContain('var(--font-weight-');
    });
    
    it('should use design tokens for border radius', () => {
      expect(cssContent).toContain('var(--radius-');
    });
    
    it('should use design tokens for transitions', () => {
      expect(cssContent).toContain('var(--transition-base)');
    });
    
    it('should use design tokens for shadows', () => {
      expect(cssContent).toContain('var(--shadow-');
    });
    
    it('should use accent-bg-subtle for purple icon background', () => {
      expect(cssContent).toContain('var(--accent-bg-subtle)');
    });
  });
  
  describe('recent-activity.css', () => {
    const cssContent = readFileSync(join(homeDir, 'recent-activity.css'), 'utf-8');
    
    it('should use design tokens for accent colors', () => {
      expect(cssContent).toContain('var(--accent-info)');
      expect(cssContent).toContain('var(--accent-success)');
      expect(cssContent).toContain('var(--accent-primary)');
      expect(cssContent).toContain('var(--accent-warning)');
    });
    
    it('should use design tokens for text colors', () => {
      expect(cssContent).toContain('var(--text-primary)');
      expect(cssContent).toContain('var(--text-secondary)');
      expect(cssContent).toContain('var(--text-muted)');
      expect(cssContent).toContain('var(--text-tertiary)');
    });
    
    it('should use design tokens for backgrounds', () => {
      expect(cssContent).toContain('var(--bg-card)');
      expect(cssContent).toContain('var(--bg-surface)');
      expect(cssContent).toContain('var(--bg-hover)');
    });
    
    it('should use design tokens for borders', () => {
      expect(cssContent).toContain('var(--border-default)');
      expect(cssContent).toContain('var(--border-emphasis)');
    });
    
    it('should use design tokens for spacing', () => {
      expect(cssContent).toContain('var(--space-');
    });
    
    it('should use design tokens for typography', () => {
      expect(cssContent).toContain('var(--text-');
      expect(cssContent).toContain('var(--font-weight-');
    });
    
    it('should use design tokens for border radius', () => {
      expect(cssContent).toContain('var(--radius-');
    });
    
    it('should use design tokens for transitions', () => {
      expect(cssContent).toContain('var(--transition-base)');
    });
  });
  
  describe('platform-status.css', () => {
    const cssContent = readFileSync(join(homeDir, 'platform-status.css'), 'utf-8');
    
    it('should use design tokens for status colors', () => {
      expect(cssContent).toContain('var(--accent-success)');
      expect(cssContent).toContain('var(--accent-error)');
    });
    
    it('should not have hardcoded hex colors for status indicators', () => {
      // Check that status-connected and status-disconnected use tokens
      const statusConnectedMatch = cssContent.match(/\.status-connected\s*{[^}]*background:\s*([^;]+);/);
      const statusDisconnectedMatch = cssContent.match(/\.status-disconnected\s*{[^}]*background:\s*([^;]+);/);
      
      if (statusConnectedMatch) {
        expect(statusConnectedMatch[1]).toContain('var(--accent-success)');
      }
      
      if (statusDisconnectedMatch) {
        expect(statusDisconnectedMatch[1]).toContain('var(--accent-error)');
      }
    });
    
    it('should use design tokens for backgrounds', () => {
      expect(cssContent).toContain('var(--bg-card)');
      expect(cssContent).toContain('var(--bg-hover)');
      expect(cssContent).toContain('var(--bg-surface)');
    });
    
    it('should use design tokens for borders', () => {
      expect(cssContent).toContain('var(--border-default)');
      expect(cssContent).toContain('var(--border-emphasis)');
    });
    
    it('should use design tokens for text colors', () => {
      expect(cssContent).toContain('var(--text-primary)');
      expect(cssContent).toContain('var(--text-secondary)');
      expect(cssContent).toContain('var(--text-muted)');
    });
    
    it('should not have hardcoded fallback values in skeleton gradients', () => {
      // Check that skeleton gradients don't have hardcoded fallbacks
      expect(cssContent).not.toContain('#0a0a0a');
      expect(cssContent).not.toContain('#1a1a1a');
    });
  });
  
  describe('quick-actions.css', () => {
    const cssContent = readFileSync(join(homeDir, 'quick-actions.css'), 'utf-8');
    
    it('should use design tokens for backgrounds', () => {
      expect(cssContent).toContain('var(--bg-card)');
      expect(cssContent).toContain('var(--bg-surface)');
      expect(cssContent).toContain('var(--bg-hover)');
    });
    
    it('should use design tokens for borders', () => {
      expect(cssContent).toContain('var(--border-default)');
      expect(cssContent).toContain('var(--border-emphasis)');
    });
    
    it('should use design tokens for text colors', () => {
      expect(cssContent).toContain('var(--text-primary)');
      expect(cssContent).toContain('var(--text-secondary)');
      expect(cssContent).toContain('var(--text-muted)');
    });
    
    it('should use design tokens for spacing', () => {
      expect(cssContent).toContain('var(--space-');
    });
    
    it('should use design tokens for typography', () => {
      expect(cssContent).toContain('var(--text-');
      expect(cssContent).toContain('var(--font-weight-');
    });
    
    it('should use design tokens for border radius', () => {
      expect(cssContent).toContain('var(--radius-');
    });
    
    it('should not have hardcoded fallback values in skeleton gradients', () => {
      // Check that skeleton gradients don't have hardcoded fallbacks
      expect(cssContent).not.toContain('#0a0a0a');
      expect(cssContent).not.toContain('#1a1a1a');
    });
  });
  
  describe('No hardcoded colors', () => {
    const files = [
      'home.css',
      'recent-activity.css',
      'platform-status.css',
      'quick-actions.css'
    ];
    
    files.forEach(file => {
      it(`${file} should minimize hardcoded hex colors`, () => {
        const cssContent = readFileSync(join(homeDir, file), 'utf-8');
        
        // Allow rgba() for opacity variations, but check for standalone hex colors
        const hexColorPattern = /#[0-9a-fA-F]{3,6}(?!\s*\/)/g;
        const matches = cssContent.match(hexColorPattern) || [];
        
        // We allow some hardcoded colors in rgba() for opacity variations
        // but standalone hex colors should be minimal
        const standaloneHexColors = matches.filter(match => {
          const context = cssContent.substring(
            cssContent.indexOf(match) - 20,
            cssContent.indexOf(match) + 20
          );
          return !context.includes('rgba(');
        });
        
        // Should have very few or no standalone hex colors
        expect(standaloneHexColors.length).toBeLessThanOrEqual(2);
      });
    });
  });
  
  describe('Glass morphism effects', () => {
    const cssContent = readFileSync(join(homeDir, 'home.css'), 'utf-8');
    
    it('should use design tokens for glass effects where applicable', () => {
      // Check if any glass effects are present and using tokens
      if (cssContent.includes('backdrop-filter')) {
        expect(cssContent).toContain('var(--blur-');
      }
    });
  });
  
  describe('Consistent spacing', () => {
    const files = [
      'home.css',
      'recent-activity.css',
      'platform-status.css',
      'quick-actions.css'
    ];
    
    files.forEach(file => {
      it(`${file} should use consistent spacing tokens`, () => {
        const cssContent = readFileSync(join(homeDir, file), 'utf-8');
        
        // Check for spacing token usage
        const spacingTokens = cssContent.match(/var\(--space-\d+\)/g) || [];
        
        // Should have multiple spacing token usages
        expect(spacingTokens.length).toBeGreaterThan(5);
      });
    });
  });
});
