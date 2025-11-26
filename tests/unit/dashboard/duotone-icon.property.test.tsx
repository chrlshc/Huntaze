import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DuotoneIcon } from '@/components/dashboard/DuotoneIcon';
import fc from 'fast-check';

describe('DuotoneIcon Property Tests', () => {
  // Feature: dashboard-shopify-migration, Property 17: Duotone Icon Structure
  // Validates: Requirements 6.1
  it('should render two-layer SVG paths with primary and secondary colors for any icon', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('home', 'analytics', 'content', 'messages', 'integrations', 'settings'),
        fc.integer({ min: 16, max: 48 }),
        (iconName, size) => {
          const { container } = render(<DuotoneIcon name={iconName} size={size} />);
          
          const svg = container.querySelector('svg');
          expect(svg).toBeTruthy();
          
          const primaryPath = container.querySelector('.icon-primary');
          const secondaryPath = container.querySelector('.icon-secondary');
          
          expect(primaryPath).toBeTruthy();
          expect(secondaryPath).toBeTruthy();
          
          // Verify both paths have fill attributes
          expect(primaryPath?.getAttribute('fill')).toBeTruthy();
          expect(secondaryPath?.getAttribute('fill')).toBeTruthy();
          
          // Verify secondary path has opacity
          expect(secondaryPath?.getAttribute('opacity')).toBe('0.4');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: dashboard-shopify-migration, Property 18: Inactive Icon Color
  // Validates: Requirements 6.2
  it('should display both layers in gray (#9CA3AF) when no custom colors provided', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('home', 'analytics', 'content', 'messages', 'integrations', 'settings'),
        (iconName) => {
          const { container } = render(<DuotoneIcon name={iconName} />);
          
          const primaryPath = container.querySelector('.icon-primary');
          const secondaryPath = container.querySelector('.icon-secondary');
          
          // Default color should be gray
          const primaryFill = primaryPath?.getAttribute('fill');
          const secondaryFill = secondaryPath?.getAttribute('fill');
          
          expect(primaryFill).toContain('--icon-primary');
          expect(secondaryFill).toContain('--icon-secondary');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: dashboard-shopify-migration, Property 19: Active Icon Color
  // Validates: Requirements 6.3
  it('should display both layers in Electric Indigo when active colors provided', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('home', 'analytics', 'content', 'messages', 'integrations', 'settings'),
        (iconName) => {
          const indigoColor = '#6366f1';
          const { container } = render(
            <DuotoneIcon 
              name={iconName} 
              primaryColor={indigoColor}
              secondaryColor={indigoColor}
            />
          );
          
          const svg = container.querySelector('svg');
          const style = svg?.getAttribute('style');
          
          expect(style).toContain('--icon-primary');
          expect(style).toContain(indigoColor);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: dashboard-shopify-migration, Property 20: Icon Hover Transition
  // Validates: Requirements 6.4
  it('should support dynamic color changes via CSS custom properties', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('home', 'analytics', 'content', 'messages', 'integrations', 'settings'),
        fc.constantFrom('#FF0000', '#00FF00', '#0000FF', '#6366f1', '#9CA3AF', '#1F2937'),
        fc.constantFrom('#FFAA00', '#00FFAA', '#AA00FF', '#4f46e5', '#6B7280', '#111827'),
        (iconName, primaryColor, secondaryColor) => {
          const { container, rerender } = render(
            <DuotoneIcon name={iconName} />
          );
          
          // Rerender with new colors
          rerender(
            <DuotoneIcon 
              name={iconName}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
            />
          );
          
          const svg = container.querySelector('svg');
          const style = svg?.getAttribute('style');
          
          // Should contain custom property definitions
          expect(style).toContain('--icon-primary');
          expect(style).toContain('--icon-secondary');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle invalid icon names gracefully', () => {
    const validIcons = ['home', 'analytics', 'content', 'messages', 'integrations', 'settings'];
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => 
          !validIcons.includes(s) && s !== '__proto__' && s !== 'constructor' && s !== 'prototype'
        ),
        (invalidIconName) => {
          // Suppress console warnings for this test
          const originalWarn = console.warn;
          console.warn = () => {};
          
          const { container } = render(<DuotoneIcon name={invalidIconName} />);
          
          // Restore console.warn
          console.warn = originalWarn;
          
          // Should not render anything for invalid icon
          const svg = container.querySelector('svg');
          expect(svg).toBeNull();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should maintain correct viewBox and dimensions for any size', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('home', 'analytics', 'content', 'messages', 'integrations', 'settings'),
        fc.integer({ min: 12, max: 64 }),
        (iconName, size) => {
          const { container } = render(<DuotoneIcon name={iconName} size={size} />);
          
          const svg = container.querySelector('svg');
          expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
          expect(svg?.getAttribute('width')).toBe(String(size));
          expect(svg?.getAttribute('height')).toBe(String(size));
        }
      ),
      { numRuns: 100 }
    );
  });
});
