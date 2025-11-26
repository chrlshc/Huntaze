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
   * For any viewport size, the root layout container should consume exactly
   * 100vh height and 100vw width with overflow hidden to prevent window scrolling.
   * 
   * Validates: Requirements 1.1, 4.3
   */
  it('Property 1: Grid layout should consume full viewport with overflow hidden', () => {
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

            // Verify dimensions consume full viewport
            expect(styles.height).toBe('100vh');
            expect(styles.width).toBe('100vw');

            // Verify overflow is hidden to prevent window scrolling
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
   * fixed sidebar width (256px) followed by flexible content (1fr).
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
            
            // Should have two columns
            const columnValues = columns.split(' ');
            expect(columnValues.length).toBe(2);

            // First column should be 256px (sidebar width) or the CSS variable
            expect(columnValues[0]).toMatch(/256px|var\(--huntaze-sidebar-width\)/);

            // Second column should be 1fr (flexible content)
            expect(columnValues[1]).toBe('1fr');

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
   * fixed header height (64px) followed by flexible content (1fr).
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
            
            // Should have two rows
            const rowValues = rows.split(' ');
            expect(rowValues.length).toBe(2);

            // First row should be 64px (header height) or the CSS variable
            expect(rowValues[0]).toMatch(/64px|var\(--huntaze-header-height\)/);

            // Second row should be 1fr (flexible content)
            expect(rowValues[1]).toBe('1fr');

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

    // Structural dimensions
    expect(styles.getPropertyValue('--huntaze-sidebar-width').trim()).toBe('256px');
    expect(styles.getPropertyValue('--huntaze-header-height').trim()).toBe('64px');

    // Z-index values
    expect(styles.getPropertyValue('--huntaze-z-index-header').trim()).toBe('500');
    expect(styles.getPropertyValue('--huntaze-z-index-nav').trim()).toBe('400');

    // Color tokens
    expect(styles.getPropertyValue('--bg-app').trim()).toBe('#F8F9FB');
    expect(styles.getPropertyValue('--bg-surface').trim()).toBe('#FFFFFF');
    expect(styles.getPropertyValue('--color-indigo').trim()).toBe('#6366f1');
    expect(styles.getPropertyValue('--color-text-main').trim()).toBe('#1F2937');
    expect(styles.getPropertyValue('--color-text-sub').trim()).toBe('#6B7280');

    // Shadow token
    expect(styles.getPropertyValue('--shadow-soft').trim()).toBe('0 4px 20px rgba(0, 0, 0, 0.05)');

    // Border radius
    expect(styles.getPropertyValue('--radius-card').trim()).toBe('16px');
  });
});
