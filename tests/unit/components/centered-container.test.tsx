/**
 * CenteredContainer Component Unit Tests
 * 
 * Tests for the CenteredContainer layout component.
 * 
 * Design Reference: linear-ui-performance-refactor/design.md
 * Validates: Requirements 4.1, 4.2, 4.3
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { CenteredContainer } from '@/components/layout/CenteredContainer';

describe('CenteredContainer Component', () => {
  describe('Max-width variants', () => {
    it('should render with 75rem (1200px) max-width for sm variant', () => {
      render(
        <CenteredContainer maxWidth="sm">
          <div>Test Content</div>
        </CenteredContainer>
      );

      const container = screen.getByTestId('centered-container');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('max-w-[75rem]');
    });

    it('should render with 80rem (1280px) max-width for lg variant', () => {
      render(
        <CenteredContainer maxWidth="lg">
          <div>Test Content</div>
        </CenteredContainer>
      );

      const container = screen.getByTestId('centered-container');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('max-w-[80rem]');
    });

    it('should default to lg variant when maxWidth not specified', () => {
      render(
        <CenteredContainer>
          <div>Test Content</div>
        </CenteredContainer>
      );

      const container = screen.getByTestId('centered-container');
      expect(container).toHaveClass('max-w-[80rem]');
    });

    it('should apply only one max-width class', () => {
      const { container: containerSm } = render(
        <CenteredContainer maxWidth="sm">
          <div>Test Content</div>
        </CenteredContainer>
      );

      const elementSm = containerSm.querySelector('[data-testid="centered-container"]');
      const classesSm = elementSm?.className || '';
      
      expect(classesSm).toContain('max-w-[75rem]');
      expect(classesSm).not.toContain('max-w-[80rem]');

      const { container: containerLg } = render(
        <CenteredContainer maxWidth="lg">
          <div>Test Content</div>
        </CenteredContainer>
      );

      const elementLg = containerLg.querySelector('[data-testid="centered-container"]');
      const classesLg = elementLg?.className || '';
      
      expect(classesLg).toContain('max-w-[80rem]');
      expect(classesLg).not.toContain('max-w-[75rem]');
    });
  });

  describe('Padding application', () => {
    it('should apply default 24px padding', () => {
      render(
        <CenteredContainer>
          <div>Test Content</div>
        </CenteredContainer>
      );

      const container = screen.getByTestId('centered-container');
      expect(container).toHaveClass('p-[24px]');
    });

    it('should apply custom padding when specified', () => {
      render(
        <CenteredContainer padding={16}>
          <div>Test Content</div>
        </CenteredContainer>
      );

      const container = screen.getByTestId('centered-container');
      expect(container).toHaveClass('p-[16px]');
    });

    it('should accept padding values in multiples of 4', () => {
      const paddingValues = [4, 8, 12, 16, 20, 24, 32, 40, 48];

      paddingValues.forEach(padding => {
        const { container } = render(
          <CenteredContainer padding={padding}>
            <div>Test Content</div>
          </CenteredContainer>
        );

        const element = container.querySelector('[data-testid="centered-container"]');
        expect(element).toHaveClass(`p-[${padding}px]`);
      });
    });

    it('should override default padding with custom value', () => {
      const { container } = render(
        <CenteredContainer padding={32}>
          <div>Test Content</div>
        </CenteredContainer>
      );

      const element = container.querySelector('[data-testid="centered-container"]');
      const classes = element?.className || '';
      
      expect(classes).toContain('p-[32px]');
      expect(classes).not.toContain('p-[24px]');
    });
  });

  describe('Responsive behavior', () => {
    it('should maintain max-width constraint on all viewport sizes', () => {
      render(
        <CenteredContainer maxWidth="sm">
          <div>Test Content</div>
        </CenteredContainer>
      );

      const container = screen.getByTestId('centered-container');
      
      // Max-width should be present regardless of viewport
      expect(container).toHaveClass('max-w-[75rem]');
      expect(container).toHaveClass('mx-auto');
    });

    it('should apply horizontal centering for responsive layouts', () => {
      render(
        <CenteredContainer>
          <div>Test Content</div>
        </CenteredContainer>
      );

      const container = screen.getByTestId('centered-container');
      expect(container).toHaveClass('mx-auto');
    });

    it('should maintain padding on all viewport sizes', () => {
      render(
        <CenteredContainer padding={16}>
          <div>Test Content</div>
        </CenteredContainer>
      );

      const container = screen.getByTestId('centered-container');
      expect(container).toHaveClass('p-[16px]');
    });
  });

  describe('Children rendering', () => {
    it('should render children content correctly', () => {
      render(
        <CenteredContainer>
          <div data-testid="child-content">Test Content</div>
        </CenteredContainer>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <CenteredContainer>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <div data-testid="child-3">Child 3</div>
        </CenteredContainer>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });

    it('should render complex nested children', () => {
      render(
        <CenteredContainer>
          <div data-testid="parent">
            <div data-testid="child">
              <span data-testid="grandchild">Nested Content</span>
            </div>
          </div>
        </CenteredContainer>
      );

      expect(screen.getByTestId('parent')).toBeInTheDocument();
      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByTestId('grandchild')).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('should accept additional className', () => {
      render(
        <CenteredContainer className="custom-class">
          <div>Test Content</div>
        </CenteredContainer>
      );

      const container = screen.getByTestId('centered-container');
      expect(container).toHaveClass('custom-class');
    });

    it('should preserve core classes when custom className is added', () => {
      render(
        <CenteredContainer className="bg-surface" maxWidth="sm">
          <div>Test Content</div>
        </CenteredContainer>
      );

      const container = screen.getByTestId('centered-container');
      expect(container).toHaveClass('bg-surface');
      expect(container).toHaveClass('max-w-[75rem]');
      expect(container).toHaveClass('mx-auto');
      expect(container).toHaveClass('p-[24px]');
    });

    it('should handle multiple custom classes', () => {
      render(
        <CenteredContainer className="bg-surface border border-subtle">
          <div>Test Content</div>
        </CenteredContainer>
      );

      const container = screen.getByTestId('centered-container');
      expect(container).toHaveClass('bg-surface');
      expect(container).toHaveClass('border');
      expect(container).toHaveClass('border-subtle');
    });
  });

  describe('HTML attributes', () => {
    it('should pass through additional HTML attributes', () => {
      render(
        <CenteredContainer
          data-testid="centered-container"
          aria-label="Main content container"
          role="main"
        >
          <div>Test Content</div>
        </CenteredContainer>
      );

      const container = screen.getByTestId('centered-container');
      expect(container).toHaveAttribute('aria-label', 'Main content container');
      expect(container).toHaveAttribute('role', 'main');
    });

    it('should support id attribute', () => {
      render(
        <CenteredContainer id="main-container">
          <div>Test Content</div>
        </CenteredContainer>
      );

      const container = screen.getByTestId('centered-container');
      expect(container).toHaveAttribute('id', 'main-container');
    });
  });

  describe('Combined properties', () => {
    it('should apply all properties together correctly', () => {
      render(
        <CenteredContainer
          maxWidth="sm"
          padding={32}
          className="bg-surface"
          aria-label="Dashboard container"
        >
          <div data-testid="content">Dashboard Content</div>
        </CenteredContainer>
      );

      const container = screen.getByTestId('centered-container');
      
      // Max-width
      expect(container).toHaveClass('max-w-[75rem]');
      
      // Centering
      expect(container).toHaveClass('mx-auto');
      
      // Padding
      expect(container).toHaveClass('p-[32px]');
      
      // Custom class
      expect(container).toHaveClass('bg-surface');
      
      // Attributes
      expect(container).toHaveAttribute('aria-label', 'Dashboard container');
      
      // Children
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should work with different combinations of props', () => {
      const combinations = [
        { maxWidth: 'sm' as const, padding: 16 },
        { maxWidth: 'lg' as const, padding: 24 },
        { maxWidth: 'sm' as const, padding: 32 },
        { maxWidth: 'lg' as const, padding: 40 },
      ];

      combinations.forEach(({ maxWidth, padding }) => {
        const { container } = render(
          <CenteredContainer maxWidth={maxWidth} padding={padding}>
            <div>Test Content</div>
          </CenteredContainer>
        );

        const element = container.querySelector('[data-testid="centered-container"]');
        const classes = element?.className || '';
        
        const expectedMaxWidth = maxWidth === 'sm' ? 'max-w-[75rem]' : 'max-w-[80rem]';
        expect(classes).toContain(expectedMaxWidth);
        expect(classes).toContain('mx-auto');
        expect(classes).toContain(`p-[${padding}px]`);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty children', () => {
      render(
        <CenteredContainer>
          {null}
        </CenteredContainer>
      );

      const container = screen.getByTestId('centered-container');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('mx-auto');
    });

    it('should handle undefined children', () => {
      render(
        <CenteredContainer>
          {undefined}
        </CenteredContainer>
      );

      const container = screen.getByTestId('centered-container');
      expect(container).toBeInTheDocument();
    });

    it('should handle string children', () => {
      render(
        <CenteredContainer>
          Plain text content
        </CenteredContainer>
      );

      const container = screen.getByTestId('centered-container');
      expect(container).toBeInTheDocument();
      expect(container).toHaveTextContent('Plain text content');
    });

    it('should handle fragment children', () => {
      render(
        <CenteredContainer>
          <>
            <div data-testid="fragment-child-1">Child 1</div>
            <div data-testid="fragment-child-2">Child 2</div>
          </>
        </CenteredContainer>
      );

      expect(screen.getByTestId('fragment-child-1')).toBeInTheDocument();
      expect(screen.getByTestId('fragment-child-2')).toBeInTheDocument();
    });
  });
});
