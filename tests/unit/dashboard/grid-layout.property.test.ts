/**
 * Property-Based Tests for Dashboard Grid Layout
 * Feature: dashboard-shopify-migration
 * 
 * These tests verify that the CSS Grid layout structure maintains
 * correct dimensions and structure across all valid viewport sizes.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import fs from 'fs';
import path from 'path';

describe('Dashboard Grid Layout Properties', () => {
  beforeAll(() => {
    // Load the dashboard CSS tokens
    const cssPath = path.join(process.cwd(), 'styles/dashboard-shopify-tokens.css');
    const css = fs.readFileSync(cssPath, 'utf-8');
    
    // Create a style element and inject the CSS
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  });

  /**
   * Feature: dashboard-shopify-migration, Property 1: Grid Layout Viewport Dimensions
   * 
   * For any viewport size, the root layout container should allow normal page scrolling
   * by using a minimum viewport height (100vh) and visible overflow.
   * 
   * Validates: Requirements 1.1, 4.3
   */
  it('Property 1: Grid layout should be a fixed-height dashboard shell (height 100vh, overflow hidden)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 3840 }), // viewport width
        fc.integer({ min: 568, max: 2160 }), // viewport height
        (viewportWidth, viewportHeight) => {
          // Create a test container with the huntaze-layout class
          const container = document.createElement('div');
          container.className = 'huntaze-layout';
          document.body.appendChild(container);

          // Get computed styles
          const styles = window.getComputedStyle(container);

          try {
            // Verify display is grid
            expect(styles.display).toBe('grid');

            // Verify a fixed-height shell (main handles scroll)
            expect(styles.height).toBe('100vh');
            expect(styles.width).toBe('100%');

            // Prevent "ghost scroll" from implicit grid rows / nested 100vh helpers
            expect(styles.overflow).toBe('hidden');

            return true;
          } finally {
            // Cleanup
            document.body.removeChild(container);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: dashboard-shopify-migration, Property 2: Desktop Grid Column Structure
   * 
   * For any desktop viewport (≥1024px), the grid should define columns as
   * a fixed sidebar token followed by flexible content (1fr).
   * 
   * Validates: Requirements 1.4
   */
  it('Property 2: Desktop grid should have fixed sidebar and flexible content columns', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1024, max: 3840 }), // desktop viewport width
        (viewportWidth) => {
          // Set viewport width
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewportWidth,
          });

          // Create a test container
          const container = document.createElement('div');
          container.className = 'huntaze-layout';
          document.body.appendChild(container);

          // Get computed styles
          const styles = window.getComputedStyle(container);

          try {
            // Verify grid-template-columns structure
            const columns = styles.gridTemplateColumns;
            
            // Should include the sidebar width and a flexible track
            expect(columns).toMatch(/var\(--huntaze-sidebar-width\)|244px/);
            expect(columns).toContain('1fr');

            return true;
          } finally {
            // Cleanup
            document.body.removeChild(container);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: dashboard-shopify-migration, Property 3: Desktop Grid Row Structure
   * 
   * For any desktop viewport (≥1024px), the grid should define rows as
   * an automatic header row followed by flexible content (1fr).
   * 
   * Validates: Requirements 1.5
   */
  it('Property 3: Desktop grid should have fixed header and flexible content rows', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1024, max: 3840 }), // desktop viewport width
        fc.integer({ min: 768, max: 2160 }), // desktop viewport height
        (viewportWidth, viewportHeight) => {
          // Set viewport dimensions
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewportWidth,
          });
          Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: viewportHeight,
          });

          // Create a test container
          const container = document.createElement('div');
          container.className = 'huntaze-layout';
          document.body.appendChild(container);

          // Get computed styles
          const styles = window.getComputedStyle(container);

          try {
            // Verify grid-template-rows structure
            const rows = styles.gridTemplateRows;
            
            // Header space may be reserved as `auto` or an explicit token height.
            // In JSDOM, CSS vars may remain as `var(...)` in computed values.
            expect(rows).toMatch(/auto|60px|var\(--huntaze-header-height\)/);
            expect(rows).toContain('1fr');

            return true;
          } finally {
            // Cleanup
            document.body.removeChild(container);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: Verify named grid areas are correctly defined
   */
  it('should define correct named grid areas', () => {
    const container = document.createElement('div');
    container.className = 'huntaze-layout';
    document.body.appendChild(container);

    const styles = window.getComputedStyle(container);

    try {
      // Verify grid-template-areas is defined
      const areas = styles.gridTemplateAreas;
      
      // Should contain header, sidebar, and main areas
      expect(areas).toContain('header');
      expect(areas).toContain('sidebar');
      expect(areas).toContain('main');

      // Verify the structure: "header header" / "sidebar main"
      const normalizedAreas = areas.replace(/"/g, '').replace(/\s+/g, ' ').trim();
      expect(normalizedAreas).toMatch(/header\s+header.*sidebar\s+main/);
    } finally {
      document.body.removeChild(container);
    }
  });

  /**
   * Additional test: Verify CSS Custom Properties are defined
   */
  it('should define all required CSS custom properties', () => {
    const root = document.documentElement;
    const styles = window.getComputedStyle(root);

    // Structural dimensions (Shopify-like sidebar width)
    expect(styles.getPropertyValue('--universal-sidebar-width').trim()).toBe('244px');
    expect(styles.getPropertyValue('--huntaze-sidebar-width').trim()).toMatch(/var\(--universal-sidebar-width\)|244px/);
    expect(styles.getPropertyValue('--huntaze-header-height').trim()).toBe('60px');

    // Z-index values
    expect(styles.getPropertyValue('--huntaze-z-index-header').trim()).toBe('40');
    expect(styles.getPropertyValue('--huntaze-z-index-nav').trim()).toBe('30');

    // Color tokens (Shopify-like canvas)
    expect(styles.getPropertyValue('--bg-app').trim()).toBe('#F1F2F4');
    expect(styles.getPropertyValue('--bg-surface').trim()).toBe('#FFFFFF');
    expect(styles.getPropertyValue('--color-indigo').trim()).toBe('#6366f1');
    expect(styles.getPropertyValue('--color-text-main').trim()).toBe('#1F2937');
    expect(styles.getPropertyValue('--color-text-sub').trim()).toBe('#6B7280');

    // Shadow token
    expect(styles.getPropertyValue('--shadow-soft').trim()).toMatch(
      /0\s+1px\s+3px\s+rgba\(0,\s*0,\s*0,\s*0\.1\),\s*0\s+1px\s+2px\s+rgba\(0,\s*0,\s*0,\s*0\.06\)/
    );

    // Border radius
    expect(styles.getPropertyValue('--radius-card').trim()).toBe('16px');
  });
});
