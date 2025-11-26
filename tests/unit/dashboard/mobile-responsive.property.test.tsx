/**
 * Property-Based Tests for Mobile Responsive Behavior
 * Feature: dashboard-shopify-migration
 * 
 * These tests verify that the mobile sidebar drawer behaves correctly
 * across different viewport sizes and interaction patterns.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MobileSidebar } from '@/components/MobileSidebar';
import * as fc from 'fast-check';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

describe('Mobile Responsive Behavior - Property Tests', () => {
  beforeEach(() => {
    // Reset viewport
    global.innerWidth = 1024;
    global.innerHeight = 768;
  });

  describe('Property 27: Mobile Sidebar Collapse', () => {
    // Feature: dashboard-shopify-migration, Property 27: Mobile Sidebar Collapse
    it('should collapse sidebar off-screen for any viewport width below 1024px', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 320, max: 1023 }), // Mobile viewport widths
          (viewportWidth) => {
            // Set viewport width
            global.innerWidth = viewportWidth;
            
            const { container } = render(<MobileSidebar />);
            
            // Find the sidebar drawer (not the button)
            const sidebar = container.querySelector('aside');
            
            // Sidebar should exist but be off-screen (translateX(-100%))
            expect(sidebar).toBeTruthy();
            const style = sidebar ? window.getComputedStyle(sidebar) : null;
            
            // The sidebar should have transform: translateX(-100%) when closed
            // or width: 0 in the initial state
            if (style) {
              const transform = style.transform;
              const width = style.width;
              
              // Either transform is translateX(-100%) or width is 0
              const isCollapsed = 
                transform.includes('translateX(-100%)') || 
                transform.includes('matrix(1, 0, 0, 1, -') ||
                width === '0px';
              
              expect(isCollapsed).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 28: Mobile Hamburger Menu Display', () => {
    // Feature: dashboard-shopify-migration, Property 28: Mobile Hamburger Menu Display
    it('should display hamburger menu icon for any viewport width below 1024px', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 320, max: 1023 }),
          (viewportWidth) => {
            global.innerWidth = viewportWidth;
            
            const { unmount } = render(<MobileSidebar />);
            
            // Find hamburger button by aria-label
            const hamburgerButtons = screen.getAllByLabelText(/toggle menu/i);
            const hamburgerButton = hamburgerButtons[0];
            
            expect(hamburgerButton).toBeTruthy();
            expect(hamburgerButton.tagName).toBe('BUTTON');
            
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 29: Mobile Sidebar Toggle', () => {
    // Feature: dashboard-shopify-migration, Property 29: Mobile Sidebar Toggle
    it('should slide sidebar into view with smooth animation when hamburger is clicked', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 320, max: 1023 }),
          async (viewportWidth) => {
            global.innerWidth = viewportWidth;
            
            const { container, unmount } = render(<MobileSidebar />);
            
            // Find and click hamburger button
            const hamburgerButtons = screen.getAllByLabelText(/toggle menu/i);
            const hamburgerButton = hamburgerButtons[0];
            fireEvent.click(hamburgerButton);
            
            // Wait for animation
            await waitFor(() => {
              const sidebar = container.querySelector('aside');
              expect(sidebar).toBeTruthy();
              
              // Check that sidebar is now visible (translateX(0))
              if (sidebar) {
                const style = window.getComputedStyle(sidebar);
                const transform = style.transform;
                const width = style.width;
                
                // When open, transform should be translateX(0) or identity matrix
                // and width should not be 0
                const isOpen = 
                  (transform === 'none' || 
                   transform.includes('translateX(0)') || 
                   transform === 'matrix(1, 0, 0, 1, 0, 0)') &&
                  width !== '0px';
                
                expect(isOpen).toBe(true);
              }
            });
            
            unmount();
          }
        ),
        { numRuns: 50 } // Reduced runs for async tests
      );
    });
  });

  describe('Property 30: Mobile Sidebar Dimensions', () => {
    // Feature: dashboard-shopify-migration, Property 30: Mobile Sidebar Dimensions
    it('should display sidebar at 80% viewport width with maximum 300px when open', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 320, max: 1023 }),
          async (viewportWidth) => {
            global.innerWidth = viewportWidth;
            
            const { container, unmount } = render(<MobileSidebar />);
            
            // Open sidebar
            const hamburgerButtons = screen.getAllByLabelText(/toggle menu/i);
            const hamburgerButton = hamburgerButtons[0];
            fireEvent.click(hamburgerButton);
            
            await waitFor(() => {
              const sidebar = container.querySelector('aside');
              expect(sidebar).toBeTruthy();
              
              if (sidebar) {
                const style = window.getComputedStyle(sidebar);
                const width = style.width;
                
                // Width should be min(80vw, 300px)
                const expectedWidth = Math.min(viewportWidth * 0.8, 300);
                
                // Parse width (remove 'px')
                const actualWidth = parseFloat(width);
                
                // Allow for small rounding differences
                expect(Math.abs(actualWidth - expectedWidth)).toBeLessThanOrEqual(1);
              }
            });
            
            unmount();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 31: Mobile Sidebar Shadow', () => {
    // Feature: dashboard-shopify-migration, Property 31: Mobile Sidebar Shadow
    it('should apply shadow when sidebar is open', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 320, max: 1023 }),
          async (viewportWidth) => {
            global.innerWidth = viewportWidth;
            
            const { container, unmount } = render(<MobileSidebar />);
            
            // Open sidebar
            const hamburgerButtons = screen.getAllByLabelText(/toggle menu/i);
            const hamburgerButton = hamburgerButtons[0];
            fireEvent.click(hamburgerButton);
            
            await waitFor(() => {
              const sidebar = container.querySelector('aside');
              expect(sidebar).toBeTruthy();
              
              if (sidebar) {
                const style = window.getComputedStyle(sidebar);
                const boxShadow = style.boxShadow;
                
                // Should have a shadow (not 'none')
                expect(boxShadow).not.toBe('none');
                expect(boxShadow.length).toBeGreaterThan(0);
              }
            });
            
            unmount();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Integration: Backdrop Overlay', () => {
    it('should toggle sidebar state when hamburger is clicked', async () => {
      global.innerWidth = 768;
      
      const { container } = render(<MobileSidebar />);
      
      // Get hamburger button
      const hamburgerButton = screen.getAllByLabelText(/toggle menu/i)[0];
      
      // Verify initial state
      expect(hamburgerButton.getAttribute('aria-expanded')).toBe('false');
      
      // Click to open
      fireEvent.click(hamburgerButton);
      
      // Verify state changed
      expect(hamburgerButton.getAttribute('aria-expanded')).toBe('true');
      
      // Verify sidebar exists and has proper structure
      const sidebar = container.querySelector('aside');
      expect(sidebar).toBeTruthy();
      expect(sidebar?.classList.contains('lg:hidden')).toBe(true);
    });

    it('should close sidebar when backdrop is clicked', async () => {
      global.innerWidth = 768;
      
      const { container } = render(<MobileSidebar />);
      
      // Open sidebar
      const hamburgerButton = screen.getAllByLabelText(/toggle menu/i)[0];
      fireEvent.click(hamburgerButton);
      
      // Find and click backdrop
      await waitFor(() => {
        const allDivs = container.querySelectorAll('div');
        let backdrop: Element | null = null;
        
        allDivs.forEach(div => {
          const style = window.getComputedStyle(div);
          const bgColor = style.backgroundColor;
          
          if (bgColor.includes('rgba(0, 0, 0, 0.5)') || bgColor.includes('rgba(0,0,0,0.5)')) {
            backdrop = div;
          }
        });
        
        expect(backdrop).toBeTruthy();
        
        if (backdrop) {
          fireEvent.click(backdrop);
        }
      });
      
      // Verify sidebar is closed
      await waitFor(() => {
        const sidebar = container.querySelector('aside');
        if (sidebar) {
          const style = window.getComputedStyle(sidebar);
          const transform = style.transform;
          
          // Should be closed (translateX(-100%))
          const isClosed = 
            transform.includes('translateX(-100%)') || 
            transform.includes('matrix(1, 0, 0, 1, -');
          
          expect(isClosed).toBe(true);
        }
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      global.innerWidth = 768;
      
      const { container } = render(<MobileSidebar />);
      
      const hamburgerButton = screen.getAllByLabelText(/toggle menu/i)[0];
      expect(hamburgerButton.getAttribute('aria-expanded')).toBe('false');
      
      // Open sidebar
      fireEvent.click(hamburgerButton);
      
      expect(hamburgerButton.getAttribute('aria-expanded')).toBe('true');
      
      const sidebar = container.querySelector('aside');
      expect(sidebar?.getAttribute('aria-hidden')).toBe('false');
    });
  });

  describe('Desktop Behavior', () => {
    it('should hide mobile sidebar components on desktop (≥1024px)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1024, max: 2560 }),
          (viewportWidth) => {
            global.innerWidth = viewportWidth;
            
            const { container, unmount } = render(<MobileSidebar />);
            
            // Hamburger button should have lg:hidden class
            const hamburgerButton = screen.getAllByLabelText(/toggle menu/i)[0];
            expect(hamburgerButton.className).toContain('lg:hidden');
            
            // Sidebar should also have lg:hidden class
            const sidebar = container.querySelector('aside');
            expect(sidebar?.className).toContain('lg:hidden');
            
            // Clean up to avoid multiple instances
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
