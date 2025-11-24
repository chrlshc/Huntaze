/**
 * Unit Tests for Skeleton Screen Components
 * 
 * Tests specific examples and edge cases for skeleton screen rendering
 * 
 * Feature: linear-ui-performance-refactor
 * Requirements: 6.1, 6.2, 6.5
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { SkeletonScreen } from '@/components/layout/SkeletonScreen';

describe('SkeletonScreen Component', () => {
  describe('Variant Rendering', () => {
    it('should render dashboard variant correctly', () => {
      const { container } = render(<SkeletonScreen variant="dashboard" />);
      
      const dashboardSkeleton = container.querySelector('[data-testid="skeleton-dashboard"]');
      expect(dashboardSkeleton).toBeTruthy();
      
      // Dashboard should have header, stats grid, and main content
      const header = container.querySelector('[data-testid="skeleton-header"]');
      expect(header).toBeTruthy();
    });

    it('should render form variant correctly', () => {
      const { container } = render(<SkeletonScreen variant="form" />);
      
      const formSkeleton = container.querySelector('[data-testid="skeleton-form"]');
      expect(formSkeleton).toBeTruthy();
      
      // Form should have title, inputs, and button
      const formTitle = container.querySelector('[data-testid="skeleton-form-title"]');
      expect(formTitle).toBeTruthy();
      
      const inputs = container.querySelectorAll('[data-testid="skeleton-input"]');
      expect(inputs.length).toBeGreaterThan(0);
      
      const button = container.querySelector('[data-testid="skeleton-button"]');
      expect(button).toBeTruthy();
    });

    it('should render card variant correctly', () => {
      const { container } = render(<SkeletonScreen variant="card" />);
      
      const cardSkeleton = container.querySelector('[data-testid="skeleton-card"]');
      expect(cardSkeleton).toBeTruthy();
      
      // Should have default 3 cards
      const cards = container.querySelectorAll('[data-testid^="skeleton-card-item-"]');
      expect(cards.length).toBe(3);
    });

    it('should render list variant correctly', () => {
      const { container } = render(<SkeletonScreen variant="list" />);
      
      const listSkeleton = container.querySelector('[data-testid="skeleton-list"]');
      expect(listSkeleton).toBeTruthy();
      
      // Should have default 3 list items
      const items = container.querySelectorAll('[data-testid^="skeleton-list-item-"]');
      expect(items.length).toBe(3);
    });
  });

  describe('Animation', () => {
    it('should apply animation by default', () => {
      const { container } = render(<SkeletonScreen variant="dashboard" />);
      
      const skeletonElements = container.querySelectorAll('[data-skeleton="true"]');
      expect(skeletonElements.length).toBeGreaterThan(0);
      
      skeletonElements.forEach(element => {
        expect(element.className).toContain('skeleton-pulse');
        expect(element.getAttribute('data-animated')).toBe('true');
      });
    });

    it('should not apply animation when animate is false', () => {
      const { container } = render(<SkeletonScreen variant="dashboard" animate={false} />);
      
      const skeletonElements = container.querySelectorAll('[data-skeleton="true"]');
      expect(skeletonElements.length).toBeGreaterThan(0);
      
      skeletonElements.forEach(element => {
        expect(element.className).not.toContain('skeleton-pulse');
        expect(element.getAttribute('data-animated')).toBe('false');
      });
    });

    it('should apply animation to all variants when enabled', () => {
      const variants = ['dashboard', 'form', 'card', 'list'] as const;
      
      variants.forEach(variant => {
        const { container } = render(<SkeletonScreen variant={variant} animate={true} />);
        
        const skeletonElements = container.querySelectorAll('[data-skeleton="true"]');
        expect(skeletonElements.length).toBeGreaterThan(0);
        
        skeletonElements.forEach(element => {
          expect(element.className).toContain('skeleton-pulse');
        });
      });
    });
  });

  describe('Count Property', () => {
    it('should render custom count for card variant', () => {
      const { container } = render(<SkeletonScreen variant="card" count={5} />);
      
      const cards = container.querySelectorAll('[data-testid^="skeleton-card-item-"]');
      expect(cards.length).toBe(5);
    });

    it('should render custom count for list variant', () => {
      const { container } = render(<SkeletonScreen variant="list" count={7} />);
      
      const items = container.querySelectorAll('[data-testid^="skeleton-list-item-"]');
      expect(items.length).toBe(7);
    });

    it('should use default count of 3 when not specified for card', () => {
      const { container } = render(<SkeletonScreen variant="card" />);
      
      const cards = container.querySelectorAll('[data-testid^="skeleton-card-item-"]');
      expect(cards.length).toBe(3);
    });

    it('should use default count of 3 when not specified for list', () => {
      const { container } = render(<SkeletonScreen variant="list" />);
      
      const items = container.querySelectorAll('[data-testid^="skeleton-list-item-"]');
      expect(items.length).toBe(3);
    });

    it('should handle count of 1', () => {
      const { container } = render(<SkeletonScreen variant="card" count={1} />);
      
      const cards = container.querySelectorAll('[data-testid^="skeleton-card-item-"]');
      expect(cards.length).toBe(1);
    });

    it('should handle large count values', () => {
      const { container } = render(<SkeletonScreen variant="list" count={20} />);
      
      const items = container.querySelectorAll('[data-testid^="skeleton-list-item-"]');
      expect(items.length).toBe(20);
    });
  });

  describe('Data Attributes', () => {
    it('should have correct data attributes on skeleton screen', () => {
      const { container } = render(<SkeletonScreen variant="dashboard" />);
      
      const skeletonScreen = container.querySelector('[data-testid="skeleton-screen"]');
      expect(skeletonScreen?.getAttribute('data-loading')).toBe('true');
      expect(skeletonScreen?.getAttribute('data-variant')).toBe('dashboard');
    });

    it('should mark all skeleton elements with data-skeleton attribute', () => {
      const { container } = render(<SkeletonScreen variant="form" />);
      
      const skeletonElements = container.querySelectorAll('[data-skeleton="true"]');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('should have correct variant attribute for all variants', () => {
      const variants = ['dashboard', 'form', 'card', 'list'] as const;
      
      variants.forEach(variant => {
        const { container } = render(<SkeletonScreen variant={variant} />);
        
        const skeletonScreen = container.querySelector('[data-testid="skeleton-screen"]');
        expect(skeletonScreen?.getAttribute('data-variant')).toBe(variant);
      });
    });
  });

  describe('CSS Classes', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <SkeletonScreen variant="dashboard" className="custom-class" />
      );
      
      const skeletonScreen = container.querySelector('[data-testid="skeleton-screen"]');
      expect(skeletonScreen?.className).toContain('custom-class');
    });

    it('should maintain base classes with custom className', () => {
      const { container } = render(
        <SkeletonScreen variant="dashboard" className="custom-class" />
      );
      
      const skeletonScreen = container.querySelector('[data-testid="skeleton-screen"]');
      expect(skeletonScreen?.className).toContain('skeleton-screen');
      expect(skeletonScreen?.className).toContain('custom-class');
    });
  });

  describe('Skeleton Structure', () => {
    it('should have consistent structure for dashboard variant', () => {
      const { container } = render(<SkeletonScreen variant="dashboard" />);
      
      // Should have multiple skeleton elements
      const skeletonElements = container.querySelectorAll('[data-skeleton="true"]');
      expect(skeletonElements.length).toBeGreaterThan(5);
      
      // Should have grid layouts
      const grids = container.querySelectorAll('.grid');
      expect(grids.length).toBeGreaterThan(0);
    });

    it('should have consistent structure for form variant', () => {
      const { container } = render(<SkeletonScreen variant="form" />);
      
      // Should have form title
      const title = container.querySelector('[data-testid="skeleton-form-title"]');
      expect(title).toBeTruthy();
      
      // Should have multiple input fields
      const inputs = container.querySelectorAll('[data-testid="skeleton-input"]');
      expect(inputs.length).toBeGreaterThan(1);
      
      // Should have submit button
      const button = container.querySelector('[data-testid="skeleton-button"]');
      expect(button).toBeTruthy();
    });

    it('should have consistent structure for card items', () => {
      const { container } = render(<SkeletonScreen variant="card" count={2} />);
      
      const cards = container.querySelectorAll('[data-testid^="skeleton-card-item-"]');
      expect(cards.length).toBe(2);
      
      // Each card should have multiple skeleton elements
      cards.forEach(card => {
        const skeletonElements = card.querySelectorAll('[data-skeleton="true"]');
        expect(skeletonElements.length).toBeGreaterThan(2);
      });
    });

    it('should have consistent structure for list items', () => {
      const { container } = render(<SkeletonScreen variant="list" count={2} />);
      
      const items = container.querySelectorAll('[data-testid^="skeleton-list-item-"]');
      expect(items.length).toBe(2);
      
      // Each list item should have avatar and text skeletons
      items.forEach(item => {
        const skeletonElements = item.querySelectorAll('[data-skeleton="true"]');
        expect(skeletonElements.length).toBeGreaterThan(1);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle count of 0 gracefully', () => {
      const { container } = render(<SkeletonScreen variant="card" count={0} />);
      
      const cards = container.querySelectorAll('[data-testid^="skeleton-card-item-"]');
      expect(cards.length).toBe(0);
    });

    it('should render without errors when all props are provided', () => {
      expect(() => {
        render(
          <SkeletonScreen 
            variant="dashboard" 
            count={5} 
            animate={true} 
            className="test-class"
          />
        );
      }).not.toThrow();
    });

    it('should render without errors with minimal props', () => {
      expect(() => {
        render(<SkeletonScreen variant="dashboard" />);
      }).not.toThrow();
    });
  });

  describe('Responsive Behavior', () => {
    it('should have responsive grid classes for card variant', () => {
      const { container } = render(<SkeletonScreen variant="card" />);
      
      const grid = container.querySelector('.grid');
      expect(grid?.className).toContain('grid-cols-1');
      expect(grid?.className).toContain('md:grid-cols-2');
      expect(grid?.className).toContain('lg:grid-cols-3');
    });

    it('should have responsive grid classes for dashboard variant', () => {
      const { container } = render(<SkeletonScreen variant="dashboard" />);
      
      const grids = container.querySelectorAll('.grid');
      expect(grids.length).toBeGreaterThan(0);
      
      // Check for responsive classes
      let hasResponsiveClasses = false;
      grids.forEach(grid => {
        if (grid.className.includes('md:') || grid.className.includes('lg:')) {
          hasResponsiveClasses = true;
        }
      });
      expect(hasResponsiveClasses).toBe(true);
    });
  });
});
