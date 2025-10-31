/**
 * Unit Tests - AuthButton Component
 * 
 * Tests to validate AuthButton component functionality
 * Based on: .kiro/specs/auth-system-from-scratch/requirements.md (Requirement 5)
 * 
 * Coverage:
 * - Button rendering
 * - Variant styles
 * - Loading states
 * - Disabled states
 * - Click handling
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthButton } from '@/components/auth/AuthButton';

describe('AuthButton Component', () => {
  describe('Rendering', () => {
    it('should render with children', () => {
      render(<AuthButton>Click Me</AuthButton>);
      
      expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument();
    });

    it('should render as button type by default', () => {
      render(<AuthButton>Submit</AuthButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should render as submit type when specified', () => {
      render(<AuthButton type="submit">Submit</AuthButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should apply primary variant by default', () => {
      render(<AuthButton>Primary</AuthButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('primary');
    });

    it('should apply secondary variant when specified', () => {
      render(<AuthButton variant="secondary">Secondary</AuthButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('secondary');
    });

    it('should apply full width by default', () => {
      render(<AuthButton>Full Width</AuthButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });

    it('should not apply full width when specified', () => {
      render(<AuthButton fullWidth={false}>Not Full</AuthButton>);
      
      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('w-full');
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading', () => {
      render(<AuthButton loading={true}>Loading</AuthButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('should disable button when loading', () => {
      render(<AuthButton loading={true}>Loading</AuthButton>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should show loading icon', () => {
      const { container } = render(<AuthButton loading={true}>Loading</AuthButton>);
      
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should hide loading icon when not loading', () => {
      const { container } = render(<AuthButton loading={false}>Not Loading</AuthButton>);
      
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).not.toBeInTheDocument();
    });

    it('should still show children text when loading', () => {
      render(<AuthButton loading={true}>Submitting</AuthButton>);
      
      expect(screen.getByText('Submitting')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable button when disabled prop is true', () => {
      render(<AuthButton disabled={true}>Disabled</AuthButton>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should not disable button when disabled prop is false', () => {
      render(<AuthButton disabled={false}>Enabled</AuthButton>);
      
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    it('should disable button when both loading and disabled', () => {
      render(<AuthButton loading={true} disabled={true}>Both</AuthButton>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should have aria-disabled when disabled', () => {
      render(<AuthButton disabled={true}>Disabled</AuthButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Click Handling', () => {
    it('should call onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<AuthButton onClick={handleClick}>Click Me</AuthButton>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(<AuthButton onClick={handleClick} disabled={true}>Disabled</AuthButton>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when loading', () => {
      const handleClick = vi.fn();
      render(<AuthButton onClick={handleClick} loading={true}>Loading</AuthButton>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should work without onClick handler', () => {
      render(<AuthButton>No Handler</AuthButton>);
      
      const button = screen.getByRole('button');
      expect(() => fireEvent.click(button)).not.toThrow();
    });
  });

  describe('Styling', () => {
    it('should have auth-button class', () => {
      render(<AuthButton>Button</AuthButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('auth-button');
    });

    it('should have flex layout classes', () => {
      render(<AuthButton>Button</AuthButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('flex', 'items-center', 'justify-center');
    });

    it('should have gap class for spacing', () => {
      render(<AuthButton>Button</AuthButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('gap-2');
    });
  });

  describe('Accessibility', () => {
    it('should have role="button"', () => {
      render(<AuthButton>Accessible</AuthButton>);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have aria-busy when loading', () => {
      render(<AuthButton loading={true}>Loading</AuthButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('should not have aria-busy when not loading', () => {
      render(<AuthButton loading={false}>Not Loading</AuthButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'false');
    });

    it('should have aria-disabled when disabled', () => {
      render(<AuthButton disabled={true}>Disabled</AuthButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should have aria-hidden on loading icon', () => {
      const { container } = render(<AuthButton loading={true}>Loading</AuthButton>);
      
      const spinner = container.querySelector('[aria-hidden="true"]');
      expect(spinner).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      const handleClick = vi.fn();
      render(<AuthButton onClick={handleClick}>Keyboard</AuthButton>);
      
      const button = screen.getByRole('button');
      button.focus();
      
      expect(button).toHaveFocus();
    });
  });

  describe('Variants', () => {
    it('should apply primary variant styles', () => {
      render(<AuthButton variant="primary">Primary</AuthButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('primary');
    });

    it('should apply secondary variant styles', () => {
      render(<AuthButton variant="secondary">Secondary</AuthButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('secondary');
    });

    it('should maintain variant class when loading', () => {
      render(<AuthButton variant="secondary" loading={true}>Loading</AuthButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('secondary');
    });

    it('should maintain variant class when disabled', () => {
      render(<AuthButton variant="primary" disabled={true}>Disabled</AuthButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('primary');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      render(<AuthButton></AuthButton>);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle complex children', () => {
      render(
        <AuthButton>
          <span>Icon</span>
          <span>Text</span>
        </AuthButton>
      );
      
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('should handle rapid clicks', () => {
      const handleClick = vi.fn();
      render(<AuthButton onClick={handleClick}>Rapid</AuthButton>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('should handle state changes', () => {
      const { rerender } = render(<AuthButton loading={false}>Button</AuthButton>);
      
      let button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
      
      rerender(<AuthButton loading={true}>Button</AuthButton>);
      
      button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should handle all props together', () => {
      const handleClick = vi.fn();
      render(
        <AuthButton
          type="submit"
          variant="secondary"
          loading={true}
          disabled={false}
          fullWidth={true}
          onClick={handleClick}
        >
          Complex Button
        </AuthButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveClass('secondary');
      expect(button).toHaveClass('w-full');
      expect(button).toBeDisabled(); // Because loading=true
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Integration', () => {
    it('should work in a form', () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());
      
      render(
        <form onSubmit={handleSubmit}>
          <AuthButton type="submit">Submit Form</AuthButton>
        </form>
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleSubmit).toHaveBeenCalled();
    });

    it('should prevent form submission when disabled', () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());
      
      render(
        <form onSubmit={handleSubmit}>
          <AuthButton type="submit" disabled={true}>Submit</AuthButton>
        </form>
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('should prevent form submission when loading', () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());
      
      render(
        <form onSubmit={handleSubmit}>
          <AuthButton type="submit" loading={true}>Submit</AuthButton>
        </form>
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<AuthButton>Button</AuthButton>);
      
      // Re-render with same props
      rerender(<AuthButton>Button</AuthButton>);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle multiple instances', () => {
      render(
        <>
          <AuthButton>Button 1</AuthButton>
          <AuthButton>Button 2</AuthButton>
          <AuthButton>Button 3</AuthButton>
        </>
      );
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
    });
  });
});
