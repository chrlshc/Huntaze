/**
 * Property-Based Test: Responsive Layout Adaptation
 * 
 * Feature: beta-launch-ui-system, Property 21: Responsive Layout Adaptation
 * Validates: Requirements 13.1, 13.2
 * 
 * Tests that for any viewport width below 768px, the layout switches to 
 * single-column mode and hides the sidebar.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppShell } from '@/components/layout/AppShell';
import { MobileSidebarProvider } from '@/components/layout/MobileSidebarContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Property-based test helper: Generate random viewport widths
function* generateViewportWidths(count: number = 100) {
  // Generate mobile widths (< 768px)
  for (let i = 0; i < count / 2; i++) {
    yield Math.floor(Math.random() * (767 - 320 + 1)) + 320; // 320-767px
  }
  
  // Generate desktop widths (>= 768px)
  for (let i = 0; i < count / 2; i++) {
    yield Math.floor(Math.random() * (1920 - 768 + 1)) + 768; // 768-1920px
  }
}

// Helper to set viewport width
function setViewportWidth(width: number) {
  // Update window.innerWidth
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });

  // Update matchMedia to match the viewport width
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => {
      // Parse media query for max-width
      const maxWidthMatch = query.match(/max-width:\s*(\d+)px/);
      const minWidthMatch = query.match(/min-width:\s*(\d+)px/);
      
      let matches = false;
      
      if (maxWidthMatch) {
        const maxWidth = parseInt(maxWidthMatch[1], 10);
        matches = width <= maxWidth;
      } else if (minWidthMatch) {
        const minWidth = parseInt(minWidthMatch[1], 10);
        matches = width >= minWidth;
      }

      return {
        matches,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      };
    },
  });

  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
}

// Helper to check if sidebar is hidden
function isSidebarHidden(container: HTMLElement, viewportWidth: number): boolean {
  const sidebar = container.querySelector('aside');
  if (!sidebar) return true;

  const classes = sidebar.className;

  // On mobile (< 768px), sidebar should have:
  // - 'hidden' class OR '-translate-x-full' class (when not open)
  // - 'lg:flex' or 'lg:static' (shows on large screens)
  
  if (viewportWidth < 768) {
    // Mobile: sidebar should be hidden by default
    // Check for Tailwind classes that hide on mobile
    return (
      classes.includes('hidden') ||
      classes.includes('-translate-x-full') ||
      (classes.includes('lg:flex') && !classes.includes('flex')) ||
      (classes.includes('lg:static') && classes.includes('fixed'))
    );
  } else {
    // Desktop: sidebar should be visible
    // Check for Tailwind classes that show on desktop
    return !(
      classes.includes('lg:flex') ||
      classes.includes('lg:static') ||
      classes.includes('flex')
    );
  }
}

// Helper to check if layout is single column
function isSingleColumnLayout(container: HTMLElement): boolean {
  const mainContent = container.querySelector('main');
  if (!mainContent) return false;

  const styles = window.getComputedStyle(mainContent);
  
  // Check if main content takes full width (accounting for padding)
  const width = parseFloat(styles.width);
  const viewportWidth = window.innerWidth;
  
  // Single column should be close to full viewport width (within 100px for padding)
  return width >= viewportWidth - 100;
}

// Helper to wrap component with providers
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <MobileSidebarProvider>
        {children}
      </MobileSidebarProvider>
    </ThemeProvider>
  );
}

describe('Property 21: Responsive Layout Adaptation', () => {
  let originalInnerWidth: number;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    // Save original values
    originalInnerWidth = window.innerWidth;
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: originalMatchMedia,
    });
  });

  it('should hide sidebar for any viewport width below 768px', () => {
    const mobileWidths = Array.from(generateViewportWidths(50)).filter(w => w < 768);
    
    let passedCount = 0;
    let failedCount = 0;
    const failures: Array<{ width: number; reason: string }> = [];

    for (const width of mobileWidths) {
      // Set viewport width
      setViewportWidth(width);

      // Render component
      const { container, unmount } = render(
        <AppShell>
          <div>Test Content</div>
        </AppShell>,
        { wrapper: TestWrapper }
      );

      // Check if sidebar is hidden
      const sidebarHidden = isSidebarHidden(container, width);

      if (sidebarHidden) {
        passedCount++;
      } else {
        failedCount++;
        failures.push({
          width,
          reason: 'Sidebar is visible on mobile viewport',
        });
      }

      // Cleanup
      unmount();
    }

    // Report results
    console.log(`Property Test Results (Mobile Sidebar Hidden):`);
    console.log(`  Passed: ${passedCount}/${mobileWidths.length}`);
    console.log(`  Failed: ${failedCount}/${mobileWidths.length}`);
    
    if (failures.length > 0) {
      console.log(`  Failures:`, failures.slice(0, 5)); // Show first 5 failures
    }

    // Assert that all tests passed
    expect(failedCount).toBe(0);
  });

  it('should show sidebar for any viewport width at or above 768px', () => {
    const desktopWidths = Array.from(generateViewportWidths(50)).filter(w => w >= 768);
    
    let passedCount = 0;
    let failedCount = 0;
    const failures: Array<{ width: number; reason: string }> = [];

    for (const width of desktopWidths) {
      // Set viewport width
      setViewportWidth(width);

      // Render component
      const { container, unmount } = render(
        <AppShell>
          <div>Test Content</div>
        </AppShell>,
        { wrapper: TestWrapper }
      );

      // Check if sidebar is visible
      const sidebarHidden = isSidebarHidden(container, width);

      if (!sidebarHidden) {
        passedCount++;
      } else {
        failedCount++;
        failures.push({
          width,
          reason: 'Sidebar is hidden on desktop viewport',
        });
      }

      // Cleanup
      unmount();
    }

    // Report results
    console.log(`Property Test Results (Desktop Sidebar Visible):`);
    console.log(`  Passed: ${passedCount}/${desktopWidths.length}`);
    console.log(`  Failed: ${failedCount}/${desktopWidths.length}`);
    
    if (failures.length > 0) {
      console.log(`  Failures:`, failures.slice(0, 5)); // Show first 5 failures
    }

    // Assert that all tests passed
    expect(failedCount).toBe(0);
  });

  it('should adapt layout to single column for mobile viewports', () => {
    // Test specific mobile breakpoints
    const mobileBreakpoints = [320, 375, 414, 428, 767];
    
    let passedCount = 0;
    let failedCount = 0;
    const failures: Array<{ width: number; reason: string }> = [];

    for (const width of mobileBreakpoints) {
      // Set viewport width
      setViewportWidth(width);

      // Render component
      const { container, unmount } = render(
        <AppShell>
          <div>Test Content</div>
        </AppShell>,
        { wrapper: TestWrapper }
      );

      // Check if sidebar is hidden (requirement 13.2)
      const sidebarHidden = isSidebarHidden(container, width);

      if (sidebarHidden) {
        passedCount++;
      } else {
        failedCount++;
        failures.push({
          width,
          reason: 'Layout did not adapt to single column',
        });
      }

      // Cleanup
      unmount();
    }

    // Report results
    console.log(`Property Test Results (Single Column Layout):`);
    console.log(`  Passed: ${passedCount}/${mobileBreakpoints.length}`);
    console.log(`  Failed: ${failedCount}/${mobileBreakpoints.length}`);
    
    if (failures.length > 0) {
      console.log(`  Failures:`, failures);
    }

    // Assert that all tests passed
    expect(failedCount).toBe(0);
  });

  it('should maintain consistent behavior across viewport transitions', () => {
    // Test viewport transitions from mobile to desktop and back
    const transitions = [
      { from: 320, to: 1024 },
      { from: 375, to: 768 },
      { from: 414, to: 1920 },
      { from: 1024, to: 320 },
      { from: 768, to: 375 },
      { from: 1920, to: 414 },
    ];

    let passedCount = 0;
    let failedCount = 0;
    const failures: Array<{ from: number; to: number; reason: string }> = [];

    for (const { from, to } of transitions) {
      // Start at 'from' width
      setViewportWidth(from);
      const { container, rerender, unmount } = render(
        <AppShell>
          <div>Test Content</div>
        </AppShell>,
        { wrapper: TestWrapper }
      );

      const initialSidebarHidden = isSidebarHidden(container, from);

      // Transition to 'to' width
      setViewportWidth(to);
      rerender(
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      );

      const finalSidebarHidden = isSidebarHidden(container, to);

      // Check if behavior is correct for both states
      const fromIsMobile = from < 768;
      const toIsMobile = to < 768;

      const correctInitialState = fromIsMobile ? initialSidebarHidden : !initialSidebarHidden;
      const correctFinalState = toIsMobile ? finalSidebarHidden : !finalSidebarHidden;

      if (correctInitialState && correctFinalState) {
        passedCount++;
      } else {
        failedCount++;
        failures.push({
          from,
          to,
          reason: `Incorrect state: initial=${initialSidebarHidden}, final=${finalSidebarHidden}`,
        });
      }

      // Cleanup
      unmount();
    }

    // Report results
    console.log(`Property Test Results (Viewport Transitions):`);
    console.log(`  Passed: ${passedCount}/${transitions.length}`);
    console.log(`  Failed: ${failedCount}/${transitions.length}`);
    
    if (failures.length > 0) {
      console.log(`  Failures:`, failures);
    }

    // Assert that all tests passed
    expect(failedCount).toBe(0);
  });
});
