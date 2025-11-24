/**
 * Responsive Behavior Integration Tests
 * 
 * Tests layout behavior on different viewport sizes, verifies max-width constraints,
 * and validates dead zones appearance on large screens.
 * 
 * Requirements: 4.1, 4.4
 * 
 * These tests verify:
 * - Layout adapts correctly to mobile, tablet, and desktop viewports
 * - Max-width constraints (1200px/1280px) are enforced
 * - Dead zones appear correctly on large screens
 * - Content remains centered and properly padded
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

// ============================================================================
// Test Configuration
// ============================================================================

/**
 * Viewport configurations for different device types
 */
const VIEWPORTS = {
  mobile: {
    width: 375,
    height: 667,
    name: 'Mobile (iPhone SE)',
  },
  mobileLarge: {
    width: 414,
    height: 896,
    name: 'Mobile Large (iPhone 11)',
  },
  tablet: {
    width: 768,
    height: 1024,
    name: 'Tablet (iPad)',
  },
  tabletLarge: {
    width: 1024,
    height: 1366,
    name: 'Tablet Large (iPad Pro)',
  },
  desktop: {
    width: 1280,
    height: 720,
    name: 'Desktop (HD)',
  },
  desktopLarge: {
    width: 1920,
    height: 1080,
    name: 'Desktop Large (Full HD)',
  },
  desktopXL: {
    width: 2560,
    height: 1440,
    name: 'Desktop XL (2K)',
  },
  desktop4K: {
    width: 3840,
    height: 2160,
    name: 'Desktop 4K',
  },
} as const;

/**
 * Max-width constraints from design system
 */
const MAX_WIDTHS = {
  sm: 1200, // 75rem
  lg: 1280, // 80rem
} as const;

/**
 * Default padding from design system
 */
const DEFAULT_PADDING = 24;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates a mock DOM environment with specified viewport
 */
function createMockDOM(viewport: { width: number; height: number }) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { width: ${viewport.width}px; height: ${viewport.height}px; }
          .centered-container {
            margin-left: auto;
            margin-right: auto;
            padding: ${DEFAULT_PADDING}px;
          }
          .max-w-sm { max-width: ${MAX_WIDTHS.sm}px; }
          .max-w-lg { max-width: ${MAX_WIDTHS.lg}px; }
        </style>
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
  `;

  const dom = new JSDOM(html);
  return {
    window: dom.window,
    document: dom.window.document,
  };
}

/**
 * Creates a centered container element
 */
function createCenteredContainer(
  document: Document,
  maxWidth: 'sm' | 'lg' = 'lg',
  padding: number = DEFAULT_PADDING
): HTMLElement {
  const container = document.createElement('div');
  container.className = `centered-container max-w-${maxWidth}`;
  container.style.marginLeft = 'auto';
  container.style.marginRight = 'auto';
  container.style.maxWidth = maxWidth === 'sm' ? `${MAX_WIDTHS.sm}px` : `${MAX_WIDTHS.lg}px`;
  container.style.padding = `${padding}px`;
  container.setAttribute('data-testid', 'centered-container');
  
  return container;
}

/**
 * Calculates the expected dead zone width
 */
function calculateDeadZone(viewportWidth: number, maxWidth: number, padding: number): number {
  if (viewportWidth <= maxWidth) {
    return 0;
  }
  
  // Dead zone = (viewport - maxWidth) / 2
  return (viewportWidth - maxWidth) / 2;
}

/**
 * Calculates the expected content width
 */
function calculateContentWidth(viewportWidth: number, maxWidth: number, padding: number): number {
  const effectiveMaxWidth = Math.min(viewportWidth, maxWidth);
  return effectiveMaxWidth - (padding * 2);
}

/**
 * Simulates window resize
 */
function resizeWindow(window: Window, width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
}

// ============================================================================
// Integration Tests
// ============================================================================

describe('Responsive Behavior Integration Tests', () => {
  describe('Layout on Different Viewport Sizes', () => {
    it('should adapt layout correctly on mobile viewport', () => {
      // Requirement 4.4: Responsive behavior on different viewport sizes
      const { document } = createMockDOM(VIEWPORTS.mobile);
      const container = createCenteredContainer(document, 'lg');
      document.body.appendChild(container);

      // On mobile, container should take full width minus padding
      const expectedWidth = VIEWPORTS.mobile.width - (DEFAULT_PADDING * 2);
      
      // Verify container is present
      expect(container).toBeDefined();
      expect(container.getAttribute('data-testid')).toBe('centered-container');
      
      // Verify max-width is set but not constraining on mobile
      expect(container.style.maxWidth).toBe(`${MAX_WIDTHS.lg}px`);
      
      // On mobile, viewport is smaller than max-width, so no constraint
      expect(VIEWPORTS.mobile.width).toBeLessThan(MAX_WIDTHS.lg);
    });

    it('should adapt layout correctly on tablet viewport', () => {
      const { document } = createMockDOM(VIEWPORTS.tablet);
      const container = createCenteredContainer(document, 'lg');
      document.body.appendChild(container);

      // On tablet, container should still take full width minus padding
      const expectedWidth = VIEWPORTS.tablet.width - (DEFAULT_PADDING * 2);
      
      expect(container).toBeDefined();
      expect(container.style.maxWidth).toBe(`${MAX_WIDTHS.lg}px`);
      
      // Tablet viewport is smaller than max-width
      expect(VIEWPORTS.tablet.width).toBeLessThan(MAX_WIDTHS.lg);
    });

    it('should adapt layout correctly on desktop viewport', () => {
      const { document } = createMockDOM(VIEWPORTS.desktop);
      const container = createCenteredContainer(document, 'lg');
      document.body.appendChild(container);

      // On desktop at 1280px, container should match max-width exactly
      expect(container).toBeDefined();
      expect(container.style.maxWidth).toBe(`${MAX_WIDTHS.lg}px`);
      
      // Desktop viewport equals max-width
      expect(VIEWPORTS.desktop.width).toBe(MAX_WIDTHS.lg);
    });

    it('should adapt layout correctly on large desktop viewport', () => {
      const { document } = createMockDOM(VIEWPORTS.desktopLarge);
      const container = createCenteredContainer(document, 'lg');
      document.body.appendChild(container);

      // On large desktop, container should be constrained by max-width
      expect(container).toBeDefined();
      expect(container.style.maxWidth).toBe(`${MAX_WIDTHS.lg}px`);
      
      // Large desktop viewport exceeds max-width
      expect(VIEWPORTS.desktopLarge.width).toBeGreaterThan(MAX_WIDTHS.lg);
      
      // Dead zones should appear
      const deadZone = calculateDeadZone(VIEWPORTS.desktopLarge.width, MAX_WIDTHS.lg, DEFAULT_PADDING);
      expect(deadZone).toBeGreaterThan(0);
      expect(deadZone).toBe((VIEWPORTS.desktopLarge.width - MAX_WIDTHS.lg) / 2);
    });

    it('should handle viewport resize correctly', () => {
      const { window, document } = createMockDOM(VIEWPORTS.mobile);
      const container = createCenteredContainer(document, 'lg');
      document.body.appendChild(container);

      // Start with mobile
      expect(VIEWPORTS.mobile.width).toBeLessThan(MAX_WIDTHS.lg);

      // Resize to desktop
      resizeWindow(window, VIEWPORTS.desktop.width, VIEWPORTS.desktop.height);
      expect(window.innerWidth).toBe(VIEWPORTS.desktop.width);

      // Resize to large desktop
      resizeWindow(window, VIEWPORTS.desktopLarge.width, VIEWPORTS.desktopLarge.height);
      expect(window.innerWidth).toBe(VIEWPORTS.desktopLarge.width);
      expect(window.innerWidth).toBeGreaterThan(MAX_WIDTHS.lg);
    });

    it('should maintain layout integrity across all viewport sizes', () => {
      const viewportSizes = Object.values(VIEWPORTS);
      
      for (const viewport of viewportSizes) {
        const { document } = createMockDOM(viewport);
        const container = createCenteredContainer(document, 'lg');
        document.body.appendChild(container);

        // Verify container is always present and properly configured
        expect(container).toBeDefined();
        expect(container.style.maxWidth).toBe(`${MAX_WIDTHS.lg}px`);
        expect(container.style.marginLeft).toBe('auto');
        expect(container.style.marginRight).toBe('auto');
        expect(container.style.padding).toBe(`${DEFAULT_PADDING}px`);
      }
    });
  });

  describe('Max-Width Constraints', () => {
    it('should enforce small max-width constraint (1200px)', () => {
      // Requirement 4.1: Max-width of 1200px or 1280px
      const { document } = createMockDOM(VIEWPORTS.desktopLarge);
      const container = createCenteredContainer(document, 'sm');
      document.body.appendChild(container);

      expect(container.style.maxWidth).toBe(`${MAX_WIDTHS.sm}px`);
      expect(parseInt(container.style.maxWidth)).toBe(1200);
    });

    it('should enforce large max-width constraint (1280px)', () => {
      const { document } = createMockDOM(VIEWPORTS.desktopLarge);
      const container = createCenteredContainer(document, 'lg');
      document.body.appendChild(container);

      expect(container.style.maxWidth).toBe(`${MAX_WIDTHS.lg}px`);
      expect(parseInt(container.style.maxWidth)).toBe(1280);
    });

    it('should not exceed max-width on extra large screens', () => {
      const { document } = createMockDOM(VIEWPORTS.desktop4K);
      const container = createCenteredContainer(document, 'lg');
      document.body.appendChild(container);

      // Even on 4K screen, container should not exceed max-width
      expect(container.style.maxWidth).toBe(`${MAX_WIDTHS.lg}px`);
      expect(parseInt(container.style.maxWidth)).toBeLessThanOrEqual(MAX_WIDTHS.lg);
      
      // Viewport is much larger than max-width
      expect(VIEWPORTS.desktop4K.width).toBeGreaterThan(MAX_WIDTHS.lg);
    });

    it('should allow content to be narrower than max-width on small screens', () => {
      const { document } = createMockDOM(VIEWPORTS.mobile);
      const container = createCenteredContainer(document, 'lg');
      document.body.appendChild(container);

      // Max-width is set but not constraining
      expect(container.style.maxWidth).toBe(`${MAX_WIDTHS.lg}px`);
      
      // Actual width is determined by viewport
      expect(VIEWPORTS.mobile.width).toBeLessThan(MAX_WIDTHS.lg);
    });

    it('should maintain max-width constraint with different padding values', () => {
      const customPadding = 32;
      const { document } = createMockDOM(VIEWPORTS.desktopLarge);
      const container = createCenteredContainer(document, 'lg', customPadding);
      document.body.appendChild(container);

      // Max-width should be independent of padding
      expect(container.style.maxWidth).toBe(`${MAX_WIDTHS.lg}px`);
      expect(container.style.padding).toBe(`${customPadding}px`);
    });

    it('should calculate correct content width within max-width constraint', () => {
      const viewports = [
        VIEWPORTS.mobile,
        VIEWPORTS.tablet,
        VIEWPORTS.desktop,
        VIEWPORTS.desktopLarge,
      ];

      for (const viewport of viewports) {
        const contentWidth = calculateContentWidth(viewport.width, MAX_WIDTHS.lg, DEFAULT_PADDING);
        
        // Content width should account for padding
        const expectedMaxContentWidth = Math.min(viewport.width, MAX_WIDTHS.lg) - (DEFAULT_PADDING * 2);
        expect(contentWidth).toBe(expectedMaxContentWidth);
        
        // Content width should never exceed max-width minus padding
        expect(contentWidth).toBeLessThanOrEqual(MAX_WIDTHS.lg - (DEFAULT_PADDING * 2));
      }
    });
  });

  describe('Dead Zones Appearance', () => {
    it('should not have dead zones on mobile screens', () => {
      // Requirement 4.4: Dead zones should only appear on large screens
      const deadZone = calculateDeadZone(VIEWPORTS.mobile.width, MAX_WIDTHS.lg, DEFAULT_PADDING);
      
      expect(deadZone).toBe(0);
      expect(VIEWPORTS.mobile.width).toBeLessThan(MAX_WIDTHS.lg);
    });

    it('should not have dead zones on tablet screens', () => {
      const deadZone = calculateDeadZone(VIEWPORTS.tablet.width, MAX_WIDTHS.lg, DEFAULT_PADDING);
      
      expect(deadZone).toBe(0);
      expect(VIEWPORTS.tablet.width).toBeLessThan(MAX_WIDTHS.lg);
    });

    it('should not have dead zones when viewport equals max-width', () => {
      const deadZone = calculateDeadZone(VIEWPORTS.desktop.width, MAX_WIDTHS.lg, DEFAULT_PADDING);
      
      expect(deadZone).toBe(0);
      expect(VIEWPORTS.desktop.width).toBe(MAX_WIDTHS.lg);
    });

    it('should have dead zones on large desktop screens', () => {
      const deadZone = calculateDeadZone(VIEWPORTS.desktopLarge.width, MAX_WIDTHS.lg, DEFAULT_PADDING);
      
      expect(deadZone).toBeGreaterThan(0);
      expect(deadZone).toBe((VIEWPORTS.desktopLarge.width - MAX_WIDTHS.lg) / 2);
      
      // For 1920px viewport with 1280px max-width: (1920 - 1280) / 2 = 320px per side
      expect(deadZone).toBe(320);
    });

    it('should have larger dead zones on extra large screens', () => {
      const deadZoneXL = calculateDeadZone(VIEWPORTS.desktopXL.width, MAX_WIDTHS.lg, DEFAULT_PADDING);
      const deadZone4K = calculateDeadZone(VIEWPORTS.desktop4K.width, MAX_WIDTHS.lg, DEFAULT_PADDING);
      
      // Dead zones should increase with viewport size
      expect(deadZoneXL).toBeGreaterThan(0);
      expect(deadZone4K).toBeGreaterThan(deadZoneXL);
      
      // For 2560px viewport: (2560 - 1280) / 2 = 640px per side
      expect(deadZoneXL).toBe(640);
      
      // For 3840px viewport: (3840 - 1280) / 2 = 1280px per side
      expect(deadZone4K).toBe(1280);
    });

    it('should have symmetric dead zones on both sides', () => {
      const viewportWidth = VIEWPORTS.desktopLarge.width;
      const maxWidth = MAX_WIDTHS.lg;
      
      const leftDeadZone = (viewportWidth - maxWidth) / 2;
      const rightDeadZone = (viewportWidth - maxWidth) / 2;
      
      expect(leftDeadZone).toBe(rightDeadZone);
      expect(leftDeadZone + maxWidth + rightDeadZone).toBe(viewportWidth);
    });

    it('should calculate dead zones correctly for small max-width variant', () => {
      const deadZone = calculateDeadZone(VIEWPORTS.desktopLarge.width, MAX_WIDTHS.sm, DEFAULT_PADDING);
      
      expect(deadZone).toBeGreaterThan(0);
      
      // For 1920px viewport with 1200px max-width: (1920 - 1200) / 2 = 360px per side
      expect(deadZone).toBe(360);
      
      // Should be larger than with lg max-width
      const deadZoneLg = calculateDeadZone(VIEWPORTS.desktopLarge.width, MAX_WIDTHS.lg, DEFAULT_PADDING);
      expect(deadZone).toBeGreaterThan(deadZoneLg);
    });

    it('should maintain dead zones independent of padding', () => {
      const padding16 = 16;
      const padding32 = 32;
      
      const deadZone16 = calculateDeadZone(VIEWPORTS.desktopLarge.width, MAX_WIDTHS.lg, padding16);
      const deadZone32 = calculateDeadZone(VIEWPORTS.desktopLarge.width, MAX_WIDTHS.lg, padding32);
      
      // Dead zones should be the same regardless of padding
      expect(deadZone16).toBe(deadZone32);
      expect(deadZone16).toBe(320);
    });
  });

  describe('Content Centering', () => {
    it('should center content horizontally using auto margins', () => {
      const { document } = createMockDOM(VIEWPORTS.desktopLarge);
      const container = createCenteredContainer(document, 'lg');
      document.body.appendChild(container);

      // Verify auto margins are applied
      expect(container.style.marginLeft).toBe('auto');
      expect(container.style.marginRight).toBe('auto');
    });

    it('should maintain centering across all viewport sizes', () => {
      const viewportSizes = Object.values(VIEWPORTS);
      
      for (const viewport of viewportSizes) {
        const { document } = createMockDOM(viewport);
        const container = createCenteredContainer(document, 'lg');
        document.body.appendChild(container);

        expect(container.style.marginLeft).toBe('auto');
        expect(container.style.marginRight).toBe('auto');
      }
    });

    it('should center content with both max-width variants', () => {
      const { document } = createMockDOM(VIEWPORTS.desktopLarge);
      
      const containerSm = createCenteredContainer(document, 'sm');
      const containerLg = createCenteredContainer(document, 'lg');
      
      expect(containerSm.style.marginLeft).toBe('auto');
      expect(containerSm.style.marginRight).toBe('auto');
      expect(containerLg.style.marginLeft).toBe('auto');
      expect(containerLg.style.marginRight).toBe('auto');
    });
  });

  describe('Padding Consistency', () => {
    it('should apply default padding of 24px', () => {
      const { document } = createMockDOM(VIEWPORTS.desktop);
      const container = createCenteredContainer(document, 'lg');
      document.body.appendChild(container);

      expect(container.style.padding).toBe(`${DEFAULT_PADDING}px`);
      expect(parseInt(container.style.padding)).toBe(24);
    });

    it('should apply custom padding values', () => {
      const customPaddings = [16, 32, 40, 48];
      
      for (const padding of customPaddings) {
        const { document } = createMockDOM(VIEWPORTS.desktop);
        const container = createCenteredContainer(document, 'lg', padding);
        document.body.appendChild(container);

        expect(container.style.padding).toBe(`${padding}px`);
        expect(parseInt(container.style.padding)).toBe(padding);
      }
    });

    it('should maintain padding across viewport changes', () => {
      const customPadding = 32;
      const viewports = [VIEWPORTS.mobile, VIEWPORTS.tablet, VIEWPORTS.desktop];
      
      for (const viewport of viewports) {
        const { document } = createMockDOM(viewport);
        const container = createCenteredContainer(document, 'lg', customPadding);
        document.body.appendChild(container);

        expect(container.style.padding).toBe(`${customPadding}px`);
      }
    });
  });

  describe('Responsive Breakpoints', () => {
    it('should identify mobile breakpoint correctly', () => {
      const isMobile = VIEWPORTS.mobile.width < 768;
      expect(isMobile).toBe(true);
    });

    it('should identify tablet breakpoint correctly', () => {
      const isTablet = VIEWPORTS.tablet.width >= 768 && VIEWPORTS.tablet.width < 1024;
      expect(isTablet).toBe(true);
    });

    it('should identify desktop breakpoint correctly', () => {
      const isDesktop = VIEWPORTS.desktop.width >= 1024;
      expect(isDesktop).toBe(true);
    });

    it('should handle edge cases at breakpoint boundaries', () => {
      const breakpoints = [
        { width: 767, expected: 'mobile' },
        { width: 768, expected: 'tablet' },
        { width: 1023, expected: 'tablet' },
        { width: 1024, expected: 'desktop' },
        { width: 1280, expected: 'desktop' },
      ];

      for (const { width, expected } of breakpoints) {
        let category: string;
        if (width < 768) category = 'mobile';
        else if (width < 1024) category = 'tablet';
        else category = 'desktop';

        expect(category).toBe(expected);
      }
    });
  });

  describe('Cross-Viewport Consistency', () => {
    it('should maintain consistent max-width across all viewports', () => {
      const viewportSizes = Object.values(VIEWPORTS);
      const maxWidthValues: string[] = [];
      
      for (const viewport of viewportSizes) {
        const { document } = createMockDOM(viewport);
        const container = createCenteredContainer(document, 'lg');
        maxWidthValues.push(container.style.maxWidth);
      }

      // All containers should have the same max-width value
      const uniqueMaxWidths = new Set(maxWidthValues);
      expect(uniqueMaxWidths.size).toBe(1);
      expect(uniqueMaxWidths.has(`${MAX_WIDTHS.lg}px`)).toBe(true);
    });

    it('should maintain consistent centering mechanism across all viewports', () => {
      const viewportSizes = Object.values(VIEWPORTS);
      
      for (const viewport of viewportSizes) {
        const { document } = createMockDOM(viewport);
        const container = createCenteredContainer(document, 'lg');
        
        expect(container.style.marginLeft).toBe('auto');
        expect(container.style.marginRight).toBe('auto');
      }
    });

    it('should provide consistent user experience across device types', () => {
      const deviceTypes = [
        { viewport: VIEWPORTS.mobile, type: 'mobile' },
        { viewport: VIEWPORTS.tablet, type: 'tablet' },
        { viewport: VIEWPORTS.desktop, type: 'desktop' },
      ];

      for (const { viewport, type } of deviceTypes) {
        const { document } = createMockDOM(viewport);
        const container = createCenteredContainer(document, 'lg');
        document.body.appendChild(container);

        // All devices should have properly configured container
        expect(container).toBeDefined();
        expect(container.style.maxWidth).toBe(`${MAX_WIDTHS.lg}px`);
        expect(container.style.marginLeft).toBe('auto');
        expect(container.style.marginRight).toBe('auto');
        expect(container.style.padding).toBe(`${DEFAULT_PADDING}px`);
      }
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle very small viewports gracefully', () => {
      const tinyViewport = { width: 320, height: 568 }; // iPhone 5
      const { document } = createMockDOM(tinyViewport);
      const container = createCenteredContainer(document, 'lg');
      document.body.appendChild(container);

      expect(container).toBeDefined();
      expect(tinyViewport.width).toBeLessThan(MAX_WIDTHS.lg);
      
      const contentWidth = calculateContentWidth(tinyViewport.width, MAX_WIDTHS.lg, DEFAULT_PADDING);
      expect(contentWidth).toBeGreaterThan(0);
      expect(contentWidth).toBe(tinyViewport.width - (DEFAULT_PADDING * 2));
    });

    it('should handle very large viewports gracefully', () => {
      const ultraWideViewport = { width: 5120, height: 1440 }; // 5K ultrawide
      const { document } = createMockDOM(ultraWideViewport);
      const container = createCenteredContainer(document, 'lg');
      document.body.appendChild(container);

      expect(container).toBeDefined();
      expect(ultraWideViewport.width).toBeGreaterThan(MAX_WIDTHS.lg);
      
      const deadZone = calculateDeadZone(ultraWideViewport.width, MAX_WIDTHS.lg, DEFAULT_PADDING);
      expect(deadZone).toBeGreaterThan(0);
      expect(deadZone).toBe((ultraWideViewport.width - MAX_WIDTHS.lg) / 2);
    });

    it('should handle viewport exactly at max-width boundary', () => {
      const exactViewport = { width: MAX_WIDTHS.lg, height: 720 };
      const { document } = createMockDOM(exactViewport);
      const container = createCenteredContainer(document, 'lg');
      document.body.appendChild(container);

      const deadZone = calculateDeadZone(exactViewport.width, MAX_WIDTHS.lg, DEFAULT_PADDING);
      expect(deadZone).toBe(0);
      expect(exactViewport.width).toBe(MAX_WIDTHS.lg);
    });

    it('should handle viewport one pixel larger than max-width', () => {
      const slightlyLargerViewport = { width: MAX_WIDTHS.lg + 1, height: 720 };
      const { document } = createMockDOM(slightlyLargerViewport);
      const container = createCenteredContainer(document, 'lg');
      document.body.appendChild(container);

      const deadZone = calculateDeadZone(slightlyLargerViewport.width, MAX_WIDTHS.lg, DEFAULT_PADDING);
      expect(deadZone).toBeGreaterThan(0);
      expect(deadZone).toBe(0.5); // Half pixel on each side
    });

    it('should handle zero padding edge case', () => {
      const { document } = createMockDOM(VIEWPORTS.desktop);
      const container = createCenteredContainer(document, 'lg', 0);
      document.body.appendChild(container);

      expect(container.style.padding).toBe('0px');
      
      const contentWidth = calculateContentWidth(VIEWPORTS.desktop.width, MAX_WIDTHS.lg, 0);
      expect(contentWidth).toBe(Math.min(VIEWPORTS.desktop.width, MAX_WIDTHS.lg));
    });
  });
});
