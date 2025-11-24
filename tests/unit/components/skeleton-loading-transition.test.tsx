/**
 * Integration Tests for Skeleton Loading Transitions
 * 
 * Tests application-level behavior of conditional rendering between
 * skeleton screens and actual content. These tests verify that parent
 * components can correctly manage the display of skeleton vs content
 * based on loading state.
 * 
 * Feature: linear-ui-performance-refactor
 * Property 20: Skeleton to content transition
 * Validates: Requirements 6.3
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { SkeletonScreen, SkeletonVariant } from '@/components/layout/SkeletonScreen';

/**
 * Test component that demonstrates conditional rendering pattern
 */
const PageWithConditionalRendering: React.FC<{
  variant: SkeletonVariant;
  isLoading: boolean;
  content: React.ReactNode;
}> = ({ variant, isLoading, content }) => {
  return (
    <div>
      {isLoading ? (
        <SkeletonScreen variant={variant} />
      ) : (
        <div data-testid="actual-content">{content}</div>
      )}
    </div>
  );
};

describe('Skeleton Loading Transition Integration Tests', () => {
  /**
   * Property 20: Skeleton to content transition
   * 
   * Tests that parent components can correctly manage conditional rendering
   * between skeleton screens and actual content based on loading state.
   */
  describe('Property 20: Skeleton to content transition', () => {
    it('should display skeleton when isLoading is true', () => {
      const { container, queryByTestId } = render(
        <PageWithConditionalRendering 
          variant="dashboard" 
          isLoading={true}
          content={<div>Dashboard Content</div>}
        />
      );

      // Skeleton should be present
      const skeleton = container.querySelector('[data-testid="skeleton-screen"]');
      expect(skeleton).toBeTruthy();
      
      // Content should not be present
      expect(queryByTestId('actual-content')).toBeNull();
    });

    it('should display content when isLoading is false', () => {
      const { container, queryByTestId } = render(
        <PageWithConditionalRendering 
          variant="dashboard" 
          isLoading={false}
          content={<div>Dashboard Content</div>}
        />
      );

      // Skeleton should not be present
      const skeleton = container.querySelector('[data-testid="skeleton-screen"]');
      expect(skeleton).toBeNull();
      
      // Content should be present
      const actualContent = queryByTestId('actual-content');
      expect(actualContent).toBeTruthy();
      expect(actualContent?.textContent).toBe('Dashboard Content');
    });

    it('should not have skeleton elements when content is displayed', () => {
      const { container } = render(
        <PageWithConditionalRendering 
          variant="form" 
          isLoading={false}
          content={<div>Form Content</div>}
        />
      );

      // Verify no skeleton elements remain
      const skeletonElements = container.querySelectorAll('[data-skeleton="true"]');
      expect(skeletonElements.length).toBe(0);
      
      const skeletonScreen = container.querySelector('[data-loading="true"]');
      expect(skeletonScreen).toBeNull();
    });

    it('should support conditional rendering for all variants', () => {
      const variants: SkeletonVariant[] = ['dashboard', 'form', 'card', 'list'];

      variants.forEach(variant => {
        // Test loading state
        const { container: loadingContainer, unmount: unmountLoading } = render(
          <PageWithConditionalRendering 
            variant={variant} 
            isLoading={true}
            content={<div>Test Content</div>}
          />
        );

        const variantSkeleton = loadingContainer.querySelector(`[data-testid="skeleton-${variant}"]`);
        expect(variantSkeleton).toBeTruthy();
        unmountLoading();

        // Test loaded state
        const { container: loadedContainer, queryByTestId, unmount: unmountLoaded } = render(
          <PageWithConditionalRendering 
            variant={variant} 
            isLoading={false}
            content={<div>Test Content</div>}
          />
        );

        const finalVariantSkeleton = loadedContainer.querySelector(`[data-testid="skeleton-${variant}"]`);
        expect(finalVariantSkeleton).toBeNull();
        
        const actualContent = queryByTestId('actual-content');
        expect(actualContent).toBeTruthy();
        unmountLoaded();
      });
    });

    it('should render complex content structures when not loading', () => {
      const ComplexContent = () => (
        <div>
          <header>Header</header>
          <main>
            <section>Section 1</section>
            <section>Section 2</section>
          </main>
          <footer>Footer</footer>
        </div>
      );

      const { container, queryByTestId } = render(
        <PageWithConditionalRendering 
          variant="dashboard" 
          isLoading={false}
          content={<ComplexContent />}
        />
      );

      // Verify skeleton is not present
      const skeleton = container.querySelector('[data-testid="skeleton-screen"]');
      expect(skeleton).toBeNull();

      // Verify complex content is present
      const actualContent = queryByTestId('actual-content');
      expect(actualContent).toBeTruthy();
      expect(actualContent?.querySelector('header')).toBeTruthy();
      expect(actualContent?.querySelector('main')).toBeTruthy();
      expect(actualContent?.querySelector('footer')).toBeTruthy();
      expect(actualContent?.querySelectorAll('section').length).toBe(2);
    });

    it('should support error state rendering', () => {
      const ErrorContent = () => <div data-testid="error-content">Error occurred</div>;

      const { container, queryByTestId } = render(
        <PageWithConditionalRendering 
          variant="form" 
          isLoading={false}
          content={<ErrorContent />}
        />
      );

      // Verify skeleton is not present
      const skeleton = container.querySelector('[data-testid="skeleton-screen"]');
      expect(skeleton).toBeNull();

      // Verify error content is shown
      const errorContent = queryByTestId('error-content');
      expect(errorContent).toBeTruthy();
    });

    it('should support empty state rendering', () => {
      const { container, queryByTestId } = render(
        <PageWithConditionalRendering 
          variant="list" 
          isLoading={false}
          content={<div data-testid="empty-state">No items found</div>}
        />
      );

      // Verify skeleton is not present
      const skeleton = container.querySelector('[data-testid="skeleton-screen"]');
      expect(skeleton).toBeNull();

      // Verify empty state is shown
      const emptyState = queryByTestId('empty-state');
      expect(emptyState?.textContent).toBe('No items found');
    });

    it('should render different content for different loading states', () => {
      const content = 'Loaded Content';
      
      // Render with loading=true
      const { container: loadingContainer, queryByTestId: queryLoading, rerender } = render(
        <PageWithConditionalRendering 
          variant="card" 
          isLoading={true}
          content={<div>{content}</div>}
        />
      );

      expect(loadingContainer.querySelector('[data-testid="skeleton-screen"]')).toBeTruthy();
      expect(queryLoading('actual-content')).toBeNull();

      // Re-render with loading=false
      rerender(
        <PageWithConditionalRendering 
          variant="card" 
          isLoading={false}
          content={<div>{content}</div>}
        />
      );

      expect(loadingContainer.querySelector('[data-testid="skeleton-screen"]')).toBeNull();
      const actualContent = queryLoading('actual-content');
      expect(actualContent).toBeTruthy();
      expect(actualContent?.textContent).toBe(content);
    });
  });

  describe('Loading State Management Patterns', () => {
    it('should show skeleton when loading state is true', () => {
      const { container } = render(
        <PageWithConditionalRendering 
          variant="dashboard" 
          isLoading={true}
          content={<div>Content</div>}
        />
      );

      const skeleton = container.querySelector('[data-testid="skeleton-screen"]');
      expect(skeleton).toBeTruthy();
    });

    it('should not show blank screen during loading', () => {
      const { container } = render(
        <PageWithConditionalRendering 
          variant="card" 
          isLoading={true}
          content={<div>Content</div>}
        />
      );

      // Should have skeleton elements, not blank
      const skeletonElements = container.querySelectorAll('[data-skeleton="true"]');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('should support immediate content display when not loading', () => {
      const { container, queryByTestId } = render(
        <PageWithConditionalRendering 
          variant="form" 
          isLoading={false}
          content={<div>Instant Content</div>}
        />
      );

      // Content should be present immediately
      const actualContent = queryByTestId('actual-content');
      expect(actualContent).toBeTruthy();
      
      // Skeleton should not be present
      const skeleton = container.querySelector('[data-testid="skeleton-screen"]');
      expect(skeleton).toBeNull();
    });

    it('should support multiple skeleton variants in conditional rendering', () => {
      const variants: SkeletonVariant[] = ['dashboard', 'form', 'card', 'list'];
      
      variants.forEach(variant => {
        const { container, unmount } = render(
          <PageWithConditionalRendering 
            variant={variant} 
            isLoading={true}
            content={<div>Content</div>}
          />
        );

        const skeleton = container.querySelector(`[data-testid="skeleton-${variant}"]`);
        expect(skeleton).toBeTruthy();
        
        unmount();
      });
    });
  });
});
