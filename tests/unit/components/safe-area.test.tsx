/**
 * Safe Area Components Unit Tests
 * 
 * Tests for iOS safe area components and utilities.
 * 
 * Design Reference: mobile-ux-marketing-refactor/design.md
 * Validates: Requirements 1.4
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  SafeAreaTop,
  SafeAreaBottom,
  SafeAreaLeft,
  SafeAreaRight,
  SafeAreaInset,
  SafeAreaHeader,
  SafeAreaFooter,
} from '@/components/layout/SafeArea';

describe('SafeArea Components', () => {
  describe('SafeAreaTop', () => {
    it('should render children with top safe area padding', () => {
      render(
        <SafeAreaTop data-testid="safe-area-top">
          <div>Content</div>
        </SafeAreaTop>
      );

      const element = screen.getByTestId('safe-area-top');
      expect(element).toBeInTheDocument();
      expect(element).toHaveClass('pt-[var(--sat)]');
    });

    it('should accept additional className', () => {
      render(
        <SafeAreaTop className="custom-class" data-testid="safe-area-top">
          <div>Content</div>
        </SafeAreaTop>
      );

      const element = screen.getByTestId('safe-area-top');
      expect(element).toHaveClass('pt-[var(--sat)]');
      expect(element).toHaveClass('custom-class');
    });
  });

  describe('SafeAreaBottom', () => {
    it('should render children with bottom safe area padding', () => {
      render(
        <SafeAreaBottom data-testid="safe-area-bottom">
          <div>Content</div>
        </SafeAreaBottom>
      );

      const element = screen.getByTestId('safe-area-bottom');
      expect(element).toBeInTheDocument();
      expect(element).toHaveClass('pb-[var(--sab)]');
    });

    it('should accept additional className', () => {
      render(
        <SafeAreaBottom className="bg-surface" data-testid="safe-area-bottom">
          <div>Content</div>
        </SafeAreaBottom>
      );

      const element = screen.getByTestId('safe-area-bottom');
      expect(element).toHaveClass('pb-[var(--sab)]');
      expect(element).toHaveClass('bg-surface');
    });
  });

  describe('SafeAreaLeft', () => {
    it('should render children with left safe area padding', () => {
      render(
        <SafeAreaLeft data-testid="safe-area-left">
          <div>Content</div>
        </SafeAreaLeft>
      );

      const element = screen.getByTestId('safe-area-left');
      expect(element).toBeInTheDocument();
      expect(element).toHaveClass('pl-[var(--sal)]');
    });
  });

  describe('SafeAreaRight', () => {
    it('should render children with right safe area padding', () => {
      render(
        <SafeAreaRight data-testid="safe-area-right">
          <div>Content</div>
        </SafeAreaRight>
      );

      const element = screen.getByTestId('safe-area-right');
      expect(element).toBeInTheDocument();
      expect(element).toHaveClass('pr-[var(--sar)]');
    });
  });

  describe('SafeAreaInset', () => {
    it('should render children with all safe area padding', () => {
      render(
        <SafeAreaInset data-testid="safe-area-inset">
          <div>Content</div>
        </SafeAreaInset>
      );

      const element = screen.getByTestId('safe-area-inset');
      expect(element).toBeInTheDocument();
      expect(element).toHaveClass('pt-[var(--sat)]');
      expect(element).toHaveClass('pb-[var(--sab)]');
      expect(element).toHaveClass('pl-[var(--sal)]');
      expect(element).toHaveClass('pr-[var(--sar)]');
    });
  });

  describe('SafeAreaHeader', () => {
    it('should render as header element with safe area and styling', () => {
      render(
        <SafeAreaHeader data-testid="safe-area-header">
          <nav>Navigation</nav>
        </SafeAreaHeader>
      );

      const element = screen.getByTestId('safe-area-header');
      expect(element.tagName).toBe('HEADER');
      expect(element).toHaveClass('pt-[var(--sat)]');
      expect(element).toHaveClass('sticky');
      expect(element).toHaveClass('top-0');
      expect(element).toHaveClass('z-40');
      expect(element).toHaveClass('border-b');
      expect(element).toHaveClass('backdrop-blur-md');
    });

    it('should allow custom className to override styles', () => {
      render(
        <SafeAreaHeader className="z-50 bg-primary" data-testid="safe-area-header">
          <nav>Navigation</nav>
        </SafeAreaHeader>
      );

      const element = screen.getByTestId('safe-area-header');
      expect(element).toHaveClass('z-50');
      expect(element).toHaveClass('bg-primary');
    });
  });

  describe('SafeAreaFooter', () => {
    it('should render as footer element with safe area and styling', () => {
      render(
        <SafeAreaFooter data-testid="safe-area-footer">
          <nav>Footer Navigation</nav>
        </SafeAreaFooter>
      );

      const element = screen.getByTestId('safe-area-footer');
      expect(element.tagName).toBe('FOOTER');
      expect(element).toHaveClass('pb-[var(--sab)]');
      expect(element).toHaveClass('border-t');
      expect(element).toHaveClass('bg-surface');
    });

    it('should allow custom className to override styles', () => {
      render(
        <SafeAreaFooter className="bg-primary" data-testid="safe-area-footer">
          <nav>Footer Navigation</nav>
        </SafeAreaFooter>
      );

      const element = screen.getByTestId('safe-area-footer');
      expect(element).toHaveClass('bg-primary');
    });
  });

  describe('Content Rendering', () => {
    it('should render children content correctly', () => {
      render(
        <SafeAreaTop>
          <div data-testid="child-content">Test Content</div>
        </SafeAreaTop>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <SafeAreaInset>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </SafeAreaInset>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });
  });

  describe('HTML Attributes', () => {
    it('should pass through additional HTML attributes', () => {
      render(
        <SafeAreaTop
          data-testid="safe-area-top"
          aria-label="Top safe area"
          role="banner"
        >
          <div>Content</div>
        </SafeAreaTop>
      );

      const element = screen.getByTestId('safe-area-top');
      expect(element).toHaveAttribute('aria-label', 'Top safe area');
      expect(element).toHaveAttribute('role', 'banner');
    });
  });
});

describe('Safe Area CSS Variables', () => {
  it('should use correct CSS variable names', () => {
    const { container } = render(
      <SafeAreaTop data-testid="test">
        <div>Content</div>
      </SafeAreaTop>
    );

    const element = container.querySelector('[data-testid="test"]');
    const classes = element?.className || '';
    
    // Verify the CSS variable format is correct
    expect(classes).toContain('pt-[var(--sat)]');
  });

  it('should use all four safe area variables in SafeAreaInset', () => {
    const { container } = render(
      <SafeAreaInset data-testid="test">
        <div>Content</div>
      </SafeAreaInset>
    );

    const element = container.querySelector('[data-testid="test"]');
    const classes = element?.className || '';
    
    expect(classes).toContain('pt-[var(--sat)]');
    expect(classes).toContain('pb-[var(--sab)]');
    expect(classes).toContain('pl-[var(--sal)]');
    expect(classes).toContain('pr-[var(--sar)]');
  });
});
